/**
 * Mock data for klinische Artefakte — Lead-Konvertierungs-Modell.
 * 4 scenarios: konvertiert (Anna Müller), laufendes OB (Fritz Huber),
 * leeres OB (Rosa Ammann), abgebrochenes OB (Walter Frei).
 */
import type { InterRAIAssessment, InterRAIItem, AnnaKonfidenz, CapResult, OutcomeScale, Pflegeplanung, Pflegediagnose, Massnahme, Pflegeziel, KLVVerordnung, WorkflowPlan, WorkflowSchritt, AerztlicheDiagnose } from "../../types/klinische-artefakte";

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

export const DEMO_CAPS: CapResult[] = [
  { id: "CAP-MOOD", name: "Stimmung (Mood)", getriggert: true, triggerItems: ["E1a", "E2a", "E2c", "F2"], prioritaet: "hoch", beschreibung: "Depressive Symptome: Traurigkeit, Interessenverlust, Schlafprobleme, Rückzug." },
  { id: "CAP-FALLS", name: "Sturzgefahr (Falls)", getriggert: true, triggerItems: ["G1fa", "J1a", "Q3a"], prioritaet: "hoch", beschreibung: "Sturz in letzten 30 Tagen, eingeschränkte Mobilität, Umgebungsrisiken." },
  { id: "CAP-CARDIO", name: "Herz-Kreislauf", getriggert: true, triggerItems: ["I2k", "J6b", "M1"], prioritaet: "mittel", beschreibung: "Hypertonie mit Belastungsdyspnoe und Polypharmazie." },
];

export const DEMO_SCALES: OutcomeScale[] = [
  { id: "CPS", name: "Cognitive Performance Scale", abkuerzung: "CPS", wert: 0, maxWert: 6, interpretation: "Intakt", richtung: "hoeher-schlechter" },
  { id: "DRS", name: "Depression Rating Scale", abkuerzung: "DRS", wert: 7, maxWert: 14, interpretation: "Mittelgradige Symptomatik", richtung: "hoeher-schlechter" },
  { id: "ADL-H", name: "ADL-Hierarchie", abkuerzung: "ADL-H", wert: 1, maxWert: 6, interpretation: "Geringe Einschränkung", richtung: "hoeher-schlechter" },
  { id: "IADL", name: "IADL-Kapazität", abkuerzung: "IADL", wert: 3, maxWert: 6, interpretation: "Erhöhter Hilfsbedarf", richtung: "hoeher-schlechter" },
  { id: "PAIN", name: "Schmerzskala", abkuerzung: "PAIN", wert: 1, maxWert: 3, interpretation: "Gelegentlich", richtung: "hoeher-schlechter" },
];

const ANNA_DIAGNOSEN: Pflegediagnose[] = [
  { id: "PD1", nandaCode: "00155", titel: "Sturzgefahr", bezugCap: "CAP-FALLS", begruendung: "Sturz in letzten 30 Tagen, eingeschränkte Mobilität, Umgebungsrisiken Bad.", status: "akzeptiert", icdIds: ["AD-A1"] },
  { id: "PD2", nandaCode: "00095", titel: "Schlafstörung", bezugCap: "CAP-MOOD", begruendung: "Einschlafprobleme bei mittelgradiger Depression.", status: "akzeptiert", icdIds: ["AD-A3"] },
  { id: "PD3", nandaCode: "00241", titel: "Beeinträchtigte Stimmungsregulation", bezugCap: "CAP-MOOD", begruendung: "Anhaltende Traurigkeit, Interessenverlust, Rückzug.", status: "akzeptiert", icdIds: ["AD-A3"] },
];

