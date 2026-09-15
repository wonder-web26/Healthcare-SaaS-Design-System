/**
 * Einstiegspunkte der Pflegeplanung (Lauf 6c) — die eine Stelle, an der
 * Onboarding, Patient360, Prüfbereitschaft und Konvertierung entscheiden,
 * ob der Plan-Zustand zu einem Klienten gehört.
 *
 * PROTOTYP-EINSCHRÄNKUNG: es gibt EINEN Plan-Zustand (plan-store, nicht je
 * Klient adressiert) und EINEN planfähigen Klienten — den einzigen mit
 * abgeschlossenem Assessment und getriggerten CAPs, der Quelle jedes Plans.
 * Diese Wache stellt sicher, dass kein fremder Klient den Plan des einen
 * angezeigt bekommt. Mit echten Daten wird der Plan-Zustand je Klient
 * geführt; der Bedarf steht im Delta (Lauf 6c).
 */
import { MOCK_ASSESSMENTS } from "../mocks/klinische-artefakte-mock";
import type { PlanZustand } from "./plan-store";

/** Gehört der (eine) Plan-Zustand zu diesem Klienten? Wahr nur für den
 *  Klienten, dessen abgeschlossenes Assessment die Diagnosevorschläge
 *  speist — für alle anderen gibt es keinen Plan, nicht Steiners. */
export function planGehoertZu(patientId: string): boolean {
  return MOCK_ASSESSMENTS.some(a =>
    a.patientId === patientId
    && a.status === "abgeschlossen"
    && a.getriggerteCaps.some(c => c.getriggert));
}

/** Besteht überhaupt eine Pflegeplanung? Ein leerer Zustand ist keine. */
export function planBesteht(plan: PlanZustand): boolean {
  return plan.diagnosen.length > 0 || plan.ziele.length > 0 || plan.massnahmen.length > 0;
}
