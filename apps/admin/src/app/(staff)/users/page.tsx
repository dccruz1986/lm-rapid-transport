import { requireStaff } from "@lm/data/server";
import { UsersPanel } from "@/components/users-panel";
export default async function Page() {
  const { db, permissions } = await requireStaff("users.manage");
  const { data, error } = await db.from("profiles").select("*").order("created_at");
  if (error) throw error;
  return <UsersPanel users={data} canAdmin={permissions.includes("users.admin")} />;
}
