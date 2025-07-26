-- Add unique constraint to prevent exact duplicates at database level
-- This constraint ensures that the same user cannot have identical outfit analyses

-- First, let's add a unique constraint on the combination of user_id, image_url hash, and analysis details
-- We'll use a hash of the image_url to handle large base64 strings efficiently

-- Add a column to store image hash for efficient duplicate detection
ALTER TABLE public.wardrobe_items 
ADD COLUMN IF NOT EXISTS image_hash TEXT;

-- Create a function to generate a consistent hash from image data
CREATE OR REPLACE FUNCTION generate_image_hash(image_data TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Generate a hash from the first 1000 characters and length for uniqueness
  RETURN md5(substring(image_data, 1, 1000) || length(image_data)::text);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create a trigger to automatically populate image_hash on insert/update
CREATE OR REPLACE FUNCTION set_image_hash()
RETURNS TRIGGER AS $$
BEGIN
  NEW.image_hash = generate_image_hash(NEW.image_url);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_set_image_hash ON public.wardrobe_items;
CREATE TRIGGER trigger_set_image_hash
  BEFORE INSERT OR UPDATE ON public.wardrobe_items
  FOR EACH ROW
  EXECUTE FUNCTION set_image_hash();

-- Update existing records to have image hashes
UPDATE public.wardrobe_items 
SET image_hash = generate_image_hash(image_url) 
WHERE image_hash IS NULL AND image_url IS NOT NULL;

-- Create a partial unique index to prevent exact duplicates for recent entries (within 1 hour)
-- This allows the same outfit to be re-analyzed after some time has passed
CREATE UNIQUE INDEX IF NOT EXISTS idx_wardrobe_items_recent_duplicates 
ON public.wardrobe_items (user_id, image_hash, rating_score, feedback_mode) 
WHERE created_at > (now() - INTERVAL '1 hour');

-- Add comments explaining the constraint
COMMENT ON INDEX idx_wardrobe_items_recent_duplicates IS 'Prevents duplicate outfit analyses for the same user within 1 hour based on image hash, score, and feedback mode';
COMMENT ON COLUMN wardrobe_items.image_hash IS 'MD5 hash of image data for efficient duplicate detection';
COMMENT ON FUNCTION generate_image_hash IS 'Generates consistent hash from image data for duplicate detection';