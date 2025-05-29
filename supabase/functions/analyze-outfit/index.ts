
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

import { AnalyzeOutfitRequest } from './types.ts';
import { generateSystemMessage } from './prompts.ts';
import { parseAIResponse } from './response-parser.ts';
import { callOpenAI, createOpenAIRequest } from './openai-client.ts';
import { handleCORS, createResponse, createErrorResponse } from './cors.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCORS(req);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    const requestData: AnalyzeOutfitRequest = await req.json();
    const { imageBase64, gender, feedbackMode, eventContext, isNeutral } = requestData;
    
    if (!imageBase64) {
      throw new Error('No image provided');
    }

    console.log(`Analyzing ${gender} outfit in ${feedbackMode} mode...`);
    if (eventContext && !isNeutral) {
      console.log(`Event context: ${eventContext}`);
    } else if (isNeutral) {
      console.log('Neutral context - no specific occasion');
    }

    // Generate system message based on request parameters
    const systemMessage = generateSystemMessage(requestData);

    // Create OpenAI request
    const openaiRequest = createOpenAIRequest(systemMessage, imageBase64, eventContext, isNeutral);

    // Call OpenAI API
    const aiResponse = await callOpenAI(openaiRequest);
    console.log("AI response received");

    // Parse AI response
    const result = parseAIResponse(aiResponse, requestData);

    return createResponse(result);
    
  } catch (error) {
    console.error("Error:", error.message);
    return createErrorResponse(error.message || 'An unknown error occurred');
  }
});
