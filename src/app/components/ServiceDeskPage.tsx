import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { Plus, X, AlertTriangle, Check, ArrowLeft, Send, Sparkles, Search, ChevronDown, ExternalLink } from "lucide-react";
import { getUnifiedEntries, entryBetreff, entryPersonName, CURRENT_USER, type UnifiedEntry } from "../../lib/mocks/service-desk-unified";
import { personLink, personArtLabel, type PersonenBezug } from "../../lib/mocks/personen-aufloesung";
import { type Person } from "../../lib/mocks/workflow-tasks";
import { pendenzTypen, type PendenzTyp } from "../../types/pendenz";
import { DataTable, type SpalteDef } from "./ui/DataTable";
import { isoZuAnzeige, formatTagMonat, isoZuDate } from "../../lib/datum";
import { PersonenAuswahl, type PersonOption } from "./ui/PersonenAuswahl";
import { Popover, PopoverAnchor, PopoverContent } from "./ui/popover";
import { DateField } from "./form/DateField";
import { getDiplomierte } from "../../lib/betreuung/diplomierte";
import { patientenSeed } from "./patientData";
import { angehoerigeSeed } from "./angehoerigeData";
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

/* ── Status: Anzeige-Labels (Fuss-Umschalter und Verlauf) ── */
const STATUS_LABEL: Record<string, string> = { offen: "Offen", in_bearbeitung: "In Arbeit", erledigt: "Abgeschlossen" };
const STATUS_SEGMENTE: [string, string][] = [["offen", "Offen"], ["in_bearbeitung", "In Arbeit"], ["erledigt", "Abgeschlossen"]];

/* ── Status-Zelle (Liste): Punkt + Wort. Offen still, In Arbeit hervorgehoben,
   Abgeschlossen zurückgenommen. Farbe UND Schriftstärke unterscheiden. ── */
const STATUS_ZELL_CFG: Record<string, { dot: string; color: string; weight: string }> = {
  offen: { dot: "var(--text-tertiary)", color: "var(--text-secondary)", weight: "var(--weight-regular)" },
  in_bearbeitung: { dot: "var(--status-warning)", color: "var(--status-warning-text)", weight: "var(--weight-medium)" },
  erledigt: { dot: "var(--status-success)", color: "var(--text-tertiary)", weight: "var(--weight-regular)" },
};

/* ── Priorität: Regelfall wird nicht angezeigt, nur Abweichungen. ── */
const PRIO_REGELFALL = "mittel";

/* ── Verlauf: ein Strang (Erstellung, Statuswechsel, Kommentare). ── */
type VerlaufTyp = "erstellt" | "status" | "zuweisung" | "kommentar" | "feld";
interface VerlaufEintrag {
  typ: VerlaufTyp; by: string; at: string;
  text?: string;                     // erstellt / kommentar
  feld?: string; feldLabel?: string; // Feldänderung — Koaleszenz-Schlüssel (feld + by)
  alt?: string; neu?: string; freitext?: boolean;
}
/** Eine Feldänderung, wie DetailPanel sie meldet (Rohwert im patch, Anzeige in alt/neu). */
interface Aenderung { feld: string; feldLabel: string; patch: Partial<UnifiedEntry>; alt: string; neu: string; freitext?: boolean; typ?: VerlaufTyp; }

// Autorin und Zeitpunkt jeder Bearbeitung (Prototyp: fest, im Mock-Präsens).
const BEARBEITER = "M. Keller";
const BEARBEITET_AM = "03.03.2026, 14:45";

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

/* ── Sortierung: jede Spalte, inhaltliche Rangfolge wo sinnvoll, Leerwerte immer
   ans Ende. Standard bleibt Fälligkeit aufsteigend (überfällig zuerst, ohne Termin
   zuletzt). ── */
type SortKey = "kennzeichen" | "art" | "betreff" | "status" | "person" | "beschreibung" | "faellig" | "zustaendig";
const SORT_LABEL: Record<SortKey, string> = { kennzeichen: "Kennzeichen", art: "Kategorie", betreff: "Titel", status: "Status", person: "Person", beschreibung: "Beschreibung", faellig: "Fälligkeit", zustaendig: "Zuständig" };
const KENN_RANK: Record<string, number> = { rot: 0, gelb: 1 }; // kein Kennzeichen = 2
const STATUS_RANK: Record<string, number> = { offen: 0, in_bearbeitung: 1, erledigt: 2 };
function kennRang(e: UnifiedEntry): number { const t = ableitenKennzeichen(e).typ; return t ? KENN_RANK[t] : 2; }
/** Leere Werte stehen unabhängig von der Richtung am Ende. */
function leerZuletzt(la: boolean, lb: boolean, f: number, cmp: () => number): number {
  if (la && lb) return 0;
  if (la) return 1;
  if (lb) return -1;
  return f * cmp();
}
function sortEntries(list: UnifiedEntry[], key: SortKey, dir: "asc" | "desc"): UnifiedEntry[] {
  const f = dir === "asc" ? 1 : -1;
  const artLabel = (e: UnifiedEntry) => pendenzTypen[e.pendenzTyp]?.label || e.typLabel;
  return [...list].sort((a, b) => {
    switch (key) {
      case "kennzeichen": return f * (kennRang(a) - kennRang(b)) || entryBetreff(a).localeCompare(entryBetreff(b), "de");
      case "art": return f * artLabel(a).localeCompare(artLabel(b), "de");
      case "betreff": return f * entryBetreff(a).localeCompare(entryBetreff(b), "de");
      case "status": return f * ((STATUS_RANK[a.status] ?? 0) - (STATUS_RANK[b.status] ?? 0)) || entryBetreff(a).localeCompare(entryBetreff(b), "de");
      case "person": return f * entryPersonName(a).localeCompare(entryPersonName(b), "de");
      case "beschreibung": return leerZuletzt(!a.kontext, !b.kontext, f, () => a.kontext.localeCompare(b.kontext, "de"));
      case "faellig": return leerZuletzt(!a.faellig, !b.faellig, f, () => daysFromToday(a.faellig)! - daysFromToday(b.faellig)!);
      case "zustaendig": return leerZuletzt(istNichtZugewiesen(a), istNichtZugewiesen(b), f, () => a.verantwortlich.initialen.localeCompare(b.verantwortlich.initialen, "de"));
      default: return 0;
    }
  });
}

