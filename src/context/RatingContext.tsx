
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export type Gender = 'male' | 'female';
export type FeedbackMode = 'normal' | 'roast';

export interface RatingResult {
  score: number;
  feedback: string;
  suggestions: string[];
}

interface RatingContextType {
  selectedGender: Gender;
  setSelectedGender: (gender: Gender) => void;
  feedbackMode: FeedbackMode;
  setFeedbackMode: (mode: FeedbackMode) => void;
  imageFile: File | null;
  setImageFile: (file: File | null) => void;
  imageSrc: string | null;
  setImageSrc: (src: string | null) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (isAnalyzing: boolean) => void;
  ratingResult: RatingResult | null;
  setRatingResult: (result: RatingResult | null) => void;
  resetState: () => void;
  hasUnlockedRoastMode: boolean;
  setHasUnlockedRoastMode: (unlocked: boolean) => void;
  showInviteWall: boolean;
  setShowInviteWall: (show: boolean) => void;
}

const RatingContext = createContext<RatingContextType | undefined>(undefined);

export const RatingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedGender, setSelectedGender] = useState<Gender>('female');
  const [feedbackMode, setFeedbackMode] = useState<FeedbackMode>('normal');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [ratingResult, setRatingResult] = useState<RatingResult | null>(null);
  const [hasUnlockedRoastMode, setHasUnlockedRoastMode] = useState<boolean>(false);
  const [showInviteWall, setShowInviteWall] = useState<boolean>(false);

  // Check localStorage on initial load to see if roast mode is already unlocked
  useEffect(() => {
    const unlocked = localStorage.getItem('hasUnlockedRoastMode') === 'true';
    setHasUnlockedRoastMode(unlocked);
  }, []);

  // Save unlocked status to localStorage when it changes
  useEffect(() => {
    if (hasUnlockedRoastMode) {
      localStorage.setItem('hasUnlockedRoastMode', 'true');
    }
  }, [hasUnlockedRoastMode]);

  const resetState = () => {
    setImageFile(null);
    setImageSrc(null);
    setRatingResult(null);
  };

  return (
    <RatingContext.Provider
      value={{
        selectedGender,
        setSelectedGender,
        feedbackMode,
        setFeedbackMode,
        imageFile,
        setImageFile,
        imageSrc,
        setImageSrc,
        isAnalyzing,
        setIsAnalyzing,
        ratingResult,
        setRatingResult,
        resetState,
        hasUnlockedRoastMode,
        setHasUnlockedRoastMode,
        showInviteWall,
        setShowInviteWall,
      }}
    >
      {children}
    </RatingContext.Provider>
  );
};

export const useRating = (): RatingContextType => {
  const context = useContext(RatingContext);
  if (context === undefined) {
    throw new Error('useRating must be used within a RatingProvider');
  }
  return context;
};
