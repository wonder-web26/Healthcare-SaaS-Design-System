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
// Route nach BB16 — die EINE bestehende Mapping-Quelle wird wiederverwendet,
// nicht neu implementiert (siehe lib/stammdaten/sda-einschaetzung-situation.ts).
import { sdaRoute, type FallRoute } from "../stammdaten/sda-einschaetzung-situation";
// SDA-Katalog: massgebend für die Vollständigkeit des Registrierungsformulars.
import { SDA_KATALOG } from "./katalog/sda-katalog";

/** Re-Export, damit Konsumenten die Route über den Store beziehen. */
export type { FallRoute };

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
 * Fall lifecycle status — DERIVED from which forms are locked, never stored
 * (see fallStatus). Matches SpitexCareCase.status in the production schema.
 *   registering — registration form exists but is not locked yet
 *   open        — registration locked, no locked discharge
 *   discharged  — discharge locked
 *   aborted     — registration aborted, no case number minted
 */
export type FallStatus = "registering" | "open" | "discharged" | "aborted";

/**
 * Fall — the clinical care episode (SpitexCareCase). Two events touch it: the
 * registration form locking OPENS it (mints the Fallnummer, sets openedAt and
 * route); the discharge form locking closes it (closedAt). An interRAI form
 * locking has DELIBERATELY no effect. A Wiedereintritt is a new Fall.
 */
export interface Fall {
  id: string;
  /** Minted when the registration form LOCKS; null while `registering`/`aborted`. */
  fallnummer: string | null;
  /** The Klient (Person) this episode belongs to. */
  klientId: string;
  /** BB16 route, set when the registration locks; null before that. */
  route: FallRoute;
  /** ISO — the shell was created (with the registration form). */
  erstelltAm: string;
  /** ISO — set when the registration LOCKS (the case truly opens). */
  openedAt: string | null;
  /** ISO — set when the discharge LOCKS. */
  closedAt: string | null;
  /** ISO — set if the registration is aborted (status → aborted). */
  abgebrochenAm: string | null;
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
 * Form kinds a Fall can contain (SpitexFormInstance.type in production).
 * Lifecycle, locking, protocolling and fall membership are identical for all;
 * only the catalogue and renderer differ. The Leistungsplanungsblatt is NOT a
 * form here — it is a separate object (SpitexServicePlan), not built yet.
 */
export type FormularTyp =
  | "registration"    // Anmeldung (war 'sda')
  | "interrai_hc"     // interRAI HC (war 'hc')
  | "interrai_cmh"    // interRAI CMH — psychiatrisches Instrument
  | "housekeeping"    // hauswirtschaftliche Abklärung
  | "discharge";      // Entlassung (war 'entlassung')

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
  /** Only for typ 'interrai_hc': the immediately preceding locked hc OF THE SAME
   *  FALL; null otherwise. Makes the discharge the boundary of data carry-over. */
  vorgaengerId: string | null;
  /** Reassessment occasion (SpitexFormInstance.reason). 'first' when
   *  laufnummer === 1; for reassessments set on creation when known, else null. */
  reason: "first" | "periodic" | "significant_change" | "return_from_hospital" | null;
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

  // Rosa Bianchi — Klient für den Wiedereintritt (Fall C).
  persons.set("PERS-003", { id: "PERS-003", vorname: "Rosa", nachname: "Bianchi", patientId: "P-2026-0049" });
  // Peter Ammann — Klient für die Systemgrenze (Fall D, palliativ).
  persons.set("PERS-004", { id: "PERS-004", vorname: "Peter", nachname: "Ammann", patientId: "P-2026-0050" });

  // Walter Frei entfernt — hing an OB-2026-011, einer Kennung ausserhalb des
  // Fallverzeichnisses. Seine Bedarfsabklärung BA-2026-030 ist mit entfallen.

  // Register conversation
  gespraeche.set("GES-HUBER-001", GESPRAECH_HUBER);

  // Build vorschlaege map from demo data
  const vorschlaegeMap: Record<string, Vorschlag> = {};
  for (const v of VORSCHLAEGE_HUBER) vorschlaegeMap[v.feldCode] = v;

