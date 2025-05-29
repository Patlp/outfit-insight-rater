
import React from 'react';
import { useRating } from '@/context/RatingContext';
import CombinedUploadForm from '@/components/upload/CombinedUploadForm';
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

  const handleFileProcessed = (file: File, src: string, occasionData: { eventContext: string | null; isNeutral: boolean }) => {
    setImageFile(file);
    setImageSrc(src);
    setOccasionContext(occasionData);
    setCurrentStep('analyze');
  };

  const handleReset = () => {
    resetState();
  };

  // Step 1: Combined Upload Form (occasion + file upload)
  if (currentStep === 'upload') {
    return <CombinedUploadForm onFileProcessed={handleFileProcessed} />;
  }

  // Step 2: Image Preview and Analysis
  if (imageSrc) {
    return (
      <div className="max-w-md w-full mx-auto space-y-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handleReset}
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

  return <CombinedUploadForm onFileProcessed={handleFileProcessed} />;
};

export default UploadArea;
