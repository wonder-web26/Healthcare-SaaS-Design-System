import { useState } from "react";
import { Search } from "lucide-react";
import { TextInput } from "../form/TextInput";

/**
 * AdressBlock — Suchfeld, Strasse und Nr., dann PLZ und Ort nebeneinander.
 *
 * Die EINE Adresserfassung des Produkts: Patient, Angehörige und `KontaktWahl`
 * binden dieselbe Komponente ein. Nur die Adresse (kein Kontaktdatum) — E-Mail,
 * Telefon und Mobil bleiben beim jeweiligen Formular (Abschnitt „Erreichbarkeit"),
 * weil sie je Entität unterschiedlich sind. Ebenso Gemeinde/BFS/Kanton/Land, die
 * nur zum Patienten gehören.
 *
 * Das Suchfeld ist an EINER Stelle für einen Adressdienst vorbereitet
 * (`adresseSuchen`). Ohne Schlüssel (Backend) gibt es keine Treffer — mit der
 * Anbindung funktionieren dann alle drei Formulare gleichzeitig; die drei Felder
 * sind bis dahin direkt bearbeitbar.
 */
export interface AdressWert {
  strasse: string;
  plz: string;
  ort: string;
}

interface AdressTreffer extends AdressWert {
  label: string;
}

/* Einzige Anbindungsstelle für einen künftigen Adressdienst. */
async function adresseSuchen(_query: string): Promise<AdressTreffer[]> {
  return [];
}

export function AdressBlock({ wert, onChange, onBlur, required, fehler, idPrefix = "adr" }: {
  wert: AdressWert;
  onChange: (patch: Partial<AdressWert>) => void;
  /** Optional: meldet das Verlassen eines Felds (für die Pflichtfeld-/Touch-Logik). */
  onBlur?: (feld: keyof AdressWert) => void;
  required?: boolean;
  fehler?: { strasse?: string; plz?: string; ort?: string };
  /** Für die datalist-Id, falls mehrere Blöcke auf einer Seite stehen. */
  idPrefix?: string;
}) {
  const [suche, setSuche] = useState("");
  const [treffer, setTreffer] = useState<AdressTreffer[]>([]);

  return (
    <div>
      <div style={{ position: "relative", marginBottom: "var(--space-3)" }}>
        <Search style={{ position: "absolute", left: 12, top: 11, width: 15, height: 15, color: "var(--text-tertiary)" }} aria-hidden="true" />
        <input
          value={suche}
          aria-label="Adresse suchen"
          placeholder="Adresse suchen — Adressdienst folgt"
          className="ui-fokusring"
          style={{
            width: "100%", paddingLeft: 36, paddingRight: 12, height: "var(--field-height)",
            borderRadius: "var(--radius-card)", border: "var(--border-thin) solid var(--border-default)",
            background: "var(--bg-elevated)", fontSize: "var(--text-small)", color: "var(--text-primary)",
          }}
          onChange={async e => { setSuche(e.target.value); setTreffer(await adresseSuchen(e.target.value)); }}
        />
        {treffer.length > 0 && (
          <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 4 }}>
            {treffer.map((t, i) => (
              <button key={`${idPrefix}-${i}`} type="button" className="ui-fokusring cursor-pointer"
                style={{ textAlign: "left", padding: "6px 10px", borderRadius: "var(--radius-card)", border: "var(--border-thin) solid var(--border-default)", background: "var(--bg-elevated)", fontSize: "var(--text-meta)", color: "var(--text-primary)" }}
                onClick={() => { onChange({ strasse: t.strasse, plz: t.plz, ort: t.ort }); setSuche(""); setTreffer([]); }}>
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2" style={{ rowGap: "var(--space-3)", columnGap: "var(--space-4)" }}>
        <div className="md:col-span-2">
          <TextInput label="Strasse und Nr." required={required} value={wert.strasse} onChange={v => onChange({ strasse: v })}
            onBlur={() => onBlur?.("strasse")} placeholder="Musterstrasse 12" error={fehler?.strasse} />
        </div>
        <TextInput label="PLZ" required={required} value={wert.plz} onChange={v => onChange({ plz: v.replace(/\D/g, "").slice(0, 4) })}
          onBlur={() => onBlur?.("plz")} placeholder="8000" error={fehler?.plz} />
        <TextInput label="Ort" required={required} value={wert.ort} onChange={v => onChange({ ort: v })}
          onBlur={() => onBlur?.("ort")} placeholder="Zürich" error={fehler?.ort} />
      </div>
    </div>
  );
}
