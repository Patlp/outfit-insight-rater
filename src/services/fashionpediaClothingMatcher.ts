
import { searchFashionpediaCategories, getFashionpediaCategories } from './fashionpediaService';
import { categorizeClothingItem } from '@/utils/clothingExtractor';

export interface FashionpediaMatch {
  name: string;
  category: string;
  description?: string;
  confidence: number;
  source: 'fashionpedia';
  fashionpediaData: any;
}

export const fashionpediaClothingMatcher = async (
  extractedText: string,
  limitResults: number = 5
): Promise<FashionpediaMatch[]> => {
  console.log('=== FASHIONPEDIA CLOTHING MATCHER START ===');
  console.log(`Input text: "${extractedText}"`);

  const matches: FashionpediaMatch[] = [];
  
  try {
    // First, try searching with the full extracted text
    const { data: searchResults, error: searchError } = await searchFashionpediaCategories(extractedText);
    
    if (searchError) {
      console.warn('Error searching Fashionpedia categories:', searchError);
      return [];
    }

    if (searchResults && searchResults.length > 0) {
      console.log(`Found ${searchResults.length} direct search matches`);
      
      for (const result of searchResults.slice(0, limitResults)) {
        matches.push({
          name: result.category_name,
          category: categorizeClothingItem(result.category_name),
          description: result.description,
          confidence: calculateMatchConfidence(extractedText, result.category_name, result.description),
          source: 'fashionpedia',
          fashionpediaData: result
        });
      }
    }

    // If we don't have enough matches, try word-by-word matching
    if (matches.length < limitResults) {
      const words = extractedText.toLowerCase().split(/\s+/).filter(word => word.length > 2);
      
      for (const word of words) {
        if (matches.length >= limitResults) break;
        
        const { data: wordResults } = await searchFashionpediaCategories(word);
        
        if (wordResults && wordResults.length > 0) {
          for (const result of wordResults.slice(0, 2)) {
            // Avoid duplicates
            if (!matches.some(m => m.name === result.category_name)) {
              matches.push({
                name: result.category_name,
                category: categorizeClothingItem(result.category_name),
                description: result.description,
                confidence: calculateMatchConfidence(word, result.category_name, result.description) * 0.8, // Lower confidence for word matches
                source: 'fashionpedia',
                fashionpediaData: result
              });
              
              if (matches.length >= limitResults) break;
            }
          }
        }
      }
    }

    // Sort by confidence and return top results
    const sortedMatches = matches
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limitResults);

    console.log(`=== FASHIONPEDIA MATCHING COMPLETE ===`);
    console.log(`Total matches found: ${sortedMatches.length}`);
    sortedMatches.forEach((match, index) => {
      console.log(`${index + 1}. ${match.name} (confidence: ${match.confidence.toFixed(2)})`);
    });

    return sortedMatches;

  } catch (error) {
    console.error('Error in Fashionpedia clothing matcher:', error);
    return [];
  }
};

const calculateMatchConfidence = (searchTerm: string, categoryName: string, description?: string): number => {
  let confidence = 0.3; // Base confidence
  
  const searchWords = searchTerm.toLowerCase().split(/\s+/);
  const categoryWords = categoryName.toLowerCase().split(/\s+/);
  const descWords = description ? description.toLowerCase().split(/\s+/) : [];
  
  // Exact match boost
  if (searchTerm.toLowerCase() === categoryName.toLowerCase()) {
    confidence += 0.6;
  }
  
  // Word overlap boost
  const commonWords = searchWords.filter(word => 
    categoryWords.includes(word) || descWords.includes(word)
  );
  
  if (commonWords.length > 0) {
    confidence += (commonWords.length / searchWords.length) * 0.4;
  }
  
  // Category name length penalty (prefer shorter, more specific terms)
  if (categoryName.length > 30) {
    confidence -= 0.1;
  }
  
  // Description relevance boost
  if (description && searchWords.some(word => description.toLowerCase().includes(word))) {
    confidence += 0.1;
  }
  
  return Math.max(0.1, Math.min(0.95, confidence));
};
