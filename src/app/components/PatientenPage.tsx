import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Search, Plus, AlertTriangle, Clock, X, ChevronDown, Check } from "lucide-react";
import { patients as allePatienten, type Patient, type Schweregrad } from "./patientData";
import { DataTable, TABELLE_LAYOUT, type SpalteDef } from "./ui/DataTable";
import { StatusModal } from "./StatusModal";
import { PflegefachkraftSidebar, type Caregiver } from "./PflegefachkraftSidebar";
import { useCurrentUser } from "../auth";
import { anzeigeZuIso, isoZuAnzeige } from "../../lib/datum";
import { toast } from "sonner";

/* ── Bezugsdatum (Mock-Demo): alle Ableitungen laufen gegen diesen Stichtag statt
   gegen new Date(), damit die Liste deterministisch ist. 03.03.2026 ist der in
   CLAUDE.md festgelegte Mock-Stichtag; die Fälligkeitsdaten der Patienten sind
   darauf ausgerichtet. Die reinen Funktionen erhalten ihn als Parameter. ── */
const BEZUGSDATUM_ISO = "2026-03-03";

/* ── Zugehörigkeit (Segmentumschalter, genau eine Auswahl) ──
   "Meine" = Patienten der angemeldeten Benutzerin. Die Benutzerin kommt aus der
   Auth (rollenabhängig), nicht aus einem verdrahteten Namen. ── */
type Segment = "alle" | "meine";

/* ── Schwelle, ab der ein Re-Assessment als fällig gilt. Entspricht der
   Warnschwelle, die die Zelle selbst verwendet — Chip und Zelle teilen sie. ── */
const REASSESSMENT_SCHWELLE_TAGE = 30;

/* ── Sentinel der Mockdaten für "keine Pflegefachkraft" ── */
const KEINE_PFLEGEFACHKRAFT = "—";

/* ══════════════════════════════════════════
   ABLEITUNGEN — reine Funktionen (Patient + Bezugsdatum → boolean)
   Dieselben Prädikate speisen Chips, Chip-Zahlen, Kennzeichen und Tabelle.
   ══════════════════════════════════════════ */

function istProzessUeberfaellig(p: Patient, bezugIso: string): boolean {
  if (!p.prozessStatus) return false;
  const faelligIso = anzeigeZuIso(p.prozessStatus.faelligDatum);
  return faelligIso !== "" && faelligIso < bezugIso;
}

function istReAssessmentFaellig(p: Patient): boolean {
  return p.reAssessmentTage !== null && p.reAssessmentTage <= REASSESSMENT_SCHWELLE_TAGE;
}

function istNichtZugewiesen(p: Patient): boolean {
  return p.pflegefachkraft === KEINE_PFLEGEFACHKRAFT;
}

function istNichtAbrechenbar(p: Patient): boolean {
  return p.status === "nicht_abrechenbar";
}

/* ── Kennzeichen: Rot schlägt Gelb. Jeder Grund ist zusätzlich in einer Spalte
   sichtbar (überfällig → Prozessstatus, nicht abrechenbar → Status,
   nicht zugewiesen → Pflegefachkraft) — im Kennzeichen steckt nichts allein. ── */
type KennzeichenTyp = "rot" | "gelb" | null;

function ableitenKennzeichen(p: Patient, bezugIso: string): { typ: KennzeichenTyp; grund: string } {
  const ueberfaellig = istProzessUeberfaellig(p, bezugIso);
  const nichtAbrechenbar = istNichtAbrechenbar(p);
  if (ueberfaellig && nichtAbrechenbar) return { typ: "rot", grund: "Prozessschritt überfällig und nicht abrechenbar" };
  if (ueberfaellig) return { typ: "gelb", grund: "Prozessschritt überfällig" };
  if (nichtAbrechenbar) return { typ: "gelb", grund: "Nicht abrechenbar" };
  if (istNichtZugewiesen(p)) return { typ: "gelb", grund: "Keine Pflegefachkraft zugewiesen" };
  return { typ: null, grund: "" };
}

