/**
 * interRAI Assessment — Data model for a concrete assessment instance.
 *
 * Architectural invariants:
 * - An assessment records which instrument version it was captured with.
 *   Answers reference item codes (strings), not object references, so that
 *   instrument updates never mutate historical assessments.
 * - Lifecycle: in_bearbeitung → abgeschlossen. Completed assessments are
 *   immutable; corrections create a new assessment.
 * - Every individual answer carries its provenance: manually entered or
 *   AI-suggested. For AI suggestions: a reference to the conversation
 *   evidence, whether/when/by whom it was confirmed, the original
 *   suggested value (preserved even after correction), and the final value.
 *
 * This provenance model is NOT optional and NOT retro-fittable. It is the
 * foundation for traceability of who documented which value.
 *
 * No persistence layer. In-memory for the prototype; structure is designed
 * so that a later database migration requires no structural change.
 */

// — Answer provenance ————————————————————————————————

export type AnswerSource = "manuell" | "ki_vorschlag";

export interface ConversationEvidence {
  /** ID of the recording/conversation session */
  gespraechId: string;
  /** Quoted excerpt from the transcript */
  zitat: string;
  /** ISO datetime of the transcript segment */
  zeitstempel: string;
}

export interface AnswerConfirmation {
  /** Who confirmed (login name) */
  bestaetigtVon: string;
  /** ISO datetime */
  bestaetigtAm: string;
  /** Was the AI-suggested value corrected during confirmation? */
  wertKorrigiert: boolean;
}

export interface AssessmentAnswer {
  /** Item or sub-item code (e.g. "C1", "G2a", "I2k") */
  itemCode: string;
  /** The current (final) answer value — code string or free text */
  wert: string | null;

  // — Provenance ——————————————————————————————————————

  /** How this answer was entered */
  herkunft: AnswerSource;
  /** For ki_vorschlag: conversation evidence */
  gespraechsBeleg: ConversationEvidence | null;
  /** For ki_vorschlag: the originally suggested value (preserved even after correction) */
  vorschlagswert: string | null;
  /** Confirmation record — null if not yet confirmed */
  bestaetigung: AnswerConfirmation | null;

  // — Timestamps ——————————————————————————————————————

  /** ISO datetime — when the answer was first set */
  erfasstAm: string;
  /** ISO datetime — last modification */
  geaendertAm: string;
}

// — Assessment lifecycle ————————————————————————————————

export type AssessmentStatus = "in_bearbeitung" | "abgeschlossen";

/**
 * Assessment occasion — maps to the official A8 answer codes.
 * Using the A8 code as the value so we can cross-reference.
 */
export type AssessmentAnlass =
  | "erstassessment"        // A8 = 1
  | "reassessment"          // A8 = 2
  | "wiedereintritt"        // A8 = 3
  | "statusaenderung"       // A8 = 4
  | "austritt"              // A8 = 5
  | "einsatzabbruch"        // A8 = 6
  | "andere";               // A8 = 7

export interface Assessment {
  /** Unique assessment ID */
  id: string;

  // — Instrument version snapshot ————————————————————

  /** Instrument code (always "HC_CH" for now) */
  instrumentCode: string;
  /** Instrument version string — frozen at creation time */
  instrumentVersion: string;

  // — Subject ————————————————————————————————————————

  /** During onboarding: the onboarding case ID */
  onboardingId: string | null;
  /** After conversion: the patient ID */
  patientId: string | null;
  /** Display name for UI convenience */
  patientName: string;

  // — Assessment metadata ———————————————————————————

  anlass: AssessmentAnlass;
  status: AssessmentStatus;
  /** Who initiated the assessment */
  erstelltVon: string;
  /** ISO date — when the assessment was started */
  erstelltAm: string;
  /** ISO date — when the assessment was completed (null if in progress) */
  abgeschlossenAm: string | null;
  /** Who completed the assessment (S1 in the instrument) */
  abgeschlossenVon: string | null;

  // — Answers ————————————————————————————————————————

  /** All answers, keyed by item/sub-item code for O(1) lookup */
  antworten: Record<string, AssessmentAnswer>;

  // — Computed results (populated by engine, stubs for now) ——

  /** Scale results — populated by the scales engine stub */
  skalenErgebnisse: Record<string, unknown>;
  /** CAP results — populated by the CAP engine stub */
  capErgebnisse: Record<string, unknown>;
}

// — Factory ——————————————————————————————————————————

let idCounter = 0;

export function createAssessment(params: {
  instrumentCode: string;
  instrumentVersion: string;
  onboardingId?: string | null;
  patientId?: string | null;
  patientName: string;
  anlass: AssessmentAnlass;
  erstelltVon: string;
}): Assessment {
  idCounter++;
  return {
    id: `IA-${Date.now()}-${idCounter}`,
    instrumentCode: params.instrumentCode,
    instrumentVersion: params.instrumentVersion,
    onboardingId: params.onboardingId ?? null,
    patientId: params.patientId ?? null,
    patientName: params.patientName,
    anlass: params.anlass,
    status: "in_bearbeitung",
    erstelltVon: params.erstelltVon,
    erstelltAm: new Date().toISOString(),
    abgeschlossenAm: null,
    abgeschlossenVon: null,
    antworten: {},
    skalenErgebnisse: {},
    capErgebnisse: {},
  };
}

// — Answer operations ————————————————————————————————

export function setAnswer(
  assessment: Assessment,
  itemCode: string,
  wert: string,
  herkunft: AnswerSource,
  gespraechsBeleg?: ConversationEvidence,
): AssessmentAnswer {
  if (assessment.status === "abgeschlossen") {
    throw new Error("Cannot modify a completed assessment");
  }

  const now = new Date().toISOString();
  const existing = assessment.antworten[itemCode];

  if (existing) {
    // Update existing answer
    existing.wert = wert;
    existing.geaendertAm = now;
    return existing;
  }

  // New answer
  const answer: AssessmentAnswer = {
    itemCode,
    wert,
    herkunft,
    gespraechsBeleg: gespraechsBeleg ?? null,
    vorschlagswert: herkunft === "ki_vorschlag" ? wert : null,
    bestaetigung: null,
    erfasstAm: now,
    geaendertAm: now,
  };

  assessment.antworten[itemCode] = answer;
  return answer;
}

export function confirmAnswer(
  assessment: Assessment,
  itemCode: string,
  bestaetigtVon: string,
  korrigierterWert?: string,
): void {
  if (assessment.status === "abgeschlossen") {
    throw new Error("Cannot modify a completed assessment");
  }

  const answer = assessment.antworten[itemCode];
  if (!answer) throw new Error(`No answer for item ${itemCode}`);

  const wertKorrigiert = korrigierterWert !== undefined && korrigierterWert !== answer.wert;
  if (wertKorrigiert && korrigierterWert !== undefined) {
    // Keep the original suggestion, update the current value
    answer.wert = korrigierterWert;
  }

  answer.bestaetigung = {
    bestaetigtVon,
    bestaetigtAm: new Date().toISOString(),
    wertKorrigiert,
  };
  answer.geaendertAm = new Date().toISOString();
}

export function completeAssessment(
  assessment: Assessment,
  abgeschlossenVon: string,
): void {
  if (assessment.status === "abgeschlossen") {
    throw new Error("Assessment is already completed");
  }
  assessment.status = "abgeschlossen";
  assessment.abgeschlossenAm = new Date().toISOString();
  assessment.abgeschlossenVon = abgeschlossenVon;
}
