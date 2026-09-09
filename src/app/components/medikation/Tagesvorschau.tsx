/**
 * Tagesvorschau — schreibgeschützte Plausibilitätsprüfung vor dem Sign-off.
 *
 * WOZU SIE DA IST: In der Zeilentabelle sieht niemand, ob die erfasste
 * Medikation als Tagesablauf aufgeht. Drei Präparate mit «1-0-0-0» sind
 * einzeln richtig und ergeben zusammen drei Morgengaben. Das soll auffallen,
 * bevor jemand die Liste bestätigt.
 *
 * KEIN KALENDER, KEINE UHRZEIT. Gezeigt wird ein typischer Tag der erfassten
 * Medikation, nicht ein bestimmter. Die vier Blöcke sind Verordnungsblöcke;
 * eine Abbildung Block → Uhrzeit gibt es nicht, auch nicht als Hilfsangabe.
 *
 * LEERE BLÖCKE BLEIBEN STEHEN. Ein Block ohne Gabe wird mit Hinweis gezeigt und
 * nicht ausgeblendet — die Lücke ist die Information.
 */
import { StatusMarke } from "../ui/StatusMarke";
import { PRUEFSTATUS_MARKE } from "./MedikationsListe";
import {
  BLOECKE, BLOCK_LABEL, blockGaben, istGabe, dosierungText,
  type Medikationsposition, type Block,
} from "../../../lib/medikation/medikation";

export function Tagesvorschau({ positionen }: { positionen: Medikationsposition[] }) {
  const taeglich = positionen.filter(p => blockGaben(p.posologie) !== null);
  const reserve = positionen.filter(p => p.posologie.typ === "reserve");
  const nichtTaeglich = positionen.filter(p => blockGaben(p.posologie) === null && p.posologie.typ !== "reserve");

  const imBlock = (b: Block) => taeglich.filter(p => istGabe(blockGaben(p.posologie)![b]));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
      {BLOECKE.map(b => {
        const gaben = imBlock(b);
        return (
          <section key={b} aria-label={BLOCK_LABEL[b]}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
              <h4 style={{ margin: 0, fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>
                {BLOCK_LABEL[b]}
              </h4>
              <span style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)", fontVariantNumeric: "tabular-nums" }}>
                {gaben.length === 1 ? "1 Gabe" : `${gaben.length} Gaben`}
              </span>
            </div>
            {gaben.length === 0 ? (
              <div style={leerHinweis}>Keine Gabe in diesem Block.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {gaben.map(p => (
                  <GabeZeile key={p.id} p={p} menge={`${blockGaben(p.posologie)![b]} ${p.baseUnit}`} />
                ))}
              </div>
            )}
          </section>
        );
      })}

      <section aria-label="Bei Bedarf">
        <h4 style={abschnittTitel}>Bei Bedarf</h4>
        {reserve.length === 0 ? (
          <div style={leerHinweis}>Keine Reservemedikation erfasst.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {reserve.map(p => (
              <GabeZeile key={p.id} p={p} menge={dosierungText(p.posologie)} mengeLeise />
            ))}
          </div>
        )}
      </section>

      <section aria-label="Nicht täglich">
        <h4 style={abschnittTitel}>Nicht täglich</h4>
        {nichtTaeglich.length === 0 ? (
          <div style={leerHinweis}>Keine Position ausserhalb des Tagesschemas.</div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {nichtTaeglich.map(p => (
                <GabeZeile key={p.id} p={p} menge={dosierungText(p.posologie)} mengeLeise />
              ))}
            </div>
            <div style={{ marginTop: 6, fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>
              Der erfasste Text wird unverändert gezeigt; die Vorschau rechnet keine Fälligkeit aus.
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function GabeZeile({ p, menge, mengeLeise }: {
  p: Medikationsposition; menge: string; mengeLeise?: boolean;
}) {
  const marke = PRUEFSTATUS_MARKE[p.pruefstatus];
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 12, flexWrap: "wrap",
      padding: "8px 0", borderTop: "var(--border-thin) solid var(--border-default)",
    }}>
      <div style={{ flex: 1, minWidth: 180 }}>
        <span style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>
          {p.productName}
        </span>
        <span style={{ display: "block", fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>
          {[p.darreichungsform, p.staerke].filter(Boolean).join(" ")}
        </span>
      </div>
      {/* Menge und Marken stehen in festen Spalten, damit die Mengen einer
          Blockliste untereinander stehen und sich vergleichen lassen. */}
      <span style={{
        width: mengeLeise ? 320 : 110, flexShrink: 0, textAlign: mengeLeise ? "left" : "right",
        fontSize: "var(--text-small)", fontVariantNumeric: "tabular-nums",
        color: mengeLeise ? "var(--text-secondary)" : "var(--text-primary)",
      }}>
        {menge}
      </span>
      <span style={{ width: 230, flexShrink: 0, display: "flex", justifyContent: "flex-end", gap: 6, flexWrap: "wrap" }}>
        {p.selbstmedikation && <StatusMarke label="Selbstmedikation" variante="neutral" />}
        <StatusMarke label={marke.label} variante={marke.variante} icon={marke.icon} />
      </span>
    </div>
  );
}

const abschnittTitel: React.CSSProperties = {
  margin: "0 0 6px", fontSize: "var(--text-small)",
  fontWeight: "var(--weight-medium)", color: "var(--text-primary)",
};

const leerHinweis: React.CSSProperties = {
  padding: "8px 0", borderTop: "var(--border-thin) solid var(--border-default)",
  fontSize: "var(--text-meta)", color: "var(--text-tertiary)",
};
