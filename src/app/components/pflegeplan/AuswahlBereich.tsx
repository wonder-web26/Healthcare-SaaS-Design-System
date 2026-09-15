/**
 * Der Auswahlbereich (links seit dem A/B-Entscheid — Übernehmen in
 * Leserichtung, der Plan wächst rechts): die Auswahl zum aktuellen Fokus.
 * Oben die KATEGORIE-REITER (Diagnosen · Ziele · Massnahmen, blockiert nur
 * was leer liefe) mit beschrifteten Kontext-Auswahlfeldern, die die
 * Herkunfts-Kennzahlen der aktiven Liste gleich mittragen, dann die Liste
 * der Kategorie.
 *
 * Alle Daten kommen über die Vertragsabfragen aus src/lib/pflegeplan/ —
 * kein Zugriff unter dem Vertrag vorbei; der Pfad selbst liest nur den
 * Plan-Zustand.
 */
import { useEffect, useMemo, useState } from "react";
import { Check, Search, X } from "lucide-react";
import {
  diagnoseVorschlaege, zieleZuDiagnose, interventionenZuZiel,
  ausgeschlosseneZiele, unbehandelteCaps,
} from "../../../lib/pflegeplan/mock-adapter";
import type { CapCode, DiagnoseCode, DiagnoseVorschlag } from "../../../lib/pflegeplan/vertrag";
import {
  usePlan, diagnoseUebernehmen, diagnoseVerwerfen, verwerfungZuruecknehmen, nachPrioritaet,
  diagnosePriorisieren,
  zielUebernehmen, zielEntfernen, eigenesZielHinzufuegen, massnahmeVerknuepfen,
  massnahmenBezugLoesen, type VerwerfGrund,
} from "../../../lib/pflegeplan/plan-store";
import { useCurrentUser } from "../../auth";
import { GEGENWART_ISO } from "../../../lib/gegenwart";
import type { MandatKurz } from "../../../lib/pflegeplan/planung";
import { MassnahmenEditor } from "./MassnahmenEditor";
import { InlineSelect } from "../ui/InlineSelect";
import { type Fokus, TypMarke, positionsVorschau, katalogGruppe, datumAnzeige } from "./gemeinsam";

const KARTE: React.CSSProperties = {
  background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)",
  borderRadius: "var(--radius-card)",
};

const VERWERF_GRUENDE: VerwerfGrund[] = [
  "Nicht zutreffend", "Wird anderweitig abgedeckt", "Bereits im Plan enthalten", "Klientin lehnt ab",
];

const TOP_SICHTBAR = 4;

/* ── Kategorie-Reiter: Diagnosen · Ziele · Massnahmen ─────────────────────
   Drei echte Reiter statt Pfad und Diagnostik-Zeremonie. Blockiert ist
   nur, was leer liefe — «Ziele» ohne Diagnose im Plan, «Massnahmen» ohne
   Ziel an der Kontext-Diagnose — mit Grund am Reiter. Der Kontext (welche
   Diagnose, welches Ziel) wechselt über beschriftete Auswahlfelder unter
   den Reitern; die Ziffern 1/2/3 springen weiterhin.

   DIE KENNUNG IST DAS PAAR: ein Ziel, das zwei Diagnosen dient, gehört im
   Kontext zur aktuellen Diagnose — gemerkt wird (diagnoseCode, zielId),
   nie die Ziel-Kennung allein (istErsterBezug-Regel, planung.ts). */

interface PfadKontext {
  diagnoseCode: DiagnoseCode | null;
  zielId: string | null;
}

