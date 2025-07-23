import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UploadData {
  imageBase64: string;
  gender: 'male' | 'female';
  feedbackMode: 'normal' | 'roast';
  timestamp: number;
}

interface AnalysisResult {
  score: number;
  feedback: string;
  suggestions: string[];
  styleAnalysis?: any;
}

interface UploadSessionContextType {
  currentUpload: UploadData | null;
  analysisResult: AnalysisResult | null;
  setCurrentUpload: (upload: UploadData | null) => void;
  setAnalysisResult: (result: AnalysisResult | null) => void;
  clearSession: () => void;
  hasSessionData: boolean;
}

const UploadSessionContext = createContext<UploadSessionContextType | undefined>(undefined);

export const UploadSessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUpload, setCurrentUpload] = useState<UploadData | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const clearSession = () => {
    setCurrentUpload(null);
    setAnalysisResult(null);
  };

  const hasSessionData = currentUpload !== null || analysisResult !== null;

  return (
    <UploadSessionContext.Provider
      value={{
        currentUpload,
        analysisResult,
        setCurrentUpload,
        setAnalysisResult,
        clearSession,
        hasSessionData,
      }}
    >
      {children}
    </UploadSessionContext.Provider>
  );
};

export const useUploadSession = (): UploadSessionContextType => {
  const context = useContext(UploadSessionContext);
  if (context === undefined) {
    throw new Error('useUploadSession must be used within an UploadSessionProvider');
  }
  return context;
};