  // ── Demo-Fälle (produktive Terminologie) ────────────────────────────────
  //  Jedes Formular über createFormular (prüft die Eröffnungsregeln), Sperren
  //  über wendeSperreAn. Die Fallnummer entsteht beim SPERREN der Registrierung,
  //  nicht beim Anlegen. §7 (ein offener Fall pro Klient): Fall C erhält einen
  //  eigenen Klienten (nicht den von Fall B), da sonst beide offen wären.
  const lockSeed = (f: Formular, am: string) => wendeSperreAn(f, "Sandra Weber", am);
  const registrieren = (fall: Fall, bb16: string, am: string): Formular => {
    const r = createFormular(fall.id, "registration");
    const klient = persons.get(fall.klientId);
    // Antworten i-Code-geschlüsselt (SDA). Nur Codes aus dem Katalog; Stammdaten
    // aus dem Klienten vorbefüllt (Name/Vorname).
    r.answers["CHBB16"] = bb16;           // BB16 Einschätzung der Situation → route
    r.answers["CHAA1"] = "1";             // AA1 Eröffnungsgrund: Eintritt
    r.answers["iB2"] = am.slice(0, 10);   // AA2 Datum der Eröffnung des Dossiers
    if (klient) {
      r.answers["iA1c"] = klient.nachname; // BB1a Name
      r.answers["iA1a"] = klient.vorname;  // BB1b Vorname
    }
    lockSeed(r, am); // vergibt Fallnummer (iA5d), setzt route + openedAt, sperrt
    return r;
  };

  // Fall A — Standardweg (Huber): Registrierung gesperrt (BB16=1 → somatic),
  //  Status open, interRAI HC laufnummer 1 (reason first) in Bearbeitung.
  const fallA = eroeffneFall("PERS-001", "2026-02-28");
  const regA = registrieren(fallA, "1", "2026-02-28T11:00:00"); // SKA-2026-0001, route somatic
  // §9 Bereichs-Präzisierung: die anmeldende Person steht in der AA-Präzisierung.
  const aaBereich = SDA_KATALOG.find((i) => i.nummer === "AA1")?.bereich ?? "";
  regA.answers[`PRAEZ::${aaBereich}`] = "Angemeldet durch Dr. med. R. Lüthi (Hausarzt), Tel. +41 52 213 44 55";
  const hcA = createFormular(fallA.id, "interrai_hc");    // laufnummer 1, reason first
  hcA.gespraechId = "GES-HUBER-001";
  hcA.vorschlaege = vorschlaegeMap;

  // Fall B — Hauswirtschaftsfall (Anna Müller, P-2026-0041): Registrierung
  //  gesperrt (BB16=6 → housekeeping), Status open, KEIN interRAI HC.
  const fallB = eroeffneFall("PERS-002", "2026-03-01");
  registrieren(fallB, "6", "2026-03-01T10:00:00");        // SKA-2026-0002, route housekeeping

  // Fall C — Wiedereintritt (Rosa Bianchi). Erst der geschlossene Vorgängerfall
  //  (Registrierung + HC + Entlassung gesperrt → discharged), DANN der neue
  //  offene Fall — sonst hätte der Klient zwei offene Fälle (§7).
  const fallCalt = eroeffneFall("PERS-003", "2025-05-10");
  registrieren(fallCalt, "1", "2025-05-10T10:00:00");     // SKA-2025-0001, somatic
  const hcCalt = createFormular(fallCalt.id, "interrai_hc"); // laufnummer 1
  lockSeed(hcCalt, "2025-08-01T10:00:00");
  const entlCalt = createFormular(fallCalt.id, "discharge");
  lockSeed(entlCalt, "2025-11-30T11:00:00");              // schliesst fallCalt (discharged)

  const fallCneu = eroeffneFall("PERS-003", "2026-03-02");
  registrieren(fallCneu, "1", "2026-03-02T09:00:00");     // SKA-2026-0003, somatic
  const hcCneu1 = createFormular(fallCneu.id, "interrai_hc"); // laufnummer 1
  lockSeed(hcCneu1, "2026-03-10T09:00:00");
  const hcCneu2 = createFormular(fallCneu.id, "interrai_hc"); // laufnummer 2, vorgaengerId → hcCneu1
  hcCneu2.reason = "periodic";

