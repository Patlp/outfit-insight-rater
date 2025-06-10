
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DetectionRequest {
  imageBase64: string;
}

interface DetectionResponse {
  success: boolean;
  detections?: Array<{
    class: string;
    confidence: number;
    bbox: [number, number, number, number];
  }>;
  error?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 }: DetectionRequest = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing imageBase64 parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔍 Starting clothing object detection...');

    // For now, we'll use a mock detection response that simulates realistic clothing detection
    // In a real implementation, this would call a computer vision API like Roboflow, YOLOv8, or similar
    const mockDetections = generateMockDetections();

    console.log(`✅ Mock detection complete: ${mockDetections.length} items found`);

    const response: DetectionResponse = {
      success: true,
      detections: mockDetections
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Detection error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateMockDetections() {
  // Generate 2-4 realistic clothing detections with varied positions
  const clothingItems = ['shirt', 'pants', 'jacket', 'shoes', 'hat', 'bag'];
  const numDetections = Math.floor(Math.random() * 3) + 2; // 2-4 items
  
  const detections = [];
  
  for (let i = 0; i < numDetections; i++) {
    const item = clothingItems[Math.floor(Math.random() * clothingItems.length)];
    
    // Generate realistic bounding boxes for different clothing items
    let bbox: [number, number, number, number];
    
    switch (item) {
      case 'shirt':
        bbox = [50 + Math.random() * 100, 80 + Math.random() * 50, 200 + Math.random() * 100, 150 + Math.random() * 50];
        break;
      case 'pants':
        bbox = [40 + Math.random() * 120, 200 + Math.random() * 100, 180 + Math.random() * 80, 200 + Math.random() * 100];
        break;
      case 'jacket':
        bbox = [30 + Math.random() * 140, 60 + Math.random() * 80, 220 + Math.random() * 80, 180 + Math.random() * 70];
        break;
      case 'shoes':
        bbox = [60 + Math.random() * 100, 350 + Math.random() * 100, 120 + Math.random() * 60, 80 + Math.random() * 40];
        break;
      case 'hat':
        bbox = [80 + Math.random() * 80, 10 + Math.random() * 30, 100 + Math.random() * 50, 60 + Math.random() * 30];
        break;
      case 'bag':
        bbox = [200 + Math.random() * 100, 150 + Math.random() * 150, 100 + Math.random() * 80, 120 + Math.random() * 80];
        break;
      default:
        bbox = [50 + Math.random() * 150, 100 + Math.random() * 200, 150 + Math.random() * 100, 100 + Math.random() * 100];
    }
    
    detections.push({
      class: item,
      confidence: 0.7 + Math.random() * 0.25, // 0.7 - 0.95
      bbox
    });
  }
  
  return detections;
}
