import { useNavigate } from "react-router";
import { useCurrentRole } from "../auth";
import { patients } from "./patientData";
import type { Schweregrad } from "./patientData";
import {
  Sparkles,
  AlertTriangle,
  Users,
  UserPlus,
  Shield,
  TrendingUp,
  Clock,
  Check,
  ChevronRight,
  DollarSign,
  Briefcase,
} from "lucide-react";
import {
  MOCK_ASSESSMENTS,
  MOCK_KLV_VERORDNUNGEN,
} from "../../lib/mocks/klinische-artefakte-mock";
import { ComplianceRisikoSection } from "./ComplianceRisikoSection";

/* ── Derived data ────────────────────────── */

const activePatients = patients.filter((p) => p.status === "aktiv");
const activeCount = activePatients.length;

const schweregradCounts: Record<Schweregrad, number> = {
  leicht: 0,
  mittel: 0,
  schwer: 0,
  kritisch: 0,
};
for (const p of activePatients) {
  schweregradCounts[p.schweregrad]++;
}

const schweregradLabels: Record<Schweregrad, string> = {
  leicht: "Leicht",
  mittel: "Mittel",
  schwer: "Schwer",
  kritisch: "Kritisch",
};

const schweregradColors: Record<Schweregrad, string> = {
  leicht: "var(--status-success)",
  mittel: "var(--status-warning)",
  schwer: "var(--status-danger)",
  kritisch: "var(--status-danger)",
};

/* ── Pipeline stages (mock) ──────────────── */

const pipelineStages = [
  { label: "Erstassessment", count: 2 },
  { label: "KLV-Erstellung", count: 1 },
  { label: "Bei Arzt", count: 1 },
  { label: "Bei KK", count: 1 },
  { label: "Bereit", count: 1 },
];

const pipelineTotal = pipelineStages.reduce((s, st) => s + st.count, 0);

/* ── Briefing texts per role ─────────────── */

const annaBriefing: Record<string, string> = {
  diplomiert:
    "Du hast heute 3 Klienten mit überfälligen Re-Assessments. Bei Anna Müller läuft die KLV in 12 Tagen aus — Verlängerung einleiten.",
  backoffice:
    "6 Onboardings in der Pipeline, davon 1 blockiert (Spezialbewilligung B). 3 KLV-Verlängerungen stehen diese Woche an.",
  management:
    `${activeCount} aktive Klienten (+6 ggü. Vormonat). Compliance-Quote bei 82%. 2 SRK-Fristen laufen in den nächsten 30 Tagen ab.`,
};

/* ── Shared card style ───────────────────── */

const cardStyle: React.CSSProperties = {
  background: "var(--bg-elevated)",
  border: "0.5px solid var(--border-default)",
  borderRadius: 12,
  padding: 20,
};

const cardStyleCompact: React.CSSProperties = {
  ...cardStyle,
  padding: 16,
};

/* ── Component ───────────────────────────── */

