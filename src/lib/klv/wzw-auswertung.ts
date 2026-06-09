/**
 * WZW-Auswertung — Begründungs-Entwürfe pro KLV-Leistungsposition.
 *
 * WZW = Wirtschaftlichkeit, Zweckmässigkeit, Wirksamkeit.
 * Krankenkassen prüfen im Controlling jede Position gegen diese drei Kriterien.
 *
 * ⚠️ HAFTUNGS-VORBEHALT
 * Diese Engine ERSTELLT Begründungs-Entwürfe und ZEIGT Lücken.
 * Sie BESTÄTIGT NICHT, dass WZW-Kriterien erfüllt sind.
 * Keine Stelle darf die Formulierungen "WZW erfüllt", "konform",
 * "geprüft" oder "freigegeben" verwenden. Die Auswertung stellt
 * Begründungen bereit und zeigt Lücken; sie bescheinigt keine
 * Prüfsicherheit.
 *
 * ⚠️ MOCK / MACHBARKEITSNACHWEIS
 * Die Begründungstexte werden im Demo-System deterministisch aus
 * den vorhandenen Fakten (Diagnosen, Zeiten, Ziele) zusammengesetzt.
 * In Produktion würde ein LLM die Formulierung übernehmen, die
 * Faktensammlung (Schritt 1) bleibt identisch.
 *
 * Architektur: zweistufig
 *   1. Deterministische Faktensammlung pro Position (kein LLM)
 *   2. Mock-Formulierung aus den gesammelten Fakten
 */

import type { KLVLeistung, Pflegediagnose, Massnahme, Pflegeziel } from "../../types/klinische-artefakte";
import { SPITEX_LEISTUNGSKATALOG_2025 } from "./spitex-leistungskatalog-2025";
import { pruefeInklusiv } from "./inklusiv-regeln";
import { pruefeKassenregeln, type KassenregelTreffer } from "./kassenregeln";

/* ── Typen ─────────────────────────────────────────── */

export type WZWStatus =
  | "begruendbar"        // Diagnose zugeordnet, WZW-Text möglich
  | "vorschlag"          // Keine Zuordnung, aber Anna schlägt passende Diagnose vor
  | "luecke";            // Keine passende Diagnose vorhanden

export interface WZWVorschlagDiagnose {
  diagnoseId: string;
  nandaCode: string;
  titel: string;
}

export interface WZWErgebnis {
  leistungId: string;
  klvNummer: string;
  bezeichnung: string;
  status: WZWStatus;

  /** Zugeordnete Diagnose (wenn vorhanden) */
  diagnose: { id: string; nandaCode: string; titel: string; begruendung: string } | null;
  /** Massnahmen der zugeordneten Diagnose */
  massnahmen: Massnahme[];
  /** Ziele der zugeordneten Diagnose */
  ziele: Pflegeziel[];

  /** Zeit-Vergleich: erfasst vs. Katalog-Richtwert */
  zeitMin: number;
  katalogZeitMin: number | null;
  zeitAbweichung: boolean;

  /** Inklusiv- und Kassenregel-Treffer */
  inklusivHinweis: string | null;
  kassenregelTreffer: KassenregelTreffer[];

  /** Der formulierte WZW-Dreisatz (null bei "luecke") */
  wzwText: string | null;

  /** Anna-Vorschlag: passende Diagnose zur Verknüpfung (nur bei status "vorschlag") */
  vorschlagDiagnose: WZWVorschlagDiagnose | null;
  /** Bedingter WZW-Text, der bei Annahme des Vorschlags gesetzt wird */
  vorschlagWzwText: string | null;
}

/* ── Zuordnungslogik (Mock) ──────────────────────────
 *
 * Für den Demo-Betrieb definieren wir, welche Leistungspositionen
 * fachlich zu welchen Pflegediagnosen passen. In Produktion käme
 * diese Zuordnung aus einem LLM oder einer regelbasierten Engine.
 */

