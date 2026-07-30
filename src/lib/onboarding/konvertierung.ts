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
import { workflowTasks } from "../mocks/workflow-tasks";
import { getMessungenFuerPatient } from "../vitaldaten/store";
import { konvertiereRhythmusSubjekt, generiereRhythmusTickets, getTicketsFuerSubjekt } from "../rhythmus/engine";
import { protokolliereAufteilung } from "./aufteilung-log";
import { erstelleNachweis } from "../schulung/nachweis-store";
import { MOCK_KLV_VERORDNUNGEN } from "../mocks/klinische-artefakte-mock";
import { getPersonByOnboardingId, updatePersonZustand } from "../interrai/store";

export interface KonvertierungsErgebnis {
  patientId: string;
  angehoerigerId: string;
  /** Qualifikation des Angehörigen, falls im Onboarding erfasst */
  qualifikation: string | null;
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
  /** Angehoerigen-Stammdaten fuer Pendenz-Erzeugung */
  angehoerigenDaten?: { name: string; quellensteuerpflichtig: boolean; aufenthaltsstatus: string; bvgAnbindungGewuenscht: boolean; qualifikation?: string; eintrittsdatum?: string; pflegefachkraft?: string },
  /** Auslösende Person für das Aufteilungs-Ereignisprotokoll (sofern bekannt). */
  ausloeser?: { id: string; name: string },
): KonvertierungsErgebnis {
  // 1. Generate new patient ID (in production: server-generated)
  const patientId = `P-${Date.now()}`;
  const angehoerigerId = `A-${Date.now()}`;

  // 2. Update person state — assessments reference the person, not the
  //    onboarding or patient. The assessment itself stays untouched.
  const person = getPersonByOnboardingId(onboardingId);
  if (person) {
    updatePersonZustand(person.id, "patient", patientId);
  }

  // InterRAI assessments are no longer rewritten during conversion.
  // They reference the person by stable personId. The person's zustand
  // changes above; the assessment remains unchanged.
  const konvertierteBA: string[] = [];

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

  // PA-05: Vitalmessungen von onboardingId auf patientId umhängen
  // (Messungen wurden während Onboarding mit onboardingId als patientId erfasst)
  const onboardingMessungen = getMessungenFuerPatient(onboardingId);
  for (const m of onboardingMessungen) {
    (m as { patientId: string }).patientId = patientId;
  }

  // WF-02: Der gemeinsame Onboarding-Workflow geht an den PATIENTEN über
  // (subjektId von onboardingId → patientId umgeschrieben; bestehende Logik).
  konvertiereRhythmusSubjekt(onboardingId, patientId, "patient");
  const anzahlUebergegangen = getTicketsFuerSubjekt("patient", patientId).length;

  // Aufteilung: für die ANGEHÖRIGE entsteht ein eigener, neuer Workflow
  // (subjektTyp "angehoeriger" + ihre Kennung). Vor der Unterschrift existiert er
  // nicht. Bestehende Vorlagenmechanik, keine neuen Vorlagen.
  let anzahlNeuAngehoeriger = 0;
  if (angehoerigenDaten) {
    const ed = angehoerigenDaten.eintrittsdatum;
    const ankerAng = ed && /^\d{2}\.\d{2}\.\d{4}$/.test(ed)
      ? `${ed.slice(6, 10)}-${ed.slice(3, 5)}-${ed.slice(0, 2)}`
      : (ed && /^\d{4}-\d{2}-\d{2}$/.test(ed) ? ed : new Date().toISOString().slice(0, 10));
    generiereRhythmusTickets("angehoeriger", angehoerigerId, angehoerigenDaten.name, ankerAng, angehoerigenDaten.pflegefachkraft);
    anzahlNeuAngehoeriger = getTicketsFuerSubjekt("angehoeriger", angehoerigerId).length;
  }

  // Aufteilung als Ereignis festhalten (GeKoZH Nr. 8 — nachweisrelevant).
  protokolliereAufteilung({
    onboardingId, patientId, angehoerigerId,
    zeitpunkt: new Date().toISOString(),
    ausloeserUserId: ausloeser?.id ?? null,
    ausloeserName: ausloeser?.name ?? null,
    anzahlUebergegangen,
    anzahlNeuAngehoeriger,
  });

  // Initialschulung: Nachweis erstellen wenn KLV-Positionen vorhanden
  const klvVerordnung = [...artefakte.klvVerordnungen, ...MOCK_KLV_VERORDNUNGEN].find(
    k => k.onboardingId === onboardingId || k.patientId === patientId
  );
  if (klvVerordnung && klvVerordnung.leistungspositionen.length > 0 && angehoerigenDaten) {
    const klvNummern = klvVerordnung.leistungspositionen.map(lp => lp.klvNummer);
    const patientName = klvVerordnung.patientName || "Patient";
    erstelleNachweis(
      angehoerigerId,
      angehoerigenDaten.name,
      angehoerigenDaten.qualifikation || "",
      patientId,
      patientName,
      "Sandra Weber",
      klvNummern,
    );
    console.info(`[Audit] Schulungsnachweis erstellt: ${angehoerigenDaten.name} → ${patientName}, ${klvNummern.length} Positionen`);
  }

  // SP-07: Bei Quellensteuerpflicht Pendenz fuer Buchhaltung erzeugen
  // Erst jetzt, weil der Angehoerige als Mitarbeiter erst nach Konvertierung existiert.
  if (angehoerigenDaten?.quellensteuerpflichtig) {
    verwalteQuellensteuerPendenz("erstellen", angehoerigenDaten.name, angehoerigerId);
  }

  // Aufenthaltsstatus B: Pendenz fuer offene Bewilligungs-Aufgaben
  if (angehoerigenDaten?.aufenthaltsstatus === "B") {
    const heute = new Date().toISOString().slice(0, 10);
    const faellig = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
    const bestehend = workflowTasks.find(
      t => t.typ === "AUSWEIS_B_ANMELDUNG" && t.betroffenePerson.name === angehoerigenDaten.name && t.status === "offen"
    );
    if (!bestehend) {
      workflowTasks.push({
        id: `W-BEWB-${Date.now()}`,
        typ: "AUSWEIS_B_ANMELDUNG",
        titel: "Aufenthaltsstatus B — Bewilligung nachverfolgen",
        kontext: `Mitarbeiter ${angehoerigenDaten.name} hat Aufenthaltsstatus B. Bitte sicherstellen: Spezialbewilligung beim Migrationsamt eingereicht, Bewilligungsstatus prüfen, ggf. Erneuerung rechtzeitig einleiten.`,
        betroffenePerson: { name: angehoerigenDaten.name, initialen: angehoerigenDaten.name.split(/\s+/).map(w => w[0]).join("").toUpperCase().slice(0, 2) },
        erstellt: heute,
        faellig,
        status: "offen",
        verantwortlich: { name: "Kathrin Meier", initialen: "KM" },
        prioritaet: "hoch",
      });
      console.info(`[Audit] Pendenz erstellt: Aufenthaltsstatus B für ${angehoerigenDaten.name} (${angehoerigerId})`);
    }
  }

  // BVG: Bei freiwilliger Anbindung Pendenz an Buchhaltung
  if (angehoerigenDaten?.bvgAnbindungGewuenscht) {
    const heute = new Date().toISOString().slice(0, 10);
    const faellig = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
    const bestehend = workflowTasks.find(
      t => t.titel.includes("BVG-Anbindung") && t.betroffenePerson.name === angehoerigenDaten.name && t.status === "offen"
    );
    if (!bestehend) {
      workflowTasks.push({
        id: `W-BVG-${Date.now()}`,
        typ: "LOHNANPASSUNG_NACH_SRK",
        titel: "BVG-Anbindung einrichten",
        kontext: `Mitarbeiter ${angehoerigenDaten.name} wünscht freiwillige BVG-Anbindung (Lohn unter Eintrittsschwelle). Bitte Pensionskassen-Anmeldung vornehmen.`,
        betroffenePerson: { name: angehoerigenDaten.name, initialen: angehoerigenDaten.name.split(/\s+/).map(w => w[0]).join("").toUpperCase().slice(0, 2) },
        erstellt: heute,
        faellig,
        status: "offen",
        verantwortlich: { name: "Kathrin Meier", initialen: "KM" },
        prioritaet: "mittel",
      });
      console.info(`[Audit] Pendenz erstellt: BVG-Anbindung für ${angehoerigenDaten.name} (${angehoerigerId})`);
    }
  }

  // Qualifikation auf Angehörigen-Datensatz übernehmen
  if (angehoerigenDaten?.qualifikation) {
    console.info(`[Audit] Qualifikation für ${angehoerigenDaten.name} (${angehoerigerId}): ${angehoerigenDaten.qualifikation}`);
  }

  return {
    patientId,
    angehoerigerId,
    qualifikation: angehoerigenDaten?.qualifikation ?? null,
    konvertierteArtefakte: {
      interRAIAssessments: konvertierteBA,
      pflegeplanungen: konvertiertePP,
      klvVerordnungen: konvertierteKLV,
      workflows: konvertierteWF,
    },
  };
}
