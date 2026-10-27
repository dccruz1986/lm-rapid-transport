import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { sendInvitation } from "./handler.ts";

export default {
  fetch: withSupabase({ auth: "secret" }, (req) => sendInvitation(req, {
    apiKey: Deno.env.get("RESEND_API_KEY"),
    from: Deno.env.get("RESEND_FROM_EMAIL"),
    adminUrl: Deno.env.get("ADMIN_URL"),
  })),
};
