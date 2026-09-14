/**
 * Dokument-Ansicht (Lauf 5): lesen und erkennen, was ansteht.
 *
 * Einspaltig, mittig, wie ein Dokument — keine Auswahlspalte: 41 Kandidaten
 * neben einem fertigen Plan wären eine Einladung, versehentlich zu ändern.
 * Bedient wird hier nur die Zielerreichung (fünf Stufen, ein Klick); alles
 * andere führt über «Plan ändern» in die Struktur.
 */
import { Check, FileText } from "lucide-react";
import { zielBewertungsSkala } from "../../../lib/pflegeplan/mock-adapter";
import {
  usePlan, zielEinschaetzen,
  type PlanZustand, type PlanZiel, type PlanMassnahme,
} from "../../../lib/pflegeplan/plan-store";
import { massnahmenSatz, ERBRINGER, type MandatKurz } from "../../../lib/pflegeplan/planung";
import { GEGENWART_ISO } from "../../../lib/gegenwart";
import { useCurrentUser } from "../../auth";
import { TypMarke, positionsLage, planWochenSummeMin, datumAnzeige } from "./gemeinsam";

const KARTE: React.CSSProperties = {
  background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)",
  borderRadius: "var(--radius-card)",
};

const STATUS_LABEL: Record<PlanZustand["status"], string> = {
  in_arbeit: "In Arbeit",
  veroeffentlicht: "Veröffentlicht",
  aenderung_in_arbeit: "Änderung in Arbeit",
};

/**
 * Fällig = Zieldatum überschritten und keine Einschätzung erfasst.
 * Bezugsdatum ist die feste Mock-Gegenwart GEGENWART_ISO (04.08.2026) —
 * der Prototyp hat kein laufendes Heute; mit echten Daten ersetzt das
 * Systemdatum diese Konstante.
 */
function istFaellig(z: PlanZiel): boolean {
  return z.zieldatum !== "" && z.zieldatum < GEGENWART_ISO && z.einschaetzung === null;
}

/** Eindeutige Ziele in Baumreihenfolge — ein Ziel unter zwei Diagnosen ist EIN Ziel. */
function eindeutigeZiele(plan: PlanZustand): PlanZiel[] {
  const gesehen = new Set<string>();
  const aus: PlanZiel[] = [];
  for (const z of plan.ziele) {
    if (gesehen.has(z.zielId)) continue;
    gesehen.add(z.zielId);
    aus.push(z);
  }
  return aus;
}

