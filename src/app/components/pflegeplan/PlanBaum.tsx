/**
 * Der Plan als Baum (rechts seit dem A/B-Entscheid) — Diagnose enthält Ziele, Ziel enthält
 * Massnahmen. Drei Faltebenen (Diagnose, Ziel, «Alle zuklappen»); zugeklappt
 * zeigt jede Ebene eine Zusammenfassung, nicht nichts — bei 15 Massnahmen ist
 * das der Normalfall, kein Randfall. Massnahmenzeilen sind in diesem Lauf
 * nicht anklickbar; der Editor kommt in Lauf 3.
 */
import { useState } from "react";
import { ChevronDown, ChevronRight, ClipboardList, X } from "lucide-react";
import {
  nachPrioritaet, diagnosePriorisieren, diagnoseEntfernen,
  type PlanZustand, type PlanMassnahme, type PlanZiel,
} from "../../../lib/pflegeplan/plan-store";
import { massnahmenSatz, istErsterBezug, type MandatKurz } from "../../../lib/pflegeplan/planung";
import { type Fokus, TypMarke, positionsLage } from "./gemeinsam";

const KARTE: React.CSSProperties = {
  background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)",
  borderRadius: "var(--radius-card)",
};

function FaltKnopf({ zu, onToggle, label }: { zu: boolean; onToggle: () => void; label: string }) {
  return (
    <button type="button" onClick={onToggle} aria-label={label} aria-expanded={!zu}
      className="ui-fokusring cursor-pointer flex items-center justify-center"
      style={{ width: 24, height: 24, background: "none", border: "none", color: "var(--text-tertiary)", flexShrink: 0 }}>
      {zu ? <ChevronRight style={{ width: 15, height: 15 }} /> : <ChevronDown style={{ width: 15, height: 15 }} />}
    </button>
  );
}

/** Satzzeile einer Massnahme unter einem Ziel: die Massnahme liest sich als
 *  Satz — fett ist, was gesetzt wurde, der Rest kommt aus dem Katalog. Der
 *  erste Zielbezug trägt Position und Zeit; unter weiteren Zielen wird nicht
 *  doppelt gezählt. Die Zeile öffnet den Editor im Auswahlbereich (Lauf 3); der Baum
 *  bleibt dabei stehen. */
function MassnahmenZeile({ m, diagnoseCode, zielId, zielTitelVon, mandate, onFokus }: {
  m: PlanMassnahme; diagnoseCode: string | null; zielId: string | null;
  zielTitelVon: (diagnoseCode: string, zielId: string) => string;
  mandate: MandatKurz[];
  onFokus: (f: Fokus) => void;
}) {
  const erster = m.zielBezuege[0] ?? null;
  /* Die Paar-Regel lebt in EINER Funktion (planung.ts) — getestet, nicht
     je Ansicht nachgebaut (Lauf 6e). */
  const istErster = istErsterBezug(m, diagnoseCode, zielId);
  return (
    <button type="button" data-massnahme={istErster ? m.interventionId : undefined}
      onClick={() => onFokus({ schritt: "editor", interventionId: m.interventionId })}
      className="ui-fokusring cursor-pointer w-full text-left"
      style={{ display: "block", background: "none", border: "none", fontFamily: "inherit", padding: "6px 0 6px 30px", borderTop: "var(--border-thin) solid var(--border-default)" }}>
      <div style={{ fontSize: "var(--text-small)", color: "var(--text-primary)" }}>{m.titel}</div>
      <div style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)", marginTop: 1, lineHeight: 1.5 }}>
        {istErster
          ? (() => {
              const lage = positionsLage(m.interventionId, m.planung.detailAuswahl);
              return massnahmenSatz(m.planung, { positionsText: lage.text, vorgabeMinuten: lage.vorgabeMinuten, qualifikation: lage.qualifikation }, mandate);
            })().map((t, i) => (
              <span key={i}>
                {i > 0 && " · "}
                <span style={{
                  fontWeight: t.fett ? "var(--weight-medium)" : "var(--weight-regular)",
                  color: t.warn ? "var(--status-warning-text)" : t.fett ? "var(--text-secondary)" : "var(--text-tertiary)",
                }}>{t.text}</span>
              </span>
            ))
          : `Dieselbe Leistung wie unter „${erster ? zielTitelVon(erster.diagnoseCode, erster.zielId) : ""}", bereits gezählt`}
      </div>
    </button>
  );
}

