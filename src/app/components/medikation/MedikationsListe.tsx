/**
 * Liste der Medikationspositionen — drei Gruppen nach eMediplan-Konvention:
 * Fixmedikation, Reservemedikation, Selbstmedikation. Die Gruppe wird
 * abgeleitet (gruppeVon), nicht gespeichert; eine leere Gruppe entfaellt.
 *
 * Der Pruefstatus traegt NEBEN der Farbe immer Symbol und Text — die
 * StatusMarke des Styleguides bringt beides mit, damit ein
 * Graustufen-Ausdruck lesbar bleibt.
 *
 * Unterhalb des Desktop-Breakpoints scrollt die Tabelle waagrecht statt zu
 * schrumpfen: neun Spalten in 375 px zu quetschen macht sie unlesbar.
 */
import { CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { StatusMarke } from "../ui/StatusMarke";
import { isoZuAnzeige } from "../../../lib/datum";
import {
  gruppeVon, dosierungText, GRUPPE_LABEL, QUELLE_LABEL,
  type Medikationsposition, type Gruppe, type Pruefstatus,
} from "../../../lib/medikation/medikation";

const PRUEFSTATUS_MARKE: Record<Pruefstatus, { label: string; variante: "erfolg" | "warnung" | "info"; icon: typeof CheckCircle2 }> = {
  bestaetigt: { label: "Bestätigt", variante: "erfolg", icon: CheckCircle2 },
  zu_pruefen: { label: "Zu prüfen", variante: "warnung", icon: Clock },
  unbestaetigt: { label: "Unbestätigt", variante: "warnung", icon: AlertTriangle },
};

/** Neun Spalten, Reihenfolge verbindlich. */
const SPALTEN = [
  "Präparat", "Dosierung", "Einheit", "von", "bis und mit",
  "Applikationsart", "Grund / Anweisung", "Quelle", "Status",
] as const;

export const SPALTEN_ANZAHL = SPALTEN.length;

const GRUPPEN_REIHENFOLGE: Gruppe[] = ["fix", "reserve", "selbst"];

export function MedikationsListe({ positionen, schreibgeschuetzt, onZeile }: {
  positionen: Medikationsposition[];
  /** Zustand C: Zeilen sind nicht mehr klickbar. */
  schreibgeschuetzt: boolean;
  onZeile: (p: Medikationsposition) => void;
}) {
  const gruppen = GRUPPEN_REIHENFOLGE
    .map(g => ({ gruppe: g, zeilen: positionen.filter(p => gruppeVon(p) === g) }))
    .filter(g => g.zeilen.length > 0);

  return (
    <div style={{ overflowX: "auto" }}>
      {/* Feste Spaltenbreiten: mit freier Verteilung draengt die Spalte
          «Grund / Anweisung» die Statusspalte aus dem Bild — und der Status
          ist die Spalte, wegen der jemand hinschaut. */}
      <table style={{ width: "100%", minWidth: 1000, tableLayout: "fixed", borderCollapse: "collapse", fontSize: "var(--text-small)" }}>
        <colgroup>
          {["17%", "14%", "6%", "9%", "9%", "9%", "13%", "10%", "13%"].map((w, i) => <col key={i} style={{ width: w }} />)}
        </colgroup>
        <thead>
          <tr>
            {SPALTEN.map(s => (
              <th key={s} scope="col" style={{
                textAlign: "left", padding: "6px 10px 8px", whiteSpace: "nowrap",
                fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)",
                color: "var(--text-tertiary)", borderBottom: "var(--border-thin) solid var(--border-default)",
              }}>{s}</th>
            ))}
          </tr>
        </thead>
        {gruppen.map(({ gruppe, zeilen }) => (
          <tbody key={gruppe}>
            <tr>
              <th scope="colgroup" colSpan={SPALTEN.length} style={{
                textAlign: "left", padding: "14px 10px 6px",
                fontSize: "var(--text-micro)", fontWeight: "var(--weight-medium)",
                letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-tertiary)",
              }}>
                {GRUPPE_LABEL[gruppe]} <span style={{ fontVariantNumeric: "tabular-nums" }}>({zeilen.length})</span>
              </th>
            </tr>
            {zeilen.map(p => {
              const marke = PRUEFSTATUS_MARKE[p.pruefstatus];
              const grundAnweisung = [p.behandlungsgrund, p.instructions].filter(Boolean).join(" · ");
              return (
                <tr key={p.id}
                  onClick={schreibgeschuetzt ? undefined : () => onZeile(p)}
                  tabIndex={schreibgeschuetzt ? undefined : 0}
                  role={schreibgeschuetzt ? undefined : "button"}
                  aria-label={schreibgeschuetzt ? undefined : `${p.productName} bearbeiten`}
                  onKeyDown={schreibgeschuetzt ? undefined : e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onZeile(p); } }}
                  className={schreibgeschuetzt ? undefined : "ui-fokusring"}
                  style={{
                    borderBottom: "var(--border-thin) solid var(--border-default)",
                    cursor: schreibgeschuetzt ? "default" : "pointer",
                  }}>
                  <td style={zelle}>
                    <span style={{ fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>{p.productName}</span>
                    <span style={{ display: "block", fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>
                      {[p.darreichungsform, p.staerke].filter(Boolean).join(" ")}
                    </span>
                  </td>
                  <td style={{ ...zelle, fontVariantNumeric: "tabular-nums" }}>{dosierungText(p.posologie)}</td>
                  <td style={zelle}>{p.baseUnit}</td>
                  <td style={{ ...zelle, whiteSpace: "nowrap" }}>{isoZuAnzeige(p.startDate)}</td>
                  <td style={{ ...zelle, whiteSpace: "nowrap" }}>{p.endDate ? isoZuAnzeige(p.endDate) : "—"}</td>
                  <td style={zelle}>{p.route}</td>
                  <td style={{ ...zelle, color: "var(--text-secondary)" }}>{grundAnweisung || "—"}</td>
                  <td style={{ ...zelle, whiteSpace: "nowrap" }}>
                    {QUELLE_LABEL[p.quelle]}
                    <span style={{ display: "block", fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>{isoZuAnzeige(p.quelleAm)}</span>
                  </td>
                  <td style={{ ...zelle, whiteSpace: "nowrap" }}>
                    <StatusMarke label={marke.label} variante={marke.variante} icon={marke.icon} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        ))}
      </table>
    </div>
  );
}

const zelle: React.CSSProperties = {
  padding: "10px", verticalAlign: "top", color: "var(--text-primary)",
};