const ANNA_MASSNAHMEN: Massnahme[] = [
  { id: "MA1", titel: "Sturzprophylaxe-Beratung", bezugDiagnoseId: "PD1", beschreibung: "Sturzrisiken besprechen, Haltegriffe empfehlen.", haeufigkeit: "bei Bedarf", status: "akzeptiert" },
  { id: "MA2", titel: "Wohnraum-Anpassung prüfen", bezugDiagnoseId: "PD1", beschreibung: "Ergotherapeutische Abklärung.", haeufigkeit: "einmalig", status: "akzeptiert" },
  { id: "MA3", titel: "Schlafhygiene-Beratung", bezugDiagnoseId: "PD2", beschreibung: "Schlafrituale, Grübel-Strategien.", haeufigkeit: "wöchentlich", status: "akzeptiert" },
  { id: "MA4", titel: "Aktivierung und Tagesstruktur", bezugDiagnoseId: "PD3", beschreibung: "Soziale Kontakte fördern.", haeufigkeit: "wöchentlich", status: "akzeptiert" },
  { id: "MA5", titel: "Blutdruck-Monitoring", bezugDiagnoseId: "PD3", beschreibung: "Regelmässig messen, dokumentieren.", haeufigkeit: "täglich", status: "akzeptiert" },
];

const ANNA_ZIELE: Pflegeziel[] = [
  { id: "Z1", titel: "Sturzfreiheit 3 Monate", bezugDiagnoseId: "PD1", zeithorizont: "3 Monate", messbar: "Kein Sturz bis Re-Assessment", status: "akzeptiert" },
  { id: "Z2", titel: "Schlafqualität verbessern", bezugDiagnoseId: "PD2", zeithorizont: "6 Wochen", messbar: "Einschlafdauer < 30 Min.", status: "akzeptiert" },
  { id: "Z3", titel: "Soziale Teilhabe", bezugDiagnoseId: "PD3", zeithorizont: "2 Monate", messbar: "1x/Woche soziale Aktivität", status: "akzeptiert" },
];

/* ══════════════════════════════════════════
   SZENARIO 1: Anna Müller (konvertiert)
   ══════════════════════════════════════════ */

const ANNA_BA: InterRAIAssessment = {
  id: "BA-2025-001", onboardingId: "ONB-ALT-001", patientId: "P-2026-0041",
  patientName: "Müller, Anna", typ: "erstassessment", status: "abgeschlossen",
  durchgefuehrtVon: "Sandra Weber", startDatum: "15.08.2025", abschlussDatum: "15.08.2025",
  erfassungsgrad: 100, items: DEMO_ITEMS, getriggerteCaps: DEMO_CAPS, outcomeScales: DEMO_SCALES,
};

const ANNA_RE: InterRAIAssessment = {
  id: "BA-2026-010", onboardingId: null, patientId: "P-2026-0041",
  patientName: "Müller, Anna", typ: "re-assessment", status: "in-bearbeitung",
  durchgefuehrtVon: "Sandra Weber", startDatum: "01.03.2026", abschlussDatum: null,
  erfassungsgrad: 42, items: DEMO_ITEMS.slice(0, 13).map(i => ({ ...i, id: `item-${i.code}-BA-2026-010`, assessmentId: "BA-2026-010", validiert: false, status: "teilweise" as const })),
  getriggerteCaps: [], outcomeScales: [],
};

const ANNA_PP: Pflegeplanung = {
  id: "PP-2025-001", onboardingId: "ONB-ALT-001", patientId: "P-2026-0041",
  patientName: "Müller, Anna", interRAIAssessmentId: "BA-2025-001",
  status: "abgeschlossen", erstelltVon: "Sandra Weber",
  erstellDatum: "16.08.2025", abschlussDatum: "16.08.2025",
  pflegediagnosen: ANNA_DIAGNOSEN, massnahmen: ANNA_MASSNAHMEN, ziele: ANNA_ZIELE,
};

