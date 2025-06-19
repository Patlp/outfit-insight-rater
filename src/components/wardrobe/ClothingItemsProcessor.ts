
import { WardrobeItem } from '@/services/wardrobe';

export interface ClothingItem {
  id: string;
  name: string;
  category: string;
  descriptors?: string[]; // Add this field
  color?: string;
  brand?: string;
  material?: string;
  style?: string;
  size?: string;
  description?: string;
  tags?: string[];
  renderImageUrl?: string;
  originalImageUrl?: string;
  croppedImageUrl?: string;
  boundingBox?: any;
  confidence?: number;
  contextualProcessing?: boolean;
  accuracyLevel?: string;
  imageType?: string;
  croppingConfidence?: number;
  outfitId: string;
  outfitRating?: number; // Add this field
  arrayIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExtractedClothingItem {
  name: string;
  category?: string;
  descriptors?: string[];
  color?: string;
  brand?: string;
  material?: string;
  style?: string;
  size?: string;
  description?: string;
  tags?: string[];
  renderImageUrl?: string;
  originalImageUrl?: string;
  croppedImageUrl?: string;
  boundingBox?: any;
  confidence?: number;
  contextualProcessing?: boolean;
  accuracyLevel?: string;
  imageType?: string;
  croppingConfidence?: number;
  [key: string]: any; // Add index signature for Json compatibility
}

export const isClothingItemsArray = (items: any): items is ExtractedClothingItem[] => {
  return Array.isArray(items) && items.every(item => 
    typeof item === 'object' && 
    item !== null && 
    typeof item.name === 'string'
  );
};

export const processWardrobeItems = (wardrobeItems: WardrobeItem[]): ClothingItem[] => {
  console.log('🔄 Processing wardrobe items for clothing extraction...');
  
  const allClothingItems: ClothingItem[] = [];
  
  wardrobeItems.forEach((wardrobeItem) => {
    console.log(`📋 Processing wardrobe item ${wardrobeItem.id}:`, {
      hasExtractedItems: !!wardrobeItem.extracted_clothing_items,
      originalImageUrl: wardrobeItem.original_image_url || wardrobeItem.image_url
    });
    
    if (wardrobeItem.extracted_clothing_items && isClothingItemsArray(wardrobeItem.extracted_clothing_items)) {
      const extractedItems = wardrobeItem.extracted_clothing_items;
      
      extractedItems.forEach((extractedItem, index) => {
        // Use the preserved original_image_url field or fall back to image_url
        const originalImageUrl = wardrobeItem.original_image_url || wardrobeItem.image_url;
        
        console.log(`👕 Processing clothing item "${extractedItem.name}" with originalImageUrl: ${originalImageUrl}`);
        
        const clothingItem: ClothingItem = {
          id: `${wardrobeItem.id}::${index}`,
          name: extractedItem.name || 'Unknown Item',
          category: extractedItem.category || 'uncategorized',
          descriptors: extractedItem.descriptors,
          color: extractedItem.color,
          brand: extractedItem.brand,
          material: extractedItem.material,
          style: extractedItem.style,
          size: extractedItem.size,
          description: extractedItem.description,
          tags: extractedItem.tags || [],
          renderImageUrl: extractedItem.renderImageUrl,
          // Enhanced fallback logic for original image URL
          originalImageUrl: extractedItem.originalImageUrl || originalImageUrl,
          croppedImageUrl: extractedItem.croppedImageUrl,
          boundingBox: extractedItem.boundingBox,
          confidence: extractedItem.confidence,
          contextualProcessing: extractedItem.contextualProcessing,
          accuracyLevel: extractedItem.accuracyLevel,
          imageType: extractedItem.imageType,
          croppingConfidence: extractedItem.croppingConfidence,
          outfitId: wardrobeItem.id,
          outfitRating: wardrobeItem.rating_score || undefined,
          arrayIndex: index,
          createdAt: wardrobeItem.created_at,
          updatedAt: wardrobeItem.updated_at
        };
        
        console.log(`✅ Created clothing item with originalImageUrl: ${clothingItem.originalImageUrl}`);
        allClothingItems.push(clothingItem);
      });
    } else {
      console.log(`⚠️ Wardrobe item ${wardrobeItem.id} has no valid extracted clothing items`);
    }
  });
  
  console.log(`📊 Total clothing items processed: ${allClothingItems.length}`);
  return allClothingItems;
};

export const getUniqueCategories = (items: ClothingItem[]): string[] => {
  const categories = new Set<string>();
  categories.add('all');
  
  items.forEach(item => {
    if (item.category) {
      categories.add(item.category);
    }
  });
  
  return Array.from(categories).sort();
};

export const filterAndSortItems = (
  items: ClothingItem[], 
  searchTerm: string, 
  filterCategory: string, 
  sortBy: string
): ClothingItem[] => {
  let filtered = items;
  
  // Apply search filter
  if (searchTerm) {
    const lowerSearchTerm = searchTerm.toLowerCase();
    filtered = filtered.filter(item =>
      item.name.toLowerCase().includes(lowerSearchTerm) ||
      item.category.toLowerCase().includes(lowerSearchTerm) ||
      item.brand?.toLowerCase().includes(lowerSearchTerm) ||
      item.color?.toLowerCase().includes(lowerSearchTerm) ||
      item.tags?.some(tag => tag.toLowerCase().includes(lowerSearchTerm))
    );
  }
  
  // Apply category filter
  if (filterCategory && filterCategory !== 'all') {
    filtered = filtered.filter(item => item.category === filterCategory);
  }
  
  // Apply sorting
  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'category':
        return a.category.localeCompare(b.category);
      case 'brand':
        return (a.brand || '').localeCompare(b.brand || '');
      case 'color':
        return (a.color || '').localeCompare(b.color || '');
      case 'date':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });
  
  return sorted;
};

export const getBestImageUrl = (item: ClothingItem): string | undefined => {
  // Priority: AI generated > cropped > original > fallback
  if (item.renderImageUrl) {
    return item.renderImageUrl;
  }
  if (item.croppedImageUrl) {
    return item.croppedImageUrl;
  }
  if (item.originalImageUrl) {
    return item.originalImageUrl;
  }
  return undefined;
};

export const hasAIGeneratedImage = (item: ClothingItem): boolean => {
  return !!item.renderImageUrl;
};
