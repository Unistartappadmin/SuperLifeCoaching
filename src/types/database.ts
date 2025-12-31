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
      users: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          name: string;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          id?: string;
          name: string;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          name?: string;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      availability_slots: {
        Row: {
          created_at: string;
          day_of_week: number;
          end_time: string;
          id: string;
          is_active: boolean;
          start_time: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          day_of_week: number;
          end_time: string;
          id?: string;
          is_active?: boolean;
          start_time: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          day_of_week?: number;
          end_time?: string;
          id?: string;
          is_active?: boolean;
          start_time?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      blocked_dates: {
        Row: {
          created_at: string;
          date: string;
          id: string;
          reason: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          date: string;
          id?: string;
          reason?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          date?: string;
          id?: string;
          reason?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      bookings: {
        Row: {
          created_at: string;
          duration: number;
          google_calendar_event_id: string | null;
          id: string;
          notes: string | null;
          payment_status: string;
          service_type: Database["public"]["Enums"]["service_type"];
          session_date: string;
          session_time: string;
          status: string;
          stripe_payment_intent_id: string | null;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          duration: number;
          google_calendar_event_id?: string | null;
          id?: string;
          notes?: string | null;
          payment_status?: string;
          service_type: Database["public"]["Enums"]["service_type"];
          session_date: string;
          session_time: string;
          status?: string;
          stripe_payment_intent_id?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          duration?: number;
          google_calendar_event_id?: string | null;
          id?: string;
          notes?: string | null;
          payment_status?: string;
          service_type?: Database["public"]["Enums"]["service_type"];
          session_date?: string;
          session_time?: string;
          status?: string;
          stripe_payment_intent_id?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "bookings_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      package_sessions: {
        Row: {
          booking_id: string;
          created_at: string;
          google_calendar_event_id: string | null;
          id: string;
          session_date: string | null;
          session_number: number;
          session_time: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          booking_id: string;
          created_at?: string;
          google_calendar_event_id?: string | null;
          id?: string;
          session_date?: string | null;
          session_number: number;
          session_time?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          booking_id?: string;
          created_at?: string;
          google_calendar_event_id?: string | null;
          id?: string;
          session_date?: string | null;
          session_number?: number;
          session_time?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "package_sessions_booking_id_fkey";
            columns: ["booking_id"];
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          }
        ];
      };
      integration_tokens: {
        Row: {
          access_token: string | null;
          created_at: string;
          expires_at: string | null;
          id: string;
          provider: string;
          refresh_token: string | null;
          token_type: string;
          updated_at: string;
        };
        Insert: {
          access_token?: string | null;
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          provider: string;
          refresh_token?: string | null;
          token_type?: string;
          updated_at?: string;
        };
        Update: {
          access_token?: string | null;
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          provider?: string;
          refresh_token?: string | null;
          token_type?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {};
    Functions: {};
    Enums: {
      service_type: "free-call" | "clarifying-session" | "breakthrough-package" | "transformational-package";
    };
    CompositeTypes: {};
  };
};

export type Tables<
  Name extends keyof Database["public"]["Tables"]
> = Database["public"]["Tables"][Name]["Row"];

export type TablesInsert<
  Name extends keyof Database["public"]["Tables"]
> = Database["public"]["Tables"][Name]["Insert"];

export type TablesUpdate<
  Name extends keyof Database["public"]["Tables"]
> = Database["public"]["Tables"][Name]["Update"];

export type Enums<Name extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][Name];
