/**
 * Die Blatt-Ansicht (Lauf 6b): das Leistungsplanungsblatt eines
 * freigegebenen Plans — lesend, druckbar, ausserhalb der App-Schale
 * (eigene Top-Level-Route), damit der Druck ohne Navigationselemente
 * herauskommt. Dieses Dokument wird bei einer Kontrolle vorgelegt.
 *
 * Es steht nur darauf, was aus dem Plan ableitbar ist (blatt.ts). Wo die
 * Kassenstrecke später Felder liefert (ärztliche Unterschrift,
 * Kostengutsprache, Gültigkeitsende, Zustandskette), stehen gekennzeichnete
 * Platzhalter mit Verweis — keine leeren Felder, keine geratenen Werte.
 */
import { Link, useParams, useSearchParams } from "react-router";
import { ArrowLeft, Printer } from "lucide-react";
import { usePlan } from "../../../lib/pflegeplan/plan-store";
import { blattAbleiten, KLV_LABEL, type BlattTraeger } from "../../../lib/pflegeplan/blatt";
import { getPatient } from "../../../lib/patienten/store";
import { useMandate } from "../../../lib/mandate/store";
import { GESETZESGRUNDLAGE } from "../../../lib/stammdaten/mandat";
import { datumAnzeige } from "./gemeinsam";

const ZELLE: React.CSSProperties = {
  padding: "6px 8px", fontSize: "var(--text-meta)", color: "var(--text-primary)",
  borderBottom: "var(--border-thin) solid var(--border-default)", verticalAlign: "top", textAlign: "left",
};
const KOPFZELLE: React.CSSProperties = {
  ...ZELLE, fontSize: "var(--text-micro)", fontWeight: 500, color: "var(--text-tertiary)",
  textTransform: "uppercase", letterSpacing: "0.04em",
};

function TraegerZeile({ traeger }: { traeger: BlattTraeger[] }) {
  if (traeger.length === 0) return null;
  return (
    <div data-blatt-traeger style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", marginTop: 3, lineHeight: 1.5 }}>
      Begründet durch: {traeger.map((t, i) => (
        <span key={`${t.diagnoseCode}|${t.zielId}`}>
          {i > 0 && " · "}{t.diagnoseCode} {t.diagnoseTitel} — «{t.zielTitel}»
        </span>
      ))}
    </div>
  );
}

/** Gekennzeichneter Platzhalter der Kassenstrecke — sichtbar fehlend statt leer. */
function Platzhalter({ label, verweis }: { label: string; verweis: string }) {
  return (
    <div data-blatt-platzhalter className="flex items-baseline" style={{ gap: 8, padding: "4px 0" }}>
      <span style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", minWidth: 200 }}>{label}</span>
      <span style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", fontStyle: "italic" }}>
        Platzhalter — {verweis}
      </span>
    </div>
  );
}

