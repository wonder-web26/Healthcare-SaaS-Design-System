/**
 * Care relationship (Betreuungsverhältnis) — in-memory, session-scoped.
 *
 * Holds the case's Bezugsperson (the primary responsible Diplomierte) as a user
 * id, together with an append-only change log. No database and no persistence
 * beyond the session; the value survives navigation because the store lives at
 * module scope.
 *
 * The Bezugsperson lives here, on the care relationship, rather than on the
 * onboarding step, so the same assignment is later visible and editable in the
 * patient dossier without being captured twice. The value is always a user id
 * (Kennung), never a free-text name, so it can serve as an access reference
 * later — no access logic is built in this run.
 *
 * The model keeps exactly one Bezugsperson but is intentionally not locked: a
 * later extension to several assigned people is additive, not a breaking change.
 */
export type BezugspersonAktion = "zugewiesen" | "geaendert" | "entfernt";

export interface BezugspersonAenderung {
  /** ISO timestamp of the change. */
  zeitpunkt: string;
  /** Acting user (Kennung) and derived display name. */
  handelnderUserId: string;
  handelnderName: string;
  aktion: BezugspersonAktion;
  /** Previous value, preserved — the log is never overwritten. */
  vorherUserId: string | null;
  nachherUserId: string | null;
}

export interface Betreuungsverhaeltnis {
  caseId: string;
  /** User id of the Bezugsperson, or null while none is assigned. */
  bezugspersonUserId: string | null;
  verlauf: BezugspersonAenderung[];
}

const STORE = new Map<string, Betreuungsverhaeltnis>();

export function getBetreuung(caseId: string): Betreuungsverhaeltnis {
  let b = STORE.get(caseId);
  if (!b) {
    b = { caseId, bezugspersonUserId: null, verlauf: [] };
    STORE.set(caseId, b);
  }
  return b;
}

export function getBezugspersonId(caseId: string): string | null {
  return getBetreuung(caseId).bezugspersonUserId;
}

/**
 * Assign, change or remove the Bezugsperson. Records who did it and when, keeps
 * the previous value as an appended log entry (never overwritten), and updates
 * the current value. No-op (returns null) if the value does not actually change.
 */
export function setBezugsperson(
  caseId: string,
  userId: string | null,
  handelnder: { id: string; name: string },
): BezugspersonAenderung | null {
  const b = getBetreuung(caseId);
  const vorher = b.bezugspersonUserId;
  if (vorher === userId) return null;

  const aktion: BezugspersonAktion = vorher === null ? "zugewiesen" : userId === null ? "entfernt" : "geaendert";
  const eintrag: BezugspersonAenderung = {
    zeitpunkt: new Date().toISOString(),
    handelnderUserId: handelnder.id,
    handelnderName: handelnder.name,
    aktion,
    vorherUserId: vorher,
    nachherUserId: userId,
  };
  b.verlauf.push(eintrag); // append-only: earlier entries and the previous value stay
  b.bezugspersonUserId = userId; // new current value
  return eintrag;
}

export function getVerlauf(caseId: string): BezugspersonAenderung[] {
  return getBetreuung(caseId).verlauf;
}
