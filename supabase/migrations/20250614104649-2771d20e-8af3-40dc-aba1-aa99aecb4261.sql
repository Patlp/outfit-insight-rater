
-- Create table for outfit inspirations
CREATE TABLE public.outfit_inspirations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('pinterest', 'upload')),
  source_url TEXT,
  image_url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  extracted_elements JSONB DEFAULT '[]'::jsonb,
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security
ALTER TABLE public.outfit_inspirations ENABLE ROW LEVEL SECURITY;

-- Create policies for outfit inspirations
CREATE POLICY "Users can view their own outfit inspirations" 
  ON public.outfit_inspirations 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own outfit inspirations" 
  ON public.outfit_inspirations 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own outfit inspirations" 
  ON public.outfit_inspirations 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own outfit inspirations" 
  ON public.outfit_inspirations 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_outfit_inspirations_user_id ON public.outfit_inspirations(user_id);
CREATE INDEX idx_outfit_inspirations_source_type ON public.outfit_inspirations(source_type);
