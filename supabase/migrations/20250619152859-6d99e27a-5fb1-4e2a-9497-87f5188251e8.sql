
-- Add the missing original_image_url column to wardrobe_items table
ALTER TABLE wardrobe_items 
ADD COLUMN original_image_url TEXT;

-- Add a comment to document the purpose of this column
COMMENT ON COLUMN wardrobe_items.original_image_url IS 'Stores the original image URL for toggle functionality between AI-generated and original images';
