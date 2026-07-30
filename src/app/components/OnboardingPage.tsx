import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import {
  Users,
  HeartPulse,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Check,
  X,
  Save,
  Clock,
  Loader2,
  ArrowLeft,
  FileSignature,
  FileText,
  ShieldAlert,
  Lock,
  AlertTriangle,
  Sparkles,
  Ban,
  Repeat,
  ChevronDown,
  MoreVertical,
  Circle,
  CircleDot,
  AlertCircle,
} from "lucide-react";
import {
  StepAngehoeriger,
  emptyAngehoerigerForm,
  type AngehoerigerFormData,
} from "./StepAngehoeriger";
import {
  StepPatient,
  emptyPatientForm,
  getFehlendePflichtdokumente,
  type PatientFormData,
} from "./StepPatient";
import { VertragsunterzeichnungPhase } from "./VertragsunterzeichnungPhase";
import { SpezialbewilligungDialog } from "./SpezialbewilligungDialog";
import { SpezialbewilligungStep } from "./form/SpezialbewilligungStep";
import { VertragsStep } from "./form/VertragsStep";
import { EinwilligungProvider } from "./EinwilligungContext";
import { ArztAnfrageProvider, useArztAnfrage } from "./ArztAnfrageContext";
import { BezugspersonAuswahl } from "./BezugspersonAuswahl";
// Anna Next-Best-Action-Banner: bewusst zurückgestellt. Hier vorgesehen für künftige dynamische Anna-Zeile.
// import { AnnaListenEinordnung, type DetailKontext } from "../anna/AnnaListenEinordnung";
import { konvertiereOnboarding } from "../../lib/onboarding/konvertierung";
import { MOCK_ASSESSMENTS, MOCK_PFLEGEPLANUNGEN, MOCK_KLV_VERORDNUNGEN } from "../../lib/mocks/klinische-artefakte-mock";
import { getTicketsFuerSubjekt, aktualisiereUeberfaellige } from "../../lib/rhythmus/engine";
import { formatFaelligkeit, isoZuDate } from "../../lib/datum";
import { toast } from "sonner";
import { sichtbareDokumenttypen, istDokumentVollstaendig, type DokumentKontext } from "../../lib/stammdaten/dokumenttypen";
import { useRecording } from "../recording/RecordingContext";
import { Mic } from "lucide-react";
import { getPersonByOnboardingId, getAssessmentsForPerson, createAssessment } from "../../lib/interrai/store";
import { useCurrentUser } from "../auth";
import { ONBOARDING_STATUS_CFG, ONBOARDING_STATUS_WERTE, type OnboardingStatus } from "../../lib/onboarding/status";
import { getStatus, setzeStatus, getGrund } from "../../lib/onboarding/status-store";
import { AppButton } from "./ui/AppButton";
import { StatusMarke } from "./ui/StatusMarke";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "./ui/dropdown-menu";

// Erklärsatz zur Aufzeichnung: einmal pro Sitzung beim ersten Öffnen (§E).
let gespraechHinweisGezeigt = false;

/* ══════════════════════════════════════════
   STEP DEFINITIONS
   ══════════════════════════════════════════ */
interface WizardStep {
  id: number;
  key: string;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  description: string;
  sections: string[];
  blocked?: boolean;
  danger?: boolean;
}

const baseSteps: WizardStep[] = [
  {
    id: 1,
    key: "angehoeriger",
    label: "Angehöriger",
    shortLabel: "Angehöriger",
    icon: Users,
    description: "Personalangaben und HR-Daten des Angehörigen",
    sections: [
      "Personalien",
      "Steuer & Sozialversicherung",
      "Partner",
      "Kinder & Zulagen",
      "Anstellung & Auszahlung",
      "Dokumente",
    ],
  },
  {
    id: 2,
    key: "patient",
    label: "Patient",
    shortLabel: "Patient",
    icon: HeartPulse,
    description: "Medizinische und pflegerische Angaben zum Patienten",
    sections: [
      "Personalien",
      "Steuer & Sozialversicherungen",
      "Anamnese",
      "Aktivitäten",
      "Dokumente",
    ],
  },
  {
    id: 3,
    key: "vertrag",
    label: "Vertragsunterzeichnung",
    shortLabel: "Vertrag",
    icon: FileSignature,
    description: "Arbeitsvertrag auswählen und digital unterzeichnen",
    sections: [
      "Vertragstyp",
      "Dokumentenerstellung",
      "Digitale Signatur",
    ],
  },
];

function buildSteps(requiresB: boolean, bewilligungEingereicht: boolean): WizardStep[] {
  if (!requiresB) return baseSteps;
  const eingereicht = bewilligungEingereicht;
  return [
    baseSteps[0],
    {
      id: 2,
      key: "spezialbewilligung",
      label: "Spezialbewilligung B",
      shortLabel: "Bewilligung B",
      icon: eingereicht ? CheckCircle2 : ShieldAlert,
      description: "Erwerbstätigkeitsbewilligung beim Migrationsamt",
      sections: ["Antragstellung"],
      danger: !eingereicht,
    },
    { ...baseSteps[1], id: 3 },
    { ...baseSteps[2], id: 4, icon: eingereicht ? FileSignature : Lock, blocked: !eingereicht },
  ];
}

/**
 * Zustandssymbol einer Phase (§B). Jeder im Code mögliche Phasen-Zustand hat ein
 * eigenes Symbol + eine eigene Farbe; die Bezeichnung nennt den Zustand für
 * Bildschirmleser. Der Zustand ist an Symbol UND Farbe/Schnitt erkennbar, nie an
 * der Farbe allein.
 */
type PhasenZustand = { icon: React.ElementType; color: string; label: string };
function phasenZustand(f: { isCompleted: boolean; isInProgress: boolean; isBlocked: boolean; isDanger: boolean; isVisitedButIncomplete: boolean }): PhasenZustand {
  if (f.isBlocked) return { icon: Ban, color: "var(--status-danger)", label: "blockiert" };
  if (f.isDanger) return { icon: AlertTriangle, color: "var(--status-danger)", label: "Pflicht, ausstehend" };
  if (f.isCompleted) return { icon: CheckCircle2, color: "var(--status-success)", label: "abgeschlossen" };
  if (f.isInProgress) return { icon: CircleDot, color: "var(--text-primary)", label: "in Bearbeitung" };
  if (f.isVisitedButIncomplete) return { icon: AlertCircle, color: "var(--status-warning)", label: "unvollständig" };
  return { icon: Circle, color: "var(--text-tertiary)", label: "ausstehend" };
}

/* ══════════════════════════════════════════
   CASE LOOKUP (mock) — maps caseId to patient context
   ══════════════════════════════════════════ */
