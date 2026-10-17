import "server-only";
import { supabaseEnvironment } from "@lm/config/env";
import type { Database } from "@lm/types/database";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
export async function serverClient() {
  const { url, key } = supabaseEnvironment();
  const store = await cookies();
  return createServerClient<Database>(url, key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll(values) {
        try {
          for (const { name, value, options } of values) store.set(name, value, options);
        } catch {
          /* Server Components rely on proxy to refresh cookies. */
        }
      },
    },
  });
}
export async function requireStaff(permission = "records.read") {
  const db = await serverClient();
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  if (error || !user) redirect("/login");
  const { data: profile } = await db.from("profiles").select("*").eq("id", user.id).single();
  if (!profile?.active) redirect("/login?error=INACTIVE");
  const { data: permissions, error: permissionsError } = await db.rpc("my_permissions");
  if (permissionsError || !permissions?.includes(permission)) throw new Error("FORBIDDEN");
  return { db, user, profile, permissions };
}
