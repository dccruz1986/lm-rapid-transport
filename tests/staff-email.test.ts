import { expect, test } from "bun:test";
import { sendInvitation } from "../supabase/functions/resend/handler";

const config = { apiKey: "test-only", from: "team@example.test", adminUrl: "https://admin.example.test" };
const payload = {
  to: "one@example.test",
  action_url: `${config.adminUrl}/auth/confirm?type=invite&token_hash=${"a".repeat(64)}`,
  operation_id: "97000000-0000-4000-8000-000000000001",
};
const request = (body: unknown = payload) =>
  new Request("http://local/resend", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
function fake(fn: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>): typeof fetch {
  return Object.assign(fn, { preconnect: fetch.preconnect });
}
test("sends each recipient its own link without hardcoded recipients", async () => {
  const sent: { to: string[]; html: string }[] = [];
  const transport = fake(async (_, init) => {
    sent.push(JSON.parse(String(init?.body)));
    return Response.json({ id: crypto.randomUUID() });
  });
  for (const to of ["one@example.test", "two@example.test"]) {
    expect((await sendInvitation(request({ ...payload, to }), config, transport)).status).toBe(200);
  }
  expect(sent.map((p) => p.to)).toEqual([["one@example.test"], ["two@example.test"]]);
  expect(sent[0]?.html).toContain("&amp;token_hash=");
});
test("invalid inputs never reach provider", async () => {
  let calls = 0;
  const transport = fake(async () => {
    calls++;
    return Response.json({ id: "id" });
  });
  for (const body of [
    {},
    null,
    { ...payload, to: "bad" },
    { ...payload, action_url: "https://evil.test/auth/confirm" },
    { ...payload, action_url: `${payload.action_url}&redirect_to=https://evil.test` },
  ]) {
    expect((await sendInvitation(request(body), config, transport)).status).toBe(400);
  }
  expect((await sendInvitation(request(), { ...config, apiKey: undefined }, transport)).status).toBe(503);
  expect((await sendInvitation(new Request("http://local"), config, transport)).status).toBe(405);
  expect(calls).toBe(0);
});
test("transport retry retains payload and idempotency key", async () => {
  const calls: RequestInit[] = [];
  const transport = fake(async (_, init) => {
    if (!init) throw new Error("Missing request options");
    calls.push(init);
    if (calls.length === 1) throw new Error("lost response");
    return Response.json({ id: "accepted" });
  });
  expect((await sendInvitation(request(), config, transport)).status).toBe(200);
  expect(calls[0]?.body).toBe(calls[1]?.body);
  expect(calls[0]?.headers).toEqual(calls[1]?.headers);
});
test("provider errors do not report acceptance", async () => {
  for (const status of [400, 429, 500]) {
    const result = await sendInvitation(
      request(),
      config,
      fake(async () => Response.json({ error: "private provider detail" }, { status })),
    );
    expect(result.ok).toBe(false);
    expect(await result.text()).not.toContain("private provider detail");
  }
  expect(
    (
      await sendInvitation(
        request(),
        config,
        fake(async () => Response.json({})),
      )
    ).status,
  ).toBe(502);
  expect(
    (
      await sendInvitation(
        request(),
        config,
        fake(async () => {
          throw new Error("timeout");
        }),
      )
    ).status,
  ).toBe(504);
});
test("rejects oversized body", async () => {
  expect((await sendInvitation(request({ ...payload, extra: "x".repeat(9000) }), config)).status).toBe(413);
});

test("provider configuration errors surface safe actionable codes", async () => {
  const cases = [
    [403, "The gmail.com domain is not verified", "MAIL_DOMAIN_UNVERIFIED"],
    [403, "You can only send testing emails to your own email address. Verify a domain.", "MAIL_TEST_RECIPIENT_ONLY"],
    [401, "API key is invalid", "MAIL_API_KEY_INVALID"],
  ] as const;
  for (const [status, message, code] of cases) {
    const result = await sendInvitation(request(), config,
      fake(async () => Response.json({ message }, { status })));
    expect(result.status).toBe(503);
    expect(await result.json()).toEqual({ error: code });
  }
  const result = await sendInvitation(request(), config,
    fake(async () => Response.json(null, { status: 403 })));
  expect(result.status).toBe(502);
});
