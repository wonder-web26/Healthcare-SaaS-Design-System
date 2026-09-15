/**
 * Diagnose-Detailansicht (Lauf 6g) — sie liest, sie bearbeitet nicht.
 * Dritte Rolle des Auswahlbereichs neben Auswahl und Editor: woran man eine
 * Diagnose erkennt (Bestimmende Merkmale), warum (Beeinflussende Faktoren),
 * wen sie betrifft (Risikopopulation).
 *
 * Alle Angaben kommen aus diagnoseDetails (Vertrag). Der Plan liefert genau
 * EINE Information: ob ein Merkmal, das selbst Diagnose ist, bereits im
 * Plan steht — als Marke am Chip, klar als Planzustand erkennbar und nicht
 * mit den Katalogangaben vermischt. Der Grund: Steht ein Merkmal schon als
 * eigene Diagnose im Plan und man übernimmt das Syndrom dazu, entsteht eine
 * Doppelung mit doppelten Zielen und Massnahmen — die Marke ist die
 * früheste Stelle, an der das auffällt.
 */
import { useMemo, useState } from "react";
import { AlertTriangle, ChevronLeft, Fingerprint, Link2, Users, Waypoints } from "lucide-react";
import { diagnoseDetails } from "../../../lib/pflegeplan/mock-adapter";
import type { DiagnoseCode, Merkmalsliste, MerkmalsEintrag } from "../../../lib/pflegeplan/vertrag";
import { usePlan } from "../../../lib/pflegeplan/plan-store";
import { ImPlanMarke, TypMarke } from "./gemeinsam";

const KARTE: React.CSSProperties = {
  background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)",
  borderRadius: "var(--radius-card)",
};

/* Ab acht Items wird gekürzt; Gruppenüberschriften zählen nicht mit. */
const KUERZUNG = 8;

/* Feste Reihenfolge der Abschnitte: bei Problemdiagnosen erscheinen
   Bestimmende Merkmale und Beeinflussende Faktoren zuerst, bei
   Risikodiagnosen stehen die Risikofaktoren an erster Stelle, weil die
   beiden davor nicht belegt sind — EINE Ordnung deckt beide Fälle. */
const ABSCHNITTE = [
  { key: "bestimmendeMerkmale", titel: "Bestimmende Merkmale", Icon: Fingerprint },
  { key: "beeinflussendeFaktoren", titel: "Beeinflussende Faktoren", Icon: Waypoints },
  { key: "risikofaktoren", titel: "Risikofaktoren", Icon: AlertTriangle },
  { key: "risikopopulation", titel: "Risikopopulation", Icon: Users },
  { key: "assoziierteBedingungen", titel: "Assoziierte Bedingungen", Icon: Link2 },
] as const;

function MerkmalChip({ eintrag, imPlan, onOeffnen }: {
  eintrag: MerkmalsEintrag;
  imPlan: boolean;
  onOeffnen: (code: DiagnoseCode, titel: string) => void;
}) {
  const basis: React.CSSProperties = {
    padding: "3px 10px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-meta)",
    border: "var(--border-thin) solid var(--border-default)", background: "var(--bg-elevated)",
    color: "var(--text-primary)", lineHeight: 1.5,
  };
  if (!eintrag.diagnoseCode) {
    return <span data-merkmal style={basis}>{eintrag.text}</span>;
  }
  return (
    <button type="button" data-merkmal data-merkmal-code={eintrag.diagnoseCode}
      onClick={() => onOeffnen(eintrag.diagnoseCode!, eintrag.text)}
      className="ui-fokusring cursor-pointer inline-flex items-center"
      style={{ ...basis, gap: 6, fontFamily: "inherit" }}>
      <span>{eintrag.text}</span>
      <span style={{ fontSize: "var(--text-micro)", color: "var(--brand-primary)", fontVariantNumeric: "tabular-nums", fontWeight: "var(--weight-medium)" }}>
        {eintrag.diagnoseCode}
      </span>
      {imPlan && <ImPlanMarke />}
    </button>
  );
}

