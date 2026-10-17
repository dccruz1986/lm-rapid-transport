import { serverClient } from "@lm/data/server";
import { type NextRequest, NextResponse } from "next/server";
export async function GET(request: NextRequest) {
  const token_hash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");
  const code = request.nextUrl.searchParams.get("code");
  const db = await serverClient();
  if (code) {
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL("/auth/set-password", request.url));
  }
  if (token_hash && (type === "invite" || type === "recovery")) {
    const { error } = await db.auth.verifyOtp({ token_hash, type });
    if (!error) return NextResponse.redirect(new URL("/auth/set-password", request.url));
  }
  return NextResponse.redirect(new URL("/login?error=LINK_INVALID", request.url));
}
