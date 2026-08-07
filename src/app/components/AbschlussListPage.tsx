/**
 * Monatsabschluss — der Übergabepunkt für einen abgerechneten Monat.
 *
 * Abgerechnet wird monatlich, jeweils der Vormonat, direkt mit dem
 * Versicherer. Der Abschluss setzt den Punkt, ab dem gilt: geprüft, gesperrt,
 * verrechenbar, lohnwirksam.
 *
 * ZWEI ZAHLEN, DIE AUSEINANDERGEHEN, stehen deshalb nebeneinander und nie
 * zusammengefasst: verrechenbar ist die getaktete Zeit, die an die Kasse
 * geht; gearbeitet ist die gestempelte Zeit, die in den Lohn geht. Der
 * Arbeitgeber schuldet den Lohn unabhängig davon, ob die Kasse zahlt.
 *
 * Die Bedarfsmeldung ist dabei eine Prognose, kein Kontingent — der
 * Administrativvertrag nennt die *voraussichtliche* Anzahl Minuten je
 * Leistungsart. Eine Überschreitung ist kein Verstoss, sondern ein Grund für
 * genauere Prüfung, und wird entsprechend benannt statt gerügt.
 *
 * Die Zahlen kommen aus `monatsKennzahlen`, derselben Funktion, die auch das
 * Dossier speist. Eine zweite Rechnung liefe auseinander, und dann stünde
 * hier eine andere Zahl als dort, wohin die Zeile verweist.
 */
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, ChevronRight, AlertTriangle, Lock } from "lucide-react";
import { ListenGeruest, type ListenChip } from "./ui/ListenGeruest";
import { DataTable, type SpalteDef } from "./ui/DataTable";
import { useEinsaetze, useErbrachteLeistungen, EINSATZ_BEZUGSMONAT } from "../../lib/einsaetze/store";
import { useKlvVerordnungen } from "../../lib/klv/store";
import { useMandate } from "../../lib/mandate/store";
import { useVerordnungen } from "../../lib/mandate/verordnungen-store";
import { usePatienten } from "../../lib/patienten/store";
import { MONATE } from "../../lib/einsaetze/einsaetze";
import { monatsKennzahlen, quartalMinuten, type MonatsKennzahlen } from "../../lib/einsaetze/kontrolle";
import { abschlussLage, BLOCKADE_TEXT, QUARTALSSCHWELLE_STUNDEN, type AbschlussLage, type Monatsabschluss } from "../../lib/abschluss/abschluss";
import { TAKT_MINUTEN, MINDESTWERT_EINSATZ } from "../../lib/abrechnung/leistungsarten";
import { TARIF_KATEGORIEN, type TarifKategorie } from "../../lib/stammdaten/pflegetarife";
import { useAbschluesse, getAbschluss, getOeffnungen, monatAbschliessen, monatWiederOeffnen } from "../../lib/abschluss/store";
import { jetztAnzeige } from "../../lib/datum";
import { AppButton } from "./ui/AppButton";
import { ansichtPfad } from "./Patient360Page";
import { leerZuletzt } from "../../lib/sortierung";

interface Zeile {
  id: string;
  name: string;
  zustaendig: string;
  k: MonatsKennzahlen;
  lage: AbschlussLage;
  /** Verrechenbare Minuten des Quartals, in dem der Monat liegt. */
  quartal: number;
  abschluss: Monatsabschluss | null;
}

/** Überschrift eines Kopffelds — dieselbe Gestaltung wie in den übrigen Leisten. */
function KopfTitel({ text }: { text: string }) {
  return (
    <div className="text-[11px] text-muted-foreground uppercase tracking-wider" style={{ fontWeight: 500, marginBottom: 1 }}>{text}</div>
  );
}

/* Wer im Cockpit angemeldet ist — dieselbe Person wie in den übrigen
   Schreibwegen, für den Prototyp fest. */
