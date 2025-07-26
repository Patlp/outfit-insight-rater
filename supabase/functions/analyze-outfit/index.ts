
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

import { AnalyzeOutfitRequest } from './types.ts';
import { generateSystemMessage } from './prompts.ts';
import { parseAIResponse } from './response-parser.ts';
import { callOpenAI, createOpenAIRequest } from './openai-client.ts';
import { handleCORS, createResponse, createErrorResponse } from './cors.ts';
import { validateResponse } from './response-validator.ts';

// Performance monitoring interface
interface PerformanceMetrics {
  requestStartTime: number;
  validationTime?: number;
  openaiTime?: number;
  parsingTime?: number;
  totalTime?: number;
}

// Helper function to optimize image data
function optimizeImageData(imageBase64: string): string {
  // Remove data URL prefix if present for smaller payload
  if (imageBase64.startsWith('data:')) {
    const base64Start = imageBase64.indexOf(',') + 1;
    console.log('🧹 Cleaned base64 data URL prefix');
    return imageBase64.substring(base64Start);
  }
  return imageBase64;
}

// Enhanced error handler with specific timeout detection
function handleAnalysisError(error: any, metrics: PerformanceMetrics): Response {
  const totalTime = Date.now() - metrics.requestStartTime;
  console.error(`💥 Analysis failed after ${totalTime}ms:`, error);
  
  // Detect timeout scenarios
  if (totalTime > 110000) { // > 110 seconds indicates likely timeout
    console.error('⏰ TIMEOUT DETECTED - Request exceeded expected duration');
    return createErrorResponse('Analysis timeout - Please try with a smaller image or try again later.');
  }
  
  // Detect OpenAI API issues
  if (error.message?.includes('OpenAI') || error.message?.includes('API')) {
    console.error('🤖 OpenAI API Error');
    return createErrorResponse('AI service temporarily unavailable. Please try again in a moment.');
  }
  
  // Generic error with helpful message
  return createErrorResponse(error.message || 'Analysis failed. Please try again.');
}

serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCORS(req);
  if (corsResponse) {
    return corsResponse;
  }

  // Initialize performance metrics
  const metrics: PerformanceMetrics = {
    requestStartTime: Date.now()
  };

  try {
    console.log('🚀 Starting outfit analysis...');
    console.log('📥 Request method:', req.method);
    console.log('📥 Request headers:', Object.fromEntries(req.headers.entries()));
    
    // Parse request body with better error handling
    let requestData: AnalyzeOutfitRequest;
    try {
      const rawBody = await req.text();
      console.log('📥 Raw body length:', rawBody.length);
      console.log('📥 Raw body preview:', rawBody.substring(0, 100));
      
      if (!rawBody || rawBody.trim() === '') {
        throw new Error('Request body is empty');
      }
      
      requestData = JSON.parse(rawBody);
    } catch (parseError) {
      console.error('💥 Failed to parse request body:', parseError);
      throw new Error(`Invalid request body: ${parseError.message}`);
    }
    
    console.log('📥 Request data received:', {
      hasImageBase64: !!requestData.imageBase64,
      imageLength: requestData.imageBase64?.length || 0,
      gender: requestData.gender,
      feedbackMode: requestData.feedbackMode,
      eventContext: requestData.eventContext,
      isNeutral: requestData.isNeutral
    });
    let { imageBase64, gender, feedbackMode, eventContext, isNeutral } = requestData;
    
    if (!imageBase64) {
      throw new Error('No image provided');
    }

    // Early validation and optimization
    const validationStart = Date.now();
    console.log(`📸 Analyzing ${gender} outfit in ${feedbackMode} mode...`);
    console.log(`📸 Original image data length: ${imageBase64.length}`);
    
    // Optimize image data for faster transfer
    imageBase64 = optimizeImageData(imageBase64);
    console.log(`📸 Optimized image data length: ${imageBase64.length}`);
    metrics.validationTime = Date.now() - validationStart;
    
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

    // Call OpenAI API with performance tracking
    console.log('🤖 Calling OpenAI API...');
    const openaiStart = Date.now();
    const aiResponse = await callOpenAI(openaiRequest);
    metrics.openaiTime = Date.now() - openaiStart;
    console.log(`🤖 AI response received in ${metrics.openaiTime}ms`);
    
    if (feedbackMode === 'roast') {
      console.log('🔥 Processing roast response with specialized brutal parser...');
    } else {
      console.log('🎨 Processing with enhanced parser for style analysis...');
    }

    // Parse AI response with enhanced parser and performance tracking
    console.log('📊 Starting response parsing...');
    const parseStartTime = Date.now();
    const result = parseAIResponse(aiResponse, requestData);
    metrics.parsingTime = Date.now() - parseStartTime;
    console.log(`📊 Response parsed in ${metrics.parsingTime}ms`);
    
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

    // Final performance summary
    metrics.totalTime = Date.now() - metrics.requestStartTime;
    console.log(`🏁 Analysis completed in ${metrics.totalTime}ms total`);
    console.log(`📊 Performance breakdown: validation=${metrics.validationTime}ms, openai=${metrics.openaiTime}ms, parsing=${metrics.parsingTime}ms`);

    return createResponse(result);
    
  } catch (error) {
    console.error("💥 Error in analyze-outfit function:", error);
    console.error("💥 Error stack:", error.stack);
    return handleAnalysisError(error, metrics);
  }
});
