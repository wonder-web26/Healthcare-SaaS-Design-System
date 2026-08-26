/**
 * Die Gegenwart des Prototyps — eine Stelle, gegen die alles rechnet.
 *
 * Vorher lagen im Baum elf Bezugsdaten mit vier verschiedenen Werten
 * (3.3.2026, 31.7.2026, 1.7.2026 und die echte Uhr). Das Dossier rechnete
 * seinen Kopf gegen März, die Mandate gegen den 31. Juli und die
 * Pflegekontrolle gegen den 1. Juli; das Lagebild sagte „wartet seit 52
 * Tagen" gegen die Uhr und die Kostengutsprachen-Lücke daneben gegen den
 * 31. Juli. Zwei Sätze, zwei Gegenwarten.
 *
 * Der Wert ist fest und nicht `new Date()`: die Mockdaten liegen relativ zu
 * ihm, und mit einer laufenden Uhr wanderten sie täglich weiter aus dem
 * Bezug. Er ist so gewählt, dass die bestehenden Fälle tragen —
 * 3.3.2026 + 154 Tage = 4.8.2026, und 154 = 22 × 7. Dadurch behalten alle
 * mitverschobenen Daten ihren Wochentag, und ihr Abstand zur Gegenwart
 * bleibt unverändert.
 *
 * Was hier NICHT herkommt: Bedienprotokolle. Wann jemand ein Feld geändert
 * hat, ist keine Fachfrage und bleibt an der echten Uhr.
 */

/** Dienstag, 4. August 2026. */
export const GEGENWART = new Date(2026, 7, 4);

/** Dieselbe Gegenwart als JJJJ-MM-TT. */
export const GEGENWART_ISO = "2026-08-04";

/**
 * Der Monat, den die Leistungsansichten zuerst zeigen.
 *
 * Nicht der laufende, sondern der letzte vollständige: ein Monat wird
 * abgeschlossen und abgerechnet, wenn er vorbei ist. Am 4. August ist das
 * der Juli.
 */
export const BEZUGSMONAT = new Date(
  GEGENWART.getFullYear(),
  GEGENWART.getMonth() - 1,
  1,
);

/**
 * Ende der laufenden Woche, als JJJJ-MM-TT.
 *
 * Anna beantwortet damit „was ist diese Woche fällig". Gerechnet, nicht
 * gesetzt — sonst stünde neben der Gegenwart ein zweites Datum, das jemand
 * einzeln nachführen müsste. Samstag, wie bisher: der 7.3.2026 war einer,
 * und 7.3. + 154 Tage ist der 8.8.2026, wieder einer.
 */
export const WOCHENENDE_ISO = (() => {
  const d = new Date(GEGENWART);
  d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
})();

/** Eine frische Kopie — Date ist veränderbar, die Konstante darf es nicht sein. */
export function gegenwart(): Date {
  return new Date(GEGENWART);
}
