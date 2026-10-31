import "@lm/ui/styles.css";
import { LanguageProvider } from "@lm/ui";
import type { Metadata } from "next";
import { cookies } from "next/headers";
export const metadata: Metadata = {
  title: "LM Rapid Transport",
  description: "Mudanzas residenciales y comerciales en Florida.",
};
export default async function Layout({ children }: { children: React.ReactNode }) {
  const locale = (await cookies()).get("lm_locale")?.value === "en" ? "en" : "es";
  return (
    <html lang={locale}>
      <body className="public-app">
        <LanguageProvider initialLocale={locale}>{children}</LanguageProvider>
      </body>
    </html>
  );
}
