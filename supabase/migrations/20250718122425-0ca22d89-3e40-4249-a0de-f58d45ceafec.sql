-- Create table for body type guide data from "20 Types of Beauty"
CREATE TABLE public.body_type_guide (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type_name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL, -- "Gamine", "Romantic", "Natural", "Dramatic" 
  description TEXT NOT NULL,
  physical_characteristics TEXT[],
  styling_guidelines TEXT[],
  recommended_fits TEXT[],
  recommended_fabrics TEXT[],
  recommended_cuts TEXT[],
  visual_representation_url TEXT,
  height_range TEXT,
  body_shape_keywords TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.body_type_guide ENABLE ROW LEVEL SECURITY;

-- Create policies for body type guide (public read access)
CREATE POLICY "Allow public read access to body type guide" 
ON public.body_type_guide 
FOR SELECT 
USING (true);

-- Create index for faster lookups
CREATE INDEX idx_body_type_guide_category ON public.body_type_guide(category);
CREATE INDEX idx_body_type_guide_type_name ON public.body_type_guide(type_name);

-- Insert sample data from the guide images
INSERT INTO public.body_type_guide (type_name, category, description, physical_characteristics, styling_guidelines, recommended_fits, recommended_fabrics, recommended_cuts, height_range, body_shape_keywords) VALUES 
('Gamine Pg', 'Gamine', 'Delicately angular beauty designed for thinking-dominant pituitary for analytical brain style detail-oriented personality', 
 ARRAY['Little-girl figure (very narrow)', 'Small chest', 'Little girl breasts', 'Slight waist', 'Narrow hips', 'Slightly padded rear'],
 ARRAY['Weight gain (wide figure) all over even hands-feet chin upper tummy', 'Think animated with contrasting details, tailored color/cuffs, two grands, small angular prints, short skirt at knee, short jacket/long skirt'], 
 ARRAY['Fitted', 'Tailored', 'Structured'], 
 ARRAY['Crisp fabrics', 'Cotton'], 
 ARRAY['Short cuts', 'Angular details', 'Contrasting elements'],
 '5''3" or less', 
 ARRAY['narrow', 'angular', 'small', 'delicate']),

('Romantic G', 'Romantic', 'Delicately rounded beauty dominant gonads (ovaries) intuitive brain style designed for nurturing - mating/bonding relationships',
 ARRAY['Slightly bottom-heavy figure', 'Small chest', 'Small girl breasts', 'Very defined waist', 'Medium hips', 'Very padded rear'],
 ARRAY['Weight gain (bottom-heavy) thighs', 'Hips', 'Rear', 'Think soft with sweet details, ruffles, lace, ribbon'], 
 ARRAY['Soft', 'Flowing', 'Fitted at waist'], 
 ARRAY['Soft fabrics', 'Silk', 'Chiffon'], 
 ARRAY['Flowing cuts', 'Fitted waist', 'Romantic details'],
 '5''5"', 
 ARRAY['rounded', 'soft', 'curved', 'feminine']),

('Natural Ag', 'Natural', 'Strongly rounded beauty strongly adrenals logical brain style results-oriented personality',
 ARRAY['Medium top-heavy figure', 'Large chest', 'Large, rounded breasts', 'Slight waist', 'Medium hips', 'Flat rear'],
 ARRAY['Weight gain (top-heavy) breasts', 'Back', 'Lower tummy', 'Think simple, easy lines, unstructured jackets with contrasting shell or top'], 
 ARRAY['Relaxed', 'Unstructured', 'Natural'], 
 ARRAY['Natural fabrics', 'Cotton', 'Linen'], 
 ARRAY['Simple lines', 'Unstructured', 'Easy fit'],
 '5''7"', 
 ARRAY['natural', 'relaxed', 'unstructured', 'medium']),

('Dramatic Tg', 'Dramatic', 'Strongly angular beauty strongly thyroid dominant thyroid magnetism brain style (fast) fun-loving personality',
 ARRAY['Balanced womanly figure', 'Medium chest', 'Real breasts', 'Defined waist', 'Medium hips', 'Padded rear'],
 ARRAY['Weight gain (bottom-heavy) hips', 'Thighs', 'Breasts larger w age', 'Think long lines and long changes with minimum details'], 
 ARRAY['Long lines', 'Tailored', 'Structured'], 
 ARRAY['Structured fabrics', 'Wool'], 
 ARRAY['Long cuts', 'Clean lines', 'Minimal details'],
 '5''9"', 
 ARRAY['dramatic', 'long', 'angular', 'bold']);