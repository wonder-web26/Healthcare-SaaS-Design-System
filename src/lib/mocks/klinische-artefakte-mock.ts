/**
 * Mock data for klinische Artefakte — Lead-Konvertierungs-Modell.
 *
 * Drei Szenarien: konvertiert (Steiner, Alt-Fall, über patientId), laufendes
 * Onboarding (Fritz Huber, OB-2026-105) und der vollständige Demo-Fall
 * (Hans-Rudolf Steiner, OB-2026-101).
 *
 * Fallkennungen stammen aus lib/onboarding/faelle.ts. Artefakte an Kennungen
 * ausserhalb dieses Verzeichnisses wären über die Oberfläche nicht erreichbar.
 */
import type { InterRAIAssessment, InterRAIItem, AnnaKonfidenz, CapResult, OutcomeScale, WorkflowPlan, WorkflowSchritt, AerztlicheDiagnose } from "../../types/klinische-artefakte";
import { GEGENWART } from "../gegenwart";

/* ══════════════════════════════════════════
   DEMO ITEMS (30 items, A–S)
   Self-contained factory — the old interrai-items.ts catalog was deleted.
   ══════════════════════════════════════════ */

// Section names by letter — used by the self-contained makeItem factory
const SEKTION_MAP: Record<string, string> = {
  A: "Identifikation", B: "Kommunikation", C: "Kognition",
  D: "Kommunikation und Sehen", E: "Stimmung und Verhalten",
  F: "Psychosoziales Wohlbefinden", G: "Funktionsstatus",
  H: "Kontinenz", I: "Krankheitsdiagnosen", J: "Gesundheitszustand",
  K: "Ernährungszustand", L: "Mund- und Zahnstatus", M: "Medikamente",
  N: "Behandlungen und Prozeduren", O: "Verantwortlichkeit",
  P: "Soziale Unterstützung", Q: "Umfeld", R: "Potenzial", S: "Entlassungsprognose",
};

function makeItem(
  code: string,
  assessmentId: string,
  antwortWert: string | number | null,
  konfidenz: AnnaKonfidenz | null,
  ausGespraech: boolean,
  zitat: string | null,
): InterRAIItem {
  const sektion = code[0];
  return {
    id: `item-${code}-${assessmentId}`,
    assessmentId,
    code,
    sektion,
    sektionName: SEKTION_MAP[sektion] || sektion,
    frageKurz: code,
    frageVoll: code,
    antwortTyp: typeof antwortWert === "number" ? "zahl" : "skala",
    antwortOptionen: [],
    antwortWert,
    validiert: true,
    ausGespraech,
    gespraechsBeleg: zitat ? { zitat, gespraechId: "GES-2025-001", zeitstempel: "15.08.2025 14:23" } : null,
    annaKonfidenz: konfidenz,
    status: "erfasst",
  };
}

