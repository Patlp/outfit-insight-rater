import React, { useEffect, useState } from 'react';
import { useRating } from '@/context/RatingContext';
import { performanceMonitor } from '@/utils/performanceMonitor';
import { toast } from 'sonner';

interface UploadMonitorProps {
  children: React.ReactNode;
}

const UploadMonitor: React.FC<UploadMonitorProps> = ({ children }) => {
  const { imageFile, imageSrc, isAnalyzing, currentStep } = useRating();
  const [uploadTimeout, setUploadTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Monitor for upload hanging
    if (currentStep === 'analyze' && imageFile && imageSrc) {
      console.log('Upload completed successfully');
      performanceMonitor.logMemoryUsage('upload-complete');
      
      // Clear any existing timeout
      if (uploadTimeout) {
        clearTimeout(uploadTimeout);
        setUploadTimeout(null);
      }
    }
  }, [currentStep, imageFile, imageSrc, uploadTimeout]);

  useEffect(() => {
    // Monitor analysis timeout
    if (isAnalyzing) {
      console.log('Analysis started, setting timeout monitor');
      
      const timeout = setTimeout(() => {
        console.warn('Analysis taking longer than expected (60s)');
        toast.warning('Analysis is taking longer than usual. Please wait...');
      }, 60000); // 60 seconds

      return () => {
        clearTimeout(timeout);
        console.log('Analysis timeout monitor cleared');
      };
    }
  }, [isAnalyzing]);

  useEffect(() => {
    // Log memory usage periodically
    const memoryInterval = setInterval(() => {
      performanceMonitor.logMemoryUsage('periodic-check');
    }, 30000); // Every 30 seconds

    return () => clearInterval(memoryInterval);
  }, []);

  return <>{children}</>;
};

export default UploadMonitor;