  // Fall D — Systemgrenze (Peter Ammann): Registrierung gesperrt (BB16=3 →
  //  palliative). Kein Abklärungsformular eröffnungsfähig.
  const fallD = eroeffneFall("PERS-004", "2026-01-15");
  registrieren(fallD, "3", "2026-01-15T10:00:00");        // SKA-2026-0004, route palliative
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
 * highest number already minted in that year. Called only when a registration
 * form locks (the case truly opens).
 */
export function vergibFallnummer(datum: string): string {
  const jahr = datum.slice(0, 4);
  const prefix = `${ORG_KUERZEL}-${jahr}-`;
  let hoechste = 0;
  for (const f of faelle.values()) {
    if (f.fallnummer && f.fallnummer.startsWith(prefix)) {
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

/**
 * Derived lifecycle status of a Fall — never stored (see FallStatus). It follows
 * from which forms are locked, plus the abort marker.
 */
export function fallStatus(fallId: string): FallStatus {
  const fall = faelle.get(fallId);
  if (!fall) throw new Error(`fallStatus: unbekannter Fall "${fallId}"`);
  if (fall.abgebrochenAm) return "aborted";
  const forms = formulareFuerFall(fallId);
  const reg = forms.find((f) => f.typ === "registration");
  if (!reg || reg.status !== "gesperrt") return "registering";
  if (forms.some((f) => f.typ === "discharge" && f.status === "gesperrt")) return "discharged";
  return "open";
}

/** The Klient's one open (registering or open) Fall, if any. */
export function offenerFallFuerKlient(klientId: string): Fall | undefined {
  return [...faelle.values()].find((f) => {
    if (f.klientId !== klientId) return false;
    const st = fallStatus(f.id);
    return st === "registering" || st === "open";
  });
}

/**
 * Opens the SHELL of a new Fall (status `registering`, NO Fallnummer yet — that
 * is minted when the registration form locks). Enforces ONE OPEN FALL PER
 * KLIENT: throws, naming the existing case, if the Klient already has a
 * registering/open Fall.
 */
export function eroeffneFall(klientId: string, erstelltAm: string = GEGENWART_ISO): Fall {
  const bestehend = offenerFallFuerKlient(klientId);
  if (bestehend) {
    const kennung = bestehend.fallnummer ?? "in Registrierung, noch keine Fallnummer";
    throw new Error(`Klient "${klientId}" hat bereits einen offenen Fall (${kennung})`);
  }
  const id = `FALL-${String(faelle.size + 1).padStart(3, "0")}`;
  const fall: Fall = {
    id,
    fallnummer: null,
    klientId,
    route: null,
    erstelltAm,
    openedAt: null,
    closedAt: null,
    abgebrochenAm: null,
  };
  faelle.set(id, fall);
  return fall;
}

/** Aborts a registering Fall — status → aborted, no Fallnummer is minted. */
export function brecheFallAb(fallId: string): void {
  const fall = faelle.get(fallId);
  if (!fall) throw new Error(`brecheFallAb: unbekannter Fall "${fallId}"`);
  if (fallStatus(fallId) !== "registering") {
    throw new Error("Nur ein Fall in Registrierung kann abgebrochen werden");
  }
  fall.abgebrochenAm = new Date().toISOString();
}

/** Returns the Klient's open Fall, opening a shell if none exists. */
export function offenenFallSicherstellen(klientId: string, erstelltAm: string = GEGENWART_ISO): Fall {
  return offenerFallFuerKlient(klientId) ?? eroeffneFall(klientId, erstelltAm);
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

/** The three assessment forms — at most one may be open at a time per Fall. */
const ABKLAERUNG_TYPEN = new Set<FormularTyp>(["interrai_hc", "interrai_cmh", "housekeeping"]);

/** Which route admits which assessment form. */
const ROUTE_FUER_TYP: Record<"interrai_hc" | "interrai_cmh" | "housekeeping", Exclude<FallRoute, null>> = {
  interrai_hc: "somatic",
  interrai_cmh: "mental_health",
  housekeeping: "housekeeping",
};

/** Reason an assessment of `typ` is not admissible under the Fall's route. */
function routeGrund(route: FallRoute, typ: "interrai_hc" | "interrai_cmh" | "housekeeping"): string {
  if (route === "declined") return "Die Klientin hat eine umfassende Bedarfsabklärung abgelehnt";
  if (route === "palliative" || route === "paediatric" || route === "isolated_therapeutic") {
    return `Für diese Situation (Route ${route}) ist ein Instrument erforderlich, das die Software nicht abbildet`;
  }
  if (route === null) return "Die Registrierung ist noch nicht gesperrt (keine Route bestimmt)";
  return `Die Route ${route} lässt ${typ} nicht zu`;
}

/**
 * Eligibility to open a form of `typ` in a Fall — a pure MODEL rule, not UI
 * logic. createFormular calls this and refuses on { zulaessig: false }, so a
 * disabled button is never the only guard.
 */
export function kannFormularEroeffnen(fallId: string, typ: FormularTyp): EroeffnungsErgebnis {
  const fall = faelle.get(fallId);
  if (!fall) return { zulaessig: false, grund: `Unbekannter Fall "${fallId}"` };
  const st = fallStatus(fallId);
  if (st === "discharged") return { zulaessig: false, grund: "Der Fall ist entlassen" };
  if (st === "aborted") return { zulaessig: false, grund: "Der Fall ist abgebrochen" };

  const forms = formulareFuerFall(fallId);
  const registrierungGesperrt = forms.some((f) => f.typ === "registration" && f.status === "gesperrt");
  const offenesAbklaerungsformular = forms.some((f) => ABKLAERUNG_TYPEN.has(f.typ) && f.status !== "gesperrt");

  switch (typ) {
    case "registration":
      if (forms.some((f) => f.typ === "registration")) return { zulaessig: false, grund: "Der Fall hat bereits eine Registrierung" };
      return { zulaessig: true };
    case "interrai_hc":
    case "interrai_cmh":
    case "housekeeping":
      if (!registrierungGesperrt) return { zulaessig: false, grund: "Registrierung ist noch nicht gesperrt" };
      if (fall.route !== ROUTE_FUER_TYP[typ]) return { zulaessig: false, grund: routeGrund(fall.route, typ) };
      if (offenesAbklaerungsformular) return { zulaessig: false, grund: "Es ist bereits ein Abklärungsformular dieses Falls offen" };
      return { zulaessig: true };
    case "discharge":
      if (forms.some((f) => f.typ === "discharge")) return { zulaessig: false, grund: "Es existiert bereits eine Entlassung" };
      if (forms.length === 0 || !forms.every((f) => f.status === "gesperrt")) return { zulaessig: false, grund: "Es sind noch nicht alle Formulare des Falls gesperrt" };
      return { zulaessig: true };
  }
}

/** Internal case-number field per type. The registration is i-code-keyed → iA5d
 *  (nummer BB5b); the HC keeps its visible code A5b (HC answers are not i-code
 *  keyed in this step). Both denote the same "Interne Fallnummer" item. */
const FALLNUMMER_FELD: Partial<Record<FormularTyp, string>> = { registration: "iA5d", interrai_hc: "A5b" };

/**
 * Creates a form of `typ` inside an existing Fall — THE single creation path.
 * It calls kannFormularEroeffnen and throws on an illegal combination, so no
 * caller can create a form the rules forbid. `laufnummer` (per Fall AND typ)
 * and, for interrai_hc, `vorgaengerId` (the last locked hc of the SAME Fall)
 * are set here and are immutable. `reason` is 'first' for laufnummer 1, else
 * null. The case-number field is filled once the Fall has a Fallnummer (i.e. an
 * interRAI form after the registration locked; the registration itself gets it
 * at lock time).
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
  const vorgaengerId = typ === "interrai_hc" && gesperrteHc.length ? gesperrteHc[gesperrteHc.length - 1].id : null;

  const id = `NEU-ASS-${String(formulare.size + 1).padStart(3, "0")}`;
  const now = new Date().toISOString();
  const feld = FALLNUMMER_FELD[typ];
  const a: Formular = {
    id,
    fallId,
    typ,
    laufnummer,
    vorgaengerId,
    reason: laufnummer === 1 ? "first" : null,
    anlass: typ === "interrai_hc" && laufnummer > 1 ? "re_assessment" : "erstabklaerung",
    status: "in_bearbeitung",
    erstelltAm: now,
    zuletztBearbeitetAm: now,
    answers: feld && fall.fallnummer ? { [feld]: fall.fallnummer } : {},
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
/**
 * Das Registrierungsformular des offenen Falls eines Onboardings, sofern es
 * existiert. Damit leiten Onboarding-Ansichten Reitersperre, Anmeldung-
 * Validität und Triage aus dem Formular ab, statt sie zu speichern.
 */
export function registrierungFuerOnboarding(onboardingId: string): Formular | undefined {
  const person = getPersonByOnboardingId(onboardingId);
  if (!person) return undefined;
  const fall = offenerFallFuerKlient(person.id);
  if (!fall) return undefined;
  return formulareFuerFall(fall.id).find((f) => f.typ === "registration");
}

export function erstelleNaechstesFormular(fallId: string): Formular {
  const hatRegistrierung = formulareFuerFall(fallId).some((f) => f.typ === "registration");
  return createFormular(fallId, hatRegistrierung ? "interrai_hc" : "registration");
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

/** For interRAI HC: pre-fill the signature/date fields (S1/S2) so completeness
 *  doesn't stall on them — the historical convenience of the old completion. */
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
 * gesperrt + protocol fields, and runs the type-specific side effects on the
 * FALL — and ONLY the registration and discharge touch the Fall:
 *   registration → mint the Fallnummer, set route (from BB16) and openedAt;
 *                  the form's case-number field is filled here, not left null.
 *   discharge    → set closedAt.
 * An interRAI form locking deliberately has no effect on the Fall.
 * The Fallnummer is minted BEFORE the form's gesperrt state is written.
 * Shared by the runtime sperreFormular (after its gates) and the demo seed.
 */
function wendeSperreAn(a: Formular, gesperrtVon: string, jetzt: string): void {
  const fall = faelle.get(a.fallId);
  if (!fall) throw new Error(`wendeSperreAn: unbekannte fallId "${a.fallId}"`);

  if (a.typ === "registration") {
    // BB16 wird über seinen i-Code CHBB16 geführt (Antworten des SDA sind
    // i-Code-geschlüsselt), nicht über die sichtbare Nummer.
    const code = a.answers["CHBB16"];
    if (code == null || code === "") {
      throw new Error("Registrierung ohne codiertes BB16 — Route nicht bestimmbar, keine Fallnummer");
    }
    // FALL ZUERST: Fallnummer vergeben, Route und openedAt setzen — DANN das
    // Formular sperren (nicht den dokumentierten Produktionsdefekt nachbauen).
    if (fall.fallnummer === null) fall.fallnummer = vergibFallnummer(jetzt);
    if (fall.route === null) fall.route = sdaRoute(code);
    fall.openedAt = jetzt;
    // Das Registrierungsformular trägt seine Fallnummer unter dem i-Code iA5d.
    a.answers["iA5d"] = fall.fallnummer;
  }

  a.vorschlaege = {};
  a.status = "gesperrt";
  a.gesperrtAm = jetzt;
  a.gesperrtVon = gesperrtVon;
  a.zuletztBearbeitetAm = jetzt;

  if (a.typ === "discharge") {
    fall.closedAt = jetzt;
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

  if (a.typ === "interrai_hc") prefillSignaturHc(a, gesperrtVon);
  markiereVollstaendig(a);
  if (a.status !== "vollstaendig") {
    throw new Error("Formular ist nicht vollständig — Sperren nicht zulässig");
  }
  wendeSperreAn(a, gesperrtVon, new Date().toISOString());
}

// ── Computed helpers ─────────────────────────────────────────────────────────

/** Returns the number of active (non-skipped) fields that have no answer yet. */
export function getOpenFieldCount(assessment: Formular): number {
  // Typabhängig: die Registrierung zählt gegen den SDA-Katalog (Schlüssel iCode),
  // nicht gegen den HC. Ein Item gilt als beantwortet, wenn ein Wert vorliegt;
  // Unterschriftenfelder zählen mit.
  if (assessment.typ === "registration") {
    return SDA_KATALOG.filter((item) => {
      const v = assessment.answers[item.iCode];
      return v == null || v === "";
    }).length;
  }
  if (assessment.typ !== "interrai_hc") return 0; // kein Katalog für cmh/housekeeping/discharge
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

/** Total active (non-skipped) fields for an assessment — typabhängig. */
export function getActiveFieldCount(assessment: Formular): number {
  if (assessment.typ === "registration") return SDA_KATALOG.length;
  if (assessment.typ !== "interrai_hc") return 0;
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
    case "registration": return "Registrierung";
    case "interrai_hc": return "interRAI HC";
    case "interrai_cmh": return "interRAI CMH";
    case "housekeeping": return "Hauswirtschaft";
    case "discharge": return "Entlassung";
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
