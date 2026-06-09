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
import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { Check, Send, RefreshCw, Sparkles, AlertTriangle, Clock, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import type { ArztAnfrage, ArztAnfrageStatus } from "../../types/klinische-artefakte";
import { useEinwilligung } from "./EinwilligungContext";
import { toast } from "sonner";

/* ── Context ──────────────────────────── */

interface ArztAnfrageContextValue {
  anfrage: ArztAnfrage;
  spiegel: {
    /** Einwilligung signiert? (from EinwilligungContext) */
    einwilligungSigniert: boolean;
    einwilligungDatum: string | null;
    einwilligungHerkunft: string | null;
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
  children,
}: {
  onboardingId: string | null;
  patientId: string | null;
  children: ReactNode;
}) {
  let einwilligung: ReturnType<typeof useEinwilligung> | null = null;
  try { einwilligung = useEinwilligung(); } catch { /* outside Onboarding */ }

  const einwilligungSigniert = einwilligung?.status.signiert ?? false;

  // Der Flow startet immer bei wartet_auf_einwilligung — bestehende Arzt-Diagnosen
  // können aus manueller Erfassung stammen und blockieren den Anfrage-Flow nicht.
  const [anfrage, setAnfrage] = useState<ArztAnfrage>({
    id: `AA-${onboardingId || patientId || "new"}`,
    onboardingId,
    patientId,
    status: "wartet_auf_einwilligung",
    empfaengerName: "Dr. R. Steiner",
    empfaengerEmail: "r.steiner@praxis-steiner.ch",
    gesendetAm: null,
    erinnertAm: null,
    antwortAm: null,
    gesendeterBetreff: null,
    gesendeterText: null,
  });

  // Derived: auto-advance from wartet_auf_einwilligung → versandbereit when Einwilligung signed
  const effectiveStatus: ArztAnfrageStatus =
    anfrage.status === "wartet_auf_einwilligung" && einwilligungSigniert
      ? "versandbereit"
      : anfrage.status;

  const heute = new Date().toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit", year: "numeric" });
  const schwellwert = 10;

  // Tage seit Versand
  const tageSeitVersand = anfrage.gesendetAm
    ? Math.max(0, Math.floor((new Date("2026-06-06").getTime() - new Date(anfrage.gesendetAm.split(".").reverse().join("-")).getTime()) / 86400000))
    : 0;

  const senden = useCallback((betreff: string, text: string) => {
    setAnfrage(prev => ({ ...prev, status: "gesendet", gesendetAm: "28.05.2026", gesendeterBetreff: betreff, gesendeterText: text }));
  }, []);

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

  /* wartet_auf_einwilligung */
  if (s === "wartet_auf_einwilligung") {
    return (
      <span style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>
        Wartet auf signierte Einwilligung
      </span>
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

          <button
            onClick={() => senden(betreff, nachricht)}
            className="inline-flex items-center cursor-pointer"
            style={{ gap: 5, padding: "8px 18px", borderRadius: 999, background: "var(--brand-primary)", color: "var(--text-on-dark)", fontSize: "var(--text-small)", fontWeight: 500, border: "none" }}
          >
            <Send style={{ width: 12, height: 12 }} /> Absenden bestätigen
          </button>
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
