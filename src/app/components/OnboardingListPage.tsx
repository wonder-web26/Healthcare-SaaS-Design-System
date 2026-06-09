import React, { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Plus, Search, AlertTriangle, Check, Clock, Ban, ChevronRight, ClipboardList, X, Users, Sparkles, SlidersHorizontal } from "lucide-react";
import { AnnaListenEinordnung, type ListenKontext } from "../anna/AnnaListenEinordnung";
import { useCurrentRole } from "../auth";
import type { UserRole } from "../../types/user";

/* ── Types ── */
type OnboardingStatus = "in_erfassung" | "unvollstaendig" | "blockiert";

interface OnboardingCase {
  id: string;
  patientVorname: string;
  patientNachname: string;
  patientId: string;
  angehoeriger: string;
  eintrittsdatum: string;
  status: OnboardingStatus;
  offen: number;
  abrechnungsstopp: boolean;
  abrechnungsstoppGrund?: string;
  verantwortlich: string;
  verantwortlichInitialen: string;
  letzteAenderung: string;
  kanton: string;
}

const statusCfg: Record<OnboardingStatus, { label: string; bg: string; text: string; dot: string }> = {
  in_erfassung: { label: "In Erfassung", bg: "var(--status-info-bg)", text: "var(--status-info)", dot: "var(--status-info)" },
  unvollstaendig: { label: "Unvollständig", bg: "var(--status-warning-bg)", text: "var(--status-warning-text)", dot: "var(--status-warning)" },
  blockiert: { label: "Blockiert", bg: "var(--status-danger-bg)", text: "var(--status-danger)", dot: "var(--status-danger)" },
};

/* ── Mock data ── */
const cases: OnboardingCase[] = [
  { id: "OB-2026-001", patientVorname: "Thomas", patientNachname: "Schmid", patientId: "P-2026-0042", angehoeriger: "Lisa Schmid", eintrittsdatum: "18.02.2026", status: "unvollstaendig", offen: 6, abrechnungsstopp: false, verantwortlich: "Kathrin Meier", verantwortlichInitialen: "KM", letzteAenderung: "26.02.2026", kanton: "ZH" },
  { id: "OB-2026-002", patientVorname: "Peter", patientNachname: "Hoffmann", patientId: "P-2026-0046", angehoeriger: "Ruth Hoffmann", eintrittsdatum: "20.02.2026", status: "in_erfassung", offen: 14, abrechnungsstopp: false, verantwortlich: "Sandra Weber", verantwortlichInitialen: "SW", letzteAenderung: "25.02.2026", kanton: "SG" },
  { id: "OB-2026-003", patientVorname: "Sabine", patientNachname: "Becker", patientId: "P-2026-0045", angehoeriger: "Hans Becker", eintrittsdatum: "10.02.2026", status: "blockiert", offen: 2, abrechnungsstopp: true, abrechnungsstoppGrund: "Spezialbewilligung Migrationsamt noch ausstehend", verantwortlich: "Sandra Weber", verantwortlichInitialen: "SW", letzteAenderung: "24.02.2026", kanton: "ZH" },
  { id: "OB-2026-004", patientVorname: "Heinrich", patientNachname: "Steiner", patientId: "P-2026-0048", angehoeriger: "Ursula Steiner", eintrittsdatum: "05.02.2026", status: "blockiert", offen: 1, abrechnungsstopp: true, abrechnungsstoppGrund: "Kritische Gesundheitslage – ärztliche Freigabe ausstehend", verantwortlich: "Laura Brunner", verantwortlichInitialen: "LB", letzteAenderung: "23.02.2026", kanton: "BE" },
  { id: "OB-2026-008", patientVorname: "Lena", patientNachname: "Graf", patientId: "P-2026-0051", angehoeriger: "Martin Graf", eintrittsdatum: "24.02.2026", status: "in_erfassung", offen: 20, abrechnungsstopp: false, verantwortlich: "Kathrin Meier", verantwortlichInitialen: "KM", letzteAenderung: "27.02.2026", kanton: "AG" },
  { id: "OB-2026-009", patientVorname: "Fritz", patientNachname: "Huber", patientId: "P-2026-0052", angehoeriger: "Erika Huber", eintrittsdatum: "15.02.2026", status: "unvollstaendig", offen: 4, abrechnungsstopp: false, verantwortlich: "Maria Keller", verantwortlichInitialen: "MK", letzteAenderung: "26.02.2026", kanton: "LU" },
  { id: "OB-2026-010", patientVorname: "Rosa", patientNachname: "Ammann", patientId: "P-2026-0053", angehoeriger: "Daniel Ammann", eintrittsdatum: "26.02.2026", status: "in_erfassung", offen: 26, abrechnungsstopp: false, verantwortlich: "Sandra Weber", verantwortlichInitialen: "SW", letzteAenderung: "27.02.2026", kanton: "ZH" },
  { id: "OB-2026-011", patientVorname: "Walter", patientNachname: "Frei", patientId: "P-2026-0054", angehoeriger: "Margrit Frei", eintrittsdatum: "12.02.2026", status: "unvollstaendig", offen: 1, abrechnungsstopp: false, verantwortlich: "Laura Brunner", verantwortlichInitialen: "LB", letzteAenderung: "27.02.2026", kanton: "ZH" },
];

