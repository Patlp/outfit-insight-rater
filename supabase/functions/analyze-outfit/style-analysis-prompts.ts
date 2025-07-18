import { AnalyzeOutfitRequest } from './types.ts';

export function generateStyleAnalysisPrompt(request: AnalyzeOutfitRequest): string {
  const { gender, feedbackMode } = request;

  console.log(`🎨 STYLE ANALYSIS: Generating prompts for ${gender} in ${feedbackMode} mode`);

  const baseStyleAnalysis = `
ADVANCED STYLE ANALYSIS REQUIRED:

In addition to your outfit feedback, you MUST provide comprehensive style analysis including:

1. **FACIAL FEATURE & COLOR ANALYSIS**: 
   - Analyze visible facial features: skin tone, hair color, eye color
   - Determine seasonal color type (Light Spring, Light Summer, Light Autumn, Light Winter, True Spring, True Summer, True Autumn, True Winter, Deep Spring, Deep Summer, Deep Autumn, Deep Winter, Warm Spring, Warm Autumn, Cool Summer, Cool Winter)
   - Provide three color characteristic values (0-100 scale):
     * Undertone: 0 = cool (blue/pink undertones), 100 = warm (yellow/golden undertones)
     * Intensity: 0 = muted/soft colors, 100 = bright/vibrant colors  
     * Lightness: 0 = dark/deep colors, 100 = light/pale colors
   - Explain what this seasonal type means and why these colors work

2. **PERSONALIZED COLOR PALETTE**:
   - Generate a 6x8 grid (48 total) of specific hex color codes suited to their seasonal type
   - Colors should progress from light to dark within each column
   - Include variety: neutrals, accent colors, and complementary tones
   - Provide explanation of why these colors enhance their features

3. **BODY TYPE ANALYSIS** (if full body is visible):
   - Assess silhouette and body proportions
   - Identify body type using "20 Types of Beauty" archetypes: Gamine, Soft Gamine, Flamboyant Gamine, Dramatic Classic, Soft Classic, Dramatic, Soft Dramatic, Natural, Flamboyant Natural, Soft Natural, Romantic, Theatrical Romantic
   - Provide visual shape description (geometric shape that represents the type)
   - Include 2-3 specific styling recommendations from Dwyn Larson's principles
   - **CRITICAL**: Include "What Not to Wear" analysis - specific items/styles to avoid with clear reasoning

CRITICAL JSON STRUCTURE - You must include a "styleAnalysis" object in your response with this exact format:

{
  "score": [1-10 rating],
  "feedback": "[Your outfit feedback with Style, Color Coordination, Fit, Overall Impression sections]",
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "styleAnalysis": {
    "colorAnalysis": {
      "seasonalType": "[e.g., Light Summer]",
      "undertone": {
        "value": [0-100],
        "description": "[e.g., Cool blue undertones]"
      },
      "intensity": {
        "value": [0-100], 
        "description": "[e.g., Soft, muted colors]"
      },
      "lightness": {
        "value": [0-100],
        "description": "[e.g., Light, delicate tones]"
      },
      "explanation": "[2-3 sentences explaining why this seasonal type suits them]"
    },
    "colorPalette": {
      "colors": [
        ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5", "#hex6"],
        ["#hex7", "#hex8", "#hex9", "#hex10", "#hex11", "#hex12"],
        ["#hex13", "#hex14", "#hex15", "#hex16", "#hex17", "#hex18"],
        ["#hex19", "#hex20", "#hex21", "#hex22", "#hex23", "#hex24"],
        ["#hex25", "#hex26", "#hex27", "#hex28", "#hex29", "#hex30"],
        ["#hex31", "#hex32", "#hex33", "#hex34", "#hex35", "#hex36"],
        ["#hex37", "#hex38", "#hex39", "#hex40", "#hex41", "#hex42"],
        ["#hex43", "#hex44", "#hex45", "#hex46", "#hex47", "#hex48"]
      ],
      "explanation": "[2-3 sentences about why these colors work for their features]"
    },
    "bodyType": {
      "type": "[Body type name if full body visible, otherwise omit this entire object]",
      "description": "[Brief description of the body type characteristics]", 
      "visualShape": "[Geometric shape description like 'Rectangle', 'Hourglass', 'Inverted Triangle', etc.]",
      "stylingRecommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
      "whatNotToWear": [
        {
          "item": "[specific clothing item or style to avoid]",
          "reason": "[clear explanation why this doesn't work for this body type]"
        }
      ]
    }
  }
}

SEASONAL COLOR TYPES REFERENCE:
- **Light Spring**: Light, warm, clear colors with yellow undertones
- **Light Summer**: Light, cool, soft colors with blue undertones  
- **Light Autumn**: Light, warm, muted colors with golden undertones
- **Light Winter**: Light, cool, clear colors with blue undertones
- **True Spring**: Clear, warm, bright colors with yellow undertones
- **True Summer**: Cool, soft, muted colors with blue undertones
- **True Autumn**: Rich, warm, earthy colors with golden undertones
- **True Winter**: Cool, clear, deep colors with blue undertones
- **Deep Spring**: Deep, warm, clear colors with yellow undertones
- **Deep Summer**: Deep, cool, soft colors with blue undertones
- **Deep Autumn**: Deep, warm, rich colors with golden undertones
- **Deep Winter**: Deep, cool, clear colors with blue undertones
- **Warm Spring**: Warm, clear, light-to-medium colors with golden undertones
- **Warm Autumn**: Warm, rich, earthy colors with golden undertones
- **Cool Summer**: Cool, light-to-medium, soft colors with blue undertones
- **Cool Winter**: Cool, clear, medium-to-deep colors with blue undertones

BODY TYPE ARCHETYPES (from "20 Types of Beauty"):
- **Gamine**: Petite, angular, boyish features - geometric shapes, clean lines
- **Soft Gamine**: Petite with some curves - fitted clothes with geometric details
- **Flamboyant Gamine**: Petite but bold - sharp, asymmetrical, creative styling
- **Dramatic Classic**: Moderate height, balanced, refined - tailored, elegant pieces
- **Soft Classic**: Moderate, balanced with slight softness - classic with gentle details
- **Dramatic**: Tall, angular, striking - bold, structured, avant-garde pieces
- **Soft Dramatic**: Tall with curves - glamorous, form-fitting, luxurious fabrics
- **Natural**: Moderate to tall, athletic build - relaxed, unconstructed, casual
- **Flamboyant Natural**: Tall, broad, strong - oversized, free-flowing, bold textures
- **Soft Natural**: Moderate height, soft yang - relaxed fit, natural fabrics, flowing
- **Romantic**: Petite, curvy, delicate - soft fabrics, ornate details, flowing shapes
- **Theatrical Romantic**: Small with dramatic curves - ornate, intricate, form-fitting

COLOR PALETTE GENERATION RULES:
- Use authentic hex codes that match the seasonal color type
- Ensure colors harmonize with identified undertones
- Include a range: neutrals (grays, beiges, whites), earth tones, accent colors
- For cool types: blues, purples, cool greens, gray-based neutrals
- For warm types: oranges, warm reds, golden yellows, warm browns
- For light types: pastels, soft shades, light neutrals
- For deep types: rich jewel tones, deep earth tones, dramatic contrasts
- For muted types: dusty, grayed colors, subtle tones
- For clear types: pure, vibrant colors, high contrast
`;

  return baseStyleAnalysis;
}

