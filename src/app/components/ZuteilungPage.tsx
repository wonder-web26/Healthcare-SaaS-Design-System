import { useState, useMemo, useRef, useEffect } from "react";
import {
  Search,
  Users,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Star,
  MapPin,
  Globe,
  Briefcase,
  X,
  Check,
  ChevronDown,
  Plus,
  UserPlus,
} from "lucide-react";
import {
  statusConfig,
  schweregradConfig,
  type Patient,
  type PatientStatus,
  type Schweregrad,
} from "./patientData";
import { usePatienten, PATIENTEN_BEZUGSDATUM_ISO } from "../../lib/patienten/store";
import { sdaSpracheCode, sdaSpracheLabel } from "../../lib/stammdaten/sda-sprache";
import { isoZuAnzeige } from "../../lib/datum";
import { DataTable, type SpalteDef } from "./ui/DataTable";

/* ── Angemeldete Benutzerin (Prototyp-Stand-in, wie in der Onboarding-Liste):
   ohne echte Auth bildet Maria Keller die angemeldete Pflegefachkraft ab. „Meine"
   gleicht die zugewiesene PFK dagegen ab. ── */
const MEINE_PFK = "Maria Keller";

/* ── Pflegefachkraft pool for matching (unverändert) ──── */
interface Pflegefachkraft {
  id: string;
  name: string;
  initialen: string;
  /** Sprachcodes aus dem Spitex-Schweiz-Katalog (lib/stammdaten/sda-sprache.ts). */
  sprachen: string[];
  skills: string[];
  regionen: string[];
  kapazitaet: number;
  maxKapazitaet: number;
  bewertung: number;
}

const pflegefachkraefte: Pflegefachkraft[] = [
  { id: "pf1", name: "Sandra Weber", initialen: "SW", sprachen: ["1", "6"] /* Schweizerdeutsch, Englisch */, skills: ["Pflege HKP", "Wundmanagement", "Palliative Care"], regionen: ["ZH", "AG"], kapazitaet: 35, maxKapazitaet: 40, bewertung: 4.8 },
  { id: "pf2", name: "Kathrin Meier", initialen: "KM", sprachen: ["1", "2"] /* Schweizerdeutsch, Französisch */, skills: ["Pflege HKP", "Hauswirtschaft", "Demenzpflege"], regionen: ["ZH", "SG"], kapazitaet: 32, maxKapazitaet: 40, bewertung: 4.6 },
  { id: "pf3", name: "Laura Brunner", initialen: "LB", sprachen: ["1", "3", "6"] /* Schweizerdeutsch, Italienisch, Englisch */, skills: ["Pflege A", "Onkologie", "Psychiatrie"], regionen: ["ZH", "BE"], kapazitaet: 28, maxKapazitaet: 40, bewertung: 4.9 },
  { id: "pf4", name: "Maria Keller", initialen: "MK", sprachen: ["1", "7", "8"] /* Schweizerdeutsch, Portugiesisch, Spanisch */, skills: ["Pflege HKP", "Beratung", "Therapie"], regionen: ["AG", "LU", "ZH"], kapazitaet: 30, maxKapazitaet: 40, bewertung: 4.5 },
  { id: "pf5", name: "Ayşe Yılmaz", initialen: "AY", sprachen: ["14", "1", "6"] /* Türkisch, Schweizerdeutsch, Englisch */, skills: ["Pflege HKP", "Hauswirtschaft", "Gerontologie"], regionen: ["ZH", "SG", "TG"], kapazitaet: 22, maxKapazitaet: 40, bewertung: 4.7 },
  { id: "pf6", name: "Sophie Dubois", initialen: "SD", sprachen: ["2", "1"] /* Französisch, Schweizerdeutsch */, skills: ["Pflege A", "Palliative Care", "Wundmanagement"], regionen: ["BE", "FR", "VD"], kapazitaet: 25, maxKapazitaet: 40, bewertung: 4.4 },
];

