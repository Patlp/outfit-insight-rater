
-- Add a new column to store cropped image URLs for each wardrobe item
ALTER TABLE wardrobe_items 
ADD COLUMN cropped_images jsonb DEFAULT '[]'::jsonb;

-- Add an index for better performance when querying cropped images
CREATE INDEX idx_wardrobe_items_cropped_images ON wardrobe_items USING gin (cropped_images);

-- Update the comment to document the new column
COMMENT ON COLUMN wardrobe_items.cropped_images IS 'Array of objects containing item_name, cropped_image_url, and bounding_box coordinates for each detected clothing item';
