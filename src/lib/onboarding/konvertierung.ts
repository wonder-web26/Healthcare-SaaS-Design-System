/**
 * Onboarding-Konvertierung — Lead-to-Account conversion stub.
 *
 * This function is the central logic for converting a completed onboarding
 * into active Patient + Angehöriger records. It sets patientId on all
 * clinical artefacts that were created during the onboarding.
 *
 * Currently a stub — will be called from the Onboarding-Abschluss-Dialog in Prompt B.
 */
import type { InterRAIAssessment, Pflegeplanung, KLVVerordnung, WorkflowPlan } from "../../types/klinische-artefakte";
import { verwalteQuellensteuerPendenz } from "../stammdaten/quellensteuer-automatik";

export interface KonvertierungsErgebnis {
  patientId: string;
  angehoerigerId: string;
  konvertierteArtefakte: {
    interRAIAssessments: string[];
    pflegeplanungen: string[];
    klvVerordnungen: string[];
    workflows: string[];
  };
}

/**
 * Konvertiert ein abgeschlossenes Onboarding:
 * 1. Erzeugt Patient-Datensatz aus Onboarding-Personalien
 * 2. Erzeugt Angehöriger-Datensatz
 * 3. Setzt patientId auf alle verknüpften klinischen Artefakte
 * 4. Setzt Onboarding-Status auf "abgeschlossen-konvertiert"
 *
 * @param onboardingId - ID des zu konvertierenden Onboardings
 * @param artefakte - alle klinischen Artefakte mit diesem onboardingId
 * @returns KonvertierungsErgebnis mit den neuen IDs
 */
export function konvertiereOnboarding(
  onboardingId: string,
  artefakte: {
    interRAIAssessments: InterRAIAssessment[];
    pflegeplanungen: Pflegeplanung[];
    klvVerordnungen: KLVVerordnung[];
    workflows: WorkflowPlan[];
  },
  /** SP-07: Angehoerigen-Stammdaten fuer Pendenz-Erzeugung bei Quellensteuer */
  angehoerigenDaten?: { name: string; quellensteuerpflichtig: boolean },
): KonvertierungsErgebnis {
  // 1. Generate new patient ID (in production: server-generated)
  const patientId = `P-${Date.now()}`;
  const angehoerigerId = `A-${Date.now()}`;

  // 2. Set patientId on all artefacts belonging to this onboarding
  const konvertierteBA: string[] = [];
  for (const ba of artefakte.interRAIAssessments) {
    if (ba.onboardingId === onboardingId) {
      ba.patientId = patientId;
      konvertierteBA.push(ba.id);
    }
  }

  const konvertiertePP: string[] = [];
  for (const pp of artefakte.pflegeplanungen) {
    if (pp.onboardingId === onboardingId) {
      pp.patientId = patientId;
      konvertiertePP.push(pp.id);
    }
  }

  const konvertierteKLV: string[] = [];
  for (const klv of artefakte.klvVerordnungen) {
    if (klv.onboardingId === onboardingId) {
      klv.patientId = patientId;
      konvertierteKLV.push(klv.id);
    }
  }

  const konvertierteWF: string[] = [];
  for (const wf of artefakte.workflows) {
    if (wf.onboardingId === onboardingId) {
      wf.patientId = patientId;
      konvertierteWF.push(wf.id);
    }
  }

  // SP-07: Bei Quellensteuerpflicht Pendenz fuer Buchhaltung erzeugen
  // Erst jetzt, weil der Angehoerige als Mitarbeiter erst nach Konvertierung existiert.
  if (angehoerigenDaten?.quellensteuerpflichtig) {
    verwalteQuellensteuerPendenz("erstellen", angehoerigenDaten.name, angehoerigerId);
  }

  return {
    patientId,
    angehoerigerId,
    konvertierteArtefakte: {
      interRAIAssessments: konvertierteBA,
      pflegeplanungen: konvertiertePP,
      klvVerordnungen: konvertierteKLV,
      workflows: konvertierteWF,
    },
  };
}
