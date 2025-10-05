export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      example: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          full_name: string | null;
          id: string;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          full_name?: string | null;
          id?: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          full_name?: string | null;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          id: string;
          name: string;
          phone: string | null;
          role: Database["public"]["Enums"]["user_role"];
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          id: string;
          name: string;
          phone?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          id?: string;
          name?: string;
          phone?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
            referencedSchema?: "auth";
          },
        ];
      };
      terms: {
        Row: {
          content: string | null;
          created_at: string;
          id: string;
          is_published: boolean;
          published_at: string | null;
          title: string | null;
          version: string;
        };
        Insert: {
          content?: string | null;
          created_at?: string;
          id?: string;
          is_published?: boolean;
          published_at?: string | null;
          title?: string | null;
          version: string;
        };
        Update: {
          content?: string | null;
          created_at?: string;
          id?: string;
          is_published?: boolean;
          published_at?: string | null;
          title?: string | null;
          version?: string;
        };
        Relationships: [];
      };
      terms_agreements: {
        Row: {
          agreed_at: string;
          id: string;
          terms_version: string;
          user_id: string;
        };
        Insert: {
          agreed_at?: string;
          id?: string;
          terms_version: string;
          user_id: string;
        };
        Update: {
          agreed_at?: string;
          id?: string;
          terms_version?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "terms_agreements_terms_version_fkey";
            columns: ["terms_version"];
            referencedRelation: "terms";
            referencedColumns: ["version"];
          },
          {
            foreignKeyName: "terms_agreements_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
            referencedSchema?: "auth";
          },
        ];
      };
      categories: {
        Row: {
          active: boolean;
          created_at: string;
          curriculum: string | null;
          description: string | null;
          id: string;
          name: string;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          curriculum?: string | null;
          description?: string | null;
          id?: string;
          name: string;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          curriculum?: string | null;
          description?: string | null;
          id?: string;
          name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      difficulty_levels: {
        Row: {
          active: boolean;
          created_at: string;
          curriculum: string | null;
          description: string | null;
          id: string;
          level: number;
          name: string;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          curriculum?: string | null;
          description?: string | null;
          id?: string;
          level: number;
          name: string;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          curriculum?: string | null;
          description?: string | null;
          id?: string;
          level?: number;
          name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      courses: {
        Row: {
          archived_at: string | null;
          category_id: string;
          created_at: string;
          curriculum: string | null;
          description: string | null;
          difficulty_id: string;
          enrolled_count: number;
          id: string;
          instructor_id: string;
          max_students: number | null;
          published_at: string | null;
          status: Database["public"]["Enums"]["course_status"];
          summary: string | null;
          thumbnail_url: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          archived_at?: string | null;
          category_id: string;
          created_at?: string;
          curriculum?: string | null;
          description?: string | null;
          difficulty_id: string;
          enrolled_count?: number;
          id?: string;
          instructor_id: string;
          max_students?: number | null;
          published_at?: string | null;
          status?: Database["public"]["Enums"]["course_status"];
          summary?: string | null;
          thumbnail_url?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          archived_at?: string | null;
          category_id?: string;
          created_at?: string;
          curriculum?: string | null;
          description?: string | null;
          difficulty_id?: string;
          enrolled_count?: number;
          id?: string;
          instructor_id?: string;
          max_students?: number | null;
          published_at?: string | null;
          status?: Database["public"]["Enums"]["course_status"];
          summary?: string | null;
          thumbnail_url?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "courses_category_id_fkey";
            columns: ["category_id"];
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "courses_difficulty_id_fkey";
            columns: ["difficulty_id"];
            referencedRelation: "difficulty_levels";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "courses_instructor_id_fkey";
            columns: ["instructor_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
            referencedSchema?: "auth";
          },
        ];
      };
      enrollments: {
        Row: {
          cancelled_at: string | null;
          course_id: string;
          enrolled_at: string;
          id: string;
          learner_id: string;
        };
        Insert: {
          cancelled_at?: string | null;
          course_id: string;
          enrolled_at?: string;
          id?: string;
          learner_id: string;
        };
        Update: {
          cancelled_at?: string | null;
          course_id?: string;
          enrolled_at?: string;
          id?: string;
          learner_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey";
            columns: ["course_id"];
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enrollments_learner_id_fkey";
            columns: ["learner_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
            referencedSchema?: "auth";
          },
        ];
      };
      assignments: {
        Row: {
          allow_late: boolean;
          allow_resubmission: boolean;
          course_id: string;
          created_at: string;
          curriculum: string | null;
          description: string | null;
          due_date: string;
          id: string;
          max_score: number;
          status: Database["public"]["Enums"]["assignment_status"];
          title: string;
          updated_at: string;
          weight: number;
        };
        Insert: {
          allow_late?: boolean;
          allow_resubmission?: boolean;
          course_id: string;
          created_at?: string;
          curriculum?: string | null;
          description?: string | null;
          due_date: string;
          id?: string;
          max_score?: number;
          status?: Database["public"]["Enums"]["assignment_status"];
          title: string;
          updated_at?: string;
          weight?: number;
        };
        Update: {
          allow_late?: boolean;
          allow_resubmission?: boolean;
          course_id?: string;
          created_at?: string;
          curriculum?: string | null;
          description?: string | null;
          due_date?: string;
          id?: string;
          max_score?: number;
          status?: Database["public"]["Enums"]["assignment_status"];
          title?: string;
          updated_at?: string;
          weight?: number;
        };
        Relationships: [
          {
            foreignKeyName: "assignments_course_id_fkey";
            columns: ["course_id"];
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
        ];
      };
      submissions: {
        Row: {
          assignment_id: string;
          content: string | null;
          feedback: string | null;
          graded_at: string | null;
          id: string;
          is_late: boolean;
          learner_id: string;
          link_url: string | null;
          score: number | null;
          status: Database["public"]["Enums"]["submission_status"];
          submitted_at: string;
          updated_at: string;
        };
        Insert: {
          assignment_id: string;
          content?: string | null;
          feedback?: string | null;
          graded_at?: string | null;
          id?: string;
          is_late?: boolean;
          learner_id: string;
          link_url?: string | null;
          score?: number | null;
          status?: Database["public"]["Enums"]["submission_status"];
          submitted_at?: string;
          updated_at?: string;
        };
        Update: {
          assignment_id?: string;
          content?: string | null;
          feedback?: string | null;
          graded_at?: string | null;
          id?: string;
          is_late?: boolean;
          learner_id?: string;
          link_url?: string | null;
          score?: number | null;
          status?: Database["public"]["Enums"]["submission_status"];
          submitted_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "submissions_assignment_id_fkey";
            columns: ["assignment_id"];
            referencedRelation: "assignments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "submissions_learner_id_fkey";
            columns: ["learner_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
            referencedSchema?: "auth";
          },
        ];
      };
      reports: {
        Row: {
          created_at: string;
          curriculum: string | null;
          description: string | null;
          evidence_urls: string[] | null;
          id: string;
          reason: string;
          reported_submission_id: string | null;
          reported_user_id: string | null;
          reporter_id: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          curriculum?: string | null;
          description?: string | null;
          evidence_urls?: string[] | null;
          id?: string;
          reason: string;
          reported_submission_id?: string | null;
          reported_user_id?: string | null;
          reporter_id?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          curriculum?: string | null;
          description?: string | null;
          evidence_urls?: string[] | null;
          id?: string;
          reason?: string;
          reported_submission_id?: string | null;
          reported_user_id?: string | null;
          reporter_id?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reports_reported_submission_id_fkey";
            columns: ["reported_submission_id"];
            referencedRelation: "submissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_reported_user_id_fkey";
            columns: ["reported_user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
            referencedSchema?: "auth";
          },
          {
            foreignKeyName: "reports_reporter_id_fkey";
            columns: ["reporter_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
            referencedSchema?: "auth";
          },
        ];
      };
      report_actions: {
        Row: {
          action_type: string;
          created_at: string;
          id: string;
          notes: string | null;
          operator_id: string | null;
          payload: Json | null;
          report_id: string;
        };
        Insert: {
          action_type: string;
          created_at?: string;
          id?: string;
          notes?: string | null;
          operator_id?: string | null;
          payload?: Json | null;
          report_id: string;
        };
        Update: {
          action_type?: string;
          created_at?: string;
          id?: string;
          notes?: string | null;
          operator_id?: string | null;
          payload?: Json | null;
          report_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "report_actions_operator_id_fkey";
            columns: ["operator_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
            referencedSchema?: "auth";
          },
          {
            foreignKeyName: "report_actions_report_id_fkey";
            columns: ["report_id"];
            referencedRelation: "reports";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_logs: {
        Row: {
          actor_id: string | null;
          actor_role: string | null;
          created_at: string;
          event: string;
          id: string;
          metadata: Json | null;
          target_id: string | null;
          target_type: string | null;
        };
        Insert: {
          actor_id?: string | null;
          actor_role?: string | null;
          created_at?: string;
          event: string;
          id?: string;
          metadata?: Json | null;
          target_id?: string | null;
          target_type?: string | null;
        };
        Update: {
          actor_id?: string | null;
          actor_role?: string | null;
          created_at?: string;
          event?: string;
          id?: string;
          metadata?: Json | null;
          target_id?: string | null;
          target_type?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [key: string]: never;
    };
    Functions: {
      [key: string]: never;
    };
    Enums: {
      assignment_status: "draft" | "published" | "closed";
      course_status: "draft" | "published" | "archived";
      submission_status: "submitted" | "graded" | "resubmission_required";
      user_role: "learner" | "instructor" | "operator";
    };
    CompositeTypes: {
      [key: string]: never;
    };
  };
};

export type PublicSchema = Database["public"];

export type Tables<TName extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][TName];

export type TableRow<TName extends keyof PublicSchema["Tables"]> = Tables<TName>["Row"];
export type TableInsert<TName extends keyof PublicSchema["Tables"]> = Tables<TName>["Insert"];
export type TableUpdate<TName extends keyof PublicSchema["Tables"]> = Tables<TName>["Update"];

export type UserRole = Database["public"]["Enums"]["user_role"];
export type CourseStatus = Database["public"]["Enums"]["course_status"];
export type AssignmentStatus = Database["public"]["Enums"]["assignment_status"];
export type SubmissionStatus = Database["public"]["Enums"]["submission_status"];
