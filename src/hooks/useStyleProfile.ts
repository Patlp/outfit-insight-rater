import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface StyleProfile {
  id?: string;
  user_id: string;
  body_type?: string;
  body_type_confidence?: number;
  body_type_manual_override?: boolean;
  seasonal_type?: string;
  skin_tone?: string;
  undertone?: string;
  hair_color?: string;
  eye_color?: string;
  undertone_value?: number;
  contrast_value?: number;
  depth_value?: number;
  color_analysis_manual_override?: boolean;
  full_style_analysis?: any;
  source_image_url?: string;
  analysis_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface BodyTypeAnalysis {
  bodyType: 'rectangle' | 'pear' | 'hourglass' | 'inverted_triangle' | 'undefined';
  confidence: number;
  explanation: string;
  visualShape: string;
  typicalPersonality: string;
  weightGainPattern: string[];
  stylingRecommendations: string[];
  bestFits: string[];
  recommendedFabrics: string[];
  whatNotToWear: Array<{ item: string; reason: string; }>;
}

export interface ColorAnalysis {
  seasonalType: string;
  skinTone: 'fair' | 'medium' | 'olive' | 'deep';
  undertone: 'cool' | 'warm' | 'neutral';
  hairColor: string;
  eyeColor: string;
  undertoneValue: number;
  contrastValue: number;
  depthValue: number;
  explanation: string;
}

export const useStyleProfile = () => {
  const { user } = useAuth();
  const [styleProfile, setStyleProfile] = useState<StyleProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  // Fetch existing style profile
  const fetchStyleProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('style_profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('analysis_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw error;
      }

      setStyleProfile(data || null);
    } catch (error) {
      console.error('Error fetching style profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Analyze body type from image
  const analyzeBodyType = async (imageBase64: string, gender: 'male' | 'female'): Promise<BodyTypeAnalysis> => {
    setAnalyzing(true);
    try {
      const response = await supabase.functions.invoke('analyze-style-profile', {
        body: {
          imageBase64,
          gender,
          analysisType: 'body_type'
        }
      });

      if (response.error) throw response.error;
      return response.data.bodyTypeAnalysis;
    } finally {
      setAnalyzing(false);
    }
  };

  // Analyze color profile from image
  const analyzeColorProfile = async (imageBase64: string, gender: 'male' | 'female'): Promise<ColorAnalysis> => {
    setAnalyzing(true);
    try {
      const response = await supabase.functions.invoke('analyze-style-profile', {
        body: {
          imageBase64,
          gender,
          analysisType: 'color_analysis'
        }
      });

      if (response.error) throw response.error;
      return response.data.colorAnalysis;
    } finally {
      setAnalyzing(false);
    }
  };

  // Generate color palette
  const generateColorPalette = async (seasonalType: string, bodyType: string, skinTone: string, undertone: string, gender: 'male' | 'female') => {
    try {
      const response = await supabase.functions.invoke('generate-style-palette', {
        body: {
          seasonalType,
          bodyType,
          skinTone,
          undertone,
          gender
        }
      });

      if (response.error) throw response.error;
      return response.data;
    } catch (error) {
      console.error('Error generating color palette:', error);
      throw error;
    }
  };

  // Save or update style profile
  const saveStyleProfile = async (profileData: Partial<StyleProfile>) => {
    if (!user) return;

    try {
      const profileToSave = {
        user_id: user.id,
        ...profileData,
        analysis_date: new Date().toISOString()
      };

      let result;
      if (styleProfile?.id) {
        // Update existing profile
        result = await supabase
          .from('style_profiles')
          .update(profileToSave)
          .eq('id', styleProfile.id)
          .select()
          .single();
      } else {
        // Create new profile
        result = await supabase
          .from('style_profiles')
          .insert(profileToSave)
          .select()
          .single();
      }

      if (result.error) throw result.error;
      setStyleProfile(result.data);
      return result.data;
    } catch (error) {
      console.error('Error saving style profile:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchStyleProfile();
  }, [user]);

  return {
    styleProfile,
    loading,
    analyzing,
    analyzeBodyType,
    analyzeColorProfile,
    generateColorPalette,
    saveStyleProfile,
    refetch: fetchStyleProfile
  };
};