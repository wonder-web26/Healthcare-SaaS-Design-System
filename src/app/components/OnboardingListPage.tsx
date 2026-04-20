import React, { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Ban,
  ChevronDown,
  FileText,
  ClipboardList,
  FileSignature,
  X,
  Info,
  Users,
  AlertCircle,
  Sparkles,
} from "lucide-react";

/* ══════════════════════════════════════════
   ONBOARDING CASE TYPE
   ══════════════════════════════════════════ */
type OnboardingStatus = "in_erfassung" | "unvollstaendig" | "blockiert";

interface OnboardingCase {
  id: string;
  patientVorname: string;
  patientNachname: string;
  patientId: string;
  angehoeriger: string;
  vertragDatum: string;
  erfasstAm: string;
  status: OnboardingStatus;
  fehlendeDokumente: number;
  fehlendePflichtfelder: number;
  abrechnungsstopp: boolean;
  abrechnungsstoppGrund?: string;
  verantwortlich: string;
  verantwortlichInitialen: string;
  letzteAenderung: string;
  kanton: string;
}

const statusCfg: Record<OnboardingStatus, { label: string; bg: string; text: string; dot: string }> = {
  in_erfassung: { label: "In Erfassung", bg: "bg-info-light", text: "text-info-foreground", dot: "bg-info" },
  unvollstaendig: { label: "Unvollständig", bg: "bg-warning-light", text: "text-warning-foreground", dot: "bg-warning" },
  blockiert: { label: "Blockiert", bg: "bg-error-light", text: "text-error-foreground", dot: "bg-error" },
};

function rowBg(c: OnboardingCase): string {
  if (c.abrechnungsstopp || c.status === "blockiert") return "bg-error/[0.03]";
  if (c.status === "unvollstaendig") return "bg-warning/[0.025]";
  return "";
}

function rowBorder(c: OnboardingCase): string {
  if (c.abrechnungsstopp || c.status === "blockiert") return "border-l-2 border-l-error/40";
  if (c.status === "unvollstaendig") return "border-l-2 border-l-warning/40";
  return "border-l-2 border-l-transparent";
}