const ANNA_KLV: KLVVerordnung = {
  id: "KLV-2025-001", onboardingId: "ONB-ALT-001", patientId: "P-2026-0041",
  patientName: "Müller, Anna", pflegeplanungId: "PP-2025-001",
  status: "kostengutsprache-erhalten", erstelltVon: "Sandra Weber",
  erstellDatum: "17.08.2025", beginnDatum: "01.09.2025", endDatum: "28.02.2026",
  diagnosen: [
    { id: "KD1", icdCode: "I10", titel: "Arterielle Hypertonie", beschreibung: "Langjährig, medikamentös." },
    { id: "KD2", icdCode: "E11", titel: "Diabetes Typ 2", beschreibung: "Seit 2020, oral." },
    { id: "KD3", icdCode: "F32.1", titel: "Mittelgradige Depression", beschreibung: "Seit 2024, Sertralin." },
  ],
  leistungspositionen: [
    // Kat a – Abklärung und Beratung
    { id: "LP1", klvNummer: "10901", bezeichnung: "Erstassessment", kategorie: "a", wer: "S", training: "N", anzahl: 1, einheit: "e", zeitMin: 60, ausAnna: true, annaKonfidenz: "hoch", validiert: true, simultanGruppe: null, bezugMassnahmeId: null, diagnoseIds: [], wzwBegruendung: null },
    { id: "LP2", klvNummer: "10904", bezeichnung: "Pflegeplanung erstmalig im Rahmen der Bedarfsabklärung", kategorie: "a", wer: "S", training: "N", anzahl: 1, einheit: "e", zeitMin: 30, ausAnna: true, annaKonfidenz: "hoch", validiert: true, simultanGruppe: null, bezugMassnahmeId: null, diagnoseIds: [], wzwBegruendung: null },
    { id: "LP3", klvNummer: "10907", bezeichnung: "Konsultation Arzt – Spitex zur Bedarfsabklärung", kategorie: "a", wer: "S", training: "N", anzahl: 1, einheit: "e", zeitMin: 11, ausAnna: true, annaKonfidenz: "mittel", validiert: true, simultanGruppe: null, bezugMassnahmeId: null, diagnoseIds: [], wzwBegruendung: null },
    { id: "LP4", klvNummer: "10909", bezeichnung: "Pflegeanleitung/Beratung Klientin oder Angehörige", kategorie: "a", wer: "S", training: "N", anzahl: 1, einheit: "w", zeitMin: 15, ausAnna: true, annaKonfidenz: "hoch", validiert: true, simultanGruppe: null, bezugMassnahmeId: null, diagnoseIds: [], wzwBegruendung: null },
    // Kat b – Untersuchung und Behandlung
    { id: "LP5", klvNummer: "10602", bezeichnung: "Verabreichung gerichtete Medikamente", kategorie: "b", wer: "S", training: "N", anzahl: 1, einheit: "t7", zeitMin: 6, ausAnna: true, annaKonfidenz: "hoch", validiert: true, simultanGruppe: "SIM-1", bezugMassnahmeId: "MA5", diagnoseIds: [], wzwBegruendung: null },
    { id: "LP6", klvNummer: "10802", bezeichnung: "Blutdruckmessung", kategorie: "b", wer: "S", training: "N", anzahl: 1, einheit: "t7", zeitMin: 5, ausAnna: true, annaKonfidenz: "hoch", validiert: true, simultanGruppe: "SIM-1", bezugMassnahmeId: "MA5", diagnoseIds: [], wzwBegruendung: null },
    { id: "LP7", klvNummer: "10808", bezeichnung: "Kapillarblutentnahme inkl. Glucosebestimmung", kategorie: "b", wer: "S", training: "N", anzahl: 1, einheit: "t7", zeitMin: 10, ausAnna: true, annaKonfidenz: "hoch", validiert: true, simultanGruppe: "SIM-1", bezugMassnahmeId: null, diagnoseIds: [], wzwBegruendung: null },
    { id: "LP8", klvNummer: "10110", bezeichnung: "Nägel schneiden Zehen bei Diabetikern", kategorie: "b", wer: "S", training: "N", anzahl: 1, einheit: "m", zeitMin: 20, ausAnna: true, annaKonfidenz: "mittel", validiert: true, simultanGruppe: null, bezugMassnahmeId: null, diagnoseIds: [], wzwBegruendung: null },
    // Kat c – Grundpflege
    { id: "LP9", klvNummer: "10104", bezeichnung: "Teilwäsche am Lavabo (inkl. Intimpflege)", kategorie: "c", wer: "A", training: "T", anzahl: 1, einheit: "t7", zeitMin: 26, ausAnna: true, annaKonfidenz: "hoch", validiert: true, simultanGruppe: null, bezugMassnahmeId: null, diagnoseIds: [], wzwBegruendung: null },
    { id: "LP10", klvNummer: "10114", bezeichnung: "Hilfe An-/Auskleiden", kategorie: "c", wer: "A", training: "T", anzahl: 1, einheit: "t7", zeitMin: 15, ausAnna: true, annaKonfidenz: "hoch", validiert: true, simultanGruppe: null, bezugMassnahmeId: null, diagnoseIds: [], wzwBegruendung: null },
    { id: "LP11", klvNummer: "10505", bezeichnung: "Hilfe beim Gehen", kategorie: "c", wer: "S+A", training: "T", anzahl: 3, einheit: "t7", zeitMin: 8, ausAnna: true, annaKonfidenz: "hoch", validiert: true, simultanGruppe: null, bezugMassnahmeId: "MA1", diagnoseIds: ["PD1"], wzwBegruendung: null },
  ],
  zielformulierungen: ["Sturzprophylaxe", "ADL-Selbstständigkeit", "Medikamenten-Adhärenz"],
  arztAngeordnetAm: "20.08.2025", krankenkasseGutspracheAm: "28.08.2025", ablehnungsgrund: null,
};

