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

/** Ausweisart als Schlüssel-Union — Eingabe der ausländerrechtlichen Prüfung.
 *  "keiner" steht hier weiter, obwohl es nicht mehr zur Auswahl steht: die
 *  Regelprüfung kennt den Wert, und ein Datensatz aus einer anderen Quelle
 *  soll weiterhin die Sperre S1 auslösen. */
export type Aufenthaltsstatus = "B" | "C" | "L" | "G" | "F" | "N" | "S" | "keiner";

export const AUFENTHALTSSTATUS: PersonenFeldWert[] = [
  { schluessel: "B", label: "B – Aufenthaltsbewilligung", sdaCode: null },
  { schluessel: "C", label: "C – Niederlassungsbewilligung", sdaCode: null },
  { schluessel: "L", label: "L – Kurzaufenthaltsbewilligung", sdaCode: null },
  { schluessel: "G", label: "G – Grenzgängerbewilligung", sdaCode: null },
  { schluessel: "F", label: "F – Vorläufige Aufnahme", sdaCode: null },
  { schluessel: "N", label: "N – Asylsuchende", sdaCode: null },
  { schluessel: "S", label: "S – Schutzbedürftige", sdaCode: null },
  /* "keiner" — Kein gültiger Ausweis — ist auf Entscheid des Eigners aus der
     AUSWAHL entfernt. Der Schlüssel bleibt im Typ und in der Regelprüfung:
     Sperre S1 (lib/regeln/auslaenderrecht) wertet ihn weiter aus, damit ein von
     anderswoher kommender Datensatz nicht stillschweigend durchfällt.

     OFFENER POSTEN: über das Formular ist S1 damit nicht mehr auslösbar. Ein
     leeres Feld heisst "noch nicht erfasst", nicht "kein Ausweis vorhanden" —
     die Prüfung meldet dann "nicht bestimmbar" statt "unzulässig". Wer die Lage
     "kein gültiger Ausweis" wieder erfassbar machen will, setzt die Zeile
     darunter zurück. */
];

export const AUFENTHALTSSTATUS_OPTIONS = optionen(AUFENTHALTSSTATUS);
/* Beschriftungen — samt der nicht mehr wählbaren. Ein bestehender Datensatz mit
   "keiner" soll lesbar bleiben und nicht als leere Zelle erscheinen. */
const NICHT_MEHR_WAEHLBAR: Record<string, string> = { keiner: "Kein gültiger Ausweis" };
export const aufenthaltsstatusLabel = (schluessel: string) =>
  label(AUFENTHALTSSTATUS, schluessel) || (NICHT_MEHR_WAEHLBAR[schluessel] ?? "");
