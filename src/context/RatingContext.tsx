
import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Gender = 'male' | 'female';

export interface RatingResult {
  score: number;
  feedback: string;
  suggestions: string[];
}

interface RatingContextType {
  selectedGender: Gender;
  setSelectedGender: (gender: Gender) => void;
  imageFile: File | null;
  setImageFile: (file: File | null) => void;
  imageSrc: string | null;
  setImageSrc: (src: string | null) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (isAnalyzing: boolean) => void;
  ratingResult: RatingResult | null;
  setRatingResult: (result: RatingResult | null) => void;
  resetState: () => void;
}

const RatingContext = createContext<RatingContextType | undefined>(undefined);

export const RatingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedGender, setSelectedGender] = useState<Gender>('female');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [ratingResult, setRatingResult] = useState<RatingResult | null>(null);

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
        imageFile,
        setImageFile,
        imageSrc,
        setImageSrc,
        isAnalyzing,
        setIsAnalyzing,
        ratingResult,
        setRatingResult,
        resetState,
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
