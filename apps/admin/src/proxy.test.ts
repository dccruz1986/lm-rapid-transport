import { expect, test } from "bun:test";
import { NextRequest } from "next/server";
import { proxy } from "./proxy";

test("public authentication forms do not depend on Supabase or stale session cookies", async () => {
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  // A session lookup would fail URL validation before making a network request.
  process.env.NEXT_PUBLIC_SUPABASE_URL = "invalid-url";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-key";
  try {
    for (const path of ["/login", "/auth/forgot"]) {
      const response = await proxy(
        new NextRequest(`http://localhost:3001${path}`, {
          headers: { cookie: "sb-local-auth-token=stale" },
        }),
      );
      expect(response.headers.get("x-middleware-next")).toBe("1");
      expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    }
    // The exemption must not apply to protected pages.
    await expect(proxy(new NextRequest("http://localhost:3001/dashboard"))).rejects.toThrow();
  } finally {
    if (originalUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    if (originalKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    else process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = originalKey;
  }
});
