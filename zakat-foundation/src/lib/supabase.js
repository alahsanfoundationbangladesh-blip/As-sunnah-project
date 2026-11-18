import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase public URL and publishable key are required.");
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "pkce",
    persistSession: true,
  },
});
