
import { WardrobeItem } from '@/services/wardrobe';

export interface ClothingItem {
  id: string;
  name: string;
  category: string;
  confidence: number;
  source: string;
  outfitId: string;
  outfitDate: string;
  outfitScore: number;
  originalImageUrl?: string;
  renderImageUrl?: string;
  arrayIndex: number;
}

// Type guard to check if extracted_clothing_items is an array
export const isClothingItemsArray = (items: any): items is any[] => {
  return Array.isArray(items);
};

export const processWardrobeItems = (wardrobeItems: WardrobeItem[]): ClothingItem[] => {
  const items: ClothingItem[] = [];
  
  console.log('Processing wardrobe items:', wardrobeItems.length);
  
  wardrobeItems.forEach((outfit, outfitIndex) => {
    console.log(`Processing outfit ${outfitIndex + 1}:`, {
      id: outfit.id,
      hasExtractedItems: !!outfit.extracted_clothing_items,
      originalImageUrl: outfit.image_url,
      extractedItemsType: typeof outfit.extracted_clothing_items
    });

    if (outfit.extracted_clothing_items && isClothingItemsArray(outfit.extracted_clothing_items)) {
      outfit.extracted_clothing_items.forEach((item: any, index: number) => {
        const clothingItem: ClothingItem = {
          id: `${outfit.id}::${index}`,
          name: item.name || 'Unknown Item',
          category: item.category || 'other',
          confidence: item.confidence || 0.8,
          source: item.source || 'ai',
          outfitId: outfit.id,
          outfitDate: outfit.created_at,
          outfitScore: outfit.rating_score || 0,
          originalImageUrl: outfit.image_url,
          renderImageUrl: item.renderImageUrl || null,
          arrayIndex: index
        };

        items.push(clothingItem);
        console.log(`✅ Added clothing item "${item.name}" with render image: ${item.renderImageUrl || 'none'}`);
      });
    }
  });
  
  console.log(`Total clothing items extracted: ${items.length}`);
  console.log(`Items with AI render images: ${items.filter(item => item.renderImageUrl).length}`);
  
  return items;
};

export const getUniqueCategories = (items: ClothingItem[]): string[] => {
  const uniqueCategories = [...new Set(items.map(item => item.category))];
  return uniqueCategories.sort();
};

export const filterAndSortItems = (
  items: ClothingItem[],
  searchTerm: string,
  filterCategory: string,
  sortBy: string
): ClothingItem[] => {
  let filtered = items;

  // Filter by search term
  if (searchTerm) {
    filtered = filtered.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  // Filter by category
  if (filterCategory !== 'all') {
    filtered = filtered.filter(item => item.category === filterCategory);
  }

  // Sort items
  filtered.sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'category':
        return a.category.localeCompare(b.category);
      case 'date':
        return new Date(b.outfitDate).getTime() - new Date(a.outfitDate).getTime();
      case 'score':
        return b.outfitScore - a.outfitScore;
      default:
        return 0;
    }
  });

  return filtered;
};
