/**
 * Arbeitsbereich — Single-page workspace for in-progress InterRAI assessment.
 * Progressive Disclosure UI: compact ItemRows expand on demand.
 * Sticky TOC left, expandable sections center, validation mode overlay.
 */
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  Sparkles,
  Mic,
  Check,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  ArrowLeft,
  Activity,
  X,
  Zap,
  AlertTriangle,
} from "lucide-react";
import type { InterRAIItem } from "../../../types/klinische-artefakte";
import { INTERRAI_ITEMS, SEKTION_NAMEN } from "../../../lib/interrai/interrai-items";
import { DEMO_CAPS, DEMO_SCALES } from "../../../lib/mocks/klinische-artefakte-mock";
import { SidebarNav } from "../ui/SidebarNav";
import { SectionAccordion, SektionBadge } from "../ui/SectionAccordion";
import {
  getAntwortText,
  getAntwortKurzLabel,
  shouldExpandByDefault,
  createItemInstance,
} from "../../../lib/interrai/helpers";

/* ══════════════════════════════════════════
   TYPES
   ══════════════════════════════════════════ */

interface SectionSummary {
  id: string;
  name: string;
  items: InterRAIItem[];
  erfasst: number;
  teilweise: number;
  total: number;
  sectionStatus: "erfasst" | "teilweise" | "offen";
  hasAnnaItems: boolean;
}

interface Props {
  assessmentId: string;
  patientName: string;
  typ: string;
  startDatum: string;
  initialItems: InterRAIItem[];
  onboardingId?: string | null;
}

/* ══════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════ */

