/**
 * WF-01 / WF-02: Rhythmus-Vorlagen — versionierte, config-getriebene Betreuungs-Rhythmen.
 *
 * Definition-Schicht (Stammdaten). Subjekt-agnostisch: funktioniert für
 * entitaet=angehoeriger UND entitaet=patient über dieselbe Struktur.
 *
 * Änderung = NEUE Version, alte auf archiviert. Gilt NUR für NEUE Subjekte;
 * laufende Instanzen behalten ihre Version.
 */

import type { DokumentBedingung } from "../stammdaten/dokumenttypen";

/* ══════════════════════════════════════════
   TYPEN
   ══════════════════════════════════════════ */

export type RhythmusEntitaet = "angehoeriger" | "patient";
export type VorlageStatus = "aktiv" | "archiviert";

export type SchrittTyp =
  | "schulung"
  | "kontrolle"
  | "fallbesprechung"
  | "reassessment"
  | "kombiniert"
  | "administration"
  | "klinisch"
  | "kommunikation";

export type TriggerTyp = "zeit_offset" | "nach_schritt";

export interface RhythmusSchritt {
  code: string;
  label: string;
  typ: SchrittTyp;
  /** Jetzt nur zeit_offset. nach_schritt strukturell angelegt, nicht ausgewertet. */
  triggerTyp: TriggerTyp;
  /** Offset in Monaten ab anker_datum (grob) */
  offsetMonate: number;
  /** Offset in Tagen ab anker_datum (fein, hat Vorrang wenn > 0) */
  offsetTage: number;
  /** Default-Verantwortliche/r für diesen Schritt */
  verantwortlich: string;
  /** Bedingung aus DokumentBedingung-Vokabular. Feld angelegt, NICHT ausgewertet. */
  bedingung: DokumentBedingung;
  /** Erledigen verlangt Protokoll-Eingabe */
  protokollPflicht: boolean;
}

export interface RhythmusVorlage {
  id: string;
  name: string;
  entitaet: RhythmusEntitaet;
  version: number;
  status: VorlageStatus;
  gueltigAb: string; // ISO date
  /** Subjekt-Datum, ab dem Offsets rechnen (z.B. "eintrittsdatum", "aufnahmedatum") */
  ankerDatum: string;
  schritte: RhythmusSchritt[];
}

/* ══════════════════════════════════════════
   SEED: Angehörigen-Vorlage "Betriebshandbuch Angehörige" v1
   ══════════════════════════════════════════ */

/**
 * Die Schritte des Patienten-Prozesses, die eine interRAI-Abklärung sind.
 * Bei BB16 ∈ {5, 6, 7} verlangt der Standard keine Abklärung; dann fallen
 * genau diese beiden Schritte weg. Codes statt Beschriftungen, damit die
 * Triage nicht auf Text vergleicht.
 */
export const INTERRAI_SCHRITTE = ["pp_01", "pp_11"] as const;

