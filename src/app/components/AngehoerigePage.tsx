import React, { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  Search,
  Plus,
  ExternalLink,
  AlertCircle,
  GraduationCap,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  SlidersHorizontal,
} from "lucide-react";
import {
  angehoerige,
  qualifikationConfig,
  type Angehoeriger,
} from "./angehoerigeData";
import { useCurrentRole } from "../auth";
import { AnnaListenEinordnung, type ListenKontext } from "../anna/AnnaListenEinordnung";
import type { UserRole } from "../../types/user";

/* ── Views ── */
type ViewKey = "alle" | "meine" | "aufmerksamkeit" | "srk_offen" | "im_onboarding";
const CURRENT_USER_PFK = "Sandra Weber";

function viewFilter(list: Angehoeriger[], view: ViewKey): Angehoeriger[] {
  switch (view) {
    case "meine": return list.filter(a => a.pflegefachkraft === CURRENT_USER_PFK);
    case "aufmerksamkeit": return list.filter(a =>
      a.monatsSchritt.ueberfaellig || hasHRIssue(a) || isBillingBlocked(a) || (a.qualifikation === "ohne_srk" && !a.srkKursDatum)
    );
    case "srk_offen": return list.filter(a => a.qualifikation === "ohne_srk" && !a.srkKursDatum);
    case "im_onboarding": return list.filter(a => a.status === "in_onboarding");
    default: return list;
  }
}

const VIEW_DEFS: { key: ViewKey; label: string }[] = [
  { key: "alle", label: "Alle Angehörigen" },
  { key: "meine", label: "Meine Angehörigen" },
  { key: "aufmerksamkeit", label: "Aufmerksamkeit" },
  { key: "srk_offen", label: "SRK offen" },
  { key: "im_onboarding", label: "Im Onboarding" },
];

function getDefaultView(role: UserRole): ViewKey {
  return role === "diplomiert" ? "meine" : "alle";
}

function getViewOrder(role: UserRole): ViewKey[] {
  if (role === "diplomiert") return ["meine", "alle", "aufmerksamkeit", "srk_offen", "im_onboarding"];
  return ["alle", "meine", "aufmerksamkeit", "srk_offen", "im_onboarding"];
}

function hasHRIssue(a: Angehoeriger): boolean {
  return !a.hrCheck.bankdaten || !a.hrCheck.kinderzulagen || a.hrCheck.quellensteuerTarif === null;
}

function isBillingBlocked(a: Angehoeriger): boolean {
  return a.billingReadiness === "nicht_abrechenbar";
}

/* ── Qualifikation styles (new design system) ── */
const QUAL_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  ohne_srk: { bg: "var(--bg-secondary)", color: "var(--text-secondary)", label: "ohne SRK" },
  srk: { bg: "var(--status-info-bg)", color: "var(--status-info)", label: "SRK" },
  fage_dipl: { bg: "var(--brand-primary-light)", color: "var(--brand-primary)", label: "FaGe / Dipl" },
};

/* ── Filter defs ── */
interface FilterDef { id: string; label: string; options: { value: string; label: string }[] }

function buildFilterDefs(): FilterDef[] {
  const pflegefachkraefte = Array.from(new Set(angehoerige.map(a => a.pflegefachkraft))).sort();
  return [
    { id: "qualifikation", label: "Qualifikation", options: [{ value: "ohne_srk", label: "ohne SRK" }, { value: "srk", label: "SRK" }, { value: "fage_dipl", label: "FaGe / Dipl" }] },
    { id: "pflegefachkraft", label: "Pflegefachkraft", options: pflegefachkraefte.map(pf => ({ value: pf, label: pf })) },
    { id: "srk_status", label: "SRK-Status", options: [{ value: "ausstehend", label: "Ausstehend" }, { value: "absolviert", label: "Absolviert" }] },
  ];
}

