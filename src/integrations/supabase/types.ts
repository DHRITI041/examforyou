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
      exams: {
        Row: {
          id: string;
          title: string;
          subject: string;
          description: string | null;
          duration_minutes: number;
          created_at: string;
        };

        Insert: {
          id?: string;
          title: string;
          subject?: string;
          description?: string | null;
          duration_minutes?: number;
          created_at?: string;
        };

        Update: {
          id?: string;
          title?: string;
          subject?: string;
          description?: string | null;
          duration_minutes?: number;
          created_at?: string;
        };
      };

      questions: {
        Row: {
          id: string;
          exam_id: string;
          question_text: string;
          options: Json;
          correct_index: number;
          position: number;
          created_at: string;
        };

        Insert: {
          id?: string;
          exam_id: string;
          question_text: string;
          options?: Json;
          correct_index?: number;
          position?: number;
          created_at?: string;
        };

        Update: {
          id?: string;
          exam_id?: string;
          question_text?: string;
          options?: Json;
          correct_index?: number;
          position?: number;
          created_at?: string;
        };
      };
    };
  };
}