function Abschnitt({ schluessel, titel, Icon, liste, istImPlan, onOeffnen }: {
  schluessel: string;
  titel: string;
  Icon: typeof Fingerprint;
  liste: Merkmalsliste;
  istImPlan: (code: DiagnoseCode) => boolean;
  onOeffnen: (code: DiagnoseCode, titel: string) => void;
}) {
  const [alle, setAlle] = useState(false);
  const itemZahl = liste.filter(e => e.art === "item").length;
  const gekuerzt = itemZahl > KUERZUNG && !alle;

  /* Kürzung entlang der Items; Überschriften bleiben bei ihrer Gruppe.
     Eine Überschrift, deren erste Items hinter der Kürzung liegen, wird
     nicht als lose Zeile stehen gelassen. */
  const zeilen: MerkmalsEintrag[] = [];
  let gezeigt = 0;
  for (const e of liste) {
    if (e.art === "item") {
      if (gekuerzt && gezeigt >= KUERZUNG) break;
      gezeigt++;
    }
    zeilen.push(e);
  }
  while (zeilen.length > 0 && zeilen[zeilen.length - 1].art === "gruppe") zeilen.pop();

  return (
    <div data-detail-abschnitt={schluessel} style={{ marginTop: 14 }}>
      <div className="flex items-center" style={{ gap: 6, marginBottom: 8 }}>
        <Icon style={{ width: 13, height: 13, color: "var(--text-tertiary)", flexShrink: 0 }} />
        <span style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>{titel}</span>
        <span data-abschnitt-zahl style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", fontVariantNumeric: "tabular-nums" }}>{itemZahl}</span>
      </div>
      <div className="flex flex-wrap items-center" style={{ gap: 6 }}>
        {zeilen.map((e, i) =>
          e.art === "gruppe" ? (
            <div key={i} data-merkmal-gruppe style={{ width: "100%", fontSize: "var(--text-micro)", fontWeight: 500, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: i === 0 ? 0 : 4 }}>
              {e.text}
            </div>
          ) : (
            <MerkmalChip key={i} eintrag={e} imPlan={e.diagnoseCode !== null && istImPlan(e.diagnoseCode)} onOeffnen={onOeffnen} />
          ))}
      </div>
      {gekuerzt && (
        <button type="button" data-detail-alle onClick={() => setAlle(true)}
          className="ui-fokusring cursor-pointer"
          style={{ marginTop: 8, padding: "4px 12px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-meta)", fontWeight: 500, background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", color: "var(--text-secondary)", fontFamily: "inherit" }}>
          Alle {itemZahl} anzeigen
        </button>
      )}
    </div>
  );
}

export function DiagnoseDetail({ diagnoseCode, titelFallback, zurueckLabel, onZurueck, onOeffnen }: {
  diagnoseCode: DiagnoseCode;
  /** Anzeige, wenn der Katalog keine Detailangaben führt — der Text des
   *  Chips, über den man hierher kam. */
  titelFallback?: string;
  zurueckLabel: string;
  onZurueck: () => void;
  onOeffnen: (code: DiagnoseCode, titel: string) => void;
}) {
  const plan = usePlan();
  const details = useMemo(() => diagnoseDetails(diagnoseCode), [diagnoseCode]);
  const istImPlan = (code: DiagnoseCode) => plan.diagnosen.some(d => d.code === code);

  const zurueck = (
    <button type="button" data-detail-zurueck onClick={onZurueck}
      className="ui-fokusring cursor-pointer inline-flex items-center"
      style={{ gap: 4, marginBottom: 10, padding: "3px 10px 3px 6px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-meta)", fontWeight: 500, background: "none", border: "var(--border-thin) solid var(--border-default)", color: "var(--text-secondary)", fontFamily: "inherit", maxWidth: "100%" }}>
      <ChevronLeft style={{ width: 13, height: 13, flexShrink: 0 }} />
      <span className="truncate">{zurueckLabel}</span>
    </button>
  );

  if (!details) {
    return (
      <div data-detail={diagnoseCode}>
        {zurueck}
        <div style={{ ...KARTE, padding: "14px 16px" }}>
          <div style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>
            {titelFallback ?? `Diagnose ${diagnoseCode}`}
          </div>
          <div style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums", marginTop: 2 }}>{diagnoseCode}</div>
          <div style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", marginTop: 8 }}>
            Der Katalog führt zu dieser Diagnose keine Detailangaben.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div data-detail={details.code}>
      {zurueck}
      <div style={{ ...KARTE, padding: "14px 16px" }}>
        {/* Kopf */}
        <div style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>{details.titel}</div>
        <div className="flex items-center flex-wrap" style={{ gap: 8, marginTop: 4 }}>
          <span style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums", fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace" }}>{details.code}</span>
          <TypMarke typ={details.typ} />
          <span style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>{details.gebiet}</span>
          <span style={{ color: "var(--text-tertiary)" }}>·</span>
          <span style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>{details.thema}</span>
        </div>

        {/* Definition: ein Zitat aus dem Katalog — Serifenschrift und
            Randlinie setzen sie vom übrigen Inhalt ab. */}
        <div data-detail-definition style={{
          marginTop: 12, borderLeft: "3px solid var(--border-default)", paddingLeft: 12,
          fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "var(--text-small)",
          color: "var(--text-secondary)", lineHeight: 1.6,
        }}>
          {details.definition}
        </div>

        {/* Merkmalslisten — nur belegte; die Reihenfolge ist fest. */}
        {ABSCHNITTE.map(({ key, titel, Icon }) => {
          const liste = details[key];
          return liste ? (
            <Abschnitt key={key} schluessel={key} titel={titel} Icon={Icon} liste={liste}
              istImPlan={istImPlan} onOeffnen={onOeffnen} />
          ) : null;
        })}

        {/* Fuss: Achsen, dann die Katalogkennzahlen — ausdrücklich als
            solche beschriftet, keine Planzahlen. */}
        <div style={{ marginTop: 16, borderTop: "var(--border-thin) solid var(--border-default)", paddingTop: 8 }}>
          {details.achsen.length > 0 && (
            <div data-detail-achsen style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", lineHeight: 1.6 }}>
              {details.achsen.map((a, i) => (
                <span key={i}>
                  {i > 0 && " · "}
                  {a.art}: <span style={{ color: "var(--text-secondary)" }}>{a.wert}</span>
                </span>
              ))}
            </div>
          )}
          <div data-katalog-kennzahlen style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", marginTop: 4 }}>
            Im Katalog: {details.anzahlInterventionen} {details.anzahlInterventionen === 1 ? "Intervention" : "Interventionen"}, {details.anzahlZiele} {details.anzahlZiele === 1 ? "erreichbares Ziel" : "erreichbare Ziele"}
          </div>
        </div>
      </div>
    </div>
  );
}