const FACHLICHE_ZUORDNUNG: Record<string, string[]> = {
  // KLV-Nummer → passende NANDA-Codes
  "10505": ["00155", "00085"],       // Hilfe beim Gehen → Sturzgefahr, Mobilität
  "10104": ["00108"],                // Teilwäsche → Selbstpflegedefizit Körperpflege
  "10114": ["00108"],                // An-/Auskleiden → Selbstpflegedefizit Körperpflege
  "10602": ["00078"],                // Medikamente → Ineffektives Gesundheitsmanagement
  "10802": ["00078", "00241"],       // Blutdruckmessung → Gesundheitsmanagement, Stimmung
  "10808": ["00078"],                // Kapillarblut/Glucose → Gesundheitsmanagement
  "10110": ["00078"],                // Nägel Diabetiker → Gesundheitsmanagement
  "10801": ["00078"],                // Gesundheitskontrolle → Gesundheitsmanagement
  "10909": ["00155", "00085", "00078"], // Pflegeanleitung → diverse
};

/**
 * Findet eine passende Diagnose für eine Leistung aus dem Vorgang.
 * Verwendet die fachliche Zuordnungstabelle.
 */
function findPassendeDiagnose(
  klvNummer: string,
  diagnosen: Pflegediagnose[],
): Pflegediagnose | null {
  const passendeCodes = FACHLICHE_ZUORDNUNG[klvNummer];
  if (!passendeCodes) return null;
  for (const code of passendeCodes) {
    const d = diagnosen.find(diag => diag.nandaCode === code);
    if (d) return d;
  }
  return null;
}

/* ── Formulierungshilfen ─────────────────────────── */

function formuliereZweckmaessigkeit(
  diagnose: Pflegediagnose,
  bezeichnung: string,
): string {
  return `Zweckmässigkeit: Begründet durch ${diagnose.nandaCode} ${diagnose.titel} – ${diagnose.begruendung}`;
}

function formuliereWirtschaftlichkeit(
  zeitMin: number,
  katalogZeitMin: number | null,
): string {
  if (katalogZeitMin === null) {
    return `Wirtschaftlichkeit: ${zeitMin} min pro Einsatz (kein Katalog-Richtwert vorhanden).`;
  }
  if (zeitMin === katalogZeitMin) {
    return `Wirtschaftlichkeit: ${zeitMin} min entspricht dem Katalog-Richtwert.`;
  }
  if (zeitMin <= katalogZeitMin) {
    return `Wirtschaftlichkeit: ${zeitMin} min liegt unter dem Katalog-Richtwert von ${katalogZeitMin} min.`;
  }
  return `Wirtschaftlichkeit: ${zeitMin} min statt Katalog-Richtwert ${katalogZeitMin} min – Abweichung bitte begründen.`;
}

function formuliereWirksamkeit(
  ziele: Pflegeziel[],
): string {
  if (ziele.length === 0) {
    return "Wirksamkeit: Kein messbares Ziel zugeordnet – bitte Pflegeplanung ergänzen.";
  }
  const ziel = ziele[0];
  return `Wirksamkeit: Messbar über Ziel «${ziel.titel}» (${ziel.zeithorizont}: ${ziel.messbar}).`;
}

function formuliereWZWText(
  diagnose: Pflegediagnose,
  bezeichnung: string,
  zeitMin: number,
  katalogZeitMin: number | null,
  ziele: Pflegeziel[],
): string {
  const z = formuliereZweckmaessigkeit(diagnose, bezeichnung);
  const w = formuliereWirtschaftlichkeit(zeitMin, katalogZeitMin);
  const wk = formuliereWirksamkeit(ziele);
  return `${z}\n${w}\n${wk}`;
}

/* ── Haupt-Funktion ──────────────────────────────── */

/**
 * Erzeugt WZW-Begründungs-Entwürfe für alle Leistungspositionen.
 *
 * Rein deterministisch: sammelt Fakten, formuliert aus Vorlage.
 * Anna erfindet NIEMALS eine Indikation.
 */
