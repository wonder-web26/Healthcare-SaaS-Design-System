import { useState, useEffect } from "react";
import { X, FileSignature, CircleCheck } from "lucide-react";

export interface SignatureData {
  signedAt: Date;
  signedBy: string;
}

type DocType = "stellenbeschreibung" | "arbeitsvertrag" | "datenschutzerklaerung" | "einwilligungserklaerung";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSign: (sig: SignatureData) => void;
  documentType: DocType;
  angehoerigerName?: string;
  stundenlohn?: string;
  eintrittsdatum?: string;
  alreadySigned?: boolean;
  signedAt?: Date;
  signedBy?: string;
}

const DOC_META: Record<DocType, { title: string; pages: number }> = {
  stellenbeschreibung: { title: "Stellenbeschreibung Angehörigenpflege", pages: 2 },
  arbeitsvertrag: { title: "Arbeitsvertrag", pages: 4 },
  datenschutzerklaerung: { title: "Datenschutzerklärung gemäss DSG / DSGVO", pages: 2 },
  einwilligungserklaerung: { title: "Einwilligungserklärung", pages: 1 },
};

function formatDateDE(d: Date): string {
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}
function formatTimeDE(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function getContractText(type: DocType, name: string, lohn: string, eintritt: string): string {
  const spitex = "Spitex Kaufmann AG, Zürich";
  switch (type) {
    case "stellenbeschreibung":
      return `STELLENBESCHREIBUNG ANGEHÖRIGENPFLEGE\n\nVertragsparteien\n${spitex} (Arbeitgeber)\n${name} (Arbeitnehmer/in)\n\n1. Aufgabengebiet\nDie angestellte Person übernimmt pflegerische Aufgaben im häuslichen Umfeld gemäss den Weisungen der zuständigen Pflegefachkraft. Die Tätigkeiten umfassen Grundpflege, Begleitung im Alltag sowie die Dokumentation der erbrachten Leistungen.\n\n2. Verantwortlichkeiten\n- Durchführung der zugewiesenen Pflegemassnahmen\n- Einhaltung der Hygienestandards\n- Führen des Einsatzprotokolls\n- Meldung von Auffälligkeiten an die Pflegefachkraft\n\n3. Arbeitszeit\nDie Arbeitszeit richtet sich nach dem individuellen Einsatzplan. Einsätze erfolgen in der Regel zwischen 07:00 und 20:00 Uhr.`;
    case "arbeitsvertrag":
      return `ARBEITSVERTRAG\n\nzwischen\n${spitex} (nachfolgend "Arbeitgeber")\nund\n${name} (nachfolgend "Arbeitnehmer/in")\n\n1. Anstellung\nDer Arbeitnehmer wird per ${eintritt || "___"} als pflegender Angehöriger im Stundenlohn angestellt.\n\n2. Lohn\nDer Brutto-Stundenlohn beträgt CHF ${lohn || "___"}. Die Auszahlung erfolgt monatlich, jeweils am 25. des Folgemonats.\n\n3. Arbeitszeit\nDie Arbeitszeit richtet sich nach dem Einsatzplan und den Bedürfnissen der betreuten Person. Überstunden werden im Folgemonat kompensiert oder ausbezahlt.\n\n4. Kündigungsfrist\nDas Arbeitsverhältnis kann von beiden Seiten unter Einhaltung einer Frist von 30 Tagen auf das Ende eines Kalendermonats gekündigt werden.\n\n5. Sozialversicherungen\nDer Arbeitnehmer ist bei den üblichen Sozialversicherungen (AHV, IV, EO, ALV, BVG, UVG) angemeldet. Die Beiträge werden gemäss den gesetzlichen Bestimmungen aufgeteilt.\n\n6. Gesamtarbeitsvertrag\nEs gilt der GAV für das Gesundheitswesen des Kantons Zürich.\n\n7. Schlussbestimmungen\nÄnderungen dieses Vertrages bedürfen der Schriftform. Gerichtsstand ist Zürich.`;
    case "datenschutzerklaerung":
      return `DATENSCHUTZERKLÄRUNG\ngemäss DSG und DSGVO\n\n1. Datenerfassung\n${spitex} erfasst personenbezogene Daten des Arbeitnehmers für die Vertragserfüllung, Lohnabrechnung und gesetzliche Pflichten.\n\n2. Verarbeitungszwecke\n- Personalverwaltung und Lohnabrechnung\n- Einsatzplanung und Dokumentation\n- Gesetzliche Meldepflichten (AHV, Steuern)\n\n3. Weitergabe an Dritte\nDaten werden nur an berechtigte Dritte weitergegeben (Sozialversicherungen, Steuerbehörden, Krankenkasse). Eine Weitergabe zu Marketingzwecken erfolgt nicht.\n\n4. Rechte der betroffenen Person\nSie haben das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der Verarbeitung. Kontakt: datenschutz@spitex-kaufmann.ch`;
    case "einwilligungserklaerung":
      return `EINWILLIGUNGSERKLÄRUNG\n\nIch, ${name}, erkläre mich einverstanden mit:\n\n1. Der Verwendung meines Fotos für den internen Mitarbeiter-Ausweis\n2. Der Weitergabe meiner Kontaktdaten an die Notfallkontakt-Liste\n3. Der elektronischen Kommunikation über die Spitex-App\n\nDiese Einwilligung kann jederzeit schriftlich widerrufen werden.`;
  }
}

export function SignaturModal({ isOpen, onClose, onSign, documentType, angehoerigerName = "Angehörige/r", stundenlohn = "", eintrittsdatum = "", alreadySigned, signedAt, signedBy }: Props) {
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => { if (!isOpen) setConfirmed(false); }, [isOpen]);
  useEffect(() => {
    if (!isOpen) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const meta = DOC_META[documentType];
  const text = getContractText(documentType, angehoerigerName, stundenlohn, eintrittsdatum);

  const handleSign = () => {
    onSign({ signedAt: new Date(), signedBy: "Maria Keller" });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center" style={{ background: "rgba(19,19,20,0.6)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="flex flex-col" style={{ background: "var(--bg-elevated)", borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-overlay)", maxWidth: 800, maxHeight: "90vh", width: "92%", overflow: "hidden" }}>
        {/* Header */}
        <div className="flex items-center justify-between shrink-0" style={{ padding: "20px 24px", borderBottom: "var(--border-thin) solid var(--border-default)" }}>
          <div>
            <div style={{ fontSize: "var(--text-h2)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>{meta.title}</div>
            <div style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", marginTop: 4 }}>{meta.pages} Seiten</div>
          </div>
          <button type="button" onClick={onClose} className="flex items-center justify-center cursor-pointer" style={{ width: 32, height: 32, borderRadius: "var(--radius-pill)", background: "transparent", border: "none" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <X style={{ width: 18, height: 18, color: "var(--text-secondary)" }} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto" style={{ padding: "32px 40px", maxHeight: "60vh" }}>
          <div style={{ fontSize: "var(--text-small)", color: "var(--text-primary)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
            {text}
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-between" style={{ padding: "20px 24px", borderTop: "var(--border-thin) solid var(--border-default)" }}>
          {alreadySigned ? (
            <>
              <div className="flex items-center" style={{ gap: "var(--space-2)" }}>
                <CircleCheck style={{ width: 16, height: 16, color: "var(--status-success)" }} />
                <span style={{ fontSize: "var(--text-small)", color: "var(--status-success-text)", fontWeight: "var(--weight-medium)" }}>
                  Unterschrieben von {signedBy} am {signedAt ? formatDateDE(signedAt) : "–"} um {signedAt ? formatTimeDE(signedAt) : "–"}
                </span>
              </div>
              <button type="button" onClick={onClose} className="inline-flex items-center cursor-pointer transition-colors"
                style={{ gap: "var(--space-2)", padding: "9.5px 22px", borderRadius: "var(--radius-pill)", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--text-primary)", fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>
                Schliessen
              </button>
            </>
          ) : (
            <>
              <label className="flex items-center cursor-pointer" style={{ gap: "var(--space-2)" }}>
                <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)}
                  className="accent-[var(--brand-primary)]" style={{ width: 16, height: 16 }} />
                <span style={{ fontSize: "var(--text-small)", color: "var(--text-primary)" }}>
                  Ich habe das Dokument gelesen und unterzeichne es elektronisch.
                </span>
              </label>
              <div className="flex items-center" style={{ gap: "var(--space-2)" }}>
                <button type="button" onClick={onClose} className="inline-flex items-center cursor-pointer transition-colors"
                  style={{ gap: "var(--space-2)", padding: "9.5px 22px", borderRadius: "var(--radius-pill)", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--text-primary)", fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>
                  Abbrechen
                </button>
                <button type="button" onClick={handleSign} disabled={!confirmed}
                  className="inline-flex items-center cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ gap: "var(--space-2)", padding: "10px 22px", borderRadius: "var(--radius-pill)", background: "var(--brand-primary)", color: "var(--text-on-dark)", fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", border: "none" }}>
                  <FileSignature style={{ width: 14, height: 14 }} /> Elektronisch unterzeichnen
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