function KategorieLeiste({ fokus, onFokus, kontext }: {
  fokus: Fokus;
  onFokus: (f: Fokus) => void;
  kontext: PfadKontext;
}) {
  const plan = usePlan();

  /* Kontext auflösen aus dem Plan-Zustand. */
  const sortiert = nachPrioritaet(plan.diagnosen);
  const kontextDiagnose = plan.diagnosen.find(d => d.code === kontext.diagnoseCode) ?? sortiert[0] ?? null;
  const zieleHier = kontextDiagnose ? plan.ziele.filter(z => z.diagnoseCode === kontextDiagnose.code) : [];
  const kontextZiel = zieleHier.find(z => z.zielId === kontext.zielId) ?? zieleHier[0] ?? null;
  const massnahmenZahl = (diagnoseCode: string, zielId: string) =>
    plan.massnahmen.filter(m => m.zielBezuege.some(b => b.diagnoseCode === diagnoseCode && b.zielId === zielId)).length;

  /* Herkunfts-Kennzahlen der aktiven Liste — sie stehen im Auswahlfeld
     selbst, nicht in einer zweiten Karte darunter. */
  const zielKatalog = kontextDiagnose ? zieleZuDiagnose(kontextDiagnose.code).length : 0;
  const zielAusgeschlossen = kontextDiagnose ? ausgeschlosseneZiele(kontextDiagnose.code).length : 0;
  const interventionenZahl = kontextDiagnose && kontextZiel
    ? interventionenZuZiel(kontextDiagnose.code, kontextZiel.zielId).length : 0;

  const zieleBegehbar = kontextDiagnose !== null;
  const massnahmenBegehbar = zieleBegehbar && kontextZiel !== null;
  const aktiv = fokus.schritt === 1 || fokus.schritt === 2 || fokus.schritt === 3 ? fokus.schritt : 3;

  const zuStufe = (nr: 1 | 2 | 3) => {
    if (nr === 1) onFokus({ schritt: 1 });
    else if (nr === 2 && zieleBegehbar && kontextDiagnose) onFokus({ schritt: 2, diagnoseCode: kontextDiagnose.code });
    else if (nr === 3 && massnahmenBegehbar && kontextDiagnose && kontextZiel) {
      onFokus({ schritt: 3, diagnoseCode: kontextDiagnose.code, zielId: kontextZiel.zielId, zielTitel: kontextZiel.titel });
    }
  };

  /* Diagnosewechsel: der Reiter bleibt, die Liste tauscht sich aus. Nur
     wenn die neue Diagnose kein Ziel trägt, fällt die Ansicht auf «Ziele»
     zurück (kein toter Reiter «Massnahmen»). */
  const diagnoseWechseln = (code: DiagnoseCode) => {
    const zieleDort = plan.ziele.filter(z => z.diagnoseCode === code);
    if (aktiv === 3 && zieleDort.length > 0) {
      onFokus({ schritt: 3, diagnoseCode: code, zielId: zieleDort[0].zielId, zielTitel: zieleDort[0].titel });
    } else {
      onFokus({ schritt: 2, diagnoseCode: code });
    }
  };

  /* Tastatur: 1/2/3 springen auf den Reiter — nie, während ein Eingabefeld
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

  const reiter: { nr: 1 | 2 | 3; label: string; begehbar: boolean; grund?: string }[] = [
    { nr: 1, label: "Diagnosen", begehbar: true },
    { nr: 2, label: "Ziele", begehbar: zieleBegehbar, grund: zieleBegehbar ? undefined : "Zuerst eine Diagnose übernehmen." },
    {
      nr: 3, label: "Massnahmen", begehbar: massnahmenBegehbar,
      grund: massnahmenBegehbar ? undefined
        : kontextDiagnose === null ? "Zuerst eine Diagnose übernehmen."
          : `«${kontextDiagnose.titel}» trägt noch kein Ziel.`,
    },
  ];

  return (
    <div style={{ marginBottom: 10 }}>
      <div role="tablist" data-kategorien className="flex items-center" style={{ gap: 16, borderBottom: "var(--border-thin) solid var(--border-default)", marginBottom: 10 }}>
        {reiter.map(r => (
          <button key={r.nr} type="button" role="tab" data-kategorie={r.nr}
            aria-selected={aktiv === r.nr} aria-disabled={!r.begehbar} title={r.grund}
            onClick={() => zuStufe(r.nr)}
            className={r.begehbar ? "ui-fokusring cursor-pointer" : ""}
            style={{
              background: "none", border: "none", fontFamily: "inherit", padding: "2px 0 8px",
              fontSize: "var(--text-small)", fontWeight: aktiv === r.nr ? "var(--weight-medium)" : "var(--weight-regular)",
              color: !r.begehbar ? "var(--text-tertiary)" : aktiv === r.nr ? "var(--brand-primary)" : "var(--text-secondary)",
              borderBottom: aktiv === r.nr ? "2px solid var(--brand-primary)" : "2px solid transparent",
              marginBottom: -1, cursor: r.begehbar ? "pointer" : "default",
            }}>
            {r.label}
          </button>
        ))}
      </div>

      {/* Der Kontext als beschriftete Auswahl. Das Feld der aktiven Liste
          trägt ihre Herkunfts-Kennzahlen gleich mit — Auswahl und Kennzahl
          sind EINE Komponente, keine zweite Karte darunter. */}
      {aktiv >= 2 && kontextDiagnose && (
        <div className="flex flex-col" style={{ gap: 6 }}>
          <div data-kontext-diagnose className="flex items-center" style={{ gap: 8 }}>
            <span style={{ width: 62, flexShrink: 0, fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>Diagnose</span>
            <InlineSelect value={kontextDiagnose.code}
              onChange={v => diagnoseWechseln(v)}
              options={sortiert.map(d => {
                const n = plan.ziele.filter(z => z.diagnoseCode === d.code).length;
                return { value: d.code, label: `${d.titel}${d.prioritaet === "wichtig" ? " · wichtig" : ""} · ${n} ${n === 1 ? "Ziel" : "Ziele"}` };
              })}
              anzeige={
                <>
                  <div className="truncate" style={{ fontWeight: "var(--weight-medium)" }}>
                    {kontextDiagnose.titel} ({kontextDiagnose.code})
                  </div>
                  {aktiv === 2 && (
                    <div style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", marginTop: 1 }}>
                      {zielKatalog} {zielKatalog === 1 ? "Ziel" : "Ziele"} · {zielAusgeschlossen} ausgeschlossen · {zieleHier.length} im Plan
                    </div>
                  )}
                </>
              }
              style={{ flex: 1, minWidth: 0 }} />
          </div>
          {aktiv === 3 && kontextZiel && (
            <div data-kontext-ziel className="flex items-center" style={{ gap: 8 }}>
              <span style={{ width: 62, flexShrink: 0, fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>Ziel</span>
              <InlineSelect value={kontextZiel.zielId}
                onChange={v => {
                  const z = zieleHier.find(x => x.zielId === v);
                  if (z) onFokus({ schritt: 3, diagnoseCode: kontextDiagnose.code, zielId: z.zielId, zielTitel: z.titel });
                }}
                options={zieleHier.map(z => {
                  const n = massnahmenZahl(kontextDiagnose.code, z.zielId);
                  return { value: z.zielId, label: `${z.titel} · ${n} ${n === 1 ? "Massnahme" : "Massnahmen"}` };
                })}
                anzeige={
                  <>
                    <div className="truncate" style={{ fontWeight: "var(--weight-medium)" }}>{kontextZiel.titel}</div>
                    <div style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", marginTop: 1 }}>
                      {interventionenZahl} {interventionenZahl === 1 ? "Intervention" : "Interventionen"} · {massnahmenZahl(kontextDiagnose.code, kontextZiel.zielId)} im Plan
                    </div>
                  </>
                }
                style={{ flex: 1, minWidth: 0 }} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Kontextkarte ──────────────────────────────────────────────────────────
   Sagt, WOHER eine Liste kommt — die Kategorie-Reiter sagen, WO man ist. */
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
function DiagnoseAuswahl({ caps, assessmentDatum }: {
  caps: CapCode[]; assessmentDatum: string;
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

  const ziele = useMemo(() => zieleZuDiagnose(diagnoseCode), [diagnoseCode]);
  const imPlanHier = plan.ziele.filter(z => z.diagnoseCode === diagnoseCode);

  const q = suche.trim().toLowerCase();
  const treffer = q ? ziele.filter(z => z.titel.toLowerCase().includes(q)) : ziele;

  return (
    <div>
      {/* Die Herkunfts-Kennzahlen (Katalog, ausgeschlossen, im Plan) stehen
          im Diagnose-Auswahlfeld der Kategorie-Leiste. */}
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
function MassnahmenAuswahl({ diagnoseCode, zielId }: {
  diagnoseCode: DiagnoseCode; zielId: string;
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
      {/* Ziel und Interventionszahl stehen im Ziel-Auswahlfeld der
          Kategorie-Leiste. */}
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
   DER AUSWAHLBEREICH
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
      <KategorieLeiste fokus={fokus} onFokus={onFokus} kontext={pfadKontext} />
      {fokus.schritt === 1 && (
        <DiagnoseAuswahl caps={caps} assessmentDatum={assessmentDatum} />
      )}
      {fokus.schritt === 2 && (
        <ZielAuswahl diagnoseCode={fokus.diagnoseCode}
          onMassnahmen={(zielId, zielTitel) => onFokus({ schritt: 3, diagnoseCode: fokus.diagnoseCode, zielId, zielTitel })} />
      )}
      {fokus.schritt === 3 && (
        <MassnahmenAuswahl diagnoseCode={fokus.diagnoseCode} zielId={fokus.zielId} />
      )}
    </div>
  );
}
