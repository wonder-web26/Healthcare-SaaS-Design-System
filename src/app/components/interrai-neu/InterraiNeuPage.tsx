/**
 * interRAI HC assessment screen — fully data-driven from seed.
 *
 * No item codes, section titles, or answer codes are hardcoded here.
 * Everything comes from the seed via the instrument access layer.
 *
 * Route: /interrai-neu/:assessmentId
 * Layout spec: docs/interrai-ui-layout-vorgabe.md (Fassung 2, 24.07.2026)
 *
 * Composite types dispatched here:
 *   simple          – item with no sub-items (options or text/number/date)
 *   matrix          – sub-items inherit parent options (1 box per row)
 *   matrix_columns  – sub-items with N boxes per row (G1)
 *   stacked         – each sub-item has its own options
 *   fieldgroup      – only text/number/date sub-items
 *   mixed_n2        – N2: Ja/Nein + attached numeric fields
 *   repeat_fixed    – I3: fixed number of repeating row groups
 *   repeat_dynamic  – P2: assessor enters count, then N groups rendered
 */

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router";
import {
  Info,
  AlertTriangle,
  Check,
  SkipForward,
  Plus,
  Search,
  ArrowLeft,
} from "lucide-react";

// Instrument access layer — all types and functions come from here.
// interrai-labels.ts and interrai-structure.ts no longer exist;
// their data now lives in the seed directly (label, detail, groupHeading,
// attachments, columns, footnote, instruction, repeatRows, repeatable).
import {
  interraiHcSchweiz,
  type Bereich,
  type Item,
  type SubItem,
  type AnswerOption,
  type AnswerColumn,
  getCompositeType,
  getEffectiveOptions,
  evaluateSkipLogic,
  getInputFieldsForBereich,
  getInputFieldStats,
  getMatrixDisplayMode,
} from "../../../lib/interrai/instrument";

import { DateField } from "../form/DateField";
import { ComboboxPopover } from "../form/ComboboxPopover";
import { NATIONALITAETEN } from "../form/MigratedAngehoerigerForms";
import { validiereFeld, maskiereAHV, maskiereZiffern, ICD_HINWEIS, type ValidierungTyp } from "../../../lib/validierung";
import { MODUL_ZERTIFIZIERUNG } from "../../../lib/stammdaten/modul-zertifizierung";
import {
  getAssessment,
  getPerson,
  updateAssessmentAnswers,
  getOpenFieldCount,
  getActiveFieldCount,
  abschliessenAssessment,
  istAbgeschlossen,
  formatDateTime,
  confirmVorschlag,
  getGespraech,
  type NeuAssessment,
  type Vorschlag,
  type GespraechAbschnitt,
  type Bestaetigung,
} from "../../../lib/interrai/store";
import { useRecording } from "../../recording/RecordingContext";

// ─── Types ──────────────────────────────────────────────────────────────────

/** Flat answer store: field code → string value (null = unanswered) */
type Answers = Record<string, string | null>;

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Highlights signal words (OHNE, NICHT, ausgenommen, beinhaltet auch) in
 * a detail string per layout-vorgabe §2.
 * Returns mixed array of strings and <strong> nodes.
 */
function highlightDetail(text: string): React.ReactNode {
  if (!text) return null;
  const pattern = /\b(OHNE|NICHT|ausgenommen|beinhaltet(?:\s+auch)?)\b/gi;
  const parts: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(
      <strong key={m.index} style={{ textTransform: "uppercase" }}>
        {m[0]}
      </strong>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

/** Compact evidence indicator — 🎤 icon that toggles the evidence popover */
function EvidenceIcon({ segId, onEvidenceClick, activeEvidenceSegId }: {
  segId: string;
  onEvidenceClick: (id: string | null) => void;
  activeEvidenceSegId: string | null;
}) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onEvidenceClick(segId === activeEvidenceSegId ? null : segId); }}
      style={{ fontSize: 12, color: "var(--brand-accent, #47AED1)", background: segId === activeEvidenceSegId ? "rgba(71,174,209,0.14)" : "none", borderRadius: 4, border: "none", cursor: "pointer", padding: 0, lineHeight: 1, flexShrink: 0 }}
      title="Beleg anzeigen"
    >🎤</button>
  );
}

/**
 * A field's conversation evidence, resolved uniformly from either an
 * unconfirmed suggestion OR a confirmed answer. `aktiv` = still unconfirmed and
 * actionable (shown prominently); false = confirmed or supported (shown quietly
 * but never removed — §2.6, "Beleg bleibt erhalten").
 */
type FeldBeleg = { segId: string; aktiv: boolean };

function feldBeleg(
  suggestion: { segId: string; zustand: string } | null | undefined,
  confirmedSegId: string | null | undefined,
): FeldBeleg | null {
  if (suggestion && suggestion.zustand !== "gestuetzt") return { segId: suggestion.segId, aktiv: true };
  if (confirmedSegId) return { segId: confirmedSegId, aktiv: false };
  if (suggestion && suggestion.zustand === "gestuetzt") return { segId: suggestion.segId, aktiv: false };
  return null;
}

/**
 * Fixed-width evidence slot for row-based layouts (matrix / matrix columns).
 * The space is ALWAYS reserved (§2.6) so answer cells align across rows whether
 * or not a row carries a beleg. The mark never appears/disappears on a state
 * change — only its emphasis changes (prominent while unconfirmed, quiet once
 * confirmed).
 */
function EvidenceMark({ beleg, gespraechSegments, onEvidenceClick, activeEvidenceSegId }: {
  beleg: FeldBeleg | null;
  gespraechSegments?: Map<string, GespraechAbschnitt>;
  onEvidenceClick?: (id: string | null) => void;
  activeEvidenceSegId?: string | null;
}) {
  const seg = beleg && gespraechSegments ? gespraechSegments.get(beleg.segId) : null;
  return (
    <span style={{ width: 20, flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", opacity: beleg && !beleg.aktiv ? 0.4 : 1 }}>
      {beleg && seg && onEvidenceClick && (
        <EvidenceIcon segId={beleg.segId} onEvidenceClick={onEvidenceClick} activeEvidenceSegId={activeEvidenceSegId ?? null} />
      )}
    </span>
  );
}

/**
 * Evidence text block — shown ABOVE the option list (stacked cases), never
 * interrupting the list. Persists after confirmation: prominent while the
 * suggestion is unconfirmed (`muted=false`), quiet but visible afterwards
 * (`muted=true`). Clicking reveals the full segment and marks derived fields.
 */
function EvidenceBlock({ segId, gespraechSegments, muted = false, active = false, onClick }: {
  segId: string;
  gespraechSegments: Map<string, GespraechAbschnitt>;
  muted?: boolean;
  active?: boolean;
  onClick?: (segId: string) => void;
}) {
  const seg = gespraechSegments.get(segId);
  if (!seg) return null;
  return (
    <div
      onClick={onClick ? (e) => { e.stopPropagation(); onClick(segId); } : undefined}
      title={onClick ? "Beleg anzeigen — verwandte Felder markieren" : undefined}
      style={{ fontSize: 12, color: "var(--text-secondary)", fontStyle: "italic", marginBottom: 8, padding: "6px 10px", background: active ? "rgba(71,174,209,0.12)" : muted ? "rgba(71, 174, 209, 0.02)" : "rgba(71, 174, 209, 0.06)", borderRadius: 6, borderLeft: `2px solid ${active ? "var(--brand-primary)" : "var(--brand-accent, #47AED1)"}`, opacity: muted ? 0.7 : 1, cursor: onClick ? "pointer" : "default" }}>
      <span style={{ fontFamily: "monospace", fontSize: 10, color: "var(--text-tertiary)", marginRight: 6 }}>{seg.zeitmarke}</span>
      {seg.sprecherName}: &laquo;{seg.text.length > 120 ? seg.text.substring(0, 120) + "\u2026" : seg.text}&raquo;
    </div>
  );
}

/**
 * Renders the two-level label block (title + detail) for any item or sub-item.
 * Layout-vorgabe §2: title 13 px / weight 500, detail 11.5 px / secondary color.
 * The code monospace prefix is shown on the left unless hideCode=true.
 */
function TwoLevelLabel({
  code,
  label,
  detail,
  hideCode = false,
  dimCode = false,
}: {
  code: string;
  label: string;
  detail?: string;
  hideCode?: boolean;
  dimCode?: boolean;
}) {
  return (
    <span style={{ display: "inline-flex", flexDirection: "column", gap: 1 }}>
      <span
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: "var(--text-primary)",
          lineHeight: 1.35,
        }}
      >
        {!hideCode && (
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 11,
              color: dimCode ? "var(--text-tertiary)" : "var(--text-secondary)",
              marginRight: 6,
            }}
          >
            {code}
          </span>
        )}
        {label}
      </span>
      {detail && (
        <span
          style={{
            fontSize: 11.5,
            color: "var(--text-secondary)",
            lineHeight: 1.4,
          }}
        >
          {highlightDetail(detail)}
        </span>
      )}
    </span>
  );
}

/** Code badge used for answer options. */
function CodeBadge({ code }: { code: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 28,
        height: 22,
        padding: "0 6px",
        background: "var(--bg-secondary)",
        borderRadius: 4,
        fontFamily: "monospace",
        fontSize: 12,
        fontWeight: 600,
        color: "var(--text-secondary)",
        flexShrink: 0,
      }}
    >
      {code}
    </span>
  );
}

/** Observation period badge — only shown when period differs from instrument default (§4.2). */
function PeriodBadge({ period }: { period: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "1px 8px",
        borderRadius: 12,
        background: "var(--status-warning-bg)",
        color: "var(--status-warning-text)",
        fontSize: 11,
        fontWeight: 500,
        whiteSpace: "nowrap",
      }}
    >
      {period}
    </span>
  );
}

// ─── Legend block — tinted, no heading, badges match answer cells (§4.2, §5.5) ─

/**
 * Renders the option legend with an explicitly NON-interactive appearance,
 * clearly distinct from answer options: a tinted, borderless block captioned
 * "Antwortoptionen", code badge + full option text per line in secondary
 * colour. No hover, no pointer cursor, not tabbable, no click. The badge keeps
 * the 34px width so codes still line up with the matrix cells below.
 */
function LegendBlock({ options, compact = false }: { options: AnswerOption[]; compact?: boolean }) {
  return (
    <div style={{
      background: "rgba(0, 0, 0, 0.045)",
      borderRadius: 8,
      padding: compact ? "6px 12px 8px" : "8px 12px 10px",
      display: "flex",
      flexDirection: compact ? "row" : "column",
      flexWrap: compact ? "wrap" : undefined,
      columnGap: compact ? 18 : undefined,
      rowGap: compact ? 3 : undefined,
      gap: compact ? undefined : 4,
    }}>
      <div style={{
        fontSize: 10, fontWeight: 600, letterSpacing: "0.05em",
        textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 2,
        flexBasis: compact ? "100%" : undefined,
      }}>
        Antwortoptionen
      </div>
      {options.map(opt => (
        <div key={opt.code} style={{ display: "flex", alignItems: "baseline", gap: compact ? 6 : 10, minWidth: 0 }}>
          {/* Muted badge — in the full legend 34px wide so codes align with the
              matrix cells below; compact drops the fixed width to pack options
              side by side. No fill/border: a reference, not a button. */}
          <span style={{
            display: "inline-flex", alignItems: "center", justifyContent: compact ? "flex-start" : "center",
            minWidth: compact ? 0 : 34, padding: compact ? 0 : "2px 8px",
            fontFamily: "monospace", fontSize: 13, fontWeight: 600,
            color: "var(--text-secondary)", flexShrink: 0,
          }}>
            {opt.code}
          </span>
          <span style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.35 }}>
            {opt.label}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Trailing affordance for a value field without options (text / number / date).
 * While the suggestion is unconfirmed it offers "Vorschlag «x» übernehmen"
 * (the suggested value stays visible next to any manually entered value — both
 * values are shown, §"Abweichung am Feld"). Overwriting the field auto-confirms
 * via the field's own onChange. The beleg mark sits in a reserved slot that is
 * present in every state (§2.6), quiet once confirmed.
 */
function RawFieldAffordance({
  suggestion,
  confirmedSegId,
  onUebernehmen,
  gespraechSegments,
  onEvidenceClick,
  activeEvidenceSegId,
}: {
  suggestion?: { wert: string; segId: string; zustand: string } | null;
  confirmedSegId?: string | null;
  onUebernehmen: (wert: string) => void;
  gespraechSegments?: Map<string, GespraechAbschnitt>;
  onEvidenceClick?: (id: string | null) => void;
  activeEvidenceSegId?: string | null;
}) {
  const beleg = feldBeleg(suggestion, confirmedSegId);
  const unconfirmed = !!suggestion && suggestion.zustand !== "gestuetzt";
  return (
    <>
      {unconfirmed && (
        <button
          type="button"
          onClick={() => onUebernehmen(suggestion!.wert)}
          style={{ fontSize: 11, color: "var(--brand-accent, #47AED1)", background: "none", border: "0.5px solid var(--brand-accent, #47AED1)", borderRadius: 4, padding: "2px 8px", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}
        >
          Vorschlag &laquo;{suggestion!.wert}&raquo; übernehmen
        </button>
      )}
      <EvidenceMark beleg={beleg} gespraechSegments={gespraechSegments} onEvidenceClick={onEvidenceClick} activeEvidenceSegId={activeEvidenceSegId} />
    </>
  );
}

// ─── Selection surface — replaces radio/checkbox (§1.1–1.4) ─────────────────

interface SelectionSurfaceProps {
  selected: boolean;
  onToggle: () => void;
  minHeight?: number;
  minWidth?: number;
  fullWidth?: boolean;
  children: React.ReactNode;
  disabled?: boolean;
  /** Whether this option is an unconfirmed AI suggestion */
  suggested?: boolean;
}

/**
 * The interactive selection primitive. Two visual signals on selection:
 * filled background + colored border (§1.3). Clicking a selected surface
 * clears it (§1.4). No radio circles or checkbox squares.
 */
function SelectionSurface({
  selected,
  onToggle,
  minHeight = 44,
  minWidth,
  fullWidth = false,
  children,
  disabled = false,
  suggested = false,
}: SelectionSurfaceProps) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onToggle}
      disabled={disabled}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        minHeight,
        minWidth,
        width: fullWidth ? "100%" : undefined,
        padding: "6px 12px",
        background: suggested && !selected
          ? "rgba(71, 174, 209, 0.06)"
          : selected
          ? "var(--brand-primary-light, #e8f0fe)"
          : disabled ? "var(--bg-secondary)" : "var(--bg-elevated)",
        border: suggested && !selected
          ? "1.5px dashed var(--brand-accent, #47AED1)"
          : selected
          ? "1.5px solid var(--brand-primary)"
          : "0.5px solid var(--border-default)",
        borderRadius: 8,
        boxSizing: "border-box",
        cursor: disabled ? "not-allowed" : "pointer",
        textAlign: "left",
        opacity: disabled ? 0.4 : 1,
        transition: "background 0.1s, border-color 0.1s",
        fontFamily: "inherit",
      }}
    >
      {children}
    </button>
  );
}