/* ── Matching algorithm (unverändert) ──────────────────── */
function getTopMatches(patient: Patient): (Pflegefachkraft & { score: number; reasons: string[] })[] {
  return pflegefachkraefte
    .map((pf) => {
      let score = 0;
      const reasons: string[] = [];
      if (pf.sprachen.includes(sdaSpracheCode(patient.sprache))) {
        score += 40;
        reasons.push(`Spricht ${patient.sprache}`);
      }
      if (pf.regionen.includes(patient.kanton)) {
        score += 30;
        reasons.push(`Region ${patient.kanton}`);
      }
      if (pf.skills.includes(patient.leistungsart)) {
        score += 20;
        reasons.push(`Skill: ${patient.leistungsart}`);
      }
      const capacityRatio = 1 - pf.kapazitaet / pf.maxKapazitaet;
      score += Math.round(capacityRatio * 10);
      if (capacityRatio > 0.25) reasons.push("Kapazität verfügbar");
      return { ...pf, score, reasons };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

/* ══════════════════════════════════════════ */
/* Patient angereichert um die aufgelöste Zuweisung (Seed + Laufzeit-Zuweisung). */
type EnrichedPatient = Patient & { assigned: string | null };

const patientName = (p: Patient) => `${p.nachname}, ${p.vorname}`;
const kuerzelVon = (name: string) => {
  const teile = name.trim().split(/\s+/);
  return (teile.length === 1 ? teile[0].slice(0, 2) : teile[0][0] + teile[teile.length - 1][0]).toUpperCase();
};
const kurznameVon = (name: string) => {
  const teile = name.trim().split(/\s+/);
  return teile.length === 1 ? teile[0] : `${teile[0][0]}. ${teile[teile.length - 1]}`;
};

/* ── Kennzeichen-Regel (gegen die aufgelöste Zuweisung): rot schlägt gelb. Der Grund
   im Klartext dient zugleich der barrierefreien Beschriftung; er ist zusätzlich in den
   Spalten Status / Schweregrad / Zugewiesen sichtbar. ── */
function ableitenKennzeichen(p: EnrichedPatient): { typ: "rot" | "gelb" | null; grund: string } {
  const unzugewiesen = p.assigned === null;
  const nichtAbrechenbar = p.status === "nicht_abrechenbar";
  const kritisch = p.schweregrad === "kritisch";
  if (unzugewiesen && nichtAbrechenbar) return { typ: "rot", grund: "Nicht zugewiesen und nicht abrechenbar" };
  if (kritisch && unzugewiesen) return { typ: "rot", grund: "Kritisch, aber nicht zugewiesen" };
  if (unzugewiesen) return { typ: "gelb", grund: "Keine Pflegefachkraft zugewiesen" };
  if (nichtAbrechenbar) return { typ: "gelb", grund: "Nicht abrechenbar" };
  return { typ: null, grund: "" };
}

/* ── Status-Chips: kombinierbar, mit UND verknüpft. Jede Zahl berechnet. ── */
type StatusChipId = "nicht_zugewiesen" | "nicht_abrechenbar" | "schwer_kritisch" | "gekuendigt";
const STATUS_CHIPS: { id: StatusChipId; label: string; praedikat: (p: EnrichedPatient) => boolean }[] = [
  { id: "nicht_zugewiesen", label: "Nicht zugewiesen", praedikat: p => p.assigned === null },
  { id: "nicht_abrechenbar", label: "Nicht abrechenbar", praedikat: p => p.status === "nicht_abrechenbar" },
  { id: "schwer_kritisch", label: "Schwer oder kritisch", praedikat: p => p.schweregrad === "schwer" || p.schweregrad === "kritisch" },
  { id: "gekuendigt", label: "Gekündigt", praedikat: p => p.status === "gekuendigt" },
];

type Segment = "alle" | "meine";
interface FilterZustand {
  segment: Segment;
  statusChips: Set<StatusChipId>;
  kantone: Set<string>;
  schweregrade: Set<string>;
  sprachen: Set<string>;
  pflegefachkraefte: Set<string>;
  suche: string;
}
const LEERER_FILTER: FilterZustand = { segment: "alle", statusChips: new Set(), kantone: new Set(), schweregrade: new Set(), sprachen: new Set(), pflegefachkraefte: new Set(), suche: "" };

function imSegment(p: EnrichedPatient, segment: Segment): boolean {
  return segment === "alle" || p.assigned === MEINE_PFK;
}
function filterPatienten(list: EnrichedPatient[], f: FilterZustand): EnrichedPatient[] {
  return list.filter(p => {
    if (!imSegment(p, f.segment)) return false;
    for (const chip of STATUS_CHIPS) if (f.statusChips.has(chip.id) && !chip.praedikat(p)) return false;
    if (f.kantone.size > 0 && !f.kantone.has(p.kanton)) return false;
    if (f.schweregrade.size > 0 && !f.schweregrade.has(p.schweregrad)) return false;
    if (f.sprachen.size > 0 && !f.sprachen.has(p.sprache)) return false;
    if (f.pflegefachkraefte.size > 0 && !(p.assigned && f.pflegefachkraefte.has(p.assigned))) return false;
    const q = f.suche.trim().toLowerCase();
    if (q && !(patientName(p).toLowerCase().includes(q) || `${p.vorname} ${p.nachname}`.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.sprache.toLowerCase().includes(q))) return false;
    return true;
  });
}

/* ── Sortierung: jede Spalte; Rangfolge statt Alphabet bei Status und Schweregrad;
   Kennzeichen nach Schwere; Leerwerte immer ans Ende. ── */
type SortKey = "kennzeichen" | "patient" | "status" | "kanton" | "schweregrad" | "sprache" | "zugewiesen";
const SORT_LABEL: Record<SortKey, string> = { kennzeichen: "Kennzeichen", patient: "Patient", status: "Status", kanton: "Kanton", schweregrad: "Schweregrad", sprache: "Sprache", zugewiesen: "Zuweisung" };
const KENN_RANG: Record<string, number> = { rot: 0, gelb: 1 };
const STATUS_RANG: Record<PatientStatus, number> = { aktiv: 0, nicht_abrechenbar: 1, gekuendigt: 2, im_onboarding: 3 };
const SCHWERE_RANG: Record<Schweregrad, number> = { leicht: 0, mittel: 1, schwer: 2, kritisch: 3 };
function leerZuletzt(la: boolean, lb: boolean, f: number, cmp: () => number): number {
  if (la && lb) return 0;
  if (la) return 1;
  if (lb) return -1;
  return f * cmp();
}
function sortPatienten(list: EnrichedPatient[], key: SortKey, dir: "asc" | "desc"): EnrichedPatient[] {
  const f = dir === "asc" ? 1 : -1;
  const kennRang = (p: EnrichedPatient) => { const t = ableitenKennzeichen(p).typ; return t ? KENN_RANG[t] : 2; };
  return [...list].sort((a, b) => {
    switch (key) {
      case "kennzeichen": return f * (kennRang(a) - kennRang(b)) || patientName(a).localeCompare(patientName(b), "de");
      case "status": return f * (STATUS_RANG[a.status] - STATUS_RANG[b.status]) || patientName(a).localeCompare(patientName(b), "de");
      case "kanton": return f * (a.kanton.localeCompare(b.kanton, "de") || patientName(a).localeCompare(patientName(b), "de"));
      case "schweregrad": return leerZuletzt(a.schweregrad === "", b.schweregrad === "", f, () => SCHWERE_RANG[a.schweregrad as Schweregrad] - SCHWERE_RANG[b.schweregrad as Schweregrad]);
      case "sprache": return f * (a.sprache.localeCompare(b.sprache, "de") || patientName(a).localeCompare(patientName(b), "de"));
      case "zugewiesen": return leerZuletzt(a.assigned === null, b.assigned === null, f, () => kurznameVon(a.assigned!).localeCompare(kurznameVon(b.assigned!), "de"));
      case "patient": default: return f * patientName(a).localeCompare(patientName(b), "de");
    }
  });
}

/* ── Mehrfachauswahl-Dropdown (lokal; kein neues Shared-/shadcn-Bauteil). ── */
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
        <div className="absolute z-50" style={{ top: "calc(100% + 6px)", left: 0, minWidth: 200, maxHeight: 320, overflowY: "auto", padding: 6, background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-overlay)" }}>
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

/* ══════════════════════════════════════════ */
export function ZuteilungPage() {
  const [filter, setFilter] = useState<FilterZustand>(LEERER_FILTER);
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "kennzeichen", dir: "asc" });
  const [selectedPatient, setSelectedPatient] = useState<EnrichedPatient | null>(null);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [confirmToast, setConfirmToast] = useState<string | null>(null);
  const toggleSort = (key: SortKey) => setSort(s => s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" });

  // Gemeinsamer Bestand — Patienten im Onboarding sind nicht enthalten
  const allPatients = usePatienten();

  const enriched = useMemo<EnrichedPatient[]>(() => allPatients.map(p => ({
    ...p,
    assigned: assignments[p.id] || (p.pflegefachkraft !== "—" ? p.pflegefachkraft : null),
  })), [allPatients, assignments]);

  /* ── Filter-Setter ── */
  const setSegment = (segment: Segment) => setFilter(f => ({ ...f, segment }));
  const setSuche = (suche: string) => setFilter(f => ({ ...f, suche }));
  const toggleChip = (id: StatusChipId) => setFilter(f => { const s = new Set(f.statusChips); s.has(id) ? s.delete(id) : s.add(id); return { ...f, statusChips: s }; });
  const toggleKanton = (k: string) => setFilter(f => { const s = new Set(f.kantone); s.has(k) ? s.delete(k) : s.add(k); return { ...f, kantone: s }; });
  const toggleSchweregrad = (g: string) => setFilter(f => { const s = new Set(f.schweregrade); s.has(g) ? s.delete(g) : s.add(g); return { ...f, schweregrade: s }; });
  const toggleSprache = (sp: string) => setFilter(f => { const s = new Set(f.sprachen); s.has(sp) ? s.delete(sp) : s.add(sp); return { ...f, sprachen: s }; });
  const togglePfk = (n: string) => setFilter(f => { const s = new Set(f.pflegefachkraefte); s.has(n) ? s.delete(n) : s.add(n); return { ...f, pflegefachkraefte: s }; });
  const resetFilter = () => setFilter(f => ({ ...LEERER_FILTER, suche: f.suche }));

  /* ── Optionen aus den Daten ── */
  const kantonOptionen = useMemo(() => [...new Set(enriched.map(p => p.kanton))].sort().map(k => ({ value: k, label: k })), [enriched]);
  const spracheOptionen = useMemo(() => [...new Set(enriched.map(p => p.sprache))].sort((a, b) => a.localeCompare(b, "de")).map(s => ({ value: s, label: s })), [enriched]);
  const schweregradOptionen = useMemo(() => {
    const vorhanden = new Set(enriched.map(p => p.schweregrad).filter(Boolean) as Schweregrad[]);
    return (Object.keys(SCHWERE_RANG) as Schweregrad[]).filter(g => vorhanden.has(g)).map(g => ({ value: g, label: schweregradConfig[g].label }));
  }, [enriched]);
  const pfkOptionen = useMemo(() => {
    const count: Record<string, number> = {};
    enriched.forEach(p => { if (p.assigned) count[p.assigned] = (count[p.assigned] || 0) + 1; });
    pflegefachkraefte.forEach(pf => { if (!(pf.name in count)) count[pf.name] = 0; });
    return Object.entries(count).sort(([a], [b]) => a.localeCompare(b, "de")).map(([name, n]) => ({ value: name, label: `${name} (${n})` }));
  }, [enriched]);

  /* ── Ableitungen ── */
  const segmentBasis = useMemo(() => enriched.filter(p => imSegment(p, filter.segment)), [enriched, filter.segment]);
  const chipCounts = useMemo(() => {
    const r = {} as Record<StatusChipId, number>;
    for (const chip of STATUS_CHIPS) r[chip.id] = segmentBasis.filter(chip.praedikat).length;
    return r;
  }, [segmentBasis]);
  const filtered = useMemo(() => filterPatienten(enriched, filter), [enriched, filter]);
  const sorted = useMemo(() => sortPatienten(filtered, sort.key, sort.dir), [filtered, sort]);

  const filterTags = useMemo(() => {
    const t: { key: string; label: string; entfernen: () => void }[] = [];
    STATUS_CHIPS.forEach(chip => { if (filter.statusChips.has(chip.id)) t.push({ key: `s-${chip.id}`, label: chip.label, entfernen: () => toggleChip(chip.id) }); });
    filter.kantone.forEach(k => t.push({ key: `k-${k}`, label: `Kanton: ${k}`, entfernen: () => toggleKanton(k) }));
    filter.schweregrade.forEach(g => t.push({ key: `g-${g}`, label: `Schweregrad: ${schweregradConfig[g as Schweregrad].label}`, entfernen: () => toggleSchweregrad(g) }));
    filter.sprachen.forEach(sp => t.push({ key: `sp-${sp}`, label: `Sprache: ${sp}`, entfernen: () => toggleSprache(sp) }));
    filter.pflegefachkraefte.forEach(n => t.push({ key: `p-${n}`, label: `Pflegefachkraft: ${n}`, entfernen: () => togglePfk(n) }));
    return t;
  }, [filter]);

  const handleConfirmMatch = (patient: EnrichedPatient, pf: Pflegefachkraft) => {
    setAssignments(prev => ({ ...prev, [patient.id]: pf.name }));
    setConfirmToast(`${pf.name} wurde ${patient.nachname}, ${patient.vorname} zugewiesen`);
    setTimeout(() => setConfirmToast(null), 3000);
  };

  const topMatches = selectedPatient ? getTopMatches(selectedPatient) : [];

  /* ── Zell-Renderer ── */
  const kennzeichenIcon = (p: EnrichedPatient) => {
    const k = ableitenKennzeichen(p);
    if (!k.typ) return null;
    // Form-Unterschied unabhängig von Farbe: Rot gefüllt, Gelb offen.
    return <AlertTriangle role="img" aria-label={k.grund} style={{ width: 15, height: 15, flexShrink: 0, color: k.typ === "rot" ? "var(--status-danger)" : "var(--status-warning)", fill: k.typ === "rot" ? "var(--status-danger)" : "none" }} />;
  };
  const statusZelle = (p: EnrichedPatient) => {
    const label = statusConfig[p.status].label;
    const pill = p.status === "gekuendigt" || p.status === "nicht_abrechenbar";
    // Farbregel: nur die Abweichung ist farbig. „Aktiv" wird stiller Text.
    return pill
      ? <span style={{ padding: "2px 10px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", whiteSpace: "nowrap", background: "var(--status-danger-bg)", color: "var(--status-danger)" }}>{label}</span>
      : <span style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{label}</span>;
  };
  const kantonZelle = (p: EnrichedPatient) => <span style={{ fontSize: "var(--text-small)", color: "var(--text-primary)", whiteSpace: "nowrap" }}>{p.kanton}</span>;
  const schweregradZelle = (p: EnrichedPatient) => {
    if (!p.schweregrad) return null; // "" = nicht erhoben: kein Platzhalter
    const label = schweregradConfig[p.schweregrad].label;
    // Nur „Kritisch" bleibt eine Pille; die übrigen Stufen werden stiller Text.
    return p.schweregrad === "kritisch"
      ? <span style={{ padding: "2px 10px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", whiteSpace: "nowrap", background: "var(--status-danger-bg)", color: "var(--status-danger)" }}>{label}</span>
      : <span style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{label}</span>;
  };
  const spracheZelle = (p: EnrichedPatient) => <span style={{ fontSize: "var(--text-small)", color: "var(--text-primary)", overflowWrap: "anywhere" }}>{p.sprache}</span>;
  const zugewiesenZelle = (p: EnrichedPatient) => p.assigned === null ? (
    // Wie in den übrigen Listen: Aktion „Zuweisen" statt Warntext. Öffnet die Matching-Vorschläge.
    <button type="button" onClick={e => { e.stopPropagation(); setSelectedPatient(p); }} className="ui-fokusring inline-flex items-center cursor-pointer" style={{ gap: 4, padding: "3px 10px", borderRadius: "var(--radius-pill)", background: "transparent", border: "var(--border-thin) solid var(--border-default)", fontSize: "0.75rem", fontWeight: "var(--weight-medium)", color: "var(--text-secondary)", fontFamily: "inherit" }}>
      <Plus style={{ width: 12, height: 12 }} /> Zuweisen
    </button>
  ) : (
    <div className="flex items-center" style={{ gap: 6, minWidth: 0 }}>
      <span className="shrink-0 flex items-center justify-center" style={{ width: 22, height: 22, borderRadius: "var(--radius-pill)", background: "var(--bg-secondary)" }}>
        <span style={{ fontSize: 8, fontWeight: "var(--weight-semibold)", color: "var(--text-secondary)" }}>{kuerzelVon(p.assigned)}</span>
      </span>
      <span style={{ fontSize: "var(--text-small)", color: "var(--text-primary)", whiteSpace: "nowrap" }}>{kurznameVon(p.assigned)}</span>
    </div>
  );

  const spalten: SpalteDef<EnrichedPatient>[] = [
    { id: "kennzeichen", label: "", festBreitePx: 28, align: "center", sortierbar: true, ausKarte: true, render: kennzeichenIcon },
    { id: "patient", label: "Patient", minCh: 20, maxSpur: "35ch", align: "left", sortierbar: true, ausKarte: true,
      render: p => <span style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", overflowWrap: "anywhere" }}>{patientName(p)}</span> },
    { id: "status", label: "Status", minCh: 16, maxSpur: "20ch", align: "left", sortierbar: true, render: statusZelle },
    { id: "kanton", label: "Kanton", minCh: 9, maxSpur: "10ch", abwerfRang: 2, align: "left", sortierbar: true, render: kantonZelle },
    { id: "schweregrad", label: "Schweregrad", minCh: 13, maxSpur: "14ch", align: "left", sortierbar: true, render: schweregradZelle },
    { id: "sprache", label: "Sprache", minCh: 12, maxSpur: "18ch", abwerfRang: 1, align: "left", sortierbar: true, render: spracheZelle },
    { id: "zugewiesen", label: "Zugewiesen", minCh: 13, maxSpur: "16ch", align: "left", sortierbar: true, render: zugewiesenZelle },
  ];

  const zeilenHintergrund = (p: EnrichedPatient): string | undefined => {
    const t = ableitenKennzeichen(p).typ;
    return t === "rot" ? "color-mix(in srgb, var(--status-danger-bg), transparent 40%)"
      : t === "gelb" ? "color-mix(in srgb, var(--status-warning-bg), transparent 68%)"
      : undefined;
  };
  const zeilenAkzent = (p: EnrichedPatient): string | undefined => selectedPatient?.id === p.id ? "var(--brand-primary)" : undefined;
  const karteTitel = (p: EnrichedPatient) => (
    <div className="flex items-center" style={{ gap: 8, width: "100%", minWidth: 0 }}>
      {kennzeichenIcon(p)}
      <span className="truncate" style={{ flex: 1, minWidth: 0, fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>{patientName(p)}</span>
    </div>
  );

  const leerImBestand = allPatients.length === 0;
  const keineTreffer = sorted.length === 0;
  const suchButton = { background: "transparent", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-pill)", padding: "5px 12px", fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", color: "var(--text-secondary)", fontFamily: "inherit", cursor: "pointer" } as const;

  return (
    <>
      {/* ── Page Header ──────────────────── */}
      <div className="px-4 md:px-8 pt-7 pb-0">
        <div>
          <h2 className="text-foreground">Management Zuteilung</h2>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Patienten an Pflegefachkräfte zuweisen — KI-unterstütztes Matching
          </p>
        </div>
      </div>

      {/* ── Main content ─────────────────── */}
      <div className="px-4 md:px-8 pt-5 pb-10">
        <div className="flex flex-col xl:flex-row gap-5">

          {/* ── Left: Patient list (DataTable) ──────── */}
          <div className="flex-1 min-w-0">
            {leerImBestand ? (
              <p style={{ fontSize: "var(--text-body)", color: "var(--text-secondary)", maxWidth: 560 }}>
                Sobald Patienten den Onboarding-Abschluss erreichen, erscheinen sie hier zur Zuteilung.
              </p>
            ) : (
              <>
                {/* Steuerleiste: Suche, Segment, Auswahlfelder */}
                <div className="flex items-center flex-wrap" style={{ gap: 8, marginBottom: "var(--space-2)" }}>
                  <div className="flex items-center" style={{ flex: "1 1 220px", maxWidth: 300, gap: "var(--space-2)", padding: "7px 14px", borderRadius: 8, background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)" }}>
                    <Search style={{ width: 14, height: 14, color: "var(--text-tertiary)", flexShrink: 0 }} />
                    <input value={filter.suche} onChange={e => setSuche(e.target.value)} placeholder="Patienten suchen…" className="flex-1 bg-transparent outline-none" style={{ fontSize: "var(--text-small)", color: "var(--text-primary)", minWidth: 0 }} />
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

                  <AuswahlDropdown label="Kanton" optionen={kantonOptionen} ausgewaehlt={filter.kantone} onToggle={toggleKanton} />
                  <AuswahlDropdown label="Schweregrad" optionen={schweregradOptionen} ausgewaehlt={filter.schweregrade} onToggle={toggleSchweregrad} />
                  <AuswahlDropdown label="Sprache" optionen={spracheOptionen} ausgewaehlt={filter.sprachen} onToggle={toggleSprache} />
                  <AuswahlDropdown label="Pflegefachkraft" optionen={pfkOptionen} ausgewaehlt={filter.pflegefachkraefte} onToggle={togglePfk} />
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
                <div className="flex items-center flex-wrap" style={{ gap: 6, minHeight: 24, marginBottom: "var(--space-3)" }}>
                  {filterTags.length === 0 ? (
                    <span style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>
                      {filter.segment === "meine" ? "Meine" : "Alle"} Patienten · sortiert nach {SORT_LABEL[sort.key]}
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

                {keineTreffer ? (
                  <div style={{ background: "var(--bg-elevated)", borderRadius: "var(--radius-card)", border: "var(--border-thin) solid var(--border-default)", padding: "3rem 1.5rem", textAlign: "center" }}>
                    <p style={{ fontSize: "var(--text-body)", color: "var(--text-secondary)", marginBottom: 14 }}>
                      {filter.suche.trim() ? <>Keine Patienten für „{filter.suche.trim()}“.</> : "Keine Patienten mit diesen Filtern."}
                    </p>
                    <div className="inline-flex items-center flex-wrap justify-center" style={{ gap: 8 }}>
                      {filter.suche.trim() && <button type="button" onClick={() => setSuche("")} style={suchButton}>Suche löschen</button>}
                      {filterTags.length > 0 && <button type="button" onClick={resetFilter} style={suchButton}>Filter zurücksetzen</button>}
                    </div>
                  </div>
                ) : (
                  <DataTable<EnrichedPatient>
                    spalten={spalten}
                    zeilen={sorted}
                    zeilenKey={p => p.id}
                    onZeileKlick={p => setSelectedPatient(p)}
                    zeilenHintergrund={zeilenHintergrund}
                    zeilenAkzent={zeilenAkzent}
                    sort={sort}
                    onSort={k => toggleSort(k as SortKey)}
                    karteTitel={karteTitel}
                    containerHaltepunkte
                    karteAbPx={500}
                    fusszeile={<><span>{filtered.length} von {allPatients.length} {allPatients.length === 1 ? "Patient" : "Patienten"}</span><span>Stand: {isoZuAnzeige(PATIENTEN_BEZUGSDATUM_ISO)}</span></>}
                    leerText="Keine Patienten mit diesen Filtern."
                  />
                )}
              </>
            )}
          </div>

          {/* ── Right: Matching panel (unverändert) ────── */}
          <div className="w-full xl:w-[380px] shrink-0">
            <div className="bg-card rounded-2xl border border-border overflow-hidden sticky top-4">
              <div className="px-5 py-4 border-b border-border-light">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary-light flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div>
                    <h5 className="text-foreground">Matching Algorithmus</h5>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Top-3 Empfehlungen</p>
                  </div>
                </div>
              </div>

              {selectedPatient ? (
                <div className="p-4 space-y-3">
                  <div className="p-3 rounded-xl bg-primary-light/50 border border-primary/10">
                    <div className="text-[11px] text-primary uppercase tracking-wider mb-1" style={{ fontWeight: 500 }}>Ausgewählter Patient</div>
                    <div className="text-[14px] text-foreground" style={{ fontWeight: 600 }}>
                      {selectedPatient.nachname}, {selectedPatient.vorname}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground flex-wrap">
                      <span>{selectedPatient.kanton}</span>
                      <span>·</span>
                      <span>{selectedPatient.sprache}</span>
                      <span>·</span>
                      <span>{selectedPatient.leistungsart}</span>
                    </div>
                  </div>

                  {topMatches.map((match, idx) => {
                    const isAssigned = assignments[selectedPatient.id] === match.name;
                    const capacityPct = (match.kapazitaet / match.maxKapazitaet) * 100;
                    const capacityColor =
                      capacityPct >= 90 ? "bg-error" : capacityPct >= 75 ? "bg-warning" : "bg-success";

                    return (
                      <div
                        key={match.id}
                        className={`p-3.5 rounded-xl border transition-all ${
                          isAssigned
                            ? "border-success/30 bg-success-light"
                            : idx === 0
                            ? "border-primary/20 bg-primary-light/30"
                            : "border-border hover:border-primary/20"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                              isAssigned ? "bg-success-medium" : idx === 0 ? "bg-primary text-primary-foreground" : "bg-muted"
                            }`}>
                              {isAssigned ? (
                                <CheckCircle2 className="w-[18px] h-[18px] text-success" />
                              ) : (
                                <span className={`text-[11px] ${idx === 0 ? "text-primary-foreground" : "text-muted-foreground"}`} style={{ fontWeight: 600 }}>
                                  {match.initialen}
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[13px] text-foreground" style={{ fontWeight: 500 }}>{match.name}</span>
                                {idx === 0 && !isAssigned && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary" style={{ fontWeight: 600 }}>
                                    TOP MATCH
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-muted-foreground">
                                Score: {match.score}%
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3 h-3 ${s <= Math.round(match.bewertung) ? "text-warning fill-warning" : "text-muted-foreground/20"}`}
                              />
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1.5 mb-3">
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <Globe className="w-3 h-3 shrink-0" />
                            <span>{match.sprachen.map(sdaSpracheLabel).join(", ")}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <Briefcase className="w-3 h-3 shrink-0" />
                            <span>{match.skills.join(", ")}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span>{match.regionen.join(", ")}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${capacityColor}`} style={{ width: `${capacityPct}%` }} />
                          </div>
                          <span className="text-[11px] text-muted-foreground shrink-0" style={{ fontWeight: 500 }}>
                            {match.kapazitaet}/{match.maxKapazitaet}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1 mb-3">
                          {match.reasons.map((r, ri) => (
                            <span key={ri} className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground" style={{ fontWeight: 500 }}>
                              {r}
                            </span>
                          ))}
                        </div>

                        {isAssigned ? (
                          <div className="flex items-center gap-1.5 text-[12px] text-success" style={{ fontWeight: 500 }}>
                            <CheckCircle2 className="w-4 h-4" />
                            Zugewiesen
                          </div>
                        ) : (
                          <button
                            onClick={() => handleConfirmMatch(selectedPatient, match)}
                            className={`w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[12px] transition-all ${
                              idx === 0
                                ? "bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm"
                                : "border border-border bg-card text-foreground hover:bg-secondary/60"
                            }`}
                            style={{ fontWeight: 500 }}
                          >
                            {idx === 0 ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                Top Match bestätigen
                              </>
                            ) : (
                              <>
                                <UserPlus className="w-3.5 h-3.5" />
                                Zuweisen
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
                    <Users className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <p className="text-[13px] text-foreground" style={{ fontWeight: 500 }}>
                    Patient auswählen
                  </p>
                  <p className="text-[12px] text-muted-foreground mt-1 max-w-[240px] mx-auto">
                    Klicken Sie auf einen Patienten in der Tabelle, um Matching-Vorschläge zu sehen.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Toast notification ───────────── */}
      {confirmToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-foreground text-background shadow-2xl animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
          <span className="text-[13px]" style={{ fontWeight: 500 }}>{confirmToast}</span>
        </div>
      )}
    </>
  );
}
