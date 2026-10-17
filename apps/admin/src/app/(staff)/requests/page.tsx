import { requireStaff } from "@lm/data/server";
import { requestStatuses } from "@lm/types";
import { z } from "zod";
import { RequestList } from "@/components/request-list";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { db } = await requireStaff();
  const page = Math.max(1, Math.min(100000, Number.parseInt(params.page ?? "1", 10) || 1));
  const q = (params.q ?? "").slice(0, 100).replace(/[^\p{L}\p{N} +@-]/gu, "");
  const status = requestStatuses.find((s) => s === params.status) ?? "";
  const from = z.iso.date().safeParse(params.from).success ? (params.from ?? "") : "";
  const to = z.iso.date().safeParse(params.to).success ? (params.to ?? "") : "";
  let query = db
    .from("moving_requests")
    .select(
      "id,request_number,first_name,last_name,phone,moving_date,status,created_at,origin:addresses!moving_requests_origin_id_fkey(street,city),destination:addresses!moving_requests_destination_id_fkey(street,city)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range((page - 1) * 20, page * 20 - 1);
  if (q)
    query = query.or(
      `request_number.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%,phone.ilike.%${q}%`,
    );
  if (status) query = query.eq("status", status);
  if (from) query = query.gte("moving_date", from);
  if (to) query = query.lte("moving_date", to);
  const { data, error, count } = await query;
  if (error) throw error;
  return <RequestList rows={data} total={count ?? 0} page={page} filters={{ q, status, from, to }} />;
}
