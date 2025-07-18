
import { OpenAIRequest, OpenAIMessage } from './types.ts';

export async function callOpenAI(request: OpenAIRequest): Promise<string> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  console.log('🤖 Making OpenAI API call with enhanced configuration...');
  console.log('🤖 Model:', request.model);
  console.log('🤖 Temperature:', request.temperature);
  console.log('🤖 Max tokens:', request.max_tokens);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${openaiApiKey}`
    },
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("🤖 OpenAI API error:", errorData);
    throw new Error(`OpenAI API error: ${errorData.error?.message || "Unknown error"}`);
  }

  const data = await response.json();
  const aiResponse = data.choices[0].message.content;
  
  console.log('🤖 OpenAI response received, length:', aiResponse.length);
  console.log('🤖 Response preview:', aiResponse.substring(0, 300) + '...');
  
  // Log if response contains expected structure
  const hasJson = aiResponse.includes('{') && aiResponse.includes('}');
  const hasStyleAnalysis = aiResponse.includes('styleAnalysis');
  const hasScore = aiResponse.includes('score') || /\d+\/10/.test(aiResponse);
  
  console.log('🤖 Response analysis:');
  console.log('🤖 - Contains JSON structure:', hasJson);
  console.log('🤖 - Contains style analysis:', hasStyleAnalysis);  
  console.log('🤖 - Contains score:', hasScore);
  
  return aiResponse;
}

export function createOpenAIRequest(
  systemMessage: string, 
  imageBase64: string, 
  eventContext?: string,
  isNeutral?: boolean,
  feedbackMode?: string
): OpenAIRequest {
  const userText = eventContext && !isNeutral 
    ? `Please analyze this outfit specifically for "${eventContext}". Remember to reference this context throughout your response and provide the complete JSON structure with styleAnalysis.`
    : "Please analyze this outfit photo and provide fashion feedback. IMPORTANT: Always include the complete JSON structure with styleAnalysis as specified in the system prompt.";

  // Enhanced configuration for better results
  let temperature = 0.7;
  let maxTokens = 1000; // Increased token limit for complete responses

  if (feedbackMode === 'roast') {
    temperature = 1.2;  // MAXIMUM creativity for roast mode
    maxTokens = 800;    // Adequate for elaborate roasting
    console.log('🔥 ROAST MODE: Using MAXIMUM temperature (1.2) for creative brutality');
  } else {
    console.log('🤖 NORMAL MODE: Using optimized settings for complete analysis');
  }
  
  console.log(`🤖 Using temperature ${temperature} and ${maxTokens} tokens for ${feedbackMode || 'normal'} mode`);

  return {
    model: "gpt-4o", // Using the more powerful model
    messages: [
      {
        role: "system",
        content: systemMessage
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: userText
          },
          {
            type: "image_url",
            image_url: {
              url: imageBase64
            }
          }
        ]
      }
    ],
    max_tokens: maxTokens,
    temperature: temperature
  };
}
