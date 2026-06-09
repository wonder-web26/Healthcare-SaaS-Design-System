/**
 * Demo Gespräch — scripted multi-output conversation.
 * KLV positions reference official SPITEX_LEISTUNGSKATALOG_2025 catalog numbers.
 * DEMO: All content deterministic, no real audio/LLM.
 */
import { SPITEX_LEISTUNGSKATALOG_2025, type LeistungskatalogPosition } from "../klv/spitex-leistungskatalog-2025";

/** Lookup a catalog position by number */
function kat(nr: string): LeistungskatalogPosition | undefined {
  return SPITEX_LEISTUNGSKATALOG_2025.find(p => p.nr === nr);
}

export interface KLVVorschlag {
  klvNummer: string;
  bezeichnung: string;
  kategorie: "a" | "b" | "c";
  zeitMin: number;
  haeufigkeit: string;
  hProWoche: number;
}

export interface GespraechSegment {
  sprecher: "maria" | "klientin" | "tochter";
  text: string;
  delay: number;
  erkannteItems: string[];
  diagnoseVorschlaege: { nandaCode: string; titel: string; begruendung: string }[];
  klvVorschlaege: KLVVorschlag[];
}

function makeKLV(nr: string, haeufigkeit: string, proWoche: number): KLVVorschlag {
  const pos = kat(nr);
  return {
    klvNummer: nr,
    bezeichnung: pos?.bezeichnung || nr,
    kategorie: (pos?.klvKategorie || "c") as "a" | "b" | "c",
    zeitMin: pos?.zeitMin || 0,
    haeufigkeit,
    hProWoche: proWoche,
  };
}

