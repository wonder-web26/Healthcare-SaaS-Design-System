import { useNavigate } from "react-router";
import { ClipboardList, ArrowRight } from "lucide-react";

interface Step {
  nr: number;
  shortLabel: string;
  fullLabel: string;
  count: number;
  overdue: number;
  phaseColor: string;
  phaseOverdueColor: string;
}

interface Phase {
  label: string;
  color: string;
  overdueColor: string;
  dotClass: string;
}

const phasesMeta: Phase[] = [
  { label: "Vorbereitung", color: "bg-primary/60", overdueColor: "bg-error", dotClass: "bg-primary/60" },
  { label: "KLV-Prozess", color: "bg-info/60", overdueColor: "bg-error", dotClass: "bg-info/60" },
  { label: "Aktivierung", color: "bg-success/60", overdueColor: "bg-error", dotClass: "bg-success/60" },
];

const steps: Step[] = [
  { nr: 1, shortLabel: "Assessment", fullLabel: "Erstassessment", count: 1, overdue: 0, phaseColor: phasesMeta[0].color, phaseOverdueColor: phasesMeta[0].overdueColor },
  { nr: 2, shortLabel: "Diagnose", fullLabel: "Diagnose und Medikamentenliste", count: 0, overdue: 0, phaseColor: phasesMeta[0].color, phaseOverdueColor: phasesMeta[0].overdueColor },
  { nr: 3, shortLabel: "KLV erstellen", fullLabel: "KLV erstellen", count: 0, overdue: 0, phaseColor: phasesMeta[1].color, phaseOverdueColor: phasesMeta[1].overdueColor },
  { nr: 4, shortLabel: "Kontrolle", fullLabel: "KLV kontrollieren", count: 1, overdue: 1, phaseColor: phasesMeta[1].color, phaseOverdueColor: phasesMeta[1].overdueColor },
  { nr: 5, shortLabel: "An Arzt senden", fullLabel: "KLV an Arzt zur Unterschrift senden", count: 1, overdue: 0, phaseColor: phasesMeta[1].color, phaseOverdueColor: phasesMeta[1].overdueColor },
  { nr: 6, shortLabel: "Von Arzt erhalten", fullLabel: "KLV von Arzt erhalten", count: 0, overdue: 0, phaseColor: phasesMeta[1].color, phaseOverdueColor: phasesMeta[1].overdueColor },
  { nr: 7, shortLabel: "An KK senden", fullLabel: "KLV an Krankenkasse übermitteln", count: 1, overdue: 0, phaseColor: phasesMeta[1].color, phaseOverdueColor: phasesMeta[1].overdueColor },
  { nr: 8, shortLabel: "Vertrag signieren", fullLabel: "Vertrag unterzeichnen", count: 1, overdue: 0, phaseColor: phasesMeta[2].color, phaseOverdueColor: phasesMeta[2].overdueColor },
  { nr: 9, shortLabel: "MedLink Schulung", fullLabel: "MedLink-Schulung durchführen", count: 1, overdue: 0, phaseColor: phasesMeta[2].color, phaseOverdueColor: phasesMeta[2].overdueColor },
];

const total = steps.reduce((s, st) => s + st.count, 0);
const totalOverdue = steps.reduce((s, st) => s + st.overdue, 0);

export function OnboardingPipelineTile() {
  const navigate = useNavigate();

  return (
    <div className="bg-card rounded-2xl border border-border">
      {/* Header */}
      <div
        role="link"
        tabIndex={0}
        aria-label={`Onboarding-Pipeline: ${total} Klienten${totalOverdue > 0 ? `, davon ${totalOverdue} überfällig` : ""}`}
        className="flex items-center justify-between px-4 pt-4 pb-3 cursor-pointer rounded-t-2xl transition-colors hover:bg-secondary/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        onClick={() => navigate("/onboarding")}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            navigate("/onboarding");
          }
        }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-info-light flex items-center justify-center shrink-0">
            <ClipboardList className="w-4 h-4 text-info" />
          </div>
          <span className="text-[14px] text-foreground" style={{ fontWeight: 600 }}>
            Onboarding-Pipeline
          </span>
          <span className="text-[12px] text-muted-foreground">
            {total} Klienten
          </span>
          {totalOverdue > 0 && (
            <>
              <span className="text-[12px] text-muted-foreground">·</span>
              <button
                aria-label={`${totalOverdue} überfällige Klienten anzeigen`}
                className="text-[12px] text-error rounded-md px-1.5 py-0.5 -my-0.5 transition-colors hover:bg-error-light focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring cursor-pointer"
                style={{ fontWeight: 600 }}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/onboarding?status=ueberfaellig");
                }}
                onKeyDown={(e) => e.stopPropagation()}
              >
                {totalOverdue} überfällig
              </button>
            </>
          )}
        </div>
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground shrink-0" style={{ fontWeight: 500 }}>
          Zur Liste
          <ArrowRight className="w-3 h-3" />
        </div>
      </div>

      {/* Steps grid — horizontally scrollable on small screens */}
      <div className="px-4 pb-3 overflow-x-auto">
        <div className="flex gap-[3px]" style={{ minWidth: 600 }}>
          {steps.map((step) => {
            const isEmpty = step.count === 0;
            const isOverdue = step.overdue > 0;

            return (
              <button
                key={step.nr}
                title={step.fullLabel}
                aria-label={`Schritt ${step.nr}, ${step.fullLabel}, ${step.count} Klient${step.count !== 1 ? "en" : ""}${isOverdue ? ", überfällig" : ""}`}
                className={`flex-1 min-w-0 rounded-lg pt-0 pb-2.5 px-1.5 text-center transition-colors cursor-pointer overflow-hidden
                  focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring
                  ${isOverdue
                    ? "bg-error-light hover:bg-error-medium"
                    : isEmpty
                      ? "bg-muted/30 hover:bg-muted/60"
                      : "bg-secondary/40 hover:bg-secondary/70"
                  }`}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/onboarding?schritt=${step.nr}`);
                }}
              >
                {/* Phase color top bar */}
                <div className={`h-[3px] -mx-1.5 mb-2 ${isOverdue ? step.phaseOverdueColor : step.phaseColor}`} />
                <div className={`text-[9px] tabular-nums ${isOverdue ? "text-error" : "text-muted-foreground/50"}`} style={{ fontWeight: 500 }}>
                  {step.nr}
                </div>
                <div className={`text-[10px] mt-0.5 truncate leading-tight ${isOverdue ? "text-error-foreground" : isEmpty ? "text-muted-foreground/40" : "text-muted-foreground"}`} style={{ fontWeight: 500 }}>
                  {step.shortLabel}
                </div>
                <div
                  className={`text-[20px] tracking-tight leading-none mt-1 tabular-nums
                    ${isOverdue
                      ? "text-error"
                      : isEmpty
                        ? "text-muted-foreground/20"
                        : "text-foreground"
                    }`}
                  style={{ fontWeight: 700 }}
                >
                  {step.count}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Phase legend */}
      <div className="px-4 pb-3 flex items-center gap-4">
        {phasesMeta.map((p) => (
          <div key={p.label} className="flex items-center gap-1.5">
            <span className={`w-[6px] h-[6px] rounded-full ${p.dotClass}`} />
            <span className="text-[10px] text-muted-foreground" style={{ fontWeight: 500 }}>{p.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
