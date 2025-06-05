
import { getFashionWhitelist } from './fashionWhitelistService';
import { searchKaggleClothingItems, KaggleClothingItem } from './kaggleClothingService';
import { AIClothingItem } from './clothingExtractionService';
import { categorizeClothingItem } from '@/utils/clothingExtractor';

export interface EnhancedClothingMatch {
  name: string;
  descriptors: string[];
  category: string;
  confidence: number;
  source: 'whitelist' | 'kaggle' | 'hybrid';
  kaggleMatch?: KaggleClothingItem;
  whitelistMatch?: any;
}

export const enhancedClothingMatcher = async (
  extractedText: string,
  gender: string = 'neutral'
): Promise<EnhancedClothingMatch[]> => {
  console.log('=== ENHANCED CLOTHING MATCHER START ===');
  console.log(`Input text: "${extractedText}"`);
  console.log(`Gender: ${gender}`);

  const matches: EnhancedClothingMatch[] = [];
  const words = extractedText.toLowerCase().split(/\s+/);
  const processedItems = new Set<string>(); // Prevent duplicates

  try {
    // Step 1: Get fashion whitelist data
    const { data: whitelistData, error: whitelistError } = await getFashionWhitelist();
    if (whitelistError) {
      console.warn('Could not fetch fashion whitelist:', whitelistError);
    }

    // Step 2: Search Kaggle dataset for potential matches
    const { data: kaggleMatches, error: kaggleError } = await searchKaggleClothingItems(extractedText, gender);
    if (kaggleError) {
      console.warn('Could not search Kaggle dataset:', kaggleError);
    }

    console.log(`Found ${kaggleMatches?.length || 0} Kaggle matches`);
    console.log(`Found ${whitelistData?.length || 0} whitelist items`);

    // Step 3: Process Kaggle matches first (higher priority due to real product data)
    if (kaggleMatches && kaggleMatches.length > 0) {
      for (const kaggleItem of kaggleMatches.slice(0, 3)) { // Limit to top 3 Kaggle matches
        const normalizedName = kaggleItem.normalized_name || kaggleItem.product_name.toLowerCase();
        
        if (processedItems.has(normalizedName)) continue;
        processedItems.add(normalizedName);

        // Extract descriptors from the product name
        const descriptors = extractDescriptorsFromKaggleItem(kaggleItem, extractedText);
        
        matches.push({
          name: kaggleItem.product_name,
          descriptors,
          category: kaggleItem.category || categorizeClothingItem(kaggleItem.product_name),
          confidence: calculateKaggleConfidence(kaggleItem, extractedText),
          source: 'kaggle',
          kaggleMatch: kaggleItem
        });
      }
    }

    // Step 4: Process whitelist matches to fill gaps
    if (whitelistData && matches.length < 5) {
      for (const whitelistItem of whitelistData.slice(0, 3)) {
        const itemName = whitelistItem.item_name.toLowerCase();
        
        if (processedItems.has(itemName)) continue;
        
        // Check if this whitelist item is mentioned in the text
        const isItemMentioned = words.some(word => 
          itemName.includes(word) || word.includes(itemName)
        );
        
        if (isItemMentioned) {
          processedItems.add(itemName);
          
          const descriptors = extractDescriptorsFromText(extractedText, whitelistItem.item_name);
          
          matches.push({
            name: whitelistItem.item_name,
            descriptors,
            category: whitelistItem.category,
            confidence: 0.8,
            source: 'whitelist',
            whitelistMatch: whitelistItem
          });
        }
      }
    }

    // Step 5: Create hybrid matches if we have both sources
    const hybridMatches = createHybridMatches(matches);
    
    // Combine and sort by confidence
    const allMatches = [...matches, ...hybridMatches]
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 6); // Limit to 6 items

    console.log(`=== ENHANCED MATCHING COMPLETE ===`);
    console.log(`Total matches found: ${allMatches.length}`);
    allMatches.forEach((match, index) => {
      console.log(`${index + 1}. ${match.name} (${match.source}, confidence: ${match.confidence})`);
    });

    return allMatches;

  } catch (error) {
    console.error('Error in enhanced clothing matcher:', error);
    return [];
  }
};

