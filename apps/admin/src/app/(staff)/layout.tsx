import { requireStaff } from "@lm/data/server";
import { AdminShell } from "@/components/admin-shell";
export const dynamic = "force-dynamic";
export default async function Layout({ children }: { children: React.ReactNode }) {
  const { profile, permissions } = await requireStaff();
  return (
    <AdminShell email={profile.email} role={profile.role} permissions={permissions}>
      {children}
    </AdminShell>
  );
}
