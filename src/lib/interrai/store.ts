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
// Triage nach BB16 — die EINE bestehende fachliche Regel wird wiederverwendet,
// nicht neu implementiert (siehe lib/stammdaten/sda-einschaetzung-situation.ts).
import { sdaVerlangtInterrai } from "../stammdaten/sda-einschaetzung-situation";

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
/**
 * The four form kinds a Fall can contain. Lifecycle, locking, protocolling and
 * fall membership are identical for all four; only the catalogue and renderer
 * differ (those live in the seed/renderer, not the entity).
 */
export type FormularTyp = "sda" | "hc" | "lpb" | "entlassung";

/**
 * Form lifecycle. `vollstaendig` is reached when the open-field count is zero;
 * only from there may a form be locked to `gesperrt`. A gesperrt form is
 * immutable and there is no way back.
 */
export type FormularStatus = "in_bearbeitung" | "vollstaendig" | "gesperrt";

/** Result of the eligibility check for opening a form in a Fall. */
export type EroeffnungsErgebnis =
  | { zulaessig: true }
  | { zulaessig: false; grund: string };

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
  /** Which of the four forms this is. */
  typ: FormularTyp;
  /** Per Fall AND typ, starting at 1. For hc: 1 = Erstassessment, ≥2 =
   *  Reassessment. Assigned on creation, immutable — never derived from a date. */
  laufnummer: number;
  /** Only for typ 'hc': the immediately preceding locked hc OF THE SAME FALL;
   *  null otherwise. Makes the Entlassung the boundary of data carry-over. */
  vorgaengerId: string | null;
  anlass: AssessmentAnlass;
  status: FormularStatus;
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
  /** ISO datetime the form was locked, null while not gesperrt. */
  gesperrtAm: string | null;
  /** Identification of the person who locked the form. */
  gesperrtVon: string | null;
}

