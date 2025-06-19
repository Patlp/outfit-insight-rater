import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getPrimaryTaxonomy } from '@/services/primaryTaxonomyService';
import { extractFashionTagsWithVision, fileToBase64 } from '@/services/clothing/visionTaggingService';

interface ContextualClothingItem {
  name: string;
  category?: string;
  descriptors?: string[];
  confidence?: number;
  taxonomyData?: any;
  visionTags?: string[];
  contextualPrompt?: string;
}

interface ContextAwareGenerationConfig {
  resolution: string;
  quality: 'high' | 'medium' | 'low';
  style: 'product_photography' | 'catalog_style' | 'studio_shot';
  useTaxonomy: boolean;
  useVisionTags: boolean;
  enhancePrompts: boolean;
}

// Comprehensive clothing type detection with taxonomy integration
const ENHANCED_CLOTHING_DETECTION = {
  footwear: {
    keywords: ['shoes', 'boots', 'sneakers', 'heels', 'flats', 'sandals', 'loafers', 'pumps', 'oxfords', 'moccasins', 'clogs', 'stilettos', 'wedges', 'platforms', 'espadrilles', 'ballet flats', 'ankle boots', 'knee boots', 'riding boots'],
    category: 'footwear',
    basePrompt: 'Professional product photography of {color} {material} {style} {item} on white background',
    qualityKeywords: ['high resolution', 'product photography', 'clean background', 'professional lighting', 'detailed texture']
  },
  tops: {
    keywords: ['shirt', 'blouse', 'top', 'sweater', 'cardigan', 'jacket', 'blazer', 'hoodie', 't-shirt', 'tank', 'camisole', 'vest', 'polo', 'turtleneck'],
    category: 'tops',
    basePrompt: 'Professional clothing photography of {color} {material} {style} {item}, ghost mannequin style on white background',
    qualityKeywords: ['fashion photography', 'ghost mannequin', 'fabric texture', 'professional studio lighting']
  },
  bottoms: {
    keywords: ['pants', 'jeans', 'trousers', 'shorts', 'skirt', 'leggings', 'chinos', 'slacks', 'capri', 'culottes'],
    category: 'bottoms',
    basePrompt: 'Professional clothing photography of {color} {material} {style} {item}, flat lay or ghost mannequin on white background',
    qualityKeywords: ['clothing photography', 'professional presentation', 'clean styling', 'fabric detail']
  },
  dresses: {
    keywords: ['dress', 'gown', 'sundress', 'maxi', 'midi', 'mini', 'cocktail', 'evening'],
    category: 'dresses',
    basePrompt: 'Professional fashion photography of {color} {material} {style} {item}, ghost mannequin on white background',
    qualityKeywords: ['fashion photography', 'elegant presentation', 'dress silhouette', 'professional styling']
  },
  accessories: {
    keywords: ['belt', 'bag', 'purse', 'backpack', 'hat', 'scarf', 'jewelry', 'necklace', 'bracelet', 'earrings', 'watch', 'sunglasses', 'handbag', 'tote', 'clutch'],
    category: 'accessories',
    basePrompt: 'Professional product photography of {color} {material} {style} {item} on white background',
    qualityKeywords: ['luxury product photography', 'detailed craftsmanship', 'premium presentation', 'accessory styling']
  }
};

export class ContextAwareClothingImageGenerator {
  private taxonomyData: any[] = [];
  private defaultConfig: ContextAwareGenerationConfig = {
    resolution: '1024x1024',
    quality: 'high',
    style: 'product_photography',
    useTaxonomy: true,
    useVisionTags: true,
    enhancePrompts: true
  };

  async initialize(): Promise<void> {
    try {
      const { data: taxonomy } = await getPrimaryTaxonomy(1000);
      this.taxonomyData = taxonomy || [];
      console.log(`🔧 Context-aware generator initialized with ${this.taxonomyData.length} taxonomy items`);
    } catch (error) {
      console.warn('⚠️ Failed to load taxonomy data:', error);
    }
  }

