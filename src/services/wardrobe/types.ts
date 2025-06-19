
export interface WardrobeItem {
  id: string;
  user_id: string;
  image_url: string;
  original_image_url?: string; // Add this missing field
  rating_score: number | null;
  feedback: string | null;
  suggestions: string[] | null;
  gender: string | null;
  occasion_context: string | null;
  feedback_mode: string | null;
  extracted_clothing_items: any | null;
  cropped_images: any | null;
  created_at: string;
  updated_at: string;
}

export interface ClothingItem {
  id: string;
  name: string;
  category?: string;
  descriptors?: string[]; // Add this field
  confidence?: number;
  renderImageUrl?: string;
  renderImageProvider?: string;
  renderImageGeneratedAt?: string;
  croppedImageUrl?: string;
  originalImageUrl?: string;
  outfitId: string;
  outfitImageUrl?: string;
  outfitRating?: number; // Add this field
  outfitFeedback?: string;
  createdAt: string;
  imageType?: string;
  contextualProcessing?: boolean;
  accuracyLevel?: string;
  source: string;
  outfitDate: string;
  outfitScore: number;
  arrayIndex: number;
  description?: string;
  [key: string]: any;
}

export interface SaveOutfitResult {
  wardrobeItem?: WardrobeItem;
  error?: string;
}

export interface GetWardrobeItemsResult {
  items?: WardrobeItem[];
  error?: string;
}

export interface DeleteWardrobeItemResult {
  error?: string;
}
