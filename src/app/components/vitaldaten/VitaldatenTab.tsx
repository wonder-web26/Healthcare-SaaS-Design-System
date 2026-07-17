/**
 * PA-05: Vitaldaten-Tab — Verlaufsliste + Erfassungsformular.
 *
 * Fortlaufende Zeitreihe am Patienten (kein Onboarding-Feld).
 * APPEND-ONLY, Zeitstempel + Erfasser unveränderlich.
 */
import { useState } from "react";
import { Plus, Clock, User, AlertTriangle, Check, ChevronDown, ChevronUp } from "lucide-react";
import { AKTIVE_PARAMETER, pruefeVitalPlausibilitaet } from "../../../lib/stammdaten/vitalparameter";
import { erfasseMessung, getMessungenFuerPatient, type Messwert, type Vitalmessung } from "../../../lib/vitaldaten/store";
import { toast } from "sonner";

interface Props {
  patientId: string;
  erfasser?: string;
}

export function VitaldatenTab({ patientId, erfasser = "Sandra Weber" }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [werte, setWerte] = useState<Record<string, string>>({});
  const [kommentar, setKommentar] = useState("");
  const [warnungen, setWarnungen] = useState<string[]>([]);
  const [, forceUpdate] = useState(0);

  const messungen = getMessungenFuerPatient(patientId);

  const handleWertChange = (code: string, val: string) => {
    setWerte(prev => ({ ...prev, [code]: val }));
  };

  const pruefeUndSpeichere = () => {
    // Sammle nicht-leere Werte
    const messwerte: Messwert[] = [];
    const warns: string[] = [];

    for (const param of AKTIVE_PARAMETER) {
      const raw = werte[param.code];
      if (!raw || raw.trim() === "") continue;
      const num = parseFloat(raw);
      if (isNaN(num)) continue;
      messwerte.push({ parameterCode: param.code, wert: num });
      const w = pruefeVitalPlausibilitaet(param.code, num);
      if (w) warns.push(w);
    }

    if (messwerte.length === 0) {
      toast("Bitte mindestens einen Wert eingeben.");
      return;
    }

    // Bei Warnungen: erste Bestätigung nötig
    if (warns.length > 0 && warnungen.length === 0) {
      setWarnungen(warns);
      return; // User muss nochmals klicken
    }

    erfasseMessung(patientId, messwerte, erfasser, "manuell", kommentar);
    setWerte({});
    setKommentar("");
    setWarnungen([]);
    setShowForm(false);
    forceUpdate(n => n + 1);
    toast("Messung gespeichert");
  };

  const formatZeit = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit", year: "numeric" }) + ", " + d.toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div style={{ padding: "var(--space-4)" }}>
      {/* Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: "var(--space-4)" }}>
        <div>
          <div style={{ fontSize: "var(--text-h3)", fontWeight: 500, color: "var(--text-primary)" }}>Vitaldaten</div>
          <div style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>{messungen.length} Messungen</div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center cursor-pointer"
          style={{ gap: 6, padding: "10px 22px", borderRadius: 999, background: "var(--brand-primary)", color: "var(--text-on-dark)", fontSize: 14, fontWeight: 500, border: "none" }}
        >
          <Plus style={{ width: 14, height: 14 }} /> Neue Messung
        </button>
      </div>

      {/* Erfassungsformular */}
      {showForm && (
        <div style={{ padding: "16px 20px", background: "var(--bg-elevated)", border: "0.5px solid var(--border-default)", borderRadius: 12, marginBottom: "var(--space-4)" }}>
          <div style={{ fontSize: "var(--text-small)", fontWeight: 500, color: "var(--text-primary)", marginBottom: "var(--space-3)" }}>
            Neue Messung erfassen
          </div>
          <div style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)", marginBottom: "var(--space-4)" }}>
            Nur ausgefüllte Felder werden gespeichert. Nicht alle Parameter sind Pflicht.
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4" style={{ gap: "var(--space-3)" }}>
            {AKTIVE_PARAMETER.map(param => (
              <div key={param.code}>
                <label style={{ display: "block", fontSize: "var(--text-meta)", color: "var(--text-secondary)", marginBottom: 2 }}>{param.label}</label>
                <div className="flex items-center" style={{ gap: 4 }}>
                  <input
                    type="number"
                    value={werte[param.code] || ""}
                    onChange={e => handleWertChange(param.code, e.target.value)}
                    placeholder="—"
                    style={{ width: "100%", padding: "6px 10px", fontSize: "var(--text-small)", borderRadius: 8, border: "0.5px solid var(--border-default)", background: "var(--bg-elevated)", color: "var(--text-primary)", fontFamily: "inherit" }}
                  />
                  <span style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)", whiteSpace: "nowrap" }}>{param.einheit}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: "var(--space-3)" }}>
            <label style={{ display: "block", fontSize: "var(--text-meta)", color: "var(--text-secondary)", marginBottom: 2 }}>Kommentar (optional)</label>
            <input
              value={kommentar}
              onChange={e => setKommentar(e.target.value)}
              placeholder="z.B. nach Belastung, nüchtern, Ruhemessung"
              style={{ width: "100%", padding: "6px 10px", fontSize: "var(--text-small)", borderRadius: 8, border: "0.5px solid var(--border-default)", background: "var(--bg-elevated)", color: "var(--text-primary)", fontFamily: "inherit" }}
            />
          </div>

          {/* Plausibilitätswarnungen */}
          {warnungen.length > 0 && (
            <div style={{ marginTop: "var(--space-3)", padding: "10px 14px", background: "var(--status-warning-bg)", borderRadius: 8 }}>
              <div className="flex items-center" style={{ gap: 6, marginBottom: 4 }}>
                <AlertTriangle style={{ width: 14, height: 14, color: "var(--status-warning-text)" }} />
                <span style={{ fontSize: "var(--text-small)", fontWeight: 500, color: "var(--status-warning-text)" }}>Werte ausserhalb des Plausibilitätsbereichs</span>
              </div>
              {warnungen.map((w, i) => (
                <div key={i} style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", padding: "1px 0" }}>· {w}</div>
              ))}
              <div style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)", marginTop: 4 }}>Nochmals «Speichern» klicken, um trotzdem zu speichern.</div>
            </div>
          )}

          <div className="flex items-center" style={{ gap: 8, marginTop: "var(--space-4)" }}>
            <button
              onClick={pruefeUndSpeichere}
              className="inline-flex items-center cursor-pointer"
              style={{ gap: 5, padding: "8px 18px", borderRadius: 999, background: "var(--brand-primary)", color: "var(--text-on-dark)", fontSize: "var(--text-small)", fontWeight: 500, border: "none" }}
            >
              <Check style={{ width: 12, height: 12 }} /> Speichern
            </button>
            <button
              onClick={() => { setShowForm(false); setWerte({}); setKommentar(""); setWarnungen([]); }}
              className="cursor-pointer"
              style={{ background: "none", border: "none", fontSize: "var(--text-small)", color: "var(--text-secondary)", padding: "8px 12px" }}
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Verlaufsliste */}
      {messungen.length === 0 ? (
        <div style={{ padding: "var(--space-6)", textAlign: "center", color: "var(--text-tertiary)", fontSize: "var(--text-small)" }}>
          Noch keine Messungen erfasst.
        </div>
      ) : (
        <div className="flex flex-col" style={{ gap: "var(--space-2)" }}>
          {messungen.map(m => (
            <MessungZeile key={m.id} messung={m} />
          ))}
        </div>
      )}
    </div>
  );
}

