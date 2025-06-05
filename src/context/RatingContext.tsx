import React, { createContext, useContext, useState } from 'react';

export type Gender = 'male' | 'female' | 'neutral';

export interface RatingResult {
  score: number;
  feedback: string;
  suggestions: string[];
}

export interface OccasionContext {
  eventContext: string | null;
  weatherContext: string | null;
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
  };

  return <RatingContext.Provider value={value}>{children}</RatingContext.Provider>;
};
