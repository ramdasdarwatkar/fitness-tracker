export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      exercise: {
        Row: {
          id: number;
          name: string;
          reps: boolean | null;
          weight: boolean | null;
          distance: boolean | null;
          duration: boolean | null;
          muscle_group_id: number | null;
          tags: string | null;
        };
        Insert: {
          id?: number;
          name: string;
          reps?: boolean | null;
          weight?: boolean | null;
          distance?: boolean | null;
          duration?: boolean | null;
          muscle_group_id?: number | null;
          tags?: string | null;
        };
        Update: {
          id?: number;
          name?: string;
          reps?: boolean | null;
          weight?: boolean | null;
          distance?: boolean | null;
          duration?: boolean | null;
          muscle_group_id?: number | null;
          tags?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "exercise_muscle_group_id_fkey";
            columns: ["muscle_group_id"];
            referencedRelation: "muscle_group";
            referencedColumns: ["id"];
          },
        ];
      };

      muscle_group: {
        Row: {
          id: number;
          name: string;
          sub_muscle: string | null;
        };
        Insert: {
          id?: number;
          name: string;
          sub_muscle?: string | null;
        };
        Update: {
          id?: number;
          name?: string;
          sub_muscle?: string | null;
        };
        Relationships: [];
      };

      profile_metrics: {
        Row: {
          user_id: string;
          log_date: string;
          neck: number | null;
          shoulders: number | null;
          chest: number | null;
          right_bicep: number | null;
          left_bicep: number | null;
          right_forearm: number | null;
          left_forearm: number | null;
          waist: number | null;
          right_thigh: number | null;
          left_thigh: number | null;
          right_calf: number | null;
          left_calf: number | null;
          hips: number | null;
          weight: number;
        };
        Insert: {
          user_id: string;
          log_date: string;
          neck?: number | null;
          shoulders?: number | null;
          chest?: number | null;
          right_bicep?: number | null;
          left_bicep?: number | null;
          right_forearm?: number | null;
          left_forearm?: number | null;
          waist?: number | null;
          right_thigh?: number | null;
          left_thigh?: number | null;
          right_calf?: number | null;
          left_calf?: number | null;
          hips?: number | null;
          weight: number;
        };
        Update: {
          user_id?: string;
          log_date?: string;
          neck?: number | null;
          shoulders?: number | null;
          chest?: number | null;
          right_bicep?: number | null;
          left_bicep?: number | null;
          right_forearm?: number | null;
          left_forearm?: number | null;
          waist?: number | null;
          right_thigh?: number | null;
          left_thigh?: number | null;
          right_calf?: number | null;
          left_calf?: number | null;
          hips?: number | null;
          weight?: number;
        };
        Relationships: [
          {
            foreignKeyName: "profile_metrics_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "user_profile";
            referencedColumns: ["user_id"];
          },
        ];
      };

      routine: {
        Row: {
          id: number;
          name: string;
          user_id: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: number;
          name: string;
          user_id?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: number;
          name?: string;
          user_id?: string | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "routine_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "user_profile";
            referencedColumns: ["user_id"];
          },
        ];
      };

      routine_exercises: {
        Row: {
          routine_id: number;
          exercise_id: number;
        };
        Insert: {
          routine_id: number;
          exercise_id: number;
        };
        Update: {
          routine_id?: number;
          exercise_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "routine_exercises_routine_id_fkey";
            columns: ["routine_id"];
            referencedRelation: "routine";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "routine_exercises_exercise_id_fkey";
            columns: ["exercise_id"];
            referencedRelation: "exercise";
            referencedColumns: ["id"];
          },
        ];
      };

      user_profile: {
        Row: {
          user_id: string;
          name: string;
          birth_date: string;
          height: number | null;
          target_weight: number | null;
          level_points: number;
          target_days_week: number | null;
          level_calculation_date: string | null;
        };
        Insert: {
          user_id?: string;
          name: string;
          birth_date: string;
          height?: number | null;
          target_weight?: number | null;
          level_points?: number;
          target_days_week?: number | null;
          level_calculation_date?: string | null;
        };
        Update: {
          user_id?: string;
          name?: string;
          birth_date?: string;
          height?: number | null;
          target_weight?: number | null;
          level_points?: number;
          target_days_week?: number | null;
          level_calculation_date?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "user_profile_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };

      workout: {
        Row: {
          id: number;
          date: string;
          user_id: string;
          notes: string | null;
          completed: boolean;
          start_time: string | null;
          finish_time: string | null;
          total_duration: number | null;
          muscles: string | null;
          total_volume: number | null;
          calories: number | null;
          rest_day: boolean;
          total_distance: number | null;
        };
        Insert: {
          id?: number;
          date: string;
          user_id: string;
          notes?: string | null;
          completed: boolean;
          start_time?: string | null;
          finish_time?: string | null;
          total_duration?: number | null;
          muscles?: string | null;
          total_volume?: number | null;
          calories?: number | null;
          rest_day?: boolean;
          total_distance?: number | null;
        };
        Update: {
          id?: number;
          date?: string;
          user_id?: string;
          notes?: string | null;
          completed?: boolean;
          start_time?: string | null;
          finish_time?: string | null;
          total_duration?: number | null;
          muscles?: string | null;
          total_volume?: number | null;
          calories?: number | null;
          rest_day?: boolean;
          total_distance?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "workout_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "user_profile";
            referencedColumns: ["user_id"];
          },
        ];
      };

      workout_logs: {
        Row: {
          id: number;
          exercise_id: number;
          set: number;
          reps: number | null;
          weight: number | null;
          distance: number | null;
          duration: number | null;
          workout_id: number | null;
        };
        Insert: {
          id?: number;
          exercise_id: number;
          set: number;
          reps?: number | null;
          weight?: number | null;
          distance?: number | null;
          duration?: number | null;
          workout_id?: number | null;
        };
        Update: {
          id?: number;
          exercise_id?: number;
          set?: number;
          reps?: number | null;
          weight?: number | null;
          distance?: number | null;
          duration?: number | null;
          workout_id?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "workout_logs_exercise_id_fkey";
            columns: ["exercise_id"];
            referencedRelation: "exercise";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workout_logs_workout_id_fkey";
            columns: ["workout_id"];
            referencedRelation: "workout";
            referencedColumns: ["id"];
          },
        ];
      };
    };

    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
}
