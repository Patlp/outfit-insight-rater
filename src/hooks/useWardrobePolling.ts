
import { useEffect, useRef } from 'react';
import { WardrobeItem } from '@/services/wardrobe';
import { supabase } from '@/integrations/supabase/client';
import { isClothingItemsArray } from '@/components/wardrobe/ClothingItemsProcessor';
import { toast } from 'sonner';

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
  const lastPollTimeRef = useRef<number>(0);

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

    const totalPendingImages = itemsNeedingPolling.reduce((count, item) => {
      if (item.extracted_clothing_items && isClothingItemsArray(item.extracted_clothing_items)) {
        return count + item.extracted_clothing_items.filter(
          (clothingItem: any) => clothingItem?.name && !clothingItem?.renderImageUrl
        ).length;
      }
      return count;
    }, 0);

    console.log(`🔄 Setting up efficient polling for ${itemsNeedingPolling.length} wardrobe items (${totalPendingImages} pending images)`);

    // Show initial toast about generation in progress
    if (totalPendingImages > 0 && Date.now() - lastPollTimeRef.current > 30000) { // Only show every 30 seconds
      toast.info(`AI is generating ${totalPendingImages} clothing images...`, {
        description: "This may take a few minutes. Images will appear automatically when ready.",
        duration: 5000
      });
      lastPollTimeRef.current = Date.now();
    }

    // Poll every 5 seconds for better performance
    intervalRef.current = setInterval(async () => {
      let hasUpdates = false;
      let updatedItems = [...wardrobeItems];
      let newImagesCount = 0;

      try {
        // Check all items that need polling efficiently
        const itemIds = itemsNeedingPolling.map(item => item.id);
        
        const { data: updatedWardrobeItems, error } = await supabase
          .from('wardrobe_items')
          .select('id, extracted_clothing_items')
          .in('id', itemIds);

        if (error) {
          console.error('❌ Error during bulk polling:', error);
          return;
        }

        if (!updatedWardrobeItems) return;

        // Process updates efficiently
        for (const updatedDbItem of updatedWardrobeItems) {
          const originalItem = wardrobeItems.find(item => item.id === updatedDbItem.id);
          if (!originalItem) continue;

          if (updatedDbItem.extracted_clothing_items && isClothingItemsArray(updatedDbItem.extracted_clothing_items)) {
            // Check if any clothing items now have render images that didn't before
            const originalItems = isClothingItemsArray(originalItem.extracted_clothing_items) ? originalItem.extracted_clothing_items : [];
            
            let itemHasNewImages = false;
            
            updatedDbItem.extracted_clothing_items.forEach((clothingItem: any, index: number) => {
              const originalClothingItem = originalItems[index];
              if (clothingItem?.renderImageUrl && !originalClothingItem?.renderImageUrl) {
                itemHasNewImages = true;
                newImagesCount++;
                console.log(`🎨 New AI image detected for "${clothingItem.name}" in item ${originalItem.id}`);
              }
            });

            if (itemHasNewImages) {
              hasUpdates = true;
              
              // Update the items array directly
              updatedItems = updatedItems.map(prevItem => 
                prevItem.id === updatedDbItem.id 
                  ? { ...prevItem, extracted_clothing_items: updatedDbItem.extracted_clothing_items }
                  : prevItem
              );
            }
          }
        }

        // If we found updates, update local state and notify user
        if (hasUpdates) {
          console.log(`🔄 Updating local state with ${newImagesCount} new AI images`);
          onLocalUpdate(updatedItems);
          
          // Show success toast for new images
          if (newImagesCount > 0) {
            toast.success(`${newImagesCount} new AI image${newImagesCount > 1 ? 's' : ''} generated!`, {
              description: "Your clothing items now have AI-generated images.",
              duration: 3000
            });
          }
          
          // Also refresh the parent component
          if (onItemsUpdated) {
            console.log('🔄 Triggering parent component refresh');
            onItemsUpdated();
          }
        }

      } catch (error) {
        console.error('❌ Error in efficient polling interval:', error);
      }
    }, 5000); // Poll every 5 seconds

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
