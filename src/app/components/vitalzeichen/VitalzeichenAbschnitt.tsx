/**
 * Vitalzeichen — DAS eine Modul für beide Einstiege (Onboarding-Reiter und
 * Patientenakte). Unterschied ist nur der Rahmen, nie die Funktion: kein
 * zweiter Datenpfad, keine Kopie. Beide Stellen lösen dieselbe
 * Patientenkennung auf und sehen denselben Bestand.
 *
 * DIE ÜBERSICHT ENTHÄLT KEINE GRAFIK. Die Spalte «Veränderung» trägt die
 * beschriftete Differenz mit ihrem Bezugspunkt — je Parameter ein anderer
 * (letzte Messung, gleicher Messort, gleicher Messkontext, Gewichtstrend mit
 * Zeitraum). Eine Sparkline sagt «es bewegt sich», die beschriftete Zahl sagt
 * was, wieviel und wogegen.
 *
 * NIE ERHOBENE PARAMETER ERSCHEINEN MIT «Nicht erhoben» statt zu fehlen —
 * eine Zeile, die fehlt, fällt niemandem auf; eine Zeile, die «nie gemessen»
 * sagt, schon.
 */
import { useState } from "react";
import { Plus, Activity, Calculator } from "lucide-react";
import { AppButton } from "../ui/AppButton";
import { StatusMarke } from "../ui/StatusMarke";
import { LeerZustand } from "../ui/LeerZustand";
import { GEGENWART_ISO } from "../../../lib/gegenwart";
import { isoZuAnzeige } from "../../../lib/datum";
import {
  VITAL_PARAMETER, GRUPPE_LABEL, BEURTEILUNG_LABEL, ERHEBUNGSART_LABEL,
  eintraegeVon, gueltigePunkte, veraenderungText, bmiVeraenderungText, berechneBmi, relativText,
  type ParameterCode, type ParameterGruppe, type VitalParameterDef, type ParameterEintrag,
} from "../../../lib/vitalzeichen/vitalzeichen";
import { useVitalMessungen } from "../../../lib/vitalzeichen/store";
import { VitalzeichenErfassung } from "./VitalzeichenErfassung";
import { VitalzeichenVerlauf } from "./VitalzeichenVerlauf";

const JETZT = `${GEGENWART_ISO}T09:00`;

export function VitalzeichenAbschnitt({ patientId }: { patientId: string }) {
  const messungen = useVitalMessungen().filter(x => x.patientId === patientId);
  const [erfassungOffen, setErfassungOffen] = useState(false);
  const [verlaufCode, setVerlaufCode] = useState<ParameterCode | null>(null);

  /* ── Leerer Zustand: kein leeres Tabellengerüst ── */
  if (messungen.length === 0 && !erfassungOffen) {
    return (
      <div style={{ padding: "var(--space-4)" }}>
        <LeerZustand icon={Activity}
          titel="Noch keine Vitalzeichen erfasst"
          untertitel="Erfassen Sie beim ersten Besuch auch Körpergrösse und Gewicht mit — sie sind die Grundlage für den BMI und spätere Dosisprüfungen."
          aktion={{ label: "Messung erfassen", onClick: () => setErfassungOffen(true), icon: Plus }} />
      </div>
    );
  }

  const gruppen: ParameterGruppe[] = ["vitalzeichen", "ohne_status"];

  return (
    <div style={{ padding: "var(--space-4)" }}>
      <div className="flex items-center" style={{ gap: 12, marginBottom: "var(--space-4)", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: "var(--text-h3)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>Vitalzeichen</div>
          <div style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>
            {messungen.length} {messungen.length === 1 ? "Messung" : "Messungen"} · zuletzt {isoZuAnzeige(messungen[messungen.length - 1].messZeitpunkt.slice(0, 10))}
          </div>
        </div>
        <AppButton variant="primaer" icon={Plus} onClick={() => setErfassungOffen(true)}>Messung erfassen</AppButton>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", minWidth: 980, tableLayout: "fixed", borderCollapse: "collapse", fontSize: "var(--text-small)" }}>
          <colgroup>
            {["16%", "15%", "13%", "16%", "16%", "24%"].map((w, i) => <col key={i} style={{ width: w }} />)}
          </colgroup>
          <thead>
            <tr>
              {["Parameter", "Letzter Wert", "Kontext", "Messzeitpunkt", "Erhoben von", "Veränderung"].map(s => (
                <th key={s} scope="col" style={{
                  textAlign: "left", padding: "6px 10px 8px",
                  fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)",
                  color: "var(--text-tertiary)", borderBottom: "var(--border-thin) solid var(--border-default)",
                }}>{s}</th>
              ))}
            </tr>
          </thead>
          {gruppen.map(g => (
            <tbody key={g}>
              <tr>
                <th scope="colgroup" colSpan={6} style={{
                  textAlign: "left", padding: "14px 10px 6px",
                  fontSize: "var(--text-micro)", fontWeight: "var(--weight-medium)",
                  letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-tertiary)",
                }}>
                  {GRUPPE_LABEL[g]}
                </th>
              </tr>
              {VITAL_PARAMETER.filter(p => p.gruppe === g).map(def => (
                <ParameterZeile key={def.code} def={def} messungen={messungen}
                  onOeffnen={() => setVerlaufCode(def.code)} />
              ))}
              {/* Der BMI steht bei den Vitalzeichen — berechnet, nie erfasst. */}
              {g === "vitalzeichen" && <BmiZeile messungen={messungen} />}
            </tbody>
          ))}
        </table>
      </div>

      {erfassungOffen && (
        <VitalzeichenErfassung patientId={patientId} onClose={() => setErfassungOffen(false)} />
      )}
      {verlaufCode && (
        <VitalzeichenVerlauf patientId={patientId} code={verlaufCode}
          onClose={() => setVerlaufCode(null)}
          onErfassen={() => { setVerlaufCode(null); setErfassungOffen(true); }} />
      )}
    </div>
  );
}

