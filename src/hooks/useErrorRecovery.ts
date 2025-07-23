import { useEffect } from 'react';
import { toast } from 'sonner';

interface ErrorRecoveryOptions {
  onError?: (error: Error) => void;
  maxRetries?: number;
  retryDelay?: number;
}

export const useErrorRecovery = (options: ErrorRecoveryOptions = {}) => {
  const { onError, maxRetries = 3, retryDelay = 1000 } = options;

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      if (onError && event.reason instanceof Error) {
        onError(event.reason);
      }
      
      // Prevent the default behavior which would log to console
      event.preventDefault();
      
      // Show user-friendly error message
      toast.error('Something went wrong. Please try again.');
    };

    const handleError = (event: ErrorEvent) => {
      console.error('Global error:', event.error);
      
      if (onError && event.error instanceof Error) {
        onError(event.error);
      }
      
      // Show user-friendly error message
      toast.error('An unexpected error occurred. Please refresh the page.');
    };

    // Add global error handlers
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, [onError]);

  const retryWithBackoff = async <T>(
    operation: () => Promise<T>,
    retries = maxRetries
  ): Promise<T> => {
    try {
      return await operation();
    } catch (error) {
      if (retries > 0) {
        console.log(`Retrying operation, ${retries} attempts remaining`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return retryWithBackoff(operation, retries - 1);
      }
      throw error;
    }
  };

  return { retryWithBackoff };
};