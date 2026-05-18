import { Info, X, Clock, MapPin, User as UserIcon } from "lucide-react";
import type { UnifiedEntry } from "../../lib/mocks/service-desk-unified";

/* ══════════════════════════════════════════
   MOCK DATA FOR AUB VERTRETUNG
   ══════════════════════════════════════════ */

const MOCK_TERMINE = [
  { patient: "Schmid, Thomas", adresse: "Bahnhofstr. 12, 8001 Zürich", zeit: "08:00–09:00", dauer: "60 Min." },
  { patient: "Hoffmann, Peter", adresse: "Seestr. 45, 8002 Zürich", zeit: "09:30–10:15", dauer: "45 Min." },
  { patient: "Becker, Sabine", adresse: "Rämistr. 8, 8006 Zürich", zeit: "10:45–11:30", dauer: "45 Min." },
  { patient: "Steiner, Heinrich", adresse: "Limmatquai 92, 8001 Zürich", zeit: "13:00–14:00", dauer: "60 Min." },
  { patient: "Graf, Lena", adresse: "Forchstr. 22, 8008 Zürich", zeit: "14:30–15:15", dauer: "45 Min." },
  { patient: "Ammann, Rosa", adresse: "Birmensdorferstr. 155, 8003 Zürich", zeit: "15:45–16:30", dauer: "45 Min." },
  { patient: "Frei, Walter", adresse: "Schaffhauserstr. 78, 8057 Zürich", zeit: "17:00–17:45", dauer: "45 Min." },
];

const MOCK_VERTRETUNG = {
  name: "Karin Müller",
  initialen: "KM",
  color: "#059669",
  eignung: "Kennt 5 der 7 Patienten, hat freie Kapazität, gleiche Qualifikation (dipl. Pflegefachperson HF)",
};

/* ══════════════════════════════════════════
   PROPS
   ══════════════════════════════════════════ */

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  mockType: string;
  pendenz: UnifiedEntry;
}

/* ══════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════ */