  async generateContextualImage(
    itemName: string,
    wardrobeItemId: string,
    arrayIndex: number,
    config: Partial<ContextAwareGenerationConfig> = {},
    originalImageUrl?: string
  ): Promise<{ success: boolean; imageUrl?: string; error?: string; metadata?: any }> {
    const startTime = Date.now();
    const finalConfig = { ...this.defaultConfig, ...config };
    
    console.log(`🎯 Starting context-aware generation for: "${itemName}"`);
    
    try {
      // Step 1: Enhance item with contextual data
      const enhancedItem = await this.enhanceItemWithContext(itemName, wardrobeItemId, finalConfig, originalImageUrl);
      
      // Step 2: Generate contextual prompt
      const contextualPrompt = this.generateContextualPrompt(enhancedItem, finalConfig);
      
      console.log(`📝 Generated contextual prompt: ${contextualPrompt}`);
      
      // Step 3: Generate image with enhanced prompt
      const result = await this.generateWithEnhancedOpenAI(
        itemName,
        wardrobeItemId,
        arrayIndex,
        contextualPrompt,
        finalConfig
      );
      
      const processingTime = Date.now() - startTime;
      
      if (result.success) {
        console.log(`✅ Context-aware generation completed in ${processingTime}ms`);
        toast.success(`Generated accurate image for ${itemName}`);
        
        return {
          ...result,
          metadata: {
            ...result.metadata,
            processingTime,
            contextualData: enhancedItem,
            prompt: contextualPrompt,
            generationType: 'context-aware'
          }
        };
      } else {
        console.error(`❌ Context-aware generation failed: ${result.error}`);
        return result;
      }
      
    } catch (error) {
      console.error(`❌ Context-aware generation error:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async enhanceItemWithContext(
    itemName: string,
    wardrobeItemId: string,
    config: ContextAwareGenerationConfig,
    originalImageUrl?: string
  ): Promise<ContextualClothingItem> {
    const enhancedItem: ContextualClothingItem = {
      name: itemName,
      descriptors: []
    };

    // Step 1: Taxonomy enrichment
    if (config.useTaxonomy && this.taxonomyData.length > 0) {
      const taxonomyMatch = this.findTaxonomyMatch(itemName);
      if (taxonomyMatch) {
        enhancedItem.taxonomyData = taxonomyMatch;
        enhancedItem.category = taxonomyMatch.category;
        enhancedItem.descriptors = [
          ...(enhancedItem.descriptors || []),
          ...(taxonomyMatch.style_descriptors || []),
          ...(taxonomyMatch.common_materials || [])
        ];
        console.log(`📚 Taxonomy match found: ${taxonomyMatch.item_name} (${taxonomyMatch.category})`);
      }
    }

    // Step 2: Vision tags enrichment (if original image is available)
    if (config.useVisionTags && originalImageUrl) {
      try {
        // Get original image file from wardrobe item
        const { data: wardrobeItem } = await supabase
          .from('wardrobe_items')
          .select('image_url')
          .eq('id', wardrobeItemId)
          .single();

        if (wardrobeItem?.image_url) {
          // Note: This would require the original image file, which we don't have access to here
          // In practice, vision tags would be generated during the initial upload process
          console.log('🔍 Vision tags would be applied here with original image');
        }
      } catch (error) {
        console.warn('⚠️ Could not apply vision tags:', error);
      }
    }

    // Step 3: Enhanced item type detection
    const detectedType = this.detectItemTypeEnhanced(itemName);
    if (detectedType) {
      enhancedItem.category = detectedType.category;
      console.log(`🔍 Enhanced detection: "${itemName}" -> ${detectedType.category}`);
    }

    return enhancedItem;
  }

  private findTaxonomyMatch(itemName: string): any | null {
    const name = itemName.toLowerCase();
    
    // Exact match first
    let match = this.taxonomyData.find(item => 
      item.item_name.toLowerCase() === name
    );
    
    if (match) return match;
    
    // Partial match
    match = this.taxonomyData.find(item => {
      const itemNameLower = item.item_name.toLowerCase();
      return name.includes(itemNameLower) || itemNameLower.includes(name);
    });
    
    if (match) return match;
    
    // Keyword match
    return this.taxonomyData.find(item => {
      const keywords = [
        item.item_name,
        ...(item.style_descriptors || []),
        ...(item.common_materials || [])
      ];
      
      return keywords.some(keyword => 
        keyword && (
          name.includes(keyword.toLowerCase()) ||
          keyword.toLowerCase().includes(name)
        )
      );
    });
  }

  private detectItemTypeEnhanced(itemName: string): { category: string; config: any } | null {
    const name = itemName.toLowerCase();
    
    for (const [type, config] of Object.entries(ENHANCED_CLOTHING_DETECTION)) {
      if (config.keywords.some(keyword => 
        name.includes(keyword) || keyword.includes(name)
      )) {
        return { category: type, config };
      }
    }
    
    return null;
  }

  private generateContextualPrompt(
    item: ContextualClothingItem,
    config: ContextAwareGenerationConfig
  ): string {
    // Detect item type for appropriate template
    const typeDetection = this.detectItemTypeEnhanced(item.name);
    const typeConfig = typeDetection?.config || ENHANCED_CLOTHING_DETECTION.accessories;
    
    // Extract color, material, and style from item name and taxonomy
    const details = this.extractItemDetails(item);
    
    // Build base prompt from template
    let prompt = typeConfig.basePrompt
      .replace('{color}', details.color)
      .replace('{material}', details.material)
      .replace('{style}', details.style)
      .replace('{item}', details.itemType);
    
    // Add taxonomy-specific enhancements
    if (item.taxonomyData) {
      const taxonomyDescriptors = [
        ...(item.taxonomyData.style_descriptors || []),
        ...(item.taxonomyData.common_materials || [])
      ].slice(0, 3);
      
      if (taxonomyDescriptors.length > 0) {
        prompt += `, featuring ${taxonomyDescriptors.join(', ')}`;
      }
      
      if (item.taxonomyData.formality_level) {
        prompt += `, ${item.taxonomyData.formality_level} style`;
      }
    }
    
    // Add quality and technical specifications
    prompt += `, ${typeConfig.qualityKeywords.join(', ')}`;
    
    // Add professional photography specifications
    prompt += ', professional studio lighting, high-resolution, catalog quality, clean composition, no shadows';
    
    // Add specific style directive based on configuration
    switch (config.style) {
      case 'catalog_style':
        prompt += ', e-commerce catalog style, consistent lighting';
        break;
      case 'studio_shot':
        prompt += ', studio photography, premium presentation';
        break;
      default:
        prompt += ', product photography style';
    }
    
    return prompt;
  }

  private extractItemDetails(item: ContextualClothingItem): {
    color: string;
    material: string;
    style: string;
    itemType: string;
  } {
    const name = item.name.toLowerCase();
    
    // Extract color
    const colors = ['black', 'white', 'red', 'blue', 'green', 'yellow', 'pink', 'purple', 'brown', 'gray', 'grey', 'navy', 'beige', 'cream', 'tan', 'olive', 'burgundy'];
    const color = colors.find(c => name.includes(c)) || 'neutral';
    
    // Extract material (from taxonomy first, then name)
    let material = 'fabric';
    if (item.taxonomyData?.common_materials?.length > 0) {
      material = item.taxonomyData.common_materials[0];
    } else {
      const materials = ['leather', 'cotton', 'silk', 'wool', 'denim', 'linen', 'cashmere', 'suede', 'canvas'];
      material = materials.find(m => name.includes(m)) || 'fabric';
    }
    
    // Extract style (from taxonomy first, then name)
    let style = 'classic';
    if (item.taxonomyData?.style_descriptors?.length > 0) {
      style = item.taxonomyData.style_descriptors[0];
    } else {
      const styles = ['casual', 'formal', 'elegant', 'sporty', 'vintage', 'modern', 'fitted', 'loose', 'structured'];
      style = styles.find(s => name.includes(s)) || 'classic';
    }
    
    // Extract item type (clean up the name)
    const itemType = name
      .replace(new RegExp(`\\b(${color}|${material}|${style})\\b`, 'g'), '')
      .trim()
      .replace(/\s+/g, ' ') || 'clothing item';
    
    return { color, material, style, itemType };
  }

  private async generateWithEnhancedOpenAI(
    itemName: string,
    wardrobeItemId: string,
    arrayIndex: number,
    prompt: string,
    config: ContextAwareGenerationConfig
  ): Promise<{ success: boolean; imageUrl?: string; error?: string; metadata?: any }> {
    try {
      const { data, error } = await supabase.functions.invoke('generate-enhanced-clothing-image', {
        body: {
          itemName,
          wardrobeItemId,
          arrayIndex,
          enhancedPrompt: prompt,
          model: 'dall-e-3',
          size: config.resolution,
          quality: 'hd',
          style: 'natural'
        }
      });

      if (error || !data?.success) {
        throw new Error(data?.error || error?.message || 'OpenAI generation failed');
      }

      return {
        success: true,
        imageUrl: data.imageUrl,
        metadata: {
          ...data.metadata,
          generationType: 'context-aware-enhanced',
          promptUsed: prompt
        }
      };
    } catch (error) {
      console.error(`❌ Context-aware OpenAI generation failed:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async batchGenerateContextualImages(
    wardrobeItemId: string,
    clothingItems: any[],
    originalImageUrl?: string,
    config: Partial<ContextAwareGenerationConfig> = {}
  ): Promise<{ success: number; failed: number; results: any[] }> {
    console.log(`🚀 Starting context-aware batch generation for ${clothingItems.length} items`);
    
    // Initialize with taxonomy data
    await this.initialize();
    
    let success = 0;
    let failed = 0;
    const results: any[] = [];

    for (let i = 0; i < clothingItems.length; i++) {
      const item = clothingItems[i];
      
      if (!item?.name || item.renderImageUrl) {
        console.log(`⏭️ Skipping "${item?.name}" - ${!item?.name ? 'no name' : 'already has image'}`);
        continue;
      }

      try {
        console.log(`🎨 Processing ${i + 1}/${clothingItems.length}: "${item.name}"`);
        
        const result = await this.generateContextualImage(
          item.name,
          wardrobeItemId,
          i,
          config,
          originalImageUrl
        );
        
        results.push(result);
        
        if (result.success && result.imageUrl) {
          await this.updateWardrobeItemWithImage(wardrobeItemId, i, result);
          success++;
        } else {
          failed++;
        }

        // Rate limiting delay
        if (i < clothingItems.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

      } catch (error) {
        console.error(`❌ Error processing "${item.name}":`, error);
        failed++;
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log(`🎯 Context-aware batch generation completed: ${success} success, ${failed} failed`);
    
    if (success > 0) {
      toast.success(`Generated ${success} accurate contextual images!`);
    }
    if (failed > 0) {
      toast.warning(`${failed} images failed to generate`);
    }

    return { success, failed, results };
  }

  private async updateWardrobeItemWithImage(
    wardrobeItemId: string,
    arrayIndex: number,
    result: any
  ): Promise<void> {
    // Get current wardrobe item
    const { data: wardrobeItem, error: fetchError } = await supabase
      .from('wardrobe_items')
      .select('extracted_clothing_items')
      .eq('id', wardrobeItemId)
      .single();

    if (fetchError || !wardrobeItem?.extracted_clothing_items) {
      throw new Error('Failed to fetch wardrobe item');
    }

    // Update specific item with contextual metadata
    const updatedItems = Array.from(wardrobeItem.extracted_clothing_items as any[]);
    if (updatedItems[arrayIndex]) {
      updatedItems[arrayIndex] = {
        ...updatedItems[arrayIndex],
        renderImageUrl: result.imageUrl,
        renderImageGeneratedAt: new Date().toISOString(),
        renderImageProvider: 'context_aware_openai',
        renderImageMetadata: result.metadata,
        imageType: 'context_aware_ai',
        generationAccuracy: 'high'
      };

      // Update database
      const { error: updateError } = await supabase
        .from('wardrobe_items')
        .update({
          extracted_clothing_items: updatedItems,
          updated_at: new Date().toISOString()
        })
        .eq('id', wardrobeItemId);

      if (updateError) {
        throw new Error(`Failed to update wardrobe item: ${updateError.message}`);
      }
    }
  }
}

// Export singleton instance
export const contextAwareImageGenerator = new ContextAwareClothingImageGenerator();

// Legacy compatibility functions
export const generateContextualClothingImage = (
  itemName: string,
  wardrobeItemId: string,
  arrayIndex: number,
  originalImageUrl?: string
) => contextAwareImageGenerator.generateContextualImage(
  itemName,
  wardrobeItemId,
  arrayIndex,
  {},
  originalImageUrl
);

export const generateContextualImagesForClothingItems = (
  wardrobeItemId: string,
  clothingItems: any[],
  originalImageUrl?: string
) => contextAwareImageGenerator.batchGenerateContextualImages(
  wardrobeItemId,
  clothingItems,
  originalImageUrl
);
