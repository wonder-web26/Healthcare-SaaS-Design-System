/**
 * Initialschulung — KLV-gefilterter Schulungsnachweis mit Unterschrift pro Position.
 *
 * Der Nachweis enthält die dem Patienten zugeordneten KLV-Positionen,
 * gruppiert nach Bereich, mit Ausführungsschritten und je einem Unterschriftsfeld.
 * Fortlaufender Signaturmodus: nach Unterschrift → nächste offene Position.
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft, Check, CheckCircle2, AlertTriangle, FileText, Download,
  ChevronDown, ChevronUp, Info, Lock, Pen, ClipboardList,
} from "lucide-react";
import { SPITEX_LEISTUNGSKATALOG_2025, type LeistungskatalogPosition } from "../../../lib/klv/spitex-leistungskatalog-2025";
import { KLV_AUSFUEHRUNGSSCHRITTE, type KLVAusfuehrungsschritte } from "../../../lib/klv/klv-ausfuehrungsschritte";
import { pruefeQualifikation } from "../../../lib/schulung/qualifikationsregel";
import {
  getNachweisById,
  positionUnterschreiben,
  nachweisAbschliessen,
  type Schulungsnachweis,
  type PositionsUnterschrift,
} from "../../../lib/schulung/nachweis-store";
import { toast } from "sonner";

/* ══════════════════════════════════════════
   TYPEN
   ══════════════════════════════════════════ */

interface AufbereitetePosition {
  nr: string;
  bezeichnung: string;
  bereich: string;
  klvKategorie: "a" | "b" | "c" | null;
  schritte: string[];
  schritteVorhanden: boolean;
  qualErlaubt: boolean;
  qualGrund: string | null;
  unterschrift: PositionsUnterschrift | null;
}

/* ══════════════════════════════════════════
   KATALOG-LOOKUP
   ══════════════════════════════════════════ */

const katalogMap = new Map(SPITEX_LEISTUNGSKATALOG_2025.map(p => [p.nr, p]));
const schritteMap = new Map(KLV_AUSFUEHRUNGSSCHRITTE.map(s => [s.nr, s]));

function bereitePositionenAuf(nachweis: Schulungsnachweis): AufbereitetePosition[] {
  return nachweis.positionen.map(nr => {
    const katalog = katalogMap.get(nr);
    const schritte = schritteMap.get(nr);
    const unterschrift = nachweis.unterschriften.find(u => u.nr === nr) ?? null;
    const qualPruefung = pruefeQualifikation(nachweis.angehoerigerQualifikation, katalog?.klvKategorie ?? null);

    return {
      nr,
      bezeichnung: katalog?.bezeichnung ?? `Position ${nr}`,
      bereich: katalog?.bereich ?? schritte?.bereichVorlage ?? "Unbekannt",
      klvKategorie: katalog?.klvKategorie ?? null,
      schritte: schritte?.schritte ?? [],
      schritteVorhanden: !!schritte,
      qualErlaubt: qualPruefung.erlaubt,
      qualGrund: qualPruefung.grund,
      unterschrift,
    };
  }).sort((a, b) => {
    const bereichCmp = a.bereich.localeCompare(b.bereich);
    if (bereichCmp !== 0) return bereichCmp;
    return a.nr.localeCompare(b.nr);
  });
}

function gruppiereNachBereich(positionen: AufbereitetePosition[]): { bereich: string; positionen: AufbereitetePosition[] }[] {
  const groups = new Map<string, AufbereitetePosition[]>();
  for (const p of positionen) {
    if (!groups.has(p.bereich)) groups.set(p.bereich, []);
    groups.get(p.bereich)!.push(p);
  }
  return Array.from(groups.entries()).map(([bereich, positionen]) => ({ bereich, positionen }));
}

const KAT_LABEL: Record<string, string> = { a: "A – Abklärung", b: "B – Behandlung", c: "C – Grundpflege" };

/* ══════════════════════════════════════════
   HAUPTKOMPONENTE
   ══════════════════════════════════════════ */

