
import React, { createContext, useContext, useState } from 'react';

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

export const RatingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ratingResult, setRatingResult] = useState<RatingResult | null>(null);
  const [selectedGender, setSelectedGender] = useState<Gender>('female');
  const [occasionContext, setOccasionContext] = useState<OccasionContext | null>(null);
  const [isRoastMode, setIsRoastMode] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  
  // Image upload state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  
  // UI state
  const [currentStep, setCurrentStep] = useState<'upload' | 'analyze'>('upload');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Roast mode state
  const [feedbackMode, setFeedbackMode] = useState<FeedbackMode>('normal');
  const [hasUnlockedRoastMode, setHasUnlockedRoastMode] = useState(false);
  const [showInviteWall, setShowInviteWall] = useState(false);

  const resetState = () => {
    setImageFile(null);
    setImageSrc(null);
    setCurrentStep('upload');
    setIsAnalyzing(false);
    setRatingResult(null);
    setUploadedImage(null);
    setOccasionContext(null);
  };

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
