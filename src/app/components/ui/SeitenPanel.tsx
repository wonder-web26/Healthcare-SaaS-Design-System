/**
 * SeitenPanel — reusable slide-over panel from the right. Vorlage für künftige
 * Panels, kein Einzelstück.
 *
 * Verhalten (verbindlich):
 *  - Esc schliesst.
 *  - Der Fokus kehrt beim Schliessen auf das auslösende Element zurück.
 *  - Solange offen, bleibt der Fokus im Panel gefangen (Tab-Falle).
 *
 * Inhalt (Titelzeile mit Schliessen + beliebiger Body) wird als children
 * übergeben; das Panel selbst ist domänenfrei.
 */
import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

export interface SeitenPanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Panel width in px (default 420). */
  breite?: number;
}

const FOCUSABLE = 'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])';

export function SeitenPanel({ open, onClose, title, children, breite = 420 }: SeitenPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const ausloeserRef = useRef<HTMLElement | null>(null);
  // onClose in einer Ref halten → der Effekt läuft nur bei open-Wechsel, nicht bei jedem Render.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const close = () => onCloseRef.current();
    // Auslösendes Element merken, um den Fokus später zurückzugeben.
    ausloeserRef.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    // Fokus in das Panel setzen (erstes fokussierbares Element, sonst das Panel).
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel)?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); close(); return; }
      if (e.key !== "Tab" || !panel) return;
      // Fokus-Falle: Tab zyklisch innerhalb des Panels halten.
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(el => el.offsetParent !== null);
      if (items.length === 0) { e.preventDefault(); panel.focus(); return; }
      const firstEl = items[0], lastEl = items[items.length - 1];
      const active = document.activeElement as HTMLElement;
      if (e.shiftKey && (active === firstEl || active === panel)) { e.preventDefault(); lastEl.focus(); }
      else if (!e.shiftKey && active === lastEl) { e.preventDefault(); firstEl.focus(); }
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      // Fokus zurück auf das auslösende Element.
      ausloeserRef.current?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex justify-end" role="presentation">
      {/* Backdrop */}
      <div className="absolute inset-0" style={{ background: "color-mix(in srgb, var(--text-primary) 30%, transparent)" }} onClick={onClose} />
      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="relative h-full flex flex-col min-h-0 outline-none"
        style={{ width: "100%", maxWidth: breite, background: "var(--bg-elevated)", borderLeft: "var(--border-thin) solid var(--border-default)", boxShadow: "var(--shadow-overlay)" }}
      >
        <div className="flex items-center justify-between shrink-0" style={{ padding: "14px 20px", borderBottom: "var(--border-thin) solid var(--border-default)" }}>
          <span style={{ fontSize: "var(--text-h3)", fontWeight: "var(--weight-semibold)", color: "var(--text-primary)" }}>{title}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Schliessen"
            className="ui-fokusring flex items-center justify-center cursor-pointer"
            style={{ width: 32, height: 32, borderRadius: "var(--control-radius)", background: "transparent", border: "none", color: "var(--text-secondary)" }}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-secondary)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto min-h-0">{children}</div>
      </div>
    </div>
  );
}
