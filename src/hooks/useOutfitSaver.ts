import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useImageComparison } from './useImageComparison';

interface OutfitData {
  imageBase64: string;
  score: number;
  feedback: string;
  suggestions: string[];
  gender?: string;
  occasionContext?: string;
}

export const useOutfitSaver = () => {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const { compareImages, findSimilarImages } = useImageComparison();

  const saveOutfit = async (outfitData: OutfitData): Promise<boolean> => {
    if (!user) {
      console.error('No user logged in, cannot save outfit');
      return false;
    }

    if (isSaving) {
      console.warn('Save already in progress, skipping duplicate save');
      return false;
    }

    setIsSaving(true);
    
    try {
      console.log('🎯 Saving outfit to database...');
      console.log('🎯 - User ID:', user.id);
      console.log('🎯 - Score:', outfitData.score);
      console.log('🎯 - Feedback length:', outfitData.feedback?.length || 0);
      console.log('🎯 - Suggestions count:', outfitData.suggestions?.length || 0);
      console.log('🎯 - Has structured feedback:', outfitData.feedback?.includes('**') || false);

      // Enhanced duplicate detection: Check for recent similar outfits (within 15 minutes)
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      
      const { data: recentOutfits, error: checkError } = await supabase
        .from('wardrobe_items')
        .select('id, image_url, rating_score, feedback, created_at, suggestions')
        .eq('user_id', user.id)
        .gte('created_at', fifteenMinutesAgo)
        .order('created_at', { ascending: false })
        .limit(10);

      if (checkError) {
        console.error('Error checking for recent outfits:', checkError);
      } else if (recentOutfits && recentOutfits.length > 0) {
        // Multi-factor duplicate detection
        let duplicateFound = false;
        let duplicateReason = '';

        for (const existing of recentOutfits) {
          // Check for exact image match
          if (existing.image_url === outfitData.imageBase64) {
            duplicateFound = true;
            duplicateReason = 'exact image match';
            break;
          }

          // Check for image similarity using advanced comparison
          const imageComparison = compareImages(outfitData.imageBase64, existing.image_url, 0.95);
          if (imageComparison.isSimilar) {
            // If images are very similar, check other factors
            const scoreMatch = existing.rating_score === outfitData.score;
            const feedbackLengthSimilar = Math.abs((existing.feedback?.length || 0) - (outfitData.feedback?.length || 0)) < 50;
            const suggestionCountSimilar = Math.abs((existing.suggestions?.length || 0) - (outfitData.suggestions?.length || 0)) <= 1;
            
            if (scoreMatch && feedbackLengthSimilar && suggestionCountSimilar) {
              duplicateFound = true;
              duplicateReason = `similar image (${(imageComparison.similarity * 100).toFixed(1)}% similar) with matching analysis`;
              break;
            }
          }

          // Check for exact analysis match (even with different images - could be re-upload)
          const exactAnalysisMatch = 
            existing.rating_score === outfitData.score &&
            existing.feedback === outfitData.feedback &&
            JSON.stringify(existing.suggestions) === JSON.stringify(outfitData.suggestions);

          if (exactAnalysisMatch) {
            duplicateFound = true;
            duplicateReason = 'identical analysis results';
            break;
          }
        }

        if (duplicateFound) {
          console.log('🎯 Duplicate outfit detected, skipping save to prevent duplicate:', duplicateReason);
          toast.info('This outfit was recently analyzed - displaying previous results');
          setIsSaving(false);
          return true; // Return true as this is not an error condition
        }
      }

      const { data, error } = await supabase
        .from('wardrobe_items')
        .insert({
          user_id: user.id,
          image_url: outfitData.imageBase64,
          rating_score: outfitData.score,
          feedback: outfitData.feedback,
          suggestions: outfitData.suggestions,
          gender: outfitData.gender,
          occasion_context: outfitData.occasionContext,
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving outfit:', error);
        toast.error('Failed to save outfit analysis');
        return false;
      }

      console.log('🎯 Outfit saved successfully:', data?.id);
      
      // Dispatch custom event to trigger UI updates
      window.dispatchEvent(new CustomEvent('outfitSaved', { 
        detail: { outfitId: data?.id, timestamp: Date.now() } 
      }));
      
      toast.success('Outfit analysis saved!');
      return true;

    } catch (error) {
      console.error('Unexpected error saving outfit:', error);
      toast.error('Failed to save outfit analysis');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    saveOutfit,
    isSaving
  };
};