export const DEMO_ITEMS: InterRAIItem[] = [
  makeItem("A11", "BA-2025-001", "1", "hoch", true, "Ich wohne hier in meiner Mietwohnung schon seit 20 Jahren."),
  makeItem("A13", "BA-2025-001", "0", "hoch", true, "Nein, im Spital war ich zuletzt vor drei Jahren, wegen der Galle."),
  makeItem("B2", "BA-2025-001", "1", "hoch", true, "Ja natürlich, ich bin hier geboren und aufgewachsen in Zürich."),
  makeItem("C1", "BA-2025-001", "0", "hoch", true, "Ja, heute ist Donnerstag, ich weiss noch genau, was gestern war."),
  makeItem("C2a", "BA-2025-001", "0", "hoch", true, "Vorher haben wir über die Medikamente gesprochen, das weiss ich noch."),
  makeItem("D1", "BA-2025-001", "0", "hoch", true, "Sie drückt sich klar aus, keine Schwierigkeiten im Gespräch feststellbar."),
  makeItem("E1a", "BA-2025-001", "2", "mittel", true, "Manchmal denke ich, wozu das alles noch. Aber dann kommt die Tochter."),
  makeItem("E2a", "BA-2025-001", "2", "mittel", true, "Früher das Strickkränzli jede Woche. Jetzt mag ich einfach nicht mehr."),
  makeItem("E3a", "BA-2025-001", "0", "hoch", true, "Nein, ich irre nicht umher. Ich bleibe meistens in meinem Sessel."),
  makeItem("F2", "BA-2025-001", "1", "mittel", true, "Ab und zu fühle ich mich schon einsam, besonders am Abend."),
  makeItem("G1fa", "BA-2025-001", "3", "hoch", true, "Treppen sind schwierig mit dem Knie, da brauche ich das Geländer und manchmal Hilfe."),
  makeItem("G2a", "BA-2025-001", "4", "hoch", true, "Beim Duschen brauche ich Hilfe von der Tochter, allein geht das nicht mehr gut."),
  makeItem("G2c", "BA-2025-001", "1", "hoch", true, "Anziehen oben ist okay, da brauche ich keine Hilfe."),
  makeItem("G2d", "BA-2025-001", "3", "hoch", true, "Unten anziehen ist schwierig, mein Mann hilft mir mit den Strümpfen."),
  makeItem("G2e", "BA-2025-001", "0", "hoch", true, "In der Wohnung gehe ich allein, das geht noch gut."),
  makeItem("H1", "BA-2025-001", "0", "hoch", false, null),
  makeItem("I2k", "BA-2025-001", "2", "hoch", true, "Den Blutdruck habe ich schon seit 2018, nehme Tabletten dafür."),
  makeItem("I2u", "BA-2025-001", "2", "hoch", true, "Den Diabetes habe ich seit fünf Jahren, ich messe jeden Morgen."),
  makeItem("J1a", "BA-2025-001", "1", "hoch", true, "Ja, vor drei Wochen bin ich im Bad gestürzt, das war ein Schreck."),
  makeItem("J6b", "BA-2025-001", "1", "mittel", true, "Das Knie tut weh bei Belastung. Manchmal auch beim Aufstehen."),
  makeItem("K1b", "BA-2025-001", 68, null, false, null),
  makeItem("L1", "BA-2025-001", "0", "hoch", false, null),
  makeItem("M1", "BA-2025-001", 7, "mittel", true, "Medikamente nehme ich einige – für den Blutdruck, den Zucker, die Stimmung."),
  makeItem("M3", "BA-2025-001", "1", "niedrig", true, "Da war mal was mit Penicillin, glaube ich. Mein Mann weiss das besser."),
  makeItem("N1k", "BA-2025-001", "0", "hoch", false, null),
  makeItem("O1", "BA-2025-001", "0", "hoch", false, null),
  makeItem("P1", "BA-2025-001", "1", "hoch", true, "Mein Mann lebt hier mit mir. Unsere Tochter schaut regelmässig vorbei."),
  makeItem("Q3a", "BA-2025-001", "1", "hoch", true, "Ja, ich habe ein Telefon neben dem Bett und die Tochter wohnt gleich um die Ecke."),
  makeItem("R2", "BA-2025-001", "2", "mittel", true, "Seit dem Sturz ist es schon schlechter geworden. Vieles traue ich mir nicht mehr zu."),
  makeItem("S1", "BA-2025-001", "Sandra Weber", null, false, null),
];

/* ══════════════════════════════════════════
   CAPs, SCALES, PFLEGEPLANUNG
   ══════════════════════════════════════════ */

/* Lauf 2: auf die vier CAPs der CAP-NANDA-Zuordnung des Pflegeplan-Vertrags
   gestellt (FALLS, ADL, PAIN, MOOD); CAP-CARDIO entfiel — er hatte keine
   Zuordnungsliste. Sichtbare Nebenwirkung: die interRAI-Ansichten dieses
   Alt-Assessments zeigen vier statt drei CAP-Karten. */
export const DEMO_CAPS: CapResult[] = [
  { id: "CAP-FALLS", name: "Sturzgefahr (Falls)", getriggert: true, triggerItems: ["G1fa", "J1a", "Q3a"], prioritaet: "hoch", beschreibung: "Sturz in letzten 30 Tagen, eingeschränkte Mobilität, Umgebungsrisiken." },
  { id: "CAP-ADL", name: "Aktivitäten des täglichen Lebens (ADL)", getriggert: true, triggerItems: ["G1a", "G1b", "G1c"], prioritaet: "hoch", beschreibung: "Hilfebedarf bei Körperpflege und Ankleiden, eingeschränkte Selbstversorgung." },
  { id: "CAP-PAIN", name: "Schmerz (Pain)", getriggert: true, triggerItems: ["J5a", "J5b"], prioritaet: "mittel", beschreibung: "Wiederkehrende Schmerzen mit Auswirkung auf Aktivität und Schlaf." },
  { id: "CAP-MOOD", name: "Stimmung (Mood)", getriggert: true, triggerItems: ["E1a", "E2a", "E2c", "F2"], prioritaet: "hoch", beschreibung: "Depressive Symptome: Traurigkeit, Interessenverlust, Schlafprobleme, Rückzug." },
];