/* ══════════════════════════════════════════
   SZENARIO 2: Fritz Huber (laufendes OB)
   ══════════════════════════════════════════ */

const HUBER_BA: InterRAIAssessment = {
  id: "BA-2026-020", onboardingId: "OB-2026-009", patientId: null,
  patientName: "Huber, Fritz", typ: "erstassessment", status: "in-bearbeitung",
  durchgefuehrtVon: "Maria Keller", startDatum: "20.02.2026", abschlussDatum: null,
  erfassungsgrad: 45, items: DEMO_ITEMS.slice(0, 16).map(i => ({ ...i, id: `item-${i.code}-BA-2026-020`, assessmentId: "BA-2026-020", validiert: false, status: "teilweise" as const })),
  getriggerteCaps: [], outcomeScales: [],
};

const HUBER_DIAGNOSEN: Pflegediagnose[] = [
  { id: "PD-H1", nandaCode: "00085", titel: "Beeinträchtigte körperliche Mobilität", bezugCap: null, begruendung: "Chronische Kreuzschmerzen (M54.5) mit eingeschränkter Gehfähigkeit, Treppensteigen nur mit Hilfe, Sturzrisiko erhöht.", status: "vorschlag", icdIds: ["AD-H2"] },
  { id: "PD-H2", nandaCode: "00132", titel: "Akuter Schmerz", bezugCap: null, begruendung: "Chronische lumbale Rückenschmerzen mit Belastungsabhängigkeit, VAS 5-6 bei Mobilisation, Analgetika-Bedarf.", status: "vorschlag", icdIds: ["AD-H2"] },
  { id: "PD-H3", nandaCode: "00108", titel: "Selbstpflegedefizit Körperpflege", bezugCap: null, begruendung: "Eingeschränkte Rumpfbeweglichkeit durch Kreuzschmerzen, Hilfe bei Teilwäsche und An-/Auskleiden der unteren Körperhälfte nötig.", status: "vorschlag", icdIds: ["AD-H2"] },
  { id: "PD-H4", nandaCode: "00078", titel: "Ineffektives Gesundheitsmanagement", bezugCap: null, begruendung: "Arterielle Hypertonie (I10) mit unregelmässiger Medikamenteneinnahme, BD-Werte schwankend, Wissensdefizit Ernährung.", status: "vorschlag", icdIds: ["AD-H1"] },
];

