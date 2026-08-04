import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { Plus, X, AlertTriangle, Check, ArrowLeft, Send, Sparkles, Search, ChevronDown, ExternalLink } from "lucide-react";
import { getUnifiedEntries, entryBetreff, entryPersonName, CURRENT_USER, type UnifiedEntry } from "../../lib/mocks/service-desk-unified";
import { personLink, personArtLabel } from "../../lib/mocks/personen-aufloesung";
import { pendenzTypen, type PendenzTyp } from "../../types/pendenz";
import { DataTable, type SpalteDef } from "./ui/DataTable";
import { isoZuAnzeige } from "../../lib/datum";
import { useCurrentRole } from "../auth";
import { AnnaPendenzVorschlag } from "../anna/AnnaPendenzVorschlag";
import { AnnaDemoMockModal } from "../anna/AnnaDemoMockModal";
import { toast } from "sonner";

const TODAY = "2026-03-03";

/* ══════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════ */

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

function daysFromToday(iso: string | null): number | null {
  if (!iso) return null;
  const t = new Date(TODAY);
  const d = new Date(iso);
  return Math.round((d.getTime() - t.getTime()) / 86400000);
}

/** Fälligkeit: volles Datum (über die Datumsschicht) plus Abweichung daneben.
 *  Keine Monatsabkürzungen, keine gebietsschema-abhängige Formatierung. */
type FaelligTon = "danger" | "warning" | "still";
function faelligDarstellung(iso: string, status: string): { datum: string; abw: string | null; ton: FaelligTon } {
  const datum = isoZuAnzeige(iso);
  const d = daysFromToday(iso)!;
  if (status !== "erledigt" && d < 0) return { datum, abw: `+${Math.abs(d)} ${Math.abs(d) === 1 ? "Tag" : "Tage"}`, ton: "danger" };
  if (status !== "erledigt" && d === 0) return { datum, abw: "heute", ton: "danger" };
  if (status !== "erledigt" && d <= 3) return { datum, abw: `in ${d} ${d === 1 ? "Tag" : "Tagen"}`, ton: "still" };
  return { datum, abw: null, ton: "still" };
}

/** Textzeile zur Fälligkeit (für den Detailbereich / überfällig-Banner). */
function faelligBanner(iso: string | null): string {
  if (!iso) return "–";
  const d = daysFromToday(iso)!;
  if (d < 0) return `${Math.abs(d)} ${Math.abs(d) === 1 ? "Tag" : "Tage"} überfällig`;
  if (d === 0) return "Heute fällig";
  return `Fällig am ${isoZuAnzeige(iso)}`;
}

const STATUS_CFG: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  offen: { label: "Offen", bg: "var(--status-danger-bg)", color: "var(--status-danger)", dot: "var(--status-danger)" },
  in_bearbeitung: { label: "In Bearbeitung", bg: "var(--status-warning-bg)", color: "var(--status-warning-text)", dot: "var(--status-warning)" },
  erledigt: { label: "Abgeschlossen", bg: "var(--status-success-bg)", color: "var(--status-success-text)", dot: "var(--status-success)" },
};

const PRIO_CFG: Record<string, { label: string; color: string }> = {
  hoch: { label: "Hoch", color: "var(--status-danger)" },
  mittel: { label: "Mittel", color: "var(--status-warning)" },
  niedrig: { label: "Niedrig", color: "var(--text-tertiary)" },
};

/* ══════════════════════════════════════════
   FACHLOGIK — Segment, Status-Chips, Kennzeichen, Filter, Sortierung
   ══════════════════════════════════════════ */

/* ── Zugehörigkeit: nur "Mir zugewiesen" und "Alle". Vorauswahl "mir". ── */
type Segment = "mir" | "alle";
const SEGMENTE: [Segment, string][] = [["mir", "Mir zugewiesen"], ["alle", "Alle"]];

function istNichtZugewiesen(e: UnifiedEntry): boolean {
  const n = e.verantwortlich?.name?.trim();
  const i = e.verantwortlich?.initialen?.trim();
  return !n || n === "Nicht zugewiesen" || !i;
}

function imSegment(e: UnifiedEntry, segment: Segment): boolean {
  return segment === "alle" || e.verantwortlich.initialen === CURRENT_USER;
}

/* ── Status-Chips: kombinierbar (UND). Erledigte sind standardmässig ausgeblendet
   und erscheinen erst über den "Abgeschlossen"-Chip. ── */
type StatusChipId = "ueberfaellig" | "diese_woche" | "in_bearbeitung" | "nicht_zugewiesen" | "abgeschlossen";
const STATUS_CHIPS: { id: StatusChipId; label: string; praedikat: (e: UnifiedEntry) => boolean }[] = [
  { id: "ueberfaellig", label: "Überfällig", praedikat: e => e.status !== "erledigt" && e.faellig != null && daysFromToday(e.faellig)! < 0 },
  { id: "diese_woche", label: "Diese Woche fällig", praedikat: e => e.status !== "erledigt" && e.faellig != null && daysFromToday(e.faellig)! >= 0 && daysFromToday(e.faellig)! <= 7 },
  { id: "in_bearbeitung", label: "In Bearbeitung", praedikat: e => e.status === "in_bearbeitung" },
  { id: "nicht_zugewiesen", label: "Nicht zugewiesen", praedikat: istNichtZugewiesen },
  { id: "abgeschlossen", label: "Abgeschlossen", praedikat: e => e.status === "erledigt" },
];

/* ── Kennzeichen: Rot (überfällig) schlägt Gelb (in den nächsten Tagen fällig
   oder nicht zugewiesen). Erledigte tragen kein Kennzeichen. ── */
