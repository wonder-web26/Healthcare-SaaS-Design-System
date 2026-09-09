/**
 * Verlauf eines Parameters — Slide-over, wie die übrigen Module.
 *
 * ZEITFENSTER NACH ANZAHL MESSUNGEN, NICHT NACH KALENDER. Standard ist der
 * Zeitraum der letzten rund zwanzig Messungen, mit der tatsächlichen Spanne
 * dazu. Kalender-Voreinstellungen, für die die Daten nicht reichen, sind
 * DEAKTIVIERT UND BEGRÜNDET — nicht ausgeblendet, und nie eine leere Kurve.
 *
 * DAS DIAGRAMM IST VOLLSTÄNDIG BESCHRIFTET: Y-Achse mit Skala und Einheit,
 * X-Achse mit Datumsmarken, Legende je Serie. Werte verschiedener Messorte
 * liegen NIE auf derselben Linie — eine Ohrtemperatur und eine rektale sind
 * nicht dieselbe Kurve. Die Stricharten unterscheiden die Serien auch ohne
 * Farbe.
 *
 * DER ZIELBEREICH WIRD NUR DARGESTELLT. Kein Punkt wird markiert, eingefärbt
 * oder beurteilt, weil er ausserhalb liegt — das wäre eine automatische
 * Auswertung, und die ist hier bewusst verboten.
 *
 * DIE LISTE IST DIE VERLÄSSLICHE LESART. Das Diagramm zeigt die Form, die
 * Einzelmessungen darunter zeigen die Zahlen — samt Korrekturen, die
 * gekennzeichnet sichtbar bleiben.
 */
import { useMemo, useState } from "react";
import { Plus, Users } from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ReferenceArea, Tooltip,
} from "recharts";
import { Drawer, DrawerContent } from "../ui/drawer";
import { useFensterBreite } from "../ui/DataTable";
import { AppButton } from "../ui/AppButton";
import { StatusMarke } from "../ui/StatusMarke";
import { GEGENWART_ISO } from "../../../lib/gegenwart";
import { isoZuAnzeige } from "../../../lib/datum";
import {
  parameterDef, eintraegeVon, gueltigePunkte, kadenzVon, fensterBestimmen,
  BEURTEILUNG_LABEL, ERHEBUNGSART_LABEL, tageZwischen,
  type ParameterCode, type ParameterEintrag, type FensterCode,
} from "../../../lib/vitalzeichen/vitalzeichen";
import { useVitalMessungen, getZielwert } from "../../../lib/vitalzeichen/store";

const JETZT_ISO = `${GEGENWART_ISO}T09:00`;

/** Stricharten je Serie — unterscheidbar auch in Graustufen. */
const STRICHARTEN = ["", "6 3", "2 2", "8 3 2 3", "1 4"];
const SERIENFARBEN = [
  "var(--brand-primary)", "var(--status-info)", "var(--status-warning-text)",
  "var(--text-secondary)", "var(--brand-accent)",
];

export function VitalzeichenVerlauf({ patientId, code, onClose, onErfassen }: {
  patientId: string;
  code: ParameterCode;
  onClose: () => void;
  onErfassen: () => void;
}) {
  const istSchmal = useFensterBreite() < 1024;
  return (
    /* modal={false}: dieselbe vaul-Falle wie in den übrigen Slide-overs. */
    <Drawer open modal={false} onOpenChange={o => { if (!o) onClose(); }} direction={istSchmal ? "bottom" : "right"}>
      <DrawerContent aria-label={`Verlauf ${parameterDef(code).label}`} className={istSchmal ? "!max-h-[92vh]" : "sm:!max-w-[680px]"}>
        <Inhalt patientId={patientId} code={code} onClose={onClose} onErfassen={onErfassen} />
      </DrawerContent>
    </Drawer>
  );
}

