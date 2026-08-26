import { useState, useMemo } from "react";
import { BookUser, Plus } from "lucide-react";
import { DataTable, type SpalteDef } from "./ui/DataTable";
import { AuswahlDropdown } from "./ui/AuswahlDropdown";
import { ListenGeruest } from "./ui/ListenGeruest";
import { InlineSelect } from "./ui/InlineSelect";
import { AppButton } from "./ui/AppButton";
import { useKontakte, kontaktSichern, kontaktLoeschen } from "../../lib/kontakte/store";
import { kontaktName, type Kontakt } from "../../lib/kontakte/kontakte";
import { KONTAKTTYP, KONTAKTTYP_OPTIONS, kontakttypLabel } from "../../lib/stammdaten/kontakttypen";
import { useBeziehungen } from "../../lib/beziehungen/store";

/**
 * Kontakte — dritte Personen, die weder Patient noch angehörige Person noch
 * Mitarbeitende sind.
 *
 * DIE NAMEN DER VERKNÜPFTEN PATIENTEN ERSCHEINEN HIER NICHT. Gezählt wird
 * nur, wie viele es sind. Wer sie sehen will, geht über den Patienten, wo
 * die Zuständigkeit ohnehin geprüft ist — eine Liste, die neben „Dr. Frei"
 * vier Patientennamen zeigte, machte aus dem Adressbuch ein Verzeichnis
 * darüber, wer bei wem in Behandlung ist. Das ist Berufsgeheimnis nach
 * Art. 321 StGB und gehört nicht in eine Übersicht, die dem Suchen nach
 * einer Telefonnummer dient.
 */