const HUBER_MASSNAHMEN: Massnahme[] = [
  // Zu PD-H1: Mobilität
  { id: "MA-H1", titel: "Mobilisationsförderung nach ENP", bezugDiagnoseId: "PD-H1", beschreibung: "Tägliche Gehübungen in der Wohnung mit Rollator, Steigerung der Gehstrecke von 50m auf 200m.", haeufigkeit: "2×/Tag", status: "vorschlag" },
  { id: "MA-H2", titel: "Sturzprophylaxe-Assessment", bezugDiagnoseId: "PD-H1", beschreibung: "Wohnungsbegehung mit Ergotherapie, Haltegriffe im Bad, rutschfeste Matten, Beleuchtung prüfen.", haeufigkeit: "einmalig", status: "vorschlag" },
  // Zu PD-H2: Schmerz
  { id: "MA-H3", titel: "Schmerzmanagement nach ENP", bezugDiagnoseId: "PD-H2", beschreibung: "Schmerzerfassung mittels VAS vor und nach Mobilisation, Analgetika-Gabe 30 Min. vor geplanter Aktivität.", haeufigkeit: "täglich", status: "vorschlag" },
  { id: "MA-H4", titel: "Wärmeapplikation lumbal", bezugDiagnoseId: "PD-H2", beschreibung: "Wärmekissen oder Kirschkernkissen auf LWS-Bereich, 20 Min., zur Schmerzlinderung und Muskelrelaxation.", haeufigkeit: "2×/Tag", status: "vorschlag" },
  // Zu PD-H3: Selbstpflege
  { id: "MA-H5", titel: "Unterstützung Körperpflege", bezugDiagnoseId: "PD-H3", beschreibung: "Teilwäsche am Lavabo mit Anleitung und Übernahme der unteren Körperhälfte, Förderung der Eigenaktivität.", haeufigkeit: "täglich", status: "vorschlag" },
  { id: "MA-H6", titel: "Anleitung An-/Auskleiden", bezugDiagnoseId: "PD-H3", beschreibung: "Training energiesparender Techniken (Sitzen beim Ankleiden, Anziehhilfe für Strümpfe), Angehörige einbeziehen.", haeufigkeit: "täglich", status: "vorschlag" },
  // Zu PD-H4: Gesundheitsmanagement
  { id: "MA-H7", titel: "Blutdruck-Monitoring und Schulung", bezugDiagnoseId: "PD-H4", beschreibung: "Tägliche BD-Messung mit Dokumentation, Zielwert < 140/90, Beratung zu Salz-Reduktion und Bewegung.", haeufigkeit: "täglich", status: "vorschlag" },
  { id: "MA-H8", titel: "Medikamenten-Management", bezugDiagnoseId: "PD-H4", beschreibung: "Wochendispenser richten, Einnahme-Kontrolle, Wechselwirkungen erklären, Hausarzt-Rückmeldung bei BD > 160.", haeufigkeit: "wöchentlich", status: "vorschlag" },
];

const HUBER_ZIELE: Pflegeziel[] = [
  { id: "Z-H1", titel: "Gehstrecke auf 200m steigern", bezugDiagnoseId: "PD-H1", zeithorizont: "6 Wochen", messbar: "Gehstrecke ≥ 200m ohne Pause, gemessen mit Schrittzähler", status: "vorschlag" },
  { id: "Z-H2", titel: "Schmerzreduktion unter VAS 3", bezugDiagnoseId: "PD-H2", zeithorizont: "4 Wochen", messbar: "VAS ≤ 3 in Ruhe und ≤ 5 bei Belastung an mind. 5 von 7 Tagen", status: "vorschlag" },
  { id: "Z-H3", titel: "Selbstständigkeit Oberkörperpflege", bezugDiagnoseId: "PD-H3", zeithorizont: "3 Monate", messbar: "Oberkörper-Wäsche und -Ankleiden ohne Hilfe an 7/7 Tagen", status: "vorschlag" },
  { id: "Z-H4", titel: "BD stabil unter 140/90", bezugDiagnoseId: "PD-H4", zeithorizont: "8 Wochen", messbar: "BD < 140/90 mmHg an mind. 5 von 7 Messtagen, keine Vergesslichkeit bei Einnahme", status: "vorschlag" },
];

const HUBER_PP: Pflegeplanung = {
  id: "PP-2026-020", onboardingId: "OB-2026-009", patientId: null,
  patientName: "Huber, Fritz", interRAIAssessmentId: null,
  status: "entwurf", erstelltVon: "Maria Keller",
  erstellDatum: "25.02.2026", abschlussDatum: null,
  pflegediagnosen: HUBER_DIAGNOSEN, massnahmen: HUBER_MASSNAHMEN, ziele: HUBER_ZIELE,
};

