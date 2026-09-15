/**
 * Struktur-Ansicht (Lauf 4): drei Spalten mit Verbindungen — was hängt woran.
 *
 * Jedes Element erscheint GENAU EINMAL: ein Ziel, das zwei Diagnosen dient,
 * ist ein Knoten mit zwei Linien; eine Massnahme für zwei Ziele ebenso.
 * Die Linien liegen als SVG-Overlay hinter den Knoten und fangen keine
 * Klicks; ihre Endpunkte werden an den normal layouteten Knoten gemessen
 * (keine absolute Knoten-Positionierung) und folgen der Fenstergrösse.
 *
 * Ruhig, bis etwas ausgewählt ist: ohne Auswahl liegen alle Linien grau im
 * Hintergrund; mit Auswahl wird der Teilgraph hervorgehoben, alles andere
 * blasst ab. Ein Klick wählt, ein Klick in der Nachbarspalte verknüpft oder
 * löst; Diagnose→Ziel folgt der Ausschlussliste. Bearbeitet wird im Aufbau
 * (Doppelklick auf eine Massnahme).
 */
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { ausgeschlosseneZiele } from "../../../lib/pflegeplan/mock-adapter";
import {
  usePlan, massnahmeVerknuepfen, massnahmenBezugLoesen,
  zielVerbindungHerstellen, zielVerbindungLoesen,
  type PlanZustand,
} from "../../../lib/pflegeplan/plan-store";
import { massnahmenSatz, type MandatKurz } from "../../../lib/pflegeplan/planung";
import type { PositionsNummer, ZielId, DiagnoseCode } from "../../../lib/pflegeplan/vertrag";
import { TypMarke, positionsLage, planWochenSummeMin, massnahmenDauerMin } from "./gemeinsam";
import { wochenMinuten } from "../../../lib/pflegeplan/planung";

type Auswahl = { art: "d"; code: DiagnoseCode } | { art: "z"; zielId: ZielId } | { art: "m"; positionsNummer: PositionsNummer } | null;

interface Linie { von: string; zu: string; teilgraph: boolean }

const KARTE: React.CSSProperties = {
  background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)",
  borderRadius: "var(--radius-card)",
};

