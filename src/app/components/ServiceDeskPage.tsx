import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { Plus, X, AlertTriangle, Check, ArrowLeft, Send, Sparkles, Search, ChevronDown, ExternalLink, Pencil } from "lucide-react";
import { usePendenzen, aenderePendenz, pendenzenNeuLesen, ergaenzeVerlauf } from "../../lib/pendenzen/store";
import { type VerlaufEintrag, type VerlaufTyp, getUnifiedEntries, entryBetreff, entryPersonName, CURRENT_USER, type UnifiedEntry } from "../../lib/mocks/service-desk-unified";
import { personLink, personArtLabel, type PersonenBezug } from "../../lib/mocks/personen-aufloesung";
import { type Person } from "../../lib/mocks/workflow-tasks";
import { pendenzTypen, type PendenzTyp } from "../../types/pendenz";
import { DataTable, useFensterBreite, type SpalteDef } from "./ui/DataTable";
import { NeuePendenzDialog } from "./pendenzen/NeuePendenzDialog";
import { isoZuAnzeige, formatTagMonat, isoZuDate } from "../../lib/datum";
import { PersonenAuswahl, type PersonOption } from "./ui/PersonenAuswahl";
import { Popover, PopoverAnchor, PopoverContent } from "./ui/popover";
import { DateField } from "./form/DateField";
import { getDiplomierte } from "../../lib/betreuung/diplomierte";
import { patientenSeed } from "./patientData";
import { angehoerigeSeed } from "./angehoerigeData";
import { useCurrentRole } from "../auth";
import { AnsichtsUmschalter } from "./pendenzen/AnsichtsUmschalter";
import { AnsichtErstellenDialog } from "./pendenzen/AnsichtErstellenDialog";
import { useListenansichten, STANDARD_ANSICHT, ALLE_ANSICHT, findeAnsicht, ansichtFiltern, filterZusammenfassung, type AnsichtFilter } from "../../lib/pendenzen/listenansichten";
import { AnnaPendenzVorschlag } from "../anna/AnnaPendenzVorschlag";
import { AnnaDemoMockModal } from "../anna/AnnaDemoMockModal";
import { toast } from "sonner";

const TODAY = "2026-03-03";

