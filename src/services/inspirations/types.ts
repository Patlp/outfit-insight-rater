
export interface OutfitInspiration {
  id: string;
  user_id: string;
  source_type: 'pinterest' | 'upload';
  source_url?: string;
  image_url: string;
  title?: string;
  description?: string;
  extracted_elements: any[];
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreateInspirationRequest {
  source_type: 'pinterest' | 'upload';
  source_url?: string;
  image_url: string;
  title?: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface InspirationResult {
  inspiration?: OutfitInspiration;
  error?: string;
}

export interface GetInspirationsResult {
  inspirations?: OutfitInspiration[];
  error?: string;
}