const extractDescriptorsFromKaggleItem = (kaggleItem: KaggleClothingItem, originalText: string): string[] => {
  const descriptors: string[] = [];
  
  // Add color if available
  if (kaggleItem.color) {
    descriptors.push(kaggleItem.color.toLowerCase());
  }
  
  // Add material if available
  if (kaggleItem.material && kaggleItem.material !== 'unknown') {
    descriptors.push(kaggleItem.material.toLowerCase());
  }
  
  // Add brand if mentioned in original text
  if (kaggleItem.brand && originalText.toLowerCase().includes(kaggleItem.brand.toLowerCase())) {
    descriptors.push(kaggleItem.brand.toLowerCase());
  }
  
  // Extract additional descriptors from the original text
  const textDescriptors = extractDescriptorsFromText(originalText, kaggleItem.product_name);
  descriptors.push(...textDescriptors);
  
  return [...new Set(descriptors)]; // Remove duplicates
};

const extractDescriptorsFromText = (text: string, itemName: string): string[] => {
  const words = text.toLowerCase().split(/\s+/);
  const itemWords = itemName.toLowerCase().split(/\s+/);
  const descriptors: string[] = [];
  
  // Common color words
  const colors = ['black', 'white', 'blue', 'red', 'green', 'yellow', 'pink', 'purple', 'brown', 'gray', 'grey', 'navy', 'beige', 'cream'];
  
  // Common style descriptors
  const styles = ['casual', 'formal', 'vintage', 'modern', 'classic', 'fitted', 'loose', 'oversized', 'slim', 'wide', 'narrow', 'long', 'short'];
  
  for (const word of words) {
    if (!itemWords.includes(word) && word.length > 2) {
      if (colors.includes(word) || styles.includes(word)) {
        descriptors.push(word);
      }
    }
  }
  
  return descriptors;
};

const calculateKaggleConfidence = (kaggleItem: KaggleClothingItem, originalText: string): number => {
  let confidence = 0.85; // Base confidence for Kaggle matches
  
  // Boost confidence if product name closely matches
  const productWords = kaggleItem.product_name.toLowerCase().split(/\s+/);
  const textWords = originalText.toLowerCase().split(/\s+/);
  const matchingWords = productWords.filter(word => textWords.includes(word));
  
  if (matchingWords.length > 0) {
    confidence += (matchingWords.length / productWords.length) * 0.1;
  }
  
  // Boost confidence for high-rated items
  if (kaggleItem.rating && kaggleItem.rating > 4.0) {
    confidence += 0.05;
  }
  
  return Math.min(confidence, 0.98); // Cap at 0.98
};

const createHybridMatches = (matches: EnhancedClothingMatch[]): EnhancedClothingMatch[] => {
  const hybridMatches: EnhancedClothingMatch[] = [];
  
  // Look for opportunities to create hybrid matches
  const kaggleMatches = matches.filter(m => m.source === 'kaggle');
  const whitelistMatches = matches.filter(m => m.source === 'whitelist');
  
  for (const kaggleMatch of kaggleMatches) {
    for (const whitelistMatch of whitelistMatches) {
      // Check if they represent similar items
      const kaggleCategory = kaggleMatch.category?.toLowerCase();
      const whitelistCategory = whitelistMatch.category?.toLowerCase();
      
      if (kaggleCategory === whitelistCategory && hybridMatches.length < 2) {
        hybridMatches.push({
          name: `${kaggleMatch.name}`,
          descriptors: [...new Set([...kaggleMatch.descriptors, ...whitelistMatch.descriptors])],
          category: kaggleMatch.category,
          confidence: Math.max(kaggleMatch.confidence, whitelistMatch.confidence) + 0.05,
          source: 'hybrid',
          kaggleMatch: kaggleMatch.kaggleMatch,
          whitelistMatch: whitelistMatch.whitelistMatch
        });
      }
    }
  }
  
  return hybridMatches;
};

// Convert enhanced matches to AI clothing items format
export const convertToAIClothingItems = (matches: EnhancedClothingMatch[]): AIClothingItem[] => {
  return matches.map(match => ({
    name: match.name,
    descriptors: match.descriptors,
    category: match.category,
    confidence: match.confidence,
    source: match.source,
    kaggleData: match.kaggleMatch,
    whitelistData: match.whitelistMatch
  }));
};
