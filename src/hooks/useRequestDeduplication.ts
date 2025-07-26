import { useState, useRef, useCallback } from 'react';

interface RequestState {
  id: string;
  timestamp: number;
  imageHash: string;
  status: 'pending' | 'completed' | 'failed';
}

interface RequestDeduplicationConfig {
  dedupWindowMs?: number;
  maxConcurrentRequests?: number;
}

const DEFAULT_CONFIG: Required<RequestDeduplicationConfig> = {
  dedupWindowMs: 30000, // 30 seconds
  maxConcurrentRequests: 1
};

export const useRequestDeduplication = (config: RequestDeduplicationConfig = {}) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const [activeRequests, setActiveRequests] = useState<Map<string, RequestState>>(new Map());
  const requestMapRef = useRef(activeRequests);
  
  // Keep ref in sync with state for callback access
  requestMapRef.current = activeRequests;

  // Simple hash function for image content
  const generateImageHash = useCallback((imageBase64: string): string => {
    // Use a subset of the image data and other identifying factors
    const sampleSize = Math.min(1000, imageBase64.length);
    const sample = imageBase64.substring(0, sampleSize);
    
    let hash = 0;
    for (let i = 0; i < sample.length; i++) {
      const char = sample.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return `${hash}_${imageBase64.length}_${sample.substring(0, 20)}`;
  }, []);

  const generateRequestId = useCallback((imageBase64: string, gender: string, feedbackMode: string): string => {
    const imageHash = generateImageHash(imageBase64);
    return `${gender}_${feedbackMode}_${imageHash}`;
  }, [generateImageHash]);

  const cleanExpiredRequests = useCallback(() => {
    const now = Date.now();
    const updatedRequests = new Map(requestMapRef.current);
    let hasChanges = false;

    for (const [requestId, request] of updatedRequests.entries()) {
      if (now - request.timestamp > finalConfig.dedupWindowMs) {
        updatedRequests.delete(requestId);
        hasChanges = true;
      }
    }

    if (hasChanges) {
      setActiveRequests(updatedRequests);
    }
  }, [finalConfig.dedupWindowMs]);

  const isDuplicateRequest = useCallback((imageBase64: string, gender: string, feedbackMode: string): boolean => {
    cleanExpiredRequests();
    
    const requestId = generateRequestId(imageBase64, gender, feedbackMode);
    const existing = requestMapRef.current.get(requestId);
    
    if (!existing) {
      return false;
    }

    const isRecent = Date.now() - existing.timestamp < finalConfig.dedupWindowMs;
    const isPending = existing.status === 'pending';
    
    const isDuplicate = isRecent && (isPending || existing.status === 'completed');
    
    if (isDuplicate) {
      console.log('🚫 Duplicate request detected:', {
        requestId: requestId.substring(0, 50) + '...',
        existingStatus: existing.status,
        ageMs: Date.now() - existing.timestamp,
        isPending,
        isRecent
      });
    }
    
    return isDuplicate;
  }, [cleanExpiredRequests, generateRequestId, finalConfig.dedupWindowMs]);

  const startRequest = useCallback((imageBase64: string, gender: string, feedbackMode: string): string => {
    const requestId = generateRequestId(imageBase64, gender, feedbackMode);
    const imageHash = generateImageHash(imageBase64);
    
    const newRequest: RequestState = {
      id: requestId,
      timestamp: Date.now(),
      imageHash,
      status: 'pending'
    };

    setActiveRequests(prev => {
      const updated = new Map(prev);
      updated.set(requestId, newRequest);
      return updated;
    });

    console.log('🎯 Started new request:', {
      requestId: requestId.substring(0, 50) + '...',
      activeCount: requestMapRef.current.size + 1
    });

    return requestId;
  }, [generateRequestId, generateImageHash]);

  const completeRequest = useCallback((requestId: string) => {
    setActiveRequests(prev => {
      const updated = new Map(prev);
      const existing = updated.get(requestId);
      if (existing) {
        updated.set(requestId, { ...existing, status: 'completed' });
      }
      return updated;
    });

    console.log('✅ Completed request:', requestId.substring(0, 50) + '...');
  }, []);

  const failRequest = useCallback((requestId: string) => {
    setActiveRequests(prev => {
      const updated = new Map(prev);
      const existing = updated.get(requestId);
      if (existing) {
        updated.set(requestId, { ...existing, status: 'failed' });
      }
      return updated;
    });

    console.log('❌ Failed request:', requestId.substring(0, 50) + '...');
  }, []);

  const canMakeRequest = useCallback(() => {
    const pendingCount = Array.from(requestMapRef.current.values())
      .filter(request => request.status === 'pending').length;
    
    return pendingCount < finalConfig.maxConcurrentRequests;
  }, [finalConfig.maxConcurrentRequests]);

  return {
    isDuplicateRequest,
    startRequest,
    completeRequest,
    failRequest,
    canMakeRequest,
    activeRequestCount: activeRequests.size,
    pendingRequestCount: Array.from(activeRequests.values()).filter(r => r.status === 'pending').length
  };
};
