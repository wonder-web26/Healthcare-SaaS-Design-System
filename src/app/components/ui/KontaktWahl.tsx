import { useState, useEffect, useRef } from "react";
import { InlineSelect } from "./InlineSelect";
import { Combobox } from "../form/Combobox";
import { FormFeld } from "./FormFeld";
import { useKontakte, kontaktSichern } from "../../../lib/kontakte/store";
import { kontaktName, type Kontakt } from "../../../lib/kontakte/kontakte";
import { KONTAKTTYP_OPTIONS, kontakttypLabel } from "../../../lib/stammdaten/kontakttypen";

/**
 * Einen Kontakt wählen oder an Ort anlegen.
 *
 * Derselbe Baustein im Beziehungsformular des Dossiers und im
 * Abklärungsgespräch. Beim Onboarding ist die Person oft schon bekannt — der
 * Sozialdienst hat angemeldet, die Beiständin hat angerufen; wer sie findet,
 * tippt Telefon und Zugehörigkeit nicht ab.
 *
 * Der Wert ist die Kennung des Kontakts, nie sein Name: ändert sich der Name
 * am Kontakt, ändert er sich überall mit.
 */
export function KontaktWahl({ wert, onWahl, zugehoerigkeitLabel = "Zugehörigkeit", platzhalter = "Bitte wählen", label = "Person" }: {
  /** Kennung des gewählten Kontakts; "" = keiner. */
  wert: string;
  onWahl: (kennung: string) => void;
  /** Beschriftung der Zugehörigkeit im Anlege-Teil — Fachgebiet, Stelle, Behörde. */
  zugehoerigkeitLabel?: string;
  platzhalter?: string;
  label?: string;
}) {
  const NEU = "__neu__";
  const kontakte = useKontakte();
  const [modus, setModus] = useState<string>(wert);
  const [name, setName] = useState("");
  const [vorname, setVorname] = useState("");
  const [typ, setTyp] = useState("");
  const [zugehoerigkeit, setZugehoerigkeit] = useState("");
  const [telefon, setTelefon] = useState("");
  const [fehler, setFehler] = useState("");
  /* Was gewählt war, bevor der Anlegeteil aufging. Wer versehentlich darauf
     klickt und abbricht, bekommt seinen Kontakt zurück. */
  const [vorher, setVorher] = useState<string>(wert);
  const bereich = useRef<HTMLDivElement>(null);

  const felderLeeren = () => {
    setName(""); setVorname(""); setTyp(""); setZugehoerigkeit(""); setTelefon(""); setFehler("");
  };

  const abbrechen = () => {
    setModus(vorher);
    onWahl(vorher);
    /* Teilweise Eingetragenes geht ohne Rückfrage verloren. Bei fünf Feldern
       wäre eine Warnung überzogen — anders als bei den Stammdaten, wo ein
       Abbruch einunddreissig Felder verwirft und darum nachfragt. */
    felderLeeren();
  };

  const waehlen = (v: string) => {
    if (v === NEU) setVorher(modus === NEU ? vorher : modus);
    setModus(v);
    /* Erst beim Anlegen entsteht die Kennung — bis dahin meldet die Wahl
       "keiner", damit niemand auf einen Kontakt verweist, den es nicht gibt.
       Die Wahl eines bestehenden Eintrags schliesst den Anlegeteil damit
       ebenfalls; das war schon vorher so. */
    onWahl(v === NEU ? "" : v);
    if (v !== NEU) felderLeeren();
  };

  /* Escape wirkt wie Abbrechen — der Griff, den man ohne Nachdenken sucht.
     Der Listener hängt am Bereich, nicht am Dokument: sonst schlösse er auch
     dort, wo niemand ihn erwartet. */
  useEffect(() => {
    if (modus !== NEU) return;
    const el = bereich.current;
    if (!el) return;
    const taste = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      abbrechen();
    };
    el.addEventListener("keydown", taste);
    return () => el.removeEventListener("keydown", taste);
  });

  const anlegen = () => {
    if (!name.trim()) { setFehler("Bitte den Namen erfassen."); return; }
    if (!typ) { setFehler("Bitte den Typ wählen."); return; }
    const k = kontaktSichern({
      id: "", name: name.trim(), vorname: vorname.trim(), typ: typ as Kontakt["typ"],
      zugehoerigkeit: zugehoerigkeit.trim(), telefon: telefon.trim(), email: "", bemerkung: "",
    });
    setModus(k.id);
    onWahl(k.id);
    setVorher(k.id);
    felderLeeren();
  };

  return (
    <div>
      {/* Auswahlfeld MIT Suche: bei zwei Kontakten ist eine Liste dasselbe wie
          eine Suche, bei zweihundert nicht mehr — und zweihundert sind es,
          sobald jede Gemeinde ihren Sozialdienst beisteuert. Der Baustein ist
          derselbe wie bei der Nationalität; gesucht wird über Name, Vorname
          und Zugehörigkeit, wie in der Kontaktliste. */}
      <Combobox
        label={label}
        value={modus || null}
        onChange={v => waehlen(v ?? "")}
        placeholder={platzhalter}
        searchPlaceholder="Name oder Zugehörigkeit suchen…"
        keineTrefferText="Kein Kontakt gefunden."
        options={[
          ...kontakte.map(k => ({
            value: k.id,
            label: `${kontaktName(k)} (${kontakttypLabel(k.typ)})`,
            suchtext: k.zugehoerigkeit,
          })),
          { value: NEU, label: "Neuen Kontakt erfassen", immer: true },
        ]} />
      {modus === NEU && (
        <div ref={bereich} tabIndex={-1}
          style={{ marginTop: 10, padding: "12px 14px", borderRadius: 10, background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)" }}>
          <div style={{ fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", marginBottom: 10 }}>Neuer Kontakt</div>
          <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 12 }}>
            <FormFeld label="Name" wert={name} platzhalter="Nachname oder Institution" onAendern={setName} />
            <FormFeld label="Vorname" wert={vorname} onAendern={setVorname} />
            <div>
              <div className="text-[11px] text-muted-foreground uppercase tracking-wider" style={{ fontWeight: 500, marginBottom: 3 }}>Typ</div>
              <InlineSelect value={typ} onChange={setTyp} platzhalter="Bitte wählen" options={KONTAKTTYP_OPTIONS} />
            </div>
            <FormFeld label={zugehoerigkeitLabel} wert={zugehoerigkeit} onAendern={setZugehoerigkeit} />
            <FormFeld label="Telefon des Kontakts" wert={telefon} onAendern={setTelefon} />
          </div>
          {fehler && (
            <div role="alert" style={{ fontSize: "var(--text-meta)", color: "var(--status-warning-text)", marginTop: 8 }}>{fehler}</div>
          )}
          <div className="flex items-center" style={{ gap: 12, marginTop: 10 }}>
            <button type="button" onClick={anlegen} className="ui-fokusring cursor-pointer"
              style={{ padding: "5px 14px", borderRadius: "var(--radius-pill)", fontFamily: "inherit", fontSize: "var(--text-small)",
                fontWeight: "var(--weight-medium)", background: "var(--brand-primary-light)", border: "var(--border-thin) solid var(--brand-primary)", color: "var(--brand-primary)" }}>
              Kontakt anlegen
            </button>
            <button type="button" onClick={abbrechen} className="ui-fokusring cursor-pointer"
              style={{ background: "none", border: "none", padding: 0, fontFamily: "inherit", fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>
              Abbrechen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
