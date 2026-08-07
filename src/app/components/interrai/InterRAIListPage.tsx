import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { Search, AlertTriangle, X, ChevronDown, Check } from "lucide-react";
import {
  getAllAssessments, getPerson, getOpenFieldCount, getActiveFieldCount,
  getAnlassLabel, getStatusLabel,
  type PersonZustand, type Person, type NeuAssessment, type AssessmentAnlass,
} from "../../../lib/interrai/store";
import { isoZuAnzeige } from "../../../lib/datum";
import { DataTable, TABELLE_LAYOUT, type SpalteDef } from "../ui/DataTable";

/* ── Bezugsdatum (Mock-Demo): alle Ableitungen laufen gegen diesen Stichtag statt
   gegen new Date(), damit die Liste deterministisch ist. Gleicher Stichtag wie die
   Onboarding-Liste, damit „zuletzt bearbeitet" listenübergreifend dieselbe Gegenwart
   meint. ── */
const BEZUGSDATUM = new Date(2026, 6, 31); // 31.07.2026

/* ── Kennzeichen-Regel: gelb, wenn Status „in Bearbeitung" UND zuletzt bearbeitet vor
   mehr als KENNZEICHEN_STALE_TAGE Tagen (liegengeblieben). Kein Rot. Die Schwelle ist
   ein gesetzter Wert, kein abgeleiteter — hier in einer Zeile änderbar. Der Grund ist
   zusätzlich als Klartext in der Spalte „Zuletzt bearbeitet" sichtbar (Form + Farbe,
   nie Farbe allein). ── */
const KENNZEICHEN_STALE_TAGE = 7;

function tageSeit(iso: string, bezug: Date): number {
  const ms = bezug.getTime() - new Date(iso).getTime();
  return Math.floor(ms / 86_400_000);
}
/** Reine Ableitung: Assessment + Bezugsdatum → Kennzeichen (liegengeblieben ja/nein + Tage). */
function ableitenKennzeichen(a: EnrichedAssessment, bezug: Date): { stale: boolean; tage: number } {
  const tage = tageSeit(a.zuletztBearbeitetAm, bezug);
  return { stale: a.status === "in_bearbeitung" && tage > KENNZEICHEN_STALE_TAGE, tage };
}

/* ── Zustand-Pille (fachliche Kategorie, nicht Abweichung — Text trägt die Bedeutung,
   Farbe bleibt zurückhaltend). ── */
const ZUSTAND_PILL: Record<PersonZustand, { label: string; bg: string; color: string }> = {
  mandat: { label: "Mandat", bg: "var(--status-warning-bg)", color: "var(--status-warning-text)" },
  patient: { label: "Patient", bg: "var(--status-success-bg)", color: "var(--status-success-text)" },
};

/* Assessment angereichert um Person + Feldzahlen (Basis für Liste und Ableitungen). */
type EnrichedAssessment = NeuAssessment & {
  person: Person | undefined;
  openFields: number;
  activeFields: number;
};

const personName = (a: EnrichedAssessment) => a.person ? `${a.person.vorname} ${a.person.nachname}` : "(unbekannt)";
const sortName = (a: EnrichedAssessment) => a.person ? `${a.person.nachname} ${a.person.vorname}` : "";

/* ── Status-Chips: kombinierbar, mit UND verknüpft. Status und Zustand sind je für sich
   ausschliessend; sinnvoll kombiniert wird über die Gruppen hinweg (z. B. „In Bearbeitung"
   + „Patient"). Jedes Prädikat ist rein. ── */
type StatusChipId = "in_bearbeitung" | "abgeschlossen" | "mandat" | "patient";
const STATUS_CHIPS: { id: StatusChipId; label: string; praedikat: (a: EnrichedAssessment) => boolean }[] = [
  { id: "in_bearbeitung", label: "In Bearbeitung", praedikat: a => a.status === "in_bearbeitung" },
  { id: "abgeschlossen", label: "Abgeschlossen", praedikat: a => a.status === "abgeschlossen" },
  { id: "mandat", label: "Mandat", praedikat: a => a.person?.zustand === "mandat" },
  { id: "patient", label: "Patient", praedikat: a => a.person?.zustand === "patient" },
];

