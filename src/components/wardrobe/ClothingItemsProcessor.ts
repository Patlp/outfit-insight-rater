
import { WardrobeItem } from '@/services/wardrobe';

// ClothingItem interface for individual clothing items in the wardrobe
export interface ClothingItem {
  id: string; // Format: "wardrobeItemId::arrayIndex"
  name: string;
  category?: string;
  descriptors?: string[];
  confidence?: number;
  renderImageUrl?: string;
  renderImageProvider?: string;
  renderImageGeneratedAt?: string;
  croppedImageUrl?: string;
  originalImageUrl?: string;
  outfitId: string;
  outfitImageUrl?: string;
  outfitRating?: number;
  outfitFeedback?: string;
  createdAt: string;
  imageType?: string;
  contextualProcessing?: boolean;
  accuracyLevel?: string;
  [key: string]: any;
}

// Type guard to check if data is an array of clothing items
export const isClothingItemsArray = (data: any): data is any[] => {
  return Array.isArray(data);
};

// Process wardrobe items to extract all individual clothing items
export const processWardrobeItems = (wardrobeItems: WardrobeItem[]): ClothingItem[] => {
  console.log('🔄 Processing wardrobe items for clothing extraction:', wardrobeItems.length);
  
  const allClothingItems: ClothingItem[] = [];

  wardrobeItems.forEach((wardrobeItem) => {
    if (!wardrobeItem.extracted_clothing_items || !isClothingItemsArray(wardrobeItem.extracted_clothing_items)) {
      console.log(`⚠️ Skipping wardrobe item ${wardrobeItem.id} - no valid extracted clothing items`);
      return;
    }

    console.log(`📋 Processing ${wardrobeItem.extracted_clothing_items.length} clothing items from outfit ${wardrobeItem.id}`);

    wardrobeItem.extracted_clothing_items.forEach((clothingItem: any, index: number) => {
      if (!clothingItem?.name) {
        console.log(`⚠️ Skipping clothing item at index ${index} - no name`);
        return;
      }

      const processedItem: ClothingItem = {
        id: `${wardrobeItem.id}::${index}`,
        name: clothingItem.name,
        category: clothingItem.category || 'uncategorized',
        descriptors: clothingItem.descriptors || [],
        confidence: clothingItem.confidence || 0,
        renderImageUrl: clothingItem.renderImageUrl,
        renderImageProvider: clothingItem.renderImageProvider,
        renderImageGeneratedAt: clothingItem.renderImageGeneratedAt,
        croppedImageUrl: clothingItem.croppedImageUrl,
        originalImageUrl: wardrobeItem.image_url,
        outfitId: wardrobeItem.id,
        outfitImageUrl: wardrobeItem.image_url,
        outfitRating: wardrobeItem.rating_score,
        outfitFeedback: wardrobeItem.feedback,
        createdAt: wardrobeItem.created_at || new Date().toISOString(),
        imageType: clothingItem.imageType || 'original',
        contextualProcessing: clothingItem.contextualProcessing || false,
        accuracyLevel: clothingItem.accuracyLevel || 'standard',
        // Copy any additional properties
        ...clothingItem
      };

      console.log(`✅ Processed clothing item: "${processedItem.name}" (${processedItem.id})`);
      allClothingItems.push(processedItem);
    });
  });

  console.log(`📊 Total processed clothing items: ${allClothingItems.length}`);
  return allClothingItems;
};

// Get unique categories from clothing items
export const getUniqueCategories = (clothingItems: ClothingItem[]): string[] => {
  const categories = new Set<string>();
  
  clothingItems.forEach(item => {
    if (item.category) {
      categories.add(item.category);
    }
  });

  const sortedCategories = Array.from(categories).sort();
  console.log('📂 Unique categories found:', sortedCategories);
  
  return ['all', ...sortedCategories];
};

// Filter and sort clothing items
export const filterAndSortItems = (
  clothingItems: ClothingItem[],
  searchTerm: string,
  filterCategory: string,
  sortBy: string
): ClothingItem[] => {
  console.log(`🔍 Filtering ${clothingItems.length} items with search: "${searchTerm}", category: "${filterCategory}", sort: "${sortBy}"`);
  
  let filtered = clothingItems;

  // Apply search filter
  if (searchTerm.trim()) {
    const searchLower = searchTerm.toLowerCase().trim();
    filtered = filtered.filter(item => {
      const nameMatch = item.name.toLowerCase().includes(searchLower);
      const categoryMatch = item.category?.toLowerCase().includes(searchLower);
      const descriptorMatch = item.descriptors?.some(desc => 
        desc.toLowerCase().includes(searchLower)
      );
      
      return nameMatch || categoryMatch || descriptorMatch;
    });
  }

  // Apply category filter
  if (filterCategory !== 'all') {
    filtered = filtered.filter(item => item.category === filterCategory);
  }

  // Apply sorting
  switch (sortBy) {
    case 'name':
      filtered.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'category':
      filtered.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
      break;
    case 'date':
    default:
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
  }

  console.log(`📊 Filtered results: ${filtered.length} items`);
  return filtered;
};

// Helper function to get the best available image URL for display
export const getBestImageUrl = (item: ClothingItem): string | undefined => {
  // Priority: Context-aware AI > Enhanced AI > Regular AI > Cropped > Original
  if (item.renderImageUrl) {
    return item.renderImageUrl;
  }
  
  if (item.croppedImageUrl) {
    return item.croppedImageUrl;
  }
  
  return item.originalImageUrl;
};

// Helper function to determine if an item has AI-generated images
export const hasAIGeneratedImage = (item: ClothingItem): boolean => {
  return !!item.renderImageUrl;
};

// Helper function to get image generation status
export const getImageGenerationStatus = (item: ClothingItem): {
  hasImage: boolean;
  isAIGenerated: boolean;
  isContextAware: boolean;
  provider?: string;
  accuracy?: string;
} => {
  const hasImage = !!item.renderImageUrl;
  const isAIGenerated = hasImage;
  const isContextAware = item.renderImageProvider?.includes('context_aware') || false;
  
  return {
    hasImage,
    isAIGenerated,
    isContextAware,
    provider: item.renderImageProvider,
    accuracy: item.accuracyLevel
  };
};
