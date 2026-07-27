/**
 * ArztAnfrageContext — Single source of truth for the Arzt-Anfrage domain object.
 *
 * Architektur-Regel: Aktive Workflow-Schritte sind Fenster auf Domain-Objekte,
 * nie Besitzer von Logik. Die ArztAnfrage lebt als eigenes Objekt am Vorgang;
 * der Workflow-Schritt "Arzt kontaktiert" und die Pflegeplanung-Sektion
 * "Ärztliche Diagnosen" rendern beide dasselbe Objekt über eine gemeinsame
 * Flow-Komponente (ArztAnfrageFlowInline).
 *
 * Lead-Conversion-Muster: carries onboardingId + patientId.
 */
import React, { createContext, useContext, useState, useCallback, useRef, type ReactNode } from "react";
import { Check, Send, RefreshCw, Sparkles, AlertTriangle, Clock, ChevronDown, ChevronUp, RotateCcw, Pen, Upload, FileText } from "lucide-react";
import type { ArztAnfrage, ArztAnfrageStatus } from "../../types/klinische-artefakte";
import { useEinwilligung } from "./EinwilligungContext";
import { EinwilligungModal } from "./einwilligung/EinwilligungModal";
import { toast } from "sonner";

/* ── Context ──────────────────────────── */

interface ArztAnfrageContextValue {
  anfrage: ArztAnfrage;
  spiegel: {
    /** Einwilligung signiert? (from EinwilligungContext) */
    einwilligungSigniert: boolean;
    einwilligungDatum: string | null;
    einwilligungHerkunft: string | null;
    /** Einwilligung signiert aber Arzt-E-Mail fehlt */
    arztEmailFehlt: boolean;
  };
  /** Tage seit Versand (berechnet) */
  tageSeitVersand: number;
  schwellwert: number;
  /** Actions — mutate the one shared object */
  senden: (betreff: string, text: string) => void;
  erinnerungSenden: () => void;
  antwortSimulieren: () => void;
  extrahieren: () => void;
}

const ArztAnfrageCtx = createContext<ArztAnfrageContextValue | null>(null);

export function useArztAnfrage(): ArztAnfrageContextValue | null {
  return useContext(ArztAnfrageCtx);
}

/* ── Provider ─────────────────────────── */

