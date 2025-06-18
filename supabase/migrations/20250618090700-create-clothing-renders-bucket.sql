
-- Create storage bucket for AI-generated clothing renders
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'clothing-renders', 
  'clothing-renders', 
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Create storage policies for the clothing-renders bucket
CREATE POLICY "Anyone can view clothing renders" ON storage.objects
FOR SELECT USING (bucket_id = 'clothing-renders');

CREATE POLICY "Authenticated users can upload clothing renders" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'clothing-renders' AND auth.role() = 'authenticated');

CREATE POLICY "Service role can manage clothing renders" ON storage.objects
FOR ALL USING (bucket_id = 'clothing-renders' AND auth.role() = 'service_role');
