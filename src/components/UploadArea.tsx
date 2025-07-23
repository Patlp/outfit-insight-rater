
import React from 'react';
import { useRating } from '@/context/RatingContext';
import CombinedUploadForm from '@/components/upload/CombinedUploadForm';
import ImagePreview from '@/components/upload/ImagePreview';
import AnalyzeButton from '@/components/upload/AnalyzeButton';
import UploadMonitor from '@/components/upload/UploadMonitor';
import { toast } from 'sonner';

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
    console.log('UploadArea: File processed successfully, updating state');
    
    try {
      setImageFile(file);
      setImageSrc(src);
      setOccasionContext(occasionData);
      setCurrentStep('analyze');
      
      console.log('UploadArea: State updated successfully');
      
      // Prevent automatic scroll to top after state change
      setTimeout(() => {
        const element = document.querySelector('[data-upload-area]');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          console.log('UploadArea: Scrolled to analyze view');
        }
      }, 100);
    } catch (error) {
      console.error('UploadArea: Error updating state:', error);
      toast.error('Failed to update application state. Please try again.');
    }
  };

  const handleReset = () => {
    resetState();
  };

  return (
    <UploadMonitor>
      {/* Step 1: Combined Upload Form (occasion + file upload) */}
      {currentStep === 'upload' && (
        <CombinedUploadForm onFileProcessed={handleFileProcessed} />
      )}

      {/* Step 2: Image Preview and Analysis */}
      {imageSrc && (
        <div className="max-w-md w-full mx-auto space-y-4" data-upload-area>
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
      )}

      {/* Fallback: Show upload form if no other conditions match */}
      {!imageSrc && currentStep !== 'upload' && (
        <CombinedUploadForm onFileProcessed={handleFileProcessed} />
      )}
    </UploadMonitor>
  );
};

export default UploadArea;