/* ── Status-Chips: kombinierbar, mit UND verknüpft ── */
type StatusChipId = "prozess_ueberfaellig" | "reassessment_faellig" | "nicht_zugewiesen" | "nicht_abrechenbar";
const STATUS_CHIPS: { id: StatusChipId; label: string; praedikat: (p: Patient, bezugIso: string) => boolean }[] = [
  { id: "prozess_ueberfaellig", label: "Prozessschritt überfällig", praedikat: istProzessUeberfaellig },
  { id: "reassessment_faellig", label: "Re-Assessment fällig", praedikat: p => istReAssessmentFaellig(p) },
  { id: "nicht_zugewiesen", label: "Nicht zugewiesen", praedikat: p => istNichtZugewiesen(p) },
  { id: "nicht_abrechenbar", label: "Nicht abrechenbar", praedikat: p => istNichtAbrechenbar(p) },
];

/* ── Auswahlfelder (Mehrfachauswahl) ── */
const SCHWEREGRAD_OPTIONEN: { value: Schweregrad; label: string }[] = [
  { value: "leicht", label: "Leicht" },
  { value: "mittel", label: "Mittel" },
  { value: "schwer", label: "Schwer" },
  { value: "kritisch", label: "Kritisch" },
];
const allePflegefachkraefte = [...new Set(allePatienten.map(p => p.pflegefachkraft).filter(pf => pf !== KEINE_PFLEGEFACHKRAFT))].sort();

/* ── Filterzustand: eine Struktur an einem Ort ── */
interface FilterZustand {
  segment: Segment;
  statusChips: Set<StatusChipId>;
  schweregrade: Set<Schweregrad>;
  pflegefachkraefte: Set<string>;
  suche: string;
}
const LEERER_FILTER: FilterZustand = { segment: "alle", statusChips: new Set(), schweregrade: new Set(), pflegefachkraefte: new Set(), suche: "" };

/* ── Anfangszustand aus der URL: Anna verlinkt die Liste vorgefiltert
   (/patienten?schweregrad=… und ?zuweisung=nicht_zugewiesen). Einmalig gelesen —
   danach ist der Filterzustand die alleinige Quelle. ── */
function initialerFilter(params: URLSearchParams): FilterZustand {
  const schweregrade = new Set<Schweregrad>();
  for (const wert of (params.get("schweregrad") || "").split(",").filter(Boolean)) {
    if (SCHWEREGRAD_OPTIONEN.some(o => o.value === wert)) schweregrade.add(wert as Schweregrad);
  }
  const statusChips = new Set<StatusChipId>();
  if (params.get("zuweisung") === "nicht_zugewiesen") statusChips.add("nicht_zugewiesen");
  return { ...LEERER_FILTER, schweregrade, statusChips, suche: params.get("q") || "" };
}

/** Nur das Segment anwenden — Basis für die Chip-Zahlen (Chip schränkt darüber hinaus ein). */
function imSegment(p: Patient, segment: Segment, meinName: string): boolean {
  return segment === "alle" || p.pflegefachkraft === meinName;
}

/** Reine Ableitung: Patienten + Filterzustand + Bezugsdatum → gefilterte Patienten. */
function filterPatienten(list: Patient[], f: FilterZustand, bezugIso: string, meinName: string): Patient[] {
  return list.filter(p => {
    if (!imSegment(p, f.segment, meinName)) return false;
    for (const chip of STATUS_CHIPS) if (f.statusChips.has(chip.id) && !chip.praedikat(p, bezugIso)) return false;
    if (f.schweregrade.size > 0 && !f.schweregrade.has(p.schweregrad)) return false;
    if (f.pflegefachkraefte.size > 0 && !f.pflegefachkraefte.has(p.pflegefachkraft)) return false;
    const q = f.suche.trim().toLowerCase();
    if (q && !(p.nachname.toLowerCase().includes(q) || p.vorname.toLowerCase().includes(q) || p.angehoeriger.toLowerCase().includes(q) || p.pflegefachkraft.toLowerCase().includes(q) || p.id.toLowerCase().includes(q))) return false;
    return true;
  });
}

/* ── Sortierung: Standard Name aufsteigend; klickbar in vier Spalten ── */
type SortKey = "name" | "schweregrad" | "reassessment" | "tasks";
const SORT_LABEL: Record<SortKey, string> = { name: "Name", schweregrad: "Schweregrad", reassessment: "Re-Assessment", tasks: "Tasks" };
const SCHWEREGRAD_RANK: Record<Schweregrad, number> = { leicht: 0, mittel: 1, schwer: 2, kritisch: 3 };

