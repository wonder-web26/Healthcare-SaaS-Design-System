/**
 * Der rechte Bereich: die Auswahl zum aktuellen Fokus. Oben der
 * NAVIGATIONSPFAD (Lauf 6e: bedienbar, mit Kontextwechsel je Stufe),
 * darunter die Kontextkarte (woher kommt die Liste), dann die Liste des
 * Schritts.
 *
 * Alle Daten kommen über die Vertragsabfragen aus src/lib/pflegeplan/ —
 * kein Zugriff unter dem Vertrag vorbei; der Pfad selbst liest nur den
 * Plan-Zustand.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Search, X } from "lucide-react";
import {
  diagnoseVorschlaege, zieleZuDiagnose, interventionenZuZiel,
  ausgeschlosseneZiele, unbehandelteCaps,
} from "../../../lib/pflegeplan/mock-adapter";
import type { CapCode, DiagnoseCode, DiagnoseVorschlag } from "../../../lib/pflegeplan/vertrag";
import {
  usePlan, diagnoseUebernehmen, diagnoseVerwerfen, verwerfungZuruecknehmen, nachPrioritaet,
  diagnosePriorisieren, diagnostikAbschliessen, diagnostikOeffnen,
  zielUebernehmen, zielEntfernen, eigenesZielHinzufuegen, massnahmeVerknuepfen,
  massnahmenBezugLoesen, type VerwerfGrund,
} from "../../../lib/pflegeplan/plan-store";
import { useCurrentUser } from "../../auth";
import { GEGENWART_ISO } from "../../../lib/gegenwart";
import type { MandatKurz } from "../../../lib/pflegeplan/planung";
import { MassnahmenEditor } from "./MassnahmenEditor";
import { type Fokus, TypMarke, positionsVorschau, katalogGruppe, datumAnzeige } from "./gemeinsam";

const KARTE: React.CSSProperties = {
  background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)",
  borderRadius: "var(--radius-card)",
};

const VERWERF_GRUENDE: VerwerfGrund[] = [
  "Nicht zutreffend", "Wird anderweitig abgedeckt", "Bereits im Plan enthalten", "Klientin lehnt ab",
];

const TOP_SICHTBAR = 4;

/* ── Navigationspfad (Lauf 6e) ─────────────────────────────────────────────
   Ersetzt Schrittanzeige und Zurück-Knöpfe: eine Zeile, die zeigt, wo man
   ist, welchen Weg der Kontext genommen hat — und an jeder Stufe bedienbar
   ist. Zwei Klickflächen je Stufe: der NAME wechselt die Liste, das ▾
   wechselt den Kontext, ohne den Weg zurückzugehen. So ist Vergleichen zwei
   Klicks statt vier.

   DIE KENNUNG IST DAS PAAR: ein Ziel, das zwei Diagnosen dient, gehört im
   Kontext zur aktuellen Diagnose — gemerkt wird (diagnoseCode, zielId),
   nie die Ziel-Kennung allein (istErsterBezug-Regel, planung.ts). */

/** Gekürzter Titel im Pfad — voller Titel als Tooltip. Keine geratene
 *  Festbreite: der Titel SCHRUMPFT im Flex-Layout, bis die Zeile passt —
 *  im Browser mit den längsten Mock-Titeln gemessen (eine feste Breite von
 *  96px lief bei zwei langen Titeln 36px über die 447px des Bereichs). */
function PfadTitel({ titel }: { titel: string }) {
  return (
    <span title={titel} style={{
      minWidth: 0, overflow: "hidden",
      textOverflow: "ellipsis", whiteSpace: "nowrap",
    }}>
      {titel}
    </span>
  );
}

interface PfadKontext {
  diagnoseCode: DiagnoseCode | null;
  zielId: string | null;
}

