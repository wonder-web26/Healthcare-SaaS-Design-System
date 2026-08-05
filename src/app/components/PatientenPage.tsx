import React, { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  Search,
  Plus,
  AlertTriangle,
  Clock,
  CheckCircle2,
  X,
  SlidersHorizontal,
} from "lucide-react";
import {
  patients as initialPatients,
  type Patient,
} from "./patientData";
import { DataTable, TABELLE_LAYOUT, type SpalteDef } from "./ui/DataTable";
import { StatusModal } from "./StatusModal";
import { PflegefachkraftSidebar, type Caregiver } from "./PflegefachkraftSidebar";
import { useCurrentRole } from "../auth";
import { toast } from "sonner";

/* ══════════════════════════════════════════
   VIEW FILTERING
   ══════════════════════════════════════════ */

type ViewKey = "alle" | "meine" | "aufmerksamkeit";
const CURRENT_USER_NAME = "Sandra Weber";

function viewFilter(list: Patient[], view: ViewKey): Patient[] {
  switch (view) {
    case "meine": return list.filter(p => p.pflegefachkraft === CURRENT_USER_NAME);
    case "aufmerksamkeit": return list.filter(p =>
      p.pflegefachkraft === "—" ||
      p.status === "nicht_abrechenbar" ||
      p.prozessStatus?.ueberfaellig === true ||
      p.schweregrad === "schwer" || p.schweregrad === "kritisch" ||
      (p.reAssessmentTage !== null && p.reAssessmentTage <= 7)
    );
    default: return list;
  }
}

const VIEW_DEFS: { key: ViewKey; label: string }[] = [
  { key: "alle", label: "Alle Patienten" },
  { key: "meine", label: "Meine Patienten" },
  { key: "aufmerksamkeit", label: "Aufmerksamkeit" },
];

/* ══════════════════════════════════════════
   STATUS / SCHWEREGRAD (new design system)
   ══════════════════════════════════════════ */

const STATUS_STYLE: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  aktiv: { label: "Aktiv", bg: "var(--status-success-bg)", color: "var(--status-success-text)", dot: "var(--status-success)" },
  nicht_abrechenbar: { label: "Nicht abrechenbar", bg: "var(--status-danger-bg)", color: "var(--status-danger)", dot: "var(--status-danger)" },
  gekuendigt: { label: "Gekündigt", bg: "var(--status-danger-bg)", color: "var(--status-danger)", dot: "var(--status-danger)" },
};

const SCHWEREGRAD_STYLE: Record<string, { label: string; bg: string; color: string }> = {
  leicht: { label: "Leicht", bg: "var(--status-success-bg)", color: "var(--status-success-text)" },
  mittel: { label: "Mittel", bg: "var(--status-warning-bg)", color: "var(--status-warning-text)" },
  schwer: { label: "Schwer", bg: "var(--status-danger-bg)", color: "var(--status-danger)" },
  kritisch: { label: "Kritisch", bg: "var(--status-danger-bg)", color: "var(--status-danger)" },
};

interface FilterDef {
  id: string;
  label: string;
  options: { value: string; label: string }[];
}

function buildFilterDefs(patients: Patient[]): FilterDef[] {
  const pflegefachkraefte = Array.from(new Set(patients.map(p => p.pflegefachkraft).filter(pf => pf !== "—"))).sort();
  return [
    { id: "schweregrad", label: "Schweregrad", options: [{ value: "leicht", label: "Leicht" }, { value: "mittel", label: "Mittel" }, { value: "schwer", label: "Schwer" }, { value: "kritisch", label: "Kritisch" }] },
    { id: "pflegefachkraft", label: "Pflegefachkraft", options: pflegefachkraefte.map(pf => ({ value: pf, label: pf })) },
    { id: "prozessstatus", label: "Prozessstatus", options: [{ value: "ueberfaellig", label: "Überfällig" }, { value: "anstehend", label: "Anstehend" }, { value: "erledigt", label: "Keine offenen" }] },
    { id: "zuweisung", label: "Zuweisung", options: [{ value: "zugewiesen", label: "Zugewiesen" }, { value: "nicht_zugewiesen", label: "Nicht zugewiesen" }] },
  ];
}

