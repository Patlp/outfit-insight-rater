
-- Check current constraint on gender column and update it to allow 'unisex'
ALTER TABLE wardrobe_items DROP CONSTRAINT IF EXISTS wardrobe_items_gender_check;

-- Add a new constraint that allows the gender values we need including 'unisex'
ALTER TABLE wardrobe_items ADD CONSTRAINT wardrobe_items_gender_check 
CHECK (gender IN ('men', 'women', 'unisex', 'male', 'female', 'neutral'));
