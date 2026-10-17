import { requireStaff } from "@lm/data/server";
import { CustomerList } from "@/components/customers";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { db } = await requireStaff();
  const page = Math.max(1, Math.min(100000, Number.parseInt(params.page ?? "1", 10) || 1));
  const q = (params.q ?? "").slice(0, 100).replace(/[^\p{L}\p{N} +@-]/gu, "");
  let query = db
    .from("customers")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * 20, page * 20 - 1);
  if (q)
    query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`);
  const { data, error, count } = await query;
  if (error) throw error;
  return <CustomerList rows={data} total={count ?? 0} page={page} q={q} />;
}
