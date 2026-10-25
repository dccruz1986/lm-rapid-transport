import { requireStaff } from "@lm/data/server";
import { notFound } from "next/navigation";
import { z } from "zod";
import { CustomerDetail } from "@/components/customers";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const { db, permissions } = await requireStaff();
  const [customer, requests, moves] = await Promise.all([
    db.from("customers").select("*").eq("id", id).maybeSingle(),
    db
      .from("moving_requests")
      .select(
        "id,request_number,full_name,first_name,last_name,phone,moving_date,status,created_at,origin:addresses!moving_requests_origin_id_fkey(street,city,input,postal_code),destination:addresses!moving_requests_destination_id_fkey(street,city,input,postal_code)",
      )
      .eq("customer_id", id)
      .order("created_at", { ascending: false }),
    db.from("moves").select("*").eq("customer_id", id).order("scheduled_at", { ascending: false }),
  ]);
  for (const value of [customer, requests, moves]) if (value.error) throw value.error;
  if (!customer.data) notFound();
  return (
    <CustomerDetail
      customer={customer.data}
      requests={requests.data ?? []}
      moves={moves.data ?? []}
      canEdit={permissions.includes("requests.edit")}
    />
  );
}
