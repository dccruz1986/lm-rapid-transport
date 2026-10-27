export type MailConfig = { apiKey?: string; from?: string; adminUrl?: string };
const reply = (status: number, error: string) => Response.json({ error }, { status });
const escape = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

// Authentication is enforced by withSupabase before entering this handler.
export async function sendInvitation(req: Request, config: MailConfig, transport: typeof fetch = fetch) {
  if (req.method !== "POST") return reply(405, "METHOD_NOT_ALLOWED");
  if (!config.apiKey || !config.from || !config.adminUrl) return reply(503, "MAIL_CONFIGURATION");
  let expected: URL;
  try {
    expected = new URL("/auth/confirm", config.adminUrl);
    if (expected.protocol !== "https:" && !(expected.protocol === "http:" && ["localhost", "127.0.0.1"].includes(expected.hostname))) throw new Error();
  } catch { return reply(503, "MAIL_CONFIGURATION"); }
  let body: { to: string; action_url: string; operation_id: string };
  try {
    if (!req.headers.get("content-type")?.includes("application/json")) throw new Error();
    // Enforce a byte limit while reading, not only after buffering.
    const reader = req.body?.getReader();
    if (!reader) throw new Error();
    const chunks: Uint8Array[] = [];
    let length = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > 8192) { await reader.cancel(); return reply(413, "INVALID_INPUT"); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    body = JSON.parse(new TextDecoder().decode(bytes));
    if (!body || typeof body.to !== "string" || body.to.length > 254 ||
      !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(body.to) ||
      typeof body.operation_id !== "string" || !/^[0-9a-f-]{36}$/i.test(body.operation_id) ||
      typeof body.action_url !== "string" || body.action_url.length > 4096) throw new Error();
    const url = new URL(body.action_url);
    if (url.origin !== expected.origin || url.pathname !== expected.pathname || url.username || url.password || url.hash ||
      !["invite", "recovery"].includes(url.searchParams.get("type") ?? "") ||
      !/^[a-zA-Z0-9_-]{20,256}$/.test(url.searchParams.get("token_hash") ?? "") ||
      [...url.searchParams.keys()].some((key) => !["type", "token_hash"].includes(key)) ||
      url.searchParams.getAll("type").length !== 1 || url.searchParams.getAll("token_hash").length !== 1) throw new Error();
  } catch { return reply(400, "INVALID_INPUT"); }
  const payload = JSON.stringify({
    from: config.from, to: [body.to], subject: "Confirma tu acceso / Confirm your access — LM Rapid Transport",
    html: '<h1>LM Rapid Transport</h1><p>Confirma tu invitación y establece tu contraseña.</p><p>Confirm your invitation and set your password.</p><p><a href="' + escape(body.action_url) + '">Confirmar acceso / Confirm access</a></p><p>Si no esperabas esta invitación, ignora este correo.</p>',
    text: "Confirma tu invitación y establece tu contraseña / Confirm your invitation and set your password: " + body.action_url,
  });
  // Retrying a transport failure uses the exact same payload and idempotency key.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await transport("https://api.resend.com/emails", {
        method: "POST", signal: AbortSignal.timeout(8000),
        headers: { Authorization: "Bearer " + config.apiKey, "Content-Type": "application/json", "Idempotency-Key": "staff-invite/" + body.operation_id },
        body: payload,
      });
      if (res.status === 429) return reply(429, "MAIL_RATE_LIMITED");
      if (!res.ok) {
        if (res.status >= 500 && attempt === 0) continue;
        const failure = await res.json().catch(() => ({}));
        const message = typeof failure?.message === "string" ? failure.message.toLowerCase() : "";
        if (res.status === 401) return reply(503, "MAIL_API_KEY_INVALID");
        if (message.includes("testing emails") || message.includes("own email address"))
          return reply(503, "MAIL_TEST_RECIPIENT_ONLY");
        if (message.includes("domain") && (message.includes("verified") || message.includes("verify")))
          return reply(503, "MAIL_DOMAIN_UNVERIFIED");
        return reply(502, "MAIL_REJECTED");
      }
      const data = await res.json();
      if (typeof data.id !== "string" || !data.id) return reply(502, "MAIL_INVALID_RESPONSE");
      return Response.json({ accepted: true, id: data.id });
    } catch {
      if (attempt === 1) return reply(504, "MAIL_UNAVAILABLE");
    }
  }
  return reply(502, "MAIL_UNAVAILABLE");
}
