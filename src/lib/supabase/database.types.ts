// Hand-written to mirror supabase/migrations. Once the project is linked, this can be replaced with:
//   npx supabase gen types typescript --project-id <id> > src/lib/supabase/database.types.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Table<Row, Required extends keyof Row> = {
  Row: Row;
  Insert: Pick<Row, Required> & Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

type Plan = "yearly" | "monthly";
type Verdict = "onTrack" | "practice" | "talkToTeacher";

export type Database = {
  public: {
    Tables: {
      profiles: Table<
        {
          id: string;
          created_at: string;
          consent_version: string | null;
          consent_at: string | null;
          trial_plan: Plan | null;
          trial_requested_at: string | null;
        },
        "id"
      >;
      children: Table<
        {
          id: string;
          parent_id: string;
          first_name: string;
          grade: number;
          created_at: string;
        },
        "first_name" | "grade"
      >;
      readings: Table<
        {
          id: string;
          parent_id: string;
          child_id: string;
          read_at: string;
          passage_id: string;
          grade: number;
          season: "fall" | "winter" | "spring";
          mode: "live" | "manual" | "demo";
          seconds: number;
          attempted: number;
          errors: number;
          wcpm: number;
          accuracy: number;
          verdict: Verdict;
          band: string;
          patterns: string[];
          word_statuses: string;
          summary: Json | null;
        },
        "child_id" | "passage_id" | "grade" | "season" | "mode" | "seconds" | "attempted" | "errors" | "wcpm" | "accuracy" | "verdict" | "band"
      >;
      trial_interest: Table<
        {
          id: number;
          created_at: string;
          plan: Plan;
          grade: number | null;
          verdict: Verdict | null;
          user_id: string | null;
        },
        "plan"
      >;
    };
    Views: { [_ in never]: never };
    Functions: {
      delete_my_account: { Args: Record<string, never>; Returns: undefined };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
