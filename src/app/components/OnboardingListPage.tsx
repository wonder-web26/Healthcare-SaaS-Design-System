import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { Plus, Search, AlertTriangle, X, ChevronDown, Check } from "lucide-react";
import { ANZAHL_SCHRITTE, schrittLabel, phaseFuerSchritt, phaseRang, PHASE_LABEL, type OnboardingPhase, ableitenKennzeichen, tageBisStart, istVertragUnterzeichnet } from "../../lib/onboarding/schritte";
import { isoZuAnzeige } from "../../lib/datum";
import { DataTable, TABELLE_LAYOUT, type SpalteDef } from "./ui/DataTable";
import { type OnboardingFall as OnboardingCase, onboardingFaelle as cases } from "../../lib/onboarding/faelle";

/* ── Bezugsdatum (Mock-Demo, entspricht der Vorgabe): alle Ableitungen laufen
   gegen diesen Stichtag statt gegen new Date(), damit die Liste deterministisch
   ist. Die reinen Funktionen erhalten ihn als Parameter. ── */
const BEZUGSDATUM = new Date(2026, 6, 31); // 31.07.2026

/* Fälle + OnboardingCase-Typ liegen jetzt in lib/onboarding/faelle.ts (geteilte
   Quelle für Liste und Assistent). Hier nur noch importiert (siehe oben). */

/* ── Zugehörigkeit (Segmentumschalter, genau eine Auswahl) ──
   "Meine" = Mandate der angemeldeten Benutzerin. Ohne echte Benutzer-ID im
   Prototyp bildet Maria Keller (responsibleUserId "keller") die angemeldete
   Benutzerin ab (deckungsgleich mit dem bisherigen CURRENT_USER). ── */
type Segment = "alle" | "meine";
const MEINE_USER_ID = "keller";

/* ── Status-Chips: kombinierbar, mit UND verknüpft. Jedes Prädikat ist rein
   (Mandat + Bezugsdatum → boolean); dieselben Ableitungen wie in der Tabelle. ── */
type StatusChipId = "start_ueberschritten" | "pendenz_ueberfaellig" | "pflichtdok_offen" | "nicht_zugewiesen";
const STATUS_CHIPS: { id: StatusChipId; label: string; praedikat: (c: OnboardingCase, bezug: Date) => boolean }[] = [
  { id: "start_ueberschritten", label: "Startdatum überschritten", praedikat: (c, b) => tageBisStart(c.validFrom, b) < 0 && !istVertragUnterzeichnet(c.currentStep) },
  { id: "pendenz_ueberfaellig", label: "Pendenz überfällig", praedikat: c => c.pendenzenUeberfaellig >= 1 },
  { id: "pflichtdok_offen", label: "Pflichtdokument offen", praedikat: c => c.pflichtdokErledigt < c.pflichtdokGefordert },
  { id: "nicht_zugewiesen", label: "Nicht zugewiesen", praedikat: c => c.responsibleUserId === null },
];

/* ── Auswahlfelder (Mehrfachauswahl) ── */
const PHASE_OPTIONEN: OnboardingPhase[] = ["preparation", "klv", "activation"];
const allKantone = [...new Set(cases.map(c => c.kanton))].sort();

/* ── Filterzustand: eine Struktur an einem Ort ── */
interface FilterZustand {
  segment: Segment;
  statusChips: Set<StatusChipId>;
  phasen: Set<OnboardingPhase>;
  kantone: Set<string>;
  suche: string;
}
const LEERER_FILTER: FilterZustand = { segment: "alle", statusChips: new Set(), phasen: new Set(), kantone: new Set(), suche: "" };

/** Nur das Segment anwenden — Basis für die Chip-Zahlen (Chip schränkt darüber hinaus ein). */
function imSegment(c: OnboardingCase, segment: Segment): boolean {
  return segment === "alle" || c.responsibleUserId === MEINE_USER_ID;
}

