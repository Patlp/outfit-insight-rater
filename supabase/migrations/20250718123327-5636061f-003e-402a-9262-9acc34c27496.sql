-- Add more detailed body type variations from the expanded guide

-- First, let's add more columns for detailed physical analysis
ALTER TABLE public.body_type_guide 
ADD COLUMN IF NOT EXISTS weight_gain_pattern TEXT[],
ADD COLUMN IF NOT EXISTS specific_measurements TEXT,
ADD COLUMN IF NOT EXISTS bone_structure TEXT,
ADD COLUMN IF NOT EXISTS facial_features TEXT[],
ADD COLUMN IF NOT EXISTS body_proportions TEXT[],
ADD COLUMN IF NOT EXISTS style_personality TEXT;

-- Insert detailed Natural variations
INSERT INTO public.body_type_guide (type_name, category, description, physical_characteristics, styling_guidelines, recommended_fits, recommended_fabrics, recommended_cuts, height_range, body_shape_keywords, weight_gain_pattern, specific_measurements, bone_structure, body_proportions, style_personality) VALUES 

-- Natural Variations
('Kari Natural', 'Natural', 'Classic Natural - balanced & proportional with natural ease', 
 ARRAY['Ag plus T traits', 'Ag plus T traits', 'balanced waist', 'more hips', 'more bust', 'padded rear'],
 ARRAY['Natural ease', 'Balanced proportions', 'Comfortable structured pieces'], 
 ARRAY['Relaxed', 'Natural', 'Balanced'], 
 ARRAY['Natural fabrics', 'Cotton', 'Linen'], 
 ARRAY['Natural lines', 'Relaxed fit', 'Structured ease'],
 '5''7"', 
 ARRAY['natural', 'balanced', 'ease', 'proportional'],
 ARRAY['Even distribution', 'All over', 'Maintains proportions'],
 'Ag plus T traits - balanced waist, more hips, more bust',
 'Medium bone structure',
 ARRAY['Balanced shoulders and hips', 'Natural waist definition', 'Proportional bust'],
 'Results-oriented, logical, practical'),

('Chloe Natural', 'Natural', 'Flamboyant Natural - strong, broad with natural confidence', 
 ARRAY['Ag plus T traits', 'more height', 'more bust', 'padded rear'],
 ARRAY['Bold natural lines', 'Oversized structured pieces', 'Strong silhouettes'], 
 ARRAY['Oversized', 'Bold', 'Structured'], 
 ARRAY['Structured naturals', 'Heavy cottons'], 
 ARRAY['Bold lines', 'Oversized cuts', 'Strong shoulders'],
 '5''8"+', 
 ARRAY['bold', 'strong', 'oversized', 'confident'],
 ARRAY['Upper body', 'Shoulders', 'Arms'],
 'More height, more bust, padded rear',
 'Strong bone structure',
 ARRAY['Broad shoulders', 'Strong frame', 'Commanding presence'],
 'Confident, bold, natural leader'),

('Kellie Natural', 'Natural', 'Soft Natural - gentle curves with natural softness', 
 ARRAY['Ag plus T traits', 'softer curves', 'gentle waist', 'soft hips', 'natural bust'],
 ARRAY['Soft natural lines', 'Gentle structure', 'Flowing with shape'], 
 ARRAY['Soft', 'Flowing', 'Gently fitted'], 
 ARRAY['Soft fabrics', 'Draping materials'], 
 ARRAY['Soft lines', 'Gentle curves', 'Natural drape'],
 '5''6"', 
 ARRAY['soft', 'gentle', 'curved', 'natural'],
 ARRAY['Curves', 'Hips', 'Gentle overall'],
 'Gentle natural proportions with soft curves',
 'Medium-soft bone structure',
 ARRAY['Soft shoulders', 'Gentle waist', 'Natural curves'],
 'Gentle, nurturing, naturally elegant'),

