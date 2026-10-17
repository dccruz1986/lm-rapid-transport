"use client";
import { Button, LanguageSwitch, useLanguage } from "@lm/ui";
import Image from "next/image";
import { usePathname } from "next/navigation";
export function PublicShell({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  const path = usePathname();
  const links = [
    ["/", "Inicio", "Home"],
    ["/services", "Servicios", "Services"],
    ["/about", "Nosotros", "About"],
    ["/contact", "Contacto", "Contact"],
  ] as const;
  return (
    <>
      <a className="skip-link" href="#main">
        {t("Saltar al contenido", "Skip to content")}
      </a>
      <header className="public-header">
        <div className="container header-inner">
          <a href="/" className="brand">
            <Image
              className="brand-logo"
              src="/logo.png"
              alt="López Moving and Delivery"
              width={96}
              height={100}
              priority
            />
            <span>
              Rapid Transport<small>Florida · {t("Mudanzas", "Moving services")}</small>
            </span>
          </a>
          <nav aria-label={t("Principal", "Main")} className="public-nav">
            {links.map(([href, es, en]) => (
              <a key={href} href={href} aria-current={path === href ? "page" : undefined}>
                {t(es, en)}
              </a>
            ))}
          </nav>
          <div className="row">
            <LanguageSwitch />
            <Button asChild size="sm">
              <a href="/request-quote">{t("Solicitar mudanza", "Request a move")}</a>
            </Button>
          </div>
        </div>
      </header>
      <main id="main">{children}</main>
      <footer className="public-footer">
        <div className="container footer-inner">
          <div>
            <strong>LM Rapid Transport</strong>
            <p>
              {t(
                "De Miami a tu próximo comienzo, dentro de Florida.",
                "From Miami to your next beginning, across Florida.",
              )}
            </p>
          </div>
          <div>
            <a href="/request-quote">{t("Planifiquemos tu mudanza", "Let's plan your move")}</a>
            <p className="small">
              {t("Lunes a sábado · Español / English", "Monday–Saturday · Español / English")}
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
