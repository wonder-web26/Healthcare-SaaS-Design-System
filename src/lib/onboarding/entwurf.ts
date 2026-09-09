/**
 * Onboarding-Entwurf — der gespeicherte Formularstand eines Falls.
 *
 * Vorher schrieben zwei useEffect-Hooks in `OnboardingPage` bei jedem
 * Tastendruck in den Patienten- und den Angehörigenbestand. Damit war
 * «Speichern» ohne Bedeutung: der Knopf zeigte einen Hinweis und schrieb
 * nichts, weil längst alles geschrieben war. Ein Dirty-Zustand hätte eine
 * Gefahr behauptet, die es nicht gab.
 *
 * Jetzt gilt die umgekehrte Ordnung. Formularänderungen leben im
 * Komponentenzustand; erst «Speichern» legt sie hier ab und projiziert sie in
 * die Fachbestände (Patient, angehörige Person, Beziehung).
 *
 * Dieser Bestand hält die Formularwerte selbst, nicht ihre fachliche
 * Abbildung. Grund: das Laden beim Öffnen eines Falls braucht den Rückweg,
 * und der aus `Patient`/`Angehoeriger` wäre verlustbehaftet — beide Abbildungen
 * (`stammdatenAbbilden`, `erhebungAbbilden`) verdichten und lassen Felder
 * fallen. Der Entwurf ist deshalb die Quelle für das Formular, die
 * Fachbestände sind die Quelle für alle anderen Ansichten.
 *
 * Prototyp: keine Persistenz. Ein Neuladen stellt den Ausgangsstand her.
 */
import type { PatientFormData } from "../../app/components/StepPatient";
import type { AngehoerigerFormData } from "../../app/components/StepAngehoeriger";

/** Der gespeicherte Formularstand eines Falls — beide Schritte zusammen. */
export type OnboardingEntwurf = {
  patient: PatientFormData;
  angehoeriger: AngehoerigerFormData;
};

/** Entwürfe je Fallkennung. Kein Eintrag = für diesen Fall wurde nie gespeichert. */
let entwuerfe: Record<string, OnboardingEntwurf> = {};

/** Der gespeicherte Stand eines Falls, oder `undefined` wenn nie gespeichert. */
export function getEntwurf(fallKennung: string): OnboardingEntwurf | undefined {
  return entwuerfe[fallKennung];
}

/** Legt den Formularstand ab. Ersetzt einen früheren Stand vollständig. */
export function sichereEntwurf(fallKennung: string, entwurf: OnboardingEntwurf): void {
  entwuerfe = { ...entwuerfe, [fallKennung]: { ...entwurf } };
}

/** Nur für Tests: Bestand leeren. */
export function setzeEntwuerfeZurueck(): void {
  entwuerfe = {};
}