-- Dramatic Variations  
('Susan Dramatic', 'Dramatic', 'Pure Dramatic - sharp, angular, bold lines', 
 ARRAY['Tg plus T traits', 'more height', 'more bust', 'more hips', 'weight gain hips, thighs, rear'],
 ARRAY['Sharp geometric lines', 'Bold angular details', 'Dramatic contrasts'], 
 ARRAY['Sharp', 'Geometric', 'Bold'], 
 ARRAY['Crisp fabrics', 'Structured materials'], 
 ARRAY['Sharp lines', 'Geometric cuts', 'Angular details'],
 '5''9"+', 
 ARRAY['sharp', 'angular', 'bold', 'geometric'],
 ARRAY['Lower body', 'Hips', 'Thighs', 'Rear'],
 'Tg plus T traits - height, bust, hips',
 'Sharp bone structure',
 ARRAY['Angular shoulders', 'Long lines', 'Sharp features'],
 'Bold, dramatic, commanding'),

('Dramatic Sophisticate', 'Dramatic', 'Sophisticated Dramatic - refined angular beauty', 
 ARRAY['Sharp angular features', 'sophisticated proportions', 'refined bone structure'],
 ARRAY['Sophisticated cuts', 'Refined details', 'Elegant sharp lines'], 
 ARRAY['Sophisticated', 'Refined', 'Sharp'], 
 ARRAY['Luxury fabrics', 'Refined materials'], 
 ARRAY['Sophisticated cuts', 'Refined details', 'Elegant lines'],
 '5''8"', 
 ARRAY['sophisticated', 'refined', 'angular', 'elegant'],
 ARRAY['Refined weight distribution'],
 'Sophisticated angular proportions',
 'Refined sharp bone structure',
 ARRAY['Sophisticated features', 'Refined proportions', 'Sharp elegance'],
 'Sophisticated, refined, elegant'),

-- Gamine Variations
('Teresa Gamine', 'Gamine', 'Gamine Classic - petite with sharp yang features', 
 ARRAY['Pg plus T traits', 'more bust', 'more hips', 'more rear', 'slightly padded rear'],
 ARRAY['Sharp details', 'Geometric patterns', 'Contrasting elements'], 
 ARRAY['Sharp', 'Geometric', 'Fitted'], 
 ARRAY['Crisp fabrics', 'Structured materials'], 
 ARRAY['Sharp cuts', 'Geometric details', 'Contrasting elements'],
 '5''3"', 
 ARRAY['sharp', 'petite', 'geometric', 'crisp'],
 ARRAY['All over', 'Even distribution'],
 'Pg plus T traits with extra curves',
 'Sharp small bone structure',
 ARRAY['Petite frame', 'Sharp features', 'Angular details'],
 'Energetic, sharp, detail-oriented'),

('Selina Gamine', 'Gamine', 'Gamine Classic variant - angular petite with defined features', 
 ARRAY['Sharp small features', 'defined waist', 'small chest', 'slight waist', 'narrow hips'],
 ARRAY['Geometric details', 'Sharp contrasts', 'Petite proportions'], 
 ARRAY['Petite', 'Sharp', 'Defined'], 
 ARRAY['Crisp fabrics', 'Small prints'], 
 ARRAY['Petite cuts', 'Sharp details', 'Small proportions'],
 '5''2"', 
 ARRAY['petite', 'sharp', 'defined', 'angular'],
 ARRAY['Upper torso', 'Arms'],
 'Sharp small features with defined proportions',
 'Petite sharp bone structure',
 ARRAY['Small sharp features', 'Defined proportions', 'Angular frame'],
 'Precise, energetic, focused'),

-- Romantic Variations with Weight Gain details
('Christine Romantic', 'Romantic', 'Romantic Classic - soft curves with weight gain awareness', 
 ARRAY['G figure', 'small rounded breasts', 'small chest', 'defined waist', 'very padded rear'],
 ARRAY['Soft details', 'Rounded shapes', 'Flowing lines'], 
 ARRAY['Soft', 'Rounded', 'Flowing'], 
 ARRAY['Soft fabrics', 'Flowing materials'], 
 ARRAY['Soft cuts', 'Rounded details', 'Flowing lines'],
 '5''5"', 
 ARRAY['soft', 'rounded', 'curved', 'gentle'],
 ARRAY['G weight gain - thighs', 'hips', 'rear'],
 'G figure with small chest, defined waist',
 'Soft rounded bone structure',
 ARRAY['Soft curves', 'Rounded features', 'Gentle proportions'],
 'Gentle, nurturing, romantic'),

