
const GOOGLE_VISION_API_KEY = 'AIzaSyB5ck3I-Vc95beRtY9wgB3XL7237IeOAF8';
const VISION_API_URL = `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`;

export interface GoogleVisionLabel {
  description: string;
  score: number;
  topicality: number;
}

interface GoogleVisionResponse {
  responses: Array<{
    labelAnnotations?: GoogleVisionLabel[];
    error?: {
      code: number;
      message: string;
    };
  }>;
}

export const analyzeImageWithGoogleVision = async (imageUrl: string): Promise<{ success: boolean; labels?: GoogleVisionLabel[]; error?: string }> => {
  try {
    console.log('=== GOOGLE VISION ANALYSIS WITH GRAMMAR RULES ===');
    console.log('Analyzing image with enhanced structure validation:', imageUrl);
    
    const requestBody = {
      requests: [
        {
          image: {
            source: {
              imageUri: imageUrl
            }
          },
          features: [
            {
              type: "LABEL_DETECTION",
              maxResults: 25
            }
          ]
        }
      ]
    };

    const response = await fetch(VISION_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Vision API request failed: ${response.status} ${response.statusText}`);
    }

    const data: GoogleVisionResponse = await response.json();
    
    if (data.responses[0]?.error) {
      throw new Error(`Vision API error: ${data.responses[0].error.message}`);
    }

    const labels = data.responses[0]?.labelAnnotations || [];
    console.log(`Google Vision returned ${labels.length} labels for grammar processing`);

    return { success: true, labels };
  } catch (error) {
    console.error('Google Vision API error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown Vision API error' 
    };
  }
};
