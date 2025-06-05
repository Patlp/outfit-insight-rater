
import { getFashionWhitelist } from '../fashionWhitelistService';
import { categorizeClothingItem } from '@/utils/clothingExtractor';
import { AIClothingItem } from './types';

export const convertRegexToAIFormat = async (regexItems: string[]): Promise<AIClothingItem[]> => {
  console.log(`Converting ${regexItems.length} regex items to AI format...`);
  
  try {
    // Get the fashion whitelist for validation
    const { data: whitelistData, error } = await getFashionWhitelist();
    if (error || !whitelistData) {
      console.warn('Could not fetch fashion whitelist, using basic conversion');
      // Fallback to basic conversion without whitelist validation
      return regexItems.map(item => ({
        name: item,
        descriptors: [],
        category: categorizeClothingItem(item),
        confidence: 0.7 // Medium confidence for regex-based extraction
      }));
    }

    const validatedItems: AIClothingItem[] = [];

    for (const regexItem of regexItems) {
      const lowerItem = regexItem.toLowerCase();
      
      // Find matching whitelist item
      const matchingWhitelistItem = whitelistData.find(whitelistItem => 
        lowerItem.includes(whitelistItem.item_name.toLowerCase()) ||
        whitelistItem.item_name.toLowerCase().includes(lowerItem)
      );

      if (matchingWhitelistItem) {
        // Extract descriptors (words before the main item name)
        const itemName = matchingWhitelistItem.item_name.toLowerCase();
        const itemIndex = lowerItem.indexOf(itemName);
        const descriptorsPart = itemIndex > 0 ? lowerItem.substring(0, itemIndex).trim() : '';
        const descriptors = descriptorsPart ? descriptorsPart.split(/\s+/).filter(d => d.length > 0) : [];

        validatedItems.push({
          name: regexItem, // Keep original formatting
          descriptors: descriptors,
          category: matchingWhitelistItem.category,
          confidence: 0.8 // High confidence since validated against whitelist
        });
      } else {
        // Item not in whitelist, use basic categorization
        validatedItems.push({
          name: regexItem,
          descriptors: [],
          category: categorizeClothingItem(regexItem),
          confidence: 0.6 // Lower confidence for non-whitelist items
        });
      }
    }

    console.log(`Validated ${validatedItems.length} items against whitelist`);
    return validatedItems.slice(0, 6); // Limit to 6 items

  } catch (error) {
    console.error('Error converting regex items:', error);
    // Fallback to basic conversion
    return regexItems.map(item => ({
      name: item,
      descriptors: [],
      category: categorizeClothingItem(item),
      confidence: 0.7
    }));
  }
};
