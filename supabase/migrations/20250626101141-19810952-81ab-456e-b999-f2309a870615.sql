
-- Enable Pinterest as an OAuth provider by updating auth configuration
-- This will be handled through Supabase dashboard, but we need to ensure our tables support it

-- Update user profiles to handle Pinterest login data
ALTER TABLE IF EXISTS public.profiles 
ADD COLUMN IF NOT EXISTS pinterest_username TEXT,
ADD COLUMN IF NOT EXISTS pinterest_profile_image TEXT;

-- Create a function to handle Pinterest OAuth user creation
CREATE OR REPLACE FUNCTION public.handle_pinterest_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Insert or update profile for Pinterest users
  INSERT INTO public.profiles (
    id, 
    pinterest_username, 
    pinterest_profile_image
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'user_name',
    NEW.raw_user_meta_data ->> 'image_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    pinterest_username = EXCLUDED.pinterest_username,
    pinterest_profile_image = EXCLUDED.pinterest_profile_image,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

-- Create trigger for Pinterest OAuth users
DROP TRIGGER IF EXISTS on_pinterest_auth_user_created ON auth.users;
CREATE TRIGGER on_pinterest_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  WHEN (NEW.raw_user_meta_data ->> 'provider' = 'pinterest')
  EXECUTE FUNCTION public.handle_pinterest_user();
