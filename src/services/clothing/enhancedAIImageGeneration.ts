
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ClothingPromptTemplate {
  basePrompt: string;
  styleModifiers: string[];
  backgroundOptions: string[];
  lightingSetup: string;
  cameraAngle: string;
  qualityKeywords: string[];
}

interface GenerationConfig {
  resolution: string;
  quality: 'high' | 'medium' | 'low';
  style: 'flat_lay' | 'ghost_mannequin' | 'product_shot';
  background: 'white' | 'neutral' | 'transparent';
  variants: number;
  temperature: number;
  provider: 'openai';
}

interface EnhancedGenerationResult {
  success: boolean;
  imageUrl?: string;
  provider: string;
  quality: string;
  processingTime: number;
  metadata?: any;
  error?: string;
}

// Clothing-specific prompt templates for professional product photography
const CLOTHING_PROMPT_TEMPLATES: Record<string, ClothingPromptTemplate> = {
  'shirt': {
    basePrompt: 'Professional product photography of a {color} {material} shirt',
    styleModifiers: ['fitted', 'relaxed', 'tailored', 'casual', 'formal'],
    backgroundOptions: ['pure white studio background', 'soft gradient background'],
    lightingSetup: 'soft studio lighting with minimal shadows',
    cameraAngle: 'front view, flat lay or ghost mannequin style',
    qualityKeywords: ['high resolution', 'crisp details', 'fabric texture visible', 'professional catalog style']
  },
  'dress': {
    basePrompt: 'High-end fashion photography of a {color} {material} dress',
    styleModifiers: ['flowing', 'structured', 'elegant', 'casual', 'formal'],
    backgroundOptions: ['pristine white background', 'minimalist studio setting'],
    lightingSetup: 'professional studio lighting highlighting fabric drape',
    cameraAngle: 'full garment view, ghost mannequin or flat lay presentation',
    qualityKeywords: ['luxury catalog quality', 'fabric texture detail', 'clean composition']
  },
  'pants': {
    basePrompt: 'Professional product shot of {color} {material} pants',
    styleModifiers: ['slim-fit', 'regular-fit', 'wide-leg', 'tailored', 'casual'],
    backgroundOptions: ['clean white background', 'neutral studio backdrop'],
    lightingSetup: 'even studio lighting without harsh shadows',
    cameraAngle: 'full-length view, flat lay or ghost mannequin style',
    qualityKeywords: ['crisp details', 'fabric texture', 'professional e-commerce quality']
  },
  'shoes': {
    basePrompt: 'Premium product photography of {color} {material} shoes',
    styleModifiers: ['polished', 'casual', 'athletic', 'formal', 'vintage'],
    backgroundOptions: ['pure white seamless background', 'minimalist product stage'],
    lightingSetup: 'professional product lighting with subtle reflections',
    cameraAngle: '3/4 angle view showcasing design details',
    qualityKeywords: ['high-definition', 'material texture', 'luxury retail quality']
  },
  'jacket': {
    basePrompt: 'Studio fashion photography of a {color} {material} jacket',
    styleModifiers: ['structured', 'casual', 'formal', 'oversized', 'fitted'],
    backgroundOptions: ['white infinity background', 'clean studio environment'],
    lightingSetup: 'professional fashion lighting with soft shadows',
    cameraAngle: 'front view, ghost mannequin or carefully styled flat lay',
    qualityKeywords: ['designer quality', 'fabric detail', 'professional catalog standard']
  },
  'accessories': {
    basePrompt: 'Luxury product photography of a {color} {material} {item}',
    styleModifiers: ['elegant', 'modern', 'classic', 'contemporary', 'minimalist'],
    backgroundOptions: ['pristine white background', 'soft gradient backdrop'],
    lightingSetup: 'controlled studio lighting with premium presentation',
    cameraAngle: 'optimal angle highlighting design features',
    qualityKeywords: ['jewelry quality', 'premium details', 'luxury retail presentation']
  }
};

