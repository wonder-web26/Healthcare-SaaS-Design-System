/**
 * Onboarding-Fälle (Mock) — EINE Quelle für Liste und Assistent.
 *
 * Zuvor lag diese Liste privat in OnboardingListPage; sie ist hierher gezogen,
 * damit Liste und Onboarding-Assistent dieselben Personen und dieselben
 * Fall-Kennungen verwenden. Jede Person trägt eine stabile, fest vergebene
 * Kennung (patientId / angehoerigerId), über die Notizen referenziert werden.
 * Kennungsformat: siehe lib/notizen/notizen.ts.
 */
import { type OnboardingStatus } from "./status";
import { type NotizReferenz } from "../notizen/notizen";

export interface OnboardingFall {
  id: string;
  patientVorname: string;
  patientNachname: string;
  patientId: string;               // stabile Kennung der Person "Patient"
  angehoeriger: string;            // Vorname Nachname
  angehoerigerId: string;          // stabile Kennung der Person "Angehörige"
  /* ── Prozesszustand ── */
  currentStep: number;
  pflichtdokErledigt: number;
  pflichtdokGefordert: number;
  pendenzenOffen: number;
  pendenzenUeberfaellig: number;
  validFrom: string;               // ISO — geplanter Start
  responsibleUserId: string | null;
  /* ── Retain-Felder für Filterleiste/Kopf ── */
  status: OnboardingStatus;
  offen: number;
  abrechnungsstopp: boolean;
  abrechnungsstoppGrund?: string;
  verantwortlich: string;
  verantwortlichInitialen: string;
  eintrittsdatum: string;
  letzteAenderung: string;
  kanton: string;
}

/* Bezugsdatum 31.07.2026. Prozessdaten gemäss Vorgabe; angehoerigerId fest
   vergeben (A-2026-01NN, parallel zur patientId P-2026-01NN). */
export const onboardingFaelle: OnboardingFall[] = [
  { id: "OB-2026-101", patientNachname: "Steiner", patientVorname: "Hans-Rudolf", patientId: "P-2026-0101", angehoeriger: "Vera Steiner", angehoerigerId: "A-2026-0101", currentStep: 6, pflichtdokErledigt: 7, pflichtdokGefordert: 8, pendenzenOffen: 3, pendenzenUeberfaellig: 1, validFrom: "2026-07-28", responsibleUserId: "keller", status: "in_bearbeitung", offen: 3, abrechnungsstopp: false, verantwortlich: "Maria Keller", verantwortlichInitialen: "MK", eintrittsdatum: "18.02.2026", letzteAenderung: "26.02.2026", kanton: "ZH" },
  { id: "OB-2026-102", patientNachname: "Hübscher-Wiederkehr", patientVorname: "Marie-Louise", patientId: "P-2026-0102", angehoeriger: "Beatrice Hübscher-Wiederkehr", angehoerigerId: "A-2026-0102", currentStep: 8, pflichtdokErledigt: 9, pflichtdokGefordert: 9, pendenzenOffen: 1, pendenzenUeberfaellig: 0, validFrom: "2026-08-01", responsibleUserId: "keller", status: "in_bearbeitung", offen: 1, abrechnungsstopp: false, verantwortlich: "Maria Keller", verantwortlichInitialen: "MK", eintrittsdatum: "20.02.2026", letzteAenderung: "25.02.2026", kanton: "SG" },
  { id: "OB-2026-103", patientNachname: "Rexhepi", patientVorname: "Fatmire", patientId: "P-2026-0103", angehoeriger: "Arben Rexhepi", angehoerigerId: "A-2026-0103", currentStep: 2, pflichtdokErledigt: 4, pflichtdokGefordert: 9, pendenzenOffen: 5, pendenzenUeberfaellig: 2, validFrom: "2026-08-03", responsibleUserId: "weber", status: "in_bearbeitung", offen: 5, abrechnungsstopp: true, abrechnungsstoppGrund: "Spezialbewilligung Migrationsamt noch ausstehend", verantwortlich: "Sandra Weber", verantwortlichInitialen: "SW", eintrittsdatum: "10.02.2026", letzteAenderung: "24.02.2026", kanton: "ZH" },
  { id: "OB-2026-104", patientNachname: "Kaya", patientVorname: "Emine", patientId: "P-2026-0104", angehoeriger: "Yusuf Kaya", angehoerigerId: "A-2026-0104", currentStep: 7, pflichtdokErledigt: 8, pflichtdokGefordert: 8, pendenzenOffen: 1, pendenzenUeberfaellig: 0, validFrom: "2026-08-06", responsibleUserId: "weber", status: "in_bearbeitung", offen: 1, abrechnungsstopp: true, abrechnungsstoppGrund: "Kritische Gesundheitslage – ärztliche Freigabe ausstehend", verantwortlich: "Sandra Weber", verantwortlichInitialen: "SW", eintrittsdatum: "05.02.2026", letzteAenderung: "23.02.2026", kanton: "BE" },
  { id: "OB-2026-105", patientNachname: "Huber", patientVorname: "Fritz", patientId: "P-2026-0105", angehoeriger: "Erika Huber", angehoerigerId: "A-2026-0105", currentStep: 4, pflichtdokErledigt: 8, pflichtdokGefordert: 8, pendenzenOffen: 2, pendenzenUeberfaellig: 0, validFrom: "2026-08-07", responsibleUserId: "keller", status: "neu", offen: 2, abrechnungsstopp: false, verantwortlich: "Maria Keller", verantwortlichInitialen: "MK", eintrittsdatum: "24.02.2026", letzteAenderung: "27.02.2026", kanton: "AG" },
  { id: "OB-2026-106", patientNachname: "Da Silva", patientVorname: "Joaquim", patientId: "P-2026-0106", angehoeriger: "Marta Da Silva", angehoerigerId: "A-2026-0106", currentStep: 1, pflichtdokErledigt: 2, pflichtdokGefordert: 8, pendenzenOffen: 4, pendenzenUeberfaellig: 1, validFrom: "2026-08-10", responsibleUserId: null, status: "in_bearbeitung", offen: 4, abrechnungsstopp: false, verantwortlich: "Nicht zugewiesen", verantwortlichInitialen: "", eintrittsdatum: "15.02.2026", letzteAenderung: "26.02.2026", kanton: "LU" },
  { id: "OB-2026-107", patientNachname: "Bösiger", patientVorname: "Anna", patientId: "P-2026-0107", angehoeriger: "Heidi Bösiger", angehoerigerId: "A-2026-0107", currentStep: 5, pflichtdokErledigt: 8, pflichtdokGefordert: 8, pendenzenOffen: 0, pendenzenUeberfaellig: 0, validFrom: "2026-08-12", responsibleUserId: "keller", status: "neu", offen: 0, abrechnungsstopp: false, verantwortlich: "Maria Keller", verantwortlichInitialen: "MK", eintrittsdatum: "26.02.2026", letzteAenderung: "27.02.2026", kanton: "ZH" },
  { id: "OB-2026-108", patientNachname: "Ferrari", patientVorname: "Gino", patientId: "P-2026-0108", angehoeriger: "Lucia Ferrari", angehoerigerId: "A-2026-0108", currentStep: 1, pflichtdokErledigt: 3, pflichtdokGefordert: 8, pendenzenOffen: 2, pendenzenUeberfaellig: 0, validFrom: "2026-08-17", responsibleUserId: "ott", status: "abgeschlossen", offen: 2, abrechnungsstopp: false, verantwortlich: "Robert Ott", verantwortlichInitialen: "RO", eintrittsdatum: "12.02.2026", letzteAenderung: "27.02.2026", kanton: "ZH" },
];

