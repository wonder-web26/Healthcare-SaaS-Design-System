/**
 * interRAI Formular Store
 *
 * Three long-lived objects, cleanly separated:
 *   Klient (Person) — stable, outlives every Fall; carries master data.
 *   Fall            — the clinical care episode; carries the Fallnummer and
 *                     bundles all forms. Opened with the Anmeldung, closed with
 *                     the Entlassung. A Wiedereintritt opens a NEW Fall.
 *   Formular        — a single form; references its Fall via fallId, and the
 *                     Klient transitively via Fall.klientId (never directly).
 *
 * The Klient's lifecycle state is DERIVED (klientZustand), not stored.
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
import { GEGENWART_ISO } from "../gegenwart";

// ── Types ────────────────────────────────────────────────────────────────────

export interface Person {
  id: string;
  vorname: string;
  nachname: string;
  /** Onboarding case ID, if the person entered through onboarding */
  onboardingId?: string;
  /** Patient record ID, assigned during or after onboarding */
  patientId?: string;
}

/**
 * Triage decided when the SDA is locked — governs which follow-up forms are
 * allowed. Stays null until then; filled in a later step, never derived here.
 */
export type FallTriage = "interrai_hc" | "nur_sda" | null;

/**
 * Fall — the clinical care episode. Opened with the Anmeldung, closed with the
 * Entlassung. Carries the immutable Fallnummer and bundles all forms. A
 * Wiedereintritt of the same Klient opens a NEW Fall with a NEW Fallnummer.
 */
