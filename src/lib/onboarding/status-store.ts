/**
 * Onboarding status events — in-memory, session-scoped.
 *
 * Per onboarding case: a list of status changes plus an optional manual
 * cancellation. The derived status (neu/in_bearbeitung/abgeschlossen) is
 * computed in the view; this store records a change whenever the EFFECTIVE
 * status differs from the last recorded entry, and holds the cancellation that
 * overrides the derivation.
 *
 * No database and no persistence beyond the session — the list does NOT survive
 * a reload. That is acceptable for the prototype; it is called out in the run
 * report. The shape is intentionally able to carry lead times later without a
 * metric being built here (no evaluation, no KPI in this run).
 *
 * While a case is cancelled the derived value is suppressed rather than
 * recorded; lifting the cancellation re-records the then-current derived value.
 * Intermediate derived changes during a cancellation are therefore not logged.
 */
import type { OnboardingStatus, AbgeleiteterStatus } from "./status";

export interface StatusWechsel {
  status: OnboardingStatus;
  /** ISO timestamp of the change. */
  zeitpunkt: string;
  /** Acting person, when known. */
  ausloeserUserId: string | null;
  ausloeserName: string | null;
  /** Reason — only present on an "abgebrochen" entry. */
  grund?: string;
}

interface Abbruch {
  grund: string;
  ausloeserUserId: string | null;
  ausloeserName: string | null;
  zeitpunkt: string;
}

interface OnboardingStatusZustand {
  caseId: string;
  abbruch: Abbruch | null;
  verlauf: StatusWechsel[];
}

const STORE = new Map<string, OnboardingStatusZustand>();

function get(caseId: string): OnboardingStatusZustand {
  let z = STORE.get(caseId);
  if (!z) {
    z = { caseId, abbruch: null, verlauf: [] };
    STORE.set(caseId, z);
  }
  return z;
}

export type Ausloeser = { id: string; name: string } | null;

export function istAbgebrochen(caseId: string): boolean {
  return get(caseId).abbruch !== null;
}

export function getAbbruchGrund(caseId: string): string | null {
  return get(caseId).abbruch?.grund ?? null;
}

/** Effective status: the cancellation wins over the derivation while it stands. */
export function getEffektiverStatus(caseId: string, abgeleitet: AbgeleiteterStatus): OnboardingStatus {
  return get(caseId).abbruch ? "abgebrochen" : abgeleitet;
}

export function getStatusVerlauf(caseId: string): StatusWechsel[] {
  return get(caseId).verlauf;
}

function letzterStatus(z: OnboardingStatusZustand): OnboardingStatus | null {
  return z.verlauf.length ? z.verlauf[z.verlauf.length - 1].status : null;
}

/**
 * Record the derived status when the effective value changed vs. the last
 * entry. Idempotent — no entry when unchanged. Suppressed while cancelled (the
 * cancellation entry already stands). Returns the new entry, or null.
 */
export function synchronisiereAbgeleitetenStatus(
  caseId: string,
  abgeleitet: AbgeleiteterStatus,
  ausloeser: Ausloeser = null,
): StatusWechsel | null {
  const z = get(caseId);
  if (z.abbruch) return null; // cancelled: derivation suppressed
  if (letzterStatus(z) === abgeleitet) return null;
  const eintrag: StatusWechsel = {
    status: abgeleitet,
    zeitpunkt: new Date().toISOString(),
    ausloeserUserId: ausloeser?.id ?? null,
    ausloeserName: ausloeser?.name ?? null,
  };
  z.verlauf.push(eintrag);
  return eintrag;
}

/**
 * Cancel the case. A reason is required — without one the cancellation does not
 * happen (returns null). Appends an "abgebrochen" entry.
 */
export function breche(caseId: string, grund: string, ausloeser: Ausloeser = null): StatusWechsel | null {
  const trimmed = grund.trim();
  if (!trimmed) return null; // no reason → no cancellation
  const z = get(caseId);
  if (z.abbruch) return null; // already cancelled
  const zeitpunkt = new Date().toISOString();
  z.abbruch = { grund: trimmed, ausloeserUserId: ausloeser?.id ?? null, ausloeserName: ausloeser?.name ?? null, zeitpunkt };
  const eintrag: StatusWechsel = {
    status: "abgebrochen",
    zeitpunkt,
    ausloeserUserId: ausloeser?.id ?? null,
    ausloeserName: ausloeser?.name ?? null,
    grund: trimmed,
  };
  z.verlauf.push(eintrag);
  return eintrag;
}

/**
 * Lift the cancellation. Does NOT itself record a change — the caller then runs
 * synchronisiereAbgeleitetenStatus, which re-records the now-current derived value.
 */
export function hebeAbbruchAuf(caseId: string): void {
  get(caseId).abbruch = null;
}
