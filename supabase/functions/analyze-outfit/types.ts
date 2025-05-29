
export interface AnalyzeOutfitRequest {
  imageBase64: string;
  gender: 'male' | 'female';
  feedbackMode: 'normal' | 'roast';
  eventContext?: string;
  isNeutral?: boolean;
}

export interface AnalyzeOutfitResponse {
  score: number;
  feedback: string;
  suggestions: string[];
}

export interface OpenAIMessage {
  role: 'system' | 'user';
  content: string | Array<{
    type: 'text' | 'image_url';
    text?: string;
    image_url?: {
      url: string;
    };
  }>;
}

export interface OpenAIRequest {
  model: string;
  messages: OpenAIMessage[];
  max_tokens: number;
  temperature: number;
}