function Inhalt({ patientId, code, onClose, onErfassen }: {
  patientId: string; code: ParameterCode; onClose: () => void; onErfassen: () => void;
}) {
  const def = parameterDef(code);
  const messungen = useVitalMessungen().filter(x => x.patientId === patientId);
  const eintraege = useMemo(() => eintraegeVon(messungen, code), [messungen, code]);
  const punkte = useMemo(() => gueltigePunkte(eintraege), [eintraege]);
  const zielwert = getZielwert(patientId, code);

  const kadenz = kadenzVon(punkte.map(p => p.messZeitpunkt));
  const fenster = useMemo(() => fensterBestimmen(punkte.map(p => p.messZeitpunkt), JETZT_ISO), [punkte]);
  const [fensterCode, setFensterCode] = useState<FensterCode>("standard");
  const gewaehlt = fenster.find(f => f.code === fensterCode) ?? fenster[0];
  const imFenster = new Set(gewaehlt.zeitpunkte);
  const sichtbarePunkte = punkte.filter(p => imFenster.has(p.messZeitpunkt));

  /* Serien: Blutdruck zwei (sys/dia); trennende Qualifier eine je Ausprägung. */
  const trennend = def.qualifier.find(q => q.trennendImVerlauf);
  const serien = useMemo(() => {
    if (code === "blood_pressure") {
      return [
        { key: "systolisch", label: "systolisch", punkte: sichtbarePunkte.map(p => ({ t: p.messZeitpunkt, wert: p.wert, e: p })) },
        { key: "diastolisch", label: "diastolisch", punkte: sichtbarePunkte.filter(p => p.zweitwert !== null).map(p => ({ t: p.messZeitpunkt, wert: p.zweitwert!, e: p })) },
      ];
    }
    if (trennend) {
      const gruppen = new Map<string, typeof sichtbarePunkte>();
      for (const p of sichtbarePunkte) {
        const k = p.qualifier[trennend.feld] ?? "ohne";
        if (!gruppen.has(k)) gruppen.set(k, []);
        gruppen.get(k)!.push(p);
      }
      return [...gruppen.entries()].map(([k, liste]) => {
        const label = trennend.werte.find(w => w.code === k)?.label ?? "ohne Angabe";
        return { key: k, label: `${label} (${liste.length})`, punkte: liste.map(p => ({ t: p.messZeitpunkt, wert: p.wert, e: p })) };
      });
    }
    return [{ key: "wert", label: def.label, punkte: sichtbarePunkte.map(p => ({ t: p.messZeitpunkt, wert: p.wert, e: p })) }];
  }, [code, sichtbarePunkte, trennend, def.label]);

  /* Datenzeilen fürs Diagramm: eine Zeile je Zeitpunkt, eine Spalte je Serie. */
  const daten = useMemo(() => {
    const zeilen = new Map<string, Record<string, number | string | boolean>>();
    for (const s of serien) {
      for (const p of s.punkte) {
        if (!zeilen.has(p.t)) zeilen.set(p.t, { t: new Date(p.t).getTime(), iso: p.t });
        zeilen.get(p.t)![s.key] = p.wert;
        if (p.e.erhebungsart === "angehoerige_berichtet") zeilen.get(p.t)!["angehoerige"] = true;
      }
    }
    return [...zeilen.values()].sort((a, b) => (a.t as number) - (b.t as number));
  }, [serien]);

  const spanneText = gewaehlt.zeitpunkte.length >= 2
    ? `${gewaehlt.zeitpunkte.length} Messungen (${tageZwischen(gewaehlt.zeitpunkte[0], gewaehlt.zeitpunkte[gewaehlt.zeitpunkte.length - 1])} Tage)`
    : `${gewaehlt.zeitpunkte.length} ${gewaehlt.zeitpunkte.length === 1 ? "Messung" : "Messungen"}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: 0, height: "100%" }}>
      <div style={{ padding: "18px 22px 6px" }}>
        <div style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>
          {def.label} <span style={{ color: "var(--text-tertiary)", fontWeight: "var(--weight-regular)" }}>· {def.einheit}</span>
        </div>
        {/* Messkadenz zuoberst — wie oft überhaupt gemessen wird. */}
        <div style={{ marginTop: 2, fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>
          {kadenz.anzahl === 0
            ? "Noch keine Messung erfasst."
            : <>
                {kadenz.anzahl} {kadenz.anzahl === 1 ? "Messung" : "Messungen"}
                {kadenz.rhythmusText && ` · ${kadenz.rhythmusText}`}
                {kadenz.ersteAm && ` · erste am ${isoZuAnzeige(kadenz.ersteAm.slice(0, 10))}`}
                {trennend && serien.length > 1 && ` · ${serien.length} ${trennend.label}e`}
              </>}
        </div>
      </div>

      {/* Zeitfenster: nach Anzahl, Kalender-Voreinstellungen begründet gesperrt. */}
      <div style={{ padding: "8px 22px", display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        {fenster.map(f => {
          const gewaehltJetzt = f.code === fensterCode;
          return (
            <button key={f.code} type="button" onClick={() => f.aktiv && setFensterCode(f.code)}
              disabled={!f.aktiv} aria-pressed={gewaehltJetzt}
              title={f.grund ?? undefined}
              className={f.aktiv ? "ui-fokusring" : undefined}
              style={{
                padding: "5px 12px", borderRadius: "var(--radius-pill)", fontFamily: "inherit", fontSize: "var(--text-meta)",
                background: gewaehltJetzt ? "var(--brand-primary-light)" : "transparent",
                border: "var(--border-thin) solid " + (gewaehltJetzt ? "var(--brand-primary)" : "var(--border-default)"),
                color: !f.aktiv ? "var(--text-tertiary)" : gewaehltJetzt ? "var(--brand-primary)" : "var(--text-primary)",
                cursor: f.aktiv ? "pointer" : "not-allowed", opacity: f.aktiv ? 1 : 0.6,
              }}>
              {f.label}
            </button>
          );
        })}
        <span style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>{spanneText}</span>
      </div>
      {/* Der Grund einer gesperrten Voreinstellung steht sichtbar, nicht nur im title. */}
      {fenster.filter(f => !f.aktiv && f.grund).map(f => (
        <div key={f.code} style={{ padding: "0 22px 4px", fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>{f.grund}</div>
      ))}

      <div style={{ flex: 1, overflowY: "auto", padding: "8px 22px 20px", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        {sichtbarePunkte.length === 0 ? (
          <p style={{ margin: 0, fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>
            Im gewählten Fenster liegen keine Messungen.
          </p>
        ) : (
          /* flexShrink 0: sonst drückt die lange Einzelmessungsliste das
             Diagramm im Flex-Container auf Briefmarkengrösse zusammen. */
          <div aria-label={`Verlaufsdiagramm ${def.label}`} role="img" style={{ width: "100%", height: 280, flexShrink: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={daten} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
                <CartesianGrid stroke="var(--border-default)" strokeDasharray="2 4" />
                <XAxis dataKey="t" type="number" domain={["dataMin", "dataMax"]} scale="time"
                  tickFormatter={(t: number) => { const d = new Date(t); return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.`; }}
                  tick={{ fontSize: 11, fill: "var(--text-tertiary)" }} stroke="var(--border-default)" />
                <YAxis width={44} tick={{ fontSize: 11, fill: "var(--text-tertiary)" }} stroke="var(--border-default)"
                  domain={["auto", "auto"]}
                  label={{ value: def.einheit, angle: -90, position: "insideLeft", style: { fontSize: 11, fill: "var(--text-tertiary)" } }} />
                <Tooltip
                  labelFormatter={(t: number) => isoZuAnzeige(new Date(t).toISOString().slice(0, 10))}
                  formatter={(wert: number, name: string) => [`${wert} ${def.einheit}`, name]}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--border-default)" }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {/* Zielband: nur dargestellt — keine Markierung von Punkten. */}
                {zielwert && zielwert.bandMin !== null && zielwert.bandMax !== null && (
                  <ReferenceArea y1={zielwert.bandMin} y2={zielwert.bandMax}
                    fill="var(--status-success-bg)" fillOpacity={0.45} stroke="none" />
                )}
                {serien.map((s, i) => (
                  /* Ohne Animation: recharts animiert über stroke-dasharray und
                     überschriebe damit die Strichart, die die Serien auch in
                     Graustufen unterscheidbar hält. */
                  <Line key={s.key} dataKey={s.key} name={s.label} connectNulls isAnimationActive={false}
                    stroke={SERIENFARBEN[i % SERIENFARBEN.length]} strokeWidth={1.5}
                    strokeDasharray={STRICHARTEN[i % STRICHARTEN.length] || undefined}
                    /* Von Angehörigen erhobene Punkte: offener Kreis statt gefüllt. */
                    dot={(props: { cx?: number; cy?: number; payload?: { angehoerige?: boolean } }) => {
                      const { cx, cy, payload } = props;
                      if (cx === undefined || cy === undefined || payload?.[s.key as never] === undefined) return <g key={`${s.key}-${cx}-${cy}`} />;
                      const vonAngehoerigen = payload?.angehoerige === true;
                      return (
                        <circle key={`${s.key}-${cx}-${cy}`} cx={cx} cy={cy} r={3.5}
                          fill={vonAngehoerigen ? "var(--bg-elevated)" : SERIENFARBEN[i % SERIENFARBEN.length]}
                          stroke={SERIENFARBEN[i % SERIENFARBEN.length]} strokeWidth={1.5} />
                      );
                    }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        {/* Die Zielband-Beschriftung steht unter dem Diagramm statt darin —
            im Diagramm überlappte sie die Kurven. Angezeigt, nie ausgewertet. */}
        {zielwert && zielwert.bandMin !== null && zielwert.bandMax !== null && sichtbarePunkte.length > 0 && (
          <div style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>
            Getöntes Band: Zielbereich {zielwert.text} ({zielwert.quelle}, hinterlegt {isoZuAnzeige(zielwert.hinterlegtAm)}) —
            nur dargestellt, nicht ausgewertet.
          </div>
        )}
        {daten.some(z => z["angehoerige"]) && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>
            <Users style={{ width: 12, height: 12 }} />
            Offene Punkte: von Angehörigen berichtete Werte.
          </div>
        )}

        {/* Die Einzelmessungen — die verlässliche Lesart der Werte. */}
        <section aria-label="Einzelmessungen">
          <h4 style={{ margin: "0 0 4px", fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--text-tertiary)" }}>
            Einzelmessungen
          </h4>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {[...eintraege].reverse().map((e, i) => (
              <EinzelmessungZeile key={`${e.messungId}-${i}`} e={e} def={def} />
            ))}
          </div>
        </section>
      </div>

      <div style={{ borderTop: "var(--border-thin) solid var(--border-default)", padding: "12px 22px", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12 }}>
        <button type="button" onClick={onClose} className="ui-fokusring"
          style={{ background: "none", border: "none", padding: 0, fontFamily: "inherit", fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-secondary)", cursor: "pointer" }}>
          Schliessen
        </button>
        <AppButton variant="primaer" icon={Plus} onClick={onErfassen}>Messung erfassen</AppButton>
      </div>
    </div>
  );
}

function EinzelmessungZeile({ e, def }: { e: ParameterEintrag; def: ReturnType<typeof parameterDef> }) {
  const kontext = def.qualifier
    .map(q => q.werte.find(x => x.code === e.qualifier[q.feld])?.label)
    .filter(Boolean).join(", ");
  const wertText = e.nichtErhebbar
    ? "Nicht erhebbar"
    : e.wert !== null
      ? (def.code === "blood_pressure" && e.zweitwert !== null ? `${e.wert}/${e.zweitwert} ${def.einheit}` : `${e.wert} ${def.einheit}`)
      : "—";
  return (
    <div style={{
      display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap",
      padding: "8px 0", borderTop: "var(--border-thin) solid var(--border-default)",
      opacity: e.korrigiert ? 0.7 : 1,
    }}>
      <span style={{ flex: "0 0 118px", fontSize: "var(--text-meta)", color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums" }}>
        {isoZuAnzeige(e.messZeitpunkt.slice(0, 10))}, {e.messZeitpunkt.slice(11, 16)}
      </span>
      <span style={{
        flex: "0 0 110px", fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)",
        color: e.nichtErhebbar ? "var(--text-secondary)" : "var(--text-primary)",
        fontVariantNumeric: "tabular-nums",
        textDecoration: e.korrigiert ? "line-through" : "none",
      }}>
        {wertText}
      </span>
      <span style={{ flex: "1 1 140px", fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>
        {e.nichtErhebbar ? e.nichtErhebbarGrund : (kontext || "—")}
        <span style={{ display: "block", fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>
          {e.gemessenDurchName} · {e.gemessenDurchRolle}
          {e.erhebungsart !== "selbst_gemessen" ? ` · ${ERHEBUNGSART_LABEL[e.erhebungsart]}` : ""}
          {e.nachtrag ? " · Nachtrag" : ""}
        </span>
      </span>
      <span style={{ display: "inline-flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
        {e.korrigiert && (
          <StatusMarke variante="neutral" label={`Korrigiert durch ${e.korrigiertDurch}`} />
        )}
        {e.korrekturVon && (
          <StatusMarke variante="info" label={`Korrektur von ${e.korrekturVon}`} />
        )}
        {!e.nichtErhebbar && !e.korrigiert && (
          e.beurteilung === null
            ? <StatusMarke variante="neutral" label="Beurteilung offen" />
            : e.beurteilung === "normal"
              ? <StatusMarke variante="erfolg" label={BEURTEILUNG_LABEL.normal} />
              : <StatusMarke variante="warnung" label={BEURTEILUNG_LABEL[e.beurteilung]} />
        )}
      </span>
    </div>
  );
}