/* ── Anna context ── */
function buildAnnaContext(allAngehoerige: Angehoeriger[], role: UserRole): ListenKontext {
  const active = allAngehoerige.filter(a => a.status !== "gekuendigt");
  const srkOffen = active.filter(a => a.qualifikation === "ohne_srk" && !a.srkKursDatum);
  const ueberfaellig = active.filter(a => a.monatsSchritt.ueberfaellig);

  const byStatus: Record<string, number> = {};
  if (srkOffen.length > 0) byStatus["srk_offen"] = srkOffen.length;
  if (ueberfaellig.length > 0) byStatus["ueberfaellig"] = ueberfaellig.length;

  const highlights: string[] = [];

  if (role === "diplomiert") {
    if (ueberfaellig.length > 0) {
      const names = ueberfaellig.slice(0, 2).map(a => `${a.vorname} ${a.nachname}`).join(" und ");
      highlights.push(`Bei ${names} ${ueberfaellig.length === 1 ? "ist ein Monatsschritt" : "sind Monatsschritte"} überfällig`);
    }
    if (srkOffen.length > 0) highlights.push(`${srkOffen.length} Angehörige ohne SRK-Schulung – Anmeldung sinnvoll`);
  } else if (role === "backoffice") {
    if (srkOffen.length > 0) highlights.push(`${srkOffen.length} ausstehende SRK-Anmeldungen`);
    const blocked = active.filter(a => isBillingBlocked(a));
    if (blocked.length > 0) highlights.push(`${blocked.length} nicht abrechenbar – Compliance prüfen`);
  } else {
    if (srkOffen.length > 0) highlights.push(`Compliance-Risiko bei ${srkOffen.length} Fällen – alle im SRK-Bereich`);
    const pfCounts: Record<string, number> = {};
    for (const a of srkOffen) pfCounts[a.pflegefachkraft] = (pfCounts[a.pflegefachkraft] || 0) + 1;
    const top = Object.entries(pfCounts).sort((a, b) => b[1] - a[1])[0];
    if (top && top[1] >= 2) highlights.push(`Konzentration bei ${top[0]} (${top[1]} offene SRK-Fälle) – möglicher Engpass`);
  }

  return { seite: `angehoerige_${role}`, totalCount: active.length, byStatus, highlights };
}

