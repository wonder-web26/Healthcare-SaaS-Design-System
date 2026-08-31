/**
 * Kostenträger (Versicherer) — SP-02 / SP-03, erweitert um GLN und Trägerart.
 *
 * Krankenversicherer tragen ihre BAG-Nummer (Identifikationsnummer beim Bundesamt
 * für Gesundheit). Die GLN (13-stellig, für die Rechnungsstellung über MediData)
 * ist vorerst überall `null` — es liegt kein belegter Wert vor; eine erfundene GLN
 * führt zu einer abgewiesenen Rechnung.
 *
 * Neben den Krankenversicherern führen wir die Kostenträger für UVG (Unfall),
 * IVG (Invalidenversicherung) und MVG (Militärversicherung). Sie tragen KEINE
 * BAG-Nummer (die gibt es nur für Krankenversicherer) und werden über `art`
 * unterschieden.
 *
 * Quelle Krankenversicherer: BAG-Register der zugelassenen Krankenversicherer, Stand 2025.
 * Diese Liste ist die EINZIGE Versichererliste im Projekt.
 */

export type KostentraegerArt = "krankenversicherer" | "unfallversicherer" | "iv_stelle" | "militaerversicherung";

export interface KrankenkasseDefinition {
  value: string;
  label: string;
  /** BAG-Nummer des Versicherers — nur bei Krankenversicherern, sonst "". */
  bagNr: string;
  /** 13-stellige GLN des Versicherers (generalInvoice); vorerst überall null. */
  glnVersicherung: string | null;
  /** 13-stellige GLN des Rechnungsempfängers (kann vom Versicherer abweichen,
   *  z. B. Verarbeitungszentrum); vorerst überall null. */
  glnEmpfaenger: string | null;
  art: KostentraegerArt;
}

const kv = (value: string, label: string, bagNr: string): KrankenkasseDefinition =>
  ({ value, label, bagNr, glnVersicherung: null, glnEmpfaenger: null, art: "krankenversicherer" });

export const KRANKENKASSEN: KrankenkasseDefinition[] = [
  kv("css", "CSS Versicherung", "0271"),
  kv("helsana", "Helsana", "0580"),
  kv("swica", "SWICA", "0700"),
  kv("concordia", "Concordia", "0240"),
  kv("groupe_mutuel", "Groupe Mutuel", "0350"),
  kv("sanitas", "Sanitas", "0610"),
  kv("visana", "Visana", "0780"),
  kv("assura", "Assura", "0140"),
  kv("atupri", "Atupri", "0160"),
  kv("kpt", "KPT", "0440"),
  kv("sympany", "Sympany", "0310"),
  kv("oekk", "OEKK", "0520"),
  kv("egs", "EGK", "0290"),
  kv("agrisano", "Agrisano", "0100"),
  kv("aquilana", "Aquilana", "0130"),
  kv("compact", "Compact Grundversicherungen", "1191"),
  kv("easy_sana", "Easy Sana", "1197"),
  kv("galenos", "Galenos", "0340"),
  kv("glarner", "Glarner Krankenversicherung", "0360"),
  kv("ics", "ICS Intras", "0420"),
  kv("kolping", "Kolping", "0430"),
  kv("luzerner_hinterland", "Luzerner Hinterland", "0470"),
  kv("metallbau", "Metallbau", "0480"),
  kv("ob", "OB Nidwalden/Obwalden", "0510"),
  kv("progrès", "Progrès", "0568"),
  kv("rhenusana", "Rhenusana", "0600"),
  kv("sana24", "Sana24", "1195"),
  kv("sanagate", "Sanagate", "1196"),
  kv("slkk", "SLKK", "0660"),
  kv("sodalis", "Sodalis", "0670"),
  kv("steffisburg", "Steffisburg", "0680"),
  kv("sumiswalder", "Sumiswalder", "0690"),
  kv("vita_surselva", "Vita Surselva", "0800"),
  kv("vivacare", "Vivacare", "1192"),
  kv("waedenswil", "Wädenswil", "0810"),
  // ── Kostenträger UVG / IVG / MVG (keine BAG-Nummer, GLN unbelegt) ──────────
  { value: "suva", label: "SUVA", bagNr: "", glnVersicherung: null, glnEmpfaenger: null, art: "unfallversicherer" },
  { value: "axa", label: "AXA", bagNr: "", glnVersicherung: null, glnEmpfaenger: null, art: "unfallversicherer" },
  { value: "zurich", label: "Zurich", bagNr: "", glnVersicherung: null, glnEmpfaenger: null, art: "unfallversicherer" },
  { value: "helvetia", label: "Helvetia", bagNr: "", glnVersicherung: null, glnEmpfaenger: null, art: "unfallversicherer" },
  { value: "iv_stelle", label: "IV-Stelle (kantonal)", bagNr: "", glnVersicherung: null, glnEmpfaenger: null, art: "iv_stelle" },
  { value: "militaerversicherung", label: "Militärversicherung (SUVA)", bagNr: "", glnVersicherung: null, glnEmpfaenger: null, art: "militaerversicherung" },
];

/** Dropdown-Optionen für Select-Komponenten (value + label) — alle Träger. */
export const KRANKENKASSEN_OPTIONS = KRANKENKASSEN.map(k => ({ value: k.value, label: k.label }));

/** Versicherer nach Kennung. */
export function getVersicherer(id: string): KrankenkasseDefinition | undefined {
  return KRANKENKASSEN.find(k => k.value === id);
}

/** BAG-Nummer zu einem Kostenträger-Code nachschlagen. */
export function getBagNummer(kassenCode: string): string {
  return getVersicherer(kassenCode)?.bagNr ?? "";
}

/** Label zu einem Kostenträger-Code nachschlagen. */
export function getKrankenkasseLabel(kassenCode: string): string {
  return getVersicherer(kassenCode)?.label ?? kassenCode;
}

/**
 * Kostenträger-Kennung aus einem Namen (Code oder Label, tolerant). Für die
 * Überführung bestehender Klartext-Kassennamen (Fixtures, Mandat) in eine
 * Versicherer-Referenz. Gibt null zurück, wenn kein Träger passt.
 */
export function versichererIdFuerName(name: string): string | null {
  const n = name.trim().toLowerCase();
  if (!n) return null;
  return KRANKENKASSEN.find(k => k.value === n)?.value
    ?? KRANKENKASSEN.find(k => k.label.toLowerCase() === n)?.value
    ?? KRANKENKASSEN.find(k => k.label.toLowerCase().startsWith(n))?.value
    ?? null;
}
