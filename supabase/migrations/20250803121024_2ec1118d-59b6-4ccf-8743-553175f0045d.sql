-- Clean up duplicate and fix RLS policies for style_profiles table
DROP POLICY IF EXISTS "Users can create their own style profiles" ON public.style_profiles;
DROP POLICY IF EXISTS "Users can delete their own style profile" ON public.style_profiles;
DROP POLICY IF EXISTS "Users can delete their own style profiles" ON public.style_profiles;
DROP POLICY IF EXISTS "Users can insert their own style profile" ON public.style_profiles;
DROP POLICY IF EXISTS "Users can update their own style profile" ON public.style_profiles;
DROP POLICY IF EXISTS "Users can update their own style profiles" ON public.style_profiles;
DROP POLICY IF EXISTS "Users can view their own style profile" ON public.style_profiles;
DROP POLICY IF EXISTS "Users can view their own style profiles" ON public.style_profiles;

-- Create proper RLS policies
CREATE POLICY "Users can view their own style profiles" 
ON public.style_profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own style profiles" 
ON public.style_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own style profiles" 
ON public.style_profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own style profiles" 
ON public.style_profiles 
FOR DELETE 
USING (auth.uid() = user_id);