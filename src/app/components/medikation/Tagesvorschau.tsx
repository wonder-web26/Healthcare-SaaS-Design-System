/**
 * Tagesvorschau — schreibgeschützte Plausibilitätsprüfung vor dem Sign-off.
 *
 * WOZU SIE DA IST: In der Zeilentabelle sieht niemand, ob die erfasste
 * Medikation als Tagesablauf aufgeht. Drei Präparate mit «1-0-0-0» sind
 * einzeln richtig und ergeben zusammen drei Morgengaben. Das soll auffallen,
 * bevor jemand die Liste bestätigt.
 *
 * DARUM IST SIE EINE LESEANSICHT, KEINE TABELLE. Sie steht in begrenzter
 * Breite: über die volle Fensterbreite gezogen, stünden Präparat und Menge so
 * weit auseinander, dass das Auge die Zeile verliert — und genau der Vergleich
 * der Mengen innerhalb eines Blocks ist der Zweck.
 *
 * JEDER BLOCK IST EIN EIGENER KASTEN mit Kopfzeile. Vier gleich aussehende
 * Textabschnitte untereinander verschwimmen; ein Kasten je Block macht
 * sichtbar, wo ein Tagesabschnitt aufhört und der nächste beginnt.
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

/** Lesebreite der Ansicht — nicht die volle Fensterbreite. */
const LESEBREITE = 760;

export function Tagesvorschau({ positionen }: { positionen: Medikationsposition[] }) {
  const taeglich = positionen.filter(p => blockGaben(p.posologie) !== null);
  const reserve = positionen.filter(p => p.posologie.typ === "reserve");
  const nichtTaeglich = positionen.filter(p => blockGaben(p.posologie) === null && p.posologie.typ !== "reserve");

  const imBlock = (b: Block) => taeglich.filter(p => istGabe(blockGaben(p.posologie)![b]));

  return (
    <div style={{ maxWidth: LESEBREITE, display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
      {BLOECKE.map(b => {
        const gaben = imBlock(b);
        return (
          <Abschnitt key={b} titel={BLOCK_LABEL[b]} name={BLOCK_LABEL[b]}
            zaehler={gaben.length === 1 ? "1 Gabe" : `${gaben.length} Gaben`}
            leer={gaben.length === 0}>
            {gaben.length === 0
              ? <LeerZeile text="Keine Gabe in diesem Block." />
              : gaben.map(p => (
                  <GabeZeile key={p.id} p={p} menge={`${blockGaben(p.posologie)![b]} ${p.baseUnit}`} />
                ))}
          </Abschnitt>
        );
      })}

      {/* Die zwei Abschnitte ohne Tagesbezug stehen abgesetzt unter den vier
          Blöcken — sie gehören nicht in den Tagesablauf. */}
      <Abschnitt titel="Bei Bedarf" name="Bei Bedarf" abgesetzt
        zaehler={reserve.length === 1 ? "1 Position" : `${reserve.length} Positionen`}
        leer={reserve.length === 0}>
        {reserve.length === 0
          ? <LeerZeile text="Keine Reservemedikation erfasst." />
          : reserve.map(p => <GabeZeile key={p.id} p={p} menge={dosierungText(p.posologie)} mengeLang />)}
      </Abschnitt>

      <Abschnitt titel="Nicht täglich" name="Nicht täglich" abgesetzt
        zaehler={nichtTaeglich.length === 1 ? "1 Position" : `${nichtTaeglich.length} Positionen`}
        leer={nichtTaeglich.length === 0}
        fuss={nichtTaeglich.length > 0
          ? "Der erfasste Text wird unverändert gezeigt; die Vorschau rechnet keine Fälligkeit aus."
          : undefined}>
        {nichtTaeglich.length === 0
          ? <LeerZeile text="Keine Position ausserhalb des Tagesschemas." />
          : nichtTaeglich.map(p => <GabeZeile key={p.id} p={p} menge={dosierungText(p.posologie)} mengeLang />)}
      </Abschnitt>
    </div>
  );
}

/** Ein Kasten je Tagesabschnitt — Kopfzeile getönt, Inhalt darunter. */
function Abschnitt({ titel, name, zaehler, leer, abgesetzt, fuss, children }: {
  titel: string; name: string; zaehler: string;
  /** Ohne Gabe tritt der Kasten zurück, verschwindet aber nicht. */
  leer: boolean;
  /** «Bei Bedarf» und «Nicht täglich» gehören nicht zum Tagesablauf. */
  abgesetzt?: boolean;
  fuss?: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-label={name} style={{
      borderRadius: "var(--radius-card)", overflow: "hidden",
      border: "var(--border-thin) solid var(--border-default)",
      background: "var(--bg-elevated)", opacity: leer ? 0.75 : 1,
    }}>
      <div style={{
        display: "flex", alignItems: "baseline", gap: 10,
        padding: "8px 14px",
        background: abgesetzt ? "var(--bg-elevated)" : "var(--bg-secondary)",
        borderBottom: "var(--border-thin) solid var(--border-default)",
      }}>
        <h4 style={{ margin: 0, fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>
          {titel}
        </h4>
        <span style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)", fontVariantNumeric: "tabular-nums" }}>
          {zaehler}
        </span>
      </div>
      <div style={{ padding: "2px 14px 8px" }}>
        {children}
        {fuss && (
          <div style={{ marginTop: 6, fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>{fuss}</div>
        )}
      </div>
    </section>
  );
}

/**
 * Eine Gabe. Präparat und Menge stehen unmittelbar nebeneinander — die Menge
 * ist die Angabe, die man beim Überfliegen eines Blocks vergleicht, und sie
 * gehört darum ans Ende des Namens, nicht ans andere Ende der Zeile.
 */
function GabeZeile({ p, menge, mengeLang }: {
  p: Medikationsposition; menge: string;
  /** Reserve- und Freitextangaben sind Sätze, keine Zahlen. */
  mengeLang?: boolean;
}) {
  const marke = PRUEFSTATUS_MARKE[p.pruefstatus];
  return (
    <div style={{
      display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap",
      padding: "8px 0", borderTop: "var(--border-thin) solid var(--border-default)",
    }}>
      {/* Feste Namensspalte: nur so stehen die Mengen eines Blocks
          untereinander und lassen sich mit einem Blick vergleichen. */}
      <span style={{ flex: "0 0 300px", minWidth: 0 }}>
        <span style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>
          {p.productName}
        </span>
        <span style={{ marginLeft: 6, fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>
          {[p.darreichungsform, p.staerke].filter(Boolean).join(" ")}
        </span>
      </span>
      <span style={{
        flex: mengeLang ? "1 1 240px" : "0 0 90px",
        fontSize: "var(--text-small)", fontVariantNumeric: "tabular-nums",
        fontWeight: mengeLang ? "var(--weight-regular)" : "var(--weight-medium)",
        color: mengeLang ? "var(--text-secondary)" : "var(--text-primary)",
      }}>
        {menge}
      </span>
      <span style={{ marginLeft: "auto", display: "inline-flex", gap: 6, flexWrap: "wrap" }}>
        {p.selbstmedikation && <StatusMarke label="Selbstmedikation" variante="neutral" />}
        <StatusMarke label={marke.label} variante={marke.variante} icon={marke.icon} />
      </span>
    </div>
  );
}

function LeerZeile({ text }: { text: string }) {
  return (
    <div style={{
      padding: "8px 0", borderTop: "var(--border-thin) solid var(--border-default)",
      fontSize: "var(--text-meta)", color: "var(--text-tertiary)",
    }}>
      {text}
    </div>
  );
}
