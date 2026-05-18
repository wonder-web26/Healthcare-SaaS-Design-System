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
  { label: "SRK noch nicht gemacht", typ: "SRK_ANMELDUNG", status: "amber", context: "+1 diesen Monat", trend: 1 },
  { label: "Re-Assessments fällig", typ: "RE_ASSESSMENT", status: "amber", context: "diesen Monat" },
  { label: "Ausweis B Anmeldungen", typ: "AUSWEIS_B_ANMELDUNG", status: "neutral", context: "beim Migrationsamt offen" },
  { label: "Quellensteuer-Anmeldungen", typ: "QUELLENSTEUER_ANMELDUNG", status: "amber", context: "+2 diesen Monat", trend: 2 },
  { label: "Kinderzulagen-Anträge", typ: "KINDERZULAGEN_ANTRAG", status: "neutral", context: "alle eingereicht" },
  { label: "Lohnanpassungen fällig", typ: "LOHNANPASSUNG_NACH_SRK", status: "amber", context: "nach SRK-Kurs-Abschluss" },
];

const metrics = metricDefs.map((m) => ({
  ...m,
  value: countOpenByWorkflowTyp(m.typ),
  href: `/servicedesk?typ=${m.typ}&status=offen`,
}));

const totalOpen = metrics.reduce((s, m) => s + m.value, 0);
const totalTrend = 3;

const dotColor: Record<Status, string> = {
  amber: "var(--status-warning)",
  neutral: "var(--text-tertiary)",
  critical: "var(--status-danger)",
};

export function ComplianceRisikoSection() {
  const navigate = useNavigate();

  return (
    <div>
      {/* Section header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between" style={{ gap: "var(--space-1)", marginBottom: "var(--space-4)" }}>
        <div>
          <div style={{ fontSize: "var(--text-micro)", color: "var(--text-secondary)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase", fontWeight: "var(--weight-regular)" }}>
            Compliance & Risiko
          </div>
          <div style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", marginTop: "var(--space-1)" }}>
            {totalOpen} offene Punkte · <span style={{ color: "var(--status-warning)", fontWeight: "var(--weight-medium)" }}>↑ {totalTrend}</span> ggü. Vormonat
          </div>
        </div>
      </div>

      {/* Metric cards grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6" style={{ gap: "var(--space-3)" }}>
        {metrics.map((m) => (
          <button
            key={m.label}
            aria-label={`${m.label}: ${m.value}`}
            className="text-left cursor-pointer transition-colors"
            style={{
              background: "var(--bg-elevated)",
              border: "var(--border-thin) solid var(--border-default)",
              borderRadius: "var(--radius-card)",
              padding: "var(--space-4)",
            }}
            onClick={() => navigate(m.href)}
            onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"}
            onMouseLeave={e => e.currentTarget.style.background = "var(--bg-elevated)"}
          >
            {/* Label + dot */}
            <div className="flex items-center" style={{ gap: "var(--space-2)" }}>
              <span className="shrink-0" style={{ width: 6, height: 6, borderRadius: "var(--radius-pill)", background: dotColor[m.status] }} />
              <span className="truncate" style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", fontWeight: "var(--weight-medium)" }}>
                {m.label}
              </span>
            </div>

            {/* Value */}
            <div style={{ fontSize: "var(--text-h1)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", marginTop: "var(--space-2)", lineHeight: 1, letterSpacing: "var(--tracking-tight)" }} className="tabular-nums">
              {m.value}
            </div>

            {/* Context */}
            <div style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", marginTop: "var(--space-2)" }}>
              {m.context}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
