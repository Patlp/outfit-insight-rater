
-- Add what_not_to_wear column to body_type_guide table
ALTER TABLE body_type_guide 
ADD COLUMN what_not_to_wear jsonb DEFAULT '[]'::jsonb;

-- Add comment to document the new column
COMMENT ON COLUMN body_type_guide.what_not_to_wear IS 'JSON array containing style guidance on what to avoid for this body type, with reasoning';
