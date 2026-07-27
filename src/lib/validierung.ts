/**
 * Zentraler Baustein für Feldvalidierungen — analog zum Datums-Util.
 *
 * Je Feldtyp eine Prüffunktion, die einen von drei Zuständen zurückgibt:
 * - ok:          gültig (oder leer — Leer löst nie eine Prüfung aus)
 * - ungueltig:   formal falsch. Das Feld wird als fehlerhaft gekennzeichnet,
 *                die Eingabe bleibt unverändert stehen, nie stille Korrektur.
 * - unplausibel: Hinweis in Warnfarbe, blockiert nichts, Wert wird übernommen.
 *
 * Die AHV-Prüfung (Format + Prüfziffer) lebt hier zentral; AHVNummerInput und
 * die Onboarding-Schrittvalidierung nutzen sie, statt sie doppelt zu führen.
 */

export type ValidStatus = "ok" | "ungueltig" | "unplausibel";

export interface ValidErgebnis {
  status: ValidStatus;
  meldung?: string;
}

const OK: ValidErgebnis = { status: "ok" };

// ── AHVN13 (756.XXXX.XXXX.XX) ────────────────────────────────────────────────

/** Digits → maskierter AHV-String; Trennpunkte setzt das Feld selbst. */
export function maskiereAHV(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 13);
  let out = "";
  for (let i = 0; i < d.length; i++) {
    if (i === 3 || i === 7 || i === 11) out += ".";
    out += d[i];
  }
  return out;
}

/**
 * Prüft Format UND Prüfziffer der AHVN13 (13 Stellen, 756-Präfix, EAN-13-
 * Modulo-10 mit Gewichten 1/3). Beides formal (ungueltig), kein Hinweis.
 */
export function validiereAHV(input: string): ValidErgebnis {
  const d = input.replace(/\D/g, "");
  if (d.length === 0) return OK;
  if (d.length !== 13) return { status: "ungueltig", meldung: "AHV-Nummer muss 13 Ziffern haben." };
  if (!d.startsWith("756")) return { status: "ungueltig", meldung: "Schweizer AHV-Nummer beginnt mit 756." };
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += parseInt(d[i], 10) * (i % 2 === 0 ? 1 : 3);
  const erwartet = (10 - (sum % 10)) % 10;
  if (erwartet !== parseInt(d[12], 10)) return { status: "ungueltig", meldung: "Prüfziffer ist ungültig." };
  return OK;
}

/** Reines Format ohne Prüfziffer (756 + 13 Stellen) — für die Onboarding-Schrittvalidierung. */
export function istAHVFormatGueltig(input: string | null | undefined): boolean {
  const d = (input ?? "").replace(/\D/g, "");
  return /^756\d{10}$/.test(d);
}

// ── ICD-10 (nur Gestalt, nicht Existenz) ─────────────────────────────────────

/**
 * Prüft ausschliesslich die GESTALT eines ICD-10-Codes: ein Buchstabe, zwei
 * Ziffern, optional ein Punkt und ein bis zwei weitere Stellen. NICHT geprüft
 * wird, ob der Code existiert.
 */
export function validiereICD(input: string): ValidErgebnis {
  const v = input.trim();
  if (v === "") return OK;
  if (!/^[A-Za-z]\d{2}(\.\d{1,2})?$/.test(v)) {
    return { status: "ungueltig", meldung: "Kein gültiges ICD-10-Format (z. B. I50.9). Nur die Form wird geprüft, nicht ob der Code existiert." };
  }
  return OK;
}

/** Hinweistext unter dem ICD-Feld — benennt die Grenze der Prüfung. */
export const ICD_HINWEIS = "Nur die Form wird geprüft (z. B. I50.9), nicht ob der Code existiert.";

// ── Zahlen mit Plausibilitätsbereich (Grösse / Gewicht) ──────────────────────

/** Ziffern-Maske für Zahlenfelder: nur Ziffern, höchstens `max` Stellen. */
export function maskiereZiffern(raw: string, max: number): string {
  return raw.replace(/\D/g, "").slice(0, max);
}

function validiereZahlBereich(input: string, min: number, max: number, einheit: string): ValidErgebnis {
  const v = input.trim();
  if (v === "") return OK;
  if (!/^\d{1,3}$/.test(v)) return { status: "ungueltig", meldung: "Nur ganze Zahlen mit höchstens drei Ziffern." };
  const n = parseInt(v, 10);
  if (n < min || n > max) {
    return { status: "unplausibel", meldung: `Wert ausserhalb des üblichen Bereichs (${min}–${max} ${einheit}).` };
  }
  return OK;
}

/** K1a Körpergrösse in cm: höchstens 3 Ziffern (Format), Plausibilität 100–220. */
export function validiereGroesseCm(input: string): ValidErgebnis {
  return validiereZahlBereich(input, 100, 220, "cm");
}

/** K1b Körpergewicht in kg: höchstens 3 Ziffern (Format), Plausibilität 30–250. */
export function validiereGewichtKg(input: string): ValidErgebnis {
  return validiereZahlBereich(input, 30, 250, "kg");
}

// ── Dispatcher nach Feldtyp (seed-gesteuert) ─────────────────────────────────

export type ValidierungTyp = "ahvn13" | "icd10" | "groesse_cm" | "gewicht_kg";

/** Wendet die zum Feldtyp passende Prüffunktion an. */
export function validiereFeld(typ: ValidierungTyp, value: string): ValidErgebnis {
  switch (typ) {
    case "ahvn13": return validiereAHV(value);
    case "icd10": return validiereICD(value);
    case "groesse_cm": return validiereGroesseCm(value);
    case "gewicht_kg": return validiereGewichtKg(value);
  }
}
