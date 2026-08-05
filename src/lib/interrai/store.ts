/**
 * interRAI Assessment Store
 *
 * Person-centric, in-memory store for the new interRAI HC assessments.
 * A Person carries lifecycle state (mandat | patient). An assessment
 * references a person by stable personId — it never changes when the
 * person's state transitions from mandat to patient.
 *
 * Survives navigation within a session. Lost on page reload (no
 * persistence layer in the prototype).
 */

import {
  getInputFieldsForBereich,
  getInputFieldStats,
  evaluateSkipLogic,
  getItem,
} from "./instrument";
import { dateZuIso } from "../datum";

// ── Types ────────────────────────────────────────────────────────────────────

export type PersonZustand = "mandat" | "patient";

export interface Person {
  id: string;
  vorname: string;
  nachname: string;
  zustand: PersonZustand;
  /** Onboarding case ID, if the person entered through onboarding */
  onboardingId?: string;
  /** Patient record ID, assigned during or after onboarding */
  patientId?: string;
}

/** Assessment occasion — values correspond to item A8 in the seed. */
export type AssessmentAnlass =
  | "erstabklaerung"      // A8=1
  | "re_assessment"       // A8=2
  | "wiedereintritt"      // A8=3
  | "statusaenderung"     // A8=4
  | "austritt"            // A8=5
  | "einsatzabbruch"      // A8=6
  | "andere";             // A8=7
export type AssessmentStatus = "in_bearbeitung" | "abgeschlossen";

/** An unconfirmed AI suggestion for a single field. */
export interface Vorschlag {
  /** The input field code this suggestion targets */
  feldCode: string;
  /** The suggested answer value — a valid option code for this field */
  vorpigeschlagenerWert: string;
  /** ID of the conversation segment this suggestion was derived from */
  gespraechAbschnittId: string;
  /** When the suggestion was generated (ISO datetime) */
  erfasstAm: string;
}

/** A confirmed (approved) suggestion — moves from vorschlaege to answers. */
export interface Bestaetigung {
  feldCode: string;
  bestaetigtVon: string;
  bestaetigtAm: string;
  /** Whether the value was corrected during confirmation */
  wertKorrigiert: boolean;
  /** Original suggestion value, preserved even after correction */
  originalVorschlag: string;
  /** A value that was manually entered BEFORE this decision and then replaced
   *  by a different confirmed value (i.e. a deviation resolved in favour of the
   *  suggestion). Preserved immutably, like originalVorschlag. Null when the
   *  confirmed value equals the prior manual value or there was none. */
  manuellerVorwert: string | null;
  /** ID of the conversation segment this suggestion was derived from */
  gespraechAbschnittId: string;
}

/** A recorded conversation segment. */
export interface GespraechAbschnitt {
  id: string;
  sprecher: "pfk" | "klient" | "angehoerige";
  sprecherName: string;
  /** Timestamp within the recording, e.g. "00:02:15" */
  zeitmarke: string;
  text: string;
}

export interface NeuAssessment {
  id: string;
  personId: string;
  anlass: AssessmentAnlass;
  status: AssessmentStatus;
  erstelltAm: string;
  zuletztBearbeitetAm: string;
  /** Confirmed answers — only these count as filled fields */
  answers: Record<string, string | null>;
  /** Unconfirmed AI suggestions — keyed by field code.
   *  These do NOT count as filled and do NOT reduce open field count. */
  vorschlaege: Record<string, Vorschlag>;
  /** Confirmations for suggestions that were approved */
  bestaetigungen: Record<string, Bestaetigung>;
  /** Linked conversation ID, if any */
  gespraechId: string | null;
  /** True once the conversation has been processed and suggestions are
   *  ready for review. Starts false; set to true after recording stops. */
  vorschlaegeVerfuegbar: boolean;
  /** ISO datetime of completion, null while in progress */
  abgeschlossenAm: string | null;
  /** Name of the person who completed the assessment */
  abgeschlossenVon: string | null;
}

/** Returns true if the assessment is completed and immutable. */
export function istAbgeschlossen(a: NeuAssessment): boolean {
  return a.status === "abgeschlossen";
}

// ── Suggestion classification ────────────────────────────────────────────────

/** Classification of a suggestion against the current answer state. */
export type VorschlagZustand = "abweichung" | "neuer_wert" | "gestuetzt";