/**
 * Bereits vergebene Kennungen dieser Sitzung.
 *
 * Nötig, weil ein neu begonnener Fall NICHT in onboardingFaelle eingetragen
 * wird — die Liste bleibt der Mockbestand. Ohne dieses Gedächtnis läge die
 * höchste belegte Nummer immer bei 108, und jeder neue Fall bekäme dieselbe
 * Kennung: zwei nacheinander begonnene Onboardings teilten sich Bezugsperson,
 * Status, Aufgaben, Vitalwerte und Patientendatensatz.
 */
const vergebeneKennungen = new Set<string>();

/**
 * Nächste freie Mandatskennung. Wird vergeben, sobald ein neu begonnenes
 * Onboarding den Schritt "Patient" erreicht — ab da trägt der Vorgang seine
 * Kennung unverändert, auch über den Abschluss hinaus.
 *
 * Zählt über den Mockbestand UND die in dieser Sitzung bereits vergebenen
 * Kennungen hinweg weiter, damit keine zweimal herausgegeben wird.
 */
export function naechsteFallKennung(): string {
  let hoechste = 0;
  const nummer = (id: string) => {
    const m = id.match(/^OB-\d{4}-(\d{3})$/);
    return m ? parseInt(m[1], 10) : 0;
  };
  for (const f of onboardingFaelle) hoechste = Math.max(hoechste, nummer(f.id));
  for (const k of vergebeneKennungen) hoechste = Math.max(hoechste, nummer(k));

  const neu = `OB-2026-${hoechste + 1}`;
  vergebeneKennungen.add(neu);
  return neu;
}

export function fallById(id: string | undefined | null): OnboardingFall | undefined {
  return id ? onboardingFaelle.find(f => f.id === id) : undefined;
}

/* ── Personen-Referenzen (Art + Kennung) und Namensauflösung aus der Quelle ── */
export function patientRef(f: OnboardingFall): NotizReferenz { return { art: "patient", kennung: f.patientId }; }
export function angehoerigerRef(f: OnboardingFall): NotizReferenz { return { art: "angehoeriger", kennung: f.angehoerigerId }; }
export function patientAnzeigeName(f: OnboardingFall): string { return `${f.patientVorname} ${f.patientNachname}`; }
export function angehoerigerAnzeigeName(f: OnboardingFall): string { return f.angehoeriger; }