/* ── Mock data ── */
const cases: OnboardingCase[] = [
  { id: "OB-2026-001", patientVorname: "Thomas", patientNachname: "Schmid", patientId: "P-2026-0042", angehoeriger: "Lisa Schmid", vertragDatum: "18.02.2026", erfasstAm: "20.02.2026", status: "unvollstaendig", fehlendeDokumente: 4, fehlendePflichtfelder: 2, abrechnungsstopp: false, verantwortlich: "Kathrin Meier", verantwortlichInitialen: "KM", letzteAenderung: "26.02.2026", kanton: "ZH" },
  { id: "OB-2026-002", patientVorname: "Peter", patientNachname: "Hoffmann", patientId: "P-2026-0046", angehoeriger: "Ruth Hoffmann", vertragDatum: "20.02.2026", erfasstAm: "22.02.2026", status: "in_erfassung", fehlendeDokumente: 8, fehlendePflichtfelder: 6, abrechnungsstopp: false, verantwortlich: "Sandra Weber", verantwortlichInitialen: "SW", letzteAenderung: "25.02.2026", kanton: "SG" },
  { id: "OB-2026-003", patientVorname: "Sabine", patientNachname: "Becker", patientId: "P-2026-0045", angehoeriger: "Hans Becker", vertragDatum: "10.02.2026", erfasstAm: "15.02.2026", status: "blockiert", fehlendeDokumente: 2, fehlendePflichtfelder: 0, abrechnungsstopp: true, abrechnungsstoppGrund: "Fehlende Kostengutsprache", verantwortlich: "Sandra Weber", verantwortlichInitialen: "SW", letzteAenderung: "24.02.2026", kanton: "ZH" },
  { id: "OB-2026-004", patientVorname: "Heinrich", patientNachname: "Steiner", patientId: "P-2026-0048", angehoeriger: "Ursula Steiner", vertragDatum: "05.02.2026", erfasstAm: "10.02.2026", status: "blockiert", fehlendeDokumente: 1, fehlendePflichtfelder: 0, abrechnungsstopp: true, abrechnungsstoppGrund: "Kritische Gesundheitslage", verantwortlich: "Laura Brunner", verantwortlichInitialen: "LB", letzteAenderung: "23.02.2026", kanton: "BE" },
  { id: "OB-2026-008", patientVorname: "Lena", patientNachname: "Graf", patientId: "P-2026-0051", angehoeriger: "Martin Graf", vertragDatum: "24.02.2026", erfasstAm: "25.02.2026", status: "in_erfassung", fehlendeDokumente: 11, fehlendePflichtfelder: 9, abrechnungsstopp: false, verantwortlich: "Kathrin Meier", verantwortlichInitialen: "KM", letzteAenderung: "27.02.2026", kanton: "AG" },
  { id: "OB-2026-009", patientVorname: "Fritz", patientNachname: "Huber", patientId: "P-2026-0052", angehoeriger: "Erika Huber", vertragDatum: "15.02.2026", erfasstAm: "18.02.2026", status: "unvollstaendig", fehlendeDokumente: 3, fehlendePflichtfelder: 1, abrechnungsstopp: false, verantwortlich: "Maria Keller", verantwortlichInitialen: "MK", letzteAenderung: "26.02.2026", kanton: "LU" },
  { id: "OB-2026-010", patientVorname: "Rosa", patientNachname: "Ammann", patientId: "P-2026-0053", angehoeriger: "Daniel Ammann", vertragDatum: "26.02.2026", erfasstAm: "27.02.2026", status: "in_erfassung", fehlendeDokumente: 14, fehlendePflichtfelder: 12, abrechnungsstopp: false, verantwortlich: "Sandra Weber", verantwortlichInitialen: "SW", letzteAenderung: "27.02.2026", kanton: "ZH" },
  { id: "OB-2026-011", patientVorname: "Walter", patientNachname: "Frei", patientId: "P-2026-0054", angehoeriger: "Margrit Frei", vertragDatum: "12.02.2026", erfasstAm: "14.02.2026", status: "unvollstaendig", fehlendeDokumente: 1, fehlendePflichtfelder: 0, abrechnungsstopp: false, verantwortlich: "Laura Brunner", verantwortlichInitialen: "LB", letzteAenderung: "27.02.2026", kanton: "ZH" },
];

/* ── Views ── */
type ViewKey = "alle" | "meine" | "blockiert" | "fast_abgeschlossen" | "in_erfassung";
const CURRENT_USER = "Maria Keller";

function viewFilter(list: OnboardingCase[], view: ViewKey): OnboardingCase[] {
  switch (view) {
    case "meine": return list.filter(c => c.verantwortlich === CURRENT_USER);
    case "blockiert": return list.filter(c => c.abrechnungsstopp || c.status === "blockiert");
    case "fast_abgeschlossen": return list.filter(c => c.fehlendeDokumente <= 1 && c.fehlendePflichtfelder === 0 && !c.abrechnungsstopp);
    case "in_erfassung": return list.filter(c => c.status === "in_erfassung");
    default: return list;
  }
}

const viewTabs: { id: ViewKey; label: string; icon: React.ElementType }[] = [
  { id: "alle", label: "Alle Onboardings", icon: ClipboardList },
  { id: "meine", label: "Meine Onboardings", icon: Users },
  { id: "blockiert", label: "Blockiert", icon: Ban },
  { id: "fast_abgeschlossen", label: "Fast abgeschlossen", icon: Sparkles },
  { id: "in_erfassung", label: "In Erfassung", icon: Clock },
];

/* ── Filter defs ── */
const allVerantwortliche = [...new Set(cases.map(c => c.verantwortlich))].sort();
const allKantone = [...new Set(cases.map(c => c.kanton))].sort();

interface FilterDef { id: string; label: string; options: { value: string; label: string }[] }

