"use server";
import { appUrl } from "@lm/config/env";
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
  console.log("login", { auth, error });
  if (error || !auth.user) return { error: "INVALID_LOGIN" };
  const { data: profile } = await db
    .from("profiles")
    .select("active")
    .eq("id", auth.user.id)
    .single();
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
export async function recover(
  _previous: { error: string; success: boolean },
  data: FormData,
) {
  const parsed = z.email().safeParse(data.get("email"));
  if (!parsed.success) return { error: "INVALID_EMAIL", success: false };
  const db = await serverClient();
  await db.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${appUrl("admin")}/auth/set-password`,
  });
  return { error: "", success: true };
}
export async function setPassword(
  _previous: { error: string },
  data: FormData,
) {
  const parsed = z.string().min(12).max(128).safeParse(data.get("password"));
  if (!parsed.success || data.get("password") !== data.get("confirm"))
    return { error: "PASSWORD_RULES" };
  const db = await serverClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return { error: "LINK_INVALID" };
  const { error } = await db.auth.updateUser({ password: parsed.data });
  if (error) return { error: "PASSWORD_RULES" };
  redirect("/dashboard");
}
export async function invite(
  _previous: { error: string; success: boolean },
  data: FormData,
) {
  const { db } = await requireStaff("users.manage");
  const parsed = z
    .object({
      email: z.email().max(254),
      role: z.enum(["ADMIN", "MANAGER", "DISPATCHER"]),
    })
    .safeParse(Object.fromEntries(data));
  if (!parsed.success) return { error: "INVALID_INPUT", success: false };
  const { error } = await db.rpc("reserve_staff_invite", {
    p_email: parsed.data.email,
    p_role: parsed.data.role,
  });
  if (error) {
    if (!error.message.includes("USER_EXISTS"))
      return { error: "FORBIDDEN", success: false };
    const { data: pendingId, error: pendingError } = await db.rpc(
      "pending_staff_invitation",
      {
        p_email: parsed.data.email,
        p_role: parsed.data.role,
      },
    );
    if (pendingError || !pendingId)
      return { error: "USER_EXISTS", success: false };
    const { error: recoveryError } = await db.auth.resetPasswordForEmail(
      parsed.data.email,
      {
        redirectTo: `${appUrl("admin")}/auth/set-password`,
      },
    );
    return {
      error: recoveryError ? "INVITE_FAILED" : "",
      success: !recoveryError,
    };
  }
  const { error: inviteError } =
    await privilegedClient().auth.admin.inviteUserByEmail(parsed.data.email, {
      redirectTo: `${appUrl("admin")}/auth/set-password`,
    });
  if (inviteError) return { error: "INVITE_FAILED", success: false };
  revalidatePath("/users");
  return { error: "", success: true };
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
  if (error)
    throw new Error(
      error.message.includes("LAST_ADMIN") ? "LAST_ADMIN" : "FORBIDDEN",
    );
  revalidatePath("/users");
}
