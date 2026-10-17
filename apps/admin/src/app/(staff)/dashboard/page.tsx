import { requireStaff } from "@lm/data/server";
import { z } from "zod";
import { Dashboard } from "@/components/dashboard";
export default async function Page() {
  const { db } = await requireStaff();
  const [stats, recent] = await Promise.all([
    db.rpc("dashboard_metrics"),
    db
      .from("moving_requests")
      .select(
        "id,request_number,first_name,last_name,phone,moving_date,status,created_at,origin:addresses!moving_requests_origin_id_fkey(street,city),destination:addresses!moving_requests_destination_id_fkey(street,city)",
      )
      .order("created_at", { ascending: false })
      .limit(5),
  ]);
  if (stats.error) throw stats.error;
  if (recent.error) throw recent.error;
  const metrics = z
    .object({
      new_requests: z.number(),
      quotes_pending: z.number(),
      confirmed_moves: z.number(),
      moves_this_week: z.number(),
      completed_moves: z.number(),
    })
    .parse(stats.data);
  return <Dashboard metrics={metrics} requests={recent.data} />;
}
