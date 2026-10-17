"use client";
import { Button, LanguageSwitch, useLanguage } from "@lm/ui";
import Image from "next/image";
import { useActionState } from "react";
import { login, recover, setPassword } from "@/app/auth/actions";

const messages: Record<string, [string, string]> = {
  INVALID_LOGIN: ["Correo o contraseña incorrectos.", "Incorrect email or password."],
  INACTIVE: [
    "Tu cuenta no tiene acceso activo. Contacta al administrador.",
    "Your account is inactive. Contact an administrator.",
  ],
  INVALID_EMAIL: ["Introduce un correo válido.", "Enter a valid email."],
  PASSWORD_RULES: [
    "Usa al menos 12 caracteres y repite la misma contraseña.",
    "Use at least 12 characters and confirm the same password.",
  ],
  LINK_INVALID: [
    "Este enlace no es válido o venció. Solicita uno nuevo.",
    "This link is invalid or expired. Request another one.",
  ],
};
function ErrorMessage({ code }: { code: string }) {
  const { t } = useLanguage();
  if (!code) return null;
  const message = messages[code] ?? messages.INVALID_LOGIN;
  return (
    <p className="notice error" role="alert">
      {message ? t(...message) : code}
    </p>
  );
}
export function AuthFrame({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  return (
    <main className="auth-page">
      <aside className="auth-aside">
        <a className="brand" href="/">
          <Image
            className="brand-logo"
            src="/logo.png"
            alt="López Moving and Delivery"
            width={96}
            height={100}
            priority
          />
          <span>
            Rapid Transport<small>{t("Equipo de operaciones", "Operations team")}</small>
          </span>
        </a>
        <div>
          <span className="eyebrow" style={{ color: "var(--foreground)" }}>
            {t("Cada detalle cuenta", "Every detail matters")}
          </span>
          <h1>
            {t(
              "El próximo comienzo de alguien está en tus manos.",
              "Someone's next beginning is in your hands.",
            )}
          </h1>
          <p>
            {t(
              "Un espacio para organizar cada mudanza, de principio a fin.",
              "A place to organize every move, from start to finish.",
            )}
          </p>
        </div>
        <span className="small">LM Rapid Transport · Florida</span>
      </aside>
      <section className="auth-form">
        <div>
          <LanguageSwitch />
          {children}
        </div>
      </section>
    </main>
  );
}
export function LoginForm({ initialError = "" }: { initialError?: string }) {
  const { t } = useLanguage();
  const [state, action, pending] = useActionState(login, { error: "" });
  return (
    <AuthFrame>
      <h2 style={{ marginTop: 32 }}>{t("Bienvenido de nuevo", "Welcome back")}</h2>
      <p className="muted">{t("Accede al panel de operaciones.", "Sign in to the operations dashboard.")}</p>
      <form action={action} className="stack">
        <label className="field">
          {t("Correo electrónico", "Email")}
          <input name="email" type="email" autoComplete="username" required />
        </label>
        <label className="field">
          {t("Contraseña", "Password")}
          <input name="password" type="password" autoComplete="current-password" required />
        </label>
        <ErrorMessage code={state.error || initialError} />
        <Button disabled={pending}>
          {pending ? t("Accediendo…", "Signing in…") : t("Iniciar sesión", "Sign in")}
        </Button>
        <a href="/auth/forgot" className="small muted">
          {t("¿Olvidaste tu contraseña?", "Forgot your password?")}
        </a>
      </form>
      <p className="small muted" style={{ marginTop: 28 }}>
        {t("Acceso exclusivo para personal invitado.", "Access is limited to invited staff.")}
      </p>
    </AuthFrame>
  );
}
export function RecoveryForm() {
  const { t } = useLanguage();
  const [state, action, pending] = useActionState(recover, { error: "", success: false });
  return (
    <AuthFrame>
      <h2 style={{ marginTop: 32 }}>{t("Recuperar acceso", "Recover access")}</h2>
      <form action={action} className="stack">
        <label className="field">
          {t("Correo electrónico", "Email")}
          <input name="email" type="email" required autoComplete="email" />
        </label>
        <ErrorMessage code={state.error} />
        {state.success && (
          <p className="notice" role="status">
            {t(
              "Si existe una cuenta con ese correo, recibirás instrucciones.",
              "If an account exists with that email, you will receive instructions.",
            )}
          </p>
        )}
        <Button disabled={pending}>{t("Solicitar enlace", "Request link")}</Button>
        <a href="/login">{t("Volver al acceso", "Back to sign in")}</a>
      </form>
    </AuthFrame>
  );
}
export function PasswordForm() {
  const { t } = useLanguage();
  const [state, action, pending] = useActionState(setPassword, { error: "" });
  return (
    <AuthFrame>
      <h2 style={{ marginTop: 32 }}>{t("Establece tu contraseña", "Set your password")}</h2>
      <form action={action} className="stack">
        <label className="field">
          {t("Nueva contraseña (mínimo 12 caracteres)", "New password (at least 12 characters)")}
          <input
            name="password"
            type="password"
            minLength={12}
            maxLength={128}
            autoComplete="new-password"
            required
          />
        </label>
        <label className="field">
          {t("Confirmar contraseña", "Confirm password")}
          <input name="confirm" type="password" autoComplete="new-password" required />
        </label>
        <ErrorMessage code={state.error} />
        <Button disabled={pending}>{t("Guardar contraseña", "Save password")}</Button>
      </form>
    </AuthFrame>
  );
}
