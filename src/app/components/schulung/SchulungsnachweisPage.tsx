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
import { exportiereSchulungsnachweisPDF, ladeSchulungsnachweisHerunter } from "../../../lib/schulung/pdf-export";

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
  const unterschreibbar = positionen.filter(p => p.qualErlaubt);
  // Es werden nur die dem Angehörigen zugewiesenen (ausführbaren) Positionen
  // angezeigt und geschult — Kategorie-A-Leistungen erbringt die Spitex selbst.
  const gruppen = gruppiereNachBereich(unterschreibbar);
  const istAbgeschlossen = nachweis.status === "abgeschlossen";
  const fehlQualifikation = !nachweis.angehoerigerQualifikation;
  const signaturDataUrl = nachweis.unterschriften[0]?.signaturDataUrl ?? null;

  // Eine Unterschrift bestätigt die Anleitung zu allen Positionen: auf jede
  // unterschreibbare Position anwenden, dann den Nachweis abschliessen.
  const handleUnterschreiben = async (dataUrl: string) => {
    for (const p of unterschreibbar) {
      if (!p.unterschrift) positionUnterschreiben(nachweis.id, p.nr, dataUrl, nachweis.angehoerigerName);
    }
    const result = await nachweisAbschliessen(nachweis.id, unterschreibbar.map(p => p.nr), nachweis.ausbildendeName);
    if (result.ok) { toast("Initialschulung abgeschlossen"); refresh(); }
    else { toast(result.fehler ?? "Fehler beim Abschliessen"); }
  };

  const handlePdf = async () => {
    // gruppen enthält bereits nur die zugewiesenen (ausführbaren) Positionen —
    // Kategorie-A-Leistungen erbringt die Spitex selbst, sie gehören nicht ins
    // Dokument und werden nicht geschult.
    const gruppenPdf = gruppen.map(g => ({
      bereich: g.bereich,
      positionen: g.positionen.map(p => ({ nr: p.nr, bezeichnung: p.bezeichnung, klvKategorie: p.klvKategorie, schritte: p.schritte })),
    }));
    const blob = await exportiereSchulungsnachweisPDF(nachweis, gruppenPdf, signaturDataUrl);
    ladeSchulungsnachweisHerunter(blob, nachweis.id);
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
        Die pflegende Angehörige bestätigt mit ihrer Unterschrift, dass sie ausführlich in der Durchführung
        der unten aufgeführten Pflegeleistungen angeleitet wurde und die Anleitungen verstanden hat.
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

      {/* Positionsanzahl */}
      <div style={{ marginBottom: 16, fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>
        {unterschreibbar.length} {unterschreibbar.length === 1 ? "Leistungsposition" : "Leistungspositionen"} für diese Betreuung
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
                <PositionsZeile key={pos.nr} position={pos} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Unterschrift + Abschluss / PDF */}
      <div style={{ marginTop: 24, padding: 20, background: "var(--bg-elevated)", border: "0.5px solid var(--border-default)", borderRadius: 12 }}>
        {istAbgeschlossen ? (
          <div>
            <div className="flex items-center" style={{ gap: 6, marginBottom: 12 }}>
              <CheckCircle2 style={{ width: 16, height: 16, color: "var(--status-success)" }} />
              <span style={{ fontSize: "var(--text-small)", fontWeight: 500, color: "var(--status-success-text)" }}>
                Abgeschlossen{nachweis.abgeschlossenAm ? ` am ${new Date(nachweis.abgeschlossenAm).toLocaleDateString("de-CH")}` : ""} · {nachweis.angehoerigerName}
              </span>
            </div>
            {signaturDataUrl && (
              <img src={signaturDataUrl} alt="Unterschrift" style={{ height: 60, background: "white", border: "0.5px solid var(--border-default)", borderRadius: 8, padding: 4, marginBottom: 12 }} />
            )}
            <button onClick={handlePdf} className="ui-fokusring inline-flex items-center cursor-pointer" style={{ gap: 6, padding: "10px 22px", borderRadius: 999, background: "var(--brand-primary)", color: "var(--text-on-dark)", fontSize: 14, fontWeight: 500, border: "none" }}>
              <Download style={{ width: 15, height: 15 }} /> PDF herunterladen
            </button>
          </div>
        ) : unterschreibbar.length === 0 ? (
          <div style={{ fontSize: "var(--text-small)", color: "var(--status-warning-text)" }}>
            Keine unterschreibbaren Positionen — bitte Qualifikation prüfen.
          </div>
        ) : (
          <div>
            <div style={{ fontSize: "var(--text-body)", fontWeight: 500, color: "var(--text-primary)", marginBottom: 4 }}>
              Unterschrift der pflegenden Angehörigen
            </div>
            <div style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", marginBottom: 12 }}>
              Mit der Unterschrift wird die Anleitung zu allen {unterschreibbar.length} Positionen bestätigt und die Initialschulung abgeschlossen.
            </div>
            <SignaturPad onSign={handleUnterschreiben} onCancel={() => {}} />
          </div>
        )}
      </div>

      {/* Versionsangaben */}
      <div style={{ marginTop: 32, padding: "10px 16px", background: "var(--bg-secondary)", borderRadius: 8, fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>
        Katalog: {nachweis.katalogVersion} · Vorlage: {nachweis.vorlagenVersion}
        {nachweis.integritaetsHash && <> · Hash: {nachweis.integritaetsHash.slice(0, 12)}…</>}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   POSITIONSZEILE — Leistungsposition mit sichtbaren Ausführungsschritten
   ══════════════════════════════════════════ */

function PositionsZeile({ position }: { position: AufbereitetePosition }) {
  const nichtErlaubt = !position.qualErlaubt;
  return (
    <div style={{ padding: "12px 16px", borderRadius: 10, background: "var(--bg-elevated)", border: "0.5px solid var(--border-default)", opacity: nichtErlaubt ? 0.6 : 1 }}>
      <div className="flex items-start" style={{ gap: 10 }}>
        <ClipboardList style={{ width: 16, height: 16, color: "var(--text-tertiary)", flexShrink: 0, marginTop: 2 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="flex items-center flex-wrap" style={{ gap: 6 }}>
            <span style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)", fontFamily: "monospace" }}>{position.nr}</span>
            <span style={{ fontSize: "var(--text-small)", fontWeight: 500, color: "var(--text-primary)" }}>{position.bezeichnung}</span>
            {position.klvKategorie && (
              <span style={{ fontSize: "var(--text-meta)", padding: "1px 6px", borderRadius: 4, background: "var(--bg-secondary)", color: "var(--text-tertiary)", fontWeight: 500 }}>
                {KAT_LABEL[position.klvKategorie] ?? position.klvKategorie}
              </span>
            )}
            {nichtErlaubt && (
              <span style={{ fontSize: "var(--text-meta)", padding: "1px 6px", borderRadius: 4, background: "var(--status-warning-bg)", color: "var(--status-warning-text)", fontWeight: 500 }}>
                Qualifikation prüfen
              </span>
            )}
          </div>
          {/* Ausführungsschritte — direkt sichtbar (was exakt zu tun ist) */}
          {position.schritteVorhanden ? (
            <ol style={{ margin: "8px 0 0 18px", padding: 0, fontSize: "var(--text-small)", color: "var(--text-secondary)", lineHeight: 1.7 }}>
              {position.schritte.map((s, i) => <li key={i}>{s}</li>)}
            </ol>
          ) : (
            <div className="flex items-center" style={{ gap: 6, marginTop: 6, fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>
              <Info style={{ width: 12, height: 12 }} /> Keine Ausführungsschritte hinterlegt
            </div>
          )}
        </div>
      </div>
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