export function StrukturAnsicht({ plan: planProp, mandate, onEditor, onDetail }: {
  plan: PlanZustand;
  mandate: MandatKurz[];
  onEditor: (positionsNummer: PositionsNummer) => void;
  /** Öffnet die Diagnose-Detailansicht (Lauf 6g) — per Doppelklick auf den
   *  Diagnose-Knoten, wie onEditor bei den Massnahmen. */
  onDetail: (code: string, titel: string) => void;
}) {
  const plan = usePlan(); void planProp; /* dieselbe Quelle — Prop dient der Signatur-Klarheit */
  const [auswahl, setAuswahl] = useState<Auswahl>(null);
  const [meldung, setMeldung] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const knotenRefs = useRef(new Map<string, HTMLElement>());
  const [pfade, setPfade] = useState<{ d: string; teilgraph: boolean }[]>([]);

  /* ── Knotenmengen: jedes Element genau einmal ── */
  const zielKnoten = useMemo(() => {
    const je = new Map<ZielId, { titel: string; diagnosen: DiagnoseCode[]; eigenes: boolean }>();
    for (const z of plan.ziele) {
      const e = je.get(z.zielId) ?? { titel: z.titel, diagnosen: [], eigenes: z.eigenes };
      if (z.diagnoseCode !== null) e.diagnosen.push(z.diagnoseCode);
      je.set(z.zielId, e);
    }
    return [...je.entries()].map(([zielId, e]) => ({ zielId, ...e }));
  }, [plan.ziele]);

  const verbundeneZiele = zielKnoten.filter(z => z.diagnosen.length > 0);
  const freieZiele = zielKnoten.filter(z => z.diagnosen.length === 0);
  const verbundeneMassnahmen = plan.massnahmen.filter(m => m.zielBezuege.length > 0);
  const freieMassnahmen = plan.massnahmen.filter(m => m.zielBezuege.length === 0);

  /* ── Teilgraph der Auswahl ── */
  const teil = useMemo(() => {
    const d = new Set<DiagnoseCode>(); const z = new Set<ZielId>(); const m = new Set<PositionsNummer>();
    if (auswahl?.art === "d") {
      d.add(auswahl.code);
      for (const x of plan.ziele) if (x.diagnoseCode === auswahl.code) z.add(x.zielId);
      for (const x of plan.massnahmen) if (x.zielBezuege.some(b => b.diagnoseCode === auswahl.code)) m.add(x.positionsNummer);
    } else if (auswahl?.art === "z") {
      z.add(auswahl.zielId);
      for (const x of plan.ziele) if (x.zielId === auswahl.zielId && x.diagnoseCode !== null) d.add(x.diagnoseCode);
      for (const x of plan.massnahmen) if (x.zielBezuege.some(b => b.zielId === auswahl.zielId)) m.add(x.positionsNummer);
    } else if (auswahl?.art === "m") {
      m.add(auswahl.positionsNummer);
      const mm = plan.massnahmen.find(x => x.positionsNummer === auswahl.positionsNummer);
      for (const b of mm?.zielBezuege ?? []) { z.add(b.zielId); d.add(b.diagnoseCode); }
    }
    return { d, z, m, aktiv: auswahl !== null };
  }, [auswahl, plan]);

  /* ── Linien ── */
  const linien: Linie[] = useMemo(() => {
    const aus: Linie[] = [];
    for (const z of plan.ziele) {
      if (z.diagnoseCode === null) continue;
      aus.push({
        von: `d:${z.diagnoseCode}`, zu: `z:${z.zielId}`,
        teilgraph: teil.aktiv && teil.d.has(z.diagnoseCode) && teil.z.has(z.zielId)
          && (auswahl?.art !== "m" || (plan.massnahmen.find(x => x.positionsNummer === auswahl.positionsNummer)?.zielBezuege.some(b => b.diagnoseCode === z.diagnoseCode && b.zielId === z.zielId) ?? false)),
      });
    }
    const paare = new Set<string>();
    for (const m of plan.massnahmen) {
      for (const b of m.zielBezuege) {
        const key = `${b.zielId}|${m.positionsNummer}`;
        if (paare.has(key)) continue;
        paare.add(key);
        aus.push({
          von: `z:${b.zielId}`, zu: `m:${m.positionsNummer}`,
          teilgraph: teil.aktiv && teil.z.has(b.zielId) && teil.m.has(m.positionsNummer)
            && (auswahl?.art !== "d" || b.diagnoseCode === auswahl.code),
        });
      }
    }
    return aus;
  }, [plan, teil, auswahl]);

  /* ── Linien an den Knoten messen — auch bei Fenstergrösse-Änderung ── */
  useLayoutEffect(() => {
    const messen = () => {
      const rahmen = containerRef.current?.getBoundingClientRect();
      if (!rahmen) return;
      const punkt = (key: string, seite: "links" | "rechts") => {
        const el = knotenRefs.current.get(key);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: (seite === "rechts" ? r.right : r.left) - rahmen.left, y: r.top + r.height / 2 - rahmen.top };
      };
      setPfade(linien.flatMap(l => {
        const a = punkt(l.von, "rechts");
        const b = punkt(l.zu, "links");
        if (!a || !b) return [];
        const dx = Math.max(24, (b.x - a.x) / 2);
        return [{ d: `M ${a.x} ${a.y} C ${a.x + dx} ${a.y}, ${b.x - dx} ${b.y}, ${b.x} ${b.y}`, teilgraph: l.teilgraph }];
      }));
    };
    messen();
    const ro = new ResizeObserver(messen);
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener("resize", messen);
    return () => { ro.disconnect(); window.removeEventListener("resize", messen); };
  }, [linien]);

  const ref = (key: string) => (el: HTMLElement | null) => {
    if (el) knotenRefs.current.set(key, el); else knotenRefs.current.delete(key);
  };

  /* ── Klick-Logik: wählen, wechseln, verknüpfen, lösen ── */
  const klickDiagnose = (code: DiagnoseCode) => {
    setMeldung(null);
    if (auswahl?.art === "d") { setAuswahl(auswahl.code === code ? null : { art: "d", code }); return; }
    if (auswahl?.art === "z") {
      /* Nachbarspalte: verknüpfen oder lösen — die Ausschlussliste entscheidet mit. */
      const verbunden = plan.ziele.some(z => z.zielId === auswahl.zielId && z.diagnoseCode === code);
      if (verbunden) { zielVerbindungLoesen(code, auswahl.zielId); return; }
      if (ausgeschlosseneZiele(code).some(z => z.id === auswahl.zielId)) {
        setMeldung(`Für ${code} durch die Ausschlussliste unterdrückt — Verknüpfung gesperrt.`);
        return;
      }
      zielVerbindungHerstellen(code, auswahl.zielId);
      return;
    }
    setAuswahl({ art: "d", code });
  };

  const klickZiel = (zielId: ZielId) => {
    setMeldung(null);
    if (auswahl?.art === "z") { setAuswahl(auswahl.zielId === zielId ? null : { art: "z", zielId }); return; }
    if (auswahl?.art === "d") {
      const verbunden = plan.ziele.some(z => z.zielId === zielId && z.diagnoseCode === auswahl.code);
      if (verbunden) { zielVerbindungLoesen(auswahl.code, zielId); return; }
      if (ausgeschlosseneZiele(auswahl.code).some(z => z.id === zielId)) {
        setMeldung(`Für ${auswahl.code} durch die Ausschlussliste unterdrückt — Verknüpfung gesperrt.`);
        return;
      }
      zielVerbindungHerstellen(auswahl.code, zielId);
      return;
    }
    if (auswahl?.art === "m") {
      const m = plan.massnahmen.find(x => x.positionsNummer === auswahl.positionsNummer);
      if (!m) return;
      const bezuege = m.zielBezuege.filter(b => b.zielId === zielId);
      if (bezuege.length > 0) { bezuege.forEach(b => massnahmenBezugLoesen(m.positionsNummer, b)); return; }
      const traeger = plan.ziele.find(z => z.zielId === zielId && z.diagnoseCode !== null);
      if (!traeger || traeger.diagnoseCode === null) {
        setMeldung("Das Ziel ist mit keiner Diagnose verbunden.");
        return;
      }
      massnahmeVerknuepfen(m.positionsNummer, m.titel, { diagnoseCode: traeger.diagnoseCode, zielId });
      return;
    }
    setAuswahl({ art: "z", zielId });
  };

  const klickMassnahme = (positionsNummer: PositionsNummer) => {
    setMeldung(null);
    if (auswahl?.art === "m") { setAuswahl(auswahl.positionsNummer === positionsNummer ? null : { art: "m", positionsNummer }); return; }
    if (auswahl?.art === "z") {
      const m = plan.massnahmen.find(x => x.positionsNummer === positionsNummer);
      if (!m) return;
      const bezuege = m.zielBezuege.filter(b => b.zielId === auswahl.zielId);
      if (bezuege.length > 0) { bezuege.forEach(b => massnahmenBezugLoesen(positionsNummer, b)); return; }
      const traeger = plan.ziele.find(z => z.zielId === auswahl.zielId && z.diagnoseCode !== null);
      if (!traeger || traeger.diagnoseCode === null) {
        setMeldung("Das Ziel ist mit keiner Diagnose verbunden.");
        return;
      }
      massnahmeVerknuepfen(positionsNummer, m.titel, { diagnoseCode: traeger.diagnoseCode, zielId: auswahl.zielId });
      return;
    }
    /* Diagnose-Auswahl + Massnahmen-Klick: keine Nachbarspalte — Auswahl wechselt. */
    setAuswahl({ art: "m", positionsNummer });
  };

  /* Verknüpfbarkeit während einer Auswahl — sichtbar gekennzeichnet. */
  const zielVerknuepfbar = (zielId: ZielId): boolean => {
    if (auswahl?.art === "d") return !ausgeschlosseneZiele(auswahl.code).some(z => z.id === zielId);
    if (auswahl?.art === "m") return zielKnoten.find(z => z.zielId === zielId)?.diagnosen.length !== 0;
    return false;
  };
  const massnahmeVerknuepfbar = (): boolean => auswahl?.art === "z";
  const diagnoseVerknuepfbar = (code: DiagnoseCode): boolean =>
    auswahl?.art === "z" && !ausgeschlosseneZiele(code).some(z => z.id === auswahl.zielId);

  const abblassen = (imTeil: boolean) => teil.aktiv && !imTeil ? 0.38 : 1;

  const summeMin = planWochenSummeMin(plan.massnahmen);
  const teilbaumMin = (code: DiagnoseCode) => plan.massnahmen
    .filter(m => m.planung.erbringer === "S" && m.zielBezuege.some(b => b.diagnoseCode === code))
    .reduce((s, m) => s + wochenMinuten(m.planung, massnahmenDauerMin(m)), 0);

  /* Die Zeile trägt nur noch DATEN-Meldungen (Ausschlussliste, unverbundenes
     Ziel) — die Bedienungserklärung ist mit Lauf 6f entfernt. */
  const modusText = meldung ?? "";

  const knopfStil = (key: string, imTeil: boolean, gewaehlt: boolean, verknuepfbar: boolean): React.CSSProperties => ({
    ...KARTE,
    display: "block", width: "100%", textAlign: "left", fontFamily: "inherit", cursor: "pointer",
    padding: "8px 12px", position: "relative", zIndex: 1,
    opacity: abblassen(imTeil),
    borderColor: gewaehlt ? "var(--brand-primary)" : verknuepfbar ? "var(--status-info)" : "var(--border-default)",
    borderStyle: verknuepfbar && !gewaehlt ? "dashed" : "solid",
    boxShadow: gewaehlt ? "0 0 0 1px var(--brand-primary)" : "none",
  });

  return (
    <div className="flex-1 min-h-0" style={{ overflowY: "auto", padding: "14px var(--space-6)" }}>
      {/* Modus-Zeile */}
      <div data-modus style={{ padding: "7px 14px", marginBottom: 12, borderRadius: "var(--radius-card)", background: meldung ? "var(--status-warning-bg)" : "var(--bg-secondary)", fontSize: "var(--text-meta)", color: meldung ? "var(--status-warning-text)" : "var(--text-secondary)" }}>
        {modusText}
      </div>

      <div ref={containerRef} style={{ position: "relative" }}>
        {/* Linien: hinter den Knoten, keine Klicks. */}
        <svg data-linien style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }} aria-hidden>
          {pfade.map((p, i) => (
            <path key={i} d={p.d} fill="none"
              stroke={p.teilgraph ? "var(--brand-primary)" : "var(--border-default)"}
              strokeWidth={p.teilgraph ? 2 : 1}
              opacity={teil.aktiv ? (p.teilgraph ? 0.9 : 0.25) : 0.55} />
          ))}
        </svg>

        <div className="flex" style={{ gap: 28 }}>
          {/* ── Spalte 1: Diagnosen ── */}
          <div className="flex-1 min-w-0">
            <div style={{ fontSize: "var(--text-micro)", fontWeight: 500, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
              Pflegediagnosen · {plan.diagnosen.length}
            </div>
            <div className="flex flex-col" style={{ gap: 10 }}>
              {plan.diagnosen.map(d => {
                const ziele = plan.ziele.filter(z => z.diagnoseCode === d.code);
                const tb = Math.round(teilbaumMin(d.code));
                const gewaehlt = auswahl?.art === "d" && auswahl.code === d.code;
                return (
                  <button key={d.code} type="button" ref={ref(`d:${d.code}`)} data-struktur-d={d.code}
                    onClick={() => klickDiagnose(d.code)}
                    onDoubleClick={() => onDetail(d.code, d.titel)}
                    title="Doppelklick öffnet die Diagnose-Details"
                    className="ui-fokusring"
                    style={knopfStil(`d:${d.code}`, teil.d.has(d.code), gewaehlt, diagnoseVerknuepfbar(d.code))}>
                    <div className="flex items-center" style={{ gap: 6 }}>
                      <span style={{ fontSize: "var(--text-meta)", fontVariantNumeric: "tabular-nums", color: "var(--brand-primary)", fontWeight: 500 }}>{d.code}</span>
                      <span className="flex-1 min-w-0 truncate" style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>{d.titel}</span>
                      <TypMarke typ={d.typ} />
                    </div>
                    <div style={{ fontSize: "var(--text-micro)", color: ziele.length === 0 ? "var(--status-warning-text)" : "var(--text-tertiary)", marginTop: 2 }}>
                      {ziele.length === 0 ? "Ohne Ziel" : `${ziele.length} ${ziele.length === 1 ? "Ziel" : "Ziele"} · ${tb} min/Wo.`}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Spalte 2: Ziele ── */}
          <div className="flex-1 min-w-0">
            <div style={{ fontSize: "var(--text-micro)", fontWeight: 500, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
              Ziele · {zielKnoten.length}
            </div>
            <div className="flex flex-col" style={{ gap: 10 }}>
              {verbundeneZiele.map(z => {
                const massnahmen = plan.massnahmen.filter(m => m.zielBezuege.some(b => b.zielId === z.zielId));
                const gewaehlt = auswahl?.art === "z" && auswahl.zielId === z.zielId;
                return (
                  <button key={z.zielId} type="button" ref={ref(`z:${z.zielId}`)} data-struktur-z={z.zielId}
                    onClick={() => klickZiel(z.zielId)}
                    className="ui-fokusring"
                    style={knopfStil(`z:${z.zielId}`, teil.z.has(z.zielId), gewaehlt, zielVerknuepfbar(z.zielId))}>
                    <div style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>{z.titel}</div>
                    <div style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", marginTop: 2 }}>
                      {z.zielId} · {massnahmen.length} {massnahmen.length === 1 ? "Massnahme" : "Massnahmen"}
                      {z.diagnosen.length > 1 && ` · dient ${z.diagnosen.length} Diagnosen`}
                    </div>
                  </button>
                );
              })}
            </div>
            {freieZiele.length > 0 && (
              <div style={{ marginTop: 14, paddingTop: 8, borderTop: "var(--border-thin) dashed var(--border-default)" }}>
                <div style={{ fontSize: "var(--text-micro)", fontWeight: 500, color: "var(--status-warning-text)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                  Ohne Diagnose
                </div>
                <div className="flex flex-col" style={{ gap: 10 }}>
                  {freieZiele.map(z => (
                    <button key={z.zielId} type="button" ref={ref(`z:${z.zielId}`)} data-struktur-z={z.zielId}
                      onClick={() => klickZiel(z.zielId)} className="ui-fokusring"
                      style={knopfStil(`z:${z.zielId}`, teil.z.has(z.zielId), auswahl?.art === "z" && auswahl.zielId === z.zielId, zielVerknuepfbar(z.zielId))}>
                      <div style={{ fontSize: "var(--text-small)", color: "var(--text-primary)" }}>{z.titel}</div>
                      <div style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", marginTop: 2 }}>{z.zielId} · keine Verbindung</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Spalte 3: Massnahmen ── */}
          <div className="flex-1 min-w-0">
            <div style={{ fontSize: "var(--text-micro)", fontWeight: 500, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
              Massnahmen · {plan.massnahmen.length} · {(summeMin / 60).toFixed(2)} h/Wo.
            </div>
            <div className="flex flex-col" style={{ gap: 10 }}>
              {verbundeneMassnahmen.map(m => <MassnahmenKnoten key={m.positionsNummer} m={m} plan={plan} mandate={mandate}
                gewaehlt={auswahl?.art === "m" && auswahl.positionsNummer === m.positionsNummer}
                imTeil={teil.m.has(m.positionsNummer)} verknuepfbar={massnahmeVerknuepfbar()}
                abblassen={abblassen} onKlick={klickMassnahme} onDoppel={onEditor} refCb={ref} />)}
            </div>
            {freieMassnahmen.length > 0 && (
              <div style={{ marginTop: 14, paddingTop: 8, borderTop: "var(--border-thin) dashed var(--border-default)" }}>
                {/* In Lauf 6 ein Wirksamkeitsbefund — deshalb die harte Überschrift. */}
                <div style={{ fontSize: "var(--text-micro)", fontWeight: 500, color: "var(--status-warning-text)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                  Ohne Zielbezug — nicht begründet
                </div>
                <div className="flex flex-col" style={{ gap: 10 }}>
                  {freieMassnahmen.map(m => <MassnahmenKnoten key={m.positionsNummer} m={m} plan={plan} mandate={mandate}
                    gewaehlt={auswahl?.art === "m" && auswahl.positionsNummer === m.positionsNummer}
                    imTeil={teil.m.has(m.positionsNummer)} verknuepfbar={massnahmeVerknuepfbar()}
                    abblassen={abblassen} onKlick={klickMassnahme} onDoppel={onEditor} refCb={ref} />)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MassnahmenKnoten({ m, plan, mandate, gewaehlt, imTeil, verknuepfbar, abblassen, onKlick, onDoppel, refCb }: {
  m: PlanZustand["massnahmen"][number];
  plan: PlanZustand;
  mandate: MandatKurz[];
  gewaehlt: boolean;
  imTeil: boolean;
  verknuepfbar: boolean;
  abblassen: (imTeil: boolean) => number;
  onKlick: (id: PositionsNummer) => void;
  onDoppel: (id: PositionsNummer) => void;
  refCb: (key: string) => (el: HTMLElement | null) => void;
}) {
  const lage = positionsLage(m.positionsNummer);
  const satz = massnahmenSatz(m.planung, { positionsText: lage.text, vorgabeMinuten: lage.vorgabeMinuten, qualifikation: lage.qualifikation }, mandate);
  void plan;
  return (
    <button type="button" ref={refCb(`m:${m.positionsNummer}`)} data-struktur-m={m.positionsNummer}
      onClick={() => onKlick(m.positionsNummer)}
      onDoubleClick={() => onDoppel(m.positionsNummer)}
      className="ui-fokusring"
      style={{
        background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)",
        borderRadius: "var(--radius-card)", display: "block", width: "100%", textAlign: "left",
        fontFamily: "inherit", cursor: "pointer", padding: "8px 12px", position: "relative", zIndex: 1,
        opacity: abblassen(imTeil),
        borderColor: gewaehlt ? "var(--brand-primary)" : verknuepfbar ? "var(--status-info)" : "var(--border-default)",
        borderStyle: verknuepfbar && !gewaehlt ? "dashed" : "solid",
        boxShadow: gewaehlt ? "0 0 0 1px var(--brand-primary)" : "none",
      }}>
      <div style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>{m.titel}</div>
      <div style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", marginTop: 2, lineHeight: 1.5 }}>
        {satz.map((t, i) => (
          <span key={i}>
            {i > 0 && " · "}
            <span style={{ fontWeight: t.fett ? "var(--weight-medium)" : "var(--weight-regular)", color: t.warn ? "var(--status-warning-text)" : "var(--text-tertiary)" }}>{t.text}</span>
          </span>
        ))}
        {(() => {
          /* Eindeutige Ziele — zwei Bezüge auf dasselbe Ziel (über zwei
             Diagnosen) sind EIN Ziel. */
          const n = new Set(m.zielBezuege.map(b => b.zielId)).size;
          return n > 1 ? <span> · dient {n} Zielen</span> : null;
        })()}
      </div>
    </button>
  );
}