/** Returns true if the form is locked and immutable. */
export function istGesperrt(a: Formular): boolean {
  return a.status === "gesperrt";
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
  if (!a) return;
  if (istGesperrt(a)) throw new Error("Formular ist gesperrt und unveränderlich");
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

  // Rosa Bianchi — EIN Klient (eine Versichertennummer) mit mehreren Fällen:
  // Angehörigenfall (B), geschlossener Vorgängerfall und offener Wiedereintritt
  // (C). Beleg, dass das Modell Angehörigenfall und Wiedereintritt trägt.
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

  // ── Demo-Fälle (Schritt 2) ──────────────────────────────────────────────
  //  Jedes Formular entsteht über createFormular (die EINE Erzeugung, prüft die
  //  Eröffnungsregeln), Sperren über wendeSperreAn (setzt gesperrtAm/Von,
  //  Triage bzw. Fallschluss). So gelten die Regeln bereits im Seed.
  const lockSeed = (f: Formular, am: string) => wendeSperreAn(f, "Sandra Weber", am);

  // Fall A — Standardweg (Huber): SDA gesperrt (BB16=1 → interRAI HC), HC laufend.
  const fallA = eroeffneFall("PERS-001", "2026-02-28");    // SKA-2026-0001
  const sdaA = createFormular(fallA.id, "sda");
  sdaA.answers["BB16"] = "1";
  lockSeed(sdaA, "2026-02-28T11:00:00");                   // Triage → interrai_hc
  const hcA = createFormular(fallA.id, "hc");              // laufnummer 1, in Bearbeitung
  hcA.gespraechId = "GES-HUBER-001";
  hcA.vorschlaege = vorschlaegeMap;

  // Fall A' — Standardweg (Anna Müller, aktive Patientin P-2026-0041): SDA
  //  gesperrt, HC laufend. Hält den interRAI-Reiter an diesem Patienten aktiv.
  const fallAM = eroeffneFall("PERS-002", "2026-02-15");   // SKA-2026-0002
  const sdaAM = createFormular(fallAM.id, "sda");
  sdaAM.answers["BB16"] = "1";
  lockSeed(sdaAM, "2026-02-20T09:00:00");
  createFormular(fallAM.id, "hc");                         // laufnummer 1, in Bearbeitung

  // Fall B — Angehörigenfall (Rosa Bianchi): SDA gesperrt (BB16=5 → nur SDA),
  //  KEIN HC, LPB laufend. Beleg, dass ein Fall ohne interRAI HC vollständig ist.
  const fallB = eroeffneFall("PERS-003", "2026-03-01");    // SKA-2026-0003
  const sdaB = createFormular(fallB.id, "sda");
  sdaB.answers["BB16"] = "5";
  lockSeed(sdaB, "2026-03-01T10:00:00");                   // Triage → nur_sda
  createFormular(fallB.id, "lpb");                         // laufnummer 1, in Bearbeitung

  // Fall C — Wiedereintritt (Rosa Bianchi). Vorgängerfall vollständig gesperrt
  //  inkl. Entlassung → geschlossen.
  const fallCalt = eroeffneFall("PERS-003", "2025-05-10"); // SKA-2025-0001
  const sdaCalt = createFormular(fallCalt.id, "sda");
  sdaCalt.answers["BB16"] = "1";
  lockSeed(sdaCalt, "2025-05-10T10:00:00");
  const hcCalt = createFormular(fallCalt.id, "hc");        // laufnummer 1
  lockSeed(hcCalt, "2025-08-01T10:00:00");
  const entlCalt = createFormular(fallCalt.id, "entlassung");
  lockSeed(entlCalt, "2025-11-30T11:00:00");               // schliesst fallCalt

  //  Zweiter, offener Fall: HC laufnummer 2 mit vorgaengerId auf das HC
  //  DESSELBEN Falls (nicht auf das aus dem geschlossenen Vorgängerfall).
  const fallCneu = eroeffneFall("PERS-003", "2026-03-02"); // SKA-2026-0004
  const sdaCneu = createFormular(fallCneu.id, "sda");
  sdaCneu.answers["BB16"] = "1";
  lockSeed(sdaCneu, "2026-03-02T09:00:00");
  const hcCneu1 = createFormular(fallCneu.id, "hc");       // laufnummer 1
  lockSeed(hcCneu1, "2026-03-10T09:00:00");
  createFormular(fallCneu.id, "hc");                       // laufnummer 2, vorgaengerId → hcCneu1
}

// initDemo() wird am Dateiende aufgerufen — es nutzt createFormular, dessen
// Rumpf modulweite const-Bindungen (FALLNUMMER_FELD) referenziert, die erst
// nach ihrer Definition ausserhalb der TDZ liegen.

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
 * Eligibility to open a form of `typ` in a Fall — a pure MODEL rule, not UI
 * logic. createFormular calls this and refuses on { zulaessig: false }, so a
 * disabled button is never the only guard.
 */
export function kannFormularEroeffnen(fallId: string, typ: FormularTyp): EroeffnungsErgebnis {
  const fall = faelle.get(fallId);
  if (!fall) return { zulaessig: false, grund: `Unbekannter Fall "${fallId}"` };
  if (fall.geschlossenAm !== null) return { zulaessig: false, grund: "Der Fall ist geschlossen" };

  const forms = formulareFuerFall(fallId);
  const sdaGesperrt = forms.some((f) => f.typ === "sda" && f.status === "gesperrt");

  switch (typ) {
    case "sda":
      if (forms.some((f) => f.typ === "sda")) return { zulaessig: false, grund: "Der Fall hat bereits ein SDA" };
      return { zulaessig: true };
    case "hc":
      if (!sdaGesperrt) return { zulaessig: false, grund: "Kein gesperrtes SDA vorhanden" };
      if (fall.triage !== "interrai_hc") return { zulaessig: false, grund: "Die Triage lässt kein interRAI HC zu" };
      if (forms.some((f) => f.typ === "hc" && f.status !== "gesperrt")) return { zulaessig: false, grund: "Es ist bereits ein HC dieses Falls offen" };
      return { zulaessig: true };
    case "lpb":
      if (!sdaGesperrt) return { zulaessig: false, grund: "Kein gesperrtes SDA vorhanden" };
      return { zulaessig: true };
    case "entlassung":
      if (forms.some((f) => f.typ === "entlassung")) return { zulaessig: false, grund: "Es existiert bereits eine Entlassung" };
      if (forms.length === 0 || !forms.every((f) => f.status === "gesperrt")) return { zulaessig: false, grund: "Es sind noch nicht alle Formulare des Falls gesperrt" };
      return { zulaessig: true };
  }
}

