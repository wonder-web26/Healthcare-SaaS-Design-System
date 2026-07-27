/**
 * Arbeitskontrolle — strukturierte Qualitätskontrolle mit Bewertungsskala,
 * Freitext und getrennten Unterschriften.
 */
import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft, Check, CheckCircle2, Lock, Pen, AlertTriangle, Info, Download,
} from "lucide-react";
import { exportiereArbeitskontrollePDF } from "../../../lib/arbeitskontrolle/pdf-export";
import { BEURTEILUNGSBLOECKE } from "../../../lib/arbeitskontrolle/kriterien";
import {
  getKontrolleById, aktualisiereKontrolle, kontrolleUnterschreiben, BESTAETIGUNGSTEXTE,
  type Arbeitskontrolle, type BlockBewertung, type Bewertung,
} from "../../../lib/arbeitskontrolle/store";
import { formatAnzeige, isoZuAnzeige } from "../../../lib/datum";
import { toast } from "sonner";

const SKALA = [1, 2, 3, 4, 5, 6] as const;

/* ══════════════════════════════════════════
   HAUPTKOMPONENTE
   ══════════════════════════════════════════ */

export function ArbeitskontrollePage() {
  const { kontrolleId } = useParams();
  const navigate = useNavigate();
  const [, forceUpdate] = useState(0);
  const refresh = () => forceUpdate(n => n + 1);

  const kontrolle = kontrolleId ? getKontrolleById(kontrolleId) : null;
  if (!kontrolle) {
    return (
      <div style={{ padding: "64px 32px", textAlign: "center" }}>
        <h3 style={{ color: "var(--text-primary)", fontSize: "var(--text-h3)", fontWeight: 500 }}>Kontrolle nicht gefunden</h3>
        <button onClick={() => navigate(-1)} className="inline-flex items-center cursor-pointer" style={{ marginTop: 16, gap: 8, padding: "10px 20px", borderRadius: 999, background: "var(--brand-primary)", color: "var(--text-on-dark)", fontSize: 14, fontWeight: 500, border: "none" }}>
          <ArrowLeft style={{ width: 16, height: 16 }} /> Zurück
        </button>
      </div>
    );
  }

  const istAbgeschlossen = kontrolle.status === "abgeschlossen";
  const hatFallfuehrende = kontrolle.unterschriften.some(u => u.rolle === "fallfuehrende");
  const hatMitarbeiterin = kontrolle.unterschriften.some(u => u.rolle === "mitarbeiterin");

  const speichereAenderungen = (bloecke: BlockBewertung[], verbesserungen: string, meldungGL: Arbeitskontrolle["meldungGL"], meldungLP: Arbeitskontrolle["meldungLP"]) => {
    aktualisiereKontrolle(kontrolle.id, { bloecke, verbesserungen, meldungGL, meldungLP });
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 24px 64px" }}>
      {/* Header */}
      <div className="flex items-center" style={{ gap: 12, marginBottom: 24 }}>
        <button onClick={() => navigate(-1)} className="cursor-pointer" style={{ background: "none", border: "none", padding: 4, color: "var(--text-secondary)" }}>
          <ArrowLeft style={{ width: 20, height: 20 }} />
        </button>
        <div style={{ flex: 1 }}>
          <div className="flex items-center" style={{ gap: 8 }}>
            <h2 style={{ fontSize: "var(--text-h2)", fontWeight: 500, color: "var(--text-primary)", margin: 0 }}>Arbeitskontrolle</h2>
            {kontrolle.art === "ausserordentlich" && (
              <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: "var(--text-meta)", fontWeight: 500, background: "var(--status-info-bg)", color: "var(--status-info)" }}>Ausserordentlich</span>
            )}
          </div>
          <div style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", marginTop: 2 }}>
            {kontrolle.angehoerigerName}{kontrolle.patientName ? ` · Patient: ${kontrolle.patientName}` : ""}
          </div>
        </div>
        <div className="flex items-center" style={{ gap: 8 }}>
          <button
            onClick={async () => {
              const blob = await exportiereArbeitskontrollePDF(kontrolle);
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a"); a.href = url; a.download = `Arbeitskontrolle_${kontrolle.angehoerigerName.replace(/\s+/g, "_")}_${kontrolle.kontrollDatum}.pdf`;
              document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
            }}
            className="inline-flex items-center cursor-pointer"
            style={{ gap: 4, padding: "4px 14px", borderRadius: 999, background: "var(--bg-secondary)", color: "var(--text-primary)", fontSize: "var(--text-meta)", fontWeight: 500, border: "0.5px solid var(--border-default)" }}
          >
            <Download style={{ width: 12, height: 12 }} /> PDF herunterladen
          </button>
          {istAbgeschlossen && (
            <span className="inline-flex items-center" style={{ gap: 4, padding: "4px 14px", borderRadius: 999, background: "var(--status-success-bg)", color: "var(--status-success)", fontSize: "var(--text-meta)", fontWeight: 500 }}>
              <Lock style={{ width: 12, height: 12 }} /> Abgeschlossen
            </span>
          )}
        </div>
      </div>

      {/* Kopfbereich */}
      <div style={{ padding: "16px 20px", background: "var(--bg-elevated)", border: "0.5px solid var(--border-default)", borderRadius: 12, marginBottom: 16 }}>
        <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 12 }}>
          <div>
            <div style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)", marginBottom: 2 }}>Mitarbeiter:in</div>
            <div style={{ fontSize: "var(--text-body)", fontWeight: 500, color: "var(--text-primary)" }}>{kontrolle.angehoerigerName}</div>
          </div>
          <div>
            <div style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)", marginBottom: 2 }}>Fallführende / Beurteilende</div>
            <div style={{ fontSize: "var(--text-body)", fontWeight: 500, color: "var(--text-primary)" }}>{kontrolle.fallfuehrendeName}</div>
          </div>
          <div>
            <div style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)", marginBottom: 2 }}>Datum der Kontrolle</div>
            <div style={{ fontSize: "var(--text-body)", fontWeight: 500, color: "var(--text-primary)" }}>{isoZuAnzeige(kontrolle.kontrollDatum)}</div>
          </div>
          {kontrolle.patientName && (
            <div>
              <div style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)", marginBottom: 2 }}>Besuchter Patient</div>
              <div style={{ fontSize: "var(--text-body)", fontWeight: 500, color: "var(--text-primary)" }}>{kontrolle.patientName}</div>
            </div>
          )}
        </div>
      </div>

      {/* Zielsatz */}
      <div style={{ padding: "12px 20px", background: "var(--bg-secondary)", borderRadius: 10, marginBottom: 20, fontSize: "var(--text-small)", color: "var(--text-secondary)", lineHeight: 1.6 }}>
        Ziel: Die Qualität der Arbeitsweise samt Einhaltung der fachlichen Instruktionen überprüfen,
        Verbesserungen finden und die Qualität erhöhen.
      </div>

      {/* Beurteilungsblöcke */}
      <BeurteilungsFormular
        kontrolle={kontrolle}
        istAbgeschlossen={istAbgeschlossen}
        onSpeichern={speichereAenderungen}
      />

      {/* Unterschriften */}
      <div style={{ marginTop: 24 }}>
        <div style={{ fontSize: "var(--text-h3)", fontWeight: 500, color: "var(--text-primary)", marginBottom: 12 }}>Unterschriften</div>
        <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 12 }}>
          <UnterschriftBlock
            label="Fallführende (Beurteilung)"
            hinweis={BESTAETIGUNGSTEXTE.fallfuehrende}
            unterschrift={kontrolle.unterschriften.find(u => u.rolle === "fallfuehrende")}
            istAbgeschlossen={istAbgeschlossen}
            onSign={(dataUrl) => {
              const res = kontrolleUnterschreiben(kontrolle.id, "fallfuehrende", dataUrl, kontrolle.fallfuehrendeName);
              if (!res.ok) { toast(res.fehler ?? "Unterschrift nicht möglich"); return; }
              refresh();
              toast("Unterschrift Fallführende gespeichert");
            }}
          />
          <UnterschriftBlock
            label="Mitarbeiter:in (Kenntnisnahme)"
            hinweis={BESTAETIGUNGSTEXTE.mitarbeiterin}
            unterschrift={kontrolle.unterschriften.find(u => u.rolle === "mitarbeiterin")}
            istAbgeschlossen={istAbgeschlossen}
            gesperrt={!hatFallfuehrende}
            gesperrtGrund="Erst möglich, sobald die Fallführende (Beurteilung) unterschrieben hat."
            onSign={(dataUrl) => {
              const res = kontrolleUnterschreiben(kontrolle.id, "mitarbeiterin", dataUrl, kontrolle.angehoerigerName);
              if (!res.ok) { toast(res.fehler ?? "Unterschrift nicht möglich"); return; }
              refresh();
              toast("Unterschrift Mitarbeiter:in gespeichert");
            }}
          />
        </div>
      </div>

      {/* Status-Hinweis */}
      {!istAbgeschlossen && !hatFallfuehrende && !hatMitarbeiterin && (
        <div className="flex items-center" style={{ gap: 8, marginTop: 16, padding: "10px 16px", background: "var(--bg-secondary)", borderRadius: 8 }}>
          <Info style={{ width: 14, height: 14, color: "var(--text-tertiary)", flexShrink: 0 }} />
          <span style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>
            Die Kontrolle wird abgeschlossen, sobald beide Unterschriften vorliegen.
          </span>
        </div>
      )}

      {istAbgeschlossen && kontrolle.abgeschlossenAm && (
        <div style={{ marginTop: 24, padding: "10px 16px", background: "var(--bg-secondary)", borderRadius: 8, fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>
          Abgeschlossen am {formatAnzeige(new Date(kontrolle.abgeschlossenAm))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   BEURTEILUNGSFORMULAR
   ══════════════════════════════════════════ */

function BeurteilungsFormular({ kontrolle, istAbgeschlossen, onSpeichern }: {
  kontrolle: Arbeitskontrolle;
  istAbgeschlossen: boolean;
  onSpeichern: (bloecke: BlockBewertung[], verbesserungen: string, meldungGL: Arbeitskontrolle["meldungGL"], meldungLP: Arbeitskontrolle["meldungLP"]) => void;
}) {
  const [bloecke, setBloecke] = useState<BlockBewertung[]>(kontrolle.bloecke);
  const [verbesserungen, setVerbesserungen] = useState(kontrolle.verbesserungen);
  const [meldungGL, setMeldungGL] = useState(kontrolle.meldungGL);
  const [meldungLP, setMeldungLP] = useState(kontrolle.meldungLP);

  const save = (b: BlockBewertung[], v: string, gl: typeof meldungGL, lp: typeof meldungLP) => {
    onSpeichern(b, v, gl, lp);
  };

  const setBewertung = (blockIdx: number, kritCode: string, wert: Bewertung) => {
    const next = bloecke.map((block, i) => {
      if (i !== blockIdx) return block;
      return { ...block, bewertungen: block.bewertungen.map(b => b.code === kritCode ? { ...b, wert } : b) };
    });
    setBloecke(next);
    save(next, verbesserungen, meldungGL, meldungLP);
  };

  const setAnmerkung = (blockIdx: number, text: string) => {
    const next = bloecke.map((block, i) => i === blockIdx ? { ...block, anmerkung: text } : block);
    setBloecke(next);
    save(next, verbesserungen, meldungGL, meldungLP);
  };

  // Nicht erfasste Kriterien (Zustand "nicht erfasst" = null) für den Hinweis
  // vor dem Abschliessen. Der Abschluss wird dadurch nicht blockiert.
  const nichtErfasst = bloecke.reduce((sum, b) => sum + b.bewertungen.filter(x => x.wert === null).length, 0);
  const gesamtKriterien = bloecke.reduce((sum, b) => sum + b.bewertungen.length, 0);

  return (
    <div className="flex flex-col" style={{ gap: 16 }}>
      {BEURTEILUNGSBLOECKE.map((blockDef, blockIdx) => {
        const blockData = bloecke[blockIdx];
        return (
          <div key={blockDef.id} style={{ padding: "16px 20px", background: "var(--bg-elevated)", border: "0.5px solid var(--border-default)", borderRadius: 12 }}>
            <div style={{ fontSize: "var(--text-small)", fontWeight: 500, color: "var(--text-primary)", marginBottom: 12 }}>
              {blockIdx + 1}. {blockDef.frage}
            </div>

            {blockDef.kriterien.map(krit => {
              const bewertung = blockData?.bewertungen.find(b => b.code === krit.code);
              const wert = bewertung?.wert;
              const nichtBeurteilbar = wert === "nicht_beurteilbar";
              return (
                <div key={krit.code} style={{ marginBottom: 10, paddingLeft: 8 }}>
                  <div style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", marginBottom: 4, fontWeight: 500 }}>{krit.label}</div>
                  <div className="flex items-center flex-wrap" style={{ gap: 4 }}>
                    {SKALA.map(n => {
                      const sel = wert === n;
                      return (
                        <button
                          key={n}
                          // Toggle: erneuter Klick auf den gewählten Wert setzt zurück auf "nicht erfasst".
                          onClick={() => !istAbgeschlossen && setBewertung(blockIdx, krit.code, sel ? null : n)}
                          disabled={istAbgeschlossen}
                          aria-pressed={sel}
                          className="cursor-pointer disabled:cursor-default"
                          style={{
                            // Gewählt: erkennbar an Rahmen UND Schriftstärke (nicht an Farbe allein).
                            width: 32, height: 32, borderRadius: 8, fontSize: 13,
                            border: sel ? "2px solid var(--text-primary)" : "1px solid var(--border-default)",
                            fontWeight: sel ? 700 : 500,
                            background: sel ? "var(--brand-primary)" : "var(--bg-secondary)",
                            color: sel ? "var(--text-on-dark)" : "var(--text-secondary)",
                          }}
                        >
                          {n}
                        </button>
                      );
                    })}
                    {/* Abgesetzte, eigene Bedienfläche — liegt nicht auf der Skala 1–6. */}
                    <span aria-hidden style={{ width: 1, height: 24, background: "var(--border-default)", margin: "0 6px" }} />
                    <button
                      onClick={() => !istAbgeschlossen && setBewertung(blockIdx, krit.code, nichtBeurteilbar ? null : "nicht_beurteilbar")}
                      disabled={istAbgeschlossen}
                      aria-pressed={nichtBeurteilbar}
                      className="cursor-pointer disabled:cursor-default inline-flex items-center"
                      style={{
                        gap: 4, height: 32, padding: "0 10px", borderRadius: 8, fontSize: 12,
                        border: nichtBeurteilbar ? "2px solid var(--status-warning)" : "1px solid var(--border-default)",
                        fontWeight: nichtBeurteilbar ? 700 : 500,
                        background: nichtBeurteilbar ? "var(--status-warning-bg)" : "var(--bg-secondary)",
                        color: nichtBeurteilbar ? "var(--status-warning)" : "var(--text-tertiary)",
                      }}
                    >
                      {nichtBeurteilbar && <Check style={{ width: 12, height: 12 }} />}
                      Nicht beurteilbar
                    </button>
                  </div>
                </div>
              );
            })}

            <div style={{ marginTop: 8 }}>
              <textarea
                value={blockData?.anmerkung ?? ""}
                onChange={e => { if (!istAbgeschlossen) { setAnmerkung(blockIdx, e.target.value); } }}
                placeholder="Anmerkungen…"
                disabled={istAbgeschlossen}
                rows={2}
                style={{ width: "100%", padding: "8px 10px", fontSize: "var(--text-small)", borderRadius: 8, border: "0.5px solid var(--border-default)", background: "var(--bg-secondary)", color: "var(--text-primary)", fontFamily: "inherit", resize: "vertical" }}
              />
            </div>
          </div>
        );
      })}

      {/* Freitextblock */}
      <div style={{ padding: "16px 20px", background: "var(--bg-elevated)", border: "0.5px solid var(--border-default)", borderRadius: 12 }}>
        <div style={{ fontSize: "var(--text-small)", fontWeight: 500, color: "var(--text-primary)", marginBottom: 8 }}>
          Verbesserungen und Vorschläge
        </div>
        <div style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)", marginBottom: 8 }}>
          Welche Verbesserungen wären zielführend? Gab es Vorschläge von Klient:in, Mitarbeiter:in oder Fallführender? Gibt es Vorschläge zur Fehlervermeidung?
        </div>
        <textarea
          value={verbesserungen}
          onChange={e => { if (!istAbgeschlossen) { setVerbesserungen(e.target.value); save(bloecke, e.target.value, meldungGL, meldungLP); } }}
          placeholder="Freitext…"
          disabled={istAbgeschlossen}
          rows={4}
          style={{ width: "100%", padding: "8px 10px", fontSize: "var(--text-small)", borderRadius: 8, border: "0.5px solid var(--border-default)", background: "var(--bg-secondary)", color: "var(--text-primary)", fontFamily: "inherit", resize: "vertical" }}
        />
      </div>

      {/* Meldeblock */}
      <div style={{ padding: "16px 20px", background: "var(--bg-elevated)", border: "0.5px solid var(--border-default)", borderRadius: 12 }}>
        <div style={{ fontSize: "var(--text-small)", fontWeight: 500, color: "var(--text-primary)", marginBottom: 10 }}>Meldungen</div>
        <div className="flex flex-col" style={{ gap: 8 }}>
          <MeldeZeile label="Meldung an Geschäftsleitung" value={meldungGL} disabled={istAbgeschlossen} onChange={v => { setMeldungGL(v); save(bloecke, verbesserungen, v, meldungLP); }} />
          <MeldeZeile label="Meldung an Leitung Pflege" value={meldungLP} disabled={istAbgeschlossen} onChange={v => { setMeldungLP(v); save(bloecke, verbesserungen, meldungGL, v); }} />
        </div>
      </div>

      {/* Hinweis vor dem Abschliessen: nicht erfasste Kriterien (blockiert nicht). */}
      {!istAbgeschlossen && nichtErfasst > 0 && (
        <div className="flex items-center" style={{ gap: 8, padding: "10px 16px", background: "var(--status-warning-bg)", borderRadius: 8 }}>
          <AlertTriangle style={{ width: 15, height: 15, color: "var(--status-warning)", flexShrink: 0 }} />
          <span style={{ fontSize: "var(--text-small)", color: "var(--text-primary)" }}>
            {nichtErfasst} von {gesamtKriterien} {nichtErfasst === 1 ? "Kriterium ist" : "Kriterien sind"} nicht erfasst. Der Abschluss ist trotzdem möglich.
          </span>
        </div>
      )}
    </div>
  );
}

function MeldeZeile({ label, value, disabled, onChange }: {
  label: string;
  value: { erfolgt: boolean; datum: string; uhrzeit: string };
  disabled: boolean;
  onChange: (v: { erfolgt: boolean; datum: string; uhrzeit: string }) => void;
}) {
  return (
    <div className="flex items-center flex-wrap" style={{ gap: 8 }}>
      <label className="flex items-center" style={{ gap: 6, cursor: disabled ? "default" : "pointer" }}>
        <input type="checkbox" checked={value.erfolgt} disabled={disabled} onChange={e => onChange({ ...value, erfolgt: e.target.checked })} style={{ width: 16, height: 16 }} />
        <span style={{ fontSize: "var(--text-small)", color: "var(--text-primary)" }}>{label}</span>
      </label>
      {value.erfolgt && (
        <>
          <input type="date" value={value.datum} disabled={disabled} onChange={e => onChange({ ...value, datum: e.target.value })} style={{ padding: "4px 8px", fontSize: "var(--text-meta)", borderRadius: 6, border: "0.5px solid var(--border-default)", background: "var(--bg-secondary)", color: "var(--text-primary)", fontFamily: "inherit" }} />
          <input type="time" value={value.uhrzeit} disabled={disabled} onChange={e => onChange({ ...value, uhrzeit: e.target.value })} style={{ padding: "4px 8px", fontSize: "var(--text-meta)", borderRadius: 6, border: "0.5px solid var(--border-default)", background: "var(--bg-secondary)", color: "var(--text-primary)", fontFamily: "inherit" }} />
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   UNTERSCHRIFT-BLOCK
   ══════════════════════════════════════════ */

function UnterschriftBlock({ label, hinweis, unterschrift, istAbgeschlossen, gesperrt = false, gesperrtGrund, onSign }: {
  label: string;
  hinweis: string;
  unterschrift?: { signaturDataUrl: string; datum: string; name: string };
  istAbgeschlossen: boolean;
  gesperrt?: boolean;
  gesperrtGrund?: string;
  onSign: (dataUrl: string) => void;
}) {
  const [showPad, setShowPad] = useState(false);

  return (
    <div style={{ padding: "14px 18px", background: "var(--bg-elevated)", border: `0.5px solid ${unterschrift ? "var(--status-success)" : "var(--border-default)"}`, borderRadius: 12 }}>
      <div style={{ fontSize: "var(--text-small)", fontWeight: 500, color: "var(--text-primary)", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)", marginBottom: 10, lineHeight: 1.5 }}>{hinweis}</div>

      {unterschrift ? (
        <div style={{ padding: "8px 12px", background: "var(--status-success-bg)", borderRadius: 8 }}>
          <div className="flex items-center" style={{ gap: 6, marginBottom: 4 }}>
            <CheckCircle2 style={{ width: 14, height: 14, color: "var(--status-success)" }} />
            <span style={{ fontSize: "var(--text-meta)", color: "var(--status-success)", fontWeight: 500 }}>
              {unterschrift.name} · {formatAnzeige(new Date(unterschrift.datum))}
            </span>
          </div>
          <img src={unterschrift.signaturDataUrl} alt="Unterschrift" style={{ height: 40, opacity: 0.7 }} />
        </div>
      ) : istAbgeschlossen ? null : gesperrt ? (
        // Sichtbar, aber nicht bedienbar, mit Begründung (Reihenfolge AK-U1 vor AK-U2).
        <div>
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="inline-flex items-center"
            style={{ gap: 6, padding: "8px 16px", borderRadius: 999, background: "var(--bg-secondary)", color: "var(--text-tertiary)", fontSize: "var(--text-small)", fontWeight: 500, border: "0.5px solid var(--border-default)", cursor: "not-allowed", opacity: 0.7 }}
          >
            <Lock style={{ width: 12, height: 12 }} /> Unterschreiben
          </button>
          {gesperrtGrund && (
            <div className="flex items-center" style={{ gap: 6, marginTop: 8 }}>
              <Info style={{ width: 12, height: 12, color: "var(--text-tertiary)", flexShrink: 0 }} />
              <span style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>{gesperrtGrund}</span>
            </div>
          )}
        </div>
      ) : showPad ? (
        <SignaturPadInline onSign={(d) => { onSign(d); setShowPad(false); }} onCancel={() => setShowPad(false)} />
      ) : (
        <button onClick={() => setShowPad(true)} className="inline-flex items-center cursor-pointer" style={{ gap: 6, padding: "8px 16px", borderRadius: 999, background: "var(--brand-primary)", color: "var(--text-on-dark)", fontSize: "var(--text-small)", fontWeight: 500, border: "none" }}>
          <Pen style={{ width: 12, height: 12 }} /> Unterschreiben
        </button>
      )}
    </div>
  );
}

function SignaturPadInline({ onSign, onCancel }: { onSign: (dataUrl: string) => void; onCancel: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    if ("touches" in e) return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault(); setDrawing(true);
    const ctx = canvasRef.current?.getContext("2d"); if (!ctx) return;
    const p = getPos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y);
  };
  const move = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing) return; e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d"); if (!ctx) return;
    const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.strokeStyle = "#1a1a1a"; ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.stroke(); setHasDrawn(true);
  };
  const stop = () => setDrawing(false);
  const clear = () => { canvasRef.current?.getContext("2d")?.clearRect(0, 0, 400, 120); setHasDrawn(false); };
  const confirm = () => {
    if (!hasDrawn || !canvasRef.current) return;
    const t = document.createElement("canvas"); t.width = 300; t.height = 100;
    t.getContext("2d")!.drawImage(canvasRef.current, 0, 0, 300, 100);
    onSign(t.toDataURL("image/png", 0.7));
  };

  return (
    <div>
      <canvas ref={canvasRef} width={400} height={120}
        onMouseDown={start} onMouseMove={move} onMouseUp={stop} onMouseLeave={stop}
        onTouchStart={start} onTouchMove={move} onTouchEnd={stop}
        style={{ width: "100%", maxWidth: 400, height: 120, border: "1px solid var(--border-default)", borderRadius: 8, background: "white", cursor: "crosshair", touchAction: "none" }}
      />
      <div className="flex items-center" style={{ gap: 8, marginTop: 6 }}>
        <button onClick={confirm} disabled={!hasDrawn} className="inline-flex items-center cursor-pointer disabled:opacity-40" style={{ gap: 4, padding: "6px 14px", borderRadius: 999, background: "var(--brand-primary)", color: "var(--text-on-dark)", fontSize: "var(--text-meta)", fontWeight: 500, border: "none" }}>
          <Check style={{ width: 11, height: 11 }} /> Bestätigen
        </button>
        <button onClick={clear} className="cursor-pointer" style={{ background: "none", border: "none", fontSize: "var(--text-meta)", color: "var(--text-secondary)", padding: "6px 8px" }}>Löschen</button>
        <button onClick={onCancel} className="cursor-pointer" style={{ background: "none", border: "none", fontSize: "var(--text-meta)", color: "var(--text-secondary)", padding: "6px 8px" }}>Abbrechen</button>
      </div>
    </div>
  );
}
