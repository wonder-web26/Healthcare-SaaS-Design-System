import React, { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
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

/* ── Primary Work-Mode Tabs ──────────────── */
type WorkMode =
  | "alle"
  | "meine"
  | "nicht_zugewiesen"
  | "aufmerksamkeit"
  | "reassessment";

const CURRENT_USER_NAME = "Sandra Weber"; // simulate logged-in user

function workModeFilter(list: Patient[], mode: WorkMode): Patient[] {
  switch (mode) {
    case "meine":
      return list.filter((p) => p.pflegefachkraft === CURRENT_USER_NAME);
    case "nicht_zugewiesen":
      return list.filter((p) => p.pflegefachkraft === "—");
    case "aufmerksamkeit":
      return list.filter(
        (p) =>
          p.pflegefachkraft === "—" ||
          p.status === "nicht_abrechenbar" ||
          (p.prozessStatus?.ueberfaellig === true)
      );
    case "reassessment":
      return list.filter(
        (p) => p.reAssessmentTage !== null && p.reAssessmentTage <= 30
      );
    default:
      return list;
  }
}

const workModeTabs: {
  id: WorkMode;
  label: string;
  icon: React.ElementType;
}[] = [
  { id: "alle", label: "Alle Patienten", icon: Users },
  { id: "meine", label: "Meine Patienten", icon: Users },
  { id: "nicht_zugewiesen", label: "Nicht zugewiesen", icon: UserX },
  { id: "aufmerksamkeit", label: "Aufmerksamkeit nötig", icon: AlertCircle },
  { id: "reassessment", label: "Re-Assessment fällig", icon: CalendarClock },
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
  const [activeWorkMode, setActiveWorkMode] = useState<WorkMode>("alle");
  const [search, setSearch] = useState("");
  const [assignmentOverrides, setAssignmentOverrides] = useState<
    Record<string, { name: string; initialen: string }>
  >({});
  const [statusModal, setStatusModal] = useState<{
    open: boolean;
    patient: Patient | null;
  }>({ open: false, patient: null });

  /* ── Multi-select chip filter state ─────── */
  const [chipFilters, setChipFilters] = useState<Record<string, Set<string>>>({
    schweregrad: new Set(),
    pflegefachkraft: new Set(),
    region: new Set(),
    sprache: new Set(),
    prozessstatus: new Set(),
  });

  const updateChipFilter = (id: string, next: Set<string>) => {
    setChipFilters((prev) => ({ ...prev, [id]: next }));
  };

  const clearAllChipFilters = () => {
    setChipFilters({
      schweregrad: new Set(),
      pflegefachkraft: new Set(),
      region: new Set(),
      sprache: new Set(),
      prozessstatus: new Set(),
    });
  };

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
    let list = workModeFilter(patients, activeWorkMode);

    // Apply chip filters
    const sg = chipFilters.schweregrad;
    if (sg.size > 0) list = list.filter((p) => sg.has(p.schweregrad));

    const pf = chipFilters.pflegefachkraft;
    if (pf.size > 0) list = list.filter((p) => pf.has(p.pflegefachkraft));

    const rg = chipFilters.region;
    if (rg.size > 0) list = list.filter((p) => rg.has(p.kanton));

    const sp = chipFilters.sprache;
    if (sp.size > 0) list = list.filter((p) => sp.has(p.sprache));

    const ps = chipFilters.prozessstatus;
    if (ps.size > 0) {
      list = list.filter((p) => {
        if (ps.has("ueberfaellig") && p.prozessStatus?.ueberfaellig) return true;
        if (ps.has("anstehend") && p.prozessStatus && !p.prozessStatus.ueberfaellig) return true;
        if (ps.has("erledigt") && p.prozessStatus === null) return true;
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
  }, [activeWorkMode, search, chipFilters, patients]);

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
      {/* ── Page Header ──────────────────── */}
      <div className="px-8 pt-7 pb-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-foreground">Patienten</h2>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              {patients.length} Patienten · Operative Übersicht aller Mandate
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="inline-flex items-center gap-1.5 px-3 py-[7px] text-[12px] rounded-xl border border-border bg-card hover:bg-secondary/60 transition-colors"
              style={{ fontWeight: 500 }}
            >
              <Download className="w-3.5 h-3.5 text-muted-foreground" />
              Export
            </button>
            <button
              onClick={() => navigate("/onboarding")}
              className="inline-flex items-center gap-1.5 px-3 py-[7px] text-[12px] rounded-xl bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm transition-colors"
              style={{ fontWeight: 500 }}
            >
              <Plus className="w-3.5 h-3.5" />
              Patient anlegen
            </button>
          </div>
        </div>
      </div>

      {/* ── Work-Mode Tabs ────────────────── */}
      <div className="px-8 pt-5 pb-0">
        <div className="flex gap-1.5 overflow-x-auto">
          {workModeTabs.map((tab) => {
            const isActive = activeWorkMode === tab.id;
            const cnt = workModeFilter(patients, tab.id).length;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveWorkMode(tab.id)}
                className={`flex items-center gap-1.5 px-2.5 py-[5px] rounded-lg text-[12px] border transition-all whitespace-nowrap ${
                  isActive
                    ? "border-primary/20 bg-primary-light text-primary"
                    : "border-border bg-card text-muted-foreground hover:bg-secondary/60"
                }`}
                style={{ fontWeight: isActive ? 500 : 400 }}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
                <span
                  className={`text-[10px] px-[5px] py-[1px] rounded-md ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                  style={{ fontWeight: 600 }}
                >
                  {cnt}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Search + Filter Chips ─────────── */}
      <div className="px-8 pt-3 pb-0">
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Search field */}
          <div className="flex items-center gap-2 bg-background rounded-xl px-3 py-[6px] border border-border-light min-w-[220px] max-w-[300px]">
            <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Patienten suchen…"
              className="bg-transparent outline-none text-[12px] flex-1 placeholder:text-muted-foreground/50"
              style={{ fontWeight: 400 }}
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Divider */}
          <div className="w-px h-5 bg-border" />

          {/* Filter chips */}
          {filterDefs.map((def) => (
            <FilterChipPopover
              key={def.id}
              def={def}
              selected={chipFilters[def.id] || new Set()}
              onChange={(next) => updateChipFilter(def.id, next)}
            />
          ))}
        </div>
      </div>

      {/* ── Active Filter Tags ───────────── */}
      {hasAnyChipFilter && (
        <div className="px-8 pt-2.5 pb-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            {activeFilterTags.map((tag) => (
              <span
                key={`${tag.filterId}-${tag.value}`}
                className="inline-flex items-center gap-1 px-2 py-[3px] rounded-lg bg-primary/8 border border-primary/15 text-[11px] text-primary"
                style={{ fontWeight: 450 }}
              >
                <span className="text-primary/60">{tag.filterLabel}:</span>
                {tag.displayLabel}
                <button
                  onClick={() => removeFilterTag(tag.filterId, tag.value)}
                  className="ml-0.5 hover:bg-primary/10 rounded p-0.5 transition-colors"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
            <button
              onClick={clearAllChipFilters}
              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors px-1.5 py-[3px]"
              style={{ fontWeight: 450 }}
            >
              Alle zurücksetzen
            </button>
          </div>
        </div>
      )}

      {/* ── Spacer before table ──────────── */}
      <div className="pt-4" />

      {/* ── Content ──────────────────────── */}
      <TableView
        patients={filtered}
        navigate={navigate}
        openStatusModal={openStatusModal}
        openAssignSidebar={openAssignSidebar}
        totalCount={patients.length}
      />

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
    <div className="px-8 pb-10">
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