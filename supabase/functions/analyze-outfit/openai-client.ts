
import { OpenAIRequest, OpenAIMessage } from './types.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

export function createOpenAIRequest(
  systemMessage: string, 
  imageBase64: string, 
  eventContext?: string | null,
  isNeutral?: boolean,
  feedbackMode?: string
): OpenAIRequest {
  console.log('🤖 Making OpenAI API call with enhanced configuration...');
  
  // Enhanced model and parameter configuration
  const model = 'gpt-4.1-2025-04-14'; // Use latest model for better compliance
  const maxTokens = feedbackMode === 'roast' ? 800 : 1200; // More tokens for comprehensive analysis
  const temperature = feedbackMode === 'roast' ? 0.9 : 0.7; // Higher creativity for roast mode
  
  console.log(`🤖 Model: ${model}`);
  console.log(`🤖 Max tokens: ${maxTokens}`);
  console.log(`🤖 Temperature: ${temperature}`);
  
  if (feedbackMode === 'roast') {
    console.log('🔥 ROAST MODE: Using high creativity settings for maximum brutality');
  } else {
    console.log('🤖 NORMAL MODE: Using optimized settings for complete analysis');
  }

  // Enhanced user message with clearer research context
  const userMessage = eventContext && !isNeutral 
    ? `Please analyze this outfit for "${eventContext}" using fashion research principles. Focus on clothing items, styling choices, color coordination, and garment fit. Provide comprehensive analysis following the JSON structure specified.`
    : `Please analyze this outfit using fashion research principles. Focus on clothing items, styling choices, color coordination, and garment fit. Provide comprehensive analysis following the JSON structure specified.`;

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
            url: `data:image/jpeg;base64,${imageBase64}`
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

  console.log('🤖 Calling OpenAI API with enhanced compliance settings...');
  
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
  console.log('🤖 OpenAI response received, length:', content.length);
  
  return content;
}