const onboardingCaseLookup: Record<string, { patient: string; patientId: string; angehoeriger: string; vertragDatum: string }> = {
  "OB-2026-001": { patient: "Schmid, Thomas", patientId: "P-2026-0042", angehoeriger: "Lisa Schmid", vertragDatum: "18.02.2026" },
  "OB-2026-002": { patient: "Hoffmann, Peter", patientId: "P-2026-0046", angehoeriger: "Ruth Hoffmann", vertragDatum: "20.02.2026" },
  "OB-2026-003": { patient: "Becker, Sabine", patientId: "P-2026-0045", angehoeriger: "Hans Becker", vertragDatum: "10.02.2026" },
  "OB-2026-004": { patient: "Steiner, Heinrich", patientId: "P-2026-0048", angehoeriger: "Ursula Steiner", vertragDatum: "05.02.2026" },
  "OB-2026-008": { patient: "Graf, Lena", patientId: "P-2026-0051", angehoeriger: "Martin Graf", vertragDatum: "24.02.2026" },
  "OB-2026-009": { patient: "Huber, Fritz", patientId: "P-2026-0052", angehoeriger: "Erika Huber", vertragDatum: "15.02.2026" },
  "OB-2026-010": { patient: "Ammann, Rosa", patientId: "P-2026-0053", angehoeriger: "Daniel Ammann", vertragDatum: "26.02.2026" },
  "OB-2026-011": { patient: "Frei, Walter", patientId: "P-2026-0054", angehoeriger: "Margrit Frei", vertragDatum: "12.02.2026" },
};

/* ══════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════ */
/**
 * Anna-Hinweis-Zeile — deterministische Hinweis-Fläche im Vorgangs-Header.
 * Genau eine Aktion, regelbasiert (erweiterbare Prioritäts-Struktur).
 * Weist hin und springt — führt die Aktion nie selbst aus.
 *
 * Prioritäten (max. 1 wird angezeigt):
 * 1. ArztAnfrage.status == antwort_erhalten → Diagnosen bereit
 * 2. ArztAnfrage.status == versandbereit → Anfrage versandbereit
 * 3. (künftig erweiterbar: unbestätigte Vorschläge, etc.)
 */
function AnnaHinweisZeile({ onJumpToPflegeplanung }: { onJumpToPflegeplanung: () => void }) {
  const arztAnfrage = useArztAnfrage();
  const s = arztAnfrage?.anfrage.status ?? null;

  // Priorität 1: Antwort erhalten
  if (s === "antwort_erhalten") {
    return (
      <div className="flex items-center" style={{ gap: 6, marginTop: 8 }}>
        <Sparkles style={{ width: 12, height: 12, color: "var(--brand-primary)", flexShrink: 0 }} />
        <span style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>
          Antwort von {arztAnfrage!.anfrage.empfaengerName} erhalten – Diagnosen bereit zur Extraktion
        </span>
        <button
          onClick={onJumpToPflegeplanung}
          className="cursor-pointer shrink-0"
          style={{ background: "none", border: "none", fontSize: "var(--text-small)", fontWeight: 500, color: "var(--brand-primary)", padding: 0 }}
        >
          Zur Pflegeplanung →
        </button>
      </div>
    );
  }

  // Priorität 2: Versandbereit
  if (s === "versandbereit") {
    return (
      <div className="flex items-center" style={{ gap: 6, marginTop: 8 }}>
        <Sparkles style={{ width: 12, height: 12, color: "var(--brand-primary)", flexShrink: 0 }} />
        <span style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>
          Die Arzt-Anfrage ist bereit zum Versand
        </span>
        <button
          onClick={onJumpToPflegeplanung}
          className="cursor-pointer shrink-0"
          style={{ background: "none", border: "none", fontSize: "var(--text-small)", fontWeight: 500, color: "var(--brand-primary)", padding: 0 }}
        >
          Zur Pflegeplanung →
        </button>
      </div>
    );
  }

  // Sonst: keine Zeile
  return null;
}

