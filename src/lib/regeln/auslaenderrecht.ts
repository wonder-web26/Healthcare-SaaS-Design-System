/**
 * Ausländerrechtliche Prüfung bei Anstellung — reine Regel-Engine.
 *
 * Massgebend ist docs/auslaenderrecht/Regelwerk_Auslaenderrecht_DE.md,
 * Fassung 1.2. Diese Datei setzt es 1:1 um: die vierzehn Regeln R01–R14, die
 * vier Sperren S1–S4 und die drei Zusatzprüfungen Z1–Z3. Es wird keine Regel
 * erfunden; eine nicht abgedeckte Kombination liefert `nicht_bestimmbar`.
 *
 * `pruefeAuslaenderrecht` ist eine reine Funktion: kein Store-Zugriff, keine
 * Seiteneffekte, kein `new Date()`. Alle Datumsvergleiche laufen über die als
 * Eingabe übergebenen Daten (ausweisGueltigBis, arbeitsbeginnGeplant,
 * asylgesuchDatum) — es gibt keinen impliziten Stichtag „heute".
 */
import type { Aufenthaltsstatus } from "../stammdaten/aufenthaltsstatus";
import type { Aufenthaltsgrund } from "../stammdaten/aufenthaltsgrund";
import type { StaatsangehoerigkeitsGruppe } from "../stammdaten/staatsangehoerigkeit";
import { zustaendigeStelle, meldekanal, kantonSicherheit, kantonBekannt } from "./kantone-auslaenderrecht";

/* ══════════════════════════════════════════ TYPEN ══════════════════════════════════════════ */

export type Regime = "frei" | "meldung" | "bewilligung" | "unzulaessig" | "nicht_bestimmbar";
export type Arbeitsbeginn = "sofort" | "nach_meldung" | "nach_bewilligung" | "nie";
export type Sicherheit = "belegt" | "zu_bestaetigen" | "ungeklaert";

export type AuslaenderrechtEingabe = {
  staatsangehoerigkeitsgruppe: StaatsangehoerigkeitsGruppe | null;
  ausweisart: Aufenthaltsstatus | null;
  aufenthaltsgrund: Aufenthaltsgrund | null;
  ausweisGueltigBis: string | null;
  arbeitsortKanton: string | null;
  asylgesuchDatum: string | null;
  bundesasylzentrumVerlassen: boolean | null;
  arbeitsbeginnGeplant: string | null;
};

/** Ergebnisobjekt — genau die Felder aus Abschnitt 4 des Regelwerks. */
export type AuslaenderrechtErgebnis = {
  regime: Regime;
  arbeitsbeginn: Arbeitsbeginn;
  kostenpflichtig: boolean;
  regelNummer: string;
  sicherheit: Sicherheit;
  klaerung: string | null;
  hinweise: string[];
  zustaendigeStelle: string | null;
  meldekanal: string | null;
};

/* ══════════════════════════════════════════ TEXTZUORDNUNG (Abschnitt 6) ══════════════════════════════════════════
   Einzige Stelle, an der Regime-, Sperr-, Hinweis- und Klärungstexte stehen.
   Schlüssel sind stabil, Texte änderbar. */

/** 6.1 Regime. */
export const REGIME_TEXT: Record<Regime, string> = {
  frei: "Keine Bewilligung und keine Meldung erforderlich.",
  meldung: "Der Stellenantritt ist vor Arbeitsbeginn zu melden. Die Meldung ist kostenlos. Unmittelbar nach der Meldung darf gearbeitet werden.",
  bewilligung: "Für den Stellenantritt ist eine Bewilligung erforderlich. Sie ist kostenpflichtig. Die Arbeitsaufnahme darf erst nach Erteilung erfolgen.",
  unzulaessig: "Eine Anstellung ist nicht zulässig.",
  nicht_bestimmbar: "Das Verfahren lässt sich mit den erfassten Angaben nicht bestimmen.",
};

