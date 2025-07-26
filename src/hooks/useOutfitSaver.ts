import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

      // Check if we already have this exact outfit saved recently (within 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      const { data: recentOutfits, error: checkError } = await supabase
        .from('wardrobe_items')
        .select('id, image_url, rating_score, feedback')
        .eq('user_id', user.id)
        .gte('created_at', fiveMinutesAgo)
        .order('created_at', { ascending: false })
        .limit(5);

      if (checkError) {
        console.error('Error checking for recent outfits:', checkError);
      } else if (recentOutfits && recentOutfits.length > 0) {
        // Check if we have a very similar outfit (same score and similar feedback)
        const similarOutfit = recentOutfits.find(existing => 
          existing.rating_score === outfitData.score &&
          existing.feedback?.length === outfitData.feedback?.length &&
          existing.image_url === outfitData.imageBase64
        );

        if (similarOutfit) {
          console.log('🎯 Found identical recent outfit, skipping save to prevent duplicate');
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