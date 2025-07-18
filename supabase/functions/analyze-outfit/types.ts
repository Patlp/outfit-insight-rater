
export interface AnalyzeOutfitRequest {
  imageBase64: string;
  gender: 'male' | 'female';
  feedbackMode: 'normal' | 'roast';
  eventContext?: string;
  isNeutral?: boolean;
}

export interface ColorAnalysis {
  seasonalType: string;
  undertone: {
    value: number;
    description: string;
  };
  intensity: {
    value: number;
    description: string;
  };
  lightness: {
    value: number;
    description: string;
  };
  explanation: string;
}

export interface ColorPalette {
  colors: string[][];
  explanation: string;
}

export interface BodyType {
  type: string;
  description: string;
  visualShape: string;
  stylingRecommendations: string[];
}

export interface StyleAnalysis {
  colorAnalysis: ColorAnalysis;
  colorPalette: ColorPalette;
  bodyType?: BodyType;
}

export interface AnalyzeOutfitResponse {
  score: number;
  feedback: string;
  suggestions: string[];
  styleAnalysis?: StyleAnalysis;
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
