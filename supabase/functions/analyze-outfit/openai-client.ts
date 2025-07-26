
import { OpenAIRequest, OpenAIMessage } from './types.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

export function createOpenAIRequest(
  systemMessage: string, 
  imageBase64: string, 
  eventContext?: string | null,
  isNeutral?: boolean,
  feedbackMode?: string
): OpenAIRequest {
  console.log('🤖 Making OpenAI API call with enhanced fashion research configuration...');
  
  // Enhanced model and parameter configuration for fashion research
  const model = 'gpt-4o';
  const maxTokens = feedbackMode === 'roast' ? 800 : 1200;
  const temperature = feedbackMode === 'roast' ? 0.9 : 0.7;
  
  console.log(`🤖 Fashion Research Model: ${model}`);
  console.log(`🤖 Max tokens: ${maxTokens}`);
  console.log(`🤖 Temperature: ${temperature}`);
  
  if (feedbackMode === 'roast') {
    console.log('🔥 ROAST RESEARCH MODE: Fashion elements brutality analysis');
  } else {
    console.log('🎨 ACADEMIC RESEARCH MODE: Comprehensive clothing coordination study');
  }

  // Extract base64 data if it includes data URL prefix
  let cleanBase64 = imageBase64;
  if (imageBase64.includes('data:image/')) {
    cleanBase64 = imageBase64.split(',')[1];
    console.log('🧹 Cleaned base64 data URL prefix');
  }
  console.log(`📸 Base64 data length: ${cleanBase64.length}`);

  // Enhanced user message with explicit fashion research framing
  const userMessage = eventContext && !isNeutral 
    ? `Please conduct a comprehensive fashion research study of the clothing items and styling choices visible in this image for "${eventContext}" contexts. Focus exclusively on garments, color coordination between clothing pieces, styling decisions, and fashion elements. Analyze the clothing coordination principles demonstrated and provide detailed fashion research findings following the specified JSON structure.`
    : `Please conduct a comprehensive fashion research study of the clothing items and styling choices visible in this image. Focus exclusively on garments, fabric coordination, color relationships between clothing pieces, styling decisions, and fashion elements. Analyze the clothing coordination principles and provide detailed fashion research findings following the specified JSON structure.`;

  const messages: OpenAIMessage[] = [
    {
      role: 'system',
      content: systemMessage
    },
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: userMessage
        },
        {
          type: 'image_url',
          image_url: {
            url: `data:image/jpeg;base64,${cleanBase64}`
          }
        }
      ]
    }
  ];

  return {
    model,
    messages,
    max_tokens: maxTokens,
    temperature
  };
}

export async function callOpenAI(request: OpenAIRequest): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  console.log('🤖 Calling OpenAI API for fashion research analysis...');
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('🚨 OpenAI API Error:', {
      status: response.status,
      statusText: response.statusText,
      error: errorData
    });
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorData}`);
  }

  const data = await response.json();
  
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    console.error('🚨 Invalid OpenAI response structure:', data);
    throw new Error('Invalid response structure from OpenAI');
  }

  const content = data.choices[0].message.content;
  console.log('🤖 Fashion research response received, length:', content.length);
  console.log('🤖 Response preview:', content.substring(0, 200) + '...');
  
  return content;
}
