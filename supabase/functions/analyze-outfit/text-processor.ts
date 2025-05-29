
import { AnalyzeOutfitRequest } from './types.ts';

export class TextProcessor {
  
  static cleanAndEnhanceText(text: string): string {
    if (!text) return '';
    
    let cleaned = text;
    
    // Remove malformed markdown
    cleaned = cleaned.replace(/\*\*:\*\*/g, ':');
    cleaned = cleaned.replace(/\*\*\s*\*\*/g, '');
    cleaned = cleaned.replace(/\*\*([^*]*)\*\*:/g, '**$1:**');
    
    // Fix spacing issues
    cleaned = cleaned.replace(/\s{2,}/g, ' ');
    cleaned = cleaned.replace(/\s+\./g, '.');
    cleaned = cleaned.replace(/\.\s*([a-z])/g, '. $1');
    
    // Fix capitalization after periods
    cleaned = cleaned.replace(/\.\s*([a-z])/g, (match, letter) => `. ${letter.toUpperCase()}`);
    
    // Remove duplicate words
    cleaned = cleaned.replace(/\b(\w+)\s+\1\b/gi, '$1');
    
    // Ensure sentences end with periods
    cleaned = cleaned.replace(/([a-zA-Z])\s*$/, '$1.');
    
    return cleaned.trim();
  }
  
  static formatSuggestions(suggestions: string[]): string[] {
    return suggestions.map(suggestion => {
      let formatted = this.cleanAndEnhanceText(suggestion);
      
      // Remove list markers
      formatted = formatted.replace(/^[\d\-\*]\s*/, '');
      
      // Remove section titles that shouldn't be in suggestions
      formatted = formatted.replace(/^(Improvement|Suggestions?|Style):?\s*/i, '');
      
      // Ensure proper capitalization
      formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
      
      // Ensure it ends with a period
      if (formatted && !formatted.endsWith('.') && !formatted.endsWith('!') && !formatted.endsWith('?')) {
        formatted += '.';
      }
      
      return formatted;
    }).filter(s => s.length > 5);
  }
  
  static extractStructuredFeedback(rawText: string): { [key: string]: string } {
    const sections: { [key: string]: string } = {};
    
    // Define section patterns with proper global flags for matchAll
    const patterns = [
      { key: 'style', pattern: /(?:\*\*)?Style(?:\*\*)?:?\s*(.*?)(?=(?:\*\*)?(?:Color|Fit|Overall|$))/gis },
      { key: 'color', pattern: /(?:\*\*)?(?:Color Coordination|Color)(?:\*\*)?:?\s*(.*?)(?=(?:\*\*)?(?:Style|Fit|Overall|$))/gis },
      { key: 'fit', pattern: /(?:\*\*)?Fit(?:\*\*)?:?\s*(.*?)(?=(?:\*\*)?(?:Style|Color|Overall|$))/gis },
      { key: 'overall', pattern: /(?:\*\*)?(?:Overall Impression|Overall)(?:\*\*)?:?\s*(.*?)(?=(?:\*\*)?(?:Style|Color|Fit|$))/gis }
    ];
    
    patterns.forEach(({ key, pattern }) => {
      const matches = [...rawText.matchAll(pattern)];
      if (matches.length > 0 && matches[0][1]) {
        sections[key] = this.cleanAndEnhanceText(matches[0][1].trim());
      }
    });
    
    return sections;
  }
  
  static rebuildFeedbackFromSections(sections: { [key: string]: string }): string {
    const sectionTitles = {
      style: 'Style',
      color: 'Color Coordination', 
      fit: 'Fit',
      overall: 'Overall Impression'
    };
    
    const orderedSections = ['style', 'color', 'fit', 'overall'];
    const rebuilt: string[] = [];
    
    orderedSections.forEach(key => {
      if (sections[key]) {
        rebuilt.push(`**${sectionTitles[key]}:** ${sections[key]}`);
      }
    });
    
    return rebuilt.join('\n\n');
  }
  
  static generateFallbackContent(request: AnalyzeOutfitRequest): { feedback: string; suggestions: string[] } {
    const { eventContext, isNeutral, gender } = request;
    
    const contextText = eventContext && !isNeutral ? ` for ${eventContext}` : '';
    
    const feedback = `**Style:** This outfit shows good fashion sense${contextText}. The overall composition works well together.

**Color Coordination:** The color choices complement each other nicely and create a cohesive look.

**Fit:** The garments appear to fit well and flatter your silhouette.

**Overall Impression:** This is a solid outfit choice${contextText} that demonstrates good style awareness.`;

    const suggestions = [
      `Consider adding a statement accessory to elevate the look${contextText}.`,
      `Try experimenting with different textures to add visual interest.`,
      `A small adjustment to the proportions could enhance the overall silhouette.`
    ];
    
    return { feedback, suggestions };
  }
}
