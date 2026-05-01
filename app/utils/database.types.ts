export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {

      // ── Departments (NEW) ────────────────────────────────────────────────────
      Departments: {
        Row: {
          id:            string
          name:          string
          full_name:     string
          is_active:     boolean
          display_order: number
          created_at:    string
        }
        Insert: {
          id?:            string
          name:           string
          full_name:      string
          is_active?:     boolean
          display_order?: number
          created_at?:    string
        }
        Update: {
          id?:            string
          name?:          string
          full_name?:     string
          is_active?:     boolean
          display_order?: number
          created_at?:    string
        }
        Relationships: []
      }

      // ── Elections (NEW) ──────────────────────────────────────────────────────
      Elections: {
        Row: {
          id:           string
          label:        string
          status:       'active' | 'archived'
          voting_start: string | null
          voting_end:   string | null
          archived_at:  string | null
          created_at:   string
        }
        Insert: {
          id?:           string
          label:         string
          status?:       'active' | 'archived'
          voting_start?: string | null
          voting_end?:   string | null
          archived_at?:  string | null
          created_at?:   string
        }
        Update: {
          id?:           string
          label?:        string
          status?:       'active' | 'archived'
          voting_start?: string | null
          voting_end?:   string | null
          archived_at?:  string | null
          created_at?:   string
        }
        Relationships: []
      }

      // ── Positions (MODIFIED) ─────────────────────────────────────────────────
      Positions: {
        Row: {
          id:            string
          position_name: string
          department_id: string | null   // null = executive / cross-department
          is_executive:  boolean
          is_active:     boolean
          display_order: number
          created_at:    string | null
        }
        Insert: {
          id?:            string
          position_name:  string
          department_id?: string | null
          is_executive?:  boolean
          is_active?:     boolean
          display_order?: number
          created_at?:    string | null
        }
        Update: {
          id?:            string
          position_name?: string
          department_id?: string | null
          is_executive?:  boolean
          is_active?:     boolean
          display_order?: number
          created_at?:    string | null
        }
        Relationships: [
          {
            foreignKeyName: "Positions_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "Departments"
            referencedColumns: ["id"]
          }
        ]
      }

      // ── Candidates (MODIFIED — election_id added) ────────────────────────────
      Candidates: {
        Row: {
          id:          string
          name:        string
          partylist:   string | null
          position_id: string
          election_id: string
          email:       string | null
          credentials: string | null
          platform:    string | null
          photo_url:   string | null
          created_at:  string | null
          updated_at:  string | null
        }
        Insert: {
          id?:          string
          name:         string
          partylist?:   string | null
          position_id:  string
          election_id:  string
          email?:       string | null
          credentials?: string | null
          platform?:    string | null
          photo_url?:   string | null
          created_at?:  string | null
          updated_at?:  string | null
        }
        Update: {
          id?:          string
          name?:        string
          partylist?:   string | null
          position_id?: string
          election_id?: string
          email?:       string | null
          credentials?: string | null
          platform?:    string | null
          photo_url?:   string | null
          created_at?:  string | null
          updated_at?:  string | null
        }
        Relationships: [
          {
            foreignKeyName: "Candidates_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "Positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Candidates_election_id_fkey"
            columns: ["election_id"]
            isOneToOne: false
            referencedRelation: "Elections"
            referencedColumns: ["id"]
          }
        ]
      }

      // ── Votes (MODIFIED — election_id added) ─────────────────────────────────
      Votes: {
        Row: {
          id:           string
          student_id:   string
          candidate_id: string
          position_id:  string
          election_id:  string
          is_valid:     boolean | null
          created_at:   string | null
        }
        Insert: {
          id?:           string
          student_id:    string
          candidate_id:  string
          position_id:   string
          election_id:   string
          is_valid?:     boolean | null
          created_at?:   string | null
        }
        Update: {
          id?:           string
          student_id?:   string
          candidate_id?: string
          position_id?:  string
          election_id?:  string
          is_valid?:     boolean | null
          created_at?:   string | null
        }
        Relationships: [
          {
            foreignKeyName: "Votes_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "Candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Votes_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "Positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Votes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Votes_election_id_fkey"
            columns: ["election_id"]
            isOneToOne: false
            referencedRelation: "Elections"
            referencedColumns: ["id"]
          }
        ]
      }

      // ── Posts (MODIFIED — election_id added) ─────────────────────────────────
      Posts: {
        Row: {
          id:          string
          admin_id:    string | null
          type:        string
          title:       string
          content:     string | null
          election_id: string
          created_at:  string | null
          updated_at:  string | null
        }
        Insert: {
          id?:          string
          admin_id?:    string | null
          type:         string
          title:        string
          content?:     string | null
          election_id:  string
          created_at?:  string | null
          updated_at?:  string | null
        }
        Update: {
          id?:          string
          admin_id?:    string | null
          type?:        string
          title?:       string
          content?:     string | null
          election_id?: string
          created_at?:  string | null
          updated_at?:  string | null
        }
        Relationships: [
          {
            foreignKeyName: "Posts_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Posts_election_id_fkey"
            columns: ["election_id"]
            isOneToOne: false
            referencedRelation: "Elections"
            referencedColumns: ["id"]
          }
        ]
      }

      // ── MitingQuestions (MODIFIED — election_id added) ────────────────────────
      MitingQuestions: {
        Row: {
          id:            string
          student_id:    string
          question_text: string
          upvote_count:  number | null
          is_approved:   boolean | null
          election_id:   string
          created_at:    string | null
        }
        Insert: {
          id?:            string
          student_id:     string
          question_text:  string
          upvote_count?:  number | null
          is_approved?:   boolean | null
          election_id:    string
          created_at?:    string | null
        }
        Update: {
          id?:            string
          student_id?:    string
          question_text?: string
          upvote_count?:  number | null
          is_approved?:   boolean | null
          election_id?:   string
          created_at?:    string | null
        }
        Relationships: [
          {
            foreignKeyName: "MitingQuestions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "MitingQuestions_election_id_fkey"
            columns: ["election_id"]
            isOneToOne: false
            referencedRelation: "Elections"
            referencedColumns: ["id"]
          }
        ]
      }

      // ── SystemSettings (MODIFIED — schedule columns replaced by FK) ──────────
      SystemSettings: {
        Row: {
          id:                  string
          active_election_id:  string | null
          is_miting_active:    boolean | null
          show_live_results:   boolean | null
          updated_at:          string | null
        }
        Insert: {
          id?:                  string
          active_election_id?:  string | null
          is_miting_active?:    boolean | null
          show_live_results?:   boolean | null
          updated_at?:          string | null
        }
        Update: {
          id?:                  string
          active_election_id?:  string | null
          is_miting_active?:    boolean | null
          show_live_results?:   boolean | null
          updated_at?:          string | null
        }
        Relationships: [
          {
            foreignKeyName: "SystemSettings_active_election_id_fkey"
            columns: ["active_election_id"]
            isOneToOne: false
            referencedRelation: "Elections"
            referencedColumns: ["id"]
          }
        ]
      }

      // ── Users (MODIFIED — department_id added) ────────────────────────────────
      Users: {
        Row: {
          id:                string
          auth_id:           string | null
          name:              string
          email:             string
          profile_photo_url: string | null
          department_id:     string | null
          is_active:         boolean | null
          created_at:        string | null
          updated_at:        string | null
        }
        Insert: {
          id?:                string
          auth_id?:           string | null
          name:               string
          email:              string
          profile_photo_url?: string | null
          department_id?:     string | null
          is_active?:         boolean | null
          created_at?:        string | null
          updated_at?:        string | null
        }
        Update: {
          id?:                string
          auth_id?:           string | null
          name?:              string
          email?:             string
          profile_photo_url?: string | null
          department_id?:     string | null
          is_active?:         boolean | null
          created_at?:        string | null
          updated_at?:        string | null
        }
        Relationships: [
          {
            foreignKeyName: "Users_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "Departments"
            referencedColumns: ["id"]
          }
        ]
      }

      // ── Unchanged tables ─────────────────────────────────────────────────────
      AuditLogs: {
        Row: {
          id:          string
          admin_id:    string | null
          action_type: string
          target_id:   string | null
          created_at:  string | null
        }
        Insert: {
          id?:          string
          admin_id?:    string | null
          action_type:  string
          target_id?:   string | null
          created_at?:  string | null
        }
        Update: {
          id?:          string
          admin_id?:    string | null
          action_type?: string
          target_id?:   string | null
          created_at?:  string | null
        }
        Relationships: [
          {
            foreignKeyName: "AuditLogs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["id"]
          }
        ]
      }
      Comments: {
        Row: {
          id:         string
          post_id:    string
          student_id: string
          content:    string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?:         string
          post_id:     string
          student_id:  string
          content:     string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?:         string
          post_id?:    string
          student_id?: string
          content?:    string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "Posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Comments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["id"]
          }
        ]
      }
      Notifications: {
        Row: {
          id:            string
          event_trigger: string
          title:         string
          message_body:  string
          updated_at:    string | null
        }
        Insert: {
          id?:            string
          event_trigger:  string
          title:          string
          message_body:   string
          updated_at?:    string | null
        }
        Update: {
          id?:            string
          event_trigger?: string
          title?:         string
          message_body?:  string
          updated_at?:    string | null
        }
        Relationships: []
      }
      PollOptions: {
        Row: {
          id:          string
          post_id:     string
          option_text: string
        }
        Insert: {
          id?:         string
          post_id:     string
          option_text: string
        }
        Update: {
          id?:          string
          post_id?:     string
          option_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "PollOptions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "Posts"
            referencedColumns: ["id"]
          }
        ]
      }
      PollResponses: {
        Row: {
          id:             string
          poll_option_id: string
          student_id:     string
          created_at:     string | null
        }
        Insert: {
          id?:             string
          poll_option_id:  string
          student_id:      string
          created_at?:     string | null
        }
        Update: {
          id?:              string
          poll_option_id?:  string
          student_id?:      string
          created_at?:      string | null
        }
        Relationships: [
          {
            foreignKeyName: "PollResponses_poll_option_id_fkey"
            columns: ["poll_option_id"]
            isOneToOne: false
            referencedRelation: "PollOptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "PollResponses_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["id"]
          }
        ]
      }
      QuestionUpvotes: {
        Row: {
          id:          string
          question_id: string
          student_id:  string
          created_at:  string | null
        }
        Insert: {
          id?:          string
          question_id:  string
          student_id:   string
          created_at?:  string | null
        }
        Update: {
          id?:          string
          question_id?: string
          student_id?:  string
          created_at?:  string | null
        }
        Relationships: [
          {
            foreignKeyName: "QuestionUpvotes_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "MitingQuestions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "QuestionUpvotes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["id"]
          }
        ]
      }
      Roles: {
        Row: {
          id:         string
          role_name:  string
          created_at: string | null
        }
        Insert: {
          id?:         string
          role_name:   string
          created_at?: string | null
        }
        Update: {
          id?:          string
          role_name?:   string
          created_at?:  string | null
        }
        Relationships: []
      }
      UserRoles: {
        Row: {
          id:          string
          user_id:     string
          role_id:     string
          auth_id:     string | null
          assigned_at: string | null
        }
        Insert: {
          id?:          string
          user_id:      string
          role_id:      string
          auth_id?:     string | null
          assigned_at?: string | null
        }
        Update: {
          id?:          string
          user_id?:     string
          role_id?:     string
          auth_id?:     string | null
          assigned_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "UserRoles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "Roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "UserRoles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "Users"
            referencedColumns: ["id"]
          }
        ]
      }
    }

    Views: {
      [_ in never]: never
    }

    Functions: {
      active_election_id: { Args: Record<never, never>; Returns: string }
      archive_election: {
        Args: { p_new_label?: string | null }
        Returns: Json
      }
      cast_vote: {
        Args: { p_candidate_id: string; p_position_id: string }
        Returns: Json
      }
      current_user_id:  { Args: Record<never, never>; Returns: string }
      delete_candidate: { Args: { p_candidate_id: string };  Returns: Json }
      get_ballot_positions: { Args: Record<never, never>; Returns: Json }
      get_live_results: {
        Args: { p_election_id?: string | null }
        Returns: {
          candidate_id:  string
          percentage:    number
          position_id:   string
          position_name: string
        }[]
      }
      get_vote_tally: {
        Args: { p_election_id?: string | null }
        Returns: {
          candidate_id:   string
          candidate_name: string
          partylist:      string
          position_id:    string
          position_name:  string
          vote_count:     number
        }[]
      }
      has_role:        { Args: { role_name: string }; Returns: boolean }
      invalidate_vote: { Args: { p_vote_id: string };  Returns: Json }
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

export const Constants = {
  public: {
    Enums: {},
  },
} as const
