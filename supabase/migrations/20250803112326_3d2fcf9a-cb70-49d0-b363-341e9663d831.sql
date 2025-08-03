-- Create style_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.style_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body_type TEXT,
  body_type_confidence DECIMAL,
  body_type_manual_override BOOLEAN DEFAULT false,
  seasonal_type TEXT,
  skin_tone TEXT,
  undertone TEXT,
  hair_color TEXT,
  eye_color TEXT,
  undertone_value DECIMAL,
  contrast_value DECIMAL,
  depth_value DECIMAL,
  color_analysis_manual_override BOOLEAN DEFAULT false,
  full_style_analysis JSONB,
  source_image_url TEXT,
  analysis_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.style_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
DROP POLICY IF EXISTS "Users can view their own style profiles" ON public.style_profiles;
CREATE POLICY "Users can view their own style profiles" 
ON public.style_profiles 
FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own style profiles" ON public.style_profiles;
CREATE POLICY "Users can create their own style profiles" 
ON public.style_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own style profiles" ON public.style_profiles;
CREATE POLICY "Users can update their own style profiles" 
ON public.style_profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own style profiles" ON public.style_profiles;
CREATE POLICY "Users can delete their own style profiles" 
ON public.style_profiles 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS update_style_profiles_updated_at ON public.style_profiles;
CREATE TRIGGER update_style_profiles_updated_at
BEFORE UPDATE ON public.style_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();