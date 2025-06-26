
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PinterestAuthConfig {
  clientId: string;
  redirectUri: string;
  scopes: string[];
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
  clientId: '1507458', // Pinterest App ID
  redirectUri: `${window.location.origin}/wardrobe?pinterest_callback=true`,
  scopes: ['boards:read', 'pins:read', 'user_accounts:read']
};

export const initiatePinterestAuth = async () => {
  try {
    console.log('🔗 Initiating Pinterest OAuth...');
    
    const state = generateState();
    const authUrl = buildPinterestAuthUrl(state);
    
    console.log('📌 Redirecting to Pinterest OAuth URL');
    
    // Store state for validation
    sessionStorage.setItem('pinterest_oauth_state', state);
    
    // Redirect to Pinterest OAuth
    window.location.href = authUrl;
    
  } catch (error) {
    console.error('❌ Pinterest auth error:', error);
    toast.error('Failed to connect to Pinterest');
  }
};

const buildPinterestAuthUrl = (state: string): string => {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: PINTEREST_CONFIG.clientId,
    redirect_uri: PINTEREST_CONFIG.redirectUri,
    scope: PINTEREST_CONFIG.scopes.join(','),
    state: state
  });
  
  return `https://www.pinterest.com/oauth/?${params.toString()}`;
};

const generateState = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

export const handlePinterestCallback = async (code: string, state: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Validate state
    const storedState = sessionStorage.getItem('pinterest_oauth_state');
    if (state !== storedState) {
      throw new Error('Invalid OAuth state');
    }

    console.log('🔄 Processing Pinterest OAuth callback...');

    // Exchange code for access token via Edge Function
    const { data, error } = await supabase.functions.invoke('pinterest-oauth', {
      body: {
        action: 'exchange_code',
        code: code,
        state: state,
        userId: user.id
      }
    });

    if (error) {
      throw error;
    }

    if (!data.success) {
      throw new Error(data.error || 'OAuth exchange failed');
    }

    console.log('✅ Pinterest connection established successfully');
    toast.success('Pinterest account connected successfully!');
    
    // Clean up state
    sessionStorage.removeItem('pinterest_oauth_state');
    
    return data.connection;

  } catch (error) {
    console.error('❌ Pinterest callback error:', error);
    toast.error('Failed to connect Pinterest account');
    sessionStorage.removeItem('pinterest_oauth_state');
    throw error;
  }
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

// Check for Pinterest OAuth callback on page load
export const checkPinterestCallback = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const state = urlParams.get('state');
  const error = urlParams.get('error');
  
  if (error) {
    console.error('❌ Pinterest OAuth error:', error);
    toast.error('Pinterest connection was cancelled or failed');
    return;
  }
  
  if (code && state && urlParams.get('pinterest_callback') === 'true') {
    console.log('📌 Pinterest OAuth callback detected');
    handlePinterestCallback(code, state);
    
    // Clean up URL
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('code');
    newUrl.searchParams.delete('state');
    newUrl.searchParams.delete('pinterest_callback');
    window.history.replaceState({}, '', newUrl.toString());
  }
};
