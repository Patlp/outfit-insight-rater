import { useCallback } from 'react';

interface ImageComparisonResult {
  similarity: number;
  isSimilar: boolean;
  confidence: number;
}

export const useImageComparison = () => {
  
  // Enhanced image hash generation with more data points
  const generateAdvancedImageHash = useCallback((imageBase64: string): string => {
    // Use multiple sample points from the image for better uniqueness
    const length = imageBase64.length;
    const samples = [
      imageBase64.substring(0, 200), // Start
      imageBase64.substring(Math.floor(length * 0.25), Math.floor(length * 0.25) + 200), // Quarter
      imageBase64.substring(Math.floor(length * 0.5), Math.floor(length * 0.5) + 200), // Middle
      imageBase64.substring(Math.floor(length * 0.75), Math.floor(length * 0.75) + 200), // Three-quarters
      imageBase64.substring(length - 200), // End
    ];

    let combinedHash = '';
    samples.forEach((sample, index) => {
      let hash = 0;
      for (let i = 0; i < sample.length; i++) {
        const char = sample.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      combinedHash += `${index}_${hash}_`;
    });

    return `${combinedHash}${length}`;
  }, []);

  // Simple similarity comparison based on image properties
  const compareImages = useCallback((imageBase64A: string, imageBase64B: string, threshold: number = 0.95): ImageComparisonResult => {
    if (imageBase64A === imageBase64B) {
      return {
        similarity: 1.0,
        isSimilar: true,
        confidence: 1.0
      };
    }

    const hashA = generateAdvancedImageHash(imageBase64A);
    const hashB = generateAdvancedImageHash(imageBase64B);
    
    // Compare lengths (basic similarity indicator)
    const lengthDiff = Math.abs(imageBase64A.length - imageBase64B.length);
    const maxLength = Math.max(imageBase64A.length, imageBase64B.length);
    const lengthSimilarity = 1 - (lengthDiff / maxLength);
    
    // Compare hash components
    const hashPartsA = hashA.split('_');
    const hashPartsB = hashB.split('_');
    
    let matchingParts = 0;
    const minParts = Math.min(hashPartsA.length, hashPartsB.length);
    
    for (let i = 0; i < minParts; i++) {
      if (hashPartsA[i] === hashPartsB[i]) {
        matchingParts++;
      }
    }
    
    const hashSimilarity = matchingParts / minParts;
    
    // Combine length and hash similarity
    const overallSimilarity = (lengthSimilarity * 0.3) + (hashSimilarity * 0.7);
    
    const result = {
      similarity: overallSimilarity,
      isSimilar: overallSimilarity >= threshold,
      confidence: Math.min(lengthSimilarity, hashSimilarity) // Lower of the two as confidence
    };

    console.log('🔍 Image comparison result:', {
      lengthSimilarity: lengthSimilarity.toFixed(3),
      hashSimilarity: hashSimilarity.toFixed(3),
      overallSimilarity: overallSimilarity.toFixed(3),
      isSimilar: result.isSimilar,
      threshold
    });

    return result;
  }, [generateAdvancedImageHash]);

  // Find similar images in a collection
  const findSimilarImages = useCallback((
    targetImage: string, 
    imageCollection: { id: string; image_url: string; created_at: string }[],
    threshold: number = 0.9
  ) => {
    const similarities = imageCollection.map(item => ({
      ...item,
      comparison: compareImages(targetImage, item.image_url, threshold)
    }));

    const similarImages = similarities.filter(item => item.comparison.isSimilar);
    
    console.log('🔍 Found similar images:', {
      total: imageCollection.length,
      similar: similarImages.length,
      threshold
    });

    return {
      similarImages,
      allComparisons: similarities
    };
  }, [compareImages]);

  return {
    generateAdvancedImageHash,
    compareImages,
    findSimilarImages
  };
};