export function StrategicDashboard() {
  const role = useCurrentRole();
  const navigate = useNavigate();

  return (
    <div
      style={{
        padding: "var(--space-4) var(--space-6) var(--space-8)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-6)",
      }}
    >
      {/* ═══ Row 1 — Anna Tagesbriefing ═══ */}
      <div style={cardStyle}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
            marginBottom: "var(--space-3)",
          }}
        >
          <Sparkles
            size={18}
            style={{ color: "var(--brand-primary)", flexShrink: 0 }}
            aria-hidden="true"
          />
          <span
            style={{
              fontSize: "var(--text-small)",
              fontWeight: 600,
              color: "var(--brand-primary)",
            }}
          >
            Anna
          </span>
          <span
            style={{
              fontSize: "var(--text-meta)",
              color: "var(--text-tertiary)",
              marginLeft: "var(--space-1)",
            }}
          >
            Tagesbriefing
          </span>
        </div>
        <p
          style={{
            fontSize: "var(--text-body)",
            fontWeight: 400,
            color: "var(--text-primary)",
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          {annaBriefing[role]}
        </p>
      </div>

      {/* ═══ Row 2 — KPI Cards ═══ */}
      <div
        className="grid grid-cols-1 lg:grid-cols-3"
        style={{ gap: "var(--space-4)" }}
      >
        {/* ── 2a: Aktive Klienten ── */}
        <button
          onClick={() => navigate("/patienten")}
          className="text-left cursor-pointer transition-colors"
          style={cardStyle}
          aria-label={`Aktive Klienten: ${activeCount}`}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "var(--bg-secondary)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "var(--bg-elevated)")
          }
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-2)",
              }}
            >
              <Users
                size={16}
                style={{ color: "var(--text-tertiary)" }}
                aria-hidden="true"
              />
              <span
                style={{
                  fontSize: "var(--text-meta)",
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Aktive Klienten
              </span>
            </div>
            <ChevronRight
              size={14}
              style={{ color: "var(--text-tertiary)" }}
              aria-hidden="true"
            />
          </div>

          <div
            className="tabular-nums"
            style={{
              fontSize: "var(--text-h1)",
              fontWeight: 600,
              color: "var(--text-primary)",
              marginTop: "var(--space-3)",
              lineHeight: 1,
            }}
          >
            {activeCount}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-1)",
              marginTop: "var(--space-2)",
            }}
          >
            <TrendingUp
              size={12}
              style={{ color: "var(--status-success)" }}
              aria-hidden="true"
            />
            <span
              style={{
                fontSize: "var(--text-small)",
                fontWeight: 500,
                color: "var(--status-success)",
              }}
            >
              +6 ggü. Vormonat
            </span>
          </div>

          {/* Schweregrad breakdown */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "var(--space-2)",
              marginTop: "var(--space-4)",
            }}
          >
            {(
              Object.entries(schweregradCounts) as [Schweregrad, number][]
            ).map(([grad, count]) =>
              count > 0 ? (
                <span
                  key={grad}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "var(--space-1)",
                    fontSize: "var(--text-micro)",
                    fontWeight: 500,
                    color: "var(--text-secondary)",
                    background: "var(--bg-secondary)",
                    borderRadius: 999,
                    padding: "2px 10px",
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: schweregradColors[grad],
                      flexShrink: 0,
                    }}
                  />
                  {schweregradLabels[grad]} {count}
                </span>
              ) : null,
            )}
          </div>
        </button>

        {/* ── 2b: Onboarding Pipeline ── */}
        <button
          onClick={() => navigate("/onboarding")}
          className="text-left cursor-pointer transition-colors"
          style={cardStyle}
          aria-label={`Onboarding Pipeline: ${pipelineTotal} im Onboarding`}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "var(--bg-secondary)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "var(--bg-elevated)")
          }
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-2)",
              }}
            >
              <UserPlus
                size={16}
                style={{ color: "var(--text-tertiary)" }}
                aria-hidden="true"
              />
              <span
                style={{
                  fontSize: "var(--text-meta)",
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Onboarding Pipeline
              </span>
            </div>
            <ChevronRight
              size={14}
              style={{ color: "var(--text-tertiary)" }}
              aria-hidden="true"
            />
          </div>

          <div
            className="tabular-nums"
            style={{
              fontSize: "var(--text-h1)",
              fontWeight: 600,
              color: "var(--text-primary)",
              marginTop: "var(--space-3)",
              lineHeight: 1,
            }}
          >
            {pipelineTotal}
          </div>

          <span
            style={{
              fontSize: "var(--text-small)",
              fontWeight: 400,
              color: "var(--text-secondary)",
              marginTop: "var(--space-1)",
              display: "block",
            }}
          >
            im Onboarding
          </span>

          {/* Stage breakdown */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-2)",
              marginTop: "var(--space-3)",
            }}
          >
            {pipelineStages.map((stage) => (
              <div
                key={stage.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{
                    fontSize: "var(--text-micro)",
                    color: "var(--text-secondary)",
                    fontWeight: 400,
                  }}
                >
                  {stage.label}
                </span>
                <span
                  className="tabular-nums"
                  style={{
                    fontSize: "var(--text-micro)",
                    fontWeight: 500,
                    color: "var(--text-primary)",
                  }}
                >
                  {stage.count}
                </span>
              </div>
            ))}
          </div>

          {/* Blockiert pill */}
          <div style={{ marginTop: "var(--space-3)" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "var(--space-1)",
                fontSize: "var(--text-micro)",
                fontWeight: 500,
                color: "var(--status-warning)",
                background: "color-mix(in srgb, var(--status-warning) 12%, transparent)",
                borderRadius: 999,
                padding: "2px 10px",
              }}
            >
              <AlertTriangle size={10} aria-hidden="true" />
              1 blockiert
            </span>
          </div>
        </button>

        {/* ── 2c: Personal ── */}
        <button
          onClick={() => navigate("/angehoerige")}
          className="text-left cursor-pointer transition-colors"
          style={cardStyle}
          aria-label="Personal: 42 aktive Angehörige"
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "var(--bg-secondary)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "var(--bg-elevated)")
          }
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-2)",
              }}
            >
              <Briefcase
                size={16}
                style={{ color: "var(--text-tertiary)" }}
                aria-hidden="true"
              />
              <span
                style={{
                  fontSize: "var(--text-meta)",
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Personal
              </span>
            </div>
            <ChevronRight
              size={14}
              style={{ color: "var(--text-tertiary)" }}
              aria-hidden="true"
            />
          </div>

          <div
            className="tabular-nums"
            style={{
              fontSize: "var(--text-h1)",
              fontWeight: 600,
              color: "var(--text-primary)",
              marginTop: "var(--space-3)",
              lineHeight: 1,
            }}
          >
            42
          </div>

          <span
            style={{
              fontSize: "var(--text-small)",
              fontWeight: 400,
              color: "var(--text-secondary)",
              marginTop: "var(--space-1)",
              display: "block",
            }}
          >
            Aktive Angehörige
          </span>

          {/* Metrics */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-3)",
              marginTop: "var(--space-4)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-1)",
                }}
              >
                <Shield
                  size={12}
                  style={{ color: "var(--text-tertiary)" }}
                  aria-hidden="true"
                />
                <span
                  style={{
                    fontSize: "var(--text-micro)",
                    color: "var(--text-secondary)",
                    fontWeight: 400,
                  }}
                >
                  SRK abgeschlossen
                </span>
              </div>
              <span
                className="tabular-nums"
                style={{
                  fontSize: "var(--text-small)",
                  fontWeight: 500,
                  color: "var(--text-primary)",
                }}
              >
                85%
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-1)",
                }}
              >
                <Clock
                  size={12}
                  style={{ color: "var(--text-tertiary)" }}
                  aria-hidden="true"
                />
                <span
                  style={{
                    fontSize: "var(--text-micro)",
                    color: "var(--text-secondary)",
                    fontWeight: 400,
                  }}
                >
                  Stempel-Compliance
                </span>
              </div>
              <span
                className="tabular-nums"
                style={{
                  fontSize: "var(--text-small)",
                  fontWeight: 500,
                  color: "var(--text-primary)",
                }}
              >
                92%
              </span>
            </div>

            <span
              style={{
                fontSize: "var(--text-micro)",
                color: "var(--text-tertiary)",
                fontWeight: 400,
              }}
            >
              letzte Woche
            </span>
          </div>
        </button>
      </div>

      {/* ═══ Row 3 — Compliance & Risiko ═══ */}
      <ComplianceRisikoSection />

      {/* ═══ Row 4 — Finanzen (backoffice / management only) ═══ */}
      {role !== "diplomiert" && (
        <div style={cardStyle}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-2)",
              marginBottom: "var(--space-4)",
            }}
          >
            <DollarSign
              size={16}
              style={{ color: "var(--text-tertiary)" }}
              aria-hidden="true"
            />
            <span
              style={{
                fontSize: "var(--text-meta)",
                fontWeight: 500,
                color: "var(--text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Finanzieller Schnellüberblick
            </span>
          </div>

          <div
            className="grid grid-cols-1 sm:grid-cols-3"
            style={{ gap: "var(--space-4)" }}
          >
            {/* Lohnlauf */}
            <div
              style={{
                ...cardStyleCompact,
                background: "var(--bg-secondary)",
              }}
            >
              <div
                style={{
                  fontSize: "var(--text-micro)",
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                  marginBottom: "var(--space-2)",
                }}
              >
                Lohnlauf aktuell
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-2)",
                }}
              >
                <Check
                  size={14}
                  style={{ color: "var(--status-success)" }}
                  aria-hidden="true"
                />
                <span
                  style={{
                    fontSize: "var(--text-body)",
                    fontWeight: 500,
                    color: "var(--text-primary)",
                  }}
                >
                  Februar abgeschlossen
                </span>
              </div>
              <span
                style={{
                  fontSize: "var(--text-micro)",
                  color: "var(--text-tertiary)",
                  marginTop: "var(--space-1)",
                  display: "block",
                }}
              >
                (Mock)
              </span>
            </div>

            {/* Ausstehende Abrechnungen */}
            <div
              style={{
                ...cardStyleCompact,
                background: "var(--bg-secondary)",
              }}
            >
              <div
                style={{
                  fontSize: "var(--text-micro)",
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                  marginBottom: "var(--space-2)",
                }}
              >
                Ausstehende Abrechnungen
              </div>
              <div
                className="tabular-nums"
                style={{
                  fontSize: "var(--text-h2)",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  lineHeight: 1,
                }}
              >
                12
              </div>
              <span
                style={{
                  fontSize: "var(--text-micro)",
                  color: "var(--text-tertiary)",
                  marginTop: "var(--space-1)",
                  display: "block",
                }}
              >
                (Mock)
              </span>
            </div>

            {/* KK-Rückforderungs-Risiko */}
            <div
              style={{
                ...cardStyleCompact,
                background: "var(--bg-secondary)",
              }}
            >
              <div
                style={{
                  fontSize: "var(--text-micro)",
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                  marginBottom: "var(--space-2)",
                }}
              >
                KK-Rückforderungs-Risiko
              </div>
              <div
                style={{
                  fontSize: "var(--text-body)",
                  fontWeight: 500,
                  color: "var(--text-primary)",
                }}
              >
                CHF 4'200
              </div>
              <span
                style={{
                  fontSize: "var(--text-micro)",
                  color: "var(--text-tertiary)",
                  marginTop: "var(--space-1)",
                  display: "block",
                }}
              >
                (geschätzt)
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