export const DEMO_GESPRAECH: GespraechSegment[] = [
  // Opening — always includes Erstassessment positions
  { sprecher: "maria", text: "Frau Müller, guten Morgen! Danke für Ihre Zeit. Wie geht es Ihnen heute?",
    erkannteItems: [], diagnoseVorschlaege: [],
    klvVorschlaege: [
      makeKLV("10901", "einmalig", 1), // Erstassessment 60 Min
      makeKLV("10904", "einmalig", 0.5), // Pflegeplanung erstmalig 30 Min
    ], delay: 0 },
  { sprecher: "klientin", text: "Guten Morgen. Mir geht es den Umständen entsprechend, danke.",
    erkannteItems: [], diagnoseVorschlaege: [], klvVorschlaege: [], delay: 2500 },
  { sprecher: "maria", text: "Können Sie mir sagen, welcher Wochentag heute ist und wo wir sind?",
    erkannteItems: [], diagnoseVorschlaege: [], klvVorschlaege: [], delay: 4500 },
  { sprecher: "klientin", text: "Heute ist Dienstag. Wir sind bei mir zuhause, in der Wohnstube.",
    erkannteItems: ["C1", "C2a", "A11", "A13"], diagnoseVorschlaege: [], klvVorschlaege: [], delay: 7000 },

  // Living, support → Angehörigen-Beratung
  { sprecher: "maria", text: "Leben Sie alleine oder mit jemandem zusammen?",
    erkannteItems: [], diagnoseVorschlaege: [], klvVorschlaege: [], delay: 10000 },
  { sprecher: "klientin", text: "Mein Mann lebt hier mit mir. Unsere Tochter schaut regelmässig vorbei.",
    erkannteItems: ["P1"], diagnoseVorschlaege: [], klvVorschlaege: [], delay: 12500 },
  { sprecher: "tochter", text: "Ich komme zwei bis drei Mal pro Woche. Können Sie mir zeigen, wie ich Mama besser helfen kann?",
    erkannteItems: [], diagnoseVorschlaege: [],
    klvVorschlaege: [
      makeKLV("10909", "1x/Woche", 0.25), // Pflegeanleitung Angehörige 15 Min
    ], delay: 15000 },

  // ADL → Körperpflege, An-/Auskleiden
  { sprecher: "maria", text: "Können Sie sich selbstständig waschen und ankleiden?",
    erkannteItems: [], diagnoseVorschlaege: [], klvVorschlaege: [], delay: 18000 },
  { sprecher: "klientin", text: "Waschen schon, aber mein Mann richtet die Sachen. Beim Duschen ist er dabei, weil ich einmal fast ausgerutscht bin.",
    erkannteItems: ["G2a"], diagnoseVorschlaege: [],
    klvVorschlaege: [
      makeKLV("10104", "5x/Woche", 2.17), // Teilwäsche am Lavabo 26 Min
      makeKLV("10114", "5x/Woche", 1.25), // Hilfe An-/Auskleiden 15 Min
    ], delay: 21000 },

  // Mobility, fall → Sturzgefahr, Mobilitätstraining
  { sprecher: "maria", text: "Wie ist es mit dem Gehen und Treppensteigen?",
    erkannteItems: [], diagnoseVorschlaege: [], klvVorschlaege: [], delay: 24500 },
  { sprecher: "klientin", text: "In der Wohnung geht es. Aber Treppen sind schwierig mit dem Knie, da brauche ich Hilfe.",
    erkannteItems: ["G1fa", "G2c"], diagnoseVorschlaege: [],
    klvVorschlaege: [
      makeKLV("10505", "3x/Woche", 0.4), // Hilfe beim Gehen 8 Min
    ], delay: 27000 },
  { sprecher: "tochter", text: "Sie ist letzten Monat im Bad gestürzt. Zum Glück nichts gebrochen.",
    erkannteItems: ["J1a", "Q3a"],
    diagnoseVorschlaege: [{ nandaCode: "00155", titel: "Sturzgefahr", begruendung: "Sturz in letzten 30 Tagen, eingeschränkte Mobilität Treppen, Umgebungsrisiken Bad." }],
    klvVorschlaege: [], delay: 30000 },

  // Mood, sleep → Depression
  { sprecher: "maria", text: "Wie schlafen Sie? Können Sie gut einschlafen?",
    erkannteItems: [], diagnoseVorschlaege: [], klvVorschlaege: [], delay: 33500 },
  { sprecher: "klientin", text: "Das Einschlafen ist schwierig. Ich liege oft wach und grüble. Tagsüber keine Lust auf nichts.",
    erkannteItems: ["E1a", "E2a", "E3a"],
    diagnoseVorschlaege: [{ nandaCode: "00095", titel: "Schlafstörung", begruendung: "Einschlafprobleme, Grübeln, Tagesmüdigkeit bei Depression." }],
    klvVorschlaege: [], delay: 36500 },
  { sprecher: "maria", text: "Treffen Sie sich noch mit Freundinnen?",
    erkannteItems: [], diagnoseVorschlaege: [], klvVorschlaege: [], delay: 40000 },
  { sprecher: "klientin", text: "Früher Strickkränzli jede Woche. Jetzt mag ich nicht mehr.",
    erkannteItems: ["F2"],
    diagnoseVorschlaege: [{ nandaCode: "00241", titel: "Beeinträchtigte Stimmungsregulation", begruendung: "Anhaltende Traurigkeit, Interessenverlust, Rückzug." }],
    klvVorschlaege: [], delay: 43000 },

  // Pain, cardio, diabetes → Medikamente, Blutdruck
  { sprecher: "maria", text: "Haben Sie Schmerzen?",
    erkannteItems: [], diagnoseVorschlaege: [], klvVorschlaege: [], delay: 46500 },
  { sprecher: "klientin", text: "Das Knie bei Belastung. Manchmal kurzatmig bei Treppen. Und ich habe ja den Bluthochdruck und den Zucker.",
    erkannteItems: ["J6b", "J1a", "I2k", "I2u"],
    diagnoseVorschlaege: [],
    klvVorschlaege: [
      makeKLV("10802", "5x/Woche", 0.42), // Blutdruckmessung 5 Min
      makeKLV("10808", "7x/Woche", 1.17), // Kapillarblut/Glucose 10 Min
      makeKLV("10602", "7x/Woche", 0.7), // Verabreichung gerichtete Medikamente 6 Min
    ], delay: 49000 },

  // Eating, medications
  { sprecher: "maria", text: "Wie ist es mit Essen und Medikamenten?",
    erkannteItems: [], diagnoseVorschlaege: [], klvVorschlaege: [], delay: 52500 },
  { sprecher: "klientin", text: "Kochen macht mein Mann. Medikamente vergesse ich manchmal, er erinnert mich. Penicillin-Allergie ist bekannt.",
    erkannteItems: ["G2d", "K1b", "O1", "M1", "M3"],
    diagnoseVorschlaege: [],
    klvVorschlaege: [
      makeKLV("10110", "1x/Monat", 0.08), // Nägel Zehen bei Diabetikern 20 Min
      makeKLV("10907", "1x/Monat", 0.05), // Konsultation Arzt-Spitex 11 Min
    ], delay: 55500 },

  // Hospital, doctor, remaining items
  { sprecher: "maria", text: "Waren Sie in den letzten Monaten im Spital?",
    erkannteItems: [], diagnoseVorschlaege: [], klvVorschlaege: [], delay: 59000 },
  { sprecher: "klientin", text: "Nein. Aber ich gehe alle drei Monate zum Hausarzt.",
    erkannteItems: ["B2", "N1k"], diagnoseVorschlaege: [], klvVorschlaege: [], delay: 61500 },

  // Closing — remaining items recognized in bulk
  { sprecher: "maria", text: "Vielen Dank, Frau Müller. Sie haben mir sehr geholfen. Ich stelle das jetzt zusammen.",
    erkannteItems: ["D1", "H1", "L1", "R2", "S1"],
    diagnoseVorschlaege: [], klvVorschlaege: [], delay: 64000 },
];
