/**
 * Der rechte Bereich: die Auswahl zum aktuellen Fokus. Oben die
 * Schrittanzeige, darunter die Kontextkarte (wofür gilt die Liste, woher
 * kommt sie, Weg zurück), dann die Liste des Schritts.
 *
 * Alle Daten kommen über die Vertragsabfragen aus src/lib/pflegeplan/ —
 * kein Zugriff unter dem Vertrag vorbei.
 */
import { useMemo, useState } from "react";
import { Check, Search, X } from "lucide-react";
import {
  diagnoseVorschlaege, zieleZuDiagnose, interventionenZuZiel,
  ausgeschlosseneZiele, unbehandelteCaps,
} from "../../../lib/pflegeplan/mock-adapter";
import type { CapCode, DiagnoseCode, DiagnoseVorschlag } from "../../../lib/pflegeplan/vertrag";
import {
  usePlan, diagnoseUebernehmen, diagnoseVerwerfen, verwerfungZuruecknehmen,
  zielUebernehmen, zielEntfernen, eigenesZielHinzufuegen, massnahmeVerknuepfen,
  massnahmenBezugLoesen, type VerwerfGrund,
} from "../../../lib/pflegeplan/plan-store";
import { useCurrentUser } from "../../auth";
import { GEGENWART_ISO } from "../../../lib/gegenwart";
import { type Fokus, TypMarke, positionsVorschau, katalogGruppe, datumAnzeige } from "./gemeinsam";

const KARTE: React.CSSProperties = {
  background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)",
  borderRadius: "var(--radius-card)",
};

const VERWERF_GRUENDE: VerwerfGrund[] = [
  "Nicht zutreffend", "Wird anderweitig abgedeckt", "Bereits im Plan enthalten", "Klientin lehnt ab",
];

const TOP_SICHTBAR = 4;

