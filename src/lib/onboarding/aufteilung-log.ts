/**
 * Workflow-Aufteilung — Ereignisprotokoll (in-memory, session-scoped).
 *
 * Bei der Vertragsunterzeichnung teilt sich der gemeinsame Onboarding-Workflow:
 * der bestehende geht an den Patienten über, für die Angehörige entsteht ein
 * neuer. Dieser Vorgang wird hier als Ereignis festgehalten — Zeitpunkt,
 * auslösende Person (sofern bekannt), Anzahl übergegangener und neu erzeugter
 * Aufgaben.
 *
 * Begründung (GeKoZH-Vorschlag Nr. 8): wer welche Aufgabe wann übernommen hat,
 * ist nachweisrelevant; ohne Protokoll wäre die Aufteilung ein unsichtbarer,
 * rückwirkend nicht belegbarer Vorgang. Es wird in diesem Lauf NICHT ausgewertet
 * und nirgends angezeigt.
 *
 * Keine Persistenzschicht: das Protokoll überlebt kein Neuladen.
 */
export interface WorkflowAufteilung {
  onboardingId: string;
  patientId: string;
  angehoerigerId: string;
  /** ISO timestamp. */
  zeitpunkt: string;
  ausloeserUserId: string | null;
  ausloeserName: string | null;
  /** Aufgaben, die vom gemeinsamen Workflow auf den Patienten übergegangen sind. */
  anzahlUebergegangen: number;
  /** Neu für die Angehörige erzeugte Aufgaben. */
  anzahlNeuAngehoeriger: number;
}

const LOG: WorkflowAufteilung[] = [];

export function protokolliereAufteilung(eintrag: WorkflowAufteilung): WorkflowAufteilung {
  LOG.push(eintrag);
  return eintrag;
}

export function getAufteilungen(): WorkflowAufteilung[] {
  return LOG;
}

export function getAufteilungFuerOnboarding(onboardingId: string): WorkflowAufteilung | undefined {
  return LOG.find(e => e.onboardingId === onboardingId);
}
