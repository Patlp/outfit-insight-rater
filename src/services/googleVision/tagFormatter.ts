
import { GoogleVisionLabel, COLOR_DESCRIPTORS, STYLE_DESCRIPTORS } from './labelProcessor';
import { getFashionWhitelist } from '../fashionWhitelistService';
import { AIClothingItem } from '../clothing/types';
import { validateTagStructure, formatTagName } from '../tagging/grammarValidation';

export const formatClothingTagsWithGrammar = async (clothingLabels: GoogleVisionLabel[]): Promise<AIClothingItem[]> => {
  console.log('=== APPLYING STRICT GRAMMAR RULES TO TAGS ===');
  console.log('Processing labels with 2-word max and grammar validation...');
  
  const { data: whitelistData } = await getFashionWhitelist();
  const whitelist = whitelistData || [];
  
  const formattedTags: AIClothingItem[] = [];
  const usedItems = new Set<string>();

  for (const label of clothingLabels) {
    if (formattedTags.length >= 6) break;
    
    const description = label.description.toLowerCase();
    
    // Find matching whitelist item
    const whitelistMatch = whitelist.find(item => 
      description.includes(item.item_name.toLowerCase()) ||
      item.item_name.toLowerCase().includes(description)
    );
    
    if (whitelistMatch) {
      const itemKey = whitelistMatch.item_name.toLowerCase();
      if (!usedItems.has(itemKey)) {
        
        // Extract primary descriptor with strict rules
        let primaryDescriptor: string | null = null;
        
        // Look for color descriptors first
        const colorMatch = clothingLabels.find(l => 
          COLOR_DESCRIPTORS.some(color => l.description.toLowerCase().includes(color))
        );
        if (colorMatch && !primaryDescriptor) {
          const color = COLOR_DESCRIPTORS.find(c => colorMatch.description.toLowerCase().includes(c));
          if (color) primaryDescriptor = color;
        }
        
        // Look for style descriptors if no color found
        if (!primaryDescriptor) {
          const styleMatch = clothingLabels.find(l => 
            STYLE_DESCRIPTORS.some(style => l.description.toLowerCase().includes(style))
          );
          if (styleMatch) {
            const style = STYLE_DESCRIPTORS.find(s => styleMatch.description.toLowerCase().includes(s));
            if (style) primaryDescriptor = style;
          }
        }
        
        // Apply strict grammar formatting
        const formattedName = formatTagName(primaryDescriptor, whitelistMatch.item_name);
        
        // Validate the final tag structure
        const validation = validateTagStructure(formattedName);
        
        if (validation.isValid) {
          console.log(`✅ Grammar-valid tag: "${formattedName}"`);
          
          formattedTags.push({
            name: formattedName,
            descriptors: primaryDescriptor ? [primaryDescriptor] : [],
            category: whitelistMatch.category,
            confidence: label.score * 0.95, // Slight boost for grammar compliance
            source: 'google-vision-grammar'
          });
          
          usedItems.add(itemKey);
        } else {
          console.log(`❌ Grammar validation failed for "${formattedName}": ${validation.errors.join(', ')}`);
          
          // Try using corrected version if available
          if (validation.correctedTag) {
            const correctedValidation = validateTagStructure(validation.correctedTag);
            if (correctedValidation.isValid) {
              console.log(`✅ Using corrected tag: "${validation.correctedTag}"`);
              
              formattedTags.push({
                name: validation.correctedTag,
                descriptors: primaryDescriptor ? [primaryDescriptor] : [],
                category: whitelistMatch.category,
                confidence: label.score * 0.85, // Lower confidence for corrected tags
                source: 'google-vision-corrected'
              });
              
              usedItems.add(itemKey);
            }
          }
        }
      }
    }
  }
  
  // Final grammar enforcement
  const grammarValidatedTags = formattedTags.filter(tag => {
    const validation = validateTagStructure(tag.name);
    if (!validation.isValid) {
      console.log(`🚫 Final filter rejected: "${tag.name}" - ${validation.errors.join(', ')}`);
      return false;
    }
    return true;
  });
  
  console.log(`=== GRAMMAR VALIDATION COMPLETE ===`);
  console.log(`Original labels: ${clothingLabels.length}`);
  console.log(`Formatted tags: ${formattedTags.length}`);
  console.log(`Grammar-validated tags: ${grammarValidatedTags.length}`);
  
  return grammarValidatedTags;
};
