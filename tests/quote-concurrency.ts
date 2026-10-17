// Run while the explicitly authorized disposable browser-test account exists.
const config = await Bun.file(".local/supabase.json").json();
const base = config.API_URL;
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname)) throw new Error("Local only");
const service = config.SERVICE_ROLE_KEY ?? config.SECRET_KEY;
async function api(path: string, token: string, method = "GET", body?: unknown) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      apikey: service,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const text = await response.text();
  return { ok: response.ok, data: text ? JSON.parse(text) : null };
}
const login = await api("/auth/v1/token?grant_type=password", service, "POST", {
  email: "ui-fixture@example.test",
  password: "Fixture-only-9pK3!mR7#",
});
if (!login.ok) throw new Error("Prepare the authorized local UI fixture first");
const token = login.data.access_token;
const addresses: string[] = [];
let request: string | undefined;
let assertions = 0;
function check(value: boolean, label: string) {
  if (!value) throw new Error(label);
  assertions++;
  console.log(`PASS ${label}`);
}
try {
  const customer = await api("/rest/v1/customers?select=id,first_name,last_name,phone&limit=1", service);
  if (!customer.ok || !customer.data[0]) throw new Error("Local seed required");
  for (const street of ["Concurrency test origin", "Concurrency test destination"]) {
    const address = await api("/rest/v1/addresses", service, "POST", {
      street,
      city: "Miami",
      postal_code: "33130",
    });
    if (!address.ok) throw new Error("Fixture address failed");
    addresses.push(address.data[0].id);
  }
  const c = customer.data[0];
  const created = await api("/rest/v1/moving_requests", service, "POST", {
    customer_id: c.id,
    first_name: c.first_name,
    last_name: c.last_name,
    phone: c.phone,
    origin_id: addresses[0],
    destination_id: addresses[1],
    property_type: "OFFICE",
    origin_floor: 0,
    destination_floor: 0,
    origin_elevator: false,
    destination_elevator: false,
  });
  if (!created.ok) throw new Error("Fixture request failed");
  request = created.data[0].id;
  const payload = {
    p_request: request,
    p_version: 0,
    p_mode: "LOCAL",
    p_workers: 2,
    p_rate: 11900,
    p_quantity: 3,
  };
  check((await api("/rest/v1/rpc/save_quote", token, "POST", payload)).ok, "Create quote fixture");
  const races = await Promise.all(
    [12000, 13000].map((p_rate) =>
      api("/rest/v1/rpc/save_quote", token, "POST", { ...payload, p_version: 1, p_rate }),
    ),
  );
  check(races.filter((r) => r.ok).length === 1, "Exactly one concurrent quote update succeeds");
  check(
    races.some((r) => !r.ok && r.data.message === "CONFLICT"),
    "Losing edit gets version conflict",
  );
  check(
    (await api("/rest/v1/rpc/approve_quote", token, "POST", { p_request: request, p_version: 2 })).ok,
    "Approve winner",
  );
  check(
    (
      await api("/rest/v1/rpc/communicate_quote", token, "POST", {
        p_request: request,
        p_version: 3,
        p_medium: "PHONE",
        p_at: new Date().toISOString(),
        p_response: "Fictional concurrency acceptance",
        p_confirm: true,
      })
    ).ok,
    "Confirm winner",
  );
  const day = new Date(Date.now() + 8 * 86400000);
  while (day.getUTCDay() === 0) day.setUTCDate(day.getUTCDate() + 1);
  day.setUTCHours(16, 0, 0, 0);
  const schedule = {
    p_request: request,
    p_version: 0,
    p_at: day.toISOString(),
    p_notes: "Concurrency fixture",
    p_duration: 180,
  };
  const conversions = await Promise.all([
    api("/rest/v1/rpc/schedule_move", token, "POST", schedule),
    api("/rest/v1/rpc/schedule_move", token, "POST", schedule),
  ]);
  check(
    conversions.every((r) => r.ok),
    "Both concurrent conversion retries succeed",
  );
  check(conversions[0]?.data === conversions[1]?.data, "Concurrent conversion returns same Move");
  check(
    (await api(`/rest/v1/moves?request_id=eq.${request}`, token)).data.length === 1,
    "Only one persisted Move",
  );
  console.log(`${assertions} concurrency assertions passed.`);
} finally {
  if (request) {
    const quotes = await api(`/rest/v1/quotes?request_id=eq.${request}&select=id`, service);
    for (const q of quotes.data ?? [])
      await api(`/rest/v1/quote_communications?quote_id=eq.${q.id}`, service, "DELETE");
    for (const table of ["pricing_change_history", "moves", "quotes"])
      await api(`/rest/v1/${table}?request_id=eq.${request}`, service, "DELETE");
    await api(`/rest/v1/moving_requests?id=eq.${request}`, service, "DELETE");
  }
  for (const id of addresses) await api(`/rest/v1/addresses?id=eq.${id}`, service, "DELETE");
}

export {};
