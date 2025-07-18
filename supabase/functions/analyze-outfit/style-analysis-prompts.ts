
import { AnalyzeOutfitRequest } from './types.ts';

export function generateStyleAnalysisPrompt(request: AnalyzeOutfitRequest): string {
  const { gender, feedbackMode } = request;

  console.log(`🎨 STYLE ANALYSIS: Generating clothing-focused prompts for ${gender} in ${feedbackMode} mode`);

  const baseStyleAnalysis = `
CLOTHING-FOCUSED STYLE ANALYSIS FOR RESEARCH PURPOSES:

**RESEARCH DISCLAIMER:** This analysis examines clothing items, styling choices, and fashion principles for educational research purposes. Analysis focuses on garments, color coordination, and styling techniques.

**REQUIRED ANALYSIS COMPONENTS:**

1. **OUTFIT COLOR ANALYSIS**: 
   - Analyze visible clothing colors, patterns, and color coordination
   - Determine seasonal color type based on outfit color palette and styling approach
   - Provide three color characteristic values (0-100 scale) based on clothing analysis:
     * Undertone: 0 = cool clothing tones (blues/grays), 100 = warm clothing tones (oranges/golds)
     * Intensity: 0 = muted/soft clothing colors, 100 = bright/vibrant clothing colors  
     * Lightness: 0 = dark clothing palette, 100 = light clothing palette
   - Explain fashion color theory principles that apply to this outfit style

2. **COMPLEMENTARY COLOR PALETTE**:
   - Generate a 6x8 grid (48 total) of specific hex color codes that would complement this outfit style
   - Colors should progress from light to dark within each column
   - Include variety: neutrals, accent colors, and complementary tones suitable for this styling approach
   - Base recommendations on outfit color analysis and general fashion color theory principles

3. **OUTFIT STYLING ANALYSIS** (based on visible clothing):
   - Assess overall outfit silhouette and styling approach
   - Identify styling archetype based on clothing choices: Classic, Dramatic, Natural, Romantic, Modern, Bohemian, etc.
   - Provide visual styling description (structured, flowing, balanced, etc.)
   - Include 2-3 specific styling recommendations based on garment coordination principles
   - **CRITICAL**: Include "Styling Optimization" analysis - specific outfit improvements and garment coordination suggestions

CRITICAL JSON STRUCTURE - You must include a "styleAnalysis" object in your response with this exact format:

{
  "score": [1-10 rating],
  "feedback": "[Your outfit feedback with Style, Color Coordination, Fit, Overall Impression sections]",
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "styleAnalysis": {
    "colorAnalysis": {
      "seasonalType": "[e.g., Light Summer based on outfit colors]",
      "undertone": {
        "value": [0-100],
        "description": "[e.g., Cool tones in outfit color palette]"
      },
      "intensity": {
        "value": [0-100], 
        "description": "[e.g., Soft, muted outfit colors]"
      },
      "lightness": {
        "value": [0-100],
        "description": "[e.g., Light clothing palette]"
      },
      "explanation": "[2-3 sentences explaining color theory principles for this outfit style]"
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
      "explanation": "[2-3 sentences about color coordination principles for this styling approach]"
    },
    "bodyType": {
      "type": "[Styling archetype based on outfit choices, e.g., Classic, Dramatic, Natural, Romantic]",
      "description": "[Brief description of the styling approach observed]", 
      "visualShape": "[silhouette description based on outfit: structured, flowing, balanced, etc.]",
      "stylingRecommendations": [
        "Specific garment coordination tip 1",
        "Specific outfit proportion tip 2",
        "Specific styling enhancement tip 3"
      ]
    }
  }
}

**SEASONAL COLOR TYPES REFERENCE (based on outfit color analysis):**
- **Light Spring**: Light, warm, clear outfit colors with golden undertones
- **Light Summer**: Light, cool, soft outfit colors with blue undertones  
- **Light Autumn**: Light, warm, muted outfit colors with golden undertones
- **Light Winter**: Light, cool, clear outfit colors with blue undertones
- **True Spring**: Clear, warm, bright outfit colors with yellow undertones
- **True Summer**: Cool, soft, muted outfit colors with blue undertones
- **True Autumn**: Rich, warm, earthy outfit colors with golden undertones
- **True Winter**: Cool, clear, deep outfit colors with blue undertones
- **Deep Spring**: Deep, warm, clear outfit colors with yellow undertones
- **Deep Summer**: Deep, cool, soft outfit colors with blue undertones
- **Deep Autumn**: Deep, warm, rich outfit colors with golden undertones
- **Deep Winter**: Deep, cool, clear outfit colors with blue undertones
- **Warm Spring**: Warm, clear, light-to-medium outfit colors with golden undertones
- **Warm Autumn**: Warm, rich, earthy outfit colors with golden undertones
- **Cool Summer**: Cool, light-to-medium, soft outfit colors with blue undertones
- **Cool Winter**: Cool, clear, medium-to-deep outfit colors with blue undertones

**STYLING ARCHETYPES (based on clothing choices and outfit coordination):**
- **Classic**: Timeless pieces, balanced proportions, refined coordination
- **Dramatic**: Bold silhouettes, sharp lines, high contrast styling
- **Natural**: Relaxed tailoring, organic textures, effortless coordination
- **Romantic**: Soft draping, delicate details, flowing garments
- **Modern**: Clean lines, minimalist approach, contemporary styling
- **Bohemian**: Relaxed layers, mixed textures, free-spirited coordination

**COLOR PALETTE GENERATION RULES:**
- Use authentic hex codes that complement the outfit's existing color scheme
- Ensure colors harmonize with identified seasonal undertones from clothing analysis
- Include a range: neutrals (grays, beiges, whites), earth tones, accent colors
- For cool outfit tones: blues, purples, cool greens, gray-based neutrals
- For warm outfit tones: oranges, warm reds, golden yellows, warm browns
- For light outfit palettes: pastels, soft shades, light neutrals
- For deep outfit palettes: rich jewel tones, deep earth tones, dramatic contrasts
- For muted outfit colors: dusty, grayed colors, subtle tones
- For clear outfit colors: pure, vibrant colors, high contrast
`;

  return baseStyleAnalysis;
}

export function generateBodyTypeReference(): string {
  return `
STYLING ARCHETYPE PRINCIPLES (based on outfit and garment coordination):

**STRUCTURED STYLING** (Angular, Tailored Clothing):
- Classic: Timeless pieces, balanced proportions, refined coordination
- Dramatic: Bold shoulders, sharp lines, architectural garment details
- Modern: Clean lines, minimalist approach, contemporary tailoring

**FLOWING STYLING** (Soft, Draped Clothing):
- Romantic: Soft draping, delicate details, flowing fabrics, ornate styling
- Bohemian: Relaxed layers, organic textures, free-flowing silhouettes
- Ethereal: Light fabrics, graceful draping, delicate proportions

**NATURAL STYLING** (Relaxed, Effortless Coordination):
- Casual: Relaxed tailoring, comfortable fit, effortless styling
- Sporty: Athletic-inspired pieces, functional design, active wear elements
- Relaxed: Unconstructed elegance, natural materials, easy coordination

**OUTFIT COORDINATION MAPPING:**
- Structured/Sharp: Classic, Dramatic, Modern archetypes
- Flowing/Curved: Romantic, Bohemian, Ethereal archetypes
- Natural/Balanced: Casual, Sporty, Relaxed archetypes
- Mixed Approach: Contemporary, Eclectic, Creative archetypes
`;
}