export function SchulungsnachweisPage() {
  const { nachweisId } = useParams();
  const navigate = useNavigate();
  const [, forceUpdate] = useState(0);
  const refresh = () => forceUpdate(n => n + 1);

  const nachweis = nachweisId ? getNachweisById(nachweisId) : null;

  if (!nachweis) {
    return (
      <div style={{ padding: "64px 32px", textAlign: "center" }}>
        <h3 style={{ color: "var(--text-primary)", fontSize: "var(--text-h3)", fontWeight: 500 }}>Nachweis nicht gefunden</h3>
        <button onClick={() => navigate(-1)} className="inline-flex items-center cursor-pointer" style={{ marginTop: 16, gap: 8, padding: "10px 20px", borderRadius: 999, background: "var(--brand-primary)", color: "var(--text-on-dark)", fontSize: 14, fontWeight: 500, border: "none" }}>
          <ArrowLeft style={{ width: 16, height: 16 }} /> Zurück
        </button>
      </div>
    );
  }

  const positionen = bereitePositionenAuf(nachweis);
  const gruppen = gruppiereNachBereich(positionen);
  const unterschreibbar = positionen.filter(p => p.qualErlaubt);
  const unterschrieben = unterschreibbar.filter(p => p.unterschrift !== null);
  const istAbgeschlossen = nachweis.status === "abgeschlossen";
  const kannAbschliessen = unterschrieben.length === unterschreibbar.length && unterschreibbar.length > 0;
  const fehlQualifikation = !nachweis.angehoerigerQualifikation;

  const handleAbschliessen = async () => {
    const result = await nachweisAbschliessen(nachweis.id, unterschreibbar.map(p => p.nr), nachweis.ausbildendeName);
    if (result.ok) {
      toast("Schulungsnachweis abgeschlossen");
      refresh();
    } else {
      toast(result.fehler ?? "Fehler beim Abschliessen");
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 24px 64px" }}>
      {/* Header */}
      <div className="flex items-center" style={{ gap: 12, marginBottom: 24 }}>
        <button onClick={() => navigate(-1)} className="cursor-pointer" style={{ background: "none", border: "none", padding: 4, color: "var(--text-secondary)" }}>
          <ArrowLeft style={{ width: 20, height: 20 }} />
        </button>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: "var(--text-h2)", fontWeight: 500, color: "var(--text-primary)", margin: 0 }}>Initialschulung</h2>
          <div style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", marginTop: 2 }}>
            Patient/in: {nachweis.patientName} · Angehörige/r: {nachweis.angehoerigerName}
          </div>
        </div>
        {istAbgeschlossen && (
          <span className="inline-flex items-center" style={{ gap: 4, padding: "4px 14px", borderRadius: 999, background: "var(--status-success-bg)", color: "var(--status-success)", fontSize: "var(--text-meta)", fontWeight: 500 }}>
            <Lock style={{ width: 12, height: 12 }} /> Abgeschlossen
          </span>
        )}
      </div>

      {/* Kopfbereich */}
      <div style={{ padding: "16px 20px", background: "var(--bg-elevated)", border: "0.5px solid var(--border-default)", borderRadius: 12, marginBottom: 16 }}>
        <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 12 }}>
          <div>
            <div style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)", marginBottom: 2 }}>Pflegende Angehörige</div>
            <div style={{ fontSize: "var(--text-body)", fontWeight: 500, color: "var(--text-primary)" }}>{nachweis.angehoerigerName}</div>
          </div>
          <div>
            <div style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)", marginBottom: 2 }}>Fallführende / Ausbildende</div>
            <div style={{ fontSize: "var(--text-body)", fontWeight: 500, color: "var(--text-primary)" }}>{nachweis.ausbildendeName}</div>
          </div>
        </div>
      </div>

      {/* Bestätigungstext */}
      <div style={{ padding: "12px 20px", background: "var(--bg-secondary)", borderRadius: 10, marginBottom: 16, fontSize: "var(--text-small)", color: "var(--text-secondary)", lineHeight: 1.6 }}>
        Die Pflegende Angehörige bestätigt mit ihrer Unterschrift je Position, dass sie ausführlich in der
        Durchführung der aufgeführten Pflegeleistungen angeleitet wurde und die Anleitungen verstanden hat.
      </div>

      {/* Hinweis: fehlende Qualifikation */}
      {fehlQualifikation && (
        <div className="flex items-center" style={{ gap: 8, padding: "10px 16px", background: "var(--status-warning-bg)", borderRadius: 8, marginBottom: 16 }}>
          <AlertTriangle style={{ width: 16, height: 16, color: "var(--status-warning-text)", flexShrink: 0 }} />
          <span style={{ fontSize: "var(--text-small)", color: "var(--status-warning-text)" }}>
            Keine Qualifikation erfasst — alle Positionen bleiben unterschreibbar. Qualifikation im Onboarding ergänzen.
          </span>
        </div>
      )}

      {/* Fortschritt */}
      <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
        <span style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>
          {unterschrieben.length} von {unterschreibbar.length} Positionen unterschrieben
        </span>
        <span style={{
          padding: "2px 10px", borderRadius: 999, fontSize: "var(--text-meta)", fontWeight: 500,
          background: istAbgeschlossen ? "var(--status-success-bg)" : kannAbschliessen ? "var(--brand-primary-light)" : "var(--bg-secondary)",
          color: istAbgeschlossen ? "var(--status-success)" : kannAbschliessen ? "var(--brand-primary)" : "var(--text-tertiary)",
        }}>
          {istAbgeschlossen ? "Abgeschlossen" : kannAbschliessen ? "Bereit zum Abschluss" : `${unterschrieben.length}/${unterschreibbar.length}`}
        </span>
      </div>

      {/* Positionen nach Bereich */}
      <div className="flex flex-col" style={{ gap: 20 }}>
        {gruppen.map(gruppe => (
          <div key={gruppe.bereich}>
            <div style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)", letterSpacing: "0.05em", textTransform: "uppercase" as const, fontWeight: 500, marginBottom: 8, paddingLeft: 2 }}>
              {gruppe.bereich}
            </div>
            <div className="flex flex-col" style={{ gap: 8 }}>
              {gruppe.positionen.map(pos => (
                <PositionsKarte
                  key={pos.nr}
                  position={pos}
                  nachweisId={nachweis.id}
                  istAbgeschlossen={istAbgeschlossen}
                  benutzer={nachweis.angehoerigerName}
                  onUnterschrieben={refresh}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Abschluss-Button */}
      {!istAbgeschlossen && kannAbschliessen && (
        <div style={{ marginTop: 24, padding: "16px 20px", background: "var(--brand-primary-light)", borderRadius: 12, textAlign: "center" }}>
          <div style={{ fontSize: "var(--text-small)", color: "var(--text-primary)", marginBottom: 10 }}>
            Alle {unterschreibbar.length} Positionen unterschrieben. Nachweis abschliessen?
          </div>
          <button onClick={handleAbschliessen} className="inline-flex items-center cursor-pointer" style={{ gap: 6, padding: "10px 24px", borderRadius: 999, background: "var(--brand-primary)", color: "var(--text-on-dark)", fontSize: 14, fontWeight: 500, border: "none" }}>
            <Lock style={{ width: 14, height: 14 }} /> Nachweis abschliessen
          </button>
        </div>
      )}

      {/* Versionsangaben */}
      <div style={{ marginTop: 32, padding: "10px 16px", background: "var(--bg-secondary)", borderRadius: 8, fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>
        Katalog: {nachweis.katalogVersion} · Vorlage: {nachweis.vorlagenVersion}
        {nachweis.integritaetsHash && <> · Hash: {nachweis.integritaetsHash.slice(0, 12)}…</>}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   POSITIONSKARTE mit Unterschrift
   ══════════════════════════════════════════ */

function PositionsKarte({ position, nachweisId, istAbgeschlossen, benutzer, onUnterschrieben }: {
  position: AufbereitetePosition;
  nachweisId: string;
  istAbgeschlossen: boolean;
  benutzer: string;
  onUnterschrieben: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showSignPad, setShowSignPad] = useState(false);
  const istUnterschrieben = !!position.unterschrift;
  const nichtErlaubt = !position.qualErlaubt;

  return (
    <div style={{
      padding: "12px 16px", borderRadius: 10,
      background: nichtErlaubt ? "var(--bg-secondary)" : "var(--bg-elevated)",
      border: `0.5px solid ${istUnterschrieben ? "var(--status-success)" : nichtErlaubt ? "var(--status-danger)" : "var(--border-default)"}`,
      opacity: nichtErlaubt ? 0.7 : 1,
    }}>
      {/* Kopfzeile */}
      <div className="flex items-start justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start" style={{ gap: 10, flex: 1 }}>
          {istUnterschrieben ? (
            <CheckCircle2 style={{ width: 18, height: 18, color: "var(--status-success)", flexShrink: 0, marginTop: 1 }} />
          ) : nichtErlaubt ? (
            <AlertTriangle style={{ width: 18, height: 18, color: "var(--status-danger)", flexShrink: 0, marginTop: 1 }} />
          ) : (
            <ClipboardList style={{ width: 18, height: 18, color: "var(--text-tertiary)", flexShrink: 0, marginTop: 1 }} />
          )}
          <div>
            <div className="flex items-center flex-wrap" style={{ gap: 6 }}>
              <span style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)", fontFamily: "monospace" }}>{position.nr}</span>
              <span style={{ fontSize: "var(--text-small)", fontWeight: 500, color: "var(--text-primary)" }}>{position.bezeichnung}</span>
              {position.klvKategorie ? (
                <span style={{ fontSize: "var(--text-meta)", padding: "1px 6px", borderRadius: 4, background: "var(--bg-secondary)", color: "var(--text-tertiary)", fontWeight: 500 }}>
                  {KAT_LABEL[position.klvKategorie] ?? position.klvKategorie}
                </span>
              ) : (
                <span style={{ fontSize: "var(--text-meta)", padding: "1px 6px", borderRadius: 4, background: "var(--status-warning-bg)", color: "var(--status-warning-text)", fontWeight: 500 }}>
                  Kategorie nicht erfasst
                </span>
              )}
            </div>
            {nichtErlaubt && position.qualGrund && (
              <div style={{ fontSize: "var(--text-meta)", color: "var(--status-danger)", marginTop: 2 }}>
                {position.qualGrund}
              </div>
            )}
          </div>
        </div>
        {expanded ? <ChevronUp style={{ width: 14, height: 14, color: "var(--text-tertiary)" }} /> : <ChevronDown style={{ width: 14, height: 14, color: "var(--text-tertiary)" }} />}
      </div>

      {/* Expanded: Schritte + Unterschrift */}
      {expanded && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: "0.5px solid var(--border-default)" }}>
          {/* Ausführungsschritte */}
          {position.schritteVorhanden ? (
            <ol style={{ margin: "0 0 10px 18px", padding: 0, fontSize: "var(--text-small)", color: "var(--text-secondary)", lineHeight: 1.7 }}>
              {position.schritte.map((s, i) => <li key={i}>{s}</li>)}
            </ol>
          ) : (
            <div className="flex items-center" style={{ gap: 6, marginBottom: 10, fontSize: "var(--text-small)", color: "var(--status-warning-text)" }}>
              <Info style={{ width: 12, height: 12 }} /> Keine Ausführungsschritte hinterlegt
            </div>
          )}

          {/* Unterschrift */}
          {istUnterschrieben && position.unterschrift ? (
            <div style={{ padding: "8px 12px", background: "var(--status-success-bg)", borderRadius: 8 }}>
              <div className="flex items-center" style={{ gap: 6, marginBottom: 4 }}>
                <Check style={{ width: 12, height: 12, color: "var(--status-success)" }} />
                <span style={{ fontSize: "var(--text-meta)", color: "var(--status-success)", fontWeight: 500 }}>
                  Unterschrieben am {new Date(position.unterschrift.unterschriebenAm).toLocaleDateString("de-CH")} von {position.unterschrift.unterschriebenVon}
                </span>
              </div>
              {position.unterschrift.signaturDataUrl && (
                <img src={position.unterschrift.signaturDataUrl} alt="Unterschrift" style={{ height: 40, opacity: 0.7 }} />
              )}
            </div>
          ) : nichtErlaubt ? (
            <div style={{ fontSize: "var(--text-meta)", color: "var(--status-danger)", fontStyle: "italic" }}>
              Gemäss Qualifikation nicht zulässig — nicht unterschreibbar
            </div>
          ) : istAbgeschlossen ? null : showSignPad ? (
            <SignaturPad
              onSign={(dataUrl) => {
                const result = positionUnterschreiben(nachweisId, position.nr, dataUrl, benutzer);
                if (result.ok) {
                  setShowSignPad(false);
                  onUnterschrieben();
                  toast(`Position ${position.nr} unterschrieben`);
                }
              }}
              onCancel={() => setShowSignPad(false)}
            />
          ) : (
            <button
              onClick={() => setShowSignPad(true)}
              className="inline-flex items-center cursor-pointer"
              style={{ gap: 6, padding: "8px 16px", borderRadius: 999, background: "var(--brand-primary)", color: "var(--text-on-dark)", fontSize: "var(--text-small)", fontWeight: 500, border: "none" }}
            >
              <Pen style={{ width: 12, height: 12 }} /> Unterschreiben
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   SIGNATUR-PAD (Canvas)
   ══════════════════════════════════════════ */

function SignaturPad({ onSign, onCancel }: { onSign: (dataUrl: string) => void; onCancel: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  const getCtx = () => canvasRef.current?.getContext("2d") ?? null;

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    if ("touches" in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const ctx = getCtx();
    if (!ctx) return;
    setDrawing(true);
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing) return;
    e.preventDefault();
    const ctx = getCtx();
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDraw = () => setDrawing(false);

  const clear = () => {
    const ctx = getCtx();
    if (!ctx || !canvasRef.current) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setHasDrawn(false);
  };

  const confirm = () => {
    if (!canvasRef.current || !hasDrawn) return;
    // Komprimiert als PNG, max 300×100
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = 300;
    tempCanvas.height = 100;
    const tempCtx = tempCanvas.getContext("2d")!;
    tempCtx.drawImage(canvasRef.current, 0, 0, 300, 100);
    onSign(tempCanvas.toDataURL("image/png", 0.7));
  };

  return (
    <div style={{ marginTop: 4 }}>
      <div style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)", marginBottom: 4 }}>Unterschrift hier zeichnen:</div>
      <canvas
        ref={canvasRef}
        width={400}
        height={120}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={stopDraw}
        onMouseLeave={stopDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={stopDraw}
        style={{ width: "100%", maxWidth: 400, height: 120, border: "1px solid var(--border-default)", borderRadius: 8, background: "white", cursor: "crosshair", touchAction: "none" }}
      />
      <div className="flex items-center" style={{ gap: 8, marginTop: 6 }}>
        <button onClick={confirm} disabled={!hasDrawn} className="inline-flex items-center cursor-pointer disabled:opacity-40" style={{ gap: 4, padding: "6px 14px", borderRadius: 999, background: "var(--brand-primary)", color: "var(--text-on-dark)", fontSize: "var(--text-meta)", fontWeight: 500, border: "none" }}>
          <Check style={{ width: 11, height: 11 }} /> Bestätigen
        </button>
        <button onClick={clear} className="cursor-pointer" style={{ background: "none", border: "none", fontSize: "var(--text-meta)", color: "var(--text-secondary)", padding: "6px 8px" }}>
          Löschen
        </button>
        <button onClick={onCancel} className="cursor-pointer" style={{ background: "none", border: "none", fontSize: "var(--text-meta)", color: "var(--text-secondary)", padding: "6px 8px" }}>
          Abbrechen
        </button>
      </div>
    </div>
  );
}