export function PlanBaum({ plan, mandate, onFokus }: {
  plan: PlanZustand;
  mandate: MandatKurz[];
  onFokus: (f: Fokus) => void;
}) {
  const [zugeklappt, setZugeklappt] = useState<Set<string>>(new Set());

  const toggle = (key: string) => setZugeklappt(prev => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  const alleKeys = [
    ...plan.diagnosen.map(d => `d:${d.code}`),
    ...plan.ziele.map(z => `z:${z.diagnoseCode}|${z.zielId}`),
  ];
  const allesZu = alleKeys.length > 0 && alleKeys.every(k => zugeklappt.has(k));

  const zieleVon = (code: string): PlanZiel[] => plan.ziele.filter(z => z.diagnoseCode === code);
  const massnahmenVon = (code: string, zielId: string): PlanMassnahme[] =>
    plan.massnahmen.filter(m => m.zielBezuege.some(b => b.diagnoseCode === code && b.zielId === zielId));
  const massnahmenJeDiagnose = (code: string): number => {
    const ids = new Set(plan.massnahmen
      .filter(m => m.zielBezuege.some(b => b.diagnoseCode === code))
      .map(m => m.interventionId));
    return ids.size;
  };
  const zielTitelVon = (code: string, zielId: string): string =>
    plan.ziele.find(z => z.diagnoseCode === code && z.zielId === zielId)?.titel ?? zielId;

  const ohneZuordnung = plan.massnahmen.filter(m => m.zielBezuege.length === 0);
  /* Ungebundene Ziele: die letzte Diagnose-Verbindung wurde in der Struktur
     gelöst — sie bleiben sichtbar, statt zu verschwinden. */
  const freieZiele = plan.ziele.filter(z => z.diagnoseCode === null);
  const [belegOffen, setBelegOffen] = useState<Set<string>>(new Set());

  if (plan.diagnosen.length === 0 && ohneZuordnung.length === 0) {
    return (
      <div style={{ ...KARTE, padding: "var(--space-8)", textAlign: "center" }}>
        <ClipboardList style={{ width: 22, height: 22, color: "var(--text-tertiary)", margin: "0 auto 8px" }} />
        <div style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>
          Der Plan ist leer
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Werkzeugzeile */}
      <div className="flex items-center justify-end" style={{ marginBottom: 8 }}>
        <button type="button"
          onClick={() => setZugeklappt(allesZu ? new Set() : new Set(alleKeys))}
          className="ui-fokusring cursor-pointer"
          style={{ background: "none", border: "none", padding: 0, fontFamily: "inherit", fontSize: "var(--text-meta)", fontWeight: 500, color: "var(--text-secondary)" }}>
          {allesZu ? "Alle aufklappen" : "Alle zuklappen"}
        </button>
      </div>

      <div className="flex flex-col" style={{ gap: 10 }}>
        {/* Prioritätsreihenfolge (Lauf 6d): wichtige zuerst. */}
        {nachPrioritaet(plan.diagnosen).map(d => {
          const dKey = `d:${d.code}`;
          const dZu = zugeklappt.has(dKey);
          const ziele = zieleVon(d.code);
          const mAnzahl = massnahmenJeDiagnose(d.code);
          const wichtig = d.prioritaet === "wichtig";
          return (
            <div key={d.code} data-baum-diagnose={d.code} style={{ ...KARTE, padding: "10px 14px" }}>
              <div className="flex items-center" style={{ gap: 8 }}>
                <FaltKnopf zu={dZu} onToggle={() => toggle(dKey)} label={`Diagnose ${d.code} auf- oder zuklappen`} />
                <span style={{ fontSize: "var(--text-meta)", fontVariantNumeric: "tabular-nums", color: "var(--brand-primary)", fontWeight: "var(--weight-medium)" }}>{d.code}</span>
                <span className="flex-1 min-w-0 truncate" style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>{d.titel}</span>
                {/* Die Priorität: eine fachliche Aussage der Fachperson —
                    wichtig zuerst, keine Berechnung (Lauf 6d). */}
                <button type="button" data-prioritaet={d.code} aria-pressed={wichtig}
                  onClick={() => diagnosePriorisieren(d.code, wichtig ? "normal" : "wichtig")}
                  title={wichtig ? "Als normal einstufen" : "Als wichtig einstufen"}
                  className="ui-fokusring cursor-pointer shrink-0"
                  style={{
                    padding: "2px 10px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-micro)", fontWeight: 500,
                    background: wichtig ? "var(--brand-primary)" : "var(--bg-elevated)",
                    color: wichtig ? "var(--text-on-dark)" : "var(--text-tertiary)",
                    border: wichtig ? "var(--border-thin) solid transparent" : "var(--border-thin) solid var(--border-default)",
                  }}>
                  wichtig
                </button>
                <TypMarke typ={d.typ} />
                <button type="button" aria-label={`Diagnose ${d.titel} entfernen`}
                    onClick={() => diagnoseEntfernen(d.code)}
                    className="ui-fokusring cursor-pointer flex items-center justify-center shrink-0"
                    style={{ width: 24, height: 24, borderRadius: "var(--radius-pill)", background: "none", border: "var(--border-thin) solid var(--border-default)", color: "var(--text-tertiary)" }}>
                    <X style={{ width: 12, height: 12 }} />
                  </button>
              </div>

              {dZu ? (
                <div style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)", padding: "2px 0 0 32px" }}>
                  {d.code} · {ziele.length} {ziele.length === 1 ? "Ziel" : "Ziele"} · {mAnzahl} {mAnzahl === 1 ? "Massnahme" : "Massnahmen"}
                </div>
              ) : (
                <>
                  {/* Belegzeile: bleibt am Element hängen, eingeklappt. */}
                  <div style={{ padding: "2px 0 0 32px" }}>
                    <button type="button" onClick={() => setBelegOffen(prev => { const n = new Set(prev); if (n.has(d.code)) n.delete(d.code); else n.add(d.code); return n; })}
                      className="ui-fokusring cursor-pointer"
                      style={{ background: "none", border: "none", padding: 0, fontFamily: "inherit", fontSize: "var(--text-micro)", color: "var(--text-tertiary)", textDecoration: "underline" }}>
                      {belegOffen.has(d.code) ? "Beleg ausblenden" : "Beleg anzeigen"}
                    </button>
                    {belegOffen.has(d.code) && (
                      <div style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", marginTop: 2 }}>{d.belegZeile}</div>
                    )}
                  </div>

                  <div style={{ marginTop: 6, marginLeft: 24, display: "flex", flexDirection: "column", gap: 6 }}>
                    {ziele.length === 0 && (
                      <div style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)", paddingLeft: 8 }}>
                        Noch kein Ziel
                      </div>
                    )}
                    {ziele.map(z => {
                      const zKey = `z:${z.diagnoseCode}|${z.zielId}`;
                      const zZu = zugeklappt.has(zKey);
                      const massnahmen = massnahmenVon(z.diagnoseCode, z.zielId);
                      return (
                        <div key={z.zielId} data-baum-ziel={`${z.diagnoseCode}|${z.zielId}`} style={{ background: "var(--bg-secondary)", borderRadius: "var(--radius-card)", padding: "7px 12px" }}>
                          <div className="flex items-center" style={{ gap: 8 }}>
                            <FaltKnopf zu={zZu} onToggle={() => toggle(zKey)} label={`Ziel ${z.titel} auf- oder zuklappen`} />
                            <span className="flex-1 min-w-0 truncate" style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>
                              {z.titel}{z.eigenes && <span style={{ fontWeight: "var(--weight-regular)", color: "var(--text-tertiary)" }}> · selbst formuliert</span>}
                            </span>
                            <button type="button"
                              onClick={() => onFokus({ schritt: 3, diagnoseCode: z.diagnoseCode, zielId: z.zielId, zielTitel: z.titel })}
                              className="ui-fokusring cursor-pointer shrink-0"
                              style={{ background: "none", border: "none", padding: 0, fontFamily: "inherit", fontSize: "var(--text-micro)", fontWeight: 500, color: "var(--brand-primary)" }}>
                              Massnahmen wählen
                            </button>
                          </div>
                          {zZu ? (
                            <div style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", padding: "1px 0 0 32px" }}>
                              {massnahmen.length} {massnahmen.length === 1 ? "Massnahme" : "Massnahmen"}
                            </div>
                          ) : (
                            <div>
                              {massnahmen.map(m => (
                                <MassnahmenZeile key={m.interventionId} m={m} diagnoseCode={z.diagnoseCode} zielId={z.zielId} zielTitelVon={zielTitelVon} mandate={mandate} onFokus={onFokus} />
                              ))}
                              {massnahmen.length === 0 && (
                                <div style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", padding: "4px 0 2px 30px" }}>
                                  Noch keine Massnahme.
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Ohne Zuordnung — Arbeitszustand, kein Fehler. */}
      {freieZiele.length > 0 && (
        <div style={{ ...KARTE, padding: "10px 14px", marginTop: 14, borderStyle: "dashed" }}>
          <div style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>
            Ziele ohne Diagnose
          </div>
          {freieZiele.map(z => (
            <div key={z.zielId} data-baum-ziel-frei={z.zielId} style={{ padding: "6px 0", borderTop: "var(--border-thin) solid var(--border-default)", fontSize: "var(--text-small)", color: "var(--text-primary)" }}>
              {z.titel}
            </div>
          ))}
        </div>
      )}
      {ohneZuordnung.length > 0 && (
        <div style={{ ...KARTE, padding: "10px 14px", marginTop: 14, borderStyle: "dashed" }}>
          <div style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>
            Ohne Zuordnung
          </div>
          <div style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)", marginTop: 1 }}>
            Massnahmen ohne Zielbezug
          </div>
          {ohneZuordnung.map(m => (
            <MassnahmenZeile key={m.interventionId} m={m} diagnoseCode={null} zielId={null} zielTitelVon={zielTitelVon} mandate={mandate} onFokus={onFokus} />
          ))}
        </div>
      )}
    </div>
  );
}