const HUBER_KLV: KLVVerordnung = {
  id: "KLV-2026-020", onboardingId: "OB-2026-009", patientId: null,
  patientName: "Huber, Fritz", pflegeplanungId: null,
  status: "entwurf", erstelltVon: "Maria Keller",
  erstellDatum: "25.02.2026", beginnDatum: null, endDatum: null,
  diagnosen: [
    { id: "KD-H1", icdCode: "I10", titel: "Arterielle Hypertonie", beschreibung: "Seit mehreren Jahren bekannt." },
    { id: "KD-H2", icdCode: "M54.5", titel: "Kreuzschmerzen", beschreibung: "Chronisch, einschränkend." },
  ],
  leistungspositionen: [
    // Kat a – Abklärung
    { id: "LP-H1", klvNummer: "10901", bezeichnung: "Erstassessment", kategorie: "a", wer: "S", training: "N", anzahl: 1, einheit: "e", zeitMin: 60, ausAnna: true, annaKonfidenz: "hoch", validiert: false, simultanGruppe: null, bezugMassnahmeId: null, diagnoseIds: [], wzwBegruendung: null },
    { id: "LP-H2", klvNummer: "10904", bezeichnung: "Pflegeplanung erstmalig im Rahmen der Bedarfsabklärung", kategorie: "a", wer: "S", training: "N", anzahl: 1, einheit: "e", zeitMin: 30, ausAnna: true, annaKonfidenz: "hoch", validiert: false, simultanGruppe: null, bezugMassnahmeId: null, diagnoseIds: [], wzwBegruendung: null },
    // Kat b – Untersuchung und Behandlung
    { id: "LP-H3", klvNummer: "10602", bezeichnung: "Verabreichung gerichtete Medikamente", kategorie: "b", wer: "S", training: "N", anzahl: 1, einheit: "t7", zeitMin: 6, ausAnna: true, annaKonfidenz: "hoch", validiert: false, simultanGruppe: "SIM-H1", bezugMassnahmeId: null, diagnoseIds: [], wzwBegruendung: null },
    { id: "LP-H4", klvNummer: "10802", bezeichnung: "Blutdruckmessung", kategorie: "b", wer: "S", training: "N", anzahl: 1, einheit: "t7", zeitMin: 5, ausAnna: true, annaKonfidenz: "mittel", validiert: false, simultanGruppe: "SIM-H1", bezugMassnahmeId: null, diagnoseIds: [], wzwBegruendung: null },
    { id: "LP-H5", klvNummer: "10801", bezeichnung: "Gesundheitskontrolle (Vitalparameter)", kategorie: "b", wer: "S", training: "N", anzahl: 1, einheit: "w", zeitMin: 5, ausAnna: true, annaKonfidenz: "mittel", validiert: false, simultanGruppe: null, bezugMassnahmeId: null, diagnoseIds: [], wzwBegruendung: null },
    // Kat c – Grundpflege
    { id: "LP-H6", klvNummer: "10104", bezeichnung: "Teilwäsche am Lavabo (inkl. Intimpflege)", kategorie: "c", wer: "A", training: "T", anzahl: 1, einheit: "t7", zeitMin: 26, ausAnna: true, annaKonfidenz: "hoch", validiert: false, simultanGruppe: null, bezugMassnahmeId: null, diagnoseIds: [], wzwBegruendung: null },
    { id: "LP-H7", klvNummer: "10114", bezeichnung: "Hilfe An-/Auskleiden", kategorie: "c", wer: "A", training: "N", anzahl: 1, einheit: "t7", zeitMin: 15, ausAnna: true, annaKonfidenz: "niedrig", validiert: false, simultanGruppe: null, bezugMassnahmeId: null, diagnoseIds: [], wzwBegruendung: null },
    { id: "LP-H8", klvNummer: "10505", bezeichnung: "Hilfe beim Gehen", kategorie: "c", wer: "S+A", training: "T", anzahl: 2, einheit: "t7", zeitMin: 8, ausAnna: true, annaKonfidenz: "hoch", validiert: false, simultanGruppe: null, bezugMassnahmeId: null, diagnoseIds: [], wzwBegruendung: null },
  ],
  zielformulierungen: ["Selbstständigkeit im Alltag erhalten", "Sturzprävention"],
  arztAngeordnetAm: null, krankenkasseGutspracheAm: null, ablehnungsgrund: null,
};

/* ══════════════════════════════════════════
   SZENARIO 3: Rosa Ammann (OB ohne Artefakte)
   — kein Eintrag nötig, Listen sind einfach leer
   ══════════════════════════════════════════ */

/* ══════════════════════════════════════════
   SZENARIO 4: Walter Frei (abgebrochenes OB)
   ══════════════════════════════════════════ */