function NavigationsPfad({ fokus, onFokus, kontext }: {
  fokus: Fokus;
  onFokus: (f: Fokus) => void;
  kontext: PfadKontext;
}) {
  const plan = usePlan();
  const [offenesMenue, setOffenesMenue] = useState<2 | 3 | null>(null);
  const wurzel = useRef<HTMLDivElement>(null);

  /* Kontext auflösen — ausschliesslich aus dem Plan-Zustand, keine
     Katalogabfragen: der Pfad darf beim Rendern nichts abfragen. */
  const sortiert = nachPrioritaet(plan.diagnosen);
  const kontextDiagnose = plan.diagnosen.find(d => d.code === kontext.diagnoseCode) ?? sortiert[0] ?? null;
  const zieleHier = kontextDiagnose ? plan.ziele.filter(z => z.diagnoseCode === kontextDiagnose.code) : [];
  const kontextZiel = zieleHier.find(z => z.zielId === kontext.zielId) ?? zieleHier[0] ?? null;
  const massnahmenZahl = (diagnoseCode: string, zielId: string) =>
    plan.massnahmen.filter(m => m.zielBezuege.some(b => b.diagnoseCode === diagnoseCode && b.zielId === zielId)).length;

  const phase1 = !plan.diagnostikAbgeschlossen;
  const stufe2Begehbar = !phase1 && kontextDiagnose !== null;
  const stufe3Begehbar = stufe2Begehbar && kontextZiel !== null;
  const aktiv = fokus.schritt === 1 || fokus.schritt === 2 || fokus.schritt === 3 ? fokus.schritt : 3;

  const grund2 = phase1
    ? "In der Diagnostik nicht begehbar."
    : kontextDiagnose === null ? "Noch keine Diagnose im Plan." : undefined;
  const grund3 = phase1
    ? "In der Diagnostik nicht begehbar."
    : kontextDiagnose === null
      ? "Noch keine Diagnose im Plan."
      : kontextZiel === null ? `${kontextDiagnose.titel} trägt keine Ziele.` : undefined;

  const zuStufe = (nr: 1 | 2 | 3) => {
    setOffenesMenue(null);
    if (nr === 1) onFokus({ schritt: 1 });
    else if (nr === 2 && stufe2Begehbar && kontextDiagnose) onFokus({ schritt: 2, diagnoseCode: kontextDiagnose.code });
    else if (nr === 3 && stufe3Begehbar && kontextDiagnose && kontextZiel) {
      onFokus({ schritt: 3, diagnoseCode: kontextDiagnose.code, zielId: kontextZiel.zielId, zielTitel: kontextZiel.titel });
    }
  };

  /* Kontextwechsel über das ▾: die Stufe bleibt, die Liste tauscht sich
     aus. Nur wenn die neue Diagnose keine Ziele trägt, fällt die Ansicht
     auf Stufe 2 zurück (kein toter Klick auf Stufe 3). */
  const diagnoseWechseln = (code: DiagnoseCode) => {
    setOffenesMenue(null);
    const zieleDort = plan.ziele.filter(z => z.diagnoseCode === code);
    if (aktiv === 3 && zieleDort.length > 0) {
      onFokus({ schritt: 3, diagnoseCode: code, zielId: zieleDort[0].zielId, zielTitel: zieleDort[0].titel });
    } else {
      onFokus({ schritt: 2, diagnoseCode: code });
    }
  };

  /* Klick ausserhalb schliesst die Auswahl. */
  useEffect(() => {
    if (offenesMenue === null) return;
    const zu = (e: MouseEvent) => {
      if (wurzel.current && e.target instanceof Node && !wurzel.current.contains(e.target)) setOffenesMenue(null);
    };
    document.addEventListener("mousedown", zu);
    return () => document.removeEventListener("mousedown", zu);
  }, [offenesMenue]);

  /* Tastatur: 1/2/3 springen auf die Stufe — nie, während ein Eingabefeld
     den Fokus hat. */
  useEffect(() => {
    const taste = (e: KeyboardEvent) => {
      if (e.key !== "1" && e.key !== "2" && e.key !== "3") return;
      const ziel = document.activeElement;
      if (ziel instanceof HTMLElement) {
        const tag = ziel.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || ziel.isContentEditable) return;
      }
      zuStufe(Number(e.key) as 1 | 2 | 3);
    };
    window.addEventListener("keydown", taste);
    return () => window.removeEventListener("keydown", taste);
  });

  const stufenStil = (nr: 1 | 2 | 3, begehbar: boolean): React.CSSProperties => ({
    background: "none", border: "none", padding: "3px 2px", fontFamily: "inherit",
    fontSize: "var(--text-meta)", whiteSpace: "nowrap",
    fontWeight: aktiv === nr ? "var(--weight-medium)" : "var(--weight-regular)",
    color: !begehbar ? "var(--text-tertiary)" : aktiv === nr ? "var(--brand-primary)" : "var(--text-secondary)",
    borderBottom: aktiv === nr ? "2px solid var(--brand-primary)" : "2px solid transparent",
    cursor: begehbar ? "pointer" : "default",
  });

  const menueEintrag: React.CSSProperties = {
    display: "block", width: "100%", textAlign: "left", background: "none", border: "none",
    fontFamily: "inherit", padding: "7px 10px", borderRadius: "var(--radius-card)", cursor: "pointer",
  };

  return (
    <div ref={wurzel} data-pfad className="flex items-center" style={{ gap: 4, marginBottom: 10, position: "relative", whiteSpace: "nowrap", minWidth: 0 }}>
      {/* Stufe 1 */}
      <button type="button" data-pfad-stufe="1" onClick={() => zuStufe(1)}
        className="ui-fokusring cursor-pointer" style={stufenStil(1, true)}>
        1 Diagnosen
      </button>
      <span aria-hidden style={{ color: "var(--text-tertiary)", fontSize: "var(--text-meta)" }}>›</span>

      {/* Stufe 2 — Name und ▾ sind GETRENNTE Trefferbereiche mit sichtbarem
          Trenner: wer den Namen trifft, wollte oft das ▾. */}
      <span className="flex items-center" style={{ gap: 0, minWidth: 0, flexShrink: 1 }}>
        <button type="button" data-pfad-stufe="2" onClick={() => zuStufe(2)}
          aria-disabled={!stufe2Begehbar} title={grund2}
          className={stufe2Begehbar ? "ui-fokusring cursor-pointer" : ""}
          style={{ ...stufenStil(2, stufe2Begehbar), display: "flex", alignItems: "baseline", gap: 4, minWidth: 0, overflow: "hidden" }}>
          <span style={{ whiteSpace: "nowrap" }}>2 Ziele{kontextDiagnose ? " ·" : ""}</span>
          {kontextDiagnose && <PfadTitel titel={kontextDiagnose.titel} />}
        </button>
        <span aria-hidden style={{ width: 1, height: 14, background: "var(--border-default)", margin: "0 3px" }} />
        <button type="button" data-pfad-menue="2" aria-label="Diagnose wechseln" aria-expanded={offenesMenue === 2}
          aria-disabled={!stufe2Begehbar} title={grund2 ?? "Diagnose wechseln"}
          onClick={() => { if (stufe2Begehbar) setOffenesMenue(offenesMenue === 2 ? null : 2); }}
          className={stufe2Begehbar ? "ui-fokusring cursor-pointer" : ""}
          style={{ background: "none", border: "none", padding: "3px 4px", fontSize: 10, color: stufe2Begehbar ? "var(--text-secondary)" : "var(--text-tertiary)", cursor: stufe2Begehbar ? "pointer" : "default" }}>
          ▾
        </button>
      </span>
      <span aria-hidden style={{ color: "var(--text-tertiary)", fontSize: "var(--text-meta)" }}>›</span>

      {/* Stufe 3 */}
      <span className="flex items-center" style={{ gap: 0, minWidth: 0, flexShrink: 1 }}>
        <button type="button" data-pfad-stufe="3" onClick={() => zuStufe(3)}
          aria-disabled={!stufe3Begehbar} title={grund3}
          className={stufe3Begehbar ? "ui-fokusring cursor-pointer" : ""}
          style={{ ...stufenStil(3, stufe3Begehbar), display: "flex", alignItems: "baseline", gap: 4, minWidth: 0, overflow: "hidden" }}>
          <span style={{ whiteSpace: "nowrap" }}>3 Massnahmen{stufe3Begehbar && kontextZiel ? " ·" : ""}</span>
          {stufe3Begehbar && kontextZiel && <PfadTitel titel={kontextZiel.titel} />}
        </button>
        <span aria-hidden style={{ width: 1, height: 14, background: "var(--border-default)", margin: "0 3px" }} />
        <button type="button" data-pfad-menue="3" aria-label="Ziel wechseln" aria-expanded={offenesMenue === 3}
          aria-disabled={!stufe3Begehbar} title={grund3 ?? "Ziel wechseln"}
          onClick={() => { if (stufe3Begehbar) setOffenesMenue(offenesMenue === 3 ? null : 3); }}
          className={stufe3Begehbar ? "ui-fokusring cursor-pointer" : ""}
          style={{ background: "none", border: "none", padding: "3px 4px", fontSize: 10, color: stufe3Begehbar ? "var(--text-secondary)" : "var(--text-tertiary)", cursor: stufe3Begehbar ? "pointer" : "default" }}>
          ▾
        </button>
      </span>

      {/* Auswahl: Diagnosen in Prioritätsreihenfolge bzw. Ziele der
          aktuellen Diagnose — voller Titel plus Kennzahl, damit sich der
          Wechsel ohne Hinspringen beurteilen lässt. */}
      {offenesMenue !== null && (
        <div data-pfad-liste style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 30, marginTop: 4,
          background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)",
          borderRadius: "var(--radius-card)", boxShadow: "0 8px 24px rgba(15, 23, 26, 0.12)", padding: 4,
          maxHeight: 320, overflowY: "auto",
        }}>
          {offenesMenue === 2 && sortiert.map(d => {
            const zielZahl = plan.ziele.filter(z => z.diagnoseCode === d.code).length;
            const aktuell = kontextDiagnose?.code === d.code;
            return (
              <button key={d.code} type="button" onClick={() => diagnoseWechseln(d.code)}
                className="ui-fokusring cursor-pointer"
                style={{ ...menueEintrag, background: aktuell ? "var(--brand-primary-light)" : "none" }}>
                <span className="flex items-baseline" style={{ gap: 8 }}>
                  <span className="flex-1 min-w-0" style={{ fontSize: "var(--text-small)", color: "var(--text-primary)", whiteSpace: "normal" }}>
                    {d.titel}
                    {d.prioritaet === "wichtig" && <span style={{ marginLeft: 6, fontSize: "var(--text-micro)", color: "var(--brand-primary)", fontWeight: 500 }}>wichtig</span>}
                  </span>
                  <span style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", whiteSpace: "nowrap" }}>
                    {zielZahl} {zielZahl === 1 ? "Ziel" : "Ziele"}
                  </span>
                </span>
              </button>
            );
          })}
          {offenesMenue === 3 && kontextDiagnose && zieleHier.map(z => {
            const mZahl = massnahmenZahl(kontextDiagnose.code, z.zielId);
            const aktuell = kontextZiel?.zielId === z.zielId;
            return (
              <button key={z.zielId} type="button"
                onClick={() => { setOffenesMenue(null); onFokus({ schritt: 3, diagnoseCode: kontextDiagnose.code, zielId: z.zielId, zielTitel: z.titel }); }}
                className="ui-fokusring cursor-pointer"
                style={{ ...menueEintrag, background: aktuell ? "var(--brand-primary-light)" : "none" }}>
                <span className="flex items-baseline" style={{ gap: 8 }}>
                  <span className="flex-1 min-w-0" style={{ fontSize: "var(--text-small)", color: "var(--text-primary)", whiteSpace: "normal" }}>{z.titel}</span>
                  <span style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", whiteSpace: "nowrap" }}>
                    {mZahl} {mZahl === 1 ? "Massnahme" : "Massnahmen"}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Kontextkarte ──────────────────────────────────────────────────────────
   Sagt, WOHER eine Liste kommt — der Navigationspfad sagt, WO man ist.
   Zwei verschiedene Aussagen; der Zurück-Knopf ist mit Lauf 6e in den
   Pfad gewandert. */
function KontextKarte({ zeilen }: { zeilen: React.ReactNode[] }) {
  return (
    <div style={{ ...KARTE, background: "var(--bg-secondary)", padding: "9px 12px", marginBottom: 10 }}>
      {zeilen.map((z, i) => (
        <div key={i} style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", lineHeight: 1.5 }}>{z}</div>
      ))}
    </div>
  );
}

/* ── Suche ─────────────────────────────────────────────────────────────── */
function SuchFeld({ wert, onChange, platzhalter }: { wert: string; onChange: (v: string) => void; platzhalter: string }) {
  return (
    <div className="flex items-center" style={{ ...KARTE, gap: 8, padding: "0 12px", height: 36, marginBottom: 10 }}>
      <Search style={{ width: 14, height: 14, color: "var(--text-tertiary)", flexShrink: 0 }} />
      <input value={wert} onChange={e => onChange(e.target.value)} placeholder={platzhalter}
        style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: "var(--text-small)", color: "var(--text-primary)", fontFamily: "inherit" }} />
      {wert && (
        <button type="button" onClick={() => onChange("")} aria-label="Suche leeren" className="ui-fokusring cursor-pointer"
          style={{ background: "none", border: "none", padding: 2, color: "var(--text-tertiary)" }}>
          <X style={{ width: 13, height: 13 }} />
        </button>
      )}
    </div>
  );
}

function PillKnopf({ label, onClick, primaer }: { label: string; onClick: () => void; primaer?: boolean }) {
  return (
    <button type="button" onClick={onClick} className="ui-fokusring cursor-pointer shrink-0"
      style={{
        padding: "5px 14px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-meta)", fontWeight: 500,
        background: primaer ? "var(--brand-primary)" : "var(--bg-elevated)",
        color: primaer ? "var(--text-on-dark)" : "var(--text-primary)",
        border: primaer ? "none" : "var(--border-thin) solid var(--border-default)", whiteSpace: "nowrap",
      }}>
      {label}
    </button>
  );
}

function ImPlanMarke() {
  return (
    <span className="inline-flex items-center shrink-0" style={{ gap: 4, padding: "2px 8px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-micro)", fontWeight: "var(--weight-medium)", background: "var(--status-success-bg)", color: "var(--status-success-text)" }}>
      <Check style={{ width: 10, height: 10 }} /> Im Plan
    </span>
  );
}

/* ══════════════════════════════════════════
   SCHRITT 1 — Diagnoseauswahl
   ══════════════════════════════════════════ */
function DiagnoseAuswahl({ caps, assessmentDatum, onUebernommen }: {
  caps: CapCode[]; assessmentDatum: string; onUebernommen: (code: DiagnoseCode) => void;
}) {
  const plan = usePlan();
  const benutzer = useCurrentUser();
  const [suche, setSuche] = useState("");
  const [alleSichtbar, setAlleSichtbar] = useState(false);
  const [gruendeOffen, setGruendeOffen] = useState<DiagnoseCode | null>(null);

  const vorschlaege = useMemo(() => diagnoseVorschlaege(caps), [caps]);
  const unbehandelt = useMemo(() => unbehandelteCaps(caps), [caps]);
  /* «Keine Ziele hinterlegt» muss VOR dem Klick sichtbar sein — sonst führt
     die oberste Empfehlung ins Leere. */
  const ohneZiele = useMemo(
    () => new Set(vorschlaege.filter(v => zieleZuDiagnose(v.diagnose.code).length === 0).map(v => v.diagnose.code)),
    [vorschlaege]);

  const q = suche.trim().toLowerCase();
  const treffer = q
    ? vorschlaege.filter(v => v.diagnose.titel.toLowerCase().includes(q) || v.diagnose.code.includes(q))
    : vorschlaege;
  /* Ranken, nie filtern: ohne Suche sind die obersten vier sichtbar, der
     Rest hinter «Alle N anzeigen». Verschwindet dieser Knopf, ist aus dem
     Ranking heimlich ein Filter geworden. */
  const sichtbar = q || alleSichtbar ? treffer : treffer.slice(0, TOP_SICHTBAR);

  const belegZeile = (v: DiagnoseVorschlag) =>
    `${v.ausloesendeCaps.join(", ")} · ${v.belege.map(b => `${b.itemCode}=${b.wert}`).join(" · ")}`;

  return (
    <div>
      {/* Die Diagnostik-Phase (Lauf 6d): Abschluss und Rückweg über der
          Liste — eine Wegmarke, kein Tor. */}
      {!plan.diagnostikAbgeschlossen ? (
        <div data-diagnostik-kopf className="flex items-center flex-wrap" style={{ gap: 10, padding: "8px 12px", marginBottom: 10, borderRadius: "var(--radius-card)", background: "var(--brand-primary-light)" }}>
          <span className="flex-1 min-w-0" style={{ fontSize: "var(--text-meta)", color: "var(--brand-primary)", fontWeight: 500 }}>
            Diagnostik offen
          </span>
          <button type="button" data-diagnostik-abschliessen-liste
            disabled={plan.diagnosen.length === 0}
            title={plan.diagnosen.length === 0 ? "Ohne übernommene Diagnose gibt es nichts abzuschliessen." : undefined}
            onClick={() => diagnostikAbschliessen()}
            className={plan.diagnosen.length > 0 ? "ui-fokusring cursor-pointer shrink-0" : "shrink-0"}
            style={{
              padding: "4px 12px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-micro)", fontWeight: 500,
              background: plan.diagnosen.length > 0 ? "var(--brand-primary)" : "var(--bg-secondary)",
              color: plan.diagnosen.length > 0 ? "var(--text-on-dark)" : "var(--text-tertiary)",
              border: "none", cursor: plan.diagnosen.length > 0 ? "pointer" : "not-allowed",
            }}>
            Diagnostik abschliessen
          </button>
        </div>
      ) : (
        <div data-diagnostik-kopf className="flex items-center flex-wrap" style={{ gap: 10, padding: "8px 12px", marginBottom: 10, borderRadius: "var(--radius-card)", background: "var(--bg-secondary)" }}>
          <span className="flex-1 min-w-0" style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>
            Diagnostik abgeschlossen
          </span>
          <button type="button" data-diagnostik-oeffnen onClick={() => diagnostikOeffnen()}
            className="ui-fokusring cursor-pointer shrink-0"
            style={{ background: "none", border: "none", padding: 0, fontFamily: "inherit", fontSize: "var(--text-micro)", fontWeight: 500, color: "var(--brand-primary)" }}>
            Diagnostik wieder öffnen
          </button>
        </div>
      )}
      <KontextKarte zeilen={[
        <><strong>{vorschlaege.length} Vorschläge</strong> · {caps.length - unbehandelt.length} CAPs · Assessment {assessmentDatum}</>,
        ...(unbehandelt.length > 0
          ? [<span style={{ color: "var(--status-warning-text)" }}>{unbehandelt.length} ausgelöster CAP ohne Zuordnungsliste: {unbehandelt.join(", ")}</span>]
          : []),
      ]} />
      <SuchFeld wert={suche} onChange={setSuche} platzhalter="Diagnose suchen (Titel oder Code)…" />

      <div className="flex flex-col" style={{ gap: 8 }}>
        {sichtbar.map(v => {
          const code = v.diagnose.code;
          const imPlan = plan.diagnosen.some(d => d.code === code);
          const verworfen = plan.verwerfungen.find(x => x.code === code) ?? null;
          return (
            <div key={code} data-kandidat={code} style={{ ...KARTE, padding: "9px 12px", opacity: verworfen ? 0.85 : 1 }}>
              <div className="flex items-center" style={{ gap: 8 }}>
                <span className="flex-1 min-w-0" style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", textDecoration: verworfen ? "line-through" : "none" }}>
                  {v.diagnose.titel}
                  <span style={{ fontWeight: "var(--weight-regular)", color: "var(--text-tertiary)", marginLeft: 6, fontVariantNumeric: "tabular-nums" }}>{code}</span>
                </span>
                <TypMarke typ={v.diagnose.typ} />
                <span style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", whiteSpace: "nowrap" }}>
                  {v.ausloesendeCaps.length} {v.ausloesendeCaps.length === 1 ? "CAP" : "CAPs"}
                </span>
              </div>

              {/* Belegzeile: warum schlägst du mir das vor — in einer Zeile. */}
              <div style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", marginTop: 2 }}>{belegZeile(v)}</div>

              {ohneZiele.has(code) && !verworfen && (
                <div style={{ fontSize: "var(--text-micro)", color: "var(--status-warning-text)", marginTop: 2 }}>
                  Keine Ziele hinterlegt
                </div>
              )}

              {verworfen ? (
                <div className="flex items-center flex-wrap" style={{ gap: 8, marginTop: 6 }}>
                  <span style={{ fontSize: "var(--text-micro)", color: "var(--text-secondary)" }}>
                    Verworfen: {verworfen.grund} · {verworfen.person} · {datumAnzeige(verworfen.datum)}
                  </span>
                  <button type="button" onClick={() => verwerfungZuruecknehmen(code)} className="ui-fokusring cursor-pointer"
                    style={{ background: "none", border: "none", padding: 0, fontFamily: "inherit", fontSize: "var(--text-micro)", fontWeight: 500, color: "var(--brand-primary)" }}>
                    Zurücknehmen
                  </button>
                </div>
              ) : (
                <div className="flex items-center" style={{ gap: 8, marginTop: 6 }}>
                  {imPlan ? (
                    <>
                      <ImPlanMarke />
                      {/* Priorität — setzbar auch in der Liste (Lauf 6d). */}
                      {(() => {
                        const planD = plan.diagnosen.find(d => d.code === code)!;
                        const wichtig = planD.prioritaet === "wichtig";
                        return (
                          <button type="button" data-prioritaet-liste={code} aria-pressed={wichtig}
                            onClick={() => diagnosePriorisieren(code, wichtig ? "normal" : "wichtig")}
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
                        );
                      })()}
                    </>
                  ) : (
                    <PillKnopf primaer label="Übernehmen" onClick={() => {
                      diagnoseUebernehmen({ code, titel: v.diagnose.titel, typ: v.diagnose.typ, belegZeile: belegZeile(v), ausloesendeCaps: v.ausloesendeCaps });
                      /* In der Diagnostik bleibt die Liste offen — die
                         Übernahme springt nicht zu den Zielen (Lauf 6d). */
                      if (plan.diagnostikAbgeschlossen) onUebernommen(code);
                    }} />
                  )}
                  {!imPlan && (
                    <button type="button" aria-label={`Vorschlag ${v.diagnose.titel} verwerfen`}
                      onClick={() => setGruendeOffen(gruendeOffen === code ? null : code)}
                      className="ui-fokusring cursor-pointer flex items-center justify-center"
                      style={{ width: 26, height: 26, borderRadius: "var(--radius-pill)", background: "none", border: "var(--border-thin) solid var(--border-default)", color: "var(--text-tertiary)" }}>
                      <X style={{ width: 13, height: 13 }} />
                    </button>
                  )}
                </div>
              )}

              {gruendeOffen === code && !verworfen && (
                <div className="flex flex-col" style={{ gap: 4, marginTop: 6, paddingTop: 6, borderTop: "var(--border-thin) solid var(--border-default)" }}>
                  <span style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>Grund für das Verwerfen:</span>
                  {VERWERF_GRUENDE.map(grund => (
                    <button key={grund} type="button" className="ui-fokusring cursor-pointer text-left"
                      onClick={() => {
                        diagnoseVerwerfen(code, grund, `${benutzer.vorname.charAt(0)}. ${benutzer.name}`, GEGENWART_ISO);
                        setGruendeOffen(null);
                      }}
                      style={{ background: "none", border: "none", padding: "3px 0", fontFamily: "inherit", fontSize: "var(--text-meta)", color: "var(--text-primary)" }}>
                      {grund}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!q && !alleSichtbar && treffer.length > TOP_SICHTBAR && (
        <div style={{ marginTop: 10 }}>
          <PillKnopf label={`Alle ${treffer.length} anzeigen`} onClick={() => setAlleSichtbar(true)} />
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   SCHRITT 2 — Zielauswahl
   ══════════════════════════════════════════ */
function ZielAuswahl({ diagnoseCode, onMassnahmen }: {
  diagnoseCode: DiagnoseCode;
  onMassnahmen: (zielId: string, zielTitel: string) => void;
}) {
  const plan = usePlan();
  const [suche, setSuche] = useState("");
  const [eigenerTitel, setEigenerTitel] = useState("");

  const diagnose = plan.diagnosen.find(d => d.code === diagnoseCode) ?? null;
  const ziele = useMemo(() => zieleZuDiagnose(diagnoseCode), [diagnoseCode]);
  const entfernt = useMemo(() => ausgeschlosseneZiele(diagnoseCode).length, [diagnoseCode]);
  const imPlanHier = plan.ziele.filter(z => z.diagnoseCode === diagnoseCode);

  const q = suche.trim().toLowerCase();
  const treffer = q ? ziele.filter(z => z.titel.toLowerCase().includes(q)) : ziele;

  return (
    <div>
      {/* Eine Kennzahlenzeile (Lauf 6f): die Zahl der Ausgeschlossenen ist
          der Beleg, dass die Ausschlussliste gegriffen hat. */}
      <KontextKarte
        zeilen={[
          <><strong>{diagnose?.titel ?? diagnoseCode}</strong> ({diagnoseCode}) · {ziele.length} {ziele.length === 1 ? "Ziel" : "Ziele"} · {entfernt} ausgeschlossen · {imPlanHier.length} im Plan</>,
        ]}
      />

      {ziele.length === 0 ? (
        <div style={{ ...KARTE, padding: "var(--space-6)", textAlign: "center" }}>
          <div style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", marginBottom: 10 }}>
            Keine Ziele im Katalog
          </div>
          <div className="flex items-center" style={{ gap: 8, maxWidth: 420, margin: "0 auto" }}>
            <input value={eigenerTitel} onChange={e => setEigenerTitel(e.target.value)} placeholder="Eigenes Ziel formulieren…"
              style={{ flex: 1, height: 34, padding: "0 12px", borderRadius: "var(--radius-card)", border: "var(--border-thin) solid var(--border-default)", background: "var(--bg-primary)", fontSize: "var(--text-small)", color: "var(--text-primary)", fontFamily: "inherit", outline: "none" }} />
            <PillKnopf primaer label="Ziel aufnehmen" onClick={() => {
              if (!eigenerTitel.trim()) return;
              eigenesZielHinzufuegen(diagnoseCode, eigenerTitel.trim());
              setEigenerTitel("");
            }} />
          </div>
          {imPlanHier.length > 0 && (
            <div style={{ marginTop: 12, textAlign: "left" }}>
              {imPlanHier.map(z => (
                <div key={z.zielId} className="flex items-center" style={{ gap: 8, padding: "6px 0", borderTop: "var(--border-thin) solid var(--border-default)" }}>
                  <span className="flex-1 min-w-0" style={{ fontSize: "var(--text-small)", color: "var(--text-primary)" }}>{z.titel}</span>
                  <ImPlanMarke />
                  <PillKnopf label="Massnahmen wählen" onClick={() => onMassnahmen(z.zielId, z.titel)} />
                  <button type="button" aria-label={`Ziel ${z.titel} entfernen`} onClick={() => zielEntfernen(diagnoseCode, z.zielId)}
                    className="ui-fokusring cursor-pointer flex items-center justify-center"
                    style={{ width: 26, height: 26, borderRadius: "var(--radius-pill)", background: "none", border: "var(--border-thin) solid var(--border-default)", color: "var(--text-tertiary)" }}>
                    <X style={{ width: 13, height: 13 }} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          <SuchFeld wert={suche} onChange={setSuche} platzhalter="Ziel suchen…" />
          <div className="flex flex-col" style={{ gap: 8 }}>
            {treffer.map(z => {
              const imPlan = plan.ziele.some(x => x.diagnoseCode === diagnoseCode && x.zielId === z.id);
              const andere = plan.ziele.find(x => x.zielId === z.id && x.diagnoseCode !== diagnoseCode) ?? null;
              const andereTitel = andere ? (plan.diagnosen.find(d => d.code === andere.diagnoseCode)?.titel ?? andere.diagnoseCode) : null;
              return (
                <div key={z.id} data-zielwahl={z.id} style={{ ...KARTE, padding: "9px 12px" }}>
                  <div className="flex items-center" style={{ gap: 8 }}>
                    <span className="flex-1 min-w-0" style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>{z.titel}</span>
                    {imPlan ? (
                      <>
                        <ImPlanMarke />
                        <PillKnopf label="Massnahmen wählen" onClick={() => onMassnahmen(z.id, z.titel)} />
                        <button type="button" aria-label={`Ziel ${z.titel} entfernen`} onClick={() => zielEntfernen(diagnoseCode, z.id)}
                          className="ui-fokusring cursor-pointer flex items-center justify-center"
                          style={{ width: 26, height: 26, borderRadius: "var(--radius-pill)", background: "none", border: "var(--border-thin) solid var(--border-default)", color: "var(--text-tertiary)" }}>
                          <X style={{ width: 13, height: 13 }} />
                        </button>
                      </>
                    ) : (
                      <PillKnopf primaer label="Übernehmen" onClick={() =>
                        zielUebernehmen({ zielId: z.id, diagnoseCode, titel: z.titel, eigenes: false })} />
                    )}
                  </div>
                  {andereTitel && (
                    <div style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", marginTop: 2 }}>
                      Dient auch: {andereTitel}
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
}

/* ══════════════════════════════════════════
   SCHRITT 3 — Massnahmenauswahl
   ══════════════════════════════════════════ */
function MassnahmenAuswahl({ diagnoseCode, zielId, zielTitel }: {
  diagnoseCode: DiagnoseCode; zielId: string; zielTitel: string;
}) {
  const plan = usePlan();
  const interventionen = useMemo(() => interventionenZuZiel(diagnoseCode, zielId), [diagnoseCode, zielId]);

  /* Gruppiert nach Katalogkategorie der Standardposition; dialogabhängige
     und positionslose Interventionen bilden eigene Gruppen. */
  const gruppen = useMemo(() => {
    const je = new Map<string, typeof interventionen>();
    for (const i of interventionen) {
      const g = katalogGruppe(i.id);
      je.set(g, [...(je.get(g) ?? []), i]);
    }
    return [...je.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [interventionen]);

  return (
    <div>
      <KontextKarte
        zeilen={[
          <><strong>{zielTitel}</strong> · Diagnose {diagnoseCode} · {interventionen.length} {interventionen.length === 1 ? "Intervention" : "Interventionen"}</>,
        ]}
      />

      {interventionen.length === 0 ? (
        <div style={{ ...KARTE, padding: "var(--space-6)", textAlign: "center" }}>
          <div style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>
            Keine Interventionen im Katalog
          </div>
        </div>
      ) : gruppen.map(([gruppe, liste]) => (
        <div key={gruppe} style={{ marginBottom: 12 }}>
          <div style={{ fontSize: "var(--text-micro)", fontWeight: 500, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
            {gruppe}
          </div>
          <div className="flex flex-col" style={{ gap: 8 }}>
            {liste.map(i => {
              const bestehend = plan.massnahmen.find(m => m.interventionId === i.id) ?? null;
              const mitDiesem = bestehend?.zielBezuege.some(b => b.diagnoseCode === diagnoseCode && b.zielId === zielId) ?? false;
              return (
                <div key={i.id} data-interventionwahl={i.id} style={{ ...KARTE, padding: "9px 12px" }}>
                  <div className="flex items-center" style={{ gap: 8 }}>
                    <span className="flex-1 min-w-0" style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>{i.titel}</span>
                    {mitDiesem ? (
                      <>
                        <ImPlanMarke />
                        <button type="button" aria-label={`Verknüpfung von ${i.titel} mit diesem Ziel lösen`}
                          onClick={() => massnahmenBezugLoesen(i.id, { diagnoseCode, zielId })}
                          className="ui-fokusring cursor-pointer flex items-center justify-center"
                          style={{ width: 26, height: 26, borderRadius: "var(--radius-pill)", background: "none", border: "var(--border-thin) solid var(--border-default)", color: "var(--text-tertiary)" }}>
                          <X style={{ width: 13, height: 13 }} />
                        </button>
                      </>
                    ) : (
                      /* Bereits im Plan (für ein anderes Ziel): verknüpfen statt
                         doppelt übernehmen — eine Leistung wird einmal erbracht
                         und einmal verrechnet. */
                      <PillKnopf primaer={!bestehend}
                        label={bestehend ? "Mit diesem Ziel verknüpfen" : "Übernehmen"}
                        onClick={() => massnahmeVerknuepfen(i.id, i.titel, { diagnoseCode, zielId })} />
                    )}
                  </div>
                  <div style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", marginTop: 2 }}>
                    {positionsVorschau(i.id)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════
   DER RECHTE BEREICH
   ══════════════════════════════════════════ */
export function AuswahlBereich({ fokus, onFokus, caps, assessmentDatum, mandate }: {
  fokus: Fokus;
  onFokus: (f: Fokus) => void;
  caps: CapCode[];
  assessmentDatum: string;
  mandate: MandatKurz[];
}) {
  const plan = usePlan();

  /* Der Weg, den der Kontext genommen hat (Lauf 6e) — gemerkt als PAAR:
     wechselt die Diagnose, verfällt das gemerkte Ziel, denn ein Ziel, das
     zwei Diagnosen dient, gehört im Kontext zur aktuellen. */
  const [pfadKontext, setPfadKontext] = useState<PfadKontext>({ diagnoseCode: null, zielId: null });
  useEffect(() => {
    if (fokus.schritt === 2) {
      setPfadKontext(k => ({ diagnoseCode: fokus.diagnoseCode, zielId: k.diagnoseCode === fokus.diagnoseCode ? k.zielId : null }));
    } else if (fokus.schritt === 3) {
      setPfadKontext({ diagnoseCode: fokus.diagnoseCode, zielId: fokus.zielId });
    }
  }, [fokus]);

  /* Der Editor ist die zweite Rolle des Bereichs: kein Navigationspfad,
     eigene Kopfkarte, «Fertig» führt zur Auswahl zurück. */
  if (fokus.schritt === "editor") {
    const m = plan.massnahmen.find(x => x.interventionId === fokus.interventionId);
    const bezug = m?.zielBezuege[0] ?? null;
    const zielTitel = bezug
      ? plan.ziele.find(z => z.diagnoseCode === bezug.diagnoseCode && z.zielId === bezug.zielId)?.titel ?? bezug.zielId
      : "";
    return (
      <MassnahmenEditor interventionId={fokus.interventionId} mandate={mandate}
        onFertig={() => onFokus(bezug
          ? { schritt: 3, diagnoseCode: bezug.diagnoseCode, zielId: bezug.zielId, zielTitel }
          : { schritt: 1 })} />
    );
  }

  return (
    <div>
      <NavigationsPfad fokus={fokus} onFokus={onFokus} kontext={pfadKontext} />
      {fokus.schritt === 1 && (
        <DiagnoseAuswahl caps={caps} assessmentDatum={assessmentDatum}
          onUebernommen={code => onFokus({ schritt: 2, diagnoseCode: code })} />
      )}
      {fokus.schritt === 2 && (
        <ZielAuswahl diagnoseCode={fokus.diagnoseCode}
          onMassnahmen={(zielId, zielTitel) => onFokus({ schritt: 3, diagnoseCode: fokus.diagnoseCode, zielId, zielTitel })} />
      )}
      {fokus.schritt === 3 && (
        <MassnahmenAuswahl diagnoseCode={fokus.diagnoseCode} zielId={fokus.zielId} zielTitel={fokus.zielTitel} />
      )}
    </div>
  );
}
