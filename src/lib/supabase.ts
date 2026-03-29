import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url) throw new Error("Missing SUPABASE_URL");
if (!key) throw new Error("Missing SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY)");

export const supabaseAuth = createClient(url, key, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
