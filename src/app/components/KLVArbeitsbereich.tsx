/**
 * KLVArbeitsbereich — Administrative workflow workspace for KLV-Verordnung.
 * Status tracker with 7-step pipeline + content editor with catalog positions.
 */
import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Check, ChevronDown, ChevronUp, Plus, Edit3, X, Mic, Send, FileText, AlertTriangle, Search, Calendar, Trash2, CheckCircle2 } from "lucide-react";
import { MOCK_KLV_VERORDNUNGEN, MOCK_PFLEGEPLANUNGEN } from "../../lib/mocks/klinische-artefakte-mock";
import { KLV_STATUS_PIPELINE, type KLVStatus, type KLVDiagnose, type KLVLeistung, type KLVEinheit } from "../../types/klinische-artefakte";
import { SPITEX_LEISTUNGSKATALOG_2025, type LeistungskatalogPosition } from "../../lib/klv/spitex-leistungskatalog-2025";
import { hProWoche, berechneSummen, kompaktParams, berechnungsText, einheitLabel, werLabel, istPeriodisch, einmaligeMin, getSimultanPartner } from "../../lib/klv/berechnung";
import { toast } from "sonner";
import { KLV_WER_OPTIONS, KLV_WER_STANDARD } from "../../lib/stammdaten/klv-wer";

const MOCK_AERZTE = ["Dr. med. Markus Huber", "Dr. med. Petra Schmid", "Dr. med. Hans Keller", "Dr. med. Lisa Weber"];
const MOCK_KASSEN = ["CSS", "Helsana", "Swica", "Concordia", "Visana", "Sanitas", "KPT", "Groupe Mutuel"];
const KAT_COLORS = { a: { bg: "var(--status-info-bg)", color: "var(--status-info)", label: "a – Abklärung" }, b: { bg: "var(--status-warning-bg)", color: "var(--status-warning-text)", label: "b – Behandlung" }, c: { bg: "var(--status-success-bg)", color: "var(--status-success-text)", label: "c – Grundpflege" } };