/* ── Views ── */
type ViewKey = "alle" | "meine" | "blockiert" | "fast_abgeschlossen" | "in_erfassung";
const CURRENT_USER = "Maria Keller";

function viewFilter(list: OnboardingCase[], view: ViewKey): OnboardingCase[] {
  switch (view) {
    case "meine": return list.filter(c => c.verantwortlich === CURRENT_USER);
    case "blockiert": return list.filter(c => c.abrechnungsstopp || c.status === "blockiert");
    case "fast_abgeschlossen": return list.filter(c => c.offen <= 1 && !c.abrechnungsstopp);
    case "in_erfassung": return list.filter(c => c.status === "in_erfassung");
    default: return list;
  }
}

const VIEW_DEFS: { key: ViewKey; label: string }[] = [
  { key: "alle", label: "Alle Onboardings" },
  { key: "meine", label: "Meine Onboardings" },
  { key: "blockiert", label: "Blockiert" },
  { key: "fast_abgeschlossen", label: "Fast abgeschlossen" },
  { key: "in_erfassung", label: "In Erfassung" },
];

function getDefaultView(role: UserRole): ViewKey {
  return role === "diplomiert" ? "meine" : "alle";
}

function getViewOrder(role: UserRole): ViewKey[] {
  if (role === "diplomiert") return ["meine", "alle", "blockiert", "fast_abgeschlossen", "in_erfassung"];
  return ["alle", "meine", "blockiert", "fast_abgeschlossen", "in_erfassung"];
}

/* ── Filter defs ── */
const allVerantwortliche = [...new Set(cases.map(c => c.verantwortlich))].sort();
const allKantone = [...new Set(cases.map(c => c.kanton))].sort();

interface FilterDef { id: string; label: string; options: { value: string; label: string }[] }
const filterDefs: FilterDef[] = [
  { id: "status", label: "Status", options: [{ value: "in_erfassung", label: "In Erfassung" }, { value: "unvollstaendig", label: "Unvollständig" }, { value: "blockiert", label: "Blockiert" }] },
  { id: "verantwortlich", label: "Verantwortlich", options: allVerantwortliche.map(v => ({ value: v, label: v })) },
  { id: "kanton", label: "Kanton", options: allKantone.map(k => ({ value: k, label: k })) },
];

