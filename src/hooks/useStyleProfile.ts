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
    if (!user) {
      console.log('No user found, skipping style profile fetch');
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching style profile for user:', user.id);
      const { data, error } = await supabase
        .from('style_profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('analysis_date', { ascending: false })
        .limit(1)
        .single();

      console.log('Style profile query result:', { data, error });

      if (error) {
        if (error.code === 'PGRST116') {
          // No records found
          console.log('No style profile found for user');
          setStyleProfile(null);
        } else {
          console.error('Database error fetching style profile:', error);
          throw error;
        }
      } else {
        setStyleProfile(data);
        console.log('Style profile set:', data);
      }
    } catch (error) {
      console.error('Error fetching style profile:', error);
      // Don't throw, just set to null to allow UI to continue
      setStyleProfile(null);
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
    console.log('Generating color palette with params:', { seasonalType, bodyType, skinTone, undertone, gender });
    
    try {
      console.log('About to invoke generate-style-palette function...');
      
      // Add explicit error handling for the function call
      const response = await supabase.functions.invoke('generate-style-palette', {
        body: {
          seasonalType,
          bodyType,
          skinTone,
          undertone,
          gender
        }
      });

      console.log('Color palette response received:', response);
      console.log('Response error:', response.error);
      console.log('Response data:', response.data);

      // Check for specific function errors
      if (response.error) {
        console.error('Supabase function error details:', response.error);
        
        // Handle different types of errors
        if (response.error.message?.includes('FunctionsFetchError')) {
          throw new Error('Unable to connect to the color palette service. Please check your internet connection and try again.');
        }
        
        if (response.error.message?.includes('missing required fields')) {
          throw new Error('Invalid data provided for color palette generation.');
        }
        
        throw new Error(`Service error: ${response.error.message || 'Color palette service unavailable'}`);
      }
      
      if (!response.data) {
        console.error('No data returned from function');
        throw new Error('Color palette service returned no data. Please try again.');
      }
      
      // Validate response structure
      if (!response.data.categoryRecommendations || !Array.isArray(response.data.categoryRecommendations)) {
        console.error('Invalid response structure:', response.data);
        throw new Error('Invalid response from color palette service.');
      }
      
      console.log('Successfully received palette data, returning:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error generating color palette - full error:', error);
      console.error('Error name:', error?.name);
      console.error('Error type:', typeof error);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      
      // Handle specific error types
      if (error?.name === 'FunctionsFetchError') {
        throw new Error('Network connection failed. Please check your internet connection and try again.');
      }
      
      if (error?.message?.includes('Load failed')) {
        throw new Error('Failed to load color palette service. Please try again.');
      }
      
      if (error?.message?.includes('Function error:') || error?.message?.includes('Service error:')) {
        throw error; // Already formatted
      }
      
      throw new Error(`Failed to generate color palette: ${error?.message || 'Unknown error occurred'}`);
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