export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      academic_integration_log: {
        Row: {
          completed_at: string | null
          created_at: string
          error_details: string | null
          id: string
          paper_id: string | null
          process_type: string
          processing_time_ms: number | null
          results: Json | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_details?: string | null
          id?: string
          paper_id?: string | null
          process_type: string
          processing_time_ms?: number | null
          results?: Json | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_details?: string | null
          id?: string
          paper_id?: string | null
          process_type?: string
          processing_time_ms?: number | null
          results?: Json | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "academic_integration_log_paper_id_fkey"
            columns: ["paper_id"]
            isOneToOne: false
            referencedRelation: "academic_papers"
            referencedColumns: ["id"]
          },
        ]
      }
      academic_paper_content: {
        Row: {
          confidence_score: number | null
          content_type: string
          created_at: string
          extracted_text: string
          id: string
          paper_id: string | null
          processing_metadata: Json | null
        }
        Insert: {
          confidence_score?: number | null
          content_type: string
          created_at?: string
          extracted_text: string
          id?: string
          paper_id?: string | null
          processing_metadata?: Json | null
        }
        Update: {
          confidence_score?: number | null
          content_type?: string
          created_at?: string
          extracted_text?: string
          id?: string
          paper_id?: string | null
          processing_metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "academic_paper_content_paper_id_fkey"
            columns: ["paper_id"]
            isOneToOne: false
            referencedRelation: "academic_papers"
            referencedColumns: ["id"]
          },
        ]
      }
      academic_papers: {
        Row: {
          abstract: string | null
          authors: string[] | null
          created_at: string
          doi: string | null
          id: string
          journal: string | null
          keywords: string[] | null
          metadata: Json | null
          pdf_content: string | null
          pdf_url: string | null
          processing_status: string | null
          publication_year: number | null
          title: string
          updated_at: string
        }
        Insert: {
          abstract?: string | null
          authors?: string[] | null
          created_at?: string
          doi?: string | null
          id?: string
          journal?: string | null
          keywords?: string[] | null
          metadata?: Json | null
          pdf_content?: string | null
          pdf_url?: string | null
          processing_status?: string | null
          publication_year?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          abstract?: string | null
          authors?: string[] | null
          created_at?: string
          doi?: string | null
          id?: string
          journal?: string | null
          keywords?: string[] | null
          metadata?: Json | null
          pdf_content?: string | null
          pdf_url?: string | null
          processing_status?: string | null
          publication_year?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      academic_tagging_rules: {
        Row: {
          academic_rationale: string | null
          actions: Json
          conditions: Json
          confidence_threshold: number | null
          created_at: string
          id: string
          is_active: boolean | null
          priority: number | null
          rule_name: string
          rule_type: string
          source_papers: string[] | null
          updated_at: string
        }
        Insert: {
          academic_rationale?: string | null
          actions: Json
          conditions: Json
          confidence_threshold?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          priority?: number | null
          rule_name: string
          rule_type: string
          source_papers?: string[] | null
          updated_at?: string
        }
        Update: {
          academic_rationale?: string | null
          actions?: Json
          conditions?: Json
          confidence_threshold?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          priority?: number | null
          rule_name?: string
          rule_type?: string
          source_papers?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      email_records: {
        Row: {
          created_at: string
          email: string
          id: string
          source: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          source: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          source?: string
        }
        Relationships: []
      }
      enhanced_clothing_categories: {
        Row: {
          academic_definition: string | null
          category_name: string
          color_associations: string[] | null
          common_materials: string[] | null
          confidence_score: number | null
          created_at: string
          fit_characteristics: Json | null
          id: string
          parent_category: string | null
          source_papers: string[] | null
          styling_contexts: string[] | null
          subcategories: string[] | null
          typical_descriptors: string[] | null
          updated_at: string
        }
        Insert: {
          academic_definition?: string | null
          category_name: string
          color_associations?: string[] | null
          common_materials?: string[] | null
          confidence_score?: number | null
          created_at?: string
          fit_characteristics?: Json | null
          id?: string
          parent_category?: string | null
          source_papers?: string[] | null
          styling_contexts?: string[] | null
          subcategories?: string[] | null
          typical_descriptors?: string[] | null
          updated_at?: string
        }
        Update: {
          academic_definition?: string | null
          category_name?: string
          color_associations?: string[] | null
          common_materials?: string[] | null
          confidence_score?: number | null
          created_at?: string
          fit_characteristics?: Json | null
          id?: string
          parent_category?: string | null
          source_papers?: string[] | null
          styling_contexts?: string[] | null
          subcategories?: string[] | null
          typical_descriptors?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      fashion_attributes: {
        Row: {
          attribute_name: string
          attribute_type: string
          confidence_score: number | null
          context: string | null
          created_at: string
          extraction_method: string | null
          id: string
          metadata: Json | null
          page_number: number | null
          paper_id: string | null
        }
        Insert: {
          attribute_name: string
          attribute_type: string
          confidence_score?: number | null
          context?: string | null
          created_at?: string
          extraction_method?: string | null
          id?: string
          metadata?: Json | null
          page_number?: number | null
          paper_id?: string | null
        }
        Update: {
          attribute_name?: string
          attribute_type?: string
          confidence_score?: number | null
          context?: string | null
          created_at?: string
          extraction_method?: string | null
          id?: string
          metadata?: Json | null
          page_number?: number | null
          paper_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fashion_attributes_paper_id_fkey"
            columns: ["paper_id"]
            isOneToOne: false
            referencedRelation: "academic_papers"
            referencedColumns: ["id"]
          },
        ]
      }
      fashion_insights: {
        Row: {
          created_at: string
          description: string
          id: string
          insight_type: string
          metadata: Json | null
          paper_id: string | null
          relevance_score: number | null
          tags: string[] | null
          title: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          insight_type: string
          metadata?: Json | null
          paper_id?: string | null
          relevance_score?: number | null
          tags?: string[] | null
          title: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          insight_type?: string
          metadata?: Json | null
          paper_id?: string | null
          relevance_score?: number | null
          tags?: string[] | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "fashion_insights_paper_id_fkey"
            columns: ["paper_id"]
            isOneToOne: false
            referencedRelation: "academic_papers"
            referencedColumns: ["id"]
          },
        ]
      }
      fashion_material_properties: {
        Row: {
          academic_classification: string | null
          care_instructions: string[] | null
          confidence_score: number | null
          created_at: string
          id: string
          material_name: string
          material_type: string | null
          properties: Json | null
          seasonal_appropriateness: string[] | null
          source_papers: string[] | null
          typical_uses: string[] | null
        }
        Insert: {
          academic_classification?: string | null
          care_instructions?: string[] | null
          confidence_score?: number | null
          created_at?: string
          id?: string
          material_name: string
          material_type?: string | null
          properties?: Json | null
          seasonal_appropriateness?: string[] | null
          source_papers?: string[] | null
          typical_uses?: string[] | null
        }
        Update: {
          academic_classification?: string | null
          care_instructions?: string[] | null
          confidence_score?: number | null
          created_at?: string
          id?: string
          material_name?: string
          material_type?: string | null
          properties?: Json | null
          seasonal_appropriateness?: string[] | null
          source_papers?: string[] | null
          typical_uses?: string[] | null
        }
        Relationships: []
      }
      fashion_styling_principles: {
        Row: {
          academic_evidence: string | null
          applicable_items: string[] | null
          category: string
          confidence_score: number | null
          created_at: string
          description: string
          id: string
          practical_applications: Json | null
          principle_name: string
          source_papers: string[] | null
        }
        Insert: {
          academic_evidence?: string | null
          applicable_items?: string[] | null
          category: string
          confidence_score?: number | null
          created_at?: string
          description: string
          id?: string
          practical_applications?: Json | null
          principle_name: string
          source_papers?: string[] | null
        }
        Update: {
          academic_evidence?: string | null
          applicable_items?: string[] | null
          category?: string
          confidence_score?: number | null
          created_at?: string
          description?: string
          id?: string
          practical_applications?: Json | null
          principle_name?: string
          source_papers?: string[] | null
        }
        Relationships: []
      }
      fashion_terminology: {
        Row: {
          academic_references: string[] | null
          category: string
          confidence_score: number | null
          created_at: string
          definition: string | null
          id: string
          related_terms: string[] | null
          source_papers: string[] | null
          synonyms: string[] | null
          term: string
          updated_at: string
          usage_context: string | null
        }
        Insert: {
          academic_references?: string[] | null
          category: string
          confidence_score?: number | null
          created_at?: string
          definition?: string | null
          id?: string
          related_terms?: string[] | null
          source_papers?: string[] | null
          synonyms?: string[] | null
          term: string
          updated_at?: string
          usage_context?: string | null
        }
        Update: {
          academic_references?: string[] | null
          category?: string
          confidence_score?: number | null
          created_at?: string
          definition?: string | null
          id?: string
          related_terms?: string[] | null
          source_papers?: string[] | null
          synonyms?: string[] | null
          term?: string
          updated_at?: string
          usage_context?: string | null
        }
        Relationships: []
      }
      fashion_whitelist: {
        Row: {
          category: string
          common_materials: string[] | null
          created_at: string
          id: string
          item_name: string
          style_descriptors: string[] | null
        }
        Insert: {
          category: string
          common_materials?: string[] | null
          created_at?: string
          id?: string
          item_name: string
          style_descriptors?: string[] | null
        }
        Update: {
          category?: string
          common_materials?: string[] | null
          created_at?: string
          id?: string
          item_name?: string
          style_descriptors?: string[] | null
        }
        Relationships: []
      }
      fashionpedia_categories: {
        Row: {
          attributes: Json | null
          category_id: number | null
          category_name: string
          created_at: string
          description: string | null
          id: string
          parent_category: string | null
          updated_at: string
        }
        Insert: {
          attributes?: Json | null
          category_id?: number | null
          category_name: string
          created_at?: string
          description?: string | null
          id?: string
          parent_category?: string | null
          updated_at?: string
        }
        Update: {
          attributes?: Json | null
          category_id?: number | null
          category_name?: string
          created_at?: string
          description?: string | null
          id?: string
          parent_category?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      kaggle_clothing_items: {
        Row: {
          age_group: string | null
          brand: string | null
          category: string | null
          color: string | null
          created_at: string
          description: string | null
          gender: string | null
          id: string
          material: string | null
          normalized_name: string | null
          price: number | null
          product_name: string
          rating: number | null
          season: string | null
          size: string | null
          sub_category: string | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          age_group?: string | null
          brand?: string | null
          category?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          gender?: string | null
          id?: string
          material?: string | null
          normalized_name?: string | null
          price?: number | null
          product_name: string
          rating?: number | null
          season?: string | null
          size?: string | null
          sub_category?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          age_group?: string | null
          brand?: string | null
          category?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          gender?: string | null
          id?: string
          material?: string | null
          normalized_name?: string | null
          price?: number | null
          product_name?: string
          rating?: number | null
          season?: string | null
          size?: string | null
          sub_category?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      outfit_inspirations: {
        Row: {
          auto_imported: boolean | null
          color_palette: Json | null
          created_at: string
          description: string | null
          extracted_elements: Json | null
          id: string
          image_url: string
          metadata: Json | null
          pinterest_board_id: string | null
          pinterest_board_name: string | null
          pinterest_pin_id: string | null
          processing_status: string | null
          source_type: string
          source_url: string | null
          style_confidence_score: number | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_imported?: boolean | null
          color_palette?: Json | null
          created_at?: string
          description?: string | null
          extracted_elements?: Json | null
          id?: string
          image_url: string
          metadata?: Json | null
          pinterest_board_id?: string | null
          pinterest_board_name?: string | null
          pinterest_pin_id?: string | null
          processing_status?: string | null
          source_type: string
          source_url?: string | null
          style_confidence_score?: number | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_imported?: boolean | null
          color_palette?: Json | null
          created_at?: string
          description?: string | null
          extracted_elements?: Json | null
          id?: string
          image_url?: string
          metadata?: Json | null
          pinterest_board_id?: string | null
          pinterest_board_name?: string | null
          pinterest_pin_id?: string | null
          processing_status?: string | null
          source_type?: string
          source_url?: string | null
          style_confidence_score?: number | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "outfit_inspirations_pinterest_pin_id_fkey"
            columns: ["pinterest_pin_id"]
            isOneToOne: false
            referencedRelation: "pinterest_pins"
            referencedColumns: ["id"]
          },
        ]
      }
      pinterest_boards: {
        Row: {
          category: string | null
          connection_id: string
          created_at: string
          description: string | null
          follower_count: number | null
          id: string
          image_url: string | null
          is_secret: boolean | null
          is_synced: boolean | null
          last_synced_at: string | null
          name: string
          pin_count: number | null
          pinterest_board_id: string
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          connection_id: string
          created_at?: string
          description?: string | null
          follower_count?: number | null
          id?: string
          image_url?: string | null
          is_secret?: boolean | null
          is_synced?: boolean | null
          last_synced_at?: string | null
          name: string
          pin_count?: number | null
          pinterest_board_id: string
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          connection_id?: string
          created_at?: string
          description?: string | null
          follower_count?: number | null
          id?: string
          image_url?: string | null
          is_secret?: boolean | null
          is_synced?: boolean | null
          last_synced_at?: string | null
          name?: string
          pin_count?: number | null
          pinterest_board_id?: string
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pinterest_boards_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "pinterest_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      pinterest_connections: {
        Row: {
          access_token: string
          board_count: number | null
          created_at: string
          display_name: string | null
          follower_count: number | null
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          pin_count: number | null
          pinterest_user_id: string
          profile_image_url: string | null
          refresh_token: string | null
          sync_enabled: boolean | null
          sync_frequency: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          access_token: string
          board_count?: number | null
          created_at?: string
          display_name?: string | null
          follower_count?: number | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          pin_count?: number | null
          pinterest_user_id: string
          profile_image_url?: string | null
          refresh_token?: string | null
          sync_enabled?: boolean | null
          sync_frequency?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          access_token?: string
          board_count?: number | null
          created_at?: string
          display_name?: string | null
          follower_count?: number | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          pin_count?: number | null
          pinterest_user_id?: string
          profile_image_url?: string | null
          refresh_token?: string | null
          sync_enabled?: boolean | null
          sync_frequency?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      pinterest_pins: {
        Row: {
          alt_text: string | null
          board_id: string
          comment_count: number | null
          created_at: string
          created_by: string | null
          description: string | null
          dominant_color: string | null
          extracted_colors: string[] | null
          id: string
          image_url: string
          is_imported: boolean | null
          link_url: string | null
          outfit_inspiration_id: string | null
          pinterest_created_at: string | null
          pinterest_pin_id: string
          reaction_count: number | null
          save_count: number | null
          style_tags: string[] | null
          tags: string[] | null
          title: string | null
          updated_at: string
        }
        Insert: {
          alt_text?: string | null
          board_id: string
          comment_count?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          dominant_color?: string | null
          extracted_colors?: string[] | null
          id?: string
          image_url: string
          is_imported?: boolean | null
          link_url?: string | null
          outfit_inspiration_id?: string | null
          pinterest_created_at?: string | null
          pinterest_pin_id: string
          reaction_count?: number | null
          save_count?: number | null
          style_tags?: string[] | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          alt_text?: string | null
          board_id?: string
          comment_count?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          dominant_color?: string | null
          extracted_colors?: string[] | null
          id?: string
          image_url?: string
          is_imported?: boolean | null
          link_url?: string | null
          outfit_inspiration_id?: string | null
          pinterest_created_at?: string | null
          pinterest_pin_id?: string
          reaction_count?: number | null
          save_count?: number | null
          style_tags?: string[] | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pinterest_pins_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "pinterest_boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pinterest_pins_outfit_inspiration_id_fkey"
            columns: ["outfit_inspiration_id"]
            isOneToOne: false
            referencedRelation: "outfit_inspirations"
            referencedColumns: ["id"]
          },
        ]
      }
      pinterest_sync_history: {
        Row: {
          boards_synced: number | null
          completed_at: string | null
          connection_id: string
          error_message: string | null
          id: string
          metadata: Json | null
          pins_imported: number | null
          pins_synced: number | null
          started_at: string
          status: string
          sync_duration_ms: number | null
          sync_type: string
        }
        Insert: {
          boards_synced?: number | null
          completed_at?: string | null
          connection_id: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          pins_imported?: number | null
          pins_synced?: number | null
          started_at?: string
          status?: string
          sync_duration_ms?: number | null
          sync_type: string
        }
        Update: {
          boards_synced?: number | null
          completed_at?: string | null
          connection_id?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          pins_imported?: number | null
          pins_synced?: number | null
          started_at?: string
          status?: string
          sync_duration_ms?: number | null
          sync_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "pinterest_sync_history_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "pinterest_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      primary_fashion_taxonomy: {
        Row: {
          academic_references: string[] | null
          category: string
          color_compatibility: string[] | null
          common_materials: string[] | null
          confidence_score: number | null
          created_at: string
          fit_type: string | null
          formality_level: string | null
          gender_association: string[] | null
          id: string
          is_active: boolean | null
          item_name: string
          occasion_contexts: string[] | null
          pattern_types: string[] | null
          priority_rank: number | null
          seasonal_tags: string[] | null
          source_file: string | null
          style_descriptors: string[] | null
          styling_notes: string | null
          subcategory: string | null
          updated_at: string
        }
        Insert: {
          academic_references?: string[] | null
          category: string
          color_compatibility?: string[] | null
          common_materials?: string[] | null
          confidence_score?: number | null
          created_at?: string
          fit_type?: string | null
          formality_level?: string | null
          gender_association?: string[] | null
          id?: string
          is_active?: boolean | null
          item_name: string
          occasion_contexts?: string[] | null
          pattern_types?: string[] | null
          priority_rank?: number | null
          seasonal_tags?: string[] | null
          source_file?: string | null
          style_descriptors?: string[] | null
          styling_notes?: string | null
          subcategory?: string | null
          updated_at?: string
        }
        Update: {
          academic_references?: string[] | null
          category?: string
          color_compatibility?: string[] | null
          common_materials?: string[] | null
          confidence_score?: number | null
          created_at?: string
          fit_type?: string | null
          formality_level?: string | null
          gender_association?: string[] | null
          id?: string
          is_active?: boolean | null
          item_name?: string
          occasion_contexts?: string[] | null
          pattern_types?: string[] | null
          priority_rank?: number | null
          seasonal_tags?: string[] | null
          source_file?: string | null
          style_descriptors?: string[] | null
          styling_notes?: string | null
          subcategory?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      wardrobe_items: {
        Row: {
          created_at: string
          cropped_images: Json | null
          extracted_clothing_items: Json | null
          feedback: string | null
          feedback_mode: string | null
          gender: string | null
          id: string
          image_url: string
          occasion_context: string | null
          original_image_url: string | null
          rating_score: number | null
          render_image_url: string | null
          suggestions: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          cropped_images?: Json | null
          extracted_clothing_items?: Json | null
          feedback?: string | null
          feedback_mode?: string | null
          gender?: string | null
          id?: string
          image_url: string
          occasion_context?: string | null
          original_image_url?: string | null
          rating_score?: number | null
          render_image_url?: string | null
          suggestions?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          cropped_images?: Json | null
          extracted_clothing_items?: Json | null
          feedback?: string | null
          feedback_mode?: string | null
          gender?: string | null
          id?: string
          image_url?: string
          occasion_context?: string | null
          original_image_url?: string | null
          rating_score?: number | null
          render_image_url?: string | null
          suggestions?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
