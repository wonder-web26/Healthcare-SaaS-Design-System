/**
 * PflegeplanungArbeitsbereich — card-based editor for NANDA care planning.
 * Diagnose cards with inline massnahmen/ziele editors, validation flow.
 */
import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft, Check, X, Sparkles, ChevronDown, Plus, Edit3, Mic,
  CheckCircle2, XCircle, Target, AlertTriangle, Trash2,
} from "lucide-react";
import { MOCK_PFLEGEPLANUNGEN, MOCK_ASSESSMENTS } from "../../lib/mocks/klinische-artefakte-mock";
import type { Pflegediagnose, Massnahme, Pflegeziel, VorschlagStatus } from "../../types/klinische-artefakte";
import { toast } from "sonner";

/** Curated NANDA list for the prototype */
const NANDA_KATALOG = [
  { code: "00155", titel: "Sturzgefahr" },
  { code: "00095", titel: "Schlafstörung" },
  { code: "00241", titel: "Beeinträchtigte Stimmungsregulation" },
  { code: "00146", titel: "Angst" },
  { code: "00124", titel: "Hoffnungslosigkeit" },
  { code: "00131", titel: "Selbstpflege-Defizit: Waschen" },
  { code: "00132", titel: "Akuter Schmerz" },
  { code: "00133", titel: "Chronischer Schmerz" },
  { code: "00078", titel: "Beeinträchtigtes Selbstmanagement" },
  { code: "00267", titel: "Risiko instabiler Blutdruck" },
  { code: "00179", titel: "Risiko instabiler Blutzucker" },
  { code: "00002", titel: "Mangelernährung" },
  { code: "00051", titel: "Beeinträchtigte verbale Kommunikation" },
  { code: "00085", titel: "Beeinträchtigte körperliche Mobilität" },
  { code: "00108", titel: "Selbstpflege-Defizit: Körperpflege" },
];

