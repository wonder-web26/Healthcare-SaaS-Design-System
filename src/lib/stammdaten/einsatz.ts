/**
 * Wertelisten des Einsatzes.
 *
 * Gespeichert wird der Code, nie die Beschriftung.
 *
 * Zur Wortwahl: die Zeit wird ERFASST, nicht gestempelt. Ein Stempel misst
 * Anwesenheit, ein Einsatz hält fest, was bei wem geleistet wurde.
 */
import { type SdaWert } from "./sda-wert";

export type EinsatzZustandCode = "erbracht" | "abgesagt";

export const EINSATZ_ZUSTAND: SdaWert[] = [
  { code: "erbracht", label: "Erbracht" },
  { code: "abgesagt", label: "Abgesagt" },
];

export type PruefzustandCode = "zu_pruefen" | "geprueft" | "rueckfrage";

export const PRUEFZUSTAND: SdaWert[] = [
  { code: "zu_pruefen", label: "Zu prüfen" },
  { code: "geprueft", label: "Geprüft" },
  { code: "rueckfrage", label: "Rückfrage" },
];

const beschriftung = (liste: SdaWert[]) => (code: string): string =>
  liste.find(w => w.code === code)?.label ?? "";

export const einsatzZustandLabel = beschriftung(EINSATZ_ZUSTAND);
export const pruefzustandLabel = beschriftung(PRUEFZUSTAND);
