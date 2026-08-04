/**
 * Geschlecht — gemeinsame Werteliste für Patient, Angehörige und Kinder.
 *
 * Reihenfolge und Beschriftung folgen BB2 des Standardkatalogs
 * (docs/standardkatalog-sda-entlassung.md); gespeichert wird der Schlüssel.
 */
import { type PersonenFeldWert, optionen, label, sdaCode } from "./personenfeld";

export const GESCHLECHT: PersonenFeldWert[] = [
  { schluessel: "maennlich", label: "Männlich", sdaCode: "1" },
  { schluessel: "weiblich", label: "Weiblich", sdaCode: "2" },
  { schluessel: "andere", label: "Andere", sdaCode: "3" },
];

export const GESCHLECHT_OPTIONS = optionen(GESCHLECHT);
export const geschlechtLabel = (schluessel: string) => label(GESCHLECHT, schluessel);
export const geschlechtSdaCode = (schluessel: string) => sdaCode(GESCHLECHT, schluessel);
