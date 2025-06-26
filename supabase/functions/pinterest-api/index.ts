
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PinterestBoard {
  id: string;
  name: string;
  description?: string;
  pin_count: number;
  follower_count: number;
  image_cover_url?: string;
  privacy: string;
  type: string;
}

interface PinterestPin {
  id: string;
  title?: string;
  description?: string;
  alt_text?: string;
  board_id: string;
  board_section_id?: string;
  created_at: string;
  link?: string;
  media: {
    images?: {
      '150x150'?: { url: string };
      '400x300'?: { url: string };
      '600x'?: { url: string };
      '1200x'?: { url: string };
    };
  };
  pin_metrics?: {
    all_time?: {
      save: number;
      pin_click: number;
      impression: number;
      outbound_click: number;
    };
  };
  dominant_color?: string;
  creative_type?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { action, connectionId, boardId, filters } = await req.json();

    // Get the Pinterest connection
    const { data: connection, error: connectionError } = await supabaseClient
      .from('pinterest_connections')
      .select('*')
      .eq('id', connectionId)
      .eq('is_active', true)
      .single();

    if (connectionError || !connection) {
      throw new Error('Pinterest connection not found or inactive');
    }

    const accessToken = connection.access_token;

    if (action === 'fetch_boards') {
      console.log('📋 Fetching Pinterest boards...');
      
      const boardsResponse = await fetch('https://api.pinterest.com/v5/boards?page_size=100', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!boardsResponse.ok) {
        throw new Error(`Failed to fetch boards: ${boardsResponse.status}`);
      }

      const boardsData = await boardsResponse.json();
      const boards: PinterestBoard[] = boardsData.items || [];
      
      console.log(`✅ Fetched ${boards.length} Pinterest boards`);

      // Save boards to database
      const boardPromises = boards.map(async (board) => {
        const { error } = await supabaseClient
          .from('pinterest_boards')
          .upsert({
            connection_id: connectionId,
            pinterest_board_id: board.id,
            name: board.name,
            description: board.description,
            pin_count: board.pin_count,
            follower_count: board.follower_count,
            image_url: board.image_cover_url,
            is_secret: board.privacy === 'SECRET',
            category: board.type,
            is_synced: false
          }, {
            onConflict: 'connection_id,pinterest_board_id'
          });

        if (error) {
          console.error('❌ Failed to save board:', board.name, error);
        }
      });

      await Promise.all(boardPromises);
      console.log('✅ Boards saved to database');

      return new Response(JSON.stringify({
        success: true,
        boards: boards,
        count: boards.length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'fetch_pins') {
      console.log(`📌 Fetching pins for board: ${boardId}`);
      
      let allPins: PinterestPin[] = [];
      let bookmark = null;
      let hasMore = true;

      // Fetch all pins from the board (Pinterest API is paginated)
      while (hasMore && allPins.length < 1000) { // Limit to 1000 pins per board
        const url = new URL(`https://api.pinterest.com/v5/boards/${boardId}/pins`);
        url.searchParams.set('page_size', '100');
        if (bookmark) {
          url.searchParams.set('bookmark', bookmark);
        }

        const pinsResponse = await fetch(url.toString(), {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (!pinsResponse.ok) {
          throw new Error(`Failed to fetch pins: ${pinsResponse.status}`);
        }

        const pinsData = await pinsResponse.json();
        const pins: PinterestPin[] = pinsData.items || [];
        
        allPins = allPins.concat(pins);
        bookmark = pinsData.bookmark;
        hasMore = !!bookmark && pins.length > 0;
        
        console.log(`📌 Fetched ${pins.length} pins (total: ${allPins.length})`);
      }

      // Filter fashion-related pins if requested
      let fashionPins = allPins;
      if (filters?.fashionOnly) {
        fashionPins = allPins.filter(pin => {
          const text = `${pin.title || ''} ${pin.description || ''} ${pin.alt_text || ''}`.toLowerCase();
          const fashionKeywords = [
            'fashion', 'style', 'outfit', 'clothing', 'dress', 'shirt', 'pants', 'shoes',
            'accessories', 'jewelry', 'bag', 'handbag', 'jacket', 'coat', 'sweater',
            'jeans', 'skirt', 'blouse', 'top', 'bottom', 'wear', 'attire', 'garment',
            'wardrobe', 'closet', 'ootd', 'lookbook', 'trend', 'chic', 'elegant'
          ];
          return fashionKeywords.some(keyword => text.includes(keyword));
        });
        console.log(`🎯 Filtered to ${fashionPins.length} fashion-related pins`);
      }

      // Get the board info for database storage
      const { data: boardData } = await supabaseClient
        .from('pinterest_boards')
        .select('id')
        .eq('pinterest_board_id', boardId)
        .eq('connection_id', connectionId)
        .single();

      if (boardData) {
        // Save pins to database
        const pinPromises = fashionPins.map(async (pin) => {
          const imageUrl = pin.media?.images?.[Object.keys(pin.media.images)[0] as keyof typeof pin.media.images]?.url;
          
          const { error } = await supabaseClient
            .from('pinterest_pins')
            .upsert({
              board_id: boardData.id,
              pinterest_pin_id: pin.id,
              title: pin.title,
              description: pin.description,
              image_url: imageUrl || '',
              alt_text: pin.alt_text,
              link_url: pin.link,
              dominant_color: pin.dominant_color,
              pinterest_created_at: pin.created_at,
              save_count: pin.pin_metrics?.all_time?.save || 0,
              is_imported: false,
              tags: [],
              extracted_colors: pin.dominant_color ? [pin.dominant_color] : [],
              style_tags: []
            }, {
              onConflict: 'board_id,pinterest_pin_id'
            });

          if (error) {
            console.error('❌ Failed to save pin:', pin.title || pin.id, error);
          }
        });

        await Promise.all(pinPromises);
        console.log('✅ Pins saved to database');
      }

      return new Response(JSON.stringify({
        success: true,
        pins: fashionPins,
        count: fashionPins.length,
        totalPins: allPins.length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'import_pins') {
      console.log('📥 Importing pins as outfit inspirations...');
      
      const { pinIds, userId } = await req.json();
      
      // Get pins from database
      const { data: pins, error: pinsError } = await supabaseClient
        .from('pinterest_pins')
        .select(`
          *,
          pinterest_boards!inner(
            *,
            pinterest_connections!inner(user_id)
          )
        `)
        .in('pinterest_pin_id', pinIds)
        .eq('pinterest_boards.pinterest_connections.user_id', userId);

      if (pinsError || !pins) {
        throw new Error('Failed to fetch pins for import');
      }

      // Import pins as outfit inspirations
      const importPromises = pins.map(async (pin) => {
        const { error } = await supabaseClient
          .from('outfit_inspirations')
          .insert({
            user_id: userId,
            source_type: 'pinterest',
            source_url: `https://pinterest.com/pin/${pin.pinterest_pin_id}`,
            image_url: pin.image_url,
            title: pin.title || 'Pinterest Inspiration',
            description: pin.description,
            pinterest_pin_id: pin.id,
            pinterest_board_name: pin.pinterest_boards.name,
            pinterest_board_id: pin.pinterest_boards.pinterest_board_id,
            auto_imported: true,
            processing_status: 'completed',
            metadata: {
              pinterest_data: {
                pin_id: pin.pinterest_pin_id,
                board_name: pin.pinterest_boards.name,
                save_count: pin.save_count,
                dominant_color: pin.dominant_color,
                imported_at: new Date().toISOString()
              }
            }
          });

        if (!error) {
          // Mark pin as imported
          await supabaseClient
            .from('pinterest_pins')
            .update({ is_imported: true })
            .eq('id', pin.id);
        }

        return error;
      });

      const results = await Promise.all(importPromises);
      const successCount = results.filter(error => !error).length;
      const failureCount = results.length - successCount;

      console.log(`✅ Import completed: ${successCount} success, ${failureCount} failures`);

      return new Response(JSON.stringify({
        success: true,
        imported: successCount,
        failed: failureCount,
        total: pins.length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Pinterest API error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Pinterest API request failed' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
