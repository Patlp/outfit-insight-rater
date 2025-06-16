
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PinterestAuthConfig {
  clientId: string;
  redirectUri: string;
  scope: string[];
}

export interface PinterestConnection {
  id: string;
  user_id: string;
  pinterest_user_id: string;
  access_token: string;
  refresh_token?: string;
  token_expires_at?: string;
  username: string;
  display_name?: string;
  profile_image_url?: string;
  board_count: number;
  pin_count: number;
  follower_count: number;
  is_active: boolean;
  sync_enabled: boolean;
  last_sync_at?: string;
  sync_frequency: string;
  created_at: string;
  updated_at: string;
}

// Pinterest OAuth configuration
const PINTEREST_CONFIG: PinterestAuthConfig = {
  clientId: 'demo_client_id', // This will be replaced with real credentials via Supabase Edge Functions
  redirectUri: `${window.location.origin}/wardrobe?pinterest_callback=true`,
  scope: ['boards:read', 'pins:read', 'user_accounts:read']
};

export const initiatePinterestAuth = async () => {
  try {
    console.log('🔗 Initiating Pinterest OAuth...');
    
    // For demo purposes, we'll simulate the OAuth flow
    // In a real implementation, you would redirect to Pinterest's OAuth URL
    const authUrl = buildPinterestAuthUrl();
    
    console.log('Pinterest OAuth URL:', authUrl);
    toast.info('Pinterest OAuth would open in a new window');
    
    // Simulate successful OAuth callback for demo
    setTimeout(() => {
      handlePinterestCallback('demo_access_token', 'demo_user_123');
    }, 2000);
    
  } catch (error) {
    console.error('❌ Pinterest auth error:', error);
    toast.error('Failed to connect to Pinterest');
  }
};

const buildPinterestAuthUrl = (): string => {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: PINTEREST_CONFIG.clientId,
    redirect_uri: PINTEREST_CONFIG.redirectUri,
    scope: PINTEREST_CONFIG.scope.join(','),
    state: generateState()
  });
  
  return `https://www.pinterest.com/oauth/?${params.toString()}`;
};

const generateState = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

export const handlePinterestCallback = async (accessToken: string, pinterestUserId: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    console.log('🔄 Processing Pinterest callback...');

    // Get user profile from Pinterest API (simulated)
    const pinterestProfile = await fetchPinterestProfile(accessToken);
    
    // Save connection to database
    const { data: connection, error } = await supabase
      .from('pinterest_connections')
      .upsert({
        user_id: user.id,
        pinterest_user_id: pinterestUserId,
        access_token: accessToken,
        username: pinterestProfile.username,
        display_name: pinterestProfile.display_name,
        profile_image_url: pinterestProfile.profile_image_url,
        board_count: pinterestProfile.board_count,
        pin_count: pinterestProfile.pin_count,
        follower_count: pinterestProfile.follower_count,
        is_active: true,
        sync_enabled: true,
        sync_frequency: 'daily'
      }, {
        onConflict: 'user_id,pinterest_user_id'
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log('✅ Pinterest connection saved:', connection);
    toast.success('Pinterest account connected successfully!');
    
    return connection;

  } catch (error) {
    console.error('❌ Pinterest callback error:', error);
    toast.error('Failed to connect Pinterest account');
    throw error;
  }
};

const fetchPinterestProfile = async (accessToken: string) => {
  // In a real implementation, this would call the Pinterest API
  // For demo purposes, we'll return mock data
  return {
    username: 'demo_user',
    display_name: 'Demo Pinterest User',
    profile_image_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
    board_count: 15,
    pin_count: 234,
    follower_count: 1250
  };
};

export const getPinterestConnections = async (): Promise<PinterestConnection[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('pinterest_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching Pinterest connections:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('❌ Error in getPinterestConnections:', error);
    return [];
  }
};

export const disconnectPinterest = async (connectionId: string) => {
  try {
    const { error } = await supabase
      .from('pinterest_connections')
      .update({ is_active: false })
      .eq('id', connectionId);

    if (error) {
      throw error;
    }

    toast.success('Pinterest account disconnected');
  } catch (error) {
    console.error('❌ Error disconnecting Pinterest:', error);
    toast.error('Failed to disconnect Pinterest account');
  }
};
