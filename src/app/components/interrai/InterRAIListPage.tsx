import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { ChevronRight } from "lucide-react";
import { getAllAssessments, getPerson, getOpenFieldCount, getActiveFieldCount, getAnlassLabel, getStatusLabel, formatDateTime, type PersonZustand } from "../../../lib/interrai/store";

type ViewKey = "alle" | "in_bearbeitung" | "abgeschlossen";
type PersonFilter = "alle" | "mandat" | "patient";

const VIEW_DEFS: { key: ViewKey; label: string }[] = [
  { key: "alle", label: "Alle" },
  { key: "in_bearbeitung", label: "In Bearbeitung" },
  { key: "abgeschlossen", label: "Abgeschlossen" },
];

const PERSON_FILTERS: { key: PersonFilter; label: string }[] = [
  { key: "alle", label: "Alle Personen" },
  { key: "mandat", label: "Onboarding" },
  { key: "patient", label: "Patienten" },
];

const ZUSTAND_PILL: Record<PersonZustand, { label: string; bg: string; color: string }> = {
  mandat: { label: "Mandat", bg: "var(--status-warning-bg, #fef7e0)", color: "var(--status-warning-text, #9a6700)" },
  patient: { label: "Patient", bg: "var(--status-success-bg, #e6f4ea)", color: "var(--status-success-text, #1a7f37)" },
};