export const DEMO_SCALES: OutcomeScale[] = [
  { id: "CPS", name: "Cognitive Performance Scale", abkuerzung: "CPS", wert: 0, maxWert: 6, interpretation: "Intakt", richtung: "hoeher-schlechter" },
  { id: "DRS", name: "Depression Rating Scale", abkuerzung: "DRS", wert: 7, maxWert: 14, interpretation: "Mittelgradige Symptomatik", richtung: "hoeher-schlechter" },
  { id: "ADL-H", name: "ADL-Hierarchie", abkuerzung: "ADL-H", wert: 1, maxWert: 6, interpretation: "Geringe Einschränkung", richtung: "hoeher-schlechter" },
  { id: "IADL", name: "IADL-Kapazität", abkuerzung: "IADL", wert: 3, maxWert: 6, interpretation: "Erhöhter Hilfsbedarf", richtung: "hoeher-schlechter" },
  { id: "PAIN", name: "Schmerzskala", abkuerzung: "PAIN", wert: 1, maxWert: 3, interpretation: "Gelegentlich", richtung: "hoeher-schlechter" },
];

/* Die Pflegeplanungs-Bestände (Diagnosen, Massnahmen, Ziele, Planungen) sind
   mit der alten Pflegeplanung abgerissen — das neue Pflegeplan-Modul bringt
   eigene Mock-Daten. Siehe docs/schema-delta-pflegeplan.md. */

/* ══════════════════════════════════════════
   SZENARIO 1: Steiner, Hans-Rudolf (konvertiert, Alt-Fall ONB-ALT-001)
   ══════════════════════════════════════════ */

const STEINER_ALT_BA: InterRAIAssessment = {
  id: "BA-2025-001", onboardingId: "ONB-ALT-001", patientId: "P-2026-0041",
  patientName: "Steiner, Hans-Rudolf", typ: "erstassessment", status: "abgeschlossen",
  durchgefuehrtVon: "Sandra Weber", startDatum: "15.08.2025", abschlussDatum: "15.08.2025",
  erfassungsgrad: 100, items: DEMO_ITEMS, getriggerteCaps: DEMO_CAPS, outcomeScales: DEMO_SCALES,
};

const STEINER_ALT_RE: InterRAIAssessment = {
  id: "BA-2026-010", onboardingId: null, patientId: "P-2026-0041",
  patientName: "Steiner, Hans-Rudolf", typ: "re-assessment", status: "in-bearbeitung",
  durchgefuehrtVon: "Sandra Weber", startDatum: "01.03.2026", abschlussDatum: null,
  erfassungsgrad: 42, items: DEMO_ITEMS.slice(0, 13).map(i => ({ ...i, id: `item-${i.code}-BA-2026-010`, assessmentId: "BA-2026-010", validiert: false, status: "teilweise" as const })),
  getriggerteCaps: [], outcomeScales: [],
};


/* ══════════════════════════════════════════
   SZENARIO 2: Fritz Huber (laufendes OB) — OB-2026-105 aus dem Fallverzeichnis.
   Hing zuvor an OB-2026-009, einer Kennung ausserhalb des Verzeichnisses;
   die Artefakte waren dadurch über die Oberfläche nicht erreichbar. Nur die
   Fallkennung wurde gewechselt, Inhalte und Artefakt-Kennungen sind unberührt.
   ══════════════════════════════════════════ */

const HUBER_BA: InterRAIAssessment = {
  id: "BA-2026-020", onboardingId: "OB-2026-105", patientId: null,
  patientName: "Huber, Fritz", typ: "erstassessment", status: "in-bearbeitung",
  durchgefuehrtVon: "Maria Keller", startDatum: "20.02.2026", abschlussDatum: null,
  erfassungsgrad: 45, items: DEMO_ITEMS.slice(0, 16).map(i => ({ ...i, id: `item-${i.code}-BA-2026-020`, assessmentId: "BA-2026-020", validiert: false, status: "teilweise" as const })),
  getriggerteCaps: [], outcomeScales: [],
};