function MessungZeile({ messung }: { messung: Vitalmessung }) {
  const [expanded, setExpanded] = useState(false);
  const paramMap = new Map(AKTIVE_PARAMETER.map(p => [p.code, p]));

  return (
    <div style={{ background: "var(--bg-elevated)", border: "0.5px solid var(--border-default)", borderRadius: 10, overflow: "hidden" }}>
      <div
        className="flex items-center cursor-pointer"
        style={{ padding: "10px 16px", gap: 12 }}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Zeitstempel + Erfasser */}
        <div className="flex items-center shrink-0" style={{ gap: 4 }}>
          <Clock style={{ width: 12, height: 12, color: "var(--text-tertiary)" }} />
          <span style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums" }}>
            {new Date(messung.zeitstempelErfasst).toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit", year: "numeric" })},{" "}
            {new Date(messung.zeitstempelErfasst).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
        <div className="flex items-center shrink-0" style={{ gap: 3 }}>
          <User style={{ width: 11, height: 11, color: "var(--text-tertiary)" }} />
          <span style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>{messung.erfasser}</span>
        </div>

        {/* Kompakte Werte-Vorschau */}
        <div className="flex-1 flex items-center flex-wrap" style={{ gap: 8 }}>
          {messung.werte.slice(0, 4).map(w => {
            const p = paramMap.get(w.parameterCode);
            return p ? (
              <span key={w.parameterCode} style={{ fontSize: "var(--text-meta)", color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                {p.label.split(" ")[0]}: {w.wert} {p.einheit}
              </span>
            ) : null;
          })}
          {messung.werte.length > 4 && <span style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>+{messung.werte.length - 4}</span>}
        </div>

        {messung.korrekturVon && <span style={{ fontSize: "var(--text-meta)", color: "var(--status-warning-text)" }}>Korrektur</span>}

        <button className="cursor-pointer" style={{ background: "none", border: "none", padding: 2, color: "var(--text-tertiary)" }}>
          {expanded ? <ChevronUp style={{ width: 14, height: 14 }} /> : <ChevronDown style={{ width: 14, height: 14 }} />}
        </button>
      </div>

      {expanded && (
        <div style={{ padding: "0 16px 12px", borderTop: "0.5px solid var(--border-default)" }}>
          <div className="grid grid-cols-2 md:grid-cols-3" style={{ gap: 8, paddingTop: 10 }}>
            {messung.werte.map(w => {
              const p = paramMap.get(w.parameterCode);
              return p ? (
                <div key={w.parameterCode} style={{ padding: "4px 0" }}>
                  <div style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>{p.label}</div>
                  <div style={{ fontSize: "var(--text-small)", fontWeight: 500, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>{w.wert} {p.einheit}</div>
                </div>
              ) : null;
            })}
          </div>
          {messung.kommentar && (
            <div style={{ marginTop: 8, fontSize: "var(--text-small)", color: "var(--text-secondary)", fontStyle: "italic" }}>
              {messung.kommentar}
            </div>
          )}
          {messung.korrekturVon && (
            <div style={{ marginTop: 6, fontSize: "var(--text-meta)", color: "var(--status-warning-text)" }}>
              Korrektur von Messung {messung.korrekturVon}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