const FREI_BA: InterRAIAssessment = {
  id: "BA-2026-030", onboardingId: "OB-2026-011", patientId: null,
  patientName: "Frei, Walter", typ: "erstassessment", status: "in-bearbeitung",
  durchgefuehrtVon: "Laura Brunner", startDatum: "15.02.2026", abschlussDatum: null,
  erfassungsgrad: 12, items: DEMO_ITEMS.slice(0, 4).map(i => ({ ...i, id: `item-${i.code}-BA-2026-030`, assessmentId: "BA-2026-030", validiert: false, status: "teilweise" as const })),
  getriggerteCaps: [], outcomeScales: [],
};

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
  "2026-01-15", "2026-01-17", "2026-01-20", "2026-01-22", "2026-01-25",
  "2026-01-28", "2026-01-30", "2026-02-03", "2026-02-05", "2026-02-08",
  "2026-02-10", "2026-02-12", "2026-02-15", "2026-02-20", "2026-02-28",
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
      overdue: !isDone && new Date(iso) < new Date("2026-03-03"),
    };
  });
}

const ANNA_WORKFLOW: WorkflowPlan = {
  id: "WF-2025-001", typ: "patient-prozess", onboardingId: "ONB-ALT-001", patientId: "P-2026-0041", angehoerigerId: null,
  bezeichnung: "Patient Prozess — Müller, Anna",
  schritte: buildSchritte(12),
};

const HUBER_WORKFLOW: WorkflowPlan = {
  id: "WF-2026-020", typ: "patient-prozess", onboardingId: "OB-2026-009", patientId: null, angehoerigerId: null,
  bezeichnung: "Patient Prozess — Huber, Fritz",
  schritte: buildSchritte(3),
};

// Angehöriger Monatsschritte
const ANGEH_SCHRITTE_LABELS = ["Regelkontrolle", "Mikroschulung", "Fallbesprechung", "Arbeitskontrolle", "Mikroschulung", "Kundenfeedback", "SRK-Prüfung Anmeldung"];
const ANGEH_VERANTWORTLICHE = ["Sandra Weber", "Sandra Weber", "Team", "Sandra Weber", "Sandra Weber", "Patient/Angehörige", "HR-Abteilung"];
const ANGEH_FAELLIG = ["2026-02-05", "2026-02-10", "2026-02-15", "2026-02-20", "2026-02-25", "2026-02-28", "2026-03-05"];

function buildAngehSchritte(doneCount: number): WorkflowSchritt[] {
  return ANGEH_SCHRITTE_LABELS.map((label, i) => {
    const isDone = i < doneCount;
    const iso = ANGEH_FAELLIG[i];
    const [y, m, d] = iso.split("-");
    return { nr: i + 1, label, status: isDone ? "abgeschlossen" : "offen", dueDate: iso, dueDateDisplay: `${d}.${m}.${y}`, assignee: ANGEH_VERANTWORTLICHE[i], completedAt: isDone ? `${d}.${m}.${y}, 09:00` : null, overdue: !isDone && new Date(iso) < new Date("2026-03-03") };
  });
}

const ANNA_ANGEH_WORKFLOW: WorkflowPlan = {
  id: "WF-A-2025-001", typ: "angehoeriger-monate", onboardingId: "ONB-ALT-001", patientId: "P-2026-0041", angehoerigerId: null,
  bezeichnung: "Angehöriger Monatsschritte — Müller, Anna",
  schritte: buildAngehSchritte(3),
};

// Angehörigen-eigene Workflows (z.B. für Tochter von Anna Müller)
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
  "2026-01-05", "2026-01-07", "2026-01-08", "2026-01-10", "2026-01-12", "2026-01-14", "2026-01-14",
  "2026-01-15", "2026-01-18", "2026-01-20", "2026-01-22", "2026-01-25", "2026-01-28",
];

function buildAngehOBSchritte(doneCount: number): WorkflowSchritt[] {
  return ANGEH_OB_SCHRITTE.map((label, i) => {
    const isDone = i < doneCount;
    const iso = ANGEH_OB_FAELLIG[i];
    const [y, m, d] = iso.split("-");
    return { nr: i + 1, label, status: isDone ? "abgeschlossen" : "offen", dueDate: iso, dueDateDisplay: `${d}.${m}.${y}`, assignee: ANGEH_OB_VERANTW[i], completedAt: isDone ? `${d}.${m}.${y}, 09:00` : null, overdue: !isDone && new Date(iso) < new Date("2026-03-03") };
  });
}

