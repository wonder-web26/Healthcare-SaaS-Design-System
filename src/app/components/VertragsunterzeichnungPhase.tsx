import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  FileSignature,
  CheckCircle2,
  ChevronRight,
  Loader2,
  FileText,
  PenTool,
  X,
  Eye,
  AlertTriangle,
} from "lucide-react";

/* ══════════════════════════════════════════
   DOCUMENT DEFINITIONS
   ══════════════════════════════════════════ */
interface ContractDoc {
  id: string;
  title: string;
  pages: number;
  seed: number;
  /** If true, this document is the hard gate for activation */
  isGate?: boolean;
}

const CONTRACT_DOCS: ContractDoc[] = [
  { id: "stellenbeschreibung", title: "Stellenbeschreibung", pages: 2, seed: 1 },
  { id: "arbeitsvertrag", title: "Arbeitsvertrag", pages: 4, seed: 2, isGate: true },
  { id: "datenschutz", title: "Datenschutzerklärung", pages: 2, seed: 3 },
  { id: "einwilligung", title: "Einwilligungserklärung", pages: 1, seed: 4 },
];

const GATE_DOC_ID = "arbeitsvertrag";

/* ══════════════════════════════════════════
   PROPS
   ═════════════════════════════════��════════ */
interface VertragsunterzeichnungPhaseProps {
  onComplete?: () => void;
  onValidityChange?: (valid: boolean) => void;
  onNavigateToBetreuung?: () => void;
  angehoerigerName?: string;
}

/* ══════════════════════════════════════════
   PDF SKELETON — deterministic per doc
   ══════════════════════════════════════════ */
