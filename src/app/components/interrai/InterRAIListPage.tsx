import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { Plus, ChevronRight, AlertTriangle, CheckCircle2, Users } from "lucide-react";
import { MOCK_ASSESSMENTS } from "../../../lib/mocks/klinische-artefakte-mock";
import { getArtefaktContainer } from "../../../types/klinische-artefakte";
import { useCurrentRole } from "../../auth";
import { AnnaListenEinordnung, type ListenKontext } from "../../anna/AnnaListenEinordnung";

const CURRENT_PFK = "Sandra Weber";
type ViewKey = "alle" | "in_bearbeitung" | "abgeschlossen" | "re_faellig";

const VIEW_DEFS: { key: ViewKey; label: string }[] = [
  { key: "alle", label: "Alle" },
  { key: "in_bearbeitung", label: "In Bearbeitung" },
  { key: "abgeschlossen", label: "Abgeschlossen" },
  { key: "re_faellig", label: "Re-Assessment fällig" },
];

const STATUS_CFG: Record<string, { label: string; bg: string; color: string }> = {
  "in-bearbeitung": { label: "In Bearbeitung", bg: "var(--status-warning-bg)", color: "var(--status-warning-text)" },
  "abgeschlossen": { label: "Abgeschlossen", bg: "var(--status-success-bg)", color: "var(--status-success-text)" },
};

