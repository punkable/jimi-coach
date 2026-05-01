export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'admin' | 'coach' | 'athlete'
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: 'admin' | 'coach' | 'athlete'
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'admin' | 'coach' | 'athlete'
          avatar_url?: string | null
          created_at?: string
        }
      }
      exercises: {
        Row: {
          id: string
          name: string
          category: string | null
          primary_muscles: string[] | null
          equipment: string[] | null
          instructions: string | null
          common_errors: string | null
          video_url: string | null
          image_url: string | null
          difficulty_level: string | null
          tags: string[] | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          category?: string | null
          primary_muscles?: string[] | null
          equipment?: string[] | null
          instructions?: string | null
          common_errors?: string | null
          video_url?: string | null
          image_url?: string | null
          difficulty_level?: string | null
          tags?: string[] | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string | null
          primary_muscles?: string[] | null
          equipment?: string[] | null
          instructions?: string | null
          common_errors?: string | null
          video_url?: string | null
          image_url?: string | null
          difficulty_level?: string | null
          tags?: string[] | null
          created_by?: string | null
          created_at?: string
        }
      }
      workout_plans: {
        Row: {
          id: string
          title: string
          description: string | null
          objective: string | null
          level: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          objective?: string | null
          level?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          objective?: string | null
          level?: string | null
          created_by?: string | null
          created_at?: string
        }
      }
      workout_days: {
        Row: {
          id: string
          plan_id: string | null
          day_of_week: number | null
          title: string | null
          created_at: string
        }
        Insert: {
          id?: string
          plan_id?: string | null
          day_of_week?: number | null
          title?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          plan_id?: string | null
          day_of_week?: number | null
          title?: string | null
          created_at?: string
        }
      }
      assigned_plans: {
        Row: {
          id: string
          plan_id: string | null
          athlete_id: string | null
          start_date: string
          assigned_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          plan_id?: string | null
          athlete_id?: string | null
          start_date: string
          assigned_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          plan_id?: string | null
          athlete_id?: string | null
          start_date?: string
          assigned_by?: string | null
          created_at?: string
        }
      }
      workout_results: {
        Row: {
          id: string
          athlete_id: string | null
          workout_day_id: string | null
          completed: boolean | null
          score: string | null
          rpe: number | null
          notes: string | null
          completed_at: string
        }
        Insert: {
          id?: string
          athlete_id?: string | null
          workout_day_id?: string | null
          completed?: boolean | null
          score?: string | null
          rpe?: number | null
          notes?: string | null
          completed_at?: string
        }
        Update: {
          id?: string
          athlete_id?: string | null
          workout_day_id?: string | null
          completed?: boolean | null
          score?: string | null
          rpe?: number | null
          notes?: string | null
          completed_at?: string
        }
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
  }
}