function sortPatients(list: Patient[], key: SortKey, dir: "asc" | "desc"): Patient[] {
  const f = dir === "asc" ? 1 : -1;
  return [...list].sort((a, b) => {
    switch (key) {
      case "schweregrad": return f * ((SCHWEREGRAD_RANK[a.schweregrad] - SCHWEREGRAD_RANK[b.schweregrad]) || a.nachname.localeCompare(b.nachname, "de"));
      case "reassessment": return f * ((a.reAssessmentTage ?? Infinity) - (b.reAssessmentTage ?? Infinity));
      case "tasks": return f * (a.offeneActionTasks - b.offeneActionTasks);
      case "name": default: return f * (a.nachname.localeCompare(b.nachname, "de") || a.vorname.localeCompare(b.vorname, "de"));
    }
  });
}

/* ── Anzeige-Hilfen ── */
const STATUS_LABEL: Record<Patient["status"], string> = {
  aktiv: "Aktiv",
  nicht_abrechenbar: "Nicht abrechenbar",
  gekuendigt: "Gekündigt",
};
const SCHWEREGRAD_LABEL: Record<Schweregrad, string> = { leicht: "Leicht", mittel: "Mittel", schwer: "Schwer", kritisch: "Kritisch" };

/** "Sandra Weber" → "S. Weber" (Kurzname wie in der Onboarding-Liste). */
function kurzname(voll: string): string {
  const teile = voll.trim().split(/\s+/);
  if (teile.length < 2) return voll;
  return `${teile[0][0]}. ${teile.slice(1).join(" ")}`;
}

/* ── Mehrfachauswahl-Dropdown (lokal; kein neues Shared-Bauteil).
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

/* ══════════════════════════════════════════
   SEITE
   ══════════════════════════════════════════ */

