
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
      console.log('🔥🔥🔥 ROAST MODE ACTIVATED - PREPARING MAXIMUM BRUTALITY 🔥🔥🔥');
      console.log('🔥 Brutality level: MAXIMUM');
      console.log('🔥 Savage mode: ENGAGED');
      console.log('🔥 Mercy level: ZERO');
    }
    if (eventContext && !isNeutral) {
      console.log(`Event context: ${eventContext}`);
    } else if (isNeutral) {
      console.log('Neutral context - no specific occasion');
    }

    // Generate enhanced system message
    const systemMessage = generateSystemMessage(requestData);
    if (feedbackMode === 'roast') {
      console.log('🔥 Using BRUTAL roast prompts for maximum savagery');
    } else {
      console.log('Using enhanced prompts for better response quality');
    }

    // Create OpenAI request with MAXIMUM creativity for roast mode
    const openaiRequest = createOpenAIRequest(systemMessage, imageBase64, eventContext, isNeutral, feedbackMode);
    
    if (feedbackMode === 'roast') {
      console.log(`🔥 Using temperature ${openaiRequest.temperature} for maximum creative brutality`);
    }

    // Call OpenAI API
    const aiResponse = await callOpenAI(openaiRequest);
    console.log("AI response received, processing...");
    
    if (feedbackMode === 'roast') {
      console.log('🔥 Processing roast response with specialized brutal parser...');
    } else {
      console.log("Processing with advanced parser...");
    }

    // Parse AI response with advanced parser (automatically detects roast mode)
    const result = parseAIResponse(aiResponse, requestData);

    // Final validation with feedback mode
    const validation = validateResponse(result, feedbackMode);
    if (!validation.isValid) {
      console.error('Final validation failed:', validation.errors);
      if (feedbackMode === 'roast') {
        console.error('🔥 ROAST VALIDATION FAILED - Response not brutal enough');
      }
    } else if (validation.warnings.length > 0) {
      console.warn('Response has warnings:', validation.warnings);
      if (feedbackMode === 'roast') {
        console.warn('🔥 ROAST WARNINGS - Could be more savage');
      }
    } else {
      console.log('Response validation passed successfully');
      if (feedbackMode === 'roast') {
        console.log('🔥 ROAST VALIDATION PASSED - Maximum brutality achieved!');
      }
    }

    return createResponse(result);
    
  } catch (error) {
    console.error("Error:", error.message);
    return createErrorResponse(error.message || 'An unknown error occurred');
  }
});