/** Internal case-number field per type — BB5b (SDA) / A5b (HC), same i-code
 *  iA5d. No i-code layer yet, so we write the per-type answer key directly. */
const FALLNUMMER_FELD: Partial<Record<FormularTyp, string>> = { sda: "BB5b", hc: "A5b" };

/**
 * Creates a form of `typ` inside an existing Fall — THE single creation path.
 * It calls kannFormularEroeffnen and throws on an illegal combination, so no
 * caller can create a form the rules forbid. `laufnummer` (per Fall AND typ)
 * and, for hc, `vorgaengerId` (the last locked hc of the SAME Fall) are set
 * here and are immutable. The internal case-number field is pre-filled from the
 * Fall (SDA and HC).
 */
export function createFormular(fallId: string, typ: FormularTyp): Formular {
  const pruefung = kannFormularEroeffnen(fallId, typ);
  if (!pruefung.zulaessig) {
    const grund = "grund" in pruefung ? pruefung.grund : "unzulässig";
    throw new Error(`createFormular (${typ}): ${grund}`);
  }
  const fall = faelle.get(fallId)!;
  const gleicherTyp = formulareFuerFall(fallId).filter((f) => f.typ === typ);
  const laufnummer = gleicherTyp.length + 1;
  const gesperrteHc = gleicherTyp
    .filter((f) => f.status === "gesperrt")
    .sort((a, b) => a.laufnummer - b.laufnummer);
  const vorgaengerId = typ === "hc" && gesperrteHc.length ? gesperrteHc[gesperrteHc.length - 1].id : null;

  const id = `NEU-ASS-${String(formulare.size + 1).padStart(3, "0")}`;
  const now = new Date().toISOString();
  const feld = FALLNUMMER_FELD[typ];
  const a: Formular = {
    id,
    fallId,
    typ,
    laufnummer,
    vorgaengerId,
    anlass: typ === "hc" && laufnummer > 1 ? "re_assessment" : "erstabklaerung",
    status: "in_bearbeitung",
    erstelltAm: now,
    zuletztBearbeitetAm: now,
    answers: feld ? { [feld]: fall.fallnummer } : {},
    vorschlaege: {},
    bestaetigungen: {},
    gespraechId: null,
    vorschlaegeVerfuegbar: false,
    gesperrtAm: null,
    gesperrtVon: null,
  };
  formulare.set(id, a);
  return a;
}

/**
 * The next form to open from the onboarding entry points: the SDA (Anmeldung)
 * if the Fall has none yet, otherwise the HC once the SDA is locked and the
 * triage permits it. Delegates the eligibility check and the reason to
 * createFormular — callers surface the thrown reason to the user.
 */
export function erstelleNaechstesFormular(fallId: string): Formular {
  const hatSda = formulareFuerFall(fallId).some((f) => f.typ === "sda");
  return createFormular(fallId, hatSda ? "hc" : "sda");
}