/* ══════════════════════════════════════════
   SZENARIO 3: Rosa Ammann (OB ohne Artefakte)
   — kein Eintrag nötig, Listen sind einfach leer
   ══════════════════════════════════════════ */

/* SZENARIO 4 (Walter Frei, abgebrochenes OB) entfernt: hing an der Kennung
   OB-2026-011, die es im Fallverzeichnis nicht gibt und die über die
   Oberfläche nicht erreichbar war. Kein Fall der Liste trägt den Status
   "abgebrochen", ein Umhängen wäre Erfindung gewesen. */

/* ══════════════════════════════════════════
   WORKFLOW / ACTION PLAN (persistiert)
   ══════════════════════════════════════════ */

const WORKFLOW_SCHRITTE_LABELS = [
  "Erstassessment", "Arzt kontaktiert", "Diagnose & Mediliste erhalten", "KLV erfasst",
  "KLV an Arzt gesendet", "KLV unterschrieben erhalten", "KLV an Versicherung gesendet",
  "Pflegeplan erstellt", "Angehörigen Mappe erstellt", "Pflegediagnose erstellt",
  "InterRAI erstellt", "Medikamente erfasst", "Medlink Schulung", "Zeit nachgetragen",
  "SRK Schulung angemeldet",
];
const WORKFLOW_VERANTWORTLICHE = [
  "Sandra Weber", "Sandra Weber", "Dr. M. Huber", "Kathrin Meier", "Kathrin Meier",
  "Dr. M. Huber", "System", "Sandra Weber", "Sandra Weber", "KI-Assistent",
  "Sandra Weber", "Kathrin Meier", "System", "Sandra Weber", "HR-Abteilung",
];
const WORKFLOW_FAELLIG = [
  "2026-06-18", "2026-06-20", "2026-06-23", "2026-06-25", "2026-06-28",
  "2026-07-01", "2026-07-03", "2026-07-07", "2026-07-09", "2026-07-12",
  "2026-07-14", "2026-07-16", "2026-07-19", "2026-07-24", "2026-08-01",
];

function buildSchritte(doneCount: number): WorkflowSchritt[] {
  return WORKFLOW_SCHRITTE_LABELS.map((label, i) => {
    const isDone = i < doneCount;
    const iso = WORKFLOW_FAELLIG[i];
    const [y, m, d] = iso.split("-");
    return {
      nr: i + 1,
      label,
      status: isDone ? "abgeschlossen" : "offen",
      dueDate: iso,
      dueDateDisplay: `${d}.${m}.${y}`,
      assignee: WORKFLOW_VERANTWORTLICHE[i],
      completedAt: isDone ? `${d}.${m}.${y}, 09:00` : null,
      overdue: !isDone && new Date(iso) < GEGENWART,
    };
  });
}

const STEINER_ALT_WORKFLOW: WorkflowPlan = {
  id: "WF-2025-001", typ: "patient-prozess", onboardingId: "ONB-ALT-001", patientId: "P-2026-0041", angehoerigerId: null,
  bezeichnung: "Patient Prozess — Steiner, Hans-Rudolf",
  schritte: buildSchritte(12),
};

const HUBER_WORKFLOW: WorkflowPlan = {
  id: "WF-2026-020", typ: "patient-prozess", onboardingId: "OB-2026-105", patientId: null, angehoerigerId: null,
  bezeichnung: "Patient Prozess — Huber, Fritz",
  schritte: buildSchritte(3),
};

// Angehöriger Monatsschritte
const ANGEH_SCHRITTE_LABELS = ["Regelkontrolle", "Mikroschulung", "Fallbesprechung", "Arbeitskontrolle", "Mikroschulung", "Kundenfeedback", "SRK-Prüfung Anmeldung"];
const ANGEH_VERANTWORTLICHE = ["Sandra Weber", "Sandra Weber", "Team", "Sandra Weber", "Sandra Weber", "Patient/Angehörige", "HR-Abteilung"];
const ANGEH_FAELLIG = ["2026-07-09", "2026-07-14", "2026-07-19", "2026-07-24", "2026-07-29", "2026-08-01", "2026-08-06"];

