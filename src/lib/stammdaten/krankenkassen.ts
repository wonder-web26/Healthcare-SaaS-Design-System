/**
 * Schweizer Krankenversicherer — SP-02 / SP-03
 *
 * Jeder Eintrag traegt die BAG-Nummer (Identifikationsnummer des
 * Versicherers beim Bundesamt fuer Gesundheit).
 *
 * Quelle: BAG-Register der zugelassenen Krankenversicherer
 * Stand: 2025
 */

export interface KrankenkasseDefinition {
  value: string;
  label: string;
  /** BAG-Nummer des Versicherers */
  bagNr: string;
}

export const KRANKENKASSEN: KrankenkasseDefinition[] = [
  { value: "css", label: "CSS Versicherung", bagNr: "0271" },
  { value: "helsana", label: "Helsana", bagNr: "0580" },
  { value: "swica", label: "SWICA", bagNr: "0700" },
  { value: "concordia", label: "Concordia", bagNr: "0240" },
  { value: "groupe_mutuel", label: "Groupe Mutuel", bagNr: "0350" },
  { value: "sanitas", label: "Sanitas", bagNr: "0610" },
  { value: "visana", label: "Visana", bagNr: "0780" },
  { value: "assura", label: "Assura", bagNr: "0140" },
  { value: "atupri", label: "Atupri", bagNr: "0160" },
  { value: "kpt", label: "KPT", bagNr: "0440" },
  { value: "sympany", label: "Sympany", bagNr: "0310" },
  { value: "oekk", label: "OEKK", bagNr: "0520" },
  { value: "egs", label: "EGK", bagNr: "0290" },
  { value: "agrisano", label: "Agrisano", bagNr: "0100" },
  { value: "aquilana", label: "Aquilana", bagNr: "0130" },
  { value: "compact", label: "Compact Grundversicherungen", bagNr: "1191" },
  { value: "easy_sana", label: "Easy Sana", bagNr: "1197" },
  { value: "galenos", label: "Galenos", bagNr: "0340" },
  { value: "glarner", label: "Glarner Krankenversicherung", bagNr: "0360" },
  { value: "ics", label: "ICS Intras", bagNr: "0420" },
  { value: "kolping", label: "Kolping", bagNr: "0430" },
  { value: "luzerner_hinterland", label: "Luzerner Hinterland", bagNr: "0470" },
  { value: "metallbau", label: "Metallbau", bagNr: "0480" },
  { value: "ob", label: "OB Nidwalden/Obwalden", bagNr: "0510" },
  { value: "progrès", label: "Progrès", bagNr: "0568" },
  { value: "rhenusana", label: "Rhenusana", bagNr: "0600" },
  { value: "sana24", label: "Sana24", bagNr: "1195" },
  { value: "sanagate", label: "Sanagate", bagNr: "1196" },
  { value: "slkk", label: "SLKK", bagNr: "0660" },
  { value: "sodalis", label: "Sodalis", bagNr: "0670" },
  { value: "steffisburg", label: "Steffisburg", bagNr: "0680" },
  { value: "sumiswalder", label: "Sumiswalder", bagNr: "0690" },
  { value: "vita_surselva", label: "Vita Surselva", bagNr: "0800" },
  { value: "vivacare", label: "Vivacare", bagNr: "1192" },
  { value: "waedenswil", label: "Wädenswil", bagNr: "0810" },
];

/** Dropdown-Optionen fuer Select-Komponenten (value + label) */
export const KRANKENKASSEN_OPTIONS = KRANKENKASSEN.map(k => ({ value: k.value, label: k.label }));

/** BAG-Nummer zu einem Krankenkassen-Code nachschlagen */
export function getBagNummer(kassenCode: string): string {
  return KRANKENKASSEN.find(k => k.value === kassenCode)?.bagNr ?? "";
}

/** Label zu einem Krankenkassen-Code nachschlagen */
export function getKrankenkasseLabel(kassenCode: string): string {
  return KRANKENKASSEN.find(k => k.value === kassenCode)?.label ?? kassenCode;
}
