/**
 * Onboarding-Prozesszustand: Schrittfolge, Phasen und Kennzeichen-Ableitung.
 *
 * Eine Quelle der Wahrheit für die Onboarding-Liste (und spätere Verwender).
 * Alle Ableitungen sind REINE Funktionen: Eingabe ist das Mandat plus ein
 * übergebenes Bezugsdatum — nie wird intern `new Date()` gelesen, damit sie
 * ohne Rendering deterministisch prüfbar sind.
 */
import { isoZuDate } from "../datum";

/* ── Schrittfolge: acht geordnete Pflichtschritte bis zur Abrechenbarkeit ── */
export type OnboardingSchrittCode =
  | "erstassessment"
  | "diagnose_medikation"
  | "klv_erstellen"
  | "klv_kontrollieren"
  | "klv_an_arzt"
  | "klv_von_arzt"
  | "klv_an_kasse"
  | "vertrag_unterzeichnen";

export interface OnboardingSchritt {
  code: OnboardingSchrittCode;
  label: string;
}

export const ONBOARDING_SCHRITTE: readonly OnboardingSchritt[] = [
  { code: "erstassessment", label: "Erstassessment" },
  { code: "diagnose_medikation", label: "Diagnose und Medikamentenliste" },
  { code: "klv_erstellen", label: "KLV erstellen" },
  { code: "klv_kontrollieren", label: "KLV kontrollieren" },
  { code: "klv_an_arzt", label: "KLV an Arzt zur Unterschrift" },
  { code: "klv_von_arzt", label: "KLV von Arzt erhalten" },
  { code: "klv_an_kasse", label: "KLV an Krankenkasse übermitteln" },
  { code: "vertrag_unterzeichnen", label: "Vertrag unterzeichnen" },
] as const;

/** Anzahl der Pflichtschritte — kommt aus der Länge der Konstante, nie als "8" hartcodiert. */
export const ANZAHL_SCHRITTE = ONBOARDING_SCHRITTE.length;

/** 1-basierte Position (1..ANZAHL_SCHRITTE) → Schritt-Bezeichnung. */
export function schrittLabel(currentStep: number): string {
  return ONBOARDING_SCHRITTE[currentStep - 1]?.label ?? "";
}

/* ── Phasen: deckungsgleich mit Backend-Enum OnboardingPhase, aus dem Schritt abgeleitet ── */
export type OnboardingPhase = "preparation" | "klv" | "activation" | "done";

export const PHASE_LABEL: Record<OnboardingPhase, string> = {
  preparation: "Vorbereitung",
  klv: "KLV",
  activation: "Aktivierung",
  done: "Abgeschlossen",
};

/**
 * Phase aus dem aktuellen Schritt ableiten (nicht separat gepflegt):
 * Schritt 1–2 = Vorbereitung, 3–7 = KLV, letzter Schritt = Aktivierung,
 * darüber hinaus = Abgeschlossen (erscheint nicht in der Liste).
 */
export function phaseFuerSchritt(currentStep: number): OnboardingPhase {
  if (currentStep <= 2) return "preparation";
  if (currentStep < ANZAHL_SCHRITTE) return "klv";
  if (currentStep === ANZAHL_SCHRITTE) return "activation";
  return "done";
}

/** Rang für die Phasen-Sortierung. */
export function phaseRang(phase: OnboardingPhase): number {
  return { preparation: 0, klv: 1, activation: 2, done: 3 }[phase];
}

/* ── Kennzeichen-Ableitung ── */

export type KennzeichenTyp = "rot" | "gelb" | null;

/** Spalte, in der der Klartext-Grund zusätzlich sichtbar wird. */
export type KennzeichenSpalte = "start" | "pendenzen";

export interface Kennzeichen {
  typ: KennzeichenTyp;
  /** Klartext-Grund — dient als barrierefreie Beschriftung UND ist in der Spalte sichtbar. */
  grund: string;
  spalte: KennzeichenSpalte;
}

/** Eingaben, die die Kennzeichen-Ableitung braucht. */
export interface MandatSignal {
  currentStep: number;
  /** Geplanter Start (validFrom) als ISO-Datum. */
  validFrom: string;
  pendenzenUeberfaellig: number;
}

/** Tage von Bezugsdatum bis geplantem Start. Negativ = überschritten. Rein, ohne new Date(). */
export function tageBisStart(validFromIso: string, bezugsdatum: Date): number {
  const d = isoZuDate(validFromIso);
  if (!d) return 0;
  const start = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const bezug = Date.UTC(bezugsdatum.getFullYear(), bezugsdatum.getMonth(), bezugsdatum.getDate());
  return Math.round((start - bezug) / 86_400_000);
}

/** True, sobald der Vertrag unterzeichnet ist (Position hat den letzten Schritt überschritten). */
export function istVertragUnterzeichnet(currentStep: number): boolean {
  return currentStep > ANZAHL_SCHRITTE;
}

/**
 * Kennzeichen ableiten. Rot schlägt Gelb.
 * - Rot: geplanter Start in der Vergangenheit UND Vertrag nicht unterzeichnet.
 * - Gelb: mindestens eine Pendenz überfällig ODER Start in höchstens drei Tagen.
 * - Sonst: kein Kennzeichen.
 */
export function ableitenKennzeichen(m: MandatSignal, bezugsdatum: Date): Kennzeichen {
  const tage = tageBisStart(m.validFrom, bezugsdatum);
  const unterzeichnet = istVertragUnterzeichnet(m.currentStep);

  if (tage < 0 && !unterzeichnet) {
    return {
      typ: "rot",
      grund: `Start überschritten (${Math.abs(tage)} ${Math.abs(tage) === 1 ? "Tag" : "Tage"}), Vertrag nicht unterzeichnet`,
      spalte: "start",
    };
  }
  if (m.pendenzenUeberfaellig >= 1) {
    return {
      typ: "gelb",
      grund: `${m.pendenzenUeberfaellig} ${m.pendenzenUeberfaellig === 1 ? "Pendenz" : "Pendenzen"} überfällig`,
      spalte: "pendenzen",
    };
  }
  if (tage >= 0 && tage <= 3) {
    return {
      typ: "gelb",
      grund: tage === 0 ? "Start heute" : `Start in ${tage} ${tage === 1 ? "Tag" : "Tagen"}`,
      spalte: "start",
    };
  }
  return { typ: null, grund: "", spalte: "start" };
}