export function PflegeplanungArbeitsbereich() {
  const { planungId } = useParams();
  const navigate = useNavigate();

  const planung = MOCK_PFLEGEPLANUNGEN.find(p => p.id === planungId);
  if (!planung) return (
    <div style={{ padding: "64px 32px", textAlign: "center" }}>
      <div style={{ fontSize: "var(--text-h3)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>Pflegeplanung nicht gefunden</div>
      <button onClick={() => navigate(-1)} className="inline-flex items-center cursor-pointer" style={{ marginTop: 16, gap: 8, padding: "10px 20px", borderRadius: "var(--radius-pill)", background: "var(--brand-primary)", color: "var(--text-on-dark)", border: "none" }}><ArrowLeft style={{ width: 16, height: 16 }} /> Zurück</button>
    </div>
  );

  const baRef = planung.interRAIAssessmentId ? MOCK_ASSESSMENTS.find(a => a.id === planung.interRAIAssessmentId) : null;

  const [diagnosen, setDiagnosen] = useState<Pflegediagnose[]>(planung.pflegediagnosen.map(d => ({ ...d })));
  const [massnahmen, setMassnahmen] = useState<Massnahme[]>(planung.massnahmen.map(m => ({ ...m })));
  const [ziele, setZiele] = useState<Pflegeziel[]>(planung.ziele.map(z => ({ ...z })));
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(planung.pflegediagnosen.filter(d => d.status === "vorschlag").map(d => d.id)));
  const [status, setStatus] = useState(planung.status);
  const [showAddDiagnose, setShowAddDiagnose] = useState(false);
  const [showValidateDialog, setShowValidateDialog] = useState(false);
  const [editingMassnahme, setEditingMassnahme] = useState<string | null>(null);
  const [editingZiel, setEditingZiel] = useState<string | null>(null);

  // Aggregates
  const akzeptiert = diagnosen.filter(d => d.status === "akzeptiert").length;
  const vorschlag = diagnosen.filter(d => d.status === "vorschlag").length;
  const abgelehnt = diagnosen.filter(d => d.status === "abgelehnt").length;
  const akzMassnahmen = massnahmen.filter(m => m.status === "akzeptiert").length;
  const akzZiele = ziele.filter(z => z.status === "akzeptiert").length;

  const toggleExpand = (id: string) => setExpanded(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const setDiagnoseStatus = (id: string, s: VorschlagStatus) => {
    setDiagnosen(prev => prev.map(d => d.id === id ? { ...d, status: s } : d));
    if (s === "akzeptiert") {
      setMassnahmen(prev => prev.map(m => m.bezugDiagnoseId === id && m.status === "vorschlag" ? { ...m, status: "akzeptiert" } : m));
      setZiele(prev => prev.map(z => z.bezugDiagnoseId === id && z.status === "vorschlag" ? { ...z, status: "akzeptiert" } : z));
    }
  };

  const addMassnahme = (diagnoseId: string) => {
    const id = `MA-new-${Date.now()}`;
    setMassnahmen(prev => [...prev, { id, titel: "Neue Massnahme", bezugDiagnoseId: diagnoseId, beschreibung: "", haeufigkeit: "nach Bedarf", status: "akzeptiert" }]);
    setEditingMassnahme(id);
  };

  const addZiel = (diagnoseId: string) => {
    const id = `Z-new-${Date.now()}`;
    setZiele(prev => [...prev, { id, titel: "Neues Ziel", bezugDiagnoseId: diagnoseId, zeithorizont: "3 Monate", messbar: "", status: "akzeptiert" }]);
    setEditingZiel(id);
  };

  const handleValidate = () => {
    setStatus("validiert");
    setShowValidateDialog(false);
    toast("Pflegeplanung validiert");
  };

  return (
    <div className="h-full flex flex-col" style={{ background: "var(--bg-primary)" }}>
      <style>{`.pp-pad { padding-left: var(--mobile-page-padding); padding-right: var(--mobile-page-padding); } @media (min-width: 640px) { .pp-pad { padding-left: var(--space-6); padding-right: var(--space-6); } }`}</style>

      {/* Header */}
      <div className="shrink-0 pp-pad" style={{ paddingTop: "var(--space-3)", paddingBottom: "var(--space-3)", background: "var(--bg-elevated)", borderBottom: "var(--border-thin) solid var(--border-default)" }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
          <div className="flex items-center" style={{ gap: 8 }}>
            <button onClick={() => navigate(-1)} className="cursor-pointer" style={{ background: "transparent", border: "none", color: "var(--brand-primary)" }}><ArrowLeft style={{ width: 14, height: 14 }} /></button>
            <span style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>Pflegeplanung — {planung.patientName}</span>
            <span style={{ padding: "2px 10px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", background: status === "validiert" ? "var(--status-success-bg)" : status === "abgeschlossen" ? "var(--status-success-bg)" : "var(--status-warning-bg)", color: status === "validiert" ? "var(--status-success-text)" : status === "abgeschlossen" ? "var(--status-success-text)" : "var(--status-warning-text)" }}>{status}</span>
          </div>
        </div>
        {baRef && <div style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", marginBottom: 6 }}>Aus InterRAI vom {baRef.startDatum}</div>}
        <div style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)", marginBottom: 8 }}>{akzeptiert} Diagnosen · {akzMassnahmen} Massnahmen · {akzZiele} Ziele akzeptiert{vorschlag > 0 ? ` · ${vorschlag} Vorschläge offen` : ""}</div>
        <div className="flex flex-wrap" style={{ gap: 6 }}>
          <button onClick={() => setShowAddDiagnose(true)} className="inline-flex items-center cursor-pointer" style={{ gap: 5, padding: "7px 14px", borderRadius: "var(--radius-pill)", background: "var(--brand-primary)", color: "var(--text-on-dark)", fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", border: "none", minHeight: 34 }}>
            <Plus style={{ width: 13, height: 13 }} /> Diagnose
          </button>
          {status !== "validiert" && status !== "abgeschlossen" && (
            <button onClick={() => setShowValidateDialog(true)} className="inline-flex items-center cursor-pointer" style={{ gap: 5, padding: "7px 14px", borderRadius: "var(--radius-pill)", background: "var(--status-success-bg)", border: "none", color: "var(--status-success-text)", fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", minHeight: 34 }}>
              <CheckCircle2 style={{ width: 13, height: 13 }} /> Validieren
            </button>
          )}
          <button onClick={() => alert("Gespräch – Aufnahme-Modus aus Prompt C")} className="inline-flex items-center cursor-pointer" style={{ gap: 5, padding: "7px 14px", borderRadius: "var(--radius-pill)", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", color: "var(--text-primary)", fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", minHeight: 34 }}>
            <Mic style={{ width: 13, height: 13 }} /> Gespräch
          </button>
        </div>
      </div>

      {/* Diagnose cards */}
      <div className="flex-1 overflow-y-auto pp-pad" style={{ paddingTop: "var(--space-3)", paddingBottom: "var(--space-8)" }}>
        {diagnosen.length === 0 && <div style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--text-tertiary)" }}>Keine Diagnosen. Starte ein Gespräch oder füge manuell hinzu.</div>}

        <div className="flex flex-col" style={{ gap: 8 }}>
          {diagnosen.map(d => {
            const isOpen = expanded.has(d.id);
            const dMassnahmen = massnahmen.filter(m => m.bezugDiagnoseId === d.id);
            const dZiele = ziele.filter(z => z.bezugDiagnoseId === d.id);
            const isAbgelehnt = d.status === "abgelehnt";
            return (
              <div key={d.id} style={{ background: "var(--bg-elevated)", border: `var(--border-thin) solid ${d.status === "vorschlag" ? "var(--status-warning)" : "var(--border-default)"}`, borderRadius: "var(--radius-card)", overflow: "hidden", opacity: isAbgelehnt ? 0.5 : 1 }}>
                {/* Card header */}
                <div className="flex items-center cursor-pointer" onClick={() => toggleExpand(d.id)} style={{ padding: "12px 16px", gap: 10 }}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center" style={{ gap: 6 }}>
                      <span style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--brand-primary)", textDecoration: isAbgelehnt ? "line-through" : "none" }}>NANDA {d.nandaCode}</span>
                      <span style={{ fontSize: "var(--text-body)", color: "var(--text-primary)", textDecoration: isAbgelehnt ? "line-through" : "none" }}>{d.titel}</span>
                      <span style={{ padding: "1px 8px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-micro)", fontWeight: "var(--weight-medium)", background: d.status === "akzeptiert" ? "var(--status-success-bg)" : d.status === "abgelehnt" ? "var(--bg-secondary)" : "var(--status-warning-bg)", color: d.status === "akzeptiert" ? "var(--status-success-text)" : d.status === "abgelehnt" ? "var(--text-tertiary)" : "var(--status-warning-text)" }}>{d.status === "akzeptiert" ? "Akzeptiert" : d.status === "abgelehnt" ? "Abgelehnt" : "Vorschlag"}</span>
                    </div>
                    <div style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", marginTop: 2 }}>{dMassnahmen.length} Massnahmen · {dZiele.length} Ziele</div>
                  </div>
                  {d.status === "vorschlag" && (
                    <div className="flex items-center shrink-0" style={{ gap: 4 }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => setDiagnoseStatus(d.id, "akzeptiert")} title="Akzeptieren" className="flex items-center justify-center cursor-pointer" style={{ width: 28, height: 28, borderRadius: "var(--radius-pill)", background: "var(--status-success-bg)", border: "none" }}><Check style={{ width: 12, height: 12, color: "var(--status-success-text)" }} /></button>
                      <button onClick={() => { setDiagnoseStatus(d.id, "akzeptiert"); toggleExpand(d.id); }} title="Bearbeiten" className="flex items-center justify-center cursor-pointer" style={{ width: 28, height: 28, borderRadius: "var(--radius-pill)", background: "var(--bg-secondary)", border: "none" }}><Edit3 style={{ width: 12, height: 12, color: "var(--text-secondary)" }} /></button>
                      <button onClick={() => setDiagnoseStatus(d.id, "abgelehnt")} title="Ablehnen" className="flex items-center justify-center cursor-pointer" style={{ width: 28, height: 28, borderRadius: "var(--radius-pill)", background: "var(--status-danger-bg)", border: "none" }}><X style={{ width: 12, height: 12, color: "var(--status-danger)" }} /></button>
                    </div>
                  )}
                  {d.status === "abgelehnt" && (
                    <button onClick={e => { e.stopPropagation(); setDiagnoseStatus(d.id, "vorschlag"); }} className="cursor-pointer" style={{ fontSize: "var(--text-meta)", color: "var(--brand-primary)", background: "transparent", border: "none" }}>Reaktivieren</button>
                  )}
                  <ChevronDown style={{ width: 14, height: 14, color: "var(--text-tertiary)", transition: "transform 0.2s", transform: isOpen ? "rotate(180deg)" : "none" }} />
                </div>

                {/* Expanded content */}
                {isOpen && (
                  <div style={{ padding: "0 16px 16px", borderTop: "var(--border-thin) solid var(--border-default)" }}>
                    {/* Begründung */}
                    <div style={{ padding: "10px 0", fontSize: "var(--text-small)", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                      {d.begruendung}
                      {d.bezugCap && <span style={{ display: "block", marginTop: 4, fontSize: "var(--text-meta)", color: "var(--status-info)" }}>Bezug zu CAP: {d.bezugCap}</span>}
                    </div>

                    {/* Massnahmen */}
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: "var(--text-micro)", color: "var(--text-secondary)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase" as const, marginBottom: 6, fontWeight: "var(--weight-medium)" }}>Massnahmen</div>
                      {dMassnahmen.map(m => (
                        <div key={m.id} style={{ padding: "8px 12px", background: m.status === "abgelehnt" ? "var(--bg-primary)" : "var(--bg-secondary)", borderRadius: "var(--radius-card)", marginBottom: 4, opacity: m.status === "abgelehnt" ? 0.5 : 1 }}>
                          {editingMassnahme === m.id ? (
                            <MassnahmeEditor massnahme={m} onSave={(updated) => { setMassnahmen(prev => prev.map(x => x.id === m.id ? { ...updated, status: "akzeptiert" as const } : x)); setEditingMassnahme(null); }} onCancel={() => setEditingMassnahme(null)} />
                          ) : (
                            <div className="flex items-start justify-between">
                              <div>
                                <div style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>{m.titel}</div>
                                {m.beschreibung && <div style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", marginTop: 2 }}>{m.beschreibung}</div>}
                                <div style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)", marginTop: 2 }}>{m.haeufigkeit}</div>
                              </div>
                              <div className="flex items-center shrink-0" style={{ gap: 3 }}>
                                {m.status === "vorschlag" && <button onClick={() => setMassnahmen(prev => prev.map(x => x.id === m.id ? { ...x, status: "akzeptiert" } : x))} className="cursor-pointer" style={{ width: 24, height: 24, borderRadius: "var(--radius-pill)", background: "var(--status-success-bg)", border: "none" }}><Check style={{ width: 10, height: 10, color: "var(--status-success-text)" }} /></button>}
                                <button onClick={() => setEditingMassnahme(m.id)} className="cursor-pointer" style={{ width: 24, height: 24, borderRadius: "var(--radius-pill)", background: "transparent", border: "none" }}><Edit3 style={{ width: 10, height: 10, color: "var(--text-tertiary)" }} /></button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      <button onClick={() => addMassnahme(d.id)} className="inline-flex items-center cursor-pointer" style={{ gap: 4, marginTop: 4, padding: "4px 10px", borderRadius: "var(--radius-pill)", background: "transparent", border: "var(--border-thin) dashed var(--border-default)", fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}><Plus style={{ width: 10, height: 10 }} /> Massnahme</button>
                    </div>

                    {/* Ziele */}
                    <div>
                      <div style={{ fontSize: "var(--text-micro)", color: "var(--text-secondary)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase" as const, marginBottom: 6, fontWeight: "var(--weight-medium)" }}>Ziele</div>
                      {dZiele.map(z => (
                        <div key={z.id} style={{ padding: "8px 12px", background: "var(--brand-primary-light)", borderRadius: "var(--radius-card)", marginBottom: 4, opacity: z.status === "abgelehnt" ? 0.5 : 1 }}>
                          {editingZiel === z.id ? (
                            <ZielEditor ziel={z} onSave={(updated) => { setZiele(prev => prev.map(x => x.id === z.id ? { ...updated, status: "akzeptiert" as const } : x)); setEditingZiel(null); }} onCancel={() => setEditingZiel(null)} />
                          ) : (
                            <div className="flex items-start justify-between">
                              <div>
                                <div style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--brand-primary)" }}>{z.titel}</div>
                                <div style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", marginTop: 2 }}>{z.zeithorizont} · {z.messbar}</div>
                              </div>
                              <button onClick={() => setEditingZiel(z.id)} className="cursor-pointer" style={{ width: 24, height: 24, borderRadius: "var(--radius-pill)", background: "transparent", border: "none" }}><Edit3 style={{ width: 10, height: 10, color: "var(--text-tertiary)" }} /></button>
                            </div>
                          )}
                        </div>
                      ))}
                      <button onClick={() => addZiel(d.id)} className="inline-flex items-center cursor-pointer" style={{ gap: 4, marginTop: 4, padding: "4px 10px", borderRadius: "var(--radius-pill)", background: "transparent", border: "var(--border-thin) dashed var(--border-default)", fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}><Plus style={{ width: 10, height: 10 }} /> Ziel</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Diagnose Dialog */}
      {showAddDiagnose && <AddDiagnoseDialog onAdd={(d) => { setDiagnosen(prev => [...prev, d]); setExpanded(prev => new Set(prev).add(d.id)); setShowAddDiagnose(false); }} onClose={() => setShowAddDiagnose(false)} />}

      {/* Validate Dialog */}
      {showValidateDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ background: "rgba(19,19,20,0.5)" }}>
          <div style={{ background: "var(--bg-elevated)", borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-overlay)", maxWidth: 440, width: "92%", padding: 24 }}>
            <div style={{ fontSize: "var(--text-h3)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", marginBottom: 8 }}>Pflegeplanung validieren?</div>
            <div style={{ fontSize: "var(--text-body)", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 16 }}>
              {akzeptiert} Diagnosen akzeptiert, {akzMassnahmen} Massnahmen, {akzZiele} Ziele.
              {vorschlag > 0 && ` ${vorschlag} Vorschläge sind noch offen.`}
            </div>
            <div className="flex items-center justify-end" style={{ gap: "var(--space-2)" }}>
              <button onClick={() => setShowValidateDialog(false)} className="cursor-pointer" style={{ padding: "10px 20px", borderRadius: "var(--radius-pill)", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>Abbrechen</button>
              <button onClick={handleValidate} className="cursor-pointer" style={{ padding: "10px 20px", borderRadius: "var(--radius-pill)", background: "var(--brand-primary)", border: "none", fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-on-dark)" }}>Validieren</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   ADD DIAGNOSE DIALOG
   ══════════════════════════════════════════ */
function AddDiagnoseDialog({ onAdd, onClose }: { onAdd: (d: Pflegediagnose) => void; onClose: () => void }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<{ code: string; titel: string } | null>(null);
  const [begruendung, setBegruendung] = useState("");

  const filtered = NANDA_KATALOG.filter(n => n.code.includes(search) || n.titel.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ background: "rgba(19,19,20,0.5)" }}>
      <div style={{ background: "var(--bg-elevated)", borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-overlay)", maxWidth: 480, width: "92%", maxHeight: "80vh", overflow: "hidden", display: "flex", flexDirection: "column", padding: "20px 24px" }}>
        <div style={{ fontSize: "var(--text-h3)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", marginBottom: 12 }}>Diagnose hinzufügen</div>

        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="NANDA-Code oder Titel suchen…" style={{ padding: "8px 12px", borderRadius: "var(--radius-card)", border: "var(--border-thin) solid var(--border-default)", fontSize: "var(--text-small)", color: "var(--text-primary)", marginBottom: 8, width: "100%" }} />

        <div style={{ maxHeight: 200, overflowY: "auto", marginBottom: 12 }}>
          {filtered.map(n => (
            <button key={n.code} onClick={() => setSelected(n)} className="w-full text-left cursor-pointer transition-colors"
              style={{ padding: "8px 12px", borderRadius: "var(--radius-card)", background: selected?.code === n.code ? "var(--brand-primary-light)" : "transparent", border: "none", fontSize: "var(--text-small)", color: selected?.code === n.code ? "var(--brand-primary)" : "var(--text-primary)", fontWeight: selected?.code === n.code ? "var(--weight-medium)" : "var(--weight-regular)" }}
              onMouseEnter={e => { if (selected?.code !== n.code) e.currentTarget.style.background = "var(--bg-secondary)"; }} onMouseLeave={e => { if (selected?.code !== n.code) e.currentTarget.style.background = "transparent"; }}>
              <span style={{ fontWeight: "var(--weight-medium)" }}>{n.code}</span> – {n.titel}
            </button>
          ))}
        </div>

        {selected && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", marginBottom: 4 }}>Begründung</div>
            <textarea value={begruendung} onChange={e => setBegruendung(e.target.value)} rows={2} style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-card)", border: "var(--border-thin) solid var(--border-default)", fontSize: "var(--text-small)", resize: "none", fontFamily: "inherit" }} />
          </div>
        )}

        <div className="flex items-center justify-end" style={{ gap: 8 }}>
          <button onClick={onClose} className="cursor-pointer" style={{ padding: "8px 16px", borderRadius: "var(--radius-pill)", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>Abbrechen</button>
          <button disabled={!selected} onClick={() => { if (!selected) return; onAdd({ id: `PD-new-${Date.now()}`, nandaCode: selected.code, titel: selected.titel, bezugCap: null, begruendung, status: "akzeptiert", icdIds: [] }); }} className="cursor-pointer disabled:opacity-40" style={{ padding: "8px 16px", borderRadius: "var(--radius-pill)", background: "var(--brand-primary)", border: "none", fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-on-dark)" }}>Hinzufügen</button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   INLINE EDITORS
   ══════════════════════════════════════════ */
function MassnahmeEditor({ massnahme, onSave, onCancel }: { massnahme: Massnahme; onSave: (m: Massnahme) => void; onCancel: () => void }) {
  const [titel, setTitel] = useState(massnahme.titel);
  const [beschreibung, setBeschreibung] = useState(massnahme.beschreibung);
  const [haeufigkeit, setHaeufigkeit] = useState(massnahme.haeufigkeit);
  return (
    <div className="flex flex-col" style={{ gap: 6 }}>
      <input value={titel} onChange={e => setTitel(e.target.value)} style={{ padding: "6px 10px", borderRadius: "var(--radius-card)", border: "var(--border-thin) solid var(--border-default)", fontSize: "var(--text-small)", fontFamily: "inherit" }} />
      <textarea value={beschreibung} onChange={e => setBeschreibung(e.target.value)} rows={2} style={{ padding: "6px 10px", borderRadius: "var(--radius-card)", border: "var(--border-thin) solid var(--border-default)", fontSize: "var(--text-small)", resize: "none", fontFamily: "inherit" }} />
      <input value={haeufigkeit} onChange={e => setHaeufigkeit(e.target.value)} placeholder="Häufigkeit" style={{ padding: "6px 10px", borderRadius: "var(--radius-card)", border: "var(--border-thin) solid var(--border-default)", fontSize: "var(--text-small)", fontFamily: "inherit" }} />
      <div className="flex" style={{ gap: 6 }}>
        <button onClick={() => onSave({ ...massnahme, titel, beschreibung, haeufigkeit })} className="cursor-pointer" style={{ padding: "5px 12px", borderRadius: "var(--radius-pill)", background: "var(--brand-primary)", border: "none", fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-on-dark)" }}>Speichern</button>
        <button onClick={onCancel} className="cursor-pointer" style={{ padding: "5px 12px", borderRadius: "var(--radius-pill)", background: "transparent", border: "none", fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>Abbrechen</button>
      </div>
    </div>
  );
}

function ZielEditor({ ziel, onSave, onCancel }: { ziel: Pflegeziel; onSave: (z: Pflegeziel) => void; onCancel: () => void }) {
  const [titel, setTitel] = useState(ziel.titel);
  const [zeithorizont, setZeithorizont] = useState(ziel.zeithorizont);
  const [messbar, setMessbar] = useState(ziel.messbar);
  return (
    <div className="flex flex-col" style={{ gap: 6 }}>
      <input value={titel} onChange={e => setTitel(e.target.value)} style={{ padding: "6px 10px", borderRadius: "var(--radius-card)", border: "var(--border-thin) solid var(--border-default)", fontSize: "var(--text-small)", fontFamily: "inherit" }} />
      <div className="flex" style={{ gap: 6 }}>
        <input value={zeithorizont} onChange={e => setZeithorizont(e.target.value)} placeholder="Zeithorizont" style={{ flex: 1, padding: "6px 10px", borderRadius: "var(--radius-card)", border: "var(--border-thin) solid var(--border-default)", fontSize: "var(--text-small)", fontFamily: "inherit" }} />
        <input value={messbar} onChange={e => setMessbar(e.target.value)} placeholder="Messbar" style={{ flex: 1, padding: "6px 10px", borderRadius: "var(--radius-card)", border: "var(--border-thin) solid var(--border-default)", fontSize: "var(--text-small)", fontFamily: "inherit" }} />
      </div>
      <div className="flex" style={{ gap: 6 }}>
        <button onClick={() => onSave({ ...ziel, titel, zeithorizont, messbar })} className="cursor-pointer" style={{ padding: "5px 12px", borderRadius: "var(--radius-pill)", background: "var(--brand-primary)", border: "none", fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-on-dark)" }}>Speichern</button>
        <button onClick={onCancel} className="cursor-pointer" style={{ padding: "5px 12px", borderRadius: "var(--radius-pill)", background: "transparent", border: "none", fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>Abbrechen</button>
      </div>
    </div>
  );
}