export function PatientenPage() {
  const navigate = useNavigate();
  const benutzerin = useCurrentUser();
  const meinName = `${benutzerin.vorname} ${benutzerin.name}`;
  const [searchParams] = useSearchParams();

  const [filter, setFilter] = useState<FilterZustand>(() => initialerFilter(searchParams));
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "name", dir: "asc" });
  const toggleSort = (key: SortKey) => setSort(s => s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" });

  /* ── Filter-Setter: immer neue Sets, damit die Ableitung rein bleibt ── */
  const setSegment = (segment: Segment) => setFilter(f => ({ ...f, segment }));
  const setSuche = (suche: string) => setFilter(f => ({ ...f, suche }));
  const toggleChip = (id: StatusChipId) => setFilter(f => { const s = new Set(f.statusChips); if (s.has(id)) s.delete(id); else s.add(id); return { ...f, statusChips: s }; });
  const toggleSchweregrad = (g: Schweregrad) => setFilter(f => { const s = new Set(f.schweregrade); if (s.has(g)) s.delete(g); else s.add(g); return { ...f, schweregrade: s }; });
  const togglePflegefachkraft = (pf: string) => setFilter(f => { const s = new Set(f.pflegefachkraefte); if (s.has(pf)) s.delete(pf); else s.add(pf); return { ...f, pflegefachkraefte: s }; });
  const resetFilter = () => setFilter(f => ({ ...LEERER_FILTER, suche: f.suche })); // Suche behält ihr eigenes Löschen

  /* ── Zuweisung: Sidebar schreibt in lokale Übersteuerung, nicht in die Mocks ── */
  const [assignmentOverrides, setAssignmentOverrides] = useState<Record<string, { name: string; initialen: string }>>({});
  const [statusModal, setStatusModal] = useState<{ open: boolean; patient: Patient | null }>({ open: false, patient: null });
  const [assignSidebar, setAssignSidebar] = useState<{ open: boolean; patient: Patient | null }>({ open: false, patient: null });

  const patients = useMemo(() => allePatienten.map(p => {
    const override = assignmentOverrides[p.id];
    return override ? { ...p, pflegefachkraft: override.name, pflegefachkraftInitialen: override.initialen } : p;
  }), [assignmentOverrides]);

  const handleAssign = (patientId: string, caregiver: Caregiver) => {
    setAssignmentOverrides(prev => ({ ...prev, [patientId]: { name: caregiver.name, initialen: caregiver.initialen } }));
    setAssignSidebar({ open: false, patient: null });
    toast("Patient zugewiesen");
  };

  /* ── Ableitungen ── */
  const segmentBasis = useMemo(() => patients.filter(p => imSegment(p, filter.segment, meinName)), [patients, filter.segment, meinName]);
  const chipCounts = useMemo(() => {
    const r = {} as Record<StatusChipId, number>;
    // Zahl = wie viele Patienten im aktiven Segment der Chip zusätzlich einschränken würde.
    for (const chip of STATUS_CHIPS) r[chip.id] = segmentBasis.filter(p => chip.praedikat(p, BEZUGSDATUM_ISO)).length;
    return r;
  }, [segmentBasis]);
  const filtered = useMemo(() => filterPatienten(patients, filter, BEZUGSDATUM_ISO, meinName), [patients, filter, meinName]);
  const sorted = useMemo(() => sortPatients(filtered, sort.key, sort.dir), [filtered, sort]);

  const filterTags = useMemo(() => {
    const t: { key: string; label: string; entfernen: () => void }[] = [];
    STATUS_CHIPS.forEach(chip => { if (filter.statusChips.has(chip.id)) t.push({ key: `s-${chip.id}`, label: chip.label, entfernen: () => toggleChip(chip.id) }); });
    filter.schweregrade.forEach(g => t.push({ key: `g-${g}`, label: `Schweregrad: ${SCHWEREGRAD_LABEL[g]}`, entfernen: () => toggleSchweregrad(g) }));
    filter.pflegefachkraefte.forEach(pf => t.push({ key: `pf-${pf}`, label: `Pflegefachkraft: ${pf}`, entfernen: () => togglePflegefachkraft(pf) }));
    return t;
  }, [filter]);

  /* ── Zellen ── */
  const kz = (p: Patient) => ableitenKennzeichen(p, BEZUGSDATUM_ISO);

  const zeilenHintergrund = (p: Patient): string | undefined => {
    const t = kz(p).typ;
    // Zeilentönung folgt der Schwere — Rot deutlich kräftiger als Gelb.
    return t === "rot" ? "color-mix(in srgb, var(--status-danger-bg), transparent 40%)"
      : t === "gelb" ? "color-mix(in srgb, var(--status-warning-bg), transparent 68%)"
      : undefined;
  };

  const kennzeichenIcon = (p: Patient) => {
    const k = kz(p);
    if (!k.typ) return null;
    // Form-Unterschied unabhängig von Farbe: Rot gefüllt, Gelb offen.
    return <AlertTriangle role="img" aria-label={k.grund} style={{ width: 15, height: 15, flexShrink: 0, color: k.typ === "rot" ? "var(--status-danger)" : "var(--status-warning)", fill: k.typ === "rot" ? "var(--status-danger)" : "none" }} />;
  };

  const nameText = (p: Patient) => `${p.nachname}, ${p.vorname}`;

  const karteTitel = (p: Patient) => (
    <>
      <span style={{ fontSize: "0.9375rem", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", overflowWrap: "anywhere" }}>{nameText(p)}</span>
      {kennzeichenIcon(p)}
    </>
  );

  const patientSpalten: SpalteDef<Patient>[] = [
    { id: "kennzeichen", label: "", festBreitePx: 28, align: "center", ausKarte: true, render: kennzeichenIcon },
    { id: "name", label: "Name", anteil: 17, minCh: 22, align: "left", sortierbar: true, ausKarte: true,
      render: p => <span style={{ fontSize: "0.8125rem", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", overflowWrap: "anywhere" }}>{nameText(p)}</span> },
    // Breite trägt den längsten Angehörigen-Namen einzeilig ("Beatrice
    // Hübscher-Wiederkehr") — ein Umbruch würde diese eine Zeile höher machen.
    { id: "angehoeriger", label: "Angehöriger", anteil: 15, minCh: 20, align: "left", zweitzeileUnter: "name",
      render: p => <span style={{ fontSize: "0.8125rem", color: "var(--text-primary)", overflowWrap: "anywhere" }}>{p.angehoeriger.split(" (")[0]}</span> },
    // Breite trägt "Nicht abrechenbar" als Pille vollständig — sonst stösst ihre
    // Fläche an die Schweregrad-Zelle (Ferrari und Huber tragen beide).
    { id: "status", label: "Status", anteil: 11, minCh: 16, align: "left",
      // Farbregel: Normalzustand "Aktiv" ist stiller Text ohne Fläche; nur die
      // Ausnahmen behalten die Pille. Der Klick auf den Status bleibt erhalten.
      render: p => {
        const still = p.status === "aktiv";
        return (
          <button type="button" onClick={e => { e.stopPropagation(); setStatusModal({ open: true, patient: p }); }}
            className="ui-fokusring inline-flex items-center cursor-pointer"
            style={still
              ? { padding: 0, background: "transparent", border: "none", fontSize: "0.8125rem", color: "var(--text-secondary)", fontFamily: "inherit", whiteSpace: "nowrap" }
              : { gap: 4, padding: "2px 10px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", background: "var(--status-danger-bg)", color: "var(--status-danger)", border: "none", fontFamily: "inherit", whiteSpace: "nowrap" }}>
            {!still && <span style={{ width: 5, height: 5, borderRadius: "var(--radius-pill)", background: "var(--status-danger)" }} />}
            {STATUS_LABEL[p.status]}
          </button>
        );
      } },
    { id: "schweregrad", label: "Schweregrad", anteil: 6, minCh: 9, align: "left", sortierbar: true,
      // Nur "Kritisch" behält die Fläche. Der Rand hält die Pille optisch von einer
      // benachbarten Status-Pille getrennt (Ferrari trägt beide).
      render: p => p.schweregrad === "kritisch"
        ? <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", background: "transparent", border: "var(--border-thin) solid var(--status-danger)", color: "var(--status-danger)", whiteSpace: "nowrap" }}>{SCHWEREGRAD_LABEL[p.schweregrad]}</span>
        : <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{SCHWEREGRAD_LABEL[p.schweregrad]}</span> },
    { id: "pflegefachkraft", label: "Pflegefachkraft", anteil: 9, minCh: 12, align: "left",
      render: p => istNichtZugewiesen(p)
        ? <button type="button" onClick={e => { e.stopPropagation(); setAssignSidebar({ open: true, patient: p }); }} className="ui-fokusring inline-flex items-center cursor-pointer" style={{ gap: 4, padding: "3px 10px", borderRadius: "var(--radius-pill)", background: "transparent", border: "var(--border-thin) solid var(--border-default)", fontSize: "0.75rem", fontWeight: "var(--weight-medium)", color: "var(--text-secondary)", fontFamily: "inherit", whiteSpace: "nowrap" }}><Plus style={{ width: 12, height: 12 }} /> Zuweisen</button>
        : <button type="button" onClick={e => { e.stopPropagation(); setAssignSidebar({ open: true, patient: p }); }} className="ui-fokusring flex items-center cursor-pointer" style={{ gap: 6, padding: 0, background: "transparent", border: "none", fontFamily: "inherit" }}>
            <span className="shrink-0 flex items-center justify-center" style={{ width: 22, height: 22, borderRadius: "var(--radius-pill)", background: "var(--bg-secondary)" }}><span style={{ fontSize: 8, fontWeight: "var(--weight-semibold)", color: "var(--text-secondary)" }}>{p.pflegefachkraftInitialen}</span></span>
            <span style={{ fontSize: "0.8125rem", color: "var(--text-primary)", whiteSpace: "nowrap" }}>{kurzname(p.pflegefachkraft)}</span>
          </button> },
    { id: "prozessstatus", label: "Prozessstatus", anteil: 15, minCh: 20, align: "left", ausblendenUnter: "eng",
      // Farbe nur bei Überfälligkeit; "Aktuell" ist stiller Text. Die Zelle hält
      // immer die Höhe zweier Zeilen, damit alle Zeilen gleich hoch bleiben —
      // sonst wären Zeilen ohne offene Aufgabe niedriger als die übrigen.
      render: p => {
        if (!p.prozessStatus) return (
          <div>
            <div className="flex items-center" style={{ gap: 4 }}>
              <span aria-hidden="true" style={{ width: 12, height: 12, flexShrink: 0 }} />
              <span style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)" }}>Aktuell</span>
            </div>
            {/* Platzhalter für die Fälligkeitszeile — hält die Zeilenhöhe gleich. */}
            <div aria-hidden="true" style={{ fontSize: "var(--text-micro)", marginLeft: 16, visibility: "hidden" }}>&nbsp;</div>
          </div>
        );
        const ueberfaellig = istProzessUeberfaellig(p, BEZUGSDATUM_ISO);
        return (
          <div>
            <div className="flex items-center" style={{ gap: 4 }}>
              {ueberfaellig
                ? <AlertTriangle style={{ width: 12, height: 12, color: "var(--status-danger)", flexShrink: 0 }} />
                : <Clock style={{ width: 12, height: 12, color: "var(--text-tertiary)", flexShrink: 0 }} />}
              <span style={{ fontSize: "0.8125rem", color: ueberfaellig ? "var(--status-danger)" : "var(--text-primary)", fontWeight: ueberfaellig ? "var(--weight-medium)" : "var(--weight-regular)", overflowWrap: "anywhere" }}>{p.prozessStatus.naechsteAufgabe}</span>
            </div>
            <div style={{ fontSize: "var(--text-micro)", marginLeft: 16, color: ueberfaellig ? "var(--status-danger)" : "var(--text-tertiary)" }}>
              {ueberfaellig ? "Überfällig · " : "Fällig "}{p.prozessStatus.faelligDatum}
            </div>
          </div>
        );
      } },
    { id: "reassessment", label: "Re-Assessment", anteil: 8, minCh: 10, align: "right", sortierbar: true,
      // Balken entfällt: seine Breite war eine reine Funktion der Tageszahl
      // (90-Tage-Zyklus, nirgends in den Daten hinterlegt) und trug damit keine
      // eigene Information. Die Fälligkeitsschwelle wandert in die Zahl.
      render: p => p.reAssessmentTage === null
        ? <span style={{ fontFamily: "monospace", fontSize: "0.8125rem", color: "var(--text-tertiary)" }}>–</span>
        : <span style={{ fontFamily: "monospace", fontVariantNumeric: "tabular-nums", fontSize: "0.8125rem", fontWeight: istReAssessmentFaellig(p) ? "var(--weight-medium)" : "var(--weight-regular)", color: istReAssessmentFaellig(p) ? "var(--status-warning-text)" : "var(--text-primary)" }}>{p.reAssessmentTage}d</span> },
    { id: "tasks", label: "Tasks", anteil: 5, minCh: 5, align: "right", sortierbar: true,
      // Tabellarische Zahl auf fester Linie; 0 = stiller Leerwert.
      render: p => <span style={{ fontFamily: "monospace", fontVariantNumeric: "tabular-nums", fontSize: "0.8125rem", color: p.offeneActionTasks === 0 ? "var(--text-tertiary)" : "var(--text-primary)" }}>{p.offeneActionTasks === 0 ? "–" : p.offeneActionTasks}</span> },
    { id: "aktivitaet", label: "Aktivität", anteil: 7, minCh: 8, align: "left",
      render: p => <span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", whiteSpace: "nowrap" }}>{p.letzteAktivitaet}</span> },
  ];

  const inhaltRahmen = { maxWidth: TABELLE_LAYOUT.inhaltMaxPx, margin: "0 auto", width: "100%" } as const;
  const keinePatienten = patients.length === 0;
  const keineTreffer = sorted.length === 0;
  const suchButton = { background: "transparent", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-pill)", padding: "5px 12px", fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", color: "var(--text-secondary)", fontFamily: "inherit", cursor: "pointer" } as const;

  return (
    <>
      <div className="flex flex-col h-full min-h-0">
        <style>{`
          .pat-list-pad { padding-left: var(--mobile-page-padding); padding-right: var(--mobile-page-padding); }
          @media (min-width: 640px) { .pat-list-pad { padding-left: var(--space-6); padding-right: var(--space-6); } }
        `}</style>

        {/* ═══ KOPF — teilt Maximalbreite und Kanten mit der Tabelle ═══ */}
        <div className="shrink-0 pat-list-pad" style={{ paddingTop: "var(--space-4)" }}>
          <div style={inhaltRahmen}>
            {/* 1) Titel + Primäraktion auf einer Höhe */}
            <div className="flex items-center justify-between" style={{ marginBottom: "var(--space-3)" }}>
              <h1 style={{ fontSize: "var(--text-h1)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", letterSpacing: "var(--tracking-tight)" }}>Patienten</h1>
              <button onClick={() => navigate("/onboarding")} className="inline-flex items-center shrink-0 cursor-pointer transition-colors"
                style={{ gap: "var(--space-2)", padding: "10px 22px", borderRadius: "var(--radius-pill)", background: "var(--brand-primary)", color: "var(--text-on-dark)", fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", border: "none" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--brand-primary-dark)"} onMouseLeave={e => e.currentTarget.style.background = "var(--brand-primary)"}>
                <Plus style={{ width: 16, height: 16 }} /> <span className="hidden sm:inline">Patient anlegen</span>
              </button>
            </div>

            {keinePatienten ? (
              <p style={{ fontSize: "var(--text-body)", color: "var(--text-secondary)", maxWidth: 560 }}>
                Sobald ein Patient aufgenommen ist, erscheint er hier mit Status, Prozessschritt und zuständiger Pflegefachkraft.
              </p>
            ) : (
              <>
                {/* 2) Steuerleiste: Suche, Zugehörigkeit, Auswahlfelder */}
                <div className="flex items-center flex-wrap" style={{ gap: 8, marginBottom: "var(--space-2)" }}>
                  <div className="flex items-center" style={{ flex: "1 1 220px", maxWidth: 300, gap: "var(--space-2)", padding: "7px 14px", borderRadius: 8, background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)" }}>
                    <Search style={{ width: 14, height: 14, color: "var(--text-tertiary)", flexShrink: 0 }} />
                    <input value={filter.suche} onChange={e => setSuche(e.target.value)} placeholder="Patienten suchen…" className="flex-1 bg-transparent outline-none" style={{ fontSize: "var(--text-small)", color: "var(--text-primary)", minWidth: 0 }} />
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

                  <AuswahlDropdown label="Schweregrad" optionen={SCHWEREGRAD_OPTIONEN} ausgewaehlt={filter.schweregrade as Set<string>} onToggle={v => toggleSchweregrad(v as Schweregrad)} />
                  <AuswahlDropdown label="Pflegefachkraft" optionen={allePflegefachkraefte.map(pf => ({ value: pf, label: pf }))} ausgewaehlt={filter.pflegefachkraefte} onToggle={togglePflegefachkraft} />
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
                      {filter.segment === "meine" ? "Meine Patienten" : "Alle Patienten"} · sortiert nach {SORT_LABEL[sort.key]}
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
        {!keinePatienten && (
          <div className="flex-1 overflow-y-auto pat-list-pad" style={{ paddingTop: 0, paddingBottom: "var(--space-4)" }}>
            {keineTreffer ? (
              <div style={inhaltRahmen}>
                <div style={{ background: "var(--bg-elevated)", borderRadius: "var(--radius-card)", border: "var(--border-thin) solid var(--border-default)", padding: "3rem 1.5rem", textAlign: "center" }}>
                  <p style={{ fontSize: "var(--text-body)", color: "var(--text-secondary)", marginBottom: 14 }}>
                    {filter.suche.trim()
                      ? <>Keine Patienten für „{filter.suche.trim()}“.</>
                      : "Keine Patienten mit diesen Filtern."}
                  </p>
                  <div className="inline-flex items-center flex-wrap justify-center" style={{ gap: 8 }}>
                    {filter.suche.trim() && <button type="button" onClick={() => setSuche("")} style={suchButton}>Suche löschen</button>}
                    {filterTags.length > 0 && <button type="button" onClick={resetFilter} style={suchButton}>Filter zurücksetzen</button>}
                  </div>
                </div>
              </div>
            ) : (
              <DataTable<Patient>
                spalten={patientSpalten}
                zeilen={sorted}
                zeilenKey={p => p.id}
                onZeileKlick={p => navigate(`/patienten/${p.id}`)}
                zeilenHintergrund={zeilenHintergrund}
                sort={sort}
                onSort={k => toggleSort(k as SortKey)}
                karteTitel={karteTitel}
                fusszeile={<><span>{filtered.length} von {patients.length} {patients.length === 1 ? "Patient" : "Patienten"}</span><span>Stand: {isoZuAnzeige(BEZUGSDATUM_ISO)}</span></>}
                leerText="Keine Patienten mit diesen Filtern."
              />
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <StatusModal
        open={statusModal.open}
        onClose={() => setStatusModal({ open: false, patient: null })}
        currentStatus={statusModal.patient?.status || "aktiv"}
        patientName={statusModal.patient ? `${statusModal.patient.nachname}, ${statusModal.patient.vorname} (${statusModal.patient.id})` : ""}
      />
      <PflegefachkraftSidebar
        open={assignSidebar.open}
        patient={assignSidebar.patient}
        onClose={() => setAssignSidebar({ open: false, patient: null })}
        onAssign={handleAssign}
      />
    </>
  );
}
