import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router";
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
} from "lucide-react";
import {
  StepAngehoeriger,
  emptyAngehoerigerForm,
  type AngehoerigerFormData,
} from "./StepAngehoeriger";
import {
  StepPatient,
  emptyPatientForm,
  getPatientRequiredDocKeys,
  getFehlendePflichtdokumente,
  type PatientFormData,
} from "./StepPatient";
import { VertragsunterzeichnungPhase } from "./VertragsunterzeichnungPhase";
import { SpezialbewilligungDialog } from "./SpezialbewilligungDialog";
import { SpezialbewilligungStep } from "./form/SpezialbewilligungStep";
import { VertragsStep } from "./form/VertragsStep";
import { EinwilligungProvider } from "./EinwilligungContext";
import { ArztAnfrageProvider, useArztAnfrage } from "./ArztAnfrageContext";
// Anna Next-Best-Action-Banner: bewusst zurückgestellt. Hier vorgesehen für künftige dynamische Anna-Zeile.
// import { AnnaListenEinordnung, type DetailKontext } from "../anna/AnnaListenEinordnung";
import { konvertiereOnboarding } from "../../lib/onboarding/konvertierung";
import { MOCK_ASSESSMENTS, MOCK_PFLEGEPLANUNGEN, MOCK_KLV_VERORDNUNGEN, MOCK_WORKFLOWS } from "../../lib/mocks/klinische-artefakte-mock";
import { toast } from "sonner";

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
    label: "Angehöriger (HR)",
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
    label: "Patient (Medizin)",
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
      if (step3Valid && !requiresB) next.add(vertragStepId);
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
      // Mark current step as completed when moving forward
      setCompletedSteps((prev) => new Set([...prev, currentStep]));
      goToStep(currentStep + 1);
    }
  };

  const goPrev = () => {
    if (currentStep > 1) goToStep(currentStep - 1);
  };

  /* ── Save simulation ───────────────────── */
  const handleSave = useCallback(() => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      const now = new Date();
      const timeStr = now.toLocaleTimeString("de-CH", {
        hour: "2-digit",
        minute: "2-digit",
      });
      setLastSaved(timeStr);
      setShowSaveToast(true);
      setTimeout(() => setShowSaveToast(false), 3000);
    }, 1200);
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
    const fehlendePflichtdokumente = getFehlendePflichtdokumente(patientData.scans);
    const arbeitsvertragOk = step3Valid;
    const vollstaendig = arbeitsvertragOk && fehlendePflichtdokumente.length === 0;
    return { arbeitsvertragOk, fehlendePflichtdokumente, vollstaendig };
  }, [step3Valid, patientData.scans]);

  const fehlendeDocs = abschlussPruefung.fehlendePflichtdokumente.length;

  // Vorgangs-Status abgeleitet aus der gemeinsamen Prüfung
  const vorgangsStatus = useMemo(() => {
    if (abschlussPruefung.vollstaendig) return "bereit" as const;
    const hasArtefakt = !!(MOCK_ASSESSMENTS.find(a => a.onboardingId === caseId) || MOCK_PFLEGEPLANUNGEN.find(p => p.onboardingId === caseId) || MOCK_KLV_VERORDNUNGEN.find(k => k.onboardingId === caseId));
    if (hasArtefakt || completedCount > 0) return "bearbeitung" as const;
    return "entwurf" as const;
  }, [abschlussPruefung.vollstaendig, completedCount, caseId]);

  const vorgangsStatusLabel = vorgangsStatus === "bereit" ? "Bereit zum Abschluss" : vorgangsStatus === "bearbeitung" ? "In Bearbeitung" : "Entwurf";
  const vorgangsStatusColor = vorgangsStatus === "bereit" ? { bg: "var(--status-success-bg)", color: "var(--status-success-text)" } : vorgangsStatus === "bearbeitung" ? { bg: "var(--status-info-bg)", color: "var(--status-info)" } : { bg: "var(--bg-secondary)", color: "var(--text-secondary)" };

  // Pill-Zustand: Ocker nur wenn Docs der letzte Blocker sind
  const docsAreLastBlocker = abschlussPruefung.arbeitsvertragOk && fehlendeDocs > 0;

  // Override-Dialog state
  const [overrideBegrundung, setOverrideBegrundung] = useState("");

  // Workflow-Aggregat
  const workflowForHeader = MOCK_WORKFLOWS.find(w => w.typ === "patient-prozess" && w.onboardingId === caseId);
  const workflowDone = workflowForHeader?.schritte.filter(s => s.status === "abgeschlossen").length ?? 0;
  const workflowTotal = workflowForHeader?.schritte.length ?? 0;

  // Tab-jump state (for header pill clicks → StepPatient tab switch)
  const [requestedPatientTab, setRequestedPatientTab] = useState<number | null>(null);

  // Legacy progressLabel for footer (unchanged)
  const progressLabel = (() => {
    if (progressPercent === 100) return "Onboarding abgeschlossen";
    if (currentStep === totalSteps && !activeStepData.blocked) return "Bereit zum Abschluss";
    if (completedSteps.has(currentStep)) return "Bereit für nächsten Schritt";
    if (completedCount > 0) return "In Bearbeitung";
    return "Nicht gestartet";
  })();

  return (
    <EinwilligungProvider onboardingId={caseId || null} patientId={null}>
    <ArztAnfrageProvider onboardingId={caseId || null} patientId={null}>
    <div className="flex flex-col h-full min-h-0">
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
              <div className="flex items-center flex-wrap" style={{ gap: collapsed ? 8 : 12 }}>
                {/* Zurück-Pfeil */}
                <button
                  onClick={() => navigate("/onboarding")}
                  title="Zurück zur Übersicht"
                  className="shrink-0 flex items-center justify-center cursor-pointer transition-colors"
                  style={{ width: 32, height: 32, minHeight: 44, borderRadius: "var(--radius-pill)", background: "var(--bg-secondary)", border: "none" }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--bg-tertiary)"} onMouseLeave={e => e.currentTarget.style.background = "var(--bg-secondary)"}
                >
                  <ArrowLeft style={{ width: 16, height: 16, color: "var(--text-secondary)" }} />
                </button>

                {/* Title + Meta */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center" style={{ gap: 8 }}>
                    <span className="truncate" style={{ fontSize: collapsed ? "var(--text-body)" : "var(--text-h3)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", transition: "font-size 0.2s ease" }}>
                      {isExisting && caseInfo ? `Onboarding — ${caseInfo.patient}` : "Neues Mandat eröffnen"}
                    </span>
                    {/* Vorgangs-Status-Pill (always visible) */}
                    <span className="inline-flex items-center shrink-0" style={{ gap: 3, padding: "2px 10px", borderRadius: 999, fontSize: "var(--text-meta)", fontWeight: 500, background: vorgangsStatusColor.bg, color: vorgangsStatusColor.color }}>
                      {vorgangsStatusLabel}
                    </span>
                  </div>
                  {/* Meta (hidden when collapsed) */}
                  {!collapsed && isExisting && caseInfo && (
                    <div style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)", marginTop: 2 }}>
                      Angehörige: {caseInfo.angehoeriger} · Eintritt {caseInfo.vertragDatum}
                    </div>
                  )}
                </div>

                {/* Aggregat-Pills (hidden when collapsed) — max. 2, als Kommentar festgehalten */}
                {!collapsed && (
                  <div className="flex items-center shrink-0 flex-wrap" style={{ gap: 6 }}>
                    {/* Pill 1: Workflow-Schritte (always visible, neutral) */}
                    <button
                      onClick={() => { if (patientStepActive) { setRequestedPatientTab(7); } else { goToStep(requiresB ? 3 : 2); setTimeout(() => setRequestedPatientTab(7), 100); } }}
                      className="inline-flex items-center cursor-pointer"
                      style={{ gap: 3, padding: "2px 10px", borderRadius: 999, fontSize: "var(--text-meta)", fontWeight: 500, background: "var(--bg-secondary)", color: "var(--text-secondary)", border: "0.5px solid var(--border-default)" }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = "0.8")}
                      onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                    >
                      <Check style={{ width: 9, height: 9 }} />
                      {workflowDone} von {workflowTotal} Schritten
                    </button>
                    {/* Pill 2: Pflichtdokumente — neutral (Outline) oder Ocker (letzter Blocker) */}
                    {fehlendeDocs > 0 && (
                      <button
                        onClick={() => { if (patientStepActive) { setRequestedPatientTab(8); } else { goToStep(requiresB ? 3 : 2); setTimeout(() => setRequestedPatientTab(8), 100); } }}
                        className="inline-flex items-center cursor-pointer"
                        style={{
                          gap: 3, padding: "2px 10px", borderRadius: 999, fontSize: "var(--text-meta)", fontWeight: 500,
                          ...(docsAreLastBlocker
                            ? { background: "var(--status-warning-bg)", color: "var(--status-warning-text)", border: "none" }
                            : { background: "var(--bg-secondary)", color: "var(--text-secondary)", border: "0.5px solid var(--border-default)" }),
                        }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = "0.8")}
                        onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                      >
                        {docsAreLastBlocker && <AlertTriangle style={{ width: 9, height: 9 }} />}
                        {fehlendeDocs} {docsAreLastBlocker ? "Pflichtdok. fehlen" : "Dokumente offen"}
                      </button>
                    )}
                  </div>
                )}
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
                {/* Left: Back */}
                <button onClick={goPrev} disabled={currentStep === 1} className="inline-flex items-center cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ gap: "var(--space-2)", padding: "9.5px 22px", borderRadius: "var(--radius-pill)", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--text-primary)", fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}
                  onMouseEnter={e => { if (currentStep > 1) e.currentTarget.style.background = "var(--bg-secondary)"; }} onMouseLeave={e => e.currentTarget.style.background = "var(--bg-elevated)"}>
                  <ChevronLeft style={{ width: 14, height: 14 }} /> Zurück
                </button>

                {/* Center: Step indicator */}
                <span style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>Schritt {currentStep} von {wizardSteps.length}</span>

                {/* Right: Save + Next/Finish */}
                <div className="flex items-center" style={{ gap: "var(--space-2)" }}>
                  <button onClick={handleSave} disabled={isSaving} className="inline-flex items-center cursor-pointer transition-colors disabled:opacity-50"
                    style={{ gap: "var(--space-2)", padding: "9.5px 22px", borderRadius: "var(--radius-pill)", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--text-primary)", fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"} onMouseLeave={e => e.currentTarget.style.background = "var(--bg-elevated)"}>
                    {isSaving ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> : <Save style={{ width: 14, height: 14 }} />}
                    <span className="hidden lg:inline">Speichern</span>
                  </button>

                  {currentStep < wizardSteps.length ? (
                    (() => {
                      const isOnSpezialbewilligung = activeStepData.key === "spezialbewilligung";
                      const spezialbewilligungIncomplete = isOnSpezialbewilligung && !bewilligungEingereicht;
                      return (
                        <button onClick={spezialbewilligungIncomplete ? undefined : goNext} disabled={spezialbewilligungIncomplete}
                          className="inline-flex items-center cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          style={{ gap: "var(--space-2)", padding: "10px 22px", borderRadius: "var(--radius-pill)", background: "var(--brand-primary)", color: "var(--text-on-dark)", fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", border: "none" }}
                          onMouseEnter={e => { if (!spezialbewilligungIncomplete) e.currentTarget.style.background = "var(--brand-primary-dark)"; }}
                          onMouseLeave={e => e.currentTarget.style.background = "var(--brand-primary)"}
                          title={spezialbewilligungIncomplete ? "Erst Spezialbewilligung einreichen" : undefined}>
                          Weiter <ChevronRight style={{ width: 14, height: 14 }} />
                        </button>
                      );
                    })()
                  ) : (
                    <button
                      onClick={() => {
                        if (!abschlussPruefung.arbeitsvertragOk) return; // hart gesperrt
                        setOverrideBegrundung("");
                        setShowAbschlussDialog(true);
                      }}
                      disabled={isSaving || !abschlussPruefung.arbeitsvertragOk}
                      className="inline-flex items-center cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ gap: "var(--space-2)", padding: "10px 22px", borderRadius: "var(--radius-pill)", background: "var(--brand-primary)", color: "var(--text-on-dark)", fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", border: "none" }}
                      onMouseEnter={e => { if (abschlussPruefung.arbeitsvertragOk) e.currentTarget.style.background = "var(--brand-primary-dark)"; }}
                      onMouseLeave={e => e.currentTarget.style.background = "var(--brand-primary)"}
                      title={!abschlussPruefung.arbeitsvertragOk ? "Erst Arbeitsvertrag unterschreiben" : undefined}>
                      <Check style={{ width: 14, height: 14 }} /> Onboarding abschliessen
                    </button>
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

      {/* ═══════════════════════════════════════
         SAVE TOAST
         ═══════════════════════════════════════ */}
      {showSaveToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-foreground text-background shadow-lg">
            <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
            <span className="text-[13px]" style={{ fontWeight: 500 }}>
              Fortschritt gespeichert
            </span>
            <span className="text-[11px] opacity-70">{lastSaved}</span>
          </div>
        </div>
      )}

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
                  {abschlussPruefung.fehlendePflichtdokumente.map((label, i) => (
                    <div key={i} style={{ padding: "2px 0" }}>· {label}</div>
                  ))}
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
              <button onClick={() => setShowAbschlussDialog(false)} className="cursor-pointer" style={{ padding: "10px 20px", borderRadius: "var(--radius-pill)", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>Abbrechen</button>
              <button
                disabled={abschlussPruefung.fehlendePflichtdokumente.length > 0 && !overrideBegrundung.trim()}
                onClick={() => {
                  if (caseId) {
                    // Audit-Spur: bei Override dokumentieren
                    if (abschlussPruefung.fehlendePflichtdokumente.length > 0 && overrideBegrundung.trim()) {
                      const auditNote = {
                        zeitpunkt: new Date().toISOString(),
                        person: "Sandra Weber", // aktuelle Session-Rolle (Mock)
                        fehlendeDokumente: abschlussPruefung.fehlendePflichtdokumente,
                        begruendung: overrideBegrundung.trim(),
                      };
                      // Store on the workflow for persistence across konversion (Mock: console + toast)
                      const wf = MOCK_WORKFLOWS.find(w => w.onboardingId === caseId && w.typ === "patient-prozess");
                      if (wf) (wf as Record<string, unknown>).abschlussOverride = auditNote;
                      console.info("[Audit] Abschluss mit Override:", auditNote);
                    }
                    konvertiereOnboarding(caseId, { interRAIAssessments: MOCK_ASSESSMENTS, pflegeplanungen: MOCK_PFLEGEPLANUNGEN, klvVerordnungen: MOCK_KLV_VERORDNUNGEN, workflows: MOCK_WORKFLOWS }, {
                      name: `${angehoerigerData.vorname || ""} ${angehoerigerData.name || ""}`.trim(),
                      quellensteuerpflichtig: angehoerigerData.quellensteuer === "ja",
                    });
                  }
                  setShowAbschlussDialog(false);
                  const overrideHint = abschlussPruefung.fehlendePflichtdokumente.length > 0 ? " (mit ausstehenden Dokumenten)" : "";
                  toast(`Onboarding abgeschlossen${overrideHint}. ${caseInfo?.patient || "Patient"} ist jetzt ein aktiver Klient.`);
                  setTimeout(() => navigate("/patienten"), 1500);
                }}
                className="cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ padding: "10px 20px", borderRadius: "var(--radius-pill)", background: "var(--brand-primary)", border: "none", fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-on-dark)" }}
              >
                {abschlussPruefung.fehlendePflichtdokumente.length > 0 ? "Trotzdem abschliessen" : "Konvertieren und abschliessen"}
              </button>
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