/* ── Schrittanzeige ────────────────────────────────────────────────────── */
function SchrittAnzeige({ fokus }: { fokus: Fokus }) {
  const schritte = [
    { nr: 1, label: "Diagnose" },
    { nr: 2, label: "Ziel" },
    { nr: 3, label: "Massnahme" },
  ];
  return (
    <div className="flex items-center" style={{ gap: 6, marginBottom: 10 }}>
      {schritte.map((s, i) => (
        <div key={s.nr} className="flex items-center" style={{ gap: 6 }}>
          {i > 0 && <span style={{ color: "var(--text-tertiary)", fontSize: "var(--text-meta)" }}>→</span>}
          <span style={{
            padding: "3px 10px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-meta)",
            fontWeight: fokus.schritt === s.nr ? "var(--weight-medium)" : "var(--weight-regular)",
            background: fokus.schritt === s.nr ? "var(--brand-primary)" : "var(--bg-secondary)",
            color: fokus.schritt === s.nr ? "var(--text-on-dark)" : "var(--text-secondary)",
          }}>
            {s.nr}. {s.label}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Kontextkarte ──────────────────────────────────────────────────────── */
function KontextKarte({ zeilen, zurueck }: { zeilen: React.ReactNode[]; zurueck?: { label: string; onClick: () => void } }) {
  return (
    <div style={{ ...KARTE, background: "var(--bg-secondary)", padding: "9px 12px", marginBottom: 10 }}>
      {zeilen.map((z, i) => (
        <div key={i} style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", lineHeight: 1.5 }}>{z}</div>
      ))}
      {zurueck && (
        <button type="button" onClick={zurueck.onClick} className="ui-fokusring cursor-pointer"
          style={{ background: "none", border: "none", padding: 0, marginTop: 4, fontFamily: "inherit", fontSize: "var(--text-meta)", fontWeight: 500, color: "var(--brand-primary)" }}>
          ← {zurueck.label}
        </button>
      )}
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
      <KontextKarte zeilen={[
        <><strong>{vorschlaege.length} Vorschläge</strong> aus {caps.length - unbehandelt.length} ausgelösten CAPs, Assessment vom {assessmentDatum}. Gerankt, nie gefiltert.</>,
        ...(unbehandelt.length > 0
          ? [<span style={{ color: "var(--status-warning-text)" }}>{unbehandelt.length} ausgelöster CAP hat keine Zuordnungsliste: {unbehandelt.join(", ")}</span>]
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
                  Keine Ziele hinterlegt — bei Risiko- und Bereitschaftsdiagnosen der Normalfall.
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
                  {imPlan ? <ImPlanMarke /> : (
                    <PillKnopf primaer label="Übernehmen" onClick={() => {
                      diagnoseUebernehmen({ code, titel: v.diagnose.titel, typ: v.diagnose.typ, belegZeile: belegZeile(v) });
                      onUebernommen(code);
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
function ZielAuswahl({ diagnoseCode, onZurueck, onMassnahmen }: {
  diagnoseCode: DiagnoseCode;
  onZurueck: () => void;
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
      <KontextKarte
        zeilen={[
          <>Ziele für <strong>{diagnose?.titel ?? diagnoseCode}</strong> ({diagnoseCode})</>,
          <>Hergeleitet über die Interventionen der Diagnose. <strong>{ziele.length} Ziele gefunden</strong>, {entfernt} durch die Ausschlussliste entfernt.</>,
          <>{imPlanHier.length} im Plan für diese Diagnose — mehrere Ziele sind der Normalfall.</>,
        ]}
        zurueck={{ label: "Zur Diagnoseauswahl", onClick: onZurueck }}
      />

      {ziele.length === 0 ? (
        <div style={{ ...KARTE, padding: "var(--space-6)", textAlign: "center" }}>
          <div style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", marginBottom: 6 }}>
            Keine hinterlegten Ziele
          </div>
          <p style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", margin: "0 auto 10px", maxWidth: "44ch", lineHeight: 1.6 }}>
            Bei Risiko- und Bereitschaftsdiagnosen ist das der Normalfall — der Katalog
            leitet Ziele über Interventionen her, und hier sind keine verknüpft.
            Ein eigenes Ziel lässt sich trotzdem formulieren.
          </p>
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
function MassnahmenAuswahl({ diagnoseCode, zielId, zielTitel, onZurueck }: {
  diagnoseCode: DiagnoseCode; zielId: string; zielTitel: string; onZurueck: () => void;
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
          <>Massnahmen für das Ziel <strong>{zielTitel}</strong></>,
          <>Verknüpft mit diesem Ziel und zugleich mit der Diagnose <strong>{diagnoseCode}</strong>.</>,
        ]}
        zurueck={{ label: "Zur Zielauswahl", onClick: onZurueck }}
      />

      {interventionen.length === 0 ? (
        <div style={{ ...KARTE, padding: "var(--space-6)", textAlign: "center" }}>
          <div style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", marginBottom: 6 }}>
            Keine hinterlegten Interventionen
          </div>
          <p style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", margin: "0 auto", maxWidth: "44ch", lineHeight: 1.6 }}>
            Für dieses Ziel führt der Katalog im Kontext dieser Diagnose keine
            Interventionen — bei selbst formulierten Zielen der Normalfall. Die
            Massnahme entsteht dann mit der Feinplanung.
          </p>
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
export function AuswahlBereich({ fokus, onFokus, caps, assessmentDatum }: {
  fokus: Fokus;
  onFokus: (f: Fokus) => void;
  caps: CapCode[];
  assessmentDatum: string;
}) {
  return (
    <div>
      <SchrittAnzeige fokus={fokus} />
      {fokus.schritt === 1 && (
        <DiagnoseAuswahl caps={caps} assessmentDatum={assessmentDatum}
          onUebernommen={code => onFokus({ schritt: 2, diagnoseCode: code })} />
      )}
      {fokus.schritt === 2 && (
        <ZielAuswahl diagnoseCode={fokus.diagnoseCode}
          onZurueck={() => onFokus({ schritt: 1 })}
          onMassnahmen={(zielId, zielTitel) => onFokus({ schritt: 3, diagnoseCode: fokus.diagnoseCode, zielId, zielTitel })} />
      )}
      {fokus.schritt === 3 && (
        <MassnahmenAuswahl diagnoseCode={fokus.diagnoseCode} zielId={fokus.zielId} zielTitel={fokus.zielTitel}
          onZurueck={() => onFokus({ schritt: 2, diagnoseCode: fokus.diagnoseCode })} />
      )}
    </div>
  );
}
