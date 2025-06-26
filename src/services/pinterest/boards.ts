
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PinterestBoard {
  id: string;
  connection_id: string;
  pinterest_board_id: string;
  name: string;
  description?: string;
  pin_count: number;
  follower_count: number;
  image_url?: string;
  is_secret: boolean;
  category?: string;
  tags?: string[];
  is_synced: boolean;
  last_synced_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PinterestPin {
  id: string;
  board_id: string;
  pinterest_pin_id: string;
  title?: string;
  description?: string;
  image_url: string;
  alt_text?: string;
  link_url?: string;
  dominant_color?: string;
  save_count: number;
  is_imported: boolean;
  tags?: string[];
  extracted_colors?: string[];
  style_tags?: string[];
  created_at: string;
}

export const fetchPinterestBoards = async (connectionId: string) => {
  try {
    console.log('📋 Fetching Pinterest boards...');
    
    const { data, error } = await supabase.functions.invoke('pinterest-api', {
      body: {
        action: 'fetch_boards',
        connectionId: connectionId
      }
    });

    if (error) {
      throw error;
    }

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch boards');
    }

    console.log(`✅ Fetched ${data.count} Pinterest boards`);
    return data.boards;

  } catch (error) {
    console.error('❌ Error fetching Pinterest boards:', error);
    toast.error('Failed to fetch Pinterest boards');
    throw error;
  }
};

export const fetchPinterestPins = async (
  connectionId: string, 
  boardId: string, 
  options: { fashionOnly?: boolean } = {}
) => {
  try {
    console.log(`📌 Fetching pins for board: ${boardId}`);
    
    const { data, error } = await supabase.functions.invoke('pinterest-api', {
      body: {
        action: 'fetch_pins',
        connectionId: connectionId,
        boardId: boardId,
        filters: {
          fashionOnly: options.fashionOnly || false
        }
      }
    });

    if (error) {
      throw error;
    }

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch pins');
    }

    console.log(`✅ Fetched ${data.count} pins`);
    return {
      pins: data.pins,
      count: data.count,
      totalPins: data.totalPins
    };

  } catch (error) {
    console.error('❌ Error fetching Pinterest pins:', error);
    toast.error('Failed to fetch Pinterest pins');
    throw error;
  }
};

export const importPinterestPins = async (connectionId: string, pinIds: string[]) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    console.log(`📥 Importing ${pinIds.length} pins as outfit inspirations...`);
    
    const { data, error } = await supabase.functions.invoke('pinterest-api', {
      body: {
        action: 'import_pins',
        connectionId: connectionId,
        pinIds: pinIds,
        userId: user.id
      }
    });

    if (error) {
      throw error;
    }

    if (!data.success) {
      throw new Error(data.error || 'Failed to import pins');
    }

    console.log(`✅ Import completed: ${data.imported} pins imported`);
    toast.success(`Successfully imported ${data.imported} outfit inspirations!`);
    
    return {
      imported: data.imported,
      failed: data.failed,
      total: data.total
    };

  } catch (error) {
    console.error('❌ Error importing Pinterest pins:', error);
    toast.error('Failed to import Pinterest pins');
    throw error;
  }
};

export const getUserPinterestBoards = async (): Promise<PinterestBoard[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('pinterest_boards')
      .select(`
        *,
        pinterest_connections!inner(user_id)
      `)
      .eq('pinterest_connections.user_id', user.id)
      .eq('pinterest_connections.is_active', true)
      .order('pin_count', { ascending: false });

    if (error) {
      console.error('❌ Error fetching user Pinterest boards:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('❌ Error in getUserPinterestBoards:', error);
    return [];
  }
};

export const getUserPinterestPins = async (boardId?: string): Promise<PinterestPin[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    let query = supabase
      .from('pinterest_pins')
      .select(`
        *,
        pinterest_boards!inner(
          *,
          pinterest_connections!inner(user_id)
        )
      `)
      .eq('pinterest_boards.pinterest_connections.user_id', user.id)
      .eq('pinterest_boards.pinterest_connections.is_active', true);

    if (boardId) {
      query = query.eq('pinterest_boards.pinterest_board_id', boardId);
    }

    const { data, error } = await query
      .order('save_count', { ascending: false })
      .limit(100);

    if (error) {
      console.error('❌ Error fetching user Pinterest pins:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('❌ Error in getUserPinterestPins:', error);
    return [];
  }
};
