/**
 * Pflegekontrolle über alle Patienten — worauf wartet welche Prüfung.
 *
 * Die Kontrolle je Patient besteht. Was fehlte, ist der Bildschirm darüber:
 * die diplomierte Pflegefachperson musste jedes Dossier einzeln öffnen, um zu
 * sehen, wo etwas hängt. Bei Kaufmann kostet die wöchentliche Kontrolle rund
 * vier Stunden je Fachperson — das meiste davon Suchen.
 *
 * Die Zahlen kommen aus `monatsKennzahlen`, derselben Funktion, die auch das
 * Dossier speist. Eine zweite Rechnung liefe auseinander, und dann stünde
 * hier eine andere Zahl als dort, wohin die Zeile verweist.
 */
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ListenGeruest, type ListenChip } from "./ui/ListenGeruest";
import { DataTable, type SpalteDef } from "./ui/DataTable";
import { useEinsaetze, useErbrachteLeistungen, EINSATZ_BEZUGSMONAT } from "../../lib/einsaetze/store";
import { useKlvVerordnungen } from "../../lib/klv/store";
import { useMandate } from "../../lib/mandate/store";
import { useVerordnungen } from "../../lib/mandate/verordnungen-store";
import { usePatienten } from "../../lib/patienten/store";
import { getAngehoerige } from "../../lib/angehoerige/store";
import { MONATE, type EinsatzUrheber } from "../../lib/einsaetze/einsaetze";
import { monatsKennzahlen, berichteFehlen, type MonatsKennzahlen } from "../../lib/einsaetze/kontrolle";
import { ansichtPfad } from "./Patient360Page";
import { leerZuletzt } from "../../lib/sortierung";

/** Anzeigename des Urhebers — Mitarbeitende tragen ihren Namen, Angehörige eine Kennung. */
function urheberName(u: EinsatzUrheber): string {
  if (u.art === "mitarbeitende") return u.name;
  const a = getAngehoerige().find(x => x.id === u.kennung);
  return a ? `${a.vorname} ${a.nachname}` : u.kennung;
}

interface Zeile {
  id: string;
  name: string;
  zustaendig: string;
  k: MonatsKennzahlen;
}

/* ── Chips. Die Bedingung steht hier, die Darstellung im Gerüst. ─────────────
   Kein eigener Filtermechanismus: `ListenGeruest` bekommt fertige Chips mit
   Zahl und Zustand und meldet Klicks zurück. */
type ChipId = "offen" | "abweichung" | "ohne_einsatz" | "nicht_gedeckt" | "berichte";

const CHIPS: { id: ChipId; label: string; praedikat: (z: Zeile) => boolean }[] = [
  { id: "offen", label: "Prüfung offen", praedikat: z => z.k.offen > 0 },
  { id: "abweichung", label: "Abweichung", praedikat: z => z.k.abweichungsTage > 0 },
  { id: "ohne_einsatz", label: "Tage ohne Einsatz", praedikat: z => z.k.ohneEinsatz > 0 },
  { id: "nicht_gedeckt", label: "Nicht gedeckt", praedikat: z => z.k.abrechnung.nichtGedeckt > 0 },
  { id: "berichte", label: "Berichte fehlen", praedikat: z => berichteFehlen(z.k) },
];

