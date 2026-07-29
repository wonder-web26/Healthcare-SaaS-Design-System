/**
 * Onboarding status — one vocabulary, valid for both header and list.
 *
 *   neu            — case created, no step begun
 *   in_bearbeitung — at least one step begun, contract not yet signed
 *   abgeschlossen  — work contract signed
 *   abgebrochen    — set manually (a reason is required)
 *
 * The first three are DERIVED from progress and are never set by hand. Only
 * "abgebrochen" is set explicitly, and while it is set it overrides the
 * derivation until the cancellation is lifted (see status-store.ts).
 *
 * This replaces the three earlier, divergent vocabularies:
 *   - list: in_erfassung / unvollstaendig / blockiert
 *   - header: entwurf / bearbeitung / bereit  (vorgangsStatus)
 *   - header footer: progressLabel free text
 */
export type OnboardingStatus = "neu" | "in_bearbeitung" | "abgeschlossen" | "abgebrochen";

/** The subset that can be derived from progress (everything except the manual abort). */
export type AbgeleiteterStatus = Exclude<OnboardingStatus, "abgebrochen">;

export interface StatusAbleitungInput {
  /** at least one wizard step begun, or one clinical artefact present */
  schrittBegonnen: boolean;
  /** the work contract is signed (step3Valid) */
  vertragUnterzeichnet: boolean;
}

/** Deterministic derivation. Never returns "abgebrochen" — that is a manual override. */
export function leiteOnboardingStatusAb(input: StatusAbleitungInput): AbgeleiteterStatus {
  if (input.vertragUnterzeichnet) return "abgeschlossen";
  if (input.schrittBegonnen) return "in_bearbeitung";
  return "neu";
}

export interface StatusDarstellung {
  label: string;
  bg: string;
  text: string;
  dot: string;
}

/**
 * One badge appearance, shared by header and list. Colour is never the only
 * distinguishing signal — every badge also carries its label and a dot.
 */
export const ONBOARDING_STATUS_CFG: Record<OnboardingStatus, StatusDarstellung> = {
  neu:            { label: "Neu",            bg: "var(--bg-secondary)",      text: "var(--text-secondary)",      dot: "var(--text-tertiary)" },
  in_bearbeitung: { label: "In Bearbeitung", bg: "var(--status-info-bg)",    text: "var(--status-info)",         dot: "var(--status-info)" },
  abgeschlossen:  { label: "Abgeschlossen",  bg: "var(--status-success-bg)", text: "var(--status-success-text)", dot: "var(--status-success)" },
  abgebrochen:    { label: "Abgebrochen",    bg: "var(--status-danger-bg)",  text: "var(--status-danger)",       dot: "var(--status-danger)" },
};