/**
 * Code cell for matrix rows (§3.2). Min 34×34 px.
 * In "direct" mode shows the option label beneath the code.
 */
function MatrixCell({
  code,
  selected,
  onToggle,
  label,
  showLabel = false,
  suggested = false,
}: {
  code: string;
  selected: boolean;
  onToggle: () => void;
  label?: string;
  showLabel?: boolean;
  /** Whether this cell is an unconfirmed AI suggestion */
  suggested?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title={label}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 34,
        minHeight: 34,
        padding: showLabel ? "4px 8px" : "4px",
        background: suggested && !selected
          ? "rgba(71, 174, 209, 0.06)"
          : selected ? "var(--brand-primary)" : "var(--bg-elevated)",
        border: suggested && !selected
          ? "1.5px dashed var(--brand-accent, #47AED1)"
          : selected
          ? "1.5px solid var(--brand-primary)"
          : "0.5px solid var(--border-default)",
        borderRadius: 6,
        boxSizing: "border-box",
        cursor: "pointer",
        fontFamily: "monospace",
        fontSize: 13,
        fontWeight: selected ? 700 : 400,
        color: selected ? "#fff" : "var(--text-primary)",
        transition: "background 0.1s, color 0.1s, border-color 0.1s",
        flexShrink: 0,
        gap: 2,
      }}
    >
      <span>{code}</span>
      {showLabel && label && (
        <span
          style={{
            fontSize: 10,
            fontWeight: 400,
            color: selected ? "rgba(255,255,255,0.85)" : "var(--text-tertiary)",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </span>
      )}
    </button>
  );
}

// ─── Shared input style ──────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 400,
  padding: "8px 12px",
  fontSize: 13,
  borderRadius: 8,
  border: "0.5px solid var(--border-default)",
  background: "var(--bg-elevated)",
  color: "var(--text-primary)",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

// ─── Main page ───────────────────────────────────────────────────────────────

/** Scroll the content region so the item card for `itemCode` sits just below
 *  the sticky bereich bar. Used by the deviation jump and the entry scroll. */
function scrollItemIntoView(container: HTMLElement | null, itemCode: string) {
  if (!container) return;
  const el = container.querySelector<HTMLElement>(`[data-item="${itemCode}"]`);
  if (!el) return;
  const cRect = container.getBoundingClientRect();
  const eRect = el.getBoundingClientRect();
  const top = container.scrollTop + (eRect.top - cRect.top) - 72;
  container.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
}

