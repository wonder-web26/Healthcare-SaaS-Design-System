/**
 * GespraechAufnahme — Multi-Output recording tool.
 * Streams scripted transcript, populates 3 parallel drafts:
 * BA items, PP diagnoses, KLV positions (from official SPITEX_LEISTUNGSKATALOG_2025).
 * DEMO: All content deterministic, no real audio.
 */
import { useState, useEffect, useRef } from "react";
import { Sparkles, Mic, MicOff, Pause, Play, X, ChevronRight, ClipboardList, FileText, Target } from "lucide-react";
import { DEMO_GESPRAECH, type KLVVorschlag } from "../../lib/mocks/gespraech-demo";

function parseMarkers(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /\{\{(danger|warning)\}\}(.*?)\{\{\/\1\}\}/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    const color = match[1] === "danger" ? "var(--status-danger)" : "var(--status-warning-text)";
    parts.push(<span key={match.index} style={{ color, fontWeight: "var(--weight-medium)" }}>{match[2]}</span>);
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

interface DraftItem { code: string; sektion: string }
interface DraftDiagnose { nandaCode: string; titel: string }

interface Props {
  patientName: string;
  onClose: () => void;
  onComplete: (drafts: { items: DraftItem[]; diagnosen: DraftDiagnose[]; klvPositionen: KLVVorschlag[] }) => void;
}

export function GespraechAufnahme({ patientName, onClose, onComplete }: Props) {
  const [phase, setPhase] = useState<"kontext" | "aufnahme" | "zusammenfassung">("kontext");
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [visibleSegments, setVisibleSegments] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);

  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);
  const [draftDiagnosen, setDraftDiagnosen] = useState<DraftDiagnose[]>([]);
  const [draftKLV, setDraftKLV] = useState<KLVVorschlag[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [summaryStreamed, setSummaryStreamed] = useState("");

  // Streaming
  useEffect(() => {
    if (!recording || paused) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    DEMO_GESPRAECH.forEach((seg, i) => {
      if (i < visibleSegments) return;
      timers.push(setTimeout(() => {
        setVisibleSegments(prev => Math.max(prev, i + 1));
        if (seg.erkannteItems.length > 0) setDraftItems(prev => [...prev, ...seg.erkannteItems.filter(code => !prev.some(p => p.code === code)).map(code => ({ code, sektion: code[0] }))]);
        if (seg.diagnoseVorschlaege.length > 0) setDraftDiagnosen(prev => [...prev, ...seg.diagnoseVorschlaege.map(d => ({ nandaCode: d.nandaCode, titel: d.titel }))]);
        if (seg.klvVorschlaege.length > 0) setDraftKLV(prev => [...prev, ...seg.klvVorschlaege]);
      }, seg.delay));
    });
    return () => timers.forEach(clearTimeout);
  }, [recording, paused]);

  useEffect(() => { if (!recording || paused) return; const i = setInterval(() => setElapsedMs(p => p + 1000), 1000); return () => clearInterval(i); }, [recording, paused]);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [visibleSegments]);

  const allDone = visibleSegments >= DEMO_GESPRAECH.length;

  useEffect(() => {
    if (allDone && recording) {
      setRecording(false); setPhase("zusammenfassung");
      const totalH = draftKLV.reduce((s, k) => s + k.hProWoche, 0).toFixed(1);
      const text = `Ich habe ${draftItems.length} Items in ${new Set(draftItems.map(i => i.sektion)).size} Sektionen erkannt, ${draftDiagnosen.length} Pflegediagnose-Vorschläge abgeleitet und ${draftKLV.length} KLV-Leistungspositionen vorbereitet (geschätzter Gesamtaufwand ${totalH} Stunden/Woche).`;
      let i = 0;
      const interval = setInterval(() => { i++; setSummaryStreamed(text.slice(0, i)); if (i >= text.length) clearInterval(interval); }, 10);
      return () => clearInterval(interval);
    }
  }, [allDone, recording]);

  const handleStop = () => {
    setRecording(false); setPhase("zusammenfassung");
    const totalH = draftKLV.reduce((s, k) => s + k.hProWoche, 0).toFixed(1);
    const text = `Aus dem Gespräch: ${draftItems.length} Items, ${draftDiagnosen.length} Diagnosen, ${draftKLV.length} KLV-Positionen (${totalH} h/Woche).`;
    let i = 0; const interval = setInterval(() => { i++; setSummaryStreamed(text.slice(0, i)); if (i >= text.length) clearInterval(interval); }, 10);
  };

  const formatTime = (ms: number) => `${String(Math.floor(ms / 60000)).padStart(2, "0")}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, "0")}`;

  // KLV aggregates
  const klvByKat = { a: 0, b: 0, c: 0 };
  for (const k of draftKLV) klvByKat[k.kategorie] = (klvByKat[k.kategorie] || 0) + k.hProWoche;

  const KAT_COLORS = { a: { bg: "var(--status-info-bg)", color: "var(--status-info)", label: "a – Abklärung" }, b: { bg: "var(--status-warning-bg)", color: "var(--status-warning-text)", label: "b – Behandlung" }, c: { bg: "var(--status-success-bg)", color: "var(--status-success-text)", label: "c – Grundpflege" } };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col" style={{ background: "var(--bg-primary)" }}>
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between" style={{ padding: "10px 20px", borderBottom: "var(--border-thin) solid var(--border-default)", background: "var(--bg-elevated)" }}>
        <div className="flex items-center" style={{ gap: 10 }}>
          <div className="shrink-0 flex items-center justify-center" style={{ width: 30, height: 30, borderRadius: "var(--radius-pill)", background: "linear-gradient(135deg, var(--brand-primary), var(--brand-accent))" }}>
            <Sparkles style={{ width: 14, height: 14, color: "var(--text-on-dark)" }} />
          </div>
          <span style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>Gespräch — {patientName}</span>
          {recording && (
            <div className="flex items-center" style={{ gap: 8, marginLeft: 12 }}>
              <div style={{ width: 10, height: 10, borderRadius: "var(--radius-pill)", background: paused ? "var(--status-warning)" : "var(--status-danger)", animation: paused ? "none" : "pulse 1.5s ease-in-out infinite" }} />
              <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
              <span style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: paused ? "var(--status-warning-text)" : "var(--status-danger)", fontVariantNumeric: "tabular-nums" }}>{formatTime(elapsedMs)}</span>
              <span style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>{paused ? "Pausiert" : "Anna hört zu…"}</span>
            </div>
          )}
        </div>
        <div className="flex items-center" style={{ gap: 6 }}>
          {recording && <>
            <button onClick={() => setPaused(!paused)} className="inline-flex items-center cursor-pointer" style={{ gap: 4, padding: "6px 12px", borderRadius: "var(--radius-pill)", background: "var(--bg-secondary)", border: "none", fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", minHeight: 32 }}>
              {paused ? <><Play style={{ width: 12, height: 12 }} /> Weiter</> : <><Pause style={{ width: 12, height: 12 }} /> Pause</>}
            </button>
            <button onClick={handleStop} className="inline-flex items-center cursor-pointer" style={{ gap: 4, padding: "6px 12px", borderRadius: "var(--radius-pill)", background: "var(--status-danger-bg)", border: "none", fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--status-danger)", minHeight: 32 }}>
              <MicOff style={{ width: 12, height: 12 }} /> Stopp
            </button>
          </>}
          <button onClick={onClose} className="flex items-center justify-center cursor-pointer" style={{ width: 32, height: 32, borderRadius: "var(--radius-pill)", background: "transparent", border: "none" }}>
            <X style={{ width: 16, height: 16, color: "var(--text-secondary)" }} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">

        {phase === "kontext" && (
          <div className="flex-1 overflow-y-auto" style={{ padding: 24 }}>
            <div className="mx-auto" style={{ maxWidth: 560 }}>
              <AnnaMsg text={`Wir starten das Erstgespräch für das Onboarding von ${patientName}. Mit wem führst du das Gespräch?`} />
              <div className="flex flex-wrap" style={{ gap: 8, marginTop: 16, marginBottom: 20 }}>
                {["Klientin allein", "Klientin + Tochter", "Klientin + Ehemann"].map(opt => (
                  <button key={opt} onClick={() => setPhase("aufnahme")} className="cursor-pointer" style={{ padding: "10px 18px", borderRadius: "var(--radius-pill)", background: opt === "Klientin + Tochter" ? "var(--brand-primary-light)" : "var(--bg-elevated)", border: opt === "Klientin + Tochter" ? "var(--border-thin) solid var(--brand-primary)" : "var(--border-thin) solid var(--border-default)", color: opt === "Klientin + Tochter" ? "var(--brand-primary)" : "var(--text-primary)", fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", minHeight: 44 }}>{opt}</button>
                ))}
              </div>
              <div style={{ fontSize: "var(--text-small)", color: "var(--text-tertiary)", padding: "8px 12px", background: "var(--bg-secondary)", borderRadius: "var(--radius-card)" }}>Stelle sicher, dass die Einwilligung zur Aufnahme vorliegt.</div>
            </div>
          </div>
        )}

        {phase === "aufnahme" && (
          <div className="flex-1 flex min-h-0">
            {/* Transcript */}
            <div ref={scrollRef} className="flex-1 min-w-0 overflow-y-auto" style={{ padding: "12px 16px", borderRight: "var(--border-thin) solid var(--border-default)" }}>
              {!recording && visibleSegments === 0 && (
                <div style={{ textAlign: "center", padding: 40 }}>
                  <button onClick={() => setRecording(true)} className="inline-flex items-center cursor-pointer" style={{ gap: 8, padding: "14px 28px", borderRadius: "var(--radius-pill)", background: "var(--brand-primary)", color: "var(--text-on-dark)", fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", border: "none", minHeight: 48 }}>
                    <Mic style={{ width: 18, height: 18 }} /> Aufnahme starten
                  </button>
                </div>
              )}
              <div className="flex flex-col" style={{ gap: 8 }}>
                {DEMO_GESPRAECH.slice(0, visibleSegments).map((seg, i) => (
                  <div key={i} style={{ display: "flex", flexDirection: seg.sprecher === "maria" ? "row-reverse" : "row", gap: 6 }}>
                    <div style={{ maxWidth: "85%", padding: "8px 14px", borderRadius: 12, background: seg.sprecher === "maria" ? "var(--brand-primary)" : seg.sprecher === "tochter" ? "var(--brand-accent-light)" : "var(--bg-secondary)", color: seg.sprecher === "maria" ? "var(--text-on-dark)" : "var(--text-primary)", fontSize: "var(--text-small)", lineHeight: 1.5 }}>
                      <div style={{ fontSize: 10, fontWeight: "var(--weight-medium)", marginBottom: 1, opacity: 0.6 }}>{seg.sprecher === "maria" ? "Maria" : seg.sprecher === "tochter" ? "Tochter" : "Klientin"}</div>
                      {seg.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3 Draft columns */}
            <div className="hidden lg:flex flex-col shrink-0" style={{ width: 340, overflow: "hidden" }}>
              {/* BA Draft */}
              <div className="overflow-y-auto" style={{ flex: 1, padding: "8px 12px", borderBottom: "var(--border-thin) solid var(--border-default)" }}>
                <div className="flex items-center" style={{ gap: 6, marginBottom: 6 }}>
                  <ClipboardList style={{ width: 13, height: 13, color: "var(--brand-primary)" }} />
                  <span style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>InterRAI</span>
                  <span style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", marginLeft: "auto" }}>{draftItems.length} Items</span>
                </div>
                {draftItems.slice(-6).map(item => (
                  <div key={item.code} style={{ padding: "3px 8px", background: "var(--status-success-bg)", borderRadius: "var(--radius-card)", fontSize: 10, color: "var(--status-success-text)", marginBottom: 2 }}>
                    <b>{item.code}</b> Sektion {item.sektion}
                  </div>
                ))}
              </div>

              {/* PP Draft */}
              <div className="overflow-y-auto" style={{ flex: 1, padding: "8px 12px", borderBottom: "var(--border-thin) solid var(--border-default)" }}>
                <div className="flex items-center" style={{ gap: 6, marginBottom: 6 }}>
                  <Target style={{ width: 13, height: 13, color: "var(--brand-primary)" }} />
                  <span style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)" }}>Pflegeplanung</span>
                  <span style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", marginLeft: "auto" }}>{draftDiagnosen.length}</span>
                </div>
                {draftDiagnosen.map((d, i) => (
                  <div key={i} style={{ padding: "4px 8px", background: "var(--brand-primary-light)", borderRadius: "var(--radius-card)", marginBottom: 3, fontSize: 10 }}>
                    <b style={{ color: "var(--brand-primary)" }}>{d.nandaCode}</b> {d.titel}
                  </div>
                ))}
              </div>

              {/* KLV Draft — with catalog details */}
              <div className="overflow-y-auto" style={{ flex: 1.5, padding: "8px 12px" }}>
                <div className="flex items-center" style={{ gap: 6, marginBottom: 6 }}>
                  <FileText style={{ width: 13, height: 13, color: "var(--brand-primary)" }} />
                  <span style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)" }}>KLV</span>
                  <span style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", marginLeft: "auto" }}>{draftKLV.length} Pos.</span>
                </div>
                {draftKLV.map((k, i) => {
                  const kc = KAT_COLORS[k.kategorie];
                  return (
                    <div key={i} style={{ padding: "5px 8px", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)", marginBottom: 3, fontSize: 10 }}>
                      <div className="flex items-center" style={{ gap: 4 }}>
                        <span style={{ padding: "0px 4px", borderRadius: 4, fontSize: 9, fontWeight: "var(--weight-semibold)", background: kc.bg, color: kc.color }}>{k.kategorie}</span>
                        <span style={{ fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>{k.klvNummer}</span>
                        <span style={{ color: "var(--text-secondary)" }}>{k.zeitMin}′</span>
                      </div>
                      <div style={{ color: "var(--text-primary)", marginTop: 1 }}>{k.bezeichnung}</div>
                      <div style={{ color: "var(--text-tertiary)", marginTop: 1 }}>{k.haeufigkeit} · {k.hProWoche.toFixed(2)} h/Wo.</div>
                    </div>
                  );
                })}
                {draftKLV.length > 0 && (
                  <div style={{ padding: "4px 8px", marginTop: 4, fontSize: 10, color: "var(--text-secondary)", borderTop: "var(--border-thin) solid var(--border-default)" }}>
                    Kat. a: {klvByKat.a.toFixed(1)}h · b: {klvByKat.b.toFixed(1)}h · c: {klvByKat.c.toFixed(1)}h
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {phase === "zusammenfassung" && (
          <div className="flex-1 overflow-y-auto" style={{ padding: 24 }}>
            <div className="mx-auto" style={{ maxWidth: 600 }}>
              <AnnaMsg text={summaryStreamed} />

              <div className="flex flex-col" style={{ gap: 8, marginTop: 20, marginBottom: 20 }}>
                <SummaryCard icon={ClipboardList} label="InterRAI" detail={`${draftItems.length} Items in ${new Set(draftItems.map(i => i.sektion)).size} Sektionen`} />
                <SummaryCard icon={Target} label="Pflegeplanung" detail={`${draftDiagnosen.length} Diagnose-Vorschläge`} />
                <div style={{ padding: "14px 18px", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)" }}>
                  <div className="flex items-center" style={{ gap: 8, marginBottom: 8 }}>
                    <FileText style={{ width: 16, height: 16, color: "var(--brand-primary)" }} />
                    <span style={{ fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>KLV-Verordnung</span>
                    <span style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", marginLeft: "auto" }}>{draftKLV.length} Positionen · {draftKLV.reduce((s, k) => s + k.hProWoche, 0).toFixed(1)} h/Wo.</span>
                  </div>
                  <div className="flex" style={{ gap: 8, fontSize: "var(--text-meta)" }}>
                    {(["a", "b", "c"] as const).map(k => (
                      <span key={k} className="inline-flex items-center" style={{ gap: 3, padding: "2px 8px", borderRadius: "var(--radius-pill)", background: KAT_COLORS[k].bg, color: KAT_COLORS[k].color, fontWeight: "var(--weight-medium)" }}>
                        {k}: {klvByKat[k].toFixed(1)}h
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap" style={{ gap: 8 }}>
                <button onClick={() => onComplete({ items: draftItems, diagnosen: draftDiagnosen, klvPositionen: draftKLV })} className="inline-flex items-center cursor-pointer" style={{ gap: 6, padding: "12px 20px", borderRadius: "var(--radius-pill)", background: "var(--brand-primary)", color: "var(--text-on-dark)", fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", border: "none" }}>
                  Zur Übersicht <ChevronRight style={{ width: 14, height: 14 }} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AnnaMsg({ text }: { text: string }) {
  return (
    <div className="flex" style={{ gap: 10, marginBottom: 12 }}>
      <div className="shrink-0 flex items-center justify-center" style={{ width: 28, height: 28, marginTop: 2, borderRadius: "var(--radius-pill)", background: "linear-gradient(135deg, var(--brand-primary), var(--brand-accent))" }}>
        <Sparkles style={{ width: 13, height: 13, color: "var(--text-on-dark)" }} />
      </div>
      <div style={{ padding: "12px 16px", borderRadius: "12px 12px 12px 4px", background: "var(--bg-secondary)", fontSize: "var(--text-body)", color: "var(--text-primary)", lineHeight: 1.6, maxWidth: "90%" }}>
        {text}
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, detail }: { icon: typeof ClipboardList; label: string; detail: string }) {
  return (
    <div style={{ padding: "14px 18px", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)" }}>
      <div className="flex items-center" style={{ gap: 8 }}>
        <Icon style={{ width: 16, height: 16, color: "var(--brand-primary)" }} />
        <span style={{ fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>{label}</span>
        <span style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", marginLeft: "auto" }}>{detail}</span>
      </div>
    </div>
  );
}
