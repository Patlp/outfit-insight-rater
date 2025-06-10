
-- Check the current constraint on feedback_mode and update it to allow the values we need
ALTER TABLE wardrobe_items DROP CONSTRAINT IF EXISTS wardrobe_items_feedback_mode_check;

-- Add a new constraint that allows the feedback modes we're using
ALTER TABLE wardrobe_items ADD CONSTRAINT wardrobe_items_feedback_mode_check 
CHECK (feedback_mode IN ('normal', 'roast', 'constructive', 'brief', 'detailed'));