const AKTUELLE_PERSON = "Maria Keller";

/* ── Chips. Die Bedingung steht hier, die Darstellung im Gerüst. ─────────────
   Kein eigener Filtermechanismus: `ListenGeruest` bekommt fertige Chips mit
   Zahl und Zustand und meldet Klicks zurück. */
type ChipId = "blockiert" | "bereit" | "abgeschlossen" | "ueber_meldung" | "ueber_quartal";

const CHIPS: { id: ChipId; label: string; praedikat: (z: Zeile) => boolean }[] = [
  { id: "blockiert", label: "Blockiert", praedikat: z => !z.abschluss && !z.lage.bereit },
  { id: "bereit", label: "Bereit", praedikat: z => !z.abschluss && z.lage.bereit },
  { id: "abgeschlossen", label: "Abgeschlossen", praedikat: z => z.abschluss !== null },
  { id: "ueber_meldung", label: "Über der Meldung", praedikat: z => z.k.abrechnung.nichtGedeckt > 0 },
  { id: "ueber_quartal", label: `Über ${QUARTALSSCHWELLE_STUNDEN} Std. im Quartal`, praedikat: z => z.quartal / 60 > QUARTALSSCHWELLE_STUNDEN },
];

export function AbschlussListPage() {
  const nav = useNavigate();
  const einsaetze = useEinsaetze();
  const leistungen = useErbrachteLeistungen();
  const klvs = useKlvVerordnungen();
  const mandate = useMandate();
  const verordnungen = useVerordnungen();
  const patienten = usePatienten();

  /* Kommt der Aufruf aus einer Pflegekontrolle, trägt die Adresse den dort
     gewählten Monat — sonst spränge die Liste auf ihren eigenen Startmonat. */
  const [zeitraum, setZeitraum] = useState(() => {
    const p = new URLSearchParams(window.location.search).get("monat");
    const m = p && /^(\d{4})-(\d{2})$/.exec(p);
    return m
      ? { jahr: Number(m[1]), monat: Number(m[2]) - 1 }
      : { jahr: EINSATZ_BEZUGSMONAT.getFullYear(), monat: EINSATZ_BEZUGSMONAT.getMonth() };
  });
  const [suche, setSuche] = useState("");
  const [aktiveChips, setAktiveChips] = useState<Set<ChipId>>(new Set());
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" }>({ key: "status", dir: "desc" });
  const abschluesse = useAbschluesse();
  /* Zwei Dialoge, ein Zustand: was abgeschlossen wird (eine Zeile oder alle
     bereiten) und was wieder geöffnet wird. */
  const [abschlussDialog, setAbschlussDialog] = useState<Zeile[] | null>(null);
  const [oeffnenDialog, setOeffnenDialog] = useState<Zeile | null>(null);
  const [oeffnenGrund, setOeffnenGrund] = useState("");
  const [meldung, setMeldung] = useState("");

  /* Nur Patienten mit Erfassung im Monat. Wer im Monat nichts hat, ist keine
     leere Zeile, sondern gar keine. */
  const zeilen: Zeile[] = useMemo(() => {
    const quellen = { einsaetze, leistungen, klvs, mandate, verordnungen };
    const praefix = `${String(zeitraum.monat + 1).padStart(2, "0")}.${zeitraum.jahr}`;
    const mitEinsatz = new Set(einsaetze.filter(e => e.datum.endsWith(praefix)).map(e => e.patientId));
    return [...mitEinsatz].map(id => {
      const p = patienten.find(x => x.id === id);
      const m = mandate.find(x => x.patientId === id);
      const k = monatsKennzahlen(id, zeitraum.jahr, zeitraum.monat, quellen);
      return {
        id,
        name: p ? `${p.nachname}, ${p.vorname}` : id,
        zustaendig: m?.zustaendigePerson ?? "",
        k,
        lage: abschlussLage(k.offen, k.abweichungOhneGrund, k.gemeldet !== null),
        quartal: quartalMinuten(id, zeitraum.jahr, zeitraum.monat, quellen),
        abschluss: getAbschluss(id, zeitraum.jahr, zeitraum.monat),
      };
    });
  }, [einsaetze, leistungen, klvs, mandate, verordnungen, patienten, zeitraum, abschluesse]);

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
    /* Rang statt Wahrheitswert: blockiert vor bereit vor abgeschlossen. Die
       Liste ist eine Arbeitsliste — was zu tun ist, steht oben. */
    const rang = (z: Zeile) => z.abschluss ? 2 : z.lage.bereit ? 1 : 0;
    return [...gefiltert].sort((a, b) => {
      switch (sort.key) {
        case "status": {
          const d = rang(a) - rang(b);
          return d !== 0 ? (sort.dir === "desc" ? d : -d) : a.name.localeCompare(b.name, "de");
        }
        case "verrechenbar": return f * (a.k.abrechnung.abrechenbar - b.k.abrechnung.abrechenbar);
        case "art_a": case "art_b": case "art_c": {
          const code = sort.key.slice(4) as TarifKategorie;
          return f * (a.k.abrechnung.jeArt[code].abrechenbar - b.k.abrechnung.jeArt[code].abrechenbar);
        }
        case "gearbeitet": return f * (a.k.abrechnung.gestempelt - b.k.abrechnung.gestempelt);
        case "meldung": return leerZuletzt(a.k.gemeldet === null, b.k.gemeldet === null, f,
          () => a.k.abrechnung.nichtGedeckt - b.k.abrechnung.nichtGedeckt);
        case "quartal": return f * (a.quartal - b.quartal);
        /* Wer nichts Offenes hat, steht in beiden Richtungen zuletzt: eine
           erledigte Zeile soll die Arbeitsliste nicht anführen, nur weil man
           die Richtung umkehrt. */
        case "differenz": return f * (a.k.abrechnung.ausRundung - b.k.abrechnung.ausRundung);
        case "zustaendig": return f * a.zustaendig.localeCompare(b.zustaendig, "de");
        default: return f * a.name.localeCompare(b.name, "de");
      }
    });
  }, [gefiltert, sort]);

  const monatWechseln = (schritt: number) => setZeitraum(z => {
    const d = new Date(z.jahr, z.monat + schritt, 1);
    return { jahr: d.getFullYear(), monat: d.getMonth() };
  });

  /* Immer alle drei Leistungsarten, auch ohne Minuten.
     a, b und c sind die geschlossene Menge aus Art. 7 Abs. 2 KLV. Eine
     weggelassene Spalte liest sich als „gibt es nicht" statt als „null", und
     die Tabelle änderte je Monat ihre Form — wer zwei Monate vergleicht,
     fände die Spalten an anderer Stelle. Eine Null in a ist überdies selbst
     ein Befund: es ist die teuerste Kategorie, und wenn einen Monat lang
     nichts anfällt, wurde entweder nicht abgeklärt oder nicht erfasst. */
  const arten = TARIF_KATEGORIEN;
  const summeJeArt = (code: TarifKategorie) => zeilen.reduce((s, z) => s + z.k.abrechnung.jeArt[code].abrechenbar, 0);

  const bereite = zeilen.filter(z => !z.abschluss && z.lage.bereit);

  const abschliessen = (welche: Zeile[]) => {
    const jetzt = jetztAnzeige();
    welche.forEach(z => monatAbschliessen(z.id, zeitraum.jahr, zeitraum.monat, AKTUELLE_PERSON, jetzt));
    setAbschlussDialog(null);
    setMeldung(`${welche.length} ${welche.length === 1 ? "Monat abgeschlossen" : "Monate abgeschlossen"}. Die Erfassung dieses Zeitraums ist gesperrt.`);
  };

  const wiederOeffnen = () => {
    if (!oeffnenDialog || !oeffnenGrund.trim()) return;
    monatWiederOeffnen(oeffnenDialog.id, zeitraum.jahr, zeitraum.monat, oeffnenGrund, AKTUELLE_PERSON, jetztAnzeige());
    setMeldung(`${oeffnenDialog.name}: Monat wieder geöffnet. Grund, Person und Zeitpunkt sind protokolliert.`);
    setOeffnenDialog(null);
    setOeffnenGrund("");
  };

  const min = (n: number) => `${Math.round(n)} Min.`;
  const std = (n: number) => (n / 60).toFixed(1).replace(".", ",");

  const zahl = (n: number, farbe?: string) => (
    <span style={{ fontSize: "var(--text-small)", fontVariantNumeric: "tabular-nums", color: farbe ?? "var(--text-primary)" }}>{n}</span>
  );

  const spalten: SpalteDef<Zeile>[] = [
    { id: "patient", label: "Patient", anteil: 20, minCh: 22, align: "left", sortierbar: true,
      render: z => <span style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", whiteSpace: "nowrap" }}>{z.name}</span> },
    /* Verrechenbar, gearbeitet und ihre Differenz stehen nebeneinander und
       werden nie zusammengefasst: das eine geht an die Kasse, das andere in
       den Lohn, und die Differenz erklärt, warum sie auseinandergehen. */
    /* Je Leistungsart eine Spalte: die Rechnung an den Versicherer geht je
       Art, mit eigenen Tarifen, und die Bedarfsmeldung nennt Minuten je Art
       pro Monat. Eine Gesamtsumme allein sagt nicht, was abgerechnet wird. */
    ...arten.map(k => ({
      id: `art_${k.code}`,
      label: k.code.toUpperCase(),
      anteil: 7, minCh: 7, align: "right" as const, sortierbar: true,
      render: (z: Zeile) => {
        /* Null, nicht Strich: ein Strich hiesse „unbekannt". Hier ist es
           gemessen — die Einsätze des Monats sind erfasst, diese Kategorie
           kam darin nicht vor. Gedämpft, weil sie nichts zu prüfen gibt. */
        const m = Math.round(z.k.abrechnung.jeArt[k.code].abrechenbar);
        return zahl(m, m === 0 ? "var(--text-tertiary)" : undefined);
      },
    })),
    { id: "verrechenbar", label: "Total", anteil: 9, minCh: 9, align: "right", sortierbar: true,
      render: z => (
        <span style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", fontVariantNumeric: "tabular-nums", color: "var(--text-primary)" }}>
          {Math.round(z.k.abrechnung.abrechenbar)}
        </span>
      ) },
    { id: "gearbeitet", label: "Gearbeitet", anteil: 13, minCh: 12, align: "right", sortierbar: true,
      render: z => zahl(Math.round(z.k.abrechnung.gestempelt), "var(--text-secondary)") },
    { id: "differenz", label: "Differenz", anteil: 11, minCh: 11, align: "right", sortierbar: true,
      render: z => (
        <span title={`Aus dem ${TAKT_MINUTEN}-Minuten-Takt: je Einsatz und Leistungsart wird aufgerundet, mindestens ${MINDESTWERT_EINSATZ} Minuten je Einsatz.`}
          style={{ fontSize: "var(--text-small)", fontVariantNumeric: "tabular-nums", color: "var(--text-secondary)", cursor: "help" }}>
          + {Math.round(z.k.abrechnung.ausRundung)}
        </span>
      ) },
    { id: "meldung", label: "Gegen Meldung", anteil: 15, minCh: 15, align: "right", sortierbar: true,
      render: z => {
        /* Ohne Bedarfsmeldung gibt es nichts zu vergleichen — dann steht dort
           eine Marke und keine Null. Eine Null hiesse „im Rahmen". */
        if (z.k.gemeldet === null) return (
          <span style={{ padding: "1px 7px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-micro)", fontWeight: "var(--weight-medium)", background: "var(--bg-secondary)", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
            keine Meldung
          </span>
        );
        if (z.k.abrechnung.nichtGedeckt === 0) return (
          <span style={{ fontSize: "var(--text-small)", color: "var(--text-tertiary)", whiteSpace: "nowrap" }}>im Rahmen</span>
        );
        /* Die Meldung ist eine Prognose, kein Kontingent — genannt wird
           deshalb, welche Leistungsart wie weit darüber liegt, nicht ein
           Verstoss. */
        return (
          <span style={{ fontSize: "var(--text-small)", fontVariantNumeric: "tabular-nums", color: "var(--status-warning-text)", whiteSpace: "nowrap" }}>
            {z.k.abrechnung.betroffene.join(", ")} +{Math.round(z.k.abrechnung.nichtGedeckt)} Min.
          </span>
        );
      } },
    { id: "status", label: "Status", anteil: 28, minCh: 30, align: "left", sortierbar: true,
      render: z => {
        /* Die Quartalsschwelle blockiert nicht — sie weist hin. Über 60
           Pflichtleistungsstunden je Quartal kann der Versicherer eine
           Leistungsprüfung veranlassen; bei einer Angehörigen-Spitex ist das
           der Regelfall und kein Fehler. */
        const quartalsmarke = z.quartal / 60 > QUARTALSSCHWELLE_STUNDEN ? (
          <span
            title={`${std(z.quartal)} Stunden im laufenden Quartal — über ${QUARTALSSCHWELLE_STUNDEN} kann der Versicherer eine Leistungsprüfung veranlassen. Der Abschluss ist davon nicht betroffen.`}
            style={{ padding: "1px 7px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-micro)", fontWeight: "var(--weight-medium)", background: "var(--status-warning-bg)", color: "var(--status-warning-text)", whiteSpace: "nowrap", cursor: "help" }}>
            Quartal {std(z.quartal)} Std.
          </span>
        ) : null;

        if (z.abschluss) return (
          <div className="flex items-center" style={{ gap: 8 }}>
            <span className="inline-flex items-center" style={{ gap: 5, padding: "1px 8px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-micro)", fontWeight: "var(--weight-medium)", background: "var(--status-success-bg)", color: "var(--status-success-text)", whiteSpace: "nowrap" }}>
              <Lock style={{ width: 10, height: 10 }} /> Abgeschlossen
            </span>
            <span style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", whiteSpace: "nowrap" }}>
              {z.abschluss.zeitpunkt} · {z.abschluss.person}
            </span>
            {quartalsmarke}
            <button type="button" onClick={e => { e.stopPropagation(); setOeffnenDialog(z); setOeffnenGrund(""); }}
              className="ui-fokusring cursor-pointer" style={{ marginLeft: "auto", background: "none", border: "none", padding: 0, fontFamily: "inherit", fontSize: "var(--text-micro)", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
              Wieder öffnen
            </button>
          </div>
        );
        if (z.lage.bereit) return (
          <div className="flex items-center" style={{ gap: 8 }}>
            <span style={{ padding: "1px 8px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-micro)", fontWeight: "var(--weight-medium)", background: "var(--brand-primary-light)", color: "var(--brand-primary)", whiteSpace: "nowrap" }}>Bereit</span>
            {quartalsmarke}
            <button type="button" onClick={e => { e.stopPropagation(); setAbschlussDialog([z]); }}
              className="ui-fokusring cursor-pointer" style={{ marginLeft: "auto", background: "none", border: "none", padding: 0, fontFamily: "inherit", fontSize: "var(--text-micro)", fontWeight: 500, color: "var(--brand-primary)", whiteSpace: "nowrap" }}>
              Abschliessen
            </button>
          </div>
        );
        return (
          <div className="flex items-center" style={{ gap: 8 }}>
            <span className="inline-flex items-center" style={{ gap: 6, fontSize: "var(--text-small)", color: "var(--status-warning-text)", whiteSpace: "nowrap" }}>
              <AlertTriangle style={{ width: 12, height: 12, flexShrink: 0 }} />
              {z.lage.grund ? BLOCKADE_TEXT[z.lage.grund] : "Blockiert"}
            </span>
            {quartalsmarke}
          </div>
        );
      } },
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

  const summeVerrechenbar = zeilen.reduce((s, z) => s + z.k.abrechnung.abrechenbar, 0);
  const summeGearbeitet = zeilen.reduce((s, z) => s + z.k.abrechnung.gestempelt, 0);
  const abgeschlosseneZahl = zeilen.filter(z => z.abschluss).length;
  const trenner = { borderLeft: "var(--border-thin) solid var(--border-default)", paddingLeft: 18 } as const;

  return (
    <div style={{ padding: "var(--space-6)" }}>
      <ListenGeruest
        titel="Monatsabschluss"
        zeitraum={monatsschaltung}
        aktion={bereite.length > 0
          ? <AppButton onClick={() => setAbschlussDialog(bereite)}>Alle bereiten abschliessen ({bereite.length})</AppButton>
          : undefined}
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
            Für {MONATE[zeitraum.monat]} {zeitraum.jahr} sind keine Einsätze erfasst. Es gibt nichts abzuschliessen —
            wählen Sie oben einen anderen Monat.
          </div>
        ) : (
          <>
            {/* ── Totale des Monats ──
                Beim Abschluss zählt zuerst, wie weit der Monat insgesamt ist —
                bei fünfhundert Patienten mehr als jede einzelne Zeile.
                Gestaltung wie die Urteilsleiste der Pflegekontrolle: Felder
                nebeneinander, durch senkrechte Linien getrennt. */}
            <div className="flex flex-col sm:flex-row" style={{ padding: "11px 18px", gap: 18, marginBottom: "var(--space-3)",
              background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)" }}>
              {/* Das Total gross, darunter die Leistungsarten einzeln —
                  abgerechnet wird je Art, mit eigenen Tarifen. */}
              <div style={{ minWidth: 190 }}>
                <KopfTitel text="Verrechenbar" />
                <div style={{ fontSize: "var(--text-h3)", fontWeight: "var(--weight-medium)", fontVariantNumeric: "tabular-nums", lineHeight: 1.25 }}>
                  {Math.round(summeVerrechenbar)} Min.
                </div>
                <div className="flex items-baseline" style={{ gap: 10, fontSize: "var(--text-micro)", color: "var(--text-tertiary)", fontVariantNumeric: "tabular-nums" }}>
                  {arten.map(k => (
                    <span key={k.code}>{k.code.toUpperCase()} {Math.round(summeJeArt(k.code))}</span>
                  ))}
                </div>
              </div>
              <div style={{ minWidth: 140, ...trenner }}>
                <KopfTitel text="Gearbeitet" />
                <div style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", fontVariantNumeric: "tabular-nums", lineHeight: 1.35 }}>
                  {Math.round(summeGearbeitet)} Min.
                </div>
                <div style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>lohnwirksam</div>
              </div>
              <div style={{ minWidth: 160, ...trenner }}>
                <KopfTitel text="Differenz" />
                <div style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", fontVariantNumeric: "tabular-nums", lineHeight: 1.35, color: "var(--text-secondary)" }}>
                  + {Math.round(summeVerrechenbar - summeGearbeitet)} Min.
                </div>
                <div style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>aus dem {TAKT_MINUTEN}-Minuten-Takt</div>
              </div>
              <div style={{ minWidth: 130, ...trenner }}>
                <KopfTitel text="Bereit" />
                <div style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", fontVariantNumeric: "tabular-nums", lineHeight: 1.35 }}>
                  {abgeschlosseneZahl === zeilen.length ? "alle bereit" : `${bereite.length} von ${zeilen.length}`}
                </div>
                <div style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>
                  {abgeschlosseneZahl} abgeschlossen
                </div>
              </div>
            </div>

            {meldung && (
              <div style={{ padding: "10px 12px", marginBottom: "var(--space-3)", borderRadius: 10, background: "var(--status-info-bg)", fontSize: "var(--text-meta)", color: "var(--status-info)" }}>{meldung}</div>
            )}

            <DataTable
              spalten={spalten}
              gruppen={[{ label: "Verrechenbar", spalten: [...arten.map(k => `art_${k.code}`), "verrechenbar"] }]}
              zeilen={sortiert}
              zeilenKey={z => z.id}
              karteTitel={z => z.name}
              sort={sort}
              onSort={key => setSort(s => s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" })}
              /* Der gewählte Monat geht mit — sonst zeigte die Pflegekontrolle
                 ihren eigenen Startmonat und damit andere Zahlen. */
              onZeileKlick={z => nav(`${ansichtPfad(z.id, "pflegekontrolle")}?monat=${zeitraum.jahr}-${String(zeitraum.monat + 1).padStart(2, "0")}`)}
              leerText="Keine Zeile entspricht der Auswahl."
            />
          </>
        )}
      </ListenGeruest>

      {/* ── Bestätigung vor dem Abschluss ──
          Nennt beide Summen und die Folge. Der Abschluss sperrt die Erfassung
          eines ganzen Monats; das darf kein Klick nebenbei sein. */}
      {abschlussDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "color-mix(in srgb, var(--text-primary) 40%, transparent)", padding: 16 }}
          onClick={() => setAbschlussDialog(null)}
          onKeyDown={e => { if (e.key === "Escape") setAbschlussDialog(null); }}
          role="dialog" aria-modal="true" aria-label="Monat abschliessen">
          <div onClick={e => e.stopPropagation()}
            style={{ width: "100%", maxWidth: 460, background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-overlay)", padding: "var(--space-6)" }}>
            <div className="flex items-center" style={{ gap: 10, marginBottom: 10 }}>
              <span className="shrink-0 flex items-center justify-center" style={{ width: 32, height: 32, borderRadius: "var(--radius-pill)", background: "var(--brand-primary-light)" }}>
                <Lock style={{ width: 15, height: 15, color: "var(--brand-primary)" }} />
              </span>
              <span style={{ fontSize: "var(--text-h3)", fontWeight: "var(--weight-semibold)" }}>
                {MONATE[zeitraum.monat]} {zeitraum.jahr} abschliessen
              </span>
            </div>
            <p style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", marginBottom: 12, lineHeight: 1.6 }}>
              {abschlussDialog.length === 1
                ? `Der Monat wird für ${abschlussDialog[0].name} abgeschlossen.`
                : `Der Monat wird für ${abschlussDialog.length} Patienten abgeschlossen.`}
            </p>
            <div className="flex flex-col" style={{ gap: 5, padding: "10px 12px", borderRadius: 10, background: "var(--bg-secondary)", marginBottom: 12 }}>
              <div className="flex items-baseline" style={{ gap: 8 }}>
                <span style={{ flex: 1, fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>Verrechenbar an den Versicherer</span>
                <span style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", fontVariantNumeric: "tabular-nums" }}>
                  {min(abschlussDialog.reduce((s, z) => s + z.k.abrechnung.abrechenbar, 0))}
                </span>
              </div>
              <div className="flex items-baseline" style={{ gap: 8 }}>
                <span style={{ flex: 1, fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>Gearbeitet, lohnwirksam</span>
                <span style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", fontVariantNumeric: "tabular-nums" }}>
                  {min(abschlussDialog.reduce((s, z) => s + z.k.abrechnung.gestempelt, 0))}
                </span>
              </div>
            </div>
            <p style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", marginBottom: 16, lineHeight: 1.6 }}>
              Danach ist die Erfassung dieses Zeitraums gesperrt: Einsätze, erbrachte Leistungen und
              Pflegeberichte lassen sich nicht mehr ändern — auch nicht über die mobile Anwendung.
              Ein Abschluss lässt sich mit Begründung wieder öffnen.
            </p>
            <div className="flex items-center justify-end" style={{ gap: 10 }}>
              <button type="button" onClick={() => setAbschlussDialog(null)} className="ui-fokusring cursor-pointer"
                style={{ background: "none", border: "none", padding: "6px 10px", fontFamily: "inherit", fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>
                Abbrechen
              </button>
              <AppButton onClick={() => abschliessen(abschlussDialog)}>
                {abschlussDialog.length === 1 ? "Abschliessen" : `${abschlussDialog.length} abschliessen`}
              </AppButton>
            </div>
          </div>
        </div>
      )}

      {/* ── Wieder öffnen: Grund erforderlich ── */}
      {oeffnenDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "color-mix(in srgb, var(--text-primary) 40%, transparent)", padding: 16 }}
          onClick={() => setOeffnenDialog(null)}
          onKeyDown={e => { if (e.key === "Escape") setOeffnenDialog(null); }}
          role="dialog" aria-modal="true" aria-label="Monat wieder öffnen">
          <div onClick={e => e.stopPropagation()}
            style={{ width: "100%", maxWidth: 460, background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-overlay)", padding: "var(--space-6)" }}>
            <div style={{ fontSize: "var(--text-h3)", fontWeight: "var(--weight-semibold)", marginBottom: 8 }}>
              Monat wieder öffnen
            </div>
            <p style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", marginBottom: 14, lineHeight: 1.6 }}>
              {MONATE[zeitraum.monat]} {zeitraum.jahr} für {oeffnenDialog.name} wird wieder bearbeitbar.
              Ein Grund ist erforderlich; Grund, Person und Zeitpunkt werden protokolliert — bei einer
              Kontrolle muss erkennbar bleiben, ob korrigiert oder nachgebessert wurde.
            </p>
            <label htmlFor="oeffnen-grund" style={{ display: "block", fontSize: "var(--text-meta)", color: "var(--text-secondary)", marginBottom: 4 }}>Grund</label>
            <textarea id="oeffnen-grund" value={oeffnenGrund} onChange={e => setOeffnenGrund(e.target.value)}
              autoFocus rows={3} placeholder="z. B. Einsatz vom 14. war falsch erfasst, Korrektur durch die Fachperson"
              style={{ width: "100%", resize: "vertical", padding: "10px 12px", fontSize: "var(--text-small)", fontFamily: "inherit", color: "var(--text-primary)", background: "var(--bg-secondary)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-input)" }} />
            {getOeffnungen(oeffnenDialog.id, zeitraum.jahr, zeitraum.monat).length > 0 && (
              <div style={{ marginTop: 12, paddingTop: 10, borderTop: "var(--border-thin) solid var(--border-default)" }}>
                <div style={{ fontSize: "var(--text-micro)", fontWeight: 500, color: "var(--text-secondary)", marginBottom: 5 }}>Frühere Öffnungen</div>
                {getOeffnungen(oeffnenDialog.id, zeitraum.jahr, zeitraum.monat).map((o, i) => (
                  <div key={i} style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", marginTop: 3 }}>
                    {o.zeitpunkt} · {o.person} — {o.grund}
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center justify-end" style={{ gap: 10, marginTop: 16 }}>
              <button type="button" onClick={() => setOeffnenDialog(null)} className="ui-fokusring cursor-pointer"
                style={{ background: "none", border: "none", padding: "6px 10px", fontFamily: "inherit", fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>
                Abbrechen
              </button>
              <AppButton variant="sekundaer" onClick={wiederOeffnen}>Wieder öffnen</AppButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