/** 6.2 Sperrgründe. */
export type SperrgrundSchluessel = "kein_ausweis" | "ausweis_abgelaufen" | "bundesasylzentrum" | "wartefrist_n";
export const SPERRGRUND_TEXT: Record<SperrgrundSchluessel, string> = {
  kein_ausweis: "Ohne gültigen Ausweis ist eine Anstellung nicht zulässig.",
  ausweis_abgelaufen: "Der Ausweis läuft vor dem geplanten Arbeitsbeginn ab.",
  bundesasylzentrum: "Eine Bewilligung ist erst möglich, wenn die Person das Bundesasylzentrum verlassen hat.",
  wartefrist_n: "In den ersten drei Monaten nach Einreichung des Asylgesuchs besteht ein Arbeitsverbot.",
};

/** Sperre → Sperrgrund. Das Ergebnisobjekt führt keinen eigenen Grund; er wird aus regelNummer abgeleitet. */
export const SPERRGRUND_ZU_REGEL: Record<"S1" | "S2" | "S3" | "S4", SperrgrundSchluessel> = {
  S1: "kein_ausweis",
  S2: "ausweis_abgelaufen",
  S3: "bundesasylzentrum",
  S4: "wartefrist_n",
};

/** 6.3 Hinweise. */
export const HINWEIS_TEXT: Record<string, string> = {
  ablauf_nah: "Der Ausweis läuft in weniger als 90 Tagen ab. Die Verlängerung frühzeitig anstossen.",
  kanton_unbekannt: "Für den Kanton des Arbeitsorts ist keine zuständige Stelle hinterlegt.",
  aufenthaltsgrund_fehlt: "Bei einem Ausweis B aus einem Drittstaat entscheidet der Aufenthaltsgrund über das Verfahren. Bitte erfassen.",
};

/** 6.4 Klärungen. */
export const KLAERUNG_TEXT: Record<string, string> = {
  meldung_kantonal_pruefen: "Ob eine Meldung erforderlich ist, ist kantonal zu prüfen.",
  stellenwechsel_pruefen: "Die Bewilligung ist an den bisherigen Arbeitgeber gebunden. Ob für den Stellenwechsel ein vereinfachtes Verfahren gilt, ist vor der Gesuchseinreichung zu klären.",
  branchenbeschraenkung_pruefen: "Der Kanton kann die Bewilligung auf einzelne Branchen beschränken.",
};

/** Zusatz bei nicht abschliessend belegter Einschätzung (Sicherheit ≠ belegt). */
export const SICHERHEIT_ZUSATZ = "Diese Einschätzung ist nicht abschliessend belegt. Vor dem Stellenantritt beim zuständigen Amt bestätigen lassen.";

/** Sperrgrundtext zu einer Sperren-Regelnummer; null bei anderen Regeln. */
export function sperrgrundText(regelNummer: string): string | null {
  const key = (SPERRGRUND_ZU_REGEL as Record<string, SperrgrundSchluessel>)[regelNummer];
  return key ? SPERRGRUND_TEXT[key] : null;
}

/* ══════════════════════════════════════════ DATUMS-HILFEN (rein, ohne new Date()) ══════════════════════════════════════════ */

type YMD = { y: number; m: number; d: number };

/** Parst "TT.MM.JJJJ" oder "JJJJ-MM-TT"; null bei ungültiger Eingabe. */
function parseDatum(s: string | null): YMD | null {
  if (!s) return null;
  const de = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(s.trim());
  if (de) return { y: +de[3], m: +de[2], d: +de[1] };
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (iso) return { y: +iso[1], m: +iso[2], d: +iso[3] };
  return null;
}

/** Tagesordinalzahl (days_from_civil, Howard Hinnant) — reine Ganzzahlarithmetik. */
function ordinal({ y, m, d }: YMD): number {
  const yy = m <= 2 ? y - 1 : y;
  const era = Math.floor((yy >= 0 ? yy : yy - 399) / 400);
  const yoe = yy - era * 400;
  const doy = Math.floor((153 * (m > 2 ? m - 3 : m + 9) + 2) / 5) + d - 1;
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
  return era * 146097 + doe - 719468;
}

/** a liegt echt vor b. */
function liegtVor(a: YMD, b: YMD): boolean {
  return ordinal(a) < ordinal(b);
}

/** YMD plus n Kalendermonate (Tag bleibt, Monatsüberlauf normalisiert). */
function plusMonate({ y, m, d }: YMD, n: number): YMD {
  const total = (y * 12 + (m - 1)) + n;
  return { y: Math.floor(total / 12), m: (total % 12) + 1, d };
}