type KennzeichenTyp = "rot" | "gelb" | null;
function ableitenKennzeichen(e: UnifiedEntry): { typ: KennzeichenTyp; grund: string } {
  if (e.status !== "erledigt" && e.faellig) {
    const d = daysFromToday(e.faellig)!;
    if (d < 0) return { typ: "rot", grund: `${Math.abs(d)} Tage überfällig` };
    if (d <= 3) return { typ: "gelb", grund: "In den nächsten Tagen fällig" };
  }
  if (istNichtZugewiesen(e)) return { typ: "gelb", grund: "Nicht zugewiesen" };
  return { typ: null, grund: "" };
}

/* ── Filterzustand: eine Struktur an einem Ort ── */
interface FilterZustand {
  segment: Segment;
  statusChips: Set<StatusChipId>;
  arten: Set<PendenzTyp>;
  zustaendige: Set<string>;
  suche: string;
}
const LEERER_FILTER: FilterZustand = { segment: "mir", statusChips: new Set(), arten: new Set(), zustaendige: new Set(), suche: "" };

function filterEntries(list: UnifiedEntry[], f: FilterZustand): UnifiedEntry[] {
  return list.filter(e => {
    if (!imSegment(e, f.segment)) return false;
    // Erledigte nur zeigen, wenn der "Abgeschlossen"-Chip aktiv ist.
    if (!f.statusChips.has("abgeschlossen") && e.status === "erledigt") return false;
    for (const chip of STATUS_CHIPS) if (f.statusChips.has(chip.id) && !chip.praedikat(e)) return false;
    if (f.arten.size > 0 && !f.arten.has(e.pendenzTyp)) return false;
    if (f.zustaendige.size > 0 && !f.zustaendige.has(e.verantwortlich.name)) return false;
    const q = f.suche.trim().toLowerCase();
    if (q && !(entryBetreff(e).toLowerCase().includes(q) || (e.kontext || "").toLowerCase().includes(q) || entryPersonName(e).toLowerCase().includes(q))) return false;
    return true;
  });
}

/* ── Sortierung (Fälligkeit aufsteigend als Standard: überfällig zuerst, ohne
   Termin zuletzt). ── */
type SortKey = "faellig" | "betreff" | "person" | "zustaendig";
const SORT_LABEL: Record<SortKey, string> = { faellig: "Fälligkeit", betreff: "Betreff", person: "Person", zustaendig: "Zuständig" };
function faelligRank(e: UnifiedEntry): number { return e.faellig ? daysFromToday(e.faellig)! : Number.POSITIVE_INFINITY; }
function sortEntries(list: UnifiedEntry[], key: SortKey, dir: "asc" | "desc"): UnifiedEntry[] {
  const f = dir === "asc" ? 1 : -1;
  return [...list].sort((a, b) => {
    switch (key) {
      case "faellig": {
        const ra = faelligRank(a), rb = faelligRank(b);
        if (ra === rb) return entryBetreff(a).localeCompare(entryBetreff(b), "de");
        return f * (ra - rb);
      }
      case "betreff": return f * entryBetreff(a).localeCompare(entryBetreff(b), "de");
      case "person": return f * entryPersonName(a).localeCompare(entryPersonName(b), "de");
      case "zustaendig": return f * a.verantwortlich.name.localeCompare(b.verantwortlich.name, "de");
      default: return 0;
    }
  });
}

