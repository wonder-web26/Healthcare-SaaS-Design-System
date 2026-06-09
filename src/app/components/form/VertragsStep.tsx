/**
 * Migrated Vertragsunterzeichnung step for the onboarding wizard.
 */
import { useState } from "react";
import { FileSignature, FileText, AlertTriangle, CircleCheck, Eye } from "lucide-react";
import { SignaturModal, type SignatureData } from "./SignaturModal";
import { useEinwilligung } from "../EinwilligungContext";

type DocKey = "stellenbeschreibung" | "arbeitsvertrag" | "datenschutzerklaerung" | "einwilligungserklaerung";

interface DocumentSignature {
  signed: boolean;
  signedAt: Date | null;
  signedBy: string | null;
}

interface Props {
  angehoerigerName: string;
  stundenlohn?: string;
  eintrittsdatum?: string;
  onValidityChange?: (valid: boolean) => void;
  onComplete?: () => void;
}

const DOCS: { key: DocKey; title: string; pages: number; required: boolean }[] = [
  { key: "stellenbeschreibung", title: "Stellenbeschreibung", pages: 2, required: false },
  { key: "arbeitsvertrag", title: "Arbeitsvertrag", pages: 4, required: true },
  // "Einwilligungserklärung Datenschutz" = dasselbe Dokument wie im Dokumente-Tab.
  // Ein Objekt, ein Name, ein Status (über EinwilligungContext).
  { key: "datenschutzerklaerung", title: "Einwilligungserklärung Datenschutz", pages: 2, required: false },
  // "Einwilligungserklärung" = separates Dokument (allg. Einverständniserklärung für die Betreuung).
  // Kein Bezug zum Arzt-Anfrage-Gating. Identität: allgemeine Zustimmung zur pflegerischen Betreuung.
  { key: "einwilligungserklaerung", title: "Einwilligungserklärung", pages: 1, required: false },
];