/* ══════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════ */
export function AngehoerigePage() {
  const navigate = useNavigate();
  const role = useCurrentRole();
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultView = getDefaultView(role);
  const activeView = (searchParams.get("view") || defaultView) as ViewKey;
  const search = searchParams.get("q") || "";
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const prevRole = useRef(role);

  const setView = (v: ViewKey) => { const n = new URLSearchParams(searchParams); if (v === defaultView) n.delete("view"); else n.set("view", v); setSearchParams(n, { replace: true }); };
  const setSearch = (q: string) => { const n = new URLSearchParams(searchParams); if (!q) n.delete("q"); else n.set("q", q); setSearchParams(n, { replace: true }); };

  useEffect(() => {
    if (prevRole.current !== role) { prevRole.current = role; const n = new URLSearchParams(searchParams); n.delete("view"); setSearchParams(n, { replace: true }); }
  }, [role]);

  const chipFilters = useMemo(() => {
    const f: Record<string, Set<string>> = {};
    for (const [key, value] of searchParams.entries()) { if (["view", "q"].includes(key)) continue; f[key] = new Set(value.split(",").filter(Boolean)); }
    return f;
  }, [searchParams]);

  const updateChipFilter = (id: string, next: Set<string>) => { const p = new URLSearchParams(searchParams); if (next.size === 0) p.delete(id); else p.set(id, Array.from(next).join(",")); setSearchParams(p, { replace: true }); };
  const clearAllFilters = () => { const p = new URLSearchParams(); const v = searchParams.get("view"); const q = searchParams.get("q"); if (v) p.set("view", v); if (q) p.set("q", q); setSearchParams(p, { replace: true }); };

  useEffect(() => { if (!filterPopoverOpen) return; const h = (e: MouseEvent) => { if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterPopoverOpen(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, [filterPopoverOpen]);

  const filterDefs = useMemo(() => buildFilterDefs(), []);

  const activeFilterTags = useMemo(() => {
    const tags: { filterId: string; value: string; displayLabel: string }[] = [];
    filterDefs.forEach(def => { const sel = chipFilters[def.id]; if (!sel) return; sel.forEach(val => { const opt = def.options.find(o => o.value === val); tags.push({ filterId: def.id, value: val, displayLabel: `${def.label}: ${opt?.label || val}` }); }); });
    return tags;
  }, [chipFilters, filterDefs]);

  const removeFilterTag = (filterId: string, value: string) => { const sel = chipFilters[filterId] || new Set(); const next = new Set(sel); next.delete(value); updateChipFilter(filterId, next); };

  const filtered = useMemo(() => {
    let list = viewFilter(angehoerige, activeView);
    const qf = chipFilters.qualifikation; if (qf?.size) list = list.filter(a => qf.has(a.qualifikation));
    const pf = chipFilters.pflegefachkraft; if (pf?.size) list = list.filter(a => pf.has(a.pflegefachkraft));
    const srk = chipFilters.srk_status; if (srk?.size) list = list.filter(a => {
      if (srk.has("ausstehend") && a.qualifikation === "ohne_srk" && !a.srkKursDatum) return true;
      if (srk.has("absolviert") && a.srkKursDatum) return true;
      return false;
    });
    if (search.trim()) { const q = search.toLowerCase(); list = list.filter(a => `${a.vorname} ${a.nachname}`.toLowerCase().includes(q) || a.zugeordnetePatientenList.some(p => p.name.toLowerCase().includes(q))); }
    return list;
  }, [activeView, search, chipFilters]);

  const viewCounts = useMemo(() => {
    const counts: Record<ViewKey, number> = { alle: 0, meine: 0, aufmerksamkeit: 0, srk_offen: 0, im_onboarding: 0 };
    for (const k of Object.keys(counts) as ViewKey[]) counts[k] = viewFilter(angehoerige, k).length;
    return counts;
  }, []);

  const annaContext = useMemo(() => buildAnnaContext(angehoerige, role), [role]);
  const viewOrder = getViewOrder(role);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* ═══════════════════════════════════════
         HEADER
         ═══════════════════════════════════════ */}
      <div className="shrink-0" style={{ padding: "var(--space-4) var(--space-6) 0" }}>
        <div className="flex items-center justify-between" style={{ marginBottom: "var(--space-3)" }}>
          <h1 style={{ fontSize: "var(--text-h1)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", letterSpacing: "var(--tracking-tight)" }}>Angehörige</h1>
          <button onClick={() => navigate("/onboarding/neu")} className="inline-flex items-center shrink-0 cursor-pointer transition-colors"
            style={{ gap: "var(--space-2)", padding: "10px 22px", borderRadius: "var(--radius-pill)", background: "var(--brand-primary)", color: "var(--text-on-dark)", fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", border: "none" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--brand-primary-dark)"} onMouseLeave={e => e.currentTarget.style.background = "var(--brand-primary)"}>
            <Plus style={{ width: 16, height: 16 }} /> <span className="hidden sm:inline">Neuen Angehörigen anlegen</span>
          </button>
        </div>

        {/* Anna */}
        <div style={{ marginBottom: "var(--space-4)" }}>
          <AnnaListenEinordnung context={annaContext} />
        </div>

        {/* Search + filter */}
        <div className="flex items-center" style={{ gap: 8, marginBottom: "var(--space-3)" }}>
          <div className="flex items-center flex-1" style={{ maxWidth: 300, gap: "var(--space-2)", padding: "8px 14px", borderRadius: "var(--radius-pill)", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)" }}>
            <Search style={{ width: 14, height: 14, color: "var(--text-tertiary)", flexShrink: 0 }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Angehörige suchen…" className="flex-1 bg-transparent outline-none" style={{ fontSize: "var(--text-small)", color: "var(--text-primary)" }} />
            {search && <button onClick={() => setSearch("")} className="cursor-pointer" style={{ background: "transparent", border: "none" }}><X style={{ width: 12, height: 12, color: "var(--text-secondary)" }} /></button>}
          </div>
          <div className="relative" ref={filterRef}>
            <button onClick={() => setFilterPopoverOpen(o => !o)} className="inline-flex items-center cursor-pointer transition-colors"
              style={{ gap: 6, padding: "6px 14px", borderRadius: "var(--radius-pill)", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", fontSize: 13, fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"} onMouseLeave={e => e.currentTarget.style.background = "var(--bg-elevated)"}>
              <SlidersHorizontal style={{ width: 14, height: 14, color: "var(--text-secondary)" }} /> Filter
              {activeFilterTags.length > 0 && <span style={{ width: 5, height: 5, borderRadius: "var(--radius-pill)", background: "var(--brand-primary)" }} />}
            </button>
            {filterPopoverOpen && (
              <div className="absolute z-50" style={{ top: "calc(100% + 6px)", left: 0, width: 300, padding: 14, background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-overlay)" }}>
                <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                  <span style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>Filter</span>
                  <button onClick={() => setFilterPopoverOpen(false)} className="cursor-pointer" style={{ background: "transparent", border: "none" }}><X style={{ width: 14, height: 14, color: "var(--text-secondary)" }} /></button>
                </div>
                <div className="flex flex-col" style={{ gap: 14 }}>
                  {filterDefs.map(def => (
                    <div key={def.id}>
                      <div style={{ fontSize: "var(--text-micro)", color: "var(--text-secondary)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase" as const, marginBottom: 8, fontWeight: "var(--weight-medium)" }}>{def.label}</div>
                      <div className="flex flex-wrap" style={{ gap: 4 }}>
                        {def.options.map(opt => {
                          const sel = chipFilters[def.id] || new Set();
                          const isActive = sel.has(opt.value);
                          return (
                            <button key={opt.value} onClick={() => { const n = new Set(sel); if (isActive) n.delete(opt.value); else n.add(opt.value); updateChipFilter(def.id, n); }} className="cursor-pointer transition-colors"
                              style={{ padding: "4px 10px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-meta)", fontWeight: isActive ? "var(--weight-medium)" : "var(--weight-regular)", background: isActive ? "var(--brand-primary-light)" : "var(--bg-elevated)", border: isActive ? "var(--border-thin) solid var(--brand-primary)" : "var(--border-thin) solid var(--border-default)", color: isActive ? "var(--brand-primary)" : "var(--text-secondary)" }}>
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
                    <button onClick={clearAllFilters} className="cursor-pointer" style={{ background: "transparent", border: "none", fontSize: "var(--text-meta)", color: "var(--text-secondary)", fontWeight: "var(--weight-medium)" }}>Alle zurücksetzen</button>
                  </div>
                )}
              </div>
            )}
          </div>
          {activeFilterTags.map(tag => (
            <button key={`${tag.filterId}-${tag.value}`} onClick={() => removeFilterTag(tag.filterId, tag.value)} className="inline-flex items-center cursor-pointer"
              style={{ gap: 4, padding: "4px 10px", borderRadius: "var(--radius-pill)", background: "var(--brand-primary-light)", color: "var(--brand-primary)", fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", border: "none" }}>
              {tag.displayLabel} <X style={{ width: 10, height: 10 }} />
            </button>
          ))}
          {activeFilterTags.length > 0 && (
            <button onClick={clearAllFilters} className="cursor-pointer" style={{ background: "transparent", border: "none", fontSize: "var(--text-meta)", color: "var(--text-secondary)", fontWeight: "var(--weight-medium)", padding: "4px 6px" }}>Alle zurücksetzen</button>
          )}
        </div>

        {/* View pills */}
        <div className="flex items-center flex-wrap" style={{ gap: 8, marginBottom: "var(--space-4)" }}>
          {viewOrder.map(vk => {
            const def = VIEW_DEFS.find(d => d.key === vk)!;
            const isActive = activeView === vk;
            const count = viewCounts[vk];
            return (
              <button key={vk} onClick={() => setView(vk)} className="inline-flex items-center cursor-pointer transition-colors"
                style={{ gap: 8, padding: "6px 14px", borderRadius: "var(--radius-pill)", fontSize: 13, fontWeight: isActive ? "var(--weight-medium)" : "var(--weight-regular)", background: isActive ? "var(--brand-primary-light)" : "transparent", border: isActive ? "var(--border-thin) solid transparent" : "var(--border-thin) solid var(--border-default)", color: isActive ? "var(--brand-primary)" : "var(--text-primary)" }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "var(--bg-secondary)"; }} onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = isActive ? "var(--brand-primary-light)" : "transparent"; }}>
                {def.label}
                <span className="inline-flex items-center justify-center" style={{ minWidth: 18, padding: "1px 8px", borderRadius: "var(--radius-pill)", fontSize: 11, fontWeight: "var(--weight-medium)", background: isActive ? "var(--brand-primary)" : "var(--bg-secondary)", color: isActive ? "var(--text-on-dark)" : "var(--text-secondary)" }}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════
         TABLE
         ═══════════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto" style={{ padding: "0 var(--space-6) var(--space-4)" }}>
        <div style={{ background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", minWidth: 900, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--bg-secondary)" }}>
                  {["Name", "Zugeordnete Patienten", "Pflegefachkraft", "Qualifikation", "SRK Kurs", "Monatsschritt", "Letzte Mutation"].map(col => (
                    <th key={col} style={{ padding: "8px 12px", textAlign: "left" }}>
                      <span style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase" as const, fontWeight: "var(--weight-medium)", whiteSpace: "nowrap" }}>{col}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: "48px 16px", textAlign: "center", fontSize: "var(--text-body)", color: "var(--text-tertiary)" }}>Keine Angehörigen für diesen Filter gefunden.</td></tr>
                ) : filtered.map(a => {
                  const qs = QUAL_STYLE[a.qualifikation] || QUAL_STYLE.ohne_srk;
                  const blocked = isBillingBlocked(a);
                  return (
                    <tr key={a.id} onClick={() => navigate(`/angehoerige/${a.id}`)} className="cursor-pointer transition-colors"
                      style={{ borderTop: "var(--border-thin) solid var(--border-default)" }}
                      onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      {/* Name */}
                      <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                        <div className="flex items-center" style={{ gap: 8 }}>
                          <div className="shrink-0 flex items-center justify-center" style={{ width: 28, height: 28, borderRadius: "var(--radius-card)", background: blocked ? "var(--status-danger-bg)" : "var(--brand-primary-light)" }}>
                            <span style={{ fontSize: 10, fontWeight: "var(--weight-semibold)", color: blocked ? "var(--status-danger)" : "var(--brand-primary)" }}>{a.vorname[0]}{a.nachname[0]}</span>
                          </div>
                          <span style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>{a.nachname}, {a.vorname}</span>
                        </div>
                      </td>
                      {/* Patienten */}
                      <td style={{ padding: "10px 12px" }}>
                        {a.zugeordnetePatientenList.length === 0 ? (
                          <span style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)", fontStyle: "italic" }}>Keine Zuordnung</span>
                        ) : (
                          <div className="flex flex-col" style={{ gap: 2 }}>
                            {a.zugeordnetePatientenList.slice(0, 2).map(p => (
                              <button key={p.id} onClick={e => { e.stopPropagation(); navigate(`/patienten/${p.id}`); }} className="inline-flex items-center cursor-pointer"
                                style={{ gap: 4, fontSize: "var(--text-small)", color: "var(--brand-primary)", background: "transparent", border: "none", textAlign: "left", padding: 0 }}>
                                <ExternalLink style={{ width: 10, height: 10, opacity: 0.5 }} />{p.name}
                              </button>
                            ))}
                            {a.zugeordnetePatientenList.length > 2 && <span style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>+{a.zugeordnetePatientenList.length - 2} weitere</span>}
                          </div>
                        )}
                      </td>
                      {/* Pflegefachkraft */}
                      <td style={{ padding: "10px 12px" }}>
                        <div className="flex items-center" style={{ gap: 6 }}>
                          <div className="shrink-0 flex items-center justify-center" style={{ width: 20, height: 20, borderRadius: "var(--radius-pill)", background: "var(--bg-secondary)" }}>
                            <span style={{ fontSize: 8, fontWeight: "var(--weight-semibold)", color: "var(--text-secondary)" }}>{a.pflegefachkraftInitialen}</span>
                          </div>
                          <span style={{ fontSize: "var(--text-small)", color: "var(--text-primary)" }}>{a.pflegefachkraft}</span>
                        </div>
                      </td>
                      {/* Qualifikation */}
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ padding: "2px 8px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", background: qs.bg, color: qs.color }}>{qs.label}</span>
                      </td>
                      {/* SRK */}
                      <td style={{ padding: "10px 12px" }}>
                        {a.srkKursDatum ? (
                          <div className="flex items-center" style={{ gap: 4 }}>
                            <GraduationCap style={{ width: 14, height: 14, color: "var(--status-success)" }} />
                            <span style={{ fontSize: "var(--text-small)", color: "var(--text-primary)" }}>{new Date(a.srkKursDatum).toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit", year: "numeric" })}</span>
                          </div>
                        ) : a.qualifikation === "ohne_srk" ? (
                          <span className="inline-flex items-center" style={{ gap: 4, fontSize: "var(--text-meta)", color: "var(--status-warning-text)", fontWeight: "var(--weight-medium)" }}>
                            <AlertCircle style={{ width: 14, height: 14 }} /> Ausstehend
                          </span>
                        ) : (
                          <span style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>n/a</span>
                        )}
                      </td>
                      {/* Monatsschritt */}
                      <td style={{ padding: "10px 12px" }}>
                        {(() => {
                          const ms = a.monatsSchritt;
                          const pct = Math.round(((ms.abgeschlossen ? ms.total : ms.aktuell - 1) / ms.total) * 100);
                          const barColor = ms.abgeschlossen ? "var(--status-success)" : ms.ueberfaellig ? "var(--status-danger)" : "var(--brand-primary)";
                          const textColor = ms.abgeschlossen ? "var(--status-success-text)" : ms.ueberfaellig ? "var(--status-danger)" : "var(--text-primary)";
                          return (
                            <div style={{ minWidth: 120 }}>
                              <div className="flex items-center" style={{ gap: 4, marginBottom: 4 }}>
                                {ms.abgeschlossen ? <CheckCircle2 style={{ width: 12, height: 12, color: "var(--status-success)", flexShrink: 0 }} />
                                  : ms.ueberfaellig ? <AlertTriangle style={{ width: 12, height: 12, color: "var(--status-danger)", flexShrink: 0 }} />
                                  : <Clock style={{ width: 12, height: 12, color: "var(--brand-primary)", flexShrink: 0 }} />}
                                <span className="truncate" style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: textColor }}>{ms.label}</span>
                              </div>
                              <div className="flex items-center" style={{ gap: 6 }}>
                                <div style={{ flex: 1, height: 4, background: "var(--bg-secondary)", borderRadius: "var(--radius-pill)", overflow: "hidden" }}>
                                  <div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: "var(--radius-pill)" }} />
                                </div>
                                <span style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", fontWeight: "var(--weight-medium)" }}>{ms.abgeschlossen ? ms.total : ms.aktuell}/{ms.total}</span>
                              </div>
                              {ms.faellig && !ms.abgeschlossen && (
                                <div style={{ fontSize: "var(--text-micro)", marginTop: 2, color: ms.ueberfaellig ? "var(--status-danger)" : "var(--text-tertiary)" }}>
                                  {ms.ueberfaellig ? "Überfällig" : `Fällig ${ms.faellig}`}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      {/* Letzte Mutation */}
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ fontSize: "var(--text-small)", color: "var(--text-primary)" }}>{a.letzteMutationDatum}</div>
                        <div style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>{a.letzteMutationUser}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between" style={{ padding: "8px 16px", borderTop: "var(--border-thin) solid var(--border-default)", fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>
            <span>{filtered.length} von {angehoerige.length} Angehörige</span>
          </div>
        </div>
      </div>
    </div>
  );
}
