import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams } from "react-router";
import {
  Inbox,
  SlidersHorizontal,
  Plus,
  X,
  AlertTriangle,
  Check,
  ArrowLeft,
  Send,
  Sparkles,
  Square,
  CheckSquare,
  LayoutDashboard,
} from "lucide-react";
import {
  unifiedEntries,
  entryTitle,
  CURRENT_USER,
  MY_TEAM,
  type UnifiedEntry,
} from "../../lib/mocks/service-desk-unified";
import { pendenzTypen } from "../../types/pendenz";
import { useCurrentRole } from "../auth";
import { AnnaListenEinordnung, type ListenKontext } from "../anna/AnnaListenEinordnung";
import { AnnaPendenzVorschlag } from "../anna/AnnaPendenzVorschlag";
import { AnnaDemoMockModal } from "../anna/AnnaDemoMockModal";
import { PendenzenManagementUebersicht } from "./PendenzenManagementUebersicht";
import { toast } from "sonner";
import type { UserRole } from "../../types/user";

const TODAY = "2026-03-03";

/* ══════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════ */

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

type BucketKey = "ueberfaellig" | "heute" | "diese_woche" | "spaeter" | "kein";

function faelligBucket(iso: string | null): BucketKey {
  if (!iso) return "kein";
  const d = daysFromToday(iso)!;
  if (d < 0) return "ueberfaellig";
  if (d === 0) return "heute";
  if (d <= 7) return "diese_woche";
  return "spaeter";
}

const BUCKETS: { key: BucketKey; label: string }[] = [
  { key: "ueberfaellig", label: "Überfällig" },
  { key: "heute", label: "Heute" },
  { key: "diese_woche", label: "Diese Woche" },
  { key: "spaeter", label: "Später" },
  { key: "kein", label: "Ohne Termin" },
];

function faelligLabel(iso: string | null): string {
  if (!iso) return "–";
  const d = daysFromToday(iso)!;
  if (d < -1) return `${Math.abs(d)} T. überfällig`;
  if (d === -1) return "Gestern";
  if (d === 0) return "Heute";
  if (d === 1) return "Morgen";
  return formatShort(iso);
}

type ViewKey = "mir" | "team" | "alle" | "erledigt";

const VIEW_DEFS: { key: ViewKey; label: string }[] = [
  { key: "mir", label: "Mir zugewiesen" },
  { key: "team", label: "Mein Team" },
  { key: "alle", label: "Alle" },
  { key: "erledigt", label: "Erledigt" },
];

const STATUS_CFG: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  offen: { label: "Offen", bg: "var(--status-danger-bg)", color: "var(--status-danger)", dot: "var(--status-danger)" },
  in_bearbeitung: { label: "In Bearbeitung", bg: "var(--status-warning-bg)", color: "var(--status-warning-text)", dot: "var(--status-warning)" },
  erledigt: { label: "Erledigt", bg: "var(--status-success-bg)", color: "var(--status-success-text)", dot: "var(--status-success)" },
};

const PRIO_CFG: Record<string, { label: string; color: string }> = {
  hoch: { label: "Hoch", color: "var(--status-danger)" },
  mittel: { label: "Mittel", color: "var(--status-warning)" },
  niedrig: { label: "Niedrig", color: "var(--text-tertiary)" },
};

/* ══════════════════════════════════════════
   ROLE-SPECIFIC DEFAULTS
   ══════════════════════════════════════════ */

function getDefaultView(role: UserRole): ViewKey {
  if (role === "diplomiert") return "mir";
  return "alle";
}

function getViewOrder(role: UserRole): ViewKey[] {
  if (role === "diplomiert") return ["mir", "team", "alle", "erledigt"];
  return ["alle", "team", "mir", "erledigt"];
}

function sortScore(e: UnifiedEntry, role: UserRole): number {
  const isOverdue = e.faellig && daysFromToday(e.faellig)! < 0;
  const daysLeft = e.faellig ? daysFromToday(e.faellig)! : 999;
  const prioWeight = e.prioritaet === "hoch" ? 0 : e.prioritaet === "mittel" ? 100 : 200;

  if (role === "diplomiert") {
    const clinicalTypes = ["aub-vertretung", "klv-verordnung", "pflegestufen-wechsel", "beschwerde", "re-assessment"];
    const typBonus = clinicalTypes.includes(e.pendenzTyp) ? -50 : 0;
    return (isOverdue ? -1000 : 0) + daysLeft + prioWeight + typBonus;
  }
  if (role === "backoffice") {
    const adminTypes = ["srk-anmeldung", "quellensteuer", "ausweis-b-migrationsamt", "personaldaten", "kinderzulagen", "lohn-anpassung"];
    const typBonus = adminTypes.includes(e.pendenzTyp) ? -50 : 0;
    return (isOverdue ? -1000 : 0) + daysLeft + prioWeight + typBonus;
  }
  const escalationTypes = ["beschwerde", "compliance-audit"];
  const typBonus = escalationTypes.includes(e.pendenzTyp) ? -50 : 0;
  return (isOverdue ? -1000 : 0) + prioWeight + daysLeft + typBonus;
}

