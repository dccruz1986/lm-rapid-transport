"use client";
import { Button, LanguageSwitch, useLanguage } from "@lm/ui";
import { Inbox, LayoutDashboard, LogOut, Shield, SlidersHorizontal, Truck, Users } from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { logout } from "@/app/auth/actions";
export function AdminShell({
  children,
  permissions,
  email,
  role,
}: {
  children: React.ReactNode;
  permissions: string[];
  email: string;
  role: string;
}) {
  const { t } = useLanguage();
  const path = usePathname();
  const links = [
    { url: "/dashboard", es: "Resumen", en: "Overview", Icon: LayoutDashboard },
    { url: "/requests", es: "Solicitudes", en: "Requests", Icon: Inbox },
    { url: "/customers", es: "Clientes", en: "Customers", Icon: Users },
    { url: "/moves", es: "Mudanzas", en: "Moves", Icon: Truck },
    ...(permissions.includes("pricing.manage")
      ? [{ url: "/settings", es: "Tarifas", en: "Rates", Icon: SlidersHorizontal }]
      : []),
    ...(permissions.includes("users.manage")
      ? [{ url: "/users", es: "Personal", en: "Team", Icon: Shield }]
      : []),
  ];
  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <a className="brand" href="/dashboard">
          <Image
            className="brand-logo"
            src="/logo.png"
            alt="López Moving and Delivery"
            width={96}
            height={100}
            priority
          />
          <span>
            Rapid Transport<small>{t("Operaciones", "Operations")}</small>
          </span>
        </a>
        <nav aria-label={t("Navegación principal", "Main navigation")}>
          {links.map(({ url, es, en, Icon }) => (
            <a key={url} href={url} className={path.startsWith(url) ? "active" : ""}>
              <Icon size={18} />
              {t(es, en)}
            </a>
          ))}
        </nav>
        <div className="sidebar-bottom small" style={{ marginTop: "auto" }}>
          {t("Cada mudanza, un nuevo comienzo.", "Every move, a new beginning.")}
        </div>
      </aside>
      <main className="admin-main">
        <header className="admin-top">
          <div>
            <strong>{t("Panel de operaciones", "Operations dashboard")}</strong>
            <div className="small muted">
              {email} · {role}
            </div>
          </div>
          <div className="actions">
            <LanguageSwitch />
            <form action={logout}>
              <Button variant="ghost" size="sm" aria-label={t("Cerrar sesión", "Sign out")}>
                <LogOut size={17} />
              </Button>
            </form>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