function formatDateDE(d: Date): string {
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}
function formatTimeDE(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function VertragsStep({ angehoerigerName, stundenlohn, eintrittsdatum, onValidityChange, onComplete }: Props) {
  const einwilligung = useEinwilligung();

  // Initialize datenschutzerklaerung from shared context (may have been signed in Dokumente-Tab)
  const [signatures, setSignatures] = useState<Record<DocKey, DocumentSignature>>(() => ({
    stellenbeschreibung: { signed: false, signedAt: null, signedBy: null },
    arbeitsvertrag: { signed: false, signedAt: null, signedBy: null },
    datenschutzerklaerung: einwilligung.status.signiert
      ? { signed: true, signedAt: new Date(), signedBy: einwilligung.status.herkunft === "scan" ? "Scan-Upload" : null }
      : { signed: false, signedAt: null, signedBy: null },
    einwilligungserklaerung: { signed: false, signedAt: null, signedBy: null },
  }));
  const [modalDoc, setModalDoc] = useState<DocKey | null>(null);
  const [modalReadOnly, setModalReadOnly] = useState(false);

  const arbeitsvertragSigned = signatures.arbeitsvertrag.signed;
  // datenschutzerklaerung IS the shared Einwilligungs-Dokument
  const datenschutzSigned = einwilligung.status.signiert || signatures.datenschutzerklaerung.signed;
  const signedCount = Object.values(signatures).filter(s => s.signed).length;

  const handleSign = (key: DocKey, sig: SignatureData) => {
    const next = { ...signatures, [key]: { signed: true, signedAt: sig.signedAt, signedBy: sig.signedBy } };
    setSignatures(next);
    if (key === "arbeitsvertrag") {
      onValidityChange?.(true);
    }
    // "Einwilligungserklärung Datenschutz" signed digitally → update shared context
    if (key === "datenschutzerklaerung") {
      const datum = sig.signedAt
        ? sig.signedAt.toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit", year: "numeric" })
        : new Date().toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit", year: "numeric" });
      einwilligung.signDigital(datum);
    }
  };

  const openSign = (key: DocKey) => { setModalDoc(key); setModalReadOnly(false); };
  const openView = (key: DocKey) => { setModalDoc(key); setModalReadOnly(true); };

  return (
    <div style={{ padding: "16px 32px var(--space-8)" }}>
      {/* Workspace-Kopf entfernt — Schritt-Titel und Status leben im Onboarding-Header */}

      {/* Signatur-Status (kompakt, inline) */}
      <div className="flex items-center justify-between" style={{ marginBottom: "var(--space-4)" }}>
        <span style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>
          {signedCount} von 4 Dokumenten unterschrieben
        </span>
        <span className="inline-flex items-center" style={{
          gap: 4, padding: "2px 10px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-meta)", fontWeight: 500,
          background: signedCount === 4 ? "var(--status-success-bg)" : arbeitsvertragSigned ? "var(--brand-primary-light)" : "var(--bg-secondary)",
          color: signedCount === 4 ? "var(--status-success-text)" : arbeitsvertragSigned ? "var(--brand-primary)" : "var(--text-secondary)",
        }}>
          {signedCount === 4 ? "Abgeschlossen" : arbeitsvertragSigned ? "Bereit" : `${signedCount}/4`}
        </span>
      </div>

      {/* Hard-gate banner */}
      {!arbeitsvertragSigned && (
        <div className="flex items-center" style={{ gap: "var(--space-3)", padding: "var(--space-4) var(--space-5)", background: "var(--status-warning-bg)", borderRadius: "var(--radius-card)", marginBottom: "var(--space-6)" }}>
          <AlertTriangle style={{ width: 20, height: 20, color: "var(--status-warning-text)", flexShrink: 0 }} />
          <div className="flex-1">
            <div style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--status-warning-text)" }}>
              Betreuung kann erst aktiviert werden, wenn der Arbeitsvertrag unterschrieben ist
            </div>
            <div style={{ fontSize: "var(--text-small)", color: "var(--text-primary)", marginTop: 2 }}>
              {signedCount} von 4 Dokumenten unterschrieben · Arbeitsvertrag: Noch nicht unterschrieben
            </div>
          </div>
          <button type="button" onClick={() => openSign("arbeitsvertrag")} className="shrink-0 inline-flex items-center cursor-pointer transition-colors"
            style={{ gap: "var(--space-2)", padding: "10px 22px", borderRadius: "var(--radius-pill)", background: "var(--brand-primary)", color: "var(--text-on-dark)", fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", border: "none" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--brand-primary-dark)"} onMouseLeave={e => e.currentTarget.style.background = "var(--brand-primary)"}>
            <FileSignature style={{ width: 14, height: 14 }} /> Arbeitsvertrag öffnen
          </button>
        </div>
      )}

      {/* Sub-info */}
      <div style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", marginBottom: "var(--space-4)" }}>
        {signedCount} von 4 Dokumenten unterschrieben
      </div>

      {/* Document list */}
      <div className="flex flex-col" style={{ gap: "var(--space-3)" }}>
        {DOCS.map(doc => {
          const sig = signatures[doc.key];
          // datenschutzerklaerung = das geteilte Einwilligungs-Dokument (ein Objekt, zwei Fenster)
          const isDatenschutz = doc.key === "datenschutzerklaerung";
          const isSigned = isDatenschutz ? datenschutzSigned : sig.signed;
          const statusLabel = isDatenschutz && einwilligung.status.signiert && einwilligung.status.herkunft === "scan"
            ? `Signiert (Scan) · ${einwilligung.status.datum}`
            : isDatenschutz && einwilligung.status.signiert
              ? `Signiert digital · ${einwilligung.status.datum}`
              : isSigned
                ? "Unterschrieben"
                : "Nicht unterschrieben";
          return (
            <div key={doc.key} className="flex items-center" style={{ gap: "var(--space-4)", padding: "var(--space-4) var(--space-5)", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)" }}>
              {/* Icon */}
              <div className="shrink-0 flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: "var(--radius-card)", background: "var(--bg-secondary)" }}>
                <FileText style={{ width: 18, height: 18, color: "var(--text-secondary)" }} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center" style={{ gap: "var(--space-2)" }}>
                  <span style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>{doc.title}</span>
                  {doc.required && (
                    <span className="inline-flex items-center" style={{ gap: 4, padding: "2px 8px", borderRadius: "var(--radius-pill)", background: "var(--status-warning-bg)", color: "var(--status-warning-text)", fontSize: "var(--text-micro)", fontWeight: "var(--weight-medium)" }}>
                      <span style={{ width: 4, height: 4, borderRadius: "var(--radius-pill)", background: "var(--status-warning)" }} /> Pflicht
                    </span>
                  )}
                </div>
                <div style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", marginTop: 2 }}>
                  {doc.pages} Seiten
                  {sig.signed && sig.signedAt && <> · unterschrieben am {formatDateDE(sig.signedAt)} um {formatTimeDE(sig.signedAt)}</>}
                </div>
              </div>

              {/* Status + Action */}
              <div className="flex items-center shrink-0" style={{ gap: "var(--space-2)" }}>
                <span className="inline-flex items-center" style={{
                  gap: 4, padding: "4px 12px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)",
                  background: isSigned ? "var(--status-success-bg)" : "var(--bg-secondary)",
                  color: isSigned ? "var(--status-success-text)" : "var(--text-secondary)",
                }}>
                  {isSigned ? <CircleCheck style={{ width: 12, height: 12 }} /> : <span style={{ width: 5, height: 5, borderRadius: "var(--radius-pill)", background: "currentColor" }} />}
                  {statusLabel}
                </span>

                {isSigned ? (
                  <button type="button" onClick={() => openView(doc.key)} className="inline-flex items-center cursor-pointer transition-colors"
                    style={{ gap: "var(--space-1)", padding: "6px 14px", borderRadius: "var(--radius-pill)", background: "transparent", border: "none", fontSize: "var(--text-small)", color: "var(--text-secondary)", fontWeight: "var(--weight-medium)" }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <Eye style={{ width: 14, height: 14 }} /> Ansehen
                  </button>
                ) : isDatenschutz && einwilligung.status.signiert ? (
                  /* Einwilligungserklärung Datenschutz already signed via earlier path (Schritt 2) — status only */
                  null
                ) : (
                  <button type="button" onClick={() => openSign(doc.key)} className="inline-flex items-center cursor-pointer transition-colors"
                    style={{ gap: "var(--space-2)", padding: "10px 22px", borderRadius: "var(--radius-pill)", background: "var(--brand-primary)", color: "var(--text-on-dark)", fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", border: "none" }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--brand-primary-dark)"} onMouseLeave={e => e.currentTarget.style.background = "var(--brand-primary)"}>
                    <FileSignature style={{ width: 14, height: 14 }} /> Unterschreiben
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Signatur-Modal */}
      {modalDoc && (
        <SignaturModal
          isOpen
          onClose={() => setModalDoc(null)}
          onSign={sig => handleSign(modalDoc, sig)}
          documentType={modalDoc}
          angehoerigerName={angehoerigerName}
          stundenlohn={stundenlohn}
          eintrittsdatum={eintrittsdatum}
          alreadySigned={modalReadOnly}
          signedAt={signatures[modalDoc].signedAt ?? undefined}
          signedBy={signatures[modalDoc].signedBy ?? undefined}
        />
      )}
    </div>
  );
}
