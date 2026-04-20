import React, { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  Search,
  Download,
  Plus,
  ArrowUpDown,
  AlertTriangle,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  ChevronDown,
  X,
  Users,
  UserX,
  AlertCircle,
  CalendarClock,
  Check,
} from "lucide-react";
import {
  patients as initialPatients,
  statusConfig,
  schweregradConfig,
  type Patient,
} from "./patientData";
import { StatusModal } from "./StatusModal";
import {
  PflegefachkraftSidebar,
  type Caregiver,
} from "./PflegefachkraftSidebar";
import { toast } from "sonner";

/* ── Primary Views (reduced to 3) ────────── */
type ViewKey = "alle" | "meine" | "aufmerksamkeit";

const CURRENT_USER_NAME = "Sandra Weber";

function viewFilter(list: Patient[], view: ViewKey): Patient[] {
  switch (view) {
    case "meine":
      return list.filter((p) => p.pflegefachkraft === CURRENT_USER_NAME);
    case "aufmerksamkeit":
      return list.filter(
        (p) =>
          p.pflegefachkraft === "—" ||
          p.status === "nicht_abrechenbar" ||
          (p.prozessStatus?.ueberfaellig === true)
      );
    default:
      return list;
  }
}

const viewTabs: { id: ViewKey; label: string; icon: React.ElementType }[] = [
  { id: "alle", label: "Alle Patienten", icon: Users },
  { id: "meine", label: "Meine Patienten", icon: Users },
  { id: "aufmerksamkeit", label: "Aufmerksamkeit nötig", icon: AlertCircle },
];

/* ── Filter chip definitions ─────────────── */
interface FilterDef {
  id: string;
  label: string;
  options: { value: string; label: string }[];
}

function buildFilterDefs(patients: Patient[]): FilterDef[] {
  const kantone = Array.from(new Set(patients.map((p) => p.kanton))).sort();
  const sprachen = Array.from(new Set(patients.map((p) => p.sprache))).sort();
  const pflegefachkraefte = Array.from(
    new Set(patients.map((p) => p.pflegefachkraft).filter((pf) => pf !== "—"))
  ).sort();

  return [
    {
      id: "schweregrad",
      label: "Schweregrad",
      options: [
        { value: "leicht", label: "Leicht" },
        { value: "mittel", label: "Mittel" },
        { value: "schwer", label: "Schwer" },
        { value: "kritisch", label: "Kritisch" },
      ],
    },
    {
      id: "pflegefachkraft",
      label: "Pflegefachkraft",
      options: pflegefachkraefte.map((pf) => ({ value: pf, label: pf })),
    },
    {
      id: "region",
      label: "Region",
      options: kantone.map((k) => ({ value: k, label: k })),
    },
    {
      id: "sprache",
      label: "Sprache",
      options: sprachen.map((s) => ({ value: s, label: s })),
    },
    {
      id: "prozessstatus",
      label: "Prozessstatus",
      options: [
        { value: "ueberfaellig", label: "Überfällige Aufgaben" },
        { value: "anstehend", label: "Anstehende Aufgaben" },
        { value: "erledigt", label: "Keine offenen Aufgaben" },
      ],
    },
    {
      id: "reassessment",
      label: "Re-Assessment",
      options: [
        { value: "ueberfaellig", label: "Überfällig" },
        { value: "diesen_monat", label: "Diesen Monat fällig" },
        { value: "naechsten_monat", label: "Nächsten Monat fällig" },
        { value: "spaeter", label: "Später" },
      ],
    },
    {
      id: "zuweisung",
      label: "Zuweisung",
      options: [
        { value: "zugewiesen", label: "Zugewiesen" },
        { value: "nicht_zugewiesen", label: "Nicht zugewiesen" },
      ],
    },
  ];
}