export function KontaktePage() {
  const kontakte = useKontakte();
  const beziehungen = useBeziehungen();
  const [suche, setSuche] = useState("");
  const [typen, setTypen] = useState<Set<string>>(new Set());
  /* "" = neu, Kennung = ändern, null = geschlossen. */
  const [formular, setFormular] = useState<string | null>(null);
  const [meldung, setMeldung] = useState("");

  /* Nur die Zahl — siehe Kopfkommentar. */
  const verknuepfungen = (id: string) =>
    beziehungen.filter(b => b.person.art === "kontakt" && b.person.kennung === id).length;

  const gefiltert = useMemo(() => {
    const q = suche.trim().toLowerCase();
    return kontakte.filter(k => {
      if (typen.size > 0 && !typen.has(k.typ)) return false;
      if (q && !(`${k.name} ${k.vorname}`.toLowerCase().includes(q) || k.zugehoerigkeit.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [kontakte, typen, suche]);

  const toggleTyp = (t: string) => setTypen(s => {
    const n = new Set(s);
    if (n.has(t)) n.delete(t); else n.add(t);
    return n;
  });

  const spalten: SpalteDef<Kontakt>[] = [
    { id: "name", label: "Name", anteil: 24, minCh: 20, align: "left", sortierbar: true,
      render: k => <span style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>{kontaktName(k)}</span> },
    { id: "typ", label: "Typ", anteil: 14, minCh: 12, align: "left", sortierbar: true,
      render: k => (
        <span style={{ padding: "2px 10px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", background: "var(--bg-secondary)", color: "var(--text-secondary)", border: "var(--border-thin) solid var(--border-default)", whiteSpace: "nowrap" }}>
          {kontakttypLabel(k.typ)}
        </span>
      ) },
    { id: "zugehoerigkeit", label: "Zugehörigkeit", anteil: 26, minCh: 16, align: "left", sortierbar: true,
      render: k => <span style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>{k.zugehoerigkeit || "—"}</span> },
    { id: "telefon", label: "Telefon", anteil: 18, minCh: 14, align: "left", sortierbar: true,
      render: k => <span style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>{k.telefon || "—"}</span> },
    { id: "verknuepfungen", label: "Verknüpfungen", anteil: 12, minCh: 12, align: "left", sortierbar: true,
      render: k => {
        const n = verknuepfungen(k.id);
        return <span style={{ fontSize: "var(--text-small)", color: n === 0 ? "var(--text-tertiary)" : "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>{n === 0 ? "keine" : n}</span>;
      } },
  ];

  return (
    <div className="flex flex-col h-full min-h-0">
      <div style={{ padding: "var(--space-4) var(--space-6) 0" }}>
        <ListenGeruest
          titel="Kontakte"
          aktion={formular === null
            ? <AppButton variant="primaer" icon={Plus} onClick={() => setFormular("")}>Kontakt erfassen</AppButton>
            : undefined}
          suche={suche} onSuche={setSuche}
          suchePlatzhalter="Name oder Zugehörigkeit suchen…"
          auswahlfelder={<AuswahlDropdown label="Typ" optionen={KONTAKTTYP.map(t => ({ value: t.code, label: t.label }))} ausgewaehlt={typen} onToggle={toggleTyp} />}
          chips={[]}
          sichtText={`Alle Kontakte · ${kontakte.length} erfasst`}
          filterMarken={[...typen].map(t => ({ key: t, label: `Typ: ${kontakttypLabel(t)}`, entfernen: () => toggleTyp(t) }))}
          onFilterZuruecksetzen={() => setTypen(new Set())}
        >{null}</ListenGeruest>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ padding: "0 var(--space-6) var(--space-4)" }}>
        {meldung && (
          <div style={{ padding: "10px 12px", borderRadius: 10, background: "var(--status-warning-bg)", fontSize: "var(--text-meta)", color: "var(--status-warning-text)", marginBottom: 12 }}>{meldung}</div>
        )}
        {formular !== null && (
          <KontaktFormular
            key={formular || "neu"}
            eintrag={formular ? kontakte.find(k => k.id === formular) ?? null : null}
            onFertig={() => { setFormular(null); setMeldung(""); }}
          />
        )}
        {kontakte.length === 0 ? (
          <div style={{ background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)", padding: "2.5rem 1.5rem", textAlign: "center" }}>
            <BookUser style={{ width: 22, height: 22, color: "var(--text-tertiary)", margin: "0 auto 10px" }} />
            <p style={{ fontSize: "var(--text-body)", color: "var(--text-secondary)", margin: "0 auto 14px", maxWidth: "62ch", lineHeight: 1.6 }}>
              Noch kein Kontakt erfasst. Hier stehen dritte Personen — Ärztinnen, Beistände,
              Kontaktpersonen von Sozialdiensten. Einmal erfasst, lassen sie sich bei mehreren
              Patienten verknüpfen.
            </p>
            {formular === null && (
              <AppButton variant="sekundaer" icon={Plus} onClick={() => setFormular("")}>Kontakt erfassen</AppButton>
            )}
          </div>
        ) : (
          <DataTable<Kontakt>
            spalten={spalten}
            zeilen={gefiltert}
            zeilenKey={k => k.id}
            onZeileKlick={k => setFormular(k.id)}
            karteTitel={k => kontaktName(k)}
            fusszeile={<><span>{gefiltert.length} von {kontakte.length} {kontakte.length === 1 ? "Kontakt" : "Kontakten"}</span></>}
            leerText="Kein Kontakt mit diesen Filtern."
          />
        )}
      </div>
    </div>
  );
}

/** Erfassen und Ändern an Ort — wie in den übrigen Ansichten. */
function KontaktFormular({ eintrag, onFertig }: { eintrag: Kontakt | null; onFertig: () => void }) {
  const beziehungen = useBeziehungen();
  const [name, setName] = useState(eintrag?.name ?? "");
  const [vorname, setVorname] = useState(eintrag?.vorname ?? "");
  const [typ, setTyp] = useState<string>(eintrag?.typ ?? "");
  const [zugehoerigkeit, setZugehoerigkeit] = useState(eintrag?.zugehoerigkeit ?? "");
  const [telefon, setTelefon] = useState(eintrag?.telefon ?? "");
  const [email, setEmail] = useState(eintrag?.email ?? "");
  const [bemerkung, setBemerkung] = useState(eintrag?.bemerkung ?? "");
  const [fehler, setFehler] = useState("");

  const anzahl = eintrag
    ? beziehungen.filter(b => b.person.art === "kontakt" && b.person.kennung === eintrag.id).length
    : 0;

  const sichern = () => {
    if (!name.trim()) { setFehler("Bitte den Namen erfassen."); return; }
    if (!typ) { setFehler("Bitte den Typ wählen."); return; }
    kontaktSichern({
      id: eintrag?.id ?? "", name: name.trim(), vorname: vorname.trim(),
      typ: typ as Kontakt["typ"], zugehoerigkeit: zugehoerigkeit.trim(),
      telefon: telefon.trim(), email: email.trim(), bemerkung: bemerkung.trim(),
    });
    onFertig();
  };

  const loeschen = () => {
    if (!eintrag) return;
    if (!kontaktLoeschen(eintrag.id, anzahl)) {
      setFehler(`Dieser Kontakt ist ${anzahl === 1 ? "einer Beziehung" : `${anzahl} Beziehungen`} zugeordnet und lässt sich nicht löschen. Beenden Sie zuerst die Beziehungen.`);
      return;
    }
    onFertig();
  };

  const feld = (label: string, wert: string, setzen: (v: string) => void, platzhalter?: string) => (
    <div>
      <div className="text-[11px] text-muted-foreground uppercase tracking-wider" style={{ fontWeight: 500, marginBottom: 3 }}>{label}</div>
      <input value={wert} onChange={e => setzen(e.target.value)} placeholder={platzhalter} aria-label={label} className="ui-fokusring"
        style={{ width: "100%", padding: "6px 9px", borderRadius: 8, fontFamily: "inherit", fontSize: "var(--text-small)",
          color: "var(--text-primary)", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)" }} />
    </div>
  );

  return (
    <div style={{ padding: "14px 16px", borderRadius: 12, background: "var(--bg-secondary)", marginBottom: 12 }}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" style={{ gap: 12 }}>
        {feld("Name", name, setName, "Nachname oder Institution")}
        {feld("Vorname", vorname, setVorname)}
        <div>
          <div className="text-[11px] text-muted-foreground uppercase tracking-wider" style={{ fontWeight: 500, marginBottom: 3 }}>Typ</div>
          <InlineSelect value={typ} onChange={setTyp} platzhalter="Bitte wählen" options={KONTAKTTYP_OPTIONS} />
        </div>
        {feld("Zugehörigkeit", zugehoerigkeit, setZugehoerigkeit, "Praxis, Behörde, Stelle")}
        {feld("Telefon", telefon, setTelefon)}
        {feld("E-Mail", email, setEmail)}
      </div>
      <div style={{ marginTop: 12 }}>{feld("Bemerkung", bemerkung, setBemerkung, "Freiwillig")}</div>
      {fehler && (
        <div role="alert" style={{ fontSize: "var(--text-meta)", color: "var(--status-warning-text)", marginTop: 10, maxWidth: "74ch", lineHeight: 1.5 }}>{fehler}</div>
      )}
      <div className="flex items-center flex-wrap" style={{ gap: 12, marginTop: 14 }}>
        <AppButton variant="sekundaer" onClick={sichern}>Sichern</AppButton>
        <button type="button" onClick={onFertig} className="ui-fokusring cursor-pointer"
          style={{ background: "none", border: "none", padding: 0, fontFamily: "inherit", fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>
          Abbrechen
        </button>
        {eintrag && (
          <button type="button" onClick={loeschen} className="ui-fokusring cursor-pointer"
            style={{ marginLeft: "auto", background: "none", border: "none", padding: 0, fontFamily: "inherit", fontSize: "var(--text-meta)", color: "var(--status-danger)" }}>
            Löschen
          </button>
        )}
      </div>
    </div>
  );
}
