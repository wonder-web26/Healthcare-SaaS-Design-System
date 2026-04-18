import { useNavigate } from "react-router";
import { countOpenByWorkflowTyp, type WorkflowTyp } from "../../lib/mocks/service-desk-unified";

type Status = "amber" | "neutral" | "critical";

interface Metric {
  label: string;
  typ: WorkflowTyp;
  status: Status;
  context: string;
  trend?: number;
}

const metricDefs: Metric[] = [
  { label: "SRK offen", typ: "SRK_ANMELDUNG", status: "amber", context: "nicht angemeldet", trend: 1 },
  { label: "Re-Assessments", typ: "RE_ASSESSMENT", status: "amber", context: "diesen Monat fällig" },
  { label: "Ausweis B", typ: "AUSWEIS_B_ANMELDUNG", status: "neutral", context: "offene Anmeldungen" },
  { label: "Quellensteuer", typ: "QUELLENSTEUER_ANMELDUNG", status: "amber", context: "Steueramt", trend: 2 },
  { label: "Kinderzulagen", typ: "KINDERZULAGEN_ANTRAG", status: "neutral", context: "offener Antrag" },
  { label: "Lohnanpassung offen", typ: "LOHNANPASSUNG_NACH_SRK", status: "amber", context: "nach SRK-Kurs" },
];

const metrics = metricDefs.map((m) => ({
  ...m,
  value: countOpenByWorkflowTyp(m.typ),
  href: `/servicedesk?typ=${m.typ}&status=offen`,
}));

const totalOpen = metrics.reduce((s, m) => s + m.value, 0);
const totalTrend = 3;

const dotColor: Record<Status, string> = {
  amber: "bg-warning",
  neutral: "bg-neutral",
  critical: "bg-error",
};

export function ComplianceRisikoSection() {
  const navigate = useNavigate();

  return (
    <div>
      {/* Section header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 mb-3">
        <div>
          <h4 className="text-foreground">Compliance & Risiko</h4>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            HR-Status, Versicherung, Aufsicht
          </p>
        </div>
        <div className="flex items-baseline gap-1.5 text-[12px]">
          <span className="text-primary tabular-nums" style={{ fontWeight: 600 }}>{totalOpen} offene Punkte</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-warning tabular-nums" style={{ fontWeight: 600 }}>
            ↑ {totalTrend}
          </span>
          <span className="text-muted-foreground">ggü. Vormonat</span>
        </div>
      </div>

      {/* Metric cards grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {metrics.map((m) => (
          <button
            key={m.label}
            aria-label={`${m.label}: ${m.value}${m.context ? `, ${m.context}` : ""}${m.trend ? `, +${m.trend} gegenüber Vormonat` : ""}`}
            className="bg-card rounded-xl border border-border px-4 py-3.5 text-left transition-colors hover:bg-secondary/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring cursor-pointer"
            onClick={() => navigate(m.href)}
          >
            <div className="flex items-center gap-1.5">
              <span className={`w-[6px] h-[6px] rounded-full shrink-0 ${dotColor[m.status]}`} />
              <span className="text-[11px] text-muted-foreground truncate" style={{ fontWeight: 500 }}>
                {m.label}
              </span>
            </div>

            <div className="text-[28px] text-foreground tracking-tight leading-none mt-2 tabular-nums" style={{ fontWeight: 700 }}>
              {m.value}
            </div>

            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-[11px] text-muted-foreground">
                {m.context}
              </span>
              {m.trend != null && m.trend !== 0 && (
                <span className="text-[10px] text-warning tabular-nums" style={{ fontWeight: 600 }}>
                  ↑ {m.trend}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
