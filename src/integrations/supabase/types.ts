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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ecue: {
        Row: {
          code: string
          created_at: string
          credits: number
          id: string
          nom: string
          ordre: number
          ue_id: string
        }
        Insert: {
          code: string
          created_at?: string
          credits?: number
          id?: string
          nom: string
          ordre?: number
          ue_id: string
        }
        Update: {
          code?: string
          created_at?: string
          credits?: number
          id?: string
          nom?: string
          ordre?: number
          ue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ecue_ue_id_fkey"
            columns: ["ue_id"]
            isOneToOne: false
            referencedRelation: "unites_enseignement"
            referencedColumns: ["id"]
          },
        ]
      }
      etudiants: {
        Row: {
          created_at: string
          date_naissance: string | null
          id: string
          lieu_naissance: string | null
          matricule: string
          nom: string
          prenom: string
          session_id: string
        }
        Insert: {
          created_at?: string
          date_naissance?: string | null
          id?: string
          lieu_naissance?: string | null
          matricule: string
          nom: string
          prenom: string
          session_id: string
        }
        Update: {
          created_at?: string
          date_naissance?: string | null
          id?: string
          lieu_naissance?: string | null
          matricule?: string
          nom?: string
          prenom?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "etudiants_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          created_at: string
          ecue_id: string
          etudiant_id: string
          id: string
          note: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          ecue_id: string
          etudiant_id: string
          id?: string
          note?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          ecue_id?: string
          etudiant_id?: string
          id?: string
          note?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_ecue_id_fkey"
            columns: ["ecue_id"]
            isOneToOne: false
            referencedRelation: "ecue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_etudiant_id_fkey"
            columns: ["etudiant_id"]
            isOneToOne: false
            referencedRelation: "etudiants"
            referencedColumns: ["id"]
          },
        ]
      }
      resultats: {
        Row: {
          created_at: string
          credits_totaux: number | null
          credits_valides: number | null
          decision: string | null
          etudiant_id: string
          id: string
          mention: string | null
          moyenne_annuelle: number | null
          moyenne_s1: number | null
          moyenne_s2: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          credits_totaux?: number | null
          credits_valides?: number | null
          decision?: string | null
          etudiant_id: string
          id?: string
          mention?: string | null
          moyenne_annuelle?: number | null
          moyenne_s1?: number | null
          moyenne_s2?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          credits_totaux?: number | null
          credits_valides?: number | null
          decision?: string | null
          etudiant_id?: string
          id?: string
          mention?: string | null
          moyenne_annuelle?: number | null
          moyenne_s1?: number | null
          moyenne_s2?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resultats_etudiant_id_fkey"
            columns: ["etudiant_id"]
            isOneToOne: true
            referencedRelation: "etudiants"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          annee_academique: string
          created_at: string
          date_deliberation: string | null
          filiere: string
          id: string
          niveau: string
          semestre: string
        }
        Insert: {
          annee_academique: string
          created_at?: string
          date_deliberation?: string | null
          filiere: string
          id?: string
          niveau: string
          semestre: string
        }
        Update: {
          annee_academique?: string
          created_at?: string
          date_deliberation?: string | null
          filiere?: string
          id?: string
          niveau?: string
          semestre?: string
        }
        Relationships: []
      }
      unites_enseignement: {
        Row: {
          code: string
          created_at: string
          credits_totaux: number
          id: string
          nom: string
          ordre: number
          session_id: string
        }
        Insert: {
          code: string
          created_at?: string
          credits_totaux?: number
          id?: string
          nom: string
          ordre?: number
          session_id: string
        }
        Update: {
          code?: string
          created_at?: string
          credits_totaux?: number
          id?: string
          nom?: string
          ordre?: number
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "unites_enseignement_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