export function KontrollListPage() {
  const nav = useNavigate();
  const einsaetze = useEinsaetze();
  const leistungen = useErbrachteLeistungen();
  const klvs = useKlvVerordnungen();
  const mandate = useMandate();
  const verordnungen = useVerordnungen();
  const patienten = usePatienten();

  const [zeitraum, setZeitraum] = useState({
    jahr: EINSATZ_BEZUGSMONAT.getFullYear(), monat: EINSATZ_BEZUGSMONAT.getMonth(),
  });
  const [suche, setSuche] = useState("");
  const [aktiveChips, setAktiveChips] = useState<Set<ChipId>>(new Set());
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" }>({ key: "offen", dir: "desc" });

  /* Nur Patienten mit Erfassung im Monat. Wer im Monat nichts hat, ist keine
     leere Zeile, sondern gar keine. */
  const zeilen: Zeile[] = useMemo(() => {
    const quellen = { einsaetze, leistungen, klvs, mandate, verordnungen };
    const praefix = `${String(zeitraum.monat + 1).padStart(2, "0")}.${zeitraum.jahr}`;
    const mitEinsatz = new Set(einsaetze.filter(e => e.datum.endsWith(praefix)).map(e => e.patientId));
    return [...mitEinsatz].map(id => {
      const p = patienten.find(x => x.id === id);
      const m = mandate.find(x => x.patientId === id);
      return {
        id,
        name: p ? `${p.nachname}, ${p.vorname}` : id,
        zustaendig: m?.zustaendigePerson ?? "",
        k: monatsKennzahlen(id, zeitraum.jahr, zeitraum.monat, quellen),
      };
    });
  }, [einsaetze, leistungen, klvs, mandate, verordnungen, patienten, zeitraum]);

  const chips: ListenChip[] = CHIPS.map(c => ({
    id: c.id,
    label: c.label,
    anzahl: zeilen.filter(c.praedikat).length,
    aktiv: aktiveChips.has(c.id),
    onToggle: () => setAktiveChips(v => {
      const n = new Set(v);
      n.has(c.id) ? n.delete(c.id) : n.add(c.id);
      return n;
    }),
  }));

  const gefiltert = useMemo(() => {
    const suchtext = suche.trim().toLowerCase();
    return zeilen.filter(z => {
      if (suchtext && !z.name.toLowerCase().includes(suchtext)
        && !z.zustaendig.toLowerCase().includes(suchtext)) return false;
      /* Chips wirken UND — wie in den übrigen Listen. */
      for (const id of aktiveChips) {
        const c = CHIPS.find(x => x.id === id);
        if (c && !c.praedikat(z)) return false;
      }
      return true;
    });
  }, [zeilen, suche, aktiveChips]);

  const sortiert = useMemo(() => {
    const f = sort.dir === "asc" ? 1 : -1;
    return [...gefiltert].sort((a, b) => {
      switch (sort.key) {
        /* Wer nichts Offenes hat, steht in beiden Richtungen zuletzt: die
           Liste ist eine Arbeitsliste, und eine erledigte Zeile soll sie
           nicht anführen, nur weil man die Richtung umkehrt. */
        case "offen": return leerZuletzt(a.k.offen === 0, b.k.offen === 0, f, () => a.k.offen - b.k.offen);
        case "abweichung": return leerZuletzt(a.k.abweichungsTage === 0, b.k.abweichungsTage === 0, f, () => a.k.abweichungsTage - b.k.abweichungsTage);
        case "ohne_einsatz": return leerZuletzt(a.k.ohneEinsatz === 0, b.k.ohneEinsatz === 0, f, () => a.k.ohneEinsatz - b.k.ohneEinsatz);
        case "nicht_gedeckt": return leerZuletzt(a.k.gemeldet === null, b.k.gemeldet === null, f, () => a.k.abrechnung.nichtGedeckt - b.k.abrechnung.nichtGedeckt);
        case "berichte": return f * (a.k.mitBericht - b.k.mitBericht);
        case "zustaendig": return f * a.zustaendig.localeCompare(b.zustaendig, "de");
        case "urheber": return f * (a.k.urheber[0] ? urheberName(a.k.urheber[0]) : "").localeCompare(b.k.urheber[0] ? urheberName(b.k.urheber[0]) : "", "de");
        default: return f * a.name.localeCompare(b.name, "de");
      }
    });
  }, [gefiltert, sort]);

  const monatWechseln = (schritt: number) => setZeitraum(z => {
    const d = new Date(z.jahr, z.monat + schritt, 1);
    return { jahr: d.getFullYear(), monat: d.getMonth() };
  });

  const zahl = (n: number, farbe?: string) => (
    <span style={{ fontSize: "var(--text-small)", fontVariantNumeric: "tabular-nums", color: farbe ?? "var(--text-primary)" }}>{n}</span>
  );

  const spalten: SpalteDef<Zeile>[] = [
    { id: "patient", label: "Patient", anteil: 18, minCh: 20, align: "left", sortierbar: true,
      render: z => <span style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", whiteSpace: "nowrap" }}>{z.name}</span> },
    { id: "urheber", label: "Erbracht durch", anteil: 16, minCh: 18, align: "left", sortierbar: true, ausblendenUnter: "eng",
      render: z => {
        if (z.k.urheber.length === 0) return null;
        const erster = urheberName(z.k.urheber[0]);
        return (
          <span style={{ fontSize: "var(--text-small)", color: "var(--text-primary)", whiteSpace: "nowrap" }}>
            {z.k.urheber.length === 1 ? erster : `${erster} und weitere`}
          </span>
        );
      } },
    { id: "offen", label: "Offen", anteil: 10, minCh: 11, align: "right", sortierbar: true,
      render: z => (
        <span style={{ fontSize: "var(--text-small)", fontVariantNumeric: "tabular-nums",
          color: z.k.offen > 0 ? "var(--text-primary)" : "var(--text-tertiary)" }}>
          {z.k.offen} von {z.k.einsaetzeGesamt}
        </span>
      ) },
    { id: "abweichung", label: "Abweichungen", anteil: 11, minCh: 13, align: "right", sortierbar: true,
      // Leer bei keiner — eine Null behauptete, dass hier etwas geprüft wurde.
      render: z => z.k.abweichungsTage === 0 ? null : zahl(z.k.abweichungsTage, "var(--status-info)") },
    { id: "ohne_einsatz", label: "Ohne Einsatz", anteil: 11, minCh: 13, align: "right", sortierbar: true,
      render: z => z.k.ohneEinsatz === 0 ? null : zahl(z.k.ohneEinsatz, "var(--status-warning-text)") },
    { id: "nicht_gedeckt", label: "Nicht gedeckt", anteil: 12, minCh: 14, align: "right", sortierbar: true,
      render: z => {
        /* Ohne Bedarfsmeldung gibt es nichts zu vergleichen — dann steht dort
           eine Marke und keine Null. Eine Null hiesse „alles gedeckt". */
        if (z.k.gemeldet === null) return (
          <span style={{ padding: "1px 7px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-micro)", fontWeight: "var(--weight-medium)", background: "var(--bg-secondary)", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
            keine Meldung
          </span>
        );
        if (z.k.abrechnung.nichtGedeckt === 0) return null;
        return (
          <span style={{ fontSize: "var(--text-small)", fontVariantNumeric: "tabular-nums", fontWeight: 500, color: "var(--status-warning-text)" }}>
            {Math.round(z.k.abrechnung.nichtGedeckt)} Min.
          </span>
        );
      } },
    { id: "berichte", label: "Berichte", anteil: 10, minCh: 12, align: "right", sortierbar: true, ausblendenUnter: "eng",
      render: z => (
        <span style={{ fontSize: "var(--text-small)", fontVariantNumeric: "tabular-nums",
          color: berichteFehlen(z.k) ? "var(--status-warning-text)" : "var(--text-primary)" }}>
          {z.k.mitBericht} von {z.k.mitEinsatz}
        </span>
      ) },
    { id: "zustaendig", label: "Zuständig", anteil: 12, minCh: 15, align: "left", sortierbar: true, ausblendenUnter: "eng",
      render: z => <span style={{ fontSize: "var(--text-small)", color: "var(--text-primary)", whiteSpace: "nowrap" }}>{z.zustaendig}</span> },
  ];

  const filterMarken = [
    ...chips.filter(c => aktiveChips.has(c.id as ChipId)).map(c => ({
      key: `c-${c.id}`, label: c.label,
      entfernen: () => setAktiveChips(v => { const n = new Set(v); n.delete(c.id as ChipId); return n; }),
    })),
  ];

  const monatsschaltung = (
    <div className="flex items-center" style={{ gap: 2 }}>
      <button type="button" onClick={() => monatWechseln(-1)} aria-label="Vorheriger Monat"
        className="ui-fokusring cursor-pointer flex items-center justify-center"
        style={{ width: 28, height: 28, borderRadius: 8, background: "none", border: "none", color: "var(--text-secondary)" }}>
        <ChevronLeft style={{ width: 16, height: 16 }} />
      </button>
      <span style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", minWidth: 132, textAlign: "center" }}>
        {MONATE[zeitraum.monat]} {zeitraum.jahr}
      </span>
      <button type="button" onClick={() => monatWechseln(1)} aria-label="Nächster Monat"
        className="ui-fokusring cursor-pointer flex items-center justify-center"
        style={{ width: 28, height: 28, borderRadius: 8, background: "none", border: "none", color: "var(--text-secondary)" }}>
        <ChevronRight style={{ width: 16, height: 16 }} />
      </button>
    </div>
  );

  return (
    <div style={{ padding: "var(--space-6)" }}>
      <ListenGeruest
        titel="Pflegekontrolle"
        zeitraum={monatsschaltung}
        suche={suche} onSuche={setSuche}
        suchePlatzhalter="Patient oder Zuständige suchen"
        chips={chips}
        sichtText={`${zeilen.length} ${zeilen.length === 1 ? "Patient" : "Patienten"} mit Einsätzen im ${MONATE[zeitraum.monat]}`}
        filterMarken={filterMarken}
        onFilterZuruecksetzen={() => { setAktiveChips(new Set()); setSuche(""); }}
      >
        {zeilen.length === 0 ? (
          /* Keine leere Tabelle: ohne Erfassung gibt es keine Spalten zu
             füllen, und ein Kopf über nichts sähe aus wie ein Fehler. */
          <div style={{ padding: "28px 4px", fontSize: "var(--text-small)", color: "var(--text-secondary)", maxWidth: "74ch" }}>
            Für {MONATE[zeitraum.monat]} {zeitraum.jahr} sind keine Einsätze erfasst. Wählen Sie oben einen anderen Monat.
          </div>
        ) : (
          <DataTable
            spalten={spalten}
            zeilen={sortiert}
            zeilenKey={z => z.id}
            karteTitel={z => z.name}
            sort={sort}
            onSort={key => setSort(s => s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" })}
            /* Der gewählte Monat geht mit — sonst zeigte die Detailansicht
               ihren eigenen Startmonat und damit andere Zahlen. */
            onZeileKlick={z => nav(`${ansichtPfad(z.id, "pflegekontrolle")}?monat=${zeitraum.jahr}-${String(zeitraum.monat + 1).padStart(2, "0")}`)}
            leerText="Keine Zeile entspricht der Auswahl."
          />
        )}
      </ListenGeruest>
    </div>
  );
}