export function KLVArbeitsbereich() {
  const { klvId } = useParams();
  const navigate = useNavigate();
  const klvData = MOCK_KLV_VERORDNUNGEN.find(k => k.id === klvId);
  if (!klvData) return <div style={{ padding: "64px 32px", textAlign: "center" }}><div style={{ fontSize: "var(--text-h3)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>KLV nicht gefunden</div><button onClick={() => navigate(-1)} className="inline-flex items-center cursor-pointer" style={{ marginTop: 16, gap: 8, padding: "10px 20px", borderRadius: "var(--radius-pill)", background: "var(--brand-primary)", color: "var(--text-on-dark)", border: "none" }}><ArrowLeft style={{ width: 16, height: 16 }} /> Zurück</button></div>;

  const ppRef = klvData.pflegeplanungId ? MOCK_PFLEGEPLANUNGEN.find(p => p.id === klvData.pflegeplanungId) : null;

  const [status, setStatus] = useState<KLVStatus>(klvData.status);
  const [diagnosen, setDiagnosen] = useState<KLVDiagnose[]>(klvData.diagnosen.map(d => ({ ...d })));
  const [positionen, setPositionen] = useState<KLVLeistung[]>(klvData.leistungspositionen.map(p => ({ ...p })));
  const [ziele, setZiele] = useState<string[]>([...klvData.zielformulierungen]);
  const [beginnDatum, setBeginnDatum] = useState(klvData.beginnDatum || "");
  const [endDatum, setEndDatum] = useState(klvData.endDatum || "");
  const [showDialog, setShowDialog] = useState<string | null>(null);
  const [showKatalog, setShowKatalog] = useState(false);
  const [editingDiagnose, setEditingDiagnose] = useState<string | null>(null);
  const [expandedPosId, setExpandedPosId] = useState<string | null>(null);

  const isEditable = status === "entwurf";
  const summen = berechneSummen(positionen);
  const totalH = summen.total;

  const currentStepIdx = KLV_STATUS_PIPELINE.findIndex(s => s.status === status);

  // Workflow actions
  const canFreigeben = diagnosen.length > 0 && positionen.length > 0 && beginnDatum;

  const advanceStatus = (newStatus: KLVStatus) => { setStatus(newStatus); toast(`Status: ${KLV_STATUS_PIPELINE.find(s => s.status === newStatus)?.label || newStatus}`); setShowDialog(null); };

  return (
    <div className="h-full flex flex-col" style={{ background: "var(--bg-primary)" }}>
      <style>{`.klv-pad { padding-left: var(--mobile-page-padding); padding-right: var(--mobile-page-padding); } @media (min-width: 640px) { .klv-pad { padding-left: var(--space-6); padding-right: var(--space-6); } }`}</style>

      {/* Header */}
      <div className="shrink-0 klv-pad" style={{ paddingTop: "var(--space-3)", paddingBottom: "var(--space-3)", background: "var(--bg-elevated)", borderBottom: "var(--border-thin) solid var(--border-default)" }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
          <div className="flex items-center" style={{ gap: 8 }}>
            <button onClick={() => navigate(-1)} className="cursor-pointer" style={{ background: "transparent", border: "none", color: "var(--brand-primary)" }}><ArrowLeft style={{ width: 14, height: 14 }} /></button>
            <span style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>KLV — {klvData.patientName}</span>
            <span style={{ padding: "2px 10px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", background: status === "kostengutsprache-erhalten" ? "var(--status-success-bg)" : status === "abgelehnt" ? "var(--status-danger-bg)" : "var(--status-warning-bg)", color: status === "kostengutsprache-erhalten" ? "var(--status-success-text)" : status === "abgelehnt" ? "var(--status-danger)" : "var(--status-warning-text)" }}>{KLV_STATUS_PIPELINE.find(s => s.status === status)?.label || status}</span>
          </div>
        </div>
        {ppRef && <div style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", marginBottom: 4 }}>Aus Pflegeplanung vom {ppRef.erstellDatum}</div>}
        <div style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>{diagnosen.length} Diagnosen · {positionen.length} Positionen · {totalH.toFixed(1)} h/Wo.</div>
      </div>

      <div className="flex-1 overflow-y-auto klv-pad" style={{ paddingTop: "var(--space-3)", paddingBottom: "var(--space-8)" }}>

        {/* Status Tracker */}
        <div style={{ padding: "14px 18px", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)", marginBottom: 16 }}>
          <div className="flex items-center overflow-x-auto" style={{ gap: 0, marginBottom: 12 }}>
            {KLV_STATUS_PIPELINE.map((step, i) => {
              const isCurrent = status === step.status;
              const isPast = currentStepIdx > i;
              return (
                <div key={step.status} className="flex items-center shrink-0">
                  {i > 0 && <div style={{ width: 20, height: 2, background: isPast ? "var(--brand-primary)" : "var(--border-default)" }} />}
                  <div className="flex flex-col items-center" style={{ gap: 3, minWidth: 64 }}>
                    <div style={{ width: 22, height: 22, borderRadius: "var(--radius-pill)", background: isPast || isCurrent ? "var(--brand-primary)" : "var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center", border: isCurrent ? "2px solid var(--brand-primary-dark)" : "none" }}>
                      {isPast && <Check style={{ width: 10, height: 10, color: "var(--text-on-dark)" }} />}
                      {isCurrent && <span style={{ width: 6, height: 6, borderRadius: "var(--radius-pill)", background: "var(--text-on-dark)" }} />}
                    </div>
                    <span style={{ fontSize: 10, color: isCurrent ? "var(--brand-primary)" : isPast ? "var(--text-primary)" : "var(--text-tertiary)", fontWeight: isCurrent ? "var(--weight-medium)" : "var(--weight-regular)", textAlign: "center", whiteSpace: "nowrap" }}>{step.label}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Workflow action */}
          {status === "entwurf" && (
            <WorkflowAction hint="Die KLV ist im Entwurf. Sobald die Inhalte stimmen, zur Kontrolle freigeben." actionLabel="Zur Kontrolle freigeben" disabled={!canFreigeben} disabledHint={!canFreigeben ? "Mindestens 1 Diagnose, 1 Position und Beginn-Datum nötig" : undefined} onAction={() => advanceStatus("kontrolliert")} />
          )}
          {status === "kontrolliert" && (
            <WorkflowAction hint="Die KLV ist kontrolliert und bereit für den Arzt." actionLabel="An Arzt senden" onAction={() => setShowDialog("arzt")} />
          )}
          {status === "beim-arzt" && (
            <WorkflowAction hint={`Die KLV wartet auf die Anordnung durch den Arzt.`} actionLabel="Antwort vom Arzt erfassen" onAction={() => setShowDialog("arzt-antwort")} />
          )}
          {status === "vom-arzt-zurueck" && (
            <WorkflowAction hint="Der Arzt hat die KLV angeordnet. Sie kann an die Krankenkasse gehen." actionLabel="An Krankenkasse senden" onAction={() => setShowDialog("kk")} />
          )}
          {status === "bei-krankenkasse" && (
            <WorkflowAction hint="Die KLV ist bei der Krankenkasse zur Kostengutsprache." actionLabel="Kostengutsprache erfassen" onAction={() => setShowDialog("kk-antwort")} />
          )}
          {status === "kostengutsprache-erhalten" && (
            <WorkflowAction hint={`KLV gültig${beginnDatum ? ` ab ${beginnDatum}` : ""}${endDatum ? ` bis ${endDatum}` : ""}.`} actionLabel="Neue KLV anlegen" onAction={() => alert("Neue KLV – Stub")} variant="secondary" />
          )}
          {status === "abgelehnt" && (
            <div style={{ padding: "10px 14px", background: "var(--status-danger-bg)", borderRadius: "var(--radius-card)", fontSize: "var(--text-small)", color: "var(--status-danger)" }}>
              <AlertTriangle style={{ width: 14, height: 14, display: "inline", verticalAlign: "middle", marginRight: 6 }} />
              Abgelehnt{klvData.ablehnungsgrund ? `: ${klvData.ablehnungsgrund}` : ""}
            </div>
          )}
        </div>

        {/* Content Editor */}
        {/* 1. Verordnungs-Daten */}
        <Section title="Verordnungs-Daten">
          <div className="flex flex-wrap" style={{ gap: 12 }}>
            <div>
              <div style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", marginBottom: 4 }}>Beginn</div>
              {isEditable ? <input type="text" value={beginnDatum} onChange={e => setBeginnDatum(e.target.value)} placeholder="DD.MM.YYYY" style={{ padding: "6px 10px", borderRadius: "var(--radius-card)", border: "var(--border-thin) solid var(--border-default)", fontSize: "var(--text-small)", fontFamily: "inherit", width: 130 }} /> : <span style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)" }}>{beginnDatum || "–"}</span>}
            </div>
            <div>
              <div style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", marginBottom: 4 }}>Ende</div>
              {isEditable ? <input type="text" value={endDatum} onChange={e => setEndDatum(e.target.value)} placeholder="DD.MM.YYYY" style={{ padding: "6px 10px", borderRadius: "var(--radius-card)", border: "var(--border-thin) solid var(--border-default)", fontSize: "var(--text-small)", fontFamily: "inherit", width: 130 }} /> : <span style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)" }}>{endDatum || "–"}</span>}
            </div>
          </div>
          {!isEditable && <div style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)", marginTop: 6 }}>Inhalte nur im Entwurf-Status editierbar.</div>}
        </Section>

        {/* 2. Diagnosen */}
        <Section title="Diagnosen">
          {diagnosen.map(d => (
            <div key={d.id} style={{ padding: "8px 12px", background: "var(--bg-secondary)", borderRadius: "var(--radius-card)", marginBottom: 4 }}>
              {editingDiagnose === d.id && isEditable ? (
                <DiagnoseEditor diagnose={d} onSave={(updated) => { setDiagnosen(prev => prev.map(x => x.id === d.id ? updated : x)); setEditingDiagnose(null); }} onCancel={() => setEditingDiagnose(null)} />
              ) : (
                <div className="flex items-start justify-between">
                  <div>
                    {d.icdCode && <span style={{ fontWeight: "var(--weight-medium)", color: "var(--brand-primary)", marginRight: 6, fontSize: "var(--text-small)" }}>{d.icdCode}</span>}
                    <span style={{ fontWeight: "var(--weight-medium)", color: "var(--text-primary)", fontSize: "var(--text-small)" }}>{d.titel}</span>
                    {d.beschreibung && <div style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", marginTop: 2 }}>{d.beschreibung}</div>}
                  </div>
                  {isEditable && <button onClick={() => setEditingDiagnose(d.id)} className="cursor-pointer" style={{ background: "transparent", border: "none" }}><Edit3 style={{ width: 12, height: 12, color: "var(--text-tertiary)" }} /></button>}
                </div>
              )}
            </div>
          ))}
          {isEditable && <button onClick={() => { setDiagnosen(prev => [...prev, { id: `KD-new-${Date.now()}`, icdCode: null, titel: "Neue Diagnose", beschreibung: "" }]); setEditingDiagnose(`KD-new-${Date.now()}`); }} className="inline-flex items-center cursor-pointer" style={{ gap: 4, marginTop: 4, padding: "4px 10px", borderRadius: "var(--radius-pill)", background: "transparent", border: "var(--border-thin) dashed var(--border-default)", fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}><Plus style={{ width: 10, height: 10 }} /> Diagnose</button>}
        </Section>

        {/* 3. Leistungspositionen — Progressive Disclosure */}
        <Section title="Leistungspositionen">
          {(["a", "b", "c"] as const).map(kat => {
            const items = positionen.filter(p => p.kategorie === kat);
            if (items.length === 0) return null;
            const katSub = items.reduce((s, l) => s + (istPeriodisch(l) ? hProWoche(l) : 0), 0);
            return (
              <div key={kat} style={{ marginBottom: 12 }}>
                <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                  <div className="flex items-center" style={{ gap: 6 }}>
                    <span style={{ padding: "1px 8px", borderRadius: "var(--radius-pill)", fontSize: 9, fontWeight: "var(--weight-semibold)", background: KAT_COLORS[kat].bg, color: KAT_COLORS[kat].color }}>{kat}</span>
                    <span style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>{KAT_COLORS[kat].label}</span>
                    <span style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>({items.length})</span>
                  </div>
                  <span style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", fontWeight: "var(--weight-medium)", fontVariantNumeric: "tabular-nums" }}>{katSub.toFixed(2)} h/Wo.</span>
                </div>
                {/* Column header */}
                <div style={{ display: "grid", gridTemplateColumns: "28px 52px 1fr auto auto 24px", gap: 4, padding: "0 0 2px", borderBottom: "1px solid var(--border-default)" }}>
                  <span style={{ fontSize: 9, color: "var(--text-tertiary)" }}></span>
                  <span style={{ fontSize: 9, color: "var(--text-tertiary)" }}>Nr.</span>
                  <span style={{ fontSize: 9, color: "var(--text-tertiary)" }}>Leistung</span>
                  <span className="hidden sm:block" style={{ fontSize: 9, color: "var(--text-tertiary)", textAlign: "right" }}>Zeit</span>
                  <span style={{ fontSize: 9, color: "var(--text-tertiary)", textAlign: "right", minWidth: 62 }}>h/Wo.</span>
                  <span />
                </div>
                {items.map(l => {
                  const isExp = expandedPosId === l.id;
                  const partners = getSimultanPartner(l, positionen);
                  const hW = hProWoche(l);
                  const isPer = istPeriodisch(l);
                  return (
                    <div key={l.id}>
                      {/* Compact row */}
                      <div onClick={() => isEditable && setExpandedPosId(isExp ? null : l.id)} style={{ display: "grid", gridTemplateColumns: "28px 52px 1fr auto auto 24px", gap: 4, alignItems: "start", padding: "6px 0", cursor: isEditable ? "pointer" : "default", borderBottom: isExp ? "none" : "1px solid var(--border-default)" }}>
                        <div style={{ display: "flex", justifyContent: "center", paddingTop: 1 }}>
                          {l.validiert ? (
                            <span style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--status-success)", display: "flex", alignItems: "center", justifyContent: "center" }}><Check style={{ width: 10, height: 10, color: "var(--text-on-dark)" }} /></span>
                          ) : (
                            <span style={{ width: 18, height: 18, borderRadius: "50%", border: "1.5px solid var(--border-default)" }} />
                          )}
                        </div>
                        <span style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)", fontFamily: "monospace", fontVariantNumeric: "tabular-nums", paddingTop: 1 }}>{l.klvNummer}</span>
                        <div style={{ minWidth: 0 }}>
                          <div className="flex items-center" style={{ gap: 4 }}>
                            <span className="truncate" style={{ fontSize: "var(--text-small)", color: "var(--text-primary)" }}>{l.bezeichnung}</span>
                            {l.ausAnna && l.annaKonfidenz && <span style={{ width: 5, height: 5, borderRadius: "50%", background: l.annaKonfidenz === "hoch" ? "var(--status-success-text)" : l.annaKonfidenz === "mittel" ? "var(--status-warning-text)" : "var(--status-danger)", flexShrink: 0 }} />}
                          </div>
                          <div className="flex items-center" style={{ fontSize: 10, color: "var(--text-tertiary)", marginTop: 1, gap: 3 }}>
                            <span>{werLabel(l.wer)} · {l.anzahl}× {einheitLabel(l.einheit)}</span>
                            {partners.length > 0 && <span title={`Wird simultan zu ${partners.map(p => `${p.klvNummer} ${p.bezeichnung}`).join(", ")} erbracht`} style={{ color: "var(--status-info)", cursor: "help", fontSize: 11 }}>⟂</span>}
                          </div>
                        </div>
                        <span className="hidden sm:block" style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", textAlign: "right", fontVariantNumeric: "tabular-nums", paddingTop: 1 }}>{l.zeitMin} min</span>
                        <span style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: isPer ? "var(--text-primary)" : "var(--text-tertiary)", textAlign: "right", fontVariantNumeric: "tabular-nums", minWidth: 62, paddingTop: 1 }}>
                          {isPer ? hW.toFixed(2) : l.einheit === "e" ? "einm." : "n. B."}
                        </span>
                        {isEditable ? (
                          <button onClick={e => { e.stopPropagation(); setExpandedPosId(isExp ? null : l.id); }} className="cursor-pointer" style={{ width: 24, height: 24, background: "none", border: "none", color: "var(--text-tertiary)", padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {isExp ? <ChevronUp style={{ width: 14, height: 14 }} /> : <ChevronDown style={{ width: 14, height: 14 }} />}
                          </button>
                        ) : <span />}
                      </div>

                      {/* Inline-Expand */}
                      {isExp && isEditable && (() => {
                        const rhythmus = l.einheit === "e" ? "einmalig" : l.einheit === "nB" ? "nachBedarf" : l.einheit === "m" ? "monatlich" : l.einheit === "w" ? "wöchentlich" : "täglich";
                        const tage = l.einheit.startsWith("t") ? parseInt(l.einheit.slice(1)) : (l.einheit === "w" ? 1 : 7);
                        const tageDisabled = rhythmus !== "täglich";
                        const anzahlDisabled = rhythmus === "einmalig" || rhythmus === "nachBedarf";
                        const upd = (patch: Partial<KLVLeistung>) => setPositionen(prev => prev.map(x => x.id === l.id ? { ...x, ...patch } : x));
                        const setRhythmus = (r: string) => {
                          if (r === "einmalig") upd({ einheit: "e" as KLVEinheit, anzahl: 1 });
                          else if (r === "nachBedarf") upd({ einheit: "nB" as KLVEinheit, anzahl: 1 });
                          else if (r === "monatlich") upd({ einheit: "m" as KLVEinheit });
                          else if (r === "wöchentlich") upd({ einheit: "w" as KLVEinheit });
                          else upd({ einheit: `t${tage}` as KLVEinheit });
                        };
                        const setTage = (t: number) => { const c = Math.max(1, Math.min(7, t)); upd({ einheit: (c === 1 ? "w" : `t${c}`) as KLVEinheit }); };
                        const calcText = rhythmus === "täglich" ? `${tage} Tage × ${l.anzahl} Einsatz × ${l.zeitMin} min`
                          : rhythmus === "wöchentlich" ? `${l.anzahl} Einsätze/Woche × ${l.zeitMin} min`
                          : rhythmus === "monatlich" ? `${l.anzahl}× pro Monat × ${l.zeitMin} min ÷ 4.33` : "";
                        const ss = { width: "100%", padding: "5px 8px", fontSize: "var(--text-small)", borderRadius: "var(--radius-card)", border: "var(--border-thin) solid var(--border-default)", background: "var(--bg-primary)", color: "var(--text-primary)" } as const;
                        const ssDis = { ...ss, opacity: 0.4, pointerEvents: "none" as const, background: "var(--bg-secondary)" };
                        return (
                          <div style={{ background: "var(--bg-secondary)", borderLeft: "3px solid var(--brand-primary)", borderRadius: "0 var(--radius-card) var(--radius-card) 0", padding: "12px 14px", marginBottom: 4 }}>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8, marginBottom: 10 }}>
                              <div><label style={{ display: "block", fontSize: 9, color: "var(--text-tertiary)", marginBottom: 2 }}>Wer</label><select value={l.wer} onChange={e => upd({ wer: e.target.value as KLVLeistung["wer"] })} style={ss}>{KLV_WER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
                              <div><label style={{ display: "block", fontSize: 9, color: "var(--text-tertiary)", marginBottom: 2 }}>Rhythmus</label><select value={rhythmus} onChange={e => setRhythmus(e.target.value)} style={ss}><option value="täglich">Täglich</option><option value="wöchentlich">Wöchentlich</option><option value="monatlich">Monatlich</option><option value="einmalig">Einmalig</option><option value="nachBedarf">Nach Bedarf</option></select></div>
                              <div><label style={{ display: "block", fontSize: 9, color: "var(--text-tertiary)", marginBottom: 2 }}>an wie vielen Tagen</label><input type="number" min={1} max={7} value={tage} onChange={e => setTage(parseInt(e.target.value) || 1)} disabled={tageDisabled} style={tageDisabled ? ssDis : ss} /></div>
                              <div><label style={{ display: "block", fontSize: 9, color: "var(--text-tertiary)", marginBottom: 2 }}>Anzahl</label><input type="number" min={1} value={l.anzahl} onChange={e => upd({ anzahl: Math.max(1, parseInt(e.target.value) || 1) })} disabled={anzahlDisabled} style={anzahlDisabled ? ssDis : ss} /></div>
                              <div><label style={{ display: "block", fontSize: 9, color: "var(--text-tertiary)", marginBottom: 2 }}>Zeit pro Einsatz</label><div className="flex items-center" style={{ gap: 4 }}><input type="number" min={1} value={l.zeitMin} onChange={e => upd({ zeitMin: Math.max(1, parseInt(e.target.value) || 1) })} style={{ ...ss, flex: 1 }} /><span style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>min</span></div></div>
                            </div>
                            <div style={{ padding: "6px 10px", background: "var(--bg-primary)", borderRadius: "var(--radius-card)", border: "var(--border-thin) solid var(--border-default)", fontSize: "var(--text-small)", color: "var(--text-secondary)", marginBottom: 10 }}>
                              {rhythmus === "einmalig" ? <span>→ einmalig · <strong style={{ color: "var(--text-primary)" }}>{l.zeitMin} min</strong></span>
                              : rhythmus === "nachBedarf" ? <span>→ nach Bedarf · {l.zeitMin} min/Einsatz · <em>nicht in Wochensumme</em></span>
                              : <span>→ <strong style={{ color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>{hW.toFixed(2)} h/Wo.</strong> <span style={{ fontSize: "var(--text-meta)" }}>({calcText})</span></span>}
                            </div>
                            <div className="flex items-center" style={{ gap: 8 }}>
                              <button onClick={() => { upd({ validiert: true }); setExpandedPosId(null); }} className="inline-flex items-center cursor-pointer" style={{ gap: 4, padding: "5px 14px", borderRadius: "var(--radius-pill)", background: "var(--brand-primary)", color: "var(--text-on-dark)", fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", border: "none" }}><Check style={{ width: 12, height: 12 }} /> Bestätigen</button>
                              <button onClick={() => { setPositionen(prev => prev.filter(x => x.id !== l.id)); setExpandedPosId(null); }} className="inline-flex items-center cursor-pointer" style={{ gap: 4, padding: "5px 14px", borderRadius: "var(--radius-pill)", background: "none", color: "var(--status-danger)", fontSize: "var(--text-small)", border: "var(--border-thin) solid var(--status-danger)" }}><Trash2 style={{ width: 12, height: 12 }} /> Entfernen</button>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            );
          })}
          {/* Summen */}
          <div style={{ borderTop: "2px solid var(--border-default)", paddingTop: 10, marginTop: 4 }}>
            {(["a","b","c"] as const).map(k => { const v = k === "a" ? summen.kategorieA : k === "b" ? summen.kategorieB : summen.kategorieC; return v > 0 ? (
              <div key={k} className="flex items-center justify-between" style={{ padding: "2px 0", fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>
                <span>Kategorie {k}:</span><span style={{ fontVariantNumeric: "tabular-nums" }}>{v.toFixed(2)} h/Wo.</span>
              </div>
            ) : null; })}
            <div style={{ borderTop: "1px solid var(--border-default)", margin: "4px 0" }} />
            <div className="flex items-center justify-between" style={{ padding: "2px 0", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", fontSize: "var(--text-body)" }}>
              <span>Total</span><span style={{ fontVariantNumeric: "tabular-nums" }}>{summen.total.toFixed(2)} h/Wo.</span>
            </div>
            {summen.einmaligMin > 0 && (
              <div className="flex items-center justify-between" style={{ padding: "2px 0", fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>
                <span>Einmalige Leistungen</span><span style={{ fontVariantNumeric: "tabular-nums" }}>{summen.einmaligMin} min ({summen.einmaligH.toFixed(2)} h)</span>
              </div>
            )}
            <div className="flex flex-wrap" style={{ gap: 8, marginTop: 10 }}>
              <button onClick={() => toast("Dokument-Generierung folgt")} className="inline-flex items-center cursor-pointer" style={{ gap: 5, padding: "6px 14px", borderRadius: "var(--radius-pill)", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}><FileText style={{ width: 13, height: 13 }} /> Leistungsplanungsblatt</button>
              <button onClick={() => toast("Dokument-Generierung folgt")} className="inline-flex items-center cursor-pointer" style={{ gap: 5, padding: "6px 14px", borderRadius: "var(--radius-pill)", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}><FileText style={{ width: 13, height: 13 }} /> Bedarfsmeldeformular (KLV Art. 7)</button>
            </div>
          </div>
          {isEditable && (
            <div className="flex flex-wrap" style={{ gap: 6, marginTop: 8 }}>
              <button onClick={() => setShowKatalog(true)} className="inline-flex items-center cursor-pointer" style={{ gap: 4, padding: "6px 12px", borderRadius: "var(--radius-pill)", background: "var(--brand-primary)", color: "var(--text-on-dark)", fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", border: "none" }}><Plus style={{ width: 12, height: 12 }} /> Aus Katalog</button>
              {ppRef && <button onClick={() => alert("Aus Pflegeplanung übernehmen – Stub")} className="inline-flex items-center cursor-pointer" style={{ gap: 4, padding: "6px 12px", borderRadius: "var(--radius-pill)", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>Aus Pflegeplanung</button>}
            </div>
          )}
        </Section>

        {/* 4. Pflegeziele */}
        <Section title="Pflegeziele (administrativ)">
          {ziele.map((z, i) => (
            <div key={i} style={{ padding: "6px 10px", background: "var(--bg-secondary)", borderRadius: "var(--radius-card)", marginBottom: 3, fontSize: "var(--text-small)", color: "var(--text-primary)" }}>
              {isEditable ? <input value={z} onChange={e => setZiele(prev => prev.map((x, j) => j === i ? e.target.value : x))} style={{ width: "100%", background: "transparent", border: "none", outline: "none", fontSize: "var(--text-small)", fontFamily: "inherit" }} /> : z}
            </div>
          ))}
          {isEditable && <button onClick={() => setZiele(prev => [...prev, ""])} className="inline-flex items-center cursor-pointer" style={{ gap: 4, marginTop: 4, padding: "4px 10px", borderRadius: "var(--radius-pill)", background: "transparent", border: "var(--border-thin) dashed var(--border-default)", fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}><Plus style={{ width: 10, height: 10 }} /> Ziel</button>}
        </Section>
      </div>

      {/* Dialogs */}
      {showDialog === "arzt" && <VersandDialog title="An Arzt senden" options={MOCK_AERZTE} optionLabel="Arzt" onConfirm={() => advanceStatus("beim-arzt")} onClose={() => setShowDialog(null)} />}
      {showDialog === "arzt-antwort" && <ErfassungsDialog title="Antwort vom Arzt" label="Datum der Anordnung" onConfirm={() => advanceStatus("vom-arzt-zurueck")} onClose={() => setShowDialog(null)} />}
      {showDialog === "kk" && <VersandDialog title="An Krankenkasse senden" options={MOCK_KASSEN} optionLabel="Krankenkasse" onConfirm={() => advanceStatus("bei-krankenkasse")} onClose={() => setShowDialog(null)} />}
      {showDialog === "kk-antwort" && <KKAntwortDialog onConfirm={(genehmigt) => advanceStatus(genehmigt ? "kostengutsprache-erhalten" : "abgelehnt")} onClose={() => setShowDialog(null)} />}
      {showKatalog && <KatalogDialog onAdd={(pos) => { setPositionen(prev => [...prev, { ...pos, id: `LP-new-${Date.now()}` }]); setShowKatalog(false); }} onClose={() => setShowKatalog(false)} />}
    </div>
  );
}

/* ══════════════════════════════════════════
   SUB-COMPONENTS
   ══════════════════════════════════════════ */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: "var(--text-micro)", color: "var(--text-secondary)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase" as const, marginBottom: 8, fontWeight: "var(--weight-medium)" }}>{title}</div>
      {children}
    </div>
  );
}

function WorkflowAction({ hint, actionLabel, onAction, disabled, disabledHint, variant }: { hint: string; actionLabel: string; onAction: () => void; disabled?: boolean; disabledHint?: string; variant?: "secondary" }) {
  return (
    <div style={{ padding: "10px 14px", background: "var(--bg-secondary)", borderRadius: "var(--radius-card)" }}>
      <div style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", marginBottom: 8 }}>{hint}</div>
      <button onClick={onAction} disabled={disabled} className="inline-flex items-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        title={disabledHint}
        style={{ gap: 6, padding: "8px 18px", borderRadius: "var(--radius-pill)", background: variant === "secondary" ? "var(--bg-elevated)" : "var(--brand-primary)", border: variant === "secondary" ? "var(--border-thin) solid var(--border-default)" : "none", color: variant === "secondary" ? "var(--text-primary)" : "var(--text-on-dark)", fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", minHeight: 36 }}>
        {actionLabel}
      </button>
    </div>
  );
}

function VersandDialog({ title, options, optionLabel, onConfirm, onClose }: { title: string; options: string[]; optionLabel: string; onConfirm: () => void; onClose: () => void }) {
  const [selected, setSelected] = useState(options[0]);
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ background: "rgba(19,19,20,0.5)" }}>
      <div style={{ background: "var(--bg-elevated)", borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-overlay)", maxWidth: 440, width: "92%", padding: 24 }}>
        <div style={{ fontSize: "var(--text-h3)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", marginBottom: 12 }}>{title}</div>
        <div style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", marginBottom: 4 }}>{optionLabel}</div>
        <select value={selected} onChange={e => setSelected(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-card)", border: "var(--border-thin) solid var(--border-default)", fontSize: "var(--text-small)", marginBottom: 16, fontFamily: "inherit" }}>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <div className="flex justify-end" style={{ gap: 8 }}>
          <button onClick={onClose} className="cursor-pointer" style={{ padding: "8px 16px", borderRadius: "var(--radius-pill)", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)" }}>Abbrechen</button>
          <button onClick={onConfirm} className="cursor-pointer" style={{ padding: "8px 16px", borderRadius: "var(--radius-pill)", background: "var(--brand-primary)", border: "none", color: "var(--text-on-dark)", fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)" }}>Senden</button>
        </div>
      </div>
    </div>
  );
}

function ErfassungsDialog({ title, label, onConfirm, onClose }: { title: string; label: string; onConfirm: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ background: "rgba(19,19,20,0.5)" }}>
      <div style={{ background: "var(--bg-elevated)", borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-overlay)", maxWidth: 400, width: "92%", padding: 24 }}>
        <div style={{ fontSize: "var(--text-h3)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", marginBottom: 12 }}>{title}</div>
        <div style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", marginBottom: 4 }}>{label}</div>
        <input type="text" defaultValue="03.03.2026" style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-card)", border: "var(--border-thin) solid var(--border-default)", fontSize: "var(--text-small)", marginBottom: 16, fontFamily: "inherit" }} />
        <div className="flex justify-end" style={{ gap: 8 }}>
          <button onClick={onClose} className="cursor-pointer" style={{ padding: "8px 16px", borderRadius: "var(--radius-pill)", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)" }}>Abbrechen</button>
          <button onClick={onConfirm} className="cursor-pointer" style={{ padding: "8px 16px", borderRadius: "var(--radius-pill)", background: "var(--brand-primary)", border: "none", color: "var(--text-on-dark)", fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)" }}>Erfassen</button>
        </div>
      </div>
    </div>
  );
}

function KKAntwortDialog({ onConfirm, onClose }: { onConfirm: (genehmigt: boolean) => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ background: "rgba(19,19,20,0.5)" }}>
      <div style={{ background: "var(--bg-elevated)", borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-overlay)", maxWidth: 400, width: "92%", padding: 24 }}>
        <div style={{ fontSize: "var(--text-h3)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", marginBottom: 12 }}>Kostengutsprache erfassen</div>
        <div style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", marginBottom: 4 }}>Datum</div>
        <input type="text" defaultValue="03.03.2026" style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-card)", border: "var(--border-thin) solid var(--border-default)", fontSize: "var(--text-small)", marginBottom: 16, fontFamily: "inherit" }} />
        <div className="flex justify-end" style={{ gap: 8 }}>
          <button onClick={onClose} className="cursor-pointer" style={{ padding: "8px 16px", borderRadius: "var(--radius-pill)", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)" }}>Abbrechen</button>
          <button onClick={() => onConfirm(false)} className="cursor-pointer" style={{ padding: "8px 16px", borderRadius: "var(--radius-pill)", background: "var(--status-danger-bg)", border: "none", color: "var(--status-danger)", fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)" }}>Abgelehnt</button>
          <button onClick={() => onConfirm(true)} className="cursor-pointer" style={{ padding: "8px 16px", borderRadius: "var(--radius-pill)", background: "var(--brand-primary)", border: "none", color: "var(--text-on-dark)", fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)" }}>Genehmigt</button>
        </div>
      </div>
    </div>
  );
}

function KatalogDialog({ onAdd, onClose }: { onAdd: (pos: Omit<KLVLeistung, "id">) => void; onClose: () => void }) {
  const [search, setSearch] = useState("");
  const [katFilter, setKatFilter] = useState<string>("alle");

  const filtered = SPITEX_LEISTUNGSKATALOG_2025.filter(p => {
    if (katFilter !== "alle" && p.klvKategorie !== katFilter) return false;
    if (!p.klvKategorie) return false; // exclude non-KLV
    if (search && !p.nr.includes(search) && !p.bezeichnung.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ background: "rgba(19,19,20,0.5)" }}>
      <div style={{ background: "var(--bg-elevated)", borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-overlay)", maxWidth: 560, width: "92%", maxHeight: "80vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "var(--border-thin) solid var(--border-default)" }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
            <span style={{ fontSize: "var(--text-h3)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>Position aus Katalog</span>
            <button onClick={onClose} className="cursor-pointer" style={{ background: "transparent", border: "none" }}><X style={{ width: 16, height: 16, color: "var(--text-secondary)" }} /></button>
          </div>
          <div className="flex items-center" style={{ gap: 8 }}>
            <div className="flex-1" style={{ position: "relative" }}>
              <Search style={{ width: 14, height: 14, color: "var(--text-tertiary)", position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Nr. oder Bezeichnung…" style={{ width: "100%", padding: "8px 10px 8px 30px", borderRadius: "var(--radius-pill)", border: "var(--border-thin) solid var(--border-default)", fontSize: "var(--text-small)", fontFamily: "inherit" }} />
            </div>
            <div className="flex" style={{ gap: 4 }}>
              {["alle", "a", "b", "c"].map(k => (
                <button key={k} onClick={() => setKatFilter(k)} className="cursor-pointer" style={{ padding: "4px 10px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-meta)", fontWeight: katFilter === k ? "var(--weight-medium)" : "var(--weight-regular)", background: katFilter === k ? "var(--brand-primary-light)" : "transparent", border: katFilter === k ? "none" : "var(--border-thin) solid var(--border-default)", color: katFilter === k ? "var(--brand-primary)" : "var(--text-primary)" }}>
                  {k === "alle" ? "Alle" : k}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 12px" }}>
          {filtered.slice(0, 40).map(p => {
            const kc = KAT_COLORS[p.klvKategorie as "a" | "b" | "c"];
            return (
              <button key={p.nr} onClick={() => onAdd({ klvNummer: p.nr, bezeichnung: p.bezeichnung, kategorie: p.klvKategorie as "a" | "b" | "c", wer: KLV_WER_STANDARD, training: "N", anzahl: 1, einheit: "w", zeitMin: p.zeitMin || 15, ausAnna: false, annaKonfidenz: null, validiert: false, simultanGruppe: null, bezugMassnahmeId: null, diagnoseIds: [], wzwBegruendung: null })}
                className="w-full flex items-center text-left cursor-pointer transition-colors" style={{ padding: "8px 10px", borderRadius: "var(--radius-card)", border: "none", background: "transparent", gap: 8 }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <span style={{ padding: "1px 5px", borderRadius: 4, fontSize: 9, fontWeight: "var(--weight-semibold)", background: kc.bg, color: kc.color }}>{p.klvKategorie}</span>
                <span style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", minWidth: 50 }}>{p.nr}</span>
                <span className="flex-1 truncate" style={{ fontSize: "var(--text-small)", color: "var(--text-primary)" }}>{p.bezeichnung}</span>
                <span style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>{p.zeitMin ? `${p.zeitMin}′` : "–"}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DiagnoseEditor({ diagnose, onSave, onCancel }: { diagnose: KLVDiagnose; onSave: (d: KLVDiagnose) => void; onCancel: () => void }) {
  const [icdCode, setIcdCode] = useState(diagnose.icdCode || "");
  const [titel, setTitel] = useState(diagnose.titel);
  const [beschreibung, setBeschreibung] = useState(diagnose.beschreibung);
  return (
    <div className="flex flex-col" style={{ gap: 6 }}>
      <div className="flex" style={{ gap: 6 }}>
        <input value={icdCode} onChange={e => setIcdCode(e.target.value)} placeholder="ICD-Code" style={{ width: 80, padding: "6px 8px", borderRadius: "var(--radius-card)", border: "var(--border-thin) solid var(--border-default)", fontSize: "var(--text-small)", fontFamily: "inherit" }} />
        <input value={titel} onChange={e => setTitel(e.target.value)} placeholder="Titel" style={{ flex: 1, padding: "6px 8px", borderRadius: "var(--radius-card)", border: "var(--border-thin) solid var(--border-default)", fontSize: "var(--text-small)", fontFamily: "inherit" }} />
      </div>
      <textarea value={beschreibung} onChange={e => setBeschreibung(e.target.value)} placeholder="Beschreibung" rows={2} style={{ padding: "6px 8px", borderRadius: "var(--radius-card)", border: "var(--border-thin) solid var(--border-default)", fontSize: "var(--text-small)", resize: "none", fontFamily: "inherit" }} />
      <div className="flex" style={{ gap: 6 }}>
        <button onClick={() => onSave({ ...diagnose, icdCode: icdCode || null, titel, beschreibung })} className="cursor-pointer" style={{ padding: "5px 12px", borderRadius: "var(--radius-pill)", background: "var(--brand-primary)", border: "none", fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-on-dark)" }}>Speichern</button>
        <button onClick={onCancel} className="cursor-pointer" style={{ padding: "5px 12px", borderRadius: "var(--radius-pill)", background: "transparent", border: "none", fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>Abbrechen</button>
      </div>
    </div>
  );
}
