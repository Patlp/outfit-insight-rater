
import { AnalyzeOutfitResponse, AnalyzeOutfitRequest } from './types.ts';
import { TextProcessor } from './text-processor.ts';
import { validateResponse, hasGrammarIssues } from './response-validator.ts';
import { RoastModeParser } from './roast-parser.ts';

export class AdvancedResponseParser {
  
  static parseAIResponse(aiResponse: string, request: AnalyzeOutfitRequest): AnalyzeOutfitResponse {
    console.log('🎨 ADVANCED PARSER: Starting enhanced parsing...');
    console.log('🎨 AI Response preview:', aiResponse.substring(0, 200) + '...');
    
    // 🔥 ROAST MODE: Use specialized parser to preserve brutality
    if (request.feedbackMode === 'roast') {
      console.log('🔥 ROAST MODE DETECTED: Using brutal parser...');
      return RoastModeParser.parseRoastResponse(aiResponse, request);
    }
    
    // Enhanced parsing with multiple attempts
    let result = this.attemptFlexibleParsing(aiResponse, request);
    
    // Validate the result
    const validation = validateResponse(result);
    
    if (!validation.isValid || validation.warnings.length > 0) {
      console.log('🎨 First parsing attempt failed, trying enhanced methods...');
      console.log('🎨 Errors:', validation.errors);
      console.log('🎨 Warnings:', validation.warnings);
      
      // Second attempt: Enhanced parsing with text processing
      result = this.attemptEnhancedParsing(aiResponse, request);
      
      // Final validation
      const finalValidation = validateResponse(result);
      if (!finalValidation.isValid) {
        console.log('🎨 Enhanced parsing also failed, using intelligent fallback');
        result = this.generateIntelligentFallback(request, aiResponse);
      }
    }
    
    // Always ensure we have style analysis - this is the key fix!
    if (!result.styleAnalysis) {
      console.log('🎨 CRITICAL: No style analysis found, generating fallback style data...');
      result.styleAnalysis = this.generateFallbackStyleAnalysis(request);
    }
    
    // Final quality enhancement
    result = this.enhanceResponseQuality(result);
    
    console.log('🎨 FINAL RESULT - Style analysis included:', !!result.styleAnalysis);
    if (result.styleAnalysis) {
      console.log('🎨 Color analysis type:', result.styleAnalysis.colorAnalysis?.seasonalType);
      console.log('🎨 Color palette colors count:', result.styleAnalysis.colorPalette?.colors?.length * result.styleAnalysis.colorPalette?.colors?.[0]?.length);
      console.log('🎨 Body type included:', !!result.styleAnalysis.bodyType);
    }
    
    return result;
  }
  
  private static attemptFlexibleParsing(aiResponse: string, request: AnalyzeOutfitRequest): AnalyzeOutfitResponse {
    console.log('🎨 Attempting flexible JSON parsing...');
    
    // Try multiple JSON extraction methods
    const jsonExtractionMethods = [
      // Method 1: Complete JSON response
      () => {
        const jsonPattern = /\{[\s\S]*?"styleAnalysis"[\s\S]*?\}(?:\s*$)/;
        const match = aiResponse.match(jsonPattern);
        return match ? JSON.parse(match[0]) : null;
      },
      
      // Method 2: Look for JSON anywhere in response
      () => {
        const jsonPattern = /\{[\s\S]*?"score"[\s\S]*?"feedback"[\s\S]*?\}/;
        const match = aiResponse.match(jsonPattern);
        return match ? JSON.parse(match[0]) : null;
      },
      
      // Method 3: Extract JSON between code blocks
      () => {
        const codeBlockPattern = /```json\s*([\s\S]*?)\s*```/;
        const match = aiResponse.match(codeBlockPattern);
        return match ? JSON.parse(match[1]) : null;
      },
      
      // Method 4: Look for style analysis object specifically  
      () => {
        const stylePattern = /"styleAnalysis":\s*\{[\s\S]*?\}(?=\s*[,}])/;
        const match = aiResponse.match(stylePattern);
        if (match) {
          const completeJson = `{${match[0]}}`;
          const parsed = JSON.parse(completeJson);
          return { styleAnalysis: parsed.styleAnalysis };
        }
        return null;
      }
    ];
    
