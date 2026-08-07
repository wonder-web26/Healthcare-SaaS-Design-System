/**
 * KLV — alle Leistungsplanungsblätter über alle Patienten.
 *
 * Beantwortet die Frage einer Geschäftsführerin am Morgen: was ist im
 * Verfahren, und wo hängt es. Zuvor stand diese Aussage als Abschnitt im
 * Service Desk — in einem fremden Bildschirm, dessen Segment, Chips und
 * Sortierung sie nicht gehorchte.
 *
 * Der Navigationseintrag heisst bewusst „KLV" statt „Leistungsplanungsblatt":
 * kurz und für die Zielgruppe eindeutig. Die Ansicht im Dossier behält den
 * vollen Namen.
 *
 * Baut auf denselben geteilten Bausteinen wie die übrigen Listen: DataTable
 * und AuswahlDropdown. Filterzustand, Chip-Leiste, Suche, Sortierung und
 * Fusszeile sind hier — wie in den drei anderen — noch eigener Code; ein
 * gemeinsames Listengerüst ist ein eigener Lauf.
 */
import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { DataTable, TABELLE_LAYOUT, type SpalteDef } from "./ui/DataTable";
import { AuswahlDropdown } from "./ui/AuswahlDropdown";
import { ListenGeruest } from "./ui/ListenGeruest";
import { ansichtPfad } from "./Patient360Page";
import { useKlvVerordnungen } from "../../lib/klv/store";
import { wartetSeitTagen, WARTEFRIST_TAGE } from "../../lib/klv/warten";
import { LPB_STATUS, lpbStatusLabel, lpbAmZug } from "../../lib/stammdaten/lpb-status";
import { berechneSummen } from "../../lib/klv/berechnung";
import { getMandate, MANDAT_STICHTAG } from "../../lib/mandate/store";
import { useKostengutsprachen } from "../../lib/mandate/verordnungen-store";
import { kgsDecktAm, type Kostengutsprache } from "../../lib/mandate/verordnungen";
import { abgleichen, ueberBewilligung, stunden } from "../../lib/klv/abgleich";
import { isoZuAnzeige } from "../../lib/datum";
import { leerZuletzt, datumKey } from "../../lib/sortierung";
import type { KLVVerordnung } from "../../types/klinische-artefakte";

/** Zuständige Person kommt aus dem Mandat — nicht aus `erstelltVon`. */
function zustaendigePerson(v: KLVVerordnung): string {
  if (!v.mandatId || !v.patientId) return "";
  return getMandate(v.patientId).find(m => m.id === v.mandatId)?.zustaendigePerson ?? "";
}

/** Deckt am Stichtag eine gültige Kostengutsprache das Mandat des Blattes? */
function hatGueltigeKgs(v: KLVVerordnung, alle: Kostengutsprache[]): boolean {
  if (!v.mandatId) return false;
  return alle.some(k => k.mandatId === v.mandatId && kgsDecktAm(k, MANDAT_STICHTAG, MANDAT_STICHTAG));
}

/* ── Status-Chips ──────────────────────────────────────────────────────────── */
type StatusChipId = "wartet" | "ohne_kgs" | "ueber_bewilligung";

/* ── Filterzustand ─────────────────────────────────────────────────────────── */
interface FilterZustand {
  statusChips: Set<StatusChipId>;
  zustaende: Set<string>;
  zustaendige: Set<string>;
  /** Ersetzte Fassungen sind Geschichte; sie erscheinen nur auf Wunsch. */
  mitErsetzten: boolean;
  suche: string;
}
const LEERER_FILTER: FilterZustand = {
  statusChips: new Set(), zustaende: new Set(), zustaendige: new Set(),
  mitErsetzten: false, suche: "",
};

/* ── Sortierung ────────────────────────────────────────────────────────────── */
type SortKey = "patient" | "blatt" | "art" | "zustand" | "warten" | "geplant" | "bewilligt" | "zustaendig" | "gueltigab";
const SORT_LABEL: Record<SortKey, string> = {
  patient: "Patient", blatt: "Blatt", art: "Art", zustand: "Zustand", bewilligt: "bewilligter Menge",
  warten: "Wartezeit", geplant: "geplanten Stunden", zustaendig: "Zuständigem", gueltigab: "Gültig ab",
};