export interface Fall {
  id: string;
  /** Assigned by the store, never typed; immutable once set. */
  fallnummer: string;
  /** The Klient (Person) this episode belongs to — was `personId`. */
  klientId: string;
  /** ISO date — the creation of the first form (the Anmeldung). */
  eroeffnetAm: string;
  /** ISO date — set when the Entlassung is locked; null while the Fall is open. */
  geschlossenAm: string | null;
  triage: FallTriage;
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

export interface Formular {
  id: string;
  /** The Fall this form belongs to. The Klient is reached via Fall.klientId. */
  fallId: string;
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
export function istAbgeschlossen(a: Formular): boolean {
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
export function klassifiziereVorschlaege(assessment: Formular): {
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
  const a = formulare.get(assessmentId);
  if (!a || istAbgeschlossen(a)) return;
  a.vorschlaegeVerfuegbar = true;
}

// ── In-memory stores ─────────────────────────────────────────────────────────

const persons = new Map<string, Person>();
const faelle = new Map<string, Fall>();
const formulare = new Map<string, Formular>();

/** Three-letter organisation code for Fallnummern. Defined here, nowhere else. */
const ORG_KUERZEL = "SKA"; // Spitex Kaufmann AG

/** Conversation segments store — keyed by gespraechId */
const gespraeche = new Map<string, GespraechAbschnitt[]>();

// ── Demo seed ────────────────────────────────────────────────────────────────

import { GESPRAECH_HUBER } from "./demo/gespraech-huber";
import { VORSCHLAEGE_HUBER } from "./demo/vorschlaege-huber";

function initDemo() {
  // Fritz Huber — im Onboarding, noch nicht konvertiert (Zustand wird abgeleitet)
  persons.set("PERS-001", {
    id: "PERS-001",
    vorname: "Fritz",
    nachname: "Huber",
    onboardingId: "OB-2026-105",
  });

  // Anna Müller — aktive Patientin, bereits konvertiert (trägt patientId)
  persons.set("PERS-002", {
    id: "PERS-002",
    vorname: "Anna",
    nachname: "Müller",
    patientId: "P-2026-0041",
  });

  // Rosa Bianchi — Wiedereintritt: EIN Klient (eine Versichertennummer), ZWEI
  // Fälle mit verschiedenen Fallnummern. Beleg, dass das Modell den
  // Wiedereintritt trägt.
  persons.set("PERS-003", {
    id: "PERS-003",
    vorname: "Rosa",
    nachname: "Bianchi",
    patientId: "P-2026-0049",
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

  // Ein Fall je Formular. Die Fallnummer wird vergeben (vergibFallnummer), nie
  // getippt. Reihenfolge bestimmt die laufende Nummer je Jahr.
  const fallHuber = eroeffneFall("PERS-001", "2026-02-28");   // SKA-2026-0001
  const fallMueller = eroeffneFall("PERS-002", "2026-02-15"); // SKA-2026-0002

  // Wiedereintritt Bianchi: erster Fall im Vorjahr (eigener Nummernkreis),
  // abgeschlossen; zweiter Fall im laufenden Jahr, offen.
  const fallBianchiAlt = eroeffneFall("PERS-003", "2025-05-10"); // SKA-2025-0001
  fallBianchiAlt.geschlossenAm = "2025-11-30";
  const fallBianchiNeu = eroeffneFall("PERS-003", "2026-03-02"); // SKA-2026-0003

  // Fritz Huber: Erstabklärung mit KI-Vorschlägen aus dem Gespräch
  formulare.set("NEU-ASS-001", {
    id: "NEU-ASS-001",
    fallId: fallHuber.id,
    anlass: "erstabklaerung",
    status: "in_bearbeitung",
    erstelltAm: "2026-02-28T10:00:00",
    zuletztBearbeitetAm: "2026-03-01T14:30:00",
    answers: { A5b: fallHuber.fallnummer },
    vorschlaege: vorschlaegeMap,
    bestaetigungen: {},
    gespraechId: "GES-HUBER-001",
    vorschlaegeVerfuegbar: false,
    abgeschlossenAm: null,
    abgeschlossenVon: null,
  });

  // Anna Müller: Erstabklärung — ohne Vorschläge (beide Zustände in der Demo)
  formulare.set("NEU-ASS-002", {
    id: "NEU-ASS-002",
    fallId: fallMueller.id,
    anlass: "erstabklaerung",
    status: "in_bearbeitung",
    erstelltAm: "2026-02-15T09:00:00",
    zuletztBearbeitetAm: "2026-02-28T16:00:00",
    answers: { A5b: fallMueller.fallnummer },
    vorschlaege: {},
    bestaetigungen: {},
    gespraechId: null,
    vorschlaegeVerfuegbar: false,
    abgeschlossenAm: null,
    abgeschlossenVon: null,
  });

  // Rosa Bianchi, abgeschlossener Vorfall — gehört zum GESCHLOSSENEN Fall
  formulare.set("NEU-ASS-003", {
    id: "NEU-ASS-003",
    fallId: fallBianchiAlt.id,
    anlass: "erstabklaerung",
    status: "abgeschlossen",
    erstelltAm: "2025-05-10T09:00:00",
    zuletztBearbeitetAm: "2025-11-30T11:00:00",
    answers: { A5b: fallBianchiAlt.fallnummer },
    vorschlaege: {},
    bestaetigungen: {},
    gespraechId: null,
    vorschlaegeVerfuegbar: false,
    abgeschlossenAm: "2025-11-30T11:00:00",
    abgeschlossenVon: "Sandra Weber",
  });

  // Rosa Bianchi, laufender Wiedereintritt — gehört zum OFFENEN Fall
  formulare.set("NEU-ASS-004", {
    id: "NEU-ASS-004",
    fallId: fallBianchiNeu.id,
    anlass: "wiedereintritt",
    status: "in_bearbeitung",
    erstelltAm: "2026-03-02T09:00:00",
    zuletztBearbeitetAm: "2026-03-02T09:00:00",
    answers: { A5b: fallBianchiNeu.fallnummer },
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
 * Returns the Klient linked to an onboarding case, creating a lightweight one
 * on first use if none was seeded. This keeps the Bedarfsabklärung tab
 * actionable for every onboarding — a form can be created for the patient of
 * any case, not only the demo cases that ship with a seeded Klient. Opening the
 * Fall and creating the form stay in offenenFallSicherstellen / createAssessment
 * below; this only ensures a Klient to attach a Fall to.
 */
export function getOrCreatePersonForOnboarding(
  obId: string,
  vorname: string,
  nachname: string,
): Person {
  const existing = getPersonByOnboardingId(obId);
  if (existing) return existing;
  const id = `PERS-${String(persons.size + 1).padStart(3, "0")}`;
  const p: Person = { id, vorname, nachname, onboardingId: obId };
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

/** Sets the patient record ID on a Klient (the only mutation at conversion). */
export function setPatientId(klientId: string, patientId: string): void {
  const p = persons.get(klientId);
  if (!p) return;
  p.patientId = patientId;
}

/**
 * Derived lifecycle state of a Klient — never stored. `aktiv` once the Klient
 * carries a patientId (converted), otherwise `im_onboarding`. Deliberately the
 * same statement as the old stored flag, only computed. Derivation from the
 * Arbeitsvertrag follows in a later step.
 */
export function klientZustand(klientId: string): "im_onboarding" | "aktiv" {
  return persons.get(klientId)?.patientId ? "aktiv" : "im_onboarding";
}

// ── Fall API ───────────────────────────────────────────────────────────────

/**
 * Forms a Fallnummer `{ORG}-{JJJJ}-{NNNN}`. THE single place a Fallnummer is
 * built. NNNN is four digits, restarts at 1 each calendar year, taken from the
 * highest number already assigned in that year across the store.
 */
export function vergibFallnummer(eroeffnetAm: string): string {
  const jahr = eroeffnetAm.slice(0, 4);
  const prefix = `${ORG_KUERZEL}-${jahr}-`;
  let hoechste = 0;
  for (const f of faelle.values()) {
    if (f.fallnummer.startsWith(prefix)) {
      const n = parseInt(f.fallnummer.slice(prefix.length), 10);
      if (!Number.isNaN(n)) hoechste = Math.max(hoechste, n);
    }
  }
  return `${prefix}${String(hoechste + 1).padStart(4, "0")}`;
}

export function getFall(id: string): Fall | undefined {
  return faelle.get(id);
}

export function getFaelleFuerKlient(klientId: string): Fall[] {
  return [...faelle.values()].filter((f) => f.klientId === klientId);
}

/** The single open Fall of a Klient (geschlossenAm === null), if any. */
export function offenerFallFuerKlient(klientId: string): Fall | undefined {
  return [...faelle.values()].find((f) => f.klientId === klientId && f.geschlossenAm === null);
}

/**
 * Opens a new Fall for a Klient. Assigns the Fallnummer here and nowhere else;
 * it is immutable afterwards (no setter exists).
 */
export function eroeffneFall(klientId: string, eroeffnetAm: string = GEGENWART_ISO): Fall {
  const id = `FALL-${String(faelle.size + 1).padStart(3, "0")}`;
  const fall: Fall = {
    id,
    fallnummer: vergibFallnummer(eroeffnetAm),
    klientId,
    eroeffnetAm,
    geschlossenAm: null,
    triage: null,
  };
  faelle.set(id, fall);
  return fall;
}

/** Returns the Klient's open Fall, opening one if none exists. */
export function offenenFallSicherstellen(klientId: string, eroeffnetAm: string = GEGENWART_ISO): Fall {
  return offenerFallFuerKlient(klientId) ?? eroeffneFall(klientId, eroeffnetAm);
}

// ── Assessment API ───────────────────────────────────────────────────────────

export function getAssessment(id: string): Formular | undefined {
  return formulare.get(id);
}

/** All forms belonging to one Fall. */
export function formulareFuerFall(fallId: string): Formular[] {
  return [...formulare.values()].filter((f) => f.fallId === fallId);
}

/** All forms belonging to a Klient, across every Fall of that Klient. */
export function formulareFuerKlient(klientId: string): Formular[] {
  const fallIds = new Set(getFaelleFuerKlient(klientId).map((f) => f.id));
  return [...formulare.values()].filter((f) => fallIds.has(f.fallId));
}

/** Resolves the Klient of a form via its Fall (never stored on the form). */
export function klientFuerFormular(f: Formular): Person | undefined {
  const fall = faelle.get(f.fallId);
  return fall ? persons.get(fall.klientId) : undefined;
}

export function getAllAssessments(): Formular[] {
  return [...formulare.values()];
}

/**
 * Creates a form inside an existing Fall. A form without a Fall is invalid:
 * an unknown fallId throws rather than silently opening a Fall. The internal
 * case-number field (A5b) is pre-filled from the Fall and not user input.
 */
export function createAssessment(fallId: string, anlass: AssessmentAnlass): Formular {
  const fall = faelle.get(fallId);
  if (!fall) {
    throw new Error(`createAssessment: unbekannte fallId "${fallId}" — ein Formular ohne Fall ist unzulässig`);
  }
  const id = `NEU-ASS-${String(formulare.size + 1).padStart(3, "0")}`;
  const now = new Date().toISOString();
  const a: Formular = {
    id,
    fallId,
    anlass,
    status: "in_bearbeitung",
    erstelltAm: now,
    zuletztBearbeitetAm: now,
    answers: { A5b: fall.fallnummer },
    vorschlaege: {},
    bestaetigungen: {},
    gespraechId: null,
    vorschlaegeVerfuegbar: false,
    abgeschlossenAm: null,
    abgeschlossenVon: null,
  };
  formulare.set(id, a);
  return a;
}

export function updateAssessmentAnswers(
  assessmentId: string,
  answers: Record<string, string | null>,
): void {
  const a = formulare.get(assessmentId);
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
  const a = formulare.get(assessmentId);
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
  const a = formulare.get(assessmentId);
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
    a.answers["S2b"] = GEGENWART_ISO;
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
export function getOpenFieldCount(assessment: Formular): number {
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
export function getActiveFieldCount(assessment: Formular): number {
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