/* ══════════════════════════════════════════
   ANNA CONTEXT
   ══════════════════════════════════════════ */

function buildAnnaContext(entries: UnifiedEntry[], role: UserRole): ListenKontext {
  const active = entries.filter(e => e.status !== "erledigt");
  const overdue = active.filter(e => e.faellig && daysFromToday(e.faellig)! < 0);
  const byStatus: Record<string, number> = {};
  for (const e of active) byStatus[e.status] = (byStatus[e.status] || 0) + 1;
  if (overdue.length > 0) byStatus["ueberfaellig"] = overdue.length;

  const highlights: string[] = [];

  if (role === "diplomiert") {
    const aubCount = active.filter(e => e.pendenzTyp === "aub-vertretung").length;
    const klvCount = active.filter(e => e.pendenzTyp === "klv-verordnung" || e.pendenzTyp === "re-assessment").length;
    if (overdue.length > 0) highlights.push(`${overdue.length} ${overdue.length === 1 ? "Pendenz ist" : "Pendenzen sind"} überfällig und ${overdue.length === 1 ? "betrifft" : "betreffen"} direkt Patienten`);
    if (aubCount > 0) highlights.push(`${aubCount} AUB-Vertretung${aubCount > 1 ? "en" : ""} – Patienten brauchen Betreuung`);
    if (klvCount > 0) highlights.push(`${klvCount} KLV/Re-Assessment${klvCount > 1 ? "s" : ""} demnächst fällig`);
  } else if (role === "backoffice") {
    const srkCount = active.filter(e => e.pendenzTyp === "srk-anmeldung").length;
    const qstCount = active.filter(e => e.pendenzTyp === "quellensteuer").length;
    if (qstCount > 0) highlights.push(`${qstCount} Quellensteuer-Anmeldung${qstCount > 1 ? "en" : ""} diese Woche fällig`);
    if (srkCount > 0) highlights.push(`${srkCount} SRK-Anmeldung${srkCount > 1 ? "en" : ""} nahe der 1-Jahres-Frist`);
    if (overdue.length > 0) highlights.push(`${overdue.length} überfällig – behördliche Konsequenzen möglich`);
  } else {
    if (overdue.length > 0) highlights.push(`${overdue.length} überfällig – Eskalationsrisiko`);
    const personCounts: Record<string, number> = {};
    for (const e of active) personCounts[e.verantwortlich.initialen] = (personCounts[e.verantwortlich.initialen] || 0) + 1;
    const top = Object.entries(personCounts).sort((a, b) => b[1] - a[1])[0];
    if (top && top[1] >= 3) highlights.push(`${top[1]} Pendenzen bei ${active.find(e => e.verantwortlich.initialen === top[0])?.verantwortlich.name} – möglicher Engpass`);
  }

  return { seite: `pendenzen_${role}`, totalCount: active.length, byStatus, highlights };
}

/* ══════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════ */

const MGMT_VIEW_KEY = "pendenzen-view:management";

