/**
 * Wochenvorschau — schreibgeschützt, ohne Datumsbezug.
 *
 * Die Spalten sind Wochentage OHNE Datum: die Vorschau zeigt eine typische
 * Woche der erfassten Medikation, keine kalendarische. Es gibt darum kein
 * «Heute», keine Jetzt-Linie und keine hervorgehobene Tagesspalte.
 *
 * FÜR NICHT-TÄGLICHE POSOLOGIEN WIRD NICHTS BERECHNET. «Alle 72 h, jeweils Mo
 * und Do» liesse sich nur mit einem Startdatumsbezug auf Wochentage abbilden —
 * den hat diese Vorschau bewusst nicht. Solche Positionen zeigen ihren
 * erfassten Text und im Raster einen neutralen Strich. Ein geratener Wochentag
 * wäre schlimmer als keiner.
 *
 * Reservepositionen tragen keine Zellwerte: eine Bedarfsgabe hat keinen Tag.
 */
import { StatusMarke } from "../ui/StatusMarke";
import { PRUEFSTATUS_MARKE } from "./MedikationsListe";
import {
  blockGaben, istGabe, dosierungText, gruppeVon, GRUPPE_LABEL, BLOECKE,
  type Medikationsposition, type Gruppe,
} from "../../../lib/medikation/medikation";

/** Wochentage ohne Datumsbezug — Reihenfolge Mo bis So. */
const TAGE = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"] as const;

const GRUPPEN_REIHENFOLGE: Gruppe[] = ["fix", "reserve", "selbst"];

export function Wochenvorschau({ positionen }: { positionen: Medikationsposition[] }) {
  const gruppen = GRUPPEN_REIHENFOLGE
    .map(g => ({ gruppe: g, zeilen: positionen.filter(p => gruppeVon(p) === g) }))
    .filter(g => g.zeilen.length > 0);

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", minWidth: 900, tableLayout: "fixed", borderCollapse: "collapse", fontSize: "var(--text-small)" }}>
        <colgroup>
          <col style={{ width: "30%" }} />
          {TAGE.map(t => <col key={t} style={{ width: "10%" }} />)}
        </colgroup>
        <thead>
          <tr>
            <th scope="col" style={{ ...kopf, textAlign: "left" }}>Medikament</th>
            {TAGE.map(t => <th key={t} scope="col" style={kopf}>{t}</th>)}
          </tr>
        </thead>
        {gruppen.map(({ gruppe, zeilen }) => (
          <tbody key={gruppe}>
            <tr>
              <th scope="colgroup" colSpan={TAGE.length + 1} style={{
                textAlign: "left", padding: "14px 10px 6px",
                fontSize: "var(--text-micro)", fontWeight: "var(--weight-medium)",
                letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-tertiary)",
              }}>
                {GRUPPE_LABEL[gruppe]} <span style={{ fontVariantNumeric: "tabular-nums" }}>({zeilen.length})</span>
              </th>
            </tr>
            {zeilen.map(p => {
              const gaben = blockGaben(p.posologie);
              const marke = PRUEFSTATUS_MARKE[p.pruefstatus];
              // Blockschema als Zellwert; sonst bleibt die Zelle ein Strich.
              const zellinhalt = gaben
                ? BLOECKE.map(b => gaben[b])
                : null;
              return (
                <tr key={p.id} style={{ borderTop: "var(--border-thin) solid var(--border-default)" }}>
                  <td style={{ ...zelle, textAlign: "left" }}>
                    <span style={{ fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>{p.productName}</span>
                    <span style={{ display: "block", fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>
                      {[p.darreichungsform, p.staerke].filter(Boolean).join(" ")}
                    </span>
                    {!gaben && (
                      <span style={{ display: "block", marginTop: 2, fontSize: "var(--text-micro)", color: "var(--text-secondary)" }}>
                        {dosierungText(p.posologie)}
                      </span>
                    )}
                    <span style={{ display: "inline-flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                      {p.selbstmedikation && <StatusMarke label="Selbstmedikation" variante="neutral" />}
                      <StatusMarke label={marke.label} variante={marke.variante} icon={marke.icon} />
                    </span>
                  </td>
                  {TAGE.map(t => (
                    <td key={t} style={{ ...zelle, textAlign: "center", fontVariantNumeric: "tabular-nums" }}>
                      {zellinhalt ? (
                        <span aria-label={`${p.productName}, ${t}: ${zellinhalt.join("-")}`}>
                          {zellinhalt.map((w, i) => (
                            <span key={i} style={{ color: istGabe(w) ? "var(--text-primary)" : "var(--text-tertiary)" }}>
                              {w}{i < 3 ? "-" : ""}
                            </span>
                          ))}
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-tertiary)" }} aria-label="ohne Tagesangabe">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        ))}
      </table>
    </div>
  );
}

const kopf: React.CSSProperties = {
  textAlign: "center", padding: "6px 8px 8px", whiteSpace: "nowrap",
  fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)",
  color: "var(--text-tertiary)", borderBottom: "var(--border-thin) solid var(--border-default)",
};

const zelle: React.CSSProperties = {
  padding: "10px 8px", verticalAlign: "top", color: "var(--text-primary)",
};