export function InterRAIListPage() {
  const navigate = useNavigate();
  const role = useCurrentRole();
  const [view, setView] = useState<ViewKey>(role === "diplomiert" ? "in_bearbeitung" : "alle");

  const all = useMemo(() => role === "diplomiert" ? MOCK_ASSESSMENTS.filter(a => a.durchgefuehrtVon === CURRENT_PFK) : MOCK_ASSESSMENTS, [role]);

  const filtered = useMemo(() => {
    switch (view) {
      case "in_bearbeitung": return all.filter(a => a.status === "in-bearbeitung");
      case "abgeschlossen": return all.filter(a => a.status === "abgeschlossen");
      case "re_faellig": return all.filter(a => a.status === "abgeschlossen");
      default: return all;
    }
  }, [view, all]);

  const counts = useMemo(() => ({
    alle: all.length,
    in_bearbeitung: all.filter(a => a.status === "in-bearbeitung").length,
    abgeschlossen: all.filter(a => a.status === "abgeschlossen").length,
    re_faellig: 1,
  }), [all]);

  const annaCtx = useMemo<ListenKontext>(() => ({
    seite: `interrai_${role}`,
    totalCount: all.length,
    byStatus: { "in-bearbeitung": counts.in_bearbeitung },
    highlights: [
      counts.in_bearbeitung > 0 ? `${counts.in_bearbeitung} Assessments in Bearbeitung` : "",
      "Bei Anna Müller ist das Re-Assessment seit 7 Monaten überfällig",
    ].filter(Boolean),
  }), [role, all, counts]);

  return (
    <div className="h-full overflow-y-auto">
      <style>{`.ba-pad { padding-left: var(--mobile-page-padding); padding-right: var(--mobile-page-padding); } @media (min-width: 640px) { .ba-pad { padding-left: var(--space-6); padding-right: var(--space-6); } }`}</style>
      <div className="ba-pad" style={{ paddingTop: "var(--space-4)", paddingBottom: "var(--space-8)" }}>
        <div className="flex items-center justify-between" style={{ marginBottom: "var(--space-3)" }}>
          <h1 style={{ fontSize: "var(--text-h1)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", letterSpacing: "var(--tracking-tight)" }}>InterRAI</h1>
          <button onClick={() => alert("Neues InterRAI – Flow folgt")} className="inline-flex items-center cursor-pointer transition-colors"
            style={{ gap: "var(--space-2)", padding: "10px 16px", borderRadius: "var(--radius-pill)", background: "var(--brand-primary)", color: "var(--text-on-dark)", fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", border: "none" }}>
            <Plus style={{ width: 16, height: 16 }} /> <span className="hidden sm:inline">Neues InterRAI</span>
          </button>
        </div>

        <div style={{ marginBottom: "var(--space-4)" }}><AnnaListenEinordnung context={annaCtx} /></div>

        {/* Filter pills */}
        <div className="flex items-center overflow-x-auto" style={{ gap: 8, marginBottom: "var(--space-4)", paddingBottom: 2 }}>
          {VIEW_DEFS.map(def => {
            const isActive = view === def.key;
            return (
              <button key={def.key} onClick={() => setView(def.key)} className="inline-flex items-center shrink-0 cursor-pointer transition-colors"
                style={{ gap: 8, padding: "8px 14px", borderRadius: "var(--radius-pill)", whiteSpace: "nowrap", fontSize: 13, fontWeight: isActive ? "var(--weight-medium)" : "var(--weight-regular)", background: isActive ? "var(--brand-primary-light)" : "transparent", border: isActive ? "var(--border-thin) solid transparent" : "var(--border-thin) solid var(--border-default)", color: isActive ? "var(--brand-primary)" : "var(--text-primary)" }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "var(--bg-secondary)"; }} onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}>
                {def.label}
                <span className="inline-flex items-center justify-center" style={{ minWidth: 18, padding: "1px 8px", borderRadius: "var(--radius-pill)", fontSize: 11, fontWeight: "var(--weight-medium)", background: isActive ? "var(--brand-primary)" : "var(--bg-secondary)", color: isActive ? "var(--text-on-dark)" : "var(--text-secondary)" }}>{counts[def.key]}</span>
              </button>
            );
          })}
        </div>

        {/* List */}
        <div className="flex flex-col" style={{ gap: 6 }}>
          {filtered.length === 0 && <div style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--text-tertiary)" }}>Keine Assessments</div>}
          {filtered.map(a => {
            const st = STATUS_CFG[a.status];
            const container = getArtefaktContainer(a);
            const isOnboarding = container === "onboarding";
            return (
              <button key={a.id} onClick={() => navigate(`/interrai/${a.id}`)}
                className="w-full flex items-center text-left cursor-pointer transition-colors"
                style={{ padding: "12px 16px", borderRadius: "var(--radius-card)", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"} onMouseLeave={e => e.currentTarget.style.background = "var(--bg-elevated)"}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-wrap" style={{ gap: "var(--space-2)", marginBottom: 4 }}>
                    <span style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>{a.patientName}</span>
                    <span style={{ padding: "2px 10px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", background: st.bg, color: st.color }}>{st.label}</span>
                    <span style={{ padding: "2px 8px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-meta)", background: "var(--bg-secondary)", color: "var(--text-secondary)" }}>
                      {a.typ === "erstassessment" ? "Erst" : a.typ === "re-assessment" ? "Re" : "Ad-hoc"}
                    </span>
                    {isOnboarding && (
                      <span className="inline-flex items-center" style={{ gap: 3, padding: "2px 8px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", background: "var(--status-info-bg)", color: "var(--status-info)" }}>
                        <Users style={{ width: 10, height: 10 }} /> Im Onboarding
                      </span>
                    )}
                    {a.status === "in-bearbeitung" && <span style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>{a.erfassungsgrad}%</span>}
                    {a.getriggerteCaps.length > 0 && (
                      <span style={{ padding: "2px 8px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", background: "var(--status-danger-bg)", color: "var(--status-danger)" }}>{a.getriggerteCaps.length} CAPs</span>
                    )}
                  </div>
                  <div style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>{a.durchgefuehrtVon} · {a.startDatum}</div>
                </div>
                {a.status === "in-bearbeitung" && (
                  <div className="shrink-0 hidden sm:block" style={{ width: 48, marginLeft: 12 }}>
                    <div style={{ height: 4, background: "var(--bg-secondary)", borderRadius: "var(--radius-pill)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${a.erfassungsgrad}%`, background: "var(--brand-primary)", borderRadius: "var(--radius-pill)" }} />
                    </div>
                  </div>
                )}
                <ChevronRight style={{ width: 16, height: 16, color: "var(--text-tertiary)", flexShrink: 0, marginLeft: 8 }} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
