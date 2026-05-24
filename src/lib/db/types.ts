import type { Database } from "@/lib/db/supabase";

export type UserRow = Database["public"]["Tables"]["users"]["Row"];
export type CallRow = Database["public"]["Tables"]["calls"]["Row"];
