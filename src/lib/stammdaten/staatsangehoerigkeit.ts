/**
 * Staatsangehörigkeit — gemeinsame Werteliste für Patient und Angehörige.
 *
 * BB12 des Standardkatalogs kennt nur zwei Codes: 1 für Schweizer/in, 2 für
 * jedes andere Land. Die Auswahl bleibt trotzdem die volle Länderliste, weil
 * Heimatort, Aufenthaltsstatus und das SEM-Meldeformular das konkrete Land
 * brauchen. Beim Export ins SDA wird zu Code 2 die Beschriftung des Landes in
 * das Standardfeld „Andere, welche" geschrieben — deshalb kommt das Formular
 * ohne eigenes Freitextfeld aus.
 *
 * Neben `sdaCode` trägt jeder Eintrag ein `gruppe`-Feld. Beide bestehen
 * nebeneinander, weil sie verschiedene Fragen beantworten: `sdaCode` ist binär
 * (1/2) und dient dem SDA-/interRAI-Export; `gruppe` ist dreiwertig
 * (schweiz/eu_efta/drittstaat) und dient der ausländerrechtlichen Prüfung — dort
 * darf eine EU-Angehörige mit Ausweis B ohne Verfahren arbeiten, eine
 * Drittstaatsangehörige nicht. `null` steht für ein nicht benanntes Land
 * („Andere"), dessen Gruppe unbekannt ist; es wird keine Zuordnung erfunden.
 *
 * Produktiv liefert das Backend die Länderliste; das Feld `gruppe` mit den drei
 * Werten plus `null` ist die erwartete Struktur, nicht diese acht Seed-Länder.
 */
import { type PersonenFeldWert, optionen, label, sdaCode } from "./personenfeld";

/** Schlüssel des Schweizer Bürgerrechts — steuert Heimatort und Aufenthaltsstatus. */
export const SCHWEIZ = "schweiz";

/** Ausländerrechtliche Gruppe der Staatsangehörigkeit. */
export type StaatsangehoerigkeitsGruppe = "schweiz" | "eu_efta" | "drittstaat";

interface StaatsangehoerigkeitWert extends PersonenFeldWert {
  /** Dreiwertige Gruppe für die ausländerrechtliche Prüfung; null = Land unbenannt, Gruppe unbekannt. */
  gruppe: StaatsangehoerigkeitsGruppe | null;
}

export const STAATSANGEHOERIGKEIT: StaatsangehoerigkeitWert[] = [
  { schluessel: "schweiz", label: "Schweiz", sdaCode: "1", gruppe: "schweiz" },
  { schluessel: "deutschland", label: "Deutschland", sdaCode: "2", gruppe: "eu_efta" },
  { schluessel: "frankreich", label: "Frankreich", sdaCode: "2", gruppe: "eu_efta" },
  { schluessel: "italien", label: "Italien", sdaCode: "2", gruppe: "eu_efta" },
  { schluessel: "oesterreich", label: "Österreich", sdaCode: "2", gruppe: "eu_efta" },
  { schluessel: "portugal", label: "Portugal", sdaCode: "2", gruppe: "eu_efta" },
  { schluessel: "spanien", label: "Spanien", sdaCode: "2", gruppe: "eu_efta" },
  { schluessel: "tuerkei", label: "Türkei", sdaCode: "2", gruppe: "drittstaat" },
  { schluessel: "andere", label: "Andere", sdaCode: "2", gruppe: null },
];

export const STAATSANGEHOERIGKEIT_OPTIONS = optionen(STAATSANGEHOERIGKEIT);
export const staatsangehoerigkeitLabel = (schluessel: string) => label(STAATSANGEHOERIGKEIT, schluessel);
export const staatsangehoerigkeitSdaCode = (schluessel: string) => sdaCode(STAATSANGEHOERIGKEIT, schluessel);

/** Schweizer Bürgerrecht — die Bedingung hinter Heimatort und Aufenthaltsstatus. */
export function istSchweiz(schluessel: string): boolean {
  return schluessel === SCHWEIZ;
}

/**
 * Ausländerrechtliche Gruppe zu einer Nationalität. Liest ausschliesslich das
 * `gruppe`-Feld der Länderliste — leitet nichts aus Name oder `sdaCode` ab.
 * `null`, wenn die Nationalität nicht gesetzt ist oder das Land keine Gruppe trägt.
 */
export function staatsangehoerigkeitsgruppe(nationalitaet: string): StaatsangehoerigkeitsGruppe | null {
  if (!nationalitaet) return null;
  return STAATSANGEHOERIGKEIT.find(e => e.schluessel === nationalitaet)?.gruppe ?? null;
}

/**
 * Was beim SDA-Export im Feld „Andere, welche" steht: bei Code 2 die
 * Beschriftung des Landes, sonst nichts. Der Export selbst wird erst später
 * gebaut; hier liegt nur die Ableitung.
 */
export function sdaAndereWelche(schluessel: string): string {
  return staatsangehoerigkeitSdaCode(schluessel) === "2" ? staatsangehoerigkeitLabel(schluessel) : "";
}
