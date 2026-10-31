"use server";
import { appUrl, supabaseEnvironment } from "@lm/config/env";
import { privilegedClient } from "@lm/data/privileged";
import { requireStaff, serverClient } from "@lm/data/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const loginSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(128),
});
export async function login(_previous: { error: string }, data: FormData) {
  const parsed = loginSchema.safeParse(Object.fromEntries(data));
  if (!parsed.success) return { error: "INVALID_LOGIN" };
  const db = await serverClient();
  const { data: auth, error } = await db.auth.signInWithPassword(parsed.data);

  if (error || !auth.user) return { error: "INVALID_LOGIN" };
  const { data: profile } = await db.from("profiles").select("active").eq("id", auth.user.id).single();
  if (!profile?.active) {
    await db.auth.signOut();
    return { error: "INACTIVE" };
  }
  redirect("/dashboard");
}
export async function logout() {
  const db = await serverClient();
  await db.auth.signOut();
  redirect("/login");
}
export async function recover(_previous: { error: string; success: boolean }, data: FormData) {
  const parsed = z.email().safeParse(data.get("email"));
  if (!parsed.success) return { error: "INVALID_EMAIL", success: false };
  const db = await serverClient();
  await db.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${appUrl("admin")}/auth/set-password`,
  });
  return { error: "", success: true };
}
export async function setPassword(_previous: { error: string }, data: FormData) {
  const parsed = z.string().min(12).max(128).safeParse(data.get("password"));
  if (!parsed.success || data.get("password") !== data.get("confirm")) return { error: "PASSWORD_RULES" };
  const db = await serverClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return { error: "LINK_INVALID" };
  const { error } = await db.auth.updateUser({ password: parsed.data });
  if (error) return { error: "PASSWORD_RULES" };
  redirect("/dashboard");
}

export async function invite(_previous: { error: string; success: boolean }, data: FormData) {
  const { db } = await requireStaff("users.manage");
  const parsed = z
    .object({
      email: z.email().max(254),
      role: z.enum(["ADMIN", "MANAGER", "DISPATCHER"]),
    })
    .safeParse(Object.fromEntries(data));
  if (!parsed.success) return { error: "INVALID_INPUT", success: false };
  const { data: operation, error } = await db.rpc("begin_staff_email", {
    p_email: parsed.data.email,
    p_role: parsed.data.role,
  });
  if (error)
    return {
      error:
        ["INVITE_RATE_LIMITED", "USER_EXISTS", "FORBIDDEN", "INVALID_INPUT"].find((code) =>
          error.message.includes(code),
        ) ?? "INVITE_FAILED",
      success: false,
    };
  const attempt = z.object({ operation_id: z.uuid(), pending_id: z.uuid().nullable() }).safeParse(operation);
  if (!attempt.success) return { error: "INVITE_FAILED", success: false };
  try {
    const type = attempt.data.pending_id ? "recovery" : "invite";
    const { data: link, error: linkError } = await privilegedClient().auth.admin.generateLink({
      type,
      email: parsed.data.email.trim().toLowerCase(),
      options: { redirectTo: `${appUrl("admin")}/auth/set-password` },
    });
    if (linkError || !link.properties?.hashed_token) return { error: "INVITE_FAILED", success: false };
    // Use the existing SSR callback, not an implicit-flow URL with session fragments.
    const actionUrl = new URL("/auth/confirm", appUrl("admin"));
    actionUrl.searchParams.set("token_hash", link.properties.hashed_token);
    actionUrl.searchParams.set("type", type);
    const secret = process.env.SUPABASE_SECRET_KEY;
    console.log("SUPABASE_SECRET_KEY", secret);
    if (!secret) return { error: "MAIL_CONFIGURATION", success: false };
    console.log("URL function", new URL("/functions/v1/resend", supabaseEnvironment().url).toString())
    const result = await fetch(new URL("/functions/v1/resend", supabaseEnvironment().url), {
      method: "POST",
      headers: { apikey: secret, "Content-Type": "application/json" },
      body: JSON.stringify({
        to: parsed.data.email.trim().toLowerCase(),
        action_url: actionUrl.toString(),
        operation_id: attempt.data.operation_id,
      }),
      signal: AbortSignal.timeout(25000),
    });
    console.log("resend result", result.status, result.statusText);
    const receipt = await result.json();

    revalidatePath("/users");
    if (!result.ok || receipt.accepted !== true || typeof receipt.id !== "string") {
      return {
        error: ["MAIL_CONFIGURATION", "MAIL_RATE_LIMITED", "MAIL_API_KEY_INVALID", "MAIL_DOMAIN_UNVERIFIED", "MAIL_TEST_RECIPIENT_ONLY"].includes(receipt.error)
          ? receipt.error
          : "INVITE_FAILED",
        success: false,
      };
    }
    return { error: "", success: true };
  } catch {
    revalidatePath("/users");
    return { error: "INVITE_FAILED", success: false };
  }
}
export async function setActive(data: FormData) {
  const { db } = await requireStaff("users.manage");
  const parsed = z
    .object({ id: z.uuid(), active: z.enum(["true", "false"]) })
    .parse(Object.fromEntries(data));
  const { error } = await db.rpc("set_staff_active", {
    p_id: parsed.id,
    p_active: parsed.active === "true",
  });
  if (error) throw new Error(error.message.includes("LAST_ADMIN") ? "LAST_ADMIN" : "FORBIDDEN");
  revalidatePath("/users");
}