/* ── Filterzustand: eine Struktur an einem Ort. Kein Segment (keine Verantwortlichen im
   Modell — Meine/Alle wäre nicht ableitbar). ── */
interface FilterZustand {
  statusChips: Set<StatusChipId>;
  anlaesse: Set<string>;
  suche: string;
}
const LEERER_FILTER: FilterZustand = { statusChips: new Set(), anlaesse: new Set(), suche: "" };

/** Reine Ableitung: Assessments + Filterzustand → gefilterte Assessments. */
function filterAssessments(list: EnrichedAssessment[], f: FilterZustand): EnrichedAssessment[] {
  return list.filter(a => {
    for (const chip of STATUS_CHIPS) if (f.statusChips.has(chip.id) && !chip.praedikat(a)) return false;
    if (f.anlaesse.size > 0 && !f.anlaesse.has(a.anlass)) return false;
    const q = f.suche.trim().toLowerCase();
    if (q && !(personName(a).toLowerCase().includes(q) || getAnlassLabel(a.anlass).toLowerCase().includes(q) || a.id.toLowerCase().includes(q))) return false;
    return true;
  });
}

/* ── Sortierung: jede Spalte; Kennzeichen nach Rangfolge, „zuletzt" chronologisch,
   „offen" numerisch, sonst alphabetisch. Leerwerte immer ans Ende. Standard: zuletzt
   bearbeitet, neueste zuerst. ── */
type SortKey = "kennzeichen" | "person" | "anlass" | "status" | "offen" | "zuletzt";
const SORT_LABEL: Record<SortKey, string> = { kennzeichen: "Kennzeichen", person: "Person", anlass: "Anlass", status: "Status", offen: "offenen Feldern", zuletzt: "zuletzt bearbeitet" };

function leerZuletzt(la: boolean, lb: boolean, f: number, cmp: () => number): number {
  if (la && lb) return 0;
  if (la) return 1;
  if (lb) return -1;
  return f * cmp();
}
function sortAssessments(list: EnrichedAssessment[], key: SortKey, dir: "asc" | "desc"): EnrichedAssessment[] {
  const f = dir === "asc" ? 1 : -1;
  const staleRang = (a: EnrichedAssessment) => ableitenKennzeichen(a, BEZUGSDATUM).stale ? 0 : 1;
  return [...list].sort((a, b) => {
    switch (key) {
      case "kennzeichen": return f * (staleRang(a) - staleRang(b)) || b.zuletztBearbeitetAm.localeCompare(a.zuletztBearbeitetAm);
      case "person": return leerZuletzt(!a.person, !b.person, f, () => sortName(a).localeCompare(sortName(b), "de"));
      case "anlass": return f * (getAnlassLabel(a.anlass).localeCompare(getAnlassLabel(b.anlass), "de") || a.zuletztBearbeitetAm.localeCompare(b.zuletztBearbeitetAm));
      case "status": return f * (a.status.localeCompare(b.status) || a.zuletztBearbeitetAm.localeCompare(b.zuletztBearbeitetAm));
      case "offen": return f * ((a.openFields - b.openFields) || a.zuletztBearbeitetAm.localeCompare(b.zuletztBearbeitetAm));
      case "zuletzt": default: return f * a.zuletztBearbeitetAm.localeCompare(b.zuletztBearbeitetAm);
    }
  });
}

