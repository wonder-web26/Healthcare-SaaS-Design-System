/**
 * Legendenleiste — die vier Prüfarten in einer Zeile über der Liste.
 *
 * SIE IST DREIERLEI ZUGLEICH: Legende (welche Form bedeutet welche Prüfart),
 * Statusanzeige (wie viele Befunde je Art) und Einstieg (Klick öffnet das
 * Panel auf dem passenden Reiter). Darum trägt sie dieselben Zeichen wie die
 * Zeilenmarker und die Panel-Reiter — aus derselben Komponente.
 *
 * OHNE PRUEFANBIETER STEHT DA, DASS NICHT GEPRUEFT WURDE. Kein Häkchen, kein
 * Zähler, keine leere Fläche: eine wortlose Leiste würde als Entwarnung
 * gelesen, und das ist der teuerste Irrtum, den diese Fläche zulassen könnte.
 */
import { StatusMarke } from "../ui/StatusMarke";
import { isoZuAnzeige } from "../../../lib/datum";
import { Pruefzeichen, type ZeichenStatus } from "./Pruefzeichen";
import {
  PRUEFART_LABEL,
  type Pruefart, type Pruefergebnis, type PruefartErgebnis,
} from "../../../lib/medikation/medikation";
import { MOCK_KENNZEICHNUNG } from "../../../lib/medikation/pruefdienst";

/** Reihenfolge der Prüfarten — überall dieselbe: Leiste, Marker, Reiter. */
export const PRUEFART_REIHENFOLGE: Pruefart[] = [
  "wechselwirkungen", "doppelmedikation", "allergien", "kontraindikationen",
];

/** Status eines Zeichens aus dem Ergebnis einer Prüfart. */
export function zeichenStatusVon(a: PruefartErgebnis | undefined, anbieterAktiv: boolean): ZeichenStatus {
  if (!anbieterAktiv) return "nicht_aktiv";
  if (!a) return "nicht_geprueft";
  if (a.zustand === "nicht_geprueft") return "nicht_geprueft";
  return a.zustand === "geprueft_mit_befund" ? "mit_befund" : "ohne_befund";
}

export function Legendenleiste({ ergebnis, onOeffnen }: {
  ergebnis: Pruefergebnis;
  /** Öffnet das Panel auf dem Reiter dieser Prüfart. */
  onOeffnen: (art: Pruefart) => void;
}) {
  const aktiv = ergebnis.anbieterAktiv;
  const nichtGeprueft = ergebnis.arten.filter(a => a.zustand === "nicht_geprueft");
  const geprueftePositionen = Math.max(0, ...ergebnis.arten.map(a => a.geprueftePositionen));
  const gesamt = ergebnis.arten[0]?.gesamtPositionen ?? 0;

  return (
    <section aria-label="Medikationsprüfung" style={{
      marginBottom: "var(--space-4)", padding: "12px 16px",
      borderRadius: "var(--radius-card)", background: "var(--bg-elevated)",
      border: "var(--border-thin) solid var(--border-default)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {PRUEFART_REIHENFOLGE.map(art => {
          const a = ergebnis.arten.find(x => x.art === art);
          const status = zeichenStatusVon(a, aktiv);
          const befunde = ergebnis.befunde.filter(b => b.art === art).length;
          /* Zähler: Befundzahl, bei nicht geprüften Arten ein Strich — eine 0
             hiesse «nichts gefunden», und das ist nicht dasselbe. */
          const zaehler = !aktiv || status === "nicht_geprueft" ? "—" : String(befunde);
          return (
            <button key={art} type="button" onClick={() => onOeffnen(art)} disabled={!aktiv}
              className={aktiv ? "ui-fokusring inline-flex items-center" : "inline-flex items-center"}
              style={{
                gap: 8, padding: "6px 12px", borderRadius: "var(--control-radius)",
                background: "transparent", border: "var(--border-thin) solid var(--border-default)",
                fontFamily: "inherit", cursor: aktiv ? "pointer" : "default", opacity: aktiv ? 1 : 0.65,
              }}>
              <Pruefzeichen art={art} status={status} groesse={18} />
              <span style={{ fontSize: "var(--text-meta)", color: "var(--text-primary)" }}>{PRUEFART_LABEL[art]}</span>
              <span style={{ fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", fontVariantNumeric: "tabular-nums", color: "var(--text-secondary)" }}>
                {zaehler}
              </span>
            </button>
          );
        })}
        <span style={{ marginLeft: "auto" }}>
          {MOCK_KENNZEICHNUNG && aktiv && <StatusMarke label="Beispieldaten" variante="neutral" />}
        </span>
      </div>

      {/* Zeile unter der Leiste: Zeitpunkt, Umfang, und was nicht geprüft wurde. */}
      <div style={{ marginTop: 8, fontSize: "var(--text-meta)", color: "var(--text-secondary)", maxWidth: "78ch" }}>
        {aktiv ? (
          <>
            Geprüft {isoZuAnzeige(ergebnis.geprueftAm)} · {geprueftePositionen} von {gesamt} Positionen · {ergebnis.anbieterName}
            {nichtGeprueft.length > 0 && (
              <span style={{ display: "block", color: "var(--status-warning-text)" }}>
                Nicht geprüft: {nichtGeprueft.map(a => `${PRUEFART_LABEL[a.art]} — ${a.grund}`).join(" ")}
              </span>
            )}
          </>
        ) : (
          <>Diese Medikation wurde nicht maschinell geprüft. Es ist kein Prüfdienst konfiguriert.</>
        )}
      </div>
    </section>
  );
}
