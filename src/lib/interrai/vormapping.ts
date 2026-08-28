/**
 * Vormapping: Onboarding-Feldname → i-Code, an EINER Stelle.
 *
 * Ein vorgemapptes Feld ist dasselbe Datum wie das SDA-Item — ein Wert, zwei
 * Ansichten. Der Zugriff löst die Herkunft auf:
 *   klient   → Patientenfeld (lesen/schreiben)
 *   fall     → Fallnummer (nur lesen)
 *   formular → Antwort des Registrierungsformulars unter dem i-Code
 *
 * Ist das Registrierungsformular gesperrt, wirft der Schreibzugriff. Existiert
 * es beim ersten Schreibzugriff eines formular-Feldes noch nicht, wird es
 * angelegt (offenenFallSicherstellen + erstelleNaechstesFormular).
 *
 * Felder mit Herkunft `klient` werden NICHT vorgemappt — sie greifen über die
 * Durchleseregel des Registrierungsformulars (Onboarding schreibt den
 * Patienten, das Formular liest ihn durch). Hier steht daher nur, was über die
 * Formularantworten läuft.
 */
import {
  registrierungFuerOnboarding,
  getPersonByOnboardingId,
  getOrCreatePersonForOnboarding,
  offenenFallSicherstellen,
  erstelleNaechstesFormular,
  offenerFallFuerKlient,
  updateAssessmentAnswers,
  istGesperrt,
} from "./store";
import { getPatient, patientFuerOnboarding, aktualisierePatient } from "../patienten/store";
import { sdaHerkunft, SDA_PATIENT_FELD } from "./katalog/sda-herkunft";

/** Onboarding-Feldname → i-Code. Genau die vorgemappten Felder. */
export const ONBOARDING_ICODE_MAPPING: Readonly<Record<string, string>> = {
  spitalaufenthalte: "iA13", // BB11 — Herkunft formular
};

/** Patient eines Onboardings, über den bestehenden Personen-Link. */
function patientFuerOnboardingId(onboardingId: string) {
  const person = getPersonByOnboardingId(onboardingId);
  if (person?.patientId) return getPatient(person.patientId);
  return patientFuerOnboarding(onboardingId);
}

export function leseVorgemapptesFeld(onboardingId: string, feldname: string): unknown {
  const iCode = ONBOARDING_ICODE_MAPPING[feldname];
  if (!iCode) return undefined;
  const h = sdaHerkunft(iCode);
  if (h === "klient") {
    const feld = SDA_PATIENT_FELD[iCode];
    const pat = patientFuerOnboardingId(onboardingId);
    return feld && pat ? (pat as unknown as Record<string, unknown>)[feld] : undefined;
  }
  if (h === "fall") {
    const person = getPersonByOnboardingId(onboardingId);
    const fall = person ? offenerFallFuerKlient(person.id) : undefined;
    return fall?.fallnummer ?? undefined;
  }
  // formular
  return registrierungFuerOnboarding(onboardingId)?.answers[iCode] ?? undefined;
}

export function schreibeVorgemapptesFeld(onboardingId: string, feldname: string, wert: unknown): void {
  const iCode = ONBOARDING_ICODE_MAPPING[feldname];
  if (!iCode) return;
  const h = sdaHerkunft(iCode);
  const value = wert == null ? "" : String(wert);

  if (h === "fall") throw new Error(`Feld "${feldname}" (${iCode}) ist ein Fall-Feld und nur lesbar`);

  if (h === "klient") {
    const feld = SDA_PATIENT_FELD[iCode];
    const pat = patientFuerOnboardingId(onboardingId);
    if (feld && pat) aktualisierePatient(pat.id, { [feld]: value } as unknown as Parameters<typeof aktualisierePatient>[1]);
    return;
  }

  // formular → Antwort des Registrierungsformulars. Existiert es nicht, anlegen;
  // ist es gesperrt, werfen (Materialisierung ist unveränderlich).
  let reg = registrierungFuerOnboarding(onboardingId);
  if (!reg) {
    const person = getOrCreatePersonForOnboarding(onboardingId, "Patient", "");
    const fall = offenenFallSicherstellen(person.id);
    reg = erstelleNaechstesFormular(fall.id);
  }
  if (istGesperrt(reg)) throw new Error("Registrierung ist gesperrt — Feld nur noch lesbar");
  updateAssessmentAnswers(reg.id, { ...reg.answers, [iCode]: value });
}
