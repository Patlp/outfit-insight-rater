
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
    console.log('🚀 Starting outfit analysis...');
    
    const requestData: AnalyzeOutfitRequest = await req.json();
    const { imageBase64, gender, feedbackMode, eventContext, isNeutral } = requestData;
    
    if (!imageBase64) {
      throw new Error('No image provided');
    }

    console.log(`📸 Analyzing ${gender} outfit in ${feedbackMode} mode...`);
    console.log(`📸 Image data length: ${imageBase64.length}`);
    
    if (feedbackMode === 'roast') {
      console.log('🔥🔥🔥 ROAST MODE ACTIVATED - PREPARING MAXIMUM BRUTALITY 🔥🔥🔥');
      console.log('🔥 Brutality level: MAXIMUM');
      console.log('🔥 Savage mode: ENGAGED');
      console.log('🔥 Mercy level: ZERO');
    } else {
      console.log('🎨 ENHANCED ANALYSIS MODE: Style analysis enabled');
    }
    
    if (eventContext && !isNeutral) {
      console.log(`🎯 Event context: ${eventContext}`);
    } else if (isNeutral) {
      console.log('🎯 Neutral context - no specific occasion');
    }

    // Generate enhanced system message
    console.log('📝 Generating enhanced system prompts...');
    const systemMessage = generateSystemMessage(requestData);
    console.log('📝 System message length:', systemMessage.length);
    
    if (feedbackMode === 'roast') {
      console.log('🔥 Using BRUTAL roast prompts for maximum savagery');
    } else {
      console.log('🎨 Using enhanced prompts with mandatory style analysis');
    }

    // Create OpenAI request with enhanced configuration
    console.log('🤖 Creating OpenAI request...');
    const openaiRequest = createOpenAIRequest(systemMessage, imageBase64, eventContext, isNeutral, feedbackMode);
    
    if (feedbackMode === 'roast') {
      console.log(`🔥 Using temperature ${openaiRequest.temperature} for maximum creative brutality`);
    } else {
      console.log(`🎨 Using temperature ${openaiRequest.temperature} for comprehensive analysis`);
    }

    // Call OpenAI API
    console.log('🤖 Calling OpenAI API...');
    const startTime = Date.now();
    const aiResponse = await callOpenAI(openaiRequest);
    const apiDuration = Date.now() - startTime;
    console.log(`🤖 AI response received in ${apiDuration}ms`);
    
    if (feedbackMode === 'roast') {
      console.log('🔥 Processing roast response with specialized brutal parser...');
    } else {
      console.log('🎨 Processing with enhanced parser for style analysis...');
    }

    // Parse AI response with enhanced parser
    console.log('📊 Starting response parsing...');
    const parseStartTime = Date.now();
    const result = parseAIResponse(aiResponse, requestData);
    const parseDuration = Date.now() - parseStartTime;
    console.log(`📊 Response parsed in ${parseDuration}ms`);
    
    // Detailed logging of results
    console.log('📊 ANALYSIS RESULTS:');
    console.log(`📊 - Score: ${result.score}/10`);
    console.log(`📊 - Feedback length: ${result.feedback.length} characters`);
    console.log(`📊 - Suggestions count: ${result.suggestions.length}`);
    console.log(`📊 - Style analysis included: ${result.styleAnalysis ? 'YES ✅' : 'NO ❌'}`);
    
    if (result.styleAnalysis) {
      console.log('🎨 STYLE ANALYSIS DETAILS:');
      console.log(`🎨 - Color type: ${result.styleAnalysis.colorAnalysis?.seasonalType || 'Not specified'}`);
      console.log(`🎨 - Undertone value: ${result.styleAnalysis.colorAnalysis?.undertone?.value || 'Not specified'}`);
      console.log(`🎨 - Color palette: ${result.styleAnalysis.colorPalette?.colors?.length || 0} rows`);
      console.log(`🎨 - Body type: ${result.styleAnalysis.bodyType?.type || 'Not analyzed'}`);
    } else {
      console.log('❌ CRITICAL: Style analysis is missing from response!');
    }

    // Final validation with enhanced feedback mode checking
    console.log('✅ Running final validation...');
    const validation = validateResponse(result, feedbackMode);
    if (!validation.isValid) {
      console.error('❌ Final validation failed:', validation.errors);
      if (feedbackMode === 'roast') {
        console.error('🔥 ROAST VALIDATION FAILED - Response not brutal enough');
      } else {
        console.error('🎨 ANALYSIS VALIDATION FAILED - Missing required components');
      }
    } else if (validation.warnings.length > 0) {
      console.warn('⚠️ Response has warnings:', validation.warnings);
      if (feedbackMode === 'roast') {
        console.warn('🔥 ROAST WARNINGS - Could be more savage');
      } else {
        console.warn('🎨 ANALYSIS WARNINGS - Some enhancements possible');
      }
    } else {
      console.log('✅ Response validation passed successfully');
      if (feedbackMode === 'roast') {
        console.log('🔥 ROAST VALIDATION PASSED - Maximum brutality achieved!');
      } else {
        console.log('🎨 ANALYSIS VALIDATION PASSED - Complete style insights delivered!');
      }
    }

    const totalDuration = Date.now() - (Date.now() - apiDuration - parseDuration);
    console.log(`🏁 Analysis completed in ${totalDuration}ms total`);

    return createResponse(result);
    
  } catch (error) {
    console.error("💥 Error in analyze-outfit function:", error);
    console.error("💥 Error stack:", error.stack);
    return createErrorResponse(error.message || 'An unknown error occurred');
  }
});