/* ── Anna context ── */
function buildAnnaContext(allCases: OnboardingCase[], role: UserRole): ListenKontext {
  const blocked = allCases.filter(c => c.abrechnungsstopp || c.status === "blockiert");
  const inErfassung = allCases.filter(c => c.status === "in_erfassung");
  const fastAbgeschlossen = allCases.filter(c => c.offen <= 1 && !c.abrechnungsstopp);

  const byStatus: Record<string, number> = {
    blockiert: blocked.length,
    unvollstaendig: allCases.filter(c => c.status === "unvollstaendig").length,
    in_erfassung: inErfassung.length,
  };

  const highlights: string[] = [];

  if (role === "diplomiert") {
    if (blocked.length > 0) highlights.push(`${blocked.length} Onboarding${blocked.length > 1 ? "s" : ""} blockiert – brauchen Aufmerksamkeit`);
    const oldestInErfassung = inErfassung.sort((a, b) => a.eintrittsdatum.split(".").reverse().join("-").localeCompare(b.eintrittsdatum.split(".").reverse().join("-")))[0];
    if (oldestInErfassung) {
      const days = Math.round((new Date("2026-03-03").getTime() - new Date(oldestInErfassung.eintrittsdatum.split(".").reverse().join("-")).getTime()) / 86400000);
      if (days > 7) highlights.push(`${oldestInErfassung.patientNachname} seit ${days} Tagen in Ersterfassung`);
    }
  } else if (role === "backoffice") {
    if (blocked.length > 0) {
      const reasons = blocked.filter(c => c.abrechnungsstoppGrund).map(c => c.abrechnungsstoppGrund!);
      const spezialbewilligung = reasons.filter(r => r.toLowerCase().includes("spezialbewilligung")).length;
      if (spezialbewilligung > 0) highlights.push(`${spezialbewilligung} blockiert wegen Spezialbewilligung beim Migrationsamt`);
      else highlights.push(`${blocked.length} blockiert`);
    }
    if (fastAbgeschlossen.length > 0) {
      const names = fastAbgeschlossen.slice(0, 3).map(c => `${c.angehoeriger}`).join(", ");
      highlights.push(`${fastAbgeschlossen.length} fast abschlussreif: ${names}`);
    }
  } else {
    // Management
    highlights.push(`Verteilung: ${inErfassung.length} in Erfassung, ${fastAbgeschlossen.length} fast abgeschlossen, ${blocked.length} blockiert`);
    // Bottleneck
    const personCounts: Record<string, number> = {};
    for (const c of allCases) personCounts[c.verantwortlich] = (personCounts[c.verantwortlich] || 0) + 1;
    const top = Object.entries(personCounts).sort((a, b) => b[1] - a[1])[0];
    if (top && top[1] >= 3) highlights.push(`${top[1]} Mandate bei ${top[0]} – möglicher Engpass`);
  }

  return { seite: `onboarding_${role}`, totalCount: allCases.length, byStatus, highlights };
}