// Default template for unknown clothing types
const DEFAULT_TEMPLATE: ClothingPromptTemplate = {
  basePrompt: 'Professional product photography of a {color} {material} clothing item',
  styleModifiers: ['modern', 'classic', 'contemporary'],
  backgroundOptions: ['clean white background', 'neutral studio setting'],
  lightingSetup: 'professional studio lighting',
  cameraAngle: 'optimal product view',
  qualityKeywords: ['high quality', 'professional', 'catalog standard']
};

export class EnhancedClothingImageGenerator {
  private defaultConfig: GenerationConfig = {
    resolution: '1024x1024',
    quality: 'high',
    style: 'ghost_mannequin',
    background: 'white',
    variants: 1,
    temperature: 0.3,
    provider: 'openai'
  };

  async generateClothingImage(
    itemName: string,
    wardrobeItemId: string,
    arrayIndex: number,
    config: Partial<GenerationConfig> = {},
    originalImageUrl?: string
  ): Promise<EnhancedGenerationResult> {
    const startTime = Date.now();
    const finalConfig = { ...this.defaultConfig, ...config };
    
    console.log(`🎨 Enhanced AI generation starting for "${itemName}" with OpenAI`);

    // Extract clothing details for enhanced prompting
    const clothingDetails = this.extractClothingDetails(itemName);
    const prompt = this.generateEnhancedPrompt(clothingDetails, finalConfig);
    
    console.log(`📝 Generated enhanced prompt: ${prompt}`);

    // Use OpenAI for generation
    const result = await this.generateWithOpenAI(
      itemName,
      wardrobeItemId,
      arrayIndex,
      prompt,
      finalConfig
    );

    result.processingTime = Date.now() - startTime;
    
    if (result.success) {
      console.log(`✅ Enhanced AI generation completed in ${result.processingTime}ms`);
      toast.success(`Generated professional image for ${itemName} (OpenAI)`);
    } else {
      console.error(`❌ Enhanced AI generation failed: ${result.error}`);
      toast.error(`Failed to generate image for ${itemName}`);
    }

    return result;
  }

  private extractClothingDetails(itemName: string): {
    type: string;
    color: string;
    material: string;
    style: string;
  } {
    const name = itemName.toLowerCase();
    
    // Extract clothing type
    const clothingTypes = Object.keys(CLOTHING_PROMPT_TEMPLATES);
    const type = clothingTypes.find(t => name.includes(t)) || 'clothing';
    
    // Extract color
    const colors = ['black', 'white', 'red', 'blue', 'green', 'yellow', 'pink', 'purple', 'brown', 'gray', 'grey', 'navy', 'beige', 'cream'];
    const color = colors.find(c => name.includes(c)) || 'neutral';
    
    // Extract material
    const materials = ['cotton', 'silk', 'wool', 'denim', 'leather', 'polyester', 'linen', 'cashmere', 'velvet', 'satin'];
    const material = materials.find(m => name.includes(m)) || 'fabric';
    
    // Extract style
    const styles = ['casual', 'formal', 'elegant', 'sporty', 'vintage', 'modern', 'classic'];
    const style = styles.find(s => name.includes(s)) || 'modern';

    return { type, color, material, style };
  }

  private generateEnhancedPrompt(
    details: { type: string; color: string; material: string; style: string },
    config: GenerationConfig
  ): string {
    const template = CLOTHING_PROMPT_TEMPLATES[details.type] || DEFAULT_TEMPLATE;
    
    // Build base prompt with placeholders filled
    let prompt = template.basePrompt
      .replace('{color}', details.color)
      .replace('{material}', details.material)
      .replace('{item}', details.type);

    // Add style configuration
    const styleKeywords = this.getStyleKeywords(config.style);
    prompt += `, ${styleKeywords}`;

    // Add background and lighting
    prompt += `, ${template.backgroundOptions[0]}, ${template.lightingSetup}`;

    // Add quality and technical specifications
    const qualitySpecs = this.getQualitySpecifications(config);
    prompt += `, ${qualitySpecs}`;

    // Add brand-style references for better results
    prompt += ', professional fashion catalog photography, ASOS style, Zara quality, Uniqlo presentation';

    // Add technical camera and lighting details
    prompt += ', shot with professional camera, soft box lighting, no harsh shadows, clean composition';

    return prompt;
  }

