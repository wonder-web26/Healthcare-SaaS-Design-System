/**
 * EinwilligungModal — Zeigt den vollständigen Text, ermöglicht digitale
 * Unterschrift oder PDF-Download als leeres Formular.
 */
import { useState, useRef } from "react";
import { X, Download, Check, AlertTriangle, Info, Pen } from "lucide-react";
import {
  erzeugeEinwilligungstext,
  RECHTLICHER_HINWEIS,
  ORG_STAMMDATEN,
  type EinwilligungDaten,
  type UnterzeichnerInfo,
  type UnterzeichnerTyp,
  type VertretungsGrundlage,
} from "../../../lib/einwilligung/vorlage";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSignDigital: (unterzeichner: UnterzeichnerInfo, datum: string) => void;
  patientName: string;
  patientGeburtsdatum: string;
  angehoerigerName?: string;
}

const VERTRETUNG_OPTIONEN: { value: VertretungsGrundlage; label: string }[] = [
  { value: "vorsorgeauftrag", label: "Vorsorgeauftrag" },
  { value: "beistandschaft", label: "Beistandschaft" },
  { value: "vollmacht", label: "Vollmacht" },
  { value: "andere", label: "Andere Grundlage" },
];

export function EinwilligungModal({ isOpen, onClose, onSignDigital, patientName, patientGeburtsdatum, angehoerigerName }: Props) {
  const [phase, setPhase] = useState<"lesen" | "unterschreiben">("lesen");
  const [unterzeichnerTyp, setUnterzeichnerTyp] = useState<UnterzeichnerTyp>("patient");
  const [unterzeichnerName, setUnterzeichnerName] = useState(patientName || "Patient/in");
  const [vertretungsGrundlage, setVertretungsGrundlage] = useState<VertretungsGrundlage>("vorsorgeauftrag");
  const [vertretungsAndere, setVertretungsAndere] = useState("");
  const [ort, setOrt] = useState("Zürich");
  const [hasDrawn, setHasDrawn] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);

  if (!isOpen) return null;

  const daten: EinwilligungDaten = {
    patientName,
    patientGeburtsdatum,
    organisationName: ORG_STAMMDATEN.name,
    organisationAdresse: ORG_STAMMDATEN.adresse,
    organisationAnsprechperson: ORG_STAMMDATEN.ansprechperson,
  };
  const text = erzeugeEinwilligungstext(daten);

  const istAngestellterAngehoeriger = unterzeichnerTyp === "vertretung" && !!angehoerigerName && unterzeichnerName.trim() === angehoerigerName.trim();

  // Canvas-Zeichnen
  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    if ("touches" in e) return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };
  const startDraw = (e: React.MouseEvent | React.TouchEvent) => { e.preventDefault(); setDrawing(true); const ctx = canvasRef.current?.getContext("2d"); if (ctx) { const p = getPos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); } };
  const draw = (e: React.MouseEvent | React.TouchEvent) => { if (!drawing) return; e.preventDefault(); const ctx = canvasRef.current?.getContext("2d"); if (ctx) { const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.strokeStyle = "#1a1a1a"; ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.stroke(); setHasDrawn(true); } };
  const stopDraw = () => setDrawing(false);
  const clearCanvas = () => { canvasRef.current?.getContext("2d")?.clearRect(0, 0, 400, 120); setHasDrawn(false); };

  const handleSign = () => {
    if (!hasDrawn) return;
    const datum = new Date().toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit", year: "numeric" });
    const info: UnterzeichnerInfo = {
      typ: unterzeichnerTyp,
      name: unterzeichnerName,
      vertretungsGrundlage: unterzeichnerTyp === "vertretung" ? vertretungsGrundlage : undefined,
      vertretungsGrundlageAndere: unterzeichnerTyp === "vertretung" && vertretungsGrundlage === "andere" ? vertretungsAndere : undefined,
      istAngestellterAngehoeriger,
    };
    onSignDigital(info, datum);
    onClose();
  };

  const handleDownloadLeer = async () => {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontSize = 9;
    const lineHeight = 13;
    const margin = 50;

    let page = pdfDoc.addPage([595, 842]); // A4
    let y = 792;

    const writeText = (t: string, bold = false, size = fontSize) => {
      const f = bold ? fontBold : font;
      for (const line of t.split("\n")) {
        if (y < 60) { page = pdfDoc.addPage([595, 842]); y = 792; }
        page.drawText(line, { x: margin, y, font: f, size, color: rgb(0.1, 0.1, 0.1) });
        y -= lineHeight;
      }
    };

    // Hinweis
    writeText(`⚠ ${RECHTLICHER_HINWEIS}`, false, 7);
    y -= 10;

    // Text
    writeText(text);
    y -= 20;

    // Leere Felder
    writeText("Ort: _________________________    Datum: _________________________");
    y -= 20;
    writeText("Unterschrift: _________________________");
    y -= 10;
    writeText("Name in Druckschrift: _________________________");
    y -= 10;
    writeText("☐ Patient/in selbst    ☐ Vertretungsberechtigte Person");
    y -= 10;
    writeText("Grundlage der Vertretung: _________________________");

    const bytes = await pdfDoc.save();
    const blob = new Blob([bytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `Einwilligung_${patientName.replace(/\s+/g, "_")}_leer.pdf`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center" style={{ background: "rgba(19,19,20,0.6)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="flex flex-col" style={{ background: "var(--bg-elevated)", borderRadius: 16, boxShadow: "var(--shadow-overlay)", maxWidth: 720, maxHeight: "92vh", width: "94%", overflow: "hidden" }}>
        {/* Header */}
        <div className="flex items-center justify-between shrink-0" style={{ padding: "16px 24px", borderBottom: "0.5px solid var(--border-default)" }}>
          <div style={{ fontSize: "var(--text-h3)", fontWeight: 500, color: "var(--text-primary)" }}>Einwilligungserklärung</div>
          <button onClick={onClose} className="cursor-pointer" style={{ background: "none", border: "none", padding: 4, color: "var(--text-tertiary)" }}><X style={{ width: 18, height: 18 }} /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto" style={{ padding: "20px 24px" }}>
          {/* Rechtlicher Hinweis */}
          <div className="flex items-start" style={{ gap: 8, padding: "10px 14px", background: "var(--status-warning-bg)", borderRadius: 8, marginBottom: 16 }}>
            <AlertTriangle style={{ width: 14, height: 14, color: "var(--status-warning-text)", flexShrink: 0, marginTop: 2 }} />
            <span style={{ fontSize: "var(--text-meta)", color: "var(--status-warning-text)", lineHeight: 1.5 }}>{RECHTLICHER_HINWEIS}</span>
          </div>

          {/* Dokumenttext */}
          <div style={{ fontSize: "var(--text-small)", color: "var(--text-primary)", lineHeight: 1.7, whiteSpace: "pre-wrap", marginBottom: 20 }}>
            {text}
          </div>

          {phase === "lesen" && (
            <div className="flex items-center flex-wrap" style={{ gap: 8 }}>
              <button onClick={() => setPhase("unterschreiben")} className="inline-flex items-center cursor-pointer" style={{ gap: 6, padding: "10px 22px", borderRadius: 999, background: "var(--brand-primary)", color: "var(--text-on-dark)", fontSize: 14, fontWeight: 500, border: "none" }}>
                <Pen style={{ width: 14, height: 14 }} /> Digital unterschreiben
              </button>
              <button onClick={handleDownloadLeer} className="inline-flex items-center cursor-pointer" style={{ gap: 6, padding: "10px 22px", borderRadius: 999, background: "var(--bg-secondary)", color: "var(--text-primary)", fontSize: 14, fontWeight: 500, border: "0.5px solid var(--border-default)" }}>
                <Download style={{ width: 14, height: 14 }} /> Als leeres PDF herunterladen
              </button>
            </div>
          )}

          {phase === "unterschreiben" && (
            <div style={{ borderTop: "0.5px solid var(--border-default)", paddingTop: 16 }}>
              {/* Unterzeichnende Person */}
              <div style={{ fontSize: "var(--text-small)", fontWeight: 500, color: "var(--text-primary)", marginBottom: 8 }}>Unterzeichnende Person</div>
              <div className="flex items-center" style={{ gap: 12, marginBottom: 8 }}>
                <label className="flex items-center cursor-pointer" style={{ gap: 4, fontSize: "var(--text-small)" }}>
                  <input type="radio" checked={unterzeichnerTyp === "patient"} onChange={() => { setUnterzeichnerTyp("patient"); setUnterzeichnerName(patientName); }} /> Patient/in selbst
                </label>
                <label className="flex items-center cursor-pointer" style={{ gap: 4, fontSize: "var(--text-small)" }}>
                  <input type="radio" checked={unterzeichnerTyp === "vertretung"} onChange={() => { setUnterzeichnerTyp("vertretung"); setUnterzeichnerName(""); }} /> Vertretungsberechtigte Person
                </label>
              </div>

              {unterzeichnerTyp === "vertretung" && (
                <div style={{ marginBottom: 10 }}>
                  <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 8, marginBottom: 8 }}>
                    <div>
                      <label style={{ display: "block", fontSize: "var(--text-meta)", color: "var(--text-secondary)", marginBottom: 2 }}>Name der vertretungsberechtigten Person</label>
                      <input value={unterzeichnerName} onChange={e => setUnterzeichnerName(e.target.value)} placeholder="Vorname Name" style={{ width: "100%", padding: "6px 10px", fontSize: "var(--text-small)", borderRadius: 8, border: "0.5px solid var(--border-default)", background: "var(--bg-secondary)", color: "var(--text-primary)", fontFamily: "inherit" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "var(--text-meta)", color: "var(--text-secondary)", marginBottom: 2 }}>Grundlage der Vertretung</label>
                      <select value={vertretungsGrundlage} onChange={e => setVertretungsGrundlage(e.target.value as VertretungsGrundlage)} style={{ width: "100%", padding: "6px 10px", fontSize: "var(--text-small)", borderRadius: 8, border: "0.5px solid var(--border-default)", background: "var(--bg-secondary)", color: "var(--text-primary)", fontFamily: "inherit" }}>
                        {VERTRETUNG_OPTIONEN.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                  </div>
                  {vertretungsGrundlage === "andere" && (
                    <input value={vertretungsAndere} onChange={e => setVertretungsAndere(e.target.value)} placeholder="Grundlage beschreiben" style={{ width: "100%", padding: "6px 10px", fontSize: "var(--text-small)", borderRadius: 8, border: "0.5px solid var(--border-default)", background: "var(--bg-secondary)", color: "var(--text-primary)", fontFamily: "inherit", marginBottom: 8 }} />
                  )}
                  {istAngestellterAngehoeriger && (
                    <div className="flex items-center" style={{ gap: 6, padding: "8px 12px", background: "var(--status-warning-bg)", borderRadius: 8, marginBottom: 8 }}>
                      <Info style={{ width: 12, height: 12, color: "var(--status-warning-text)", flexShrink: 0 }} />
                      <span style={{ fontSize: "var(--text-meta)", color: "var(--status-warning-text)" }}>
                        Die unterzeichnende Person ist zugleich der/die bei der Organisation angestellte pflegende Angehörige.
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Ort + Datum */}
              <div className="grid grid-cols-2" style={{ gap: 8, marginBottom: 10 }}>
                <div>
                  <label style={{ display: "block", fontSize: "var(--text-meta)", color: "var(--text-secondary)", marginBottom: 2 }}>Ort</label>
                  <input value={ort} onChange={e => setOrt(e.target.value)} style={{ width: "100%", padding: "6px 10px", fontSize: "var(--text-small)", borderRadius: 8, border: "0.5px solid var(--border-default)", background: "var(--bg-secondary)", color: "var(--text-primary)", fontFamily: "inherit" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "var(--text-meta)", color: "var(--text-secondary)", marginBottom: 2 }}>Datum</label>
                  <input value={new Date().toLocaleDateString("de-CH")} disabled style={{ width: "100%", padding: "6px 10px", fontSize: "var(--text-small)", borderRadius: 8, border: "0.5px solid var(--border-default)", background: "var(--bg-secondary)", color: "var(--text-tertiary)", fontFamily: "inherit" }} />
                </div>
              </div>

              {/* Unterschrift Canvas */}
              <div style={{ marginBottom: 10 }}>
                <label style={{ display: "block", fontSize: "var(--text-meta)", color: "var(--text-secondary)", marginBottom: 4 }}>Unterschrift</label>
                <canvas ref={canvasRef} width={400} height={120}
                  onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
                  onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}
                  style={{ width: "100%", maxWidth: 400, height: 120, border: "1px solid var(--border-default)", borderRadius: 8, background: "white", cursor: "crosshair", touchAction: "none" }}
                />
                <div className="flex items-center" style={{ gap: 8, marginTop: 4 }}>
                  <button onClick={clearCanvas} className="cursor-pointer" style={{ background: "none", border: "none", fontSize: "var(--text-meta)", color: "var(--text-secondary)", padding: "4px 8px" }}>Löschen</button>
                </div>
              </div>

              <div className="flex items-center" style={{ gap: 8 }}>
                <button onClick={handleSign} disabled={!hasDrawn} className="inline-flex items-center cursor-pointer disabled:opacity-40" style={{ gap: 6, padding: "10px 22px", borderRadius: 999, background: "var(--brand-primary)", color: "var(--text-on-dark)", fontSize: 14, fontWeight: 500, border: "none" }}>
                  <Check style={{ width: 14, height: 14 }} /> Unterschreiben und bestätigen
                </button>
                <button onClick={() => setPhase("lesen")} className="cursor-pointer" style={{ background: "none", border: "none", fontSize: "var(--text-small)", color: "var(--text-secondary)", padding: "10px 12px" }}>Zurück</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