/* ══════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════ */

type SortKey = "name" | "schweregrad" | "reassessment" | "tasks";
const SCHWEREGRAD_RANK: Record<string, number> = { leicht: 0, mittel: 1, schwer: 2, kritisch: 3 };
function sortPatients(list: Patient[], key: SortKey, dir: "asc" | "desc"): Patient[] {
  const f = dir === "asc" ? 1 : -1;
  return [...list].sort((a, b) => {
    switch (key) {
      case "name": return f * (a.nachname.localeCompare(b.nachname, "de") || a.vorname.localeCompare(b.vorname, "de"));
      case "schweregrad": return f * ((SCHWEREGRAD_RANK[a.schweregrad] ?? 0) - (SCHWEREGRAD_RANK[b.schweregrad] ?? 0));
      case "reassessment": return f * ((a.reAssessmentTage ?? Infinity) - (b.reAssessmentTage ?? Infinity));
      case "tasks": return f * (a.offeneActionTasks - b.offeneActionTasks);
      default: return 0;
    }
  });
}

export function PatientenPage() {
  const navigate = useNavigate();
  const role = useCurrentRole();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeView = (searchParams.get("view") || "alle") as ViewKey;
  const search = searchParams.get("q") || "";
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const setView = (v: ViewKey) => {
    const next = new URLSearchParams(searchParams);
    if (v === "alle") next.delete("view"); else next.set("view", v);
    setSearchParams(next, { replace: true });
  };

  const setSearch = (q: string) => {
    const next = new URLSearchParams(searchParams);
    if (!q) next.delete("q"); else next.set("q", q);
    setSearchParams(next, { replace: true });
  };

  const chipFilters = useMemo(() => {
    const filters: Record<string, Set<string>> = {};
    for (const [key, value] of searchParams.entries()) {
      if (["view", "q"].includes(key)) continue;
      filters[key] = new Set(value.split(",").filter(Boolean));
    }
    return filters;
  }, [searchParams]);

  const updateChipFilter = (id: string, next: Set<string>) => {
    const params = new URLSearchParams(searchParams);
    if (next.size === 0) params.delete(id); else params.set(id, Array.from(next).join(","));
    setSearchParams(params, { replace: true });
  };

  const clearAllChipFilters = () => {
    const params = new URLSearchParams();
    const v = searchParams.get("view");
    const q = searchParams.get("q");
    if (v) params.set("view", v);
    if (q) params.set("q", q);
    setSearchParams(params, { replace: true });
  };

  useEffect(() => {
    if (!filterPopoverOpen) return;
    const handler = (e: MouseEvent) => { if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterPopoverOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [filterPopoverOpen]);

  const [assignmentOverrides, setAssignmentOverrides] = useState<Record<string, { name: string; initialen: string }>>({});
  const [statusModal, setStatusModal] = useState<{ open: boolean; patient: Patient | null }>({ open: false, patient: null });
  const [assignSidebar, setAssignSidebar] = useState<{ open: boolean; patient: Patient | null }>({ open: false, patient: null });

  const patients = useMemo(() => initialPatients.map(p => {
    const override = assignmentOverrides[p.id];
    return override ? { ...p, pflegefachkraft: override.name, pflegefachkraftInitialen: override.initialen } : p;
  }), [assignmentOverrides]);

  const handleAssign = (patientId: string, caregiver: Caregiver) => {
    setAssignmentOverrides(prev => ({ ...prev, [patientId]: { name: caregiver.name, initialen: caregiver.initialen } }));
    setAssignSidebar({ open: false, patient: null });
    toast("Patient zugewiesen");
  };

  const filterDefs = useMemo(() => buildFilterDefs(patients), [patients]);

  const activeFilterTags = useMemo(() => {
    const tags: { filterId: string; value: string; displayLabel: string }[] = [];
    filterDefs.forEach(def => {
      const sel = chipFilters[def.id];
      if (!sel) return;
      sel.forEach(val => {
        const opt = def.options.find(o => o.value === val);
        tags.push({ filterId: def.id, value: val, displayLabel: `${def.label}: ${opt?.label || val}` });
      });
    });
    return tags;
  }, [chipFilters, filterDefs]);

  const filtered = useMemo(() => {
    let list = viewFilter(patients, activeView);
    const sg = chipFilters.schweregrad;
    if (sg?.size) list = list.filter(p => sg.has(p.schweregrad));
    const pf = chipFilters.pflegefachkraft;
    if (pf?.size) list = list.filter(p => pf.has(p.pflegefachkraft));
    const ps = chipFilters.prozessstatus;
    if (ps?.size) list = list.filter(p => {
      if (ps.has("ueberfaellig") && p.prozessStatus?.ueberfaellig) return true;
      if (ps.has("anstehend") && p.prozessStatus && !p.prozessStatus.ueberfaellig) return true;
      if (ps.has("erledigt") && !p.prozessStatus) return true;
      return false;
    });
    const zw = chipFilters.zuweisung;
    if (zw?.size) list = list.filter(p => {
      if (zw.has("zugewiesen") && p.pflegefachkraft !== "—") return true;
      if (zw.has("nicht_zugewiesen") && p.pflegefachkraft === "—") return true;
      return false;
    });
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => `${p.vorname} ${p.nachname}`.toLowerCase().includes(q) || p.angehoeriger.toLowerCase().includes(q) || p.pflegefachkraft.toLowerCase().includes(q));
    }
    return list;
  }, [activeView, search, chipFilters, patients]);

  const viewCounts = useMemo(() => ({
    alle: patients.length,
    meine: viewFilter(patients, "meine").length,
    aufmerksamkeit: viewFilter(patients, "aufmerksamkeit").length,
  }), [patients]);


  const removeFilterTag = (filterId: string, value: string) => {
    const sel = chipFilters[filterId];
    if (!sel) return;
    const next = new Set(sel);
    next.delete(value);
    updateChipFilter(filterId, next);
  };

  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" } | null>(null);
  const toggleSort = (key: string) => setSort(s => s?.key === key ? { key: key as SortKey, dir: s.dir === "asc" ? "desc" : "asc" } : { key: key as SortKey, dir: "asc" });
  const sorted = useMemo(() => sort ? sortPatients(filtered, sort.key, sort.dir) : filtered, [filtered, sort]);

  const inhaltRahmen = { maxWidth: TABELLE_LAYOUT.inhaltMaxPx, margin: "0 auto", width: "100%" } as const;

  const nameZelle = (p: Patient) => {
    const isUn = p.pflegefachkraft === "—";
    return (
      <div className="flex items-center" style={{ gap: 8 }}>
        <div className="shrink-0 flex items-center justify-center" style={{ width: 28, height: 28, borderRadius: "var(--radius-card)", background: isUn ? "var(--status-warning-bg)" : "var(--brand-primary-light)" }}>
          <span style={{ fontSize: 10, fontWeight: "var(--weight-semibold)", color: isUn ? "var(--status-warning-text)" : "var(--brand-primary)" }}>{p.vorname[0]}{p.nachname[0]}</span>
        </div>
        <span style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", overflowWrap: "anywhere" }}>{p.nachname}, {p.vorname}</span>
      </div>
    );
  };

  /* ── Spaltenbeschreibung für die geteilte DataTable (Anteile/Mindestbreiten an
     der Aufrufstelle; Zahlen rechtsbündig/tabellarisch). Inhalte unverändert. ── */
  const patientSpalten: SpalteDef<Patient>[] = [
    { id: "name", label: "Name", anteil: 18, minCh: 24, align: "left", sortierbar: true, ausKarte: true, render: nameZelle },
    { id: "angehoeriger", label: "Angehöriger", anteil: 15, minCh: 22, align: "left", zweitzeileUnter: "name",
      render: p => <span style={{ fontSize: "var(--text-small)", color: "var(--text-primary)", overflowWrap: "anywhere" }}>{p.angehoeriger.split(" (")[0]}</span> },
    { id: "status", label: "Status", anteil: 9, minCh: 13, align: "left",
      render: p => { const st = STATUS_STYLE[p.status] || STATUS_STYLE.aktiv; return (
        <button onClick={e => { e.stopPropagation(); setStatusModal({ open: true, patient: p }); }} className="ui-fokusring inline-flex items-center cursor-pointer" style={{ gap: 4, padding: "2px 10px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", background: st.bg, color: st.color, border: "none", fontFamily: "inherit", whiteSpace: "nowrap" }}>
          <span style={{ width: 5, height: 5, borderRadius: "var(--radius-pill)", background: st.dot }} />{st.label}
        </button>); } },
    { id: "schweregrad", label: "Schweregrad", anteil: 7, minCh: 12, align: "left", sortierbar: true,
      render: p => { const sg = SCHWEREGRAD_STYLE[p.schweregrad] || SCHWEREGRAD_STYLE.leicht; return <span style={{ padding: "2px 8px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", background: sg.bg, color: sg.color, whiteSpace: "nowrap" }}>{sg.label}</span>; } },
    { id: "pflegefachkraft", label: "Pflegefachkraft", anteil: 11, minCh: 15, align: "left",
      render: p => { const isUn = p.pflegefachkraft === "—"; return (
        <button onClick={e => { e.stopPropagation(); setAssignSidebar({ open: true, patient: p }); }} className="ui-fokusring inline-flex items-center cursor-pointer transition-colors" style={{ gap: 6, padding: "3px 8px", borderRadius: "var(--radius-card)", background: "transparent", border: "none", fontSize: "var(--text-small)", color: isUn ? "var(--status-warning-text)" : "var(--text-primary)", fontWeight: isUn ? "var(--weight-medium)" : "var(--weight-regular)", fontFamily: "inherit", whiteSpace: "nowrap" }} onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
          {isUn ? (<><AlertTriangle style={{ width: 12, height: 12, color: "var(--status-warning)" }} /> Nicht zugewiesen</>) : (<><div className="shrink-0 flex items-center justify-center" style={{ width: 20, height: 20, borderRadius: "var(--radius-pill)", background: "var(--bg-secondary)" }}><span style={{ fontSize: 8, fontWeight: "var(--weight-semibold)", color: "var(--text-secondary)" }}>{p.pflegefachkraftInitialen}</span></div>{p.pflegefachkraft}</>)}
        </button>); } },
    { id: "prozessstatus", label: "Prozessstatus", anteil: 16, minCh: 20, align: "left", ausblendenUnter: "eng",
      render: p => p.prozessStatus ? (
        <div>
          <div className="flex items-center" style={{ gap: 4 }}>
            {p.prozessStatus.ueberfaellig ? <AlertTriangle style={{ width: 12, height: 12, color: "var(--status-danger)", flexShrink: 0 }} /> : <Clock style={{ width: 12, height: 12, color: "var(--text-tertiary)", flexShrink: 0 }} />}
            <span style={{ fontSize: "var(--text-small)", color: p.prozessStatus.ueberfaellig ? "var(--status-danger)" : "var(--text-primary)", fontWeight: p.prozessStatus.ueberfaellig ? "var(--weight-medium)" : "var(--weight-regular)", overflowWrap: "anywhere" }}>{p.prozessStatus.naechsteAufgabe}</span>
          </div>
          <div style={{ fontSize: "var(--text-micro)", marginLeft: 16, color: p.prozessStatus.ueberfaellig ? "var(--status-danger)" : "var(--text-tertiary)" }}>{p.prozessStatus.ueberfaellig ? "Überfällig · " : "Fällig "}{p.prozessStatus.faelligDatum}</div>
        </div>
      ) : (
        <span className="inline-flex items-center" style={{ gap: 4, fontSize: "var(--text-meta)", color: "var(--status-success-text)", fontWeight: "var(--weight-medium)" }}><CheckCircle2 style={{ width: 12, height: 12 }} /> Aktuell</span>
      ) },
    { id: "reassessment", label: "Re-Assessment", anteil: 8, minCh: 13, align: "right", sortierbar: true,
      render: p => p.reAssessmentTage !== null ? (
        <div className="flex items-center justify-end" style={{ gap: 6 }}>
          <span style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-semibold)", fontVariantNumeric: "tabular-nums", color: p.reAssessmentTage <= 14 ? "var(--status-danger)" : p.reAssessmentTage <= 30 ? "var(--status-warning-text)" : "var(--text-primary)" }}>{p.reAssessmentTage}d</span>
          <div style={{ width: 48, height: 6, background: "var(--bg-secondary)", borderRadius: "var(--radius-pill)", overflow: "hidden", flexShrink: 0 }}>
            <div style={{ height: "100%", borderRadius: "var(--radius-pill)", width: `${Math.max(5, Math.min(100, ((90 - p.reAssessmentTage) / 90) * 100))}%`, background: p.reAssessmentTage <= 14 ? "var(--status-danger)" : p.reAssessmentTage <= 30 ? "var(--status-warning)" : "var(--status-success)" }} />
          </div>
        </div>
      ) : <span style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>—</span> },
    { id: "tasks", label: "Tasks", anteil: 6, minCh: 7, align: "right", sortierbar: true,
      render: p => p.offeneActionTasks > 0 ? (
        <span className="inline-flex items-center justify-center" style={{ minWidth: 22, height: 22, borderRadius: "var(--radius-card)", background: "var(--status-warning-bg)", color: "var(--status-warning-text)", fontSize: "var(--text-meta)", fontWeight: "var(--weight-semibold)", fontVariantNumeric: "tabular-nums" }}>{p.offeneActionTasks}</span>
      ) : <CheckCircle2 style={{ width: 16, height: 16, color: "var(--status-success)" }} /> },
    { id: "aktivitaet", label: "Aktivität", anteil: 10, minCh: 12, align: "left",
      render: p => <span style={{ fontSize: "var(--text-small)", color: "var(--text-tertiary)", whiteSpace: "nowrap" }}>{p.letzteAktivitaet}</span> },
  ];

  return (
    <>
      <div className="flex flex-col h-full min-h-0">
        {/* ═══════════════════════════════════════
           HEADER
           ═══════════════════════════════════════ */}
        <div className="shrink-0" style={{ padding: "var(--space-4) var(--space-6) 0" }}>
          <div style={inhaltRahmen}>
          {/* Title row */}
          <div className="flex items-center justify-between" style={{ marginBottom: "var(--space-4)" }}>
            <h1 style={{ fontSize: "var(--text-h1)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", letterSpacing: "var(--tracking-tight)" }}>
              Patienten
            </h1>
            <button
              onClick={() => navigate("/onboarding")}
              className="inline-flex items-center cursor-pointer transition-colors"
              style={{
                gap: "var(--space-2)", padding: "10px 22px", borderRadius: "var(--radius-pill)",
                background: "var(--brand-primary)", color: "var(--text-on-dark)",
                fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", border: "none",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--brand-primary-dark)"}
              onMouseLeave={e => e.currentTarget.style.background = "var(--brand-primary)"}
            >
              <Plus style={{ width: 16, height: 16 }} /> Patient anlegen
            </button>
          </div>


          {/* Search + filter */}
          <div className="flex items-center" style={{ gap: 8, marginBottom: "var(--space-3)" }}>
            <div className="flex items-center flex-1" style={{
              maxWidth: 300, gap: "var(--space-2)", padding: "8px 14px",
              borderRadius: "var(--radius-pill)", background: "var(--bg-elevated)",
              border: "var(--border-thin) solid var(--border-default)",
            }}>
              <Search style={{ width: 14, height: 14, color: "var(--text-tertiary)", flexShrink: 0 }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Patienten suchen…"
                className="flex-1 bg-transparent outline-none"
                style={{ fontSize: "var(--text-small)", color: "var(--text-primary)" }}
              />
              {search && (
                <button onClick={() => setSearch("")} className="cursor-pointer" style={{ background: "transparent", border: "none" }}>
                  <X style={{ width: 12, height: 12, color: "var(--text-secondary)" }} />
                </button>
              )}
            </div>

            <div className="relative" ref={filterRef}>
              <button
                onClick={() => setFilterPopoverOpen(o => !o)}
                className="inline-flex items-center cursor-pointer transition-colors"
                style={{
                  gap: 6, padding: "6px 14px", borderRadius: "var(--radius-pill)",
                  background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)",
                  fontSize: 13, fontWeight: "var(--weight-medium)", color: "var(--text-primary)",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"}
                onMouseLeave={e => e.currentTarget.style.background = "var(--bg-elevated)"}
              >
                <SlidersHorizontal style={{ width: 14, height: 14, color: "var(--text-secondary)" }} />
                Filter
                {activeFilterTags.length > 0 && (
                  <span style={{ width: 5, height: 5, borderRadius: "var(--radius-pill)", background: "var(--brand-primary)" }} />
                )}
              </button>

              {filterPopoverOpen && (
                <div className="absolute top-[calc(100%+6px)] left-0 z-50" style={{
                  width: 300, background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)",
                  borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-overlay)", padding: 14,
                }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                    <span style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>Filter</span>
                    <button onClick={() => setFilterPopoverOpen(false)} className="cursor-pointer" style={{ background: "transparent", border: "none" }}>
                      <X style={{ width: 14, height: 14, color: "var(--text-secondary)" }} />
                    </button>
                  </div>
                  <div className="flex flex-col" style={{ gap: 14, maxHeight: 400, overflowY: "auto" }}>
                    {filterDefs.map(def => (
                      <div key={def.id}>
                        <div style={{ fontSize: "var(--text-micro)", color: "var(--text-secondary)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase" as const, marginBottom: 8, fontWeight: "var(--weight-medium)" }}>{def.label}</div>
                        <div className="flex flex-wrap" style={{ gap: 4 }}>
                          {def.options.map(opt => {
                            const sel = chipFilters[def.id] || new Set();
                            const isActive = sel.has(opt.value);
                            return (
                              <button
                                key={opt.value}
                                onClick={() => { const next = new Set(sel); if (isActive) next.delete(opt.value); else next.add(opt.value); updateChipFilter(def.id, next); }}
                                className="cursor-pointer transition-colors"
                                style={{
                                  padding: "4px 10px", borderRadius: "var(--radius-pill)",
                                  fontSize: "var(--text-meta)", fontWeight: isActive ? "var(--weight-medium)" : "var(--weight-regular)",
                                  background: isActive ? "var(--brand-primary-light)" : "var(--bg-elevated)",
                                  border: isActive ? "var(--border-thin) solid var(--brand-primary)" : "var(--border-thin) solid var(--border-default)",
                                  color: isActive ? "var(--brand-primary)" : "var(--text-secondary)",
                                }}
                              >
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                  {activeFilterTags.length > 0 && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: "var(--border-thin) solid var(--border-default)", textAlign: "right" }}>
                      <button onClick={clearAllChipFilters} className="cursor-pointer" style={{ background: "transparent", border: "none", fontSize: "var(--text-meta)", color: "var(--text-secondary)", fontWeight: "var(--weight-medium)" }}>
                        Alle zurücksetzen
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {activeFilterTags.map(tag => (
              <button
                key={`${tag.filterId}-${tag.value}`}
                onClick={() => removeFilterTag(tag.filterId, tag.value)}
                className="inline-flex items-center cursor-pointer"
                style={{
                  gap: 4, padding: "4px 10px", borderRadius: "var(--radius-pill)",
                  background: "var(--brand-primary-light)", color: "var(--brand-primary)",
                  fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", border: "none",
                }}
              >
                {tag.displayLabel} <X style={{ width: 10, height: 10 }} />
              </button>
            ))}
            {activeFilterTags.length > 0 && (
              <button onClick={clearAllChipFilters} className="cursor-pointer" style={{ background: "transparent", border: "none", fontSize: "var(--text-meta)", color: "var(--text-secondary)", fontWeight: "var(--weight-medium)", padding: "4px 6px" }}>
                Alle zurücksetzen
              </button>
            )}
          </div>

          {/* View pills */}
          <div className="flex items-center flex-wrap" style={{ gap: 8, marginBottom: "var(--space-4)" }}>
            {VIEW_DEFS.map(def => {
              const isActive = activeView === def.key;
              const count = viewCounts[def.key];
              return (
                <button
                  key={def.key}
                  onClick={() => setView(def.key)}
                  className="inline-flex items-center cursor-pointer transition-colors"
                  style={{
                    gap: 8, padding: "6px 14px", borderRadius: "var(--radius-pill)",
                    fontSize: 13, fontWeight: isActive ? "var(--weight-medium)" : "var(--weight-regular)",
                    background: isActive ? "var(--brand-primary-light)" : "transparent",
                    border: isActive ? "var(--border-thin) solid transparent" : "var(--border-thin) solid var(--border-default)",
                    color: isActive ? "var(--brand-primary)" : "var(--text-primary)",
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "var(--bg-secondary)"; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = isActive ? "var(--brand-primary-light)" : "transparent"; }}
                >
                  {def.label}
                  <span className="inline-flex items-center justify-center" style={{
                    minWidth: 18, padding: "1px 8px", borderRadius: "var(--radius-pill)",
                    fontSize: 11, fontWeight: "var(--weight-medium)",
                    background: isActive ? "var(--brand-primary)" : "var(--bg-secondary)",
                    color: isActive ? "var(--text-on-dark)" : "var(--text-secondary)",
                  }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════
           TABLE
           ═══════════════════════════════════════ */}
        <div className="flex-1 overflow-y-auto" style={{ padding: "0 var(--space-6) var(--space-4)" }}>
          <DataTable<Patient>
            spalten={patientSpalten}
            zeilen={sorted}
            zeilenKey={p => p.id}
            onZeileKlick={p => navigate(`/patienten/${p.id}`)}
            sort={sort ?? undefined}
            onSort={toggleSort}
            karteTitel={nameZelle}
            fusszeile={<span>{filtered.length} von {patients.length} Patienten</span>}
            leerText="Keine Patienten für diesen Filter gefunden."
          />
        </div>
      </div>

      {/* Modals */}
      <StatusModal
        open={statusModal.open}
        onClose={() => setStatusModal({ open: false, patient: null })}
        currentStatus={statusModal.patient?.status || "aktiv"}
        patientName={statusModal.patient ? `${statusModal.patient.nachname}, ${statusModal.patient.vorname} (${statusModal.patient.id})` : ""}
      />
      <PflegefachkraftSidebar
        open={assignSidebar.open}
        patient={assignSidebar.patient}
        onClose={() => setAssignSidebar({ open: false, patient: null })}
        onAssign={handleAssign}
      />
    </>
  );
}
