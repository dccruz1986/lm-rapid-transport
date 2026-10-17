import { serverClient } from "@lm/data/server";
import { redirect } from "next/navigation";
import { PasswordForm } from "@/components/auth-form";
export default async function Page({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code } = await searchParams;
  if (code) redirect(`/auth/confirm?code=${encodeURIComponent(code)}`);
  const db = await serverClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect("/login?error=LINK_INVALID");
  return <PasswordForm />;
}