function buildAngehSchritte(doneCount: number): WorkflowSchritt[] {
  return ANGEH_SCHRITTE_LABELS.map((label, i) => {
    const isDone = i < doneCount;
    const iso = ANGEH_FAELLIG[i];
    const [y, m, d] = iso.split("-");
    return { nr: i + 1, label, status: isDone ? "abgeschlossen" : "offen", dueDate: iso, dueDateDisplay: `${d}.${m}.${y}`, assignee: ANGEH_VERANTWORTLICHE[i], completedAt: isDone ? `${d}.${m}.${y}, 09:00` : null, overdue: !isDone && new Date(iso) < GEGENWART };
  });
}

const STEINER_ALT_ANGEH_WORKFLOW: WorkflowPlan = {
  id: "WF-A-2025-001", typ: "angehoeriger-monate", onboardingId: "ONB-ALT-001", patientId: "P-2026-0041", angehoerigerId: null,
  bezeichnung: "Angehöriger Monatsschritte — Steiner, Hans-Rudolf",
  schritte: buildAngehSchritte(3),
};

// Angehörigen-eigene Workflows (z.B. für die Angehörige von Steiner)
const ANGEH_OB_SCHRITTE = [
  "Vertrag & Personalien erfasst", "Steuer & Sozialversicherung geprüft", "Partnerdaten erfasst",
  "Kinderzulagen geklärt", "Anstellungskonditionen definiert", "ID / Ausweis hochgeladen",
  "Krankenkassenkarte hochgeladen", "Bankdaten verifiziert", "Quellensteuer-Tarif geprüft",
  "BVG / UVG Anmeldung", "Arbeitsvertrag unterschrieben", "MedLink-Zugang erstellt", "Ersteinsatz-Briefing durchgeführt",
];
const ANGEH_OB_VERANTW = [
  "K. Meier", "K. Meier", "K. Meier", "K. Meier", "S. Weber", "K. Meier", "K. Meier",
  "K. Meier", "M. Keller", "HR-System", "S. Weber", "IT-System", "S. Weber",
];
const ANGEH_OB_FAELLIG = [
  "2026-06-08", "2026-06-10", "2026-06-11", "2026-06-13", "2026-06-15", "2026-06-17", "2026-06-17",
  "2026-06-18", "2026-06-21", "2026-06-23", "2026-06-25", "2026-06-28", "2026-07-01",
];

function buildAngehOBSchritte(doneCount: number): WorkflowSchritt[] {
  return ANGEH_OB_SCHRITTE.map((label, i) => {
    const isDone = i < doneCount;
    const iso = ANGEH_OB_FAELLIG[i];
    const [y, m, d] = iso.split("-");
    return { nr: i + 1, label, status: isDone ? "abgeschlossen" : "offen", dueDate: iso, dueDateDisplay: `${d}.${m}.${y}`, assignee: ANGEH_OB_VERANTW[i], completedAt: isDone ? `${d}.${m}.${y}, 09:00` : null, overdue: !isDone && new Date(iso) < GEGENWART };
  });
}

const TOCHTER_OB_WORKFLOW: WorkflowPlan = {
  id: "WF-ANG-OB-001", typ: "angehoeriger-onboarding", onboardingId: null, patientId: null, angehoerigerId: "A-2026-0101",
  bezeichnung: "Onboarding Prozess",
  schritte: buildAngehOBSchritte(8),
};

const TOCHTER_MONAT_WORKFLOW: WorkflowPlan = {
  id: "WF-ANG-M-001", typ: "angehoeriger-monatsschritte", onboardingId: null, patientId: null, angehoerigerId: "A-2026-0101",
  bezeichnung: "Monatliche Schritte",
  schritte: buildAngehSchritte(3),
};

/* ══════════════════════════════════════════
   ÄRZTLICHE DIAGNOSEN (eigenes Artefakt)
   ══════════════════════════════════════════ */

/** Steiner, Alt-Fall: konvertiert, Diagnosen vom Arzt bereits bestätigt */
const STEINER_ALT_ARZT_DIAGNOSEN: AerztlicheDiagnose[] = [
  { id: "AD-A1", onboardingId: "ONB-ALT-001", patientId: "P-2026-0041", icdCode: "I10", bezeichnung: "Arterielle Hypertonie", quelle: "Arzt-Antwort Dr. M. Huber, 18.08.2025", status: "bestaetigt" },
  { id: "AD-A2", onboardingId: "ONB-ALT-001", patientId: "P-2026-0041", icdCode: "E11", bezeichnung: "Diabetes mellitus Typ 2", quelle: "Arzt-Antwort Dr. M. Huber, 18.08.2025", status: "bestaetigt" },
  { id: "AD-A3", onboardingId: "ONB-ALT-001", patientId: "P-2026-0041", icdCode: "F32.1", bezeichnung: "Mittelgradige depressive Episode", quelle: "Arzt-Antwort Dr. M. Huber, 18.08.2025", status: "bestaetigt" },
];

