import { requireStaff } from "@lm/data/server";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const { db } = await requireStaff();
  const { data, error } = await db.from("moves").select("request_id").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) notFound();
  redirect(`/requests/${data.request_id}`);
}