export function updateAssessmentAnswers(
  assessmentId: string,
  answers: Record<string, string | null>,
): void {
  const a = formulare.get(assessmentId);
  if (!a) return;
  if (istGesperrt(a)) throw new Error("Formular ist gesperrt und unveränderlich");
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
  if (!a) return;
  if (istGesperrt(a)) throw new Error("Formular ist gesperrt und unveränderlich");
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

/** For hc: pre-fill the signature/date fields (S1/S2) so completeness doesn't
 *  stall on them — the historical convenience of the old abschliessenAssessment. */
function prefillSignaturHc(a: Formular, person: string): void {
  if (a.answers["S1"] == null || a.answers["S1"] === "") a.answers["S1"] = person;
  if (a.answers["S2a"] == null || a.answers["S2a"] === "") a.answers["S2a"] = person;
  if (a.answers["S2b"] == null || a.answers["S2b"] === "") a.answers["S2b"] = GEGENWART_ISO;
}

/** Upgrades in_bearbeitung → vollstaendig when no field is open. Never downgrades,
 *  never touches a gesperrt form. Completeness reuses the existing field count. */
function markiereVollstaendig(a: Formular): void {
  if (a.status === "in_bearbeitung" && getOpenFieldCount(a) === 0) {
    a.status = "vollstaendig";
  }
}

/**
 * Applies the lock to a form: discards remaining suggestions, sets status
 * gesperrt + protocol fields, and runs the type-specific side effects — an SDA
 * sets Fall.triage (immutable, from BB16), an Entlassung closes the Fall.
 * Shared by the runtime sperreFormular (after its gates) and the demo seed
 * (which sets gesperrt forms directly, bypassing the completeness gate). The
 * SDA-without-triage guard lives here so it holds for BOTH paths.
 */
function wendeSperreAn(a: Formular, gesperrtVon: string, jetzt: string): void {
  const fall = faelle.get(a.fallId);
  if (!fall) throw new Error(`wendeSperreAn: unbekannte fallId "${a.fallId}"`);

  if (a.typ === "sda") {
    const code = a.answers["BB16"];
    if (code == null || code === "") {
      throw new Error("SDA ohne codiertes BB16 — kein gültiges SDA, Triage nicht bestimmbar");
    }
    // Triage NUR hier und nur einmal gesetzt (unveränderlich). Die fachliche
    // Zuordnung stammt aus sdaVerlangtInterrai, wird nicht dupliziert.
    if (fall.triage === null) {
      fall.triage = sdaVerlangtInterrai(code) ? "interrai_hc" : "nur_sda";
    }
  }

  a.vorschlaege = {};
  a.status = "gesperrt";
  a.gesperrtAm = jetzt;
  a.gesperrtVon = gesperrtVon;
  a.zuletztBearbeitetAm = jetzt;

  if (a.typ === "entlassung") {
    fall.geschlossenAm = jetzt;
  }
}

/**
 * Locks a form (the runtime path). Only a vollstaendig form may be locked; the
 * transition is one-way (no unlock). Throws with a reason on any illegal lock.
 */
export function sperreFormular(formularId: string, gesperrtVon: string): void {
  const a = formulare.get(formularId);
  if (!a) throw new Error(`sperreFormular: unbekanntes Formular "${formularId}"`);
  if (a.status === "gesperrt") throw new Error("Formular ist bereits gesperrt");

  if (a.typ === "hc") prefillSignaturHc(a, gesperrtVon);
  markiereVollstaendig(a);
  if (a.status !== "vollstaendig") {
    throw new Error("Formular ist nicht vollständig — Sperren nicht zulässig");
  }
  wendeSperreAn(a, gesperrtVon, new Date().toISOString());
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

/** Display label for a form status. */
export function getStatusLabel(status: FormularStatus): string {
  switch (status) {
    case "in_bearbeitung": return "In Bearbeitung";
    case "vollstaendig": return "Vollständig";
    case "gesperrt": return "Gesperrt";
  }
}

/** Display label for a form type (used in the list). */
export function getTypLabel(typ: FormularTyp): string {
  switch (typ) {
    case "sda": return "SDA";
    case "hc": return "interRAI HC";
    case "lpb": return "Leistungsplanungsblatt";
    case "entlassung": return "Entlassung";
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

// Seed erst hier ausführen, wenn alle Funktionen UND modulweiten const-Bindungen
// initialisiert sind (createFormular referenziert FALLNUMMER_FELD).
initDemo();
