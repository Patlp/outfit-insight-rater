
import React, { createContext, useContext, useState, useEffect } from 'react';

export type Gender = 'male' | 'female' | 'neutral';
export type FeedbackMode = 'normal' | 'roast';

export interface RatingResult {
  score: number;
  feedback: string;
  suggestions: string[];
}

export interface OccasionContext {
  eventContext: string | null;
  weatherContext: string | null;
  isNeutral?: boolean;
}

interface RatingContextType {
  ratingResult: RatingResult | null;
  setRatingResult: (result: RatingResult | null) => void;
  selectedGender: Gender;
  setSelectedGender: (gender: Gender) => void;
  occasionContext: OccasionContext | null;
  setOccasionContext: (context: OccasionContext | null) => void;
  isRoastMode: boolean;
  setIsRoastMode: (isRoast: boolean) => void;
  uploadedImage: string | null;
  setUploadedImage: (imageUrl: string | null) => void;
  // Image upload properties
  imageFile: File | null;
  setImageFile: (file: File | null) => void;
  imageSrc: string | null;
  setImageSrc: (src: string | null) => void;
  // UI state properties
  currentStep: 'upload' | 'analyze';
  setCurrentStep: (step: 'upload' | 'analyze') => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (analyzing: boolean) => void;
  // Roast mode properties
  feedbackMode: FeedbackMode;
  setFeedbackMode: (mode: FeedbackMode) => void;
  hasUnlockedRoastMode: boolean;
  setHasUnlockedRoastMode: (unlocked: boolean) => void;
  showInviteWall: boolean;
  setShowInviteWall: (show: boolean) => void;
  // Reset function
  resetState: () => void;
}

const RatingContext = createContext<RatingContextType | undefined>(undefined);

export const useRating = () => {
  const context = useContext(RatingContext);
  if (context === undefined) {
    throw new Error('useRating must be used within a RatingProvider');
  }
  return context;
};

// LocalStorage keys for persistence
const STORAGE_KEYS = {
  RATING_RESULT: 'ratemyfit_rating_result',
  UPLOADED_IMAGE: 'ratemyfit_uploaded_image',
  SELECTED_GENDER: 'ratemyfit_selected_gender',
  OCCASION_CONTEXT: 'ratemyfit_occasion_context',
  FEEDBACK_MODE: 'ratemyfit_feedback_mode'
};

// Helper functions for localStorage operations
const saveToStorage = (key: string, value: any) => {
  try {
    if (value === null || value === undefined) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch (error) {
    console.warn('Failed to save to localStorage:', error);
  }
};

const loadFromStorage = (key: string) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.warn('Failed to load from localStorage:', error);
    return null;
  }
};

const clearPersistedData = () => {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
};

export const RatingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize state from localStorage or defaults
  const [ratingResult, setRatingResultState] = useState<RatingResult | null>(() => 
    loadFromStorage(STORAGE_KEYS.RATING_RESULT)
  );
  const [selectedGender, setSelectedGenderState] = useState<Gender>(() => 
    loadFromStorage(STORAGE_KEYS.SELECTED_GENDER) || 'female'
  );
  const [occasionContext, setOccasionContextState] = useState<OccasionContext | null>(() => 
    loadFromStorage(STORAGE_KEYS.OCCASION_CONTEXT)
  );
  const [uploadedImage, setUploadedImageState] = useState<string | null>(() => 
    loadFromStorage(STORAGE_KEYS.UPLOADED_IMAGE)
  );
  const [feedbackMode, setFeedbackModeState] = useState<FeedbackMode>(() => 
    loadFromStorage(STORAGE_KEYS.FEEDBACK_MODE) || 'normal'
  );
  
  // Non-persisted state
  const [isRoastMode, setIsRoastMode] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'upload' | 'analyze'>('upload');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasUnlockedRoastMode, setHasUnlockedRoastMode] = useState(false);
  const [showInviteWall, setShowInviteWall] = useState(false);

  // Wrapper functions that persist to localStorage
  const setRatingResult = (result: RatingResult | null) => {
    setRatingResultState(result);
    saveToStorage(STORAGE_KEYS.RATING_RESULT, result);
  };

  const setSelectedGender = (gender: Gender) => {
    setSelectedGenderState(gender);
    saveToStorage(STORAGE_KEYS.SELECTED_GENDER, gender);
  };

  const setOccasionContext = (context: OccasionContext | null) => {
    setOccasionContextState(context);
    saveToStorage(STORAGE_KEYS.OCCASION_CONTEXT, context);
  };

  const setUploadedImage = (imageUrl: string | null) => {
    setUploadedImageState(imageUrl);
    saveToStorage(STORAGE_KEYS.UPLOADED_IMAGE, imageUrl);
  };

  const setFeedbackMode = (mode: FeedbackMode) => {
    setFeedbackModeState(mode);
    saveToStorage(STORAGE_KEYS.FEEDBACK_MODE, mode);
  };

  // Reset function that clears both state and localStorage
  const resetState = () => {
    setImageFile(null);
    setImageSrc(null);
    setCurrentStep('upload');
    setIsAnalyzing(false);
    setRatingResult(null);
    setUploadedImage(null);
    setOccasionContext(null);
    
    // Clear persisted data
    clearPersistedData();
  };

  // Effect to restore imageSrc and currentStep from uploadedImage on mount
  useEffect(() => {
    if (uploadedImage && !imageSrc) {
      setImageSrc(uploadedImage);
      setCurrentStep('analyze');
    }
  }, [uploadedImage, imageSrc]);

  const value = {
    ratingResult,
    setRatingResult,
    selectedGender,
    setSelectedGender,
    occasionContext,
    setOccasionContext,
    isRoastMode,
    setIsRoastMode,
    uploadedImage,
    setUploadedImage,
    imageFile,
    setImageFile,
    imageSrc,
    setImageSrc,
    currentStep,
    setCurrentStep,
    isAnalyzing,
    setIsAnalyzing,
    feedbackMode,
    setFeedbackMode,
    hasUnlockedRoastMode,
    setHasUnlockedRoastMode,
    showInviteWall,
    setShowInviteWall,
    resetState,
  };

  return <RatingContext.Provider value={value}>{children}</RatingContext.Provider>;
};
