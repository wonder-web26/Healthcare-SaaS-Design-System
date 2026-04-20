import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router";
import {
  User,
  Users,
  Inbox,
  CheckCircle2,
  SlidersHorizontal,
  Plus,
  X,
  MoreHorizontal,
  AlertTriangle,
  Check,
  Upload,
  ArrowLeft,
} from "lucide-react";
import {
  unifiedEntries,
  entryTitle,
  WORKFLOW_TYPES,
  TICKET_TYPES,
  CURRENT_USER,
  MY_TEAM,
  type UnifiedEntry,
  type Quelle,
} from "../../lib/mocks/service-desk-unified";

const TODAY = "2026-03-03";

// ── Helpers ──

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

function formatShort(iso: string): string {
  const months = ["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"];
  const [, m, d] = iso.split("-");
  return `${parseInt(d)}. ${months[parseInt(m) - 1]}`;
}

function daysFromToday(iso: string | null): number | null {
  if (!iso) return null;
  const t = new Date(TODAY);
  const d = new Date(iso);
  return Math.round((d.getTime() - t.getTime()) / 86400000);
}

type BucketKey = "ueberfaellig" | "heute" | "morgen" | "diese_woche" | "spaeter" | "kein";

function faelligBucket(iso: string | null): BucketKey {
  if (!iso) return "kein";
  const d = daysFromToday(iso)!;
  if (d < 0) return "ueberfaellig";
  if (d === 0) return "heute";
  if (d === 1) return "morgen";
  if (d <= 7) return "diese_woche";
  return "spaeter";
}

const BUCKETS: { key: BucketKey; label: string; color: string }[] = [
  { key: "ueberfaellig", label: "Überfällig", color: "text-error" },
  { key: "heute", label: "Heute", color: "text-warning" },
  { key: "morgen", label: "Morgen", color: "text-warning" },
  { key: "diese_woche", label: "Diese Woche", color: "text-foreground" },
  { key: "spaeter", label: "Später", color: "text-muted-foreground" },
  { key: "kein", label: "Ohne Termin", color: "text-muted-foreground/60" },
];

const statusCfg = {
  offen: { label: "Offen", dot: "bg-error", bg: "bg-error-light", text: "text-error-foreground" },
  in_bearbeitung: { label: "In Bearbeitung", dot: "bg-warning", bg: "bg-warning-light", text: "text-warning-foreground" },
  erledigt: { label: "Erledigt", dot: "bg-success", bg: "bg-success-light", text: "text-success-foreground" },
};

const prioCfg = {
  hoch: { label: "Hoch", color: "bg-error", textColor: "text-error" },
  mittel: { label: "Mittel", color: "bg-warning", textColor: "text-warning" },
  niedrig: { label: "Niedrig", color: "bg-muted-foreground/40", textColor: "text-muted-foreground" },
};

type ViewKey = "mir" | "team" | "alle" | "erledigt";

// ── Main Component ──