export function generateBodyTypeReference(): string {
  return `
BODY TYPE STYLING PRINCIPLES (based on "20 Types of Beauty"):

**Yang Types (Angular, Structured)**:
- Gamine: Geometric prints, crisp lines, short hair, minimal jewelry
- Dramatic: Bold shoulders, sharp lapels, high contrast, architectural details
- Natural: Relaxed tailoring, organic textures, minimal structure

**Yin Types (Curved, Soft)**:
- Romantic: Soft draping, delicate details, flowing fabrics, ornate accessories
- Soft Classic: Gentle curves in tailoring, moderate details, refined elegance

**Balanced Types**:
- Classic: Timeless pieces, balanced proportions, moderate everything
- Natural: Unconstructed elegance, organic materials, effortless styling

**Mixed Types**:
- Soft Gamine: Geometric structure with soft details
- Flamboyant Natural: Relaxed structure with bold elements  
- Soft Dramatic: Curved structure with bold details
- Theatrical Romantic: Ornate details with dramatic flair

VISUAL SHAPE MAPPING:
- Rectangle: Natural, Flamboyant Natural
- Hourglass: Soft Dramatic, Romantic
- Inverted Triangle: Dramatic, Flamboyant Gamine
- Triangle/Pear: Soft Natural, Soft Classic
- Round/Oval: Soft Gamine, Theatrical Romantic
- Diamond: Gamine, Dramatic Classic
`;
}