/* ── Multi-select popover chip ───────────── */
function FilterChipPopover({
  def,
  selected,
  onChange,
}: {
  def: FilterDef;
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const hasSelection = selected.size > 0;

  const toggle = (val: string) => {
    const next = new Set(selected);
    if (next.has(val)) next.delete(val);
    else next.add(val);
    onChange(next);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-[5px] rounded-lg text-[12px] border transition-all whitespace-nowrap ${
          hasSelection
            ? "border-primary/25 bg-primary-light text-primary"
            : "border-border bg-card text-muted-foreground hover:bg-secondary/60"
        }`}
        style={{ fontWeight: hasSelection ? 500 : 400 }}
      >
        {def.label}
        {hasSelection && (
          <span
            className="text-[10px] px-[5px] py-[1px] rounded-md bg-primary/10 text-primary"
            style={{ fontWeight: 600 }}
          >
            {selected.size}
          </span>
        )}
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""} ${hasSelection ? "text-primary" : "text-muted-foreground/50"}`} />
      </button>

      {open && (
        <div className="absolute top-full mt-1.5 left-0 z-50 min-w-[200px] bg-card border border-border rounded-xl shadow-lg py-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="px-3 py-1.5 text-[10.5px] text-muted-foreground uppercase tracking-wider" style={{ fontWeight: 500 }}>
            {def.label}
          </div>
          {def.options.map((opt) => {
            const isChecked = selected.has(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => toggle(opt.value)}
                className="flex items-center gap-2.5 w-full px-3 py-[7px] text-[12px] text-left hover:bg-secondary/60 transition-colors"
                style={{ fontWeight: isChecked ? 500 : 400 }}
              >
                <div
                  className={`w-4 h-4 rounded-[5px] border flex items-center justify-center shrink-0 transition-all ${
                    isChecked
                      ? "bg-primary border-primary"
                      : "border-border bg-card"
                  }`}
                >
                  {isChecked && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                </div>
                <span className={isChecked ? "text-foreground" : "text-muted-foreground"}>
                  {opt.label}
                </span>
              </button>
            );
          })}
          {hasSelection && (
            <div className="border-t border-border-light mt-1 pt-1 px-3">
              <button
                onClick={() => { onChange(new Set()); setOpen(false); }}
                className="text-[11px] text-primary hover:underline py-1"
                style={{ fontWeight: 500 }}
              >
                Auswahl zurücksetzen
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Helpers ─────────────────────────────── */
function isUnassigned(p: Patient): boolean {
  return p.pflegefachkraft === "—";
}

/* ══════════════════════════════════════════
   PATIENTEN ÜBERSICHT
   ══════════════════════════════════════════ */
export function PatientenPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeView = (searchParams.get("view") || "meine") as ViewKey;
  const search = searchParams.get("q") || "";
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const setView = (v: ViewKey) => {
    const next = new URLSearchParams(searchParams);
    if (v === "meine") next.delete("view");
    else next.set("view", v);
    setSearchParams(next, { replace: true });
  };

  const setSearch = (q: string) => {
    const next = new URLSearchParams(searchParams);
    if (!q) next.delete("q");
    else next.set("q", q);
    setSearchParams(next, { replace: true });
  };

  // Parse chip filters from URL
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
    if (next.size === 0) params.delete(id);
    else params.set(id, Array.from(next).join(","));
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

  // Close filter popover on outside click
  useEffect(() => {
    if (!filterPopoverOpen) return;
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterPopoverOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [filterPopoverOpen]);

  const [assignmentOverrides, setAssignmentOverrides] = useState<
    Record<string, { name: string; initialen: string }>
  >({});
  const [statusModal, setStatusModal] = useState<{
    open: boolean;
    patient: Patient | null;
  }>({ open: false, patient: null });

  const patients = useMemo(() => {
    return initialPatients.map((p) => {
      const override = assignmentOverrides[p.id];
      if (override) {
        return {
          ...p,
          pflegefachkraft: override.name,
          pflegefachkraftInitialen: override.initialen,
        };
      }
      return p;
    });
  }, [assignmentOverrides]);

  /* ── Assignment sidebar state ──────────── */
  const [assignSidebar, setAssignSidebar] = useState<{
    open: boolean;
    patient: Patient | null;
  }>({ open: false, patient: null });

  const openAssignSidebar = (patient: Patient, e: React.MouseEvent) => {
    e.stopPropagation();
    setAssignSidebar({ open: true, patient });
  };

  const handleAssign = (patientId: string, caregiver: Caregiver) => {
    setAssignmentOverrides((prev) => ({
      ...prev,
      [patientId]: { name: caregiver.name, initialen: caregiver.initialen },
    }));
    setAssignSidebar({ open: false, patient: null });
    toast.success("Patient zugewiesen", {
      description: `${caregiver.name} wurde erfolgreich zugewiesen.`,
    });
  };

  /* ── Derived computations ──────────────── */
  const filterDefs = useMemo(() => buildFilterDefs(patients), [patients]);

  /* ── Active filter tags for display ─────── */
  const activeFilterTags = useMemo(() => {
    const tags: { filterId: string; filterLabel: string; value: string; displayLabel: string }[] = [];
    filterDefs.forEach((def) => {
      const sel = chipFilters[def.id];
      if (!sel) return;
      sel.forEach((val) => {
        const opt = def.options.find((o) => o.value === val);
        tags.push({
          filterId: def.id,
          filterLabel: def.label,
          value: val,
          displayLabel: opt?.label || val,
        });
      });
    });
    return tags;
  }, [chipFilters, filterDefs]);

  const hasAnyChipFilter = activeFilterTags.length > 0;

  const filtered = useMemo(() => {
    let list = viewFilter(patients, activeView);

    const sg = chipFilters.schweregrad;
    if (sg && sg.size > 0) list = list.filter((p) => sg.has(p.schweregrad));

    const pf = chipFilters.pflegefachkraft;
    if (pf && pf.size > 0) list = list.filter((p) => pf.has(p.pflegefachkraft));

    const rg = chipFilters.region;
    if (rg && rg.size > 0) list = list.filter((p) => rg.has(p.kanton));

    const sp = chipFilters.sprache;
    if (sp && sp.size > 0) list = list.filter((p) => sp.has(p.sprache));

    const ps = chipFilters.prozessstatus;
    if (ps && ps.size > 0) {
      list = list.filter((p) => {
        if (ps.has("ueberfaellig") && p.prozessStatus?.ueberfaellig) return true;
        if (ps.has("anstehend") && p.prozessStatus && !p.prozessStatus.ueberfaellig) return true;
        if (ps.has("erledigt") && p.prozessStatus === null) return true;
        return false;
      });
    }

    const ra = chipFilters.reassessment;
    if (ra && ra.size > 0) {
      list = list.filter((p) => {
        if (p.reAssessmentTage === null) return false;
        if (ra.has("ueberfaellig") && p.reAssessmentTage <= 0) return true;
        if (ra.has("diesen_monat") && p.reAssessmentTage > 0 && p.reAssessmentTage <= 30) return true;
        if (ra.has("naechsten_monat") && p.reAssessmentTage > 30 && p.reAssessmentTage <= 60) return true;
        if (ra.has("spaeter") && p.reAssessmentTage > 60) return true;
        return false;
      });
    }

    const zw = chipFilters.zuweisung;
    if (zw && zw.size > 0) {
      list = list.filter((p) => {
        if (zw.has("zugewiesen") && p.pflegefachkraft !== "—") return true;
        if (zw.has("nicht_zugewiesen") && p.pflegefachkraft === "—") return true;
        return false;
      });
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          `${p.vorname} ${p.nachname}`.toLowerCase().includes(q) ||
          p.angehoeriger.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          p.kanton.toLowerCase().includes(q) ||
          p.pflegefachkraft.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeView, search, chipFilters, patients]);

  const openStatusModal = (patient: Patient, e: React.MouseEvent) => {
    e.stopPropagation();
    setStatusModal({ open: true, patient });
  };

  const removeFilterTag = (filterId: string, value: string) => {
    setChipFilters((prev) => {
      const next = new Set(prev[filterId]);
      next.delete(value);
      return { ...prev, [filterId]: next };
    });
  };

  return (
    <>
      <div className="flex flex-col lg:flex-row h-full">
        {/* ── LEFT: Views-Rail (desktop) ───── */}
        <div className="hidden lg:block w-[220px] shrink-0 border-r border-border-light bg-[#FAFBFC] overflow-y-auto" style={{ padding: "20px 14px" }}>
          <div className="text-[10.5px] text-muted-foreground uppercase tracking-wider px-2 pb-2" style={{ fontWeight: 500, letterSpacing: "0.08em" }}>
            Ansichten
          </div>
          {viewTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeView === tab.id;
            const cnt = viewFilter(patients, tab.id).length;
            return (
              <button
                key={tab.id}
                onClick={() => setView(tab.id)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] text-left mb-0.5 transition-colors cursor-pointer ${
                  isActive ? "bg-primary-light text-primary" : "text-foreground hover:bg-muted/40"
                }`}
                style={{ fontWeight: isActive ? 500 : 400 }}
              >
                <Icon className={`w-[15px] h-[15px] shrink-0 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                <span className="flex-1 truncate">{tab.label}</span>
                <span className="text-[11px] text-muted-foreground" style={{ fontWeight: 500 }}>{cnt}</span>
              </button>
            );
          })}
        </div>

        {/* Mobile views tabs */}
        <div className="lg:hidden flex items-center gap-1 px-3 py-2 border-b border-border-light bg-[#FAFBFC] overflow-x-auto shrink-0">
          {viewTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeView === tab.id;
            const cnt = viewFilter(patients, tab.id).length;
            return (
              <button
                key={tab.id}
                onClick={() => setView(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  isActive ? "bg-primary-light text-primary" : "text-muted-foreground hover:bg-muted/40"
                }`}
                style={{ fontWeight: isActive ? 500 : 400 }}
              >
                <Icon className="w-[14px] h-[14px]" />
                {tab.label}
                <span className="text-[10px] opacity-70">{cnt}</span>
              </button>
            );
          })}
        </div>

        {/* ── MAIN: Content area ─────────── */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Page header + filter */}
          <div className="border-b border-border-light" style={{ padding: "14px 16px 10px" }}>
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h1 className="text-foreground" style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.015em" }}>
                  Patienten
                </h1>
                <div className="text-[12.5px] text-muted-foreground mt-[3px]">
                  {filtered.length} von {patients.length} Patienten
                </div>
              </div>
              <button
                onClick={() => navigate("/onboarding")}
                className="inline-flex items-center gap-1.5 shrink-0 rounded-[10px] bg-primary text-primary-foreground hover:bg-primary-hover transition-colors cursor-pointer"
                style={{ padding: "8px 13px", fontSize: 12.5, fontWeight: 500 }}
              >
                <Plus className="w-[13px] h-[13px]" />
                <span className="hidden sm:inline">Patient anlegen</span>
              </button>
            </div>

            {/* Filter bar */}
            <div className="flex items-center gap-2 flex-wrap relative">
              <div className="flex items-center gap-2 bg-background rounded-xl px-3 py-[6px] border border-border-light flex-1 sm:flex-none sm:min-w-[220px] sm:max-w-[300px]">
                <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Patienten suchen…"
                  className="bg-transparent outline-none text-[12px] flex-1 placeholder:text-muted-foreground/50"
                  style={{ fontWeight: 400 }}
                />
                {search && (
                  <button onClick={() => setSearch("")} className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="relative" ref={filterRef}>
                <button
                  onClick={() => setFilterPopoverOpen(o => !o)}
                  className={`inline-flex items-center gap-1.5 px-3 py-[6px] rounded-full border text-[12px] transition-colors cursor-pointer ${
                    filterPopoverOpen ? "border-primary/30 bg-primary-light text-primary" : "border-border bg-card text-muted-foreground hover:bg-secondary/60"
                  }`}
                  style={{ fontWeight: 500 }}
                >
                  <ChevronDown className="w-3 h-3" />
                  Filter
                  {activeFilterTags.length > 0 && (
                    <span className="w-[5px] h-[5px] rounded-full bg-primary" />
                  )}
                </button>

                {filterPopoverOpen && (
                  <div className="absolute top-[calc(100%+6px)] left-0 z-50 bg-card border border-border rounded-xl w-[300px]" style={{ padding: 14, boxShadow: "0 8px 24px rgba(17,24,39,0.08)" }}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[12px] text-foreground" style={{ fontWeight: 600 }}>Filter</span>
                      <button onClick={() => setFilterPopoverOpen(false)} className="text-muted-foreground cursor-pointer"><X className="w-[14px] h-[14px]" /></button>
                    </div>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto">
                      {filterDefs.map((def) => (
                        <div key={def.id}>
                          <div className="text-[10.5px] text-muted-foreground uppercase mb-2" style={{ fontWeight: 500, letterSpacing: "0.08em" }}>{def.label}</div>
                          <div className="flex flex-wrap gap-1">
                            {def.options.map((opt) => {
                              const sel = chipFilters[def.id] || new Set();
                              const active = sel.has(opt.value);
                              return (
                                <button
                                  key={opt.value}
                                  onClick={() => {
                                    const next = new Set(sel);
                                    if (active) next.delete(opt.value);
                                    else next.add(opt.value);
                                    updateChipFilter(def.id, next);
                                  }}
                                  className={`rounded-full text-[11.5px] border transition-colors cursor-pointer ${
                                    active ? "border-primary bg-primary-light text-primary" : "border-border bg-card text-muted-foreground hover:bg-secondary/60"
                                  }`}
                                  style={{ padding: "4px 10px", fontWeight: active ? 500 : 400 }}
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
                      <div className="mt-3 pt-3 border-t border-border-light flex justify-end">
                        <button onClick={clearAllChipFilters} className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer" style={{ fontWeight: 500 }}>
                          Alle zurücksetzen
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {activeFilterTags.map((tag) => (
                <button
                  key={`${tag.filterId}-${tag.value}`}
                  onClick={() => removeFilterTag(tag.filterId, tag.value)}
                  className="inline-flex items-center gap-1 rounded-full bg-primary-light text-primary text-[11.5px] cursor-pointer"
                  style={{ padding: "5px 10px", fontWeight: 500 }}
                >
                  {tag.filterLabel}: {tag.displayLabel} <X className="w-[11px] h-[11px]" />
                </button>
              ))}
              {activeFilterTags.length > 0 && (
                <button onClick={clearAllChipFilters} className="text-[11.5px] text-muted-foreground cursor-pointer" style={{ padding: "5px 6px", fontWeight: 500 }}>
                  Alle zurücksetzen
                </button>
              )}
            </div>
          </div>

          {/* ── Table ───────────────────────── */}
          <div className="flex-1 overflow-y-auto">
      <TableView
        patients={filtered}
        navigate={navigate}
        openStatusModal={openStatusModal}
        openAssignSidebar={openAssignSidebar}
        totalCount={patients.length}
      />
          </div>
        </div>
      </div>

      {/* ── Status Modal ─────────────────── */}
      <StatusModal
        open={statusModal.open}
        onClose={() => setStatusModal({ open: false, patient: null })}
        currentStatus={statusModal.patient?.status || "aktiv"}
        patientName={
          statusModal.patient
            ? `${statusModal.patient.nachname}, ${statusModal.patient.vorname} (${statusModal.patient.id})`
            : ""
        }
      />

      {/* ── Assignment Sidebar ───────────── */}
      <PflegefachkraftSidebar
        open={assignSidebar.open}
        patient={assignSidebar.patient}
        onClose={() => setAssignSidebar({ open: false, patient: null })}
        onAssign={handleAssign}
      />
    </>
  );
}

/* ══════════════════════════════════════════
   TABLE VIEW (Enhanced)
   ══════════════════════════════════════════ */
function TableView({
  patients: filtered,
  navigate,
  openStatusModal,
  openAssignSidebar,
  totalCount,
}: {
  patients: Patient[];
  navigate: (path: string) => void;
  openStatusModal: (p: Patient, e: React.MouseEvent) => void;
  openAssignSidebar: (p: Patient, e: React.MouseEvent) => void;
  totalCount: number;
}) {
  return (
    <div className="px-4 md:px-8 pb-10">
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/30">
                {[
                  "Name",
                  "Angehöriger",
                  "Status",
                  "Schweregrad",
                  "Pflegefachkraft",
                  "Prozessstatus",
                  "Re-Assessment",
                  "Offene Tasks",
                  "Letzte Aktivität",
                ].map((col) => (
                  <th key={col} className="px-3 py-2.5 text-left">
                    <button
                      className="inline-flex items-center gap-1 text-[10.5px] text-muted-foreground uppercase tracking-wider whitespace-nowrap"
                      style={{ fontWeight: 500 }}
                    >
                      {col}
                      <ArrowUpDown className="w-3 h-3 opacity-40" />
                    </button>
                  </th>
                ))}
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-12 text-center text-[13px] text-muted-foreground"
                  >
                    Keine Patienten für diesen Filter gefunden.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const st = statusConfig[p.status];
                  const sg = schweregradConfig[p.schweregrad];
                  const isUnassigned = p.pflegefachkraft === "—";
                  const isNichtAbrechenbar =
                    p.abrechnungsStatus === "nicht_abrechenbar";
                  const isReAssessmentSoon =
                    p.reAssessmentTage !== null && p.reAssessmentTage <= 30;

                  return (
                    <tr
                      key={p.id}
                      onClick={() => navigate(`/patienten/${p.id}`)}
                      className={`border-t border-border-light hover:bg-primary/[0.02] transition-colors cursor-pointer group ${
                        isNichtAbrechenbar
                          ? "bg-error-light/20"
                          : isUnassigned
                          ? "bg-warning-light/20"
                          : isReAssessmentSoon
                          ? "bg-info-light/15"
                          : ""
                      }`}
                    >
                      {/* Name */}
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                              isUnassigned
                                ? "bg-warning-light border border-warning/20"
                                : isNichtAbrechenbar
                                ? "bg-error-light border border-error/20"
                                : "bg-gradient-to-br from-primary/10 to-primary/5"
                            }`}
                          >
                            <span
                              className={`text-[11px] ${
                                isUnassigned
                                  ? "text-warning"
                                  : isNichtAbrechenbar
                                  ? "text-error"
                                  : "text-primary"
                              }`}
                              style={{ fontWeight: 600 }}
                            >
                              {p.vorname[0]}
                              {p.nachname[0]}
                            </span>
                          </div>
                          <div>
                            <span
                              className="text-[13px] text-foreground group-hover:text-primary transition-colors"
                              style={{ fontWeight: 500 }}
                            >
                              {p.nachname}, {p.vorname}
                            </span>
                            
                          </div>
                        </div>
                      </td>

                      {/* Angehöriger */}
                      <td className="px-3 py-3">
                        <div
                          className="text-[13px] text-foreground"
                          style={{ fontWeight: 400 }}
                        >
                          {p.angehoeriger.split(" (")[0]}
                        </div>
                        
                      </td>

                      {/* Status chip */}
                      <td className="px-3 py-3">
                        <button
                          onClick={(e) => openStatusModal(p, e)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-[3px] rounded-full text-[11px] transition-all hover:shadow-sm hover:scale-[1.03] active:scale-100 ${st.bg} ${st.text}`}
                          style={{ fontWeight: 500 }}
                          title="Klicken für Statusdetails"
                        >
                          <span
                            className={`w-[5px] h-[5px] rounded-full ${st.dot}`}
                          />
                          {st.label}
                        </button>
                      </td>

                      {/* Schweregrad */}
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-[2px] rounded-md text-[11px] ${sg.bg} ${sg.text}`}
                          style={{ fontWeight: 500 }}
                        >
                          {sg.label}
                        </span>
                      </td>

                      {/* Pflegefachkraft */}
                      <td className="px-3 py-3">
                        <button
                          onClick={(e) => openAssignSidebar(p, e)}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-[4px] transition-all hover:shadow-sm active:scale-[0.98] ${
                            isUnassigned
                              ? "bg-[#FFFBEB] border border-warning/20 hover:border-warning/40"
                              : "hover:bg-secondary/80 border border-transparent hover:border-border"
                          }`}
                          title="Pflegefachkraft zuweisen / ändern"
                        >
                          {isUnassigned ? (
                            <>
                              <AlertTriangle className="w-3 h-3 text-warning shrink-0" />
                              <span
                                className="text-[12px] text-warning"
                                style={{ fontWeight: 500 }}
                              >
                                Nicht zugewiesen
                              </span>
                            </>
                          ) : (
                            <>
                              <div className="w-6 h-6 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                                <span
                                  className="text-[9px] text-muted-foreground"
                                  style={{ fontWeight: 600 }}
                                >
                                  {p.pflegefachkraftInitialen}
                                </span>
                              </div>
                              <span
                                className="text-[12px] text-foreground"
                                style={{ fontWeight: 400 }}
                              >
                                {p.pflegefachkraft}
                              </span>
                            </>
                          )}
                          <ChevronDown className="w-3 h-3 text-muted-foreground/50 shrink-0 ml-0.5" />
                        </button>
                      </td>

                      {/* Prozessstatus */}
                      <td className="px-3 py-3">
                        {p.prozessStatus ? (
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5">
                              {p.prozessStatus.ueberfaellig ? (
                                <AlertTriangle className="w-3 h-3 text-error shrink-0" />
                              ) : (
                                <Clock className="w-3 h-3 text-muted-foreground shrink-0" />
                              )}
                              <span
                                className={`text-[12px] ${
                                  p.prozessStatus.ueberfaellig
                                    ? "text-error"
                                    : "text-foreground"
                                }`}
                                style={{ fontWeight: p.prozessStatus.ueberfaellig ? 500 : 400 }}
                              >
                                {p.prozessStatus.naechsteAufgabe}
                              </span>
                            </div>
                            <span
                              className={`text-[10.5px] ml-[18px] ${
                                p.prozessStatus.ueberfaellig
                                  ? "text-error/70"
                                  : "text-muted-foreground"
                              }`}
                              style={{ fontWeight: p.prozessStatus.ueberfaellig ? 500 : 400 }}
                            >
                              {p.prozessStatus.ueberfaellig ? "Überfällig · " : "Fällig "}
                              {p.prozessStatus.faelligDatum}
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-success" style={{ fontWeight: 500 }}>
                            <CheckCircle2 className="w-3 h-3" />
                            Keine offenen Aufgaben
                          </span>
                        )}
                      </td>

                      {/* Re-Assessment Countdown */}
                      <td className="px-3 py-3">
                        {p.reAssessmentTage !== null ? (
                          <div className="flex items-center gap-2">
                            <div
                              className={`text-[13px] ${
                                p.reAssessmentTage <= 14
                                  ? "text-error"
                                  : p.reAssessmentTage <= 30
                                  ? "text-warning"
                                  : "text-foreground"
                              }`}
                              style={{ fontWeight: 600 }}
                            >
                              {p.reAssessmentTage}d
                            </div>
                            <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  p.reAssessmentTage <= 14
                                    ? "bg-error"
                                    : p.reAssessmentTage <= 30
                                    ? "bg-warning"
                                    : "bg-success"
                                }`}
                                style={{
                                  width: `${Math.max(
                                    5,
                                    Math.min(
                                      100,
                                      ((90 - p.reAssessmentTage) / 90) * 100
                                    )
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">
                            —
                          </span>
                        )}
                      </td>

                      {/* Offene Action Tasks */}
                      <td className="px-3 py-3 text-center">
                        {p.offeneActionTasks > 0 ? (
                          <span
                            className="inline-flex items-center justify-center min-w-[22px] h-[22px] rounded-lg bg-warning-light text-warning-foreground text-[11px]"
                            style={{ fontWeight: 600 }}
                          >
                            {p.offeneActionTasks}
                          </span>
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-success mx-auto" />
                        )}
                      </td>

                      {/* Letzte Aktivität */}
                      <td className="px-3 py-3">
                        <span
                          className="text-[12px] text-muted-foreground"
                          style={{ fontWeight: 400 }}
                        >
                          {p.letzteAktivitaet}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-3">
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 rounded-lg hover:bg-secondary transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border-light text-[12px] text-muted-foreground">
          <span>
            1–{filtered.length} von {filtered.length} Patienten
          </span>
          <div className="flex items-center gap-1">
            <button
              className="p-1.5 rounded-lg border border-border hover:bg-secondary transition-colors opacity-40 cursor-not-allowed"
              disabled
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              className="min-w-[28px] h-[28px] rounded-lg text-[12px] bg-primary text-primary-foreground"
              style={{ fontWeight: 500 }}
            >
              1
            </button>
            <button
              className="p-1.5 rounded-lg border border-border hover:bg-secondary transition-colors opacity-40 cursor-not-allowed"
              disabled
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}