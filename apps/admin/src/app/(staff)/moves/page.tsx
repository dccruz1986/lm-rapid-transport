import { requireStaff } from "@lm/data/server";
import { moveStatuses } from "@lm/types";
import { MoveList } from "@/components/move-list";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { db } = await requireStaff();
  const page = Math.max(1, Math.min(100000, Number.parseInt(params.page ?? "1", 10) || 1));
  const status = moveStatuses.find((s) => s === params.status) ?? "";
  let query = db
    .from("moves")
    .select(
      "id,status,scheduled_at,request:moving_requests!moves_request_id_fkey(request_number,first_name,last_name,phone),origin:addresses!moves_origin_id_fkey(city),destination:addresses!moves_destination_id_fkey(city)",
      { count: "exact" },
    )
    .order("scheduled_at", { ascending: false })
    .range((page - 1) * 20, page * 20 - 1);
  if (status) query = query.eq("status", status);
  const { data, error, count } = await query;
  if (error) throw error;
  return <MoveList rows={data} total={count ?? 0} page={page} status={status} />;
}