export function InterRAIListPage() {
  const navigate = useNavigate();
  const [view, setView] = useState<ViewKey>("alle");
  const [personFilter, setPersonFilter] = useState<PersonFilter>("alle");

  // Enrich assessments with person data
  const enriched = useMemo(() => {
    return getAllAssessments().map((a) => {
      const person = getPerson(a.personId);
      const openFields = getOpenFieldCount(a);
      const activeFields = getActiveFieldCount(a);
      return { ...a, person, openFields, activeFields, filledFields: activeFields - openFields };
    });
  }, []);

  // Filter by status
  const byStatus = useMemo(() => {
    switch (view) {
      case "in_bearbeitung": return enriched.filter((a) => a.status === "in_bearbeitung");
      case "abgeschlossen": return enriched.filter((a) => a.status === "abgeschlossen");
      default: return enriched;
    }
  }, [view, enriched]);

  // Filter by person state
  const filtered = useMemo(() => {
    if (personFilter === "alle") return byStatus;
    return byStatus.filter((a) => a.person?.zustand === personFilter);
  }, [personFilter, byStatus]);

  const counts = useMemo(() => ({
    alle: enriched.length,
    in_bearbeitung: enriched.filter((a) => a.status === "in_bearbeitung").length,
    abgeschlossen: enriched.filter((a) => a.status === "abgeschlossen").length,
  }), [enriched]);


  return (
    <div className="h-full overflow-y-auto">
      <style>{`.ba-pad { padding-left: var(--mobile-page-padding); padding-right: var(--mobile-page-padding); } @media (min-width: 640px) { .ba-pad { padding-left: var(--space-6); padding-right: var(--space-6); } }`}</style>
      <div className="ba-pad" style={{ paddingTop: "var(--space-4)", paddingBottom: "var(--space-8)" }}>
        <div className="flex items-center justify-between" style={{ marginBottom: "var(--space-4)" }}>
          <h1 style={{ fontSize: "var(--text-h1)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", letterSpacing: "var(--tracking-tight)" }}>InterRAI</h1>
        </div>

        {/* Status filter pills */}
        <div className="flex items-center overflow-x-auto" style={{ gap: 8, marginBottom: 8, paddingBottom: 2 }}>
          {VIEW_DEFS.map((def) => {
            const isActive = view === def.key;
            return (
              <button key={def.key} onClick={() => setView(def.key)} className="inline-flex items-center shrink-0 cursor-pointer transition-colors"
                style={{ gap: 8, padding: "8px 14px", borderRadius: "var(--radius-pill)", whiteSpace: "nowrap", fontSize: 13, fontWeight: isActive ? "var(--weight-medium)" : "var(--weight-regular)", background: isActive ? "var(--brand-primary-light)" : "transparent", border: isActive ? "var(--border-thin) solid transparent" : "var(--border-thin) solid var(--border-default)", color: isActive ? "var(--brand-primary)" : "var(--text-primary)", fontFamily: "inherit" }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "var(--bg-secondary)"; }} onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}>
                {def.label}
                <span className="inline-flex items-center justify-center" style={{ minWidth: 18, padding: "1px 8px", borderRadius: "var(--radius-pill)", fontSize: 11, fontWeight: "var(--weight-medium)", background: isActive ? "var(--brand-primary)" : "var(--bg-secondary)", color: isActive ? "var(--text-on-dark)" : "var(--text-secondary)" }}>{counts[def.key]}</span>
              </button>
            );
          })}
        </div>

        {/* Person state filter */}
        <div className="flex items-center" style={{ gap: 6, marginBottom: "var(--space-4)" }}>
          {PERSON_FILTERS.map((f) => {
            const isActive = personFilter === f.key;
            return (
              <button key={f.key} onClick={() => setPersonFilter(f.key)}
                style={{ padding: "4px 10px", borderRadius: 6, fontSize: 12, fontFamily: "inherit", cursor: "pointer", border: "0.5px solid var(--border-default)", background: isActive ? "var(--bg-secondary)" : "transparent", fontWeight: isActive ? 500 : 400, color: isActive ? "var(--text-primary)" : "var(--text-secondary)" }}>
                {f.label}
              </button>
            );
          })}
        </div>

        {/* List */}
        <div className="flex flex-col" style={{ gap: 6 }}>
          {filtered.length === 0 && <div style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--text-tertiary)" }}>Keine Assessments</div>}
          {filtered.map((a) => {
            const zustand = a.person ? ZUSTAND_PILL[a.person.zustand] : null;
            const isComplete = a.status === "abgeschlossen";
            const personName = a.person ? `${a.person.vorname} ${a.person.nachname}` : "(unbekannt)";

            return (
              <button key={a.id}
                onClick={() => navigate(`/interrai-neu/${a.id}?returnTo=${encodeURIComponent("/interrai")}`)}
                className="w-full flex items-center text-left cursor-pointer transition-colors"
                style={{ padding: "12px 16px", borderRadius: "var(--radius-card)", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", fontFamily: "inherit" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-secondary)")} onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-elevated)")}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-wrap" style={{ gap: "var(--space-2)", marginBottom: 4 }}>
                    {/* Person name */}
                    <span style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>
                      {personName}
                    </span>
                    {/* Person state pill */}
                    {zustand && (
                      <span style={{
                        padding: "1px 8px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-meta)",
                        fontWeight: "var(--weight-medium)", background: zustand.bg, color: zustand.color,
                      }}>
                        {zustand.label}
                      </span>
                    )}
                    {/* Status pill */}
                    <span style={{
                      padding: "2px 10px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)",
                      background: isComplete ? "var(--status-success-bg)" : "var(--status-warning-bg)",
                      color: isComplete ? "var(--status-success-text)" : "var(--status-warning-text)",
                    }}>
                      {getStatusLabel(a.status)}
                    </span>
                    {/* Anlass */}
                    <span style={{ padding: "2px 8px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-meta)", background: "var(--bg-secondary)", color: "var(--text-secondary)" }}>
                      {getAnlassLabel(a.anlass)}
                    </span>
                    {/* Open field count */}
                    {!isComplete && (
                      <span style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>
                        {a.openFields} offen
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>
                    Zuletzt bearbeitet: {formatDateTime(a.zuletztBearbeitetAm)}
                  </div>
                </div>
                {/* Progress bar for in-progress */}
                {!isComplete && a.activeFields > 0 && (
                  <div className="shrink-0 hidden sm:block" style={{ width: 48, marginLeft: 12 }}>
                    <div style={{ height: 4, background: "var(--bg-secondary)", borderRadius: "var(--radius-pill)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.round((a.filledFields / a.activeFields) * 100)}%`, background: "var(--brand-primary)", borderRadius: "var(--radius-pill)" }} />
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