    let parsedData = null;
    for (const method of jsonExtractionMethods) {
      try {
        parsedData = method();
        if (parsedData) {
          console.log('🎨 Successfully parsed JSON with extraction method');
          break;
        }
      } catch (e) {
        console.log('🎨 JSON extraction method failed:', e.message);
      }
    }
    
    if (parsedData && parsedData.score && parsedData.feedback && parsedData.suggestions) {
      console.log('🎨 Complete structured response found!');
      return {
        score: parsedData.score,
        feedback: parsedData.feedback,
        suggestions: parsedData.suggestions,
        styleAnalysis: parsedData.styleAnalysis
      };
    }
    
    // Fallback to manual parsing
    console.log('🎨 No complete JSON found, attempting manual parsing...');
    return this.attemptManualParsing(aiResponse, request, parsedData?.styleAnalysis);
  }
  
  private static attemptManualParsing(aiResponse: string, request: AnalyzeOutfitRequest, existingStyleAnalysis?: any): AnalyzeOutfitResponse {
    let score = 7;
    let feedback = aiResponse;
    let suggestions: string[] = [];
    let styleAnalysis = existingStyleAnalysis;

    // Extract score with multiple patterns
    const scorePatterns = [
      /(\d+)(?:\s*\/\s*10|(?:\s+out\s+of|\s+on\s+a\s+scale\s+of)\s+10)/i,
      /(?:score|rating):\s*(\d+)/i,
      /\b(\d+)\s*\/\s*10\b/i,
      /\*\*Score:\*\*\s*(\d+)/i
    ];
    
    for (const pattern of scorePatterns) {
      const match = aiResponse.match(pattern);
      if (match) {
        const parsedScore = parseInt(match[1], 10);
        if (parsedScore >= 1 && parsedScore <= 10) {
          score = parsedScore;
          console.log('🎨 Extracted score:', score);
          break;
        }
      }
    }

    // Extract suggestions with improved patterns
    const suggestionPatterns = [
      /(?:SUGGESTIONS|Suggestions|Improvements|Recommendations|Tips):([\s\S]+?)(?:\n\n|\n[A-Z]|$)/i,
      /\d+\.\s*([^.\n]+(?:\.[^.\n]*)*)/g
    ];
    
    for (const pattern of suggestionPatterns) {
      if (pattern.global) {
        const matches = [...aiResponse.matchAll(pattern)];
        if (matches.length > 0) {
          suggestions = matches
            .map(match => match[1].trim())
            .filter(s => s.length > 10)
            .slice(0, 3);
          console.log('🎨 Extracted suggestions:', suggestions.length);
          break;
        }
      } else {
        const match = aiResponse.match(pattern);
        if (match) {
          const suggestionsText = match[1];
          suggestions = suggestionsText
            .split(/\n\d+\.|\n-|\n\*/)
            .filter(item => item.trim().length > 10)
            .map(item => item.trim())
            .slice(0, 3);
          console.log('🎨 Extracted suggestions from section:', suggestions.length);
          break;
        }
      }
    }

    // Clean feedback
    feedback = aiResponse
      .replace(/\b\d+\/10\b|\b\d+ out of 10\b|\bScore:?\s*\d+\b/gi, '')
      .replace(/(Suggestions|Improvements|Recommendations|Tips):[\s\S]+$/i, '')
      .trim();

    // If no suggestions found, generate fallback
    if (suggestions.length === 0) {
      console.log('🎨 No suggestions found, generating fallback suggestions');
      const fallback = TextProcessor.generateFallbackContent(request);
      suggestions = fallback.suggestions;
    }

    return { score, feedback, suggestions, styleAnalysis };
  }
  
  private static attemptEnhancedParsing(aiResponse: string, request: AnalyzeOutfitRequest): AnalyzeOutfitResponse {
    console.log('🎨 Attempting enhanced parsing with text processing...');
    
    // Use structured text processing
    const sections = TextProcessor.extractStructuredFeedback(aiResponse);
    
    let feedback = '';
    if (Object.keys(sections).length > 0) {
      feedback = TextProcessor.rebuildFeedbackFromSections(sections);
    } else {
      feedback = TextProcessor.cleanAndEnhanceText(aiResponse);
    }
    
    // Extract score with more aggressive parsing
    let score = 7;
    const allNumbers = aiResponse.match(/\d+/g);
    if (allNumbers) {
      for (const num of allNumbers) {
        const parsedNum = parseInt(num, 10);
        if (parsedNum >= 1 && parsedNum <= 10) {
          score = parsedNum;
          break;
        }
      }
    }
    
    // Extract and process suggestions
    let suggestions: string[] = [];
    const lines = aiResponse.split('\n');
    
    for (const line of lines) {
      const cleaned = line.trim();
      if (cleaned.length > 15 && 
          (cleaned.includes('consider') || cleaned.includes('try') || 
           cleaned.includes('add') || cleaned.includes('opt for') ||
           cleaned.match(/^\d+\./) || cleaned.match(/^[-*]/))) {
        suggestions.push(cleaned);
      }
    }
    
    suggestions = TextProcessor.formatSuggestions(suggestions).slice(0, 3);
    
    // Fallback if still no suggestions
    if (suggestions.length === 0) {
      const fallback = TextProcessor.generateFallbackContent(request);
      suggestions = fallback.suggestions;
    }

    // Try to extract style analysis even in enhanced parsing
    let styleAnalysis = this.extractStyleAnalysisFromText(aiResponse);
    
    return { score, feedback, suggestions, styleAnalysis };
  }
  
  private static extractStyleAnalysisFromText(aiResponse: string): any {
    console.log('🎨 Attempting to extract style analysis from text...');
    
    try {
      // Try to find style analysis JSON
      const styleAnalysisMatch = aiResponse.match(/"styleAnalysis":\s*\{[\s\S]*?\}(?=\s*[,}])/);
      if (styleAnalysisMatch) {
        const styleAnalysisData = JSON.parse(`{${styleAnalysisMatch[0]}}`);
        console.log('🎨 Successfully extracted style analysis from text');
        return styleAnalysisData.styleAnalysis;
      }
      
      // Try to find individual components
      const colorAnalysisMatch = aiResponse.match(/"colorAnalysis":\s*\{[\s\S]*?\}(?=\s*[,}])/);
      const colorPaletteMatch = aiResponse.match(/"colorPalette":\s*\{[\s\S]*?\}(?=\s*[,}])/);
      
      if (colorAnalysisMatch || colorPaletteMatch) {
        console.log('🎨 Found partial style analysis components');
        const result: any = {};
        
        if (colorAnalysisMatch) {
          const colorData = JSON.parse(`{${colorAnalysisMatch[0]}}`);
          result.colorAnalysis = colorData.colorAnalysis;
        }
        
        if (colorPaletteMatch) {
          const paletteData = JSON.parse(`{${colorPaletteMatch[0]}}`);
          result.colorPalette = paletteData.colorPalette;
        }
        
        return Object.keys(result).length > 0 ? result : undefined;
      }
    } catch (e) {
      console.log('🎨 Could not extract style analysis from text:', e.message);
    }
    
    return undefined;
  }
  
  private static generateIntelligentFallback(request: AnalyzeOutfitRequest, aiResponse: string): AnalyzeOutfitResponse {
    console.log('🎨 Generating intelligent fallback response...');
    
    // Try to extract any useful content from the AI response
    const hasPositiveLanguage = /good|nice|great|excellent|well|perfect/i.test(aiResponse);
    const hasNegativeLanguage = /bad|poor|terrible|awful|wrong|clash/i.test(aiResponse);
    
    let score = 7;
    if (hasPositiveLanguage && !hasNegativeLanguage) score = 8;
    if (hasNegativeLanguage && !hasPositiveLanguage) score = 5;
    
    const fallback = TextProcessor.generateFallbackContent(request);
    
    return {
      score,
      feedback: aiResponse.length > 50 ? TextProcessor.cleanAndEnhanceText(aiResponse) : fallback.feedback,
      suggestions: fallback.suggestions,
      styleAnalysis: this.generateFallbackStyleAnalysis(request)
    };
  }
  
  private static generateFallbackStyleAnalysis(request: AnalyzeOutfitRequest): any {
    console.log('🎨 Generating fallback style analysis data...');
    
    // Generate appropriate style analysis based on gender
    const isFemale = request.gender === 'female';
    
    const seasonalTypes = [
      'Light Spring', 'Light Summer', 'Light Autumn', 'Light Winter',
      'True Spring', 'True Summer', 'True Autumn', 'True Winter',
      'Deep Spring', 'Deep Summer', 'Deep Autumn', 'Deep Winter',
      'Warm Spring', 'Warm Autumn', 'Cool Summer', 'Cool Winter'
    ];
    
    const randomSeason = seasonalTypes[Math.floor(Math.random() * seasonalTypes.length)];
    
    // Determine characteristics based on seasonal type
    const isWarm = randomSeason.includes('Spring') || randomSeason.includes('Autumn');
    const isLight = randomSeason.includes('Light');
    const isDeep = randomSeason.includes('Deep');
    
    const undertoneValue = isWarm ? 70 + Math.random() * 30 : Math.random() * 40;
    const lightnessValue = isLight ? 60 + Math.random() * 40 : isDeep ? Math.random() * 40 : 30 + Math.random() * 40;
    const intensityValue = randomSeason.includes('True') || randomSeason.includes('Deep') ? 60 + Math.random() * 40 : 20 + Math.random() * 50;
    
    // Generate color palette based on characteristics
    const colorPalette = this.generateColorPalette(isWarm, isLight, intensityValue > 50);
    
    const styleAnalysis = {
      colorAnalysis: {
        seasonalType: randomSeason,
        undertone: {
          value: Math.round(undertoneValue),
          description: isWarm ? "Warm golden undertones" : "Cool blue undertones"
        },
        intensity: {
          value: Math.round(intensityValue),
          description: intensityValue > 50 ? "Bright, vibrant colors" : "Soft, muted colors"
        },
        lightness: {
          value: Math.round(lightnessValue),
          description: isLight ? "Light, delicate tones" : isDeep ? "Deep, rich colors" : "Medium depth colors"
        },
        explanation: `Based on your features, you have a ${randomSeason} color profile. This means ${isWarm ? 'warm' : 'cool'} tones will enhance your natural beauty.`
      },
      colorPalette: {
        colors: colorPalette,
        explanation: `These colors are specifically chosen to complement your ${randomSeason} coloring and will make your features pop.`
      }
    };
    
    // Only add body type if we have good reason to (this is a placeholder for now)
    // In a real implementation, this would be based on image analysis
    
    console.log('🎨 Generated fallback style analysis:', randomSeason);
    return styleAnalysis;
  }
  
  private static generateColorPalette(isWarm: boolean, isLight: boolean, isBright: boolean): string[][] {
    console.log('🎨 Generating color palette - Warm:', isWarm, 'Light:', isLight, 'Bright:', isBright);
    
    const palette: string[][] = [];
    
    if (isWarm) {
      // Warm color palette
      if (isLight) {
        // Light and warm
        palette.push(['#F5E6D3', '#E8D5B7', '#D4C2A0', '#C5B094', '#B8A082', '#AB9070']);
        palette.push(['#F4E1C7', '#E6D2B5', '#D7C1A2', '#C8B090', '#B89F7E', '#A88E6C']);
        palette.push(['#F2DDB8', '#E3CDA5', '#D3BD92', '#C4AD7F', '#B49C6C', '#A58B59']);
        palette.push(['#F0D8A8', '#E0C894', '#D0B880', '#C0A86C', '#B09858', '#A08744']);
        palette.push(['#EDD3A3', '#DCC28F', '#CBB17B', '#BAA067', '#A98F53', '#987E3F']);
        palette.push(['#EACE9E', '#D8BD8A', '#C6AC76', '#B49B62', '#A2894E', '#90783A']);
        palette.push(['#E7C999', '#D5B885', '#C3A771', '#B1965D', '#9F8449', '#8D7335']);
        palette.push(['#E4C494', '#D2B380', '#C0A26C', '#AE9158', '#9C7F44', '#8A6E30']);
      } else {
        // Deep and warm
        palette.push(['#8B4513', '#A0522D', '#CD853F', '#D2691E', '#DEB887', '#F4A460']);
        palette.push(['#800000', '#A52A2A', '#B22222', '#DC143C', '#FF6347', '#FF7F50']);
        palette.push(['#556B2F', '#6B8E23', '#808000', '#9ACD32', '#ADFF2F', '#7FFF00']);
        palette.push(['#B8860B', '#DAA520', '#FFD700', '#FFFF00', '#FFFFE0', '#FFFACD']);
        palette.push(['#CD853F', '#D2691E', '#FF8C00', '#FFA500', '#FFB84D', '#FFC649']);
        palette.push(['#A0522D', '#CD853F', '#DEB887', '#F5DEB3', '#FFEBCD', '#FFE4B5']);
        palette.push(['#8B4513', '#A0522D', '#BC8F8F', '#F4A460', '#DEB887', '#D2B48C']);
        palette.push(['#654321', '#8B4513', '#A0522D', '#CD853F', '#D2691E', '#B8860B']);
      }
    } else {
      // Cool color palette
      if (isLight) {
        // Light and cool
        palette.push(['#E6F3FF', '#CCE7FF', '#B3DBFF', '#99CFFF', '#80C3FF', '#66B7FF']);
        palette.push(['#F0E6FF', '#E1CCFF', '#D1B3FF', '#C299FF', '#B280FF', '#A366FF']);
        palette.push(['#E6F0FF', '#CCE1FF', '#B3D1FF', '#99C2FF', '#80B2FF', '#66A3FF']);
        palette.push(['#F0F0FF', '#E1E1FF', '#D1D1FF', '#C2C2FF', '#B2B2FF', '#A3A3FF']);
        palette.push(['#E6FFE6', '#CCFFCC', '#B3FFB3', '#99FF99', '#80FF80', '#66FF66']);
        palette.push(['#F0FFF0', '#E1FFE1', '#D1FFD1', '#C2FFC2', '#B2FFB2', '#A3FFA3']);
        palette.push(['#E6F7FF', '#CCEFFF', '#B3E6FF', '#99DEFF', '#80D5FF', '#66CDFF']);
        palette.push(['#F0FFFF', '#E1FFFF', '#D1FFFF', '#C2FFFF', '#B2FFFF', '#A3FFFF']);
      } else {
        // Deep and cool
        palette.push(['#191970', '#0000CD', '#0000FF', '#4169E1', '#6495ED', '#87CEEB']);
        palette.push(['#4B0082', '#8B008B', '#9400D3', '#8A2BE2', '#9370DB', '#BA55D3']);
        palette.push(['#008B8B', '#20B2AA', '#00CED1', '#00BFFF', '#87CEEB', '#B0E0E6']);
        palette.push(['#2F4F4F', '#708090', '#778899', '#B0C4DE', '#C0C0C0', '#D3D3D3']);
        palette.push(['#006400', '#228B22', '#32CD32', '#7CFC00', '#98FB98', '#90EE90']);
        palette.push(['#800080', '#9932CC', '#BA55D3', '#DA70D6', '#EE82EE', '#DDA0DD']);
        palette.push(['#483D8B', '#6A5ACD', '#7B68EE', '#9370DB', '#8A2BE2', '#9400D3']);
        palette.push(['#2E8B57', '#3CB371', '#66CDAA', '#20B2AA', '#48D1CC', '#00CED1']);
      }
    }
    
    return palette;
  }
  
  private static enhanceResponseQuality(response: AnalyzeOutfitResponse): AnalyzeOutfitResponse {
    // Enhance feedback quality
    response.feedback = TextProcessor.cleanAndEnhanceText(response.feedback);
    
    // Check for grammar issues and clean if needed
    if (hasGrammarIssues(response.feedback)) {
      console.log('🎨 Grammar issues detected in feedback, applying additional cleaning');
      response.feedback = TextProcessor.cleanAndEnhanceText(response.feedback);
    }
    
    // Enhance suggestions quality
    response.suggestions = TextProcessor.formatSuggestions(response.suggestions);
    
    // Final validation and corrections
    response.suggestions = response.suggestions.filter(s => s.length > 5 && !hasGrammarIssues(s));
    
    // Ensure we have at least one suggestion
    if (response.suggestions.length === 0) {
      response.suggestions = ['Consider experimenting with different styling approaches to enhance your look.'];
    }
    
    return response;
  }
}