export function ArztAnfrageProvider({
  onboardingId,
  patientId,
  hausarztName,
  hausarztEmail,
  children,
}: {
  onboardingId: string | null;
  patientId: string | null;
  /** Dynamisch aus Patientendaten — kein hartkodierter Empfänger */
  hausarztName?: string;
  hausarztEmail?: string;
  children: ReactNode;
}) {
  let einwilligung: ReturnType<typeof useEinwilligung> | null = null;
  try { einwilligung = useEinwilligung(); } catch { /* outside Onboarding */ }

  const einwilligungSigniert = einwilligung?.status.signiert ?? false;

  const [anfrage, setAnfrage] = useState<ArztAnfrage>({
    id: `AA-${onboardingId || patientId || "new"}`,
    onboardingId,
    patientId,
    status: "wartet_auf_einwilligung",
    empfaengerName: hausarztName || "",
    empfaengerEmail: hausarztEmail || "",
    gesendetAm: null,
    erinnertAm: null,
    antwortAm: null,
    gesendeterBetreff: null,
    gesendeterText: null,
  });

  // Aktualisiere Empfänger wenn sich Patientendaten ändern
  if (hausarztName && anfrage.empfaengerName !== hausarztName) {
    setAnfrage(prev => ({ ...prev, empfaengerName: hausarztName }));
  }
  if (hausarztEmail && anfrage.empfaengerEmail !== hausarztEmail) {
    setAnfrage(prev => ({ ...prev, empfaengerEmail: hausarztEmail }));
  }

  // ECHTER Statuswechsel: Einwilligung signiert → versandbereit (wenn E-Mail vorhanden)
  const arztEmailVorhanden = !!(anfrage.empfaengerEmail || hausarztEmail);
  const effectiveStatus: ArztAnfrageStatus =
    anfrage.status === "wartet_auf_einwilligung" && einwilligungSigniert && arztEmailVorhanden
      ? "versandbereit"
      : anfrage.status === "wartet_auf_einwilligung" && einwilligungSigniert && !arztEmailVorhanden
        ? "wartet_auf_einwilligung" // Einwilligung da, aber E-Mail fehlt
        : anfrage.status;

  const heute = new Date().toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit", year: "numeric" });
  const schwellwert = 10;

  const tageSeitVersand = anfrage.gesendetAm
    ? Math.max(0, Math.floor((Date.now() - new Date(anfrage.gesendetAm.split(".").reverse().join("-")).getTime()) / 86400000))
    : 0;

  const senden = useCallback((betreff: string, text: string) => {
    setAnfrage(prev => ({ ...prev, status: "gesendet", gesendetAm: heute, gesendeterBetreff: betreff, gesendeterText: text }));
    toast("Versand simuliert — im Prototyp wird keine echte E-Mail gesendet");
  }, [heute]);

  const erinnerungSenden = useCallback(() => {
    setAnfrage(prev => ({ ...prev, erinnertAm: heute, gesendetAm: heute }));
    toast("Erinnerung gesendet");
  }, [heute]);

  const antwortSimulieren = useCallback(() => {
    setAnfrage(prev => ({ ...prev, status: "antwort_erhalten", antwortAm: heute }));
  }, [heute]);

  const extrahieren = useCallback(() => {
    setAnfrage(prev => ({ ...prev, status: "extrahiert" }));
  }, []);

  const value: ArztAnfrageContextValue = {
    anfrage: { ...anfrage, status: effectiveStatus },
    spiegel: {
      einwilligungSigniert,
      einwilligungDatum: einwilligung?.status.datum ?? null,
      einwilligungHerkunft: einwilligung?.status.herkunft ?? null,
      arztEmailFehlt: einwilligungSigniert && !arztEmailVorhanden,
    },
    tageSeitVersand,
    schwellwert,
    senden,
    erinnerungSenden,
    antwortSimulieren,
    extrahieren,
  };

  return (
    <ArztAnfrageCtx.Provider value={value}>
      {children}
    </ArztAnfrageCtx.Provider>
  );
}

/* ══════════════════════════════════════════
   SHARED FLOW COMPONENT — one implementation, two embed sites
   (Pflegeplanung = kanonisch, Workflow = Spiegel)
   ══════════════════════════════════════════ */

/**
 * ArztAnfrageFlowInline — Renders the Arzt-Anfrage flow status + actions.
 * Used in Pflegeplanung (kanonisch) and WorkflowChecklist (Spiegel).
 * Reads/writes the shared ArztAnfrage domain object — zero local state.
 *
 * @param compact - If true, renders minimal inline (for Workflow step body)
 */