/** Reine Ableitung: Mandate + Filterzustand + Bezugsdatum → gefilterte Mandate. */
function filterMandate(list: OnboardingCase[], f: FilterZustand, bezug: Date): OnboardingCase[] {
  return list.filter(c => {
    if (!imSegment(c, f.segment)) return false;
    for (const chip of STATUS_CHIPS) if (f.statusChips.has(chip.id) && !chip.praedikat(c, bezug)) return false;
    if (f.phasen.size > 0 && !f.phasen.has(phaseFuerSchritt(c.currentStep))) return false;
    if (f.kantone.size > 0 && !f.kantone.has(c.kanton)) return false;
    const q = f.suche.trim().toLowerCase();
    if (q && !(c.patientNachname.toLowerCase().includes(q) || c.patientVorname.toLowerCase().includes(q) || c.angehoeriger.toLowerCase().includes(q) || c.id.toLowerCase().includes(q))) return false;
    return true;
  });
}

/* ══════════════════════════════════════════ */
/* ── Verantwortliche: Kurzname + Initialen für die Spalte (Quelle responsibleUserId) ── */
const RESPONSIBLE: Record<string, { initialen: string; kurz: string }> = {
  keller: { initialen: "MK", kurz: "M. Keller" },
  weber: { initialen: "SW", kurz: "S. Weber" },
  ott: { initialen: "RO", kurz: "R. Ott" },
};

