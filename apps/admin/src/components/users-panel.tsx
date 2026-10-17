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
            <Button disabled={pending}>{t("Enviar invitación", "Send invitation")}</Button>
          </div>
          {state.error && (
            <p className="notice error full" role="alert">
              {t(
                "No se pudo invitar. Revisa si la cuenta ya existe, tus permisos y la configuración de correo.",
                "Unable to invite. Check whether the account exists, your permissions and email configuration.",
              )}
            </p>
          )}
          {state.success && (
            <p className="notice full" role="status">
              {t("Invitación enviada.", "Invitation sent.")}
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
