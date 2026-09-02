/**
 * Freigabe des Vertragsschritts — Abschnitt 7a des Regelwerks (Fassung 1.3).
 *
 * Das Regime allein sperrt nicht; es bestimmt, was dokumentiert sein muss,
 * bevor der Vertragsschritt freigegeben wird. Diese Datei ist die **einzige**
 * Stelle, an der die Freigabe bestimmt wird — sowohl der Wizard (Sperre) als
 * auch die Sperranzeige (Grund) lesen von hier.
 *
 * Rein und ohne UI-Abhängigkeit: der Nachweis wird als schmales Objekt
 * übergeben, nicht das Formular.
 */
import { sperrgrundText, KLAERUNG_TEXT, SICHERHEIT_ZUSATZ, type AuslaenderrechtErgebnis, type Regime } from "./auslaenderrecht";
import type { StaatsangehoerigkeitsGruppe } from "../stammdaten/staatsangehoerigkeit";

/** Grundtexte der regime-abhängigen Gate-Sperre (Abschnitt 6/7a). */
const GATE_SPERRE_MELDUNG = "Der Stellenantritt ist vor Arbeitsbeginn zu melden.";
const GATE_SPERRE_BEWILLIGUNG = "Die Bewilligung ist vor Arbeitsbeginn zu beantragen.";

function belegt(v: string | null): boolean {
  return !!v && v.trim().length > 0;
}

export type Nachweis = {
  /** Meldedatum (Regime meldung). */
  meldungDatum: string | null;
  /** Einreichungsdatum der Bewilligung (Regime bewilligung). */
  einreichungsdatum: string | null;
};

/**
 * Bestimmt, ob der Vertragsschritt gesperrt ist, und den Grund im Klartext.
 * - frei / nicht_bestimmbar → frei (nicht_bestimmbar erzeugt separat eine Aufgabe).
 * - meldung → frei, sobald ein Meldedatum vorliegt.
 * - bewilligung → frei, sobald ein Einreichungsdatum vorliegt.
 * - unzulaessig → dauerhaft gesperrt, Grund aus Abschnitt 6.2.
 */
export function vertragFreigabe(
  ergebnis: AuslaenderrechtErgebnis,
  nachweis: Nachweis,
): { gesperrt: boolean; grund: string | null } {
  switch (ergebnis.regime) {
    case "unzulaessig":
      return { gesperrt: true, grund: sperrgrundText(ergebnis.regelNummer) };
    case "meldung":
      return belegt(nachweis.meldungDatum)
        ? { gesperrt: false, grund: null }
        : { gesperrt: true, grund: GATE_SPERRE_MELDUNG };
    case "bewilligung":
      return belegt(nachweis.einreichungsdatum)
        ? { gesperrt: false, grund: null }
        : { gesperrt: true, grund: GATE_SPERRE_BEWILLIGUNG };
    default:
      return { gesperrt: false, grund: null };
  }
}

/** Der Spezialbewilligungs-Schritt wird zum Nachweisschritt: bei meldung und bewilligung. */
export function zeigeNachweisschritt(regime: Regime): boolean {
  return regime === "meldung" || regime === "bewilligung";
}

/* ══════════════════════════════════════════ AUFENTHALTSBLOCK — FELDWEISE SICHTBARKEIT ══════════════════════════════════════════ */

/** Welche Felder des Aufenthaltsblocks sind sichtbar — an genau einer Stelle bestimmt (Lauf 5, §1). */
export type AufenthaltSichtbarkeit = {
  grund: boolean;
  asylgesuch: boolean;
  bundesasylzentrum: boolean;
  einreise: boolean;
  zemis: boolean;
  ablauf: boolean;
  /** Der Block erscheint nur, wenn mindestens ein Feld sichtbar ist. */
  block: boolean;
};

export function aufenthaltSichtbarkeit(
  gruppe: StaatsangehoerigkeitsGruppe | null,
  ausweisart: string,
  regime: Regime,
): AufenthaltSichtbarkeit {
  const nichtCnochKeiner = ausweisart !== "C" && ausweisart !== "keiner";
  const felder = {
    grund: gruppe === "drittstaat" && ausweisart === "B",
    asylgesuch: ausweisart === "N",
    bundesasylzentrum: ausweisart === "N",
    // Einreisedatum (nicht Pflicht): nur wo ein Bewilligungsverfahren läuft und nicht bei N —
    // bei N zählt das Datum des Asylgesuchs, nicht die Einreise.
    einreise: regime === "bewilligung" && ausweisart !== "N",
    // ZEMIS-Nummer wird ausschliesslich für das SEM-Meldeformular gebraucht → nur bei Meldung.
    zemis: regime === "meldung",
    ablauf: nichtCnochKeiner,
  };
  const block = felder.grund || felder.asylgesuch || felder.bundesasylzentrum || felder.einreise || felder.zemis || felder.ablauf;
  return { ...felder, block };
}

/* ══════════════════════════════════════════ EINE WARNUNG STATT ZWEI ══════════════════════════════════════════ */

/**
 * Zusammengelegte Warnung (Lauf 5, §5) — an genau einer Stelle bestimmt:
 * - Klärung UND Sicherheit ≠ belegt → Klärung + „…bestätigen lassen".
 * - keine Klärung, Sicherheit ≠ belegt → allgemeiner Zusatz.
 * - Klärung bei Sicherheit = belegt → Klärung ohne Zusatz.
 * - sonst → keine Warnung.
 */
export function aufenthaltWarnung(ergebnis: AuslaenderrechtErgebnis): string | null {
  const klaerung = ergebnis.klaerung ? KLAERUNG_TEXT[ergebnis.klaerung] ?? null : null;
  const unbelegt = ergebnis.sicherheit !== "belegt";
  if (klaerung && unbelegt) return `${klaerung} Vor dem Stellenantritt beim zuständigen Amt bestätigen lassen.`;
  if (!klaerung && unbelegt) return SICHERHEIT_ZUSATZ;
  if (klaerung && !unbelegt) return klaerung;
  return null;
}

/**
 * Aufgabe bei der Konvertierung, wenn das Verfahren nicht bestimmbar ist
 * (Regelwerk 7a: keine Sperre, aber eine sichtbare Aufgabe zur Nachklärung).
 * Der Hinweis nennt die fehlende Angabe. Null bei jedem anderen Regime.
 */
export function nichtBestimmbarAufgabe(ergebnis: AuslaenderrechtErgebnis): { titel: string; hinweis: string } | null {
  if (ergebnis.regime !== "nicht_bestimmbar") return null;
  const hinweis = ergebnis.hinweise.includes("aufenthaltsgrund_fehlt")
    ? "Der Aufenthaltsgrund bei Ausweis B aus einem Drittstaat ist nicht erfasst."
    : "Die Staatsangehörigkeit ist keiner Gruppe (EU/EFTA/Drittstaat) zugeordnet.";
  return { titel: "Ausländerrechtliches Verfahren ungeklärt", hinweis };
}
