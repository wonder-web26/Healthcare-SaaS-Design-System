/**
 * Onboarding status — one vocabulary, valid for both header and list.
 *
 *   neu            — case created, nothing done yet (the default)
 *   in_bearbeitung — being worked on
 *   abgeschlossen  — done
 *   abgebrochen    — cancelled (a reason is required)
 *
 * The status is set MANUALLY (via the header badge) — there is no derivation
 * from progress. A case starts at "neu" and only changes when a person picks a
 * value; every change is a human action recorded in the event list
 * (status-store.ts).
 *
 * This replaces the three earlier, divergent vocabularies:
 *   - list: in_erfassung / unvollstaendig / blockiert
 *   - header: entwurf / bearbeitung / bereit  (vorgangsStatus)
 *   - header footer: progressLabel free text
 */
export type OnboardingStatus = "neu" | "in_bearbeitung" | "abgeschlossen" | "abgebrochen";

/** The order shown in pickers and the default starting value. */
export const ONBOARDING_STATUS_WERTE: OnboardingStatus[] = ["neu", "in_bearbeitung", "abgeschlossen", "abgebrochen"];
export const ONBOARDING_STATUS_DEFAULT: OnboardingStatus = "neu";

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
