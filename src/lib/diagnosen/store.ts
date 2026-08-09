/**
 * Bestand der Diagnosen — Sitzungsdauer.
 *
 * Zwei getrennte Listen, weil sie verschiedenen Systemen folgen: die
 * ärztliche Diagnose kommt aus dem ICD und von der Ärztin, die Pflegediagnose
 * aus NANDA und aus der Pflegeplanung.
 *
 * DIE PFLEGEDIAGNOSE ENTSTEHT EIGENTLICH IM PFLEGEPLAN. Hier erfasst zu
 * werden ist der Ausnahmefall — etwa wenn im Gespräch etwas auffällt, bevor
 * ein Plan besteht. Solche Einträge tragen einen Vermerk, damit später
 * erkennbar bleibt, dass sie ausserhalb des Plans entstanden sind.
 *
 * LÖSCHEN IST NICHT VORGESEHEN. Eine Diagnose, die falsch ist, wird
 * korrigiert; ihr Verschwinden wäre selbst eine Aussage.
 */
import { useSyncExternalStore } from "react";
import type { AerztlicheDiagnose, Pflegediagnose } from "../../types/klinische-artefakte";
import { MOCK_ARZT_DIAGNOSEN, MOCK_PFLEGEPLANUNGEN } from "../mocks/klinische-artefakte-mock";

/** Eine Pflegediagnose mit ihrem Patientenbezug und ihrer Herkunft. */
export interface PflegediagnoseEintrag extends Pflegediagnose {
  patientId: string;
  /** Gesetzt, wenn sie ohne Pflegeplan erfasst wurde. */
  ohnePlanVermerk: string;
}

let arzt: AerztlicheDiagnose[] = MOCK_ARZT_DIAGNOSEN.map(d => ({ ...d }));
let pflege: PflegediagnoseEintrag[] = MOCK_PFLEGEPLANUNGEN.flatMap(p =>
  p.pflegediagnosen.map(d => ({ ...d, patientId: p.patientId ?? "", ohnePlanVermerk: "" })));

const hoerer = new Set<() => void>();
function melden(): void { hoerer.forEach(l => l()); }
function subscribe(l: () => void): () => void { hoerer.add(l); return () => { hoerer.delete(l); }; }
const aSchnappschuss = () => arzt;
const pSchnappschuss = () => pflege;

export function useArztDiagnosen(): AerztlicheDiagnose[] {
  return useSyncExternalStore(subscribe, aSchnappschuss, aSchnappschuss);
}

export function usePflegediagnosen(): PflegediagnoseEintrag[] {
  return useSyncExternalStore(subscribe, pSchnappschuss, pSchnappschuss);
}

let zaehler = 900;

/** Ärztliche Diagnose anlegen oder ändern; leere Kennung legt an. */
export function arztDiagnoseSichern(patientId: string, e: Omit<AerztlicheDiagnose, "onboardingId" | "patientId">): void {
  arzt = arzt.some(d => d.id === e.id)
    ? arzt.map(d => (d.id === e.id ? { ...d, ...e } : d))
    : [...arzt, { ...e, id: e.id || `AD-${++zaehler}`, onboardingId: null, patientId }];
  melden();
}

/** Pflegediagnose anlegen oder ändern; leere Kennung legt an. */
export function pflegediagnoseSichern(patientId: string, e: Omit<PflegediagnoseEintrag, "patientId">): void {
  pflege = pflege.some(d => d.id === e.id)
    ? pflege.map(d => (d.id === e.id ? { ...d, ...e } : d))
    : [...pflege, { ...e, id: e.id || `PD-${++zaehler}`, patientId }];
  melden();
}