export function Arbeitsbereich({
  assessmentId,
  patientName,
  typ,
  startDatum,
  initialItems,
  onboardingId,
}: Props) {
  const navigate = useNavigate();

  /* --- State --------------------------------------------------------------- */

  const [items, setItems] = useState<InterRAIItem[]>(() =>
    INTERRAI_ITEMS.map((def) => {
      const existing = initialItems.find((i) => i.code === def.code);
      return existing ? { ...existing } : createItemInstance(def, assessmentId);
    })
  );

  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [showValidationMode, setShowValidationMode] = useState(false);
  const [activeTocId, setActiveTocId] = useState<string | null>(null);
  const [bulkConfirmSection, setBulkConfirmSection] = useState<string | null>(null);
  const [showAuswertung, setShowAuswertung] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  /* --- Derived data -------------------------------------------------------- */

  const sektionen = useMemo(() => Object.entries(SEKTION_NAMEN).map(([code, name]) => ({ code, name })), []);

  const sections = useMemo<SectionSummary[]>(() => {
    return sektionen
      .map((s) => {
        const sItems = items.filter((i) => i.sektion === s.code);
        if (sItems.length === 0) return null;
        const erfasst = sItems.filter((i) => i.status === "erfasst").length;
        const teilweise = sItems.filter((i) => i.status === "teilweise").length;
        const total = sItems.length;
        const sectionStatus: "erfasst" | "teilweise" | "offen" =
          erfasst === total
            ? "erfasst"
            : erfasst + teilweise > 0
              ? "teilweise"
              : "offen";
        const name = sItems[0]?.sektionName ?? s.name;
        return {
          id: s.code,
          name,
          items: sItems,
          erfasst,
          teilweise,
          total,
          sectionStatus,
          hasAnnaItems: sItems.some((i) => i.ausGespraech && !i.validiert),
        };
      })
      .filter(Boolean) as SectionSummary[];
  }, [items, sektionen]);

  /* Auto-expand sections with teilweise status on mount */
  useEffect(() => {
    setExpandedSections(
      new Set(sections.filter((s) => s.sectionStatus === "teilweise").map((s) => s.id))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalItems = items.length;
  const erfassteItems = items.filter(
    (i) => i.status === "erfasst" || i.status === "teilweise"
  ).length;
  const erfassungsgrad = totalItems > 0 ? Math.round((erfassteItems / totalItems) * 100) : 0;
  const pendingValidation = items.filter((i) => i.ausGespraech && !i.validiert).length;

  /* --- Scroll-spy ---------------------------------------------------------- */

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActiveTocId(e.target.getAttribute("data-section-id"));
        }
      },
      { rootMargin: "-100px 0px -60% 0px" }
    );
    for (const ref of Object.values(sectionRefs.current)) if (ref) observer.observe(ref);
    return () => observer.disconnect();
  }, [sections]);

  /* --- Handlers ------------------------------------------------------------ */

  const toggleSection = (id: string) =>
    setExpandedSections((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const scrollToSection = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
    setExpandedSections((prev) => new Set(prev).add(id));
  };

  const handleValidateItem = useCallback(
    (itemId: string) => {
      setItems((prev) => {
        const next = prev.map((i) =>
          i.id === itemId ? { ...i, validiert: true, status: "erfasst" as const } : i
        );
        const item = next.find((i) => i.id === itemId);
        if (
          item &&
          next.filter((i) => i.sektion === item.sektion).every((i) => i.status === "erfasst")
        ) {
          setTimeout(() => {
            setExpandedSections((p) => {
              const s = new Set(p);
              s.delete(item.sektion);
              return s;
            });
            const nxt = sections.find(
              (s) => s.id !== item.sektion && s.sectionStatus !== "erfasst"
            );
            if (nxt) setTimeout(() => scrollToSection(nxt.id), 300);
          }, 400);
        }
        return next;
      });
    },
    [sections]
  );

  const handleSetItemValue = useCallback((itemId: string, wert: string) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId
          ? { ...i, antwortWert: wert, status: "erfasst" as const, validiert: true }
          : i
      )
    );
  }, []);

  const handleBulkValidate = useCallback(
    (sectionId: string, onlyHighMedium?: boolean) => {
      setItems((prev) =>
        prev.map((i) => {
          if (i.sektion !== sectionId || !i.ausGespraech || i.validiert) return i;
          // Never bulk-validate empty items
          if (i.antwortWert === null) return i;
          // If onlyHighMedium, skip niedrig
          if (onlyHighMedium && i.annaKonfidenz === "niedrig") return i;
          return { ...i, validiert: true, status: "erfasst" as const };
        })
      );
      setTimeout(() => {
        setExpandedSections((p) => {
          const s = new Set(p);
          s.delete(sectionId);
          return s;
        });
        const nxt = sections.find((s) => s.id !== sectionId && s.sectionStatus !== "erfasst");
        if (nxt) setTimeout(() => scrollToSection(nxt.id), 300);
      }, 400);
    },
    [sections]
  );

  const handleBulkValidateSection = useCallback(
    (sectionId: string) => {
      const sectionItems = items.filter((i) => i.sektion === sectionId);
      const lowConf = sectionItems.filter(
        (i) => i.annaKonfidenz === "niedrig" && !i.validiert && i.antwortWert !== null
      );
      const empty = sectionItems.filter((i) => i.antwortWert === null);

      if (lowConf.length > 0 || empty.length > 0) {
        setBulkConfirmSection(sectionId);
      } else {
        handleBulkValidate(sectionId);
      }
    },
    [items, handleBulkValidate]
  );

  /* --- Bulk confirmation dialog data --------------------------------------- */

  const bulkConfirmData = useMemo(() => {
    if (!bulkConfirmSection) return null;
    const sectionItems = items.filter((i) => i.sektion === bulkConfirmSection);
    const toValidate = sectionItems.filter((i) => i.ausGespraech && !i.validiert);
    const lowConf = toValidate.filter(
      (i) => i.annaKonfidenz === "niedrig" && i.antwortWert !== null
    );
    const empty = toValidate.filter((i) => i.antwortWert === null);
    return {
      sectionId: bulkConfirmSection,
      total: toValidate.length,
      lowConf: lowConf.length,
      empty: empty.length,
    };
  }, [bulkConfirmSection, items]);

  /* --- Render -------------------------------------------------------------- */

  return (
    <div className="h-full flex flex-col">
      <style>{`.ab-pad { padding-left: var(--mobile-page-padding); padding-right: var(--mobile-page-padding); } @media (min-width: 640px) { .ab-pad { padding-left: var(--space-6); padding-right: var(--space-6); } }`}</style>

      {/* ── Sticky header ─────────────────────────────────────────── */}
      <div
        className="shrink-0 ab-pad"
        style={{
          paddingTop: "var(--space-3)",
          paddingBottom: "var(--space-3)",
          background: "var(--bg-elevated)",
          borderBottom: "var(--border-thin) solid var(--border-default)",
          zIndex: 10,
        }}
      >
        <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
          <div className="flex items-center" style={{ gap: 8 }}>
            <button
              onClick={() => navigate("/interrai")}
              className="inline-flex items-center cursor-pointer"
              style={{
                gap: 4,
                background: "transparent",
                border: "none",
                color: "var(--brand-primary)",
                fontSize: "var(--text-small)",
                fontWeight: "var(--weight-medium)",
              }}
            >
              <ArrowLeft style={{ width: 14, height: 14 }} />
            </button>
            <span
              style={{
                fontSize: "var(--text-body)",
                fontWeight: "var(--weight-medium)",
                color: "var(--text-primary)",
              }}
            >
              {typ === "erstassessment" ? "Erstassessment" : "Re-Assessment"} — {patientName}
            </span>
          </div>
          <span style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>
            {erfassteItems} Items erfasst{pendingValidation > 0 ? ` · ${pendingValidation} zu bestätigen` : ""}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap" style={{ gap: 6 }}>
          {pendingValidation > 0 && (
            <button
              onClick={() => setShowValidationMode(true)}
              className="inline-flex items-center cursor-pointer"
              style={{
                gap: 5,
                padding: "7px 14px",
                borderRadius: "var(--radius-pill)",
                background: "var(--brand-accent-light)",
                border: "none",
                color: "var(--status-info)",
                fontSize: "var(--text-small)",
                fontWeight: "var(--weight-medium)",
                minHeight: 34,
              }}
            >
              <Zap style={{ width: 13, height: 13 }} /> {pendingValidation} bestätigen
            </button>
          )}
          <button
            onClick={() => setShowAuswertung(!showAuswertung)}
            className="inline-flex items-center cursor-pointer"
            style={{
              gap: 5,
              padding: "7px 14px",
              borderRadius: "var(--radius-pill)",
              background: showAuswertung ? "var(--brand-primary)" : "var(--bg-elevated)",
              border: showAuswertung ? "none" : "var(--border-thin) solid var(--border-default)",
              color: showAuswertung ? "var(--text-on-dark)" : "var(--text-primary)",
              fontSize: "var(--text-small)",
              fontWeight: "var(--weight-medium)",
              minHeight: 34,
            }}
          >
            <Activity style={{ width: 13, height: 13 }} /> {showAuswertung ? "Auswertung schliessen" : "Auswerten"}
          </button>
        </div>
      </div>

      {/* ── Main: TOC + Sections ──────────────────────────────────── */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Desktop TOC */}
        <div
          className="hidden lg:block shrink-0 overflow-y-auto"
          style={{
            width: 220,
            padding: "var(--space-3)",
            borderRight: "var(--border-thin) solid var(--border-default)",
          }}
        >
          <div style={{ fontSize: "var(--text-micro)", color: "var(--text-secondary)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase" as const, marginBottom: 8, fontWeight: "var(--weight-medium)", padding: "0 8px" }}>Sektionen</div>
          <SidebarNav
            entries={sections.map(s => ({ id: s.id, label: s.name, count: `${s.erfasst}/${s.total}` }))}
            activeId={activeTocId}
            onNavigate={scrollToSection}
          />
        </div>

        {/* Sections content */}
        <div
          className="flex-1 min-w-0 overflow-y-auto ab-pad"
          style={{ paddingTop: "var(--space-3)", paddingBottom: "var(--space-8)" }}
        >
          {/* Mobile TOC — count only, no colored dots per 8.14 */}
          <div className="lg:hidden flex overflow-x-auto" style={{ gap: 4, marginBottom: 12 }}>
            {sections.map((sec) => (
              <button
                key={sec.id}
                onClick={() => scrollToSection(sec.id)}
                className="inline-flex items-center shrink-0 cursor-pointer"
                style={{
                  gap: 3,
                  padding: "5px 8px",
                  borderRadius: 999,
                  background: activeTocId === sec.id ? "var(--bg-secondary)" : "var(--bg-elevated)",
                  border: "0.5px solid var(--border-default)",
                  fontSize: 10,
                  whiteSpace: "nowrap",
                  fontWeight: activeTocId === sec.id ? 500 : 400,
                }}
              >
                <span style={{ fontWeight: 600 }}>{sec.id}</span>
                <span style={{ color: "var(--text-tertiary)" }}>{sec.erfasst}/{sec.total}</span>
              </button>
            ))}
          </div>

          {/* Section cards — shared SectionAccordion (8.12) */}
          {sections.map((sec) => {
            const secStatus = sec.sectionStatus === "erfasst" ? "vollstaendig" as const : sec.sectionStatus === "teilweise" ? "teilweise" as const : "leer" as const;
            return (
              <div key={sec.id} ref={el => { sectionRefs.current[sec.id] = el; }} data-section-id={sec.id}>
                <SectionAccordion
                  id={sec.id}
                  titel={`${sec.id} – ${sec.name}`}
                  marker={<SektionBadge buchstabe={sec.id} status={secStatus} />}
                  count={`${sec.erfasst}/${sec.total} erfasst`}
                  status={secStatus}
                  offen={expandedSections.has(sec.id)}
                  onToggle={toggleSection}
                  sammelAktion={sec.hasAnnaItems ? (
                    <button onClick={() => handleBulkValidateSection(sec.id)} className="inline-flex items-center cursor-pointer" style={{ gap: 4, padding: "5px 12px", borderRadius: 999, background: "var(--status-success)", border: "none", fontSize: "var(--text-small)", fontWeight: 500, color: "var(--text-on-dark)" }}>
                      <CheckCircle2 style={{ width: 12, height: 12 }} /> Alle bestätigen
                    </button>
                  ) : undefined}
                >
                  {sec.items.map((item) => (
                    <InterRAIItemRow
                      key={item.id}
                      item={item}
                      onValidate={handleValidateItem}
                      onSetValue={handleSetItemValue}
                    />
                  ))}
                </SectionAccordion>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Validation overlay ────────────────────────────────────── */}
      {showValidationMode && (
        <ValidierungsModus
          items={items.filter((i) => i.ausGespraech && !i.validiert)}
          onValidate={handleValidateItem}
          onSetValue={handleSetItemValue}
          onClose={() => setShowValidationMode(false)}
        />
      )}

      {/* ── Bulk confirm dialog ───────────────────────────────────── */}
      {bulkConfirmData && (
        <BulkConfirmDialog
          data={bulkConfirmData}
          onConfirmAll={() => {
            handleBulkValidate(bulkConfirmData.sectionId, false);
            setBulkConfirmSection(null);
          }}
          onConfirmHighMedium={() => {
            handleBulkValidate(bulkConfirmData.sectionId, true);
            setBulkConfirmSection(null);
          }}
          onCancel={() => setBulkConfirmSection(null)}
        />
      )}

      {/* ── Auswertungs-Panel (Overlay) ──────────────────────────── */}
      {showAuswertung && (
        <div className="fixed inset-0 z-[55] flex items-end sm:items-center justify-center" style={{ background: "rgba(19,19,20,0.4)" }}>
          <div style={{ background: "var(--bg-primary)", borderRadius: "var(--radius-card) var(--radius-card) 0 0", maxWidth: 640, width: "100%", maxHeight: "85vh", overflow: "auto", boxShadow: "var(--shadow-overlay)" }} className="sm:rounded-2xl">
            {/* Header */}
            <div className="flex items-center justify-between" style={{ padding: "16px 20px", borderBottom: "var(--border-thin) solid var(--border-default)", position: "sticky", top: 0, background: "var(--bg-primary)", zIndex: 1 }}>
              <div className="flex items-center" style={{ gap: 8 }}>
                <Activity style={{ width: 16, height: 16, color: "var(--brand-primary)" }} />
                <span style={{ fontSize: "var(--text-h3)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>Auswertung</span>
              </div>
              <button onClick={() => setShowAuswertung(false)} className="cursor-pointer" style={{ background: "none", border: "none", color: "var(--text-tertiary)", padding: 4 }}><X style={{ width: 16, height: 16 }} /></button>
            </div>

            <div style={{ padding: "16px 20px" }}>
              {/* Erfassungsstand */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase" as const, marginBottom: 6, fontWeight: "var(--weight-medium)" }}>Erfassungsstand</div>
                <div style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>{erfassteItems} Items erfasst{pendingValidation > 0 ? ` · ${pendingValidation} noch zu bestätigen` : ""}</div>
              </div>

              {/* Outcome-Scales */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase" as const, marginBottom: 8, fontWeight: "var(--weight-medium)" }}>Outcome-Scales</div>
                <div className="grid grid-cols-2 sm:grid-cols-3" style={{ gap: 8 }}>
                  {DEMO_SCALES.map(s => {
                    const pct = s.maxWert > 0 ? s.wert / s.maxWert : 0;
                    const color = s.richtung === "hoeher-schlechter"
                      ? (pct > 0.5 ? "var(--status-danger)" : pct > 0.25 ? "var(--status-warning)" : "var(--status-success)")
                      : (pct > 0.5 ? "var(--status-success)" : "var(--status-warning)");
                    return (
                      <div key={s.id} style={{ padding: "10px 14px", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)" }}>
                        <div style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", fontWeight: "var(--weight-medium)", marginBottom: 2 }}>{s.name}</div>
                        <div className="flex items-end" style={{ gap: 3, marginBottom: 4 }}>
                          <span style={{ fontSize: 20, fontWeight: "var(--weight-medium)", color, fontVariantNumeric: "tabular-nums" }}>{s.wert}</span>
                          <span style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>/{s.maxWert}</span>
                        </div>
                        <div style={{ height: 4, background: "var(--bg-secondary)", borderRadius: "var(--radius-pill)", overflow: "hidden", marginBottom: 4 }}>
                          <div style={{ height: "100%", width: `${Math.max(5, pct * 100)}%`, background: color, borderRadius: "var(--radius-pill)" }} />
                        </div>
                        <div style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>{s.interpretation}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* CAPs */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase" as const, marginBottom: 8, fontWeight: "var(--weight-medium)" }}>Getriggerte CAPs ({DEMO_CAPS.length})</div>
                <div className="flex flex-col" style={{ gap: 6 }}>
                  {DEMO_CAPS.map(cap => (
                    <div key={cap.id} style={{ padding: "10px 14px", background: cap.prioritaet === "hoch" ? "rgba(168,50,31,0.04)" : "var(--bg-elevated)", border: `var(--border-thin) solid ${cap.prioritaet === "hoch" ? "var(--status-danger)" : "var(--border-default)"}`, borderRadius: "var(--radius-card)" }}>
                      <div className="flex items-center" style={{ gap: 6, marginBottom: 4 }}>
                        <AlertTriangle style={{ width: 13, height: 13, color: cap.prioritaet === "hoch" ? "var(--status-danger)" : "var(--status-warning)" }} />
                        <span style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>{cap.name}</span>
                        <span style={{ padding: "1px 8px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-micro)", fontWeight: "var(--weight-medium)", background: cap.prioritaet === "hoch" ? "var(--status-danger-bg)" : "var(--status-warning-bg)", color: cap.prioritaet === "hoch" ? "var(--status-danger)" : "var(--status-warning-text)" }}>{cap.prioritaet === "hoch" ? "Hoch" : "Mittel"}</span>
                      </div>
                      <div style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", lineHeight: 1.4 }}>{cap.beschreibung}</div>
                      {/* Trigger items */}
                      <div className="flex flex-wrap" style={{ gap: 4, marginTop: 6 }}>
                        {cap.triggerItems.map(code => {
                          const item = items.find(i => i.code === code);
                          const hasValue = item && item.antwortWert !== null;
                          return (
                            <span key={code} style={{ padding: "1px 6px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-micro)", fontWeight: "var(--weight-medium)", background: hasValue ? "var(--brand-primary-light)" : "var(--bg-secondary)", color: hasValue ? "var(--brand-primary)" : "var(--text-tertiary)" }}>{code}</span>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sektions-Übersicht */}
              <div>
                <div style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase" as const, marginBottom: 8, fontWeight: "var(--weight-medium)" }}>Sektionen-Übersicht</div>
                <div className="flex flex-col" style={{ gap: 2 }}>
                  {sections.map(sec => (
                    <div key={sec.id} className="flex items-center" style={{ gap: 8, padding: "4px 0" }}>
                      <span style={{ width: 22, fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>{sec.id}</span>
                      <div style={{ flex: 1, height: 4, background: "var(--bg-secondary)", borderRadius: "var(--radius-pill)", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${sec.total > 0 ? (sec.erfasst / sec.total) * 100 : 0}%`, background: sec.sectionStatus === "erfasst" ? "var(--status-success)" : sec.sectionStatus === "teilweise" ? "var(--status-warning)" : "var(--bg-secondary)", borderRadius: "var(--radius-pill)" }} />
                      </div>
                      <span style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums", minWidth: 32, textAlign: "right" }}>{sec.erfasst}/{sec.total}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer hint */}
              <div style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)", marginTop: 16, paddingTop: 12, borderTop: "var(--border-thin) solid var(--border-default)" }}>
                Folgt dem Schema InterRAI HC Schweiz. Outcome-Scales und CAPs sind für den Prototyp vordefiniert — im produktiven Einsatz werden sie automatisch aus den Items berechnet.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   ITEM ROW — Progressive Disclosure
   ══════════════════════════════════════════ */

function InterRAIItemRow({
  item,
  onValidate,
  onSetValue,
}: {
  item: InterRAIItem;
  onValidate: (id: string) => void;
  onSetValue: (id: string, wert: string) => void;
}) {
  const [expanded, setExpanded] = useState(() => shouldExpandByDefault(item));

  return (
    <div
      style={{
        borderBottom: "var(--border-thin) solid var(--border-default)",
      }}
    >
      {/* ── Compact row ──────────────────────────────────────── */}
      <div
        className="flex items-center cursor-pointer"
        onClick={() => setExpanded(!expanded)}
        style={{
          gap: 8,
          padding: "8px 12px",
          minHeight: 44,
          background:
            item.ausGespraech && !item.validiert
              ? "var(--brand-primary-light)"
              : "transparent",
        }}
      >
        {/* Code pill */}
        <span
          style={{
            padding: "2px 7px",
            borderRadius: "var(--radius-pill)",
            background: "var(--brand-primary-light)",
            color: "var(--brand-primary)",
            fontSize: "var(--text-meta)",
            fontWeight: "var(--weight-medium)",
            flexShrink: 0,
            whiteSpace: "nowrap",
          }}
        >
          {item.code}
        </span>

        {/* Short question */}
        <span
          className="flex-1 truncate"
          style={{
            fontSize: "var(--text-small)",
            color: "var(--text-primary)",
          }}
        >
          {item.frageKurz}
        </span>

        {/* Anna suggestion block */}
        {item.ausGespraech && item.antwortWert !== null && (
          <div
            className="flex items-center shrink-0"
            style={{ gap: 4 }}
          >
            <Mic
              style={{
                width: 10,
                height: 10,
                color: "var(--text-tertiary)",
              }}
            />
            <span
              style={{
                fontSize: "var(--text-meta)",
                color: "var(--text-secondary)",
                whiteSpace: "nowrap",
              }}
            >
              {getAntwortKurzLabel(item)}
            </span>
          </div>
        )}

        {/* Validate button */}
        {!item.validiert && item.antwortWert !== null ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onValidate(item.id);
            }}
            className="inline-flex items-center justify-center shrink-0 cursor-pointer"
            style={{
              width: 28,
              height: 28,
              borderRadius: "var(--radius-pill)",
              background: "var(--status-success)",
              border: "none",
              color: "var(--text-on-dark)",
            }}
            aria-label="Item bestätigen"
          >
            <Check style={{ width: 12, height: 12 }} />
          </button>
        ) : item.validiert ? (
          <CheckCircle2
            style={{
              color: "var(--status-success)",
              width: 16,
              height: 16,
              flexShrink: 0,
            }}
          />
        ) : null}

        {/* Expand toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="inline-flex items-center justify-center shrink-0 cursor-pointer"
          style={{
            width: 24,
            height: 24,
            background: "transparent",
            border: "none",
            color: "var(--text-tertiary)",
          }}
          aria-label={expanded ? "Einklappen" : "Ausklappen"}
        >
          {expanded ? (
            <ChevronUp style={{ width: 14, height: 14 }} />
          ) : (
            <ChevronDown style={{ width: 14, height: 14 }} />
          )}
        </button>
      </div>

      {/* ── Expanded detail ──────────────────────────────────── */}
      {expanded && (
        <div
          style={{
            padding: "12px 16px",
            borderTop: "var(--border-thin) solid var(--border-default)",
            background: "var(--bg-primary)",
          }}
        >
          {/* Full question text */}
          <div
            style={{
              fontSize: "var(--text-body)",
              color: "var(--text-secondary)",
              marginBottom: 10,
              lineHeight: 1.5,
            }}
          >
            {item.frageVoll}
          </div>

          {/* Anna evidence */}
          {item.gespraechsBeleg && (
            <div
              style={{
                padding: "8px 12px",
                marginBottom: 10,
                background: "rgba(31,92,77,0.06)",
                borderRadius: "var(--radius-card)",
                borderLeft: "2px solid var(--brand-primary)",
              }}
            >
              <div
                className="flex items-center"
                style={{
                  gap: 4,
                  fontSize: "var(--text-meta)",
                  color: "var(--text-tertiary)",
                  marginBottom: 4,
                }}
              >
                <Mic style={{ width: 10, height: 10 }} />
                <span>
                  Aus Gespräch vom {item.gespraechsBeleg.zeitstempel}
                </span>
              </div>
              <div
                style={{
                  fontSize: "var(--text-small)",
                  color: "var(--text-secondary)",
                  fontStyle: "italic",
                  lineHeight: 1.4,
                }}
              >
                &laquo;{item.gespraechsBeleg.zitat}&raquo;
              </div>
            </div>
          )}

          {/* Answer options based on antwortTyp */}
          {item.antwortTyp === "zahl" ? (
            <input
              type="number"
              value={item.antwortWert ?? ""}
              onChange={(e) => onSetValue(item.id, e.target.value)}
              placeholder="Wert eingeben"
              style={{
                padding: "8px 12px",
                borderRadius: "var(--radius-card)",
                border: "var(--border-thin) solid var(--border-default)",
                fontSize: "var(--text-body)",
                color: "var(--text-primary)",
                background: "var(--bg-elevated)",
                width: 120,
                minHeight: 40,
              }}
            />
          ) : item.antwortTyp === "text" ? (
            <input
              type="text"
              value={item.antwortWert ?? ""}
              onChange={(e) => onSetValue(item.id, e.target.value)}
              placeholder="Text eingeben"
              style={{
                padding: "8px 12px",
                borderRadius: "var(--radius-card)",
                border: "var(--border-thin) solid var(--border-default)",
                fontSize: "var(--text-body)",
                color: "var(--text-primary)",
                background: "var(--bg-elevated)",
                width: "100%",
                minHeight: 40,
              }}
            />
          ) : item.antwortTyp === "datum" ? (
            <input
              type="date"
              value={item.antwortWert ?? ""}
              onChange={(e) => onSetValue(item.id, e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "var(--radius-card)",
                border: "var(--border-thin) solid var(--border-default)",
                fontSize: "var(--text-body)",
                color: "var(--text-primary)",
                background: "var(--bg-elevated)",
                minHeight: 40,
              }}
            />
          ) : (
            <div className="flex flex-col" style={{ gap: 4 }}>
              {item.antwortOptionen.map((opt) => {
                const selected = String(item.antwortWert) === opt.wert;
                return (
                  <button
                    key={opt.wert}
                    onClick={() => onSetValue(item.id, opt.wert)}
                    className="flex items-center text-left cursor-pointer"
                    style={{
                      gap: 8,
                      padding: "6px 10px",
                      borderRadius: "var(--radius-card)",
                      background: selected ? "var(--brand-primary-light)" : "transparent",
                      border: selected
                        ? "var(--border-thin) solid var(--brand-primary)"
                        : "var(--border-thin) solid var(--border-default)",
                      fontSize: "var(--text-small)",
                      color: selected ? "var(--brand-primary)" : "var(--text-primary)",
                      fontWeight: selected ? "var(--weight-medium)" : "var(--weight-regular)",
                      minHeight: 36,
                      transition: "all 0.15s",
                    }}
                  >
                    <span
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        border: selected
                          ? "2px solid var(--brand-primary)"
                          : "2px solid var(--border-default)",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        fontSize: 10,
                        lineHeight: 1,
                      }}
                    >
                      {selected && (
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: "var(--brand-primary)",
                            display: "block",
                          }}
                        />
                      )}
                    </span>
                    <span className="flex-1">{opt.bezeichnung}</span>
                    {selected && item.ausGespraech && !item.validiert && (
                      <span
                        style={{
                          fontSize: "var(--text-meta)",
                          color: "var(--brand-primary)",
                          fontWeight: "var(--weight-medium)",
                        }}
                      >
                        erkannt
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   BULK CONFIRM DIALOG
   ══════════════════════════════════════════ */

function BulkConfirmDialog({
  data,
  onConfirmAll,
  onConfirmHighMedium,
  onCancel,
}: {
  data: { sectionId: string; total: number; lowConf: number; empty: number };
  onConfirmAll: () => void;
  onConfirmHighMedium: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.4)" }}
    >
      <div
        style={{
          maxWidth: 440,
          width: "calc(100% - 32px)",
          padding: "var(--space-6)",
          background: "var(--bg-elevated)",
          borderRadius: "var(--radius-card)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        }}
      >
        <div className="flex items-center" style={{ gap: 8, marginBottom: 12 }}>
          <AlertTriangle
            style={{ width: 18, height: 18, color: "var(--status-warning)", flexShrink: 0 }}
          />
          <span
            style={{
              fontSize: "var(--text-body)",
              fontWeight: "var(--weight-medium)",
              color: "var(--text-primary)",
            }}
          >
            Bestätigung erforderlich
          </span>
        </div>
        <div
          style={{
            fontSize: "var(--text-small)",
            color: "var(--text-secondary)",
            lineHeight: 1.5,
            marginBottom: 16,
          }}
        >
          Du bestätigst {data.total} Items.
          {data.lowConf > 0 && (
            <>
              {" "}
              Davon {data.lowConf === 1 ? "hat" : "haben"}{" "}
              <strong style={{ color: "var(--status-danger)" }}>{data.lowConf}</strong> eine
              Einige Vorschläge sollten besonders geprüft werden.
            </>
          )}
          {data.empty > 0 && (
            <>
              {" "}
              <strong>{data.empty}</strong> {data.empty === 1 ? "ist" : "sind"} leer und{" "}
              {data.empty === 1 ? "wird" : "werden"} nicht bestätigt.
            </>
          )}
        </div>
        <div className="flex flex-col" style={{ gap: 6 }}>
          {data.lowConf > 0 && (
            <button
              onClick={onConfirmHighMedium}
              className="w-full inline-flex items-center justify-center cursor-pointer"
              style={{
                gap: 5,
                padding: "10px 16px",
                borderRadius: "var(--radius-pill)",
                background: "var(--brand-primary)",
                color: "var(--text-on-dark)",
                fontSize: "var(--text-small)",
                fontWeight: "var(--weight-medium)",
                border: "none",
                minHeight: 40,
              }}
            >
              Nur geprüfte bestätigen
            </button>
          )}
          <button
            onClick={onConfirmAll}
            className="w-full inline-flex items-center justify-center cursor-pointer"
            style={{
              gap: 5,
              padding: "10px 16px",
              borderRadius: "var(--radius-pill)",
              background: data.lowConf > 0 ? "var(--bg-elevated)" : "var(--brand-primary)",
              color: data.lowConf > 0 ? "var(--text-primary)" : "var(--text-on-dark)",
              fontSize: "var(--text-small)",
              fontWeight: "var(--weight-medium)",
              border: data.lowConf > 0 ? "var(--border-thin) solid var(--border-default)" : "none",
              minHeight: 40,
            }}
          >
            Alle bestätigen
          </button>
          <button
            onClick={onCancel}
            className="w-full inline-flex items-center justify-center cursor-pointer"
            style={{
              padding: "10px 16px",
              borderRadius: "var(--radius-pill)",
              background: "transparent",
              color: "var(--text-secondary)",
              fontSize: "var(--text-small)",
              border: "none",
              minHeight: 40,
            }}
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   VALIDIERUNGS-MODUS
   ══════════════════════════════════════════ */

function ValidierungsModus({
  items,
  onValidate,
  onSetValue,
  onClose,
}: {
  items: InterRAIItem[];
  onValidate: (id: string) => void;
  onSetValue: (id: string, wert: string) => void;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(false);
  const total = items.length;

  if (done || idx >= total) {
    return (
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center"
        style={{ background: "var(--bg-primary)" }}
      >
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <CheckCircle2
            style={{ width: 48, height: 48, color: "var(--status-success)", margin: "0 auto 16px" }}
          />
          <div
            style={{
              fontSize: "var(--text-h2)",
              fontWeight: "var(--weight-medium)",
              color: "var(--text-primary)",
              marginBottom: 8,
            }}
          >
            {total} Items bestätigt
          </div>
          <button
            onClick={onClose}
            className="inline-flex items-center cursor-pointer"
            style={{
              gap: 6,
              padding: "12px 24px",
              borderRadius: "var(--radius-pill)",
              background: "var(--brand-primary)",
              color: "var(--text-on-dark)",
              fontSize: "var(--text-body)",
              fontWeight: "var(--weight-medium)",
              border: "none",
            }}
          >
            Zurück zur Übersicht
          </button>
        </div>
      </div>
    );
  }

  const item = items[idx];
  const goNext = () => {
    if (idx + 1 >= total) setDone(true);
    else setIdx(idx + 1);
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col"
      style={{ background: "var(--bg-primary)" }}
    >
      {/* Header */}
      <div
        className="shrink-0 flex items-center justify-between"
        style={{
          padding: "10px 20px",
          borderBottom: "var(--border-thin) solid var(--border-default)",
          background: "var(--bg-elevated)",
        }}
      >
        <div className="flex items-center" style={{ gap: 8 }}>
          <Zap style={{ width: 14, height: 14, color: "var(--brand-primary)" }} />
          <span style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)" }}>
            Bestätigung
          </span>
        </div>
        <div className="flex items-center" style={{ gap: 12 }}>
          <span style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>
            {idx + 1} / {total}
          </span>
          <button
            onClick={onClose}
            style={{
              width: 28,
              height: 28,
              borderRadius: "var(--radius-pill)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
            aria-label="Bestätigung schliessen"
          >
            <X style={{ width: 14, height: 14, color: "var(--text-secondary)" }} />
          </button>
        </div>
      </div>

      {/* Progress */}
      <div style={{ height: 3, background: "var(--bg-secondary)" }}>
        <div
          style={{
            height: "100%",
            width: `${((idx + 1) / total) * 100}%`,
            background: "var(--brand-primary)",
            transition: "width 0.3s",
          }}
        />
      </div>

      {/* Content */}
      <div
        className="flex-1 flex items-center justify-center overflow-y-auto"
        style={{ padding: 20 }}
      >
        <div style={{ maxWidth: 520, width: "100%" }}>
          {/* Section badge */}
          <span
            style={{
              padding: "2px 8px",
              borderRadius: "var(--radius-pill)",
              fontSize: "var(--text-meta)",
              fontWeight: "var(--weight-medium)",
              background: "var(--bg-secondary)",
              color: "var(--text-secondary)",
              display: "inline-block",
              marginBottom: 10,
            }}
          >
            Sektion {item.sektion} – {item.sektionName}
          </span>

          {/* Full question */}
          <div
            style={{
              fontSize: "var(--text-h2)",
              fontWeight: "var(--weight-medium)",
              color: "var(--text-primary)",
              marginBottom: 8,
            }}
          >
            {item.frageVoll}
          </div>

          {/* Anna recognition + confidence badge */}
          <div
            style={{
              padding: "10px 14px",
              background: "var(--brand-primary-light)",
              borderRadius: "var(--radius-card)",
              marginBottom: 10,
              border: "var(--border-thin) solid rgba(31,92,77,0.2)",
            }}
          >
            <div
              className="flex items-center justify-between"
              style={{ marginBottom: 3 }}
            >
              <div
                style={{
                  fontSize: "var(--text-meta)",
                  color: "var(--brand-primary)",
                  fontWeight: "var(--weight-medium)",
                }}
              >
                <Sparkles
                  style={{
                    width: 9,
                    height: 9,
                    display: "inline",
                    verticalAlign: "middle",
                    marginRight: 3,
                  }}
                />
                Anna erkennt:
              </div>
            </div>
            <div
              style={{
                fontSize: "var(--text-body)",
                fontWeight: "var(--weight-medium)",
                color: "var(--text-primary)",
              }}
            >
              {getAntwortText(item) || "—"}
            </div>
          </div>


          {/* Quote from conversation */}
          {item.gespraechsBeleg?.zitat && (
            <div
              className="flex items-start"
              style={{
                gap: 6,
                marginBottom: 14,
                padding: "8px 12px",
                background: "var(--bg-secondary)",
                borderRadius: "var(--radius-card)",
                borderLeft: "2px solid var(--brand-primary)",
              }}
            >
              <Mic
                style={{
                  width: 12,
                  height: 12,
                  color: "var(--text-tertiary)",
                  flexShrink: 0,
                  marginTop: 2,
                }}
              />
              <span
                style={{
                  fontSize: "var(--text-small)",
                  color: "var(--text-secondary)",
                  fontStyle: "italic",
                  lineHeight: 1.4,
                }}
              >
                &laquo;{item.gespraechsBeleg.zitat}&raquo;
              </span>
            </div>
          )}

          {/* Answer options */}
          {item.antwortTyp === "zahl" ? (
            <div style={{ marginBottom: 20 }}>
              <input
                type="number"
                value={item.antwortWert ?? ""}
                onChange={(e) => onSetValue(item.id, e.target.value)}
                placeholder="Wert eingeben"
                style={{
                  padding: "8px 16px",
                  borderRadius: "var(--radius-card)",
                  border: "var(--border-thin) solid var(--border-default)",
                  fontSize: "var(--text-body)",
                  color: "var(--text-primary)",
                  background: "var(--bg-elevated)",
                  width: 140,
                  minHeight: 40,
                }}
              />
            </div>
          ) : item.antwortTyp === "text" ? (
            <div style={{ marginBottom: 20 }}>
              <input
                type="text"
                value={item.antwortWert ?? ""}
                onChange={(e) => onSetValue(item.id, e.target.value)}
                placeholder="Text eingeben"
                style={{
                  padding: "8px 16px",
                  borderRadius: "var(--radius-card)",
                  border: "var(--border-thin) solid var(--border-default)",
                  fontSize: "var(--text-body)",
                  color: "var(--text-primary)",
                  background: "var(--bg-elevated)",
                  width: "100%",
                  minHeight: 40,
                }}
              />
            </div>
          ) : (
            <div className="flex flex-wrap" style={{ gap: 5, marginBottom: 20 }}>
              {item.antwortOptionen.map((opt) => {
                const sel = String(item.antwortWert) === opt.wert;
                return (
                  <button
                    key={opt.wert}
                    onClick={() => {
                      onSetValue(item.id, opt.wert);
                      goNext();
                    }}
                    className="cursor-pointer"
                    style={{
                      padding: "8px 16px",
                      borderRadius: "var(--radius-pill)",
                      fontSize: "var(--text-body)",
                      fontWeight: sel ? "var(--weight-medium)" : "var(--weight-regular)",
                      background: sel ? "var(--brand-primary)" : "var(--bg-elevated)",
                      color: sel ? "var(--text-on-dark)" : "var(--text-primary)",
                      border: sel
                        ? "none"
                        : "var(--border-thin) solid var(--border-default)",
                      minHeight: 40,
                    }}
                  >
                    {opt.kurzLabel ?? opt.bezeichnung}
                  </button>
                );
              })}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center" style={{ gap: 8 }}>
            <button
              onClick={() => {
                onValidate(item.id);
                goNext();
              }}
              className="inline-flex items-center cursor-pointer"
              style={{
                gap: 5,
                padding: "10px 20px",
                borderRadius: "var(--radius-pill)",
                background: "var(--brand-primary)",
                color: "var(--text-on-dark)",
                fontSize: "var(--text-body)",
                fontWeight: "var(--weight-medium)",
                border: "none",
                minHeight: 44,
              }}
            >
              <Check style={{ width: 14, height: 14 }} /> Bestätigen
            </button>
            <button
              onClick={goNext}
              className="inline-flex items-center cursor-pointer"
              style={{
                gap: 5,
                padding: "10px 16px",
                borderRadius: "var(--radius-pill)",
                background: "transparent",
                border: "none",
                fontSize: "var(--text-body)",
                color: "var(--text-secondary)",
              }}
            >
              Überspringen <ChevronRight style={{ width: 12, height: 12 }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