export function ArztAnfrageFlowInline({ compact = false }: { compact?: boolean }) {
  const ctx = useArztAnfrage();

  // Template defaults (with resolved placeholders — no visible placeholder codes)
  const VORLAGE_BETREFF = "Bitte um Diagnoseliste – Spitex Kaufmann";
  const VORLAGE_TEXT = ctx
    ? `Sehr geehrter ${ctx.anfrage.empfaengerName},\n\nim Rahmen der häuslichen Pflege bitten wir Sie höflich um Zustellung der aktuellen Diagnoseliste für den oben genannten Patienten.\n\nDie signierte Datenschutz-Einwilligung liegt diesem Schreiben als Anhang bei.\n\nBesten Dank für Ihre Unterstützung.\n\nFreundliche Grüsse`
    : "";

  // Editable local state (only persisted when "Absenden" is clicked)
  const [betreff, setBetreff] = useState(VORLAGE_BETREFF);
  const [nachricht, setNachricht] = useState(VORLAGE_TEXT);
  const isModified = betreff !== VORLAGE_BETREFF || nachricht !== VORLAGE_TEXT;

  if (!ctx) return null;

  const { anfrage, spiegel, tageSeitVersand, schwellwert, senden, erinnerungSenden, antwortSimulieren, extrahieren } = ctx;
  const s = anfrage.status;

  /* wartet_auf_einwilligung — mit Möglichkeit, direkt hier zu signieren */
  if (s === "wartet_auf_einwilligung") {
    return (
      <InlineEinwilligungBlock
        arztEmailFehlt={spiegel.arztEmailFehlt}
        einwilligungSigniert={spiegel.einwilligungSigniert}
      />
    );
  }

  /* versandbereit — single state: the send-confirmation form IS the state display */
  if (s === "versandbereit") {
    return (
      <div>
        {/*
         * Versand-Bestätigung: kein Auto-Versand. Der Bestätigungs-Klick ist die bewusste
         * menschliche Prüfung des Empfängers. Auto-Versand an einen möglicherweise veralteten
         * Arzt-Kontakt wäre ein Datenschutzrisiko.
         */}
        <div style={{ padding: "10px 12px", background: "var(--bg-secondary)", borderRadius: 8 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
            <div style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>E-Mail an behandelnden Arzt</div>
            {isModified && (
              <button
                onClick={() => { setBetreff(VORLAGE_BETREFF); setNachricht(VORLAGE_TEXT); }}
                className="inline-flex items-center cursor-pointer"
                style={{ gap: 3, padding: "1px 6px", borderRadius: 999, background: "transparent", border: "none", fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--text-tertiary)")}
              >
                <RotateCcw style={{ width: 9, height: 9 }} /> Vorlage
              </button>
            )}
          </div>

          {/* Empfänger (read-only) */}
          <div style={{ fontSize: "var(--text-small)", color: "var(--text-primary)", marginBottom: 6 }}>
            <strong>An:</strong> {anfrage.empfaengerName} ({anfrage.empfaengerEmail})
          </div>

          {/* Betreff (editierbar) */}
          <div style={{ marginBottom: 6 }}>
            <label style={{ display: "block", fontSize: 9, color: "var(--text-tertiary)", marginBottom: 2 }}>Betreff</label>
            <input
              value={betreff}
              onChange={e => setBetreff(e.target.value)}
              style={{ width: "100%", padding: "6px 10px", fontSize: "var(--text-small)", borderRadius: 8, border: "0.5px solid var(--border-default)", background: "var(--bg-elevated)", color: "var(--text-primary)", fontFamily: "inherit" }}
            />
          </div>

          {/* Nachrichtentext (editierbar) */}
          <div style={{ marginBottom: 8 }}>
            <label style={{ display: "block", fontSize: 9, color: "var(--text-tertiary)", marginBottom: 2 }}>Nachricht</label>
            <textarea
              value={nachricht}
              onChange={e => setNachricht(e.target.value)}
              rows={5}
              style={{ width: "100%", padding: "8px 10px", fontSize: "var(--text-small)", borderRadius: 8, border: "0.5px solid var(--border-default)", background: "var(--bg-elevated)", color: "var(--text-primary)", fontFamily: "inherit", resize: "vertical", lineHeight: 1.5 }}
            />
          </div>

          {/* Fixe Teile (sichtbar, nicht editierbar) */}
          <div style={{ paddingTop: 6, borderTop: "0.5px solid var(--border-default)", marginBottom: 10 }}>
            <div style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", marginBottom: 2 }}>
              Anhang: Signierte Datenschutz-Einwilligung (PDF)
            </div>
            <div style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>
              Spitex Kaufmann · Pflegefachperson · spitex-kaufmann.ch
            </div>
          </div>

          <div className="flex items-center" style={{ gap: 8, marginBottom: 6 }}>
            <button
              onClick={() => senden(betreff, nachricht)}
              className="inline-flex items-center cursor-pointer"
              style={{ gap: 5, padding: "8px 18px", borderRadius: 999, background: "var(--brand-primary)", color: "var(--text-on-dark)", fontSize: "var(--text-small)", fontWeight: 500, border: "none" }}
            >
              <Send style={{ width: 12, height: 12 }} /> Absenden bestätigen
            </button>
          </div>
          <div style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)", fontStyle: "italic" }}>
            Prototyp: Es wird keine echte E-Mail gesendet.
          </div>
        </div>
      </div>
    );
  }

  /* gesendet — single line: "Angefragt bei Dr. [Name] · wartet seit X Tagen" */
  if (s === "gesendet") {
    return (
      <div className="flex items-center justify-between flex-wrap" style={{ gap: 8 }}>
        <div className="flex items-center" style={{ gap: 6 }}>
          {tageSeitVersand >= schwellwert ? (
            <span className="inline-flex items-center" style={{ gap: 4, fontSize: "var(--text-small)", color: "var(--status-warning-text)" }}>
              <AlertTriangle style={{ width: 12, height: 12 }} /> Angefragt bei {anfrage.empfaengerName} · wartet seit {tageSeitVersand} Tagen – Erinnerung empfohlen
            </span>
          ) : (
            <span style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>
              Angefragt bei {anfrage.empfaengerName} · wartet seit {tageSeitVersand} Tagen
            </span>
          )}
          {anfrage.erinnertAm && <span style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>· Erinnerung {anfrage.erinnertAm}</span>}
        </div>
        <div className="flex items-center" style={{ gap: 6 }}>
          {tageSeitVersand >= schwellwert && (
            <button onClick={erinnerungSenden} className="inline-flex items-center cursor-pointer" style={{ gap: 4, padding: "6px 14px", borderRadius: 999, background: "var(--bg-elevated)", border: "0.5px solid var(--border-default)", fontSize: "var(--text-small)", fontWeight: 500, color: "var(--text-primary)" }}>
              <RefreshCw style={{ width: 12, height: 12 }} /> Erinnerung senden
            </button>
          )}
          <button onClick={antwortSimulieren} className="inline-flex items-center cursor-pointer" style={{ gap: 4, padding: "6px 14px", borderRadius: 999, background: "var(--bg-elevated)", border: "0.5px solid var(--border-default)", fontSize: "var(--text-meta)", fontWeight: 500, color: "var(--text-tertiary)" }}>
            Arzt-Antwort simulieren
          </button>
        </div>
      </div>
    );
  }

  /* antwort_erhalten — ReviewBlock-style: prominent, Handlungsbedarf */
  if (s === "antwort_erhalten") {
    return (
      <div style={{ display: "flex", background: "var(--bg-elevated)", border: "0.5px solid var(--border-default)", borderRadius: 12, overflow: "hidden" }}>
        {/* Ocker-Akzent links */}
        <div style={{ width: 4, flexShrink: 0, background: "var(--status-warning)", borderRadius: "2px 0 0 2px" }} />
        <div style={{ flex: 1, padding: "12px 16px" }}>
          <div className="flex items-center" style={{ gap: 6, marginBottom: 6 }}>
            <Sparkles style={{ width: 13, height: 13, color: "var(--brand-primary)" }} />
            <span style={{ fontSize: "var(--text-small)", fontWeight: 500, color: "var(--text-primary)" }}>
              Antwort von {anfrage.empfaengerName} erhalten
            </span>
            <span style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>· Diagnoseliste.pdf</span>
          </div>
          <div className="flex items-center justify-between" style={{ gap: 8 }}>
            <span style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>
              Anna kann die Diagnosen aus dem Anhang extrahieren und zur Prüfung vorlegen.
            </span>
            <button onClick={extrahieren} className="inline-flex items-center cursor-pointer shrink-0" style={{ gap: 5, padding: "8px 18px", borderRadius: 999, background: "var(--brand-primary)", color: "var(--text-on-dark)", fontSize: "var(--text-small)", fontWeight: 500, border: "none" }}>
              <Sparkles style={{ width: 12, height: 12 }} /> Diagnosen extrahieren
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* extrahiert — im normalen Sektions-Flow unsichtbar (die Vorschlag-Zeilen SIND der Inhalt).
     Wird aber über die SectionAction explizit aufgeklappt, zeigt er einen kurzen Abschluss-Hinweis. */
  return (
    <span style={{ fontSize: "var(--text-small)", color: "var(--text-tertiary)" }}>
      Diagnosen von {anfrage.empfaengerName} extrahiert und zur Prüfung hinterlegt.
    </span>
  );
}

/* ══════════════════════════════════════════
   INLINE EINWILLIGUNG — signierbar aus der Pflegeplanung heraus
   ══════════════════════════════════════════ */

function InlineEinwilligungBlock({ arztEmailFehlt, einwilligungSigniert }: {
  arztEmailFehlt: boolean;
  einwilligungSigniert: boolean;
}) {
  let einwilligung: ReturnType<typeof useEinwilligung> | null = null;
  try { einwilligung = useEinwilligung(); } catch { /* ausserhalb Onboarding */ }

  const [showModal, setShowModal] = useState(false);
  const scanInputRef = useRef<HTMLInputElement>(null);

  const handleScanUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !einwilligung) return;
    einwilligung.signScan(new Date().toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit", year: "numeric" }));
    e.target.value = "";
  };

  // Einwilligung signiert aber E-Mail fehlt
  if (arztEmailFehlt) {
    return (
      <div>
        <span style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>
          Einwilligung signiert — E-Mail-Adresse des Hausarztes fehlt
        </span>
        <div className="flex items-center" style={{ gap: 6, marginTop: 4, fontSize: "var(--text-meta)", color: "var(--status-warning-text)" }}>
          <AlertTriangle style={{ width: 11, height: 11 }} />
          Bitte die E-Mail-Adresse des Hausarztes im Tab «Personalien» erfassen.
        </div>
      </div>
    );
  }

  // Einwilligung nicht signiert — Hinweis + direkte Aktion
  return (
    <div>
      <div style={{ padding: "12px 16px", background: "var(--status-warning-bg)", borderRadius: 10, marginBottom: 8 }}>
        <div className="flex items-start" style={{ gap: 8 }}>
          <FileText style={{ width: 16, height: 16, color: "var(--status-warning-text)", flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "var(--text-small)", fontWeight: 500, color: "var(--status-warning-text)" }}>
              Einwilligungserklärung erforderlich
            </div>
            <div style={{ fontSize: "var(--text-small)", color: "var(--text-primary)", marginTop: 4 }}>
              Für die Arzt-Anfrage muss die Einwilligungserklärung des Patienten vorliegen.
              Sie können die Erklärung direkt hier anzeigen und signieren.
            </div>
            <div className="flex items-center flex-wrap" style={{ gap: 8, marginTop: 10 }}>
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center cursor-pointer"
                style={{ gap: 5, padding: "8px 18px", borderRadius: 999, background: "var(--brand-primary)", color: "var(--text-on-dark)", fontSize: "var(--text-small)", fontWeight: 500, border: "none" }}
              >
                <Pen style={{ width: 12, height: 12 }} /> Einwilligung anzeigen und signieren
              </button>
              <input ref={scanInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleScanUpload} />
              <button
                onClick={() => scanInputRef.current?.click()}
                className="inline-flex items-center cursor-pointer"
                style={{ gap: 5, padding: "8px 18px", borderRadius: 999, background: "var(--bg-elevated)", color: "var(--text-primary)", fontSize: "var(--text-small)", fontWeight: 500, border: "0.5px solid var(--border-default)" }}
              >
                <Upload style={{ width: 12, height: 12 }} /> Unterschriebenes Exemplar hochladen
              </button>
            </div>
          </div>
        </div>
      </div>

      {showModal && einwilligung && (
        <EinwilligungModal
          isOpen
          onClose={() => setShowModal(false)}
          onSignDigital={(_, datum) => {
            einwilligung!.signDigital(datum);
            setShowModal(false);
          }}
          patientName=""
          patientGeburtsdatum=""
        />
      )}
    </div>
  );
}