/* ══════════════════════════════════════════ STUFE 1 — SPERREN ══════════════════════════════════════════ */

type Basis = Pick<AuslaenderrechtErgebnis, "regime" | "arbeitsbeginn" | "kostenpflichtig" | "regelNummer" | "sicherheit" | "klaerung" | "hinweise">;

function sperre(regelNummer: string): Basis {
  return { regime: "unzulaessig", arbeitsbeginn: "nie", kostenpflichtig: false, regelNummer, sicherheit: "belegt", klaerung: null, hinweise: [] };
}

/** Sperren in Reihenfolge S1, S2, S3, S4. Erste zutreffende gewinnt. */
function pruefeSperren(e: AuslaenderrechtEingabe): Basis | null {
  // S1 — kein gültiger Ausweis
  if (e.ausweisart === "keiner") return sperre("S1");

  const gueltig = parseDatum(e.ausweisGueltigBis);
  const beginn = parseDatum(e.arbeitsbeginnGeplant);
  const gesuch = parseDatum(e.asylgesuchDatum);

  // S2 — Ausweis läuft vor Arbeitsbeginn ab
  if (gueltig && beginn && liegtVor(gueltig, beginn)) return sperre("S2");

  // S3 — Ausweis N und Bundesasylzentrum nicht verlassen
  if (e.ausweisart === "N" && e.bundesasylzentrumVerlassen === false) return sperre("S3");

  // S4 — Ausweis N und Arbeitsbeginn vor Ablauf der dreimonatigen Wartefrist
  if (e.ausweisart === "N" && beginn && gesuch && liegtVor(beginn, plusMonate(gesuch, 3))) return sperre("S4");

  return null;
}

/* ══════════════════════════════════════════ STUFE 2 — REGELMATRIX ══════════════════════════════════════════ */

function regel(regelNummer: string, regime: Regime, arbeitsbeginn: Arbeitsbeginn, kostenpflichtig: boolean, sicherheit: Sicherheit, klaerung: string | null): Basis {
  return { regime, arbeitsbeginn, kostenpflichtig, regelNummer, sicherheit, klaerung, hinweise: [] };
}

/** Ist der Aufenthaltsgrund einer der drei entscheidungserheblichen Werte? */
function grundBekannt(g: Aufenthaltsgrund | null): g is "erwerbstaetigkeit" | "familiennachzug" | "asyl_anerkannt" {
  return g === "erwerbstaetigkeit" || g === "familiennachzug" || g === "asyl_anerkannt";
}

/**
 * Regelmatrix (Abschnitt 3). Reihenfolge: R01, R02, dann nach Spezifität —
 * C (R02) schlägt jede andere Regel. Nicht abgedeckt: Drittstaat + B mit
 * unbekanntem/anderem Grund → Z3 (nicht_bestimmbar, aufenthaltsgrund_fehlt).
 */
