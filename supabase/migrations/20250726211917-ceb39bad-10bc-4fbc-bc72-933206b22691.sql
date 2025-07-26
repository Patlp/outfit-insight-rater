-- Create style_profiles table for storing AI-powered style analysis
CREATE TABLE public.style_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Body type analysis
  body_type TEXT,
  body_type_confidence NUMERIC DEFAULT 0.8,
  body_type_manual_override BOOLEAN DEFAULT FALSE,
  
  -- Color analysis traits
  seasonal_type TEXT,
  skin_tone TEXT,
  undertone TEXT,
  hair_color TEXT,
  eye_color TEXT,
  
  -- Color analysis scales (0-100)
  undertone_value INTEGER DEFAULT 50,
  contrast_value INTEGER DEFAULT 50,
  depth_value INTEGER DEFAULT 50,
  
  -- Manual override flags
  color_analysis_manual_override BOOLEAN DEFAULT FALSE,
  
  -- Full AI analysis data (JSON)
  full_style_analysis JSONB,
  
  -- Source information
  source_image_url TEXT,
  analysis_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.style_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own style profile" 
ON public.style_profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own style profile" 
ON public.style_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own style profile" 
ON public.style_profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own style profile" 
ON public.style_profiles 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_style_profiles_updated_at
BEFORE UPDATE ON public.style_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_style_profiles_user_id ON public.style_profiles(user_id);
CREATE INDEX idx_style_profiles_analysis_date ON public.style_profiles(analysis_date DESC);