export function erzeugeWZWAuswertung(
  leistungen: KLVLeistung[],
  diagnosen: Pflegediagnose[],
  massnahmen: Massnahme[],
  ziele: Pflegeziel[],
  krankenkasse: string,
): WZWErgebnis[] {
  const alleNummern = leistungen.map(l => l.klvNummer);

  return leistungen.map(l => {
    const katalogPos = SPITEX_LEISTUNGSKATALOG_2025.find(p => p.nr === l.klvNummer);
    const katalogZeitMin = katalogPos?.zeitMin ?? null;
    const zeitAbweichung = katalogZeitMin !== null && l.zeitMin > katalogZeitMin;

    // Inklusiv + Kassenregeln
    const inklusivTreffer = pruefeInklusiv(l.klvNummer, alleNummern);
    const kassenTreffer = pruefeKassenregeln(l, krankenkasse);

    // Diagnose-Zuordnung: erst bestehende, dann Vorschlag
    const zugeordneteDiagnoseId = l.diagnoseIds[0] || null;
    const zugeordneteDiagnose = zugeordneteDiagnoseId
      ? diagnosen.find(d => d.id === zugeordneteDiagnoseId) ?? null
      : null;

    const diagMassnahmen = zugeordneteDiagnose
      ? massnahmen.filter(m => m.bezugDiagnoseId === zugeordneteDiagnose.id)
      : [];
    const diagZiele = zugeordneteDiagnose
      ? ziele.filter(z => z.bezugDiagnoseId === zugeordneteDiagnose.id)
      : [];

    // Fall A: Diagnose zugeordnet → vollständiger WZW-Text
    if (zugeordneteDiagnose) {
      return {
        leistungId: l.id,
        klvNummer: l.klvNummer,
        bezeichnung: l.bezeichnung,
        status: "begruendbar" as const,
        diagnose: {
          id: zugeordneteDiagnose.id,
          nandaCode: zugeordneteDiagnose.nandaCode,
          titel: zugeordneteDiagnose.titel,
          begruendung: zugeordneteDiagnose.begruendung,
        },
        massnahmen: diagMassnahmen,
        ziele: diagZiele,
        zeitMin: l.zeitMin,
        katalogZeitMin,
        zeitAbweichung,
        inklusivHinweis: inklusivTreffer
          ? `Inklusive in ${inklusivTreffer.hauptBezeichnung} (${inklusivTreffer.hauptNr})`
          : null,
        kassenregelTreffer: kassenTreffer,
        wzwText: formuliereWZWText(
          zugeordneteDiagnose,
          l.bezeichnung,
          l.zeitMin,
          katalogZeitMin,
          diagZiele,
        ),
        vorschlagDiagnose: null,
        vorschlagWzwText: null,
      };
    }

    // Keine Zuordnung — versuche Vorschlag
    const passendeDiagnose = findPassendeDiagnose(l.klvNummer, diagnosen);

    if (passendeDiagnose) {
      // Fall B: Anna schlägt Verknüpfung vor
      const vorschlagMassnahmen = massnahmen.filter(m => m.bezugDiagnoseId === passendeDiagnose.id);
      const vorschlagZiele = ziele.filter(z => z.bezugDiagnoseId === passendeDiagnose.id);

      return {
        leistungId: l.id,
        klvNummer: l.klvNummer,
        bezeichnung: l.bezeichnung,
        status: "vorschlag" as const,
        diagnose: null,
        massnahmen: [],
        ziele: [],
        zeitMin: l.zeitMin,
        katalogZeitMin,
        zeitAbweichung,
        inklusivHinweis: inklusivTreffer
          ? `Inklusive in ${inklusivTreffer.hauptBezeichnung} (${inklusivTreffer.hauptNr})`
          : null,
        kassenregelTreffer: kassenTreffer,
        wzwText: null,
        vorschlagDiagnose: {
          diagnoseId: passendeDiagnose.id,
          nandaCode: passendeDiagnose.nandaCode,
          titel: passendeDiagnose.titel,
        },
        vorschlagWzwText: formuliereWZWText(
          passendeDiagnose,
          l.bezeichnung,
          l.zeitMin,
          katalogZeitMin,
          vorschlagZiele,
        ),
      };
    }

    // Fall C: Keine passende Diagnose → Lücke
    return {
      leistungId: l.id,
      klvNummer: l.klvNummer,
      bezeichnung: l.bezeichnung,
      status: "luecke" as const,
      diagnose: null,
      massnahmen: [],
      ziele: [],
      zeitMin: l.zeitMin,
      katalogZeitMin,
      zeitAbweichung,
      inklusivHinweis: inklusivTreffer
        ? `Inklusive in ${inklusivTreffer.hauptBezeichnung} (${inklusivTreffer.hauptNr})`
        : null,
      kassenregelTreffer: kassenTreffer,
      wzwText: null,
      vorschlagDiagnose: null,
      vorschlagWzwText: null,
    };
  });
}
