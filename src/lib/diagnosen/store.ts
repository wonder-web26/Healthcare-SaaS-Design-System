/**
 * Bestand der ärztlichen Diagnosen — Sitzungsdauer.
 *
 * Die ärztliche Diagnose kommt aus dem ICD und von der Ärztin. Die
 * Pflegediagnosen, die hier früher als zweite Liste lebten, sind mit der
 * alten Pflegeplanung abgerissen — sie entstehen künftig im neuen
 * Pflegeplan-Modul und werden dort geführt.
 *
 * LÖSCHEN IST NICHT VORGESEHEN. Eine Diagnose, die falsch ist, wird
 * korrigiert; ihr Verschwinden wäre selbst eine Aussage.
 */
import { useSyncExternalStore } from "react";
import type { AerztlicheDiagnose } from "../../types/klinische-artefakte";
import { MOCK_ARZT_DIAGNOSEN } from "../mocks/klinische-artefakte-mock";

let arzt: AerztlicheDiagnose[] = MOCK_ARZT_DIAGNOSEN.map(d => ({ ...d }));

const hoerer = new Set<() => void>();
function melden(): void { hoerer.forEach(l => l()); }
function subscribe(l: () => void): () => void { hoerer.add(l); return () => { hoerer.delete(l); }; }
const aSchnappschuss = () => arzt;

export function useArztDiagnosen(): AerztlicheDiagnose[] {
  return useSyncExternalStore(subscribe, aSchnappschuss, aSchnappschuss);
}

let zaehler = 900;

/** Ärztliche Diagnose anlegen oder ändern; leere Kennung legt an. */
export function arztDiagnoseSichern(patientId: string, e: Omit<AerztlicheDiagnose, "onboardingId" | "patientId">): void {
  arzt = arzt.some(d => d.id === e.id)
    ? arzt.map(d => (d.id === e.id ? { ...d, ...e } : d))
    : [...arzt, { ...e, id: e.id || `AD-${++zaehler}`, onboardingId: null, patientId }];
  melden();
}
