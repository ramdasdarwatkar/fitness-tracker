import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/database.types"; // <--- Make sure this path is correct

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

// THE FIX IS HERE: <Database>
export const supabase = createClient<Database>(supabaseUrl, supabaseKey);
