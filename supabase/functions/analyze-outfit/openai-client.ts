
import { OpenAIRequest, OpenAIMessage } from './types.ts';

export async function callOpenAI(request: OpenAIRequest): Promise<string> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }

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
    console.error("OpenAI API error:", errorData);
    throw new Error(`OpenAI API error: ${errorData.error?.message || "Unknown error"}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

export function createOpenAIRequest(
  systemMessage: string, 
  imageBase64: string, 
  eventContext?: string,
  isNeutral?: boolean,
  feedbackMode?: string
): OpenAIRequest {
  const userText = eventContext && !isNeutral 
    ? `Please analyze this outfit specifically for "${eventContext}". Remember to reference this context throughout your response.`
    : "Please analyze this outfit photo and provide fashion feedback.";

  // Increase temperature significantly for roast mode to get more creative and brutal responses
  const temperature = feedbackMode === 'roast' ? 0.9 : 0.7;
  
  console.log(`Using temperature ${temperature} for ${feedbackMode} mode`);

  return {
    model: "gpt-4o",
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
    max_tokens: 600,
    temperature: temperature
  };
}
