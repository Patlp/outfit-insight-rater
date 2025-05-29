
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

import { AnalyzeOutfitRequest } from './types.ts';
import { generateSystemMessage } from './prompts.ts';
import { parseAIResponse } from './response-parser.ts';
import { callOpenAI, createOpenAIRequest } from './openai-client.ts';
import { handleCORS, createResponse, createErrorResponse } from './cors.ts';
import { validateResponse } from './response-validator.ts';

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
    if (feedbackMode === 'roast') {
      console.log('🔥 ROAST MODE ACTIVATED - Preparing brutal feedback...');
    }
    if (eventContext && !isNeutral) {
      console.log(`Event context: ${eventContext}`);
    } else if (isNeutral) {
      console.log('Neutral context - no specific occasion');
    }

    // Generate enhanced system message
    const systemMessage = generateSystemMessage(requestData);
    console.log('Using enhanced prompts for better response quality');

    // Create OpenAI request with feedback mode for temperature adjustment
    const openaiRequest = createOpenAIRequest(systemMessage, imageBase64, eventContext, isNeutral, feedbackMode);

    // Call OpenAI API
    const aiResponse = await callOpenAI(openaiRequest);
    console.log("AI response received, processing with advanced parser...");

    // Parse AI response with advanced parser
    const result = parseAIResponse(aiResponse, requestData);

    // Final validation
    const validation = validateResponse(result);
    if (!validation.isValid) {
      console.error('Final validation failed:', validation.errors);
    } else if (validation.warnings.length > 0) {
      console.warn('Response has warnings:', validation.warnings);
    } else {
      console.log('Response validation passed successfully');
    }

    return createResponse(result);
    
  } catch (error) {
    console.error("Error:", error.message);
    return createErrorResponse(error.message || 'An unknown error occurred');
  }
});