export interface KlassifizierterVorschlag {
  feldCode: string;
  zustand: VorschlagZustand;
  vorschlag: Vorschlag;
  /** Present only for abweichung / gestuetzt — the manually entered value */
  manuellerWert?: string;
}

/**
 * Classifies every suggestion against the current answer state.
 * Recomputed on every call — never cached.
 */
export function klassifiziereVorschlaege(assessment: NeuAssessment): {
  abweichungen: KlassifizierterVorschlag[];
  neueWerte: KlassifizierterVorschlag[];
  gestuetzt: KlassifizierterVorschlag[];
} {
  const abweichungen: KlassifizierterVorschlag[] = [];
  const neueWerte: KlassifizierterVorschlag[] = [];
  const gestuetzt: KlassifizierterVorschlag[] = [];

  for (const [code, v] of Object.entries(assessment.vorschlaege)) {
    const current = assessment.answers[code];
    if (current != null && current !== "") {
      if (current === v.vorpigeschlagenerWert) {
        gestuetzt.push({ feldCode: code, zustand: "gestuetzt", vorschlag: v, manuellerWert: current });
      } else {
        abweichungen.push({ feldCode: code, zustand: "abweichung", vorschlag: v, manuellerWert: current });
      }
    } else {
      neueWerte.push({ feldCode: code, zustand: "neuer_wert", vorschlag: v });
    }
  }

  return { abweichungen, neueWerte, gestuetzt };
}

/** Makes suggestions available for review (called after recording stops). */
export function revealVorschlaege(assessmentId: string): void {
  const a = assessments.get(assessmentId);
  if (!a || istAbgeschlossen(a)) return;
  a.vorschlaegeVerfuegbar = true;
}

// ── In-memory stores ─────────────────────────────────────────────────────────

const persons = new Map<string, Person>();
const assessments = new Map<string, NeuAssessment>();

/** Conversation segments store — keyed by gespraechId */
const gespraeche = new Map<string, GespraechAbschnitt[]>();

// ── Demo seed ────────────────────────────────────────────────────────────────

import { GESPRAECH_HUBER } from "./demo/gespraech-huber";
import { VORSCHLAEGE_HUBER } from "./demo/vorschlaege-huber";

function initDemo() {
  // Fritz Huber — mandate in onboarding, not yet converted
  persons.set("PERS-001", {
    id: "PERS-001",
    vorname: "Fritz",
    nachname: "Huber",
    zustand: "mandat",
    onboardingId: "OB-2026-009",
  });

  // Anna Müller — active patient, already converted
  persons.set("PERS-002", {
    id: "PERS-002",
    vorname: "Anna",
    nachname: "Müller",
    zustand: "patient",
    patientId: "P-2026-0041",
  });

  // Walter Frei entfernt — hing an OB-2026-011, einer Kennung ausserhalb des
  // Fallverzeichnisses. Seine Bedarfsabklärung BA-2026-030 ist mit entfallen.

  // Register conversation
  gespraeche.set("GES-HUBER-001", GESPRAECH_HUBER);

  // Build vorschlaege map from demo data
  const vorschlaegeMap: Record<string, Vorschlag> = {};
  for (const v of VORSCHLAEGE_HUBER) {
    vorschlaegeMap[v.feldCode] = v;
  }

  // Fritz Huber: Erstabklärung with AI suggestions from conversation
  assessments.set("NEU-ASS-001", {
    id: "NEU-ASS-001",
    personId: "PERS-001",
    anlass: "erstabklaerung",
    status: "in_bearbeitung",
    erstelltAm: "2026-02-28T10:00:00",
    zuletztBearbeitetAm: "2026-03-01T14:30:00",
    answers: {},
    vorschlaege: vorschlaegeMap,
    bestaetigungen: {},
    gespraechId: "GES-HUBER-001",
    vorschlaegeVerfuegbar: false,
    abgeschlossenAm: null,
    abgeschlossenVon: null,
  });

  // Anna Müller: Erstabklärung — no suggestions (both states in demo)
  assessments.set("NEU-ASS-002", {
    id: "NEU-ASS-002",
    personId: "PERS-002",
    anlass: "erstabklaerung",
    status: "in_bearbeitung",
    erstelltAm: "2026-02-15T09:00:00",
    zuletztBearbeitetAm: "2026-02-28T16:00:00",
    answers: {},
    vorschlaege: {},
    bestaetigungen: {},
    gespraechId: null,
    vorschlaegeVerfuegbar: false,
    abgeschlossenAm: null,
    abgeschlossenVon: null,
  });
}

