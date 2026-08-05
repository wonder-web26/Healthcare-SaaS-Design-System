import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { Search, Plus, X, ChevronDown, Check, AlertTriangle, AlertCircle, ExternalLink } from "lucide-react";
import { type Angehoeriger, type Qualifikation } from "./angehoerigeData";
import { useAngehoerige, srkZertifikatFehlt } from "../../lib/angehoerige/store";
import { isoZuAnzeige } from "../../lib/datum";
import { DataTable, TABELLE_LAYOUT, type SpalteDef } from "./ui/DataTable";

/* ── Bezugsdatum (Mock-Demo): Ableitungen laufen gegen diesen Stichtag; der
   Monatsschritt trägt seine Überfälligkeit als vorberechnetes Feld. ── */
const BEZUGSDATUM = new Date(2026, 2, 3); // 03.03.2026

/* ── Zugehörigkeit (Segmentumschalter): "Meine" = angemeldete Benutzerin. ── */
type Segment = "alle" | "meine";
const MEINE_PFK = "Sandra Weber";

/* ── Status-Chips: kombinierbar (UND). Reine Prädikate, dieselben Ableitungen
   wie die Tabelle/Kennzeichen. ── */
type StatusChipId = "srk_offen" | "schritt_ueberfaellig" | "in_onboarding" | "nicht_zugewiesen";
function nichtZugewiesen(a: Angehoeriger): boolean { return !a.pflegefachkraft || a.pflegefachkraft.trim() === "" || a.pflegefachkraft === "—"; }
const STATUS_CHIPS: { id: StatusChipId; label: string; praedikat: (a: Angehoeriger) => boolean }[] = [
  { id: "srk_offen", label: "SRK-Zertifikat fehlt", praedikat: srkZertifikatFehlt },
  { id: "schritt_ueberfaellig", label: "Monatsschritt überfällig", praedikat: a => a.monatsSchritt.ueberfaellig === true },
  { id: "in_onboarding", label: "Im Onboarding", praedikat: a => a.status === "in_onboarding" },
  { id: "nicht_zugewiesen", label: "Nicht zugewiesen", praedikat: nichtZugewiesen },
];

/* ── Auswahlfelder (Mehrfachauswahl) ── */
const QUAL_LABEL: Record<Qualifikation, string> = { ohne_srk: "ohne SRK", srk: "SRK", fage_dipl: "FaGe / Dipl" };
const QUAL_OPTIONEN: Qualifikation[] = ["ohne_srk", "srk", "fage_dipl"];

/* ── Kennzeichen: Rot (Monatsschritt überfällig) schlägt Gelb (kein SRK-Kurs
   oder nicht zugewiesen). Grund als Klartext (a11y + sichtbar in der Fachspalte). ── */
type KennzeichenTyp = "rot" | "gelb" | null;
function ableitenKennzeichen(a: Angehoeriger): { typ: KennzeichenTyp; grund: string } {
  if (a.monatsSchritt.ueberfaellig === true) return { typ: "rot", grund: "Monatsschritt überfällig" };
  if (srkZertifikatFehlt(a)) return { typ: "gelb", grund: "SRK-Zertifikat fehlt" };
  if (nichtZugewiesen(a)) return { typ: "gelb", grund: "Keine Pflegefachkraft zugewiesen" };
  return { typ: null, grund: "" };
}

/* ── Filterzustand: eine Struktur an einem Ort ── */
interface FilterZustand {
  segment: Segment;
  statusChips: Set<StatusChipId>;
  qualifikationen: Set<Qualifikation>;
  pflegefachkraefte: Set<string>;
  suche: string;
}
const LEERER_FILTER: FilterZustand = { segment: "alle", statusChips: new Set(), qualifikationen: new Set(), pflegefachkraefte: new Set(), suche: "" };

function imSegment(a: Angehoeriger, segment: Segment): boolean {
  return segment === "alle" || a.pflegefachkraft === MEINE_PFK;
}