export const RHYTHMUS_VORLAGEN: RhythmusVorlage[] = [
  /* ── Angehörigen-Vorlage ── */
  {
    id: "rv-ang-001",
    name: "Betriebshandbuch Angehörige",
    entitaet: "angehoeriger",
    version: 1,
    status: "aktiv",
    gueltigAb: "2026-01-01",
    ankerDatum: "eintrittsdatum",
    schritte: [
      { code: "rk_m1", label: "Initialschulung + Regelkontrolle (Beobachtung)", typ: "kombiniert",      triggerTyp: "zeit_offset", offsetMonate: 1, offsetTage: 0,  verantwortlich: "Sandra Weber",  bedingung: "IMMER", protokollPflicht: true },
      { code: "rk_m2", label: "Mikroschulung",                                  typ: "schulung",        triggerTyp: "zeit_offset", offsetMonate: 2, offsetTage: 0,  verantwortlich: "Sandra Weber",  bedingung: "IMMER", protokollPflicht: true },
      { code: "rk_m3", label: "Fallbesprechung",                                typ: "fallbesprechung", triggerTyp: "zeit_offset", offsetMonate: 3, offsetTage: 0,  verantwortlich: "Sandra Weber",  bedingung: "IMMER", protokollPflicht: true },
      { code: "rk_m4", label: "Arbeitskontrolle + Mikroschulung",               typ: "kombiniert",      triggerTyp: "zeit_offset", offsetMonate: 4, offsetTage: 0,  verantwortlich: "Sandra Weber",  bedingung: "IMMER", protokollPflicht: true },
      { code: "rk_m6", label: "Reassessment",                                   typ: "reassessment",    triggerTyp: "zeit_offset", offsetMonate: 6, offsetTage: 0,  verantwortlich: "Sandra Weber",  bedingung: "IMMER", protokollPflicht: true },
    ],
  },

  /* ── Patient-Vorlage (15 Schritte, startet im Onboarding) ── */
  {
    id: "rv-pat-001",
    name: "Patient Prozess",
    entitaet: "patient",
    version: 1,
    status: "aktiv",
    gueltigAb: "2026-01-01",
    ankerDatum: "aufnahmedatum",
    schritte: [
      { code: "pp_01", label: "Erstassessment",                    typ: "klinisch",        triggerTyp: "zeit_offset", offsetMonate: 0, offsetTage: 0,  verantwortlich: "Sandra Weber",   bedingung: "IMMER", protokollPflicht: false },
      { code: "pp_02", label: "Arzt kontaktiert",                  typ: "kommunikation",   triggerTyp: "zeit_offset", offsetMonate: 0, offsetTage: 2,  verantwortlich: "Sandra Weber",   bedingung: "IMMER", protokollPflicht: false },
      { code: "pp_03", label: "Diagnose & Mediliste erhalten",     typ: "klinisch",        triggerTyp: "zeit_offset", offsetMonate: 0, offsetTage: 5,  verantwortlich: "Dr. M. Huber",   bedingung: "IMMER", protokollPflicht: false },
      { code: "pp_04", label: "KLV erfasst",                       typ: "administration",  triggerTyp: "zeit_offset", offsetMonate: 0, offsetTage: 7,  verantwortlich: "Kathrin Meier",  bedingung: "IMMER", protokollPflicht: false },
      { code: "pp_05", label: "KLV an Arzt gesendet",              typ: "kommunikation",   triggerTyp: "zeit_offset", offsetMonate: 0, offsetTage: 10, verantwortlich: "Kathrin Meier",  bedingung: "IMMER", protokollPflicht: false },
      { code: "pp_06", label: "KLV unterschrieben erhalten",       typ: "administration",  triggerTyp: "zeit_offset", offsetMonate: 0, offsetTage: 13, verantwortlich: "Dr. M. Huber",   bedingung: "IMMER", protokollPflicht: false },
      { code: "pp_07", label: "KLV an Versicherung gesendet",      typ: "administration",  triggerTyp: "zeit_offset", offsetMonate: 0, offsetTage: 15, verantwortlich: "System",         bedingung: "IMMER", protokollPflicht: false },
      { code: "pp_08", label: "Pflegeplan erstellt",                typ: "klinisch",        triggerTyp: "zeit_offset", offsetMonate: 0, offsetTage: 19, verantwortlich: "Sandra Weber",   bedingung: "IMMER", protokollPflicht: false },
      { code: "pp_09", label: "Angehörigen Mappe erstellt",        typ: "administration",  triggerTyp: "zeit_offset", offsetMonate: 0, offsetTage: 21, verantwortlich: "Sandra Weber",   bedingung: "IMMER", protokollPflicht: false },
      { code: "pp_10", label: "Pflegediagnose erstellt",            typ: "klinisch",        triggerTyp: "zeit_offset", offsetMonate: 0, offsetTage: 24, verantwortlich: "KI-Assistent",   bedingung: "IMMER", protokollPflicht: false },
      { code: "pp_11", label: "InterRAI erstellt",                  typ: "klinisch",        triggerTyp: "zeit_offset", offsetMonate: 0, offsetTage: 26, verantwortlich: "Sandra Weber",   bedingung: "IMMER", protokollPflicht: false },
      { code: "pp_12", label: "Medikamente erfasst",                typ: "klinisch",        triggerTyp: "zeit_offset", offsetMonate: 0, offsetTage: 28, verantwortlich: "Kathrin Meier",  bedingung: "IMMER", protokollPflicht: false },
      { code: "pp_13", label: "Medlink Schulung",                   typ: "schulung",        triggerTyp: "zeit_offset", offsetMonate: 1, offsetTage: 0,  verantwortlich: "System",         bedingung: "IMMER", protokollPflicht: false },
      { code: "pp_14", label: "Zeit nachgetragen",                  typ: "administration",  triggerTyp: "zeit_offset", offsetMonate: 1, offsetTage: 5,  verantwortlich: "Sandra Weber",   bedingung: "IMMER", protokollPflicht: false },
      { code: "pp_15", label: "SRK Schulung angemeldet",            typ: "schulung",        triggerTyp: "zeit_offset", offsetMonate: 1, offsetTage: 14, verantwortlich: "HR-Abteilung",   bedingung: "IMMER", protokollPflicht: false },
    ],
  },
];

/* ══════════════════════════════════════════
   LOOKUP
   ══════════════════════════════════════════ */

/**
 * Gibt die aktive Vorlage für eine Entität zurück.
 * Pro (name, entitaet) genau EINE aktive Version.
 */
export function getAktiveVorlage(entitaet: RhythmusEntitaet): RhythmusVorlage | null {
  return RHYTHMUS_VORLAGEN.find(v => v.entitaet === entitaet && v.status === "aktiv") ?? null;
}

/** Gibt eine Vorlage nach ID zurück (inkl. archivierte — für Instanz-Snapshot). */
export function getVorlageById(id: string): RhythmusVorlage | null {
  return RHYTHMUS_VORLAGEN.find(v => v.id === id) ?? null;
}

/**
 * Neue Version einer Vorlage erstellen. Alte wird archiviert.
 * Gilt NUR für NEUE Subjekte; laufende Instanzen behalten ihre Version.
 */
export function vorlageVersionieren(
  name: string,
  entitaet: RhythmusEntitaet,
  schritte: RhythmusSchritt[],
  ankerDatum?: string,
): RhythmusVorlage {
  // Bestehende aktive Version finden und archivieren
  const aktive = RHYTHMUS_VORLAGEN.find(v => v.name === name && v.entitaet === entitaet && v.status === "aktiv");
  const neueVersion = aktive ? aktive.version + 1 : 1;
  if (aktive) {
    aktive.status = "archiviert";
  }

  const neue: RhythmusVorlage = {
    id: `rv-${entitaet.slice(0, 3)}-${String(RHYTHMUS_VORLAGEN.length + 1).padStart(3, "0")}`,
    name,
    entitaet,
    version: neueVersion,
    status: "aktiv",
    gueltigAb: new Date().toISOString().slice(0, 10),
    ankerDatum: ankerDatum ?? aktive?.ankerDatum ?? "eintrittsdatum",
    schritte,
  };

  RHYTHMUS_VORLAGEN.push(neue);
  return neue;
}