export function ServiceDeskPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const view = (searchParams.get("view") || "mir") as ViewKey;
  const quelleFilter = (searchParams.get("quelle") || "") as Quelle | "";
  const typFilter = searchParams.get("typ") || "";
  const selectedId = searchParams.get("id") || null;

  const [filterOpen, setFilterOpen] = useState(false);
  const [localStatus, setLocalStatus] = useState<Record<string, string>>({});
  const [comments, setComments] = useState<Record<string, { text: string; by: string; at: string }[]>>({});
  const [draftComment, setDraftComment] = useState("");

  function setParam(updates: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams);
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    setSearchParams(next, { replace: true });
  }

  const entries = useMemo(() => {
    return unifiedEntries.map(e => ({
      ...e,
      status: (localStatus[e.id] || e.status) as "offen" | "in_bearbeitung" | "erledigt",
    }));
  }, [localStatus]);

  const filtered = useMemo(() => {
    let list = entries;
    if (view === "mir") list = list.filter(e => e.verantwortlich.initialen === CURRENT_USER);
    else if (view === "team") list = list.filter(e => MY_TEAM.includes(e.verantwortlich.initialen));
    else if (view === "erledigt") list = list.filter(e => e.status === "erledigt");
    if (view !== "erledigt") list = list.filter(e => e.status !== "erledigt");
    if (quelleFilter) list = list.filter(e => e.quelle === quelleFilter);
    if (typFilter) list = list.filter(e => e.typ === typFilter);
    return list;
  }, [entries, view, quelleFilter, typFilter]);

  // Auto-select first entry on desktop only (≥1024px).
  // On mobile, the list is the default — no auto-selection.
  useEffect(() => {
    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
    if (filtered.length === 0) {
      if (selectedId) setParam({ id: null });
      return;
    }
    if (isDesktop && !filtered.some(e => e.id === selectedId)) {
      setParam({ id: filtered[0].id });
    }
    if (!isDesktop && selectedId && !filtered.some(e => e.id === selectedId)) {
      setParam({ id: null });
    }
  }, [filtered, selectedId]);

  const selected = selectedId ? entries.find(e => e.id === selectedId) || null : null;

  const grouped = useMemo(() => {
    const g: Record<BucketKey, UnifiedEntry[]> = { ueberfaellig: [], heute: [], morgen: [], diese_woche: [], spaeter: [], kein: [] };
    filtered.forEach(e => {
      const b = faelligBucket(e.faellig);
      g[b].push(e);
    });
    for (const arr of Object.values(g)) arr.sort((a, b) => (a.faellig || "").localeCompare(b.faellig || ""));
    return g;
  }, [filtered]);

  const viewCounts = useMemo(() => ({
    mir: entries.filter(e => e.verantwortlich.initialen === CURRENT_USER && e.status !== "erledigt").length,
    team: entries.filter(e => MY_TEAM.includes(e.verantwortlich.initialen) && e.status !== "erledigt").length,
    alle: entries.filter(e => e.status !== "erledigt").length,
    erledigt: entries.filter(e => e.status === "erledigt").length,
  }), [entries]);

  const headerCounts = {
    offen: filtered.length,
    ueberfaellig: grouped.ueberfaellig.length,
    dieseWoche: grouped.heute.length + grouped.morgen.length + grouped.diese_woche.length,
  };

  const views: { id: ViewKey; label: string; icon: typeof User; count: number }[] = [
    { id: "mir", label: "Mir zugewiesen", icon: User, count: viewCounts.mir },
    { id: "team", label: "Mein Team", icon: Users, count: viewCounts.team },
    { id: "alle", label: "Alle", icon: Inbox, count: viewCounts.alle },
    { id: "erledigt", label: "Erledigt", icon: CheckCircle2, count: viewCounts.erledigt },
  ];

  const hasFilters = !!quelleFilter || !!typFilter;
  const allTypes = [...WORKFLOW_TYPES, ...TICKET_TYPES];

  function addComment(entryId: string) {
    if (!draftComment.trim()) return;
    setComments(prev => ({
      ...prev,
      [entryId]: [...(prev[entryId] || []), { text: draftComment.trim(), by: "Maria Keller", at: "jetzt" }],
    }));
    setDraftComment("");
  }

  return (
    <div className="flex flex-col lg:flex-row h-full">
      {/* ── LEFT: Views rail (desktop) / horizontal tabs (mobile) ── */}
      <div className="hidden lg:block w-[220px] shrink-0 border-r border-border-light bg-[#FAFBFC] overflow-y-auto" style={{ padding: "20px 14px" }}>
        <div className="text-[10.5px] text-muted-foreground uppercase tracking-wider px-2 pb-2" style={{ fontWeight: 500, letterSpacing: "0.08em" }}>
          Ansichten
        </div>
        {views.map(v => {
          const Icon = v.icon;
          const isActive = view === v.id;
          return (
            <button
              key={v.id}
              onClick={() => setParam({ view: v.id === "mir" ? null : v.id, id: null })}
              className={`w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] text-left mb-0.5 transition-colors cursor-pointer ${
                isActive ? "bg-primary-light text-primary" : "text-foreground hover:bg-muted/40"
              }`}
              style={{ fontWeight: isActive ? 500 : 400 }}
            >
              <Icon className={`w-[15px] h-[15px] shrink-0 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
              <span className="flex-1 truncate">{v.label}</span>
              <span className="text-[11px] text-muted-foreground" style={{ fontWeight: 500 }}>{v.count}</span>
            </button>
          );
        })}
      </div>

      {/* Mobile views tabs */}
      <div className="lg:hidden flex items-center gap-1 px-3 py-2 border-b border-border-light bg-[#FAFBFC] overflow-x-auto shrink-0">
        {views.map(v => {
          const Icon = v.icon;
          const isActive = view === v.id;
          return (
            <button
              key={v.id}
              onClick={() => setParam({ view: v.id === "mir" ? null : v.id, id: null })}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                isActive ? "bg-primary-light text-primary" : "text-muted-foreground hover:bg-muted/40"
              }`}
              style={{ fontWeight: isActive ? 500 : 400 }}
            >
              <Icon className="w-[14px] h-[14px]" />
              {v.label}
              <span className="text-[10px] opacity-70">{v.count}</span>
            </button>
          );
        })}
      </div>

      {/* ── MIDDLE: List ── */}
      <div className="flex-1 min-w-0 flex flex-col lg:border-r border-border-light">
        {/* Page header */}
        <div className="border-b border-border-light" style={{ padding: "14px 16px 10px" }}>
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <h1 className="text-foreground" style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.015em" }}>
                Pendenzenliste
              </h1>
              <div className="text-[12.5px] text-muted-foreground mt-[3px]">
                {headerCounts.offen} offene Einträge ·{" "}
                <span className={headerCounts.ueberfaellig > 0 ? "text-error-foreground" : ""} style={{ fontWeight: headerCounts.ueberfaellig > 0 ? 500 : 400 }}>
                  {headerCounts.ueberfaellig} überfällig
                </span>
                {" "}· {headerCounts.dieseWoche} diese Woche fällig
              </div>
            </div>
            <button className="inline-flex items-center gap-1.5 shrink-0 rounded-[10px] bg-primary text-primary-foreground hover:bg-primary-hover transition-colors cursor-pointer" style={{ padding: "8px 13px", fontSize: 12.5, fontWeight: 500 }}>
              <Plus className="w-[13px] h-[13px]" />
              Neues Ticket
            </button>
          </div>

          {/* Filter bar */}
          <div className="flex items-center gap-2 flex-wrap relative">
            <div className="relative">
              <button
                onClick={() => setFilterOpen(o => !o)}
                className={`inline-flex items-center gap-1.5 rounded-full border border-border text-[12px] text-foreground transition-colors cursor-pointer ${filterOpen ? "bg-secondary" : "bg-card hover:bg-secondary/60"}`}
                style={{ padding: "6px 11px", fontWeight: 500 }}
              >
                <SlidersHorizontal className="w-3 h-3" />
                Filter
                {hasFilters && <span className="w-[5px] h-[5px] rounded-full bg-primary" />}
              </button>

              {/* Filter popover */}
              {filterOpen && (
                <div className="absolute top-[calc(100%+6px)] left-0 z-20 bg-card border border-border rounded-xl w-[280px]" style={{ padding: 14, boxShadow: "0 8px 24px rgba(17,24,39,0.08)" }}>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[12px] text-foreground" style={{ fontWeight: 600 }}>Filter</span>
                    <button onClick={() => setFilterOpen(false)} className="text-muted-foreground p-0.5 cursor-pointer"><X className="w-[14px] h-[14px]" /></button>
                  </div>
                  <div className="text-[10.5px] text-muted-foreground uppercase mb-2" style={{ fontWeight: 500, letterSpacing: "0.08em" }}>Quelle</div>
                  <div className="flex gap-1.5 mb-3.5">
                    {([["workflow", "Workflow"], ["ticket", "Tickets"]] as const).map(([id, label]) => {
                      const active = quelleFilter === id;
                      return (
                        <button
                          key={id}
                          onClick={() => setParam({ quelle: active ? null : id, typ: null })}
                          className={`flex-1 rounded-lg text-[12px] border transition-colors cursor-pointer ${
                            active ? "border-primary bg-primary-light text-primary" : "border-border bg-card text-foreground hover:bg-secondary/60"
                          }`}
                          style={{ padding: "7px 10px", fontWeight: active ? 500 : 400 }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                  <div className="text-[10.5px] text-muted-foreground uppercase mb-2" style={{ fontWeight: 500, letterSpacing: "0.08em" }}>Typ</div>
                  <div className="flex flex-wrap gap-1">
                    {allTypes.map(t => {
                      const active = typFilter === t.id;
                      return (
                        <button
                          key={t.id}
                          onClick={() => setParam({ typ: active ? null : t.id })}
                          className={`rounded-full text-[11.5px] border transition-colors cursor-pointer ${
                            active ? "border-primary bg-primary-light text-primary" : "border-border bg-card text-foreground hover:bg-secondary/60"
                          }`}
                          style={{ padding: "5px 10px", fontWeight: active ? 500 : 400 }}
                        >
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {quelleFilter && (
              <button onClick={() => setParam({ quelle: null })} className="inline-flex items-center gap-1 rounded-full bg-primary-light text-primary text-[11.5px] cursor-pointer" style={{ padding: "5px 10px", fontWeight: 500 }}>
                Quelle: {quelleFilter === "workflow" ? "Workflow" : "Tickets"} <X className="w-[11px] h-[11px]" />
              </button>
            )}
            {typFilter && (
              <button onClick={() => setParam({ typ: null })} className="inline-flex items-center gap-1 rounded-full bg-primary-light text-primary text-[11.5px] cursor-pointer" style={{ padding: "5px 10px", fontWeight: 500 }}>
                Typ: {allTypes.find(t => t.id === typFilter)?.label || typFilter} <X className="w-[11px] h-[11px]" />
              </button>
            )}
            {hasFilters && (
              <button onClick={() => setParam({ quelle: null, typ: null })} className="text-[11.5px] text-muted-foreground cursor-pointer" style={{ padding: "5px 6px", fontWeight: 500 }}>
                Alle zurücksetzen
              </button>
            )}
          </div>
        </div>

        {/* Grouped list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 && (
            <div className="text-center text-muted-foreground text-[13px]" style={{ padding: 56 }}>
              Keine Einträge mit diesen Filtern.
            </div>
          )}
          {BUCKETS.map(bucket => {
            const items = grouped[bucket.key];
            if (!items || items.length === 0) return null;
            return (
              <div key={bucket.key}>
                <div className="flex items-center gap-2.5 bg-[#FAFBFC] border-y border-border-light" style={{ padding: "10px 24px" }}>
                  <span className={`text-[11px] uppercase ${bucket.color}`} style={{ fontWeight: 600, letterSpacing: "0.08em" }}>
                    {bucket.label}
                  </span>
                  <span className="text-[11px] text-muted-foreground" style={{ fontWeight: 500 }}>{items.length}</span>
                </div>
                {items.map(e => {
                  const isSelected = selectedId === e.id;
                  const b = faelligBucket(e.faellig);
                  const d = daysFromToday(e.faellig);
                  const dateLabel = b === "ueberfaellig"
                    ? `${Math.abs(d!)} ${Math.abs(d!) === 1 ? "Tag" : "Tage"} überfällig`
                    : b === "heute" ? "heute" : b === "morgen" ? "morgen"
                    : e.faellig ? formatShort(e.faellig) : "—";
                  const dateColor = b === "ueberfaellig" ? "text-error" : b === "heute" || b === "morgen" ? "text-warning" : "text-muted-foreground";
                  const tc = e.quelle === "workflow" ? { text: "text-primary", bg: "bg-primary-light" } : { text: "text-info-foreground", bg: "bg-info-light" };

                  return (
                    <button
                      key={e.id}
                      onClick={() => setParam({ id: e.id })}
                      className={`w-full text-left transition-colors cursor-pointer ${isSelected ? "bg-primary-light" : "hover:bg-primary/[0.03]"}`}
                      style={{ display: "grid", gridTemplateColumns: "4px 1fr auto", gap: 12, padding: "11px 24px 11px 20px", borderBottom: "1px solid #F7F8FA" }}
                    >
                      <div className={`w-1 rounded-sm ${prioCfg[e.prioritaet].color}`} style={{ height: 36, opacity: e.prioritaet === "niedrig" ? 0.3 : 0.9 }} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-[3px]">
                          <span className={`inline-flex items-center rounded-md text-[11px] ${tc.bg} ${tc.text}`} style={{ padding: "2px 7px", fontWeight: 500 }}>
                            {e.typLabel}
                          </span>
                          <span className={`text-[13px] truncate ${isSelected ? "text-primary" : "text-foreground"}`} style={{ fontWeight: 500 }}>
                            {entryTitle(e)}
                          </span>
                        </div>
                        <div className="text-[11.5px] text-muted-foreground truncate">{e.kontext}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={`text-[11.5px] ${dateColor}`} style={{ fontWeight: 500 }}>{dateLabel}</span>
                        {e.verantwortlich && (
                          <div className="w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0" style={{ background: e.verantwortlich.color ? `${e.verantwortlich.color}15` : "#F3F4F6" }}>
                            <span className="text-[8.5px]" style={{ fontWeight: 600, color: e.verantwortlich.color || "#6B7280" }}>{e.verantwortlich.initialen}</span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── RIGHT: Detail pane ── */}
      <div className="hidden lg:block w-[540px] shrink-0 bg-[#FAFBFC] overflow-y-auto">
        {selected ? (
          <div style={{ padding: "20px 22px 28px" }} className="flex flex-col gap-[16px]">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <span className={`inline-flex items-center rounded-md text-[11px] ${selected.quelle === "workflow" ? "bg-primary-light text-primary" : "bg-info-light text-info-foreground"}`} style={{ padding: "2px 7px", fontWeight: 500 }}>
                  {selected.typLabel}
                </span>
                <span className="text-[10.5px] text-muted-foreground font-mono">{selected.id}</span>
                <div className="flex-1" />
                <button className="p-1 text-muted-foreground cursor-pointer"><MoreHorizontal className="w-4 h-4" /></button>
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.3 }} className="text-foreground">
                {entryTitle(selected)}
              </h2>
              <p className="text-[13px] text-muted-foreground mt-1.5" style={{ lineHeight: 1.5 }}>{selected.kontext}</p>
              {selected.beschreibung && (
                <div className="text-[12.5px] text-foreground/80 mt-3" style={{ lineHeight: 1.55 }}>
                  {selected.beschreibung}
                </div>
              )}
            </div>

            {/* Urgency alert */}
            {(() => {
              const b = faelligBucket(selected.faellig);
              const d = daysFromToday(selected.faellig);
              if (b === "ueberfaellig") return (
                <div className="flex items-center gap-2 rounded-[10px] bg-error-light" style={{ padding: "9px 12px" }}>
                  <AlertTriangle className="w-[14px] h-[14px] text-error" />
                  <span className="text-[12px] text-error-foreground" style={{ fontWeight: 500 }}>{Math.abs(d!)} {Math.abs(d!) === 1 ? "Tag" : "Tage"} überfällig</span>
                </div>
              );
              if (b === "heute") return (
                <div className="flex items-center gap-2 rounded-[10px] bg-warning-light" style={{ padding: "9px 12px" }}>
                  <AlertTriangle className="w-[14px] h-[14px] text-warning" />
                  <span className="text-[12px] text-warning-foreground" style={{ fontWeight: 500 }}>heute fällig</span>
                </div>
              );
              return null;
            })()}

            {/* Meta card */}
            <div className="bg-card border border-border-light rounded-[10px]" style={{ padding: 14 }}>
              <div className="grid grid-cols-2" style={{ rowGap: 14, columnGap: 16 }}>
                <MetaCell label="Typ">
                  <span className={`inline-flex items-center rounded-md text-[11px] ${selected.quelle === "workflow" ? "bg-primary-light text-primary" : "bg-info-light text-info-foreground"}`} style={{ padding: "2px 7px", fontWeight: 500 }}>
                    {selected.typLabel}
                  </span>
                </MetaCell>
                <MetaCell label="Status">
                  {(() => { const s = statusCfg[selected.status]; return (
                    <span className={`inline-flex items-center gap-1.5 rounded-full text-[11px] ${s.bg} ${s.text}`} style={{ padding: "2px 8px", fontWeight: 500 }}>
                      <span className={`w-[5px] h-[5px] rounded-full ${s.dot}`} /> {s.label}
                    </span>
                  ); })()}
                </MetaCell>
                {selected.person && (
                  <MetaCell label="Betroffene Person">
                    <span className="inline-flex items-center gap-1.5">
                      <Avatar person={selected.person} size={18} />
                      <span className="text-[12.5px]" style={{ fontWeight: 500 }}>{selected.person.name}</span>
                    </span>
                  </MetaCell>
                )}
                <MetaCell label="Verantwortlich">
                  <span className="inline-flex items-center gap-1.5">
                    <Avatar person={selected.verantwortlich} size={18} />
                    <span className="text-[12.5px]" style={{ fontWeight: 500 }}>{selected.verantwortlich.name}</span>
                  </span>
                </MetaCell>
                <MetaCell label="Priorität">
                  <span className={`inline-flex items-center gap-1.5 text-[12.5px] ${prioCfg[selected.prioritaet].textColor}`} style={{ fontWeight: 500 }}>
                    <span className={`w-[6px] h-[6px] rounded-full ${prioCfg[selected.prioritaet].color}`} />
                    {prioCfg[selected.prioritaet].label}
                  </span>
                </MetaCell>
                <MetaCell label="Fällig">
                  {selected.faellig ? (
                    <span className={`inline-flex items-center gap-1.5 text-[12px] ${faelligBucket(selected.faellig) === "ueberfaellig" ? "text-error-foreground" : faelligBucket(selected.faellig) === "heute" ? "text-warning-foreground" : "text-muted-foreground"}`} style={{ fontWeight: faelligBucket(selected.faellig) === "ueberfaellig" || faelligBucket(selected.faellig) === "heute" ? 500 : 400 }}>
                      <span className={`w-[5px] h-[5px] rounded-full ${faelligBucket(selected.faellig) === "ueberfaellig" ? "bg-error" : faelligBucket(selected.faellig) === "heute" ? "bg-warning" : "bg-muted-foreground/30"}`} />
                      {formatDate(selected.faellig)}
                    </span>
                  ) : <span className="text-[12px] text-muted-foreground">—</span>}
                </MetaCell>
                <MetaCell label="Erstellt">
                  <span className="text-[12px] text-muted-foreground">{formatDate(selected.erstellt)}</span>
                </MetaCell>
              </div>
            </div>

            {/* Aktionen */}
            <div className="bg-card border border-border-light rounded-[10px]" style={{ padding: 14 }}>
              <textarea
                value={draftComment}
                onChange={(e) => setDraftComment(e.target.value)}
                placeholder="Kommentar hinzufügen…"
                className="w-full rounded-lg border border-border text-[12.5px] text-foreground outline-none resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary/60"
                style={{ padding: "8px 10px", minHeight: 48, lineHeight: 1.4 }}
              />
              <div className="flex items-center gap-2 mt-2">
                <select
                  value={localStatus[selected.id] || selected.status}
                  onChange={(e) => setLocalStatus(prev => ({ ...prev, [selected.id]: e.target.value }))}
                  className="rounded-lg border border-border bg-card text-[12px] text-foreground outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/60"
                  style={{ padding: "5px 8px" }}
                >
                  <option value="offen">Offen</option>
                  <option value="in_bearbeitung">In Bearbeitung</option>
                  <option value="erledigt">Erledigt</option>
                </select>
                <div className="flex-1" />
                <button
                  onClick={() => setLocalStatus(prev => ({ ...prev, [selected.id]: "erledigt" }))}
                  className={`inline-flex items-center gap-1 rounded-lg text-[11.5px] cursor-pointer transition-colors ${
                    (localStatus[selected.id] || selected.status) === "erledigt"
                      ? "bg-success-light text-success-foreground border border-success-medium"
                      : "border border-border text-foreground hover:bg-secondary/60"
                  }`}
                  style={{ padding: "5px 9px", fontWeight: 500 }}
                >
                  <Check className="w-3 h-3" />
                  {(localStatus[selected.id] || selected.status) === "erledigt" ? "Erledigt" : "Erledigen"}
                </button>
                <button
                  onClick={() => addComment(selected.id)}
                  disabled={!draftComment.trim()}
                  className="inline-flex items-center gap-1 rounded-lg text-[11.5px] bg-primary text-primary-foreground hover:bg-primary-hover transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ padding: "5px 10px", fontWeight: 500 }}
                >
                  Senden
                </button>
              </div>
            </div>

            {/* Verlauf */}
            <div>
              <div className="text-[11px] text-muted-foreground uppercase mb-2.5" style={{ fontWeight: 500, letterSpacing: "0.08em" }}>Verlauf</div>
              <div className="flex flex-col gap-2.5">
                {[...(comments[selected.id] || [])].reverse().map((c, i) => (
                  <VerlaufEvent key={`c-${i}`} dotColor="bg-primary" actor={c.by} text={`kommentiert: "${c.text}"`} date={c.at} />
                ))}
                {selected.status === "in_bearbeitung" && (
                  <VerlaufEvent dotColor="bg-warning" actor={selected.verantwortlich.name} text="Status auf ‚In Bearbeitung' gesetzt" date={formatDate(selected.erstellt)} />
                )}
                <VerlaufEvent dotColor="bg-muted-foreground" actor={selected.verantwortlich.name} text="Eintrag erstellt" date={formatDate(selected.erstellt)} />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground text-[13px] h-full" style={{ padding: 40 }}>
            <Inbox className="w-8 h-8 text-muted-foreground/30 mb-3" />
            Wähle einen Eintrag, um Details zu sehen.
          </div>
        )}
      </div>

      {/* ── MOBILE: Full-screen detail ── */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col lg:hidden">
          {/* Mobile detail header */}
          <div className="flex items-center gap-3 px-3 py-3 border-b border-border shrink-0">
            <button
              onClick={() => setParam({ id: null })}
              aria-label="Zurück zur Pendenzenliste"
              className="p-2 -ml-1 rounded-xl hover:bg-secondary transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <div className="flex-1 min-w-0 text-center">
              <span className="text-[13px] text-foreground truncate block" style={{ fontWeight: 600 }}>
                {entryTitle(selected)}
              </span>
            </div>
            <button className="p-2 -mr-1 rounded-xl hover:bg-secondary transition-colors">
              <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Mobile detail body */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 flex flex-col gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-flex items-center rounded-md text-[11px] ${selected.quelle === "workflow" ? "bg-primary-light text-primary" : "bg-info-light text-info-foreground"}`} style={{ padding: "2px 7px", fontWeight: 500 }}>
                    {selected.typLabel}
                  </span>
                  <span className="text-[10.5px] text-muted-foreground font-mono">{selected.id}</span>
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.3 }} className="text-foreground">
                  {entryTitle(selected)}
                </h2>
                <p className="text-[13px] text-muted-foreground mt-1.5" style={{ lineHeight: 1.5 }}>{selected.kontext}</p>
                {selected.beschreibung && (
                  <div className="text-[13px] text-foreground/80 mt-3" style={{ lineHeight: 1.55 }}>
                    {selected.beschreibung}
                  </div>
                )}
              </div>

              {(() => {
                const b = faelligBucket(selected.faellig);
                const d = daysFromToday(selected.faellig);
                if (b === "ueberfaellig") return (
                  <div className="flex items-center gap-2 rounded-[10px] bg-error-light" style={{ padding: "9px 12px" }}>
                    <AlertTriangle className="w-[14px] h-[14px] text-error" />
                    <span className="text-[12px] text-error-foreground" style={{ fontWeight: 500 }}>{Math.abs(d!)} {Math.abs(d!) === 1 ? "Tag" : "Tage"} überfällig</span>
                  </div>
                );
                if (b === "heute") return (
                  <div className="flex items-center gap-2 rounded-[10px] bg-warning-light" style={{ padding: "9px 12px" }}>
                    <AlertTriangle className="w-[14px] h-[14px] text-warning" />
                    <span className="text-[12px] text-warning-foreground" style={{ fontWeight: 500 }}>heute fällig</span>
                  </div>
                );
                return null;
              })()}

              <div className="bg-card border border-border-light rounded-[10px]" style={{ padding: 14 }}>
                <div className="grid grid-cols-2" style={{ rowGap: 14, columnGap: 16 }}>
                  <MetaCell label="Status">
                    {(() => { const s = statusCfg[selected.status]; return (
                      <span className={`inline-flex items-center gap-1.5 rounded-full text-[11px] ${s.bg} ${s.text}`} style={{ padding: "2px 8px", fontWeight: 500 }}>
                        <span className={`w-[5px] h-[5px] rounded-full ${s.dot}`} /> {s.label}
                      </span>
                    ); })()}
                  </MetaCell>
                  <MetaCell label="Priorität">
                    <span className={`inline-flex items-center gap-1.5 text-[12.5px] ${prioCfg[selected.prioritaet].textColor}`} style={{ fontWeight: 500 }}>
                      <span className={`w-[6px] h-[6px] rounded-full ${prioCfg[selected.prioritaet].color}`} />
                      {prioCfg[selected.prioritaet].label}
                    </span>
                  </MetaCell>
                  {selected.person && (
                    <MetaCell label="Betroffene Person">
                      <span className="inline-flex items-center gap-1.5">
                        <Avatar person={selected.person} size={18} />
                        <span className="text-[12.5px]" style={{ fontWeight: 500 }}>{selected.person.name}</span>
                      </span>
                    </MetaCell>
                  )}
                  <MetaCell label="Verantwortlich">
                    <span className="inline-flex items-center gap-1.5">
                      <Avatar person={selected.verantwortlich} size={18} />
                      <span className="text-[12.5px]" style={{ fontWeight: 500 }}>{selected.verantwortlich.name}</span>
                    </span>
                  </MetaCell>
                  <MetaCell label="Fällig">
                    {selected.faellig ? (
                      <span className="text-[12px] text-muted-foreground">{formatDate(selected.faellig)}</span>
                    ) : <span className="text-[12px] text-muted-foreground">—</span>}
                  </MetaCell>
                  <MetaCell label="Erstellt">
                    <span className="text-[12px] text-muted-foreground">{formatDate(selected.erstellt)}</span>
                  </MetaCell>
                </div>
              </div>

              <div>
                <div className="text-[11px] text-muted-foreground uppercase mb-2.5" style={{ fontWeight: 500, letterSpacing: "0.08em" }}>Verlauf</div>
                <div className="flex flex-col gap-2.5">
                  {[...(comments[selected.id] || [])].reverse().map((c, i) => (
                    <VerlaufEvent key={`c-${i}`} dotColor="bg-primary" actor={c.by} text={`kommentiert: "${c.text}"`} date={c.at} />
                  ))}
                  {selected.status === "in_bearbeitung" && (
                    <VerlaufEvent dotColor="bg-warning" actor={selected.verantwortlich.name} text="Status auf ‚In Bearbeitung' gesetzt" date={formatDate(selected.erstellt)} />
                  )}
                  <VerlaufEvent dotColor="bg-muted-foreground" actor={selected.verantwortlich.name} text="Eintrag erstellt" date={formatDate(selected.erstellt)} />
                </div>
              </div>
            </div>
          </div>

          {/* Mobile detail footer — sticky actions */}
          <div className="shrink-0 border-t border-border bg-card p-3 space-y-2">
            <textarea
              value={draftComment}
              onChange={(e) => setDraftComment(e.target.value)}
              placeholder="Kommentar hinzufügen…"
              className="w-full rounded-lg border border-border text-[14px] text-foreground outline-none resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary/60"
              style={{ padding: "10px 12px", minHeight: 44, lineHeight: 1.4 }}
            />
            <div className="flex items-center gap-2">
              <select
                value={localStatus[selected.id] || selected.status}
                onChange={(e) => setLocalStatus(prev => ({ ...prev, [selected.id]: e.target.value }))}
                className="rounded-lg border border-border bg-card text-[13px] text-foreground outline-none"
                style={{ padding: "8px 10px", minHeight: 44 }}
              >
                <option value="offen">Offen</option>
                <option value="in_bearbeitung">In Bearbeitung</option>
                <option value="erledigt">Erledigt</option>
              </select>
              <div className="flex-1" />
              <button
                onClick={() => setLocalStatus(prev => ({ ...prev, [selected.id]: "erledigt" }))}
                className={`inline-flex items-center gap-1.5 rounded-lg text-[13px] cursor-pointer transition-colors ${
                  (localStatus[selected.id] || selected.status) === "erledigt"
                    ? "bg-success-light text-success-foreground border border-success-medium"
                    : "border border-border text-foreground hover:bg-secondary/60"
                }`}
                style={{ padding: "8px 12px", fontWeight: 500, minHeight: 44 }}
              >
                <Check className="w-4 h-4" />
                {(localStatus[selected.id] || selected.status) === "erledigt" ? "Erledigt" : "Erledigen"}
              </button>
              <button
                onClick={() => addComment(selected.id)}
                disabled={!draftComment.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg text-[13px] bg-primary text-primary-foreground hover:bg-primary-hover transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ padding: "8px 12px", fontWeight: 500, minHeight: 44 }}
              >
                Senden
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ──

function MetaCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] text-muted-foreground uppercase mb-1" style={{ fontWeight: 500, letterSpacing: "0.08em" }}>{label}</div>
      <div>{children}</div>
    </div>
  );
}

function VerlaufEvent({ dotColor, actor, text, date }: { dotColor: string; actor: string; text: string; date: string }) {
  return (
    <div className="flex gap-2.5 items-start">
      <div className={`w-[6px] h-[6px] rounded-full ${dotColor} mt-1.5 shrink-0`} />
      <div className="flex-1">
        <div className="text-[12px] text-foreground">
          <span style={{ fontWeight: 500 }}>{actor}</span> · {text}
        </div>
        <div className="text-[11px] text-muted-foreground mt-[1px]">{date}</div>
      </div>
    </div>
  );
}

function Avatar({ person, size = 24 }: { person: { name: string; initialen: string; color?: string }; size?: number }) {
  return (
    <div
      className="rounded-full inline-flex items-center justify-center shrink-0"
      style={{
        width: size,
        height: size,
        background: person.color ? `${person.color}15` : "#F3F4F6",
        color: person.color || "#6B7280",
        fontSize: size <= 18 ? 8.5 : size <= 22 ? 9.5 : 10.5,
        fontWeight: 600,
        letterSpacing: 0.2,
      }}
    >
      {person.initialen}
    </div>
  );
}
