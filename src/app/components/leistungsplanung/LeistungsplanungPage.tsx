/**
 * Leistungsplanung (Lauf 7, Teil 1) — die Seite, auf der das
 * Leistungsplanungsblatt finalisiert wird. Vollbildroute mit Rücksprung
 * in den Klientenakten-Tab (Muster: BlattAnsicht).
 *
 * Verbindliche Referenz für Dichte, Zustände und Interaktionen:
 * docs/leistungsplanung-v7.html. Dichteprinzip: sichtbar bleibt, was jede
 * Zeile hat und was sich zwischen Zeilen unterscheidet; alles Übrige liegt
 * im Detailaufklapper und erscheint oben nur als Abweichungsetikett.
 * Abweichungsband (F), Abgleich (G) und Zustandsmaschine (H) folgen in
 * Teil 2, Meldung/Prüfseite/Rollen (I/J/K) in Teil 3.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { ChevronLeft } from "lucide-react";
import { getPatient } from "../../../lib/patienten/store";
import { useMandate } from "../../../lib/mandate/store";
import { GESETZESGRUNDLAGE } from "../../../lib/stammdaten/mandat";
import { leistungsKatalog } from "../../../lib/pflegeplan/mock-adapter";
import {
  blattSummen, klvTotal, runde0, runde1, stundenMinuten, KEIN_ABZUG,
  type Leistungsart, type Einheit,
} from "../../../lib/leistungsplanung/rechenkern";
import type { LpbPosition, Einsatzblock, Ausfuehrung, Erbringer } from "../../../lib/leistungsplanung/uebernahme";
import {
  useLpbBlatt, periodenEnde, schnellwahlSetzen, startSetzen, endeSetzen,
  kopfSetzen, abzugSetzen, positionSetzen, positionEinfuegen, positionEntfernen,
  rueckgaengig, undoTiefe, type LpbBlatt, type AbklaerungsTyp,
} from "../../../lib/leistungsplanung/lpb-store";

const ART_LABEL: Record<Leistungsart, string> = {
  a: "KLV a · Abklärung, Beratung, Koordination",
  b: "KLV b · Untersuchung und Behandlung",
  c: "KLV c · Grundpflege",
  n: "Nicht-KLV",
};
const EINHEITEN: Einheit[] = ["t7", "t6", "t5", "t4", "t3", "t2", "w", "m", "e"];
const BLOCK_LABEL: Record<Einsatzblock, string> = { "": "—", morgen: "Morgen", mittag: "Mittag", abend: "Abend", einzeln: "eigener Einsatz" };
const AUSF_LABEL: Record<Exclude<Ausfuehrung, "">, string> = { ang: "Angehörige", fach: "Fachperson", hw: "Hauswirtschaft" };
const AUSF_KURZ: Record<Exclude<Ausfuehrung, "">, string> = { ang: "Angeh.", fach: "Fachp.", hw: "HW" };
const W_LABEL: Record<Erbringer, string> = { S: "Spitex", I: "Informelles Netz", A: "Anderer Anbieter", V: "Verweigert" };
const ABKL_LABEL: Record<AbklaerungsTyp, string> = { ohne: "Ohne Abklärung", erst: "Erstabklärung", neu: "Neuabklärung" };
const HERK_LABEL: Record<string, string> = { hauswirtschaft: "Hauswirtschaftsabklärung", prozess: "Abklärungsvorgang", manuell: "hier eingefügt" };

const zelleStil: React.CSSProperties = { padding: "0 6px", height: 29, borderBottom: "1px solid var(--border-default)", fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
const kopfZelle: React.CSSProperties = { fontSize: 11, fontWeight: 400, color: "var(--text-secondary)", textAlign: "left", padding: "3px 6px", borderBottom: "1px solid var(--border-default)", whiteSpace: "nowrap" };
const rechts: React.CSSProperties = { textAlign: "right" };
const mono: React.CSSProperties = { fontVariantNumeric: "tabular-nums" };

function Marke({ art, children, onClick }: { art: "ok" | "warn" | "err" | "info" | "grau"; children: React.ReactNode; onClick?: () => void }) {
  const farben: Record<string, { bg: string; fg: string }> = {
    ok: { bg: "var(--status-success-bg)", fg: "var(--status-success-text)" },
    warn: { bg: "var(--status-warning-bg)", fg: "var(--status-warning-text)" },
    err: { bg: "var(--status-danger-bg)", fg: "var(--status-danger-text)" },
    info: { bg: "var(--status-info-bg)", fg: "var(--status-info)" },
    grau: { bg: "var(--bg-secondary)", fg: "var(--text-secondary)" },
  };
  const f = farben[art];
  const stil: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 3, padding: "0 5px", borderRadius: 3, fontSize: 11, fontWeight: 500, whiteSpace: "nowrap", lineHeight: "16px", background: f.bg, color: f.fg, border: "none", fontFamily: "inherit" };
  return onClick
    ? <button type="button" onClick={onClick} className="ui-fokusring cursor-pointer" style={stil}>{children}</button>
    : <span style={stil}>{children}</span>;
}

function Knopf({ label, primaer, klein, disabled, onClick }: { label: string; primaer?: boolean; klein?: boolean; disabled?: boolean; onClick?: () => void }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick}
      className={disabled ? "" : "ui-fokusring cursor-pointer"}
      style={{
        display: "inline-flex", alignItems: "center", gap: 5, whiteSpace: "nowrap", fontFamily: "inherit",
        padding: klein ? "1px 6px" : "4px 9px", borderRadius: 3, fontSize: klein ? 11 : 12, fontWeight: 500,
        background: primaer ? "var(--brand-primary)" : "var(--bg-elevated)",
        color: primaer ? "var(--text-on-dark)" : "var(--text-primary)",
        border: primaer ? "1px solid transparent" : "1px solid var(--border-default)",
        opacity: disabled ? 0.35 : 1, cursor: disabled ? "not-allowed" : undefined,
      }}>
      {label}
    </button>
  );
}

/* ── Dialog-Gerüst ─────────────────────────────────────────────────────── */
function Dialog({ titel, breit, onZu, kinder, fuss }: { titel: string; breit?: boolean; onZu: () => void; kinder: React.ReactNode; fuss: React.ReactNode }) {
  return (
    <div role="dialog" aria-label={titel} data-lpb-dialog
      onClick={e => { if (e.target === e.currentTarget) onZu(); }}
      style={{ position: "fixed", inset: 0, background: "rgba(19,17,15,.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 60 }}>
      <div style={{ background: "var(--bg-elevated)", borderRadius: 5, maxWidth: breit ? 760 : 460, width: "100%", maxHeight: "86vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <header style={{ padding: "11px 15px", borderBottom: "1px solid var(--border-default)", fontSize: 14, fontWeight: 600 }}>{titel}</header>
        <div style={{ padding: "13px 15px", overflow: "auto", flex: 1 }}>{kinder}</div>
        <footer style={{ padding: "9px 15px", borderTop: "1px solid var(--border-default)", display: "flex", justifyContent: "flex-end", gap: 8 }}>{fuss}</footer>
      </div>
    </div>
  );
}

const feldStil: React.CSSProperties = { border: "1px solid var(--border-default)", borderRadius: 3, padding: "5px 7px", fontSize: 12, background: "var(--bg-elevated)", width: "100%", fontFamily: "inherit", color: "var(--text-primary)" };

function Feld({ label, kinder }: { label: string; kinder: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 10 }}>
      <label style={{ fontSize: 11, color: "var(--text-secondary)" }}>{label}</label>
      {kinder}
    </div>
  );
}

type DialogArt =
  | { art: "kopf" }
  | { art: "einfuegen" }
  | { art: "grund"; id: string }
  | { art: "verweigert"; id: string }
  | { art: "begruendung"; id: string }
  | { art: "abzug" }
  | null;

/* ══════════════════════════════════════════ */
export function LeistungsplanungPage() {
  const { patientId = "" } = useParams();
  const navigate = useNavigate();
  const [suchParams] = useSearchParams();
  const blatt = useLpbBlatt(patientId);
  const patient = getPatient(patientId);
  const alleMandate = useMandate();

  const [offen, setOffen] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogArt>(null);

  const zurueck = suchParams.get("returnTo") ?? `/patienten/${patientId}/leistungen/leistungsplanung`;
  const mandatLabel = useMemo(() => {
    const m = alleMandate.find(x => x.patientId === patientId && !x.ende);
    return m ? (GESETZESGRUNDLAGE.find(g => g.code === m.gesetzesgrundlage)?.label ?? m.gesetzesgrundlage) : "—";
  }, [alleMandate, patientId]);

  const summen = useMemo(
    () => blattSummen(blatt.positionen, blatt.monate, blatt.abzug),
    [blatt.positionen, blatt.monate, blatt.abzug]);
  const total = klvTotal(summen);
  const quartalStunden = total.quartalMin / 60;

  /* C14: Einsatzblöcke mit mindestens zwei laufenden S-Positionen. */
  const bloecke = useMemo(() => {
    const je = new Map<string, LpbPosition[]>();
    for (const p of blatt.positionen) {
      if (p.w !== "S" || !p.block || p.block === "einzeln" || p.einheit === "e" || p.einheit === "m") continue;
      je.set(p.block, [...(je.get(p.block) ?? []), p]);
    }
    for (const [k, v] of je) if (v.length < 2) je.delete(k);
    return je;
  }, [blatt.positionen]);

  /* K3: Schrägstrich öffnet das Einfügen, Escape schliesst, Cmd/Ctrl+Z. */
  useEffect(() => {
    const taste = (e: KeyboardEvent) => {
      const ziel = document.activeElement;
      const inFeld = ziel instanceof HTMLElement && (ziel.tagName === "INPUT" || ziel.tagName === "TEXTAREA" || ziel.tagName === "SELECT");
      if (e.key === "Escape") setDialog(null);
      if (e.key === "/" && !inFeld) { e.preventDefault(); setDialog({ art: "einfuegen" }); }
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !inFeld) { e.preventDefault(); rueckgaengig(patientId); }
    };
    window.addEventListener("keydown", taste);
    return () => window.removeEventListener("keydown", taste);
  }, [patientId]);

  if (!patient) {
    return <div style={{ padding: "var(--space-8)", fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>Kein Klient unter dieser Kennung.</div>;
  }

  const einfuegenBestaetigt = (nummer: string) => {
    const neu = positionEinfuegen(patientId, nummer);
    setOffen(neu.id);
    setDialog({ art: "grund", id: neu.id });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", minHeight: 0, background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      {/* ── Klientenkopf ── */}
      <div data-lpb-klientenkopf className="flex items-center" style={{ gap: 10, padding: "0 14px", height: 40, flexShrink: 0, background: "var(--bg-elevated)", borderBottom: "1px solid var(--border-default)" }}>
        <button type="button" onClick={() => navigate(zurueck)} className="ui-fokusring cursor-pointer inline-flex items-center"
          style={{ gap: 3, background: "none", border: "none", padding: 0, fontFamily: "inherit", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)" }}>
          <ChevronLeft style={{ width: 14, height: 14 }} /> Klientenakte
        </button>
        <span style={{ fontSize: 14, fontWeight: 600 }}>{patient.nachname}, {patient.vorname}</span>
        <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
          Fall <span style={mono}>{patient.id}</span> · {mandatLabel} · Leistungsplanung
        </span>
      </div>

      {/* ── Blattkopf (B1) ── */}
      <div data-lpb-blattkopf className="flex items-center" style={{ gap: 10, padding: "5px 14px", flexShrink: 0, background: "var(--bg-elevated)", borderBottom: "1px solid var(--border-default)" }}>
        <span data-lpb-status className="flex items-center" style={{ gap: 6, fontSize: 12, fontWeight: 600 }}>
          <span aria-hidden style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--text-tertiary)", flexShrink: 0 }} />
          LPB v{blatt.version} · Entwurf
        </span>
        <input type="date" value={blatt.start} onChange={e => startSetzen(patientId, e.target.value)}
          aria-label="Startdatum" style={{ border: "1px solid var(--border-default)", borderRadius: 3, padding: "2px 5px", fontSize: 12, background: "var(--bg-elevated)", fontFamily: "inherit", color: "var(--text-primary)" }} />
        <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>bis</span>
        <input type="date" value={periodenEnde(blatt)} onChange={e => endeSetzen(patientId, e.target.value)}
          aria-label="Enddatum" style={{ border: "1px solid var(--border-default)", borderRadius: 3, padding: "2px 5px", fontSize: 12, background: "var(--bg-elevated)", fontFamily: "inherit", color: "var(--text-primary)" }} />
        <span data-lpb-schnellwahl className="inline-flex" style={{ border: "1px solid var(--border-default)", borderRadius: 3, overflow: "hidden" }}>
          {([1, 3, 6, 9] as const).map((m, i) => (
            <button key={m} type="button" aria-pressed={blatt.schnellwahl && blatt.monate === m}
              onClick={() => schnellwahlSetzen(patientId, m)}
              className="ui-fokusring cursor-pointer"
              style={{
                padding: "2px 7px", fontSize: 11, fontFamily: "inherit", border: "none",
                borderRight: i < 3 ? "1px solid var(--border-default)" : "none",
                background: blatt.schnellwahl && blatt.monate === m ? "var(--brand-primary)" : "var(--bg-elevated)",
                color: blatt.schnellwahl && blatt.monate === m ? "var(--text-on-dark)" : "var(--text-primary)",
              }}>
              {m}
            </button>
          ))}
        </span>
        {!blatt.schnellwahl && <span data-lpb-monate style={{ ...mono, fontSize: 11, color: "var(--text-secondary)" }}>{blatt.monate} Mt.</span>}
        {blatt.monate > 9 && <Marke art="err">über 9 Monate</Marke>}
        <Knopf klein label="Kopfdaten" onClick={() => setDialog({ art: "kopf" })} />
        <Knopf klein label="+ Position" onClick={() => setDialog({ art: "einfuegen" })} />
        <span style={{ flex: 1 }} />
        <span data-lpb-save style={{ fontSize: 11, color: "var(--text-secondary)" }}>
          {blatt.savedAt}
          {undoTiefe(patientId) > 0 && (
            <>
              {" · "}
              <button type="button" onClick={() => rueckgaengig(patientId)} className="ui-fokusring cursor-pointer"
                style={{ background: "none", border: "none", padding: 0, fontFamily: "inherit", fontSize: 11, textDecoration: "underline", color: "var(--text-secondary)" }}>
                Rückgängig
              </button>
            </>
          )}
        </span>
        <Knopf primaer label="Prüfen und freigeben" disabled />
      </div>

      {/* ── Tabelle (C) ── */}
      <div data-lpb-tabelle style={{ flex: 1, overflowY: "auto", minHeight: 0, background: "var(--bg-elevated)" }}>
        {(["a", "b", "c", "n"] as Leistungsart[]).map(art => {
          const alle = blatt.positionen.filter(p => p.leistungsart === art);
          const laufend = alle.filter(p => !p.retro);
          const retro = alle.filter(p => p.retro);
          return (
            <div key={art} data-lpb-gruppe={art}>
              {/* C1: Gruppenüberschrift — Bezeichnung und Minuten, keine Aktionen. */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 14px", background: "var(--bg-secondary)", borderTop: "1px solid var(--border-default)", borderBottom: "1px solid var(--border-default)", position: "sticky", top: 0, zIndex: 3, fontSize: 12 }}>
                <span style={{ fontWeight: 600 }}>{ART_LABEL[art]}</span>
                <span style={{ ...mono, fontSize: 11, color: "var(--text-secondary)" }}>
                  {runde0(summen[art].monatNetto).toLocaleString("de-CH")} Min./Mt.{summen[art].einmalig > 0 ? ` · ${runde0(summen[art].einmalig)} einm.` : ""}
                </span>
              </div>
              {alle.length === 0 ? (
                <div style={{ padding: "8px 14px", color: "var(--text-secondary)", fontSize: 12 }}>Keine Position.</div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                  <colgroup>
                    <col style={{ width: 26 }} /><col style={{ width: 52 }} /><col />
                    <col style={{ width: 90 }} /><col style={{ width: 58 }} /><col style={{ width: 52 }} />
                    <col style={{ width: 82 }} /><col style={{ width: 72 }} /><col style={{ width: 190 }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th style={{ ...kopfZelle, paddingLeft: 14 }}></th>
                      <th style={kopfZelle}>Nr.</th>
                      <th style={kopfZelle}>Leistung</th>
                      <th style={{ ...kopfZelle, ...rechts }}>Häufigkeit</th>
                      <th style={{ ...kopfZelle, ...rechts }}>Zeit</th>
                      <th style={{ ...kopfZelle, ...rechts }}>Δ</th>
                      <th style={kopfZelle}>Ausführung</th>
                      <th style={{ ...kopfZelle, ...rechts }}>Min./Mt.</th>
                      <th style={{ ...kopfZelle, paddingRight: 14 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {laufend.map(p => (
                      <Zeile key={p.id} p={p} patientId={patientId} offen={offen === p.id}
                        onToggle={() => setOffen(offen === p.id ? null : p.id)}
                        imBlock={p.block !== "" && p.block !== "einzeln" && bloecke.has(p.block)}
                        onDialog={setDialog} />
                    ))}
                    {retro.length > 0 && (
                      <>
                        <tr><td colSpan={9} style={{ background: "var(--bg-secondary)", fontSize: 11, color: "var(--text-secondary)", height: 20, padding: "0 14px" }}>Retrospektiv, einmalig</td></tr>
                        {retro.map(p => (
                          <Zeile key={p.id} p={p} patientId={patientId} offen={offen === p.id}
                            onToggle={() => setOffen(offen === p.id ? null : p.id)} imBlock={false} onDialog={setDialog} />
                        ))}
                      </>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Blattfuss (E) ── */}
      <div data-lpb-fuss className="flex items-center" style={{ flexShrink: 0, background: "var(--bg-elevated)", borderTop: "1px solid var(--border-default)", height: 30, fontSize: 12 }}>
        {(["a", "b", "c", "n"] as Leistungsart[]).map(art => (
          <div key={art} className="flex items-center" style={{ gap: 6, padding: "0 12px", borderRight: "1px solid var(--border-default)", height: "100%" }}>
            <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{art === "n" ? "N" : art.toUpperCase()}</span>
            <span style={mono}>{runde1(summen[art].tag).toLocaleString("de-CH", { minimumFractionDigits: 1 })}</span>
            <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>Min./Tag</span>
          </div>
        ))}
        <div className="flex items-center" style={{ gap: 6, padding: "0 12px", borderRight: "1px solid var(--border-default)", height: "100%", background: "var(--bg-secondary)", fontWeight: 600 }}>
          <span style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 400 }}>Periode</span>
          <span data-lpb-total style={mono}>{runde0(total.periodeMin).toLocaleString("de-CH")} Min. · {stundenMinuten(total.periodeMin)} Std.</span>
        </div>
        <div className="flex items-center" style={{ gap: 6, padding: "0 12px", borderRight: "1px solid var(--border-default)", height: "100%" }}>
          <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>Quartal</span>
          <span data-lpb-quartal style={mono}>{stundenMinuten(total.quartalMin)}</span>
          {quartalStunden > 60 && <Marke art="warn">über 60 Std.</Marke>}
        </div>
        {bloecke.size > 0 && (
          <div className="flex items-center" style={{ gap: 6, padding: "0 12px", height: "100%" }}>
            <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>Gleichzeitig</span>
            <span>{[...bloecke.keys()].map(k => BLOCK_LABEL[k as Einsatzblock]).join(", ")}</span>
            <button type="button" data-lpb-abzug onClick={() => setDialog({ art: "abzug" })} className="ui-fokusring cursor-pointer"
              style={{ background: "none", border: "none", padding: 0, fontFamily: "inherit", fontSize: 12, textDecoration: "underline", color: "var(--text-primary)" }}>
              Abzug
            </button>
          </div>
        )}
        <span style={{ flex: 1 }} />
      </div>

      {/* ── Dialoge ── */}
      {dialog?.art === "kopf" && <KopfdatenDialog blatt={blatt} onZu={() => setDialog(null)} />}
      {dialog?.art === "einfuegen" && <EinfuegenDialog onZu={() => setDialog(null)} onWahl={einfuegenBestaetigt} />}
      {dialog?.art === "grund" && <GrundDialog patientId={patientId} id={dialog.id} blatt={blatt} onZu={() => setDialog(null)} />}
      {dialog?.art === "verweigert" && <VerweigertDialog patientId={patientId} id={dialog.id} blatt={blatt} onZu={() => setDialog(null)} />}
      {dialog?.art === "begruendung" && <BegruendungDialog patientId={patientId} id={dialog.id} blatt={blatt} onZu={() => setDialog(null)} />}
      {dialog?.art === "abzug" && <AbzugDialog patientId={patientId} blatt={blatt} bloecke={bloecke} onZu={() => setDialog(null)} />}
    </div>
  );
}

/* ── Eine Positionszeile (C2/C3) plus Aufklapper (C4) ─────────────────── */
function Zeile({ p, patientId, offen, onToggle, imBlock, onDialog }: {
  p: LpbPosition; patientId: string; offen: boolean; onToggle: () => void;
  imBlock: boolean; onDialog: (d: DialogArt) => void;
}) {
  const delta = p.richtzeit === null ? null : p.zeit - p.richtzeit;
  const abweichend = p.planAnzahl !== null && (p.anzahl !== p.planAnzahl || p.einheit !== p.planEinheit);
  const min = p.w !== "S" ? null
    : p.einheit === "e" ? { einmalig: p.anzahl * p.zeit }
    : { monat: blattSummen([{ leistungsart: p.leistungsart, einheit: p.einheit, anzahl: p.anzahl, zeit: p.zeit, w: p.w }], 1, KEIN_ABZUG)[p.leistungsart].monat };

  const marken: React.ReactNode[] = [];
  if (delta !== null && delta > 0 && !p.zeitBegruendung) {
    marken.push(<Marke key="begr" art="err" onClick={() => onDialog({ art: "begruendung", id: p.id })}>Begründung</Marke>);
  }
  if (p.herkunft === "manuell" && !p.einfuegeGrund) {
    marken.push(<Marke key="grund" art="warn" onClick={() => onDialog({ art: "grund", id: p.id })}>Grund</Marke>);
  }
  if (p.w !== "S") marken.push(<Marke key="w" art="grau">{W_LABEL[p.w]}</Marke>);
  if (abweichend) marken.push(<Marke key="plan" art="info">≠ Plan</Marke>);
  if (p.einheitAbgebildet) marken.push(<Marke key="einheit" art="info">Einheit abgebildet</Marke>);
  if (delta !== null && delta > 0 && p.zeitBegruendung) marken.push(<Marke key="ok" art="ok">begründet</Marke>);
  if (p.training) marken.push(<Marke key="t" art="grau">T</Marke>);

  return (
    <>
      <tr data-lpb-zeile={p.nummer} style={p.w !== "S" ? { color: "var(--text-secondary)" } : undefined}>
        <td style={{ ...zelleStil, paddingLeft: 14 }}>
          <button type="button" onClick={onToggle} aria-expanded={offen} aria-label={`Details ${p.nummer}`}
            className="ui-fokusring cursor-pointer" style={{ background: "none", border: "none", padding: 0, color: "var(--text-tertiary)", fontSize: 10, lineHeight: 1 }}>
            {offen ? "▾" : "▸"}
          </button>
        </td>
        <td style={{ ...zelleStil, ...mono, color: "var(--text-secondary)" }}>{p.nummer}</td>
        <td style={zelleStil} title={p.bezeichnung}>
          {p.bezeichnung}
          {imBlock && <span aria-label={`Einsatzblock ${BLOCK_LABEL[p.block]}`} title={`Einsatzblock ${BLOCK_LABEL[p.block]}`} style={{ color: "var(--text-tertiary)", marginLeft: 4 }}>⧉</span>}
        </td>
        <td style={{ ...zelleStil, ...rechts }}>
          <span className="inline-flex items-center" style={{ gap: 2, justifyContent: "flex-end", width: "100%" }}>
            <input value={p.anzahl} aria-label={`Anzahl ${p.nummer}`} inputMode="numeric"
              onFocus={e => e.currentTarget.select()}
              onChange={e => positionSetzen(patientId, p.id, { anzahl: Math.max(0, parseInt(e.target.value, 10) || 0) })}
              style={{ width: 24, border: "none", borderBottom: "1px solid transparent", background: "transparent", textAlign: "right", fontSize: 12, fontFamily: "inherit", ...mono, color: "inherit" }} />
            <span style={{ color: "var(--text-tertiary)" }}>×</span>
            <select value={p.einheit} aria-label={`Einheit ${p.nummer}`}
              onChange={e => positionSetzen(patientId, p.id, { einheit: e.target.value as Einheit })}
              style={{ border: "none", background: "transparent", fontSize: 12, fontFamily: "inherit", padding: 0, color: "inherit" }}>
              {EINHEITEN.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </span>
        </td>
        <td style={{ ...zelleStil, ...rechts }}>
          {/* C6: klar erkennbares Zahlenfeld, markiert beim Fokus. */}
          <input data-lpb-zeit={p.nummer} value={p.zeit} inputMode="numeric" aria-label={`Zeit ${p.nummer} in Minuten`}
            onFocus={e => e.currentTarget.select()}
            onChange={e => positionSetzen(patientId, p.id, { zeit: Math.max(0, parseInt(e.target.value, 10) || 0) })}
            style={{ width: "100%", textAlign: "right", border: "1px solid var(--border-default)", borderRadius: 3, background: "var(--bg-elevated)", padding: "1px 4px", fontSize: 12, fontWeight: 500, fontFamily: "inherit", ...mono, color: "inherit" }} />
        </td>
        <td data-lpb-delta={p.nummer} style={{ ...zelleStil, ...rechts, ...mono }}>
          {delta === null || delta === 0
            ? <span style={{ color: "var(--text-tertiary)" }}>—</span>
            : <span style={{ fontWeight: 600, color: delta > 0 ? "var(--status-danger-text)" : "var(--status-success-text)" }}>{delta > 0 ? "+" : "−"}{Math.abs(delta)}</span>}
        </td>
        <td style={zelleStil}>
          <select value={p.ausfuehrung} aria-label={`Ausführung ${p.nummer}`}
            onChange={e => positionSetzen(patientId, p.id, { ausfuehrung: e.target.value as Ausfuehrung })}
            style={{ border: "none", background: "transparent", fontSize: 12, fontFamily: "inherit", padding: 0, maxWidth: "100%", color: "inherit" }}>
            <option value="">—</option>
            {(Object.keys(AUSF_KURZ) as Exclude<Ausfuehrung, "">[]).map(k => <option key={k} value={k}>{AUSF_KURZ[k]}</option>)}
          </select>
        </td>
        <td data-lpb-min={p.nummer} style={{ ...zelleStil, ...rechts, ...mono }}>
          {min === null ? "—" : "einmalig" in min ? `${runde0(min.einmalig)}e` : runde0(min.monat).toLocaleString("de-CH")}
        </td>
        <td style={{ ...zelleStil, paddingRight: 14 }}>
          <span className="flex items-center" style={{ gap: 4, overflow: "hidden" }}>{marken}</span>
        </td>
      </tr>
      {offen && (
        <tr data-lpb-detail={p.nummer}>
          <td colSpan={9} style={{ background: "var(--bg-secondary)", padding: "8px 14px", borderBottom: "1px solid var(--border-default)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: "8px 16px" }}>
              <DetailFeld k="Herkunft" v={
                p.herkunft === "pflegeplan"
                  ? <span>{p.zielBezuege.map((b, i) => <span key={i} style={{ display: "block" }}>{b.diagnoseTitel} — {b.zielTitel}</span>)}</span>
                  : HERK_LABEL[p.herkunft]
              } />
              <DetailFeld k="Erbringt" v={
                <select value={p.w} aria-label="Erbringt"
                  onChange={e => {
                    const wert = e.target.value as Erbringer;
                    if (wert === "V") onDialog({ art: "verweigert", id: p.id });
                    else positionSetzen(patientId, p.id, { w: wert, wGrund: wert === "S" ? "" : p.wGrund });
                  }}
                  style={feldStil}>
                  {(Object.keys(W_LABEL) as Erbringer[]).map(k => <option key={k} value={k}>{W_LABEL[k]}</option>)}
                </select>
              } />
              <DetailFeld k="Mandat" v={p.mandatId ? "KVG Pflegeleistungen" : "—"} />
              <DetailFeld k="Einsatz" v={
                <select value={p.block} aria-label="Einsatzblock"
                  onChange={e => positionSetzen(patientId, p.id, { block: e.target.value as Einsatzblock })}
                  style={feldStil}>
                  {(Object.keys(BLOCK_LABEL) as Einsatzblock[]).map(k => <option key={k} value={k}>{BLOCK_LABEL[k]}</option>)}
                </select>
              } />
              <DetailFeld k="Training" v={
                <span className="flex items-center" style={{ gap: 6 }}>
                  <Knopf klein label={p.training ? "gesetzt" : "nicht gesetzt"}
                    onClick={() => positionSetzen(patientId, p.id, { training: !p.training })} />
                  {/* C8: der 20-Prozent-Vorschlag — einmalig, wirkt nur auf Klick. */}
                  {p.training && p.richtzeit !== null && p.zeit === p.richtzeit && (
                    <button type="button" data-lpb-t20 onClick={() => positionSetzen(patientId, p.id, { zeit: Math.round(p.richtzeit! * 1.2) })}
                      className="ui-fokusring cursor-pointer"
                      style={{ background: "none", border: "none", padding: 0, fontFamily: "inherit", fontSize: 12, textDecoration: "underline", color: "var(--text-primary)" }}>
                      +20 % = {Math.round(p.richtzeit * 1.2)}
                    </button>
                  )}
                </span>
              } />
              <DetailFeld k="Richtzeit" v={<span style={mono}>{p.richtzeit !== null ? `${p.richtzeit} Min.` : "keine"} · M-Qual {p.mindestqualifikation ?? "—"}</span>} />
              <DetailFeld k="Ausführung" v={p.ausfuehrung === "" ? "—" : AUSF_LABEL[p.ausfuehrung]} />
              {p.herkunft === "manuell" && (
                <DetailFeld k="Position entfernen" v={<Knopf klein label="Entfernen" onClick={() => positionEntfernen(patientId, p.id)} />} />
              )}
            </div>
            {p.zeitBegruendung && <div style={{ marginTop: 7, fontSize: 12, color: "var(--text-secondary)" }}>Begründung: {p.zeitBegruendung}</div>}
            {p.wGrund && <div style={{ marginTop: 4, fontSize: 12, color: "var(--text-secondary)" }}>Grund: {p.wGrund}</div>}
            {p.einfuegeGrund && <div style={{ marginTop: 4, fontSize: 12, color: "var(--text-secondary)" }}>Einfügung: {p.einfuegeGrund}</div>}
          </td>
        </tr>
      )}
    </>
  );
}

function DetailFeld({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{k}</span>
      <span style={{ fontSize: 12 }}>{v}</span>
    </div>
  );
}

/* ── Dialoge ───────────────────────────────────────────────────────────── */
function KopfdatenDialog({ blatt, onZu }: { blatt: LpbBlatt; onZu: () => void }) {
  return (
    <Dialog titel="Kopfdaten" onZu={onZu}
      fuss={<Knopf primaer label="Schliessen" onClick={onZu} />}
      kinder={
        <>
          <Feld label="Abklärung" kinder={
            <select value={blatt.kopf.abklaerungsTyp} onChange={e => kopfSetzen(blatt.patientId, { abklaerungsTyp: e.target.value as AbklaerungsTyp })} style={feldStil}>
              {(Object.keys(ABKL_LABEL) as AbklaerungsTyp[]).map(k => <option key={k} value={k}>{ABKL_LABEL[k]}</option>)}
            </select>} />
          <Feld label="Abklärungsdatum" kinder={
            <input type="date" value={blatt.kopf.abklaerungsDatum} onChange={e => kopfSetzen(blatt.patientId, { abklaerungsDatum: e.target.value })} style={feldStil} />} />
          <Feld label="Weitere Leistungserbringer (ZSR)" kinder={
            <input value={blatt.kopf.andereZsr} onChange={e => kopfSetzen(blatt.patientId, { andereZsr: e.target.value })} style={feldStil} />} />
          <Feld label="Bemerkung für die Verordnung" kinder={
            <textarea value={blatt.kopf.bemerkungVerordnung} onChange={e => kopfSetzen(blatt.patientId, { bemerkungVerordnung: e.target.value })}
              style={{ ...feldStil, minHeight: 58, resize: "vertical" }} />} />
        </>
      } />
  );
}

function EinfuegenDialog({ onZu, onWahl }: { onZu: () => void; onWahl: (nummer: string) => void }) {
  const [suche, setSuche] = useState("");
  const feld = useRef<HTMLInputElement>(null);
  const katalog = useMemo(() => leistungsKatalog(), []);
  useEffect(() => { feld.current?.focus(); }, []);
  const q = suche.trim().toLowerCase();
  const treffer = (q ? katalog.filter(p => p.nummer.includes(q) || p.bezeichnung.toLowerCase().includes(q)) : katalog).slice(0, 25);
  return (
    <Dialog titel="Position einfügen" onZu={onZu}
      fuss={<Knopf label="Schliessen" onClick={onZu} />}
      kinder={
        <>
          <div style={{ marginBottom: 10 }}>
            <input ref={feld} data-lpb-suche value={suche} placeholder="Nummer oder Bezeichnung"
              onChange={e => setSuche(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && treffer[0]) onWahl(treffer[0].nummer); }}
              style={feldStil} aria-label="Katalog durchsuchen" />
          </div>
          <div style={{ maxHeight: 300, overflow: "auto" }}>
            {treffer.length === 0 ? (
              <div style={{ color: "var(--text-secondary)", fontSize: 12 }}>Kein Treffer.</div>
            ) : treffer.map(p => (
              <button key={p.nummer} type="button" data-lpb-treffer={p.nummer} onClick={() => onWahl(p.nummer)}
                className="ui-fokusring cursor-pointer flex"
                style={{ gap: 8, width: "100%", textAlign: "left", padding: "4px 5px", fontSize: 12, background: "none", border: "none", fontFamily: "inherit", color: "var(--text-primary)" }}>
                <span style={{ ...mono, width: 44, color: "var(--text-secondary)" }}>{p.nummer}</span>
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.bezeichnung}</span>
                <span style={{ color: "var(--text-secondary)" }}>{p.klv === "nein" ? "N" : p.klv.toUpperCase()}{p.vorgabeMinuten !== null ? ` · ${p.vorgabeMinuten}′` : ""}</span>
              </button>
            ))}
          </div>
        </>
      } />
  );
}

function GrundDialog({ patientId, id, blatt, onZu }: { patientId: string; id: string; blatt: LpbBlatt; onZu: () => void }) {
  const p = blatt.positionen.find(x => x.id === id);
  const [text, setText] = useState(p?.einfuegeGrund ?? "");
  if (!p) return null;
  return (
    <Dialog titel={`${p.nummer} hier eingefügt`} onZu={onZu}
      fuss={
        <>
          <Knopf label="Entfernen" onClick={() => { positionEntfernen(patientId, id); onZu(); }} />
          <Knopf primaer label="Speichern" onClick={() => { if (text.trim()) { positionSetzen(patientId, id, { einfuegeGrund: text.trim() }); onZu(); } }} />
        </>
      }
      kinder={<Feld label="Grund" kinder={<textarea value={text} onChange={e => setText(e.target.value)} autoFocus style={{ ...feldStil, minHeight: 58, resize: "vertical" }} />} />} />
  );
}

function VerweigertDialog({ patientId, id, blatt, onZu }: { patientId: string; id: string; blatt: LpbBlatt; onZu: () => void }) {
  const p = blatt.positionen.find(x => x.id === id);
  const [text, setText] = useState("");
  if (!p) return null;
  return (
    <Dialog titel={`${p.nummer} verweigert`} onZu={onZu}
      fuss={
        <>
          <Knopf label="Abbrechen" onClick={onZu} />
          <Knopf primaer label="Festhalten" onClick={() => { if (text.trim()) { positionSetzen(patientId, id, { w: "V", wGrund: text.trim() }); onZu(); } }} />
        </>
      }
      kinder={<Feld label="Grund" kinder={<textarea value={text} onChange={e => setText(e.target.value)} autoFocus style={{ ...feldStil, minHeight: 58, resize: "vertical" }} />} />} />
  );
}

/** F7 (vorgezogen, weil die Pflicht schon in Teil 1 sichtbar ist): drei
 *  Angaben — Freitext, Beleg aus der Bedarfsabklärung, Vergleich mit dem
 *  Aufwand einer nicht-angehörigen Pflegekraft. */
function BegruendungDialog({ patientId, id, blatt, onZu }: { patientId: string; id: string; blatt: LpbBlatt; onZu: () => void }) {
  const p = blatt.positionen.find(x => x.id === id);
  const [text, setText] = useState("");
  const [beleg, setBeleg] = useState("iG1a Körperpflege — 3, weitgehende Übernahme");
  const [vergleich, setVergleich] = useState("gleich hoch");
  if (!p) return null;
  return (
    <Dialog titel={`${p.nummer} · ${p.zeit} statt ${p.richtzeit} Min.`} onZu={onZu}
      fuss={
        <>
          <Knopf label="Abbrechen" onClick={onZu} />
          <Knopf primaer label="Speichern" onClick={() => {
            if (!text.trim()) return;
            positionSetzen(patientId, id, { zeitBegruendung: `${text.trim()} · ${beleg} · ${vergleich}` });
            onZu();
          }} />
        </>
      }
      kinder={
        <>
          <Feld label="Begründung" kinder={<textarea value={text} onChange={e => setText(e.target.value)} autoFocus style={{ ...feldStil, minHeight: 58, resize: "vertical" }} />} />
          <Feld label="Beleg aus der Bedarfsabklärung" kinder={
            <select value={beleg} onChange={e => setBeleg(e.target.value)} style={feldStil}>
              <option>iG1a Körperpflege — 3, weitgehende Übernahme</option>
              <option>iG3 Gehen im Wohnbereich — 3</option>
              <option>CAP ADL ausgelöst</option>
              <option>keiner</option>
            </select>} />
          <Feld label="Aufwand einer nicht-angehörigen Pflegekraft" kinder={
            <select value={vergleich} onChange={e => setVergleich(e.target.value)} style={feldStil}>
              <option>gleich hoch</option>
              <option>tiefer</option>
            </select>} />
        </>
      } />
  );
}

function AbzugDialog({ patientId, blatt, bloecke, onZu }: { patientId: string; blatt: LpbBlatt; bloecke: Map<string, LpbPosition[]>; onZu: () => void }) {
  return (
    <Dialog titel="Abzug für gleichzeitig erbrachte Leistungen" onZu={onZu}
      fuss={<Knopf primaer label="Übernehmen" onClick={onZu} />}
      kinder={
        <>
          {[...bloecke.entries()].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "4px 0", borderBottom: "1px solid var(--border-default)", fontSize: 12 }}>
              <span>{BLOCK_LABEL[k as Einsatzblock]}</span>
              <span style={{ fontSize: 11, color: "var(--text-secondary)", ...mono }}>{v.map(p => p.nummer).join(", ")}</span>
            </div>
          ))}
          <div style={{ height: 8 }} />
          {(["a", "b", "c"] as Leistungsart[]).map(art => (
            <Feld key={art} label={`KLV ${art} · Minuten pro Monat`} kinder={
              <input value={blatt.abzug[art]} inputMode="numeric" style={{ ...feldStil, ...mono }}
                onChange={e => abzugSetzen(patientId, { [art]: Math.max(0, parseInt(e.target.value, 10) || 0) } as Partial<Record<Leistungsart, number>>)} />} />
          ))}
        </>
      } />
  );
}