/* ── Mehrfachauswahl-Dropdown (lokal; kein neues Shared-/shadcn-Bauteil) ── */
function AuswahlDropdown({ label, optionen, ausgewaehlt, onToggle }: {
  label: string;
  optionen: { value: string; label: string }[];
  ausgewaehlt: Set<string>;
  onToggle: (value: string) => void;
}) {
  const [offen, setOffen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!offen) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOffen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [offen]);
  const anzahl = ausgewaehlt.size;
  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOffen(o => !o)} className="ui-fokusring inline-flex items-center cursor-pointer transition-colors"
        style={{ gap: 6, padding: "7px 12px", borderRadius: "var(--radius-pill)", background: anzahl > 0 ? "var(--brand-primary-light)" : "var(--bg-elevated)", border: anzahl > 0 ? "var(--border-thin) solid var(--brand-primary)" : "var(--border-thin) solid var(--border-default)", fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: anzahl > 0 ? "var(--brand-primary)" : "var(--text-primary)", fontFamily: "inherit", whiteSpace: "nowrap" }}>
        {label}{anzahl > 0 && <span style={{ fontVariantNumeric: "tabular-nums" }}>· {anzahl}</span>}
        <ChevronDown style={{ width: 14, height: 14, opacity: 0.7 }} />
      </button>
      {offen && (
        <div className="absolute z-50" style={{ top: "calc(100% + 6px)", left: 0, minWidth: 220, maxHeight: 320, overflowY: "auto", padding: 6, background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-overlay)" }}>
          {optionen.map(opt => {
            const aktiv = ausgewaehlt.has(opt.value);
            return (
              <button key={opt.value} type="button" onClick={() => onToggle(opt.value)} className="w-full inline-flex items-center cursor-pointer transition-colors"
                style={{ gap: 8, padding: "7px 8px", borderRadius: 6, background: "transparent", border: "none", fontSize: "var(--text-small)", color: "var(--text-primary)", fontFamily: "inherit", textAlign: "left" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <span className="inline-flex items-center justify-center shrink-0" style={{ width: 16, height: 16, borderRadius: 4, border: aktiv ? "none" : "var(--border-thin) solid var(--border-default)", background: aktiv ? "var(--brand-primary)" : "transparent" }}>
                  {aktiv && <Check style={{ width: 11, height: 11, color: "var(--text-on-dark)" }} />}
                </span>
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════ */

export function ServiceDeskPage() {
  const role = useCurrentRole();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get("id") || null;

  const [filter, setFilter] = useState<FilterZustand>(LEERER_FILTER);
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "faellig", dir: "asc" });
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

  // Rollenwechsel: Auswahl, Bulk und Filter zurücksetzen
  useEffect(() => {
    if (prevRole.current !== role) {
      prevRole.current = role;
      setParam({ id: null });
      setBulkSelected(new Set());
      setFilter(LEERER_FILTER);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const isBulkMode = role === "backoffice" || role === "management";

  const allEntries = useMemo(() => getUnifiedEntries(), []);
  const entries = useMemo(
    () => allEntries.map(e => ({ ...e, status: (localStatus[e.id] || e.status) as UnifiedEntry["status"] })),
    [allEntries, localStatus],
  );

  const segmentBasis = useMemo(() => entries.filter(e => imSegment(e, filter.segment)), [entries, filter.segment]);
  const chipCounts = useMemo(() => {
    const r = {} as Record<StatusChipId, number>;
    for (const chip of STATUS_CHIPS) r[chip.id] = segmentBasis.filter(chip.praedikat).length;
    return r;
  }, [segmentBasis]);

  const filtered = useMemo(() => filterEntries(entries, filter), [entries, filter]);
  const sorted = useMemo(() => sortEntries(filtered, sort.key, sort.dir), [filtered, sort]);

  const alleArten = useMemo(() => {
    const vorhanden = new Set(entries.map(e => e.pendenzTyp));
    return (Object.keys(pendenzTypen) as PendenzTyp[]).filter(t => vorhanden.has(t));
  }, [entries]);
  const alleZustaendige = useMemo(
    () => [...new Set(entries.map(e => e.verantwortlich.name))].filter(n => n && n !== "Nicht zugewiesen").sort((a, b) => a.localeCompare(b, "de")),
    [entries],
  );

  const selected = useMemo(() => {
    if (!selectedId) return null;
    return entries.find(e => e.id === selectedId) || null;
  }, [selectedId, entries]);

  const setSegment = (segment: Segment) => setFilter(f => ({ ...f, segment }));
  const setSuche = (suche: string) => setFilter(f => ({ ...f, suche }));
  const toggleChip = (id: StatusChipId) => setFilter(f => { const s = new Set(f.statusChips); if (s.has(id)) s.delete(id); else s.add(id); return { ...f, statusChips: s }; });
  const toggleArt = (t: PendenzTyp) => setFilter(f => { const s = new Set(f.arten); if (s.has(t)) s.delete(t); else s.add(t); return { ...f, arten: s }; });
  const toggleZustaendig = (n: string) => setFilter(f => { const s = new Set(f.zustaendige); if (s.has(n)) s.delete(n); else s.add(n); return { ...f, zustaendige: s }; });
  const resetFilter = () => setFilter(f => ({ ...LEERER_FILTER, suche: f.suche }));
  const toggleSort = (key: string) => setSort(s => s.key === key ? { key: key as SortKey, dir: s.dir === "asc" ? "desc" : "asc" } : { key: key as SortKey, dir: "asc" });

  const filterTags = useMemo(() => {
    const t: { key: string; label: string; entfernen: () => void }[] = [];
    STATUS_CHIPS.forEach(chip => { if (filter.statusChips.has(chip.id)) t.push({ key: `s-${chip.id}`, label: chip.label, entfernen: () => toggleChip(chip.id) }); });
    filter.arten.forEach(art => t.push({ key: `a-${art}`, label: `Art: ${pendenzTypen[art]?.label || art}`, entfernen: () => toggleArt(art) }));
    filter.zustaendige.forEach(n => t.push({ key: `z-${n}`, label: `Zuständig: ${n}`, entfernen: () => toggleZustaendig(n) }));
    return t;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleStatusChange = (id: string, newStatus: string) => setLocalStatus(prev => ({ ...prev, [id]: newStatus }));

  const handleAddComment = (id: string) => {
    if (!draftComment.trim()) return;
    setComments(prev => ({ ...prev, [id]: [...(prev[id] || []), { text: draftComment.trim(), by: "Maria Keller", at: "03.03.2026, 14:30" }] }));
    setDraftComment("");
  };

  const [demoModal, setDemoModal] = useState<{ open: boolean; mockType: string; pendenzId: string }>({ open: false, mockType: "", pendenzId: "" });
  const handleDemoAction = (mockType: string) => { if (selectedId) setDemoModal({ open: true, mockType, pendenzId: selectedId }); };
  const handleDemoConfirm = () => {
    const id = demoModal.pendenzId;
    setDemoModal({ open: false, mockType: "", pendenzId: "" });
    handleStatusChange(id, "erledigt");
    setComments(prev => ({ ...prev, [id]: [...(prev[id] || []), { text: "Anna (Demo) hat die Aktion ausgeführt", by: "Anna", at: "03.03.2026, 14:32" }] }));
  };

  // Bulk-Auswahl (nur Backoffice/Management)
  const toggleBulk = (id: string) => setBulkSelected(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const bulkEntries = useMemo(() => filtered.filter(e => bulkSelected.has(e.id)), [filtered, bulkSelected]);
  const bulkAllSameType = bulkEntries.length > 0 && bulkEntries.every(e => e.pendenzTyp === bulkEntries[0].pendenzTyp);
  const bulkTypDef = bulkAllSameType ? pendenzTypen[bulkEntries[0].pendenzTyp] : null;
  const bulkAction = bulkTypDef?.bulkAction;

  const handleBulkExecute = () => {
    for (const id of bulkSelected) {
      handleStatusChange(id, bulkAction?.isDemoMock ? "erledigt" : "in_bearbeitung");
      setComments(prev => ({ ...prev, [id]: [...(prev[id] || []), { text: bulkAction?.isDemoMock ? "Anna (Demo): Bulk-Aktion ausgeführt" : `Anna: ${bulkAction?.label || "Aktion"} ausgeführt`, by: "Anna", at: "03.03.2026, 14:35" }] }));
    }
    toast(bulkAction?.resultDescription?.replace("{N}", String(bulkSelected.size)) || `${bulkSelected.size} Pendenzen aktualisiert`);
    setBulkSelected(new Set());
  };
  const handleBulkErledigen = () => {
    for (const id of bulkSelected) handleStatusChange(id, "erledigt");
    toast(`${bulkSelected.size} Pendenzen abgeschlossen`);
    setBulkSelected(new Set());
  };

  const handleCardClick = (id: string) => {
    if (id === selectedId) setParam({ id: null });
    else setParam({ id });
  };

  /* ── Zell-Renderer ── */
  const kennzeichenIcon = (e: UnifiedEntry) => {
    const k = ableitenKennzeichen(e);
    if (!k.typ) return null;
    return <AlertTriangle role="img" aria-label={k.grund} style={{ width: 15, height: 15, flexShrink: 0, color: k.typ === "rot" ? "var(--status-danger)" : "var(--status-warning)", fill: k.typ === "rot" ? "var(--status-danger)" : "none" }} />;
  };
  // Art: stiller Text, keine Fläche, keine Farbe.
  const artZelle = (e: UnifiedEntry) => <span style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{pendenzTypen[e.pendenzTyp]?.label || e.typLabel}</span>;

  // Betreff: die Sache, einzeilig mit Ellipsis; bei laufender Bearbeitung eine
  // stille Kennzeichnung; abgeschlossene zurückgenommen.
  const betreffZelle = (e: UnifiedEntry) => {
    const erledigt = e.status === "erledigt";
    return (
      <span className="flex items-baseline" style={{ gap: 8, minWidth: 0 }}>
        <span title={e.betreff} style={{ flex: "1 1 auto", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: erledigt ? "var(--text-tertiary)" : "var(--text-primary)" }}>{e.betreff}</span>
        {e.status === "in_bearbeitung" && <span className="shrink-0" style={{ fontSize: "var(--text-micro)", color: "var(--text-secondary)" }}>In Bearbeitung</span>}
        {erledigt && <span className="shrink-0" style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>Abgeschlossen</span>}
      </span>
    );
  };

  // Person: aufgelöster Name, verlinkt auf die Detailseite; Klick löst NICHT die
  // Zeilenauswahl aus. Kürzung mit Auslassungspunkten, voller Wert im title.
  const personZelle = (e: UnifiedEntry) => {
    const name = entryPersonName(e);
    return (
      <button type="button" title={name} onClick={ev => { ev.stopPropagation(); navigate(personLink(e.personBezug)); }}
        className="ui-fokusring inline-flex items-center cursor-pointer" style={{ gap: 4, maxWidth: "100%", minWidth: 0, background: "transparent", border: "none", padding: 0, fontFamily: "inherit", textAlign: "left" }}>
        <ExternalLink style={{ width: 10, height: 10, opacity: 0.5, flexShrink: 0 }} />
        <span style={{ minWidth: 0, fontSize: "var(--text-small)", color: "var(--brand-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
      </button>
    );
  };

  const beschreibungZelle = (e: UnifiedEntry) => <span title={e.kontext} style={{ display: "block", fontSize: "var(--text-small)", color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.kontext}</span>;

  const faelligZelle = (e: UnifiedEntry) => {
    if (!e.faellig) return <span style={{ fontSize: "var(--text-small)", color: "var(--text-tertiary)" }}>–</span>;
    const { datum, abw, ton } = faelligDarstellung(e.faellig, e.status);
    const farbe = ton === "danger" ? "var(--status-danger)" : ton === "warning" ? "var(--status-warning-text)" : "var(--text-tertiary)";
    return (
      <span className="inline-flex items-baseline" style={{ gap: 6, whiteSpace: "nowrap" }}>
        <span style={{ fontSize: "var(--text-small)", color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>{datum}</span>
        {abw && <span style={{ fontSize: "var(--text-meta)", fontWeight: ton === "danger" ? "var(--weight-medium)" : "var(--weight-regular)", color: farbe }}>{abw}</span>}
      </span>
    );
  };

  const zustaendigZelle = (e: UnifiedEntry) => istNichtZugewiesen(e) ? (
    <button type="button" onClick={ev => { ev.stopPropagation(); }} className="ui-fokusring inline-flex items-center cursor-pointer" style={{ gap: 4, padding: "3px 10px", borderRadius: "var(--radius-pill)", background: "transparent", border: "var(--border-thin) solid var(--border-default)", fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", color: "var(--text-secondary)", fontFamily: "inherit", whiteSpace: "nowrap" }}>
      <Plus style={{ width: 12, height: 12 }} /> Zuweisen
    </button>
  ) : (
    <div className="flex items-center" style={{ gap: 6 }}>
      <MiniAvatar person={e.verantwortlich} size={18} />
      <span style={{ fontSize: "var(--text-small)", color: "var(--text-primary)", whiteSpace: "nowrap" }}>{e.verantwortlich.name}</span>
    </div>
  );

  const karteTitel = (e: UnifiedEntry) => (
    <div className="flex items-center" style={{ gap: 8, width: "100%", minWidth: 0 }}>
      {kennzeichenIcon(e)}
      <span className="truncate" style={{ flex: 1, minWidth: 0, fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: e.status === "erledigt" ? "var(--text-tertiary)" : "var(--text-primary)" }}>{e.betreff}</span>
      {e.faellig && faelligZelle(e)}
    </div>
  );

  const spalten: SpalteDef<UnifiedEntry>[] = [
    { id: "kennzeichen", label: "", festBreitePx: 28, align: "center", ausKarte: true, render: kennzeichenIcon },
    { id: "art", label: "Art", anteil: 8, minCh: 10, align: "left", render: artZelle },
    { id: "betreff", label: "Betreff", anteil: 20, minCh: 16, align: "left", sortierbar: true, ausKarte: true, render: betreffZelle },
    { id: "person", label: "Person", anteil: 16, minCh: 22, align: "left", sortierbar: true, render: personZelle },
    { id: "beschreibung", label: "Beschreibung", anteil: 22, minCh: 18, align: "left", ausblendenUnter: "eng", render: beschreibungZelle },
    { id: "faellig", label: "Fällig", anteil: 12, minCh: 15, align: "left", sortierbar: true, ausKarte: true, render: faelligZelle },
    { id: "zustaendig", label: "Zuständig", anteil: 12, minCh: 14, align: "left", sortierbar: true, render: zustaendigZelle },
  ];

  // Flächentönung ausschliesslich für Dringlichkeit (rot kräftiger als gelb) bzw.
  // zurückgenommene erledigte Zeilen. Die Auswahl nutzt einen eigenen Kanal.
  const zeilenHintergrund = (e: UnifiedEntry): string | undefined => {
    if (e.status === "erledigt") return "color-mix(in srgb, var(--bg-secondary), transparent 30%)";
    const t = ableitenKennzeichen(e).typ;
    return t === "rot" ? "color-mix(in srgb, var(--status-danger-bg), transparent 40%)"
      : t === "gelb" ? "color-mix(in srgb, var(--status-warning-bg), transparent 68%)"
      : undefined;
  };

  // Auswahl-/Aktivakzent (linker Streifen + kräftigerer Rahmen): offene Detailzeile
  // und Bulk-Auswahl. Getrennt von der Tönung — überschreibt die Dringlichkeit nie.
  const zeilenAkzent = (e: UnifiedEntry): string | undefined =>
    (e.id === selectedId || (isBulkMode && bulkSelected.has(e.id))) ? "var(--brand-primary)" : undefined;

  const keineTreffer = sorted.length === 0;
  const suchButton = { background: "transparent", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-pill)", padding: "5px 12px", fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", color: "var(--text-secondary)", fontFamily: "inherit", cursor: "pointer" } as const;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* ═══ HEADER + STEUERLEISTE ═══ */}
      <div className="shrink-0" style={{ padding: "var(--space-4) var(--mobile-page-padding) 0" }}>
        <style>{`@media (min-width: 640px) { .pendenzen-header { padding-left: var(--space-6) !important; padding-right: var(--space-6) !important; } }`}</style>
        <div className="pendenzen-header" style={{ padding: "0" }}>
          {/* Titel + Primäraktion */}
          <div className="flex items-center justify-between" style={{ marginBottom: "var(--space-3)" }}>
            <h1 style={{ fontSize: "var(--text-h1)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", letterSpacing: "var(--tracking-tight)" }}>Pendenzen</h1>
            <button
              className="inline-flex items-center shrink-0 cursor-pointer transition-colors"
              style={{ gap: "var(--space-2)", padding: "10px 16px", borderRadius: "var(--radius-pill)", background: "var(--brand-primary)", color: "var(--text-on-dark)", fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", border: "none" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--brand-primary-dark)"}
              onMouseLeave={e => e.currentTarget.style.background = "var(--brand-primary)"}
            >
              <Plus style={{ width: 16, height: 16 }} /> <span className="hidden sm:inline">Neue Pendenz</span>
            </button>
          </div>

          {/* Steuerleiste: Suche, Zugehörigkeit, Auswahlfelder */}
          <div className="flex items-center flex-wrap" style={{ gap: 8, marginBottom: "var(--space-2)" }}>
            <div className="flex items-center" style={{ flex: "1 1 220px", maxWidth: 300, gap: "var(--space-2)", padding: "7px 14px", borderRadius: 8, background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)" }}>
              <Search style={{ width: 14, height: 14, color: "var(--text-tertiary)", flexShrink: 0 }} />
              <input value={filter.suche} onChange={e => setSuche(e.target.value)} placeholder="Pendenzen suchen…" className="flex-1 bg-transparent outline-none" style={{ fontSize: "var(--text-small)", color: "var(--text-primary)", minWidth: 0 }} />
              {filter.suche && <button onClick={() => setSuche("")} className="cursor-pointer shrink-0" style={{ background: "transparent", border: "none" }}><X style={{ width: 12, height: 12, color: "var(--text-secondary)" }} /></button>}
            </div>

            <div className="inline-flex shrink-0" style={{ padding: 2, borderRadius: "var(--radius-pill)", background: "var(--bg-secondary)", border: "var(--border-thin) solid var(--border-default)" }}>
              {SEGMENTE.map(([seg, lbl]) => {
                const aktiv = filter.segment === seg;
                return (
                  <button key={seg} type="button" onClick={() => setSegment(seg)} className="ui-fokusring cursor-pointer transition-colors"
                    style={{ padding: "5px 14px", borderRadius: "var(--radius-pill)", background: aktiv ? "var(--bg-elevated)" : "transparent", border: aktiv ? "var(--border-thin) solid var(--border-default)" : "var(--border-thin) solid transparent", fontSize: "var(--text-small)", fontWeight: aktiv ? "var(--weight-medium)" : "var(--weight-regular)", color: aktiv ? "var(--text-primary)" : "var(--text-secondary)", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                    {lbl}
                  </button>
                );
              })}
            </div>

            <AuswahlDropdown label="Art" optionen={alleArten.map(t => ({ value: t, label: pendenzTypen[t]?.label || t }))} ausgewaehlt={filter.arten as Set<string>} onToggle={v => toggleArt(v as PendenzTyp)} />
            <AuswahlDropdown label="Zuständig" optionen={alleZustaendige.map(n => ({ value: n, label: n }))} ausgewaehlt={filter.zustaendige} onToggle={toggleZustaendig} />
          </div>

          {/* Status-Chips — kombinierbar (UND), Zahl aus denselben Daten */}
          <div className="flex items-center flex-wrap" style={{ gap: 8, marginBottom: "var(--space-2)" }}>
            {STATUS_CHIPS.map(chip => {
              const aktiv = filter.statusChips.has(chip.id);
              const n = chipCounts[chip.id];
              return (
                <button key={chip.id} type="button" onClick={() => toggleChip(chip.id)} className="ui-fokusring inline-flex items-center cursor-pointer transition-colors"
                  style={{ gap: 7, padding: "6px 12px", borderRadius: "var(--radius-pill)", background: aktiv ? "var(--brand-primary-light)" : "var(--bg-elevated)", border: aktiv ? "var(--border-thin) solid var(--brand-primary)" : "var(--border-thin) solid var(--border-default)", fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: aktiv ? "var(--brand-primary)" : "var(--text-primary)", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                  <span className="inline-flex items-center justify-center shrink-0" style={{ width: 15, height: 15, borderRadius: 4, border: aktiv ? "none" : "var(--border-thin) solid var(--border-default)", background: aktiv ? "var(--brand-primary)" : "transparent" }}>
                    {aktiv && <Check style={{ width: 10, height: 10, color: "var(--text-on-dark)" }} />}
                  </span>
                  {chip.label}
                  <span style={{ fontVariantNumeric: "tabular-nums", color: aktiv ? "var(--brand-primary)" : "var(--text-tertiary)" }}>{n}</span>
                </button>
              );
            })}
          </div>

          {/* Aktivzeile */}
          <div className="flex items-center flex-wrap" style={{ gap: 6, minHeight: 24, marginBottom: "var(--space-2)" }}>
            {filterTags.length === 0 ? (
              <span style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>
                {SEGMENTE.find(([s]) => s === filter.segment)![1]} · sortiert nach {SORT_LABEL[sort.key]}
              </span>
            ) : (
              <>
                {filterTags.map(t => (
                  <button key={t.key} type="button" onClick={t.entfernen} className="ui-fokusring inline-flex items-center cursor-pointer"
                    style={{ gap: 4, padding: "3px 10px", borderRadius: "var(--radius-pill)", background: "var(--brand-primary-light)", color: "var(--brand-primary)", fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", border: "none", fontFamily: "inherit" }}>
                    {t.label} <X style={{ width: 10, height: 10 }} />
                  </button>
                ))}
                <button type="button" onClick={resetFilter} className="cursor-pointer" style={{ background: "transparent", border: "none", fontSize: "var(--text-meta)", color: "var(--text-secondary)", fontWeight: "var(--weight-medium)", padding: "3px 6px", fontFamily: "inherit" }}>Filter zurücksetzen</button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ═══ LISTE (DataTable) + DYNAMISCHER DETAILBEREICH ═══ */}
      <div className="flex-1 flex min-h-0 overflow-hidden" style={{ padding: "0 var(--mobile-page-padding) var(--space-4)" }}>
        <style>{`@media (min-width: 640px) { .pendenzen-list-area { padding-left: var(--space-6) !important; padding-right: var(--space-6) !important; } }`}</style>
        {/* ── LIST ── */}
        <div className="pendenzen-list-area flex-1 min-w-0 overflow-y-auto" style={{ paddingRight: selected ? "var(--space-4)" : 0 }}>
          {/* Bulk-Aktionsleiste */}
          {bulkSelected.size > 0 && (
            <div className="sticky top-0 z-10 flex items-center justify-between" style={{ padding: "12px 16px", marginBottom: 12, background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)" }}>
              <div className="flex items-center" style={{ gap: "var(--space-3)" }}>
                <span style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>{bulkSelected.size} ausgewählt</span>
                <button onClick={() => setBulkSelected(new Set())} className="cursor-pointer" style={{ background: "transparent", border: "none", fontSize: "var(--text-small)", color: "var(--brand-primary)", fontWeight: "var(--weight-medium)" }}>Auswahl aufheben</button>
              </div>
              {bulkAction && (
                <div className="flex items-center" style={{ gap: 8 }}>
                  <div className="shrink-0 flex items-center justify-center" style={{ width: 20, height: 20, borderRadius: "var(--radius-pill)", background: "linear-gradient(135deg, var(--brand-primary), var(--brand-accent))" }}>
                    <Sparkles style={{ width: 9, height: 9, color: "var(--text-on-dark)" }} />
                  </div>
                  <span style={{ fontSize: "var(--text-small)", color: "var(--text-primary)" }}>Ich kann alle {bulkSelected.size} {bulkAction.label.toLowerCase()}</span>
                </div>
              )}
              <div className="flex items-center" style={{ gap: "var(--space-2)" }}>
                {bulkAction && (
                  <button onClick={handleBulkExecute} className="inline-flex items-center cursor-pointer transition-colors"
                    style={{ gap: 6, padding: "8px 16px", borderRadius: "var(--radius-pill)", background: "var(--brand-primary)", color: "var(--text-on-dark)", fontSize: 13, fontWeight: "var(--weight-medium)", border: "none" }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--brand-primary-dark)"}
                    onMouseLeave={e => e.currentTarget.style.background = "var(--brand-primary)"}>
                    <Sparkles style={{ width: 13, height: 13 }} /> {bulkAction.label}
                  </button>
                )}
                <button onClick={handleBulkErledigen} className="inline-flex items-center cursor-pointer transition-colors"
                  style={{ gap: 6, padding: "8px 16px", borderRadius: "var(--radius-pill)", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", fontSize: 13, fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"}
                  onMouseLeave={e => e.currentTarget.style.background = "var(--bg-elevated)"}>
                  <Check style={{ width: 13, height: 13 }} /> Abschliessen
                </button>
              </div>
            </div>
          )}

          {keineTreffer ? (
            <div style={{ background: "var(--bg-elevated)", borderRadius: "var(--radius-card)", border: "var(--border-thin) solid var(--border-default)", padding: "3rem 1.5rem", textAlign: "center" }}>
              <p style={{ fontSize: "var(--text-body)", color: "var(--text-secondary)", marginBottom: 14 }}>
                {filter.suche.trim() ? <>Keine Pendenzen für &bdquo;{filter.suche.trim()}&ldquo;.</> : "Keine Pendenzen mit diesen Filtern."}
              </p>
              <div className="inline-flex items-center flex-wrap justify-center" style={{ gap: 8 }}>
                {filter.suche.trim() && <button type="button" onClick={() => setSuche("")} style={suchButton}>Suche löschen</button>}
                {filterTags.length > 0 && <button type="button" onClick={resetFilter} style={suchButton}>Filter zurücksetzen</button>}
              </div>
            </div>
          ) : (
            <DataTable<UnifiedEntry>
              spalten={spalten}
              zeilen={sorted}
              zeilenKey={e => e.id}
              onZeileKlick={e => handleCardClick(e.id)}
              zeilenHintergrund={zeilenHintergrund}
              zeilenAkzent={zeilenAkzent}
              sort={sort}
              onSort={toggleSort}
              karteTitel={karteTitel}
              containerHaltepunkte
              auswahl={isBulkMode ? { istGewaehlt: e => bulkSelected.has(e.id), onToggle: e => toggleBulk(e.id), zeilenLabel: e => entryBetreff(e) } : undefined}
              fusszeile={<><span>{sorted.length} von {entries.length} Pendenzen</span><span>Stand: {isoZuAnzeige(TODAY)}</span></>}
              leerText="Keine Pendenzen mit diesen Filtern."
            />
          )}
        </div>

        {/* ── DETAILBEREICH (Desktop, dynamisch) — unverändert im Aufbau ── */}
        {selected && (
          <div className="hidden xl:flex shrink-0 flex-col min-h-0" style={{ width: 520, background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)", overflow: "hidden" }}>
            <DetailPanel
              entry={selected}
              comments={comments[selected.id] || []}
              draftComment={draftComment}
              onDraftChange={setDraftComment}
              onAddComment={() => handleAddComment(selected.id)}
              onStatusChange={s => handleStatusChange(selected.id, s)}
              onClose={() => setParam({ id: null })}
              onDemoAction={handleDemoAction}
              onPersonKlick={() => navigate(personLink(selected.personBezug))}
            />
          </div>
        )}
      </div>

      {/* ── MOBILE / TABLET: Detail-Overlay ── */}
      {selected && (
        <div className="fixed inset-0 z-50 xl:hidden flex flex-col" style={{ background: "var(--bg-elevated)" }}>
          <div className="shrink-0 flex items-center" style={{ padding: "12px var(--space-4)", borderBottom: "var(--border-thin) solid var(--border-default)", minHeight: 48 }}>
            <button onClick={() => setParam({ id: null })} className="flex items-center cursor-pointer"
              style={{ gap: "var(--space-2)", background: "transparent", border: "none", fontSize: "var(--text-body)", color: "var(--text-secondary)", minHeight: 44, padding: "0 8px" }}>
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
              onPersonKlick={() => navigate(personLink(selected.personBezug))}
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
  onPersonKlick: () => void;
}

function DetailPanel({ entry, comments, draftComment, onDraftChange, onAddComment, onStatusChange, onClose, onDemoAction, onPersonKlick }: DetailPanelProps) {
  const isOverdue = entry.status !== "erledigt" && entry.faellig && daysFromToday(entry.faellig)! < 0;
  const typDef = pendenzTypen[entry.pendenzTyp];
  const statusCfg = STATUS_CFG[entry.status] || STATUS_CFG.offen;
  const prioCfg = PRIO_CFG[entry.prioritaet] || PRIO_CFG.niedrig;
  const personName = entryPersonName(entry);

  return (
    <div className="flex flex-col h-full">
      {/* Header — Titel = Betreff (die Sache); Person als verlinkte Unterzeile */}
      <div className="shrink-0" style={{ padding: "20px 24px", borderBottom: "var(--border-thin) solid var(--border-default)" }}>
        <div className="flex items-center justify-between" style={{ marginBottom: "var(--space-2)" }}>
          <div className="flex items-center" style={{ gap: "var(--space-2)" }}>
            <span style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>{typDef?.label || entry.typLabel}</span>
            <span style={{ fontSize: "var(--text-small)", color: "var(--text-tertiary)" }}>·</span>
            <span style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>{entry.id}</span>
          </div>
          <button onClick={onClose} className="flex items-center justify-center cursor-pointer transition-colors"
            style={{ width: 28, height: 28, borderRadius: "var(--radius-pill)", background: "transparent", border: "none" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <X style={{ width: 16, height: 16, color: "var(--text-secondary)" }} />
          </button>
        </div>
        <div style={{ fontSize: "var(--text-h2)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>
          {entry.betreff}
        </div>
        <button type="button" onClick={onPersonKlick} className="ui-fokusring inline-flex items-center cursor-pointer" style={{ gap: 4, marginTop: 4, background: "transparent", border: "none", padding: 0, fontFamily: "inherit" }}>
          <ExternalLink style={{ width: 11, height: 11, opacity: 0.6 }} />
          <span style={{ fontSize: "var(--text-small)", color: "var(--brand-primary)", fontWeight: "var(--weight-medium)" }}>{personName}</span>
          <span style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>· {personArtLabel(entry.personBezug.art)}</span>
        </button>
        {entry.kontext && (
          <div style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", marginTop: 6 }}>
            {entry.kontext}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto" style={{ padding: "20px 24px" }}>
        <AnnaPendenzVorschlag pendenz={entry} onActionExecuted={() => {}} onDemoAction={onDemoAction} />

        {isOverdue && (
          <div className="flex items-center" style={{ gap: "var(--space-2)", padding: "var(--space-3) var(--space-4)", background: "var(--status-danger-bg)", borderRadius: "var(--radius-card)", marginBottom: "var(--space-5)" }}>
            <AlertTriangle style={{ width: 16, height: 16, color: "var(--status-danger)", flexShrink: 0 }} />
            <span style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--status-danger)" }}>
              {faelligBanner(entry.faellig)}
            </span>
          </div>
        )}

        {entry.beschreibung && (
          <div style={{ fontSize: "var(--text-body)", color: "var(--text-primary)", lineHeight: 1.6, marginBottom: "var(--space-5)" }}>
            {entry.beschreibung}
          </div>
        )}

        <div style={{ background: "var(--bg-primary)", borderRadius: "var(--radius-card)", padding: "var(--space-4)", marginBottom: "var(--space-5)" }}>
          <MetaRow label="Art" value={typDef?.label || entry.typLabel} />
          <MetaRow label="Status">
            <span className="inline-flex items-center" style={{ gap: 4, padding: "2px 10px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", background: statusCfg.bg, color: statusCfg.color }}>
              <span style={{ width: 5, height: 5, borderRadius: "var(--radius-pill)", background: statusCfg.dot }} />
              {statusCfg.label}
            </span>
          </MetaRow>
          <MetaRow label={personArtLabel(entry.personBezug.art)}>
            <button type="button" onClick={onPersonKlick} className="ui-fokusring inline-flex items-center cursor-pointer" style={{ gap: 4, background: "transparent", border: "none", padding: 0, fontFamily: "inherit" }}>
              <span style={{ fontSize: "var(--text-small)", color: "var(--brand-primary)", fontWeight: "var(--weight-medium)" }}>{personName}</span>
              <ExternalLink style={{ width: 11, height: 11, opacity: 0.6, color: "var(--brand-primary)" }} />
            </button>
          </MetaRow>
          <MetaRow label="Zuständig">
            {istNichtZugewiesen(entry) ? (
              <span style={{ fontSize: "var(--text-small)", color: "var(--status-warning-text)", fontWeight: "var(--weight-medium)" }}>Nicht zugewiesen</span>
            ) : (
              <div className="flex items-center" style={{ gap: 6 }}>
                <MiniAvatar person={entry.verantwortlich} size={20} />
                <span style={{ fontSize: "var(--text-small)", color: "var(--text-primary)" }}>{entry.verantwortlich.name}</span>
              </div>
            )}
          </MetaRow>
          <MetaRow label="Priorität">
            <div className="flex items-center" style={{ gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: "var(--radius-pill)", background: prioCfg.color }} />
              <span style={{ fontSize: "var(--text-small)", color: "var(--text-primary)" }}>{prioCfg.label}</span>
            </div>
          </MetaRow>
          <MetaRow label="Fällig" value={entry.faellig ? isoZuAnzeige(entry.faellig) : "–"} />
          <MetaRow label="Erstellt von" value={entry.erstelltVon.name} />
          <MetaRow label="Erstellt am" value={formatDate(entry.erstellt)} last />
        </div>

        <div style={{ marginBottom: "var(--space-5)" }}>
          <div style={{ fontSize: "var(--text-micro)", color: "var(--text-secondary)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase" as const, marginBottom: "var(--space-3)" }}>
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
      <div className="shrink-0" style={{ padding: "12px 16px", borderTop: "var(--border-thin) solid var(--border-default)" }}>
        <div className="flex items-start" style={{ gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
          <textarea value={draftComment} onChange={e => onDraftChange(e.target.value)} placeholder="Kommentar schreiben…" rows={2}
            style={{ flex: 1, resize: "none", padding: "10px 12px", borderRadius: "var(--radius-card)", border: "var(--border-thin) solid var(--border-default)", background: "var(--bg-elevated)", fontSize: 16, color: "var(--text-primary)", fontFamily: "inherit" }} />
          <button onClick={onAddComment} disabled={!draftComment.trim()}
            className="shrink-0 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ width: 44, height: 44, borderRadius: "var(--radius-pill)", background: "var(--brand-primary)", border: "none" }}>
            <Send style={{ width: 16, height: 16, color: "var(--text-on-dark)" }} />
          </button>
        </div>
        <div className="flex items-center justify-between" style={{ gap: "var(--space-2)" }}>
          <select value={entry.status} onChange={e => onStatusChange(e.target.value)}
            style={{ padding: "10px 14px", borderRadius: "var(--radius-pill)", border: "var(--border-thin) solid var(--border-default)", background: "var(--bg-elevated)", fontSize: 16, color: "var(--text-primary)", fontFamily: "inherit", cursor: "pointer", minHeight: 44 }}>
            <option value="offen">Offen</option>
            <option value="in_bearbeitung">In Bearbeitung</option>
            <option value="erledigt">Abgeschlossen</option>
          </select>
          <button onClick={() => onStatusChange("erledigt")} className="inline-flex items-center cursor-pointer transition-colors"
            style={{ gap: "var(--space-1)", padding: "10px 16px", borderRadius: "var(--radius-pill)", background: "transparent", border: "none", fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-secondary)", minHeight: 44 }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--status-success-bg)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <Check style={{ width: 14, height: 14 }} /> Abschliessen
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
    <div className="flex items-center justify-between" style={{ padding: "8px 0", borderBottom: last ? "none" : "var(--border-thin) solid var(--border-default)" }}>
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
    <div className="shrink-0 flex items-center justify-center" style={{ width: size, height: size, borderRadius: "var(--radius-pill)", background: person.color || "var(--text-tertiary)" }}>
      <span style={{ color: "var(--text-on-dark)", fontSize: size <= 20 ? 8 : 9, fontWeight: "var(--weight-medium)" }}>
        {person.initialen}
      </span>
    </div>
  );
}
