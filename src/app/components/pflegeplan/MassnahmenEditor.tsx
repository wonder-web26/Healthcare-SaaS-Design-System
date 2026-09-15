/**
 * Der Massnahmen-Editor (Lauf 3) — die zweite Rolle des rechten Bereichs:
 * Bearbeiten von Bestätigtem. Sichtbar anders als die Auswahl: keine
 * Schrittanzeige, eigene Kopfkarte, ein «Fertig»-Knopf zurück zur Auswahl.
 *
 * Hier entsteht die Leistungsposition — ab hier trägt der Plan
 * Abrechnungsfolgen. Eine Massnahme, die mehreren Zielen dient, hat EINEN
 * Editor und EINEN Zustand; die Satzzeile im Baum läuft live mit.
 */
import { useEffect, useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import { detaildialog, positionFuer, qualifikationsStufen } from "../../../lib/pflegeplan/mock-adapter";
import { ableitungAlsText } from "../../../lib/pflegeplan/vertrag";
import {
  usePlan, massnahmePlanen, type MassnahmenPlanung, type Wiederholung, type ErbringerCode,
} from "../../../lib/pflegeplan/plan-store";
import {
  TAGESZEIT_FENSTER, WOCHENTAG_KURZ, ERBRINGER, wochenMinuten,
  mandatAuswahlSichtbar, type MandatKurz,
} from "../../../lib/pflegeplan/planung";
import { InlineSelect } from "../ui/InlineSelect";
import type { InterventionId } from "../../../lib/pflegeplan/vertrag";

const KARTE: React.CSSProperties = {
  background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)",
  borderRadius: "var(--radius-card)",
};

const WIEDERHOLUNGEN: { value: Wiederholung; label: string }[] = [
  { value: "einmalig", label: "Einmalig" },
  { value: "taeglich", label: "Täglich" },
  { value: "werktage", label: "An Werktagen" },
  { value: "woechentlich", label: "Wöchentlich" },
  { value: "monatlich", label: "Monatlich" },
  { value: "benutzerdefiniert", label: "Benutzerdefinierte Wiederholung" },
];

/* Die Qualifikationsliste kommt aus dem Vertrag (Lauf 6) — die Ordnung der
   Leiter ist Vertragsbestandteil, eine UI-Kopie davon wäre bei der ersten
   Auswertung falsch. */

function Abschnitt({ titel, kinder }: { titel: string; kinder: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: "var(--text-micro)", fontWeight: 500, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
        {titel}
      </div>
      {kinder}
    </div>
  );
}

function Chip({ label, aktiv, onClick }: { label: string; aktiv: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={aktiv} className="ui-fokusring cursor-pointer"
      style={{
        padding: "4px 12px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-meta)", fontWeight: 500,
        background: aktiv ? "var(--brand-primary)" : "var(--bg-elevated)",
        color: aktiv ? "var(--text-on-dark)" : "var(--text-primary)",
        border: aktiv ? "var(--border-thin) solid transparent" : "var(--border-thin) solid var(--border-default)",
        whiteSpace: "nowrap",
      }}>
      {label}
    </button>
  );
}

const feldStil: React.CSSProperties = {
  height: 32, padding: "0 10px", borderRadius: "var(--radius-card)",
  border: "var(--border-thin) solid var(--border-default)", background: "var(--bg-primary)",
  fontSize: "var(--text-small)", color: "var(--text-primary)", fontFamily: "inherit", outline: "none",
};

