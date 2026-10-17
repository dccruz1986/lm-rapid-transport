import "server-only";
import { supabaseEnvironment } from "@lm/config/env";
import type { Database } from "@lm/types/database";
import { createClient } from "@supabase/supabase-js";
export function privilegedClient() {
  const { url } = supabaseEnvironment();
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error("SERVER_CONFIGURATION");
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: Object.assign(
        (input: RequestInfo | URL, init?: RequestInit) =>
          fetch(input, { ...init, signal: AbortSignal.timeout(45_000) }),
        { preconnect: fetch.preconnect },
      ),
    },
  });
}
