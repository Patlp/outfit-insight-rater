
-- Create table for Pinterest connections
CREATE TABLE public.pinterest_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pinterest_user_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  username TEXT NOT NULL,
  display_name TEXT,
  profile_image_url TEXT,
  board_count INTEGER DEFAULT 0,
  pin_count INTEGER DEFAULT 0,
  follower_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  sync_enabled BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_frequency TEXT DEFAULT 'daily',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, pinterest_user_id)
);

-- Create table for Pinterest boards
CREATE TABLE public.pinterest_boards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  connection_id UUID NOT NULL REFERENCES public.pinterest_connections(id) ON DELETE CASCADE,
  pinterest_board_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  pin_count INTEGER DEFAULT 0,
  follower_count INTEGER DEFAULT 0,
  image_url TEXT,
  is_secret BOOLEAN DEFAULT false,
  category TEXT,
  tags TEXT[],
  is_synced BOOLEAN DEFAULT false,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(connection_id, pinterest_board_id)
);

-- Create table for Pinterest pins
CREATE TABLE public.pinterest_pins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id UUID NOT NULL REFERENCES public.pinterest_boards(id) ON DELETE CASCADE,
  pinterest_pin_id TEXT NOT NULL,
  title TEXT,
  description TEXT,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  link_url TEXT,
  dominant_color TEXT,
  created_by TEXT,
  save_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  reaction_count INTEGER DEFAULT 0,
  pinterest_created_at TIMESTAMP WITH TIME ZONE,
  is_imported BOOLEAN DEFAULT false,
  outfit_inspiration_id UUID REFERENCES public.outfit_inspirations(id),
  tags TEXT[],
  extracted_colors TEXT[],
  style_tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(board_id, pinterest_pin_id)
);

-- Create table for sync history
CREATE TABLE public.pinterest_sync_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  connection_id UUID NOT NULL REFERENCES public.pinterest_connections(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL, -- 'full', 'incremental', 'board', 'pin'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  boards_synced INTEGER DEFAULT 0,
  pins_synced INTEGER DEFAULT 0,
  pins_imported INTEGER DEFAULT 0,
  error_message TEXT,
  sync_duration_ms INTEGER,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS on all tables
ALTER TABLE public.pinterest_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pinterest_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pinterest_pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pinterest_sync_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for pinterest_connections
CREATE POLICY "Users can view their own Pinterest connections" 
  ON public.pinterest_connections 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own Pinterest connections" 
  ON public.pinterest_connections 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Pinterest connections" 
  ON public.pinterest_connections 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Pinterest connections" 
  ON public.pinterest_connections 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create RLS policies for pinterest_boards
CREATE POLICY "Users can view boards from their connections" 
  ON public.pinterest_boards 
  FOR SELECT 
  USING (connection_id IN (
    SELECT id FROM public.pinterest_connections WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create boards for their connections" 
  ON public.pinterest_boards 
  FOR INSERT 
  WITH CHECK (connection_id IN (
    SELECT id FROM public.pinterest_connections WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update boards from their connections" 
  ON public.pinterest_boards 
  FOR UPDATE 
  USING (connection_id IN (
    SELECT id FROM public.pinterest_connections WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete boards from their connections" 
  ON public.pinterest_boards 
  FOR DELETE 
  USING (connection_id IN (
    SELECT id FROM public.pinterest_connections WHERE user_id = auth.uid()
  ));

-- Create RLS policies for pinterest_pins
CREATE POLICY "Users can view pins from their boards" 
  ON public.pinterest_pins 
  FOR SELECT 
  USING (board_id IN (
    SELECT pb.id FROM public.pinterest_boards pb
    JOIN public.pinterest_connections pc ON pb.connection_id = pc.id
    WHERE pc.user_id = auth.uid()
  ));

CREATE POLICY "Users can create pins for their boards" 
  ON public.pinterest_pins 
  FOR INSERT 
  WITH CHECK (board_id IN (
    SELECT pb.id FROM public.pinterest_boards pb
    JOIN public.pinterest_connections pc ON pb.connection_id = pc.id
    WHERE pc.user_id = auth.uid()
  ));

CREATE POLICY "Users can update pins from their boards" 
  ON public.pinterest_pins 
  FOR UPDATE 
  USING (board_id IN (
    SELECT pb.id FROM public.pinterest_boards pb
    JOIN public.pinterest_connections pc ON pb.connection_id = pc.id
    WHERE pc.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete pins from their boards" 
  ON public.pinterest_pins 
  FOR DELETE 
  USING (board_id IN (
    SELECT pb.id FROM public.pinterest_boards pb
    JOIN public.pinterest_connections pc ON pb.connection_id = pc.id
    WHERE pc.user_id = auth.uid()
  ));

-- Create RLS policies for pinterest_sync_history
CREATE POLICY "Users can view their own sync history" 
  ON public.pinterest_sync_history 
  FOR SELECT 
  USING (connection_id IN (
    SELECT id FROM public.pinterest_connections WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create sync history for their connections" 
  ON public.pinterest_sync_history 
  FOR INSERT 
  WITH CHECK (connection_id IN (
    SELECT id FROM public.pinterest_connections WHERE user_id = auth.uid()
  ));

-- Create indexes for better performance
CREATE INDEX idx_pinterest_connections_user_id ON public.pinterest_connections(user_id);
CREATE INDEX idx_pinterest_connections_active ON public.pinterest_connections(user_id, is_active);
CREATE INDEX idx_pinterest_boards_connection_id ON public.pinterest_boards(connection_id);
CREATE INDEX idx_pinterest_boards_synced ON public.pinterest_boards(connection_id, is_synced);
CREATE INDEX idx_pinterest_pins_board_id ON public.pinterest_pins(board_id);
CREATE INDEX idx_pinterest_pins_imported ON public.pinterest_pins(board_id, is_imported);
CREATE INDEX idx_pinterest_sync_history_connection_id ON public.pinterest_sync_history(connection_id);
CREATE INDEX idx_pinterest_sync_history_status ON public.pinterest_sync_history(connection_id, status);

-- Update outfit_inspirations table to add Pinterest-specific fields
ALTER TABLE public.outfit_inspirations 
ADD COLUMN IF NOT EXISTS pinterest_pin_id UUID REFERENCES public.pinterest_pins(id),
ADD COLUMN IF NOT EXISTS pinterest_board_name TEXT,
ADD COLUMN IF NOT EXISTS pinterest_board_id TEXT,
ADD COLUMN IF NOT EXISTS auto_imported BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS style_confidence_score NUMERIC,
ADD COLUMN IF NOT EXISTS color_palette JSONB DEFAULT '[]'::jsonb;