function pruefeMatrix(e: AuslaenderrechtEingabe): Basis {
  const g = e.staatsangehoerigkeitsgruppe;
  const a = e.ausweisart;

  // R01 — Schweiz, beliebig
  if (g === "schweiz") return regel("R01", "frei", "sofort", false, "belegt", null);
  // R02 — beliebig, C (Niederlassungsbewilligung schlägt alles)
  if (a === "C") return regel("R02", "frei", "sofort", false, "belegt", null);

  // Ausweis-spezifische Regeln
  switch (a) {
    case "B":
      if (g === "eu_efta") return regel("R03", "frei", "sofort", false, "belegt", null);
      if (g === "drittstaat") {
        if (e.aufenthaltsgrund === "familiennachzug") return regel("R06", "frei", "sofort", false, "zu_bestaetigen", "meldung_kantonal_pruefen");
        if (e.aufenthaltsgrund === "asyl_anerkannt") return regel("R07", "meldung", "nach_meldung", false, "belegt", null);
        if (e.aufenthaltsgrund === "erwerbstaetigkeit") return regel("R08", "bewilligung", "nach_bewilligung", true, "zu_bestaetigen", "stellenwechsel_pruefen");
        // Z3 — Grund unbekannt/anderer → nicht bestimmbar
        return { regime: "nicht_bestimmbar", arbeitsbeginn: "nie", kostenpflichtig: false, regelNummer: "Z3", sicherheit: "belegt", klaerung: null, hinweise: ["aufenthaltsgrund_fehlt"] };
      }
      break;
    case "L":
      if (g === "eu_efta") return regel("R04", "frei", "sofort", false, "belegt", null);
      if (g === "drittstaat") return regel("R09", "bewilligung", "nach_bewilligung", true, "belegt", null);
      break;
    case "G":
      if (g === "eu_efta") return regel("R05", "bewilligung", "nach_bewilligung", true, "belegt", null);
      if (g === "drittstaat") return regel("R10", "bewilligung", "nach_bewilligung", true, "belegt", null);
      break;
    case "F":
      return regel("R11", "meldung", "nach_meldung", false, "belegt", null);
    case "S":
      return regel("R12", "meldung", "nach_meldung", false, "belegt", null);
    case "N":
      return regel("R13", "bewilligung", "nach_bewilligung", true, "belegt", "branchenbeschraenkung_pruefen");
    // "keiner" ist bereits von S1 abgefangen; R14 wird nie erreicht.
  }

  // Nicht abgedeckt (z.B. Gruppe null bei B/L/G, oder keine Ausweisart) → nicht bestimmbar.
  return { regime: "nicht_bestimmbar", arbeitsbeginn: "nie", kostenpflichtig: false, regelNummer: "", sicherheit: "belegt", klaerung: null, hinweise: [] };
}

/* ══════════════════════════════════════════ SICHERHEIT ══════════════════════════════════════════ */

const SICHERHEIT_RANG: Record<Sicherheit, number> = { belegt: 0, zu_bestaetigen: 1, ungeklaert: 2 };

/** Die weniger belegte (höhere) der beiden Einschätzungen. */
function wenigerBelegt(a: Sicherheit, b: Sicherheit): Sicherheit {
  return SICHERHEIT_RANG[a] >= SICHERHEIT_RANG[b] ? a : b;
}

/* ══════════════════════════════════════════ HAUPTFUNKTION ══════════════════════════════════════════ */

/**
 * Auswertungsreihenfolge (Abschnitt 2): erst die vier Sperren in ihrer
 * Reihenfolge, dann die Matrix, dann die Zusatzprüfungen. Die erste zutreffende
 * Regel bestimmt regime und regelNummer; die Zusatzprüfungen ergänzen Hinweise.
 */
export function pruefeAuslaenderrecht(e: AuslaenderrechtEingabe): AuslaenderrechtErgebnis {
  // Stufe 1 — Sperren; Stufe 2 — Matrix
  const basis: Basis = pruefeSperren(e) ?? pruefeMatrix(e);

  // Stufe 3 — Zusatzprüfungen (ergänzend, unabhängig vom Regime)
  const hinweise = [...basis.hinweise];
  // Z1 — Ausweis läuft weniger als 90 Tage nach Arbeitsbeginn ab
  const gueltig = parseDatum(e.ausweisGueltigBis);
  const beginn = parseDatum(e.arbeitsbeginnGeplant);
  if (gueltig && beginn) {
    const diff = ordinal(gueltig) - ordinal(beginn);
    if (diff >= 0 && diff < 90) hinweise.push("ablauf_nah");
  }
  // Z2 — Kanton nicht in der Tabelle
  if (!kantonBekannt(e.arbeitsortKanton)) hinweise.push("kanton_unbekannt");

  // Kanton → zuständige Stelle, Meldekanal, Sicherheits-Deckelung
  const ausweisN = e.ausweisart === "N";
  const stelle = zustaendigeStelle(e.arbeitsortKanton, basis.regime, ausweisN);
  const kanal = meldekanal(e.arbeitsortKanton, basis.regime);
  const sicherheit = wenigerBelegt(basis.sicherheit, kantonSicherheit(e.arbeitsortKanton, basis.regime));

  return {
    regime: basis.regime,
    arbeitsbeginn: basis.arbeitsbeginn,
    kostenpflichtig: basis.kostenpflichtig,
    regelNummer: basis.regelNummer,
    sicherheit,
    klaerung: basis.klaerung,
    hinweise,
    zustaendigeStelle: stelle,
    meldekanal: kanal,
  };
}
