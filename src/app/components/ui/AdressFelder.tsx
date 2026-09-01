import { useState } from "react";
import { Search } from "lucide-react";
import { TextInput } from "../form/TextInput";

/**
 * Adressfelder — Strasse, PLZ, Ort, mit vorbereitetem Suchfeld.
 *
 * Eigenständige Komponente, damit Patient und (später) Kontakt dieselbe Adresse
 * bedienen. `KontaktWahl` trägt die Adresse heute noch inline; die Umstellung
 * darauf ist ein eigener, kleiner Lauf (siehe docs/datenmodell-mapping.md).
 *
 * Das Suchfeld ist für einen Adressdienst vorbereitet und an EINER Stelle
 * gekapselt (`adresseSuchen`). Ohne Schlüssel (Backend) gibt es keine Treffer;
 * die drei Felder sind direkt bearbeitbar. Keine Anbindung in diesem Lauf.
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

export function AdressFelder({ wert, onChange, required, fehler, idPrefix = "adr" }: {
  wert: AdressWert;
  onChange: (patch: Partial<AdressWert>) => void;
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
            placeholder="Musterstrasse 12" error={fehler?.strasse} />
        </div>
        <TextInput label="PLZ" required={required} value={wert.plz} onChange={v => onChange({ plz: v.replace(/\D/g, "").slice(0, 4) })}
          placeholder="8000" error={fehler?.plz} />
        <TextInput label="Ort" required={required} value={wert.ort} onChange={v => onChange({ ort: v })}
          placeholder="Zürich" error={fehler?.ort} />
      </div>
    </div>
  );
}
