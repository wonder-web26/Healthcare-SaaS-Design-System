/**
 * Klinische Artefakte — Lead-Konvertierungs-Modell.
 *
 * Drei Artefakte mit dualer Container-Referenz:
 * - onboardingId: gesetzt während Onboarding, bleibt als historische Referenz
 * - patientId: null während Onboarding, gesetzt nach Konvertierung oder direkt
 *
 * HINWEIS: Item-Texte, CAP-Logik, NANDA-Diagnosen sind plausibel nachgebildet.
 */

// InterRAIAntwortOption was previously imported from lib/interrai/types.ts
// (now deleted). Inlined here since InterRAIItem still uses it.
export interface InterRAIAntwortOption {
  wert: string;
  bezeichnung: string;
  kurzLabel: string;
}

/* ══════════════════════════════════════════
   CONTAINER HELPERS
   ══════════════════════════════════════════ */

export type ArtefaktContainer = "onboarding" | "patient" | "konvertiert";

export function getArtefaktContainer(a: { onboardingId: string | null; patientId: string | null }): ArtefaktContainer {
  if (a.onboardingId && a.patientId) return "konvertiert";
  if (a.onboardingId) return "onboarding";
  return "patient";
}

/* ══════════════════════════════════════════
   INTERRAI HC ASSESSMENT
   Folgt dem Schema InterRAI HC Schweiz.
   Item-Texte sinngemäss formuliert.
   ══════════════════════════════════════════ */

export type AssessmentStatus = "in-bearbeitung" | "abgeschlossen";
export type AssessmentTyp = "erstassessment" | "re-assessment" | "ad-hoc";
export type ItemStatus = "erfasst" | "teilweise" | "offen";

export type AnnaKonfidenz = "hoch" | "mittel" | "niedrig";

export interface GespraechsBeleg {
  zitat: string;
  gespraechId: string;
  zeitstempel: string;
}

export interface InterRAIItem {
  id: string;
  assessmentId: string;
  code: string;
  sektion: string;
  sektionName: string;
  frageKurz: string;
  frageVoll: string;
  antwortTyp: "skala" | "ja_nein" | "text" | "zahl" | "datum";
  antwortOptionen: InterRAIAntwortOption[];
  antwortWert: string | number | null;
  validiert: boolean;
  ausGespraech: boolean;
  gespraechsBeleg: GespraechsBeleg | null;
  annaKonfidenz: AnnaKonfidenz | null;
  status: ItemStatus;
}

export interface CapResult {
  id: string;
  name: string;
  getriggert: boolean;
  triggerItems: string[];
  prioritaet: "hoch" | "mittel" | "niedrig";
  beschreibung: string;
}

export interface OutcomeScale {
  id: string;
  name: string;
  abkuerzung: string;
  wert: number;
  maxWert: number;
  interpretation: string;
  richtung: "hoeher-schlechter" | "hoeher-besser";
}

export interface InterRAIAssessment {
  id: string;
  onboardingId: string | null;
  patientId: string | null;
  patientName: string;
  typ: AssessmentTyp;
  status: AssessmentStatus;
  durchgefuehrtVon: string;
  startDatum: string;
  abschlussDatum: string | null;
  erfassungsgrad: number;
  items: InterRAIItem[];
  getriggerteCaps: CapResult[];
  outcomeScales: OutcomeScale[];
}

/* ══════════════════════════════════════════
   ARZT-ANFRAGE (eigenes Domain-Objekt)
   ══════════════════════════════════════════ */

/**
 * Architektur-Regel: Aktive Workflow-Schritte sind Fenster auf Domain-Objekte,
 * nie Besitzer von Logik. Die ArztAnfrage lebt als eigenes Objekt am Vorgang;
 * der Workflow-Schritt "Arzt kontaktiert" spiegelt ihren Status.
 */
export type ArztAnfrageStatus =
  | "wartet_auf_einwilligung"
  | "versandbereit"
  | "gesendet"
  | "antwort_erhalten"
  | "extrahiert";

export interface ArztAnfrage {
  id: string;
  /** Lead-Conversion IDs */
  onboardingId: string | null;
  patientId: string | null;
  status: ArztAnfrageStatus;
  empfaengerName: string;
  empfaengerEmail: string;
  gesendetAm: string | null;
  erinnertAm: string | null;
  antwortAm: string | null;
  /** Der tatsächlich gesendete Betreff (nach ggf. Bearbeitung) */
  gesendeterBetreff: string | null;
  /** Der tatsächlich gesendete Text (nach ggf. Bearbeitung) */
  gesendeterText: string | null;
}

/* ══════════════════════════════════════════
   ÄRZTLICHE DIAGNOSEN (eigenes Artefakt)
   ══════════════════════════════════════════ */

export type ArztDiagnoseStatus = "entwurf" | "bestaetigt";

export interface AerztlicheDiagnose {
  id: string;
  /** Lead-Conversion: Onboarding-ID (null nach Konversion) */
  onboardingId: string | null;
  /** Lead-Conversion: Patient-ID (null im laufenden Onboarding) */
  patientId: string | null;
  icdCode: string;
  bezeichnung: string;
  /** Herkunft: z.B. "Arzt-Antwort Dr. M. Huber, 03.06.2026" oder "Manuell erfasst, Sandra Weber, 01.03.2026" */
  quelle: string;
  status: ArztDiagnoseStatus;
}

/* Die Pflegeplanungs-Typen (Pflegediagnose, Pflegeziel, Massnahme,
   Pflegeplanung) sind mit der alten Pflegeplanung abgerissen — die neue
   Typwelt entsteht als eigenes Modul (Kette Diagnose → Ziel → Massnahme →
   Detailintervention → Leistungsposition). Siehe docs/schema-delta-pflegeplan.md. */

/* Die KLV-/LPB-Typen (KLVVerordnung, KLVLeistung, KLVStatus, KLVStatusEintrag,
   KLVDiagnose, KLVEinheit) sind mit dem alten KLV-/LPB-Modul abgerissen
   (Lauf 0b). Das Fachmodell ist in docs/lpb-fachmodell.md gesichert; der
   Neubau kommt in Lauf 6 aus dem Pflegeplan-Vertrag. */

/* ══════════════════════════════════════════
   WORKFLOW / ACTION PLAN
   ══════════════════════════════════════════ */

export interface WorkflowSchritt {
  nr: number;
  label: string;
  status: "offen" | "abgeschlossen";
  dueDate: string;
  dueDateDisplay: string;
  assignee: string;
  completedAt: string | null;
  overdue: boolean;
}

export type WorkflowTyp = "patient-prozess" | "angehoeriger-monate" | "angehoeriger-onboarding" | "angehoeriger-monatsschritte";

export interface WorkflowPlan {
  id: string;
  typ: WorkflowTyp;
  onboardingId: string | null;
  patientId: string | null;
  angehoerigerId: string | null;
  bezeichnung: string;
  schritte: WorkflowSchritt[];
}