/** Reine Ableitung: Angehörige + Filterzustand + Bezugsdatum → gefiltert. */
function filterAngehoerige(list: Angehoeriger[], f: FilterZustand, _bezug: Date): Angehoeriger[] {
  return list.filter(a => {
    if (!imSegment(a, f.segment)) return false;
    for (const chip of STATUS_CHIPS) if (f.statusChips.has(chip.id) && !chip.praedikat(a)) return false;
    if (f.qualifikationen.size > 0 && !f.qualifikationen.has(a.qualifikation)) return false;
    if (f.pflegefachkraefte.size > 0 && !f.pflegefachkraefte.has(a.pflegefachkraft)) return false;
    const q = f.suche.trim().toLowerCase();
    if (q && !(`${a.vorname} ${a.nachname}`.toLowerCase().includes(q) || a.zugeordnetePatientenList.some(p => p.name.toLowerCase().includes(q)))) return false;
    return true;
  });
}

/* ── Sortierung (über die Komponente, ohne Vorsortierung) ── */
type SortKey = "name" | "qualifikation" | "pflegefachkraft" | "monatsschritt" | "mutation";
const SORT_LABEL: Record<SortKey, string> = { name: "Name", qualifikation: "Qualifikation", pflegefachkraft: "Pflegefachkraft", monatsschritt: "Monatsschritt", mutation: "letzter Mutation" };
const QUAL_RANK: Record<string, number> = { ohne_srk: 0, srk: 1, fage_dipl: 2 };
function msProgress(a: Angehoeriger): number { const ms = a.monatsSchritt; return ms.abgeschlossen ? 1 : ms.total ? (ms.aktuell - 1) / ms.total : 0; }
function mutKey(d: string): string { const [dd, mm, yy] = d.split("."); return `${yy ?? ""}${mm ?? ""}${dd ?? ""}`; }
function sortAngehoerige(list: Angehoeriger[], key: SortKey, dir: "asc" | "desc"): Angehoeriger[] {
  const f = dir === "asc" ? 1 : -1;
  return [...list].sort((a, b) => {
    switch (key) {
      case "name": return f * (a.nachname.localeCompare(b.nachname, "de") || a.vorname.localeCompare(b.vorname, "de"));
      case "qualifikation": return f * ((QUAL_RANK[a.qualifikation] ?? 0) - (QUAL_RANK[b.qualifikation] ?? 0));
      case "pflegefachkraft": return f * a.pflegefachkraft.localeCompare(b.pflegefachkraft, "de");
      case "monatsschritt": return f * (msProgress(a) - msProgress(b));
      case "mutation": return f * mutKey(a.letzteMutationDatum).localeCompare(mutKey(b.letzteMutationDatum));
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

/* ══════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════ */
export function AngehoerigePage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterZustand>(LEERER_FILTER);
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" } | null>(null);
  const toggleSort = (key: string) => setSort(s => s?.key === key ? { key: key as SortKey, dir: s.dir === "asc" ? "desc" : "asc" } : { key: key as SortKey, dir: "asc" });

  const setSegment = (segment: Segment) => setFilter(f => ({ ...f, segment }));
  const setSuche = (suche: string) => setFilter(f => ({ ...f, suche }));
  const toggleChip = (id: StatusChipId) => setFilter(f => { const s = new Set(f.statusChips); if (s.has(id)) s.delete(id); else s.add(id); return { ...f, statusChips: s }; });
  const toggleQual = (q: Qualifikation) => setFilter(f => { const s = new Set(f.qualifikationen); if (s.has(q)) s.delete(q); else s.add(q); return { ...f, qualifikationen: s }; });
  const togglePfk = (pf: string) => setFilter(f => { const s = new Set(f.pflegefachkraefte); if (s.has(pf)) s.delete(pf); else s.add(pf); return { ...f, pflegefachkraefte: s }; });
  const resetFilter = () => setFilter(f => ({ ...LEERER_FILTER, suche: f.suche }));

  const angehoerige = useAngehoerige();
  const allePflegefachkraefte = useMemo(() => [...new Set(angehoerige.map(a => a.pflegefachkraft))].sort(), [angehoerige]);
  const segmentBasis = useMemo(() => angehoerige.filter(a => imSegment(a, filter.segment)), [filter.segment, angehoerige]);
  const chipCounts = useMemo(() => {
    const r = {} as Record<StatusChipId, number>;
    for (const chip of STATUS_CHIPS) r[chip.id] = segmentBasis.filter(chip.praedikat).length;
    return r;
  }, [segmentBasis]);
  const filtered = useMemo(() => filterAngehoerige(angehoerige, filter, BEZUGSDATUM), [filter, angehoerige]);
  const sorted = useMemo(() => sort ? sortAngehoerige(filtered, sort.key, sort.dir) : filtered, [filtered, sort]);

  const filterTags = useMemo(() => {
    const t: { key: string; label: string; entfernen: () => void }[] = [];
    STATUS_CHIPS.forEach(chip => { if (filter.statusChips.has(chip.id)) t.push({ key: `s-${chip.id}`, label: chip.label, entfernen: () => toggleChip(chip.id) }); });
    filter.qualifikationen.forEach(q => t.push({ key: `q-${q}`, label: `Qualifikation: ${QUAL_LABEL[q]}`, entfernen: () => toggleQual(q) }));
    filter.pflegefachkraefte.forEach(pf => t.push({ key: `p-${pf}`, label: `Pflegefachkraft: ${pf}`, entfernen: () => togglePfk(pf) }));
    return t;
  }, [filter]);

  /* ── Kennzeichen + Zeilentönung (Rot kräftiger als Gelb) ── */
  const kennzeichenIcon = (a: Angehoeriger) => {
    const k = ableitenKennzeichen(a);
    if (!k.typ) return null;
    return <AlertTriangle role="img" aria-label={k.grund} style={{ width: 15, height: 15, flexShrink: 0, color: k.typ === "rot" ? "var(--status-danger)" : "var(--status-warning)", fill: k.typ === "rot" ? "var(--status-danger)" : "none" }} />;
  };
  const zeilenHintergrund = (a: Angehoeriger): string | undefined => {
    const t = ableitenKennzeichen(a).typ;
    return t === "rot" ? "color-mix(in srgb, var(--status-danger-bg), transparent 40%)"
      : t === "gelb" ? "color-mix(in srgb, var(--status-warning-bg), transparent 68%)"
      : undefined;
  };

  const inhaltRahmen = { maxWidth: TABELLE_LAYOUT.inhaltMaxPx, margin: "0 auto", width: "100%" } as const;

  const nameZelle = (a: Angehoeriger) => (
    <span style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", overflowWrap: "anywhere" }}>{a.nachname}, {a.vorname}</span>
  );

  /* ── Spalten: Kennzeichen (fest) + die unveränderten 7 Fachspalten. Farbe nur
     für Abweichungen; Normalzustand stiller Text; keine Avatare. ── */
  const angehoerigeSpalten: SpalteDef<Angehoeriger>[] = [
    { id: "kennzeichen", label: "", festBreitePx: 28, align: "center", ausKarte: true, render: kennzeichenIcon },
    { id: "name", label: "Name", anteil: 16, minCh: 24, align: "left", sortierbar: true, ausKarte: true, render: nameZelle },
    { id: "patienten", label: "Zugeordnete Patienten", anteil: 18, minCh: 24, align: "left", zweitzeileUnter: "name",
      // Einzeilig: erster Name ausgeschrieben (verlinkt), weitere als "+N".
      // Die vollständige Liste steht in der Detailansicht.
      render: a => a.zugeordnetePatientenList.length === 0 ? (
        <span style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)", fontStyle: "italic" }}>Keine Zuordnung</span>
      ) : (
        <span className="inline-flex items-center" style={{ gap: 6 }}>
          <button onClick={e => { e.stopPropagation(); navigate(`/patienten/${a.zugeordnetePatientenList[0].id}`); }} className="ui-fokusring inline-flex items-center cursor-pointer" style={{ gap: 4, fontSize: "var(--text-small)", color: "var(--brand-primary)", background: "transparent", border: "none", textAlign: "left", padding: 0, fontFamily: "inherit", overflowWrap: "anywhere" }}>
            <ExternalLink style={{ width: 10, height: 10, opacity: 0.5, flexShrink: 0 }} />{a.zugeordnetePatientenList[0].name}
          </button>
          {a.zugeordnetePatientenList.length > 1 && <span style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", flexShrink: 0 }}>+{a.zugeordnetePatientenList.length - 1}</span>}
        </span>
      ) },
    { id: "pflegefachkraft", label: "Pflegefachkraft", anteil: 12, minCh: 16, align: "left", sortierbar: true,
      render: a => nichtZugewiesen(a) ? (
        <button type="button" onClick={e => { e.stopPropagation(); }} className="ui-fokusring inline-flex items-center cursor-pointer" style={{ gap: 4, padding: "3px 10px", borderRadius: "var(--radius-pill)", background: "transparent", border: "var(--border-thin) solid var(--border-default)", fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", color: "var(--text-secondary)", fontFamily: "inherit" }}>
          <Plus style={{ width: 12, height: 12 }} /> Zuweisen
        </button>
      ) : (
        <div className="flex items-center" style={{ gap: 6 }}>
          <span className="shrink-0 flex items-center justify-center" style={{ width: 20, height: 20, borderRadius: "var(--radius-pill)", background: "var(--bg-secondary)" }}>
            <span style={{ fontSize: 8, fontWeight: "var(--weight-semibold)", color: "var(--text-secondary)" }}>{a.pflegefachkraftInitialen}</span>
          </span>
          <span style={{ fontSize: "var(--text-small)", color: "var(--text-primary)", whiteSpace: "nowrap" }}>{a.pflegefachkraft}</span>
        </div>
      ) },
    { id: "qualifikation", label: "Qualifikation", anteil: 9, minCh: 12, align: "left", sortierbar: true,
      // Nur die Abweichung "ohne SRK" ist getönt; SRK / FaGe·Dipl sind stiller Text.
      render: a => a.qualifikation === "ohne_srk"
        ? <span style={{ padding: "2px 8px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", background: "var(--status-warning-bg)", color: "var(--status-warning-text)", whiteSpace: "nowrap" }}>ohne SRK</span>
        : <span style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{QUAL_LABEL[a.qualifikation]}</span> },
    { id: "srk", label: "SRK Kurs", anteil: 11, minCh: 13, align: "left",
      // Entscheid 2 des Katalogs: kein Kursdatum mehr, nur noch ob das
      // Zertifikat vorliegt. Der Nachweis ist das Dokument srk_zertifikat.
      render: a => a.srkZertifikatVorhanden === "ja" ? (
        <span style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>Vorhanden</span>
      ) : (
        <span className="inline-flex items-center" style={{ gap: 4, fontSize: "var(--text-meta)", color: "var(--status-warning-text)", fontWeight: "var(--weight-medium)", whiteSpace: "nowrap" }}>
          <AlertCircle style={{ width: 14, height: 14 }} /> Ausstehend
        </span>
      ) },
    { id: "monatsschritt", label: "Monatsschritt", anteil: 20, minCh: 20, align: "left", sortierbar: true,
      // Balken entfällt (aus "aktuell/total" ableitbar). Farbe nur bei Überfälligkeit.
      render: a => {
        const ms = a.monatsSchritt;
        const rot = ms.ueberfaellig === true;
        return (
          <div>
            <div className="flex items-center" style={{ gap: 8 }}>
              <span style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: rot ? "var(--status-danger)" : "var(--text-primary)", overflowWrap: "anywhere" }}>{ms.label}</span>
              <span style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", fontWeight: "var(--weight-medium)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{ms.abgeschlossen ? ms.total : ms.aktuell}/{ms.total}</span>
            </div>
            {ms.faellig && !ms.abgeschlossen && (
              <div style={{ fontSize: "var(--text-micro)", marginTop: 2, color: rot ? "var(--status-danger)" : "var(--text-tertiary)" }}>
                {rot ? "Überfällig" : `Fällig ${ms.faellig}`}
              </div>
            )}
          </div>
        );
      } },
    { id: "mutation", label: "Letzte Mutation", anteil: 14, minCh: 14, align: "left", sortierbar: true, ausblendenUnter: "eng",
      render: a => (
        <div style={{ whiteSpace: "nowrap" }}>
          <div style={{ fontSize: "var(--text-small)", color: "var(--text-primary)" }}>{a.letzteMutationDatum}</div>
          <div style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>{a.letzteMutationUser}</div>
        </div>
      ) },
  ];

  const leerKeineAngehoerige = angehoerige.length === 0;
  const keineTreffer = sorted.length === 0;
  const suchButton = { background: "transparent", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-pill)", padding: "5px 12px", fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", color: "var(--text-secondary)", fontFamily: "inherit", cursor: "pointer" } as const;

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0" style={{ padding: "var(--space-4) var(--space-6) 0" }}>
        <div style={inhaltRahmen}>
          {/* 1) Titel + Primäraktion */}
          <div className="flex items-center justify-between" style={{ marginBottom: "var(--space-3)" }}>
            <h1 style={{ fontSize: "var(--text-h1)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", letterSpacing: "var(--tracking-tight)" }}>Angehörige</h1>
            <button onClick={() => navigate("/onboarding/neu")} className="inline-flex items-center shrink-0 cursor-pointer transition-colors"
              style={{ gap: "var(--space-2)", padding: "10px 22px", borderRadius: "var(--radius-pill)", background: "var(--brand-primary)", color: "var(--text-on-dark)", fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", border: "none" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--brand-primary-dark)"} onMouseLeave={e => e.currentTarget.style.background = "var(--brand-primary)"}>
              <Plus style={{ width: 16, height: 16 }} /> <span className="hidden sm:inline">Neuen Angehörigen anlegen</span>
            </button>
          </div>

          {leerKeineAngehoerige ? (
            <p style={{ fontSize: "var(--text-body)", color: "var(--text-secondary)", maxWidth: 560 }}>
              Sobald ein Angehöriger angelegt ist, erscheint er hier mit Qualifikation, SRK-Status und Monatsschritt.
            </p>
          ) : (
            <>
              {/* 2) Steuerleiste: Suche, Zugehörigkeit, Auswahlfelder */}
              <div className="flex items-center flex-wrap" style={{ gap: 8, marginBottom: "var(--space-2)" }}>
                <div className="flex items-center" style={{ flex: "1 1 220px", maxWidth: 300, gap: "var(--space-2)", padding: "7px 14px", borderRadius: 8, background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)" }}>
                  <Search style={{ width: 14, height: 14, color: "var(--text-tertiary)", flexShrink: 0 }} />
                  <input value={filter.suche} onChange={e => setSuche(e.target.value)} placeholder="Angehörige suchen…" className="flex-1 bg-transparent outline-none" style={{ fontSize: "var(--text-small)", color: "var(--text-primary)", minWidth: 0 }} />
                  {filter.suche && <button onClick={() => setSuche("")} className="cursor-pointer shrink-0" style={{ background: "transparent", border: "none" }}><X style={{ width: 12, height: 12, color: "var(--text-secondary)" }} /></button>}
                </div>

                <div className="inline-flex shrink-0" style={{ padding: 2, borderRadius: "var(--radius-pill)", background: "var(--bg-secondary)", border: "var(--border-thin) solid var(--border-default)" }}>
                  {([["meine", "Meine"], ["alle", "Alle"]] as [Segment, string][]).map(([seg, lbl]) => {
                    const aktiv = filter.segment === seg;
                    return (
                      <button key={seg} type="button" onClick={() => setSegment(seg)} className="ui-fokusring cursor-pointer transition-colors"
                        style={{ padding: "5px 16px", borderRadius: "var(--radius-pill)", background: aktiv ? "var(--bg-elevated)" : "transparent", border: aktiv ? "var(--border-thin) solid var(--border-default)" : "var(--border-thin) solid transparent", fontSize: "var(--text-small)", fontWeight: aktiv ? "var(--weight-medium)" : "var(--weight-regular)", color: aktiv ? "var(--text-primary)" : "var(--text-secondary)", fontFamily: "inherit" }}>
                        {lbl}
                      </button>
                    );
                  })}
                </div>

                <AuswahlDropdown label="Qualifikation" optionen={QUAL_OPTIONEN.map(q => ({ value: q as string, label: QUAL_LABEL[q] }))} ausgewaehlt={filter.qualifikationen as Set<string>} onToggle={v => toggleQual(v as Qualifikation)} />
                <AuswahlDropdown label="Pflegefachkraft" optionen={allePflegefachkraefte.map(pf => ({ value: pf, label: pf }))} ausgewaehlt={filter.pflegefachkraefte} onToggle={togglePfk} />
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

              {/* 3) Aktivzeile */}
              <div className="flex items-center flex-wrap" style={{ gap: 6, minHeight: 24, marginBottom: "var(--space-2)" }}>
                {filterTags.length === 0 ? (
                  <span style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>
                    {filter.segment === "meine" ? "Meine Angehörigen" : "Alle Angehörigen"}{sort ? ` · sortiert nach ${SORT_LABEL[sort.key]}` : ""}
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
      {!leerKeineAngehoerige && (
        <div className="flex-1 overflow-y-auto" style={{ padding: "0 var(--space-6) var(--space-4)" }}>
          {keineTreffer ? (
            <div style={inhaltRahmen}>
              <div style={{ background: "var(--bg-elevated)", borderRadius: "var(--radius-card)", border: "var(--border-thin) solid var(--border-default)", padding: "3rem 1.5rem", textAlign: "center" }}>
                <p style={{ fontSize: "var(--text-body)", color: "var(--text-secondary)", marginBottom: 14 }}>
                  {filter.suche.trim()
                    ? <>Keine Angehörigen für &bdquo;{filter.suche.trim()}&ldquo;.</>
                    : "Keine Angehörigen mit diesen Filtern."}
                </p>
                <div className="inline-flex items-center flex-wrap justify-center" style={{ gap: 8 }}>
                  {filter.suche.trim() && <button type="button" onClick={() => setSuche("")} style={suchButton}>Suche löschen</button>}
                  {filterTags.length > 0 && <button type="button" onClick={resetFilter} style={suchButton}>Filter zurücksetzen</button>}
                </div>
              </div>
            </div>
          ) : (
            <DataTable<Angehoeriger>
              spalten={angehoerigeSpalten}
              zeilen={sorted}
              zeilenKey={a => a.id}
              onZeileKlick={a => navigate(`/angehoerige/${a.id}`)}
              zeilenHintergrund={zeilenHintergrund}
              sort={sort ?? undefined}
              onSort={toggleSort}
              karteTitel={nameZelle}
              fusszeile={<><span>{filtered.length} von {angehoerige.length} Angehörigen</span><span>Stand: {isoZuAnzeige("2026-03-03")}</span></>}
              leerText="Keine Angehörigen mit diesen Filtern."
            />
          )}
        </div>
      )}
    </div>
  );
}
