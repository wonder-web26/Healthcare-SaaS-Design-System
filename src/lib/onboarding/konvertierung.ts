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
import { getKlvVerordnungen } from "../klv/store";
import { getPersonByOnboardingId, setPatientId } from "../interrai/store";
import { schliessePatientOnboardingAb } from "../patienten/store";
import { schliesseAngehoerigenOnboardingAb } from "../angehoerige/store";
import { GEGENWART, GEGENWART_ISO } from "../gegenwart";
import { getBeziehungen, beziehungSichern } from "../beziehungen/store";
import type { Beziehung } from "../beziehungen/beziehungen";
import { formatAnzeige } from "../datum";

/**
 * Eine im Gespräch gewählte Person wird zur Beziehung.
 *
 * Ist dieselbe Person bereits über eine andere Beziehung erfasst — etwa als
 * pflegende Angehörige —, erhält diese das Merkmal, statt dass eine zweite
 * Zeile entsteht. Zwei Zeilen zu derselben Person sagten nicht mehr, sondern
 * weniger: welche gilt?
 */
function beziehungAusOnboarding(
  patientId: string,
  kontaktId: string,
  rolle: Beziehung["rolle"],
  beginn: string,
  zusatz: { art?: string; notfallkontakt?: boolean; vertretungsart?: string; zusammenfuehren?: boolean },
): void {
  if (zusatz.zusammenfuehren !== false) {
    const bestehend = getBeziehungen(patientId).find(
      b => b.person.art === "kontakt" && b.person.kennung === kontaktId && !b.ende.trim());
    if (bestehend) {
      if (zusatz.notfallkontakt) beziehungSichern({ ...bestehend, notfallkontakt: true });
      return;
    }
  }
  beziehungSichern({
    id: "", patientId, person: { art: "kontakt", kennung: kontaktId },
    rolle, art: (zusatz.art ?? "") as Beziehung["art"],
    vertretungsart: (zusatz.vertretungsart ?? "") as Beziehung["vertretungsart"],
    beginn, ende: "", notfallkontakt: zusatz.notfallkontakt ?? false,
    auskunftsberechtigt: false, telefon: "", bemerkung: "",
  });
}

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
  /** Im Abklärungsgespräch gewählte dritte Personen. */
  kontakte?: {
    notfallkontaktId: string; notfallkontaktVerwandtschaft: string; sozialdienstId: string;
    vertretungKontaktId: string; vertretungsart: string;
  },
): KonvertierungsErgebnis {
  // 1. Der Patient existiert bereits (er entsteht mit dem Schritt "Patient").
  //    Der Abschluss kopiert nichts und erzeugt nichts — er wechselt nur den
  //    Zustand von "im_onboarding" auf "aktiv". Mandate aus dem Altbestand
  //    haben keinen Patientendatensatz; dann bleibt die Kennung leer.
  const patient = schliessePatientOnboardingAb(onboardingId);
  const patientId = patient?.id ?? "";

  //    Dasselbe gilt für die angehörige Person: sie entsteht mit dem Schritt
  //    "Angehöriger" und trägt seither ihre Kennung. Der Abschluss wechselt
  //    nur ihren Zustand. Zuvor stand hier `A-${Date.now()}` — eine Kennung
  //    ohne Datensatz, die nirgends ankam.
  const angehoerigerDatensatz = schliesseAngehoerigenOnboardingAb(onboardingId);
  const angehoerigerId = angehoerigerDatensatz?.id ?? "";

  // 2. Set the patient record ID on the Klient — the only mutation at
  //    conversion. The lifecycle state (klientZustand) is derived from it, no
  //    longer stored. Forms reference their Fall, not the Klient, and stay
  //    untouched.
  const person = getPersonByOnboardingId(onboardingId);
  if (person && patientId) {
    setPatientId(person.id, patientId);
  }

  // InterRAI forms are no longer rewritten during conversion. They reference
  // their Fall by stable fallId; the Klient gains a patientId above, which
  // flips klientZustand to "aktiv". The forms remain unchanged.
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
      : (ed && /^\d{4}-\d{2}-\d{2}$/.test(ed) ? ed : GEGENWART_ISO);
    generiereRhythmusTickets("angehoeriger", angehoerigerId, angehoerigenDaten.name, ankerAng, angehoerigenDaten.pflegefachkraft);
    anzahlNeuAngehoeriger = getTicketsFuerSubjekt("angehoeriger", angehoerigerId).length;
  }

  /* Die im Gespräch gewählten Kontakte werden zu Beziehungen am Patienten.
     Vorher standen sie als Freitext im Formular und landeten nirgends. */
  if (patientId && kontakte) {
    const heute = formatAnzeige(GEGENWART);
    if (kontakte.notfallkontaktId) {
      beziehungAusOnboarding(patientId, kontakte.notfallkontaktId, "weitere", heute, {
        art: kontakte.notfallkontaktVerwandtschaft, notfallkontakt: true,
      });
    }
    if (kontakte.sozialdienstId) {
      beziehungAusOnboarding(patientId, kontakte.sozialdienstId, "sozialdienst", heute, {});
    }
    /* Die Vertretung wird NICHT mit einer bestehenden Beziehung derselben
       Person zusammengeführt: eine Beiständin ist etwas anderes als eine
       Tochter, und beide Rollen können nebeneinander bestehen. Bei
       Notfallkontakt und Sozialdienst wird zusammengeführt, weil dort ein
       Merkmal beziehungsweise dieselbe Rolle hinzukommt. */
    if (kontakte.vertretungKontaktId) {
      beziehungAusOnboarding(patientId, kontakte.vertretungKontaktId, "beistand", heute, {
        vertretungsart: kontakte.vertretungsart, zusammenfuehren: false,
      });
    }
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
  const klvVerordnung = [...artefakte.klvVerordnungen, ...getKlvVerordnungen()].find(
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
    /* Fachliche Daten der Pendenz — an der Gegenwart, nicht an der Uhr. */
    const heute = GEGENWART_ISO;
    const faellig = new Date(GEGENWART.getFullYear(), GEGENWART.getMonth(), GEGENWART.getDate() + 14)
      .toISOString().slice(0, 10);
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
    /* Fachliche Daten der Pendenz — an der Gegenwart, nicht an der Uhr. */
    const heute = GEGENWART_ISO;
    const faellig = new Date(GEGENWART.getFullYear(), GEGENWART.getMonth(), GEGENWART.getDate() + 14)
      .toISOString().slice(0, 10);
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