function PdfSkeleton({ seed, pages }: { seed: number; pages: number }) {
  const widths = [
    ["w-3/4", "w-full", "w-5/6", "w-2/3", "w-full", "w-4/5", "w-full", "w-1/2"],
    ["w-full", "w-5/6", "w-3/4", "w-full", "w-2/3", "w-full", "w-4/5", "w-3/4"],
    ["w-2/3", "w-full", "w-full", "w-5/6", "w-3/4", "w-full", "w-1/2", "w-full"],
    ["w-full", "w-3/4", "w-5/6", "w-full", "w-full", "w-2/3", "w-4/5", "w-5/6"],
  ];
  const pattern = widths[(seed - 1) % widths.length];

  return (
    <div className="space-y-10">
      {Array.from({ length: pages }).map((_, pageIdx) => (
        <div key={pageIdx}>
          {pageIdx === 0 && (
            <div className="mb-6">
              <div className="h-3 bg-muted/70 rounded-full w-2/5 mb-2" />
              <div className="h-[1px] bg-border w-full" />
            </div>
          )}
          <div className="space-y-3.5">
            {pattern.map((w, i) => (
              <div
                key={`${pageIdx}-${i}`}
                className={`h-2.5 bg-muted/50 rounded-full ${w}`}
              />
            ))}
          </div>
          {pageIdx < pages - 1 && (
            <div className="mt-8 mb-2 border-t border-dashed border-border-light" />
          )}
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════
   SIGNATURE PAD — isolated canvas
   ══════════════════════════════════════════ */
function SignaturePad({
  onSignatureChange,
  disabled,
}: {
  onSignatureChange: (hasSig: boolean) => void;
  disabled?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [strokes, setStrokes] = useState<{ x: number; y: number }[][]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  const getCoords = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      const c = canvasRef.current;
      if (!c) return { x: 0, y: 0 };
      const rect = c.getBoundingClientRect();
      const cx = "touches" in e ? e.touches[0].clientX : e.clientX;
      const cy = "touches" in e ? e.touches[0].clientY : e.clientY;
      return {
        x: ((cx - rect.left) / rect.width) * c.width,
        y: ((cy - rect.top) / rect.height) * c.height,
      };
    },
    []
  );

  const onDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (disabled) return;
      e.preventDefault();
      setIsDrawing(true);
      setStrokes((prev) => [...prev, [getCoords(e)]]);
    },
    [getCoords, disabled]
  );

  const onMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (!isDrawing || disabled) return;
      e.preventDefault();
      const coords = getCoords(e);
      setStrokes((prev) => {
        const u = [...prev];
        u[u.length - 1] = [...u[u.length - 1], coords];
        return u;
      });
    },
    [isDrawing, getCoords, disabled]
  );

  const onUp = useCallback(() => setIsDrawing(false), []);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    strokes.forEach((s) => {
      if (s.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(s[0].x, s[0].y);
      for (let i = 1; i < s.length; i++) ctx.lineTo(s[i].x, s[i].y);
      ctx.stroke();
    });
  }, [strokes]);

  useEffect(() => {
    onSignatureChange(strokes.some((s) => s.length > 3));
  }, [strokes, onSignatureChange]);

  const clear = () => setStrokes([]);
  const hasSig = strokes.some((s) => s.length > 3);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={640}
        height={140}
        className={`w-full rounded-xl bg-white touch-none ${
          disabled
            ? "border border-success/30 opacity-70"
            : "border-2 border-dashed border-primary/30 cursor-crosshair"
        }`}
        style={{ height: "140px" }}
        onMouseDown={onDown}
        onMouseMove={onMove}
        onMouseUp={onUp}
        onMouseLeave={onUp}
        onTouchStart={onDown}
        onTouchMove={onMove}
        onTouchEnd={onUp}
      />
      {!hasSig && !disabled && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex items-center gap-2 text-muted-foreground/40">
            <PenTool className="w-4 h-4" />
            <span className="text-[13px]">Hier unterschreiben</span>
          </div>
        </div>
      )}
      {hasSig && !disabled && (
        <button
          onClick={clear}
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-card/90 border border-border hover:bg-secondary/60 transition-colors"
          title="Löschen"
        >
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   FULLSCREEN SINGLE-DOC SIGNING MODAL
   ══════════════════════════════════════════ */
function SigningModal({
  doc,
  angehoerigerName,
  alreadySigned,
  onSigned,
  onClose,
}: {
  doc: ContractDoc;
  angehoerigerName: string;
  alreadySigned?: boolean;
  onSigned: (docId: string) => void;
  onClose: () => void;
}) {
  const [hasSig, setHasSig] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleSign = () => {
    setIsSaving(true);
    setTimeout(() => {
      onSigned(doc.id);
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col">
      {/* ── Top Bar ── */}
      <div className="shrink-0 px-4 md:px-6 py-3 border-b border-border flex items-center justify-between bg-card">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="w-8 h-8 rounded-xl border border-border hover:bg-secondary/60 flex items-center justify-center shrink-0 transition-colors disabled:opacity-40"
            title="Schliessen"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
          <div className="min-w-0">
            <div className="text-[14px] text-foreground truncate" style={{ fontWeight: 500 }}>
              {doc.title}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {angehoerigerName}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {alreadySigned && (
            <span
              className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-success-light text-success-foreground"
              style={{ fontWeight: 500 }}
            >
              <CheckCircle2 className="w-3 h-3" />
              Unterschrieben
            </span>
          )}
          {doc.isGate && !alreadySigned && (
            <span
              className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-warning-light text-warning-foreground"
              style={{ fontWeight: 500 }}
            >
              <AlertTriangle className="w-3 h-3" />
              Pflichtdokument
            </span>
          )}
        </div>
      </div>

      {/* ── Saving overlay flash ── */}
      {isSaving && (
        <div className="shrink-0 flex items-center justify-center gap-2 py-2.5 bg-primary-light border-b border-primary/15">
          <Loader2 className="w-4 h-4 text-primary animate-spin" />
          <span className="text-[13px] text-primary" style={{ fontWeight: 500 }}>
            Unterschrift wird gespeichert…
          </span>
        </div>
      )}

      {/* ── PDF Preview (scrollable) ── */}
      <div className="flex-1 overflow-y-auto bg-neutral-light">
        <div className="max-w-2xl mx-auto py-6 md:py-10 px-4 md:px-0">
          <div className="bg-white rounded-2xl shadow-sm border border-border p-6 md:p-10">
            <div className="flex items-center gap-2.5 mb-6">
              <FileText className="w-5 h-5 text-primary" />
              <h4 className="text-foreground">{doc.title}</h4>
            </div>
            <PdfSkeleton seed={doc.seed} pages={doc.pages} />
          </div>
        </div>
      </div>

      {/* ── Bottom Signature Section ── */}
      {alreadySigned ? (
        <div className="shrink-0 border-t border-border bg-card">
          <div className="max-w-2xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <span className="text-[13px] text-success-foreground" style={{ fontWeight: 500 }}>
                Dieses Dokument wurde bereits unterzeichnet.
              </span>
            </div>
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] border border-border bg-card hover:bg-secondary/60 transition-colors"
              style={{ fontWeight: 500 }}
            >
              Schliessen
            </button>
          </div>
        </div>
      ) : (
        <div className="shrink-0 border-t border-border bg-card">
          <div className="max-w-2xl mx-auto px-4 md:px-6 py-4 md:py-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <PenTool className="w-3.5 h-3.5 text-primary" />
                <span className="text-[12px] text-foreground" style={{ fontWeight: 500 }}>
                  Unterschrift — {doc.title}
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground">
                {new Date().toLocaleDateString("de-CH")}
              </span>
            </div>

            <SignaturePad
              onSignatureChange={setHasSig}
              disabled={isSaving}
            />

            <div className="flex justify-end mt-4">
              <button
                onClick={handleSign}
                disabled={!hasSig || isSaving}
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl shadow-sm transition-all text-[14px] ${
                  hasSig && !isSaving
                    ? "bg-primary text-primary-foreground hover:bg-primary-hover"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
                style={{ fontWeight: 500 }}
              >
                <PenTool className="w-4 h-4" />
                Unterschreiben
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   STATUS PILL
   ══════════════════════════════════════════ */
function StatusPill({ signed }: { signed: boolean }) {
  if (signed) {
    return (
      <span
        className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-[3px] rounded-full bg-success-light text-success-foreground"
        style={{ fontWeight: 500 }}
      >
        <CheckCircle2 className="w-3 h-3" />
        Unterschrieben
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-[3px] rounded-full bg-muted text-muted-foreground"
      style={{ fontWeight: 500 }}
    >
      Nicht unterschrieben
    </span>
  );
}

/* ══════════════════════════════════════════
   MAIN EXPORTED COMPONENT
   ══════════════════════════════════════════ */
export function VertragsunterzeichnungPhase({
  onComplete,
  onValidityChange,
  onNavigateToBetreuung,
  angehoerigerName = "Angehörige/r",
}: VertragsunterzeichnungPhaseProps) {
  const [signedDocs, setSignedDocs] = useState<Set<string>>(new Set());
  const [openDocId, setOpenDocId] = useState<string | null>(null);

  const signedCount = signedDocs.size;
  const totalCount = CONTRACT_DOCS.length;
  const gateSigned = signedDocs.has(GATE_DOC_ID);
  const allSigned = signedCount === totalCount;

  // Hard gate: Arbeitsvertrag controls step validity
  useEffect(() => {
    onValidityChange?.(gateSigned);
  }, [gateSigned, onValidityChange]);

  // When all docs signed, fire onComplete
  useEffect(() => {
    if (allSigned) {
      onComplete?.();
    }
  }, [allSigned, onComplete]);

  const handleDocSigned = (docId: string) => {
    setSignedDocs((prev) => new Set([...prev, docId]));
    setOpenDocId(null);
  };

  const openDoc = CONTRACT_DOCS.find((d) => d.id === openDocId) ?? null;

  return (
    <>
      {/* ── Fullscreen signing modal ── */}
      {openDoc && (
        <SigningModal
          doc={openDoc}
          angehoerigerName={angehoerigerName}
          alreadySigned={signedDocs.has(openDoc.id)}
          onSigned={handleDocSigned}
          onClose={() => setOpenDocId(null)}
        />
      )}

      <div className="space-y-5">
        {/* ═════════════════════════════════════
           HEADER STATUS BLOCK
           ═════════════════════════════════════ */}
        {allSigned ? (
          /* ── All signed: Green banner ── */
          <div className="rounded-2xl border border-success/20 bg-success-light p-5 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
              <div className="w-12 h-12 rounded-2xl bg-success/15 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6 text-success" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-success-foreground mb-0.5">
                  Alle Dokumente erfolgreich unterzeichnet
                </h4>
                <p className="text-[13px] text-success-foreground/80">
                  Die Betreuung von {angehoerigerName} ist abrechenbar.
                </p>
              </div>
              <button
                onClick={onNavigateToBetreuung}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm transition-all shrink-0 text-[14px]"
                style={{ fontWeight: 500 }}
              >
                Onboarding abschliessen
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : !gateSigned ? (
          /* ── Arbeitsvertrag NOT signed: Orange banner ── */
          <div className="rounded-2xl border border-warning/20 bg-warning-light p-5 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
              <div className="w-12 h-12 rounded-2xl bg-warning/15 flex items-center justify-center shrink-0">
                <FileSignature className="w-6 h-6 text-warning" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-warning-foreground mb-0.5">
                  Betreuung kann erst aktiviert werden, wenn der Arbeitsvertrag unterschrieben ist.
                </h4>
                <p className="text-[13px] text-warning-foreground/70">
                  {signedCount} von {totalCount} Dokumenten unterschrieben &middot; Arbeitsvertrag: Noch nicht unterschrieben
                </p>
              </div>
              <button
                onClick={() => setOpenDocId(GATE_DOC_ID)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm transition-all shrink-0 text-[14px]"
                style={{ fontWeight: 500 }}
              >
                <PenTool className="w-4 h-4" />
                Arbeitsvertrag öffnen
              </button>
            </div>
          </div>
        ) : (
          /* ── Arbeitsvertrag signed but not all: Neutral info ── */
          <div className="rounded-2xl border border-primary/15 bg-primary-light p-5 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <FileSignature className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-foreground mb-0.5">
                  {signedCount} von {totalCount} Dokumenten unterschrieben
                </h4>
                <p className="text-[13px] text-muted-foreground">
                  Arbeitsvertrag ist unterschrieben. Bitte restliche Dokumente ebenfalls unterzeichnen.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════
           DOCUMENT LIST
           ═════════════════════════════════════ */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          {/* List header */}
          <div className="px-5 py-3.5 border-b border-border-light flex items-center justify-between">
            <span
              className="text-[11px] text-muted-foreground uppercase tracking-wider"
              style={{ fontWeight: 500 }}
            >
              Dokumente
            </span>
            <span className="text-[12px] text-muted-foreground tabular-nums">
              {signedCount} / {totalCount} unterschrieben
            </span>
          </div>

          {/* Document rows */}
          <div className="divide-y divide-border-light">
            {CONTRACT_DOCS.map((doc) => {
              const isSigned = signedDocs.has(doc.id);
              return (
                <div
                  key={doc.id}
                  className={`flex items-center gap-4 px-5 py-4 transition-colors ${
                    isSigned ? "bg-success-light/30" : ""
                  }`}
                >
                  {/* Icon */}
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isSigned
                        ? "bg-success/10"
                        : doc.isGate
                        ? "bg-warning-light"
                        : "bg-muted/50"
                    }`}
                  >
                    {isSigned ? (
                      <CheckCircle2 className="w-4.5 h-4.5 text-success" />
                    ) : (
                      <FileText
                        className={`w-4.5 h-4.5 ${
                          doc.isGate ? "text-warning" : "text-muted-foreground"
                        }`}
                      />
                    )}
                  </div>

                  {/* Name + gate label */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[13px] ${
                          isSigned ? "text-success-foreground" : "text-foreground"
                        }`}
                        style={{ fontWeight: 500 }}
                      >
                        {doc.title}
                      </span>
                      {doc.isGate && !isSigned && (
                        <span
                          className="text-[10px] px-1.5 py-[1px] rounded bg-warning-light text-warning-foreground"
                          style={{ fontWeight: 600 }}
                        >
                          Pflicht
                        </span>
                      )}
                    </div>
                    {isSigned && (
                      <span className="text-[11px] text-muted-foreground mt-0.5 block">
                        Unterschrieben am {new Date().toLocaleDateString("de-CH")}
                      </span>
                    )}
                  </div>

                  {/* Status pill */}
                  <StatusPill signed={isSigned} />

                  {/* Action button */}
                  {isSigned ? (
                    <button
                      onClick={() => setOpenDocId(doc.id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] border border-border bg-card hover:bg-secondary/60 transition-colors shrink-0"
                      style={{ fontWeight: 500 }}
                    >
                      <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                      Öffnen
                    </button>
                  ) : (
                    <button
                      onClick={() => setOpenDocId(doc.id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm transition-all shrink-0"
                      style={{ fontWeight: 500 }}
                    >
                      <PenTool className="w-3.5 h-3.5" />
                      Unterschreiben
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}