/* ── Sortierung: Standard geplanter Start aufsteigend; klickbar in vier Spalten ── */
type SortKey = "patient" | "phase" | "pendenzen" | "start";
function sortCases(list: OnboardingCase[], key: SortKey, dir: "asc" | "desc"): OnboardingCase[] {
  const f = dir === "asc" ? 1 : -1;
  return [...list].sort((a, b) => {
    switch (key) {
      case "patient": return f * (a.patientNachname.localeCompare(b.patientNachname, "de") || a.patientVorname.localeCompare(b.patientVorname, "de"));
      case "phase": return f * ((phaseRang(phaseFuerSchritt(a.currentStep)) - phaseRang(phaseFuerSchritt(b.currentStep))) || a.validFrom.localeCompare(b.validFrom));
      case "pendenzen": return f * ((a.pendenzenOffen - b.pendenzenOffen) || a.validFrom.localeCompare(b.validFrom));
      case "start": default: return f * a.validFrom.localeCompare(b.validFrom);
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
        <div className="absolute z-50" style={{ top: "calc(100% + 6px)", left: 0, minWidth: 180, padding: 6, background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-overlay)" }}>
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

export function OnboardingListPage() {
  const navigate = useNavigate();
  // Angeheftete Notizen erzeugen hier bewusst kein Kennzeichen mehr: das
  // Anheften wirkt nur noch innerhalb der Notizspur der Person.
  const [filter, setFilter] = useState<FilterZustand>(LEERER_FILTER);
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "start", dir: "asc" });
  const toggleSort = (key: SortKey) => setSort(s => s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" });

  /* ── Filter-Setter: immer neue Sets, damit die Ableitung rein bleibt ── */
  const setSegment = (segment: Segment) => setFilter(f => ({ ...f, segment }));
  const setSuche = (suche: string) => setFilter(f => ({ ...f, suche }));
  const toggleChip = (id: StatusChipId) => setFilter(f => { const s = new Set(f.statusChips); if (s.has(id)) s.delete(id); else s.add(id); return { ...f, statusChips: s }; });
  const togglePhase = (p: OnboardingPhase) => setFilter(f => { const s = new Set(f.phasen); if (s.has(p)) s.delete(p); else s.add(p); return { ...f, phasen: s }; });
  const toggleKanton = (k: string) => setFilter(f => { const s = new Set(f.kantone); if (s.has(k)) s.delete(k); else s.add(k); return { ...f, kantone: s }; });
  const resetFilter = () => setFilter(f => ({ ...LEERER_FILTER, suche: f.suche })); // Suche behält ihr eigenes Löschen

  /* ── Ableitungen ── */
  const segmentBasis = useMemo(() => cases.filter(c => imSegment(c, filter.segment)), [filter.segment]);
  const chipCounts = useMemo(() => {
    const r = {} as Record<StatusChipId, number>;
    // Zahl = wie viele Mandate im aktiven Segment der Chip zusätzlich einschränken würde.
    for (const chip of STATUS_CHIPS) r[chip.id] = segmentBasis.filter(c => chip.praedikat(c, BEZUGSDATUM)).length;
    return r;
  }, [segmentBasis]);
  const filtered = useMemo(() => filterMandate(cases, filter, BEZUGSDATUM), [filter]);
  const sorted = useMemo(() => sortCases(filtered, sort.key, sort.dir), [filtered, sort]);

  const filterTags = useMemo(() => {
    const t: { key: string; label: string; entfernen: () => void }[] = [];
    STATUS_CHIPS.forEach(chip => { if (filter.statusChips.has(chip.id)) t.push({ key: `s-${chip.id}`, label: chip.label, entfernen: () => toggleChip(chip.id) }); });
    filter.phasen.forEach(p => t.push({ key: `p-${p}`, label: `Phase: ${PHASE_LABEL[p]}`, entfernen: () => togglePhase(p) }));
    filter.kantone.forEach(k => t.push({ key: `k-${k}`, label: `Kanton: ${k}`, entfernen: () => toggleKanton(k) }));
    return t;
  }, [filter]);

  const SORT_LABEL: Record<SortKey, string> = { patient: "Patient", phase: "Phase", pendenzen: "Pendenzen", start: "geplantem Start" };


  /* ── Spaltenbeschreibung für die geteilte DataTable (Anteile/Mindestbreiten/
     Ausrichtung an der Aufrufstelle; die Komponente kennt keine Fachspalten). ── */
  const kz = (c: OnboardingCase) => ableitenKennzeichen({ currentStep: c.currentStep, validFrom: c.validFrom, pendenzenUeberfaellig: c.pendenzenUeberfaellig }, BEZUGSDATUM);

  const onboardingZeilenHintergrund = (c: OnboardingCase): string | undefined => {
    const t = kz(c).typ;
    // Korrektur #2: Zeilentönung folgt der Schwere — Rot deutlich kräftiger als Gelb.
    return t === "rot" ? "color-mix(in srgb, var(--status-danger-bg), transparent 40%)"
      : t === "gelb" ? "color-mix(in srgb, var(--status-warning-bg), transparent 68%)"
      : undefined;
  };

  const kennzeichenIcon = (c: OnboardingCase) => {
    const k = kz(c);
    if (!k.typ) return null;
    // Form-Unterschied unabhängig von Farbe: Rot gefüllt, Gelb offen.
    return <AlertTriangle role="img" aria-label={k.grund} style={{ width: 15, height: 15, flexShrink: 0, color: k.typ === "rot" ? "var(--status-danger)" : "var(--status-warning)", fill: k.typ === "rot" ? "var(--status-danger)" : "none" }} />;
  };

  const onboardingKarteTitel = (c: OnboardingCase) => (
    <>
      <span style={{ fontSize: "0.9375rem", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", overflowWrap: "anywhere" }}>{c.patientNachname}, {c.patientVorname}</span>
      {kennzeichenIcon(c)}
    </>
  );

  const onboardingSpalten: SpalteDef<OnboardingCase>[] = [
    { id: "kennzeichen", label: "", festBreitePx: 28, align: "center", ausKarte: true, render: kennzeichenIcon },
    { id: "patient", label: "Patient", anteil: 20, minCh: 22, align: "left", sortierbar: true, ausKarte: true,
      render: c => <span style={{ fontSize: "0.8125rem", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", overflowWrap: "anywhere" }}>{c.patientNachname}, {c.patientVorname}</span> },
    { id: "angehoeriger", label: "Angehörige/r", anteil: 17, minCh: 20, align: "left", zweitzeileUnter: "patient", ausKarte: true,
      render: c => <span style={{ fontSize: "0.8125rem", color: "var(--text-primary)", overflowWrap: "anywhere" }}>{c.angehoeriger}</span> },
    { id: "phase", label: "Phase", anteil: 7, minCh: 11, align: "left", sortierbar: true, ausblendenUnter: "eng", ausKarte: true,
      render: c => <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{PHASE_LABEL[phaseFuerSchritt(c.currentStep)]}</span> },
    { id: "schritt", label: "Aktueller Schritt", anteil: 16, minCh: 24, align: "left",
      render: c => <span style={{ fontSize: "0.8125rem", color: "var(--text-primary)" }}><span style={{ fontFamily: "monospace", color: "var(--text-tertiary)", marginRight: 6 }}>{c.currentStep}/{ANZAHL_SCHRITTE}</span>{schrittLabel(c.currentStep)}</span> },
    { id: "pflichtdok", label: "Pflichtdok.", anteil: 7, minCh: 11, align: "left",
      // Korrektur #5: Balken entfällt — bei 40px war 7/8 vs 8/8 nicht auf einen Blick
      // unterscheidbar; der Bruch ist das eindeutige Signal, vollständig zusätzlich farblich.
      render: c => { const voll = c.pflichtdokErledigt === c.pflichtdokGefordert; return <span style={{ fontFamily: "monospace", fontSize: "0.8125rem", color: voll ? "var(--status-success-text)" : "var(--text-primary)", fontWeight: voll ? "var(--weight-medium)" : "var(--weight-regular)" }}>{c.pflichtdokErledigt}/{c.pflichtdokGefordert}</span>; } },
    { id: "pendenzen", label: "Pendenzen", anteil: 10, minCh: 14, align: "right", sortierbar: true,
      // Zwei Elemente statt einer Zeichenkette: die Zahl bleibt rechtsbündig auf fester
      // Linie (monospace/tabellarisch), der überfällige Zusatz sitzt links davon in der
      // Warnfarbe und drängt die Zahl nie von ihrer Linie. 0 = stiller Leerwert.
      render: c => (
        <span style={{ display: "flex", justifyContent: "flex-end", alignItems: "baseline", gap: 8, whiteSpace: "nowrap" }}>
          {c.pendenzenUeberfaellig > 0 && <span style={{ color: "var(--status-warning-text)", fontWeight: 500, fontSize: "0.75rem" }}>· {c.pendenzenUeberfaellig} überfällig</span>}
          <span style={{ fontFamily: "monospace", fontVariantNumeric: "tabular-nums", fontSize: "0.8125rem", color: c.pendenzenOffen === 0 ? "var(--text-tertiary)" : "var(--text-primary)" }}>{c.pendenzenOffen === 0 ? "–" : c.pendenzenOffen}</span>
        </span>
      ) },
    { id: "start", label: "Start geplant", anteil: 11, minCh: 16, align: "left", sortierbar: true,
      // Korrektur C: Abweichungsangabe einzeilig, ohne Umbruch — +N Tage bei Überschreitung,
      // in N Tagen bei bevorstehendem Start. Die Zelle bricht nie (whiteSpace nowrap).
      render: c => { const t = tageBisStart(c.validFrom, BEZUGSDATUM); const ueber = t < 0 && !istVertragUnterzeichnet(c.currentStep); const bevor = kz(c).typ === "gelb" && kz(c).spalte === "start"; return <span style={{ fontSize: "0.8125rem", color: "var(--text-primary)", whiteSpace: "nowrap" }}>{isoZuAnzeige(c.validFrom)}{ueber && <span style={{ marginLeft: 8, color: "var(--status-danger)", fontWeight: 500, fontSize: "0.75rem" }}>+{Math.abs(t)} {Math.abs(t) === 1 ? "Tag" : "Tage"}</span>}{!ueber && bevor && <span style={{ marginLeft: 8, color: "var(--status-warning-text)", fontWeight: 500, fontSize: "0.75rem" }}>{t === 0 ? "heute" : `in ${t} ${t === 1 ? "Tag" : "Tagen"}`}</span>}</span>; } },
    { id: "verantwortlich", label: "Verantw.", anteil: 12, minCh: 12, align: "left",
      render: c => { const resp = c.responsibleUserId ? RESPONSIBLE[c.responsibleUserId] : null; return resp
        ? <div className="flex items-center" style={{ gap: 6 }}><span className="shrink-0 flex items-center justify-center" style={{ width: 22, height: 22, borderRadius: "var(--radius-pill)", background: "var(--bg-secondary)" }}><span style={{ fontSize: 8, fontWeight: "var(--weight-semibold)", color: "var(--text-secondary)" }}>{resp.initialen}</span></span><span style={{ fontSize: "0.8125rem", color: "var(--text-primary)" }}>{resp.kurz}</span></div>
        : <button type="button" onClick={e => { e.stopPropagation(); }} className="ui-fokusring inline-flex items-center cursor-pointer" style={{ gap: 4, padding: "3px 10px", borderRadius: "var(--radius-pill)", background: "transparent", border: "var(--border-thin) solid var(--border-default)", fontSize: "0.75rem", fontWeight: "var(--weight-medium)", color: "var(--text-secondary)", fontFamily: "inherit" }}><Plus style={{ width: 12, height: 12 }} /> Zuweisen</button>; } },
  ];

  const inhaltRahmen = { maxWidth: TABELLE_LAYOUT.inhaltMaxPx, margin: "0 auto", width: "100%" } as const;
  const leerImOnboarding = cases.length === 0;
  const keineTreffer = sorted.length === 0;

  const suchButton = { background: "transparent", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-pill)", padding: "5px 12px", fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", color: "var(--text-secondary)", fontFamily: "inherit", cursor: "pointer" } as const;

  return (
    <div className="flex flex-col h-full min-h-0">
      <style>{`
        .ob-list-pad { padding-left: var(--mobile-page-padding); padding-right: var(--mobile-page-padding); }
        @media (min-width: 640px) { .ob-list-pad { padding-left: var(--space-6); padding-right: var(--space-6); } }
      `}</style>

      {/* ═══ KOPF — teilt Maximalbreite und Kanten mit der Tabelle (Korrektur A) ═══ */}
      <div className="shrink-0 ob-list-pad" style={{ paddingTop: "var(--space-4)" }}>
        <div style={inhaltRahmen}>
          {/* 1) Titel + Primäraktion auf einer Höhe */}
          <div className="flex items-center justify-between" style={{ marginBottom: "var(--space-3)" }}>
            <h1 style={{ fontSize: "var(--text-h1)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", letterSpacing: "var(--tracking-tight)" }}>Onboarding</h1>
            <button onClick={() => navigate("/onboarding/neu")} className="inline-flex items-center shrink-0 cursor-pointer transition-colors"
              style={{ gap: "var(--space-2)", padding: "10px 22px", borderRadius: "var(--radius-pill)", background: "var(--brand-primary)", color: "var(--text-on-dark)", fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", border: "none" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--brand-primary-dark)"} onMouseLeave={e => e.currentTarget.style.background = "var(--brand-primary)"}>
              <Plus style={{ width: 16, height: 16 }} /> <span className="hidden sm:inline">Neues Mandat</span>
            </button>
          </div>

          {leerImOnboarding ? (
            <p style={{ fontSize: "var(--text-body)", color: "var(--text-secondary)", maxWidth: 560 }}>
              Sobald ein Mandat ins Onboarding gelangt, erscheint es hier mit Phase, aktuellem Schritt und geplantem Start.
            </p>
          ) : (
            <>
              {/* 2) Steuerleiste: Suche, Zugehörigkeit, Auswahlfelder */}
              <div className="flex items-center flex-wrap" style={{ gap: 8, marginBottom: "var(--space-2)" }}>
                <div className="flex items-center" style={{ flex: "1 1 220px", maxWidth: 300, gap: "var(--space-2)", padding: "7px 14px", borderRadius: "var(--radius-pill)", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)" }}>
                  <Search style={{ width: 14, height: 14, color: "var(--text-tertiary)", flexShrink: 0 }} />
                  <input value={filter.suche} onChange={e => setSuche(e.target.value)} placeholder="Onboardings suchen…" className="flex-1 bg-transparent outline-none" style={{ fontSize: "var(--text-small)", color: "var(--text-primary)", minWidth: 0 }} />
                  {filter.suche && <button onClick={() => setSuche("")} className="cursor-pointer shrink-0" style={{ background: "transparent", border: "none" }}><X style={{ width: 12, height: 12, color: "var(--text-secondary)" }} /></button>}
                </div>

                {/* Zugehörigkeit — Segmentumschalter, genau eine Auswahl, Vorgabe „Alle" */}
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

                <AuswahlDropdown label="Phase" optionen={PHASE_OPTIONEN.map(pp => ({ value: pp, label: PHASE_LABEL[pp] }))} ausgewaehlt={filter.phasen as Set<string>} onToggle={v => togglePhase(v as OnboardingPhase)} />
                <AuswahlDropdown label="Kanton" optionen={allKantone.map(k => ({ value: k, label: k }))} ausgewaehlt={filter.kantone} onToggle={toggleKanton} />
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

              {/* 3) Aktivzeile — immer sichtbar */}
              <div className="flex items-center flex-wrap" style={{ gap: 6, minHeight: 24, marginBottom: "var(--space-2)" }}>
                {filterTags.length === 0 ? (
                  <span style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>
                    {filter.segment === "meine" ? "Meine offenen Mandate" : "Alle offenen Mandate"} · sortiert nach {SORT_LABEL[sort.key]}
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
      {!leerImOnboarding && (
        <div className="flex-1 overflow-y-auto ob-list-pad" style={{ paddingTop: 0, paddingBottom: "var(--space-4)" }}>
          {keineTreffer ? (
            <div style={inhaltRahmen}>
              <div style={{ background: "var(--bg-elevated)", borderRadius: "var(--radius-card)", border: "var(--border-thin) solid var(--border-default)", padding: "3rem 1.5rem", textAlign: "center" }}>
                <p style={{ fontSize: "var(--text-body)", color: "var(--text-secondary)", marginBottom: 14 }}>
                  {filter.suche.trim()
                    ? <>Keine Mandate für „{filter.suche.trim()}“.</>
                    : "Keine Mandate mit diesen Filtern."}
                </p>
                <div className="inline-flex items-center flex-wrap justify-center" style={{ gap: 8 }}>
                  {filter.suche.trim() && <button type="button" onClick={() => setSuche("")} style={suchButton}>Suche löschen</button>}
                  {filterTags.length > 0 && <button type="button" onClick={resetFilter} style={suchButton}>Filter zurücksetzen</button>}
                </div>
              </div>
            </div>
          ) : (
            <DataTable<OnboardingCase>
              spalten={onboardingSpalten}
              zeilen={sorted}
              zeilenKey={c => c.id}
              onZeileKlick={c => navigate(`/onboarding/${c.id}`)}
              zeilenHintergrund={onboardingZeilenHintergrund}
              sort={sort}
              onSort={k => toggleSort(k as SortKey)}
              karteTitel={onboardingKarteTitel}
              fusszeile={<><span>{filtered.length} von {cases.length} offenen Mandaten</span><span>Stand: {isoZuAnzeige("2026-07-31")}</span></>}
              leerText="Keine Mandate mit diesen Filtern."
            />
          )}
        </div>
      )}
    </div>
  );
}
