/**
 * Das WZW-Prüfungs-Panel (Lauf 6) — Slide-over von rechts, erreichbar aus
 * allen drei Ansichten (Repo-Konvention: Slide-over für Kontext-Aktionen,
 * kein Modal).
 *
 * Die Prüfung meldet, sie blockiert nicht: jeder Befund wird aufgelöst
 * (der Verweis führt zum Element) oder mit Begründung übergangen. Der
 * Zähler offener Befunde rechnet live — eine zurückgenommene Übergehung
 * erhöht ihn sofort, ohne Neuprüfung.
 *
 * KEINE KONFORMITÄTSAUSSAGE: das Panel sagt, was vollständig und
 * widerspruchsfrei ist — nie, dass ein Versicherer den Plan akzeptiert.
 */
import { useEffect, useState } from "react";
import { ArrowRight, ChevronDown, RefreshCw, X } from "lucide-react";
import {
  usePlan, befundUebergehen, uebergehungZuruecknehmen,
  pruefungAktuell, offeneBefunde, type PruefBefund,
} from "../../../lib/pflegeplan/plan-store";
import { KRITERIUM_LABEL, PRUEFUNG_GRUPPE, type PruefKriterium } from "../../../lib/pflegeplan/wzw";
import { datumAnzeige } from "./gemeinsam";

const KRITERIEN: PruefKriterium[] = ["wirksamkeit", "zweckmaessigkeit", "wirtschaftlichkeit"];

const ELEMENT_ART: Record<PruefBefund["element"]["art"], string> = {
  diagnose: "Diagnose", ziel: "Ziel", massnahme: "Massnahme",
};