export function KlvListPage() {
  const navigate = useNavigate();
  const alle = useKlvVerordnungen();
  const kgs = useKostengutsprachen();
  const [filter, setFilter] = useState<FilterZustand>(LEERER_FILTER);
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "warten", dir: "desc" });
  const toggleSort = (key: string) =>
    setSort(s => s.key === key ? { key: key as SortKey, dir: s.dir === "asc" ? "desc" : "asc" } : { key: key as SortKey, dir: "desc" });

  const setSuche = (suche: string) => setFilter(f => ({ ...f, suche }));
  const toggleChip = (id: StatusChipId) => setFilter(f => { const s = new Set(f.statusChips); if (s.has(id)) s.delete(id); else s.add(id); return { ...f, statusChips: s }; });
  const toggleZustand = (z: string) => setFilter(f => { const s = new Set(f.zustaende); if (s.has(z)) s.delete(z); else s.add(z); return { ...f, zustaende: s }; });
  const toggleZustaendig = (p: string) => setFilter(f => { const s = new Set(f.zustaendige); if (s.has(p)) s.delete(p); else s.add(p); return { ...f, zustaendige: s }; });
  const resetFilter = () => setFilter(f => ({ ...LEERER_FILTER, suche: f.suche }));

  const chips: { id: StatusChipId; label: string; praedikat: (v: KLVVerordnung) => boolean }[] = useMemo(() => [
    /* „Wartet auf Antwort" fasst die beiden Zustände zusammen, in denen das
       Blatt ausserhalb des Hauses liegt. Einzelne Zustände sucht man im
       Auswahlfeld „Zustand" — ein Chip, der einen Wert eines Auswahlfelds
       wiederholt, sagt nichts Eigenes. Chips tragen Lagen, die Aufmerksamkeit
       verlangen; Auswahlfelder tragen Merkmale. */
    { id: "wartet", label: "Wartet auf Antwort", praedikat: v => v.status === "an_arzt" || v.status === "an_kasse" },
    { id: "ohne_kgs", label: "Ohne Kostengutsprache", praedikat: v => !hatGueltigeKgs(v, kgs) },
    /* Blätter ohne Kostengutsprache zählen NICHT dazu: für sie sagt der Chip
       daneben schon, was fehlt. Hier geht es um die Blätter, bei denen eine
       Zusicherung vorliegt und trotzdem mehr geplant ist. */
    { id: "ueber_bewilligung", label: "Über der Bewilligung", praedikat: v => ueberBewilligung(v, kgs, MANDAT_STICHTAG) },
  ], [kgs]);

  /* Ersetzte Blätter fehlen in der Vorgabesicht — sie sind abgelöste Fassungen
     und würden die Frage „was ist im Verfahren" verfälschen. */
  const basis = useMemo(
    () => filter.mitErsetzten ? alle : alle.filter(v => v.status !== "ersetzt"),
    [alle, filter.mitErsetzten]);

  const chipCounts = useMemo(() => {
    const r = {} as Record<StatusChipId, number>;
    for (const c of chips) r[c.id] = basis.filter(c.praedikat).length;
    return r;
  }, [basis, chips]);

  const gefiltert = useMemo(() => basis.filter(v => {
    for (const c of chips) if (filter.statusChips.has(c.id) && !c.praedikat(v)) return false;
    if (filter.zustaende.size > 0 && !filter.zustaende.has(v.status)) return false;
    if (filter.zustaendige.size > 0 && !filter.zustaendige.has(zustaendigePerson(v))) return false;
    const q = filter.suche.trim().toLowerCase();
    if (q && !(v.patientName.toLowerCase().includes(q) || v.id.toLowerCase().includes(q))) return false;
    return true;
  }), [basis, filter, chips]);

  const sortiert = useMemo(() => {
    const f = sort.dir === "asc" ? 1 : -1;
    /* Dieselbe Regel wie die Spalte: nur wer bei Ärztin oder Kasse liegt, wartet.
       Alles andere hat keine Wartezeit und steht damit in beiden Richtungen zuletzt. */
    const tage = (v: KLVVerordnung) => {
      const amZug = lpbAmZug(v.status);
      return amZug === "arzt" || amZug === "kasse" ? wartetSeitTagen(v) : null;
    };
    return [...gefiltert].sort((a, b) => {
      switch (sort.key) {
        case "patient": return f * a.patientName.localeCompare(b.patientName, "de");
        case "blatt": return f * (a.id.localeCompare(b.id) || a.version - b.version);
        case "art": return f * a.art.localeCompare(b.art);
        case "zustand": return f * lpbStatusLabel(a.status).localeCompare(lpbStatusLabel(b.status), "de");
        // Blätter ohne Wartezeit stehen in BEIDEN Richtungen zuletzt.
        case "warten": return leerZuletzt(tage(a) === null, tage(b) === null, f, () => tage(a)! - tage(b)!);
        case "geplant": return f * (berechneSummen(a.leistungspositionen).total - berechneSummen(b.leistungspositionen).total);
        // Blätter ohne bewilligte Menge stehen in beiden Richtungen zuletzt.
        case "bewilligt": {
          const ba = abgleichen(a, kgs, MANDAT_STICHTAG).bewilligt;
          const bb = abgleichen(b, kgs, MANDAT_STICHTAG).bewilligt;
          return leerZuletzt(ba === null, bb === null, f, () => ba! - bb!);
        }
        case "zustaendig": return leerZuletzt(!zustaendigePerson(a), !zustaendigePerson(b), f, () => zustaendigePerson(a).localeCompare(zustaendigePerson(b), "de"));
        case "gueltigab": return leerZuletzt(!a.beginnDatum, !b.beginnDatum, f, () => datumKey(a.beginnDatum).localeCompare(datumKey(b.beginnDatum)));
        default: return 0;
      }
    });
  }, [gefiltert, sort]);

  const zustandOptionen = LPB_STATUS.map(s => ({ value: s.code, label: s.label }));
  const zustaendigOptionen = useMemo(
    () => [...new Set(alle.map(zustaendigePerson).filter(Boolean))].sort().map(p => ({ value: p, label: p })),
    [alle]);

  const spalten: SpalteDef<KLVVerordnung>[] = [
    { id: "patient", label: "Patient", anteil: 20, minCh: 22, align: "left", sortierbar: true, ausKarte: true,
      render: v => <span style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", overflowWrap: "anywhere" }}>{v.patientName}</span> },
    { id: "blatt", label: "Blatt", anteil: 14, minCh: 18, align: "left", sortierbar: true,
      render: v => <span style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{v.id} · V{v.version}</span> },
    { id: "art", label: "Art", anteil: 10, minCh: 14, align: "left", sortierbar: true, ausblendenUnter: "eng",
      render: v => <span style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{v.art === "erst" ? "Erstabklärung" : "Folgeabklärung"}</span> },
    { id: "zustand", label: "Zustand", anteil: 14, minCh: 18, align: "left", sortierbar: true,
      render: v => {
        const ersetzt = v.status === "ersetzt";
        return <span style={{ padding: "2px 9px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", whiteSpace: "nowrap", background: ersetzt ? "var(--bg-secondary)" : "var(--brand-primary-light)", color: ersetzt ? "var(--text-tertiary)" : "var(--brand-primary)" }}>{lpbStatusLabel(v.status)}</span>;
      } },
    { id: "warten", label: "Wartet seit", anteil: 11, minCh: 13, align: "right", sortierbar: true,
      render: v => {
        const amZug = lpbAmZug(v.status);
        if (amZug !== "arzt" && amZug !== "kasse") return null;
        const t = wartetSeitTagen(v);
        if (t === null) return null;
        const lang = t > WARTEFRIST_TAGE;
        return <span style={{ padding: "2px 9px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", background: lang ? "var(--status-warning-bg)" : "var(--bg-secondary)", color: lang ? "var(--status-warning-text)" : "var(--text-secondary)" }}>{t} {t === 1 ? "Tag" : "Tage"}</span>;
      } },
    { id: "geplant", label: "Geplant", anteil: 9, minCh: 10, align: "right", sortierbar: true,
      render: v => <span style={{ fontSize: "var(--text-small)", fontVariantNumeric: "tabular-nums", color: "var(--text-primary)" }}>{berechneSummen(v.leistungspositionen).total.toFixed(2)} h/Wo.</span> },
    { id: "bewilligt", label: "Bewilligt", anteil: 9, minCh: 10, align: "right", sortierbar: true,
      render: v => {
        const a = abgleichen(v, kgs, MANDAT_STICHTAG);
        // Leer, wo keine gültige Kostengutsprache besteht — keine Null.
        if (a.bewilligt === null) return null;
        return <span style={{ fontSize: "var(--text-small)", fontVariantNumeric: "tabular-nums", color: a.lage === "ueber" ? "var(--status-warning-text)" : "var(--text-primary)" }}>{stunden(a.bewilligt)}</span>;
      } },
    { id: "zustaendig", label: "Zuständig", anteil: 12, minCh: 15, align: "left", sortierbar: true, ausblendenUnter: "eng",
      render: v => <span style={{ fontSize: "var(--text-small)", color: "var(--text-primary)", whiteSpace: "nowrap" }}>{zustaendigePerson(v)}</span> },
    { id: "gueltigab", label: "Gültig ab", anteil: 10, minCh: 12, align: "left", sortierbar: true,
      render: v => <span style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{v.beginnDatum || "—"}</span> },
  ];

  const filterTags = [
    ...chips.filter(c => filter.statusChips.has(c.id)).map(c => ({ key: `c-${c.id}`, label: c.label, entfernen: () => toggleChip(c.id) })),
    ...[...filter.zustaende].map(z => ({ key: `z-${z}`, label: `Zustand: ${lpbStatusLabel(z)}`, entfernen: () => toggleZustand(z) })),
    ...[...filter.zustaendige].map(p => ({ key: `p-${p}`, label: `Zuständig: ${p}`, entfernen: () => toggleZustaendig(p) })),
  ];

  const suchButton = { background: "transparent", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-pill)", padding: "5px 12px", fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", color: "var(--text-secondary)", fontFamily: "inherit", cursor: "pointer" } as const;
  const inhaltRahmen = { maxWidth: TABELLE_LAYOUT.inhaltMaxPx, margin: "0 auto", width: "100%" } as const;

  return (
    <div className="flex flex-col h-full min-h-0">
      <style>{`
        .klv-list-pad { padding-left: var(--mobile-page-padding); padding-right: var(--mobile-page-padding); }
        @media (min-width: 640px) { .klv-list-pad { padding-left: var(--space-6); padding-right: var(--space-6); } }
      `}</style>

      {/* ═══ KOPF — teilt Maximalbreite und Kanten mit der Tabelle ═══ */}
      <div className="shrink-0 klv-list-pad" style={{ paddingTop: "var(--space-4)" }}>
        <div style={inhaltRahmen}>
          <ListenGeruest
          titel="Leistungsplanungsblätter"
          suche={filter.suche}
          onSuche={setSuche}
          suchePlatzhalter="Patient oder Blattnummer…"
          auswahlfelder={<>
            <AuswahlDropdown label="Zustand" optionen={zustandOptionen} ausgewaehlt={filter.zustaende} onToggle={toggleZustand} />
            <AuswahlDropdown label="Zuständig" optionen={zustaendigOptionen} ausgewaehlt={filter.zustaendige} onToggle={toggleZustaendig} />
          </>}
          chips={[
            ...chips.map(c => ({
              id: c.id, label: c.label, anzahl: chipCounts[c.id],
              aktiv: filter.statusChips.has(c.id), onToggle: () => toggleChip(c.id),
            })),
            /* Ersetzte Fassungen sind kein Filter über den Inhalt, sondern über
               den Umfang der Sicht — als Chip in derselben Reihe, damit sie dort
               steht, wo die Nutzerin Einschränkungen sucht. */
            {
              id: "mit_ersetzten", label: "Einschliesslich ersetzter",
              anzahl: alle.filter(v => v.status === "ersetzt").length,
              aktiv: filter.mitErsetzten,
              onToggle: () => setFilter(f => ({ ...f, mitErsetzten: !f.mitErsetzten })),
            },
          ]}
          sichtText={`${filter.mitErsetzten ? "Alle Blätter einschliesslich ersetzter" : "Alle Blätter"} · sortiert nach ${SORT_LABEL[sort.key]}`}
          filterMarken={filterTags}
          onFilterZuruecksetzen={resetFilter}
        >{null}</ListenGeruest>

        </div>
      </div>

      {/* ═══ TABELLE ═══ */}
      <div className="flex-1 overflow-y-auto klv-list-pad" style={{ paddingTop: 0, paddingBottom: "var(--space-4)" }}>
        <div style={inhaltRahmen}>
          <DataTable<KLVVerordnung>
            spalten={spalten}
            zeilen={sortiert}
            zeilenKey={v => v.id}
            sort={sort}
            onSort={toggleSort}
            onZeileKlick={v => v.patientId && navigate(ansichtPfad(v.patientId, "leistungsplanungsblatt"))}
            karteTitel={v => (
              <div className="flex items-center justify-between" style={{ gap: 8, width: "100%", minWidth: 0 }}>
                <span style={{ fontWeight: "var(--weight-medium)", overflowWrap: "anywhere" }}>{v.patientName}</span>
                <span style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)", whiteSpace: "nowrap" }}>V{v.version}</span>
              </div>
            )}
            fusszeile={<><span>{sortiert.length} von {basis.length} Blättern</span><span>Stand: {isoZuAnzeige("2026-07-31")}</span></>}
            leerText="Keine Blätter mit diesen Filtern."
          />
        </div>
      </div>
    </div>
  );
}