/* ── Mehrfachauswahl-Dropdown (lokal; kein neues Shared-/shadcn-Bauteil) ── */
function AuswahlDropdown({ label, optionen, ausgewaehlt, onToggle, einfach, wert, onWaehle }: {
  label: string;
  optionen: { value: string; label: string }[];
  ausgewaehlt?: Set<string>;
  onToggle?: (value: string) => void;
  // Einfachauswahl (Feldbearbeitung): ein Wert, Klick übernimmt und schliesst.
  einfach?: boolean;
  wert?: string;
  onWaehle?: (value: string) => void;
}) {
  const [offen, setOffen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!offen) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOffen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [offen]);
  const anzahl = ausgewaehlt?.size ?? 0;
  const hervor = !einfach && anzahl > 0;
  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOffen(o => !o)} className="ui-fokusring inline-flex items-center cursor-pointer transition-colors"
        style={{ gap: 6, padding: "7px 12px", borderRadius: "var(--radius-pill)", background: hervor ? "var(--brand-primary-light)" : "var(--bg-elevated)", border: hervor ? "var(--border-thin) solid var(--brand-primary)" : "var(--border-thin) solid var(--border-default)", fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: hervor ? "var(--brand-primary)" : "var(--text-primary)", fontFamily: "inherit", whiteSpace: "nowrap" }}>
        {label}{hervor && <span style={{ fontVariantNumeric: "tabular-nums" }}>· {anzahl}</span>}
        <ChevronDown style={{ width: 14, height: 14, opacity: 0.7 }} />
      </button>
      {offen && (
        <div className="absolute z-50" style={{ top: "calc(100% + 6px)", left: 0, minWidth: 220, maxHeight: 320, overflowY: "auto", padding: 6, background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-overlay)" }}>
          {optionen.map(opt => {
            const aktiv = einfach ? wert === opt.value : (ausgewaehlt?.has(opt.value) ?? false);
            return (
              <button key={opt.value} type="button" onClick={() => { if (einfach) { onWaehle?.(opt.value); setOffen(false); } else { onToggle?.(opt.value); } }} className="w-full inline-flex items-center cursor-pointer transition-colors"
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
  const [localEdits, setLocalEdits] = useState<Record<string, Partial<UnifiedEntry>>>({});
  const [verlauf, setVerlauf] = useState<Record<string, VerlaufEintrag[]>>({});
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
  // Bearbeitete Felder liegen als lokale Overlays je Pendenz über den Quelldaten
  // (derselbe Weg wie bisher der Status — nur jetzt für alle bearbeitbaren Felder).
  const entries = useMemo(
    () => allEntries.map(e => ({ ...e, ...(localEdits[e.id] || {}) })),
    [allEntries, localEdits],
  );

  const segmentBasis = useMemo(() => entries.filter(e => imSegment(e, filter.segment)), [entries, filter.segment]);
  const chipCounts = useMemo(() => {
    const r = {} as Record<StatusChipId, number>;
    for (const chip of STATUS_CHIPS) r[chip.id] = segmentBasis.filter(chip.praedikat).length;
    return r;
  }, [segmentBasis]);

  const gefiltert = useMemo(() => filterEntries(entries, filter), [entries, filter]);
  // Die geöffnete Pendenz bleibt sichtbar, auch wenn sie durch eine Bearbeitung aus
  // dem aktiven Filter fällt — bis der Detailbereich geschlossen wird.
  const filtered = useMemo(() => {
    if (!selectedId || gefiltert.some(e => e.id === selectedId)) return gefiltert;
    const sel = entries.find(e => e.id === selectedId);
    return sel ? [...gefiltert, sel] : gefiltert;
  }, [gefiltert, selectedId, entries]);
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
    filter.arten.forEach(art => t.push({ key: `a-${art}`, label: `Kategorie: ${pendenzTypen[art]?.label || art}`, entfernen: () => toggleArt(art) }));
    filter.zustaendige.forEach(n => t.push({ key: `z-${n}`, label: `Zuständig: ${n}`, entfernen: () => toggleZustaendig(n) }));
    return t;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const pushVerlauf = (id: string, eintrag: VerlaufEintrag) =>
    setVerlauf(prev => ({ ...prev, [id]: [...(prev[id] || []), eintrag] }));

  // Ein Schreibpfad für alle Feldbearbeitungen: Overlay setzen + Verlauf koaleszieren.
  // Ändert dieselbe Person (BEARBEITER) dasselbe Feld erneut, wird der bestehende
  // Eintrag angepasst (ursprünglicher alt bleibt, neu + Zeitpunkt aktualisiert);
  // kehrt der Wert auf den Ausgangswert zurück, entfällt der Eintrag.
  const aendereFeld = (id: string, a: Aenderung, by = BEARBEITER) => {
    if (a.alt === a.neu) return;
    setLocalEdits(prev => ({ ...prev, [id]: { ...(prev[id] || {}), ...a.patch } }));
    setVerlauf(prev => {
      const list = prev[id] || [];
      const idx = list.findIndex(v => v.feld === a.feld && v.by === by);
      if (idx >= 0) {
        const e = list[idx];
        if (a.neu === e.alt) return { ...prev, [id]: list.filter((_, i) => i !== idx) };
        return { ...prev, [id]: list.map((v, i) => i === idx ? { ...v, neu: a.neu, at: BEARBEITET_AM } : v) };
      }
      return { ...prev, [id]: [...list, { typ: a.typ ?? "feld", by, at: BEARBEITET_AM, feld: a.feld, feldLabel: a.feldLabel, alt: a.alt, neu: a.neu, freitext: a.freitext }] };
    });
  };

  // Statuswechsel: Sonderfall (Signatur bleibt für Bulk/Demo erhalten).
  const handleStatusChange = (id: string, newStatus: string, by = BEARBEITER) => {
    const alt = entries.find(e => e.id === id)?.status ?? "offen";
    aendereFeld(id, { feld: "status", feldLabel: "Status", patch: { status: newStatus as UnifiedEntry["status"] }, alt: STATUS_LABEL[alt] || alt, neu: STATUS_LABEL[newStatus] || newStatus, typ: "status" }, by);
  };

  // Personenwechsel: verschiebt die Pendenz ins Dossier einer anderen Person → Rückfrage.
  const handlePersonChange = (id: string, bezug: PersonenBezug, neuName: string) => {
    const altName = entryPersonName(entries.find(e => e.id === id)!);
    if (altName === neuName) return;
    if (!window.confirm(`Pendenz zu «${neuName}» verschieben? Sie erscheint danach in einem anderen Dossier und verschwindet aus dem aktuellen.`)) return;
    aendereFeld(id, { feld: "personBezug", feldLabel: "Person", patch: { personBezug: bezug }, alt: altName, neu: neuName });
  };

  const handleAddComment = (id: string) => {
    if (!draftComment.trim()) return;
    pushVerlauf(id, { typ: "kommentar", text: draftComment.trim(), by: "Maria Keller", at: "03.03.2026, 14:30" });
    setDraftComment("");
  };

  const [demoModal, setDemoModal] = useState<{ open: boolean; mockType: string; pendenzId: string }>({ open: false, mockType: "", pendenzId: "" });
  const handleDemoAction = (mockType: string) => { if (selectedId) setDemoModal({ open: true, mockType, pendenzId: selectedId }); };
  const handleDemoConfirm = () => {
    const id = demoModal.pendenzId;
    setDemoModal({ open: false, mockType: "", pendenzId: "" });
    handleStatusChange(id, "erledigt", "Anna");
  };

  // Bulk-Auswahl (nur Backoffice/Management)
  const toggleBulk = (id: string) => setBulkSelected(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const bulkEntries = useMemo(() => filtered.filter(e => bulkSelected.has(e.id)), [filtered, bulkSelected]);
  const bulkAllSameType = bulkEntries.length > 0 && bulkEntries.every(e => e.pendenzTyp === bulkEntries[0].pendenzTyp);
  const bulkTypDef = bulkAllSameType ? pendenzTypen[bulkEntries[0].pendenzTyp] : null;
  const bulkAction = bulkTypDef?.bulkAction;

  const handleBulkExecute = () => {
    for (const id of bulkSelected) handleStatusChange(id, bulkAction?.isDemoMock ? "erledigt" : "in_bearbeitung", "Anna");
    toast(bulkAction?.resultDescription?.replace("{N}", String(bulkSelected.size)) || `${bulkSelected.size} Pendenzen aktualisiert`);
    setBulkSelected(new Set());
  };
  const handleBulkErledigen = () => {
    for (const id of bulkSelected) handleStatusChange(id, "erledigt", "Anna");
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
  // Betreff: die Sache, Schriftstärke 500, Normalgrösse, einzeilig mit Ellipsis.
  // (Status steht in eigener Spalte, keine Kennzeichnung mehr am Betreff.)
  const betreffZelle = (e: UnifiedEntry) => (
    <span title={e.betreff} style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>{e.betreff}</span>
  );

  const statusZelle = (e: UnifiedEntry) => {
    const c = STATUS_ZELL_CFG[e.status] || STATUS_ZELL_CFG.offen;
    return (
      <span className="inline-flex items-center" style={{ gap: 6, maxWidth: "100%", minWidth: 0 }}>
        <span style={{ width: 6, height: 6, borderRadius: "var(--radius-pill)", background: c.dot, flexShrink: 0 }} />
        <span title={STATUS_LABEL[e.status]} style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "var(--text-small)", color: c.color, fontWeight: c.weight }}>{STATUS_LABEL[e.status]}</span>
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

  // Fällig: Datum ohne Jahr (Datumsschicht) + Abweichung in Kurzform; Signalfarbe
  // nur bei Überschreitung (danger) oder nahem Termin (warning).
  const faelligZelle = (e: UnifiedEntry) => {
    if (!e.faellig) return <span style={{ fontSize: "var(--text-small)", color: "var(--text-tertiary)" }}>–</span>;
    const d = daysFromToday(e.faellig)!;
    const datum = formatTagMonat(isoZuDate(e.faellig)!);
    let abw: string | null = null, ton: "danger" | "warning" | "still" = "still";
    if (e.status !== "erledigt" && d < 0) { abw = `+${Math.abs(d)} T.`; ton = "danger"; }
    else if (e.status !== "erledigt" && d === 0) { abw = "heute"; ton = "danger"; }
    else if (e.status !== "erledigt" && d <= 3) { abw = `in ${d} T.`; ton = "warning"; }
    const farbe = ton === "danger" ? "var(--status-danger)" : ton === "warning" ? "var(--status-warning-text)" : "var(--text-tertiary)";
    return (
      <span className="inline-flex items-baseline" style={{ gap: 5, whiteSpace: "nowrap" }}>
        <span style={{ fontSize: "var(--text-small)", color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>{datum}</span>
        {abw && <span style={{ fontSize: "var(--text-meta)", fontWeight: ton === "danger" ? "var(--weight-medium)" : "var(--weight-regular)", color: farbe }}>{abw}</span>}
      </span>
    );
  };

  // Zuständig: Kürzel in Sekundärfarbe, kein Kreis, keine Fläche; leer → "Zuweisen".
  const zustaendigZelle = (e: UnifiedEntry) => istNichtZugewiesen(e) ? (
    <button type="button" onClick={ev => { ev.stopPropagation(); }} aria-label="Zuweisen" title="Zuweisen" className="ui-fokusring inline-flex items-center justify-center cursor-pointer" style={{ width: 22, height: 22, borderRadius: "var(--radius-card)", background: "transparent", border: "var(--border-thin) dashed var(--border-default)", color: "var(--text-tertiary)", padding: 0 }}>
      <Plus style={{ width: 13, height: 13 }} />
    </button>
  ) : (
    <span title={e.verantwortlich.name} style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", fontWeight: "var(--weight-medium)", whiteSpace: "nowrap" }}>{e.verantwortlich.initialen}</span>
  );

  // Einzeilige Tabelle in allen Master-Detail-Breiten (Karten erst < 500 px, siehe
  // karteAbPx). Kartenkopf nur für den seltenen Kartenfall: Kennzeichen + Betreff + Fälligkeit.
  const karteTitel = (e: UnifiedEntry) => (
    <div className="flex items-center" style={{ gap: 8, width: "100%", minWidth: 0 }}>
      {kennzeichenIcon(e)}
      <span className="truncate" style={{ flex: 1, minWidth: 0, fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>{e.betreff}</span>
      {e.faellig && faelligZelle(e)}
    </div>
  );

  // Je Spalte Mindestbreite und Obergrenze in ch — der Browser verteilt via minmax().
  // Keine eigene Pixelrechnung, keine gesteuerte Verteilungsreihenfolge.
  // Spaltenfall (abwerfRang, kleinster zuerst): Beschreibung, dann Art, dann Zuständig.
  const spalten: SpalteDef<UnifiedEntry>[] = [
    { id: "kennzeichen", label: "", festBreitePx: 24, align: "center", sortierbar: true, ausKarte: true, render: kennzeichenIcon },
    { id: "art", label: "Kategorie", minCh: 14, maxSpur: "21ch", abwerfRang: 2, align: "left", sortierbar: true, render: artZelle },
    { id: "betreff", label: "Titel", minCh: 20, maxSpur: "40ch", align: "left", sortierbar: true, ausKarte: true, render: betreffZelle },
    { id: "status", label: "Status", minCh: 16, maxSpur: "16ch", align: "left", sortierbar: true, render: statusZelle },
    { id: "person", label: "Person", minCh: 18, maxSpur: "34ch", align: "left", sortierbar: true, render: personZelle },
    { id: "beschreibung", label: "Beschreibung", minCh: 13, maxSpur: "34ch", abwerfRang: 1, align: "left", sortierbar: true, render: beschreibungZelle },
    { id: "faellig", label: "Fällig", minCh: 13, maxSpur: "14ch", align: "left", sortierbar: true, ausKarte: true, render: faelligZelle },
    { id: "zustaendig", label: "Zuständig", minCh: 10, maxSpur: "11ch", abwerfRang: 3, align: "center", sortierbar: true, render: zustaendigZelle },
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

            <AuswahlDropdown label="Kategorie" optionen={alleArten.map(t => ({ value: t, label: pendenzTypen[t]?.label || t }))} ausgewaehlt={filter.arten as Set<string>} onToggle={v => toggleArt(v as PendenzTyp)} />
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
                  <Check style={{ width: 13, height: 13 }} /> Abgeschlossen
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
              karteAbPx={500}
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
              verlauf={verlauf[selected.id] || []}
              draftComment={draftComment}
              onDraftChange={setDraftComment}
              onAddComment={() => handleAddComment(selected.id)}
              onStatusChange={s => handleStatusChange(selected.id, s)}
              onClose={() => setParam({ id: null })}
              onDemoAction={handleDemoAction}
              onPersonKlick={() => navigate(personLink(selected.personBezug))}
              onFeld={a => aendereFeld(selected.id, a)}
              onPerson={(bezug, neuName) => handlePersonChange(selected.id, bezug, neuName)}
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
          <div className="flex-1 min-h-0">
            <DetailPanel
              entry={selected}
              verlauf={verlauf[selected.id] || []}
              draftComment={draftComment}
              onDraftChange={setDraftComment}
              onAddComment={() => handleAddComment(selected.id)}
              onStatusChange={s => handleStatusChange(selected.id, s)}
              onClose={() => setParam({ id: null })}
              onDemoAction={handleDemoAction}
              onPersonKlick={() => navigate(personLink(selected.personBezug))}
              onFeld={a => aendereFeld(selected.id, a)}
              onPerson={(bezug, neuName) => handlePersonChange(selected.id, bezug, neuName)}
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

/* ── Quellen für die Auswahlfelder ── */
// Person: alle Patienten + Angehörigen (zentrale Mockdaten), je mit typisiertem Bezug.
const ALLE_PERSONEN: { option: PersonOption; bezug: PersonenBezug; name: string }[] = [
  ...patientenSeed.map(p => ({
    option: { id: `p-${p.id}`, initialen: `${p.vorname[0] ?? ""}${p.nachname[0] ?? ""}`, nachname: p.nachname, vorname: p.vorname, rolle: "Patient/in" },
    bezug: { art: "patient" as const, kennung: p.id }, name: `${p.vorname} ${p.nachname}`,
  })),
  ...angehoerigeSeed.map(a => ({
    option: { id: `a-${a.id}`, initialen: `${a.vorname[0] ?? ""}${a.nachname[0] ?? ""}`, nachname: a.nachname, vorname: a.vorname, rolle: "Angehörige/r" },
    bezug: { art: "angehoeriger" as const, kennung: a.id }, name: `${a.vorname} ${a.nachname}`,
  })),
];
// Zuständigkeit: zentrale Diplomierten-Liste (lib/betreuung).
const DIPL_OPTIONEN: PersonOption[] = getDiplomierte().map(d => ({ id: d.id, initialen: d.initialen, nachname: d.name, vorname: d.vorname, rolle: d.funktion }));
const diplZuPerson = (id: string): Person | null => {
  const d = getDiplomierte().find(x => x.id === id);
  return d ? { name: `${d.vorname} ${d.name}`, initialen: d.initialen } : null;
};

/* ── Inline-Bearbeitung: Wert anklicken → Feld; Verlassen übernimmt, Escape verwirft.
   Erkennbar an einer gestrichelten Unterstreichung (Form, nicht Farbe) + Titel-Hinweis. ── */
const editierbarCue: React.CSSProperties = { borderBottom: "1px dashed var(--text-tertiary)", cursor: "pointer" };

function InlineText({ value, onCommit, mehrzeilig, textStyle, placeholder }: {
  value: string; onCommit: (v: string) => void; mehrzeilig?: boolean; textStyle?: React.CSSProperties; placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const start = () => { setDraft(value); setEditing(true); };
  const commit = () => { setEditing(false); const t = draft.trim(); if (t !== value) onCommit(t); };
  const cancel = () => { setEditing(false); setDraft(value); };
  useEffect(() => { if (editing && ref.current) { ref.current.focus(); ref.current.select?.(); } }, [editing]);
  if (!editing) {
    return (
      <span role="button" tabIndex={0} onClick={start} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); start(); } }}
        className="ui-fokusring" style={{ ...textStyle, ...editierbarCue }} title="Zum Bearbeiten klicken">
        {value || <span style={{ color: "var(--text-tertiary)" }}>{placeholder || "—"}</span>}
      </span>
    );
  }
  const gemeinsam = {
    ref,
    value: draft,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(e.target.value),
    onBlur: commit,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); cancel(); }
      if (e.key === "Enter" && !mehrzeilig) { e.preventDefault(); commit(); }
    },
    style: { ...textStyle, width: "100%", fontFamily: "inherit", padding: "3px 8px", borderRadius: "var(--radius-input)", border: "var(--border-thin) solid var(--brand-primary)", background: "var(--bg-elevated)", color: "var(--text-primary)", outline: "none" } as React.CSSProperties,
  };
  return mehrzeilig
    ? <textarea {...gemeinsam} rows={3} style={{ ...gemeinsam.style, resize: "vertical" }} />
    : <input {...gemeinsam} />;
}


/** Personen-/Zuständigkeits-Auswahl über das geteilte PersonenAuswahl in einem Popover. */
function AuswahlPopover({ ausloeser, personen, selectedId, onSelect, breite = 300 }: {
  ausloeser: (offen: boolean, toggle: () => void, ref: React.Ref<HTMLButtonElement>) => React.ReactNode;
  personen: PersonOption[]; selectedId: string | null; onSelect: (id: string) => void; breite?: number;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild><span className="inline-flex">{ausloeser(open, () => setOpen(o => !o), ref)}</span></PopoverAnchor>
      <PopoverContent align="start" side="bottom" sideOffset={6} style={{ width: breite, padding: 6 }}
        onEscapeKeyDown={() => setOpen(false)} onCloseAutoFocus={e => { e.preventDefault(); ref.current?.focus(); }}>
        <PersonenAuswahl personen={personen} selectedId={selectedId} onSelect={id => { onSelect(id); setOpen(false); }} suchePlaceholder="Person suchen" leerText="Keine Person gefunden." />
      </PopoverContent>
    </Popover>
  );
}

/** Fälligkeit: Auslöser wie die übrigen Felder (Pille), die Datumskomponente im Popover. */
function FaelligPicker({ entry, onFeld }: { entry: UnifiedEntry; onFeld: (a: Aenderung) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <button ref={ref} type="button" onClick={() => setOpen(o => !o)} className="ui-fokusring inline-flex items-center cursor-pointer" title="Fälligkeit ändern"
          style={{ gap: 6, padding: "7px 12px", borderRadius: "var(--radius-pill)", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", fontFamily: "inherit", whiteSpace: "nowrap" }}>
          {entry.faellig ? isoZuAnzeige(entry.faellig) : "Kein Datum"}
          <ChevronDown style={{ width: 14, height: 14, opacity: 0.7 }} />
        </button>
      </PopoverAnchor>
      <PopoverContent align="start" side="bottom" sideOffset={6} style={{ width: 280, padding: 12 }}
        onEscapeKeyDown={() => setOpen(false)} onCloseAutoFocus={e => { e.preventDefault(); ref.current?.focus(); }}>
        <DateField wertFormat="iso" bereich="any" value={entry.faellig}
          onChange={v => { const neu = (v as string) || null; if (neu !== entry.faellig) onFeld({ feld: "faellig", feldLabel: "Fälligkeit", patch: { faellig: neu }, alt: entry.faellig ? isoZuAnzeige(entry.faellig) : "—", neu: neu ? isoZuAnzeige(neu) : "—" }); }} />
      </PopoverContent>
    </Popover>
  );
}

interface DetailPanelProps {
  entry: UnifiedEntry;
  verlauf: VerlaufEintrag[];
  draftComment: string;
  onDraftChange: (v: string) => void;
  onAddComment: () => void;
  onStatusChange: (s: string) => void;
  onClose: () => void;
  onDemoAction?: (mockType: string) => void;
  onPersonKlick: () => void;
  onFeld: (a: Aenderung) => void;
  onPerson: (bezug: PersonenBezug, neuName: string) => void;
}

function DetailPanel({ entry, verlauf, draftComment, onDraftChange, onAddComment, onStatusChange, onClose, onPersonKlick, onFeld, onPerson }: DetailPanelProps) {
  const sektionLabel = { fontSize: "var(--text-micro)", color: "var(--text-secondary)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase" as const, fontWeight: "var(--weight-medium)", marginBottom: "var(--space-2)" };
  const personName = entryPersonName(entry);
  const faellig = entry.faellig ? faelligDarstellung(entry.faellig, entry.status) : null;
  const faelligFarbe = faellig?.ton === "danger" ? "var(--status-danger)" : faellig?.ton === "warning" ? "var(--status-warning-text)" : "var(--text-tertiary)";

  // Verlauf: Erstellung immer zuunterst (nie leer), danach die dynamischen Einträge;
  // Anzeige neueste zuerst.
  const erstellEintrag: VerlaufEintrag = { typ: "erstellt", text: "Pendenz erstellt", by: entry.erstelltVon.name, at: formatDate(entry.erstellt) };
  const eintraege = [erstellEintrag, ...verlauf].reverse();
  // Feldänderungen: Listenwerte zeigen alt → neu; Freitext nur die Tatsache.
  const verlaufText = (v: VerlaufEintrag): string =>
    v.feld ? `${v.feldLabel} ${v.freitext ? "bearbeitet" : `geändert · ${v.alt} → ${v.neu}`}` : (v.text || "");

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* ── KOPF (fest) ── */}
      <div className="shrink-0" style={{ padding: "16px 24px", borderBottom: "var(--border-thin) solid var(--border-default)" }}>
        {/* Zeile 1: Kennung · Art + Schliessen */}
        <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
          <div className="flex items-center" style={{ gap: 6, minWidth: 0 }}>
            <span style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums" }}>{entry.id}</span>
            <span style={{ fontSize: "var(--text-small)", color: "var(--text-tertiary)" }}>·</span>
            <AuswahlDropdown
              einfach label={pendenzTypen[entry.pendenzTyp]?.label || entry.typLabel} wert={entry.pendenzTyp}
              optionen={(Object.keys(pendenzTypen) as PendenzTyp[]).map(t => ({ value: t, label: pendenzTypen[t]?.label || t }))}
              onWaehle={v => onFeld({ feld: "pendenzTyp", feldLabel: "Kategorie", patch: { pendenzTyp: v as PendenzTyp }, alt: pendenzTypen[entry.pendenzTyp]?.label || entry.pendenzTyp, neu: pendenzTypen[v as PendenzTyp]?.label || v })}
            />
          </div>
          <button onClick={onClose} className="shrink-0 flex items-center justify-center cursor-pointer transition-colors"
            style={{ width: 28, height: 28, borderRadius: "var(--radius-pill)", background: "transparent", border: "none" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <X style={{ width: 16, height: 16, color: "var(--text-secondary)" }} />
          </button>
        </div>
        {/* Zeile 2: Titel (Freitext — Verlauf hält nur die Tatsache fest) */}
        <div style={{ marginBottom: 8 }}>
          <InlineText
            value={entry.betreff}
            onCommit={v => onFeld({ feld: "betreff", feldLabel: "Titel", patch: { betreff: v }, alt: entry.betreff, neu: v, freitext: true })}
            textStyle={{ fontSize: "var(--text-h2)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}
            placeholder="Titel"
          />
        </div>
        {/* Zeile 3: Person · Personenart | Fälligkeit · Priorität. Fälligkeit und
            Priorität bleiben zusammen (Priorität nie auf eigener Zeile); wird es eng,
            kürzt der Personenname und die Personenart weicht zuerst. */}
        <div className="flex items-center flex-wrap" style={{ gap: 10, minWidth: 0 }}>
          {/* Person — Auswahl aus Patienten und Angehörigen; Wechsel verlangt eine Rückfrage */}
          <AuswahlPopover
            personen={ALLE_PERSONEN.map(p => p.option)}
            selectedId={ALLE_PERSONEN.find(p => p.bezug.art === entry.personBezug.art && p.bezug.kennung === entry.personBezug.kennung)?.option.id ?? null}
            onSelect={id => { const t = ALLE_PERSONEN.find(p => p.option.id === id); if (t) onPerson(t.bezug, t.name); }}
            ausloeser={(_offen, toggle, ref) => (
              <button ref={ref} type="button" onClick={toggle} className="ui-fokusring inline-flex items-center cursor-pointer" title="Person ändern"
                style={{ gap: 4, minWidth: 0, flex: "0 1 auto", overflow: "hidden", background: "transparent", border: "none", padding: 0, fontFamily: "inherit", ...editierbarCue }}>
                <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "var(--text-small)", color: "var(--brand-primary)", fontWeight: "var(--weight-medium)" }}>{personName}</span>
                <span style={{ flexShrink: 0, fontSize: "var(--text-meta)", color: "var(--text-tertiary)", whiteSpace: "nowrap" }}>· {personArtLabel(entry.personBezug.art)}</span>
                <ChevronDown style={{ width: 11, height: 11, opacity: 0.6, flexShrink: 0 }} />
              </button>
            )}
          />
          {/* Fälligkeit — Auslöser wie die übrigen Felder, Datumskomponente im Popover */}
          <span className="inline-flex items-center shrink-0" style={{ gap: 5 }}>
            <FaelligPicker entry={entry} onFeld={onFeld} />
            {faellig?.abw && <span style={{ fontSize: "var(--text-meta)", fontWeight: faellig.ton === "danger" ? "var(--weight-medium)" : "var(--weight-regular)", color: faelligFarbe }}>{faellig.abw}</span>}
          </span>
          {/* Priorität — immer bearbeitbar, Produkt-Auswahlbauteil */}
          <span className="inline-flex items-center shrink-0" style={{ gap: 5 }}>
            <span style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>Priorität</span>
            <AuswahlDropdown einfach label={PRIO_CFG[entry.prioritaet]?.label || entry.prioritaet} wert={entry.prioritaet}
              optionen={[{ value: "hoch", label: "Hoch" }, { value: "mittel", label: "Mittel" }, { value: "niedrig", label: "Niedrig" }]}
              onWaehle={v => onFeld({ feld: "prioritaet", feldLabel: "Priorität", patch: { prioritaet: v as UnifiedEntry["prioritaet"] }, alt: PRIO_CFG[entry.prioritaet]?.label || entry.prioritaet, neu: PRIO_CFG[v]?.label || v })} />
          </span>
        </div>
      </div>

      {/* ── KÖRPER (scrollt) ── */}
      <div className="flex-1 overflow-y-auto min-h-0" style={{ padding: "20px 24px" }}>
        {/* ANNA-VORSCHLAG — vorübergehend ausgeblendet. Mechanismus, Sammelaktion und
            Komponente bleiben erhalten; zum Reaktivieren die folgende Zeile einkommentieren. */}
        {/* <AnnaPendenzVorschlag pendenz={entry} onActionExecuted={() => {}} onDemoAction={onDemoAction} /> */}

        {/* Beschreibung — mehrzeiliger Freitext, trägt, was zu tun ist */}
        <div style={{ marginBottom: "var(--space-6)" }}>
          <div style={sektionLabel}>Beschreibung</div>
          <InlineText value={entry.beschreibung} mehrzeilig
            onCommit={v => onFeld({ feld: "beschreibung", feldLabel: "Beschreibung", patch: { beschreibung: v }, alt: entry.beschreibung, neu: v, freitext: true })}
            textStyle={{ fontSize: "var(--text-body)", color: "var(--text-primary)", lineHeight: 1.5 }}
            placeholder="Beschreibung hinzufügen…" />
        </div>

        {/* Verlauf — ein Strang, neueste zuerst; Erstellung immer vorhanden. */}
        <div>
          <div style={sektionLabel}>Verlauf</div>
          <div className="flex flex-col" style={{ gap: "var(--space-3)" }}>
            {eintraege.map((v, i) => v.typ === "kommentar" ? (
              <div key={i} className="flex" style={{ gap: "var(--space-3)" }}>
                <MiniAvatar person={{ name: v.by, initialen: v.by.split(" ").map(w => w[0]).join(""), color: "#4F46E5" }} size={24} />
                <div className="flex-1 min-w-0" style={{ background: "var(--bg-secondary)", borderRadius: "var(--radius-card)", padding: "8px 12px" }}>
                  <div className="flex items-center" style={{ gap: "var(--space-2)" }}>
                    <span style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>{v.by}</span>
                    <span style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>{v.at}</span>
                  </div>
                  <div style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", marginTop: 2 }}>{v.text}</div>
                </div>
              </div>
            ) : (
              <div key={i} className="flex" style={{ gap: "var(--space-2)" }}>
                <span className="shrink-0" style={{ width: 6, height: 6, marginTop: 7, borderRadius: "var(--radius-pill)", background: "var(--text-tertiary)" }} />
                <div className="flex-1 min-w-0">
                  <span style={{ fontSize: "var(--text-small)", color: "var(--text-primary)" }}>{verlaufText(v)}</span>
                  <span style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", marginLeft: 6 }}>{v.by} · {v.at}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Kommentarfeld am Ende des Verlaufs. Absende-Schaltfläche liegt im Feld
              (unten rechts) und erscheint erst bei Eingabe; der rechte Innenabstand
              reserviert ihren Platz, damit kein Text verdeckt wird. */}
          <div style={{ position: "relative", marginTop: "var(--space-4)" }}>
            <textarea value={draftComment} onChange={e => onDraftChange(e.target.value)} placeholder="Kommentar schreiben…" rows={2}
              style={{ display: "block", width: "100%", resize: "none", padding: "10px 44px 10px 12px", borderRadius: "var(--radius-card)", border: "var(--border-thin) solid var(--border-default)", background: "var(--bg-elevated)", fontSize: 16, color: "var(--text-primary)", fontFamily: "inherit" }} />
            {draftComment.trim() && (
              <button onClick={onAddComment} aria-label="Kommentar senden"
                className="flex items-center justify-center cursor-pointer transition-colors"
                style={{ position: "absolute", right: 8, bottom: 8, width: 30, height: 30, borderRadius: "var(--radius-pill)", background: "var(--brand-primary)", border: "none" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--brand-primary-dark)"}
                onMouseLeave={e => e.currentTarget.style.background = "var(--brand-primary)"}>
                <Send style={{ width: 14, height: 14, color: "var(--text-on-dark)" }} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── FUSS (fest): Status-Umschalter · Zuständigkeit ── */}
      <div className="shrink-0 flex items-center justify-between" style={{ gap: "var(--space-2)", padding: "12px 16px", borderTop: "var(--border-thin) solid var(--border-default)" }}>
        <div className="inline-flex" style={{ padding: 2, borderRadius: "var(--radius-pill)", background: "var(--bg-secondary)", border: "var(--border-thin) solid var(--border-default)" }}>
          {STATUS_SEGMENTE.map(([val, lbl]) => {
            const aktiv = entry.status === val;
            return (
              <button key={val} type="button" onClick={() => { if (!aktiv) onStatusChange(val); }} className="ui-fokusring cursor-pointer transition-colors"
                style={{ padding: "5px 12px", borderRadius: "var(--radius-pill)", background: aktiv ? "var(--bg-elevated)" : "transparent", border: aktiv ? "var(--border-thin) solid var(--border-default)" : "var(--border-thin) solid transparent", fontSize: "var(--text-small)", fontWeight: aktiv ? "var(--weight-medium)" : "var(--weight-regular)", color: aktiv ? "var(--text-primary)" : "var(--text-secondary)", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                {lbl}
              </button>
            );
          })}
        </div>
        <AuswahlPopover
          personen={DIPL_OPTIONEN}
          selectedId={DIPL_OPTIONEN.find(o => `${o.vorname} ${o.nachname}` === entry.verantwortlich.name)?.id ?? null}
          onSelect={id => { const p = diplZuPerson(id); if (p) onFeld({ feld: "verantwortlich", feldLabel: "Zuständigkeit", patch: { verantwortlich: p }, alt: entry.verantwortlich.name, neu: p.name, typ: "zuweisung" }); }}
          ausloeser={(_offen, toggle, ref) => istNichtZugewiesen(entry) ? (
            <button ref={ref} type="button" onClick={toggle} className="ui-fokusring inline-flex items-center cursor-pointer" style={{ gap: 4, padding: "6px 12px", borderRadius: "var(--radius-pill)", background: "transparent", border: "var(--border-thin) solid var(--border-default)", fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-secondary)", fontFamily: "inherit", whiteSpace: "nowrap" }}>
              <Plus style={{ width: 13, height: 13 }} /> Zuweisen
            </button>
          ) : (
            <button ref={ref} type="button" onClick={toggle} className="ui-fokusring inline-flex items-center cursor-pointer" title="Zuständigkeit ändern"
              style={{ gap: 6, background: "transparent", border: "none", padding: 0, fontFamily: "inherit", ...editierbarCue }}>
              <MiniAvatar person={entry.verantwortlich} size={22} />
              <span style={{ fontSize: "var(--text-small)", color: "var(--text-primary)", whiteSpace: "nowrap" }}>{entry.verantwortlich.name}</span>
              <ChevronDown style={{ width: 11, height: 11, opacity: 0.6, color: "var(--text-tertiary)" }} />
            </button>
          )}
        />
      </div>
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
