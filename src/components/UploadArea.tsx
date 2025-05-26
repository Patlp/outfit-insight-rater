
import React from 'react';
import { useRating } from '@/context/RatingContext';
import OccasionContextInput from '@/components/upload/OccasionContextInput';
import FileUploadZone from '@/components/upload/FileUploadZone';
import ImagePreview from '@/components/upload/ImagePreview';
import AnalyzeButton from '@/components/upload/AnalyzeButton';

const UploadArea: React.FC = () => {
  const {
    imageFile,
    setImageFile,
    imageSrc,
    setImageSrc,
    resetState,
    occasionContext,
    setOccasionContext,
    currentStep,
    setCurrentStep
  } = useRating();

  const handleOccasionNext = (context: { eventContext: string | null; isNeutral: boolean }) => {
    setOccasionContext(context);
    setCurrentStep('upload');
  };

  const handleFileProcessed = (file: File, src: string) => {
    setImageFile(file);
    setImageSrc(src);
    setCurrentStep('analyze');
  };

  const handleReset = () => {
    resetState();
  };

  const handleBackToOccasion = () => {
    setCurrentStep('occasion');
    setImageFile(null);
    setImageSrc(null);
  };

  // Step 1: Occasion Context Input
  if (currentStep === 'occasion') {
    return <OccasionContextInput onNext={handleOccasionNext} />;
  }

  // Step 2: File Upload
  if (currentStep === 'upload') {
    return (
      <div className="max-w-md w-full mx-auto space-y-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handleBackToOccasion}
            className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
          >
            ← Back to occasion
          </button>
          {occasionContext && !occasionContext.isNeutral && (
            <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {occasionContext.eventContext}
            </div>
          )}
        </div>
        <FileUploadZone onFileProcessed={handleFileProcessed} />
      </div>
    );
  }

  // Step 3: Image Preview and Analysis
  if (imageSrc) {
    return (
      <div className="max-w-md w-full mx-auto space-y-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handleBackToOccasion}
            className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
          >
            ← Start over
          </button>
          {occasionContext && !occasionContext.isNeutral && (
            <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {occasionContext.eventContext}
            </div>
          )}
        </div>
        <ImagePreview imageSrc={imageSrc} onReset={handleReset}>
          <AnalyzeButton imageFile={imageFile} imageSrc={imageSrc} />
        </ImagePreview>
      </div>
    );
  }

  return <FileUploadZone onFileProcessed={handleFileProcessed} />;
};

export default UploadArea;
