
-- Add render_image_url column to wardrobe_items table
ALTER TABLE wardrobe_items 
ADD COLUMN render_image_url text;

-- Add index for better performance when querying render images
CREATE INDEX idx_wardrobe_items_render_image_url ON wardrobe_items (render_image_url);

-- Comment to document the new column
COMMENT ON COLUMN wardrobe_items.render_image_url IS 'URL of AI-generated image showing individual clothing items on neutral mannequin for wardrobe display';

-- Create storage bucket for AI-generated clothing renders
INSERT INTO storage.buckets (id, name, public)
VALUES ('clothing-renders', 'clothing-renders', true);

-- Create storage policies for the clothing-renders bucket
CREATE POLICY "Anyone can view clothing renders" ON storage.objects
FOR SELECT USING (bucket_id = 'clothing-renders');

CREATE POLICY "Authenticated users can upload clothing renders" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'clothing-renders' AND auth.role() = 'authenticated');
