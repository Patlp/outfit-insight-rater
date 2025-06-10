
-- Create storage bucket for wardrobe items
INSERT INTO storage.buckets (id, name, public) 
VALUES ('wardrobe-items', 'wardrobe-items', true);

-- Create RLS policies for the wardrobe-items bucket
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'wardrobe-items');

CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'wardrobe-items' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their uploads" ON storage.objects FOR UPDATE 
USING (bucket_id = 'wardrobe-items' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their uploads" ON storage.objects FOR DELETE 
USING (bucket_id = 'wardrobe-items' AND auth.role() = 'authenticated');
