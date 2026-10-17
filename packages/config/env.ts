import { z } from "zod";

const publicSchema = z.object({
  url: z.url(),
  key: z.string().min(1),
});
export function supabaseEnvironment() {
  return publicSchema.parse({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
}
export function appUrl(app: "web" | "admin") {
  const value = app === "web" ? process.env.WEB_URL : process.env.ADMIN_URL;
  return z.url().parse(value);
}