/** TODAY plus n Tage als ISO — dieselbe Zeitbasis wie die Fälligkeits-Chips. */
function inTagen(n: number): string {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

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
/* VerlaufTyp und VerlaufEintrag leben in der Datenschicht (service-desk-unified),
   weil der Verlauf zum Datensatz gehört und nicht zu dieser Ansicht. */
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

/* ── Zugehörigkeit ist keine eigene Steuerung mehr: „Mir zugewiesen" und „Alle
   Pendenzen" sind Systemansichten des Ansichtsumschalters (lib/pendenzen/
   listenansichten). Der frühere Segmentumschalter entfällt ersatzlos. ── */

function istNichtZugewiesen(e: UnifiedEntry): boolean {
  const n = e.verantwortlich?.name?.trim();
  const i = e.verantwortlich?.initialen?.trim();
  return !n || n === "Nicht zugewiesen" || !i;
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

/* ── Ad-hoc-Filterzustand: eine Struktur an einem Ort. Er läuft NACH dem
   Ansichtsfilter und kann die Menge nur weiter einschränken — es gibt keinen
   Weg, über die Steuerleiste Einträge zurückzuholen, die die Ansicht
   ausgeschlossen hat. ── */
interface FilterZustand {
  statusChips: Set<StatusChipId>;
  arten: Set<PendenzTyp>;
  zustaendige: Set<string>;
  suche: string;
}
const LEERER_FILTER: FilterZustand = { statusChips: new Set(), arten: new Set(), zustaendige: new Set(), suche: "" };

/** Ob überhaupt ein Ad-hoc-Filter gesetzt ist (steuert Marke und Rückweg). */
function istGefiltert(f: FilterZustand): boolean {
  return f.statusChips.size > 0 || f.arten.size > 0 || f.zustaendige.size > 0 || f.suche.trim().length > 0;
}

function filterEntries(list: UnifiedEntry[], f: FilterZustand): UnifiedEntry[] {
  return list.filter(e => {
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

  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "faellig", dir: "asc" });
  const [draftComment, setDraftComment] = useState("");
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());
  const prevRole = useRef(role);

  /** `push` legt einen Verlaufseintrag an — nötig, damit „zurück" aus dem Detail
   *  wieder auf der Liste MIT Ansicht und Filtern landet. */
  function setParam(updates: Record<string, string | null>, opts?: { push?: boolean }) {
    const next = new URLSearchParams(searchParams);
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    setSearchParams(next, { replace: !opts?.push });
  }

  /* ── Ansicht und Ad-hoc-Filter stehen in der URL, nicht im Zustand. Nur so
     überstehen sie ein Neuladen und den Rückweg aus dem Detail — und da
     Nutzerinnen keine eigenen Ansichten speichern können, ist der erhaltene
     Ad-hoc-Filter ihr einziger Ersatz dafür. ── */
  const ansichten = useListenansichten();
  const ansichtId = searchParams.get("ansicht") || STANDARD_ANSICHT;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const ansicht = useMemo(() => findeAnsicht(ansichtId), [ansichtId, ansichten]);

  /* Ansichten anlegen ist Sache der Administration. Die Rollenquelle des Repos
     ist `useCurrentRole`; „Administration" ist dort `backoffice`
     (ROLE_DESCRIPTIONS). Für alle anderen steht der Ausgang nicht im DOM —
     Ausgrauen wäre falsch, die Fähigkeit ist nichts zum Anfordern. */
  const darfAnsichtErstellen = role === "backoffice";
  const [erstellenOffen, setErstellenOffen] = useState(false);

  const filter = useMemo<FilterZustand>(() => {
    const liste = (k: string) => (searchParams.get(k) || "").split(",").filter(Boolean);
    return {
      statusChips: new Set(liste("chips") as StatusChipId[]),
      arten: new Set(liste("art") as PendenzTyp[]),
      zustaendige: new Set(liste("zust").map(decodeURIComponent)),
      suche: searchParams.get("q") || "",
    };
  }, [searchParams]);

  const hatAdhocFilter = istGefiltert(filter);

  /** Ein Wert in einer Mengen-Kennung umschalten (Chips, Kategorie, Zuständig). */
  const toggleParam = (k: string, wert: string) => {
    const next = new Set((searchParams.get(k) || "").split(",").filter(Boolean));
    if (next.has(wert)) next.delete(wert); else next.add(wert);
    setParam({ [k]: [...next].join(",") || null });
  };

  /* ── Scrollposition der Liste. Sie gehört zum wiederhergestellten Zustand:
     wer aus einer langen gefilterten Liste in ein Detail springt, will danach
     wieder an derselben Stelle stehen. Ablage in der Sitzung, damit sie auch
     ein Neuladen übersteht. ── */
  const listeRef = useRef<HTMLDivElement>(null);
  const SCROLL_SCHLUESSEL = "pendenzen-scroll";
  const merkeScroll = () => {
    if (listeRef.current) sessionStorage.setItem(SCROLL_SCHLUESSEL, String(listeRef.current.scrollTop));
  };
  useEffect(() => {
    if (selectedId) return; // erst beim Zurückkehren auf die Liste
    const wert = sessionStorage.getItem(SCROLL_SCHLUESSEL);
    if (wert && listeRef.current) listeRef.current.scrollTop = Number(wert) || 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  /** Zurück zur Ansicht: alle Ad-hoc-Filter fallen, die Ansicht bleibt. */
  const zurueckZurAnsicht = () => setParam({ chips: null, art: null, zust: null, q: null });

  /** Ansicht wechseln: die Ad-hoc-Filter der vorigen Ansicht gelten nicht weiter. */
  const waehleAnsicht = (id: string) => setParam({ ansicht: id, chips: null, art: null, zust: null, q: null, id: null });

  // Rollenwechsel: Auswahl, Bulk und Filter zurücksetzen
  useEffect(() => {
    if (prevRole.current !== role) {
      prevRole.current = role;
      setParam({ id: null, chips: null, art: null, zust: null, q: null });
      setBulkSelected(new Set());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const isBulkMode = role === "backoffice" || role === "management";

  // datenVersion: erhöht sich nach dem Anlegen einer Pendenz — die Liste liest
  // den Bestand neu, ohne Neuladen der Seite (Lauf «Pendenzen erstellen»).
  const [datenVersion, setDatenVersion] = useState(0);
  const [neueOffen, setNeueOffen] = useState(false);
  const [zuletztNeuId, setZuletztNeuId] = useState<string | null>(null);
  // Der Bestand liegt im Modul (lib/pendenzen/store), nicht mehr in dieser
  // Komponente: eine Änderung hier wirkt auch in der linken Spalte des
  // Onboardings und im Marker des Formularabschnitts.
  const entries = usePendenzen();
  const allEntries = entries;

  /* ── Filterkette: getUnifiedEntries() → Ansichtsfilter → Ad-hoc-Filter →
     Sortierung. Der Ansichtsfilter steht zuerst und ist die einzige Stelle, an
     der die Ansicht wirkt; alles Weitere kann nur noch einschränken. Eine
     unbekannte Ansicht liefert nichts — sie ist gesperrt, nicht „alles". ── */
  const ansichtBasis = useMemo(
    () => (ansicht ? ansichtFiltern(entries, ansicht.filter) : []),
    [entries, ansicht],
  );
  const chipCounts = useMemo(() => {
    const r = {} as Record<StatusChipId, number>;
    for (const chip of STATUS_CHIPS) r[chip.id] = ansichtBasis.filter(chip.praedikat).length;
    return r;
  }, [ansichtBasis]);

  /** Trefferzahl je Ansicht für das Menü — nur der Ansichtsfilter, ohne Ad-hoc. */
  const ansichtZaehler = useMemo(() => {
    const r: Record<string, number> = {};
    for (const a of ansichten) r[a.id] = ansichtFiltern(entries, a.filter).length;
    return r;
  }, [entries, ansichten]);

  const gefiltert = useMemo(() => filterEntries(ansichtBasis, filter), [ansichtBasis, filter]);
  // Die geöffnete Pendenz bleibt sichtbar, auch wenn sie durch eine Bearbeitung aus
  // dem aktiven Filter fällt — bis der Detailbereich geschlossen wird.
  const filtered = useMemo(() => {
    if (!selectedId || gefiltert.some(e => e.id === selectedId)) return gefiltert;
    const sel = entries.find(e => e.id === selectedId);
    return sel ? [...gefiltert, sel] : gefiltert;
  }, [gefiltert, selectedId, entries]);
  const sorted = useMemo(() => sortEntries(filtered, sort.key, sort.dir), [filtered, sort]);

  // Auswahlfelder bieten nur, was die Ansicht überhaupt enthält — sonst liesse
  // sich dort etwas wählen, das der Ansichtsfilter ohnehin ausschliesst.
  const alleArten = useMemo(() => {
    const vorhanden = new Set(ansichtBasis.map(e => e.pendenzTyp));
    return (Object.keys(pendenzTypen) as PendenzTyp[]).filter(t => vorhanden.has(t));
  }, [ansichtBasis]);
  const alleZustaendige = useMemo(
    () => [...new Set(ansichtBasis.map(e => e.verantwortlich.name))].filter(n => n && n !== "Nicht zugewiesen").sort((a, b) => a.localeCompare(b, "de")),
    [ansichtBasis],
  );

  const selected = useMemo(() => {
    if (!selectedId) return null;
    return entries.find(e => e.id === selectedId) || null;
  }, [selectedId, entries]);

  /**
   * Was gerade auf dem Bildschirm steht, als `AnsichtFilter`: der Ansichtsfilter
   * plus das, was die Ad-hoc-Steuerung davon ausdrücken kann.
   *
   * `AnsichtFilter` bleibt unverändert (Vorbedingung), und darum passt nicht
   * alles hinein — die Grenzen sind bewusst und im Bericht benannt: die Suche,
   * der Chip „Nicht zugewiesen" und eine Mehrfachauswahl von Zuständigen haben
   * dort kein Gegenstück und werden NICHT gespeichert.
   */
  const neuerAnsichtFilter = useMemo<AnsichtFilter>(() => {
    const f: AnsichtFilter = { ...(ansicht?.filter ?? {}) };
    if (filter.arten.size > 0) f.pendenzTypen = [...filter.arten];
    // Zuständig: der Ansichtsfilter kennt genau eine Person, als Initialen.
    if (filter.zustaendige.size === 1) {
      const name = [...filter.zustaendige][0];
      const init = entries.find(e => e.verantwortlich.name === name)?.verantwortlich.initialen;
      if (init) f.verantwortlich = init;
    }
    if (filter.statusChips.has("in_bearbeitung")) f.status = ["in_bearbeitung"];
    else if (filter.statusChips.has("abgeschlossen")) f.status = ["erledigt"];
    // Fristen-Chips werden zum Datum, damit die Ansicht später dasselbe meint.
    if (filter.statusChips.has("ueberfaellig")) f.faelligBis = TODAY;
    else if (filter.statusChips.has("diese_woche")) f.faelligBis = inTagen(7);
    return f;
  }, [ansicht, filter, entries]);

  /* Auswahl im Erstellen-Dialog: der GESAMTE Bestand, nicht die aktive Ansicht —
     eine neue Linse soll sich nicht auf die gerade offene beschränken müssen. */
  const alleArtenGesamt = useMemo(() => {
    const vorhanden = new Set(entries.map(e => e.pendenzTyp));
    return (Object.keys(pendenzTypen) as PendenzTyp[]).filter(t => vorhanden.has(t));
  }, [entries]);
  const allePersonen = useMemo(() => {
    const m = new Map<string, string>();
    for (const e of entries) {
      if (!istNichtZugewiesen(e)) m.set(e.verantwortlich.initialen, e.verantwortlich.name);
    }
    return [...m].map(([initialen, name]) => ({ initialen, name })).sort((a, b) => a.name.localeCompare(b.name, "de"));
  }, [entries]);

  const setSuche = (suche: string) => setParam({ q: suche || null });
  const toggleChip = (id: StatusChipId) => toggleParam("chips", id);
  const toggleArt = (t: PendenzTyp) => toggleParam("art", t);
  const toggleZustaendig = (n: string) => toggleParam("zust", encodeURIComponent(n));
  const toggleSort = (key: string) => setSort(s => s.key === key ? { key: key as SortKey, dir: s.dir === "asc" ? "desc" : "asc" } : { key: key as SortKey, dir: "asc" });

  const filterTags = useMemo(() => {
    const t: { key: string; label: string; entfernen: () => void }[] = [];
    STATUS_CHIPS.forEach(chip => { if (filter.statusChips.has(chip.id)) t.push({ key: `s-${chip.id}`, label: chip.label, entfernen: () => toggleChip(chip.id) }); });
    filter.arten.forEach(art => t.push({ key: `a-${art}`, label: `Kategorie: ${pendenzTypen[art]?.label || art}`, entfernen: () => toggleArt(art) }));
    filter.zustaendige.forEach(n => t.push({ key: `z-${n}`, label: `Zuständig: ${n}`, entfernen: () => toggleZustaendig(n) }));
    return t;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  // Schreibt in den Datensatz, nicht in den Ansichtszustand. Aufrufe erfolgen
  // ausschliesslich bei einer tatsaechlichen Aenderung.
  const pushVerlauf = (id: string, eintrag: VerlaufEintrag) => ergaenzeVerlauf(id, eintrag);

  // Ein Schreibpfad für jede Feldänderung: Overlay setzen + genau einen Verlaufseintrag.
  // Keine Koaleszenz mehr — Modusfelder werden gesammelt gesichert (je Feld ein Eintrag),
  // Status/Zuständigkeit sind Einzelhandlungen (je Wechsel ein Eintrag).
  const aendereFeld = (id: string, a: Aenderung, by = BEARBEITER) => {
    if (a.alt === a.neu) return;
    aenderePendenz(id, a.patch);
    pushVerlauf(id, { typ: a.typ ?? "feld", by, at: BEARBEITET_AM, feld: a.feld, feldLabel: a.feldLabel, alt: a.alt, neu: a.neu, freitext: a.freitext });
  };

  // Statuswechsel: Sonderfall (Signatur bleibt für Bulk/Demo erhalten).
  // Jeder Wechsel läuft über eine Bestätigung (DetailPanel-Bestätigungszeile bzw.
  // Rückfrage bei Sammelaktionen); der Verlaufseintrag hält alt→neu, Person und
  // Zeitpunkt fest. Eine Abschlussbemerkung wird als eigener Verlaufseintrag geführt.
  const handleStatusChange = (id: string, newStatus: string, by = BEARBEITER, abschlussBemerkung?: string) => {
    const alt = entries.find(e => e.id === id)?.status ?? "offen";
    aendereFeld(id, { feld: "status", feldLabel: "Status", patch: { status: newStatus as UnifiedEntry["status"] }, alt: STATUS_LABEL[alt] || alt, neu: STATUS_LABEL[newStatus] || newStatus, typ: "status" }, by);
    if (abschlussBemerkung) pushVerlauf(id, { typ: "kommentar", text: `Abschlussbemerkung: ${abschlussBemerkung}`, by, at: BEARBEITET_AM });
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
    // Kurze Rückfrage statt Bestätigungszeile: Sammelaktion ist ein Statuswechsel.
    if (!window.confirm(`${bulkSelected.size} Pendenzen auf «${bulkAction?.isDemoMock ? "Abgeschlossen" : "In Arbeit"}» setzen?`)) return;
    for (const id of bulkSelected) handleStatusChange(id, bulkAction?.isDemoMock ? "erledigt" : "in_bearbeitung", "Anna");
    toast(bulkAction?.resultDescription?.replace("{N}", String(bulkSelected.size)) || `${bulkSelected.size} Pendenzen aktualisiert`);
    setBulkSelected(new Set());
  };
  const handleBulkErledigen = () => {
    // Kurze Rückfrage statt Bestätigungszeile: Sammelaktion ist ein Statuswechsel.
    if (!window.confirm(`${bulkSelected.size} Pendenzen abschliessen?`)) return;
    for (const id of bulkSelected) handleStatusChange(id, "erledigt", "Anna");
    toast(`${bulkSelected.size} Pendenzen abgeschlossen`);
    setBulkSelected(new Set());
  };

  // Ungespeicherte Änderungen im Bearbeitungszustand: vor jedem Wechsel Rückfrage.
  const [entwurfDirty, setEntwurfDirty] = useState(false);
  const wechselErlaubt = () => !entwurfDirty || window.confirm("Es liegen ungespeicherte Änderungen vor. Verwerfen?");
  /* Das Öffnen einer Pendenz legt einen Verlaufseintrag an, das Schliessen nicht.
     Nur so landet „zurück" wieder auf der Liste — mit Ansicht und Filtern, die
     in der URL stehen. Vor dem Sprung wird die Scrollposition gemerkt. */
  const waehle = (id: string | null) => {
    if (!wechselErlaubt()) return;
    setEntwurfDirty(false);
    if (id) merkeScroll();
    setParam({ id }, { push: !!id });
  };

  const handleCardClick = (id: string) => {
    if (!wechselErlaubt()) return;
    setEntwurfDirty(false);
    if (id === selectedId) setParam({ id: null });
    else { merkeScroll(); setParam({ id }, { push: true }); }
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
    // Manuelle Pendenz ohne Personenbezug: stiller Strich statt Link.
    if (!e.personBezug) return <span style={{ fontSize: "var(--text-small)", color: "var(--text-tertiary)" }}>–</span>;
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

  // Karte (Telefon, Lauf 1b Änderung 6): Titel — darunter die Person als Link —
  // darunter eine Zeile mit Statuspunkt, Fälligkeit und Warnzeichen bei
  // Überfälligkeit (Form + Text, nicht allein Farbe). Kein Raster in der Karte.
  const karteTitel = (e: UnifiedEntry) => (
    <span className="truncate" style={{ display: "block", minWidth: 0, fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>{e.betreff}</span>
  );
  const karteKoerper = (e: UnifiedEntry) => {
    const ueberfaellig = e.status !== "erledigt" && e.faellig != null && daysFromToday(e.faellig)! < 0;
    return (
      <div className="flex flex-col" style={{ gap: 6 }}>
        {/* H (Lauf 1c): ohne Personenbezug entfällt die Zeile — kein Strich */}
        {e.personBezug && <div style={{ fontSize: "var(--text-small)" }}>{personZelle(e)}</div>}
        <div className="flex items-center flex-wrap" style={{ gap: 10 }}>
          {statusZelle(e)}
          {faelligZelle(e)}
          {ueberfaellig && <AlertTriangle role="img" aria-label="überfällig" style={{ width: 14, height: 14, color: "var(--status-danger)", flexShrink: 0 }} />}
        </div>
      </div>
    );
  };

  // Je Spalte Mindestbreite und Obergrenze in ch — der Browser verteilt via minmax().
  // Keine eigene Pixelrechnung, keine gesteuerte Verteilungsreihenfolge.
  // Spaltenfall (abwerfRang, kleinster zuerst): Beschreibung, dann Art, dann Zuständig.
  const spalten: SpalteDef<UnifiedEntry>[] = [
    { id: "kennzeichen", label: "", festBreitePx: 24, align: "center", sortierbar: true, ausKarte: true, render: kennzeichenIcon },
    // ausKarte auf Kategorie/Beschreibung/Zuständig: die Karte (Telefon) zeigt nur,
    // was zum Wiedererkennen nötig ist — Titel und Fälligkeit im Kartenkopf,
    // Status und Person darunter (Muster B).
    { id: "art", label: "Kategorie", minCh: 14, maxSpur: "21ch", abwerfRang: 2, align: "left", sortierbar: true, ausKarte: true, render: artZelle },
    { id: "betreff", label: "Titel", minCh: 20, maxSpur: "40ch", align: "left", sortierbar: true, ausKarte: true, render: betreffZelle },
    { id: "status", label: "Status", minCh: 16, maxSpur: "16ch", align: "left", sortierbar: true, render: statusZelle },
    { id: "person", label: "Person", minCh: 18, maxSpur: "34ch", align: "left", sortierbar: true, render: personZelle },
    { id: "beschreibung", label: "Beschreibung", minCh: 13, maxSpur: "34ch", abwerfRang: 1, align: "left", sortierbar: true, ausKarte: true, render: beschreibungZelle },
    { id: "faellig", label: "Fällig", minCh: 13, maxSpur: "14ch", align: "left", sortierbar: true, ausKarte: true, render: faelligZelle },
    { id: "zustaendig", label: "Zuständig", minCh: 10, maxSpur: "11ch", abwerfRang: 3, align: "center", sortierbar: true, ausKarte: true, render: zustaendigZelle },
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
    (e.id === selectedId || e.id === zuletztNeuId || (isBulkMode && bulkSelected.has(e.id))) ? "var(--brand-primary)" : undefined;

  const keineTreffer = sorted.length === 0;
  const suchButton = { background: "transparent", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-pill)", padding: "5px 12px", fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", color: "var(--text-secondary)", fontFamily: "inherit", cursor: "pointer" } as const;

  // Lauf 1b: unter 1024px stehen alle Filter in EINER scrollenden Zeile;
  // die Bausteine werden je Breite nur anders angeordnet, nie doppelt gebaut.
  const istSchmal = useFensterBreite() < 1024;

  // Muster C: Verlauf am rechten Rand der Filterleiste, solange waagrecht
  // scrollbar (nicht am Ende) — gleiche Mechanik wie die Reiterleisten
  // in StepAngehoeriger/StepPatient/OnboardingPage.
  const chipScrollRef = useRef<HTMLDivElement>(null);
  const [chipVerlauf, setChipVerlauf] = useState(false);
  const pruefeChipVerlauf = useCallback(() => {
    const el = chipScrollRef.current;
    if (el) setChipVerlauf(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);
  useEffect(() => {
    pruefeChipVerlauf();
    const el = chipScrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(pruefeChipVerlauf);
    ro.observe(el);
    window.addEventListener("resize", pruefeChipVerlauf);
    return () => { ro.disconnect(); window.removeEventListener("resize", pruefeChipVerlauf); };
  }, [pruefeChipVerlauf]);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* ═══ HEADER + STEUERLEISTE ═══ */}
      <div className="shrink-0" style={{ padding: "var(--space-4) var(--mobile-page-padding) 0" }}>
        <style>{`@media (min-width: 640px) { .pendenzen-header { padding-left: var(--space-6) !important; padding-right: var(--space-6) !important; } }`}</style>
        <div className="pendenzen-header" style={{ padding: "0" }}>
          {/* Titel + Primäraktion */}
          <div className="flex items-center justify-between" style={{ marginBottom: "var(--space-3)" }}>
            <h1 style={{ fontSize: "var(--text-h1)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", letterSpacing: "var(--tracking-tight)" }}>Pendenzen</h1>
            <div className="flex items-center shrink-0" style={{ gap: "var(--space-2)" }}>
            {/* Ansichten anlegen ist Sache der Administration; für alle anderen
                steht der Knopf nicht im DOM. Sekundär gestaltet — der
                Primärknopf des Abschnitts ist «Neue Pendenz». */}
            {darfAnsichtErstellen && (
              <button
                className="ui-fokusring inline-flex items-center shrink-0 cursor-pointer transition-colors"
                onClick={() => setErstellenOffen(true)}
                aria-label="Ansicht erstellen"
                style={{ gap: "var(--space-2)", padding: "10px 16px", borderRadius: "var(--radius-pill)", background: "var(--bg-elevated)", color: "var(--text-primary)", fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", border: "var(--border-thin) solid var(--border-default)", fontFamily: "inherit" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"}
                onMouseLeave={e => e.currentTarget.style.background = "var(--bg-elevated)"}
              >
                <Plus style={{ width: 16, height: 16 }} /> <span className="hidden sm:inline">Ansicht erstellen</span>
              </button>
            )}
            <button
              className="ui-fokusring inline-flex items-center shrink-0 cursor-pointer transition-colors"
              onClick={() => setNeueOffen(true)}
              aria-label="Neue Pendenz anlegen"
              style={{ gap: "var(--space-2)", padding: "10px 16px", borderRadius: "var(--radius-pill)", background: "var(--brand-primary)", color: "var(--text-on-dark)", fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", border: "none" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--brand-primary-dark)"}
              onMouseLeave={e => e.currentTarget.style.background = "var(--brand-primary)"}
            >
              <Plus style={{ width: 16, height: 16 }} /> <span className="hidden sm:inline">Neue Pendenz</span>
            </button>
            </div>
          </div>

          {/* Steuerleiste + Status-Chips.
              Desktop: Suche/Umschalter/Auswahlfelder in Zeile 1, Chips in Zeile 2 —
              unverändert. Unter 1024px (Lauf 1b): Suche allein in Zeile 1, alle
              Filter in EINER waagrecht scrollenden Zeile mit Verlauf (Muster C).
              Die Bausteine existieren nur einmal und werden angeordnet. */}
          {(() => {
            const suchfeld = (
              <div className="flex items-center" style={{ flex: "1 1 220px", maxWidth: 300, gap: "var(--space-2)", padding: "7px 14px", borderRadius: 8, background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)" }}>
                <Search style={{ width: 14, height: 14, color: "var(--text-tertiary)", flexShrink: 0 }} />
                <input value={filter.suche} onChange={e => setSuche(e.target.value)} placeholder="Pendenzen suchen…" className="flex-1 bg-transparent outline-none" style={{ fontSize: "var(--text-small)", color: "var(--text-primary)", minWidth: 0 }} />
                {filter.suche && <button onClick={() => setSuche("")} className="cursor-pointer shrink-0" style={{ background: "transparent", border: "none" }}><X style={{ width: 12, height: 12, color: "var(--text-secondary)" }} /></button>}
              </div>
            );
            const ansichtsSchalter = (
              <AnsichtsUmschalter
                ansichten={ansichten}
                aktivId={ansichtId}
                zaehler={ansichtZaehler}
                gefiltert={hatAdhocFilter}
                onWaehle={waehleAnsicht}
              />
            );
            const auswahlFelder = (
              <>
                <AuswahlDropdown label="Kategorie" optionen={alleArten.map(t => ({ value: t, label: pendenzTypen[t]?.label || t }))} ausgewaehlt={filter.arten as Set<string>} onToggle={v => toggleArt(v as PendenzTyp)} />
                <AuswahlDropdown label="Zuständig" optionen={alleZustaendige.map(n => ({ value: n, label: n }))} ausgewaehlt={filter.zustaendige} onToggle={toggleZustaendig} />
              </>
            );
            const chipListe = STATUS_CHIPS.map(chip => {
              const aktiv = filter.statusChips.has(chip.id);
              const n = chipCounts[chip.id];
              // Lauf 1b: gekürzte Beschriftung auf schmalen Fenstern; die volle
              // Bezeichnung bleibt als title/aria-label erhalten.
              const kurz = chip.id === "diese_woche" ? "Diese Woche" : chip.label;
              return (
                <button key={chip.id} type="button" onClick={() => toggleChip(chip.id)} title={chip.label} aria-label={`${chip.label} ${n}`} className="ui-fokusring inline-flex items-center cursor-pointer transition-colors"
                  style={{ gap: 7, padding: "6px 12px", borderRadius: "var(--radius-pill)", background: aktiv ? "var(--brand-primary-light)" : "var(--bg-elevated)", border: aktiv ? "var(--border-thin) solid var(--brand-primary)" : "var(--border-thin) solid var(--border-default)", fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: aktiv ? "var(--brand-primary)" : "var(--text-primary)", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                  <span className="inline-flex items-center justify-center shrink-0" style={{ width: 15, height: 15, borderRadius: 4, border: aktiv ? "none" : "var(--border-thin) solid var(--border-default)", background: aktiv ? "var(--brand-primary)" : "transparent" }}>
                    {aktiv && <Check style={{ width: 10, height: 10, color: "var(--text-on-dark)" }} />}
                  </span>
                  {istSchmal ? kurz : chip.label}
                  <span style={{ fontVariantNumeric: "tabular-nums", color: aktiv ? "var(--brand-primary)" : "var(--text-tertiary)" }}>{n}</span>
                </button>
              );
            });
            return istSchmal ? (
              <>
                <div className="flex items-center" style={{ gap: 8, marginBottom: "var(--space-2)" }}>{suchfeld}</div>
                <div className="relative">
                  <div ref={chipScrollRef} onScroll={pruefeChipVerlauf} className="flex items-center m1-leiste-scroll" style={{ gap: 8, marginBottom: "var(--space-2)" }}>
                    {ansichtsSchalter}
                    {auswahlFelder}
                    {chipListe}
                  </div>
                  {chipVerlauf && (
                    <div aria-hidden="true" style={{ position: "absolute", top: 0, bottom: "var(--space-2)", right: 0, width: 28, pointerEvents: "none", background: "linear-gradient(to right, transparent, var(--bg-primary))" }} />
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center flex-wrap" style={{ gap: 8, marginBottom: "var(--space-2)" }}>
                  {suchfeld}
                  {ansichtsSchalter}
                  {auswahlFelder}
                </div>
                <div className="flex items-center flex-wrap" style={{ gap: 8, marginBottom: "var(--space-2)" }}>
                  {chipListe}
                </div>
              </>
            );
          })()}

          {/* Aktivzeile — zwei Zustände.
              Unverändert: stille Metazeile mit Freigabe und Filterzusammenfassung.
              Die Ansichtsfilter erscheinen NICHT als entfernbare Chips; solange
              nichts abweicht, trägt der Name die Bedeutung.
              Gefiltert: die Ad-hoc-Filter als entfernbare Chips und genau eine
              Schaltfläche zurück. Es gibt hier keinen Weg, eine Linse abzulegen —
              das ist Sache der Administration. */}
          <div className="flex items-center flex-wrap" style={{ gap: 6, minHeight: 24, marginBottom: "var(--space-2)" }}>
            {!hatAdhocFilter ? (
              <span style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>
                {ansicht ? (
                  [
                    ansicht.art === "freigegeben" && ansicht.freigabe?.length ? `freigegeben · ${ansicht.freigabe.length} Personen` : null,
                    filterZusammenfassung(ansicht.filter) || null,
                    `sortiert nach ${SORT_LABEL[sort.key]}`,
                  ].filter(Boolean).join(" · ")
                ) : ""}
              </span>
            ) : (
              <>
                {filterTags.map(t => (
                  <button key={t.key} type="button" onClick={t.entfernen} className="ui-fokusring inline-flex items-center cursor-pointer"
                    style={{ gap: 4, padding: "3px 10px", borderRadius: "var(--radius-pill)", background: "var(--brand-primary-light)", color: "var(--brand-primary)", fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", border: "none", fontFamily: "inherit" }}>
                    {t.label} <X style={{ width: 10, height: 10 }} />
                  </button>
                ))}
                <button type="button" onClick={zurueckZurAnsicht} className="ui-fokusring cursor-pointer" style={{ background: "transparent", border: "none", fontSize: "var(--text-meta)", color: "var(--text-secondary)", fontWeight: "var(--weight-medium)", padding: "3px 6px", fontFamily: "inherit" }}>Zurück zur Ansicht</button>
                {/* Ansicht erstellen steht dauerhaft in der Kopfzeile, nicht hier —
                    ein Weg, nicht zwei. */}
                <span style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>Deine Filter gelten nur für Dich und nur in dieser Sitzung</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ═══ LISTE (DataTable) + DYNAMISCHER DETAILBEREICH ═══ */}
      <div className="flex-1 flex min-h-0 overflow-hidden" style={{ padding: "0 var(--mobile-page-padding) var(--space-4)" }}>
        <style>{`@media (min-width: 640px) { .pendenzen-list-area { padding-left: var(--space-6) !important; padding-right: var(--space-6) !important; } }`}</style>
        {/* ── LIST ── */}
        <div ref={listeRef} onScroll={merkeScroll} className="pendenzen-list-area flex-1 min-w-0 overflow-y-auto" style={{ paddingRight: selected ? "var(--space-4)" : 0 }}>
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

          {/* Drei getrennte Zustände, nicht ein gemeinsamer: die Ansicht ist
              gesperrt, die Ansicht liefert nichts, oder die Ad-hoc-Filter tun es. */}
          {!ansicht ? (
            /* Gesperrt: nur die Kennung. Kein Name, kein Zähler, keine
               Filterbeschreibung — sonst verriete der Leerzustand, was in einer
               nicht freigegebenen Ansicht steht. */
            <div style={{ background: "var(--bg-elevated)", borderRadius: "var(--radius-card)", border: "var(--border-thin) solid var(--border-default)", padding: "3rem 1.5rem", textAlign: "center" }}>
              <p style={{ fontSize: "var(--text-body)", color: "var(--text-secondary)", marginBottom: 6 }}>Diese Ansicht ist Dir nicht freigegeben</p>
              <p style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)", marginBottom: 14, fontVariantNumeric: "tabular-nums" }}>{ansichtId}</p>
              <div className="inline-flex items-center flex-wrap justify-center" style={{ gap: 8 }}>
                <button type="button" onClick={() => waehleAnsicht(STANDARD_ANSICHT)} style={suchButton}>Zu &bdquo;Mir zugewiesen&ldquo;</button>
              </div>
            </div>
          ) : keineTreffer && hatAdhocFilter ? (
            /* Ad-hoc-Filter liefert nichts — die Chips bleiben oben sichtbar. */
            <div style={{ background: "var(--bg-elevated)", borderRadius: "var(--radius-card)", border: "var(--border-thin) solid var(--border-default)", padding: "3rem 1.5rem", textAlign: "center" }}>
              <p style={{ fontSize: "var(--text-body)", color: "var(--text-secondary)", marginBottom: 14 }}>Keine Pendenz entspricht Deinen Filtern</p>
              <div className="inline-flex items-center flex-wrap justify-center" style={{ gap: 8 }}>
                <button type="button" onClick={zurueckZurAnsicht} style={suchButton}>Zurück zur Ansicht</button>
              </div>
            </div>
          ) : keineTreffer ? (
            /* Die Ansicht selbst liefert nichts — Ursache benennen. */
            <div style={{ background: "var(--bg-elevated)", borderRadius: "var(--radius-card)", border: "var(--border-thin) solid var(--border-default)", padding: "3rem 1.5rem", textAlign: "center" }}>
              <p style={{ fontSize: "var(--text-body)", color: "var(--text-secondary)", marginBottom: 6 }}>Keine Pendenz entspricht dieser Ansicht</p>
              <p style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)", marginBottom: 14 }}>
                {filterZusammenfassung(ansicht.filter) || "Diese Ansicht schränkt nichts ein."}
              </p>
              <div className="inline-flex items-center flex-wrap justify-center" style={{ gap: 8 }}>
                {!filter.statusChips.has("abgeschlossen") && <button type="button" onClick={() => toggleChip("abgeschlossen")} style={suchButton}>Abgeschlossene einblenden</button>}
                {ansichtId !== ALLE_ANSICHT && <button type="button" onClick={() => waehleAnsicht(ALLE_ANSICHT)} style={suchButton}>Zu &bdquo;Alle Pendenzen&ldquo;</button>}
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
              karteKoerper={karteKoerper}
              containerHaltepunkte
              karteAbPx={500}
              tabletQuerscroll
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
              key={selected.id}
              entry={selected}
              verlauf={selected.verlauf || []}
              draftComment={draftComment}
              onDraftChange={setDraftComment}
              onAddComment={() => handleAddComment(selected.id)}
              onStatusChange={(s, bemerkung) => handleStatusChange(selected.id, s, BEARBEITER, bemerkung)}
              onClose={() => waehle(null)}
              onDemoAction={handleDemoAction}
              onPersonKlick={() => { if (selected.personBezug) navigate(personLink(selected.personBezug)); }}
              onFeld={a => aendereFeld(selected.id, a)}
              onPerson={(bezug, neuName) => handlePersonChange(selected.id, bezug, neuName)}
              onDirty={setEntwurfDirty}
            />
          </div>
        )}
      </div>

      {/* ── ANSICHT ERSTELLEN (nur Administration, nur im gefilterten Zustand) ── */}
      {darfAnsichtErstellen && erstellenOffen && (
        <AnsichtErstellenDialog
          offen
          onClose={() => setErstellenOffen(false)}
          kategorien={alleArtenGesamt.map(t => ({ value: t, label: pendenzTypen[t]?.label || t }))}
          personen={allePersonen}
          statusOptionen={[
            { value: "offen", label: "Offen" },
            { value: "in_bearbeitung", label: "In Bearbeitung" },
            { value: "erledigt", label: "Abgeschlossen" },
          ]}
          zaehle={f => ansichtFiltern(entries, f).length}
          startFilter={neuerAnsichtFilter}
          onErstellt={a => {
            setErstellenOffen(false);
            // Die neue Ansicht wird aktiv; damit endet der gefilterte Zustand.
            waehleAnsicht(a.id);
            toast("Ansicht erstellt");
          }}
        />
      )}

      {/* ── NEUE PENDENZ (aus der Liste geöffnet: keine Vorbelegung) ── */}
      <NeuePendenzDialog
        offen={neueOffen}
        onClose={() => setNeueOffen(false)}
        onErstellt={e => {
          setDatenVersion(v => v + 1);
          // Die neue Pendenz liegt in den Quelldaten — der Bestand liest neu,
          // damit sie in allen Ansichten erscheint.
          pendenzenNeuLesen();
          setZuletztNeuId(e.id);
          setNeueOffen(false);
          // Die neue Pendenz muss sofort sichtbar sein: fällt sie nicht in die
          // aktive Ansicht, wird auf «Alle Pendenzen» gewechselt. Das ist ein
          // Ansichtswechsel, kein Aufweiten des Ad-hoc-Filters.
          if (!ansicht || ansichtFiltern([e], ansicht.filter).length === 0) waehleAnsicht(ALLE_ANSICHT);
          toast("Pendenz angelegt");
        }}
      />

      {/* ── MOBILE / TABLET: Detail-Overlay ── */}
      {selected && (
        <div className="fixed inset-0 z-50 xl:hidden flex flex-col" style={{ background: "var(--bg-elevated)" }}>
          <div className="shrink-0 flex items-center" style={{ padding: "12px var(--space-4)", borderBottom: "var(--border-thin) solid var(--border-default)", minHeight: 48 }}>
            <button onClick={() => waehle(null)} className="flex items-center cursor-pointer"
              style={{ gap: "var(--space-2)", background: "transparent", border: "none", fontSize: "var(--text-body)", color: "var(--text-secondary)", minHeight: 44, padding: "0 8px" }}>
              <ArrowLeft style={{ width: 18, height: 18 }} /> Zurück
            </button>
          </div>
          <div className="flex-1 min-h-0">
            <DetailPanel
              key={selected.id}
              entry={selected}
              verlauf={selected.verlauf || []}
              draftComment={draftComment}
              onDraftChange={setDraftComment}
              onAddComment={() => handleAddComment(selected.id)}
              onStatusChange={(s, bemerkung) => handleStatusChange(selected.id, s, BEARBEITER, bemerkung)}
              onClose={() => waehle(null)}
              onDemoAction={handleDemoAction}
              onPersonKlick={() => { if (selected.personBezug) navigate(personLink(selected.personBezug)); }}
              onFeld={a => aendereFeld(selected.id, a)}
              onPerson={(bezug, neuName) => handlePersonChange(selected.id, bezug, neuName)}
              onDirty={setEntwurfDirty}
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

interface DetailPanelProps {
  entry: UnifiedEntry;
  verlauf: VerlaufEintrag[];
  draftComment: string;
  onDraftChange: (v: string) => void;
  onAddComment: () => void;
  onStatusChange: (s: string, abschlussBemerkung?: string) => void;
  onClose: () => void;
  onDemoAction?: (mockType: string) => void;
  onPersonKlick: () => void;
  onFeld: (a: Aenderung) => void;
  onPerson: (bezug: PersonenBezug, neuName: string) => void;
  onDirty?: (dirty: boolean) => void;
}

function DetailPanel({ entry, verlauf, draftComment, onDraftChange, onAddComment, onStatusChange, onClose, onFeld, onPerson, onDirty }: DetailPanelProps) {
  const sektionLabel = { fontSize: "var(--text-micro)", color: "var(--text-secondary)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase" as const, fontWeight: "var(--weight-medium)", marginBottom: "var(--space-2)" };
  const personName = entryPersonName(entry);
  const faellig = entry.faellig ? faelligDarstellung(entry.faellig, entry.status) : null;
  const faelligFarbe = faellig?.ton === "danger" ? "var(--status-danger)" : faellig?.ton === "warning" ? "var(--status-warning-text)" : "var(--text-tertiary)";

  // Herkunft: automatisch erzeugte tragen ihren Auslöser (Quelle), manuelle die Person.
  const erstellEintrag: VerlaufEintrag = { typ: "erstellt", text: entry.quelle === "manuell" ? "Pendenz manuell erstellt" : "Pendenz erstellt", by: entry.erstelltVon.name, at: formatDate(entry.erstellt) };
  const eintraege = [erstellEintrag, ...verlauf].reverse();
  const verlaufText = (v: VerlaufEintrag): string =>
    v.feld ? `${v.feldLabel} ${v.freitext ? "bearbeitet" : `geändert · ${v.alt} → ${v.neu}`}` : (v.text || "");

  // ── Bearbeitungszustand: Modusfelder werden im Entwurf gesammelt, erst "Sichern"
  // übernimmt sie (je geändertem Feld ein Verlaufseintrag). Status/Zuständigkeit im
  // Fuss bleiben davon unberührt und jederzeit direkt bedienbar. ──
  const leseEntwurf = (e: UnifiedEntry) => ({ betreff: e.betreff, beschreibung: e.beschreibung, pendenzTyp: e.pendenzTyp, prioritaet: e.prioritaet, faellig: e.faellig, personBezug: e.personBezug });
  const [bearbeiten, setBearbeiten] = useState(false);
  const [entwurf, setEntwurf] = useState(() => leseEntwurf(entry));
  const geaendert = bearbeiten && (
    entwurf.betreff !== entry.betreff || entwurf.beschreibung !== entry.beschreibung ||
    entwurf.pendenzTyp !== entry.pendenzTyp || entwurf.prioritaet !== entry.prioritaet ||
    entwurf.faellig !== entry.faellig ||
    entwurf.personBezug?.art !== entry.personBezug?.art || entwurf.personBezug?.kennung !== entry.personBezug?.kennung
  );
  // Statuswechsel bestätigen: Klick wählt vor, gespeichert wird erst über die
  // Bestätigungszeile. Beim Wechsel auf "Abgeschlossen" zusätzlich eine
  // optionale Abschlussbemerkung. Der schwebende Entwurf meldet sich als
  // ungesichert (onDirty) — Verlassen ohne Speichern fragt nach.
  const [statusEntwurf, setStatusEntwurf] = useState<string | null>(null);
  const [abschlussBemerkung, setAbschlussBemerkung] = useState("");
  const statusSpeichern = () => {
    if (!statusEntwurf) return;
    onStatusChange(statusEntwurf, statusEntwurf === "erledigt" && abschlussBemerkung.trim() ? abschlussBemerkung.trim() : undefined);
    setStatusEntwurf(null);
    setAbschlussBemerkung("");
  };
  const statusVerwerfen = () => { setStatusEntwurf(null); setAbschlussBemerkung(""); };
  useEffect(() => { onDirty?.(geaendert || statusEntwurf != null); }, [geaendert, statusEntwurf, onDirty]);
  useEffect(() => () => onDirty?.(false), [onDirty]);
  const start = () => { setEntwurf(leseEntwurf(entry)); setBearbeiten(true); };
  const abbrechen = () => { if (geaendert && !window.confirm("Änderungen verwerfen?")) return; setEntwurf(leseEntwurf(entry)); setBearbeiten(false); };
  useEffect(() => {
    if (!bearbeiten) return;
    const h = (ev: KeyboardEvent) => {
      if (ev.key !== "Escape") return;
      ev.preventDefault();
      if (geaendert && !window.confirm("Änderungen verwerfen?")) return;
      setEntwurf(leseEntwurf(entry)); setBearbeiten(false);
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bearbeiten, geaendert, entry]);
  const sichern = () => {
    const u = entwurf;
    if (u.betreff !== entry.betreff) onFeld({ feld: "betreff", feldLabel: "Titel", patch: { betreff: u.betreff }, alt: entry.betreff, neu: u.betreff, freitext: true });
    if (u.beschreibung !== entry.beschreibung) onFeld({ feld: "beschreibung", feldLabel: "Beschreibung", patch: { beschreibung: u.beschreibung }, alt: entry.beschreibung, neu: u.beschreibung, freitext: true });
    if (u.pendenzTyp !== entry.pendenzTyp) onFeld({ feld: "pendenzTyp", feldLabel: "Kategorie", patch: { pendenzTyp: u.pendenzTyp }, alt: pendenzTypen[entry.pendenzTyp]?.label || entry.pendenzTyp, neu: pendenzTypen[u.pendenzTyp]?.label || u.pendenzTyp });
    if (u.prioritaet !== entry.prioritaet) onFeld({ feld: "prioritaet", feldLabel: "Priorität", patch: { prioritaet: u.prioritaet }, alt: PRIO_CFG[entry.prioritaet]?.label || entry.prioritaet, neu: PRIO_CFG[u.prioritaet]?.label || u.prioritaet });
    if (u.faellig !== entry.faellig) onFeld({ feld: "faellig", feldLabel: "Fälligkeit", patch: { faellig: u.faellig }, alt: entry.faellig ? isoZuAnzeige(entry.faellig) : "—", neu: u.faellig ? isoZuAnzeige(u.faellig) : "—" });
    if (u.personBezug?.art !== entry.personBezug?.art || u.personBezug?.kennung !== entry.personBezug?.kennung) {
      const t = ALLE_PERSONEN.find(p => p.bezug.art === u.personBezug?.art && p.bezug.kennung === u.personBezug?.kennung);
      if (t) onPerson(t.bezug, t.name);
    }
    setBearbeiten(false);
  };
  const entwurfPersonName = ALLE_PERSONEN.find(p => p.bezug.art === entwurf.personBezug?.art && p.bezug.kennung === entwurf.personBezug?.kennung)?.name ?? personName;
  const editFeld: React.CSSProperties = { width: "100%", fontFamily: "inherit", padding: "6px 10px", borderRadius: "var(--radius-input)", border: "var(--border-thin) solid var(--border-default)", background: "var(--bg-elevated)", color: "var(--text-primary)", outline: "none", fontSize: "var(--text-small)" };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* ── KOPF (fest) ── */}
      <div className="shrink-0" style={{ padding: "16px 24px", borderBottom: "var(--border-thin) solid var(--border-default)" }}>
        {/* Zeile 1: Kennung · Kategorie + Bearbeiten + Schliessen */}
        <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
          <div className="flex items-center" style={{ gap: 6, minWidth: 0 }}>
            <span style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums" }}>{entry.id}</span>
            <span style={{ fontSize: "var(--text-small)", color: "var(--text-tertiary)" }}>·</span>
            {bearbeiten ? (
              <AuswahlDropdown einfach label={pendenzTypen[entwurf.pendenzTyp]?.label || entwurf.pendenzTyp} wert={entwurf.pendenzTyp}
                optionen={(Object.keys(pendenzTypen) as PendenzTyp[]).map(t => ({ value: t, label: pendenzTypen[t]?.label || t }))}
                onWaehle={v => setEntwurf(s => ({ ...s, pendenzTyp: v as PendenzTyp }))} />
            ) : (
              <span style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>{pendenzTypen[entry.pendenzTyp]?.label || entry.typLabel}</span>
            )}
          </div>
          <div className="flex items-center shrink-0" style={{ gap: 4 }}>
            {!bearbeiten && (
              <button onClick={start} className="ui-fokusring inline-flex items-center cursor-pointer transition-colors"
                style={{ gap: 5, padding: "5px 10px", borderRadius: "var(--radius-pill)", background: "transparent", border: "var(--border-thin) solid var(--border-default)", fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", color: "var(--text-secondary)", fontFamily: "inherit" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <Pencil style={{ width: 12, height: 12 }} /> Bearbeiten
              </button>
            )}
            <button onClick={onClose} className="flex items-center justify-center cursor-pointer transition-colors"
              style={{ width: 28, height: 28, borderRadius: "var(--radius-pill)", background: "transparent", border: "none" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <X style={{ width: 16, height: 16, color: "var(--text-secondary)" }} />
            </button>
          </div>
        </div>
        {/* Zeile 2: Titel */}
        <div style={{ marginBottom: 8 }}>
          {bearbeiten ? (
            <input value={entwurf.betreff} onChange={e => setEntwurf(s => ({ ...s, betreff: e.target.value }))} placeholder="Titel"
              style={{ ...editFeld, fontSize: "var(--text-h3)", fontWeight: "var(--weight-medium)" }} />
          ) : (
            <div style={{ fontSize: "var(--text-h2)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>{entry.betreff}</div>
          )}
        </div>
        {/* Zeile 3: Person · Fälligkeit · Priorität */}
        <div className="flex items-center flex-wrap" style={{ gap: 10, minWidth: 0 }}>
          {bearbeiten ? (
            <AuswahlPopover
              personen={ALLE_PERSONEN.map(p => p.option)}
              selectedId={ALLE_PERSONEN.find(p => p.bezug.art === entwurf.personBezug.art && p.bezug.kennung === entwurf.personBezug.kennung)?.option.id ?? null}
              onSelect={id => { const t = ALLE_PERSONEN.find(p => p.option.id === id); if (t) setEntwurf(s => ({ ...s, personBezug: t.bezug })); }}
              ausloeser={(_offen, toggle, ref) => (
                <button ref={ref} type="button" onClick={toggle} className="ui-fokusring inline-flex items-center cursor-pointer"
                  style={{ gap: 6, padding: "7px 12px", borderRadius: "var(--radius-pill)", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                  {entwurfPersonName} <ChevronDown style={{ width: 14, height: 14, opacity: 0.7 }} />
                </button>
              )}
            />
          ) : (
            <span className="inline-flex items-center" style={{ gap: 4, minWidth: 0, flex: "0 1 auto", overflow: "hidden" }}>
              <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "var(--text-small)", color: "var(--text-primary)", fontWeight: "var(--weight-medium)" }}>{personName}</span>
              {entry.personBezug && <span style={{ flexShrink: 0, fontSize: "var(--text-meta)", color: "var(--text-tertiary)", whiteSpace: "nowrap" }}>· {personArtLabel(entry.personBezug.art)}</span>}
            </span>
          )}
          {/* Fälligkeit — Lesezustand nur Text; Bearbeitung: Produkt-Datumsfeld (DateField) */}
          {bearbeiten ? (
            <span className="shrink-0" style={{ minWidth: 160 }}>
              <DateField wertFormat="iso" bereich="any" value={entwurf.faellig} onChange={v => setEntwurf(s => ({ ...s, faellig: (v as string) || null }))} />
            </span>
          ) : (
            <span className="inline-flex items-baseline shrink-0" style={{ gap: 5, whiteSpace: "nowrap" }}>
              {faellig ? <span style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums" }}>{faellig.datum}</span>
                       : <span style={{ fontSize: "var(--text-small)", color: "var(--text-tertiary)" }}>Kein Datum</span>}
              {faellig?.abw && <span style={{ fontSize: "var(--text-meta)", fontWeight: faellig.ton === "danger" ? "var(--weight-medium)" : "var(--weight-regular)", color: faelligFarbe }}>{faellig.abw}</span>}
            </span>
          )}
          {/* Priorität */}
          <span className="inline-flex items-center shrink-0" style={{ gap: 5 }}>
            <span style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>Priorität</span>
            {bearbeiten ? (
              <AuswahlDropdown einfach label={PRIO_CFG[entwurf.prioritaet]?.label || entwurf.prioritaet} wert={entwurf.prioritaet}
                optionen={[{ value: "hoch", label: "Hoch" }, { value: "mittel", label: "Mittel" }, { value: "niedrig", label: "Niedrig" }]}
                onWaehle={v => setEntwurf(s => ({ ...s, prioritaet: v as UnifiedEntry["prioritaet"] }))} />
            ) : (
              <span style={{ fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", color: "var(--text-secondary)" }}>{PRIO_CFG[entry.prioritaet]?.label || entry.prioritaet}</span>
            )}
          </span>
        </div>
      </div>

      {/* ── KÖRPER (scrollt) ── */}
      <div className="flex-1 overflow-y-auto min-h-0" style={{ padding: "20px 24px" }}>
        {/* ANNA-VORSCHLAG — vorübergehend ausgeblendet. Mechanismus, Sammelaktion und
            Komponente bleiben erhalten; zum Reaktivieren die folgende Zeile einkommentieren. */}
        {/* <AnnaPendenzVorschlag pendenz={entry} onActionExecuted={() => {}} onDemoAction={onDemoAction} /> */}

        {/* Beschreibung — Lesezustand Text; Bearbeitung mehrzeiliges Feld */}
        <div style={{ marginBottom: "var(--space-4)" }}>
          <div style={sektionLabel}>Beschreibung</div>
          {bearbeiten ? (
            <textarea value={entwurf.beschreibung} onChange={e => setEntwurf(s => ({ ...s, beschreibung: e.target.value }))} rows={4} placeholder="Beschreibung hinzufügen…"
              style={{ ...editFeld, resize: "vertical", fontSize: "var(--text-body)", lineHeight: 1.5 }} />
          ) : (
            <div style={{ fontSize: "var(--text-body)", color: entry.beschreibung ? "var(--text-primary)" : "var(--text-tertiary)", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{entry.beschreibung || "Keine Beschreibung."}</div>
          )}
        </div>

        {/* Fuss des bearbeitbaren Bereichs: Abbrechen / Sichern */}
        {bearbeiten && (
          <div className="flex items-center justify-end" style={{ gap: 8, marginBottom: "var(--space-6)" }}>
            <button onClick={abbrechen} className="ui-fokusring inline-flex items-center cursor-pointer" style={{ gap: 5, padding: "7px 14px", borderRadius: "var(--radius-pill)", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", fontFamily: "inherit" }}>
              <X style={{ width: 13, height: 13 }} /> Abbrechen
            </button>
            <button onClick={sichern} className="ui-fokusring inline-flex items-center cursor-pointer" style={{ gap: 5, padding: "7px 16px", borderRadius: "var(--radius-pill)", background: "var(--brand-primary)", border: "none", fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-on-dark)", fontFamily: "inherit" }}>
              <Check style={{ width: 13, height: 13 }} /> Sichern
            </button>
          </div>
        )}

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

      {/* ── FUSS (fest): Status-Umschalter · Zuständigkeit.
             Statuswechsel wählt VOR und speichert nicht — die Bestätigungszeile
             darunter sichert oder verwirft (ein Statuswechsel ist eine Aussage
             über die Wirklichkeit, keine beiläufige Geste). ── */}
      <div className="shrink-0" style={{ borderTop: "var(--border-thin) solid var(--border-default)" }}>
      <div className="flex items-center justify-between flex-wrap" style={{ gap: "var(--space-2)", padding: "12px 16px" }}>
        <div className="inline-flex" style={{ padding: 2, borderRadius: "var(--radius-pill)", background: "var(--bg-secondary)", border: "var(--border-thin) solid var(--border-default)" }}>
          {STATUS_SEGMENTE.map(([val, lbl]) => {
            const gewaehlt = (statusEntwurf ?? entry.status) === val;
            const bisher = statusEntwurf != null && entry.status === val;
            return (
              <button key={val} type="button"
                onClick={() => { if (val === entry.status) statusVerwerfen(); else setStatusEntwurf(val); }}
                title={bisher ? "Bisheriger Status" : undefined}
                aria-pressed={gewaehlt}
                className="ui-fokusring cursor-pointer transition-colors"
                style={{ padding: "5px 12px", borderRadius: "var(--radius-pill)", background: gewaehlt ? "var(--bg-elevated)" : "transparent", border: gewaehlt ? "var(--border-thin) solid var(--brand-primary)" : bisher ? "var(--border-thin) dashed var(--border-default)" : "var(--border-thin) solid transparent", fontSize: "var(--text-small)", fontWeight: gewaehlt ? "var(--weight-medium)" : "var(--weight-regular)", color: gewaehlt ? "var(--text-primary)" : "var(--text-secondary)", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                {lbl}{bisher ? " (bisher)" : ""}
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
      {/* Bestätigungszeile: erscheint nur bei Vorauswahl; unter 640px zweizeilig,
          Speichern über die volle Breite (m1-status-bestaetigen, theme.css). */}
      {statusEntwurf != null && (
        <div style={{ padding: "0 16px 12px" }}>
          {statusEntwurf === "erledigt" && (
            <div style={{ marginBottom: "var(--space-2)" }}>
              <label htmlFor="abschluss-bemerkung" style={{ display: "block", fontSize: "var(--text-meta)", color: "var(--text-secondary)", marginBottom: 4 }}>
                Bemerkung zum Abschluss (optional)
              </label>
              <textarea
                id="abschluss-bemerkung"
                value={abschlussBemerkung}
                onChange={e => setAbschlussBemerkung(e.target.value)}
                rows={2}
                placeholder="Wie wurde erledigt?"
                className="ui-fokusring"
                style={{ width: "100%", resize: "vertical", padding: "8px 10px", fontSize: "var(--text-small)", fontFamily: "inherit", color: "var(--text-primary)", background: "var(--bg-secondary)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-input)" }}
              />
            </div>
          )}
          <div className="flex items-center m1-status-bestaetigen" style={{ gap: "var(--space-2)" }}>
            <button type="button" onClick={statusSpeichern} className="ui-fokusring m1-status-speichern cursor-pointer"
              style={{ padding: "7px 16px", borderRadius: "var(--radius-pill)", background: "var(--brand-primary)", color: "var(--text-on-dark)", fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", border: "none", fontFamily: "inherit" }}>
              Speichern
            </button>
            <button type="button" onClick={statusVerwerfen} className="ui-fokusring cursor-pointer"
              style={{ padding: "7px 16px", borderRadius: "var(--radius-pill)", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", fontFamily: "inherit" }}>
              Abbrechen
            </button>
          </div>
        </div>
      )}
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
      {/* m1-mindestschrift: unterhalb Desktop auf die Styleguide-Untergrenze (11px) angehoben (P5) */}
      <span className="m1-mindestschrift" style={{ color: "var(--text-on-dark)", fontSize: size <= 20 ? 8 : 9, fontWeight: "var(--weight-medium)" }}>
        {person.initialen}
      </span>
    </div>
  );
}
