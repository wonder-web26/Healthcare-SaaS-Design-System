/**
 * Aufenthaltsstatus — gemeinsame Werteliste für Patient und Angehörige.
 *
 * Der Standardkatalog kennt dieses Feld nicht; die Einträge tragen daher keinen
 * SDA-Code. Erscheint nur, wenn die Staatsangehörigkeit nicht Schweiz ist.
 *
 * Status B löst beim Angehörigen die Spezialbewilligung beim Migrationsamt aus
 * und sperrt die Vertragsunterzeichnung, bis die Einreichung bestätigt ist.
 */
import { type PersonenFeldWert, optionen, label } from "./personenfeld";

/** Status, der die Spezialbewilligungs-Pflicht auslöst. */
export const STATUS_B = "B";

export const AUFENTHALTSSTATUS: PersonenFeldWert[] = [
  { schluessel: "B", label: "B – Aufenthaltsbewilligung", sdaCode: null },
  { schluessel: "C", label: "C – Niederlassungsbewilligung", sdaCode: null },
  { schluessel: "L", label: "L – Kurzaufenthaltsbewilligung", sdaCode: null },
  { schluessel: "G", label: "G – Grenzgängerbewilligung", sdaCode: null },
  { schluessel: "F", label: "F – Vorläufige Aufnahme", sdaCode: null },
  { schluessel: "N", label: "N – Asylsuchende", sdaCode: null },
  { schluessel: "S", label: "S – Schutzbedürftige", sdaCode: null },
];

export const AUFENTHALTSSTATUS_OPTIONS = optionen(AUFENTHALTSSTATUS);
export const aufenthaltsstatusLabel = (schluessel: string) => label(AUFENTHALTSSTATUS, schluessel);
