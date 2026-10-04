export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          created_at: string
          deposit: number
          dress_id: string
          fee: number
          handover: Json | null
          id: string
          lender_id: string | null
          method: string
          pay_ref: string
          pay_verified: boolean
          payout_done: boolean
          refund_done: boolean
          renter_id: string
          resolution: string | null
          ret: Json | null
          start_date: string
          status: string
        }
        Insert: {
          created_at?: string
          deposit: number
          dress_id: string
          fee: number
          handover?: Json | null
          id?: string
          lender_id?: string | null
          method: string
          pay_ref?: string
          pay_verified?: boolean
          payout_done?: boolean
          refund_done?: boolean
          renter_id: string
          resolution?: string | null
          ret?: Json | null
          start_date: string
          status?: string
        }
        Update: {
          created_at?: string
          deposit?: number
          dress_id?: string
          fee?: number
          handover?: Json | null
          id?: string
          lender_id?: string | null
          method?: string
          pay_ref?: string
          pay_verified?: boolean
          payout_done?: boolean
          refund_done?: boolean
          renter_id?: string
          resolution?: string | null
          ret?: Json | null
          start_date?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_dress_id_fkey"
            columns: ["dress_id"]
            isOneToOne: false
            referencedRelation: "dresses"
            referencedColumns: ["id"]
          },
        ]
      }
      dresses: {
        Row: {
          blocked: string[]
          bust: string
          category: string
          created_at: string
          deposit: number
          description: string
          distance_km: number
          fee: number
          hip: string
          id: string
          lender: string
          length: string
          neighborhood: string
          owner_id: string | null
          photos: string[]
          rating: number
          retail: number
          size: string
          status: string
          tilet: string
          title: string
          waist: string
        }
        Insert: {
          blocked?: string[]
          bust?: string
          category: string
          created_at?: string
          deposit?: number
          description?: string
          distance_km?: number
          fee: number
          hip?: string
          id?: string
          lender?: string
          length?: string
          neighborhood: string
          owner_id?: string | null
          photos?: string[]
          rating?: number
          retail?: number
          size?: string
          status?: string
          tilet?: string
          title: string
          waist?: string
        }
        Update: {
          blocked?: string[]
          bust?: string
          category?: string
          created_at?: string
          deposit?: number
          description?: string
          distance_km?: number
          fee?: number
          hip?: string
          id?: string
          lender?: string
          length?: string
          neighborhood?: string
          owner_id?: string | null
          photos?: string[]
          rating?: number
          retail?: number
          size?: string
          status?: string
          tilet?: string
          title?: string
          waist?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          dress_id: string
          user_id: string
        }
        Insert: {
          dress_id: string
          user_id: string
        }
        Update: {
          dress_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_dress_id_fkey"
            columns: ["dress_id"]
            isOneToOne: false
            referencedRelation: "dresses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          city: string
          created_at: string
          full_name: string
          id: string
          neighborhood: string
          phone: string
          sub_city: string
          telegram: string
        }
        Insert: {
          city?: string
          created_at?: string
          full_name?: string
          id: string
          neighborhood?: string
          phone?: string
          sub_city?: string
          telegram?: string
        }
        Update: {
          city?: string
          created_at?: string
          full_name?: string
          id?: string
          neighborhood?: string
          phone?: string
          sub_city?: string
          telegram?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