initDemo();

// ── Person API ───────────────────────────────────────────────────────────────

export function getPerson(id: string): Person | undefined {
  return persons.get(id);
}

export function getPersonByOnboardingId(obId: string): Person | undefined {
  for (const p of persons.values()) {
    if (p.onboardingId === obId) return p;
  }
  return undefined;
}

/**
 * Returns the person linked to an onboarding case, creating a lightweight
 * mandate person on first use if none was seeded. This keeps the InterRAI
 * tab actionable for every onboarding — a Bedarfsabklärung can be created for
 * the patient of any case, not only the two demo cases that ship with a
 * seeded person. The assessment-creation path itself stays the single
 * createAssessment() below; this only ensures a person to attach it to.
 */
export function getOrCreatePersonForOnboarding(
  obId: string,
  vorname: string,
  nachname: string,
): Person {
  const existing = getPersonByOnboardingId(obId);
  if (existing) return existing;
  const id = `PERS-${String(persons.size + 1).padStart(3, "0")}`;
  const p: Person = { id, vorname, nachname, zustand: "mandat", onboardingId: obId };
  persons.set(id, p);
  return p;
}

export function getPersonByPatientId(patId: string): Person | undefined {
  for (const p of persons.values()) {
    if (p.patientId === patId) return p;
  }
  return undefined;
}

export function getAllPersons(): Person[] {
  return [...persons.values()];
}

export function updatePersonZustand(personId: string, zustand: PersonZustand, patientId?: string): void {
  const p = persons.get(personId);
  if (!p) return;
  p.zustand = zustand;
  if (patientId) p.patientId = patientId;
}

// ── Assessment API ───────────────────────────────────────────────────────────

export function getAssessment(id: string): NeuAssessment | undefined {
  return assessments.get(id);
}

export function getAssessmentsForPerson(personId: string): NeuAssessment[] {
  return [...assessments.values()].filter((a) => a.personId === personId);
}

export function getAllAssessments(): NeuAssessment[] {
  return [...assessments.values()];
}

export function createAssessment(personId: string, anlass: AssessmentAnlass): NeuAssessment {
  const id = `NEU-ASS-${String(assessments.size + 1).padStart(3, "0")}`;
  const now = new Date().toISOString();
  const a: NeuAssessment = {
    id,
    personId,
    anlass,
    status: "in_bearbeitung",
    erstelltAm: now,
    zuletztBearbeitetAm: now,
    answers: {},
    vorschlaege: {},
    bestaetigungen: {},
    gespraechId: null,
    vorschlaegeVerfuegbar: false,
    abgeschlossenAm: null,
    abgeschlossenVon: null,
  };
  assessments.set(id, a);
  return a;
}

export function updateAssessmentAnswers(
  assessmentId: string,
  answers: Record<string, string | null>,
): void {
  const a = assessments.get(assessmentId);
  if (!a || istAbgeschlossen(a)) return;
  a.answers = answers;
  a.zuletztBearbeitetAm = new Date().toISOString();
}

/** Retrieve conversation segments by ID. */
export function getGespraech(id: string): GespraechAbschnitt[] | undefined {
  return gespraeche.get(id);
}

/** Confirm a suggestion: moves value to answers, records the confirmation. */
export function confirmVorschlag(
  assessmentId: string,
  feldCode: string,
  bestaetigtVon: string,
  korrigierterWert?: string,
  /** The manually-entered value present before this decision, if the caller
   *  knows it (the store's own answer may already reflect the new value). */
  vorherManuellerWert?: string | null,
): void {
  const a = assessments.get(assessmentId);
  if (!a || istAbgeschlossen(a)) return;
  const v = a.vorschlaege[feldCode];
  if (!v) return;
  const finalWert = korrigierterWert ?? v.vorpigeschlagenerWert;
  // Prefer the explicitly passed prior value; fall back to the stored answer.
  const prior = vorherManuellerWert !== undefined ? vorherManuellerWert : a.answers[feldCode];
  const manuellerVorwert =
    prior != null && prior !== "" && prior !== finalWert ? prior : null;
  a.answers[feldCode] = finalWert;
  a.bestaetigungen[feldCode] = {
    feldCode,
    bestaetigtVon,
    bestaetigtAm: new Date().toISOString(),
    wertKorrigiert: korrigierterWert != null && korrigierterWert !== v.vorpigeschlagenerWert,
    originalVorschlag: v.vorpigeschlagenerWert,
    manuellerVorwert,
    gespraechAbschnittId: v.gespraechAbschnittId,
  };
  delete a.vorschlaege[feldCode];
  a.zuletztBearbeitetAm = new Date().toISOString();
}

