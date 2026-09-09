/**
 * Prüfleiste — der Gesamtzustand der Medikationsprüfung über der Liste.
 *
 * «NICHT AKTIV» IST EIN EIGENER ZUSTAND und sieht ausdrücklich nicht aus wie
 * «geprüft, alles in Ordnung». Ohne konfigurierten Prüfdienst gibt es kein
 * Häkchen und keine Zusammenfassung, sondern den Klartext, dass diese
 * Medikation nicht maschinell geprüft wurde. Eine leere Leiste würde als
 * Entwarnung gelesen — genau der Fehler, den wir vermeiden.
 *
 * JEDE PRUEFART NENNT IHRE ABDECKUNG. «Kein Befund» ohne die Angabe, wie viele
 * Positionen dabei geprüft wurden, ist keine Aussage.
 */
import { ShieldCheck, ShieldAlert, ShieldOff, ChevronDown, ChevronRight, Info } from "lucide-react";
import { StatusMarke } from "../ui/StatusMarke";
import { isoZuAnzeige } from "../../../lib/datum";
import {
  PRUEFART_LABEL, abdeckungText, pruefGesamtzustand,
  type Pruefergebnis, type PruefartErgebnis,
} from "../../../lib/medikation/medikation";
import { MOCK_KENNZEICHNUNG } from "../../../lib/medikation/pruefdienst";

export function Pruefleiste({ ergebnis, offen, onUmschalten, kinder }: {
  ergebnis: Pruefergebnis;
  offen: boolean;
  onUmschalten: () => void;
  /** Befundkarten — sie stehen im aufgeklappten Bereich. */
  kinder?: React.ReactNode;
}) {
  const zustand = pruefGesamtzustand(ergebnis);

  const kopf = {
    nicht_aktiv: {
      icon: ShieldOff, variante: "neutral" as const,
      titel: "Medikationsprüfung nicht aktiv",
      text: "Diese Medikation wurde nicht maschinell geprüft. Es ist kein Prüfdienst konfiguriert.",
    },
    befunde: {
      icon: ShieldAlert, variante: "warnung" as const,
      titel: `${ergebnis.befunde.length} ${ergebnis.befunde.length === 1 ? "Befund" : "Befunde"}`,
      text: `Geprüft ${isoZuAnzeige(ergebnis.geprueftAm)} · ${ergebnis.anbieterName}`,
    },
    teilweise_geprueft: {
      icon: ShieldAlert, variante: "warnung" as const,
      titel: "Teilweise geprüft",
      text: `Geprüft ${isoZuAnzeige(ergebnis.geprueftAm)} · ${ergebnis.anbieterName}`,
    },
    ohne_befund: {
      icon: ShieldCheck, variante: "erfolg" as const,
      titel: "Geprüft, kein Befund",
      text: `Geprüft ${isoZuAnzeige(ergebnis.geprueftAm)} · ${ergebnis.anbieterName}`,
    },
  }[zustand];

  const Icon = kopf.icon;
  const aufklappbar = ergebnis.anbieterAktiv;

  return (
    <section aria-label="Medikationsprüfung" style={{
      marginBottom: "var(--space-4)", borderRadius: "var(--radius-card)",
      border: "var(--border-thin) solid var(--border-default)", background: "var(--bg-elevated)",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 16px", flexWrap: "wrap" }}>
        <Icon style={{ width: 17, height: 17, flexShrink: 0, marginTop: 1, color: kopf.variante === "warnung" ? "var(--status-warning-text)" : kopf.variante === "erfolg" ? "var(--status-success-text)" : "var(--text-tertiary)" }} />
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>
            {kopf.titel}
          </div>
          <div style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", maxWidth: "72ch" }}>{kopf.text}</div>
        </div>
        {MOCK_KENNZEICHNUNG && ergebnis.anbieterAktiv && (
          <StatusMarke label="Beispieldaten" variante="neutral" />
        )}
        {aufklappbar && (
          <button type="button" onClick={onUmschalten} aria-expanded={offen} className="ui-fokusring inline-flex items-center"
            style={{ gap: 4, background: "none", border: "none", padding: 0, fontFamily: "inherit", fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", color: "var(--brand-accent)", cursor: "pointer" }}>
            {offen ? <ChevronDown style={{ width: 14, height: 14 }} /> : <ChevronRight style={{ width: 14, height: 14 }} />}
            {offen ? "Weniger" : "Prüfumfang und Befunde"}
          </button>
        )}
      </div>

      {aufklappbar && offen && (
        <div style={{ padding: "0 16px 14px", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          <div>
            {ergebnis.arten.map(a => <ArtZeile key={a.art} a={a} />)}
          </div>
          {kinder}
        </div>
      )}
    </section>
  );
}

function ArtZeile({ a }: { a: PruefartErgebnis }) {
  const nichtGeprueft = a.zustand === "nicht_geprueft";
  return (
    <div style={{ padding: "8px 0", borderTop: "var(--border-thin) solid var(--border-default)" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <span style={{ width: 170, flexShrink: 0, fontSize: "var(--text-small)", color: "var(--text-primary)" }}>
          {PRUEFART_LABEL[a.art]}
        </span>
        <span style={{ flex: 1, minWidth: 180, fontSize: "var(--text-meta)", color: nichtGeprueft ? "var(--status-warning-text)" : "var(--text-secondary)" }}>
          {abdeckungText(a)}
        </span>
      </div>
      {/* Fehlende Voraussetzung: Grund nennen und, wo es einen gibt, den Weg. */}
      {nichtGeprueft && a.grund && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 4, marginLeft: 180 }}>
          <Info style={{ width: 13, height: 13, color: "var(--text-tertiary)", flexShrink: 0, marginTop: 2 }} />
          <span style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", maxWidth: "68ch" }}>
            {a.grund}
            {a.wegText && <span style={{ display: "block", color: "var(--text-tertiary)" }}>{a.wegText}</span>}
          </span>
        </div>
      )}
    </div>
  );
}