const filterDefs: FilterDef[] = [
  { id: "status", label: "Status", options: [
    { value: "in_erfassung", label: "In Erfassung" },
    { value: "unvollstaendig", label: "Unvollständig" },
    { value: "blockiert", label: "Blockiert" },
  ]},
  { id: "verantwortlich", label: "Verantwortlich", options: allVerantwortliche.map(v => ({ value: v, label: v })) },
  { id: "kanton", label: "Kanton", options: allKantone.map(k => ({ value: k, label: k })) },
  { id: "blocker", label: "Blocker", options: [
    { value: "ja", label: "Hat offene Blocker" },
    { value: "nein", label: "Ohne Blocker" },
  ]},
];

/* ══════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════ */
export function OnboardingListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeView = (searchParams.get("view") || "meine") as ViewKey;
  const search = searchParams.get("q") || "";
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);
  const [infoDismissed, setInfoDismissed] = useState(() => localStorage.getItem("onboarding_info_dismissed") === "true");
  const filterRef = useRef<HTMLDivElement>(null);

  const setView = (v: ViewKey) => {
    const next = new URLSearchParams(searchParams);
    if (v === "meine") next.delete("view"); else next.set("view", v);
    setSearchParams(next, { replace: true });
  };

  const setSearch = (q: string) => {
    const next = new URLSearchParams(searchParams);
    if (!q) next.delete("q"); else next.set("q", q);
    setSearchParams(next, { replace: true });
  };

  const chipFilters = useMemo(() => {
    const f: Record<string, Set<string>> = {};
    for (const [key, value] of searchParams.entries()) {
      if (["view", "q"].includes(key)) continue;
      f[key] = new Set(value.split(",").filter(Boolean));
    }
    return f;
  }, [searchParams]);

  const updateChipFilter = (id: string, next: Set<string>) => {
    const p = new URLSearchParams(searchParams);
    if (next.size === 0) p.delete(id); else p.set(id, Array.from(next).join(","));
    setSearchParams(p, { replace: true });
  };

  const clearAllFilters = () => {
    const p = new URLSearchParams();
    const v = searchParams.get("view");
    const q = searchParams.get("q");
    if (v) p.set("view", v);
    if (q) p.set("q", q);
    setSearchParams(p, { replace: true });
  };

  useEffect(() => {
    if (!filterPopoverOpen) return;
    const handler = (e: MouseEvent) => { if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterPopoverOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [filterPopoverOpen]);

  const activeFilterTags = useMemo(() => {
    const tags: { filterId: string; filterLabel: string; value: string; displayLabel: string }[] = [];
    filterDefs.forEach(def => {
      const sel = chipFilters[def.id];
      if (!sel) return;
      sel.forEach(val => {
        const opt = def.options.find(o => o.value === val);
        tags.push({ filterId: def.id, filterLabel: def.label, value: val, displayLabel: opt?.label || val });
      });
    });
    return tags;
  }, [chipFilters]);

  const removeFilterTag = (filterId: string, value: string) => {
    const sel = chipFilters[filterId] || new Set();
    const next = new Set(sel);
    next.delete(value);
    updateChipFilter(filterId, next);
  };

  const filtered = useMemo(() => {
    let list = viewFilter(cases, activeView);
    const st = chipFilters.status;
    if (st && st.size > 0) list = list.filter(c => st.has(c.status));
    const vr = chipFilters.verantwortlich;
    if (vr && vr.size > 0) list = list.filter(c => vr.has(c.verantwortlich));
    const kt = chipFilters.kanton;
    if (kt && kt.size > 0) list = list.filter(c => kt.has(c.kanton));
    const bl = chipFilters.blocker;
    if (bl && bl.size > 0) {
      list = list.filter(c => {
        if (bl.has("ja") && c.abrechnungsstopp) return true;
        if (bl.has("nein") && !c.abrechnungsstopp) return true;
        return false;
      });
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.patientNachname.toLowerCase().includes(q) ||
        c.patientVorname.toLowerCase().includes(q) ||
        c.angehoeriger.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeView, search, chipFilters]);

  const blockedCount = cases.filter(c => c.abrechnungsstopp || c.status === "blockiert").length;

  return (
    <>
      <div className="flex flex-col lg:flex-row h-full overflow-hidden">
        {/* ── Views-Rail (desktop) ── */}
        <div className="hidden lg:block w-[200px] shrink-0 border-r border-border-light bg-[#FAFBFC] overflow-y-auto" style={{ padding: "20px 12px" }}>
          <div className="text-[10.5px] text-muted-foreground uppercase tracking-wider px-2 pb-2" style={{ fontWeight: 500, letterSpacing: "0.08em" }}>Ansichten</div>
          {viewTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeView === tab.id;
            const cnt = viewFilter(cases, tab.id).length;
            return (
              <button key={tab.id} onClick={() => setView(tab.id)} className={`w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] text-left mb-0.5 transition-colors cursor-pointer ${isActive ? "bg-primary-light text-primary" : "text-foreground hover:bg-muted/40"}`} style={{ fontWeight: isActive ? 500 : 400 }}>
                <Icon className={`w-[15px] h-[15px] shrink-0 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                <span className="flex-1 truncate">{tab.label}</span>
                <span className="text-[11px] text-muted-foreground" style={{ fontWeight: 500 }}>{cnt}</span>
              </button>
            );
          })}
        </div>

        {/* Mobile views */}
        <div className="lg:hidden flex items-center gap-1 px-3 py-2 border-b border-border-light bg-[#FAFBFC] overflow-x-auto shrink-0">
          {viewTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeView === tab.id;
            return (
              <button key={tab.id} onClick={() => setView(tab.id)} className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] whitespace-nowrap shrink-0 transition-colors cursor-pointer ${isActive ? "bg-primary-light text-primary" : "text-muted-foreground hover:bg-muted/40"}`} style={{ fontWeight: isActive ? 500 : 400 }}>
                <Icon className="w-[14px] h-[14px]" />
                {tab.label}
                <span className="text-[10px] opacity-70">{viewFilter(cases, tab.id).length}</span>
              </button>
            );
          })}
        </div>

        {/* ── Main content ── */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="border-b border-border-light" style={{ padding: "14px 16px 10px" }}>
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <h1 className="text-foreground" style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.015em" }}>Onboarding</h1>
                <div className="text-[12.5px] text-muted-foreground mt-[3px]">
                  {filtered.length} offene Mandate{blockedCount > 0 && <> · <span className="text-error-foreground" style={{ fontWeight: 500 }}>{blockedCount} blockiert</span></>}
                </div>
              </div>
              <button onClick={() => navigate("/onboarding/neu")} className="inline-flex items-center gap-1.5 shrink-0 rounded-[10px] bg-primary text-primary-foreground hover:bg-primary-hover transition-colors cursor-pointer" style={{ padding: "8px 13px", fontSize: 12.5, fontWeight: 500 }}>
                <Plus className="w-[13px] h-[13px]" />
                <span className="hidden sm:inline">Neues Mandat</span>
              </button>
            </div>

            {/* Info hint */}
            {!infoDismissed && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-info-light/40 border border-info/10 mb-2 text-[11px] text-info-foreground">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span className="flex-1">Hier erscheinen Mandate mit unterzeichnetem Vertrag. Nach Abschluss wird das Mandat als Patient aktiviert.</span>
                <button onClick={() => { setInfoDismissed(true); localStorage.setItem("onboarding_info_dismissed", "true"); }} className="shrink-0 p-0.5 cursor-pointer"><X className="w-3 h-3" /></button>
              </div>
            )}

            {/* Filter bar */}
            <div className="flex items-center gap-2 flex-wrap relative">
              <div className="flex items-center gap-2 bg-background rounded-xl px-3 py-[6px] border border-border-light flex-1 sm:flex-none sm:min-w-[220px] sm:max-w-[300px]">
                <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Onboardings suchen…" className="bg-transparent outline-none text-[12px] flex-1 placeholder:text-muted-foreground/50" style={{ fontWeight: 400 }} />
                {search && <button onClick={() => setSearch("")} className="text-muted-foreground hover:text-foreground cursor-pointer"><X className="w-3 h-3" /></button>}
              </div>

              <div className="relative" ref={filterRef}>
                <button onClick={() => setFilterPopoverOpen(o => !o)} className={`inline-flex items-center gap-1.5 px-3 py-[6px] rounded-full border text-[12px] transition-colors cursor-pointer ${filterPopoverOpen ? "border-primary/30 bg-primary-light text-primary" : "border-border bg-card text-muted-foreground hover:bg-secondary/60"}`} style={{ fontWeight: 500 }}>
                  <ChevronDown className="w-3 h-3" /> Filter
                  {activeFilterTags.length > 0 && <span className="w-[5px] h-[5px] rounded-full bg-primary" />}
                </button>
                {filterPopoverOpen && (
                  <div className="absolute top-[calc(100%+6px)] left-0 z-50 bg-card border border-border rounded-xl w-[300px]" style={{ padding: 14, boxShadow: "0 8px 24px rgba(17,24,39,0.08)" }}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[12px] text-foreground" style={{ fontWeight: 600 }}>Filter</span>
                      <button onClick={() => setFilterPopoverOpen(false)} className="text-muted-foreground cursor-pointer"><X className="w-[14px] h-[14px]" /></button>
                    </div>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto">
                      {filterDefs.map(def => (
                        <div key={def.id}>
                          <div className="text-[10.5px] text-muted-foreground uppercase mb-2" style={{ fontWeight: 500, letterSpacing: "0.08em" }}>{def.label}</div>
                          <div className="flex flex-wrap gap-1">
                            {def.options.map(opt => {
                              const sel = chipFilters[def.id] || new Set();
                              const active = sel.has(opt.value);
                              return (
                                <button key={opt.value} onClick={() => { const n = new Set(sel); if (active) n.delete(opt.value); else n.add(opt.value); updateChipFilter(def.id, n); }}
                                  className={`rounded-full text-[11.5px] border transition-colors cursor-pointer ${active ? "border-primary bg-primary-light text-primary" : "border-border bg-card text-muted-foreground hover:bg-secondary/60"}`}
                                  style={{ padding: "4px 10px", fontWeight: active ? 500 : 400 }}>{opt.label}</button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                    {activeFilterTags.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border-light flex justify-end">
                        <button onClick={clearAllFilters} className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer" style={{ fontWeight: 500 }}>Alle zurücksetzen</button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {activeFilterTags.map(tag => (
                <button key={`${tag.filterId}-${tag.value}`} onClick={() => removeFilterTag(tag.filterId, tag.value)} className="inline-flex items-center gap-1 rounded-full bg-primary-light text-primary text-[11.5px] cursor-pointer" style={{ padding: "5px 10px", fontWeight: 500 }}>
                  {tag.filterLabel}: {tag.displayLabel} <X className="w-[11px] h-[11px]" />
                </button>
              ))}
              {activeFilterTags.length > 0 && (
                <button onClick={clearAllFilters} className="text-[11.5px] text-muted-foreground cursor-pointer" style={{ padding: "5px 6px", fontWeight: 500 }}>Alle zurücksetzen</button>
              )}
            </div>
          </div>

          {/* ── Table ── */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-4 md:px-8 pb-10 pt-2">
              <div className="bg-card rounded-2xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/20">
                        {["Patient", "Angehöriger", "Vertrag am", "Kt.", "Status", "Fehl. Dok.", "Fehl. Felder", "Blocker", "Verantwortlich", "Letzte Änderung"].map(col => (
                          <th key={col} className="px-3 py-2.5 text-left whitespace-nowrap">
                            <span className="text-[10.5px] text-muted-foreground uppercase tracking-wider" style={{ fontWeight: 500 }}>{col}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 ? (
                        <tr><td colSpan={10} className="px-4 py-14 text-center"><div className="flex flex-col items-center gap-2"><div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"><FileText className="w-5 h-5 text-muted-foreground" /></div><p className="text-[13px] text-foreground" style={{ fontWeight: 500 }}>Keine Ergebnisse</p><p className="text-[12px] text-muted-foreground">Passen Sie die Filter an oder erstellen Sie ein neues Mandat.</p></div></td></tr>
                      ) : filtered.map(c => {
                        const st = statusCfg[c.status];
                        return (
                          <tr key={c.id} onClick={() => navigate(`/onboarding/${c.id}`)} className={`border-t border-border-light hover:bg-primary/[0.025] transition-colors cursor-pointer group ${rowBg(c)} ${rowBorder(c)}`}>
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/12 to-primary/5 flex items-center justify-center shrink-0">
                                  <span className="text-[10px] text-primary" style={{ fontWeight: 600 }}>{c.patientVorname[0]}{c.patientNachname[0]}</span>
                                </div>
                                <span className="text-[13px] text-foreground group-hover:text-primary transition-colors truncate" style={{ fontWeight: 500 }}>{c.patientNachname}, {c.patientVorname}</span>
                              </div>
                            </td>
                            <td className="px-3 py-3 text-[12px] text-foreground">{c.angehoeriger}</td>
                            <td className="px-3 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <FileSignature className="w-3 h-3 text-success shrink-0" />
                                <span className="text-[12px] text-foreground" style={{ fontWeight: 450 }}>{c.vertragDatum}</span>
                              </div>
                            </td>
                            <td className="px-3 py-3"><span className="text-[12px] text-muted-foreground" style={{ fontWeight: 500 }}>{c.kanton}</span></td>
                            <td className="px-3 py-3">
                              <span className={`inline-flex items-center gap-1.5 px-2 py-[2px] rounded-full text-[11px] ${st.bg} ${st.text}`} style={{ fontWeight: 500 }}>
                                <span className={`w-[5px] h-[5px] rounded-full ${st.dot}`} />{st.label}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-center">
                              {c.fehlendeDokumente > 0 ? (
                                <span className={`inline-flex items-center justify-center min-w-[24px] px-1.5 py-[1px] rounded-md text-[11px] tabular-nums ${c.fehlendeDokumente >= 5 ? "bg-error-light text-error-foreground" : "bg-warning-light text-warning-foreground"}`} style={{ fontWeight: 600 }}>{c.fehlendeDokumente}</span>
                              ) : <CheckCircle2 className="w-4 h-4 text-success mx-auto" />}
                            </td>
                            <td className="px-3 py-3 text-center">
                              {c.fehlendePflichtfelder > 0 ? (
                                <span className={`inline-flex items-center justify-center min-w-[24px] px-1.5 py-[1px] rounded-md text-[11px] tabular-nums ${c.fehlendePflichtfelder >= 5 ? "bg-error-light text-error-foreground" : "bg-warning-light text-warning-foreground"}`} style={{ fontWeight: 600 }}>{c.fehlendePflichtfelder}</span>
                              ) : <CheckCircle2 className="w-4 h-4 text-success mx-auto" />}
                            </td>
                            <td className="px-3 py-3 text-center">
                              {c.abrechnungsstopp ? <span className="inline-flex items-center gap-1 text-[11px] text-error" title={c.abrechnungsstoppGrund}><AlertTriangle className="w-3.5 h-3.5" /></span> : <span className="text-[11px] text-muted-foreground/40">—</span>}
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center shrink-0">
                                  <span className="text-[9px] text-primary" style={{ fontWeight: 600 }}>{c.verantwortlichInitialen}</span>
                                </div>
                                <span className="text-[12px] text-foreground whitespace-nowrap">{c.verantwortlich}</span>
                              </div>
                            </td>
                            <td className="px-3 py-3 text-[12px] text-muted-foreground whitespace-nowrap">{c.letzteAenderung}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {filtered.length > 0 && (
                  <div className="px-4 py-2.5 border-t border-border-light bg-muted/10 flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">{filtered.length} von {cases.length} offene Mandate</span>
                    <span className="text-[11px] text-muted-foreground">Stand: 27.02.2026</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
