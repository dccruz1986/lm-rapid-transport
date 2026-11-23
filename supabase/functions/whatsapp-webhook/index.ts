import { createClient } from "npm:@supabase/supabase-js@2";

const encoder = new TextEncoder();

async function validSignature(body: Uint8Array, received: string, secret: string) {
  if (!/^sha256=[a-f0-9]{64}$/i.test(received)) return false;
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, body));
  const expected = Array.from(signature, (byte) => byte.toString(16).padStart(2, "0")).join("");
  const actual = received.slice(7).toLowerCase();
  let difference = 0;
  for (let i = 0; i < expected.length; i++) difference |= expected.charCodeAt(i) ^ actual.charCodeAt(i);
  return difference === 0;
}

Deno.serve(async (request) => {
  const verifyToken = Deno.env.get("WHATSAPP_VERIFY_TOKEN");
  const appSecret = Deno.env.get("WHATSAPP_APP_SECRET");
  if (!verifyToken || !appSecret) return new Response("Webhook unavailable", { status: 503 });

  if (request.method === "GET") {
    const params = new URL(request.url).searchParams;
    if (params.get("hub.mode") === "subscribe" && params.get("hub.verify_token") === verifyToken && params.has("hub.challenge")) {
      return new Response(params.get("hub.challenge"), { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const drainSecret = Deno.env.get("WHATSAPP_DRAIN_SECRET");
  const draining = Boolean(drainSecret && request.headers.get("X-WhatsApp-Drain-Secret") === drainSecret);
  const raw = new Uint8Array(await request.arrayBuffer());
  if (!draining && !await validSignature(raw, request.headers.get("X-Hub-Signature-256") ?? "", appSecret)) {
    return new Response("Forbidden", { status: 403 });
  }

  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
  const accessToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
  const graphVersion = Deno.env.get("WHATSAPP_GRAPH_API_VERSION") ?? "v23.0";
  if (!url || !key || !phoneNumberId || !accessToken) return new Response("Webhook unavailable", { status: 503 });
  const db = createClient(url, key, { auth: { persistSession: false } });

  let payload: Record<string, unknown>;
  try {
    payload = draining ? { object: "whatsapp_business_account", entry: [] } : JSON.parse(new TextDecoder().decode(raw));
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }
  if (payload.object !== "whatsapp_business_account") return new Response("Ignored", { status: 200 });

  try {
    for (const entry of Array.isArray(payload.entry) ? payload.entry : []) {
      for (const change of Array.isArray(entry.changes) ? entry.changes : []) {
        const value = change.value;
        if (value?.metadata?.phone_number_id !== phoneNumberId) continue;
        for (const message of Array.isArray(value.messages) ? value.messages : []) {
          if (typeof message.id !== "string" || typeof message.from !== "string") continue;
          const input = message.type === "text" ? message.text?.body : "";
          const { error } = await db.rpc("whatsapp_receive", {
            p_number_id: phoneNumberId,
            p_sender: message.from,
            p_message_id: message.id,
            p_text: typeof input === "string" ? input : "",
          });
          if (error) throw error;
        }
      }
    }
  } catch (error) {
    console.error("WhatsApp intake failed", error);
    return new Response("Retry", { status: 503 });
  }

  const { data: outgoing, error: claimError } = await db.rpc("whatsapp_claim_outbox", {
    p_number_id: phoneNumberId,
  });
  if (claimError) {
    console.error("WhatsApp outbox claim failed", claimError);
    return new Response("Retry", { status: 503 });
  }
  for (const item of outgoing ?? []) {
    let sent = false;
    try {
      const response = await fetch(`https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ messaging_product: "whatsapp", to: item.recipient, type: "text", text: { body: item.body } }),
      });
      sent = response.ok;
      if (!sent) console.error("WhatsApp send failed", response.status);
    } catch (error) {
      console.error("WhatsApp send failed", error);
    }
    const { error } = await db.rpc("whatsapp_finish_outbox", { p_id: item.id, p_sent: sent });
    if (error) console.error("WhatsApp outbox update failed", error);
  }
  return new Response("OK", { status: 200 });
});
