export default function Page() {
  return (
    <section className="section container narrow">
      <h1>Privacidad · Privacy</h1>
      <p>
        Usamos los datos de tu solicitud para preparar una cotización y coordinar tu mudanza. No necesitas
        adjuntar fotografías. Contacto:{" "}
        <a href={`mailto:${process.env.CONTACT_EMAIL}`}>{process.env.CONTACT_EMAIL}</a>.
      </p>
      <p>
        We use request details to prepare your quote and coordinate your move. Photos are optional. Contact us
        to request a correction or ask about your data.
      </p>
      <p>
        Cuando la búsqueda está habilitada, el texto de ubicación se envía a Google Maps para obtener
        sugerencias. When search is enabled, location queries are sent to Google Maps for suggestions.
      </p>
      <a href="https://policies.google.com/privacy">
        Política de privacidad de Google · Google Privacy Policy
      </a>
    </section>
  );
}
