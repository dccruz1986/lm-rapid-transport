import type { FieldIssue } from "@lm/types";

const messages: Record<string, [string, string]> = {
  REQUIRED: ["Completa este campo.", "Complete this field."],
  INVALID: ["Introduce un valor válido.", "Enter a valid value."],
  EMAIL: ["Introduce un correo válido.", "Enter a valid email."],
  CHOICE: ["Selecciona una opción válida.", "Select a valid option."],
  MIN_LENGTH: ["Usa al menos {limit} caracteres.", "Use at least {limit} characters."],
  MAX_LENGTH: ["Usa como máximo {limit} caracteres.", "Use at most {limit} characters."],
  MIN_VALUE: ["El valor debe ser como mínimo {limit}.", "The value must be at least {limit}."],
  MAX_VALUE: ["El valor debe ser como máximo {limit}.", "The value must be at most {limit}."],
  STEP: ["Revisa los decimales o el incremento permitido.", "Check the decimal places or allowed increment."],
  PHONE_US: ["Introduce un teléfono válido de EE. UU.", "Enter a valid US phone number."],
  PHONE_CONFLICT: ["Este teléfono pertenece a otro cliente.", "This phone belongs to another customer."],
  MONEY: [
    "Introduce entre 0.01 y 100000 USD, con hasta dos decimales.",
    "Enter 0.01 to 100000 USD, with up to two decimal places.",
  ],
  DATE_INVALID: ["Revisa la fecha, hora y zona horaria.", "Check the date, time and time zone."],
  DATE_TOMORROW: ["Elige mañana o una fecha posterior.", "Choose tomorrow or a later date."],
  DATE_SUNDAY: ["No realizamos mudanzas los domingos.", "We do not schedule moves on Sundays."],
  DATE_FUTURE: ["La fecha y hora no pueden ser futuras.", "The date and time cannot be in the future."],
  DATE_AFTER_NOW: ["Elige una fecha y hora futuras.", "Choose a future date and time."],
  ABOVE_VALUE: ["El valor debe ser mayor que {limit}.", "The value must be greater than {limit}."],
  PASSWORD_MATCH: ["Las contraseñas deben coincidir.", "Passwords must match."],
  BEDROOMS_REQUIRED: ["Indica los dormitorios.", "Enter the number of bedrooms."],
  BEDROOMS_COMMERCIAL: [
    "Los dormitorios no aplican a comercios.",
    "Bedrooms do not apply to commercial moves.",
  ],
  SIZE_UNIT_REQUIRED: ["Indica la superficie y su unidad.", "Enter the size and its unit."],
  PROPERTY_SIZE_MISMATCH: [
    "El tipo de propiedad debe corresponder al tamaño de mudanza.",
    "Property type must match the move size.",
  ],
  DURATION_LIMIT: ["Las horas estimadas no pueden superar 168.", "Estimated hours cannot exceed 168."],
  LOCATION: [
    "Revisa y selecciona una dirección o ZIP válido de Florida.",
    "Check and select a valid Florida address or ZIP.",
  ],
  MOVE_START_REQUIRED: ["Introduce la llegada al origen.", "Enter arrival at pickup."],
  MOVE_START_INVALID: [
    "Revisa llegada y zona horaria; no puede ser futura.",
    "Check arrival and time zone; it cannot be in the future.",
  ],
  MOVE_END_REQUIRED: [
    "Introduce la descarga finalizada para completar.",
    "Enter unloading finish to complete the move.",
  ],
  MOVE_END_INVALID: [
    "Debe ser posterior a la llegada, no futura y dentro de 168 horas. Revisa la zona horaria.",
    "Must be after arrival, not in the future and within 168 hours. Check the time zone.",
  ],
  MOVE_MILES_REQUIRED: ["Introduce las millas reales de ida.", "Enter actual one-way miles."],
  MOVE_MILES_INVALID: [
    "Introduce millas mayores que cero y hasta 10000, con hasta cuatro decimales; solo para modalidad por millas.",
    "Enter miles above zero and up to 10000, with up to four decimals; mileage pricing only.",
  ],
};
export function fieldMessage(issue: FieldIssue, locale: string) {
  return (messages[issue.code] ?? ["Introduce un valor válido.", "Enter a valid value."])[
    locale === "es" ? 0 : 1
  ].replace("{limit}", String(issue.limit ?? ""));
}