const TOCHTER_OB_WORKFLOW: WorkflowPlan = {
  id: "WF-ANG-OB-001", typ: "angehoeriger-onboarding", onboardingId: null, patientId: null, angehoerigerId: "A-2026-0041",
  bezeichnung: "Onboarding Prozess",
  schritte: buildAngehOBSchritte(8),
};

const TOCHTER_MONAT_WORKFLOW: WorkflowPlan = {
  id: "WF-ANG-M-001", typ: "angehoeriger-monatsschritte", onboardingId: null, patientId: null, angehoerigerId: "A-2026-0041",
  bezeichnung: "Monatliche Schritte",
  schritte: buildAngehSchritte(3),
};

/* ══════════════════════════════════════════
   ÄRZTLICHE DIAGNOSEN (eigenes Artefakt)
   ══════════════════════════════════════════ */

/** Anna Müller: konvertiert, Diagnosen vom Arzt bereits bestätigt */
const ANNA_ARZT_DIAGNOSEN: AerztlicheDiagnose[] = [
  { id: "AD-A1", onboardingId: "ONB-ALT-001", patientId: "P-2026-0041", icdCode: "I10", bezeichnung: "Arterielle Hypertonie", quelle: "Arzt-Antwort Dr. M. Huber, 18.08.2025", status: "bestaetigt" },
  { id: "AD-A2", onboardingId: "ONB-ALT-001", patientId: "P-2026-0041", icdCode: "E11", bezeichnung: "Diabetes mellitus Typ 2", quelle: "Arzt-Antwort Dr. M. Huber, 18.08.2025", status: "bestaetigt" },
  { id: "AD-A3", onboardingId: "ONB-ALT-001", patientId: "P-2026-0041", icdCode: "F32.1", bezeichnung: "Mittelgradige depressive Episode", quelle: "Arzt-Antwort Dr. M. Huber, 18.08.2025", status: "bestaetigt" },
];

/** Fritz Huber: laufendes OB, Diagnosen noch als Entwurf (aus simulierter Arzt-Antwort) */
const HUBER_ARZT_DIAGNOSEN: AerztlicheDiagnose[] = [
  { id: "AD-H1", onboardingId: "OB-2026-009", patientId: null, icdCode: "I10", bezeichnung: "Arterielle Hypertonie", quelle: "Arzt-Antwort Dr. R. Steiner, 28.02.2026", status: "entwurf" },
  { id: "AD-H2", onboardingId: "OB-2026-009", patientId: null, icdCode: "M54.5", bezeichnung: "Kreuzschmerzen", quelle: "Arzt-Antwort Dr. R. Steiner, 28.02.2026", status: "entwurf" },
  { id: "AD-H3", onboardingId: "OB-2026-009", patientId: null, icdCode: "E78.0", bezeichnung: "Reine Hypercholesterinämie", quelle: "Arzt-Antwort Dr. R. Steiner, 28.02.2026", status: "entwurf" },
];

/* ══════════════════════════════════════════
   COLLECTED EXPORTS
   ══════════════════════════════════════════ */

export const MOCK_ASSESSMENTS: InterRAIAssessment[] = [ANNA_BA, ANNA_RE, HUBER_BA, FREI_BA];
export const MOCK_PFLEGEPLANUNGEN: Pflegeplanung[] = [ANNA_PP, HUBER_PP];
export const MOCK_KLV_VERORDNUNGEN: KLVVerordnung[] = [ANNA_KLV, HUBER_KLV];
export const MOCK_ARZT_DIAGNOSEN: AerztlicheDiagnose[] = [...ANNA_ARZT_DIAGNOSEN, ...HUBER_ARZT_DIAGNOSEN];
/** @deprecated Ersetzt durch Rhythmus-Engine (src/lib/rhythmus/). Nur noch für Typ-Referenz behalten. */
export const MOCK_WORKFLOWS: WorkflowPlan[] = [];
export { ANNA_DIAGNOSEN, ANNA_MASSNAHMEN, ANNA_ZIELE };
