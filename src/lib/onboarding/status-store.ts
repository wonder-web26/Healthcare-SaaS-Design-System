/**
 * Onboarding status — in-memory, session-scoped, MANUALLY set.
 *
 * Per onboarding case: the current status (default "neu"), the cancellation
 * reason when cancelled, and an append-only list of status changes. There is no
 * derivation from progress — the status only changes when a person picks a new
 * value, so every event corresponds to a human action.
 *
 * No database and no persistence beyond the session — the value and the list do
 * NOT survive a reload. Acceptable for the prototype; called out in the report.
 * No metric, no lead time is computed here.
 */
import type { OnboardingStatus } from "./status";
import { ONBOARDING_STATUS_DEFAULT } from "./status";

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

interface OnboardingStatusZustand {
  caseId: string;
  status: OnboardingStatus;
  /** Reason for the cancellation; only meaningful while status === "abgebrochen". */
  grund: string | null;
  verlauf: StatusWechsel[];
}

const STORE = new Map<string, OnboardingStatusZustand>();

function get(caseId: string): OnboardingStatusZustand {
  let z = STORE.get(caseId);
  if (!z) {
    z = { caseId, status: ONBOARDING_STATUS_DEFAULT, grund: null, verlauf: [] };
    STORE.set(caseId, z);
  }
  return z;
}

export type Ausloeser = { id: string; name: string } | null;

/** Current status. A never-touched case is "neu" (never empty). */
export function getStatus(caseId: string): OnboardingStatus {
  return get(caseId).status;
}

/** Cancellation reason, or null when not cancelled. */
export function getGrund(caseId: string): string | null {
  const z = get(caseId);
  return z.status === "abgebrochen" ? z.grund : null;
}

export function getStatusVerlauf(caseId: string): StatusWechsel[] {
  return get(caseId).verlauf;
}

/**
 * Set the status manually. "abgebrochen" requires a non-empty reason — without
 * one the change is rejected (returns null). A no-op (same status, same reason)
 * also returns null. Otherwise records an event and returns it.
 */
export function setzeStatus(
  caseId: string,
  status: OnboardingStatus,
  ausloeser: Ausloeser = null,
  grund?: string,
): StatusWechsel | null {
  const z = get(caseId);
  const trimmed = (grund ?? "").trim();
  if (status === "abgebrochen" && !trimmed) return null; // no reason → not completable
  const neuerGrund = status === "abgebrochen" ? trimmed : null;
  if (z.status === status && z.grund === neuerGrund) return null; // unchanged

  z.status = status;
  z.grund = neuerGrund;
  const eintrag: StatusWechsel = {
    status,
    zeitpunkt: new Date().toISOString(),
    ausloeserUserId: ausloeser?.id ?? null,
    ausloeserName: ausloeser?.name ?? null,
    ...(neuerGrund ? { grund: neuerGrund } : {}),
  };
  z.verlauf.push(eintrag);
  return eintrag;
}