/* ── Mehrfachauswahl-Dropdown (lokal; kein neues Shared-/shadcn-Bauteil).
   Verwaltet nur Auf/Zu + Aussenklick; die Auswahl liegt im Filterzustand. ── */
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
        <div className="absolute z-50" style={{ top: "calc(100% + 6px)", left: 0, minWidth: 200, padding: 6, background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-overlay)" }}>
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

export function InterRAIListPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterZustand>(LEERER_FILTER);
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "zuletzt", dir: "desc" });
  const toggleSort = (key: SortKey) => setSort(s => s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" });

  /* ── Filter-Setter: immer neue Sets, damit die Ableitung rein bleibt ── */
  const setSuche = (suche: string) => setFilter(f => ({ ...f, suche }));
  const toggleChip = (id: StatusChipId) => setFilter(f => { const s = new Set(f.statusChips); if (s.has(id)) s.delete(id); else s.add(id); return { ...f, statusChips: s }; });
  const toggleAnlass = (a: string) => setFilter(f => { const s = new Set(f.anlaesse); if (s.has(a)) s.delete(a); else s.add(a); return { ...f, anlaesse: s }; });
  const resetFilter = () => setFilter(f => ({ ...LEERER_FILTER, suche: f.suche }));

  /* ── Ableitungen ── */
  const enriched = useMemo<EnrichedAssessment[]>(() => getAllAssessments().map(a => ({
    ...a,
    person: getPerson(a.personId),
    openFields: getOpenFieldCount(a),
    activeFields: getActiveFieldCount(a),
  })), []);

  const anlassOptionen = useMemo(() => {
    const set = new Set<AssessmentAnlass>(enriched.map(a => a.anlass));
    return [...set].map(a => ({ value: a, label: getAnlassLabel(a) })).sort((x, y) => x.label.localeCompare(y.label, "de"));
  }, [enriched]);

  const chipCounts = useMemo(() => {
    const r = {} as Record<StatusChipId, number>;
    for (const chip of STATUS_CHIPS) r[chip.id] = enriched.filter(chip.praedikat).length;
    return r;
  }, [enriched]);

  const filtered = useMemo(() => filterAssessments(enriched, filter), [enriched, filter]);
  const sorted = useMemo(() => sortAssessments(filtered, sort.key, sort.dir), [filtered, sort]);

  const filterTags = useMemo(() => {
    const t: { key: string; label: string; entfernen: () => void }[] = [];
    STATUS_CHIPS.forEach(chip => { if (filter.statusChips.has(chip.id)) t.push({ key: `s-${chip.id}`, label: chip.label, entfernen: () => toggleChip(chip.id) }); });
    filter.anlaesse.forEach(a => t.push({ key: `a-${a}`, label: `Anlass: ${getAnlassLabel(a as AssessmentAnlass)}`, entfernen: () => toggleAnlass(a) }));
    return t;
  }, [filter]);

  /* ── Spaltenbeschreibung für die geteilte DataTable ── */
  const kennzeichenIcon = (a: EnrichedAssessment) => {
    const k = ableitenKennzeichen(a, BEZUGSDATUM);
    if (!k.stale) return null;
    return <AlertTriangle role="img" aria-label={`Liegengeblieben — seit ${k.tage} Tagen nicht bearbeitet`} style={{ width: 15, height: 15, flexShrink: 0, color: "var(--status-warning)", fill: "none" }} />;
  };

  const zeilenHintergrund = (a: EnrichedAssessment): string | undefined =>
    ableitenKennzeichen(a, BEZUGSDATUM).stale ? "color-mix(in srgb, var(--status-warning-bg), transparent 68%)" : undefined;

  const zustandPille = (a: EnrichedAssessment) => {
    const z = a.person ? ZUSTAND_PILL[a.person.zustand] : null;
    if (!z) return null;
    return <span style={{ padding: "1px 8px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", background: z.bg, color: z.color, whiteSpace: "nowrap" }}>{z.label}</span>;
  };

  const karteTitel = (a: EnrichedAssessment) => (
    <>
      <span style={{ fontSize: "0.9375rem", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", overflowWrap: "anywhere" }}>{personName(a)}</span>
      {kennzeichenIcon(a)}
    </>
  );

  const spalten: SpalteDef<EnrichedAssessment>[] = [
    { id: "kennzeichen", label: "", festBreitePx: 28, align: "center", sortierbar: true, ausKarte: true, render: kennzeichenIcon },
    { id: "person", label: "Person", anteil: 26, minCh: 22, align: "left", sortierbar: true, ausKarte: true,
      render: a => (
        <span className="inline-flex items-center" style={{ gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.8125rem", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", overflowWrap: "anywhere" }}>{personName(a)}</span>
          {zustandPille(a)}
        </span>
      ) },
    { id: "anlass", label: "Anlass", anteil: 20, minCh: 18, align: "left", sortierbar: true,
      render: a => <span style={{ fontSize: "0.8125rem", color: "var(--text-primary)", overflowWrap: "anywhere" }}>{getAnlassLabel(a.anlass)}</span> },
    { id: "status", label: "Status", anteil: 12, minCh: 13, align: "left", sortierbar: true,
      // Farbe nur für die Abweichung (Kennzeichen). Status selbst zurückhaltend: „In
      // Bearbeitung" neutral (Arbeitsnorm), „Abgeschlossen" als positiver Abschluss.
      render: a => { const done = a.status === "abgeschlossen"; return (
        <span style={{ padding: "2px 10px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", whiteSpace: "nowrap", background: done ? "var(--status-success-bg)" : "var(--bg-secondary)", color: done ? "var(--status-success-text)" : "var(--text-secondary)" }}>{getStatusLabel(a.status)}</span>
      ); } },
    { id: "offen", label: "Offen", anteil: 8, minCh: 10, align: "right", sortierbar: true,
      render: a => a.status === "abgeschlossen"
        ? <span style={{ fontFamily: "monospace", fontSize: "0.8125rem", color: "var(--text-tertiary)" }}>–</span>
        : <span style={{ whiteSpace: "nowrap" }}><span style={{ fontFamily: "monospace", fontVariantNumeric: "tabular-nums", fontSize: "0.8125rem", color: a.openFields === 0 ? "var(--status-success-text)" : "var(--text-primary)", fontWeight: a.openFields === 0 ? "var(--weight-medium)" : "var(--weight-regular)" }}>{a.openFields}</span><span style={{ marginLeft: 4, fontSize: "0.75rem", color: "var(--text-tertiary)" }}>offen</span></span> },
    { id: "zuletzt", label: "Zuletzt bearbeitet", anteil: 22, minCh: 20, align: "left", sortierbar: true,
      // Grund des Kennzeichens zusätzlich als Klartext (Form + Farbe, nie Farbe allein).
      render: a => { const k = ableitenKennzeichen(a, BEZUGSDATUM); return (
        <span style={{ fontSize: "0.8125rem", color: "var(--text-primary)", whiteSpace: "nowrap" }}>
          {isoZuAnzeige(a.zuletztBearbeitetAm.slice(0, 10))}
          {k.stale && <span style={{ marginLeft: 8, color: "var(--status-warning-text)", fontWeight: 500, fontSize: "0.75rem" }}>· liegengeblieben ({k.tage} T.)</span>}
        </span>
      ); } },
  ];

  const inhaltRahmen = { maxWidth: TABELLE_LAYOUT.inhaltMaxPx, margin: "0 auto", width: "100%" } as const;
  const leerInsgesamt = enriched.length === 0;
  const keineTreffer = sorted.length === 0;
  const suchButton = { background: "transparent", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-pill)", padding: "5px 12px", fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", color: "var(--text-secondary)", fontFamily: "inherit", cursor: "pointer" } as const;

  return (
    <div className="flex flex-col h-full min-h-0">
      <style>{`
        .ir-list-pad { padding-left: var(--mobile-page-padding); padding-right: var(--mobile-page-padding); }
        @media (min-width: 640px) { .ir-list-pad { padding-left: var(--space-6); padding-right: var(--space-6); } }
      `}</style>

      {/* ═══ KOPF — teilt Maximalbreite und Kanten mit der Tabelle ═══ */}
      <div className="shrink-0 ir-list-pad" style={{ paddingTop: "var(--space-4)" }}>
        <div style={inhaltRahmen}>
          <div className="flex items-center justify-between" style={{ marginBottom: "var(--space-3)" }}>
            <h1 style={{ fontSize: "var(--text-h1)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", letterSpacing: "var(--tracking-tight)" }}>InterRAI</h1>
          </div>

          {leerInsgesamt ? (
            <p style={{ fontSize: "var(--text-body)", color: "var(--text-secondary)", maxWidth: 560 }}>
              Sobald eine Bedarfsabklärung angelegt ist, erscheint sie hier mit Person, Anlass, Status und Bearbeitungsstand.
            </p>
          ) : (
            <>
              {/* Steuerleiste: Suche + Auswahlfeld */}
              <div className="flex items-center flex-wrap" style={{ gap: 8, marginBottom: "var(--space-2)" }}>
                <div className="flex items-center" style={{ flex: "1 1 220px", maxWidth: 300, gap: "var(--space-2)", padding: "7px 14px", borderRadius: "var(--radius-pill)", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)" }}>
                  <Search style={{ width: 14, height: 14, color: "var(--text-tertiary)", flexShrink: 0 }} />
                  <input value={filter.suche} onChange={e => setSuche(e.target.value)} placeholder="Assessments suchen…" className="flex-1 bg-transparent outline-none" style={{ fontSize: "var(--text-small)", color: "var(--text-primary)", minWidth: 0 }} />
                  {filter.suche && <button onClick={() => setSuche("")} className="cursor-pointer shrink-0" style={{ background: "transparent", border: "none" }}><X style={{ width: 12, height: 12, color: "var(--text-secondary)" }} /></button>}
                </div>
                {anlassOptionen.length > 1 && (
                  <AuswahlDropdown label="Anlass" optionen={anlassOptionen} ausgewaehlt={filter.anlaesse} onToggle={toggleAnlass} />
                )}
              </div>

              {/* Status-Chips — kombinierbar (UND), Zahl aus denselben Daten wie die Tabelle */}
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

              {/* Aktivzeile — immer sichtbar */}
              <div className="flex items-center flex-wrap" style={{ gap: 6, minHeight: 24, marginBottom: "var(--space-2)" }}>
                {filterTags.length === 0 ? (
                  <span style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>
                    Alle Assessments · sortiert nach {SORT_LABEL[sort.key]}
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
            </>
          )}
        </div>
      </div>

      {/* ═══ TABELLE / Zustände ═══ */}
      {!leerInsgesamt && (
        <div className="flex-1 overflow-y-auto ir-list-pad" style={{ paddingTop: 0, paddingBottom: "var(--space-4)" }}>
          {keineTreffer ? (
            <div style={inhaltRahmen}>
              <div style={{ background: "var(--bg-elevated)", borderRadius: "var(--radius-card)", border: "var(--border-thin) solid var(--border-default)", padding: "3rem 1.5rem", textAlign: "center" }}>
                <p style={{ fontSize: "var(--text-body)", color: "var(--text-secondary)", marginBottom: 14 }}>
                  {filter.suche.trim() ? <>Keine Assessments für „{filter.suche.trim()}“.</> : "Keine Assessments mit diesen Filtern."}
                </p>
                <div className="inline-flex items-center flex-wrap justify-center" style={{ gap: 8 }}>
                  {filter.suche.trim() && <button type="button" onClick={() => setSuche("")} style={suchButton}>Suche löschen</button>}
                  {filterTags.length > 0 && <button type="button" onClick={resetFilter} style={suchButton}>Filter zurücksetzen</button>}
                </div>
              </div>
            </div>
          ) : (
            <DataTable<EnrichedAssessment>
              spalten={spalten}
              zeilen={sorted}
              zeilenKey={a => a.id}
              onZeileKlick={a => navigate(`/interrai-neu/${a.id}?returnTo=${encodeURIComponent("/interrai")}`)}
              zeilenHintergrund={zeilenHintergrund}
              sort={sort}
              onSort={k => toggleSort(k as SortKey)}
              karteTitel={karteTitel}
              fusszeile={<><span>{filtered.length} von {enriched.length} {enriched.length === 1 ? "Assessment" : "Assessments"}</span><span>Stand: {isoZuAnzeige("2026-07-31")}</span></>}
              leerText="Keine Assessments mit diesen Filtern."
            />
          )}
        </div>
      )}
    </div>
  );
}
