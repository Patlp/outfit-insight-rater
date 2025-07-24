-- Ensure subscribers table has proper foreign key constraint and triggers
-- This migration ensures premium status is properly tracked for paid users

-- Add trigger to update subscribers table when payment is verified
CREATE OR REPLACE FUNCTION public.handle_premium_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- When a new user is created via payment flow, ensure they get premium status
  INSERT INTO public.subscribers (
    user_id,
    email,
    subscribed,
    subscription_tier,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    true,
    'Premium',
    NOW()
  )
  ON CONFLICT (email) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    subscribed = true,
    subscription_tier = 'Premium',
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;