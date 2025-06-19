
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
  source: string;
  outfitDate: string;
  outfitScore: number;
  arrayIndex: number;
  description?: string;
  [key: string]: any;
}

// Type for extracted clothing items that includes the original image URL
export interface ExtractedClothingItem {
  id?: string;
  name: string;
  category?: string;
  descriptors?: string[];
  confidence?: number;
  renderImageUrl?: string;
  renderImageProvider?: string;
  renderImageGeneratedAt?: string;
  croppedImageUrl?: string;
  originalImageUrl?: string;
  imageType?: string;
  contextualProcessing?: boolean;
  accuracyLevel?: string;
  description?: string;
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
    console.log(`📸 Original outfit image URL: ${wardrobeItem.image_url}`);

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
        source: 'wardrobe',
        outfitDate: wardrobeItem.created_at || new Date().toISOString(),
        outfitScore: wardrobeItem.rating_score || 0,
        arrayIndex: index,
        description: clothingItem.description,
        // Copy any additional properties
        ...clothingItem
      };

      // Log whether this item already has a persisted AI image
      if (processedItem.renderImageUrl) {
        console.log(`✅ Item "${processedItem.name}" has existing AI image: ${processedItem.renderImageUrl}`);
      } else {
        console.log(`⚠️ Item "${processedItem.name}" needs AI image generation`);
      }

      console.log(`✅ Processed clothing item: "${processedItem.name}" (${processedItem.id}) with original image: ${processedItem.originalImageUrl}`);
      allClothingItems.push(processedItem);
    });
  });

  console.log(`📊 Total processed clothing items: ${allClothingItems.length}`);
  
  // Log summary of AI image status
  const itemsWithAI = allClothingItems.filter(item => item.renderImageUrl).length;
  const itemsNeedingAI = allClothingItems.length - itemsWithAI;
  console.log(`🎨 AI Image Status: ${itemsWithAI} items have existing AI images, ${itemsNeedingAI} items need generation`);
  
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
  // Priority: AI-generated > Cropped > Original
  if (item.renderImageUrl) {
    console.log(`🎨 Using AI-generated image for "${item.name}": ${item.renderImageUrl}`);
    return item.renderImageUrl;
  }
  
  if (item.croppedImageUrl) {
    console.log(`✂️ Using cropped image for "${item.name}": ${item.croppedImageUrl}`);
    return item.croppedImageUrl;
  }
  
  console.log(`📷 Using original image for "${item.name}": ${item.originalImageUrl}`);
  return item.originalImageUrl;
};

// Helper function to determine if an item has AI-generated images
export const hasAIGeneratedImage = (item: ClothingItem): boolean => {
  return !!item.renderImageUrl;
};

// Helper function to check if item needs AI generation (doesn't already have one)
export const needsAIGeneration = (item: ClothingItem): boolean => {
  return !item.renderImageUrl && !!item.name;
};

// Helper function to get image generation status
export const getImageGenerationStatus = (item: ClothingItem): {
  hasImage: boolean;
  isAIGenerated: boolean;
  isContextAware: boolean;
  provider?: string;
  accuracy?: string;
  generatedAt?: string;
} => {
  const hasImage = !!item.renderImageUrl;
  const isAIGenerated = hasImage;
  const isContextAware = item.renderImageProvider?.includes('context_aware') || false;
  
  return {
    hasImage,
    isAIGenerated,
    isContextAware,
    provider: item.renderImageProvider,
    accuracy: item.accuracyLevel,
    generatedAt: item.renderImageGeneratedAt
  };
};

// Helper function to check if AI image is persisted and still valid
export const isAIImagePersisted = (item: ClothingItem): boolean => {
  if (!item.renderImageUrl || !item.renderImageGeneratedAt) {
    return false;
  }
  
  // Check if the image was generated recently enough to be considered valid
  const generatedAt = new Date(item.renderImageGeneratedAt);
  const now = new Date();
  const daysDiff = (now.getTime() - generatedAt.getTime()) / (1000 * 60 * 60 * 24);
  
  // Consider images valid for 30 days
  const isValid = daysDiff <= 30;
  
  if (isValid) {
    console.log(`✅ AI image for "${item.name}" is persisted and valid (generated ${daysDiff.toFixed(1)} days ago)`);
  } else {
    console.log(`⚠️ AI image for "${item.name}" is expired (generated ${daysDiff.toFixed(1)} days ago)`);
  }
  
  return isValid;
};