export function MassnahmenEditor({ interventionId, mandate, onFertig }: {
  interventionId: InterventionId;
  mandate: MandatKurz[];
  onFertig: () => void;
}) {
  const plan = usePlan();
  const m = plan.massnahmen.find(x => x.interventionId === interventionId) ?? null;
  const dialog = useMemo(() => detaildialog(interventionId), [interventionId]);
  const [anweisungOffen, setAnweisungOffen] = useState(false);
  const [neueZeit, setNeueZeit] = useState("");

  /* Der Mandatsbezug existiert immer — gesetzt auf das einzige bzw. erste
     vorhandene; angezeigt wird die Auswahl nur bei mehreren (planung.ts). */
  useEffect(() => {
    if (m && m.planung.mandatId === null && mandate.length > 0) {
      massnahmePlanen(interventionId, { mandatId: mandate[0].id });
    }
  }, [m, mandate, interventionId]);

  if (!m) return null;
  const p = m.planung;
  const setze = (patch: Partial<MassnahmenPlanung>) => massnahmePlanen(interventionId, patch);

  const ersteGruppe = dialog?.gruppen[0] ?? null;
  const ersteGruppeBeantwortet = !ersteGruppe || p.detailAuswahl.some(a => a.gruppe === ersteGruppe.label);
  const position = positionFuer(interventionId, p.detailAuswahl);
  const positionOffen = dialog !== null && !ersteGruppeBeantwortet;

  const dauerEffektiv = p.dauerMin ?? position?.vorgabeMinuten ?? null;
  const dauerWeicht = p.dauerMin !== null && position?.vorgabeMinuten !== null && p.dauerMin !== position?.vorgabeMinuten;
  const wochenMin = wochenMinuten(p, dauerEffektiv);

  /* Eindeutige Ziele — zwei Bezüge auf dasselbe Ziel sind EIN Ziel. */
  const zielTitel = [...new Set(m.zielBezuege.map(b => b.zielId))].map(zielId =>
    plan.ziele.find(z => z.zielId === zielId)?.titel ?? zielId);

  /* Herleitung aus dem Vertragstyp — über den ersten Zielbezug. */
  const ersterBezug = m.zielBezuege[0] ?? null;
  const herleitung = ersterBezug ? ableitungAlsText({
    cap: plan.diagnosen.find(d => d.code === ersterBezug.diagnoseCode)?.ausloesendeCaps[0] ?? "—",
    diagnoseCode: ersterBezug.diagnoseCode,
    zielId: ersterBezug.zielId,
    interventionId,
    positionsNummer: position?.nummer ?? null,
  }) : null;

  const wahlSetzen = (gruppe: string, item: string) => {
    const ohne = p.detailAuswahl.filter(a => a.gruppe !== gruppe);
    setze({ detailAuswahl: [...ohne, { gruppe, item }] });
  };

  const zeigtAnzahl = p.wiederholung !== null && p.wiederholung !== "einmalig";
  const zeigtWochentage = p.wiederholung === "woechentlich" || p.wiederholung === "benutzerdefiniert";
  const hatZeitfenster = p.tageszeiten.length > 0 || p.eigeneZeiten.length > 0;
  const grenzText = position?.maxAnzahl != null && position.maxEinheit != null
    ? `Katalog: max. ${position.maxAnzahl}× je ${position.maxEinheit === "tag" ? "Tag" : "Woche"}`
    : null;

  return (
    <div data-editor={interventionId}>
      {/* ── Kopfkarte ── */}
      <div style={{ ...KARTE, background: "var(--bg-secondary)", padding: "12px 14px", marginBottom: 12 }}>
        <div className="flex items-start" style={{ gap: 8 }}>
          <div className="flex-1 min-w-0">
            <div style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>{m.titel}</div>
            <div style={{ fontSize: "var(--text-meta)", color: positionOffen ? "var(--status-warning-text)" : "var(--text-secondary)", marginTop: 2 }}>
              {positionOffen
                ? "Position offen"
                : position
                  ? `KLV ${position.klv} · ${position.nummer} ${position.bezeichnung}`
                  : "Keine Position hinterlegt — bleibt planerisch"}
            </div>
            <div style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", marginTop: 2 }}>
              Wochenzeit: {p.erbringer === "S" ? (wochenMin > 0 ? `${Math.round(wochenMin)} min/Woche` : "—") : "keine (nicht verrechnet)"}
            </div>
            <div style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", marginTop: 4 }}>
              Dient {zielTitel.length === 1 ? "dem Ziel" : "den Zielen"}: {zielTitel.join(" · ") || "— ohne Zuordnung"}
            </div>
          </div>
          <button type="button" onClick={onFertig} className="ui-fokusring cursor-pointer inline-flex items-center shrink-0"
            style={{ gap: 5, padding: "6px 16px", borderRadius: "var(--radius-pill)", background: "var(--brand-primary)", color: "var(--text-on-dark)", border: "none", fontSize: "var(--text-meta)", fontWeight: 500 }}>
            <Check style={{ width: 12, height: 12 }} /> Fertig
          </button>
        </div>
      </div>

      {/* ── Detaildialog ── */}
      {dialog && dialog.gruppen.map((g, gi) => (
        <Abschnitt key={g.label} titel={g.label} kinder={
          <div>
            <div className="flex flex-wrap" style={{ gap: 6 }}>
              {g.items.map(item => (
                <Chip key={item.label} label={item.label}
                  aktiv={p.detailAuswahl.some(a => a.gruppe === g.label && a.item === item.label)}
                  onClick={() => wahlSetzen(g.label, item.label)} />
              ))}
            </div>
          </div>
        } />
      ))}

      {/* ── Wiederholung ── */}
      <Abschnitt titel="Wiederholung" kinder={
        <div>
          <InlineSelect value={p.wiederholung ?? ""} platzhalter="Wiederholung wählen"
            onChange={v => setze({ wiederholung: (v || null) as Wiederholung | null })}
            options={WIEDERHOLUNGEN} style={{ maxWidth: 280 }} />
          {p.wiederholung === "werktage" && (
            <div style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", marginTop: 4 }}>Montag bis Freitag</div>
          )}
          {p.wiederholung === "einmalig" && (
            <div style={{ marginTop: 8 }}>
              <input type="date" value={p.einmalDatum} onChange={e => setze({ einmalDatum: e.target.value })}
                aria-label="Datum der einmaligen Durchführung" style={feldStil} />
            </div>
          )}
          {zeigtAnzahl && (
            <div className="flex items-center" style={{ gap: 8, marginTop: 8 }}>
              <label style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>Anzahl</label>
              <input type="number" min={1} value={p.anzahl}
                onChange={e => setze({ anzahl: Math.max(1, parseInt(e.target.value) || 1) })}
                aria-label="Anzahl" style={{ ...feldStil, width: 72 }} />
              {grenzText && <span style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>{grenzText}</span>}
            </div>
          )}
          {p.wiederholung === "benutzerdefiniert" && (
            <div className="flex items-center" style={{ gap: 8, marginTop: 8 }}>
              <span style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>alle</span>
              <input type="number" min={1} value={p.intervallN}
                onChange={e => setze({ intervallN: Math.max(1, parseInt(e.target.value) || 1) })}
                aria-label="Intervall" style={{ ...feldStil, width: 64 }} />
              <InlineSelect value={p.intervallEinheit}
                onChange={v => setze({ intervallEinheit: v as "tage" | "wochen" })}
                options={[{ value: "tage", label: "Tage" }, { value: "wochen", label: "Wochen" }]}
                style={{ width: 120 }} />
            </div>
          )}
          {zeigtWochentage && (
            <div className="flex flex-wrap" style={{ gap: 6, marginTop: 8 }}>
              {WOCHENTAG_KURZ.map((tag, i) => (
                <Chip key={tag} label={tag} aktiv={p.wochentage.includes(i)}
                  onClick={() => setze({
                    wochentage: p.wochentage.includes(i)
                      ? p.wochentage.filter(t => t !== i)
                      : [...p.wochentage, i].sort((a, b) => a - b),
                  })} />
              ))}
            </div>
          )}
        </div>
      } />

      {/* ── Tageszeit ── */}
      <Abschnitt titel="Tageszeit" kinder={
        <div>
          <div className="flex flex-wrap" style={{ gap: 6 }}>
            {TAGESZEIT_FENSTER.map(f => (
              <Chip key={f.id} label={f.label} aktiv={p.tageszeiten.includes(f.id)}
                onClick={() => setze({
                  tageszeiten: p.tageszeiten.includes(f.id)
                    ? p.tageszeiten.filter(t => t !== f.id)
                    : [...p.tageszeiten, f.id],
                })} />
            ))}
          </div>
          <div className="flex items-center flex-wrap" style={{ gap: 6, marginTop: 8 }}>
            {p.eigeneZeiten.map(z => (
              <span key={z} className="inline-flex items-center" style={{ gap: 4, padding: "3px 8px", borderRadius: "var(--radius-pill)", background: "var(--bg-secondary)", fontSize: "var(--text-meta)", color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                {z}
                <button type="button" aria-label={`Zeit ${z} entfernen`} className="ui-fokusring cursor-pointer"
                  onClick={() => setze({ eigeneZeiten: p.eigeneZeiten.filter(x => x !== z) })}
                  style={{ background: "none", border: "none", padding: 0, color: "var(--text-tertiary)", display: "flex" }}>
                  <X style={{ width: 11, height: 11 }} />
                </button>
              </span>
            ))}
            <input type="time" value={neueZeit} onChange={e => setNeueZeit(e.target.value)}
              aria-label="Benutzerdefinierte Zeit" style={{ ...feldStil, width: 110 }} />
            <button type="button" className="ui-fokusring cursor-pointer"
              onClick={() => { if (neueZeit && !p.eigeneZeiten.includes(neueZeit)) { setze({ eigeneZeiten: [...p.eigeneZeiten, neueZeit] }); setNeueZeit(""); } }}
              style={{ padding: "4px 12px", borderRadius: "var(--radius-pill)", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", fontSize: "var(--text-meta)", fontWeight: 500, color: "var(--text-primary)" }}>
              Benutzerdefinierte Zeit
            </button>
          </div>
          {hatZeitfenster && (
            <label className="flex items-center cursor-pointer" style={{ gap: 7, marginTop: 8, fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>
              <input type="checkbox" checked={p.zeitVerbindlich}
                onChange={e => setze({ zeitVerbindlich: e.target.checked })} />
              Zeitfenster ist verbindlich
            </label>
          )}
        </div>
      } />

      {/* ── Erbracht von ── */}
      <Abschnitt titel="Erbracht von" kinder={
        <div>
          <InlineSelect value={p.erbringer}
            onChange={v => setze({ erbringer: v as ErbringerCode })}
            options={ERBRINGER.map(e => ({ value: e.code, label: `${e.label} — ${e.folge}` }))}
            style={{ maxWidth: 420 }} />
          {p.erbringer !== "S" && (
            <div style={{ marginTop: 8 }}>
              <textarea value={p.erbringerNotiz} onChange={e => setze({ erbringerNotiz: e.target.value })}
                placeholder={p.erbringer === "V"
                  ? "Was wurde abgelehnt und mit welcher Begründung?"
                  : "Wer erbringt es, und wie ist es abgesichert?"}
                rows={2}
                style={{ ...feldStil, height: "auto", width: "100%", padding: "8px 10px", resize: "vertical" }} />
</div>
          )}
        </div>
      } />

      {/* ── Mandat: ein Feld erscheint erst, wenn es abweichen kann ── */}
      {mandatAuswahlSichtbar(mandate) && (
        <Abschnitt titel="Mandat" kinder={
          <InlineSelect value={p.mandatId ?? ""} platzhalter="Mandat wählen"
            onChange={v => setze({ mandatId: v || null })}
            options={mandate.map(x => ({ value: x.id, label: x.label }))}
            style={{ maxWidth: 320 }} />
        } />
      )}

      {/* ── Dauer und Qualifikation ── */}
      <Abschnitt titel="Dauer und Qualifikation" kinder={
        <div>
          <div className="flex items-center" style={{ gap: 8 }}>
            <label style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>Dauer</label>
            <input type="number" min={1} value={p.dauerMin ?? position?.vorgabeMinuten ?? ""}
              onChange={e => {
                const v = parseInt(e.target.value);
                setze({ dauerMin: Number.isFinite(v) ? v : null });
              }}
              aria-label="Dauer in Minuten" style={{ ...feldStil, width: 84 }} />
            <span style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>min</span>
            {position?.vorgabeMinuten != null && (
              <span style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>Katalog: {position.vorgabeMinuten} min</span>
            )}
          </div>
          {dauerWeicht && (
            <div style={{ marginTop: 8 }}>
              <textarea value={p.dauerBegruendung} onChange={e => setze({ dauerBegruendung: e.target.value })}
                placeholder="Begründung der Abweichung vom Katalogwert (Pflicht)"
                rows={2}
                style={{
                  ...feldStil, height: "auto", width: "100%", padding: "8px 10px", resize: "vertical",
                  borderColor: p.dauerBegruendung.trim() ? "var(--border-default)" : "var(--status-danger)",
                }} />
              {!p.dauerBegruendung.trim() && (
                <div style={{ fontSize: "var(--text-micro)", color: "var(--status-danger)", marginTop: 3 }}>
                  Die Abweichung braucht eine Begründung.
                </div>
              )}
            </div>
          )}
          <div className="flex items-center" style={{ gap: 8, marginTop: 10 }}>
            <label style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>Qualifikation</label>
            <InlineSelect value={p.qualifikation ?? position?.mindestqualifikation ?? ""}
              platzhalter="Qualifikation wählen"
              onChange={v => setze({ qualifikation: v || null })}
              options={qualifikationsStufen().map(q => ({ value: q.label, label: q.label }))}
              style={{ width: 230 }} />
            {position?.mindestqualifikation && (
              <span style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>Minimum: {position.mindestqualifikation}</span>
            )}
          </div>
        </div>
      } />

      {/* ── Arbeitsanweisung ── */}
      <Abschnitt titel="Arbeitsanweisung" kinder={
        <div>
          <button type="button" onClick={() => setAnweisungOffen(o => !o)} className="ui-fokusring cursor-pointer"
            style={{ padding: "5px 14px", borderRadius: "var(--radius-pill)", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", fontSize: "var(--text-meta)", fontWeight: 500, color: "var(--text-primary)" }}>
            {anweisungOffen ? "Teilhandlungen ausblenden" : "Teilhandlungen anzeigen"}
          </button>
          {anweisungOffen && (
            <div style={{ marginTop: 8 }}>
              {!position ? (
                <div style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>
                  Keine Position hinterlegt.
                </div>
              ) : position.teilhandlungen === null ? (
                <div style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>
                  Keine Teilhandlungen hinterlegt.
                </div>
              ) : (
                <>
                  <ol style={{ margin: 0, paddingLeft: 20 }}>
                    {position.teilhandlungen.map((t, i) => (
                      <li key={i} style={{ fontSize: "var(--text-meta)", color: "var(--text-primary)", lineHeight: 1.6 }}>{t}</li>
                    ))}
                  </ol>
                  {/* Herkunft wörtlich aus dem Vertrag — amtlich und kuratiert
                      dürfen nicht gleich verbindlich aussehen. */}
                  <div className="inline-flex items-center" style={{
                    gap: 6, marginTop: 8, padding: "3px 10px", borderRadius: "var(--radius-pill)",
                    fontSize: "var(--text-micro)", fontWeight: 500,
                    background: position.herkunft.teilhandlungen === "katalog" ? "var(--status-success-bg)" : "var(--status-warning-bg)",
                    color: position.herkunft.teilhandlungen === "katalog" ? "var(--status-success-text)" : "var(--status-warning-text)",
                  }}>
                    Herkunft: {position.herkunft.teilhandlungen}
                    {position.herkunft.teilhandlungen === "katalog"
                      ? " — amtlicher Leistungskatalog"
                      : " — Initialschulungs-Vorlage, fachlich nicht validiert"}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      } />

      {/* ── Herleitung ── */}
      <Abschnitt titel="Herleitung" kinder={
        herleitung ? (
          <div className="font-mono" style={{ fontSize: "var(--text-micro)", color: "var(--text-secondary)", padding: "7px 10px", background: "var(--bg-secondary)", borderRadius: "var(--radius-card)", overflowX: "auto", whiteSpace: "nowrap" }}>
            {herleitung}
          </div>
        ) : (
          <div style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>
            Ohne Zielbezug — keine Herleitung.
          </div>
        )
      } />
    </div>
  );
}
