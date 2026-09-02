import { useState } from "react";
import { Search, AlertTriangle } from "lucide-react";
import { TextInput } from "../form/TextInput";
import { sucheAdresse, trefferAnwenden, braucheGemeindeHinweis, type AdressTreffer } from "../../../lib/adresse/adresssuche";

/**
 * AdressBlock — die EINE Adresserfassung des Produkts. Patient, Angehörige und
 * `KontaktWahl` binden dieselbe Komponente ein; nur die Adresse (kein
 * Kontaktdatum) — E-Mail, Telefon, Mobil bleiben beim jeweiligen Formular.
 *
 * Das Suchfeld steht immer über den Feldern; ein Treffer füllt die Felder (er
 * ersetzt die manuelle Eingabe nicht, sondern speist sie). Von Hand lässt sich
 * jederzeit direkt in den Feldern erfassen.
 *
 * Die Variante steuert die Tiefe: `voll` (nur beim Patienten) zeigt zusätzlich
 * Politische Gemeinde, BFS-Nummer, Kanton und Land, weil diese den
 * Restkostensatz und den Empfänger der Restkostenrechnung bestimmen. `mitKanton`
 * (Angehörige) ergänzt nur Kanton und Land direkt unter der Anschrift, ohne
 * Gemeinde/BFS. `anschrift` (Default, Kontakte/Pflegeort) endet nach der
 * Anschrift. Kanton ist ein Textfeld; die Tarifzuordnung vergleicht Codes ohne
 * Normalisierung — die Suche füllt daher den Code (z. B. „ZH").
 */
export interface AdressWert {
  strasse: string;
  plz: string;
  ort: string;
  /* Nur `voll` (Patient). Optional, damit Anschrift-Verwender {strasse,plz,ort}
     unverändert übergeben. */
  land?: string;
  gemeinde?: string;
  bfsNummer?: string;
  kanton?: string;
}

type Variante = "anschrift" | "mitKanton" | "voll";

export function AdressBlock({ wert, onChange, onBlur, required, fehler, idPrefix = "adr", variante = "anschrift" }: {
  wert: AdressWert;
  onChange: (patch: Partial<AdressWert>) => void;
  /** Optional: meldet das Verlassen eines Felds (für die Pflichtfeld-/Touch-Logik). */
  onBlur?: (feld: "strasse" | "plz" | "ort") => void;
  required?: boolean;
  fehler?: { strasse?: string; plz?: string; ort?: string };
  /** Für die Schlüssel mehrerer Blöcke auf einer Seite. */
  idPrefix?: string;
  /** `mitKanton` ergänzt Kanton/Land, `voll` zusätzlich Gemeinde/BFS (Patient);
   *  Default `anschrift`. */
  variante?: Variante;
}) {
  const [suche, setSuche] = useState("");
  const [treffer, setTreffer] = useState<AdressTreffer[]>([]);
  const [hinweisAktiv, setHinweisAktiv] = useState(false);

  const istVoll = variante === "voll";
  // Der Hinweis verschwindet, sobald eine Gemeinde von Hand ergänzt wird.
  const zeigeGemeindeHinweis = istVoll && hinweisAktiv && !(wert.gemeinde ?? "").trim();

  const trefferUebernehmen = (t: AdressTreffer) => {
    onChange(trefferAnwenden(t, variante));
    setHinweisAktiv(istVoll && braucheGemeindeHinweis(t));
    setSuche("");
    setTreffer([]);
  };

  return (
    <div>
      {/* Suchfeld — immer sichtbar, über den Feldern. */}
      <div style={{ marginBottom: "var(--space-3)" }}>
        <div style={{ position: "relative" }}>
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
            onChange={async e => { setSuche(e.target.value); setTreffer(await sucheAdresse(e.target.value)); }}
          />
        </div>
        {treffer.length > 0 && (
          <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 4 }}>
            {treffer.map((t, i) => (
              <button key={`${idPrefix}-${i}`} type="button" className="ui-fokusring cursor-pointer"
                style={{ textAlign: "left", padding: "6px 10px", borderRadius: "var(--radius-card)", border: "var(--border-thin) solid var(--border-default)", background: "var(--bg-elevated)", fontSize: "var(--text-meta)", color: "var(--text-primary)" }}
                onClick={() => trefferUebernehmen(t)}>
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
        {variante === "mitKanton" && (
          <>
            <TextInput label="Kanton" value={wert.kanton ?? ""} onChange={v => onChange({ kanton: v })} placeholder="z.B. ZH" />
            <TextInput label="Land" value={wert.land ?? ""} onChange={v => onChange({ land: v })} placeholder="CH" />
          </>
        )}
      </div>

      {istVoll && (
        <>
          <div style={{ borderTop: "var(--border-thin) solid var(--border-light)", margin: "var(--space-4) 0" }} />
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ rowGap: "var(--space-3)", columnGap: "var(--space-4)" }}>
            <TextInput label="Politische Gemeinde" value={wert.gemeinde ?? ""} onChange={v => onChange({ gemeinde: v })} placeholder="z.B. Illnau-Effretikon" />
            <TextInput label="BFS-Nummer" value={wert.bfsNummer ?? ""} onChange={v => onChange({ bfsNummer: v.replace(/\D/g, "") })} placeholder="optional" />
            <TextInput label="Kanton" value={wert.kanton ?? ""} onChange={v => onChange({ kanton: v })} placeholder="z.B. ZH" />
            <TextInput label="Land" value={wert.land ?? ""} onChange={v => onChange({ land: v })} placeholder="CH" />
          </div>
          <div style={{ marginTop: "var(--space-2)", fontSize: 12, color: "var(--text-tertiary)" }}>
            Die Gemeinde bestimmt den Restkostensatz und den Empfänger der Restkostenrechnung.
          </div>
          {zeigeGemeindeHinweis && (
            <div className="flex items-start" style={{ gap: 8, marginTop: "var(--space-2)", fontSize: 12, color: "var(--status-warning-text)" }}>
              <AlertTriangle style={{ width: 13, height: 13, flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
              <span>Gemeinde und BFS-Nummer liessen sich nicht automatisch ermitteln. Bitte von Hand ergänzen.</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
