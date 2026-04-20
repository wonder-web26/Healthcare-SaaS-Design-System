import React, { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  Search,
  Plus,
  ArrowUpDown,
  ExternalLink,
  AlertCircle,
  Users,
  UserPlus,
  FileWarning,
  XCircle,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronDown,
  X,
  Check,
} from "lucide-react";
import {
  angehoerige,
  qualifikationConfig,
  type Angehoeriger,
} from "./angehoerigeData";

/* ── Views ──────────────────────────────── */
type ViewKey = "alle" | "meine" | "aufmerksamkeit" | "srk_offen" | "im_onboarding";

const CURRENT_USER_PFK = "Sandra Weber";

function viewFilter(list: Angehoeriger[], view: ViewKey): Angehoeriger[] {
  switch (view) {
    case "meine":
      return list.filter((a) => a.pflegefachkraft === CURRENT_USER_PFK);
    case "aufmerksamkeit":
      return list.filter((a) =>
        a.monatsSchritt.ueberfaellig ||
        hasHRIssue(a) ||
        isBillingBlocked(a) ||
        (a.qualifikation === "ohne_srk" && !a.srkKursDatum)
      );
    case "srk_offen":
      return list.filter((a) => a.qualifikation === "ohne_srk" && !a.srkKursDatum);
    case "im_onboarding":
      return list.filter((a) => a.status === "in_onboarding");
    default:
      return list;
  }
}

const viewTabs: { id: ViewKey; label: string; icon: React.ElementType }[] = [
  { id: "alle", label: "Alle Angehörigen", icon: Users },
  { id: "meine", label: "Meine Angehörigen", icon: Users },
  { id: "aufmerksamkeit", label: "Aufmerksamkeit nötig", icon: AlertCircle },
  { id: "srk_offen", label: "SRK offen", icon: GraduationCap },
  { id: "im_onboarding", label: "Im Onboarding", icon: UserPlus },
];

function hasHRIssue(a: Angehoeriger): boolean {
  return (
    !a.hrCheck.bankdaten ||
    !a.hrCheck.kinderzulagen ||
    a.hrCheck.quellensteuerTarif === null
  );
}

function isBillingBlocked(a: Angehoeriger): boolean {
  return a.billingReadiness === "nicht_abrechenbar";
}

/* ── Filter chip definitions ─────────────── */
interface FilterDef {
  id: string;
  label: string;
  options: { value: string; label: string }[];
}