('Toni Romantic', 'Romantic', 'Romantic variant with specific weight patterns', 
 ARRAY['Small rounded breasts', 'small chest', 'defined waist', 'very padded rear'],
 ARRAY['Romantic details', 'Soft textures', 'Curved lines'], 
 ARRAY['Romantic', 'Soft', 'Curved'], 
 ARRAY['Soft romantic fabrics', 'Textured materials'], 
 ARRAY['Romantic cuts', 'Soft details', 'Curved lines'],
 '5''5"', 
 ARRAY['romantic', 'soft', 'textured', 'curved'],
 ARRAY['Lower body focus', 'Hips and thighs'],
 'Small chest with defined waist and curves',
 'Soft delicate bone structure',
 ARRAY['Delicate features', 'Soft curves', 'Romantic proportions'],
 'Romantic, soft, intuitive'),

('Danielle Romantic', 'Romantic', 'Soft Romantic - enhanced curves with soft yin', 
 ARRAY['G figure', 'small rounded breasts', 'small chest', 'defined waist', 'very padded rear'],
 ARRAY['Enhanced romantic details', 'Luxurious textures', 'Ornate elements'], 
 ARRAY['Luxurious', 'Ornate', 'Soft'], 
 ARRAY['Luxury soft fabrics', 'Rich textures'], 
 ARRAY['Ornate cuts', 'Luxurious details', 'Enhanced curves'],
 '5''4"', 
 ARRAY['luxurious', 'ornate', 'enhanced', 'rich'],
 ARRAY['Enhanced curves', 'All feminine areas'],
 'Enhanced G figure with luxury proportions',
 'Soft luxurious bone structure',
 ARRAY['Enhanced curves', 'Luxurious features', 'Rich proportions'],
 'Luxurious, enhanced femininity, artistic');

-- Update existing records with more specific details
UPDATE public.body_type_guide 
SET weight_gain_pattern = ARRAY['Wide figure', 'All over even', 'Hands, feet, chin, upper tummy'],
    specific_measurements = 'Little-girl figure (very narrow) - small chest, slight waist, narrow hips',
    bone_structure = 'Delicate angular bone structure',
    body_proportions = ARRAY['Narrow shoulders', 'Slight waist', 'Narrow hips', 'Small frame'],
    style_personality = 'Analytical, detail-oriented, thinking-dominant'
WHERE type_name = 'Gamine Pg';

UPDATE public.body_type_guide 
SET weight_gain_pattern = ARRAY['Bottom-heavy', 'Thighs', 'Hips', 'Rear'],
    specific_measurements = 'Slightly bottom-heavy figure - small chest, very defined waist, medium hips',
    bone_structure = 'Soft rounded bone structure',
    body_proportions = ARRAY['Small chest', 'Defined waist', 'Curved hips', 'Rounded features'],
    style_personality = 'Intuitive, nurturing, relationship-focused'
WHERE type_name = 'Romantic G';

UPDATE public.body_type_guide 
SET weight_gain_pattern = ARRAY['Top-heavy', 'Breasts', 'Back', 'Lower tummy'],
    specific_measurements = 'Medium top-heavy figure - large chest, slight waist, medium hips',
    bone_structure = 'Natural moderate bone structure',
    body_proportions = ARRAY['Broader shoulders', 'Natural waist', 'Balanced hips', 'Relaxed frame'],
    style_personality = 'Results-oriented, logical, practical'
WHERE type_name = 'Natural Ag';

UPDATE public.body_type_guide 
SET weight_gain_pattern = ARRAY['Bottom-heavy', 'Hips', 'Thighs', 'Breasts larger with age'],
    specific_measurements = 'Balanced womanly figure - medium chest, defined waist, medium hips',
    bone_structure = 'Sharp angular bone structure',
    body_proportions = ARRAY['Angular shoulders', 'Defined waist', 'Long lines', 'Sharp features'],
    style_personality = 'Fast-paced, fun-loving, dramatic'
WHERE type_name = 'Dramatic Tg';