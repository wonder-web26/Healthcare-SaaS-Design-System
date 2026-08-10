import { useState } from "react";
import { InlineSelect } from "./InlineSelect";
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

  const waehlen = (v: string) => {
    setModus(v);
    /* Erst beim Anlegen entsteht die Kennung — bis dahin meldet die Wahl
       "keiner", damit niemand auf einen Kontakt verweist, den es nicht gibt. */
    onWahl(v === NEU ? "" : v);
  };

  const anlegen = () => {
    if (!name.trim()) { setFehler("Bitte den Namen erfassen."); return; }
    if (!typ) { setFehler("Bitte den Typ wählen."); return; }
    const k = kontaktSichern({
      id: "", name: name.trim(), vorname: vorname.trim(), typ: typ as Kontakt["typ"],
      zugehoerigkeit: zugehoerigkeit.trim(), telefon: telefon.trim(), email: "", bemerkung: "",
    });
    setFehler("");
    setModus(k.id);
    onWahl(k.id);
  };

  return (
    <div>
      <div>
        <div className="text-[11px] text-muted-foreground uppercase tracking-wider" style={{ fontWeight: 500, marginBottom: 3 }}>{label}</div>
        <InlineSelect value={modus} onChange={waehlen} platzhalter={platzhalter}
          options={[
            ...kontakte.map(k => ({ value: k.id, label: `${kontaktName(k)} (${kontakttypLabel(k.typ)})` })),
            { value: NEU, label: "Neuen Kontakt erfassen" },
          ]} />
      </div>
      {modus === NEU && (
        <div style={{ marginTop: 10, padding: "12px 14px", borderRadius: 10, background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)" }}>
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
          <button type="button" onClick={anlegen} className="ui-fokusring cursor-pointer"
            style={{ marginTop: 10, padding: "5px 14px", borderRadius: "var(--radius-pill)", fontFamily: "inherit", fontSize: "var(--text-small)",
              fontWeight: "var(--weight-medium)", background: "var(--brand-primary-light)", border: "var(--border-thin) solid var(--brand-primary)", color: "var(--brand-primary)" }}>
            Kontakt anlegen
          </button>
        </div>
      )}
    </div>
  );
}