/* ══════════════════════════════════════════ */
export function OnboardingListPage() {
  const navigate = useNavigate();
  const role = useCurrentRole();
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultView = getDefaultView(role);
  const activeView = (searchParams.get("view") || defaultView) as ViewKey;
  const search = searchParams.get("q") || "";
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);
  const [blockerTooltip, setBlockerTooltip] = useState<string | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const prevRole = useRef(role);

  const setView = (v: ViewKey) => { const n = new URLSearchParams(searchParams); if (v === defaultView) n.delete("view"); else n.set("view", v); setSearchParams(n, { replace: true }); };
  const setSearch = (q: string) => { const n = new URLSearchParams(searchParams); if (!q) n.delete("q"); else n.set("q", q); setSearchParams(n, { replace: true }); };

  // Reset view on role switch
  useEffect(() => {
    if (prevRole.current !== role) {
      prevRole.current = role;
      const n = new URLSearchParams(searchParams);
      n.delete("view");
      setSearchParams(n, { replace: true });
    }
  }, [role]);

  const chipFilters = useMemo(() => {
    const f: Record<string, Set<string>> = {};
    for (const [key, value] of searchParams.entries()) { if (["view", "q"].includes(key)) continue; f[key] = new Set(value.split(",").filter(Boolean)); }
    return f;
  }, [searchParams]);

  const updateChipFilter = (id: string, next: Set<string>) => { const p = new URLSearchParams(searchParams); if (next.size === 0) p.delete(id); else p.set(id, Array.from(next).join(",")); setSearchParams(p, { replace: true }); };
  const clearAllFilters = () => { const p = new URLSearchParams(); const v = searchParams.get("view"); const q = searchParams.get("q"); if (v) p.set("view", v); if (q) p.set("q", q); setSearchParams(p, { replace: true }); };

  useEffect(() => { if (!filterPopoverOpen) return; const h = (e: MouseEvent) => { if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterPopoverOpen(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, [filterPopoverOpen]);

  const activeFilterTags = useMemo(() => {
    const tags: { filterId: string; value: string; displayLabel: string }[] = [];
    filterDefs.forEach(def => { const sel = chipFilters[def.id]; if (!sel) return; sel.forEach(val => { const opt = def.options.find(o => o.value === val); tags.push({ filterId: def.id, value: val, displayLabel: `${def.label}: ${opt?.label || val}` }); }); });
    return tags;
  }, [chipFilters]);

  const removeFilterTag = (filterId: string, value: string) => { const sel = chipFilters[filterId] || new Set(); const next = new Set(sel); next.delete(value); updateChipFilter(filterId, next); };

  const filtered = useMemo(() => {
    let list = viewFilter(cases, activeView);
    const st = chipFilters.status; if (st && st.size > 0) list = list.filter(c => st.has(c.status));
    const vr = chipFilters.verantwortlich; if (vr && vr.size > 0) list = list.filter(c => vr.has(c.verantwortlich));
    const kt = chipFilters.kanton; if (kt && kt.size > 0) list = list.filter(c => kt.has(c.kanton));
    if (search.trim()) { const q = search.toLowerCase(); list = list.filter(c => c.patientNachname.toLowerCase().includes(q) || c.patientVorname.toLowerCase().includes(q) || c.angehoeriger.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)); }
    return list;
  }, [activeView, search, chipFilters]);

  const viewCounts = useMemo(() => {
    const counts: Record<ViewKey, number> = { alle: 0, meine: 0, blockiert: 0, fast_abgeschlossen: 0, in_erfassung: 0 };
    for (const k of Object.keys(counts) as ViewKey[]) counts[k] = viewFilter(cases, k).length;
    return counts;
  }, []);

  const annaContext = useMemo(() => buildAnnaContext(cases, role), [role]);
  const viewOrder = getViewOrder(role);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* ═══════════════════════════════════════
         HEADER
         ═══════════════════════════════════════ */}
      <style>{`
        .ob-list-pad { padding-left: var(--mobile-page-padding); padding-right: var(--mobile-page-padding); }
        @media (min-width: 640px) { .ob-list-pad { padding-left: var(--space-6); padding-right: var(--space-6); } }
      `}</style>
      <div className="shrink-0 ob-list-pad" style={{ paddingTop: "var(--space-4)" }}>
        {/* Title row */}
        <div className="flex items-center justify-between" style={{ marginBottom: "var(--space-3)" }}>
          <h1 style={{ fontSize: "var(--text-h1)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", letterSpacing: "var(--tracking-tight)" }}>Onboarding</h1>
          <button onClick={() => navigate("/onboarding/neu")} className="inline-flex items-center shrink-0 cursor-pointer transition-colors"
            style={{ gap: "var(--space-2)", padding: "10px 22px", borderRadius: "var(--radius-pill)", background: "var(--brand-primary)", color: "var(--text-on-dark)", fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", border: "none" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--brand-primary-dark)"} onMouseLeave={e => e.currentTarget.style.background = "var(--brand-primary)"}>
            <Plus style={{ width: 16, height: 16 }} /> <span className="hidden sm:inline">Neues Mandat</span>
          </button>
        </div>

        {/* Anna einordnung */}
        <div style={{ marginBottom: "var(--space-4)" }}>
          <AnnaListenEinordnung context={annaContext} />
        </div>

        {/* Search + filter */}
        <div className="flex items-center" style={{ gap: 8, marginBottom: "var(--space-3)" }}>
          <div className="flex items-center flex-1" style={{
            maxWidth: 300, gap: "var(--space-2)", padding: "8px 14px",
            borderRadius: "var(--radius-pill)", background: "var(--bg-elevated)",
            border: "var(--border-thin) solid var(--border-default)",
          }}>
            <Search style={{ width: 14, height: 14, color: "var(--text-tertiary)", flexShrink: 0 }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Onboardings suchen…" className="flex-1 bg-transparent outline-none" style={{ fontSize: "var(--text-small)", color: "var(--text-primary)" }} />
            {search && <button onClick={() => setSearch("")} className="cursor-pointer" style={{ background: "transparent", border: "none" }}><X style={{ width: 12, height: 12, color: "var(--text-secondary)" }} /></button>}
          </div>

          <div className="relative" ref={filterRef}>
            <button onClick={() => setFilterPopoverOpen(o => !o)} className="inline-flex items-center cursor-pointer transition-colors"
              style={{ gap: 6, padding: "6px 14px", borderRadius: "var(--radius-pill)", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", fontSize: 13, fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"} onMouseLeave={e => e.currentTarget.style.background = "var(--bg-elevated)"}>
              <SlidersHorizontal style={{ width: 14, height: 14, color: "var(--text-secondary)" }} />
              Filter
              {activeFilterTags.length > 0 && <span style={{ width: 5, height: 5, borderRadius: "var(--radius-pill)", background: "var(--brand-primary)" }} />}
            </button>
            {filterPopoverOpen && (
              <div className="absolute z-50" style={{ top: "calc(100% + 6px)", left: 0, width: 300, padding: 14, background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-overlay)" }}>
                <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                  <span style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>Filter</span>
                  <button onClick={() => setFilterPopoverOpen(false)} className="cursor-pointer" style={{ background: "transparent", border: "none" }}><X style={{ width: 14, height: 14, color: "var(--text-secondary)" }} /></button>
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

        {/* View pills — horizontal scroll on mobile */}
        <div className="flex items-center overflow-x-auto" style={{ gap: 8, marginBottom: "var(--space-4)", paddingBottom: 2 }}>
          {viewOrder.map(vk => {
            const def = VIEW_DEFS.find(d => d.key === vk)!;
            const isActive = activeView === vk;
            const count = viewCounts[vk];
            return (
              <button key={vk} onClick={() => setView(vk)}
                className="inline-flex items-center shrink-0 cursor-pointer transition-colors"
                style={{
                  gap: 8, padding: "8px 14px", borderRadius: "var(--radius-pill)", whiteSpace: "nowrap",
                  fontSize: 13, fontWeight: isActive ? "var(--weight-medium)" : "var(--weight-regular)",
                  background: isActive ? "var(--brand-primary-light)" : "transparent",
                  border: isActive ? "var(--border-thin) solid transparent" : "var(--border-thin) solid var(--border-default)",
                  color: isActive ? "var(--brand-primary)" : "var(--text-primary)",
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "var(--bg-secondary)"; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = isActive ? "var(--brand-primary-light)" : "transparent"; }}>
                {def.label}
                <span className="inline-flex items-center justify-center" style={{
                  minWidth: 18, padding: "1px 8px", borderRadius: "var(--radius-pill)",
                  fontSize: 11, fontWeight: "var(--weight-medium)",
                  background: isActive ? "var(--brand-primary)" : "var(--bg-secondary)",
                  color: isActive ? "var(--text-on-dark)" : "var(--text-secondary)",
                }}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════
         TABLE
         ═══════════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto ob-list-pad" style={{ paddingTop: 0, paddingBottom: "var(--space-4)" }}>
        <div style={{ background: "var(--bg-elevated)", borderRadius: "var(--radius-card)", border: "var(--border-thin) solid var(--border-default)", overflow: "hidden" }}>
          <div className="overflow-x-auto">
            <table style={{ width: "100%", minWidth: 900, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--bg-secondary)" }}>
                  {["Patient", "Angehöriger", "Eintrittsdatum", "Kt.", "Status", "Offen", "Verantwortlich", "Letzte Änderung"].map(col => (
                    <th key={col} style={{ padding: "8px 12px", textAlign: "left" }}>
                      <span style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase" as const, fontWeight: "var(--weight-medium)", whiteSpace: "nowrap" }}>{col}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} style={{ padding: "48px 16px", textAlign: "center", fontSize: "var(--text-body)", color: "var(--text-tertiary)" }}>Keine Ergebnisse für diesen Filter.</td></tr>
                ) : filtered.map(c => {
                  const st = statusCfg[c.status];
                  const isBlocked = c.abrechnungsstopp;
                  return (
                    <tr key={c.id} onClick={() => navigate(`/onboarding/${c.id}`)} className="cursor-pointer transition-colors group"
                      style={{ borderTop: "var(--border-thin) solid var(--border-default)" }}
                      onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                        <div className="flex items-center" style={{ gap: 8 }}>
                          <div className="shrink-0 flex items-center justify-center" style={{ width: 28, height: 28, borderRadius: "var(--radius-card)", background: "var(--brand-primary-light)" }}>
                            <span style={{ fontSize: 10, fontWeight: "var(--weight-semibold)", color: "var(--brand-primary)" }}>{c.patientVorname[0]}{c.patientNachname[0]}</span>
                          </div>
                          <span style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>{c.patientNachname}, {c.patientVorname}</span>
                        </div>
                      </td>
                      <td style={{ padding: "10px 12px", fontSize: "var(--text-small)", color: "var(--text-primary)" }}>{c.angehoeriger}</td>
                      <td style={{ padding: "10px 12px", fontSize: "var(--text-small)", color: "var(--text-primary)", whiteSpace: "nowrap" }}>{c.eintrittsdatum}</td>
                      <td style={{ padding: "10px 12px", fontSize: "var(--text-small)", color: "var(--text-secondary)", fontWeight: "var(--weight-medium)" }}>{c.kanton}</td>
                      <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                        <div className="flex items-center" style={{ gap: "var(--space-2)" }}>
                          <span className="inline-flex items-center" style={{ gap: 4, padding: "2px 10px", borderRadius: "var(--radius-pill)", background: st.bg, color: st.text, fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)" }}>
                            <span style={{ width: 5, height: 5, borderRadius: "var(--radius-pill)", background: st.dot }} />
                            {st.label}
                          </span>
                          {isBlocked && (
                            <div className="relative" onMouseEnter={() => setBlockerTooltip(c.id)} onMouseLeave={() => setBlockerTooltip(null)}>
                              <AlertTriangle style={{ width: 14, height: 14, color: "var(--status-warning)" }} />
                              {blockerTooltip === c.id && c.abrechnungsstoppGrund && (
                                <div className="absolute z-50 whitespace-nowrap pointer-events-none" style={{ bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)", padding: "8px 12px", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-overlay)", fontSize: "var(--text-small)", color: "var(--text-primary)" }}>
                                  {c.abrechnungsstoppGrund}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "center" }}>
                        {c.offen === 0
                          ? <Check style={{ width: 16, height: 16, color: "var(--status-success)", margin: "0 auto" }} />
                          : <span style={{ fontSize: "var(--text-body)", color: "var(--text-primary)" }}>{c.offen}</span>}
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <div className="flex items-center" style={{ gap: 6 }}>
                          <div className="shrink-0 flex items-center justify-center" style={{ width: 22, height: 22, borderRadius: "var(--radius-pill)", background: "var(--bg-secondary)" }}>
                            <span style={{ fontSize: 8, fontWeight: "var(--weight-semibold)", color: "var(--text-secondary)" }}>{c.verantwortlichInitialen}</span>
                          </div>
                          <span style={{ fontSize: "var(--text-small)", color: "var(--text-primary)", whiteSpace: "nowrap" }}>{c.verantwortlich}</span>
                        </div>
                      </td>
                      <td style={{ padding: "10px 12px", fontSize: "var(--text-small)", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{c.letzteAenderung}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length > 0 && (
            <div className="flex items-center justify-between" style={{ padding: "8px 16px", borderTop: "var(--border-thin) solid var(--border-default)", fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>
              <span>{filtered.length} von {cases.length} offene Mandate</span>
              <span>Stand: 27.02.2026</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
