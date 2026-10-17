"use client";
import type { Locale } from "@lm/types";
import { createContext, type ReactNode, useContext, useState } from "react";

const Context = createContext({ locale: "es" as Locale, setLocale: (_locale: Locale) => {} });
export function LanguageProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: ReactNode;
}) {
  const [locale, update] = useState(initialLocale);
  function setLocale(value: Locale) {
    update(value);
    // biome-ignore lint/suspicious/noDocumentCookie: Preference cookie supports browsers without Cookie Store.
    document.cookie = `lm_locale=${value};path=/;max-age=31536000;SameSite=Lax`;
    document.documentElement.lang = value;
  }
  return <Context value={{ locale, setLocale }}>{children}</Context>;
}
export function useLanguage() {
  const context = useContext(Context);
  return { ...context, t: (es: string, en: string) => (context.locale === "es" ? es : en) };
}
export function LanguageSwitch() {
  const { locale, setLocale } = useLanguage();
  return (
    <fieldset className="language-switch" aria-label="Idioma / Language">
      {(["es", "en"] as const).map((value) => (
        <button type="button" aria-pressed={locale === value} key={value} onClick={() => setLocale(value)}>
          {value.toUpperCase()}
        </button>
      ))}
    </fieldset>
  );
}