export function AnnaDemoMockModal({ isOpen, onClose, onConfirm, mockType, pendenz }: Props) {
  if (!isOpen) return null;

  const isVertretung = mockType === "vertretung-einsetzen";
  const personName = pendenz.person?.name ?? "–";

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center"
      style={{ background: "rgba(19,19,20,0.5)" }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="flex flex-col"
        style={{
          background: "var(--bg-elevated)",
          borderRadius: "var(--radius-card)",
          boxShadow: "var(--shadow-overlay)",
          maxWidth: 600, width: "92%", maxHeight: "90vh",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between" style={{
          padding: "16px 20px",
          borderBottom: "var(--border-thin) solid var(--border-default)",
        }}>
          <span style={{ fontSize: "var(--text-h3)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>
            {isVertretung ? "Vertretung einsetzen" : "Aktion ausführen"} (Demo)
          </span>
          <button
            onClick={onClose}
            className="flex items-center justify-center cursor-pointer transition-colors"
            style={{ width: 28, height: 28, borderRadius: "var(--radius-pill)", background: "transparent", border: "none" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <X style={{ width: 16, height: 16, color: "var(--text-secondary)" }} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto" style={{ padding: "20px" }}>
          {/* Demo banner */}
          <div className="flex items-start" style={{
            gap: "var(--space-3)", padding: "var(--space-3) var(--space-4)",
            background: "var(--status-info-bg)", borderRadius: "var(--radius-card)",
            marginBottom: 20,
          }}>
            <Info style={{ width: 16, height: 16, color: "var(--status-info)", flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: "var(--text-small)", color: "var(--text-primary)", lineHeight: 1.5 }}>
              {isVertretung
                ? "Das ist eine Demo-Simulation. In der finalen Version würde Anna die Termine umverteilen und die Vertretung benachrichtigen."
                : "Das ist eine Demo-Simulation. In der finalen Version würde Anna diese Aktion automatisch ausführen."
              }
            </span>
          </div>

          {isVertretung ? (
            <>
              {/* Betroffene Termine */}
              <div style={{ marginBottom: 20 }}>
                <div style={{
                  fontSize: "var(--text-micro)", color: "var(--text-secondary)",
                  letterSpacing: "var(--tracking-wide)", textTransform: "uppercase" as const,
                  marginBottom: 10,
                }}>
                  Betroffene Termine ({MOCK_TERMINE.length})
                </div>
                <div className="flex flex-col" style={{ gap: 6 }}>
                  {MOCK_TERMINE.map((t, i) => (
                    <div key={i} className="flex items-center" style={{
                      gap: "var(--space-3)", padding: "8px 12px",
                      background: "var(--bg-primary)", borderRadius: "var(--radius-card)",
                    }}>
                      <Clock style={{ width: 14, height: 14, color: "var(--text-tertiary)", flexShrink: 0 }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center" style={{ gap: "var(--space-2)" }}>
                          <span style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>{t.patient}</span>
                          <span style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>{t.dauer}</span>
                        </div>
                        <div className="flex items-center" style={{ gap: 4, marginTop: 1 }}>
                          <MapPin style={{ width: 10, height: 10, color: "var(--text-tertiary)" }} />
                          <span style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>{t.adresse}</span>
                        </div>
                      </div>
                      <span style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", flexShrink: 0 }}>{t.zeit}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Geplante Vertretung */}
              <div style={{ marginBottom: 20 }}>
                <div style={{
                  fontSize: "var(--text-micro)", color: "var(--text-secondary)",
                  letterSpacing: "var(--tracking-wide)", textTransform: "uppercase" as const,
                  marginBottom: 10,
                }}>
                  Geplante Vertretung
                </div>
                <div className="flex items-center" style={{
                  gap: "var(--space-3)", padding: "12px 14px",
                  background: "var(--brand-primary-light)", borderRadius: "var(--radius-card)",
                  border: "var(--border-thin) solid rgba(31,92,77,0.2)",
                }}>
                  <div className="shrink-0 flex items-center justify-center" style={{
                    width: 32, height: 32, borderRadius: "var(--radius-pill)", background: MOCK_VERTRETUNG.color,
                  }}>
                    <span style={{ color: "var(--text-on-dark)", fontSize: 11, fontWeight: "var(--weight-medium)" }}>{MOCK_VERTRETUNG.initialen}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>{MOCK_VERTRETUNG.name}</div>
                    <div style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", marginTop: 2 }}>{MOCK_VERTRETUNG.eignung}</div>
                  </div>
                </div>
              </div>

              {/* Was wird simuliert */}
              <div>
                <div style={{
                  fontSize: "var(--text-micro)", color: "var(--text-secondary)",
                  letterSpacing: "var(--tracking-wide)", textTransform: "uppercase" as const,
                  marginBottom: 10,
                }}>
                  Was wird simuliert?
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: "var(--text-small)", color: "var(--text-secondary)", lineHeight: 1.7 }}>
                  <li>{MOCK_TERMINE.length} Termine werden {MOCK_VERTRETUNG.name} zugewiesen</li>
                  <li>{MOCK_VERTRETUNG.name} erhält automatische Benachrichtigung</li>
                  <li>Patienten werden über den Vertretungs-Wechsel informiert</li>
                  <li>AUB-Pendenz wird als erledigt markiert</li>
                </ul>
              </div>
            </>
          ) : (
            <div style={{ fontSize: "var(--text-body)", color: "var(--text-primary)", lineHeight: 1.6 }}>
              In der finalen Version würde Anna jetzt die Aktion für <strong>{personName}</strong> automatisch ausführen.
              Im Prototyp simulieren wir das Ergebnis.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-end" style={{
          gap: "var(--space-2)", padding: "16px 20px",
          borderTop: "var(--border-thin) solid var(--border-default)",
        }}>
          <button
            onClick={onClose}
            className="inline-flex items-center cursor-pointer transition-colors"
            style={{
              gap: "var(--space-2)", padding: "9px 20px",
              borderRadius: "var(--radius-pill)",
              background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--text-primary)",
              fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)",
            }}
          >
            Abbrechen
          </button>
          <button
            onClick={onConfirm}
            className="inline-flex items-center cursor-pointer transition-colors"
            style={{
              gap: "var(--space-2)", padding: "10px 20px",
              borderRadius: "var(--radius-pill)",
              background: "var(--brand-primary)", border: "none",
              fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-on-dark)",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--brand-primary-dark)"}
            onMouseLeave={e => e.currentTarget.style.background = "var(--brand-primary)"}
          >
            Demo-Aktion ausführen
          </button>
        </div>
      </div>
    </div>
  );
}