  private getStyleKeywords(style: GenerationConfig['style']): string {
    switch (style) {
      case 'flat_lay':
        return 'flat lay styling, arranged neatly on white surface, top-down view';
      case 'ghost_mannequin':
        return 'ghost mannequin effect, invisible model, natural garment shape';
      case 'product_shot':
        return 'product photography style, professional presentation, catalog quality';
      default:
        return 'professional product styling';
    }
  }

  private getQualitySpecifications(config: GenerationConfig): string {
    const specs = [`${config.resolution} resolution`];
    
    if (config.quality === 'high') {
      specs.push('ultra-high definition', 'crisp details', 'professional grade');
    } else if (config.quality === 'medium') {
      specs.push('high quality', 'clear details');
    }

    if (config.background === 'transparent') {
      specs.push('transparent background', 'PNG format');
    } else {
      specs.push('pure white background', 'seamless backdrop');
    }

    return specs.join(', ');
  }

  private async generateWithOpenAI(
    itemName: string,
    wardrobeItemId: string,
    arrayIndex: number,
    prompt: string,
    config: GenerationConfig
  ): Promise<EnhancedGenerationResult> {
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
        provider: 'openai_enhanced',
        quality: config.quality,
        processingTime: 0,
        metadata: data.metadata
      };
    } catch (error) {
      console.error(`❌ OpenAI generation failed:`, error);
      return {
        success: false,
        provider: 'openai',
        quality: config.quality,
        processingTime: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async batchGenerateImages(
    wardrobeItemId: string,
    clothingItems: any[],
    config: Partial<GenerationConfig> = {},
    originalImageUrl?: string
  ): Promise<{ success: number; failed: number; results: EnhancedGenerationResult[] }> {
    console.log(`🚀 Starting enhanced batch generation for ${clothingItems.length} items`);
    
    let success = 0;
    let failed = 0;
    const results: EnhancedGenerationResult[] = [];

    for (let i = 0; i < clothingItems.length; i++) {
      const item = clothingItems[i];
      
      if (!item?.name || item.renderImageUrl) {
        console.log(`⏭️ Skipping "${item?.name}" - ${!item?.name ? 'no name' : 'already has image'}`);
        continue;
      }

      try {
        console.log(`🎨 Processing ${i + 1}/${clothingItems.length}: "${item.name}"`);
        
        const result = await this.generateClothingImage(
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
          provider: 'openai',
          quality: 'unknown',
          processingTime: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log(`🎯 Enhanced batch generation completed: ${success} success, ${failed} failed`);
    
    if (success > 0) {
      toast.success(`Generated ${success} professional images!`);
    }
    if (failed > 0) {
      toast.warning(`${failed} images failed to generate`);
    }

    return { success, failed, results };
  }

  private async updateWardrobeItemWithImage(
    wardrobeItemId: string,
    arrayIndex: number,
    result: EnhancedGenerationResult
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

    // Update specific item with enhanced metadata
    const updatedItems = Array.from(wardrobeItem.extracted_clothing_items as any[]);
    if (updatedItems[arrayIndex]) {
      updatedItems[arrayIndex] = {
        ...updatedItems[arrayIndex],
        renderImageUrl: result.imageUrl,
        renderImageGeneratedAt: new Date().toISOString(),
        renderImageProvider: result.provider,
        renderImageQuality: result.quality,
        renderImageProcessingTime: result.processingTime,
        renderImageMetadata: result.metadata,
        imageType: 'ai_enhanced'
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
export const enhancedClothingImageGenerator = new EnhancedClothingImageGenerator();

// Legacy compatibility functions
export const generateEnhancedClothingImage = (
  itemName: string,
  wardrobeItemId: string,
  arrayIndex: number,
  originalImageUrl?: string
) => enhancedClothingImageGenerator.generateClothingImage(
  itemName,
  wardrobeItemId,
  arrayIndex,
  {},
  originalImageUrl
);

export const generateEnhancedImagesForClothingItems = (
  wardrobeItemId: string,
  clothingItems: any[],
  originalImageUrl?: string
) => enhancedClothingImageGenerator.batchGenerateImages(
  wardrobeItemId,
  clothingItems,
  {},
  originalImageUrl
);
