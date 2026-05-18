import { useNavigate } from "react-router";
import { ClipboardList, ArrowRight } from "lucide-react";

interface Step {
  nr: number;
  shortLabel: string;
  fullLabel: string;
  count: number;
  overdue: number;
  phaseIdx: number;
}

const phaseColors = [
  "var(--brand-accent)",    // Vorbereitung
  "var(--brand-primary)",   // KLV-Prozess
  "var(--status-success)",  // Aktivierung
];
const phaseLabels = ["Vorbereitung", "KLV-Prozess", "Aktivierung"];

const steps: Step[] = [
  { nr: 1, shortLabel: "Assessment", fullLabel: "Erstassessment", count: 1, overdue: 0, phaseIdx: 0 },
  { nr: 2, shortLabel: "Diagnose", fullLabel: "Diagnose und Medikamentenliste", count: 0, overdue: 0, phaseIdx: 0 },
  { nr: 3, shortLabel: "KLV erstellen", fullLabel: "KLV erstellen", count: 0, overdue: 0, phaseIdx: 1 },
  { nr: 4, shortLabel: "Kontrolle", fullLabel: "KLV kontrollieren", count: 1, overdue: 1, phaseIdx: 1 },
  { nr: 5, shortLabel: "An Arzt senden", fullLabel: "KLV an Arzt zur Unterschrift senden", count: 1, overdue: 0, phaseIdx: 1 },
  { nr: 6, shortLabel: "Von Arzt erhalten", fullLabel: "KLV von Arzt erhalten", count: 0, overdue: 0, phaseIdx: 1 },
  { nr: 7, shortLabel: "An KK senden", fullLabel: "KLV an Krankenkasse übermitteln", count: 1, overdue: 0, phaseIdx: 1 },
  { nr: 8, shortLabel: "Vertrag signieren", fullLabel: "Vertrag unterzeichnen", count: 1, overdue: 0, phaseIdx: 2 },
  { nr: 9, shortLabel: "MedLink Schulung", fullLabel: "MedLink-Schulung durchführen", count: 1, overdue: 0, phaseIdx: 2 },
];

const total = steps.reduce((s, st) => s + st.count, 0);
const totalOverdue = steps.reduce((s, st) => s + st.overdue, 0);

export function OnboardingPipelineTile() {
  const navigate = useNavigate();

  return (
    <div style={{ background: "var(--bg-elevated)", borderRadius: "var(--radius-card)", border: "var(--border-thin) solid var(--border-default)" }}>
      {/* Header */}
      <div
        className="cursor-pointer transition-colors"
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-4)" }}
        onClick={() => navigate("/onboarding")}
        onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
      >
        <div className="flex items-center min-w-0" style={{ gap: "var(--space-2)" }}>
          <div style={{ fontSize: "var(--text-micro)", color: "var(--text-secondary)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase", fontWeight: "var(--weight-regular)" }}>
            Onboarding-Pipeline
          </div>
          <span style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>
            {total} Klienten
          </span>
          {totalOverdue > 0 && (
            <>
              <span style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>·</span>
              <button
                onClick={(e) => { e.stopPropagation(); navigate("/onboarding?status=ueberfaellig"); }}
                className="cursor-pointer"
                style={{ fontSize: "var(--text-meta)", color: "var(--status-danger)", fontWeight: "var(--weight-medium)", background: "transparent", border: "none", padding: 0 }}
              >
                {totalOverdue} überfällig
              </button>
            </>
          )}
        </div>
        <div className="flex items-center" style={{ gap: "var(--space-1)", fontSize: "var(--text-micro)", color: "var(--text-secondary)", fontWeight: "var(--weight-medium)" }}>
          Zur Liste
          <ArrowRight style={{ width: 12, height: 12 }} />
        </div>
      </div>

      {/* Steps */}
      <div className="overflow-x-auto" style={{ padding: "0 var(--space-4) var(--space-3)" }}>
        <div className="flex" style={{ gap: 3, minWidth: 600 }}>
          {steps.map((step) => {
            const isEmpty = step.count === 0;
            const isOverdue = step.overdue > 0;
            const color = phaseColors[step.phaseIdx];

            return (
              <button
                key={step.nr}
                title={step.fullLabel}
                aria-label={`Schritt ${step.nr}, ${step.fullLabel}, ${step.count} Klient${step.count !== 1 ? "en" : ""}${isOverdue ? ", überfällig" : ""}`}
                className="flex-1 min-w-0 text-center cursor-pointer transition-colors"
                style={{
                  borderRadius: "var(--radius-card)",
                  padding: "0 var(--space-2) var(--space-3)",
                  background: isOverdue ? "var(--status-danger-bg)" : isEmpty ? "var(--bg-secondary)" : "var(--bg-primary)",
                }}
                onClick={(e) => { e.stopPropagation(); navigate(`/onboarding?schritt=${step.nr}`); }}
                onMouseEnter={e => { if (!isOverdue) e.currentTarget.style.background = "var(--bg-tertiary)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = isOverdue ? "var(--status-danger-bg)" : isEmpty ? "var(--bg-secondary)" : "var(--bg-primary)"; }}
              >
                {/* Phase color bar */}
                <div style={{ height: 3, margin: "0 calc(-1 * var(--space-2))", marginBottom: "var(--space-2)", borderRadius: 0, background: isOverdue ? "var(--status-danger)" : color }} />
                <div style={{ fontSize: 9, color: isOverdue ? "var(--status-danger)" : "var(--text-tertiary)", fontWeight: "var(--weight-medium)" }}>
                  {step.nr}
                </div>
                <div className="truncate" style={{ fontSize: 10, marginTop: 2, color: isOverdue ? "var(--status-danger)" : isEmpty ? "var(--text-tertiary)" : "var(--text-secondary)", fontWeight: "var(--weight-medium)", lineHeight: 1.2 }}>
                  {step.shortLabel}
                </div>
                <div style={{ fontSize: "var(--text-h3)", lineHeight: 1, marginTop: "var(--space-1)", fontWeight: "var(--weight-medium)", color: isOverdue ? "var(--status-danger)" : isEmpty ? "var(--text-tertiary)" : "var(--text-primary)" }} className="tabular-nums">
                  {step.count}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Phase legend */}
      <div className="flex items-center" style={{ padding: "0 var(--space-4) var(--space-3)", gap: "var(--space-4)" }}>
        {phaseLabels.map((label, i) => (
          <div key={label} className="flex items-center" style={{ gap: "var(--space-1)" }}>
            <span style={{ width: 6, height: 6, borderRadius: "var(--radius-pill)", background: phaseColors[i] }} />
            <span style={{ fontSize: 10, color: "var(--text-tertiary)", fontWeight: "var(--weight-medium)" }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
