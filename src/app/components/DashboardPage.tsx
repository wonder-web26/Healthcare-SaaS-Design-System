import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { Sparkles, ChevronRight, ArrowUp, Copy, RefreshCw, ThumbsUp, ThumbsDown, Check } from "lucide-react";
import { processQuery, generateDailySummary, generateFollowUpChips, type AnnaMessage, type AnnaCard } from "../anna/engine";

const MOCK_HOUR = 8;

function getGreeting(): string {
  if (MOCK_HOUR < 11) return "Guten Morgen";
  if (MOCK_HOUR < 17) return "Guten Tag";
  return "Guten Abend";
}

/* ── Streaming text hook ── */
function useStreamingText(text: string, active: boolean, speed = 25) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!active) { setDisplayed(text); setDone(true); return; }
    setDisplayed("");
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(interval); setDone(true); }
    }, speed);
    return () => clearInterval(interval);
  }, [text, active, speed]);
  return { displayed, done };
}

export function DashboardPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<AnnaMessage[]>([]);
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState<"loading" | "streaming" | "cards" | "done">("loading");
  const [visibleCards, setVisibleCards] = useState(0);
  const [chips, setChips] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<Record<number, "up" | "down" | null>>({});
  const [copyToast, setCopyToast] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const firstMsg = messages[0];
  const streamingText = useStreamingText(firstMsg?.text || "", phase === "streaming");

  // Boot sequence
  useEffect(() => {
    const t1 = setTimeout(() => {
      const msg = generateDailySummary();
      setMessages([msg]);
      setPhase("streaming");
    }, 1200);
    return () => clearTimeout(t1);
  }, []);

  // After streaming done → show cards one by one
  const cardTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (phase !== "streaming" || !streamingText.done) return;

    const cardCount = firstMsg?.cards?.length || 0;
    if (cardCount === 0) {
      setPhase("done");
      setChips(firstMsg?.chips || []);
      return;
    }

    // Switch phase and start card animation in a single tick
    setPhase("cards");
    let i = 0;
    cardTimerRef.current = window.setInterval(() => {
      i++;
      setVisibleCards(i);
      if (i >= cardCount) {
        if (cardTimerRef.current) clearInterval(cardTimerRef.current);
        cardTimerRef.current = null;
        setTimeout(() => {
          setPhase("done");
          setChips(firstMsg?.chips || []);
        }, 300);
      }
    }, 150);

    // Don't return cleanup here — the interval is managed via ref
  }, [streamingText.done]); // Only depend on streaming completion, NOT on phase

  // Cleanup card timer on unmount
  useEffect(() => {
    return () => { if (cardTimerRef.current) clearInterval(cardTimerRef.current); };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, phase, visibleCards]);

  const handleSend = useCallback((text?: string) => {
    const q = (text || input).trim();
    if (!q || phase === "loading" || phase === "streaming") return;
    const userMsg: AnnaMessage = { role: "user", text: q };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setChips([]);

    // Simulate response
    const loadingTimer = setTimeout(() => {
      const annaMsg = processQuery(q, "/");
      setMessages(prev => [...prev, annaMsg]);
      setChips(generateFollowUpChips(annaMsg.text));
      if (annaMsg.navAction) setTimeout(() => navigate(annaMsg.navAction!), 400);
    }, 800);
    return () => clearTimeout(loadingTimer);
  }, [input, navigate, phase]);

  const handleCopy = (idx: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopyToast(idx);
    setTimeout(() => setCopyToast(null), 1500);
  };

  const handleRegenerate = () => {
    setMessages([]);
    setPhase("loading");
    setVisibleCards(0);
    setChips([]);
    setFeedback({});
    setTimeout(() => {
      const msg = generateDailySummary();
      setMessages([msg]);
      setPhase("streaming");
    }, 1000);
  };

  const handleFeedback = (idx: number, type: "up" | "down") => {
    setFeedback(prev => ({ ...prev, [idx]: prev[idx] === type ? null : type }));
  };

  const greeting = getGreeting();
  const isLoading = phase === "loading";
  const isStreaming = phase === "streaming" || phase === "cards";
  const lastMsgIsUser = messages.length > 0 && messages[messages.length - 1]?.role === "user";

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--bg-primary)" }}>
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full" style={{ maxWidth: 720, padding: "0 var(--space-4)" }}>
          {/* Greeting */}
          <div className="text-center" style={{ paddingTop: 40 }}>
            <div style={{ fontSize: "var(--text-small)", color: "var(--text-tertiary)", marginBottom: "var(--space-2)" }}>
              Dienstag, 3. März 2026
            </div>
            <h1 style={{ fontSize: 36, fontWeight: "var(--weight-medium)", color: "var(--text-primary)", letterSpacing: "var(--tracking-tight)", lineHeight: 1.2 }}>
              {greeting}, Maria
            </h1>
          </div>

          {/* Messages */}
          <div style={{ marginTop: 32, paddingBottom: 24 }} className="flex flex-col">
            {/* Initial loading */}
            {isLoading && messages.length === 0 && (
              <div className="flex flex-col items-center" style={{ gap: "var(--space-3)" }}>
                <LoadingDots color="var(--brand-primary)" />
                <span style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>Anna analysiert deinen Tag…</span>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} style={{ marginTop: i > 0 ? "var(--space-6)" : 0 }}>
                {msg.role === "anna" ? (
                  <div className="flex" style={{ gap: "var(--space-3)" }}>
                    <AnnaAvatar />
                    <div className="flex-1 min-w-0" style={{ paddingTop: 4 }}>
                      <div style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", marginBottom: "var(--space-2)" }}>
                        Anna
                      </div>

                      {/* Text — streaming for first message, instant for others */}
                      <div style={{ fontSize: 15, color: "var(--text-primary)", lineHeight: 1.6 }} className="whitespace-pre-wrap">
                        {i === 0 && (phase === "streaming" || phase === "cards") ? streamingText.displayed : msg.text}
                      </div>

                      {/* Task cards */}
                      {msg.cards && msg.cards.length > 0 && (phase !== "streaming" || i > 0) && (
                        <div style={{ marginTop: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                          {msg.cards.slice(0, i === 0 ? visibleCards : msg.cards.length).map(card => (
                            <TaskCard key={card.id} card={card} onClick={() => navigate(card.path)} />
                          ))}
                        </div>
                      )}

                      {/* Closing line */}
                      {msg.closing && phase === "done" && i === 0 && (
                        <div style={{ marginTop: "var(--space-4)", fontSize: "var(--text-body)", color: "var(--text-secondary)" }}>
                          {msg.closing}
                        </div>
                      )}

                      {/* Footer actions — only after streaming is done */}
                      {(phase === "done" || i > 0) && msg.role === "anna" && (
                        <div className="flex items-center" style={{ gap: "var(--space-1)", marginTop: "var(--space-2)" }}>
                          <ActionIcon
                            icon={copyToast === i ? Check : Copy}
                            tooltip="Kopieren"
                            activeColor={copyToast === i ? "var(--status-success)" : undefined}
                            onClick={() => handleCopy(i, msg.text)}
                          />
                          {i === messages.filter(m => m.role === "anna").length - 1 && (
                            <ActionIcon icon={RefreshCw} tooltip="Neu generieren" onClick={i === 0 ? handleRegenerate : undefined} />
                          )}
                          <ActionIcon
                            icon={ThumbsUp}
                            tooltip="Hilfreich"
                            activeColor={feedback[i] === "up" ? "var(--status-success)" : undefined}
                            disabled={feedback[i] === "down"}
                            onClick={() => handleFeedback(i, "up")}
                          />
                          <ActionIcon
                            icon={ThumbsDown}
                            tooltip="Nicht hilfreich"
                            activeColor={feedback[i] === "down" ? "var(--status-danger)" : undefined}
                            disabled={feedback[i] === "up"}
                            onClick={() => handleFeedback(i, "down")}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end">
                    <div style={{ maxWidth: "70%", padding: "10px 16px", borderRadius: 18, background: "var(--bg-secondary)", color: "var(--text-primary)", fontSize: "var(--text-body)", lineHeight: 1.5 }} className="whitespace-pre-wrap">
                      {msg.text}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Loading after user message */}
            {lastMsgIsUser && (
              <div className="flex" style={{ gap: "var(--space-3)", marginTop: "var(--space-6)" }}>
                <AnnaAvatar />
                <div style={{ paddingTop: 4 }}>
                  <div style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", marginBottom: "var(--space-1)" }}>Anna</div>
                  <LoadingDots />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky bottom */}
      <div className="shrink-0" style={{ background: "var(--bg-primary)", borderTop: "var(--border-thin) solid var(--border-default)" }}>
        <div className="mx-auto w-full" style={{ maxWidth: 720, padding: "var(--space-3) var(--space-4) var(--space-4)" }}>
          {/* Chips — left-aligned to match Anna's text */}
          {chips.length > 0 && (
            <div className="flex flex-wrap" style={{ gap: "var(--space-2)", marginBottom: "var(--space-3)", justifyContent: "flex-start" }}>
              {chips.slice(0, 3).map(s => (
                <button key={s} onClick={() => handleSend(s)} disabled={isLoading || isStreaming} className="cursor-pointer transition-colors disabled:opacity-50"
                  style={{ padding: "6px 14px", borderRadius: "var(--radius-pill)", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", fontSize: "var(--text-small)", color: "var(--text-primary)", fontWeight: "var(--weight-regular)" }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"} onMouseLeave={e => e.currentTarget.style.background = "var(--bg-elevated)"}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="relative flex items-end" style={{ gap: "var(--space-2)" }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); handleSend(); }
                if (e.key === "Escape") setInput("");
              }}
              disabled={isLoading || isStreaming}
              placeholder={isLoading || isStreaming ? "Anna antwortet…" : "Frag Anna oder beschreibe, was du brauchst…"}
              rows={1}
              className="flex-1 resize-none outline-none transition-all"
              style={{ padding: "12px 16px", borderRadius: 24, background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", fontSize: "var(--text-body)", color: "var(--text-primary)", lineHeight: 1.5, minHeight: 48, maxHeight: 120, boxShadow: "var(--shadow-overlay)" }}
              onFocus={e => e.currentTarget.style.borderColor = "var(--brand-primary)"}
              onBlur={e => e.currentTarget.style.borderColor = "var(--border-default)"}
            />
            {(() => {
              const hasText = input.trim().length > 0;
              const isDisabled = !hasText || isLoading || isStreaming;
              return (
                <button
                  onClick={() => handleSend()}
                  disabled={isDisabled}
                  className="shrink-0 flex items-center justify-center transition-all"
                  style={{
                    width: 36, height: 36,
                    borderRadius: "var(--radius-pill)",
                    background: hasText ? "var(--brand-primary)" : "var(--bg-secondary)",
                    color: hasText ? "var(--text-on-dark)" : "var(--text-tertiary)",
                    border: "none",
                    cursor: isDisabled ? "not-allowed" : "pointer",
                    transform: "scale(1)",
                  }}
                  onMouseDown={e => { if (!isDisabled) e.currentTarget.style.transform = "scale(0.95)"; }}
                  onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
                  onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                  onMouseEnter={e => { if (hasText && !isDisabled) e.currentTarget.style.background = "var(--brand-primary-dark)"; }}
                  onMouseOut={e => { e.currentTarget.style.background = hasText ? "var(--brand-primary)" : "var(--bg-secondary)"; }}
                >
                  <ArrowUp style={{ width: 18, height: 18 }} />
                </button>
              );
            })()}
          </div>

          <div className="text-center" style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", marginTop: "var(--space-2)" }}>
            Anna kann lesen und empfehlen, aber nichts ändern. Verbindliche Aktionen passieren in den jeweiligen Bereichen.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function AnnaAvatar() {
  return (
    <div className="shrink-0 flex items-center justify-center" style={{ width: 32, height: 32, borderRadius: "var(--radius-pill)", background: "linear-gradient(135deg, var(--brand-primary), var(--brand-accent))" }}>
      <Sparkles style={{ width: 14, height: 14, color: "var(--text-on-dark)" }} />
    </div>
  );
}

function LoadingDots({ color = "var(--text-tertiary)" }: { color?: string }) {
  return (
    <div className="flex items-center" style={{ gap: 4, padding: "8px 0" }}>
      {[0, 1, 2].map(i => (
        <div key={i} className="rounded-full" style={{ width: 6, height: 6, background: color, animation: `anna-pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
      ))}
      <style>{`@keyframes anna-pulse { 0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1); } }`}</style>
    </div>
  );
}

function TaskCard({ card, onClick }: { card: AnnaCard; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center text-left cursor-pointer transition-colors"
      style={{ gap: "var(--space-3)", padding: "var(--space-3)", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)" }}
      onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"} onMouseLeave={e => e.currentTarget.style.background = "var(--bg-elevated)"}>
      <div className="shrink-0 flex items-center justify-center" style={{ width: 32, height: 32, borderRadius: "var(--radius-avatar)", background: "var(--bg-secondary)", color: "var(--text-secondary)", fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)" }}>
        {card.title.split(",")[0]?.substring(0, 2).toUpperCase() || "??"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="truncate" style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>{card.title}</div>
        <div className="truncate" style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", marginTop: 1 }}>{card.subtitle}</div>
      </div>
      <ChevronRight className="shrink-0" style={{ width: 16, height: 16, color: "var(--text-tertiary)" }} />
    </button>
  );
}

function ActionIcon({ icon: Icon, tooltip, onClick, activeColor, disabled }: {
  icon: React.ElementType;
  tooltip: string;
  onClick?: () => void;
  activeColor?: string;
  disabled?: boolean;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const timerRef = useRef<number | null>(null);

  const handleEnter = () => { timerRef.current = window.setTimeout(() => setShowTooltip(true), 500); };
  const handleLeave = () => { if (timerRef.current) clearTimeout(timerRef.current); setShowTooltip(false); };

  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      className="relative flex items-center justify-center transition-colors"
      style={{
        width: 32, height: 32,
        borderRadius: "var(--radius-pill)",
        background: "transparent",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
      }}
      onMouseOver={e => { if (!disabled) e.currentTarget.style.background = "var(--bg-secondary)"; }}
      onMouseOut={e => e.currentTarget.style.background = "transparent"}
    >
      <Icon style={{ width: 16, height: 16, color: activeColor || "var(--text-tertiary)" }} />
      {showTooltip && (
        <span
          className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none z-10"
          style={{
            fontSize: "var(--text-meta)",
            color: "var(--text-primary)",
            background: "var(--bg-elevated)",
            border: "var(--border-thin) solid var(--border-default)",
            borderRadius: "var(--radius-card)",
            padding: "6px 10px",
            boxShadow: "var(--shadow-overlay)",
          }}
        >
          {tooltip}
        </span>
      )}
    </button>
  );
}
