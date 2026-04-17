import React, { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
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

/* ── Status filter tabs ──────────────────── */
type FilterKey = "alle" | "in_onboarding" | "aktiv" | "fehlende_dokumente";

const filterTabs: {
  id: FilterKey;
  label: string;
  dotColor?: string;
}[] = [
  { id: "alle", label: "Alle" },
  { id: "in_onboarding", label: "In Onboarding", dotColor: "bg-warning" },
  { id: "aktiv", label: "Aktiv", dotColor: "bg-success" },
  {
    id: "fehlende_dokumente",
    label: "Fehlende Dokumente",
    dotColor: "bg-error",
  },
];

/* ── Helpers ─────────────────────────────── */
function filterList(list: Angehoeriger[], key: FilterKey): Angehoeriger[] {
  switch (key) {
    case "in_onboarding":
      return list.filter((a) => a.status === "in_onboarding");
    case "aktiv":
      return list.filter((a) => a.status === "aktiv");
    case "fehlende_dokumente":
      return list.filter((a) => a.status === "fehlende_dokumente");
    default:
      return list;
  }
}

function countFor(key: FilterKey): number {
  return filterList(angehoerige, key).length;
}

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

  // Collect unique step labels from monatsSchritt data
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
      id: "pflegefachkraft",
      label: "Pflegefachkraft",
      options: pflegefachkraefte.map((pf) => ({ value: pf, label: pf })),
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
  const [activeFilter, setActiveFilter] = useState<FilterKey>("alle");
  const [search, setSearch] = useState("");

  /* ── Multi-select chip filter state ─────── */
  const [chipFilters, setChipFilters] = useState<Record<string, Set<string>>>({
    qualifikation: new Set(),
    monatsschritt: new Set(),
    pflegefachkraft: new Set(),
  });

  const updateChipFilter = (id: string, next: Set<string>) => {
    setChipFilters((prev) => ({ ...prev, [id]: next }));
  };

  const clearAllChipFilters = () => {
    setChipFilters({
      qualifikation: new Set(),
      monatsschritt: new Set(),
      pflegefachkraft: new Set(),
    });
  };

  const removeFilterTag = (filterId: string, value: string) => {
    setChipFilters((prev) => {
      const next = new Set(prev[filterId]);
      next.delete(value);
      return { ...prev, [filterId]: next };
    });
  };

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
    let list = filterList(angehoerige, activeFilter);

    // Qualifikation chip
    const qf = chipFilters.qualifikation;
    if (qf.size > 0) list = list.filter((a) => qf.has(a.qualifikation));

    // Monatsschritt chip
    const ms = chipFilters.monatsschritt;
    if (ms.size > 0) {
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
    if (pf.size > 0) list = list.filter((a) => pf.has(a.pflegefachkraft));

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
  }, [activeFilter, search, chipFilters]);

  return (
    <>
      {/* ── Page Header ──────────────────── */}
      <div className="px-8 pt-7 pb-0">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-foreground">
              Angehörige – Operative HR-Übersicht
            </h2>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              {angehoerige.length} pflegende Angehörige · Personalverwaltung &
              Abrechnungsstatus
            </p>
          </div>
          <button
            onClick={() => navigate("/onboarding/neu")}
            className="inline-flex items-center gap-1.5 px-3.5 py-[7px] text-[12px] rounded-xl bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm transition-colors whitespace-nowrap"
            style={{ fontWeight: 500 }}
          >
            <Plus className="w-3.5 h-3.5" />
            Neuen Angehörigen anlegen
          </button>
        </div>
      </div>

      {/* ── KPI Strip ────────────────────── */}
      <div className="px-8 pt-5">
        <KPIStrip />
      </div>

      {/* ── Status Filter Tabs ───────────── */}
      <div className="px-8 pt-5 pb-0">
        <div className="flex gap-1.5 overflow-x-auto">
          {filterTabs.map((tab) => {
            const isActive = activeFilter === tab.id;
            const cnt = countFor(tab.id);
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-[6px] rounded-lg text-[12px] border transition-all whitespace-nowrap ${
                  isActive
                    ? "border-primary/20 bg-primary-light text-primary"
                    : "border-border bg-card text-muted-foreground hover:bg-secondary/60"
                }`}
                style={{ fontWeight: isActive ? 500 : 400 }}
              >
                {tab.dotColor && (
                  <span
                    className={`w-[6px] h-[6px] rounded-full ${tab.dotColor}`}
                  />
                )}
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
              placeholder="Name / OB-Nummer suchen…"
              className="bg-transparent outline-none text-[12px] flex-1 placeholder:text-muted-foreground/50"
              style={{ fontWeight: 400 }}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
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

      {/* ── Table ────────────────────────── */}
      <div className="px-8 pb-10">
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
    </>
  );
}