function ZielErreichung({ z }: { z: PlanZiel }) {
  const benutzer = useCurrentUser();
  const skala = zielBewertungsSkala();
  if (z.einschaetzung) {
    const stufe = skala.find(s => s.stufe === z.einschaetzung!.stufe);
    return (
      <div className="inline-flex items-center" style={{ gap: 6, fontSize: "var(--text-meta)", color: "var(--status-success-text)" }}>
        <Check style={{ width: 12, height: 12 }} />
        Stufe {z.einschaetzung.stufe} — {stufe?.label ?? ""} · {datumAnzeige(z.einschaetzung.datum)} · {z.einschaetzung.autorin}
      </div>
    );
  }
  return (
    <div className="flex items-center flex-wrap" style={{ gap: 6 }}>
      <span style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>
        {z.zieldatum
          ? `Zieldatum ${datumAnzeige(z.zieldatum)}${istFaellig(z) ? " — überschritten, Einschätzung fällig:" : ""}`
          : "Ohne Zieldatum — die Terminierung fehlt."}
      </span>
      {z.zieldatum && skala.map(s => (
        <button key={s.stufe} type="button"
          onClick={() => zielEinschaetzen(z.zielId, { stufe: s.stufe, datum: GEGENWART_ISO, autorin: `${benutzer.vorname.charAt(0)}. ${benutzer.name}` })}
          className="ui-fokusring cursor-pointer"
          title={`${s.stufe} — ${s.label}`}
          style={{ padding: "2px 9px", borderRadius: "var(--radius-pill)", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", fontSize: "var(--text-micro)", fontWeight: 500, color: "var(--text-primary)", whiteSpace: "nowrap" }}>
          {s.stufe} {s.label}
        </button>
      ))}
    </div>
  );
}

function MassnahmenSatzZeile({ m, zielId, plan, mandate }: {
  m: PlanMassnahme; zielId: string | null; plan: PlanZustand; mandate: MandatKurz[];
}) {
  const erster = m.zielBezuege[0] ?? null;
  const istErster = zielId === null || (erster !== null && erster.zielId === zielId);
  const lage = positionsLage(m.interventionId, m.planung.detailAuswahl);
  const ersterTitel = erster ? (plan.ziele.find(z => z.zielId === erster.zielId)?.titel ?? erster.zielId) : "";
  return (
    <div style={{ padding: "5px 0 5px 16px", borderTop: "var(--border-thin) solid var(--border-default)" }}>
      <div style={{ fontSize: "var(--text-small)", color: "var(--text-primary)" }}>{m.titel}</div>
      <div style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", marginTop: 1, lineHeight: 1.5 }}>
        {istErster
          ? massnahmenSatz(m.planung, { positionsText: lage.text, vorgabeMinuten: lage.vorgabeMinuten, qualifikation: lage.qualifikation }, mandate)
              .map((t, i) => (
                <span key={i}>{i > 0 && " · "}<span style={{ fontWeight: t.fett ? "var(--weight-medium)" : "var(--weight-regular)", color: t.warn ? "var(--status-warning-text)" : "var(--text-tertiary)" }}>{t.text}</span></span>
              ))
          : `Dieselbe Leistung wie unter „${ersterTitel}", bereits gezählt`}
      </div>
    </div>
  );
}

export function DokumentAnsicht({ mandate, onPlanAendern }: {
  mandate: MandatKurz[];
  onPlanAendern: () => void;
}) {
  const plan = usePlan();
  const summeMin = planWochenSummeMin(plan.massnahmen);
  const aktuelleFassung = plan.fassungen[plan.fassungen.length - 1] ?? null;
  const faellige = eindeutigeZiele(plan).filter(istFaellig);
  const dritte = plan.massnahmen.filter(m => m.planung.erbringer !== "S");
  const ohneZuordnung = plan.massnahmen.filter(m => m.zielBezuege.length === 0);
  const eindeutigeZielZahl = new Set(plan.ziele.map(z => z.zielId)).size;

  const massnahmenVon = (code: string, zielId: string) =>
    plan.massnahmen.filter(m => m.zielBezuege.some(b => b.diagnoseCode === code && b.zielId === zielId));

  return (
    <div className="flex-1 min-h-0" style={{ overflowY: "auto" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "18px var(--space-4) var(--space-8)" }}>

        {/* ── Kopfkarte ── */}
        <div data-dok-kopf style={{ ...KARTE, padding: "14px 18px", marginBottom: 14 }}>
          <div className="flex items-start flex-wrap" style={{ gap: 10 }}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center flex-wrap" style={{ gap: 8 }}>
                <span style={{ padding: "2px 10px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-micro)", fontWeight: "var(--weight-medium)", background: plan.status === "veroeffentlicht" ? "var(--status-success-bg)" : "var(--status-warning-bg)", color: plan.status === "veroeffentlicht" ? "var(--status-success-text)" : "var(--status-warning-text)" }}>
                  {STATUS_LABEL[plan.status]}
                </span>
                {aktuelleFassung && (
                  <span style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>
                    Fassung {aktuelleFassung.nummer} · gültig seit {datumAnzeige(aktuelleFassung.datum)} · freigegeben von {aktuelleFassung.autorin}
                  </span>
                )}
              </div>
              <div style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", marginTop: 6 }}>
                {mandate.length === 1 ? "Mandat" : "Mandate"}: {mandate.map(m => m.label).join(" · ") || "—"} ·
                Geplant: {(summeMin / 60).toFixed(2)} h/Woche
              </div>
              <div style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)", marginTop: 2 }}>
                {plan.diagnosen.length} Diagnosen · {eindeutigeZielZahl} Ziele · {plan.massnahmen.length} Massnahmen
              </div>
            </div>
            <div className="flex items-center shrink-0" style={{ gap: 8 }}>
              <button type="button" onClick={onPlanAendern} className="ui-fokusring cursor-pointer"
                style={{ padding: "7px 16px", borderRadius: "var(--radius-pill)", background: "var(--brand-primary)", color: "var(--text-on-dark)", border: "none", fontSize: "var(--text-small)", fontWeight: 500 }}>
                Plan ändern
              </button>
              {/* Entsteht in Lauf 6 — als kommend markiert, keine tote Fläche. */}
              <button type="button" disabled title="Entsteht in Lauf 6 — das Blatt wird aus diesem Plan abgeleitet"
                className="inline-flex items-center"
                style={{ gap: 5, padding: "7px 16px", borderRadius: "var(--radius-pill)", background: "var(--bg-secondary)", color: "var(--text-tertiary)", border: "var(--border-thin) solid var(--border-default)", fontSize: "var(--text-small)", fontWeight: 500, cursor: "default" }}>
                <FileText style={{ width: 12, height: 12 }} /> Leistungsplanungsblatt (kommt)
              </button>
            </div>
          </div>
        </div>

        {/* ── Was ansteht — der Grund, auf einen veröffentlichten Plan
              zurückzukommen. Ist nichts fällig, entfällt der Abschnitt. ── */}
        {faellige.length > 0 && (
          <div data-dok-ansteht style={{ ...KARTE, borderColor: "var(--status-warning)", padding: "12px 18px", marginBottom: 14 }}>
            <div style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--status-warning-text)", marginBottom: 6 }}>
              Was ansteht — {faellige.length} {faellige.length === 1 ? "Ziel" : "Ziele"} zur Evaluation fällig
            </div>
            {faellige.map(z => (
              <div key={z.zielId} className="flex items-center flex-wrap" style={{ gap: 8, padding: "4px 0", fontSize: "var(--text-meta)", color: "var(--text-primary)" }}>
                <span className="flex-1 min-w-0">{z.titel}</span>
                <span style={{ color: "var(--status-warning-text)", whiteSpace: "nowrap" }}>Zieldatum {datumAnzeige(z.zieldatum)} überschritten</span>
              </div>
            ))}
            <div style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", marginTop: 4 }}>
              Die Einschätzung wird unten am Ziel erfasst — fünf Stufen, ein Klick.
            </div>
          </div>
        )}

        {/* ── Der Plan ── */}
        {plan.diagnosen.map(d => {
          const ziele = plan.ziele.filter(z => z.diagnoseCode === d.code);
          return (
            <div key={d.code} style={{ ...KARTE, padding: "12px 18px", marginBottom: 12 }}>
              <div className="flex items-center" style={{ gap: 8 }}>
                <span style={{ fontSize: "var(--text-meta)", fontVariantNumeric: "tabular-nums", color: "var(--brand-primary)", fontWeight: 500 }}>{d.code}</span>
                <span className="flex-1 min-w-0" style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>{d.titel}</span>
                <TypMarke typ={d.typ} />
              </div>
              {ziele.length === 0 && (
                <div style={{ fontSize: "var(--text-micro)", color: "var(--status-warning-text)", marginTop: 4 }}>Ohne Ziel.</div>
              )}
              {ziele.map(z => (
                <div key={z.zielId} data-dok-ziel={z.zielId} style={{ marginTop: 10, paddingLeft: 8, borderLeft: "2px solid var(--border-default)" }}>
                  <div style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>
                    {z.titel}{z.eigenes && <span style={{ fontWeight: "var(--weight-regular)", color: "var(--text-tertiary)" }}> · selbst formuliert</span>}
                  </div>
                  <div style={{ marginTop: 3 }}><ZielErreichung z={z} /></div>
                  {massnahmenVon(d.code, z.zielId).map(m => (
                    <MassnahmenSatzZeile key={m.interventionId} m={m} zielId={z.zielId} plan={plan} mandate={mandate} />
                  ))}
                </div>
              ))}
            </div>
          );
        })}

        {/* ── Nicht durch uns erbracht ── */}
        {dritte.length > 0 && (
          <div data-dok-dritte style={{ ...KARTE, padding: "12px 18px", marginBottom: 12 }}>
            <div style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", marginBottom: 2 }}>
              Nicht durch uns erbracht
            </div>
            <div style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", marginBottom: 4 }}>
              Bedarf, der ausserhalb unserer Verrechnung gedeckt ist oder abgelehnt wurde.
            </div>
            {dritte.map(m => (
              <div key={m.interventionId} style={{ padding: "5px 0", borderTop: "var(--border-thin) solid var(--border-default)" }}>
                <div className="flex items-center" style={{ gap: 8 }}>
                  <span className="flex-1 min-w-0" style={{ fontSize: "var(--text-small)", color: "var(--text-primary)" }}>{m.titel}</span>
                  <span style={{ fontSize: "var(--text-micro)", color: "var(--status-warning-text)", whiteSpace: "nowrap" }}>
                    {ERBRINGER.find(e => e.code === m.planung.erbringer)?.label ?? m.planung.erbringer} · nicht verrechnet
                  </span>
                </div>
                {m.planung.erbringerNotiz.trim() && (
                  <div style={{ fontSize: "var(--text-micro)", color: "var(--text-secondary)", marginTop: 1 }}>{m.planung.erbringerNotiz}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Ohne Zielbezug ── */}
        {ohneZuordnung.length > 0 && (
          <div style={{ ...KARTE, borderStyle: "dashed", padding: "12px 18px", marginBottom: 12 }}>
            <div style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", marginBottom: 4 }}>
              Ohne Zielbezug
            </div>
            {ohneZuordnung.map(m => (
              <MassnahmenSatzZeile key={m.interventionId} m={m} zielId={null} plan={plan} mandate={mandate} />
            ))}
          </div>
        )}

        {/* ── Fassungen: eine Zählung, keine Historie ── */}
        <div data-dok-fassungen style={{ ...KARTE, padding: "12px 18px" }}>
          <div style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", marginBottom: 4 }}>
            Fassungen
          </div>
          {plan.fassungen.length === 0 ? (
            <div style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>Noch nicht veröffentlicht.</div>
          ) : plan.fassungen.map(f => (
            <div key={f.nummer} className="flex items-center" style={{ gap: 8, padding: "3px 0", fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>
              <span>Fassung {f.nummer}</span>
              <span>{datumAnzeige(f.datum)}</span>
              <span>{f.autorin}</span>
              {f.nummer === aktuelleFassung?.nummer && (
                <span style={{ padding: "1px 8px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-micro)", fontWeight: "var(--weight-medium)", background: "var(--status-success-bg)", color: "var(--status-success-text)" }}>aktuell</span>
              )}
            </div>
          ))}
          <div style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", marginTop: 6 }}>
            Eine Änderung erzeugt eine neue Fassung. Frühere Stände werden im
            Prototyp nicht gespeichert — lesbar ist nur die aktuelle Fassung.
          </div>
        </div>
      </div>
    </div>
  );
}
