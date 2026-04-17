import React from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Minus,
  FileText,
  Sparkles,
} from "lucide-react";

type ChipVariant = "success" | "warning" | "error" | "info" | "neutral";

function Chip({
  label,
  variant,
  icon: Icon,
  dot = false,
  size = "md",
}: {
  label: string;
  variant: ChipVariant;
  icon?: React.ElementType;
  dot?: boolean;
  size?: "sm" | "md";
}) {
  const config: Record<ChipVariant, { bg: string; text: string; dotBg: string }> = {
    success: { bg: "bg-success-light", text: "text-success-foreground", dotBg: "bg-success" },
    warning: { bg: "bg-warning-light", text: "text-warning-foreground", dotBg: "bg-warning" },
    error: { bg: "bg-error-light", text: "text-error-foreground", dotBg: "bg-error" },
    info: { bg: "bg-info-light", text: "text-info-foreground", dotBg: "bg-info" },
    neutral: { bg: "bg-neutral-light", text: "text-neutral-foreground", dotBg: "bg-neutral" },
  };
  const c = config[variant];
  const sizes = size === "sm"
    ? "px-2 py-[2px] text-[10.5px] gap-1"
    : "px-2.5 py-[3px] text-[12px] gap-1.5";
  const iconSz = size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5";

  return (
    <span className={`inline-flex items-center rounded-full ${sizes} ${c.bg} ${c.text}`} style={{ fontWeight: 500 }}>
      {dot && <span className={`w-[5px] h-[5px] rounded-full ${c.dotBg}`} />}
      {Icon && <Icon className={iconSz} />}
      {label}
    </span>
  );
}

export function DSStatusChips() {
  return (
    <section>
      <h3 className="mb-1">Statusanzeigen (Chips)</h3>
      <p className="text-muted-foreground text-[13px] mb-6">
        Farbcodierte Kennzeichnungen für Zustände im Spitex-Workflow.
      </p>

      <div className="bg-card rounded-2xl border border-border p-6 space-y-6">
        {/* Dot style */}
        <div>
          <h5 className="mb-3">Punkt-Indikator</h5>
          <div className="flex flex-wrap gap-2">
            <Chip label="Abrechenbar" variant="success" dot />
            <Chip label="In Vorbereitung" variant="warning" dot />
            <Chip label="Nicht abrechenbar" variant="error" dot />
            <Chip label="In Bearbeitung" variant="info" dot />
            <Chip label="Entwurf" variant="neutral" dot />
          </div>
        </div>

        {/* With icons */}
        <div>
          <h5 className="mb-3">Mit Symbolen</h5>
          <div className="flex flex-wrap gap-2">
            <Chip label="Abgeschlossen" variant="success" icon={CheckCircle2} />
            <Chip label="Warnung" variant="warning" icon={AlertTriangle} />
            <Chip label="Gekündigt" variant="error" icon={XCircle} />
            <Chip label="Ausstehend" variant="info" icon={Clock} />
            <Chip label="Inaktiv" variant="neutral" icon={Minus} />
          </div>
        </div>

        {/* Small */}
        <div>
          <h5 className="mb-3">Klein (für Tabellen)</h5>
          <div className="flex flex-wrap gap-2">
            <Chip label="Abrechenbar" variant="success" dot size="sm" />
            <Chip label="In Vorbereitung" variant="warning" dot size="sm" />
            <Chip label="Nicht abrechenbar" variant="error" dot size="sm" />
            <Chip label="Offen" variant="info" dot size="sm" />
            <Chip label="Archiviert" variant="neutral" dot size="sm" />
          </div>
        </div>

        {/* Spitex Context */}
        <div>
          <h5 className="mb-3">Spitex-spezifisch</h5>
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <span className="text-[11px] text-muted-foreground w-28 shrink-0 pt-0.5" style={{ fontWeight: 500 }}>Patienten:</span>
              <Chip label="Aktiv" variant="success" dot />
              <Chip label="Onboarding" variant="warning" dot />
              <Chip label="Gekündigt" variant="error" dot />
              <Chip label="Pausiert" variant="neutral" dot />
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="text-[11px] text-muted-foreground w-28 shrink-0 pt-0.5" style={{ fontWeight: 500 }}>Leistungen:</span>
              <Chip label="Abrechenbar" variant="success" icon={CheckCircle2} />
              <Chip label="In Vorbereitung" variant="warning" icon={Clock} />
              <Chip label="Nicht abrechenbar" variant="error" icon={XCircle} />
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="text-[11px] text-muted-foreground w-28 shrink-0 pt-0.5" style={{ fontWeight: 500 }}>Tickets:</span>
              <Chip label="Offen" variant="info" dot />
              <Chip label="In Bearbeitung" variant="warning" dot />
              <Chip label="Gelöst" variant="success" dot />
              <Chip label="Geschlossen" variant="neutral" dot />
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="text-[11px] text-muted-foreground w-28 shrink-0 pt-0.5" style={{ fontWeight: 500 }}>KI:</span>
              <Chip label="KI-Vorschlag" variant="info" icon={Sparkles} />
              <Chip label="Übernommen" variant="success" icon={CheckCircle2} />
              <Chip label="Abgelehnt" variant="neutral" icon={Minus} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