function buildFilterDefs(): FilterDef[] {
  const pflegefachkraefte = Array.from(
    new Set(angehoerige.map((a) => a.pflegefachkraft))
  ).sort();

  const stepLabels = Array.from(
    new Set(
      angehoerige
        .filter((a) => !a.monatsSchritt.abgeschlossen)
        .map((a) => a.monatsSchritt.label)
    )
  ).sort();

  return [
    {
      id: "qualifikation",
      label: "Qualifikation",
      options: [
        { value: "ohne_srk", label: "ohne SRK" },
        { value: "srk", label: "SRK" },
        { value: "fage_dipl", label: "FaGe / Dipl" },
      ],
    },
    {
      id: "monatsschritt",
      label: "Monatsschritt",
      options: [
        ...stepLabels.map((s) => ({ value: `step:${s}`, label: s })),
        { value: "meta:ueberfaellig", label: "Schritt überfällig" },
        { value: "meta:abgeschlossen", label: "Alle Schritte erledigt" },
      ],
    },
    {
      id: "monatsschritt_status",
      label: "Monatsschritt-Status",
      options: [
        { value: "ueberfaellig", label: "Überfällig" },
        { value: "heute", label: "Heute fällig" },
        { value: "diese_woche", label: "Diese Woche fällig" },
        { value: "spaeter", label: "Später" },
      ],
    },
    {
      id: "pflegefachkraft",
      label: "Pflegefachkraft",
      options: [
        ...pflegefachkraefte.map((pf) => ({ value: pf, label: pf })),
        { value: "__nicht_zugewiesen", label: "Nicht zugewiesen" },
      ],
    },
    {
      id: "srk_status",
      label: "SRK-Kurs-Status",
      options: [
        { value: "ausstehend", label: "Ausstehend" },
        { value: "absolviert", label: "Absolviert" },
        { value: "nicht_erforderlich", label: "Nicht erforderlich" },
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
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
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
        <ChevronDown
          className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""} ${hasSelection ? "text-primary" : "text-muted-foreground/50"}`}
        />
      </button>

      {open && (
        <div className="absolute top-full mt-1.5 left-0 z-50 min-w-[210px] bg-card border border-border rounded-xl shadow-lg py-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
          <div
            className="px-3 py-1.5 text-[10.5px] text-muted-foreground uppercase tracking-wider"
            style={{ fontWeight: 500 }}
          >
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
                  {isChecked && (
                    <Check className="w-2.5 h-2.5 text-primary-foreground" />
                  )}
                </div>
                <span
                  className={
                    isChecked ? "text-foreground" : "text-muted-foreground"
                  }
                >
                  {opt.label}
                </span>
              </button>
            );
          })}
          {hasSelection && (
            <div className="border-t border-border-light mt-1 pt-1 px-3">
              <button
                onClick={() => {
                  onChange(new Set());
                  setOpen(false);
                }}
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

/* ══════════════════════════════════════════
   KPI STRIP
   ══════════════════════════════════════════ */
function KPIStrip() {
  const aktiv = angehoerige.filter((a) => a.status === "aktiv").length;
  const onboarding = angehoerige.filter(
    (a) => a.status === "in_onboarding"
  ).length;
  const hrFehler = angehoerige.filter((a) => hasHRIssue(a)).length;
  const nichtAbrechenbar = angehoerige.filter(
    (a) => a.billingReadiness === "nicht_abrechenbar"
  ).length;

  const kpis = [
    {
      label: "Aktiv",
      value: aktiv,
      icon: Users,
      iconColor: "text-success",
      bgColor: "bg-success-light",
    },
    {
      label: "In Onboarding",
      value: onboarding,
      icon: UserPlus,
      iconColor: "text-warning",
      bgColor: "bg-warning-light",
    },
    {
      label: "Mit HR-Fehler",
      value: hrFehler,
      icon: FileWarning,
      iconColor: "text-warning",
      bgColor: "bg-warning-light",
    },
    {
      label: "Nicht abrechenbar",
      value: nichtAbrechenbar,
      icon: XCircle,
      iconColor: "text-error",
      bgColor: "bg-error-light",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <div
            key={kpi.label}
            className="bg-card rounded-xl border border-border px-4 py-3 flex items-center gap-3"
          >
            <div
              className={`w-9 h-9 rounded-lg ${kpi.bgColor} flex items-center justify-center shrink-0`}
            >
              <Icon className={`w-4 h-4 ${kpi.iconColor}`} />
            </div>
            <div>
              <div
                className="text-[20px] text-foreground"
                style={{ fontWeight: 600, lineHeight: "1.2" }}
              >
                {kpi.value}
              </div>
              <div
                className="text-[11px] text-muted-foreground"
                style={{ fontWeight: 400 }}
              >
                {kpi.label}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════
   ANGEHÖRIGE ÜBERSICHT PAGE
   ══════════════════════════════════════════ */
export function AngehoerigePage() {
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

  const removeFilterTag = (filterId: string, value: string) => {
    const sel = chipFilters[filterId] || new Set();
    const next = new Set(sel);
    next.delete(value);
    updateChipFilter(filterId, next);
  };

  useEffect(() => {
    if (!filterPopoverOpen) return;
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterPopoverOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [filterPopoverOpen]);

  /* ── Derived: filter defs ──────────────── */
  const filterDefs = useMemo(() => buildFilterDefs(), []);

  /* ── Active filter tags for display ─────── */
  const activeFilterTags = useMemo(() => {
    const tags: {
      filterId: string;
      filterLabel: string;
      value: string;
      displayLabel: string;
    }[] = [];
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

  /* ── Combined filtering ────────────────── */
  const filtered = useMemo(() => {
    let list = viewFilter(angehoerige, activeView);

    // Qualifikation chip
    const qf = chipFilters.qualifikation;
    if (qf && qf.size > 0) list = list.filter((a) => qf.has(a.qualifikation));

    // Monatsschritt chip
    const ms = chipFilters.monatsschritt;
    if (ms && ms.size > 0) {
      list = list.filter((a) => {
        // Check step-label matches
        if (ms.has(`step:${a.monatsSchritt.label}`)) return true;
        // Check meta filters
        if (ms.has("meta:ueberfaellig") && a.monatsSchritt.ueberfaellig)
          return true;
        if (ms.has("meta:abgeschlossen") && a.monatsSchritt.abgeschlossen)
          return true;
        return false;
      });
    }

    // Pflegefachkraft chip
    const pf = chipFilters.pflegefachkraft;
    if (pf && pf.size > 0) {
      list = list.filter((a) => {
        if (pf.has("__nicht_zugewiesen") && a.pflegefachkraft === "—") return true;
        if (pf.has(a.pflegefachkraft)) return true;
        return false;
      });
    }

    // SRK status
    const srk = chipFilters.srk_status;
    if (srk && srk.size > 0) {
      list = list.filter((a) => {
        if (srk.has("ausstehend") && a.qualifikation === "ohne_srk" && !a.srkKursDatum) return true;
        if (srk.has("absolviert") && a.srkKursDatum) return true;
        if (srk.has("nicht_erforderlich") && a.qualifikation !== "ohne_srk" && !a.srkKursDatum) return true;
        return false;
      });
    }

    // Text search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          `${a.vorname} ${a.nachname}`.toLowerCase().includes(q) ||
          `${a.nachname} ${a.vorname}`.toLowerCase().includes(q) ||
          a.obNummer.toLowerCase().includes(q) ||
          a.id.toLowerCase().includes(q) ||
          a.zugeordnetePatientenList.some((p) =>
            p.name.toLowerCase().includes(q)
          )
      );
    }
    return list;
  }, [activeView, search, chipFilters]);

  return (
    <>
      <div className="flex flex-col lg:flex-row h-full overflow-hidden">
        {/* ── LEFT: Views-Rail (desktop) ───── */}
        <div className="hidden lg:block w-[200px] shrink-0 border-r border-border-light bg-[#FAFBFC] overflow-y-auto" style={{ padding: "20px 12px" }}>
          <div className="text-[10.5px] text-muted-foreground uppercase tracking-wider px-2 pb-2" style={{ fontWeight: 500, letterSpacing: "0.08em" }}>
            Ansichten
          </div>
          {viewTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeView === tab.id;
            const cnt = viewFilter(angehoerige, tab.id).length;
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
            const cnt = viewFilter(angehoerige, tab.id).length;
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
                  Angehörige
                </h1>
                <div className="text-[12.5px] text-muted-foreground mt-[3px]">
                  {filtered.length} von {angehoerige.length} Angehörige
                </div>
              </div>
              <button
                onClick={() => navigate("/onboarding/neu")}
                className="inline-flex items-center gap-1.5 shrink-0 rounded-[10px] bg-primary text-primary-foreground hover:bg-primary-hover transition-colors cursor-pointer"
                style={{ padding: "8px 13px", fontSize: 12.5, fontWeight: 500 }}
              >
                <Plus className="w-[13px] h-[13px]" />
                <span className="hidden sm:inline">Neuen Angehörigen anlegen</span>
              </button>
            </div>

            {/* Filter bar */}
            <div className="flex items-center gap-2 flex-wrap relative">
              <div className="flex items-center gap-2 bg-background rounded-xl px-3 py-[6px] border border-border-light flex-1 sm:flex-none sm:min-w-[220px] sm:max-w-[300px]">
                <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Angehörige suchen…"
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
      <div className="px-4 md:px-8 pb-10 pt-4">
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-primary/[0.03]">
                  {[
                    "Name",
                    "Zugeordnete Patienten",
                    "Pflegefachkraft",
                    "Qualifikation",
                    "SRK Kurs Datum",
                    "Monatsschritt",
                    "Letzte Mutation",
                  ].map((col) => (
                    <th key={col} className="px-3 py-2.5 text-left">
                      <button
                        className="inline-flex items-center gap-1 text-[10.5px] text-primary/70 uppercase tracking-wider whitespace-nowrap"
                        style={{ fontWeight: 600 }}
                      >
                        {col}
                        <ArrowUpDown className="w-3 h-3 opacity-30" />
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-12 text-center text-[13px] text-muted-foreground"
                    >
                      Keine Angehörigen für diesen Filter gefunden.
                    </td>
                  </tr>
                ) : (
                  filtered.map((a) => {
                    const qc = qualifikationConfig[a.qualifikation];
                    const hrIssue = hasHRIssue(a);
                    const blocked = isBillingBlocked(a);

                    return (
                      <tr
                        key={a.id}
                        onClick={() => navigate(`/angehoerige/${a.id}`)}
                        className={`border-t border-border-light hover:bg-primary/[0.02] transition-colors cursor-pointer group ${
                          blocked
                            ? "bg-error-light/20"
                            : hrIssue
                            ? "bg-warning-light/20"
                            : ""
                        }`}
                      >
                        {/* ── 1. Name ─────────────── */}
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                blocked
                                  ? "bg-error-light border border-error/20"
                                  : hrIssue
                                  ? "bg-warning-light border border-warning/20"
                                  : "bg-gradient-to-br from-primary/10 to-primary/5"
                              }`}
                            >
                              <span
                                className={`text-[11px] ${
                                  blocked
                                    ? "text-error"
                                    : hrIssue
                                    ? "text-warning"
                                    : "text-primary"
                                }`}
                                style={{ fontWeight: 600 }}
                              >
                                {a.vorname[0]}
                                {a.nachname[0]}
                              </span>
                            </div>
                            <div>
                              <span
                                className="text-[13px] text-foreground group-hover:text-primary transition-colors"
                                style={{ fontWeight: 500 }}
                              >
                                {a.nachname}, {a.vorname}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* ── 2. Zugeordnete Patienten ── */}
                        <td className="px-3 py-3">
                          {a.zugeordnetePatientenList.length === 0 ? (
                            <span className="text-[11px] text-muted-foreground italic">
                              Keine Zuordnung
                            </span>
                          ) : (
                            <div className="flex flex-col gap-0.5">
                              {a.zugeordnetePatientenList
                                .slice(0, 2)
                                .map((p) => (
                                  <button
                                    key={p.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/patienten/${p.id}`);
                                    }}
                                    className="inline-flex items-center gap-1 text-[12px] text-primary/80 hover:text-primary transition-colors text-left"
                                    style={{ fontWeight: 400 }}
                                  >
                                    <ExternalLink className="w-3 h-3 shrink-0 opacity-50" />
                                    {p.name}
                                  </button>
                                ))}
                              {a.zugeordnetePatientenList.length > 2 && (
                                <span
                                  className="text-[10.5px] text-muted-foreground"
                                  style={{ fontWeight: 500 }}
                                >
                                  +{a.zugeordnetePatientenList.length - 2}{" "}
                                  weitere
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* ── 3. Pflegefachkraft ─────── */}
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                              <span
                                className="text-[9px] text-muted-foreground"
                                style={{ fontWeight: 600 }}
                              >
                                {a.pflegefachkraftInitialen}
                              </span>
                            </div>
                            <span
                              className="text-[12px] text-foreground"
                              style={{ fontWeight: 400 }}
                            >
                              {a.pflegefachkraft}
                            </span>
                          </div>
                        </td>

                        {/* ── 4. Qualifikation ─────── */}
                        <td className="px-3 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-[2px] rounded-md text-[11px] ${qc.bg} ${qc.text}`}
                            style={{ fontWeight: 500 }}
                          >
                            {qc.label}
                          </span>
                        </td>

                        {/* ── 5. SRK Kurs Datum ────── */}
                        <td className="px-3 py-3">
                          {a.srkKursDatum ? (
                            <div className="flex items-center gap-1.5">
                              <GraduationCap className="w-3.5 h-3.5 text-success shrink-0" />
                              <span
                                className="text-[12px] text-foreground"
                                style={{ fontWeight: 400 }}
                              >
                                {new Date(
                                  a.srkKursDatum
                                ).toLocaleDateString("de-CH", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                          ) : a.qualifikation === "ohne_srk" ? (
                            <span
                              className="inline-flex items-center gap-1 text-[11px] text-warning"
                              style={{ fontWeight: 500 }}
                            >
                              <AlertCircle className="w-3.5 h-3.5" />
                              Ausstehend
                            </span>
                          ) : (
                            <span className="text-[11px] text-muted-foreground italic">
                              n/a
                            </span>
                          )}
                        </td>

                        {/* ── 6. Monatsschritt ─────── */}
                        <td className="px-3 py-3">
                          {(() => {
                            const ms = a.monatsSchritt;
                            const pct = Math.round(
                              ((ms.abgeschlossen
                                ? ms.total
                                : ms.aktuell - 1) /
                                ms.total) *
                                100
                            );
                            return (
                              <div className="min-w-[130px]">
                                <div className="flex items-center gap-1.5 mb-1">
                                  {ms.abgeschlossen ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                                  ) : ms.ueberfaellig ? (
                                    <AlertTriangle className="w-3.5 h-3.5 text-error shrink-0" />
                                  ) : (
                                    <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                                  )}
                                  <span
                                    className={`text-[12px] truncate ${
                                      ms.abgeschlossen
                                        ? "text-success-foreground"
                                        : ms.ueberfaellig
                                        ? "text-error"
                                        : "text-foreground"
                                    }`}
                                    style={{ fontWeight: 500 }}
                                  >
                                    {ms.label}
                                  </span>
                                </div>
                                {/* Progress bar */}
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-[4px] bg-muted rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all ${
                                        ms.abgeschlossen
                                          ? "bg-success"
                                          : ms.ueberfaellig
                                          ? "bg-error"
                                          : "bg-primary"
                                      }`}
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                  <span
                                    className="text-[10px] text-muted-foreground shrink-0 tabular-nums"
                                    style={{ fontWeight: 500 }}
                                  >
                                    {ms.abgeschlossen ? ms.total : ms.aktuell}/
                                    {ms.total}
                                  </span>
                                </div>
                                {ms.faellig && !ms.abgeschlossen && (
                                  <div
                                    className={`text-[10px] mt-0.5 ${
                                      ms.ueberfaellig
                                        ? "text-error"
                                        : "text-muted-foreground"
                                    }`}
                                    style={{ fontWeight: 400 }}
                                  >
                                    {ms.ueberfaellig
                                      ? "Überfällig"
                                      : `Fällig ${ms.faellig}`}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </td>

                        {/* ── 7. Letzte Mutation ───── */}
                        <td className="px-3 py-3">
                          <div>
                            <span
                              className="text-[12px] text-foreground"
                              style={{ fontWeight: 400 }}
                            >
                              {a.letzteMutationDatum}
                            </span>
                            <div
                              className="text-[10.5px] text-muted-foreground"
                              style={{ fontWeight: 400 }}
                            >
                              {a.letzteMutationUser}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ─────────────────── */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-border-light text-[12px] text-muted-foreground">
            <span>
              1–{filtered.length} von {filtered.length} Angehörige
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
      </div>
        </div>
      </div>
    </>
  );
}
