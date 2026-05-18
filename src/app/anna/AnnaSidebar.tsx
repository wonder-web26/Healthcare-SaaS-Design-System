import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router";
import { X, Send, Sparkles, RotateCcw, ChevronRight, AlertTriangle } from "lucide-react";
import { processQuery, type AnnaCard } from "./engine";
import { detectContext, generateContextResult, type AnnaQuickReply } from "./sidebar-context";

/* ══════════════════════════════════════════
   MARKER PARSING (shared with other Anna components)
   ══════════════════════════════════════════ */

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

/* ══════════════════════════════════════════
   TYPES
   ══════════════════════════════════════════ */

interface AnnaSidebarProps {
  open: boolean;
  onClose: () => void;
}

interface ChatMessage {
  role: "anna" | "user";
  text: string;
  cards?: AnnaCard[];
  navAction?: string;
  chips?: string[];
}

/* ══════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════ */

export function AnnaSidebar({ open, onClose }: AnnaSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Context detection
  const annaCtx = detectContext(location.pathname, searchParams);
  const ctxResult = generateContextResult(annaCtx);
  const ctxKey = JSON.stringify(annaCtx);

  // State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [quickReplies, setQuickReplies] = useState<AnnaQuickReply[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState("");
  const [showContextSwitch, setShowContextSwitch] = useState(false);
  const [pendingCtxKey, setPendingCtxKey] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const prevCtxKey = useRef(ctxKey);

  // Initialize greeting on first open or context change
  useEffect(() => {
    if (!open) return;

    if (prevCtxKey.current !== ctxKey) {
      const hasSubstantialConversation = messages.filter(m => m.role === "user").length >= 1;
      if (hasSubstantialConversation) {
        setPendingCtxKey(ctxKey);
        setShowContextSwitch(true);
        return;
      }
      // Seamless switch
      prevCtxKey.current = ctxKey;
      initGreeting();
    } else if (messages.length === 0) {
      initGreeting();
    }
  }, [open, ctxKey]);

  function initGreeting() {
    // Check cache
    const cacheId = `anna_sidebar_${ctxKey}`;
    const cached = sessionStorage.getItem(cacheId);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setMessages([{ role: "anna", text: parsed.greeting }]);
        setQuickReplies(parsed.quickReplies);
        return;
      } catch {}
    }

    // Stream the greeting
    setMessages([]);
    setQuickReplies([]);
    setStreaming(true);
    setStreamedText("");

    const fullText = ctxResult.greeting;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setStreamedText(fullText.slice(0, i));
      if (i >= fullText.length) {
        clearInterval(interval);
        setStreaming(false);
        setMessages([{ role: "anna", text: fullText }]);
        setStreamedText("");
        setQuickReplies(ctxResult.quickReplies);
        sessionStorage.setItem(`anna_sidebar_${ctxKey}`, JSON.stringify({ greeting: fullText, quickReplies: ctxResult.quickReplies }));
      }
    }, 14);

    return () => clearInterval(interval);
  }

  // Focus input on open
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streamedText]);

  const handleSend = useCallback((text?: string) => {
    const q = (text || input).trim();
    if (!q) return;
    const userMsg: ChatMessage = { role: "user", text: q };
    const annaMsg = processQuery(q, location.pathname);
    setMessages(prev => [...prev, userMsg, annaMsg]);
    setInput("");
    setQuickReplies([]);
    if (annaMsg.navAction) setTimeout(() => navigate(annaMsg.navAction!), 300);
  }, [input, location.pathname, navigate]);

  const handleReset = () => {
    sessionStorage.removeItem(`anna_sidebar_${ctxKey}`);
    setMessages([]);
    setQuickReplies([]);
    setInput("");
    prevCtxKey.current = ctxKey;
    setTimeout(() => initGreeting(), 50);
  };

  const handleContextSwitchConfirm = () => {
    prevCtxKey.current = pendingCtxKey || ctxKey;
    setShowContextSwitch(false);
    setPendingCtxKey(null);
    initGreeting();
  };

  const handleContextSwitchCancel = () => {
    setShowContextSwitch(false);
    setPendingCtxKey(null);
  };

  if (!open) return null;

  const showInitialQuickReplies = messages.length <= 1 && !streaming && quickReplies.length > 0;

  return (
    <>
      {/* Mobile backdrop */}
      <div className="fixed inset-0 z-50 lg:hidden" style={{ background: "rgba(19,19,20,0.2)", backdropFilter: "blur(1px)" }} onClick={onClose} />

      {/* Sidebar */}
      <div className="fixed top-0 right-0 bottom-0 z-50 flex flex-col" style={{
        width: 420, maxWidth: "100vw",
        background: "var(--bg-elevated)",
        borderLeft: "var(--border-thin) solid var(--border-default)",
        boxShadow: "-4px 0 12px rgba(0,0,0,0.04)",
      }}>
        {/* Header */}
        <div className="shrink-0 flex items-center" style={{ padding: "20px 24px", borderBottom: "var(--border-thin) solid var(--border-default)", gap: 12 }}>
          <div className="shrink-0 flex items-center justify-center" style={{
            width: 40, height: 40, borderRadius: "var(--radius-pill)",
            background: "linear-gradient(135deg, var(--brand-primary), var(--brand-accent))",
          }}>
            <Sparkles style={{ width: 18, height: 18, color: "var(--text-on-dark)" }} />
          </div>
          <div className="flex-1 min-w-0">
            <div style={{ fontSize: "var(--text-h3)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>Anna</div>
            <div className="truncate" style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>
              AI-Assistentin · {ctxResult.contextLabel}
            </div>
          </div>
          <button onClick={handleReset} title="Konversation neu starten"
            className="flex items-center justify-center cursor-pointer transition-colors"
            style={{ width: 28, height: 28, borderRadius: "var(--radius-pill)", background: "transparent", border: "none" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <RotateCcw style={{ width: 14, height: 14, color: "var(--text-secondary)" }} />
          </button>
          <button onClick={onClose}
            className="flex items-center justify-center cursor-pointer transition-colors"
            style={{ width: 28, height: 28, borderRadius: "var(--radius-pill)", background: "transparent", border: "none" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <X style={{ width: 16, height: 16, color: "var(--text-secondary)" }} />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto flex flex-col" style={{ padding: "20px 24px", gap: 16 }}>
          {messages.map((msg, i) => (
            <div key={i}>
              <div className="flex" style={{ justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{ maxWidth: msg.role === "user" ? "80%" : "90%", display: "flex", gap: 10, alignItems: "flex-start" }}>
                  {msg.role === "anna" && i === 0 && (
                    <div className="shrink-0 flex items-center justify-center" style={{
                      width: 24, height: 24, marginTop: 2, borderRadius: "var(--radius-pill)",
                      background: "linear-gradient(135deg, var(--brand-primary), var(--brand-accent))",
                    }}>
                      <Sparkles style={{ width: 11, height: 11, color: "var(--text-on-dark)" }} />
                    </div>
                  )}
                  <div style={{
                    padding: "12px 16px",
                    borderRadius: msg.role === "user" ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
                    background: msg.role === "user" ? "var(--brand-primary)" : "var(--bg-secondary)",
                    color: msg.role === "user" ? "var(--text-on-dark)" : "var(--text-primary)",
                    fontSize: "var(--text-body)", lineHeight: 1.6,
                  }}>
                    <div style={{ whiteSpace: "pre-wrap" }}>
                      {msg.role === "anna" ? parseMarkers(msg.text) : msg.text}
                    </div>
                    {msg.cards && msg.cards.length > 0 && (
                      <div className="flex flex-col" style={{ gap: 6, marginTop: 10 }}>
                        {msg.cards.map(card => (
                          <button key={card.id} onClick={() => navigate(card.path)}
                            className="w-full flex items-center cursor-pointer transition-colors"
                            style={{
                              gap: 10, padding: "8px 10px", borderRadius: "var(--radius-card)",
                              background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)",
                              textAlign: "left",
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = "var(--bg-primary)"} onMouseLeave={e => e.currentTarget.style.background = "var(--bg-elevated)"}>
                            <div className="shrink-0 flex items-center justify-center" style={{ width: 28, height: 28, borderRadius: "var(--radius-card)", background: "var(--brand-primary-light)" }}>
                              <span style={{ fontSize: 9, fontWeight: "var(--weight-semibold)", color: "var(--brand-primary)" }}>
                                {card.title.split(",")[0]?.substring(0, 2).toUpperCase() || "??"}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="truncate" style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>{card.title}</div>
                              <div className="truncate" style={{ fontSize: "var(--text-micro)", color: "var(--text-secondary)" }}>{card.subtitle}</div>
                            </div>
                            <ChevronRight style={{ width: 12, height: 12, color: "var(--text-tertiary)", flexShrink: 0 }} />
                          </button>
                        ))}
                      </div>
                    )}
                    {msg.navAction && msg.role === "anna" && (
                      <button onClick={() => navigate(msg.navAction!)}
                        className="inline-flex items-center cursor-pointer"
                        style={{ gap: 4, marginTop: 8, fontSize: "var(--text-small)", color: "var(--brand-primary)", fontWeight: "var(--weight-medium)", background: "transparent", border: "none" }}>
                        Hierhin navigieren <ChevronRight style={{ width: 12, height: 12 }} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Streaming indicator */}
          {streaming && (
            <div className="flex" style={{ gap: 10, alignItems: "flex-start" }}>
              {messages.length === 0 && (
                <div className="shrink-0 flex items-center justify-center" style={{
                  width: 24, height: 24, marginTop: 2, borderRadius: "var(--radius-pill)",
                  background: "linear-gradient(135deg, var(--brand-primary), var(--brand-accent))",
                }}>
                  <Sparkles style={{ width: 11, height: 11, color: "var(--text-on-dark)" }} />
                </div>
              )}
              <div style={{
                padding: "12px 16px", borderRadius: "12px 12px 12px 4px",
                background: "var(--bg-secondary)", fontSize: "var(--text-body)",
                color: "var(--text-primary)", lineHeight: 1.6, minHeight: 20,
              }}>
                {streamedText ? parseMarkers(streamedText) : (
                  <div className="flex items-center" style={{ gap: 4 }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{ width: 5, height: 5, borderRadius: "var(--radius-pill)", background: "var(--brand-primary)", animation: `anna-dots 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                    ))}
                    <style>{`@keyframes anna-dots { 0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1); } }`}</style>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick replies */}
          {showInitialQuickReplies && (
            <div className="flex flex-wrap" style={{ gap: 8, paddingTop: 4 }}>
              {quickReplies.map(qr => (
                <button key={qr.id} onClick={() => handleSend(qr.prompt)}
                  className="cursor-pointer transition-colors"
                  style={{
                    padding: "6px 14px", borderRadius: "var(--radius-pill)",
                    background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)",
                    fontSize: 13, color: "var(--text-primary)",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"} onMouseLeave={e => e.currentTarget.style.background = "var(--bg-elevated)"}>
                  {qr.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="shrink-0" style={{ padding: "16px 24px", borderTop: "var(--border-thin) solid var(--border-default)" }}>
          <div className="flex items-end" style={{ gap: 10, background: "var(--bg-secondary)", borderRadius: "var(--radius-card)", padding: "10px 14px" }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Frag mich etwas…"
              rows={1}
              style={{
                flex: 1, background: "transparent", border: "none", outline: "none", resize: "none",
                fontSize: "var(--text-body)", color: "var(--text-primary)", fontFamily: "inherit",
                maxHeight: 80, lineHeight: 1.5,
              }}
            />
            <button onClick={() => handleSend()} disabled={!input.trim()}
              className="shrink-0 flex items-center justify-center cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ width: 32, height: 32, borderRadius: 8, background: "var(--brand-primary)", border: "none" }}>
              <Send style={{ width: 14, height: 14, color: "var(--text-on-dark)" }} />
            </button>
          </div>
          <div style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", textAlign: "center", paddingTop: 8 }}>
            Anna kann lesen, aber nichts ändern · ⌘J
          </div>
        </div>
      </div>

      {/* Context switch confirmation modal */}
      {showContextSwitch && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ background: "rgba(19,19,20,0.5)" }}>
          <div style={{
            background: "var(--bg-elevated)", borderRadius: "var(--radius-card)",
            boxShadow: "var(--shadow-overlay)", maxWidth: 400, width: "90%", padding: "24px",
          }}>
            <div className="flex items-center" style={{ gap: 8, marginBottom: 12 }}>
              <AlertTriangle style={{ width: 18, height: 18, color: "var(--status-warning)" }} />
              <span style={{ fontSize: "var(--text-h3)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>Kontext wechseln?</span>
            </div>
            <p style={{ fontSize: "var(--text-body)", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 20 }}>
              Du hast eine laufende Konversation mit Anna. Beim Wechsel wird der aktuelle Dialog verworfen.
            </p>
            <div className="flex items-center justify-end" style={{ gap: "var(--space-2)" }}>
              <button onClick={handleContextSwitchCancel}
                className="cursor-pointer" style={{ padding: "8px 18px", borderRadius: "var(--radius-pill)", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>
                Dialog behalten
              </button>
              <button onClick={handleContextSwitchConfirm}
                className="cursor-pointer" style={{ padding: "9px 18px", borderRadius: "var(--radius-pill)", background: "var(--brand-primary)", border: "none", fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-on-dark)" }}>
                Kontext wechseln
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