function BefundKarte({ b, autorin, datumIso, onNavigiere }: {
  b: PruefBefund;
  autorin: string;
  datumIso: string;
  onNavigiere: (b: PruefBefund) => void;
}) {
  const [uebergehenOffen, setUebergehenOffen] = useState(false);
  const [begruendung, setBegruendung] = useState("");
  const uebergangen = b.uebergehung !== null;

  return (
    <div data-befund={b.id} style={{
      padding: "9px 12px", marginBottom: 8, borderRadius: "var(--radius-card)",
      background: uebergangen ? "var(--bg-secondary)" : "var(--bg-elevated)",
      border: "var(--border-thin) solid var(--border-default)",
    }}>
      <div style={{
        fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)",
        color: uebergangen ? "var(--text-tertiary)" : "var(--text-primary)",
        textDecoration: uebergangen ? "line-through" : "none",
      }}>
        {b.titel}
      </div>
      {!uebergangen && (
        <div style={{ fontSize: "var(--text-micro)", color: "var(--text-secondary)", marginTop: 2, lineHeight: 1.5 }}>
          {b.detail}
        </div>
      )}

      {uebergangen ? (
        <div style={{ marginTop: 6 }}>
          <div style={{ fontSize: "var(--text-micro)", color: "var(--text-secondary)", lineHeight: 1.5 }}>
            Übergangen: {b.uebergehung!.text}
          </div>
          <div className="flex items-center" style={{ gap: 8, marginTop: 3 }}>
            <span style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>
              {b.uebergehung!.autorin} · {datumAnzeige(b.uebergehung!.datum)}
            </span>
            <button type="button" onClick={() => uebergehungZuruecknehmen(b.id)}
              className="ui-fokusring cursor-pointer"
              style={{ background: "none", border: "none", padding: 0, fontSize: "var(--text-micro)", fontWeight: 500, color: "var(--brand-primary)", fontFamily: "inherit" }}>
              Zurücknehmen
            </button>
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 7 }}>
          <div className="flex items-center flex-wrap" style={{ gap: 10 }}>
            <button type="button" onClick={() => onNavigiere(b)}
              className="ui-fokusring cursor-pointer inline-flex items-center"
              style={{ gap: 4, background: "none", border: "none", padding: 0, fontSize: "var(--text-micro)", fontWeight: 500, color: "var(--brand-primary)", fontFamily: "inherit" }}>
              Zum Element: {ELEMENT_ART[b.element.art]} «{b.element.titel}» <ArrowRight style={{ width: 11, height: 11 }} />
            </button>
            <button type="button" onClick={() => setUebergehenOffen(o => !o)}
              className="ui-fokusring cursor-pointer"
              style={{ background: "none", border: "none", padding: 0, fontSize: "var(--text-micro)", fontWeight: 500, color: "var(--text-secondary)", fontFamily: "inherit" }}>
              {uebergehenOffen ? "Doch nicht übergehen" : "Mit Begründung übergehen"}
            </button>
          </div>
          {uebergehenOffen && (
            <div style={{ marginTop: 6 }}>
              <textarea value={begruendung} onChange={e => setBegruendung(e.target.value)}
                placeholder="Warum bleibt dieser Befund fachlich gewollt bestehen?"
                rows={2} aria-label={`Begründung für ${b.titel}`}
                style={{
                  width: "100%", padding: "7px 10px", borderRadius: "var(--radius-card)",
                  border: "var(--border-thin) solid var(--border-default)", background: "var(--bg-primary)",
                  fontSize: "var(--text-small)", color: "var(--text-primary)", fontFamily: "inherit",
                  resize: "vertical", outline: "none",
                }} />
              <button type="button" disabled={begruendung.trim() === ""}
                onClick={() => {
                  befundUebergehen(b.id, { text: begruendung.trim(), autorin, datum: datumIso });
                  setUebergehenOffen(false);
                  setBegruendung("");
                }}
                className="ui-fokusring cursor-pointer"
                style={{
                  marginTop: 5, padding: "4px 14px", borderRadius: "var(--radius-pill)",
                  background: begruendung.trim() ? "var(--brand-primary)" : "var(--bg-secondary)",
                  color: begruendung.trim() ? "var(--text-on-dark)" : "var(--text-tertiary)",
                  border: "none", fontSize: "var(--text-micro)", fontWeight: 500,
                  cursor: begruendung.trim() ? "pointer" : "default",
                }}>
                Übergehen
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Ein Bündel gleichartiger Befunde (Lauf 6b): acht Massnahmen ohne Position
 * sind EIN Problem, nicht acht. Zugeklappt eine Zeile, aufgeklappt die
 * Einzelnen mit ihrem Verweis — plus Sammelübergehung: keine Abkürzung um
 * die Begründungspflicht, sondern dieselbe Dokumentation an jedem Befund,
 * nur einmal geschrieben.
 */
function GruppenKarte({ code, befunde, autorin, datumIso, onNavigiere }: {
  code: string;
  befunde: PruefBefund[];
  autorin: string;
  datumIso: string;
  onNavigiere: (b: PruefBefund) => void;
}) {
  const [offen, setOffen] = useState(false);
  const [uebergehenOffen, setUebergehenOffen] = useState(false);
  const [begruendung, setBegruendung] = useState("");
  const offene = befunde.filter(b => b.uebergehung === null);
  const label = PRUEFUNG_GRUPPE[code] ?? code;

  return (
    <div data-befund-buendel={code} style={{
      marginBottom: 8, borderRadius: "var(--radius-card)",
      border: "var(--border-thin) solid var(--border-default)", background: "var(--bg-elevated)",
    }}>
      <button type="button" onClick={() => setOffen(o => !o)} aria-expanded={offen}
        className="ui-fokusring cursor-pointer w-full flex items-center text-left"
        style={{ gap: 8, padding: "9px 12px", background: "none", border: "none", fontFamily: "inherit" }}>
        <span className="flex-1" style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: offene.length > 0 ? "var(--text-primary)" : "var(--text-tertiary)" }}>
          {befunde.length} {label}
        </span>
        <span style={{ fontSize: "var(--text-micro)", fontVariantNumeric: "tabular-nums", color: offene.length > 0 ? "var(--status-warning-text)" : "var(--text-tertiary)" }}>
          {offene.length} offen
        </span>
        <ChevronDown style={{ width: 13, height: 13, color: "var(--text-tertiary)", transform: offen ? "rotate(180deg)" : "none", transition: "transform 0.15s", flexShrink: 0 }} />
      </button>

      {offen && (
        <div style={{ padding: "0 12px 10px" }}>
          {/* Sammelübergehung: eine Begründung, an jedem Befund dieselbe Kennung. */}
          {offene.length > 1 && (
            <div data-sammel-uebergehen style={{ marginBottom: 8 }}>
              <button type="button" onClick={() => setUebergehenOffen(o => !o)}
                className="ui-fokusring cursor-pointer"
                style={{ background: "none", border: "none", padding: 0, fontSize: "var(--text-micro)", fontWeight: 500, color: "var(--text-secondary)", fontFamily: "inherit" }}>
                {uebergehenOffen ? "Doch nicht übergehen" : `Alle ${offene.length} offenen mit einer Begründung übergehen`}
              </button>
              {uebergehenOffen && (
                <div style={{ marginTop: 6 }}>
                  <textarea value={begruendung} onChange={e => setBegruendung(e.target.value)}
                    placeholder="Warum bleiben diese Befunde fachlich gewollt bestehen?"
                    rows={2} aria-label={`Begründung für alle offenen: ${label}`}
                    style={{
                      width: "100%", padding: "7px 10px", borderRadius: "var(--radius-card)",
                      border: "var(--border-thin) solid var(--border-default)", background: "var(--bg-primary)",
                      fontSize: "var(--text-small)", color: "var(--text-primary)", fontFamily: "inherit",
                      resize: "vertical", outline: "none",
                    }} />
                  <button type="button" disabled={begruendung.trim() === ""}
                    onClick={() => {
                      const u = { text: begruendung.trim(), autorin, datum: datumIso };
                      for (const b of offene) befundUebergehen(b.id, u);
                      setUebergehenOffen(false);
                      setBegruendung("");
                    }}
                    className="ui-fokusring cursor-pointer"
                    style={{
                      marginTop: 5, padding: "4px 14px", borderRadius: "var(--radius-pill)",
                      background: begruendung.trim() ? "var(--brand-primary)" : "var(--bg-secondary)",
                      color: begruendung.trim() ? "var(--text-on-dark)" : "var(--text-tertiary)",
                      border: "none", fontSize: "var(--text-micro)", fontWeight: 500,
                      cursor: begruendung.trim() ? "pointer" : "default",
                    }}>
                    Alle übergehen
                  </button>
                </div>
              )}
            </div>
          )}

          {befunde.map(b => (
            <BefundKarte key={b.id} b={b} autorin={autorin} datumIso={datumIso} onNavigiere={onNavigiere} />
          ))}
        </div>
      )}
    </div>
  );
}

export function PruefungsPanel({ hinweis, autorin, datumIso, onNavigiere, onErneutPruefen, onSchliessen }: {
  /** Kontext des Veröffentlichen-Umwegs — null beim freiwilligen Öffnen. */
  hinweis: string | null;
  autorin: string;
  datumIso: string;
  onNavigiere: (b: PruefBefund) => void;
  onErneutPruefen: () => void;
  onSchliessen: () => void;
}) {
  const plan = usePlan();
  const pruefung = plan.pruefung;
  const aktuell = pruefungAktuell(plan);
  const offene = offeneBefunde(plan).length;

  useEffect(() => {
    const taste = (e: KeyboardEvent) => { if (e.key === "Escape") onSchliessen(); };
    window.addEventListener("keydown", taste);
    return () => window.removeEventListener("keydown", taste);
  }, [onSchliessen]);

  if (!pruefung) return null;

  return (
    <>
      {/* Abdunkelung — Klick schliesst, wie beim Slide-over üblich. */}
      <div onClick={onSchliessen} aria-hidden
        style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 26, 0.28)", zIndex: 40 }} />
      <aside data-wzw-panel role="dialog" aria-label="WZW-Prüfung"
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0, width: 460, maxWidth: "94vw", zIndex: 41,
          background: "var(--bg-primary)", borderLeft: "var(--border-thin) solid var(--border-default)",
          boxShadow: "-8px 0 28px rgba(15, 23, 26, 0.12)", display: "flex", flexDirection: "column",
        }}>
        {/* Kopf */}
        <div style={{ padding: "14px 18px 10px", borderBottom: "var(--border-thin) solid var(--border-default)", background: "var(--bg-elevated)" }}>
          <div className="flex items-center" style={{ gap: 8 }}>
            <div className="flex-1" style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>
              WZW-Prüfung
            </div>
            {!aktuell && (
              <button type="button" onClick={onErneutPruefen} data-erneut-pruefen
                className="ui-fokusring cursor-pointer inline-flex items-center"
                style={{ gap: 5, padding: "4px 12px", borderRadius: "var(--radius-pill)", background: "var(--brand-primary)", color: "var(--text-on-dark)", border: "none", fontSize: "var(--text-micro)", fontWeight: 500 }}>
                <RefreshCw style={{ width: 11, height: 11 }} /> Erneut prüfen
              </button>
            )}
            <button type="button" onClick={onSchliessen} aria-label="Prüfung schliessen"
              className="ui-fokusring cursor-pointer"
              style={{ background: "none", border: "none", padding: 4, color: "var(--text-tertiary)", display: "flex" }}>
              <X style={{ width: 15, height: 15 }} />
            </button>
          </div>
          <div style={{ fontSize: "var(--text-micro)", marginTop: 2, color: aktuell ? (offene === 0 ? "var(--status-success-text)" : "var(--text-secondary)") : "var(--status-warning-text)" }}>
            {aktuell
              ? `Geprüft am ${datumAnzeige(pruefung.datum)} · ${offene} offene ${offene === 1 ? "Befund" : "Befunde"}`
              : "Prüfung nicht mehr aktuell — Plan wurde seither geändert"}
          </div>
          {hinweis && (
            <div data-pruefung-hinweis style={{
              marginTop: 8, padding: "7px 10px", borderRadius: "var(--radius-card)",
              background: "var(--status-warning-bg)", color: "var(--status-warning-text)",
              fontSize: "var(--text-micro)", lineHeight: 1.5,
            }}>
              {hinweis}
            </div>
          )}
        </div>

        {/* Befunde je Kriterium */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 18px" }}>
          {pruefung.befunde.length === 0 && (
            <div style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", padding: "8px 0" }}>
              Keine Befunde — die Prüfung hat nichts gefunden.
            </div>
          )}
          {KRITERIEN.map(k => {
            const gruppe = pruefung.befunde.filter(b => b.kriterium === k);
            const offen = gruppe.filter(b => b.uebergehung === null).length;
            /* Gleichartige Befunde bündeln (Lauf 6b) — der Zähler oben bleibt
               ehrlich die Zahl der EINZELBEFUNDE, nicht der Bündel. */
            const buendel: { code: string; befunde: PruefBefund[] }[] = [];
            for (const b of gruppe) {
              const eintrag = buendel.find(x => x.code === b.pruefCode);
              if (eintrag) eintrag.befunde.push(b);
              else buendel.push({ code: b.pruefCode, befunde: [b] });
            }
            return (
              <section key={k} data-befund-gruppe={k} style={{ marginBottom: 16 }}>
                <div className="flex items-baseline" style={{ gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: "var(--text-micro)", fontWeight: 500, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {KRITERIUM_LABEL[k].titel}
                  </span>
                  <span style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>
                    {KRITERIUM_LABEL[k].frage}
                  </span>
                  <span data-gruppe-zaehler style={{ marginLeft: "auto", fontSize: "var(--text-micro)", fontVariantNumeric: "tabular-nums", color: offen > 0 ? "var(--status-warning-text)" : "var(--text-tertiary)" }}>
                    {gruppe.length === 0 ? "0" : `${offen} offen von ${gruppe.length}`}
                  </span>
                </div>
                {gruppe.length === 0 ? (
                  <div style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", padding: "2px 0 4px" }}>
                    Keine Befunde in dieser Gruppe.
                  </div>
                ) : buendel.map(bd => bd.befunde.length === 1 ? (
                  <BefundKarte key={bd.befunde[0].id} b={bd.befunde[0]} autorin={autorin} datumIso={datumIso} onNavigiere={onNavigiere} />
                ) : (
                  <GruppenKarte key={bd.code} code={bd.code} befunde={bd.befunde}
                    autorin={autorin} datumIso={datumIso} onNavigiere={onNavigiere} />
                ))}
              </section>
            );
          })}
        </div>

        {/* Fusszeile: die ehrliche Grenze der Prüfung. */}
        <div style={{ padding: "10px 18px", borderTop: "var(--border-thin) solid var(--border-default)", fontSize: "var(--text-micro)", color: "var(--text-tertiary)", lineHeight: 1.5 }}>
          Geprüft wird, ob der Plan vollständig und in sich widerspruchsfrei
          ist. Ob ein Versicherer ihn akzeptiert, kann diese Prüfung nicht
          zusichern. Begründungen übergangener Befunde wandern ins
          Leistungsplanungsblatt.
        </div>
      </aside>
    </>
  );
}
