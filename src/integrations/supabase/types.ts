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
      wardrobe_items: {
        Row: {
          created_at: string
          extracted_clothing_items: Json | null
          feedback: string | null
          feedback_mode: string | null
          gender: string | null
          id: string
          image_url: string
          occasion_context: string | null
          rating_score: number | null
          suggestions: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          extracted_clothing_items?: Json | null
          feedback?: string | null
          feedback_mode?: string | null
          gender?: string | null
          id?: string
          image_url: string
          occasion_context?: string | null
          rating_score?: number | null
          suggestions?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          extracted_clothing_items?: Json | null
          feedback?: string | null
          feedback_mode?: string | null
          gender?: string | null
          id?: string
          image_url?: string
          occasion_context?: string | null
          rating_score?: number | null
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