export function InterraiNeuPage() {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Load assessment and person from store
  const assessment = assessmentId ? getAssessment(assessmentId) : undefined;

  // Return origin, carried in the URL (survives reload, visible when debugging).
  // Fallback when none is present: the patient view's interRAI tab, else the
  // list — the button never leads nowhere. The label names the destination.
  const returnZiel = searchParams.get("returnTo")
    || (assessment && getPerson(assessment.personId)?.patientId
        ? `/patienten/${getPerson(assessment.personId)!.patientId}?tab=interrai`
        : "/interrai");
  const returnLabel = returnZiel.startsWith("/onboarding") ? "Zurück zum Onboarding"
    : returnZiel.startsWith("/patienten") ? "Zurück zum Patienten"
    : returnZiel.startsWith("/interrai") ? "Zurück zur Übersicht"
    : "Zurück";
  const person = assessment ? getPerson(assessment.personId) : undefined;

  const [activeBereich, setActiveBereich] = useState(
    interraiHcSchweiz.bereiche[0].code
  );
  // Initialize answers from store (survives navigation within session)
  const [answers, setAnswers] = useState<Answers>(() =>
    assessment?.answers ? { ...assessment.answers } : {},
  );
  const [indivPraez, setIndivPraez] = useState<Record<string, string>>({});
  /** Ref to the right content scroll container — used to reset scroll on bereich change */
  const contentScrollRef = useRef<HTMLDivElement>(null);
  /** Item code whose legend hint should appear in the bereich bar (legend not visible but rows still visible) */
  const [legendHintItem, setLegendHintItem] = useState<string | null>(null);
  /** Whether the sticky-bar legend dropdown is open */
  const [legendDropdownOpen, setLegendDropdownOpen] = useState(false);
  /** Pending answer that requires skip-clear confirmation */
  const [pendingSkipClear, setPendingSkipClear] = useState<{ code: string; value: string; affectedCodes: string[]; affectedCount: number } | null>(null);
  /** Whether the completion overview dialog is open */
  const [abschlussDialogOpen, setAbschlussDialogOpen] = useState(false);

  const recording = useRecording();
  const isReadOnly = assessment ? istAbgeschlossen(assessment) : false;
  const isRecordingThisPerson = recording.phase === "recording" && recording.session?.personId === assessment?.personId;

  // Compute per-field suggestion map from assessment vorschlaege
  const vorschlaegeMap = useMemo(() => {
    if (!assessment?.vorschlaegeVerfuegbar) return {} as Record<string, { wert: string; segId: string; zustand: "neuer_wert" | "abweichung" | "gestuetzt" }>;
    const map: Record<string, { wert: string; segId: string; zustand: "neuer_wert" | "abweichung" | "gestuetzt" }> = {};
    for (const [code, v] of Object.entries(assessment.vorschlaege)) {
      const cur = answers[code];
      const zustand = (cur != null && cur !== "") ? (cur === v.vorpigeschlagenerWert ? "gestuetzt" : "abweichung") : "neuer_wert";
      map[code] = { wert: v.vorpigeschlagenerWert, segId: v.gespraechAbschnittId, zustand };
    }
    return map;
  }, [assessment?.vorschlaege, assessment?.vorschlaegeVerfuegbar, answers]);

  const gespraechSegments = useMemo(() => {
    if (!assessment?.gespraechId) return new Map<string, GespraechAbschnitt>();
    const segs = getGespraech(assessment.gespraechId);
    if (!segs) return new Map<string, GespraechAbschnitt>();
    const m = new Map<string, GespraechAbschnitt>();
    for (const s of segs) m.set(s.id, s);
    return m;
  }, [assessment?.gespraechId]);

  // Map field codes to their conversation segment IDs from confirmed suggestions
  const bestaetigungenSegMap = useMemo(() => {
    if (!assessment?.bestaetigungen) return {} as Record<string, string>;
    const m: Record<string, string> = {};
    for (const [code, b] of Object.entries(assessment.bestaetigungen)) {
      m[code] = b.gespraechAbschnittId;
    }
    return m;
  }, [assessment?.bestaetigungen]);

  // Deviation codes for navigation
  const deviationCodes = useMemo(() => Object.entries(vorschlaegeMap).filter(([, v]) => v.zustand === "abweichung").map(([code]) => code), [vorschlaegeMap]);

  // Global field index: fieldCode → { bereichCode, itemCode }, in seed order.
  const fieldIndex = useMemo(() => {
    const idx = new Map<string, { bereichCode: string; itemCode: string }>();
    const order: string[] = [];
    for (const b of interraiHcSchweiz.bereiche) {
      for (const f of getInputFieldsForBereich(b.code)) {
        idx.set(f.code, { bereichCode: f.bereichCode, itemCode: f.parentItemCode });
        order.push(f.code);
      }
    }
    return { idx, order };
  }, []);

  // Item card to scroll to after a bereich switch (deviation jump / entry scroll).
  const pendingScrollItemRef = useRef<string | null>(null);

  // Scroll to the field's item card, switching bereich first if it lives elsewhere.
  const scrollToField = useCallback((code: string) => {
    const entry = fieldIndex.idx.get(code);
    if (!entry) return;
    if (entry.bereichCode !== activeBereich) {
      pendingScrollItemRef.current = entry.itemCode;
      setActiveBereich(entry.bereichCode);
    } else {
      scrollItemIntoView(contentScrollRef.current, entry.itemCode);
    }
  }, [fieldIndex, activeBereich]);

  // Cross-bereich "next deviation" cursor — walks deviations in seed order.
  const deviationNavRef = useRef(0);
  const goToNextDeviation = useCallback(() => {
    const sorted = fieldIndex.order.filter((c) => deviationCodes.includes(c));
    if (sorted.length === 0) return;
    const i = deviationNavRef.current % sorted.length;
    deviationNavRef.current = (i + 1) % sorted.length;
    scrollToField(sorted[i]);
  }, [fieldIndex, deviationCodes, scrollToField]);

  // Active evidence segment — when a user clicks on evidence, highlight all fields from that segment
  const [activeEvidenceSegId, setActiveEvidenceSegId] = useState<string | null>(null);

  // Confirm a suggestion — wraps store call and refreshes local answers
  const handleConfirmVorschlag = useCallback((code: string, wert?: string) => {
    if (!assessmentId || isReadOnly) return;
    const priorManual = getAssessment(assessmentId)?.answers[code] ?? null;
    confirmVorschlag(assessmentId, code, "Sandra Weber", wert, priorManual);
    const updated = getAssessment(assessmentId);
    if (updated) setAnswers({ ...updated.answers });
  }, [assessmentId, isReadOnly]);

  // Auto-assign conversation evidence to gestützt fields (manual value matches suggestion)
  useEffect(() => {
    if (!assessment?.vorschlaegeVerfuegbar || !assessmentId || isReadOnly) return;
    for (const [code, v] of Object.entries(assessment.vorschlaege)) {
      const cur = answers[code];
      if (cur != null && cur !== "" && cur === v.vorpigeschlagenerWert) {
        confirmVorschlag(assessmentId, code, "Sandra Weber", cur);
      }
    }
    const updated = getAssessment(assessmentId);
    if (updated) setAnswers({ ...updated.answers });
  }, [assessment?.vorschlaegeVerfuegbar]); // Only run once when suggestions become available

  /**
   * Set an answer with side-effect handling:
   * - Toggle: clicking already-selected clears it (§1.4)
   * - Skip-logic: if the answer causes fields to be skipped that already have
   *   values, prompt for confirmation before clearing them
   * - Attachments: if a parent sub-item switches away from Ja, clear its
   *   attachment fields and notify the user
   */
  const setAnswer = useCallback((code: string, value: string) => {
    if (isReadOnly) return;
    // Close legend dropdown when user interacts with an answer field
    setLegendDropdownOpen(false);
    setAnswers((prev) => {
      const hasOpenSuggestion = !!assessment?.vorschlaege[code];
      // With an open suggestion, a click DECIDES the field (confirm this value)
      // — even clicking the current value keeps it and resolves the deviation.
      // Without a suggestion, clicking the selected value clears it (§1.4 toggle).
      const priorManual = prev[code] ?? null;
      const newVal = hasOpenSuggestion ? value : (prev[code] === value ? null : value);
      const next = { ...prev, [code]: newVal };

      // Auto-confirm suggestion if user interacts with a field that has one.
      // priorManual preserves any manually-entered value replaced by this decision.
      if (newVal != null && assessmentId && hasOpenSuggestion) {
        setTimeout(() => confirmVorschlag(assessmentId!, code, "Sandra Weber", newVal, priorManual), 0);
      }

      // Check skip-logic side effects
      const oldSkip = evaluateSkipLogic(prev);
      const newSkip = evaluateSkipLogic(next);
      const newlySkipped = [...newSkip.skippedItemCodes].filter(c => !oldSkip.skippedItemCodes.has(c));
      const affectedCodes = newlySkipped.filter(c => prev[c] != null && prev[c] !== "");

      if (affectedCodes.length > 0 && newVal !== null) {
        // Defer: show confirmation dialog
        setPendingSkipClear({ code, value, affectedCodes, affectedCount: affectedCodes.length });
        return prev; // Don't apply yet
      }

      // Check attachment clearing: if a sub-item with attachments goes to non-Ja
      const subEntry = interraiHcSchweiz.bereiche.flatMap(b => b.items).flatMap(i => i.subItems ?? []).find(s => s.code === code);
      if (subEntry?.attachments && subEntry.attachments.length > 0) {
        const isJa = newVal === "1"; // code "1" = Ja in the seed
        if (!isJa) {
          let cleared = 0;
          for (const att of subEntry.attachments) {
            if (next[att.code] != null && next[att.code] !== "") {
              next[att.code] = null;
              cleared++;
            }
          }
          if (cleared > 0) {
            // Use setTimeout to avoid setState-in-render warning
            setTimeout(() => alert(`${cleared} Zusatzfeld${cleared > 1 ? "er" : ""} geleert.`), 0);
          }
        }
      }

      // Reset a conditional follow-up value when a different option is chosen —
      // a value must never linger for an option that is no longer selected.
      const itemForFollow = interraiHcSchweiz.bereiche.flatMap(b => b.items).find(i => i.code === code);
      for (const o of itemForFollow?.options ?? []) {
        if (o.followUp && newVal !== o.code && next[o.followUp.code] != null && next[o.followUp.code] !== "") {
          next[o.followUp.code] = null;
        }
      }

      return next;
    });
  }, []);

  /** Confirm skip-clear: apply the pending answer and clear affected fields */
  const confirmSkipClear = useCallback(() => {
    if (!pendingSkipClear) return;
    setAnswers(prev => {
      const next = { ...prev, [pendingSkipClear.code]: pendingSkipClear.value === prev[pendingSkipClear.code] ? null : pendingSkipClear.value };
      for (const c of pendingSkipClear.affectedCodes) {
        next[c] = null;
      }
      return next;
    });
    setPendingSkipClear(null);
  }, [pendingSkipClear]);

  const cancelSkipClear = useCallback(() => {
    setPendingSkipClear(null);
  }, []);

  // Sync answers back to store whenever they change (survives navigation)
  useEffect(() => {
    if (assessmentId) {
      updateAssessmentAnswers(assessmentId, answers);
    }
  }, [answers, assessmentId]);

  /** Callback from IntersectionObserver in matrix renderers: update which item's
   *  legend should appear in the sticky bar hint. Clears the dropdown when
   *  the active item changes. */
  const setActiveLegendItem = useCallback((code: string | null) => {
    setLegendHintItem(prev => {
      if (prev !== code) setLegendDropdownOpen(false);
      return code;
    });
  }, []);

  const skipResult = evaluateSkipLogic(answers);
  const bereich = interraiHcSchweiz.bereiche.find(
    (b) => b.code === activeBereich
  )!;

  // Progress per bereich, taking skip logic into account (§4.5)
  const allStats = getInputFieldStats();
  const progressPerBereich = allStats.perBereich.map((b) => {
    const fields = getInputFieldsForBereich(b.code);
    const active = fields.filter((f) => !skipResult.skippedItemCodes.has(f.code));
    const filled = active.filter(
      (f) => answers[f.code] != null && answers[f.code] !== ""
    );
    return {
      code: b.code,
      title: b.title,
      total: active.length,
      filled: filled.length,
      open: active.length - filled.length,
      skipped: skipResult.skippedBereichCodes.has(b.code),
    };
  });
  const totalOpen = progressPerBereich.reduce((s, b) => s + b.open, 0);
  const totalFilled = progressPerBereich.reduce((s, b) => s + b.filled, 0);
  const totalActive = progressPerBereich.reduce((s, b) => s + b.total, 0);
  const activeBereichStats = progressPerBereich.find(
    (b) => b.code === activeBereich
  );

  // Reset content scroll position when the active bereich changes — unless a
  // targeted scroll (deviation jump / entry) is pending for the new bereich.
  useEffect(() => {
    if (pendingScrollItemRef.current) return;
    contentScrollRef.current?.scrollTo(0, 0);
  }, [activeBereich]);

  // Apply a pending targeted scroll once the new bereich has rendered.
  useEffect(() => {
    const itemCode = pendingScrollItemRef.current;
    if (!itemCode) return;
    pendingScrollItemRef.current = null;
    requestAnimationFrame(() => scrollItemIntoView(contentScrollRef.current, itemCode));
  }, [activeBereich]);

  // Entry from the Abklärungszeile: position on the first unconfirmed suggestion.
  const didEntryScrollRef = useRef(false);
  useEffect(() => {
    if (didEntryScrollRef.current) return;
    if (!searchParams.get("scrollToSuggestion")) return;
    if (!assessment?.vorschlaegeVerfuegbar) return;
    const first = fieldIndex.order.find((c) => {
      const v = vorschlaegeMap[c];
      return v && v.zustand !== "gestuetzt";
    });
    if (!first) return;
    didEntryScrollRef.current = true;
    scrollToField(first);
  }, [assessment?.vorschlaegeVerfuegbar, vorschlaegeMap, searchParams, fieldIndex, scrollToField]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        background: "var(--bg-app, #f5f5f7)",
      }}
    >
      {/* Compact header: return button + certification warning + person + instrument + progress */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "7px 20px",
          background: "var(--bg-elevated)",
          borderBottom: "0.5px solid var(--border-default)",
          flexShrink: 0,
          flexWrap: "wrap",
        }}
      >
        {/* Return button — always visible, navigates to the origin (or fallback) */}
        <button
          type="button"
          onClick={() => navigate(returnZiel)}
          style={{
            display: "flex", alignItems: "center", gap: 4,
            padding: "3px 10px", borderRadius: 6,
            background: "transparent", border: "0.5px solid var(--border-default)",
            fontSize: 12, color: "var(--text-secondary)", cursor: "pointer",
            fontFamily: "inherit", flexShrink: 0,
          }}
        >
          <ArrowLeft style={{ width: 13, height: 13 }} />
          <span>{returnLabel}</span>
        </button>
        {person && (
          <>
            <span style={{ color: "var(--border-default)", fontSize: 14 }}>·</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>
              {person.vorname} {person.nachname}
            </span>
            <span style={{
              fontSize: 10, fontWeight: 500, padding: "1px 6px", borderRadius: 4,
              background: person.zustand === "patient" ? "var(--status-success-bg, #e6f4ea)" : "var(--status-warning-bg, #fef7e0)",
              color: person.zustand === "patient" ? "var(--status-success-text, #1a7f37)" : "var(--status-warning-text, #9a6700)",
            }}>
              {person.zustand === "patient" ? "Patient" : "Mandat"}
            </span>
          </>
        )}
        <span style={{ color: "var(--border-default)", fontSize: 14 }}>·</span>
        {!MODUL_ZERTIFIZIERUNG.interraiCertified && (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                color: "var(--status-warning-text)",
                fontSize: 12,
              }}
            >
              <AlertTriangle
                style={{ width: 13, height: 13, flexShrink: 0 }}
              />
              <span>Nicht zertifizierte Vorabversion</span>
            </div>
            <span style={{ color: "var(--border-default)", fontSize: 14 }}>
              ·
            </span>
          </>
        )}
        <span
          style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}
        >
          interRAI HC Schweiz
        </span>
        <span style={{ color: "var(--border-default)", fontSize: 14 }}>·</span>
        <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
          {interraiHcSchweiz.defaultBeobachtungsperiode}
        </span>
        <span style={{ color: "var(--border-default)", fontSize: 14 }}>·</span>
        <span
          style={{
            fontSize: 12,
            color:
              totalOpen === 0
                ? "var(--status-success)"
                : "var(--text-secondary)",
          }}
        >
          {totalOpen > 0 ? <>{totalOpen} offen</> : <>Vollständig</>}
        </span>
        {totalActive > 0 && (
          <>
            <span style={{ color: "var(--border-default)", fontSize: 14 }}>
              ·
            </span>
            <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
              {totalFilled}/{totalActive}
            </span>
          </>
        )}
        {/* Deviation navigation — jumps to the next deviation across bereiche,
            positioning the content on the affected field (not the bereich top). */}
        {deviationCodes.length > 0 && (
          <>
            <span style={{ color: "var(--border-default)", fontSize: 14 }}>·</span>
            <button
              type="button"
              onClick={goToNextDeviation}
              title="Zur nächsten Abweichung springen"
              style={{
                display: "flex", alignItems: "center", gap: 4,
                fontSize: 12, fontWeight: 500,
                color: "var(--status-warning-text)",
                background: "none", border: "none", cursor: "pointer",
                fontFamily: "inherit", padding: 0,
              }}
            >
              {deviationCodes.length} {deviationCodes.length === 1 ? "Abweichung" : "Abweichungen"}
              <ArrowLeft style={{ width: 12, height: 12, transform: "rotate(180deg)" }} />
            </button>
          </>
        )}
        {/* Spacer + right-aligned items */}
        <span style={{ flex: 1 }} />
        {/* Last-edited hint — no save button, state is continuously synced */}
        {assessment && !isReadOnly && (
          <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
            Zuletzt bearbeitet: {formatDateTime(assessment.zuletztBearbeitetAm)}
          </span>
        )}
        {/* Completed banner */}
        {assessment && isReadOnly && (
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--status-success-text, #1a7f37)" }}>
            <Check style={{ width: 12, height: 12 }} />
            Abgeschlossen {assessment.abgeschlossenAm ? formatDateTime(assessment.abgeschlossenAm) : ""} · {assessment.abgeschlossenVon ?? ""}
          </span>
        )}
        {/* Completion action */}
        {assessment && !isReadOnly && (
          <button
            type="button"
            onClick={() => setAbschlussDialogOpen(true)}
            style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "3px 12px", borderRadius: 6, marginLeft: 8,
              background: "var(--brand-primary)", color: "#fff",
              border: "none", fontSize: 12, fontWeight: 500,
              cursor: "pointer", fontFamily: "inherit", flexShrink: 0,
            }}
          >
            Abschliessen
          </button>
        )}
      </div>

      {/* Evidence popover — floating panel below the header */}
      {activeEvidenceSegId && (() => {
        const evidenceSeg = gespraechSegments.get(activeEvidenceSegId);
        if (!evidenceSeg) return null;
        // All field codes derived from this segment — unconfirmed suggestions
        // AND already-confirmed answers, so the trace stays complete after
        // confirmation.
        const relatedFields = [
          ...Object.entries(vorschlaegeMap)
            .filter(([, v]) => v.segId === activeEvidenceSegId)
            .map(([code, v]) => ({
              code, zustand: v.zustand,
              vorschlag: v.wert as string | null,
              vorherManuell: null as string | null,
              geltend: (answers[code] ?? null) as string | null,
            })),
          ...Object.entries(bestaetigungenSegMap)
            .filter(([code, seg]) => seg === activeEvidenceSegId && !vorschlaegeMap[code])
            .map(([code]) => {
              const b = assessment?.bestaetigungen[code];
              return {
                code, zustand: "bestaetigt" as string,
                vorschlag: (b?.originalVorschlag ?? null) as string | null,
                vorherManuell: (b?.manuellerVorwert ?? null) as string | null,
                geltend: (answers[code] ?? null) as string | null,
              };
            }),
        ];
        const sprecherLabel = evidenceSeg.sprecher === "pfk" ? "Pflegefachkraft" : evidenceSeg.sprecher === "klient" ? "Klient" : "Angehörige";
        return (
          <div
            style={{
              position: "relative", zIndex: 30,
              padding: "10px 20px",
              background: "var(--bg-elevated)",
              borderBottom: "1px solid var(--brand-accent, #47AED1)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginBottom: 4 }}>
                  🎤 {evidenceSeg.zeitmarke} · {sprecherLabel} ({evidenceSeg.sprecherName})
                </div>
                <div style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.5, fontStyle: "italic" }}>
                  &laquo;{evidenceSeg.text}&raquo;
                </div>
                {relatedFields.length > 0 && (
                  <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
                    {relatedFields.map(f => (
                      <div key={f.code} style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                        <span style={{
                          fontSize: 11, fontFamily: "monospace", fontWeight: 600, padding: "1px 6px", borderRadius: 4,
                          background: f.zustand === "abweichung" ? "var(--status-warning-bg)" : "rgba(71, 174, 209, 0.1)",
                          color: f.zustand === "abweichung" ? "var(--status-warning-text)" : "var(--brand-accent, #47AED1)",
                        }}>
                          {f.code}
                        </span>
                        {f.vorschlag != null && f.vorschlag !== "" && (
                          <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                            Vorschlag: <b style={{ fontFamily: "monospace", color: "var(--text-primary)" }}>{f.vorschlag}</b>
                          </span>
                        )}
                        {f.vorherManuell != null && f.vorherManuell !== "" && (
                          <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                            vorher erfasst: <b style={{ fontFamily: "monospace", color: "var(--text-primary)" }}>{f.vorherManuell}</b>
                          </span>
                        )}
                        {f.geltend != null && f.geltend !== "" && (
                          <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                            geltend: <b style={{ fontFamily: "monospace", color: "var(--text-primary)" }}>{f.geltend}</b>
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setActiveEvidenceSegId(null)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: 16, color: "var(--text-tertiary)", padding: 4, lineHeight: 1,
                  fontFamily: "inherit",
                }}
                aria-label="Beleg schliessen"
              >
                ×
              </button>
            </div>
          </div>
        );
      })()}

      {/* Main split: left nav + right content */}
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* Left navigation — bereich list with progress indicators */}
        <nav
          style={{
            width: 256,
            flexShrink: 0,
            overflowY: "auto",
            borderRight: "0.5px solid var(--border-default)",
            background: "var(--bg-elevated)",
            padding: "6px 0",
          }}
        >
          {progressPerBereich.map((b) => {
            const isActive = b.code === activeBereich;
            const isSkipped = b.skipped;
            // Compute suggestion/deviation indicators for this bereich
            const navSuggestionCount = Object.entries(vorschlaegeMap).filter(([code, v]) => {
              const bItems = interraiHcSchweiz.bereiche.find(be => be.code === b.code)?.items ?? [];
              return v.zustand === "neuer_wert" && bItems.some(item => item.code === code || code.startsWith(item.code) || item.subItems?.some(s => s.code === code || code.startsWith(s.code)));
            }).length;
            const navDeviationCount = Object.entries(vorschlaegeMap).filter(([code, v]) => {
              const bItems = interraiHcSchweiz.bereiche.find(be => be.code === b.code)?.items ?? [];
              return v.zustand === "abweichung" && bItems.some(item => item.code === code || code.startsWith(item.code) || item.subItems?.some(s => s.code === code || code.startsWith(s.code)));
            }).length;
            return (
              <button
                key={b.code}
                type="button"
                onClick={() =>
                  !isSkipped && (setActiveBereich(b.code), setLegendDropdownOpen(false), setLegendHintItem(null))
                }
                disabled={isSkipped}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                  padding: "7px 14px",
                  background: isActive
                    ? "var(--brand-primary-light, #e8f0fe)"
                    : "transparent",
                  color: isSkipped
                    ? "var(--text-tertiary)"
                    : isActive
                    ? "var(--brand-primary)"
                    : "var(--text-primary)",
                  opacity: isSkipped ? 0.45 : 1,
                  cursor: isSkipped ? "not-allowed" : "pointer",
                  border: "none",
                  borderLeft: isActive
                    ? "2px solid var(--brand-primary)"
                    : "2px solid transparent",
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 400,
                  textDecoration: isSkipped ? "line-through" : "none",
                  fontFamily: "inherit",
                  textAlign: "left",
                }}
              >
                <span
                  style={{
                    fontFamily: "monospace",
                    fontWeight: 700,
                    fontSize: 11,
                    minWidth: 22,
                    color: isActive
                      ? "var(--brand-primary)"
                      : "var(--text-tertiary)",
                  }}
                >
                  {b.code}
                </span>
                <span
                  style={{
                    flex: 1,
                    lineHeight: 1.3,
                    wordBreak: "break-word",
                  }}
                >
                  {b.title}
                </span>
                {isSkipped ? (
                  <SkipForward
                    style={{
                      width: 12,
                      height: 12,
                      flexShrink: 0,
                      color: "var(--text-tertiary)",
                    }}
                  />
                ) : b.open === 0 && b.total > 0 ? (
                  <Check
                    style={{
                      width: 12,
                      height: 12,
                      color: "var(--status-success)",
                      flexShrink: 0,
                    }}
                  />
                ) : b.open > 0 ? (
                  <span
                    style={{
                      fontSize: 11,
                      color: isActive
                        ? "var(--brand-primary)"
                        : "var(--text-tertiary)",
                      flexShrink: 0,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {b.open}
                  </span>
                ) : null}
                {/* Suggestion/deviation indicator dots */}
                {navDeviationCount > 0 && (
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--status-warning-text)", flexShrink: 0 }} title={`${navDeviationCount} Abweichungen`} />
                )}
                {navDeviationCount === 0 && navSuggestionCount > 0 && (
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--brand-accent, #47AED1)", flexShrink: 0 }} title={`${navSuggestionCount} Vorschläge`} />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right content panel — sole scrollable region for items */}
        <div
          ref={contentScrollRef}
          style={{
            flex: 1,
            overflowY: "auto",
            minWidth: 0,
          }}
        >
          {/* Bereich bar + legend dropdown — sticky at the top of the
              content scroll region so they remain visible at all times */}
          <div
            style={{
              position: "sticky",
              top: 0,
              zIndex: 20,
            }}
          >
              {/* Slim bar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "5px 28px",
                  background: "var(--bg-elevated)",
                  borderBottom: (legendHintItem && bereich.items.find(i => i.code === legendHintItem)?.options && getMatrixDisplayMode(legendHintItem) === "legend")
                    ? "none"
                    : "0.5px solid var(--border-default)",
                  fontSize: 12,
                  color: "var(--text-secondary)",
                }}
              >
                <span
                  style={{
                    fontFamily: "monospace",
                    fontWeight: 700,
                    color: "var(--brand-primary)",
                  }}
                >
                  {activeBereich}
                </span>
                <span>{bereich.title}</span>
                {activeBereichStats && activeBereichStats.open > 0 && (
                  <>
                    <span style={{ color: "var(--border-default)" }}>·</span>
                    <span style={{ color: "var(--text-tertiary)" }}>
                      {activeBereichStats.open} offen
                    </span>
                  </>
                )}
                {activeBereichStats &&
                  activeBereichStats.open === 0 &&
                  activeBereichStats.total > 0 && (
                    <>
                      <span style={{ color: "var(--border-default)" }}>·</span>
                      <Check
                        style={{
                          width: 12,
                          height: 12,
                          color: "var(--status-success)",
                        }}
                      />
                    </>
                  )}
              </div>

              {/* Sticky legend — appears automatically once the item's own
                  legend has scrolled out of view (legendHintItem), and drops
                  away when the item is left. Compact layout so it never takes
                  more than ~1/3 of the visible height; text is never truncated.
                  The item observer guarantees only the current item's legend
                  shows, never a foreign item's. */}
              {legendHintItem && (() => {
                const legendItem = bereich.items.find(i => i.code === legendHintItem);
                if (!legendItem?.options || getMatrixDisplayMode(legendItem.code) !== "legend") return null;
                return (
                  <div style={{
                    // Overlay (out of flow) so appearing/disappearing never shifts
                    // the item content — otherwise the observer would oscillate.
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    zIndex: 19,
                    padding: "6px 28px 8px",
                    background: "var(--bg-secondary)",
                    borderBottom: "1px solid var(--border-default)",
                    boxShadow: "0 3px 6px rgba(0,0,0,0.06)",
                  }}>
                    <LegendBlock options={legendItem.options} compact />
                  </div>
                );
              })()}
          </div>

          <div style={{ padding: "24px 32px 80px", maxWidth: 1040, boxSizing: "border-box" }}>
            {skipResult.skippedBereichCodes.has(activeBereich) ? (
              <div
                style={{
                  padding: 40,
                  textAlign: "center",
                  color: "var(--text-tertiary)",
                  fontSize: 14,
                }}
              >
                Bereich {activeBereich} wird aufgrund der Antworten in einem
                vorhergehenden Bereich übersprungen.
              </div>
            ) : (
              <BereichRenderer
                bereich={bereich}
                answers={answers}
                skippedItems={skipResult.skippedItemCodes}
                onAnswer={setAnswer}
                indivPraezText={indivPraez[bereich.code] ?? ""}
                onIndivPraez={(text) =>
                  setIndivPraez((prev) => ({
                    ...prev,
                    [bereich.code]: text,
                  }))
                }
                defaultPeriode={interraiHcSchweiz.defaultBeobachtungsperiode}
                onActiveLegendItem={setActiveLegendItem}
                vorschlaegeMap={vorschlaegeMap}
                onConfirmVorschlag={handleConfirmVorschlag}
                gespraechSegments={gespraechSegments}
                activeEvidenceSegId={activeEvidenceSegId}
                onEvidenceClick={setActiveEvidenceSegId}
                bestaetigungenSegMap={bestaetigungenSegMap}
              />
            )}
          </div>
        </div>
      </div>

      {/* Skip-clear confirmation dialog */}
      {pendingSkipClear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div style={{ background: "var(--bg-elevated)", borderRadius: 12, padding: "20px 24px", maxWidth: 440, width: "90%" }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)", marginBottom: 8 }}>Erfasste Antworten löschen?</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 16 }}>
              Diese Antwort überspringt Felder, in denen bereits {pendingSkipClear.affectedCount} {pendingSkipClear.affectedCount === 1 ? "Antwort" : "Antworten"} erfasst {pendingSkipClear.affectedCount === 1 ? "ist" : "sind"}.
              Übersprungene Felder dürfen keine Antworten enthalten und werden geleert.
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={cancelSkipClear} style={{ padding: "8px 16px", borderRadius: 8, border: "0.5px solid var(--border-default)", background: "var(--bg-elevated)", fontSize: 13, cursor: "pointer", fontFamily: "inherit", color: "var(--text-primary)" }}>Abbrechen</button>
              <button onClick={confirmSkipClear} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "var(--status-danger)", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>Antworten löschen</button>
            </div>
          </div>
        </div>
      )}

      {/* Completion overview dialog */}
      {abschlussDialogOpen && assessment && (() => {
        const ungepruefte = Object.keys(assessment.vorschlaege).length;
        const currentUser = "Sandra Weber";
        const s1Current = answers["S1"] || "";
        const s2aCurrent = answers["S2a"] || "";
        const s2bCurrent = answers["S2b"] || "";
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }}>
            <div style={{ background: "var(--bg-elevated)", borderRadius: 12, padding: "20px 24px", maxWidth: 480, width: "90%" }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 12 }}>Assessment abschliessen</div>

              {/* Status overview */}
              <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 16 }}>
                <div>{totalOpen} offene Eingabefelder (von {totalActive} aktiven)</div>
                {ungepruefte > 0 && (
                  <div style={{ color: "var(--status-warning-text)", marginTop: 4 }}>
                    {ungepruefte} ungeprüfte Vorschläge — verfallen mit dem Abschluss und gehen nicht in das Assessment ein.
                  </div>
                )}
                {isRecordingThisPerson && (
                  <div style={{ color: "var(--status-danger)", marginTop: 4 }}>
                    Es läuft eine Aufzeichnung für diese Person. Deren Ergebnisse verfallen mit dem Abschluss.
                  </div>
                )}
              </div>

              {/* S1/S2 fields */}
              <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 16, padding: "10px 12px", background: "var(--bg-secondary)", borderRadius: 8 }}>
                <div style={{ marginBottom: 4 }}>
                  <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>S1</span> Evaluiert von: {s1Current || currentUser}
                  {!s1Current && <span style={{ fontSize: 10, color: "var(--text-tertiary)" }}> (wird gesetzt)</span>}
                </div>
                <div style={{ marginBottom: 4 }}>
                  <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>S2a</span> Abgeschlossen von: {s2aCurrent || currentUser}
                  {!s2aCurrent && <span style={{ fontSize: 10, color: "var(--text-tertiary)" }}> (wird gesetzt)</span>}
                </div>
                <div>
                  <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>S2b</span> Datum: {s2bCurrent || new Date().toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit", year: "numeric" })}
                  {!s2bCurrent && <span style={{ fontSize: 10, color: "var(--text-tertiary)" }}> (wird gesetzt)</span>}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button onClick={() => setAbschlussDialogOpen(false)} style={{ padding: "8px 16px", borderRadius: 8, border: "0.5px solid var(--border-default)", background: "var(--bg-elevated)", fontSize: 13, cursor: "pointer", fontFamily: "inherit", color: "var(--text-primary)" }}>Abbrechen</button>
                <button onClick={() => {
                  if (!assessmentId) return;
                  // Sync current answers to store before completing
                  updateAssessmentAnswers(assessmentId, answers);
                  abschliessenAssessment(assessmentId, "Sandra Weber");
                  setAbschlussDialogOpen(false);
                  // Reload answers from store (now includes S1/S2)
                  const updated = getAssessment(assessmentId);
                  if (updated) setAnswers({ ...updated.answers });
                }} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "var(--brand-primary)", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>Abschliessen</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ─── Bereich renderer ────────────────────────────────────────────────────────

function BereichRenderer({
  bereich,
  answers,
  skippedItems,
  onAnswer,
  indivPraezText,
  onIndivPraez,
  defaultPeriode,
  onActiveLegendItem,
  vorschlaegeMap,
  onConfirmVorschlag,
  gespraechSegments,
  activeEvidenceSegId,
  onEvidenceClick,
  bestaetigungenSegMap,
}: {
  bereich: Bereich;
  answers: Answers;
  skippedItems: Set<string>;
  onAnswer: (code: string, value: string) => void;
  indivPraezText: string;
  onIndivPraez: (text: string) => void;
  defaultPeriode: string;
  onActiveLegendItem?: (code: string | null) => void;
  vorschlaegeMap: Record<string, { wert: string; segId: string; zustand: "neuer_wert" | "abweichung" | "gestuetzt" }>;
  onConfirmVorschlag: (code: string, wert?: string) => void;
  gespraechSegments: Map<string, GespraechAbschnitt>;
  activeEvidenceSegId: string | null;
  onEvidenceClick: (segId: string | null) => void;
  bestaetigungenSegMap: Record<string, string>;
}) {
  // Compute per-bereich suggestion counts
  const bereichSuggestionCounts = useMemo(() => {
    let neuerWert = 0;
    let abweichung = 0;
    let gestuetzt = 0;
    for (const [code, v] of Object.entries(vorschlaegeMap)) {
      // Match field codes that belong to items in this bereich
      const belongsToBereich = bereich.items.some(item => {
        if (item.code === code) return true;
        if (item.subItems?.some(s => s.code === code || code.startsWith(s.code))) return true;
        return code.startsWith(item.code);
      });
      if (!belongsToBereich) continue;
      if (v.zustand === "neuer_wert") neuerWert++;
      else if (v.zustand === "abweichung") abweichung++;
      else gestuetzt++;
    }
    return { neuerWert, abweichung, gestuetzt, total: neuerWert + abweichung };
  }, [vorschlaegeMap, bereich.items]);

  // Confirm all neuer_wert suggestions in this bereich
  const handleConfirmAllNeuerWert = useCallback(() => {
    for (const [code, v] of Object.entries(vorschlaegeMap)) {
      if (v.zustand !== "neuer_wert") continue;
      const belongsToBereich = bereich.items.some(item => {
        if (item.code === code) return true;
        if (item.subItems?.some(s => s.code === code || code.startsWith(s.code))) return true;
        return code.startsWith(item.code);
      });
      if (belongsToBereich) {
        onConfirmVorschlag(code, v.wert);
      }
    }
  }, [vorschlaegeMap, bereich.items, onConfirmVorschlag]);

  return (
    <div>
      {/* Bereich heading */}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{ display: "flex", alignItems: "baseline", gap: 10 }}
        >
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 18,
              fontWeight: 700,
              color: "var(--brand-primary)",
            }}
          >
            {bereich.code}
          </span>
          <span
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            {bereich.title}
          </span>
          {/* Suggestion counts for this bereich */}
          {bereichSuggestionCounts.total > 0 && (
            <>
              <span style={{ fontSize: 12, color: "var(--brand-accent, #47AED1)", fontWeight: 500, marginLeft: 4 }}>
                {bereichSuggestionCounts.neuerWert > 0 && `${bereichSuggestionCounts.neuerWert} Vorschläge`}
                {bereichSuggestionCounts.neuerWert > 0 && bereichSuggestionCounts.abweichung > 0 && " · "}
                {bereichSuggestionCounts.abweichung > 0 && (
                  <span style={{ color: "var(--status-warning-text)" }}>{bereichSuggestionCounts.abweichung} Abweichungen</span>
                )}
              </span>
              {bereichSuggestionCounts.neuerWert > 0 && (
                <button
                  type="button"
                  onClick={handleConfirmAllNeuerWert}
                  style={{
                    fontSize: 11, color: "var(--brand-accent, #47AED1)",
                    background: "none", border: "0.5px solid var(--brand-accent, #47AED1)",
                    borderRadius: 4, padding: "2px 8px", cursor: "pointer",
                    fontFamily: "inherit", marginLeft: 4,
                  }}
                >
                  Vorschläge übernehmen
                </button>
              )}
            </>
          )}
        </div>
        <div
          style={{
            height: 1,
            background: "var(--border-default)",
            marginTop: 10,
          }}
        />
      </div>

      {/* Item list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        {bereich.items.map((item) => {
          if (skippedItems.has(item.code)) return null;
          return (
            <div key={item.code} data-item={item.code}>
              <ItemRenderer
                item={item}
                answers={answers}
                skippedItems={skippedItems}
                onAnswer={onAnswer}
                defaultPeriode={defaultPeriode}
                onActiveLegendItem={onActiveLegendItem}
                vorschlaegeMap={vorschlaegeMap}
                onConfirmVorschlag={onConfirmVorschlag}
                gespraechSegments={gespraechSegments}
                activeEvidenceSegId={activeEvidenceSegId}
                onEvidenceClick={onEvidenceClick}
                bestaetigungenSegMap={bestaetigungenSegMap}
              />
            </div>
          );
        })}
      </div>

      {/* Individuelle Präzisierungen (§4.3) — shown when bereich has the flag */}
      {(bereich as any).individuellePraezisierungen && (
        <div
          style={{
            marginTop: 32,
            paddingTop: 24,
            borderTop: "0.5px solid var(--border-default)",
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "var(--text-primary)",
              marginBottom: 8,
            }}
          >
            Individuelle Präzisierungen
          </div>
          <textarea
            value={indivPraezText}
            onChange={(e) => onIndivPraez(e.target.value)}
            placeholder="Abklärungs- und pflegerelevante Zusatzinformationen…"
            rows={4}
            style={{
              width: "100%",
              padding: "10px 14px",
              fontSize: 13,
              lineHeight: 1.5,
              borderRadius: 8,
              border: "0.5px solid var(--border-default)",
              background: "var(--bg-elevated)",
              color: "var(--text-primary)",
              fontFamily: "inherit",
              resize: "vertical",
              boxSizing: "border-box",
            }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Item renderer (dispatches to composite type) ────────────────────────────

function ItemRenderer({
  item,
  answers,
  skippedItems,
  onAnswer,
  defaultPeriode,
  onActiveLegendItem,
  vorschlaegeMap,
  onConfirmVorschlag,
  gespraechSegments,
  activeEvidenceSegId,
  onEvidenceClick,
  bestaetigungenSegMap,
}: {
  item: Item;
  answers: Answers;
  skippedItems: Set<string>;
  onAnswer: (code: string, value: string) => void;
  defaultPeriode: string;
  onActiveLegendItem?: (code: string | null) => void;
  vorschlaegeMap: Record<string, { wert: string; segId: string; zustand: "neuer_wert" | "abweichung" | "gestuetzt" }>;
  onConfirmVorschlag: (code: string, wert?: string) => void;
  gespraechSegments: Map<string, GespraechAbschnitt>;
  activeEvidenceSegId: string | null;
  onEvidenceClick: (segId: string | null) => void;
  bestaetigungenSegMap: Record<string, string>;
}) {
  // getCompositeType throws for unrecognized seed patterns; catch here so a
  // single bad item does not break the entire bereich.
  let compositeType: ReturnType<typeof getCompositeType>;
  try {
    compositeType = getCompositeType(item.code);
  } catch {
    compositeType = "simple";
  }
  const [contextOpen, setContextOpen] = useState(false);

  // Context panel (§4.1): only show info icon when item has enrichment fields.
  // The seed currently uses ziel/definition/vorgehen/hinweis/beispiele.
  const itemAny = item as any;
  const hasContext = !!(
    itemAny.ziel ||
    itemAny.definition ||
    itemAny.vorgehen ||
    itemAny.hinweis ||
    (itemAny.beispiele && itemAny.beispiele.length > 0)
  );

  // Observation period badge (§4.2): only shown when it differs from default.
  const abwPeriode =
    item.beobachtungsperiode &&
    item.beobachtungsperiode !== defaultPeriode
      ? item.beobachtungsperiode
      : null;

  return (
    <div
      style={{
        background: "var(--bg-elevated)",
        borderRadius: 10,
        border: "0.5px solid var(--border-default)",
        overflow: "hidden",
      }}
    >
      {/* Item header: code + label + optional period badge + info button */}
      <div
        style={{
          padding: "14px 16px 10px",
          display: "flex",
          alignItems: "flex-start",
          gap: 8,
          borderBottom: "0.5px solid var(--border-default)",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 11,
                fontWeight: 700,
                color: "var(--text-tertiary)",
              }}
            >
              {item.code}
            </span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "var(--text-primary)",
              }}
            >
              {item.label}
            </span>
            {abwPeriode && <PeriodBadge period={abwPeriode} />}
          </div>
          {/* Italic instruction line (§2, layout-vorgabe) — own max-width so the
              lines do not run too long across the full card width. */}
          {item.instruction && (
            <div
              style={{
                fontSize: 11.5,
                color: "var(--text-secondary)",
                marginTop: 4,
                lineHeight: 1.45,
                fontStyle: "italic",
                maxWidth: 800,
              }}
            >
              {item.instruction}
            </div>
          )}
        </div>

        {/* Info icon — 30×30 touch target (§1.2), only if context data exists */}
        {hasContext && (
          <button
            type="button"
            onClick={() => setContextOpen((o) => !o)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 30,
              height: 30,
              flexShrink: 0,
              background: "none",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              color: contextOpen
                ? "var(--brand-primary)"
                : "var(--text-tertiary)",
            }}
            aria-label="Kontext anzeigen"
          >
            <Info style={{ width: 15, height: 15 }} />
          </button>
        )}
      </div>

      {/* Context panel (§4.1) — collapsed by default */}
      {contextOpen && hasContext && <ContextPanel item={itemAny} />}

      {/* Input area — dispatched by composite type */}
      <div style={{ padding: "14px 16px" }}>
        {compositeType === "simple" && (
          <SimpleItemInput
            item={item}
            value={answers[item.code] ?? null}
            onChange={(v) => onAnswer(item.code, v)}
            answers={answers}
            onAnswer={onAnswer}
            suggestion={vorschlaegeMap[item.code] ?? null}
            onConfirmVorschlag={onConfirmVorschlag}
            gespraechSegments={gespraechSegments}
            activeEvidenceSegId={activeEvidenceSegId}
            onEvidenceClick={onEvidenceClick}
            bestaetigungenSegMap={bestaetigungenSegMap}
          />
        )}
        {compositeType === "matrix" && (
          <MatrixRenderer
            item={item}
            answers={answers}
            skippedItems={skippedItems}
            onAnswer={onAnswer}
            onActiveLegend={onActiveLegendItem}
            vorschlaegeMap={vorschlaegeMap}
            gespraechSegments={gespraechSegments}
            activeEvidenceSegId={activeEvidenceSegId}
            onEvidenceClick={onEvidenceClick}
            bestaetigungenSegMap={bestaetigungenSegMap}
          />
        )}
        {compositeType === "matrix_columns" && (
          <MatrixColumnsRenderer
            item={item}
            answers={answers}
            skippedItems={skippedItems}
            onAnswer={onAnswer}
            onActiveLegend={onActiveLegendItem}
            vorschlaegeMap={vorschlaegeMap}
            gespraechSegments={gespraechSegments}
            activeEvidenceSegId={activeEvidenceSegId}
            onEvidenceClick={onEvidenceClick}
            bestaetigungenSegMap={bestaetigungenSegMap}
          />
        )}
        {compositeType === "stacked" && (
          <StackedRenderer
            item={item}
            answers={answers}
            skippedItems={skippedItems}
            onAnswer={onAnswer}
            vorschlaegeMap={vorschlaegeMap}
            onConfirmVorschlag={onConfirmVorschlag}
            gespraechSegments={gespraechSegments}
            activeEvidenceSegId={activeEvidenceSegId}
            onEvidenceClick={onEvidenceClick}
            bestaetigungenSegMap={bestaetigungenSegMap}
          />
        )}
        {compositeType === "fieldgroup" && (
          <FieldgroupRenderer
            item={item}
            answers={answers}
            onAnswer={onAnswer}
            vorschlaegeMap={vorschlaegeMap}
            onConfirmVorschlag={onConfirmVorschlag}
            gespraechSegments={gespraechSegments}
            activeEvidenceSegId={activeEvidenceSegId}
            onEvidenceClick={onEvidenceClick}
            bestaetigungenSegMap={bestaetigungenSegMap}
          />
        )}
        {compositeType === "mixed_n2" && (
          <MixedN2Renderer
            item={item}
            answers={answers}
            skippedItems={skippedItems}
            onAnswer={onAnswer}
            vorschlaegeMap={vorschlaegeMap}
            onConfirmVorschlag={onConfirmVorschlag}
            gespraechSegments={gespraechSegments}
            activeEvidenceSegId={activeEvidenceSegId}
            onEvidenceClick={onEvidenceClick}
            bestaetigungenSegMap={bestaetigungenSegMap}
          />
        )}
        {compositeType === "repeat_fixed" && (
          <RepeatFixedRenderer
            item={item}
            answers={answers}
            onAnswer={onAnswer}
          />
        )}
        {compositeType === "repeat_dynamic" && (
          <RepeatDynamicRenderer
            item={item}
            answers={answers}
            onAnswer={onAnswer}
          />
        )}
        {/* Legacy fallback for instrument.ts versions that still return old names */}
        {compositeType === ("not_composite" as any) && (
          <SimpleItemInput
            item={item}
            value={answers[item.code] ?? null}
            onChange={(v) => onAnswer(item.code, v)}
            answers={answers}
            onAnswer={onAnswer}
            suggestion={vorschlaegeMap[item.code] ?? null}
            onConfirmVorschlag={onConfirmVorschlag}
            gespraechSegments={gespraechSegments}
            activeEvidenceSegId={activeEvidenceSegId}
            onEvidenceClick={onEvidenceClick}
            bestaetigungenSegMap={bestaetigungenSegMap}
          />
        )}
        {compositeType === ("mixed" as any) && (
          <MixedN2Renderer
            item={item}
            answers={answers}
            skippedItems={skippedItems}
            onAnswer={onAnswer}
            vorschlaegeMap={vorschlaegeMap}
            onConfirmVorschlag={onConfirmVorschlag}
            gespraechSegments={gespraechSegments}
            activeEvidenceSegId={activeEvidenceSegId}
            onEvidenceClick={onEvidenceClick}
            bestaetigungenSegMap={bestaetigungenSegMap}
          />
        )}
      </div>

      {/* Footnote at the bottom of the card (§3.5, I3) */}
      {item.footnote && (
        <div
          style={{
            padding: "8px 16px 12px",
            fontSize: 11.5,
            color: "var(--text-tertiary)",
            fontStyle: "italic",
            borderTop: "0.5px solid var(--border-default)",
          }}
        >
          {item.footnote}
        </div>
      )}
    </div>
  );
}

// ─── Context panel (§4.1) ────────────────────────────────────────────────────

function ContextPanel({ item }: { item: any }) {
  return (
    <div
      style={{
        padding: "12px 16px",
        background: "var(--bg-secondary, #f9fafb)",
        borderBottom: "0.5px solid var(--border-default)",
        fontSize: 12.5,
        color: "var(--text-secondary)",
        lineHeight: 1.6,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {item.ziel && (
        <div>
          <strong style={{ color: "var(--text-primary)" }}>Ziel:</strong>{" "}
          {item.ziel}
        </div>
      )}
      {item.definition && (
        <div>
          <strong style={{ color: "var(--text-primary)" }}>Definition:</strong>{" "}
          {item.definition}
        </div>
      )}
      {item.vorgehen && (
        <div>
          <strong style={{ color: "var(--text-primary)" }}>Vorgehen:</strong>{" "}
          {item.vorgehen}
        </div>
      )}
      {item.hinweis && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 6,
            padding: "8px 10px",
            background: "var(--status-warning-bg)",
            borderRadius: 6,
          }}
        >
          <AlertTriangle
            style={{
              width: 13,
              height: 13,
              color: "var(--status-warning-text)",
              flexShrink: 0,
              marginTop: 2,
            }}
          />
          <span style={{ color: "var(--status-warning-text)" }}>
            {item.hinweis}
          </span>
        </div>
      )}
      {item.beispiele && item.beispiele.length > 0 && (
        <div>
          <strong style={{ color: "var(--text-primary)" }}>Beispiele:</strong>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              marginTop: 6,
            }}
          >
            {item.beispiele.map((bsp: string, i: number) => (
              <div
                key={i}
                style={{
                  padding: "6px 10px",
                  background: "var(--bg-elevated)",
                  borderRadius: 6,
                  fontStyle: "italic",
                  border: "0.5px solid var(--border-default)",
                }}
              >
                {bsp}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Simple item (§3.1) ──────────────────────────────────────────────────────

/**
 * Handles items with no sub-items: single_choice (option rows),
 * text / number / date (input fields), and freeText options (Z2:13).
 *
 * Long option lists (≥8) use the scrollable search variant (§3.6).
 */
/**
 * Which central validation applies to a field, by its (base) code. Kept in the
 * renderer (not the seed) so no new seed fields are introduced; the repeat
 * suffix "#n" is stripped so every I3 diagnosis row is covered.
 */
function validierungFuer(code: string): ValidierungTyp | null {
  const base = code.replace(/#\d+$/, "");
  if (base === "A5a") return "ahvn13";
  if (base === "K1a") return "groesse_cm";
  if (base === "K1b") return "gewicht_kg";
  if (base === "I3.icd") return "icd10";
  return null;
}

/** Codes rendered as a multi-line textarea (prose fields). */
const MEHRZEILIGE_CODES = new Set(["A10"]);

/** Country options for a "land" follow-up — the product's existing list, minus "Andere". */
const LAENDER_OPTIONEN = NATIONALITAETEN.filter((n) => n.value !== "andere");

/**
 * Text field with central validation. Masks input where the type requires it
 * (AHV dots, digit-only), shows a formal error (kept, never auto-corrected) or
 * a non-blocking plausibility hint below, plus an optional standing note.
 */
function ValidiertesFeld({ vtyp, value, onChange, placeholder, breite, hinweis }: {
  vtyp: ValidierungTyp;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  breite?: number;
  hinweis?: string;
}) {
  const numeric = vtyp === "ahvn13" || vtyp === "groesse_cm" || vtyp === "gewicht_kg";
  const mask = (raw: string) =>
    vtyp === "ahvn13" ? maskiereAHV(raw)
    : (vtyp === "groesse_cm" || vtyp === "gewicht_kg") ? maskiereZiffern(raw, 3)
    : raw;
  const res = validiereFeld(vtyp, value ?? "");
  const invalid = res.status === "ungueltig";
  return (
    <div style={{ minWidth: 0 }}>
      <input
        type="text"
        inputMode={numeric ? "numeric" : undefined}
        value={value ?? ""}
        onChange={(e) => onChange(mask(e.target.value))}
        placeholder={placeholder}
        aria-invalid={invalid}
        style={{ ...inputStyle, maxWidth: breite ?? 320, ...(invalid ? { border: "1.5px solid var(--status-danger)" } : {}) }}
      />
      {invalid && (
        <div style={{ fontSize: 11, color: "var(--status-danger)", marginTop: 3 }}>{res.meldung}</div>
      )}
      {res.status === "unplausibel" && (
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--status-warning-text)", marginTop: 3 }}>
          <AlertTriangle style={{ width: 11, height: 11, flexShrink: 0 }} />{res.meldung}
        </div>
      )}
      {hinweis && !invalid && (
        <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 3 }}>{hinweis}</div>
      )}
    </div>
  );
}

function SimpleItemInput({
  item,
  value,
  onChange,
  suggestion,
  onConfirmVorschlag,
  gespraechSegments,
  activeEvidenceSegId,
  onEvidenceClick,
  bestaetigungenSegMap,
  answers,
  onAnswer,
}: {
  item: Item;
  value: string | null;
  onChange: (v: string) => void;
  suggestion?: { wert: string; segId: string; zustand: string } | null;
  onConfirmVorschlag?: (code: string, wert?: string) => void;
  gespraechSegments?: Map<string, GespraechAbschnitt>;
  activeEvidenceSegId?: string | null;
  onEvidenceClick?: (segId: string | null) => void;
  bestaetigungenSegMap?: Record<string, string>;
  answers?: Answers;
  onAnswer?: (code: string, value: string) => void;
}) {
  const options = getEffectiveOptions(item.code);
  const [freeTextValue, setFreeTextValue] = useState("");

  // Confirmed evidence segId for this field (after confirmation, suggestion is gone)
  const confirmedSegId = bestaetigungenSegMap?.[item.code];

  // Conditional follow-up field for the currently selected option (B2/B3).
  const selectedOpt = options.find((o) => o.code === value);
  const followUp = selectedOpt?.followUp ?? null;
  const followUpEl = followUp && onAnswer ? (
    <div style={{ marginTop: 8, marginLeft: 20, paddingLeft: 12, borderLeft: "2px solid var(--border-default)" }}>
      {followUp.kind === "land" ? (
        <div style={{ width: "100%", maxWidth: 320 }}>
          <label style={{ display: "block", fontSize: 12, color: "var(--text-secondary)", marginBottom: 4 }}>{followUp.label}</label>
          <ComboboxPopover
            value={answers?.[followUp.code] || null}
            onChange={(v) => onAnswer(followUp.code, v || "")}
            options={LAENDER_OPTIONEN}
            placeholder="Staat wählen"
          />
        </div>
      ) : (
        <div style={{ width: "100%", maxWidth: 320 }}>
          <label style={{ display: "block", fontSize: 12, color: "var(--text-secondary)", marginBottom: 4 }}>{followUp.label}</label>
          <input
            type="text"
            value={answers?.[followUp.code] ?? ""}
            onChange={(e) => onAnswer(followUp.code, e.target.value)}
            style={{ ...inputStyle, width: "100%", maxWidth: 320 }}
            placeholder="Bitte angeben"
          />
        </div>
      )}
    </div>
  ) : null;

  if (item.answerType === "text") {
    if (MEHRZEILIGE_CODES.has(item.code)) {
      return (
        <textarea
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          placeholder="Freitext"
          style={{ ...inputStyle, maxWidth: 640, minHeight: 76, resize: "vertical", lineHeight: 1.5 }}
        />
      );
    }
    const unconfirmed = !!suggestion && suggestion.zustand !== "gestuetzt";
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          type="text"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          style={inputStyle}
          placeholder={unconfirmed && !value ? `Vorschlag: ${suggestion!.wert}` : "Freitext"}
        />
        <RawFieldAffordance
          suggestion={suggestion}
          confirmedSegId={confirmedSegId}
          onUebernehmen={(w) => { onChange(w); onConfirmVorschlag?.(item.code, w); }}
          gespraechSegments={gespraechSegments}
          onEvidenceClick={onEvidenceClick}
          activeEvidenceSegId={activeEvidenceSegId}
        />
      </div>
    );
  }
  if (item.answerType === "number") {
    const unconfirmed = !!suggestion && suggestion.zustand !== "gestuetzt";
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          type="number"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          style={{ ...inputStyle, maxWidth: 160 }}
          placeholder={unconfirmed && !value ? `Vorschlag: ${suggestion!.wert}` : "0"}
        />
        <RawFieldAffordance
          suggestion={suggestion}
          confirmedSegId={confirmedSegId}
          onUebernehmen={(w) => { onChange(w); onConfirmVorschlag?.(item.code, w); }}
          gespraechSegments={gespraechSegments}
          onEvidenceClick={onEvidenceClick}
          activeEvidenceSegId={activeEvidenceSegId}
        />
      </div>
    );
  }
  if (item.answerType === "date") {
    return (
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        <div style={{ flex: "0 1 200px", minWidth: 0, maxWidth: 200 }}>
          <DateField
            wertFormat="iso"
            bereich={item.code === "A3" ? "past" : "any"}
            value={value ?? null}
            onChange={(v) => onChange((v as string) ?? "")}
          />
        </div>
        <RawFieldAffordance
          suggestion={suggestion}
          confirmedSegId={confirmedSegId}
          onUebernehmen={(w) => { onChange(w); onConfirmVorschlag?.(item.code, w); }}
          gespraechSegments={gespraechSegments}
          onEvidenceClick={onEvidenceClick}
          activeEvidenceSegId={activeEvidenceSegId}
        />
      </div>
    );
  }

  // Single choice with long option list (§3.6)
  if (options.length >= 8) {
    return (
      <>
        <LongOptionInput options={options} value={value} onChange={onChange} />
        {followUpEl}
      </>
    );
  }

  // Standard single choice: full-width rows (§3.1)
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {/* Evidence block — above the list, persists after confirmation (quieter) */}
      {(() => {
        const beleg = feldBeleg(suggestion, confirmedSegId);
        return beleg && gespraechSegments ? (
          <EvidenceBlock segId={beleg.segId} gespraechSegments={gespraechSegments} muted={!beleg.aktiv} active={activeEvidenceSegId === beleg.segId} onClick={onEvidenceClick} />
        ) : null;
      })()}
      {options.map((opt) => {
        const selected = value === opt.code;
        const isSuggested = !!suggestion && opt.code === suggestion.wert && suggestion.zustand !== "gestuetzt";
        return (
          <div key={opt.code}>
            <SelectionSurface
              selected={selected}
              onToggle={() => onChange(opt.code)}
              minHeight={44}
              fullWidth
              suggested={isSuggested}
            >
              <CodeBadge code={opt.code} />
              <span
                style={{
                  fontSize: 13,
                  color: "var(--text-primary)",
                  fontWeight: selected ? 600 : 400,
                  flex: 1,
                }}
              >
                {opt.label}
              </span>
              {selected && (
                <Check
                  style={{
                    width: 14,
                    height: 14,
                    color: "var(--brand-primary)",
                    flexShrink: 0,
                  }}
                />
              )}
            </SelectionSurface>
            {/* freeText option: text input appears when this option is selected (Z2:13) */}
            {opt.freeText && selected && (
              <div style={{ marginTop: 6, marginLeft: 20 }}>
                <input
                  type="text"
                  value={freeTextValue}
                  onChange={(e) => setFreeTextValue(e.target.value)}
                  placeholder="Freitext…"
                  style={{ ...inputStyle, maxWidth: 320 }}
                  autoFocus
                />
              </div>
            )}
          </div>
        );
      })}
      {followUpEl}
    </div>
  );
}

// ─── Long option list with search (§3.6) ────────────────────────────────────

/**
 * Used when an option list has ≥8 entries.
 * A search field filters by code or label. The selected option remains visible.
 * Scroll container shows ~5 options at a time.
 */
function LongOptionInput({
  options,
  value,
  onChange,
}: {
  options: AnswerOption[];
  value: string | null;
  onChange: (v: string) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [freeTextValues, setFreeTextValues] = useState<Record<string, string>>(
    {}
  );

  const filtered = searchQuery
    ? options.filter(
        (o) =>
          o.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          o.code.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <div style={{ position: "relative", marginBottom: 6 }}>
        <Search
          style={{
            position: "absolute",
            left: 10,
            top: "50%",
            transform: "translateY(-50%)",
            width: 13,
            height: 13,
            color: "var(--text-tertiary)",
          }}
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Suchen…"
          style={{ ...inputStyle, paddingLeft: 32, maxWidth: "100%" }}
        />
      </div>

      <div
        style={{
          maxHeight: 5 * 50,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 2,
          border: "0.5px solid var(--border-default)",
          borderRadius: 8,
          padding: 4,
        }}
      >
        {filtered.map((opt) => {
          const selected = value === opt.code;
          return (
            <div key={opt.code}>
              <SelectionSurface
                selected={selected}
                onToggle={() => onChange(opt.code)}
                minHeight={44}
                fullWidth
              >
                <CodeBadge code={opt.code} />
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: selected ? 600 : 400,
                    color: selected
                      ? "var(--brand-primary)"
                      : "var(--text-primary)",
                    flex: 1,
                  }}
                >
                  {opt.label}
                </span>
                {selected && (
                  <Check
                    style={{
                      width: 14,
                      height: 14,
                      color: "var(--brand-primary)",
                      flexShrink: 0,
                    }}
                  />
                )}
              </SelectionSurface>
              {opt.freeText && selected && (
                <div style={{ marginTop: 6, marginLeft: 20 }}>
                  <input
                    type="text"
                    value={freeTextValues[opt.code] ?? ""}
                    onChange={(e) =>
                      setFreeTextValues((prev) => ({
                        ...prev,
                        [opt.code]: e.target.value,
                      }))
                    }
                    placeholder="Freitext…"
                    style={{ ...inputStyle, maxWidth: 320 }}
                    autoFocus
                  />
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && searchQuery && (
          <div
            style={{
              fontSize: 12,
              color: "var(--text-tertiary)",
              padding: "8px 12px",
            }}
          >
            Keine Optionen für „{searchQuery}"
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Matrix renderer (§3.2) — one code cell per option per sub-item row ──────

/**
 * Builds the matrix rows list, inserting groupHeading separators where the
 * seed marks them on a sub-item. Group headings come from the seed (SubItem.groupHeading),
 * not from interrai-structure.ts which no longer exists.
 */
type MatrixRow =
  | { type: "group-heading"; heading: string }
  | { type: "sub"; sub: SubItem };

function buildMatrixRows(subs: SubItem[]): MatrixRow[] {
  const rows: MatrixRow[] = [];
  for (const sub of subs) {
    if (sub.groupHeading) {
      rows.push({ type: "group-heading", heading: sub.groupHeading });
    }
    rows.push({ type: "sub", sub });
  }
  return rows;
}

/**
 * Advances keyboard focus to the next unanswered row in the same item (§1.5).
 */
function focusNextInItem(
  currentCode: string,
  subs: SubItem[],
  answers: Answers
) {
  const idx = subs.findIndex((s) => s.code === currentCode);
  for (let i = idx + 1; i < subs.length; i++) {
    const sub = subs[i];
    if (answers[sub.code] == null || answers[sub.code] === "") {
      const next = document.querySelector<HTMLElement>(
        `[data-row="${sub.code}"]`
      );
      if (next) {
        next.focus();
        return;
      }
    }
  }
}

function MatrixRenderer({
  item,
  answers,
  skippedItems,
  onAnswer,
  onActiveLegend,
  vorschlaegeMap,
  gespraechSegments,
  activeEvidenceSegId,
  onEvidenceClick,
  bestaetigungenSegMap,
}: {
  item: Item;
  answers: Answers;
  skippedItems: Set<string>;
  onAnswer: (code: string, value: string) => void;
  onActiveLegend?: (code: string | null) => void;
  vorschlaegeMap?: Record<string, { wert: string; segId: string; zustand: "neuer_wert" | "abweichung" | "gestuetzt" }>;
  gespraechSegments?: Map<string, GespraechAbschnitt>;
  activeEvidenceSegId?: string | null;
  onEvidenceClick?: (segId: string | null) => void;
  bestaetigungenSegMap?: Record<string, string>;
}) {
  const options = item.options ?? [];
  const allSubs = item.subItems ?? [];
  const subs = allSubs.filter((s) => !skippedItems.has(s.code));
  const mode = getMatrixDisplayMode(item.code);
  const containerRef = useRef<HTMLDivElement>(null);
  const legendRef = useRef<HTMLDivElement>(null);

  // Track: legend NOT visible AND item rows still visible → show hint in bar
  useEffect(() => {
    if (mode !== "legend" || !containerRef.current || !legendRef.current || !onActiveLegend) return;
    let legendVisible = true;
    let itemVisible = true;

    const legendObs = new IntersectionObserver(([e]) => { legendVisible = e.isIntersecting; update(); }, { threshold: 0 });
    const itemObs = new IntersectionObserver(([e]) => { itemVisible = e.isIntersecting; update(); }, { threshold: 0.05 });

    function update() {
      if (!legendVisible && itemVisible) onActiveLegend(item.code);
      else onActiveLegend(null);
    }

    legendObs.observe(legendRef.current);
    itemObs.observe(containerRef.current);
    return () => { legendObs.disconnect(); itemObs.disconnect(); };
  }, [mode, item.code, onActiveLegend]);

  // Keyboard: digit keys set the answer for the focused row (§1.5)
  const pendingRef = useRef<string>("");
  const pendingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, subCode: string) => {
      if (!/^[0-9]$/.test(e.key)) return;
      if (pendingTimer.current) clearTimeout(pendingTimer.current);
      pendingRef.current += e.key;

      // Immediate match for single-digit codes
      const immediate = options.find((o) => o.code === pendingRef.current);
      if (immediate) {
        onAnswer(subCode, immediate.code);
        pendingRef.current = "";
        focusNextInItem(subCode, subs, answers);
        e.preventDefault();
        return;
      }

      // Wait briefly for a second digit (codes ≥ 10)
      pendingTimer.current = setTimeout(() => {
        const opt = options.find((o) => o.code === pendingRef.current);
        if (opt) {
          onAnswer(subCode, opt.code);
          focusNextInItem(subCode, subs, answers);
        }
        pendingRef.current = "";
      }, 450);

      e.preventDefault();
    },
    [options, subs, onAnswer, answers]
  );

  if (options.length === 0 || subs.length === 0) return null;

  const rows = buildMatrixRows(subs);

  return (
    <div ref={containerRef}>
      {/* Legend block — tinted, not sticky (scrolls with item content) */}
      {mode === "legend" && (
        <div ref={legendRef} style={{ marginBottom: 12 }}>
          <LegendBlock options={options} />
        </div>
      )}

      {/* Sub-item rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {rows.map((row, rowIdx) => {
          if (row.type === "group-heading") {
            return (
              <div
                key={`gh-${rowIdx}`}
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--text-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  padding: "10px 0 4px",
                  borderTop: "0.5px solid var(--border-default)",
                  fontStyle: "italic",
                }}
              >
                {row.heading}
              </div>
            );
          }

          const sub = row.sub;
          const currentVal = answers[sub.code] ?? null;
          const suggestion = vorschlaegeMap?.[sub.code];
          const hasDeviation = suggestion?.zustand === "abweichung";

          return (
            <div
              key={sub.code}
              data-row={sub.code}
              tabIndex={0}
              onKeyDown={(e) => handleKeyDown(e, sub.code)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "6px 0",
                borderTop: "0.5px solid var(--border-default)",
                borderLeft: hasDeviation ? "2px solid var(--status-warning-text)" : "2px solid transparent",
                paddingLeft: 6,
                outline: "none",
              }}
            >
              {/* Sub-item label + detail — takes the width left of the cells */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <TwoLevelLabel
                  code={sub.code}
                  label={sub.label}
                  detail={sub.detail}
                  dimCode
                />
              </div>

              {/* Code cells — min 34×34 px (§1.2) */}
              <div
                style={{ display: "flex", gap: 4, flexShrink: 0 }}
              >
                {options.map((opt) => (
                  <MatrixCell
                    key={opt.code}
                    code={opt.code}
                    selected={currentVal === opt.code}
                    onToggle={() => onAnswer(sub.code, opt.code)}
                    label={opt.label}
                    showLabel={mode === "direct"}
                    suggested={!!suggestion && opt.code === suggestion.wert && suggestion.zustand !== "gestuetzt"}
                  />
                ))}
              </div>
              {/* Evidence — fixed slot, always reserved (§2.6); persists after confirmation */}
              <EvidenceMark
                beleg={feldBeleg(suggestion, bestaetigungenSegMap?.[sub.code])}
                gespraechSegments={gespraechSegments}
                onEvidenceClick={onEvidenceClick}
                activeEvidenceSegId={activeEvidenceSegId}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Matrix columns renderer (§3.2 variant, G1) ─────────────────────────────

/**
 * Like matrix but each sub-item row has N×M cells (N options per M columns).
 * The legend is shown once. Column labels appear above the cell groups.
 * Used for G1 which has columns A (effektiv) and B (vermutet).
 *
 * Answer key: `${subCode}${columnCode.toLowerCase()}` e.g. "G1aA" → "G1aa", "G1ab".
 */
function MatrixColumnsRenderer({
  item,
  answers,
  skippedItems,
  onAnswer,
  onActiveLegend,
  vorschlaegeMap,
  gespraechSegments,
  activeEvidenceSegId,
  onEvidenceClick,
  bestaetigungenSegMap,
}: {
  item: Item;
  answers: Answers;
  skippedItems: Set<string>;
  onAnswer: (code: string, value: string) => void;
  onActiveLegend?: (code: string | null) => void;
  vorschlaegeMap?: Record<string, { wert: string; segId: string; zustand: "neuer_wert" | "abweichung" | "gestuetzt" }>;
  gespraechSegments?: Map<string, GespraechAbschnitt>;
  activeEvidenceSegId?: string | null;
  onEvidenceClick?: (segId: string | null) => void;
  bestaetigungenSegMap?: Record<string, string>;
}) {
  const options = item.options ?? [];
  const columns: AnswerColumn[] = (item as any).columns ?? [];
  const allSubs = item.subItems ?? [];
  const subs = allSubs.filter((s) => !skippedItems.has(s.code));
  const mode = getMatrixDisplayMode(item.code);
  const containerRef = useRef<HTMLDivElement>(null);
  const legendRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mode !== "legend" || !containerRef.current || !legendRef.current || !onActiveLegend) return;
    let legendVisible = true;
    let itemVisible = true;
    const legendObs = new IntersectionObserver(([e]) => { legendVisible = e.isIntersecting; upd(); }, { threshold: 0 });
    const itemObs = new IntersectionObserver(([e]) => { itemVisible = e.isIntersecting; upd(); }, { threshold: 0.05 });
    function upd() {
      if (!legendVisible && itemVisible) onActiveLegend(item.code);
      else onActiveLegend(null);
    }
    legendObs.observe(legendRef.current);
    itemObs.observe(containerRef.current);
    return () => { legendObs.disconnect(); itemObs.disconnect(); };
  }, [item.code, onActiveLegend]);

  if (options.length === 0 || subs.length === 0) return null;

  const rows = buildMatrixRows(subs);

  return (
    <div ref={containerRef}>
      {/* Legend block — tinted, not sticky */}
      {mode === "legend" && (
        <div ref={legendRef} style={{ marginBottom: 12 }}>
          <LegendBlock options={options} />
        </div>
      )}

      {/* Column headers */}
      {columns.length > 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            marginBottom: 4,
          }}
        >
          {columns.map((col) => (
            <div
              key={col.code}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                minWidth: options.length * 38,
              }}
            >
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: 10,
                  fontWeight: 700,
                  color: "var(--text-tertiary)",
                }}
              >
                ({col.code})
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: "var(--text-secondary)",
                  fontStyle: "italic",
                }}
              >
                {col.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Sub-item rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {rows.map((row, rowIdx) => {
          if (row.type === "group-heading") {
            return (
              <div
                key={`gh-${rowIdx}`}
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--text-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  padding: "10px 0 4px",
                  borderTop: "0.5px solid var(--border-default)",
                  fontStyle: "italic",
                }}
              >
                {row.heading}
              </div>
            );
          }

          const sub = row.sub;

          return (
            <div
              key={sub.code}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "6px 0",
                borderTop: "0.5px solid var(--border-default)",
              }}
            >
              {/* Sub-item label — takes the width left of the column groups */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <TwoLevelLabel
                  code={sub.code}
                  label={sub.label}
                  detail={sub.detail}
                  dimCode
                />
              </div>

              {/* One group of code cells per column — visually grouped */}
              <div style={{ display: "flex", gap: 16, flexShrink: 0 }}>
                {(columns.length > 0 ? columns : [{ code: "", label: "" }]).map(
                  (col, colIdx) => {
                    const fieldCode =
                      columns.length > 0
                        ? `${sub.code}${col.code.toLowerCase()}`
                        : sub.code;
                    const currentVal = answers[fieldCode] ?? null;
                    const colSuggestion = vorschlaegeMap?.[fieldCode];
                    // Alternate tint per column group (not selection state)
                    const groupTint = columns.length > 1
                      ? (colIdx % 2 === 0 ? "rgba(0,0,0,0.02)" : "rgba(0,0,0,0.05)")
                      : "transparent";
                    return (
                      <div
                        key={col.code}
                        style={{ display: "flex", gap: 4, padding: "2px 4px", borderRadius: 6, background: groupTint }}
                      >
                        {options.map((opt) => (
                          <MatrixCell
                            key={opt.code}
                            code={opt.code}
                            selected={currentVal === opt.code}
                            onToggle={() => onAnswer(fieldCode, opt.code)}
                            label={opt.label}
                            showLabel={mode === "direct"}
                            suggested={!!colSuggestion && opt.code === colSuggestion.wert && colSuggestion.zustand !== "gestuetzt"}
                          />
                        ))}
                      </div>
                    );
                  }
                )}
              </div>
              {/* Evidence — fixed slot, always reserved (§2.6); persists after confirmation */}
              {(() => {
                const colCodes = columns.length > 0
                  ? columns.map(col => `${sub.code}${col.code.toLowerCase()}`)
                  : [sub.code];
                let beleg: FeldBeleg | null = null;
                for (const fc of colCodes) {
                  const b = feldBeleg(vorschlaegeMap?.[fc], bestaetigungenSegMap?.[fc]);
                  if (b && b.aktiv) { beleg = b; break; }
                  if (b && !beleg) beleg = b;
                }
                return (
                  <EvidenceMark beleg={beleg} gespraechSegments={gespraechSegments} onEvidenceClick={onEvidenceClick} activeEvidenceSegId={activeEvidenceSegId} />
                );
              })()}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Stacked renderer (§3.3) ─────────────────────────────────────────────────

/**
 * Each sub-item is a standalone block with its own options rendered as
 * full-width rows (§3.1). Sub-items with ≥8 options get the long-list widget.
 */
function StackedRenderer({
  item,
  answers,
  skippedItems,
  onAnswer,
  vorschlaegeMap,
  onConfirmVorschlag,
  gespraechSegments,
  activeEvidenceSegId,
  onEvidenceClick,
  bestaetigungenSegMap,
}: {
  item: Item;
  answers: Answers;
  skippedItems: Set<string>;
  onAnswer: (code: string, value: string) => void;
  vorschlaegeMap?: Record<string, { wert: string; segId: string; zustand: "neuer_wert" | "abweichung" | "gestuetzt" }>;
  onConfirmVorschlag?: (code: string, wert?: string) => void;
  gespraechSegments?: Map<string, GespraechAbschnitt>;
  activeEvidenceSegId?: string | null;
  onEvidenceClick?: (segId: string | null) => void;
  bestaetigungenSegMap?: Record<string, string>;
}) {
  const subs = (item.subItems ?? []).filter((s) => !skippedItems.has(s.code));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {subs.map((sub) => {
        const opts = getEffectiveOptions(sub.code);
        const currentVal = answers[sub.code] ?? null;
        const hasLongList = opts.length >= 8;
        const stackedSuggestion = vorschlaegeMap?.[sub.code];
        const confirmedSegId = bestaetigungenSegMap?.[sub.code];

        return (
          <div
            key={sub.code}
            style={{
              borderTop: "0.5px solid var(--border-default)",
              paddingTop: 16,
            }}
          >
            <div style={{ marginBottom: 8 }}>
              <TwoLevelLabel
                code={sub.code}
                label={sub.label}
                detail={sub.detail}
              />
            </div>

            {hasLongList ? (
              <LongOptionInput
                options={opts}
                value={currentVal}
                onChange={(v) => onAnswer(sub.code, v)}
              />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {/* Evidence block — above the list, persists after confirmation (quieter) */}
                {(() => {
                  const beleg = feldBeleg(stackedSuggestion, confirmedSegId);
                  return beleg && gespraechSegments ? (
                    <EvidenceBlock segId={beleg.segId} gespraechSegments={gespraechSegments} muted={!beleg.aktiv} active={activeEvidenceSegId === beleg.segId} onClick={onEvidenceClick} />
                  ) : null;
                })()}
                {opts.map((opt) => {
                  const selected = currentVal === opt.code;
                  const isSuggested = !!stackedSuggestion && opt.code === stackedSuggestion.wert && stackedSuggestion.zustand !== "gestuetzt";
                  return (
                    <SelectionSurface
                      key={opt.code}
                      selected={selected}
                      onToggle={() => onAnswer(sub.code, opt.code)}
                      minHeight={44}
                      fullWidth
                      suggested={isSuggested}
                    >
                      <CodeBadge code={opt.code} />
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: selected ? 600 : 400,
                          color: "var(--text-primary)",
                          flex: 1,
                        }}
                      >
                        {opt.label}
                      </span>
                      {selected && (
                        <Check
                          style={{
                            width: 14,
                            height: 14,
                            color: "var(--brand-primary)",
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </SelectionSurface>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Fieldgroup renderer (§3.4) ──────────────────────────────────────────────

/**
 * Items A1, A5, A7, K1, N3 — only text/number/date sub-items.
 * Sub-item.unit from the seed's Attachment is shown as suffix.
 */
function FieldgroupRenderer({
  item,
  answers,
  onAnswer,
  vorschlaegeMap,
  onConfirmVorschlag,
  gespraechSegments,
  activeEvidenceSegId,
  onEvidenceClick,
  bestaetigungenSegMap,
}: {
  item: Item;
  answers: Answers;
  onAnswer: (code: string, value: string) => void;
  vorschlaegeMap?: Record<string, { wert: string; segId: string; zustand: "neuer_wert" | "abweichung" | "gestuetzt" }>;
  onConfirmVorschlag?: (code: string, wert?: string) => void;
  gespraechSegments?: Map<string, GespraechAbschnitt>;
  activeEvidenceSegId?: string | null;
  onEvidenceClick?: (segId: string | null) => void;
  bestaetigungenSegMap?: Record<string, string>;
}) {
  const subs = item.subItems ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {subs.map((sub) => {
        // unit may be stored on the sub-item itself (future seed) or via attachments
        const unit = (sub as any).unit as string | undefined;
        const fgSuggestion = vorschlaegeMap?.[sub.code];
        const confirmedSegId = bestaetigungenSegMap?.[sub.code];

        return (
          <div key={sub.code}>
            <label style={{ display: "block", marginBottom: 4 }}>
              <TwoLevelLabel
                code={sub.code}
                label={sub.label}
                detail={sub.detail}
              />
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {(() => {
                const vtyp = validierungFuer(sub.code);
                if (vtyp) {
                  return (
                    <ValidiertesFeld
                      vtyp={vtyp}
                      value={answers[sub.code] ?? ""}
                      onChange={(v) => onAnswer(sub.code, v)}
                      placeholder={vtyp === "ahvn13" ? "756.XXXX.XXXX.XX" : "0"}
                      breite={vtyp === "ahvn13" ? 200 : 120}
                    />
                  );
                }
                const unconfirmed = !!fgSuggestion && fgSuggestion.zustand !== "gestuetzt";
                const ghost = unconfirmed && !answers[sub.code];
                return sub.answerType === "number" ? (
                  <input
                    type="number"
                    value={answers[sub.code] ?? ""}
                    onChange={(e) => onAnswer(sub.code, e.target.value)}
                    style={{ ...inputStyle, maxWidth: 160 }}
                    placeholder={ghost ? `Vorschlag: ${fgSuggestion!.wert}` : "0"}
                  />
                ) : sub.answerType === "date" ? (
                  <div style={{ flex: "0 1 200px", minWidth: 0, maxWidth: 200 }}>
                    <DateField
                      wertFormat="iso"
                      bereich="any"
                      value={answers[sub.code] ?? null}
                      onChange={(v) => onAnswer(sub.code, (v as string) ?? "")}
                    />
                  </div>
                ) : (
                  <input
                    type="text"
                    value={answers[sub.code] ?? ""}
                    onChange={(e) => onAnswer(sub.code, e.target.value)}
                    style={inputStyle}
                    placeholder={ghost ? `Vorschlag: ${fgSuggestion!.wert}` : "Freitext"}
                  />
                );
              })()}
              {unit && (
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--text-tertiary)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {unit}
                </span>
              )}
              <RawFieldAffordance
                suggestion={fgSuggestion}
                confirmedSegId={confirmedSegId}
                onUebernehmen={(w) => { onAnswer(sub.code, w); onConfirmVorschlag?.(sub.code, w); }}
                gespraechSegments={gespraechSegments}
                onEvidenceClick={onEvidenceClick}
                activeEvidenceSegId={activeEvidenceSegId}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Mixed N2 renderer (§3.5) ────────────────────────────────────────────────

/**
 * N2: each sub-item has a Ja/Nein choice. Sub-items that have `attachments`
 * in the seed show indented number fields below (active only when parent ≠ null).
 * The attachmentIntro printed label appears above the attached fields.
 */
function MixedN2Renderer({
  item,
  answers,
  skippedItems,
  onAnswer,
  vorschlaegeMap,
  onConfirmVorschlag,
  gespraechSegments,
  activeEvidenceSegId,
  onEvidenceClick,
  bestaetigungenSegMap,
}: {
  item: Item;
  answers: Answers;
  skippedItems: Set<string>;
  onAnswer: (code: string, value: string) => void;
  vorschlaegeMap?: Record<string, { wert: string; segId: string; zustand: "neuer_wert" | "abweichung" | "gestuetzt" }>;
  onConfirmVorschlag?: (code: string, wert?: string) => void;
  gespraechSegments?: Map<string, GespraechAbschnitt>;
  activeEvidenceSegId?: string | null;
  onEvidenceClick?: (segId: string | null) => void;
  bestaetigungenSegMap?: Record<string, string>;
}) {
  const subs = (item.subItems ?? []).filter((s) => !skippedItems.has(s.code));
  const parentOptions = item.options ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {subs.map((sub) => {
        const opts = sub.options && sub.options.length > 0
          ? sub.options
          : parentOptions;
        const currentVal = answers[sub.code] ?? null;
        const isAnswered = currentVal != null && currentVal !== "";
        const hasAttachments = !!(
          sub.attachments && sub.attachments.length > 0
        );
        const n2Suggestion = vorschlaegeMap?.[sub.code];
        const confirmedSegId = bestaetigungenSegMap?.[sub.code];

        return (
          <div
            key={sub.code}
            style={{
              borderTop: "0.5px solid var(--border-default)",
              paddingTop: 12,
            }}
          >
            {/* Sub-item label + detail */}
            <div style={{ marginBottom: 6 }}>
              <TwoLevelLabel
                code={sub.code}
                label={sub.label}
                detail={sub.detail}
              />
            </div>

            {/* Choice rows */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {/* Evidence block — above the list, persists after confirmation (quieter) */}
              {(() => {
                const beleg = feldBeleg(n2Suggestion, confirmedSegId);
                return beleg && gespraechSegments ? (
                  <EvidenceBlock segId={beleg.segId} gespraechSegments={gespraechSegments} muted={!beleg.aktiv} active={activeEvidenceSegId === beleg.segId} onClick={onEvidenceClick} />
                ) : null;
              })()}
              {opts.map((opt) => {
                const selected = currentVal === opt.code;
                const isSuggested = !!n2Suggestion && opt.code === n2Suggestion.wert && n2Suggestion.zustand !== "gestuetzt";
                return (
                  <SelectionSurface
                    key={opt.code}
                    selected={selected}
                    onToggle={() => onAnswer(sub.code, opt.code)}
                    minHeight={44}
                    fullWidth
                    suggested={isSuggested}
                  >
                    <CodeBadge code={opt.code} />
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: selected ? 600 : 400,
                        color: "var(--text-primary)",
                        flex: 1,
                      }}
                    >
                      {opt.label}
                    </span>
                    {selected && (
                      <Check
                        style={{
                          width: 14,
                          height: 14,
                          color: "var(--brand-primary)",
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </SelectionSurface>
                );
              })}
            </div>

            {/* Attached number fields — N2e/f/g: Tage + Minuten (§3.5) */}
            {hasAttachments && (
              <div
                style={{
                  marginTop: 8,
                  marginLeft: 24,
                  opacity: isAnswered ? 1 : 0.35,
                  pointerEvents: isAnswered ? "auto" : "none",
                  transition: "opacity 0.15s",
                }}
              >
                {sub.attachmentIntro && (
                  <div
                    style={{
                      fontSize: 11.5,
                      color: "var(--text-secondary)",
                      marginBottom: 6,
                      fontStyle: "italic",
                    }}
                  >
                    {sub.attachmentIntro}
                  </div>
                )}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  {sub.attachments!.map((att) => {
                    const attSuggestion = vorschlaegeMap?.[att.code];
                    const attConfirmedSegId = bestaetigungenSegMap?.[att.code];
                    return (
                    <div key={att.code}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <label
                          style={{
                            fontSize: 12,
                            color: "var(--text-secondary)",
                            minWidth: 120,
                            whiteSpace: "nowrap",
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "monospace",
                              fontSize: 10,
                              color: "var(--text-tertiary)",
                              marginRight: 4,
                            }}
                          >
                            {att.marker}
                          </span>
                          {att.label}
                        </label>
                        <input
                          type="number"
                          value={answers[att.code] ?? ""}
                          onChange={(e) =>
                            onAnswer(att.code, e.target.value)
                          }
                          style={{ ...inputStyle, maxWidth: 100 }}
                          placeholder={attSuggestion && attSuggestion.zustand !== "gestuetzt" && !answers[att.code] ? `Vorschlag: ${attSuggestion.wert}` : "0"}
                          disabled={!isAnswered}
                        />
                        {att.unit && (
                          <span
                            style={{
                              fontSize: 12,
                              color: "var(--text-tertiary)",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {att.unit}
                          </span>
                        )}
                        {isAnswered && (
                          <RawFieldAffordance
                            suggestion={attSuggestion}
                            confirmedSegId={attConfirmedSegId}
                            onUebernehmen={(w) => { onAnswer(att.code, w); onConfirmVorschlag?.(att.code, w); }}
                            gespraechSegments={gespraechSegments}
                            onEvidenceClick={onEvidenceClick}
                            activeEvidenceSegId={activeEvidenceSegId}
                          />
                        )}
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Repeat fixed renderer (§3.5, I3) ────────────────────────────────────────

/**
 * I3: repeatRows copies of the sub-item group are pre-rendered.
 * The seed has repeatRows: 6 and subItems [diagnose, code, icd].
 * Each row uses a unique suffix (e.g. "I3.diagnose#1", "I3.diagnose#2").
 * The footnote is shown in the item card footer.
 */
function RepeatFixedRenderer({
  item,
  answers,
  onAnswer,
}: {
  item: Item;
  answers: Answers;
  onAnswer: (code: string, value: string) => void;
}) {
  const templateSubs = item.subItems ?? [];
  const parentOptions = item.options ?? [];
  // Start with 1 group; user adds more on demand
  const [groupCount, setGroupCount] = useState(1);

  const removeGroup = (idx: number) => {
    // Clear answers for that group
    for (const sub of templateSubs) {
      const fieldCode = `${sub.code}#${idx + 1}`;
      if (answers[fieldCode] != null) onAnswer(fieldCode, "");
    }
    setGroupCount(prev => Math.max(1, prev - 1));
  };

  const isGroupEmpty = (idx: number) => {
    return templateSubs.every(sub => {
      const v = answers[`${sub.code}#${idx + 1}`];
      return v == null || v === "";
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {Array.from({ length: groupCount }, (_, rowIdx) => (
        <div
          key={rowIdx}
          style={{
            borderRadius: 8,
            border: "0.5px solid var(--border-default)",
            padding: 12,
            background: "var(--bg-secondary, #f9fafb)",
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: "var(--text-tertiary)",
              marginBottom: 8,
            }}
          >
            Diagnose {rowIdx + 1}
          </div>
          <div
            style={{ display: "flex", flexDirection: "column", gap: 8 }}
          >
            {templateSubs.map((sub) => {
              // Unique code per row: base code + row index suffix
              const fieldCode = `${sub.code}#${rowIdx + 1}`;
              const opts =
                sub.options && sub.options.length > 0
                  ? sub.options
                  : parentOptions;
              const isChoice =
                sub.answerType === "single_choice" ||
                sub.answerType === "composite";
              const currentVal = answers[fieldCode] ?? null;

              return (
                <div key={sub.code}>
                  <label
                    style={{
                      fontSize: 12,
                      color: "var(--text-secondary)",
                      display: "block",
                      marginBottom: 4,
                    }}
                  >
                    {sub.label}
                  </label>
                  {isChoice && opts.length > 0 ? (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {opts.map((opt) => {
                        const selected = currentVal === opt.code;
                        return (
                          <button
                            key={opt.code}
                            type="button"
                            onClick={() => onAnswer(fieldCode, opt.code)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              padding: "6px 12px",
                              borderRadius: 6,
                              minHeight: 34,
                              background: selected
                                ? "var(--brand-primary)"
                                : "var(--bg-elevated)",
                              border: selected
                                ? "1.5px solid var(--brand-primary)"
                                : "0.5px solid var(--border-default)",
                              color: selected ? "#fff" : "var(--text-primary)",
                              fontSize: 12,
                              fontWeight: selected ? 600 : 400,
                              cursor: "pointer",
                              fontFamily: "inherit",
                            }}
                          >
                            <span
                              style={{
                                fontFamily: "monospace",
                                fontSize: 11,
                              }}
                            >
                              {opt.code}
                            </span>
                            <span>{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : validierungFuer(sub.code) === "icd10" ? (
                    <ValidiertesFeld
                      vtyp="icd10"
                      value={answers[fieldCode] ?? ""}
                      onChange={(v) => onAnswer(fieldCode, v)}
                      placeholder="z. B. I50.9"
                      hinweis={ICD_HINWEIS}
                      breite={220}
                    />
                  ) : (
                    <input
                      type={
                        sub.answerType === "number" ? "number" : "text"
                      }
                      value={answers[fieldCode] ?? ""}
                      onChange={(e) => onAnswer(fieldCode, e.target.value)}
                      style={inputStyle}
                      placeholder={
                        sub.answerType === "number" ? "0" : "Freitext"
                      }
                    />
                  )}
                </div>
              );
            })}
          </div>
          {/* Remove button — only for added, empty groups beyond the first */}
          {rowIdx > 0 && isGroupEmpty(rowIdx) && (
            <button type="button" onClick={() => removeGroup(rowIdx)} style={{ marginTop: 6, fontSize: 12, color: "var(--text-tertiary)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
              Zeile entfernen
            </button>
          )}
        </div>
      ))}

      {/* Add button */}
      <button
        type="button"
        onClick={() => setGroupCount(prev => prev + 1)}
        style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "0.5px solid var(--border-default)", background: "var(--bg-elevated)", fontSize: 13, color: "var(--text-primary)", cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}
      >
        <Plus style={{ width: 14, height: 14 }} />
        Weitere Diagnose erfassen
      </button>
      {/* Footnote is rendered once by ItemRenderer for every item; do not
          repeat it here (that produced the duplicate note on I3). */}
    </div>
  );
}

// ─── Repeat dynamic renderer (§3.5, P2) ──────────────────────────────────────

/**
 * P2: the assessor enters a count first, then that many copies of the
 * sub-item group are rendered. Each copy uses fieldCode `${sub.code}#${n}`.
 */
function RepeatDynamicRenderer({
  item,
  answers,
  onAnswer,
}: {
  item: Item;
  answers: Answers;
  onAnswer: (code: string, value: string) => void;
}) {
  const [rowCount, setRowCount] = useState(1);
  const templateSubs = item.subItems ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Count input */}
      <div>
        <label
          style={{
            display: "block",
            fontSize: 12,
            color: "var(--text-secondary)",
            marginBottom: 4,
          }}
        >
          Anzahl informelle Helfer
        </label>
        <input
          type="number"
          min={1}
          max={20}
          value={rowCount}
          onChange={(e) =>
            setRowCount(Math.max(1, parseInt(e.target.value, 10) || 1))
          }
          style={{ ...inputStyle, maxWidth: 100 }}
        />
      </div>

      {/* One block per helper */}
      {Array.from({ length: rowCount }, (_, rowIdx) => (
        <div
          key={rowIdx}
          style={{
            borderRadius: 8,
            border: "0.5px solid var(--border-default)",
            padding: 12,
            background: "var(--bg-secondary, #f9fafb)",
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: "var(--text-tertiary)",
              marginBottom: 8,
            }}
          >
            Helfer {rowIdx + 1}
          </div>
          <div
            style={{ display: "flex", flexDirection: "column", gap: 12 }}
          >
            {templateSubs.map((sub) => {
              const fieldCode = `${sub.code}#${rowIdx + 1}`;
              const opts =
                sub.options && sub.options.length > 0 ? sub.options : [];
              const isChoice =
                sub.answerType === "single_choice" ||
                sub.answerType === "composite";
              const currentVal = answers[fieldCode] ?? null;
              const hasLong = opts.length >= 8;

              return (
                <div key={sub.code}>
                  <div style={{ marginBottom: 6 }}>
                    <TwoLevelLabel
                      code={sub.code}
                      label={sub.label}
                      detail={sub.detail}
                      hideCode
                    />
                  </div>
                  {isChoice && opts.length > 0 ? (
                    hasLong ? (
                      <LongOptionInput
                        options={opts}
                        value={currentVal}
                        onChange={(v) => onAnswer(fieldCode, v)}
                      />
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 4,
                        }}
                      >
                        {opts.map((opt) => {
                          const selected = currentVal === opt.code;
                          return (
                            <SelectionSurface
                              key={opt.code}
                              selected={selected}
                              onToggle={() => onAnswer(fieldCode, opt.code)}
                              minHeight={44}
                              fullWidth
                            >
                              <CodeBadge code={opt.code} />
                              <span
                                style={{
                                  fontSize: 13,
                                  fontWeight: selected ? 600 : 400,
                                  color: "var(--text-primary)",
                                  flex: 1,
                                }}
                              >
                                {opt.label}
                              </span>
                              {selected && (
                                <Check
                                  style={{
                                    width: 14,
                                    height: 14,
                                    color: "var(--brand-primary)",
                                    flexShrink: 0,
                                  }}
                                />
                              )}
                            </SelectionSurface>
                          );
                        })}
                      </div>
                    )
                  ) : validierungFuer(sub.code) === "icd10" ? (
                    <ValidiertesFeld
                      vtyp="icd10"
                      value={answers[fieldCode] ?? ""}
                      onChange={(v) => onAnswer(fieldCode, v)}
                      placeholder="z. B. I50.9"
                      hinweis={ICD_HINWEIS}
                      breite={220}
                    />
                  ) : (
                    <input
                      type={
                        sub.answerType === "number" ? "number" : "text"
                      }
                      value={answers[fieldCode] ?? ""}
                      onChange={(e) => onAnswer(fieldCode, e.target.value)}
                      style={inputStyle}
                      placeholder={
                        sub.answerType === "number" ? "0" : "Freitext"
                      }
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => setRowCount((c) => c + 1)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 14px",
          borderRadius: 8,
          alignSelf: "flex-start",
          background: "transparent",
          border: "0.5px dashed var(--border-default)",
          color: "var(--brand-primary)",
          fontSize: 13,
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        <Plus style={{ width: 14, height: 14 }} />
        Weitere Hilfsperson erfassen
      </button>
    </div>
  );
}