export function BlattAnsicht() {
  const { patientId } = useParams();
  const [searchParams] = useSearchParams();
  /* Rücksprung in den Einbettungs-Kontext (Onboarding-Tab, Patient360) —
     ohne Angabe zurück zur eigenständigen Plan-Route (Lauf 6c). */
  const zurueck = searchParams.get("returnTo") ?? `/pflegeplan/${patientId}`;
  const plan = usePlan();
  const patient = patientId ? getPatient(patientId) : undefined;
  const alleMandate = useMandate();
  const mandat = alleMandate.find(x => x.patientId === patientId && !x.ende) ?? null;
  const mandatLabel = mandat
    ? (GESETZESGRUNDLAGE.find(g => g.code === mandat.gesetzesgrundlage)?.label ?? mandat.gesetzesgrundlage)
    : "—";
  const fassung = plan.fassungen[plan.fassungen.length - 1] ?? null;

  if (plan.status !== "veroeffentlicht" || !fassung) {
    return (
      <div style={{ maxWidth: 560, margin: "80px auto", padding: "0 24px", textAlign: "center" }}>
        <div style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", marginBottom: 6 }}>
          Ein Entwurf trägt kein Blatt
        </div>
        <p style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 14 }}>
          Es entsteht mit dem Veröffentlichen.
        </p>
        <Link to={zurueck} className="ui-fokusring inline-flex items-center"
          style={{ gap: 6, padding: "8px 18px", borderRadius: "var(--radius-pill)", background: "var(--brand-primary)", color: "var(--text-on-dark)", fontSize: "var(--text-small)", fontWeight: 500, textDecoration: "none" }}>
          <ArrowLeft style={{ width: 13, height: 13 }} /> Zum Plan
        </Link>
      </div>
    );
  }

  const blatt = blattAbleiten(plan);
  const uebergangene = plan.pruefung?.befunde.filter(b => b.uebergehung !== null) ?? [];
  const blattArt = plan.fassungen.length === 1 ? "Erstabklärung" : "Folgeabklärung";

  return (
    <div data-blatt style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
      {/* Druckregeln: A4, kein Chrome, keine zerrissenen Zeilen. */}
      <style>{`
        @media print {
          @page { size: A4; margin: 14mm 12mm; }
          .blatt-nur-schirm { display: none !important; }
          [data-blatt] { background: #fff !important; }
          [data-blatt-bogen] { max-width: none !important; padding: 0 !important; margin: 0 !important; }
          table { page-break-inside: auto; }
          tr, [data-blatt-zeile] { page-break-inside: avoid; }
          section { page-break-inside: avoid; }
        }
      `}</style>

      {/* Bedienleiste — nur am Schirm. */}
      <div className="blatt-nur-schirm flex items-center" style={{ gap: 10, padding: "12px 24px", borderBottom: "var(--border-thin) solid var(--border-default)", background: "var(--bg-elevated)" }}>
        <Link to={zurueck} className="ui-fokusring inline-flex items-center"
          style={{ gap: 5, fontSize: "var(--text-small)", fontWeight: 500, color: "var(--text-secondary)", textDecoration: "none" }}>
          <ArrowLeft style={{ width: 13, height: 13 }} /> Zum Plan
        </Link>
        <button type="button" onClick={() => window.print()} data-blatt-drucken
          className="ui-fokusring cursor-pointer inline-flex items-center"
          style={{ gap: 6, marginLeft: "auto", padding: "6px 16px", borderRadius: "var(--radius-pill)", background: "var(--brand-primary)", color: "var(--text-on-dark)", border: "none", fontSize: "var(--text-small)", fontWeight: 500 }}>
          <Printer style={{ width: 13, height: 13 }} /> Drucken
        </button>
      </div>

      <div data-blatt-bogen style={{ maxWidth: 820, margin: "0 auto", padding: "22px 24px 48px" }}>
        {/* ── Kopf ── */}
        <header data-blatt-kopf style={{ marginBottom: 16 }}>
          <div style={{ fontSize: "var(--text-h3)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>
            Leistungsplanungsblatt
          </div>
          <div className="flex flex-wrap" style={{ gap: "4px 24px", marginTop: 8 }}>
            <div style={{ fontSize: "var(--text-meta)", color: "var(--text-primary)" }}>
              <span style={{ color: "var(--text-tertiary)" }}>Klient: </span>
              {patient ? `${patient.nachname}, ${patient.vorname}` : patientId}
              {patient?.geburtsdatum && ` · geb. ${datumAnzeige(patient.geburtsdatum)}`}
            </div>
            <div style={{ fontSize: "var(--text-meta)", color: "var(--text-primary)" }}>
              <span style={{ color: "var(--text-tertiary)" }}>Mandat: </span>{mandatLabel}
            </div>
            <div style={{ fontSize: "var(--text-meta)", color: "var(--text-primary)" }}>
              <span style={{ color: "var(--text-tertiary)" }}>Fassung: </span>{fassung.nummer}
              {" · freigegeben von "}{fassung.autorin}{" am "}{datumAnzeige(fassung.datum)}
            </div>
            <div style={{ fontSize: "var(--text-meta)", color: "var(--text-primary)" }}>
              <span style={{ color: "var(--text-tertiary)" }}>Gültig: </span>
              ab {datumAnzeige(fassung.datum)} · <span style={{ fontStyle: "italic", color: "var(--text-tertiary)" }}>Ende: entsteht mit der ärztlichen Anordnung (Kassenstrecke)</span>
            </div>
            <div data-blatt-art style={{ fontSize: "var(--text-meta)", color: "var(--text-primary)" }}>
              <span style={{ color: "var(--text-tertiary)" }}>Blattart: </span>{blattArt}
              <span style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", fontStyle: "italic" }}>
                {" "}(vorläufig — aus der Fassungsnummer abgeleitet; Unterscheidungsmerkmal offen, siehe Fachmodell)
              </span>
            </div>
          </div>
        </header>

        {/* ── Die Leistungen je KLV-Kategorie ── */}
        {blatt.abschnitte.map(a => (
          <section key={a.klv} data-blatt-abschnitt={a.klv} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", marginBottom: 4 }}>
              {KLV_LABEL[a.klv]}
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ ...KOPFZELLE, width: "34%" }}>Position</th>
                  <th style={{ ...KOPFZELLE, width: "30%" }}>Häufigkeit · Dauer</th>
                  <th style={{ ...KOPFZELLE, width: "24%" }}>Qualifikation</th>
                  <th style={{ ...KOPFZELLE, width: "12%", textAlign: "right" }}>Min/Woche</th>
                </tr>
              </thead>
              <tbody>
                {a.zeilen.map(z => (
                  <tr key={z.nummer} data-blatt-zeile={z.nummer}>
                    <td style={ZELLE}>
                      <span style={{ fontVariantNumeric: "tabular-nums", color: "var(--brand-primary)", fontWeight: 500 }}>{z.nummer}</span>{" "}{z.bezeichnung}
                      <TraegerZeile traeger={z.traeger} />
                    </td>
                    <td style={ZELLE}>
                      {z.teile.map((t, i) => (
                        <div key={i} style={{ padding: i > 0 ? "3px 0 0" : 0 }}>
                          <div style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>{t.massnahmeTitel}</div>
                          {t.haeufigkeit ?? "— nicht terminiert"}{t.dauerMin !== null && ` · ${t.dauerMin} min`}
                        </div>
                      ))}
                    </td>
                    <td style={ZELLE}>
                      {z.teile.map((t, i) => (
                        <div key={i} style={{ padding: i > 0 ? "3px 0 0" : 0 }}>
                          {z.teile.length > 1 && (
                            <div style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>{t.massnahmeTitel}</div>
                          )}
                          {t.qualifikation ?? "—"}
                          {t.katalogMinimum && (
                            <span style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}> · Katalogminimum: {t.katalogMinimum}</span>
                          )}
                        </div>
                      ))}
                    </td>
                    <td style={{ ...ZELLE, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                      {Math.round(z.wochenMin)}
                    </td>
                  </tr>
                ))}
                <tr data-blatt-summe={a.klv}>
                  <td colSpan={3} style={{ ...ZELLE, fontWeight: 500, borderBottom: "none" }}>Summe {KLV_LABEL[a.klv].split(" — ")[0]}</td>
                  <td style={{ ...ZELLE, textAlign: "right", fontWeight: 500, fontVariantNumeric: "tabular-nums", borderBottom: "none" }}>
                    {Math.round(a.summeMin)}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>
        ))}

        <div data-blatt-gesamt className="flex items-baseline" style={{ gap: 8, padding: "8px 8px 10px", borderTop: "2px solid var(--text-primary)", marginBottom: 16 }}>
          <span style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>
            Gesamt pro Woche
          </span>
          <span style={{ marginLeft: "auto", fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", fontVariantNumeric: "tabular-nums", color: "var(--text-primary)" }}>
            {Math.round(blatt.gesamtWochenMin)} min = {(blatt.gesamtWochenMin / 60).toFixed(2)} h/Woche
          </span>
        </div>

        {/* ── Einmalige Leistungen: separat in Minuten, nicht in der Woche ── */}
        {blatt.einmalige.length > 0 && (
          <section data-blatt-einmalig style={{ marginBottom: 16 }}>
            <div style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", marginBottom: 2 }}>
              Einmalige Leistungen
            </div>
            <div style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", marginBottom: 4 }}>
              Zählen nicht zur Wochensumme; ausgewiesen in Minuten je Einsatz.
            </div>
            {blatt.einmalige.map(e => (
              <div key={`${e.nummer}|${e.massnahmeTitel}`} style={{ padding: "5px 0", borderTop: "var(--border-thin) solid var(--border-default)" }}>
                <div className="flex items-baseline" style={{ gap: 8, fontSize: "var(--text-meta)", color: "var(--text-primary)" }}>
                  <span><span style={{ fontVariantNumeric: "tabular-nums", color: "var(--brand-primary)", fontWeight: 500 }}>{e.nummer}</span> {e.bezeichnung}</span>
                  <span style={{ marginLeft: "auto", fontVariantNumeric: "tabular-nums" }}>
                    {e.datum ? datumAnzeige(e.datum) : "ohne Datum"}{e.minuten !== null && ` · ${e.minuten} min`}
                  </span>
                </div>
                <TraegerZeile traeger={e.traeger} />
              </div>
            ))}
          </section>
        )}

        {/* ── Nicht durch uns erbracht: Bedarf ohne Verrechnung ── */}
        {blatt.nichtErbracht.length > 0 && (
          <section data-blatt-dritte style={{ marginBottom: 16 }}>
            <div style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", marginBottom: 2 }}>
              Nicht durch uns erbracht
            </div>
            <div style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", marginBottom: 4 }}>
              Festgestellter Bedarf ausserhalb unserer Verrechnung — steht auf dem Blatt, zählt nicht in den Summen.
            </div>
            {blatt.nichtErbracht.map(n => (
              <div key={n.massnahmeTitel} style={{ padding: "5px 0", borderTop: "var(--border-thin) solid var(--border-default)" }}>
                <div className="flex items-baseline" style={{ gap: 8, fontSize: "var(--text-meta)", color: "var(--text-primary)" }}>
                  <span>{n.massnahmeTitel}{n.positionsNummer && <span style={{ color: "var(--text-tertiary)" }}> · Position {n.positionsNummer}</span>}</span>
                  <span style={{ marginLeft: "auto", color: "var(--text-secondary)" }}>{n.erbringerLabel}</span>
                </div>
                {n.begruendung && (
                  <div style={{ fontSize: "var(--text-micro)", color: "var(--text-secondary)", marginTop: 1 }}>{n.begruendung}</div>
                )}
                <TraegerZeile traeger={n.traeger} />
              </div>
            ))}
          </section>
        )}

        {/* ── Begründete Abweichungen: was eine Kontrolle zuerst liest ── */}
        <section data-blatt-abweichungen style={{ marginBottom: 16 }}>
          <div style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", marginBottom: 2 }}>
            Begründete Abweichungen
          </div>
          {uebergangene.length === 0 ? (
            <div style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>
              Der Plan wurde ohne offene Befunde freigegeben — nichts wurde übergangen.
            </div>
          ) : uebergangene.map(b => (
            <div key={b.id} style={{ padding: "5px 0", borderTop: "var(--border-thin) solid var(--border-default)" }}>
              <div style={{ fontSize: "var(--text-meta)", color: "var(--text-primary)" }}>{b.titel}</div>
              <div style={{ fontSize: "var(--text-micro)", color: "var(--text-secondary)", marginTop: 1, lineHeight: 1.5 }}>{b.uebergehung!.text}</div>
              <div style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", marginTop: 1 }}>
                {b.uebergehung!.autorin} · {datumAnzeige(b.uebergehung!.datum)}
              </div>
            </div>
          ))}
        </section>

        {/* ── Platzhalter der Kassenstrecke ── */}
        <section style={{ borderTop: "var(--border-thin) solid var(--border-default)", paddingTop: 8 }}>
          <div style={{ fontSize: "var(--text-micro)", fontWeight: 500, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
            Kassenstrecke — entsteht in späteren Läufen
          </div>
          <Platzhalter label="Ärztliche Anordnung und Unterschrift" verweis="Arzt-Strecke, siehe Fachmodell (Zustandskette 3–4)" />
          <Platzhalter label="Kostengutsprache und bewilligte Menge" verweis="Kassen-Strecke, siehe Fachmodell (Geplant gegen bewilligt)" />
          <Platzhalter label="Zustand des Blattes (Entwurf … Entscheid)" verweis="Zustandskette, siehe Fachmodell" />
        </section>
      </div>
    </div>
  );
}
