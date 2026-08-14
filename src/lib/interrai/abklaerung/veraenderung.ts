/**
 * Ableitung der Veränderung eines CAP gegenüber dem vorangehenden Assessment.
 *
 * Reine Funktion, bewusst getrennt von der Darstellung und einzeln testbar
 * (siehe veraenderung.test.ts). Die Richtung einer Veränderung wird
 * AUSSCHLIESSLICH über die Ampelstufe bestimmt (ampelVergleich aus dem
 * Katalog), niemals über den Zahlenwert — beim CAP 18 (Dekubitus) ist 1 der
 * schwerste und 3 der leichteste Zustand, ein Zahlenvergleich kehrte die
 * Richtung um.
 */
import { capErgebnis, ampelVergleich } from '../katalog/cap-katalog'

export type Veraenderung =
  | 'neu'
  | 'verschlechtert'
  | 'verbessert'
  | 'unveraendert'
  | 'kein_vergleich'

export function leiteVeraenderungAb(
  capNummer: number,
  wert: number | null,
  vorwert: number | null,
): Veraenderung {
  // 1) Kein Vergleichswert oder kein aktueller Wert → keine Aussage möglich.
  if (vorwert === null || wert === null) return 'kein_vergleich'
  // 2) Von „nicht ausgelöst" (0) auf einen anderen Wert → neu.
  if (vorwert === 0 && wert !== 0) return 'neu'
  // 3) Sonst: Richtung ausschliesslich über die Ampelstufe.
  const ampelAktuell = capErgebnis(capNummer, wert)?.ampel
  const ampelVorher = capErgebnis(capNummer, vorwert)?.ampel
  if (!ampelAktuell || !ampelVorher) return 'kein_vergleich'
  const richtung = ampelVergleich(ampelAktuell, ampelVorher)
  return richtung > 0 ? 'verschlechtert' : richtung < 0 ? 'verbessert' : 'unveraendert'
}