export function ServiceDeskPage() {
  const role = useCurrentRole();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mgmtView, setMgmtViewState] = useState<"dashboard" | "list">(() => {
    if (role !== "management") return "dashboard";
    const stored = sessionStorage.getItem(MGMT_VIEW_KEY);
    return stored === "list" ? "list" : "dashboard";
  });

  const setMgmtView = (v: "dashboard" | "list") => {
    setMgmtViewState(v);
    sessionStorage.setItem(MGMT_VIEW_KEY, v);
  };

  // Management sees dashboard by default; toggle to list
  const showManagementDashboard = role === "management" && mgmtView === "dashboard";

  const defaultView = getDefaultView(role);
  const view = (searchParams.get("view") || defaultView) as ViewKey;
  const selectedId = searchParams.get("id") || null;

  const [filterCount] = useState(0);
  const [localStatus, setLocalStatus] = useState<Record<string, string>>({});
  const [comments, setComments] = useState<Record<string, { text: string; by: string; at: string }[]>>({});
  const [draftComment, setDraftComment] = useState("");
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());
  const prevRole = useRef(role);

  function setParam(updates: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams);
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    setSearchParams(next, { replace: true });
  }

  // Reset view, selection, and management toggle on role switch
  useEffect(() => {
    if (prevRole.current !== role) {
      prevRole.current = role;
      setParam({ view: null, id: null });
      setMgmtViewState("dashboard");
      sessionStorage.removeItem(MGMT_VIEW_KEY);
      setBulkSelected(new Set());
    }
  }, [role]);

  // Filtered entries
  const filtered = useMemo(() => {
    let list = unifiedEntries.map(e => ({
      ...e,
      status: (localStatus[e.id] || e.status) as UnifiedEntry["status"],
    }));

    if (view === "mir") list = list.filter(e => e.verantwortlich.initialen === CURRENT_USER && e.status !== "erledigt");
    else if (view === "team") list = list.filter(e => MY_TEAM.includes(e.verantwortlich.initialen) && e.status !== "erledigt");
    else if (view === "erledigt") list = list.filter(e => e.status === "erledigt");
    else list = list.filter(e => e.status !== "erledigt");

    list.sort((a, b) => sortScore(a, role) - sortScore(b, role));
    return list;
  }, [view, localStatus, role]);

  // Bucketed entries
  const bucketed = useMemo(() => {
    const groups: Record<BucketKey, UnifiedEntry[]> = {
      ueberfaellig: [], heute: [], diese_woche: [], spaeter: [], kein: [],
    };
    for (const e of filtered) groups[faelligBucket(e.faellig)].push(e);
    return groups;
  }, [filtered]);

  // View counts
  const viewCounts = useMemo(() => {
    const all = unifiedEntries.map(e => ({ ...e, status: (localStatus[e.id] || e.status) as UnifiedEntry["status"] }));
    return {
      mir: all.filter(e => e.verantwortlich.initialen === CURRENT_USER && e.status !== "erledigt").length,
      team: all.filter(e => MY_TEAM.includes(e.verantwortlich.initialen) && e.status !== "erledigt").length,
      alle: all.filter(e => e.status !== "erledigt").length,
      erledigt: all.filter(e => e.status === "erledigt").length,
    };
  }, [localStatus]);

  // Selected entry
  const selected = useMemo(() => {
    if (!selectedId) return null;
    const e = unifiedEntries.find(e => e.id === selectedId);
    if (!e) return null;
    return { ...e, status: (localStatus[e.id] || e.status) as UnifiedEntry["status"] };
  }, [selectedId, localStatus]);

  // Anna context
  const annaContext = useMemo(() => buildAnnaContext(unifiedEntries, role), [role]);

  const viewOrder = getViewOrder(role);

  const handleStatusChange = (id: string, newStatus: string) => {
    setLocalStatus(prev => ({ ...prev, [id]: newStatus }));
  };

  const handleAddComment = (id: string) => {
    if (!draftComment.trim()) return;
    setComments(prev => ({
      ...prev,
      [id]: [...(prev[id] || []), { text: draftComment.trim(), by: "Maria Keller", at: "03.03.2026, 14:30" }],
    }));
    setDraftComment("");
  };

  // Demo mock modal
  const [demoModal, setDemoModal] = useState<{ open: boolean; mockType: string; pendenzId: string }>({ open: false, mockType: "", pendenzId: "" });

  const handleDemoAction = (mockType: string) => {
    if (selectedId) setDemoModal({ open: true, mockType, pendenzId: selectedId });
  };

  const handleDemoConfirm = () => {
    const id = demoModal.pendenzId;
    setDemoModal({ open: false, mockType: "", pendenzId: "" });
    handleStatusChange(id, "erledigt");
    setComments(prev => ({
      ...prev,
      [id]: [...(prev[id] || []), { text: "Anna (Demo) hat die Aktion ausgeführt", by: "Anna", at: "03.03.2026, 14:32" }],
    }));
  };

  // Bulk selection
  const toggleBulk = (id: string) => {
    setBulkSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const bulkEntries = useMemo(() => filtered.filter(e => bulkSelected.has(e.id)), [filtered, bulkSelected]);
  const bulkAllSameType = bulkEntries.length > 0 && bulkEntries.every(e => e.pendenzTyp === bulkEntries[0].pendenzTyp);
  const bulkTypDef = bulkAllSameType ? pendenzTypen[bulkEntries[0].pendenzTyp] : null;
  const bulkAction = bulkTypDef?.bulkAction;

  const handleBulkExecute = () => {
    for (const id of bulkSelected) {
      handleStatusChange(id, bulkAction?.isDemoMock ? "erledigt" : "in_bearbeitung");
      setComments(prev => ({
        ...prev,
        [id]: [...(prev[id] || []), { text: bulkAction?.isDemoMock ? "Anna (Demo): Bulk-Aktion ausgeführt" : `Anna: ${bulkAction?.label || "Aktion"} ausgeführt`, by: "Anna", at: "03.03.2026, 14:35" }],
      }));
    }
    toast(bulkAction?.resultDescription?.replace("{N}", String(bulkSelected.size)) || `${bulkSelected.size} Pendenzen aktualisiert`);
    setBulkSelected(new Set());
  };

  const handleBulkErledigen = () => {
    for (const id of bulkSelected) handleStatusChange(id, "erledigt");
    toast(`${bulkSelected.size} Pendenzen erledigt`);
    setBulkSelected(new Set());
  };

  const handleCardClick = (id: string) => {
    if (id === selectedId) setParam({ id: null });
    else setParam({ id });
  };

  const isBulkMode = role === "backoffice" || (role === "management" && mgmtView === "list");

  // Management dashboard view
  if (showManagementDashboard) {
    return (
      <div className="flex h-full min-h-0">
        <div className="flex-1 min-w-0">
          <PendenzenManagementUebersicht
            onSwitchToList={() => setMgmtView("list")}
            onSelectPendenz={id => setParam({ id })}
          />
        </div>
        {selected && (
          <div className="hidden xl:flex shrink-0 flex-col min-h-0" style={{
            width: 520, background: "var(--bg-elevated)",
            border: "var(--border-thin) solid var(--border-default)",
            borderRadius: "var(--radius-card)", overflow: "hidden",
          }}>
            <DetailPanel
              entry={selected}
              comments={comments[selected.id] || []}
              draftComment={draftComment}
              onDraftChange={setDraftComment}
              onAddComment={() => handleAddComment(selected.id)}
              onStatusChange={s => handleStatusChange(selected.id, s)}
              onClose={() => setParam({ id: null })}
              onDemoAction={handleDemoAction}
            />
          </div>
        )}
        {selected && (
          <AnnaDemoMockModal
            isOpen={demoModal.open}
            onClose={() => setDemoModal({ open: false, mockType: "", pendenzId: "" })}
            onConfirm={handleDemoConfirm}
            mockType={demoModal.mockType}
            pendenz={selected}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* ═══════════════════════════════════════
         HEADER (densified)
         ═══════════════════════════════════════ */}
      <div className="shrink-0" style={{ padding: "var(--space-4) var(--space-6) 0" }}>
        {/* Title row */}
        <div className="flex items-center justify-between" style={{ marginBottom: "var(--space-3)" }}>
          <h1 style={{ fontSize: "var(--text-h1)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", letterSpacing: "var(--tracking-tight)" }}>
            Pendenzenliste
          </h1>
          <div className="flex items-center" style={{ gap: "var(--space-2)" }}>
            {role === "management" && (
              <button
                onClick={() => setMgmtView("dashboard")}
                className="inline-flex items-center cursor-pointer transition-colors"
                style={{
                  gap: 6, padding: "7px 16px", borderRadius: "var(--radius-pill)",
                  background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)",
                  fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"}
                onMouseLeave={e => e.currentTarget.style.background = "var(--bg-elevated)"}
              >
                <LayoutDashboard style={{ width: 14, height: 14 }} /> Zur Übersicht
              </button>
            )}
            <button
              className="inline-flex items-center cursor-pointer transition-colors"
              style={{
                gap: "var(--space-2)", padding: "10px 22px",
                borderRadius: "var(--radius-pill)",
                background: "var(--brand-primary)", color: "var(--text-on-dark)",
                fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", border: "none",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--brand-primary-dark)"}
              onMouseLeave={e => e.currentTarget.style.background = "var(--brand-primary)"}
            >
              <Plus style={{ width: 16, height: 16 }} /> Neues Ticket
            </button>
          </div>
        </div>

        {/* Anna einordnung */}
        <div style={{ marginBottom: "var(--space-4)" }}>
          <AnnaListenEinordnung context={annaContext} />
        </div>

        {/* View pills + filter button */}
        <div className="flex items-center flex-wrap" style={{ gap: 8, marginBottom: "var(--space-4)" }}>
          {viewOrder.map(vk => {
            const def = VIEW_DEFS.find(d => d.key === vk)!;
            const isActive = view === vk;
            const count = viewCounts[vk];
            return (
              <button
                key={vk}
                onClick={() => setParam({ view: vk === defaultView ? null : vk, id: null })}
                className="inline-flex items-center cursor-pointer transition-colors"
                style={{
                  gap: 8, padding: "6px 14px",
                  borderRadius: "var(--radius-pill)",
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
                  minWidth: 18, padding: "1px 8px",
                  borderRadius: "var(--radius-pill)",
                  fontSize: 11, fontWeight: "var(--weight-medium)",
                  background: isActive ? "var(--brand-primary)" : "var(--bg-secondary)",
                  color: isActive ? "var(--text-on-dark)" : "var(--text-secondary)",
                }}>
                  {count}
                </span>
              </button>
            );
          })}

          {/* Filter button */}
          <button
            className="inline-flex items-center cursor-pointer transition-colors"
            style={{
              gap: "var(--space-2)", padding: "6px 14px",
              borderRadius: "var(--radius-pill)",
              background: "var(--bg-elevated)",
              border: "var(--border-thin) solid var(--border-default)",
              fontSize: 13, fontWeight: "var(--weight-medium)", color: "var(--text-primary)",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"}
            onMouseLeave={e => e.currentTarget.style.background = "var(--bg-elevated)"}
          >
            <SlidersHorizontal style={{ width: 14, height: 14, color: "var(--text-secondary)" }} />
            Filter
            {filterCount > 0 && (
              <span className="inline-flex items-center justify-center" style={{
                minWidth: 18, height: 18, padding: "0 5px",
                borderRadius: "var(--radius-pill)",
                background: "var(--brand-primary)", color: "var(--text-on-dark)",
                fontSize: 10, fontWeight: "var(--weight-medium)",
              }}>
                {filterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════
         LIST + DYNAMIC DETAIL PANEL
         ═══════════════════════════════════════ */}
      <div className="flex-1 flex min-h-0 overflow-hidden" style={{ padding: "0 var(--space-6) var(--space-4)" }}>
        {/* ── LIST ── */}
        <div className="flex-1 min-w-0 overflow-y-auto" style={{ paddingRight: selected ? "var(--space-4)" : 0 }}>
          {/* Bulk action bar */}
          {bulkSelected.size > 0 && (
            <div className="sticky top-0 z-10 flex items-center justify-between" style={{
              padding: "12px 16px", marginBottom: 12,
              background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)",
              borderRadius: "var(--radius-card)",
            }}>
              <div className="flex items-center" style={{ gap: "var(--space-3)" }}>
                <span style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>
                  {bulkSelected.size} ausgewählt
                </span>
                <button
                  onClick={() => setBulkSelected(new Set())}
                  className="cursor-pointer"
                  style={{ background: "transparent", border: "none", fontSize: "var(--text-small)", color: "var(--brand-primary)", fontWeight: "var(--weight-medium)" }}
                >
                  Auswahl aufheben
                </button>
              </div>
              {/* Anna suggestion for same-type bulk */}
              {bulkAction && (
                <div className="flex items-center" style={{ gap: 8 }}>
                  <div className="shrink-0 flex items-center justify-center" style={{ width: 20, height: 20, borderRadius: "var(--radius-pill)", background: "linear-gradient(135deg, var(--brand-primary), var(--brand-accent))" }}>
                    <Sparkles style={{ width: 9, height: 9, color: "var(--text-on-dark)" }} />
                  </div>
                  <span style={{ fontSize: "var(--text-small)", color: "var(--text-primary)" }}>
                    Ich kann alle {bulkSelected.size} {bulkAction.label.toLowerCase()}
                  </span>
                </div>
              )}
              <div className="flex items-center" style={{ gap: "var(--space-2)" }}>
                {bulkAction && (
                  <button
                    onClick={handleBulkExecute}
                    className="inline-flex items-center cursor-pointer transition-colors"
                    style={{
                      gap: 6, padding: "8px 16px", borderRadius: "var(--radius-pill)",
                      background: "var(--brand-primary)", color: "var(--text-on-dark)",
                      fontSize: 13, fontWeight: "var(--weight-medium)", border: "none",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--brand-primary-dark)"}
                    onMouseLeave={e => e.currentTarget.style.background = "var(--brand-primary)"}
                  >
                    <Sparkles style={{ width: 13, height: 13 }} /> {bulkAction.label}
                  </button>
                )}
                <button
                  onClick={handleBulkErledigen}
                  className="inline-flex items-center cursor-pointer transition-colors"
                  style={{
                    gap: 6, padding: "8px 16px", borderRadius: "var(--radius-pill)",
                    background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)",
                    fontSize: 13, fontWeight: "var(--weight-medium)", color: "var(--text-primary)",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"}
                  onMouseLeave={e => e.currentTarget.style.background = "var(--bg-elevated)"}
                >
                  <Check style={{ width: 13, height: 13 }} /> Erledigen
                </button>
              </div>
            </div>
          )}

          {BUCKETS.map(bucket => {
            const items = bucketed[bucket.key];
            if (items.length === 0) return null;
            const isOverdueBucket = bucket.key === "ueberfaellig";
            return (
              <div key={bucket.key} style={{ marginBottom: 16 }}>
                {/* Group header */}
                <div className="flex items-center" style={{ gap: "var(--space-2)", marginBottom: 8 }}>
                  {isOverdueBucket && <span style={{ width: 6, height: 6, borderRadius: "var(--radius-pill)", background: "var(--status-danger)" }} />}
                  <span style={{
                    fontSize: "var(--text-meta)", color: isOverdueBucket ? "var(--status-danger)" : "var(--text-secondary)",
                    letterSpacing: "var(--tracking-wide)", textTransform: "uppercase" as const,
                    fontWeight: "var(--weight-medium)",
                  }}>
                    {bucket.label}
                  </span>
                  <span style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>{items.length}</span>
                </div>

                {/* Cards */}
                <div className="flex flex-col" style={{ gap: 6 }}>
                  {items.map(entry => {
                    const isSelected = entry.id === selectedId;
                    const isBulkChecked = bulkSelected.has(entry.id);
                    const isEntryOverdue = entry.faellig && daysFromToday(entry.faellig)! < 0;
                    const typDef = pendenzTypen[entry.pendenzTyp];
                    return (
                      <div
                        key={entry.id}
                        className="group w-full flex text-left cursor-pointer transition-colors"
                        onClick={() => handleCardClick(entry.id)}
                        style={{
                          position: "relative",
                          padding: "10px 14px",
                          borderRadius: "var(--radius-card)",
                          background: isBulkChecked ? "var(--brand-primary-light)" : isSelected ? "var(--brand-primary-light)" : isEntryOverdue ? "rgba(168,50,31,0.04)" : "var(--bg-elevated)",
                          border: isSelected ? "1px solid var(--brand-primary)" : isBulkChecked ? "1px solid var(--brand-primary)" : "var(--border-thin) solid var(--border-default)",
                          overflow: "hidden",
                        }}
                        onMouseEnter={e => { if (!isSelected && !isBulkChecked) e.currentTarget.style.background = isEntryOverdue ? "rgba(168,50,31,0.07)" : "var(--bg-secondary)"; }}
                        onMouseLeave={e => { if (!isSelected && !isBulkChecked) e.currentTarget.style.background = isEntryOverdue ? "rgba(168,50,31,0.04)" : "var(--bg-elevated)"; }}
                      >
                        {/* Overdue indicator stripe */}
                        {isEntryOverdue && (
                          <div className="absolute" style={{ left: 0, top: 0, bottom: 0, width: 3, background: "var(--status-danger)" }} />
                        )}

                        {/* Bulk checkbox (backoffice only) */}
                        {isBulkMode && (
                          <div
                            className={`shrink-0 flex items-center justify-center cursor-pointer ${isBulkChecked || bulkSelected.size > 0 ? "" : "opacity-0 group-hover:opacity-100"} transition-opacity`}
                            style={{ marginRight: 10 }}
                            onClick={e => { e.stopPropagation(); toggleBulk(entry.id); }}
                          >
                            {isBulkChecked
                              ? <CheckSquare style={{ width: 16, height: 16, color: "var(--brand-primary)" }} />
                              : <Square style={{ width: 16, height: 16, color: "var(--text-tertiary)" }} />
                            }
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          {/* Row 1: Type pill + person name + due date */}
                          <div className="flex items-center" style={{ gap: "var(--space-2)", marginBottom: 2 }}>
                            {typDef && (
                              <span className="inline-flex items-center shrink-0" style={{
                                padding: "2px 8px", borderRadius: "var(--radius-pill)",
                                fontSize: 11, fontWeight: "var(--weight-medium)",
                                background: typDef.pillBg, color: typDef.pillColor,
                              }}>
                                {typDef.label}
                              </span>
                            )}
                            <span className="truncate" style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>
                              {entryTitle(entry)}
                            </span>
                            <span className="shrink-0 ml-auto" style={{
                              fontSize: "var(--text-small)",
                              fontWeight: isEntryOverdue ? "var(--weight-medium)" : "var(--weight-regular)",
                              color: isEntryOverdue ? "var(--status-danger)" : "var(--text-secondary)",
                            }}>
                              {entry.faellig ? faelligLabel(entry.faellig) : ""}
                            </span>
                          </div>
                          {/* Row 2: Context + avatar */}
                          <div className="flex items-center" style={{ gap: "var(--space-2)" }}>
                            <span className="truncate flex-1" style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>
                              {entry.kontext}
                            </span>
                            <MiniAvatar person={entry.verantwortlich} size={18} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center" style={{ padding: "var(--space-8)", color: "var(--text-tertiary)" }}>
              <Inbox style={{ width: 32, height: 32, marginBottom: "var(--space-3)" }} />
              <span style={{ fontSize: "var(--text-body)" }}>Keine Pendenzen in dieser Ansicht</span>
            </div>
          )}
        </div>

        {/* ── DETAIL PANEL (desktop, dynamic) ── */}
        {selected && (
          <div className="hidden xl:flex shrink-0 flex-col min-h-0" style={{
            width: 520,
            background: "var(--bg-elevated)",
            border: "var(--border-thin) solid var(--border-default)",
            borderRadius: "var(--radius-card)",
            overflow: "hidden",
          }}>
            <DetailPanel
              entry={selected}
              comments={comments[selected.id] || []}
              draftComment={draftComment}
              onDraftChange={setDraftComment}
              onAddComment={() => handleAddComment(selected.id)}
              onStatusChange={s => handleStatusChange(selected.id, s)}
              onClose={() => setParam({ id: null })}
              onDemoAction={handleDemoAction}
            />
          </div>
        )}
      </div>

      {/* ── MOBILE / TABLET: Detail overlay ── */}
      {selected && (
        <div className="fixed inset-0 z-50 xl:hidden flex flex-col" style={{ background: "var(--bg-elevated)" }}>
          <div className="shrink-0 flex items-center" style={{ padding: "var(--space-3) var(--space-4)", borderBottom: "var(--border-thin) solid var(--border-default)" }}>
            <button
              onClick={() => setParam({ id: null })}
              className="flex items-center cursor-pointer"
              style={{ gap: "var(--space-2)", background: "transparent", border: "none", fontSize: "var(--text-body)", color: "var(--text-secondary)" }}
            >
              <ArrowLeft style={{ width: 18, height: 18 }} /> Zurück
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <DetailPanel
              entry={selected}
              comments={comments[selected.id] || []}
              draftComment={draftComment}
              onDraftChange={setDraftComment}
              onAddComment={() => handleAddComment(selected.id)}
              onStatusChange={s => handleStatusChange(selected.id, s)}
              onClose={() => setParam({ id: null })}
              onDemoAction={handleDemoAction}
            />
          </div>
        </div>
      )}

      {/* ── Demo Mock Modal ── */}
      {selected && (
        <AnnaDemoMockModal
          isOpen={demoModal.open}
          onClose={() => setDemoModal({ open: false, mockType: "", pendenzId: "" })}
          onConfirm={handleDemoConfirm}
          mockType={demoModal.mockType}
          pendenz={selected}
        />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   DETAIL PANEL
   ══════════════════════════════════════════ */

interface DetailPanelProps {
  entry: UnifiedEntry;
  comments: { text: string; by: string; at: string }[];
  draftComment: string;
  onDraftChange: (v: string) => void;
  onAddComment: () => void;
  onStatusChange: (s: string) => void;
  onClose: () => void;
  onDemoAction?: (mockType: string) => void;
}

function DetailPanel({ entry, comments, draftComment, onDraftChange, onAddComment, onStatusChange, onClose, onDemoAction }: DetailPanelProps) {
  const isOverdue = entry.faellig && daysFromToday(entry.faellig)! < 0;
  const typDef = pendenzTypen[entry.pendenzTyp];
  const statusCfg = STATUS_CFG[entry.status] || STATUS_CFG.offen;
  const prioCfg = PRIO_CFG[entry.prioritaet] || PRIO_CFG.niedrig;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0" style={{ padding: "20px 24px", borderBottom: "var(--border-thin) solid var(--border-default)" }}>
        <div className="flex items-center justify-between" style={{ marginBottom: "var(--space-2)" }}>
          <div className="flex items-center" style={{ gap: "var(--space-2)" }}>
            {typDef && (
              <span style={{
                padding: "2px 8px", borderRadius: "var(--radius-pill)",
                fontSize: "var(--text-micro)", fontWeight: "var(--weight-medium)",
                background: typDef.pillBg, color: typDef.pillColor,
              }}>
                {typDef.label}
              </span>
            )}
            <span style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>{entry.id}</span>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center cursor-pointer transition-colors"
            style={{ width: 28, height: 28, borderRadius: "var(--radius-pill)", background: "transparent", border: "none" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <X style={{ width: 16, height: 16, color: "var(--text-secondary)" }} />
          </button>
        </div>
        <div style={{ fontSize: "var(--text-h2)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>
          {entryTitle(entry)}
        </div>
        {entry.kontext && (
          <div style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", marginTop: 4 }}>
            {entry.kontext}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto" style={{ padding: "20px 24px" }}>
        {/* Anna Pendenz-Vorschlag */}
        <AnnaPendenzVorschlag
          pendenz={entry}
          onActionExecuted={() => {}}
          onDemoAction={onDemoAction}
        />

        {/* Overdue banner */}
        {isOverdue && (
          <div className="flex items-center" style={{
            gap: "var(--space-2)", padding: "var(--space-3) var(--space-4)",
            background: "var(--status-danger-bg)", borderRadius: "var(--radius-card)",
            marginBottom: "var(--space-5)",
          }}>
            <AlertTriangle style={{ width: 16, height: 16, color: "var(--status-danger)", flexShrink: 0 }} />
            <span style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--status-danger)" }}>
              {faelligLabel(entry.faellig)}
            </span>
          </div>
        )}

        {/* Description */}
        {entry.beschreibung && (
          <div style={{ fontSize: "var(--text-body)", color: "var(--text-primary)", lineHeight: 1.6, marginBottom: "var(--space-5)" }}>
            {entry.beschreibung}
          </div>
        )}

        {/* Meta card */}
        <div style={{ background: "var(--bg-primary)", borderRadius: "var(--radius-card)", padding: "var(--space-4)", marginBottom: "var(--space-5)" }}>
          <MetaRow label="Typ" value={typDef?.label || entry.typLabel} />
          <MetaRow label="Status">
            <span className="inline-flex items-center" style={{
              gap: 4, padding: "2px 10px", borderRadius: "var(--radius-pill)",
              fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)",
              background: statusCfg.bg, color: statusCfg.color,
            }}>
              <span style={{ width: 5, height: 5, borderRadius: "var(--radius-pill)", background: statusCfg.dot }} />
              {statusCfg.label}
            </span>
          </MetaRow>
          {entry.person && <MetaRow label="Person" value={entry.person.name} />}
          <MetaRow label="Verantwortlich">
            <div className="flex items-center" style={{ gap: 6 }}>
              <MiniAvatar person={entry.verantwortlich} size={20} />
              <span style={{ fontSize: "var(--text-small)", color: "var(--text-primary)" }}>{entry.verantwortlich.name}</span>
            </div>
          </MetaRow>
          <MetaRow label="Priorität">
            <div className="flex items-center" style={{ gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: "var(--radius-pill)", background: prioCfg.color }} />
              <span style={{ fontSize: "var(--text-small)", color: "var(--text-primary)" }}>{prioCfg.label}</span>
            </div>
          </MetaRow>
          <MetaRow label="Fällig" value={entry.faellig ? formatDate(entry.faellig) : "–"} />
          <MetaRow label="Erstellt" value={formatDate(entry.erstellt)} last />
        </div>

        {/* History */}
        <div style={{ marginBottom: "var(--space-5)" }}>
          <div style={{
            fontSize: "var(--text-micro)", color: "var(--text-secondary)",
            letterSpacing: "var(--tracking-wide)", textTransform: "uppercase" as const,
            marginBottom: "var(--space-3)",
          }}>
            Verlauf
          </div>
          {comments.length === 0 && (
            <div style={{ fontSize: "var(--text-small)", color: "var(--text-tertiary)", padding: "var(--space-3) 0" }}>
              Noch keine Einträge
            </div>
          )}
          {comments.map((c, i) => (
            <div key={i} className="flex" style={{ gap: "var(--space-3)", marginBottom: "var(--space-3)" }}>
              <MiniAvatar person={{ name: c.by, initialen: c.by.split(" ").map(w => w[0]).join(""), color: "#4F46E5" }} size={24} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center" style={{ gap: "var(--space-2)" }}>
                  <span style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>{c.by}</span>
                  <span style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>{c.at}</span>
                </div>
                <div style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", marginTop: 2 }}>{c.text}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0" style={{ padding: "16px 24px", borderTop: "var(--border-thin) solid var(--border-default)" }}>
        <div className="flex items-start" style={{ gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
          <textarea
            value={draftComment}
            onChange={e => onDraftChange(e.target.value)}
            placeholder="Kommentar schreiben…"
            rows={2}
            style={{
              flex: 1, resize: "none", padding: "8px 12px",
              borderRadius: "var(--radius-card)",
              border: "var(--border-thin) solid var(--border-default)",
              background: "var(--bg-elevated)",
              fontSize: "var(--text-small)", color: "var(--text-primary)", fontFamily: "inherit",
            }}
          />
          <button
            onClick={onAddComment}
            disabled={!draftComment.trim()}
            className="shrink-0 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ width: 36, height: 36, borderRadius: "var(--radius-pill)", background: "var(--brand-primary)", border: "none" }}
          >
            <Send style={{ width: 14, height: 14, color: "var(--text-on-dark)" }} />
          </button>
        </div>
        <div className="flex items-center justify-between">
          <select
            value={entry.status}
            onChange={e => onStatusChange(e.target.value)}
            style={{
              padding: "6px 12px", borderRadius: "var(--radius-pill)",
              border: "var(--border-thin) solid var(--border-default)",
              background: "var(--bg-elevated)",
              fontSize: "var(--text-small)", color: "var(--text-primary)", fontFamily: "inherit", cursor: "pointer",
            }}
          >
            <option value="offen">Offen</option>
            <option value="in_bearbeitung">In Bearbeitung</option>
            <option value="erledigt">Erledigt</option>
          </select>
          <button
            onClick={() => onStatusChange("erledigt")}
            className="inline-flex items-center cursor-pointer transition-colors"
            style={{
              gap: "var(--space-1)", padding: "6px 14px",
              borderRadius: "var(--radius-pill)",
              background: "transparent", border: "none",
              fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-secondary)",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--status-success-bg)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <Check style={{ width: 14, height: 14 }} /> Erledigen
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   META ROW
   ══════════════════════════════════════════ */

function MetaRow({ label, value, children, last }: { label: string; value?: string; children?: React.ReactNode; last?: boolean }) {
  return (
    <div className="flex items-center justify-between" style={{
      padding: "8px 0",
      borderBottom: last ? "none" : "var(--border-thin) solid var(--border-default)",
    }}>
      <span style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>{label}</span>
      {value ? (
        <span style={{ fontSize: "var(--text-small)", color: "var(--text-primary)", fontWeight: "var(--weight-medium)" }}>{value}</span>
      ) : children}
    </div>
  );
}

/* ══════════════════════════════════════════
   MINI AVATAR
   ══════════════════════════════════════════ */

function MiniAvatar({ person, size = 22 }: { person: { name: string; initialen: string; color?: string }; size?: number }) {
  return (
    <div className="shrink-0 flex items-center justify-center" style={{
      width: size, height: size, borderRadius: "var(--radius-pill)",
      background: person.color || "var(--text-tertiary)",
    }}>
      <span style={{ color: "var(--text-on-dark)", fontSize: size <= 20 ? 8 : 9, fontWeight: "var(--weight-medium)" }}>
        {person.initialen}
      </span>
    </div>
  );
}
