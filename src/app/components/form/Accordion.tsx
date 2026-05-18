import { useState, createContext, useContext, type ReactNode, type ElementType } from "react";
import { ChevronDown, Check } from "lucide-react";

/* ── Context ── */
interface AccordionCtx { openItems: Set<string>; toggle: (id: string) => void }
const Ctx = createContext<AccordionCtx>({ openItems: new Set(), toggle: () => {} });

/* ── Accordion container ── */
export function Accordion({ defaultValue = [], children, openItems: controlledOpen, onToggle }: {
  defaultValue?: string[];
  children: ReactNode;
  openItems?: Set<string>;
  onToggle?: (id: string) => void;
}) {
  const [internal, setInternal] = useState<Set<string>>(new Set(defaultValue));
  const openItems = controlledOpen ?? internal;
  const toggle = onToggle ?? ((id: string) => setInternal(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; }));

  return (
    <Ctx.Provider value={{ openItems, toggle }}>
      <div style={{ background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)", overflow: "hidden" }}>
        {children}
      </div>
    </Ctx.Provider>
  );
}

/* ── AccordionItem ── */
export function AccordionItem({ value, children }: { value: string; children: ReactNode }) {
  return (
    <div style={{ borderTop: "var(--border-thin) solid var(--border-default)" }} className="first:border-t-0">
      {children}
    </div>
  );
}

/* ── AccordionTrigger ── */
type StatusType = "leer" | "teilweise" | "vollstaendig";

export function AccordionTrigger({ value, icon: Icon, title, subtitle, status = "leer" }: {
  value: string;
  icon: ElementType;
  title: string;
  subtitle?: string;
  status?: StatusType;
}) {
  const { openItems, toggle } = useContext(Ctx);
  const isOpen = openItems.has(value);

  const statusCfg: Record<StatusType, { label: string; bg: string; color: string; dot?: string }> = {
    leer: { label: "Nicht ausgefüllt", bg: "var(--bg-secondary)", color: "var(--text-secondary)" },
    teilweise: { label: "Teilweise", bg: "var(--status-warning-bg)", color: "var(--status-warning-text)", dot: "var(--status-warning)" },
    vollstaendig: { label: "Vollständig", bg: "var(--status-success-bg)", color: "var(--status-success-text)" },
  };
  const s = statusCfg[status];

  return (
    <button
      type="button"
      onClick={() => toggle(value)}
      className="w-full flex items-center text-left cursor-pointer transition-colors"
      style={{ gap: 14, padding: "16px 20px" }}
      onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      <div className="shrink-0 flex items-center justify-center" style={{ width: 32, height: 32, borderRadius: "var(--radius-pill)", background: "var(--bg-secondary)" }}>
        <Icon style={{ width: 18, height: 18, color: "var(--text-secondary)" }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center" style={{ gap: "var(--space-2)" }}>
          <span style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>{title}</span>
          {subtitle && <>
            <span style={{ color: "var(--text-tertiary)" }}>·</span>
            <span style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>{subtitle}</span>
          </>}
        </div>
      </div>
      <span className="shrink-0 inline-flex items-center" style={{ gap: 4, padding: "3px 10px", borderRadius: "var(--radius-pill)", background: s.bg, color: s.color, fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)" }}>
        {status === "vollstaendig" && <Check style={{ width: 12, height: 12 }} />}
        {status === "teilweise" && <span style={{ width: 5, height: 5, borderRadius: "var(--radius-pill)", background: s.dot }} />}
        {s.label}
      </span>
      <ChevronDown className="shrink-0 transition-transform" style={{ width: 16, height: 16, color: "var(--text-tertiary)", transform: isOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }} />
    </button>
  );
}

/* ── AccordionContent ── */
export function AccordionContent({ value, children }: { value: string; children: ReactNode }) {
  const { openItems } = useContext(Ctx);
  if (!openItems.has(value)) return null;
  return (
    <div style={{ padding: "0 20px 20px" }}>
      {children}
    </div>
  );
}
