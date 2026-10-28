"use client";
import { Button, useLanguage } from "@lm/ui";
import { Building2, CalendarDays, Home, MessageCircle, PackageCheck, Store, Truck } from "lucide-react";
export function Services() {
  const { t } = useLanguage();
  return (
    <div className="service-grid">
      {[
        [
          Home,
          "Hogares",
          "Homes",
          "Un nuevo espacio, tus mismas cosas favoritas. Comparte el tamaño de tu vivienda y los accesos para preparar la mudanza.",
          "A new space, the same things you love. Share your home's size and access details so we can plan your move.",
        ],
        [
          Building2,
          "Oficinas",
          "Offices",
          "Cuéntanos sobre tu oficina, su ubicación y la fecha que tienes en mente. Nuestro equipo revisará lo que necesitas.",
          "Tell us about your office, its location and your preferred date. Our team will review what you need.",
        ],
        [
          Store,
          "Comercios",
          "Businesses",
          "Organiza el traslado de tu local comercial con un equipo y una programación acordados contigo.",
          "Plan your business relocation with a team and a schedule agreed with you.",
        ],
      ].map(([Icon, es, en, bodyEs, bodyEn]) => {
        const ServiceIcon = Icon as typeof Home;
        return (
          <article className="card service-card" key={String(en)}>
            <ServiceIcon size={30} aria-hidden="true" />
            <h2>{t(String(es), String(en))}</h2>
            <p className="muted">{t(String(bodyEs), String(bodyEn))}</p>
            <a href="/request-quote">{t("Cuéntanos qué necesitas", "Tell us what you need")} </a>
          </article>
        );
      })}
    </div>
  );
}
export function HomeContent() {
  const { t } = useLanguage();
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <p className="hero-location">
              {t("Desde Miami, dentro de Florida", "From Miami, across Florida")}
            </p>
            <h1>{t("De aquí a tu próximo hogar.", "From here to your next home.")}</h1>
            <p className="lead">
              {t(
                "Un nuevo hogar. Una nueva oficina. El mismo cuidado en cada paso. Planifiquemos juntos tu mudanza dentro de Florida.",
                "A new home. A new office. The same care at every step. Let's plan your move across Florida together.",
              )}
            </p>
            <div className="row">
              <Button asChild>
                <a href="/request-quote">{t("Solicitar cotización", "Request a quote")}</a>
              </Button>
              <a href="/services">{t("Ver servicios", "Explore services")}</a>
            </div>
            <p className="small muted">
              {t(
                "Sin crear una cuenta. Nuestro equipo revisará tu solicitud.",
                "No account needed. Our team will review your request.",
              )}
            </p>
          </div>
          <div className="hero-art">
            <div className="route-card">
              <small>{t("Origen", "Pickup")}</small>
              <h3>Miami, Florida</h3>
              <div className="route-line" />
              <small>{t("Destino", "Destination")}</small>
              <h3>{t("Tu siguiente dirección", "Your next address")}</h3>
              <Truck size={44} aria-hidden="true" />
            </div>
            <div className="art-bottom">
              <strong>LM.</strong>
              <span>
                Rapid Transport
                <br />
                Florida
              </span>
            </div>
          </div>
        </div>
      </section>
      <section className="section container">
        <div className="section-heading">
          <h2>{t("¿Qué vas a mudar?", "What are you moving?")}</h2>
        </div>
        <Services />
      </section>
      <section className="section process-section">
        <div className="container">
          <h2>{t("Así organizamos tu mudanza", "How we plan your move")}</h2>
          <div className="service-grid">
            {[
              [
                MessageCircle,
                "01",
                "Cuéntanos",
                "Tell us",
                "Completa la solicitud con tus direcciones y necesidades.",
                "Share your addresses and needs in the request form.",
              ],
              [
                CalendarDays,
                "02",
                "Planifiquemos",
                "Let's plan",
                "Revisamos los detalles y acordamos contigo precio, equipo y horario.",
                "We review the details and agree on pricing, crew and timing with you.",
              ],
              [
                PackageCheck,
                "03",
                "Nos movemos",
                "Let's move",
                "El día acordado, comenzamos tu próximo capítulo.",
                "On the agreed day, we help you begin your next chapter.",
              ],
            ].map(([Icon, n, es, en, bes, ben]) => {
              const StepIcon = Icon as typeof Home;
              return (
                <div className="process-card" key={String(n)}>
                  <span className="eyebrow">{String(n)}</span>
                  <StepIcon aria-hidden="true" />
                  <h3>{t(String(es), String(en))}</h3>
                  <p>{t(String(bes), String(ben))}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
export function InfoContent({
  kind,
  phone,
  email,
}: {
  kind: "services" | "about" | "contact";
  phone?: string;
  email?: string;
}) {
  const { t } = useLanguage();
  return (
    <section className="section container">
      <h1>
        {kind === "services"
          ? t("Nos encargamos del siguiente paso.", "We help with the next step.")
          : kind === "about"
            ? t("Personas detrás de cada mudanza.", "People behind every move.")
            : t("Hablemos de tu próximo destino.", "Let's talk about your next destination.")}
      </h1>
      <p className="lead">
        {t(
          "Mudanzas residenciales, de oficinas y comercios. Un origen, un destino y un plan acordado contigo.",
          "Residential, office and business moves. One origin, one destination and a plan agreed with you.",
        )}
      </p>
      {kind === "services" ? (
        <Services />
      ) : kind === "about" ? (
        <div className="card prose">
          <h2>{t("Cerca de ti, desde Miami.", "Close to you, from Miami.")}</h2>
          <p>
            {t(
              "LM Rapid Transport organiza mudanzas dentro de Florida. Comenzamos escuchando lo que necesitas: el espacio que dejas, el lugar al que llegas y los detalles de acceso que hacen diferente cada traslado.",
              "LM Rapid Transport organizes moves across Florida. We begin by listening to what you need: the space you're leaving, the place you're moving to and the access details that make every move different.",
            )}
          </p>
          <p>
            {t(
              "Nuestro personal revisa cada solicitud antes de preparar una estimación y acordar la programación. Si todavía no tienes fecha o no sabes cuántos trabajadores necesitas, puedes pedirnos asesoría.",
              "Our staff reviews every request before preparing an estimate and agreeing on a schedule. If you don't have a date or aren't sure how many movers you need, you can ask us for guidance.",
            )}
          </p>
        </div>
      ) : (
        <div className="card prose">
          <h2>{t("Tu primer paso empieza aquí.", "Your first step starts here.")}</h2>
          {phone && (
            <p>
              <a href={`tel:${phone}`}>{phone}</a>
            </p>
          )}
          {email && (
            <p>
              <a href={`mailto:${email}`}>{email}</a>
            </p>
          )}
          {!phone && !email && (
            <p className="notice">
              {t(
                "Los datos de contacto directo están pendientes de configuración. Puedes usar el formulario de solicitud.",
                "Direct contact details are awaiting configuration. You can use the request form.",
              )}
            </p>
          )}
          <p>
            {t(
              "Atendemos mudanzas de lunes a sábado. La hora se acuerda después de revisar la solicitud.",
              "Moves are scheduled Monday through Saturday. The time is agreed after reviewing your request.",
            )}
          </p>
        </div>
      )}
      <div className="cta-strip">
        <div>
          <h2>{t("¿Listo para empezar?", "Ready to begin?")}</h2>
          <p>
            {t(
              "Comparte los detalles. Nosotros seguimos la conversación.",
              "Share the details. We'll take the conversation from there.",
            )}
          </p>
        </div>
        <Button asChild>
          <a href="/request-quote">{t("Solicitar una mudanza", "Request a move")}</a>
        </Button>
      </div>
    </section>
  );
}
