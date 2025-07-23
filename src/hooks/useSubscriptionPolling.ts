import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';

interface UseSubscriptionPollingOptions {
  enabled?: boolean;
  interval?: number;
  maxAttempts?: number;
  onSuccess?: () => void;
  onMaxAttemptsReached?: () => void;
}

export const useSubscriptionPolling = (options: UseSubscriptionPollingOptions = {}) => {
  const {
    enabled = false,
    interval = 5000,
    maxAttempts = 20,
    onSuccess,
    onMaxAttemptsReached
  } = options;

  const { subscription, checkSubscription } = useAuth();
  const attemptCountRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled || subscription.subscribed) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      attemptCountRef.current = 0;
      return;
    }

    const pollSubscription = async () => {
      try {
        const isSubscribed = await checkSubscription();
        attemptCountRef.current += 1;

        if (isSubscribed) {
          onSuccess?.();
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          attemptCountRef.current = 0;
        } else if (attemptCountRef.current >= maxAttempts) {
          onMaxAttemptsReached?.();
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          attemptCountRef.current = 0;
        }
      } catch (error) {
        console.error('Polling error:', error);
        attemptCountRef.current += 1;
        
        if (attemptCountRef.current >= maxAttempts) {
          onMaxAttemptsReached?.();
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          attemptCountRef.current = 0;
        }
      }
    };

    // Start polling
    intervalRef.current = setInterval(pollSubscription, interval);

    // Initial check
    pollSubscription();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      attemptCountRef.current = 0;
    };
  }, [enabled, subscription.subscribed, interval, maxAttempts, checkSubscription, onSuccess, onMaxAttemptsReached]);

  return {
    currentAttempt: attemptCountRef.current,
    maxAttempts,
    isPolling: enabled && !subscription.subscribed && intervalRef.current !== null
  };
};