/**
 * Completes an assessment. Sets S1 and S2a/S2b if not already filled.
 * Discards all remaining unconfirmed suggestions. The assessment becomes
 * immutable — no further writes are accepted.
 *
 * @returns the number of discarded suggestions, or -1 if already completed
 */
export function abschliessenAssessment(assessmentId: string, person: string): number {
  const a = assessments.get(assessmentId);
  if (!a || istAbgeschlossen(a)) return -1;

  const now = new Date().toISOString();

  // Fill S1 (evaluator signature) if empty — a person name (text field), not a date.
  if (a.answers["S1"] == null || a.answers["S1"] === "") {
    a.answers["S1"] = person;
  }
  // Fill S2a (completing person signature) if empty — a person name (text field).
  if (a.answers["S2a"] == null || a.answers["S2a"] === "") {
    a.answers["S2a"] = person;
  }
  // Fill S2b (completion date) if empty — ISO yyyy-MM-dd, matching the date
  // renderer (previously written as dd.MM.yyyy via toLocaleDateString, which a
  // type=date control sanitised to empty).
  if (a.answers["S2b"] == null || a.answers["S2b"] === "") {
    a.answers["S2b"] = dateZuIso(new Date());
  }

  // Discard all remaining unconfirmed suggestions
  const discardedCount = Object.keys(a.vorschlaege).length;
  a.vorschlaege = {};

  // Mark as completed
  a.status = "abgeschlossen";
  a.abgeschlossenAm = now;
  a.abgeschlossenVon = person;
  a.zuletztBearbeitetAm = now;

  return discardedCount;
}

// ── Computed helpers ─────────────────────────────────────────────────────────

/** Returns the number of active (non-skipped) fields that have no answer yet. */
export function getOpenFieldCount(assessment: NeuAssessment): number {
  const stats = getInputFieldStats();
  const skip = evaluateSkipLogic(assessment.answers);
  let open = 0;
  for (const b of stats.perBereich) {
    const fields = getInputFieldsForBereich(b.code);
    for (const f of fields) {
      if (skip.skippedItemCodes.has(f.code)) continue;
      if (assessment.answers[f.code] == null || assessment.answers[f.code] === "") {
        open++;
      }
    }
  }
  return open;
}

/** Total active (non-skipped) fields for an assessment. */
export function getActiveFieldCount(assessment: NeuAssessment): number {
  const stats = getInputFieldStats();
  const skip = evaluateSkipLogic(assessment.answers);
  let active = 0;
  for (const b of stats.perBereich) {
    const fields = getInputFieldsForBereich(b.code);
    for (const f of fields) {
      if (!skip.skippedItemCodes.has(f.code)) active++;
    }
  }
  return active;
}

/** Maps an assessment occasion to its answer code in item A8. */
const ANLASS_A8_CODE: Record<AssessmentAnlass, string> = {
  erstabklaerung: "1",
  re_assessment: "2",
  wiedereintritt: "3",
  statusaenderung: "4",
  austritt: "5",
  einsatzabbruch: "6",
  andere: "7",
};

/**
 * Display label for an assessment occasion — the verbatim wording of item A8
 * in the seed instrument, not a separate hand-written label.
 */
export function getAnlassLabel(anlass: AssessmentAnlass): string {
  const opt = getItem("A8")?.options?.find((o) => o.code === ANLASS_A8_CODE[anlass]);
  return opt?.label ?? anlass;
}

/** Display label for an assessment status. */
export function getStatusLabel(status: AssessmentStatus): string {
  switch (status) {
    case "in_bearbeitung": return "In Bearbeitung";
    case "abgeschlossen": return "Abgeschlossen";
  }
}

/** Format ISO date string to dd.mm.yyyy HH:MM. */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${day}.${month}.${year} ${hours}:${minutes}`;
}