function ParameterZeile({ def, messungen, onOeffnen }: {
  def: VitalParameterDef;
  messungen: ReturnType<typeof useVitalMessungen>;
  onOeffnen: () => void;
}) {
  const eintraege = eintraegeVon(messungen, def.code);
  const punkte = gueltigePunkte(eintraege);
  const letzterEintrag: ParameterEintrag | undefined = eintraege.filter(e => !e.korrigiert).slice(-1)[0];
  const letzterWert = punkte.slice(-1)[0];

  /* Nie erhoben: die Zeile bleibt, sagt es aber. */
  if (!letzterEintrag) {
    return (
      <tr style={zeilenStil} tabIndex={0} role="button" className="ui-fokusring" onClick={onOeffnen}
        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOeffnen(); } }}
        aria-label={`${def.label}: Verlauf öffnen`}>
        <td style={zelle}><ParameterName def={def} /></td>
        <td style={{ ...zelle, color: "var(--text-tertiary)" }}>Nicht erhoben</td>
        <td style={zelle}>—</td><td style={zelle}>—</td><td style={zelle}>—</td>
        <td style={{ ...zelle, color: "var(--text-tertiary)" }}>Kein Wert erfasst.</td>
      </tr>
    );
  }

  const zeigtNichtErhebbar = letzterEintrag.nichtErhebbar;
  const kontext = kontextText(def, zeigtNichtErhebbar ? letzterEintrag : (letzterWert ?? letzterEintrag));
  const wertText = zeigtNichtErhebbar
    ? "Nicht erhebbar"
    : letzterWert
      ? (def.code === "blood_pressure" && letzterWert.zweitwert !== null
        ? `${letzterWert.wert}/${letzterWert.zweitwert} ${def.einheit}`
        : `${letzterWert.wert} ${def.einheit}`)
      : "—";
  const auffaellig = !zeigtNichtErhebbar && letzterWert?.beurteilung && letzterWert.beurteilung !== "normal";
  const bezugsEintrag = zeigtNichtErhebbar ? letzterEintrag : (letzterWert ?? letzterEintrag);

  return (
    <tr style={zeilenStil} tabIndex={0} role="button" className="ui-fokusring" onClick={onOeffnen}
      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOeffnen(); } }}
      aria-label={`${def.label}: Verlauf öffnen`}>
      <td style={zelle}><ParameterName def={def} /></td>
      <td style={zelle}>
        <span style={{ fontWeight: "var(--weight-medium)", color: zeigtNichtErhebbar ? "var(--text-secondary)" : "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
          {wertText}
        </span>
        {auffaellig && letzterWert?.beurteilung && (
          <span style={{ display: "block", marginTop: 3 }}>
            <StatusMarke variante="warnung" label={BEURTEILUNG_LABEL[letzterWert.beurteilung]} />
          </span>
        )}
        {!zeigtNichtErhebbar && letzterWert && letzterWert.beurteilung === null && (
          <span style={{ display: "block", fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>Beurteilung offen</span>
        )}
      </td>
      <td style={{ ...zelle, color: "var(--text-secondary)" }}>{kontext || "—"}</td>
      <td style={zelle}>
        <span style={{ fontVariantNumeric: "tabular-nums" }}>{zeitText(bezugsEintrag.messZeitpunkt)}</span>
        <span style={{ display: "block", fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>
          {relativText(bezugsEintrag.messZeitpunkt, JETZT)}{bezugsEintrag.nachtrag ? " · Nachtrag" : ""}
        </span>
      </td>
      <td style={{ ...zelle, color: "var(--text-secondary)" }}>
        {bezugsEintrag.gemessenDurchName}
        <span style={{ display: "block", fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>
          {bezugsEintrag.gemessenDurchRolle}
          {bezugsEintrag.erhebungsart !== "selbst_gemessen" ? ` · ${ERHEBUNGSART_LABEL[bezugsEintrag.erhebungsart]}` : ""}
        </span>
      </td>
      <td style={{ ...zelle, color: "var(--text-secondary)" }}>
        {zeigtNichtErhebbar
          ? `Nicht erhebbar: ${letzterEintrag.nichtErhebbarGrund}`
          : veraenderungText(def.code, punkte.map(p => ({ messZeitpunkt: p.messZeitpunkt, wert: p.wert, zweitwert: p.zweitwert, qualifier: p.qualifier })), def.einheit)}
      </td>
    </tr>
  );
}

/** BMI — berechnet aus letztem Gewicht und letzter Grösse; keine Herkunft. */
function BmiZeile({ messungen }: { messungen: ReturnType<typeof useVitalMessungen> }) {
  const gewichte = gueltigePunkte(eintraegeVon(messungen, "weight"));
  const groessen = gueltigePunkte(eintraegeVon(messungen, "height"));
  const groesse = groessen.slice(-1)[0]?.wert ?? null;
  const letztesGewicht = gewichte.slice(-1)[0];
  const bmi = berechneBmi(letztesGewicht?.wert ?? null, groesse);
  const bmiPunkte = groesse
    ? gewichte.map(g => ({ messZeitpunkt: g.messZeitpunkt, bmi: berechneBmi(g.wert, groesse)! }))
    : [];

  return (
    <tr style={{ ...zeilenStil, cursor: "default" }}
      title="Berechnet aus Gewicht und Grösse — der Verlauf läuft über das Körpergewicht.">
      <td style={zelle}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>Body-Mass-Index</span>
          <StatusMarke variante="neutral" label="berechnet" icon={Calculator} />
        </span>
        <span style={{ display: "block", fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>kg/m² · nicht erfassbar</span>
      </td>
      <td style={zelle}>
        <span style={{ fontWeight: "var(--weight-medium)", fontVariantNumeric: "tabular-nums" }}>
          {bmi !== null ? `${bmi} kg/m²` : "—"}
        </span>
        {bmi === null && (
          <span style={{ display: "block", fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>
            Braucht Gewicht und Grösse.
          </span>
        )}
      </td>
      <td style={{ ...zelle, color: "var(--text-secondary)" }}>
        {groesse ? `Grösse ${groesse} cm` : "—"}
      </td>
      <td style={zelle}>
        {letztesGewicht ? (
          <>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>{zeitText(letztesGewicht.messZeitpunkt)}</span>
            <span style={{ display: "block", fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>Stand des Gewichts</span>
          </>
        ) : "—"}
      </td>
      {/* Berechnet — es gibt keine erhebende Person. */}
      <td style={{ ...zelle, color: "var(--text-tertiary)" }}>—</td>
      <td style={{ ...zelle, color: "var(--text-secondary)" }}>
        {bmiPunkte.length > 0 ? bmiVeraenderungText(bmiPunkte) : "Kein Wert berechenbar."}
      </td>
    </tr>
  );
}

function ParameterName({ def }: { def: VitalParameterDef }) {
  return (
    <>
      <span style={{ fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>{def.label}</span>
      <span style={{ display: "block", fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>{def.einheit}</span>
    </>
  );
}

/** Kontextspalte: die qualifizierenden Angaben des letzten Werts, ausgeschrieben. */
function kontextText(def: VitalParameterDef, e: ParameterEintrag): string {
  return def.qualifier
    .map(q => q.werte.find(x => x.code === e.qualifier[q.feld])?.label)
    .filter((x): x is string => !!x)
    .join(", ");
}

function zeitText(iso: string): string {
  return `${isoZuAnzeige(iso.slice(0, 10))}, ${iso.slice(11, 16)}`;
}

const zeilenStil: React.CSSProperties = {
  borderBottom: "var(--border-thin) solid var(--border-default)", cursor: "pointer",
};
const zelle: React.CSSProperties = {
  padding: "10px", verticalAlign: "top", color: "var(--text-primary)",
};
