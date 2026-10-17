import { requireStaff } from "@lm/data/server";
import { notFound } from "next/navigation";
import { z } from "zod";
import { RequestDetail } from "@/components/request-detail";
import { Workflow } from "@/components/workflow";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const { db, permissions } = await requireStaff();
  const [record, notes, files, move, quote, settings, history, actors] = await Promise.all([
    db
      .from("moving_requests")
      .select(
        "*,origin:addresses!moving_requests_origin_id_fkey(*),destination:addresses!moving_requests_destination_id_fkey(*)",
      )
      .eq("id", id)
      .maybeSingle(),
    db.from("notes").select("*").eq("request_id", id).order("created_at"),
    db.from("attachments").select("*").eq("request_id", id),
    db.from("moves").select("*").eq("request_id", id).maybeSingle(),
    db.from("quotes").select("*").eq("request_id", id).maybeSingle(),
    db.from("pricing_settings").select("*").single(),
    db
      .from("pricing_change_history")
      .select("*")
      .eq("request_id", id)
      .order("created_at", { ascending: false }),
    db.from("profiles").select("id,full_name,email"),
  ]);
  for (const response of [record, notes, files, move, quote, settings, history, actors])
    if (response.error) throw response.error;
  if (!record.data) notFound();
  if (!settings.data) throw new Error("PRICING_UNAVAILABLE");
  const communications = quote.data
    ? await db
        .from("quote_communications")
        .select("*")
        .eq("quote_id", quote.data.id)
        .order("communicated_at", { ascending: false })
    : { data: [], error: null };
  if (communications.error) throw communications.error;
  const photos: { id: string; name: string; url: string }[] = [];
  if (files.data?.length) {
    const signed = await db.storage.from("request-photos").createSignedUrls(
      files.data.map((file) => file.object_path),
      300,
    );
    if (signed.error) throw signed.error;
    for (const file of files.data) {
      const item = signed.data.find((item) => item.path === file.object_path);
      if (!item?.signedUrl || item.error) throw new Error("PHOTO_UNAVAILABLE");
      photos.push({ id: file.id, name: file.file_name, url: item.signedUrl });
    }
  }
  return (
    <RequestDetail
      request={record.data}
      notes={notes.data ?? []}
      photos={photos}
      permissions={permissions}
      moveId={move.data?.id ?? null}
    >
      <Workflow
        request={record.data}
        quote={quote.data}
        move={move.data}
        settings={settings.data}
        history={history.data ?? []}
        communications={communications.data ?? []}
        permissions={permissions}
        now={new Date().toISOString()}
        actors={Object.fromEntries((actors.data ?? []).map((a) => [a.id, a.full_name || a.email]))}
      />
    </RequestDetail>
  );
}