/** Fritz Huber: laufendes OB, Diagnosen noch als Entwurf (aus simulierter Arzt-Antwort) */
const HUBER_ARZT_DIAGNOSEN: AerztlicheDiagnose[] = [
  { id: "AD-H1", onboardingId: "OB-2026-105", patientId: null, icdCode: "I10", bezeichnung: "Arterielle Hypertonie", quelle: "Arzt-Antwort Dr. R. Steiner, 28.02.2026", status: "entwurf" },
  { id: "AD-H2", onboardingId: "OB-2026-105", patientId: null, icdCode: "M54.5", bezeichnung: "Kreuzschmerzen", quelle: "Arzt-Antwort Dr. R. Steiner, 28.02.2026", status: "entwurf" },
  { id: "AD-H3", onboardingId: "OB-2026-105", patientId: null, icdCode: "E78.0", bezeichnung: "Reine Hypercholesterinämie", quelle: "Arzt-Antwort Dr. R. Steiner, 28.02.2026", status: "entwurf" },
];

/* ══════════════════════════════════════════
   SZENARIO 5: Hans-Rudolf Steiner (OB-2026-101) — vollständiger Demo-Fall
   Klinisch kohärent zu den vorbefüllten Formularen: Hypertonie, Diabetes Typ 2,
   Herzinsuffizienz (NYHA II); Sturzrisiko, Insulinbedarf, Hilfe bei Körperpflege.
   ══════════════════════════════════════════ */

const STEINER_BA: InterRAIAssessment = {
  id: "BA-2026-101", onboardingId: "OB-2026-101", patientId: null,
  patientName: "Steiner, Hans-Rudolf", typ: "erstassessment", status: "abgeschlossen",
  durchgefuehrtVon: "Maria Keller", startDatum: "19.02.2026", abschlussDatum: "22.02.2026",
  erfassungsgrad: 100,
  items: DEMO_ITEMS.map(i => ({ ...i, id: `item-${i.code}-BA-2026-101`, assessmentId: "BA-2026-101", validiert: true, status: "erfasst" as const })),
  getriggerteCaps: [], outcomeScales: [],
};

const STEINER_ARZT_DIAGNOSEN: AerztlicheDiagnose[] = [
  { id: "AD-S1", onboardingId: "OB-2026-101", patientId: null, icdCode: "I10", bezeichnung: "Arterielle Hypertonie", quelle: "Arzt-Antwort Dr. R. Lüthi, 21.02.2026", status: "bestaetigt" },
  { id: "AD-S2", onboardingId: "OB-2026-101", patientId: null, icdCode: "E11", bezeichnung: "Diabetes mellitus Typ 2", quelle: "Arzt-Antwort Dr. R. Lüthi, 21.02.2026", status: "bestaetigt" },
  { id: "AD-S3", onboardingId: "OB-2026-101", patientId: null, icdCode: "I50.1", bezeichnung: "Linksherzinsuffizienz (NYHA II)", quelle: "Arzt-Antwort Dr. R. Lüthi, 21.02.2026", status: "bestaetigt" },
];

/* ══════════════════════════════════════════
   COLLECTED EXPORTS
   ══════════════════════════════════════════ */

export const MOCK_ASSESSMENTS: InterRAIAssessment[] = [STEINER_ALT_BA, STEINER_ALT_RE, HUBER_BA, STEINER_BA];


export const MOCK_ARZT_DIAGNOSEN: AerztlicheDiagnose[] = [...STEINER_ALT_ARZT_DIAGNOSEN, ...HUBER_ARZT_DIAGNOSEN, ...STEINER_ARZT_DIAGNOSEN];
/** @deprecated Ersetzt durch Rhythmus-Engine (src/lib/rhythmus/). Nur noch für Typ-Referenz behalten. */
export const MOCK_WORKFLOWS: WorkflowPlan[] = [];
