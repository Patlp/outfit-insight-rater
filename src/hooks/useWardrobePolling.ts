
import { useEffect, useRef } from 'react';
import { WardrobeItem } from '@/services/wardrobe';
import { supabase } from '@/integrations/supabase/client';
import { isClothingItemsArray } from '@/components/wardrobe/ClothingItemsProcessor';

interface UseWardrobePollingProps {
  wardrobeItems: WardrobeItem[];
  onItemsUpdated?: () => void;
  onLocalUpdate: (items: WardrobeItem[]) => void;
}

export const useWardrobePolling = ({ 
  wardrobeItems, 
  onItemsUpdated, 
  onLocalUpdate 
}: UseWardrobePollingProps) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Find items that need polling (have clothing items but some are missing render images)
    const itemsNeedingPolling = wardrobeItems.filter(item => {
      if (item.extracted_clothing_items && isClothingItemsArray(item.extracted_clothing_items)) {
        return item.extracted_clothing_items.some(
          (clothingItem: any) => clothingItem?.name && !clothingItem?.renderImageUrl
        );
      }
      return false;
    });

    if (itemsNeedingPolling.length === 0) {
      console.log('✅ No items need AI image polling');
      return;
    }

    console.log(`🔄 Setting up polling for ${itemsNeedingPolling.length} wardrobe items with pending AI images`);

    // Poll every 3 seconds for faster updates
    intervalRef.current = setInterval(async () => {
      let hasUpdates = false;

      try {
        // Check all items that need polling
        for (const item of itemsNeedingPolling) {
          const { data: updatedItem, error } = await supabase
            .from('wardrobe_items')
            .select('extracted_clothing_items')
            .eq('id', item.id)
            .single();

          if (error) {
            console.error('❌ Error polling wardrobe item:', item.id, error);
            continue;
          }

          if (updatedItem && updatedItem.extracted_clothing_items && isClothingItemsArray(updatedItem.extracted_clothing_items)) {
            // Check if any clothing items now have render images that didn't before
            const originalItems = isClothingItemsArray(item.extracted_clothing_items) ? item.extracted_clothing_items : [];
            const hasNewRenderImages = updatedItem.extracted_clothing_items.some(
              (clothingItem: any, index: number) => {
                const originalItem = originalItems[index];
                return clothingItem?.renderImageUrl && !originalItem?.renderImageUrl;
              }
            );

            if (hasNewRenderImages) {
              console.log('🎨 Detected new AI-generated images for item:', item.id);
              hasUpdates = true;
              
              // Update local state immediately
              onLocalUpdate(prev => 
                prev.map(prevItem => 
                  prevItem.id === item.id 
                    ? { ...prevItem, extracted_clothing_items: updatedItem.extracted_clothing_items }
                    : prevItem
                )
              );
            }
          }
        }

        // If we found updates, also refresh the parent component
        if (hasUpdates && onItemsUpdated) {
          console.log('🔄 Triggering parent component refresh');
          onItemsUpdated();
        }

      } catch (error) {
        console.error('❌ Error in polling interval:', error);
      }
    }, 3000); // Poll every 3 seconds

    // Cleanup interval on unmount or when dependencies change
    return () => {
      if (intervalRef.current) {
        console.log('🧹 Cleaning up polling interval');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [wardrobeItems, onItemsUpdated, onLocalUpdate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
};
