"use client";
import { Button, useLanguage } from "@lm/ui";
import { useActionState } from "react";
import { invite, setActive } from "@/app/auth/actions";
export function UsersPanel({
  users,
  canAdmin,
}: {
  users: { id: string; email: string; role: string; active: boolean }[];
  canAdmin: boolean;
}) {
  const { t } = useLanguage();
  const [state, action, pending] = useActionState(invite, { error: "", success: false });
  return (
    <div className="stack">
      <div>
        <span className="eyebrow">{t("Accesos", "Access")}</span>
        <h1>{t("Nuestro equipo", "Our team")}</h1>
      </div>
      <section className="card">
        <h2>{t("Invitar personal", "Invite a teammate")}</h2>
        <form action={action} className="form-grid">
          <label className="field">
            {t("Correo electrónico", "Email")}
            <input name="email" type="email" required />
          </label>
          <label className="field">
            {t("Rol", "Role")}
            <select name="role">
              <option value="DISPATCHER">DISPATCHER</option>
              <option value="MANAGER">MANAGER</option>
              {canAdmin && <option value="ADMIN">ADMIN</option>}
            </select>
          </label>
          <div className="full">
            <Button disabled={pending}>
              {t("Enviar o reenviar invitación", "Send or resend invitation")}
            </Button>
          </div>
          {state.error && (
            <p className="notice error full" role="alert">
              {state.error === "INVITE_RATE_LIMITED" || state.error === "MAIL_RATE_LIMITED"
                ? t(
                    "Límite de envíos. Espera al menos un minuto; máximo cinco intentos por hora.",
                    "Sending limit reached. Wait at least a minute; maximum five attempts per hour.",
                  )
                : state.error === "MAIL_CONFIGURATION"
                  ? t(
                      "Falta configurar el servicio de correo. La cuenta puede quedar pendiente de invitación.",
                      "Email service configuration is missing. The account may remain pending invitation.",
                    )
                    : state.error === "MAIL_DOMAIN_UNVERIFIED"
                      ? t("El dominio del remitente no está verificado en Resend. Configura RESEND_FROM_EMAIL con un dominio propio verificado; no puede ser gmail.com.", "The sender domain is not verified in Resend. Set RESEND_FROM_EMAIL to an address on your verified domain; it cannot be gmail.com.")
                    : state.error === "MAIL_TEST_RECIPIENT_ONLY"
                      ? t("El remitente de prueba de Resend solo permite enviar a tu correo de registro en Resend. Verifica un dominio propio para invitar a otros usuarios.", "Resend's test sender only allows your Resend account email. Verify your own domain to invite other users.")
                    : state.error === "MAIL_API_KEY_INVALID"
                      ? t("Resend rechazó la API key. Revisa RESEND_API_KEY en la función de correo.", "Resend rejected the API key. Check RESEND_API_KEY in the email function.")
                    : state.error === "USER_EXISTS" || state.error === "FORBIDDEN"
                    ? t(
                        "La cuenta ya tiene acceso, el rol no coincide o no tienes permiso para invitarla.",
                        "The account already has access, the role differs, or you lack permission to invite it.",
                      )
                    : t(
                        "No se pudo confirmar el envío. Si la cuenta fue creada, queda pendiente: reintenta con el mismo correo y rol después de un minuto.",
                        "Sending could not be confirmed. If the account was created, it remains pending: retry with the same email and role after a minute.",
                      )}
            </p>
          )}
          {state.success && (
            <p className="notice full" role="status">
              {t(
                "El proveedor aceptó el envío. El usuario debe abrir el enlace y establecer su contraseña; esto aún no confirma la entrega ni la activación.",
                "The provider accepted the email. The user must open the link and set a password; delivery and activation are not yet confirmed.",
              )}
            </p>
          )}
        </form>
      </section>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>{t("Rol", "Role")}</th>
              <th>{t("Acceso", "Access")}</th>
              <th>{t("Acciones", "Actions")}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>{user.active ? t("Activo", "Active") : t("Inactivo", "Inactive")}</td>
                <td>
                  {(canAdmin || user.role !== "ADMIN") && (
                    <form
                      action={setActive}
                      onSubmit={(event) => {
                        if (
                          !window.confirm(
                            t("¿Cambiar el acceso de este usuario?", "Change this user's access?"),
                          )
                        )
                          event.preventDefault();
                      }}
                    >
                      <input type="hidden" name="id" value={user.id} />
                      <input type="hidden" name="active" value={String(!user.active)} />
                      <Button size="sm" variant="outline">
                        {user.active ? t("Desactivar", "Deactivate") : t("Activar", "Activate")}
                      </Button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
