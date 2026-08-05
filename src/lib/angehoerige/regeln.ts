/**
 * Abgeleitete Anzeigen des Angehörigenbereichs — R21 bis R23 des
 * Standardkatalogs Pflegende Angehörige.
 *
 * Keine dieser Angaben wird gespeichert. Sie werden bei jeder Anzeige aus den
 * Erhebungsfeldern gerechnet; ändert sich ein Erhebungsfeld, ändert sich die
 * Anzeige mit, ohne zweiten Wert im Bestand.
 */
import type { Angehoeriger } from "../../app/components/angehoerigeData";

/* ── R22 · Flüchtlingsstatus ─────────────────────────────────────────────────
   Wahr bei Aufenthaltsstatus F (vorläufig aufgenommen) oder S
   (Schutzbedürftige). Anzeige, kein gespeichertes Feld. ── */
export function istFluechtling(aufenthaltsstatus: string): boolean {
  return aufenthaltsstatus === "F" || aufenthaltsstatus === "S";
}

/* ── R23 · Grenzgänger ───────────────────────────────────────────────────────
   Wahr bei Aufenthaltsstatus G. Anzeige, kein gespeichertes Feld. ── */
export function istGrenzgaenger(aufenthaltsstatus: string): boolean {
  return aufenthaltsstatus === "G";
}

/* ── R21 · SRK-Gate ──────────────────────────────────────────────────────────
   Quelle: Administrativvertrag Spitex Schweiz / ASPS mit HSK, gültig ab
   1.4.2023, Anhang 6, Ziffer 3.1 — die Ausbildung ist innerhalb eines Jahres
   ab Anstellung zu absolvieren. Anker ist deshalb das Eintrittsdatum. ── */

/** Datum im Format TT.MM.JJJJ, sonst null. */
function ausAnzeigedatum(wert: string): Date | null {
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(wert.trim());
  if (!m) return null;
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  return Number.isNaN(d.getTime()) ? null : d;
}

function alsAnzeigedatum(d: Date): string {
  const zz = (n: number) => String(n).padStart(2, "0");
  return `${zz(d.getDate())}.${zz(d.getMonth() + 1)}.${d.getFullYear()}`;
}

/**
 * Frist zur Absolvierung des SRK-Kurses: Eintrittsdatum plus zwölf Monate.
 * Ohne Eintrittsdatum gibt es keine Frist — sie wird nicht geschätzt.
 */
export function srkFrist(eintrittsdatum: string): Date | null {
  const start = ausAnzeigedatum(eintrittsdatum);
  if (!start) return null;
  const frist = new Date(start);
  frist.setFullYear(frist.getFullYear() + 1);
  return frist;
}

/** Dieselbe Frist als Anzeigetext; leer, wenn kein Eintrittsdatum vorliegt. */
export function srkFristAnzeige(eintrittsdatum: string): string {
  const f = srkFrist(eintrittsdatum);
  return f ? alsAnzeigedatum(f) : "";
}

/**
 * Zustand des SRK-Gates.
 *
 * - `kein_gate`  Qualifikationsstufe fage_dipl — die Ausbildung ersetzt den
 *                Nachweis, das Gate greift nicht.
 * - `erlaubt`    Zertifikat liegt vor.
 * - `risiko`     Zertifikat fehlt, die Frist läuft noch.
 * - `pausiert`   Zertifikat fehlt, die Frist ist überschritten.
 * - `null`       Kein Eintrittsdatum — ohne Anker gibt es keine Frist und
 *                damit keine Ampel. Ausdrücklich NICHT "erlaubt": ein
 *                fehlender Wert ist keine Freigabe.
 */
export type SrkAmpel = "kein_gate" | "erlaubt" | "risiko" | "pausiert" | null;

export function srkAmpel(a: Angehoeriger, heute: Date): SrkAmpel {
  if (a.qualifikation === "fage_dipl") return "kein_gate";
  if (a.srkZertifikatVorhanden === "ja") return "erlaubt";
  const frist = srkFrist(a.eintrittsdatum);
  if (!frist) return null;
  return heute >= frist ? "pausiert" : "risiko";
}