export function OnboardingPage() {
  const navigate = useNavigate();
  const { caseId } = useParams<{ caseId: string }>();
  const [searchParams] = useSearchParams();
  const isExisting = !!caseId;
  const caseInfo = caseId ? onboardingCaseLookup[caseId] : null;

  const [currentStep, setCurrentStep] = useState(1);
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set([1]));
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [showSaveToast, setShowSaveToast] = useState(false);

  /* ── Angehöriger form state (lifted) ───── */
  const [angehoerigerData, setAngehoerigerData] = useState<AngehoerigerFormData>(emptyAngehoerigerForm);
  const [step1Valid, setStep1Valid] = useState(false);

  /* ── Patient form state (lifted) ───── */
  const [patientData, setPatientData] = useState<PatientFormData>(emptyPatientForm);
  const [step2Valid, setStep2Valid] = useState(false);

  /* ── Step 3 (Vertrag) validity ───── */
  const [step3Valid, setStep3Valid] = useState(false);

  /* ── Spezialbewilligung dialog ───── */
  const [showSpezialbewilligung, setShowSpezialbewilligung] = useState(false);
  const [showAbschlussDialog, setShowAbschlussDialog] = useState(false);
  const [showAbbruchDialog, setShowAbbruchDialog] = useState(false);
  /** Gespeicherte Abschluss-Begründung (innerhalb der Sitzung einsehbar) */
  const [abschlussAuditLog, setAbschlussAuditLog] = useState<{
    zeitpunkt: string; person: string; fehlendeDokumente: string[]; begruendung: string;
  } | null>(null);
  const recording = useRecording();
  const obPerson = caseId ? getPersonByOnboardingId(caseId) : null;
  const isRecording = recording.phase === "recording" && obPerson != null && recording.session?.personId === obPerson.id;
  const hasRecording = false; // No "done" phase in new recording model

  /* ── Dynamic steps based on Aufenthaltsstatus B ── */
  const requiresB = angehoerigerData.aufenthaltsstatus === "B";
  const bewilligungEingereicht = angehoerigerData.spezialbewilligungStatus === "eingereicht";
  const wizardSteps = buildSteps(requiresB, bewilligungEingereicht);

  /* ── Sync step validity with completedSteps ── */
  useEffect(() => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      if (step1Valid) next.add(1);
      else next.delete(1);
      return next;
    });
  }, [step1Valid]);

  useEffect(() => {
    if (requiresB) {
      setCompletedSteps((prev) => {
        const next = new Set(prev);
        if (bewilligungEingereicht) next.add(2);
        else next.delete(2);
        return next;
      });
    }
  }, [requiresB, bewilligungEingereicht]);

  useEffect(() => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      const patientStepId = requiresB ? 3 : 2;
      if (step2Valid) next.add(patientStepId);
      else next.delete(patientStepId);
      return next;
    });
  }, [step2Valid, requiresB]);

  useEffect(() => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      const vertragStepId = requiresB ? 4 : 3;
      if (step3Valid) next.add(vertragStepId);
      else next.delete(vertragStepId);
      return next;
    });
  }, [step3Valid, requiresB]);

  /* ── Progress calculation ──────────────── */
  const nonBlockedSteps = wizardSteps.filter((s) => !s.blocked);
  const progressPercent = nonBlockedSteps.length > 0
    ? Math.round((completedSteps.size / nonBlockedSteps.length) * 100)
    : 0;

  /* ── Navigation ────────────────────────── */
  const goToStep = useCallback(
    (step: number) => {
      if (step >= 1 && step <= wizardSteps.length) {
        setCurrentStep(step);
        setVisitedSteps((prev) => new Set([...prev, step]));
      }
    },
    [wizardSteps.length]
  );

  const goNext = () => {
    if (currentStep < wizardSteps.length) {
      // Navigation erlaubt auch bei unvollständigen Schritten.
      // Completion wird ausschliesslich aus dem Füllzustand abgeleitet (useEffect oben).
      goToStep(currentStep + 1);
    }
  };

  const goPrev = () => {
    if (currentStep > 1) goToStep(currentStep - 1);
  };

  /* ── Save simulation ───────────────────── */
  const handleSave = useCallback(() => {
    // Prototyp: keine Persistenz. Hinweis statt Scheinspeicherung.
    toast("Prototyp — Daten werden innerhalb der Sitzung gehalten, aber nicht dauerhaft gespeichert.");
  }, []);

  useEffect(() => {
    if (currentStep > wizardSteps.length) {
      setCurrentStep(wizardSteps.length);
    }
    const currentKey = wizardSteps.find((s) => s.id === currentStep)?.key;
    if (currentKey === "spezialbewilligung" && !requiresB) {
      setCurrentStep(1);
    }
  }, [requiresB, wizardSteps.length]);

  const activeStepData = wizardSteps.find((s) => s.id === currentStep) ?? wizardSteps[0];

  const completedCount = completedSteps.size;
  const totalSteps = wizardSteps.length;

  /**
   * Vorgangs-Status: deterministisch abgeleitet aus dem Vorgangszustand.
   * Befund alte Logik: "Nicht gestartet" war der Default wenn completedSteps.size === 0,
   * "In Bearbeitung" wenn mindestens ein Schritt completed war, "Bereit zum Abschluss" nur
   * wenn der User auf dem letzten Schritt stand. Das war an die Navigation gekoppelt, nicht an den Inhalt.
   *
   * Neue Ableitung (lesend, deterministisch):
   * - "Entwurf": kein klinisches Artefakt und kein abgeschlossener Wizard-Schritt vorhanden.
   * - "In Bearbeitung": mindestens ein Artefakt oder Schritt vorhanden, Abschluss-Voraussetzungen nicht erfüllt.
   * - "Bereit zum Abschluss": step3Valid (Arbeitsvertrag unterschrieben) — die geltende Abschluss-Bedingung.
   * - "Abgeschlossen": nicht im Onboarding erreichbar (konvertiert → redirect).
   */
  /**
   * Gemeinsame Abschluss-Ableitung — eine Funktion, eine Wahrheit.
   * Header-Status, Footer-Sperre, und Abschluss-Dialog nutzen alle diese Ableitung.
   */
  const abschlussPruefung = useMemo(() => {
    // Patient-Dokumente
    const fehlendPatient = getFehlendePflichtdokumente(patientData.scans);

    // Angehörigen-Dokumente (gleiche Engine wie DokumenteFormV2 und getSubStepStatus)
    const angKontext: DokumentKontext = {
      partnerErforderlich: ((angehoerigerData.zivilstand === "verheiratet" || angehoerigerData.zivilstand === "eingetragene_partnerschaft") && angehoerigerData.quellensteuer === "ja") || angehoerigerData.partnerManualToggle === true,
      hatKinder: parseInt(angehoerigerData.anzahlKinder) > 0,
      kinderzulagenUeberSpitex: angehoerigerData.kinderzulagenUeberSpitex === "ja",
      unterhaltspflicht: angehoerigerData.hatUnterhaltspflichtigeKinder === "ja",
      zertifikatDeutschVorhanden: angehoerigerData.zertifikatVorhanden === "ja",
      srkZertifikatVorhanden: angehoerigerData.srkZertifikatVorhanden === "ja",
      assistenzbeitragJa: false,
    };
    const angSichtbar = sichtbareDokumenttypen(angKontext, "angehoeriger");
    const fehlendAng = angSichtbar
      .filter(d => d.pflicht && !d.mehrfach && !istDokumentVollstaendig(d, angehoerigerData.scans))
      .map(d => d.label);

    const fehlendePflichtdokumente = [...fehlendPatient, ...fehlendAng];
    const arbeitsvertragOk = step3Valid;
    const vollstaendig = arbeitsvertragOk && fehlendePflichtdokumente.length === 0;
    return { arbeitsvertragOk, fehlendePflichtdokumente, fehlendPatient, fehlendAng, vollstaendig };
  }, [step3Valid, patientData.scans, angehoerigerData]);

  const fehlendeDocs = abschlussPruefung.fehlendePflichtdokumente.length;

  // ── Onboarding-Status: manuell gesetzt (KEINE Ableitung aus dem Fortschritt) ──
  // Kopf und Liste teilen dasselbe Vokabular (ONBOARDING_STATUS_CFG). Ein Fall
  // startet auf "neu"; jeder Wechsel ist eine menschliche Handlung und erzeugt
  // einen Ereignis-Eintrag (Status-Store). Es gibt keine Neuberechnung.
  const currentUser = useCurrentUser();
  const ausloeser = { id: currentUser.id, name: `${currentUser.vorname} ${currentUser.name}` };

  // Re-render trigger after mutating the (non-reactive) status store.
  const [statusTick, setStatusTick] = useState(0);
  const bumpStatus = () => setStatusTick(t => t + 1);
  void statusTick; // read so the badge recomputes after store mutations

  const caseStatus: OnboardingStatus = caseId ? getStatus(caseId) : "neu";
  const statusGrund = caseId ? getGrund(caseId) : null;
  const statusDarstellung = ONBOARDING_STATUS_CFG[caseStatus];

  // Abbruch-Dialog (Grund erforderlich) — ausgelöst über die Status-Auswahl im Abzeichen
  const [abbruchOffen, setAbbruchOffen] = useState(false);
  const [abbruchGrund, setAbbruchGrund] = useState("");
  const waehleStatus = (s: OnboardingStatus) => {
    if (!caseId) return;
    if (s === "abgebrochen") { setAbbruchGrund(""); setAbbruchOffen(true); return; }
    if (setzeStatus(caseId, s, ausloeser)) bumpStatus();
  };
  const bestaetigeAbbruch = () => {
    if (!caseId) return;
    if (setzeStatus(caseId, "abgebrochen", ausloeser, abbruchGrund)) {
      setAbbruchOffen(false);
      setAbbruchGrund("");
      bumpStatus();
    }
  };

  // Pill-Zustand: Ocker nur wenn Docs der letzte Blocker sind
  const docsAreLastBlocker = abschlussPruefung.arbeitsvertragOk && fehlendeDocs > 0;

  // Override-Dialog state
  const [overrideBegrundung, setOverrideBegrundung] = useState("");

  // Workflow-Aggregat (aus Rhythmus-Engine). Nur Rhythmus-Tickets, keine WorkflowTasks.
  aktualisiereUeberfaellige();
  const rhythmusTickets = getTicketsFuerSubjekt("patient", caseId);
  const erledigteTickets = rhythmusTickets.filter(t => t.status === "erledigt");
  // Offene Aufgaben: überfällige zuerst, danach nach Fälligkeit.
  const offeneTickets = rhythmusTickets
    .filter(t => t.status !== "erledigt")
    .sort((a, b) => {
      const ao = a.status === "ueberfaellig" ? 0 : 1;
      const bo = b.status === "ueberfaellig" ? 0 : 1;
      return ao !== bo ? ao - bo : a.faelligAm.localeCompare(b.faelligAm);
    });
  const offeneAnzahl = offeneTickets.length;
  const ueberfaelligAnzahl = offeneTickets.filter(t => t.status === "ueberfaellig").length;
  const naechste3 = offeneTickets.slice(0, 3);

  // "Alle N anzeigen" wechselt in den Patienten-Schritt und öffnet dort den Workflow-Reiter (§A).

  // Zurück-Ziel: Ursprung aus der URL (?returnTo=), sonst die Onboarding-Übersicht.
  // Beschriftung nennt das ZIEL (Navigationsrahmen §E), nicht die Handlung.
  const returnTo = searchParams.get("returnTo") || "/onboarding";
  const returnLabel = returnTo.startsWith("/patienten") ? "Patienten"
    : returnTo.startsWith("/angehoerige") ? "Angehörige"
    : "Onboardings";

  // Tab-jump state (for header pill clicks → StepPatient tab switch)
  const [requestedPatientTab, setRequestedPatientTab] = useState<number | null>(null);

  // "Öffnen" (Workflow-Aufgabe) → Rhythmus/Workflow-Tab im Patienten-Schritt (Index 7).
  const oeffneRhythmus = () => {
    if (activeStepData.key === "patient") { setRequestedPatientTab(7); }
    else { goToStep(requiresB ? 3 : 2); setTimeout(() => setRequestedPatientTab(7), 100); }
  };

  // "Gespräch" (§E): startet die Aufzeichnung. Der Erklärsatz erscheint als Hinweis
  // beim ERSTEN Öffnen der Funktion und danach nicht mehr (einmal gelesen).
  const startGespraech = () => {
    if (!caseId) return;
    const person = getPersonByOnboardingId(caseId);
    if (!person) return;
    if (!gespraechHinweisGezeigt) {
      gespraechHinweisGezeigt = true;
      toast("Aus dem Gespräch entstehen Vorschläge für die Bedarfsabklärung (interRAI), Pflegeplanung und KLV-Verordnung.");
    }
    const assessments = getAssessmentsForPerson(person.id);
    const target = assessments.find(a => a.status === "in_bearbeitung") ?? createAssessment(person.id, "erstabklaerung");
    recording.startRecording(person.id, target.id, `${person.vorname} ${person.nachname}`);
  };

  // "Gespräch" (§D): steht am rechten Ende der Reiterzeile des jeweiligen Schritts,
  // fix sichtbar. Während der Aufzeichnung ein stiller Hinweis statt Knopf.
  const gespraechReiter = isExisting ? (
    isRecording ? (
      <span className="inline-flex items-center" style={{ gap: 6, fontSize: "var(--text-meta)", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--status-danger)", animation: "pulse 1.5s ease-in-out infinite" }} />
        Aufzeichnung läuft
      </span>
    ) : (
      <AppButton variant="sekundaer" icon={Mic} onClick={startGespraech}>Gespräch</AppButton>
    )
  ) : null;

  // Restore the step + tab carried in the URL when returning from the interRAI
  // form (e.g. ?step=patient&tab=interrai). Runs once on mount.
  useEffect(() => {
    if (searchParams.get("step") !== "patient") return;
    const patientStep = wizardSteps.find((s) => s.key === "patient");
    if (!patientStep) return;
    goToStep(patientStep.id);
    if (searchParams.get("tab") === "interrai") {
      setTimeout(() => setRequestedPatientTab(5), 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // progressLabel und vorgangsStatus entfallen als eigenständige Begriffe —
  // der Onboarding-Status (ONBOARDING_STATUS_CFG) ist die eine Wahrheit.

  return (
    <EinwilligungProvider onboardingId={caseId || null} patientId={null}>
    <ArztAnfrageProvider onboardingId={caseId || null} patientId={null} hausarztName={patientData.hausarztName} hausarztEmail={patientData.hausarztEmail}>
    <div className="flex flex-col h-full min-h-0">
      {/* ── Kopfleiste (§B): keine Karte, kein Avatar. Der Patient ist Subjekt des Falls
             (Titel); die Angehörige ist Kontext. Zeile 1 Rückweg, Zeile 2 Titel + Marken. ── */}
      <div className="shrink-0" style={{ padding: "var(--space-3) var(--space-6) 0" }}>
        {/* Zeile 1: Rückweg als Textlink — Teil der Leiste, keine eigene Bildschirmzeile */}
        <button
          onClick={() => navigate(returnTo)}
          className="ui-fokusring inline-flex items-center cursor-pointer"
          style={{ gap: 5, padding: 0, background: "none", border: "none", fontFamily: "inherit", fontSize: "var(--text-meta)", color: "var(--text-secondary)", marginBottom: 4 }}
          onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
          onMouseLeave={e => (e.currentTarget.style.color = "var(--text-secondary)")}
        >
          <ArrowLeft style={{ width: 14, height: 14 }} /><span>{returnLabel}</span>
        </button>

        {/* Zeile 2 */}
        <div className="flex items-start justify-between" style={{ gap: 12 }}>
          {/* Links: Patientenname (Titel) · bedienbare Statusmarke · Angehörige (Kontext) */}
          <div className="min-w-0 flex items-center flex-wrap" style={{ gap: 8, rowGap: 4, minHeight: 26 }}>
            <span style={{ fontSize: "var(--text-h2)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", overflowWrap: "anywhere", minWidth: 0 }}>
              {isExisting && caseInfo ? caseInfo.patient : "Neues Mandat eröffnen"}
            </span>
            {caseId ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label={`Status ändern, aktuell ${statusDarstellung.label}`}
                    className="ui-fokusring inline-flex items-center shrink-0 cursor-pointer"
                    style={{ gap: 5, height: "var(--marke-height-interaktiv)", padding: "0 8px 0 10px", borderRadius: "var(--control-radius)", fontSize: "var(--text-meta)", fontWeight: 500, background: "var(--bg-elevated)", color: "var(--text-primary)", border: "var(--border-thin) solid var(--border-default)", fontFamily: "inherit" }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: 999, background: statusDarstellung.dot }} />
                    {statusDarstellung.label}
                    <ChevronDown style={{ width: 12, height: 12, opacity: 0.7 }} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {ONBOARDING_STATUS_WERTE.map(s => {
                    const cfg = ONBOARDING_STATUS_CFG[s];
                    return (
                      <DropdownMenuItem key={s} onSelect={() => waehleStatus(s)} style={{ gap: 8 }}>
                        <span style={{ width: 6, height: 6, borderRadius: 999, background: cfg.dot }} />
                        <span style={{ flex: 1 }}>{cfg.label}</span>
                        <Check style={{ width: 13, height: 13, opacity: caseStatus === s ? 1 : 0 }} />
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <StatusMarke label={statusDarstellung.label} variante="neutral" />
            )}
            {caseInfo && (
              <span className="inline-flex items-center" style={{ gap: 5, fontSize: "var(--text-meta)" }}>
                <span style={{ color: "var(--text-tertiary)" }}>Angehörige</span>
                <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>{caseInfo.angehoeriger}</span>
              </span>
            )}
            {caseStatus === "abgebrochen" && statusGrund && (
              <span style={{ fontSize: "var(--text-meta)", color: "var(--status-danger)" }}>Abbruchgrund: {statusGrund}</span>
            )}
          </div>

          {/* Rechts: überfällig (nur wenn vorhanden) · Schrittzähler · Dokumente · Überlaufmenü */}
          <div className="flex items-center shrink-0 flex-wrap justify-end" style={{ gap: 6 }}>
            {ueberfaelligAnzahl > 0 && <StatusMarke label={`${ueberfaelligAnzahl} überfällig`} variante="warnung" />}
            <StatusMarke label={`${completedCount} von ${nonBlockedSteps.length} Schritten`} variante="neutral" />
            {fehlendeDocs > 0 && (
              docsAreLastBlocker
                ? <StatusMarke label={`${fehlendeDocs} Pflichtdok. fehlen`} variante="warnung" />
                : <StatusMarke label={`${fehlendeDocs} Dokumente offen`} variante="neutral" />
            )}
            {caseId && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="Weitere Aktionen"
                    className="ui-fokusring flex items-center justify-center shrink-0 cursor-pointer"
                    style={{ width: "var(--marke-height-interaktiv)", height: "var(--marke-height-interaktiv)", borderRadius: "var(--control-radius)", background: "transparent", border: "none", color: "var(--text-secondary)" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-secondary)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <MoreVertical style={{ width: 16, height: 16 }} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setAbbruchOffen(true)} style={{ gap: 8, color: "var(--status-danger)" }}>
                    <Ban style={{ width: 14, height: 14 }} /> Fall abbrechen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      {/* AUFGABENSTREIFEN entfernt (§D): Inhalt ist in Abschnitt WORKFLOW der
         Zustandsspalte aufgegangen. Karte "Nächster Betreuungsrhythmus" existiert nicht mehr. */}

      {/* Workflow-Seitenpanel entfernt (§A): der Workflow ist bereits ein Reiter im
         Patienten-Schritt. "Alle N anzeigen" wechselt dorthin (siehe oeffneRhythmus). */}


      {/* ═══════════════════════════════════════
         ABBRUCH-DIALOG — destruktiv, Grund erforderlich
         ═══════════════════════════════════════ */}
      {abbruchOffen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "color-mix(in srgb, var(--text-primary) 40%, transparent)", padding: 16 }}
          onClick={() => setAbbruchOffen(false)}
          onKeyDown={e => { if (e.key === "Escape") setAbbruchOffen(false); }}
          role="dialog"
          aria-modal="true"
          aria-label="Onboarding-Fall abbrechen"
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ width: "100%", maxWidth: 440, background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-overlay)", padding: "var(--space-6)" }}
          >
            <div className="flex items-center" style={{ gap: 10, marginBottom: 8 }}>
              <span className="shrink-0 flex items-center justify-center" style={{ width: 32, height: 32, borderRadius: "var(--radius-pill)", background: "var(--status-danger-bg)" }}>
                <Ban style={{ width: 16, height: 16, color: "var(--status-danger)" }} />
              </span>
              <span style={{ fontSize: "var(--text-h3)", fontWeight: "var(--weight-semibold)", color: "var(--text-primary)" }}>Fall abbrechen</span>
            </div>
            <p style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", marginBottom: 14 }}>
              Der Fall wird als abgebrochen markiert. Ein Grund ist erforderlich; er wird im Statusverlauf festgehalten. Der Abbruch lässt sich später wieder aufheben.
            </p>
            <label style={{ display: "block", fontSize: "var(--text-meta)", color: "var(--text-secondary)", marginBottom: 4 }}>Grund</label>
            <textarea
              value={abbruchGrund}
              onChange={e => setAbbruchGrund(e.target.value)}
              autoFocus
              rows={3}
              placeholder="z. B. Mandat zurückgezogen, Doppelerfassung, Wechsel zu anderem Anbieter"
              style={{ width: "100%", resize: "vertical", padding: "10px 12px", fontSize: "var(--text-small)", fontFamily: "inherit", color: "var(--text-primary)", background: "var(--bg-secondary)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-input)" }}
            />
            <div className="flex items-center justify-end" style={{ gap: 8, marginTop: 16 }}>
              <button
                onClick={() => { setAbbruchOffen(false); setAbbruchGrund(""); }}
                className="cursor-pointer"
                style={{ padding: "8px 16px", borderRadius: "var(--radius-pill)", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}
              >
                Abbrechen
              </button>
              <button
                onClick={bestaetigeAbbruch}
                disabled={!abbruchGrund.trim()}
                className="cursor-pointer"
                style={{ padding: "8px 16px", borderRadius: "var(--radius-pill)", border: "none", fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-on-dark)", background: abbruchGrund.trim() ? "var(--status-danger)" : "var(--border-default)", opacity: abbruchGrund.trim() ? 1 : 0.7, cursor: abbruchGrund.trim() ? "pointer" : "not-allowed" }}
              >
                Fall abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AUFZEICHNUNG-Karte entfernt (§E): "Gespräch" ist eine Aktion (sekundärer Knopf
         rechts über der Reiterleiste), keine Karte. Der Erklärsatz erscheint als Hinweis
         beim ersten Öffnen (siehe startGespraech). */}

      {/* Mobile-Stepper entfernt (§A): die Phasen sind jetzt die erste Reiterebene
         oben im Container und auf allen Breiten sichtbar. */}

      {/* ═══════════════════════════════════════
         MAIN SPLIT LAYOUT
         ═══════════════════════════════════════ */}
      <div className="flex-1 flex min-h-0" style={{ padding: "var(--space-3) var(--space-6) var(--space-4)" }}>
        {/* §B: EIN Container mit Aussenlinie + Radius 10, kein Schatten; zwei Spalten, senkrechte Haarlinie 0.5. */}
        <div className="flex w-full min-h-0" style={{ border: "var(--border-thin) solid var(--border-default)", borderRadius: 10, background: "var(--bg-elevated)", overflow: "hidden" }}>
          {/* ── Zustandsspalte (200px fest, an den längsten echten Werten geprüft; kein Kürzen, Umbruch erlaubt) ── */}
          <div className="hidden lg:flex shrink-0 flex-col min-h-0 overflow-y-auto" style={{ width: 200, borderRight: "var(--border-thin) solid var(--border-default)", padding: "var(--space-4)" }}>
                {/* Abschnitt FORTSCHRITT entfernt (§C): die Phasen sind jetzt die erste
                   Reiterebene oben. Die Spalte zeigt nur noch, was zugewiesen ist und was ansteht. */}

                {/* ── Abschnitt BEZUGSPERSON (§E): Überschrift IST die Beschriftung; der Chip
                       steht allein darunter, linksbündig, über volle Spaltenbreite (Name bricht nicht um). ── */}
                <div style={{ fontSize: "var(--text-micro)", color: "var(--text-secondary)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase", marginBottom: "var(--space-3)" }}>Bezugsperson</div>
                {caseId ? <BezugspersonAuswahl caseId={caseId} /> : <span style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>—</span>}

                {/* Trennlinie */}
                <div style={{ height: "var(--border-thin)", background: "var(--border-default)", margin: "var(--space-4) 0" }} />

                {/* ── Abschnitt WORKFLOW (§C/§E/§H): Überschrift IST die Beschriftung; darunter nur Aufgaben ── */}
                <div style={{ fontSize: "var(--text-micro)", color: "var(--text-secondary)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase", marginBottom: "var(--space-3)" }}>Workflow</div>
                {rhythmusTickets.length === 0 ? (
                  // Leerzustand: nur der Leerzustandstext, KEIN Aufteilungssatz (§H)
                  <div style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>
                    Noch keine Aufgaben erzeugt. Sie entstehen im Patienten-Schritt.
                  </div>
                ) : (
                  <>
                    {naechste3.length > 0 ? (
                      <div className="flex flex-col" style={{ gap: "var(--space-2)" }}>
                        {naechste3.map(t => {
                          const d = isoZuDate(t.faelligAm);
                          // §A3: in der Spalte NUR die relative Angabe ("Heute", "in 2 Tagen",
                          // "12 Tage überfällig"). Das absolute Datum steht im Workflow-Reiter.
                          const faelligText = d ? formatFaelligkeit(d) : t.faelligAm;
                          const ov = t.status === "ueberfaellig";
                          return (
                            <div key={t.id} className="flex items-start" style={{ gap: 6 }}>
                              {ov
                                ? <AlertTriangle style={{ width: 13, height: 13, color: "var(--status-danger)", flexShrink: 0, marginTop: 1 }} />
                                : <Circle style={{ width: 13, height: 13, color: "var(--text-tertiary)", flexShrink: 0, marginTop: 1 }} />}
                              <div className="min-w-0">
                                <div style={{ fontSize: "var(--text-small)", color: "var(--text-primary)" }}>{t.label}</div>
                                <div style={{ fontSize: "var(--text-micro)", fontWeight: ov ? "var(--weight-semibold)" : 400, color: ov ? "var(--status-danger)" : "var(--text-tertiary)" }}>{faelligText}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>Alle Aufgaben erledigt.</div>
                    )}
                    {offeneAnzahl > 0 && (
                      <button
                        onClick={oeffneRhythmus}
                        className="ui-fokusring inline-flex items-center cursor-pointer"
                        style={{ marginTop: "var(--space-3)", gap: 4, padding: 0, background: "none", border: "none", fontFamily: "inherit", fontSize: "var(--text-meta)", fontWeight: 500, color: "var(--text-secondary)" }}
                        onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
                        onMouseLeave={e => (e.currentTarget.style.color = "var(--text-secondary)")}
                      >
                        Alle {offeneAnzahl} anzeigen <ChevronRight style={{ width: 13, height: 13 }} />
                      </button>
                    )}
                    {/* Erklärsatz nur wenn Aufgaben vorhanden (§H). Einzige Stelle, die das Domänenmodell erklärt. */}
                    <div style={{ marginTop: "var(--space-4)", fontSize: "var(--text-micro)", color: "var(--text-tertiary)", lineHeight: 1.4 }}>
                      Angehörige erhält nach Unterzeichnung einen eigenen Workflow.
                    </div>
                  </>
                )}

              </div>

          {/* ── Inhalt (§B): nimmt den Rest, keine eigene Karte ── */}
          <div className="flex-1 flex flex-col min-h-0 min-w-0">
            {/* ── ERSTE Reiterebene: Phasen (§A). Höhe 40, Zustandssymbol links, aktiver
                 Eintrag unterstrichen (2px, Textfarbe), Containerfläche ohne Tönung. ── */}
            <div
              role="tablist"
              aria-label="Phasen"
              className="shrink-0 flex overflow-x-auto"
              style={{ background: "var(--bg-elevated)" }}
              onKeyDown={e => {
                if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
                const btns = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>("button:not([disabled])"));
                const i = btns.indexOf(document.activeElement as HTMLButtonElement);
                if (i === -1) return;
                e.preventDefault();
                (e.key === "ArrowRight" ? btns[i + 1] : btns[i - 1])?.focus();
              }}
            >
              {wizardSteps.map((step) => {
                const isSelected = currentStep === step.id;
                const isCompleted = completedSteps.has(step.id);
                const isDanger = !!step.danger;
                const isBlocked = !!step.blocked;
                const isInProgress = visitedSteps.has(step.id) && step.id === currentStep;
                const isVisitedButIncomplete = visitedSteps.has(step.id) && !isCompleted && !isInProgress;
                const z = phasenZustand({ isCompleted, isInProgress, isBlocked, isDanger, isVisitedButIncomplete });
                const ZIcon = z.icon;
                return (
                  <button
                    key={step.key}
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => !isBlocked && goToStep(step.id)}
                    disabled={isBlocked}
                    title={isBlocked ? "Blockiert — Spezialbewilligung zuerst einreichen" : undefined}
                    className="ui-fokusring relative inline-flex items-center whitespace-nowrap shrink-0 cursor-pointer"
                    style={{
                      height: 40, gap: 6, padding: "0 14px", background: "transparent", border: "none", fontFamily: "inherit",
                      fontSize: "var(--text-small)", fontWeight: isSelected ? "var(--weight-medium)" : "var(--weight-regular)",
                      color: isSelected ? "var(--text-primary)" : z.color,
                      opacity: isBlocked ? 0.6 : 1, cursor: isBlocked ? "not-allowed" : "pointer",
                    }}
                  >
                    <ZIcon style={{ width: 14, height: 14, color: z.color, flexShrink: 0 }} role="img" aria-label={z.label} />
                    <span>{step.label}</span>
                    {isSelected && <span style={{ position: "absolute", left: 14, right: 14, bottom: 0, height: 2, background: "var(--text-primary)", borderRadius: 1 }} />}
                  </button>
                );
              })}
            </div>

            <div data-scroll-area className="flex-1 overflow-y-auto" style={{ paddingBottom: "var(--space-4)" }}>
              {activeStepData.key === "angehoeriger" && (
                <StepAngehoeriger
                  data={angehoerigerData}
                  onChange={setAngehoerigerData}
                  onValidityChange={setStep1Valid}
                  onOpenSpezialbewilligung={() => setShowSpezialbewilligung(true)}
                  reiterAktion={gespraechReiter}
                />
              )}
              {activeStepData.key === "spezialbewilligung" && (
                <SpezialbewilligungStep data={angehoerigerData} onChange={setAngehoerigerData} />
              )}
              {activeStepData.key === "patient" && (
                <StepPatient
                  data={patientData}
                  onChange={setPatientData}
                  onValidityChange={setStep2Valid}
                  onboardingId={caseId || undefined}
                  requestedTab={requestedPatientTab}
                  onTabSwitched={() => setRequestedPatientTab(null)}
                  reiterAktion={gespraechReiter}
                />
              )}
              {activeStepData.key === "vertrag" && (
                <VertragsStep
                  angehoerigerName={caseInfo?.angehoeriger ?? "Angehörige/r"}
                  stundenlohn={angehoerigerData.stundenlohn}
                  eintrittsdatum={angehoerigerData.eintrittsdatum}
                  onValidityChange={setStep3Valid}
                  onComplete={() => setStep3Valid(true)}
                />
              )}
            </div>

            {/* ── FOOTER NAVIGATION (innerhalb des Containers, keine eigene Karte) ── */}
            <div className="shrink-0" style={{ padding: "var(--space-4) var(--space-5)", background: "transparent", borderTop: "var(--border-thin) solid var(--border-default)" }}>
              <div className="flex items-center justify-between">
                {/* Left: Back (Wizard-Schritt zurück) — Sekundär */}
                <AppButton variant="sekundaer" icon={ChevronLeft} onClick={goPrev} disabled={currentStep === 1}>Zurück</AppButton>

                {/* "Schritt n von 3" entfernt (§D): die Phasenzeile zeigt dieselbe Information
                   und benennt zusätzlich die Phase. Platzhalter hält die Fusszeile ausbalanciert. */}
                <span aria-hidden="true" />

                {/* Right: Save + Next/Finish — genau ein Primär (Weiter ODER Abschliessen) */}
                <div className="flex items-center" style={{ gap: "var(--space-2)" }}>
                  <AppButton variant="sekundaer" icon={isSaving ? Loader2 : Save} iconClassName={isSaving ? "animate-spin" : undefined} onClick={handleSave} disabled={isSaving}>Speichern</AppButton>

                  {currentStep < wizardSteps.length ? (
                    (() => {
                      const isOnSpezialbewilligung = activeStepData.key === "spezialbewilligung";
                      const spezialbewilligungIncomplete = isOnSpezialbewilligung && !bewilligungEingereicht;
                      return (
                        <AppButton variant="primaer" iconRight={ChevronRight}
                          onClick={spezialbewilligungIncomplete ? undefined : goNext}
                          disabled={spezialbewilligungIncomplete}
                          title={spezialbewilligungIncomplete ? "Erst Spezialbewilligung einreichen" : undefined}>
                          Weiter
                        </AppButton>
                      );
                    })()
                  ) : (
                    <div>
                      <AppButton variant="primaer" icon={Check}
                        onClick={() => {
                          if (!abschlussPruefung.arbeitsvertragOk) return;
                          setOverrideBegrundung("");
                          setShowAbschlussDialog(true);
                        }}
                        disabled={isSaving || !abschlussPruefung.arbeitsvertragOk}>
                        Onboarding abschliessen
                      </AppButton>
                      {!abschlussPruefung.arbeitsvertragOk && (
                        <div style={{ marginTop: 6, fontSize: "var(--text-meta)", color: "var(--status-warning-text)" }}>
                          Arbeitsvertrag muss zuerst im Schritt «Vertragsunterzeichnung» unterschrieben werden.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════
         SPEZIALBEWILLIGUNG DIALOG
         ═══════════════════════════════════════ */}
      {showSpezialbewilligung && (
        <SpezialbewilligungDialog
          data={angehoerigerData}
          onChange={setAngehoerigerData}
          onClose={() => setShowSpezialbewilligung(false)}
        />
      )}

      {/* Save-Toast entfernt — Prototyp hat keine Persistenz */}

      {/* ═══════════════════════════════════════
         ABSCHLUSS-DIALOG (shared abschlussPruefung)
         ═══════════════════════════════════════ */}
      {showAbschlussDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ background: "rgba(19,19,20,0.5)" }} onClick={() => setShowAbschlussDialog(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "var(--bg-elevated)", borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-overlay)", maxWidth: 520, width: "92%", maxHeight: "85vh", overflow: "auto", padding: 24 }}>
            <div style={{ fontSize: "var(--text-h2)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", marginBottom: 8 }}>Onboarding abschliessen?</div>
            <div style={{ fontSize: "var(--text-body)", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 20 }}>
              Mit dem Abschluss werden Patient und Angehöriger als aktive Datensätze erzeugt. Die klinischen Artefakte bleiben verbunden.
            </div>

            <div style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", marginBottom: 6, fontWeight: "var(--weight-medium)" }}>Patient (im Werden → aktiv)</div>
            <div style={{ padding: "8px 12px", background: "var(--bg-secondary)", borderRadius: "var(--radius-card)", marginBottom: 12, fontSize: "var(--text-small)" }}>
              {caseInfo?.patient || "–"}
            </div>

            <div style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", marginBottom: 6, fontWeight: "var(--weight-medium)" }}>Angehöriger (im Werden → aktiv)</div>
            <div style={{ padding: "8px 12px", background: "var(--bg-secondary)", borderRadius: "var(--radius-card)", marginBottom: 12, fontSize: "var(--text-small)" }}>
              {caseInfo?.angehoeriger || "–"}
            </div>

            {/* Override-Block: fehlende Pflichtdokumente (weiche Sperre) */}
            {abschlussPruefung.fehlendePflichtdokumente.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div className="flex items-center" style={{ gap: 6, marginBottom: 8 }}>
                  <AlertTriangle style={{ width: 14, height: 14, color: "var(--status-warning-text)" }} />
                  <span style={{ fontSize: "var(--text-small)", fontWeight: 500, color: "var(--status-warning-text)" }}>
                    {abschlussPruefung.fehlendePflichtdokumente.length} Pflichtdokument{abschlussPruefung.fehlendePflichtdokumente.length !== 1 ? "e" : ""} fehlen
                  </span>
                </div>
                <div style={{ padding: "8px 12px", background: "var(--status-warning-bg)", borderRadius: "var(--radius-card)", marginBottom: 10, fontSize: "var(--text-small)", color: "var(--text-primary)" }}>
                  {abschlussPruefung.fehlendPatient.length > 0 && (
                    <div style={{ marginBottom: abschlussPruefung.fehlendAng.length > 0 ? 6 : 0 }}>
                      <div style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)", marginBottom: 2 }}>Patient</div>
                      {abschlussPruefung.fehlendPatient.map((label, i) => (
                        <div key={`p-${i}`} style={{ padding: "2px 0" }}>· {label}</div>
                      ))}
                    </div>
                  )}
                  {abschlussPruefung.fehlendAng.length > 0 && (
                    <div>
                      <div style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)", marginBottom: 2 }}>Angehörige/r</div>
                      {abschlussPruefung.fehlendAng.map((label, i) => (
                        <div key={`a-${i}`} style={{ padding: "2px 0" }}>· {label}</div>
                      ))}
                    </div>
                  )}
                </div>
                <label style={{ display: "block", fontSize: "var(--text-small)", fontWeight: 500, color: "var(--text-primary)", marginBottom: 4 }}>
                  Begründung (Pflichtfeld)
                </label>
                <textarea
                  value={overrideBegrundung}
                  onChange={e => setOverrideBegrundung(e.target.value)}
                  placeholder="z.B. Krankenkassenkarte wird nachgereicht, zugesagt bis 15.03."
                  rows={3}
                  style={{ width: "100%", padding: "10px 14px", fontSize: "var(--text-small)", borderRadius: "var(--radius-card)", border: "0.5px solid var(--border-default)", background: "var(--bg-elevated)", color: "var(--text-primary)", fontFamily: "inherit", resize: "vertical" }}
                />
              </div>
            )}

            {/* Compliance hints (klinische Artefakte) */}
            {(() => {
              const ba = MOCK_ASSESSMENTS.find(a => a.onboardingId === caseId);
              const hints: string[] = [];
              if (!ba || ba.status !== "abgeschlossen") hints.push("Das InterRAI ist noch nicht abgeschlossen. Es wird mitkonvertiert und kann später vervollständigt werden.");
              if (!MOCK_PFLEGEPLANUNGEN.find(p => p.onboardingId === caseId)) hints.push("Es wurde noch keine Pflegeplanung erstellt.");
              const klv = MOCK_KLV_VERORDNUNGEN.find(k => k.onboardingId === caseId);
              if (klv && klv.status !== "kostengutsprache-erhalten") hints.push(`Die KLV ist im Status "${klv.status}". Die Pipeline läuft am aktiven Patient weiter.`);
              if (hints.length === 0) return null;
              return hints.map((h, i) => (
                <div key={i} className="flex items-start" style={{ gap: 6, padding: "6px 10px", background: "var(--status-warning-bg)", borderRadius: "var(--radius-card)", marginBottom: 6, fontSize: "var(--text-small)", color: "var(--status-warning-text)" }}>
                  <AlertTriangle style={{ width: 12, height: 12, flexShrink: 0, marginTop: 2 }} />{h}
                </div>
              ));
            })()}

            <div className="flex items-center justify-end" style={{ gap: "var(--space-2)", marginTop: 20 }}>
              <AppButton variant="sekundaer" onClick={() => setShowAbschlussDialog(false)}>Abbrechen</AppButton>
              <AppButton
                variant="primaer"
                disabled={abschlussPruefung.fehlendePflichtdokumente.length > 0 && !overrideBegrundung.trim()}
                onClick={() => {
                  if (caseId) {
                    // Audit-Spur: bei Override dokumentieren und in Sitzungs-State festhalten
                    if (abschlussPruefung.fehlendePflichtdokumente.length > 0 && overrideBegrundung.trim()) {
                      const auditNote = {
                        zeitpunkt: new Date().toISOString(),
                        person: "Sandra Weber",
                        fehlendeDokumente: abschlussPruefung.fehlendePflichtdokumente,
                        begruendung: overrideBegrundung.trim(),
                      };
                      setAbschlussAuditLog(auditNote);
                      console.info("[Audit] Abschluss mit Override:", auditNote);
                    }
                    const ergebnis = konvertiereOnboarding(caseId, { interRAIAssessments: MOCK_ASSESSMENTS, pflegeplanungen: MOCK_PFLEGEPLANUNGEN, klvVerordnungen: MOCK_KLV_VERORDNUNGEN, workflows: [] }, {
                      name: `${angehoerigerData.vorname || ""} ${angehoerigerData.name || ""}`.trim(),
                      quellensteuerpflichtig: angehoerigerData.quellensteuer === "ja",
                      aufenthaltsstatus: angehoerigerData.aufenthaltsstatus,
                      bvgAnbindungGewuenscht: angehoerigerData.bvgAnbindungGewuenscht === "ja",
                      qualifikation: angehoerigerData.qualifikation,
                      eintrittsdatum: angehoerigerData.eintrittsdatum,
                    }, ausloeser);

                    // Qualifizierte Erfolgsmeldung
                    const a = ergebnis.konvertierteArtefakte;
                    const uebernommen: string[] = [];
                    if (a.interRAIAssessments.length > 0) uebernommen.push(`${a.interRAIAssessments.length} InterRAI`);
                    if (a.pflegeplanungen.length > 0) uebernommen.push(`${a.pflegeplanungen.length} Pflegeplanung`);
                    if (a.klvVerordnungen.length > 0) uebernommen.push(`${a.klvVerordnungen.length} KLV`);
                    const artefaktInfo = uebernommen.length > 0 ? ` (${uebernommen.join(", ")})` : "";
                    console.info("[Konvertierung]", ergebnis);
                  }
                  setShowAbschlussDialog(false);
                  const overrideHint = abschlussPruefung.fehlendePflichtdokumente.length > 0 ? " (mit ausstehenden Dokumenten)" : "";
                  toast(`Onboarding abgeschlossen${overrideHint}. ${caseInfo?.patient || "Patient"} ist jetzt ein aktiver Klient.`);
                  setTimeout(() => navigate("/patienten"), 1500);
                }}
              >
                {abschlussPruefung.fehlendePflichtdokumente.length > 0 ? "Trotzdem abschliessen" : "Konvertieren und abschliessen"}
              </AppButton>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════
         ABBRUCH-DIALOG
         ═══════════════════════════════════════ */}
      {showAbbruchDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ background: "rgba(19,19,20,0.5)" }} onClick={() => setShowAbbruchDialog(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "var(--bg-elevated)", borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-overlay)", maxWidth: 440, width: "92%", padding: 24 }}>
            <div style={{ fontSize: "var(--text-h2)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", marginBottom: 8 }}>Onboarding abbrechen?</div>
            <div style={{ fontSize: "var(--text-body)", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 20 }}>
              Beim Abbrechen wird kein Patient und kein Angehöriger erzeugt. Die klinischen Artefakte bleiben am Onboarding und werden archiviert.
            </div>
            <div className="flex items-center justify-end" style={{ gap: "var(--space-2)" }}>
              <button onClick={() => setShowAbbruchDialog(false)} className="cursor-pointer" style={{ padding: "10px 20px", borderRadius: "var(--radius-pill)", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>Abbrechen</button>
              <button onClick={() => { setShowAbbruchDialog(false); toast("Onboarding abgebrochen"); navigate("/onboarding"); }} className="cursor-pointer"
                style={{ padding: "10px 20px", borderRadius: "var(--radius-pill)", background: "var(--status-danger)", border: "none", fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-on-dark)" }}>
                Onboarding abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </ArztAnfrageProvider>
    </EinwilligungProvider>
  );
}