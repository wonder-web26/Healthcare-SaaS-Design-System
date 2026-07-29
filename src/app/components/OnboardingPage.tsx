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
import { ZurueckLeiste } from "./ui/ZurueckLeiste";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "./ui/dropdown-menu";

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

  // Workflow-Aggregat (aus Rhythmus-Engine)
  aktualisiereUeberfaellige();
  const rhythmusTickets = getTicketsFuerSubjekt("patient", caseId);
  const workflowDone = rhythmusTickets.filter(t => t.status === "erledigt").length;
  const workflowTotal = rhythmusTickets.length;
  // Nächstes fälliges Rhythmus-Ticket: erstes noch nicht erledigtes (aufsteigend nach
  // faelligAm sortiert → überfällige zuerst). Nur Rhythmus-Tickets, keine WorkflowTasks.
  const naechstesTicket = rhythmusTickets.find(t => t.status !== "erledigt") ?? null;

  // Zurück-Ziel: Ursprung aus der URL (?returnTo=), sonst die Onboarding-Übersicht.
  // Beschriftung nennt das ZIEL (Navigationsrahmen §E), nicht die Handlung.
  const returnTo = searchParams.get("returnTo") || "/onboarding";
  const returnLabel = returnTo.startsWith("/patienten") ? "Patienten"
    : returnTo.startsWith("/angehoerige") ? "Angehörige"
    : "Onboardings";

  // Tab-jump state (for header pill clicks → StepPatient tab switch)
  const [requestedPatientTab, setRequestedPatientTab] = useState<number | null>(null);

  // "Öffnen" im Aufgabenstreifen → Rhythmus/Workflow-Tab im Patienten-Schritt (Index 7).
  const oeffneRhythmus = () => {
    if (activeStepData.key === "patient") { setRequestedPatientTab(7); }
    else { goToStep(requiresB ? 3 : 2); setTimeout(() => setRequestedPatientTab(7), 100); }
  };

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
      {/* ── Navigationsrahmen: Rückweg oberhalb der Karte, nicht darin (§E) ── */}
      <ZurueckLeiste label={returnLabel} to={returnTo} />

      {/* ═══════════════════════════════════════
         HEADER CARD — einzeilig, scroll-collapse
         ═══════════════════════════════════════ */}
      {(() => {
        /* Scroll-collapse: track scroll position of the content area */
        const [collapsed, setCollapsed] = React.useState(false);
        const lastScrollY = React.useRef(0);
        const contentRef = React.useRef<HTMLDivElement | null>(null);

        React.useEffect(() => {
          const el = contentRef.current?.parentElement?.querySelector("[data-scroll-area]") as HTMLElement | null;
          if (!el) return;
          const onScroll = () => {
            const y = el.scrollTop;
            if (y > 60 && y > lastScrollY.current) setCollapsed(true);
            else if (y < lastScrollY.current - 10) setCollapsed(false);
            lastScrollY.current = y;
          };
          el.addEventListener("scroll", onScroll, { passive: true });
          return () => el.removeEventListener("scroll", onScroll);
        }, []);

        const patientStepActive = activeStepData.key === "patient";

        return (
          <div ref={contentRef} className="shrink-0" style={{ padding: "var(--space-4) var(--space-6) 0", marginBottom: "var(--space-3)", transition: "all 0.2s ease" }}>
            <div style={{ background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)", padding: collapsed ? "10px 20px" : "14px 24px", transition: "padding 0.2s ease" }}>
              <div className="flex items-start" style={{ gap: collapsed ? 8 : 12 }}>
                {/* Rückweg lebt jetzt im Navigationsrahmen oberhalb der Karte (§E). */}
                {/* Raster: Avatar 44px · Inhalt · Aktionen. Alle Textzeilen teilen die linke Kante der Inhaltsspalte. */}
                <div
                  className="flex-1 min-w-0"
                  style={{ display: "grid", gridTemplateColumns: `${collapsed ? 32 : 44}px minmax(0, 1fr) auto`, columnGap: 12, rowGap: 4, alignItems: "center" }}
                >
                  {/* Avatar (Initialen der Angehörigen), überspannt beide Zeilen */}
                  <div
                    className="shrink-0 flex items-center justify-center"
                    style={{ gridColumn: 1, gridRow: collapsed ? "auto" : "1 / span 2", alignSelf: "center", width: collapsed ? 32 : 44, height: collapsed ? 32 : 44, borderRadius: "var(--radius-pill)", background: "var(--brand-primary-light)", transition: "all 0.2s ease" }}
                  >
                    {caseInfo ? (
                      <span style={{ fontSize: collapsed ? 11 : 14, fontWeight: "var(--weight-semibold)", color: "var(--brand-primary)" }}>
                        {caseInfo.angehoeriger.trim().split(/\s+/).map(t => t[0]).slice(0, 2).join("").toUpperCase()}
                      </span>
                    ) : (
                      <Users style={{ width: collapsed ? 15 : 18, height: collapsed ? 15 : 18, color: "var(--brand-primary)" }} />
                    )}
                  </div>

                  {/* Zeile 1 links: Titel + Statusabzeichen (nicht bedienbar). Titel bricht um
                      (kein Abschneiden), wenn collapsed einzeilig; das Raster hält Zeile 2 ausgerichtet. */}
                  <div className="min-w-0 flex items-center flex-wrap" style={{ gridColumn: 2, gridRow: 1, gap: 8, minHeight: 24 }}>
                    <span className={collapsed ? "truncate" : ""} style={{ fontSize: collapsed ? "var(--text-body)" : "var(--text-h3)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", transition: "font-size 0.2s ease", overflowWrap: "anywhere", minWidth: 0 }}>
                      {isExisting && caseInfo ? `Onboarding — ${caseInfo.patient}` : "Neues Mandat eröffnen"}
                    </span>
                    {/* BEDIENBARE Statusmarke (§D): unterscheidet sich von einer Info-Marke —
                        Untergrundfläche + Rahmen 0.5 + nachgestellter Winkel, per Tab erreichbar,
                        sichtbarer Fokusring. Neues Mandat ohne Fall: reine Info-Marke. */}
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
                  </div>

                  {/* Zeile 1 rechts: Aktionen + Überlaufmenü, auf derselben Achse wie der Titel */}
                  <div className="flex items-center shrink-0 flex-wrap justify-end" style={{ gridColumn: 3, gridRow: 1, gap: 6 }}>
                    {/* Aggregat-Marken (Information, NICHT bedienbar): keine Rahmen, neutrale
                        Fläche. Ausnahme: fehlende Pflichtdokumente als letzter Blocker sind ein
                        Warnzustand → semantische Marke mit Symbol. */}
                    {!collapsed && (
                      <>
                        <StatusMarke label={`${completedCount} von ${nonBlockedSteps.length} Schritten`} variante="neutral" />
                        {fehlendeDocs > 0 && (
                          docsAreLastBlocker
                            ? <StatusMarke label={`${fehlendeDocs} Pflichtdok. fehlen`} variante="warnung" />
                            : <StatusMarke label={`${fehlendeDocs} Dokumente offen`} variante="neutral" />
                        )}
                      </>
                    )}
                  </div>

                  {/* Zeile 2: Angehörige, danach Bezugsperson (versteckt wenn collapsed) */}
                  {!collapsed && isExisting && caseInfo && (
                    <div className="flex items-center flex-wrap" style={{ gridColumn: "2 / 4", gridRow: 2, fontSize: "var(--text-meta)", color: "var(--text-tertiary)", gap: 10 }}>
                      <span>Angehörige: {caseInfo.angehoeriger}</span>
                      {/* Bezugsperson lives on the care relationship, first set here in onboarding */}
                      {caseId && <BezugspersonAuswahl caseId={caseId} />}
                      {/* Abbruchgrund erscheint am Fall */}
                      {caseStatus === "abgebrochen" && statusGrund && (
                        <span style={{ color: "var(--status-danger)" }}>Abbruchgrund: {statusGrund}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Anna-Hinweis-Zeile (deterministisch, regelbasiert, kollabiert mit) */}
            {!collapsed && <AnnaHinweisZeile
              onJumpToPflegeplanung={() => { goToStep(requiresB ? 3 : 2); setTimeout(() => setRequestedPatientTab(5), 100); }}
            />}
          </div>
        );
      })()}

      {/* ═══════════════════════════════════════
         AUFGABENSTREIFEN — nächstes fälliges Rhythmus-Ticket des Falls.
         Bewusst nur Rhythmus-Tickets; WorkflowTasks/Service-Tickets erscheinen hier nicht.
         ═══════════════════════════════════════ */}
      {isExisting && caseId && (() => {
        const faelligDate = naechstesTicket ? isoZuDate(naechstesTicket.faelligAm) : null;
        const faelligText = faelligDate ? formatFaelligkeit(faelligDate) : (naechstesTicket?.faelligAm ?? "");
        const ueberfaellig = naechstesTicket?.status === "ueberfaellig";
        const leerText = rhythmusTickets.length === 0
          ? "Noch keine Rhythmus-Tickets. Sie entstehen im Patienten-Schritt."
          : "Alle Rhythmus-Tickets sind erledigt.";
        return (
          <div style={{ padding: "0 var(--space-6)", marginBottom: "var(--space-3)" }}>
            <div className="flex items-center justify-between" style={{ gap: 12, padding: "10px 16px", background: "var(--bg-elevated)", border: "0.5px solid var(--border-default)", borderRadius: 10 }}>
              <div className="flex items-center min-w-0" style={{ gap: 12 }}>
                <span className="shrink-0 flex items-center justify-center" style={{ width: 32, height: 32, borderRadius: "var(--radius-pill)", background: "var(--bg-secondary)" }}>
                  <Repeat style={{ width: 15, height: 15, color: "var(--text-secondary)" }} />
                </span>
                <div className="min-w-0">
                  <div style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>Nächster Betreuungsrhythmus</div>
                  {naechstesTicket ? (
                    <div className="flex items-center flex-wrap" style={{ gap: 8, marginTop: 1 }}>
                      <span className="truncate" style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>{naechstesTicket.label}</span>
                      {/* Überfällig: an Icon UND Schriftstärke erkennbar, nicht nur an der Farbe */}
                      <span className="inline-flex items-center" style={{ gap: 4, fontSize: "var(--text-meta)", fontWeight: ueberfaellig ? "var(--weight-semibold)" : 400, color: ueberfaellig ? "var(--status-danger)" : "var(--text-secondary)" }}>
                        {ueberfaellig && <AlertTriangle style={{ width: 11, height: 11 }} />}
                        {faelligText}
                      </span>
                    </div>
                  ) : (
                    <div style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", marginTop: 1 }}>{leerText}</div>
                  )}
                </div>
              </div>
              {naechstesTicket && (
                <AppButton variant="sekundaer" className="shrink-0" onClick={oeffneRhythmus}>Öffnen</AppButton>
              )}
            </div>
          </div>
        );
      })()}

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

      {/* ═══════════════════════════════════════
         AUFZEICHNUNG (Onboarding-Ebene, sichtbar in allen Schritten/Tabs)
         ═══════════════════════════════════════ */}
      {isExisting && (
        <div style={{ padding: "0 var(--space-6)", marginBottom: 2 }}>
          {isRecording ? (
            /* During recording: quiet hint — Beenden is in the global bar only */
            <div className="flex items-center" style={{ gap: 8, padding: "8px 16px", background: "var(--bg-elevated)", border: "0.5px solid var(--border-default)", borderRadius: 10 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--status-danger)", animation: "pulse 1.5s ease-in-out infinite", flexShrink: 0 }} />
              <span style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>
                Aufzeichnung läuft — beenden über die Leiste oben.
              </span>
            </div>
          ) : (
            /* Vor der Aufzeichnung: Einstiegsblock */
            <div style={{ padding: "14px 18px", background: "var(--bg-elevated)", border: "0.5px solid var(--border-default)", borderRadius: 10 }}>
              <div className="flex items-center justify-between">
                <div>
                  <div style={{ fontSize: "var(--text-small)", fontWeight: 500, color: "var(--text-primary)" }}>Gespräch aufzeichnen</div>
                  <div style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", marginTop: 2 }}>
                    Aus dem Gespräch entstehen Vorschläge für die Bedarfsabklärung (interRAI), Pflegeplanung und KLV-Verordnung.
                  </div>
                </div>
                <AppButton
                  variant="sekundaer"
                  icon={Mic}
                  className="shrink-0"
                  onClick={() => {
                    if (!caseId) return;
                    const person = getPersonByOnboardingId(caseId);
                    if (!person) return;
                    const assessments = getAssessmentsForPerson(person.id);
                    const target = assessments.find(a => a.status === "in_bearbeitung") ?? createAssessment(person.id, "erstabklaerung");
                    recording.startRecording(person.id, target.id, `${person.vorname} ${person.nachname}`);
                  }}
                >
                  Aufzeichnen
                </AppButton>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════
         MOBILE STEPPER
         ═══════════════════════════════════════ */}
      <div className="lg:hidden shrink-0 overflow-x-auto" style={{ padding: "var(--space-3) var(--space-4)" }}>
        <div className="flex items-center" style={{ gap: "var(--space-1)" }}>
          {wizardSteps.map((step, idx) => {
            const isSelected = currentStep === step.id;
            const isCompleted = completedSteps.has(step.id);
            const isDanger = !!step.danger;
            const isBlocked = !!step.blocked;
            return (
              <button key={step.key} onClick={() => !isBlocked && goToStep(step.id)} disabled={isBlocked}
                className="inline-flex items-center whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                style={{
                  gap: "var(--space-1)", padding: "var(--space-2) var(--space-3)", borderRadius: "var(--radius-pill)",
                  fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)",
                  opacity: isBlocked ? 0.5 : 1, cursor: isBlocked ? "not-allowed" : "pointer",
                  background: isSelected ? "var(--brand-primary-light)" : isCompleted ? "var(--status-success-bg)" : isDanger ? "var(--status-danger-bg)" : "transparent",
                  color: isSelected ? "var(--brand-primary)" : isCompleted ? "var(--status-success-text)" : isDanger ? "var(--status-danger)" : "var(--text-secondary)",
                }}>
                {isCompleted ? <Check style={{ width: 12, height: 12 }} /> : <step.icon style={{ width: 12, height: 12 }} />}
                <span className="hidden sm:inline">{step.shortLabel}</span>
                <span className="sm:hidden">{idx + 1}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════
         MAIN SPLIT LAYOUT
         ═══════════════════════════════════════ */}
      <div className="flex-1 flex min-h-0" style={{ padding: "0 var(--space-6)" }}>
        <div className="flex w-full min-h-0" style={{ gap: "var(--space-5)" }}>
          {/* ── LEFT: Sidebar (desktop) ── */}
          <div className="hidden lg:flex shrink-0 flex-col min-h-0" style={{ width: 240 }}>
            <div className="flex-1 overflow-y-auto" style={{ paddingRight: "var(--space-1)" }}>
              <div style={{ background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)", padding: "var(--space-4)" }}>
                <div style={{ fontSize: "var(--text-micro)", color: "var(--text-secondary)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase", marginBottom: "var(--space-4)" }}>
                  Fortschritt
                </div>

                <nav className="flex flex-col" style={{ gap: "var(--space-1)" }}>
                  {wizardSteps.map((step, idx) => {
                    const Icon = step.icon;
                    const isSelected = currentStep === step.id;
                    const isCompleted = completedSteps.has(step.id);
                    const isDanger = !!step.danger;
                    const isBlocked = !!step.blocked;
                    const isInProgress = visitedSteps.has(step.id) && step.id === currentStep;

                    const iconBg = isBlocked ? "var(--status-danger-bg)" : isDanger ? "var(--status-danger)" : isCompleted ? "var(--status-success)" : isInProgress ? "var(--brand-primary)" : "var(--bg-secondary)";
                    const iconColor = isBlocked ? "var(--status-danger)" : (isDanger || isCompleted || isInProgress) ? "var(--text-on-dark)" : "var(--text-secondary)";

                    const isVisitedButIncomplete = visitedSteps.has(step.id) && !isCompleted && !isInProgress;
                    let statusText = "Ausstehend";
                    let statusColor = "var(--text-tertiary)";
                    if (isBlocked) { statusText = "Blockiert"; statusColor = "var(--status-danger)"; }
                    else if (isDanger) { statusText = "Pflicht · ausstehend"; statusColor = "var(--status-danger)"; }
                    else if (isCompleted) {
                      statusText = step.key === "spezialbewilligung" && angehoerigerData.spezialbewilligungEinreichungsDatum
                        ? `Eingereicht am ${angehoerigerData.spezialbewilligungEinreichungsDatum.split("-").reverse().join(".")}`
                        : "Abgeschlossen";
                      statusColor = "var(--status-success-text)";
                    } else if (isInProgress) { statusText = "In Bearbeitung"; statusColor = "var(--text-secondary)"; }
                    else if (isVisitedButIncomplete) { statusText = "Unvollständig"; statusColor = "var(--status-warning-text)"; }

                    return (
                      <div key={step.key}>
                        <button
                          onClick={() => !isBlocked && goToStep(step.id)}
                          disabled={isBlocked}
                          className="w-full flex items-start text-left cursor-pointer transition-colors"
                          style={{
                            gap: "var(--space-2)", padding: "8px 10px", borderRadius: "var(--radius-card)",
                            opacity: isBlocked ? 0.6 : 1, cursor: isBlocked ? "not-allowed" : "pointer",
                            background: isSelected ? "var(--brand-primary-light)" : "transparent",
                          }}
                          onMouseEnter={e => { if (!isSelected && !isBlocked) e.currentTarget.style.background = "var(--bg-secondary)"; }}
                          onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                        >
                          <div className="shrink-0 flex items-center justify-center" style={{ width: 32, height: 32, borderRadius: "var(--radius-card)", background: iconBg }}>
                            {isCompleted ? <Check style={{ width: 14, height: 14, color: iconColor }} /> : <Icon style={{ width: 14, height: 14, color: iconColor }} />}
                          </div>
                          <div className="flex-1 min-w-0" style={{ paddingTop: 2 }}>
                            <div className="truncate" style={{ fontSize: "var(--text-small)", fontWeight: isSelected ? "var(--weight-medium)" : "var(--weight-regular)", color: isSelected ? "var(--brand-primary)" : "var(--text-primary)" }}>
                              {step.label}
                            </div>
                            <div className="truncate" style={{ fontSize: "var(--text-micro)", color: statusColor, marginTop: 2 }}>
                              {statusText}
                            </div>
                          </div>
                          {isSelected && !isBlocked && <ChevronRight style={{ width: 16, height: 16, color: "var(--brand-primary)", flexShrink: 0, marginTop: 2 }} />}
                          {isDanger && <AlertTriangle style={{ width: 14, height: 14, color: "var(--status-warning)", flexShrink: 0, marginTop: 2 }} title="Erforderlich wegen Aufenthaltsstatus B" />}
                        </button>
                        {idx < wizardSteps.length - 1 && (
                          <div style={{ display: "flex", justifyContent: "flex-start", paddingLeft: 22 }}>
                            <div style={{ width: "var(--border-thin)", height: 8, background: isCompleted ? "var(--status-success)" : "var(--border-default)", borderRadius: "var(--radius-pill)" }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </nav>

              </div>
            </div>
          </div>

          {/* ── RIGHT: Content ── */}
          <div className="flex-1 flex flex-col min-h-0 min-w-0">
            <div data-scroll-area className="flex-1 overflow-y-auto" style={{ paddingBottom: "var(--space-4)" }}>
              {activeStepData.key === "angehoeriger" && (
                <StepAngehoeriger
                  data={angehoerigerData}
                  onChange={setAngehoerigerData}
                  onValidityChange={setStep1Valid}
                  onOpenSpezialbewilligung={() => setShowSpezialbewilligung(true)}
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

            {/* ── FOOTER NAVIGATION ── */}
            <div className="shrink-0" style={{ padding: "var(--space-4) var(--space-6)", background: "var(--bg-primary)", borderTop: "var(--border-thin) solid var(--border-default)" }}>
              <div className="flex items-center justify-between">
                {/* Left: Back (Wizard-Schritt zurück) — Sekundär */}
                <AppButton variant="sekundaer" icon={ChevronLeft} onClick={goPrev} disabled={currentStep === 1}>Zurück</AppButton>

                {/* Center: Step indicator */}
                <span style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>Schritt {currentStep} von {wizardSteps.length}</span>

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
                    });

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