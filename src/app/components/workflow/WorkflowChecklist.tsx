/**
 * WorkflowChecklist — Shared component for Patient Prozess checklists.
 * Used in both Onboarding and Patient-Detail. Reads/writes the same
 * persisted WorkflowPlan object (MOCK_WORKFLOWS).
 *
 * Uses TabHeader (8.11) + ItemRow (8.13) + status rules (8.12, 13).
 */
import { useState, useCallback } from "react";
import { Check, CheckCircle2, AlertTriangle, Calendar, ChevronDown, ChevronUp, UserCircle } from "lucide-react";
import { MOCK_WORKFLOWS } from "../../../lib/mocks/klinische-artefakte-mock";
import type { WorkflowPlan, WorkflowSchritt, WorkflowTyp } from "../../../types/klinische-artefakte";
import { TabHeader, HeaderMeta } from "../ui/TabHeader";
import { ItemRow } from "../ui/ItemRow";
import { useArztAnfrage, ArztAnfrageFlowInline } from "../ArztAnfrageContext";

const TEAM_MEMBERS = ["Sandra Weber", "Kathrin Meier", "Maria Keller", "Dr. M. Huber", "Laura Brunner", "HR-Abteilung", "System", "KI-Assistent"];

function getInitials(name: string): string {
  return name.split(/[\s.]+/).filter(p => p.length > 1).map(p => p[0]).join("").toUpperCase().slice(0, 2);
}

function isoToChDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

function isOverdue(iso: string): boolean {
  return new Date(iso) < new Date(new Date().toDateString());
}

function nowTimestamp(): string {
  const d = new Date();
  return `${d.toLocaleDateString("de-CH")}, ${d.toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })}`;
}

interface Props {
  /** Find workflow by onboardingId, patientId, or angehoerigerId */
  onboardingId?: string | null;
  patientId?: string | null;
  angehoerigerId?: string | null;
  /** Which workflow type to show (default: patient-prozess) */
  typ?: WorkflowTyp;
  /** Override the displayed title */
  titel?: string;
}

/**
 * Architektur-Regel: Aktive Workflow-Schritte sind Fenster auf Domain-Objekte,
 * nie Besitzer von Logik. Der Schritt "Arzt kontaktiert" rendert den Zustand
 * des ArztAnfrage-Objekts über die gemeinsame ArztAnfrageFlowInline-Komponente.
 */

/* ── Schritt-Ableitungen (erweiterbar) ────────────────────────────────
 * Definiert, welche Schritte ihren Erledigt-Status automatisch von einem
 * Domain-Objekt ableiten. Der Status wird bei der Darstellung GELESEN,
 * nicht per Event GESCHRIEBEN – kein doppelter State, keine Sync-Logik.
 *
 * Erweiterung: neuer Eintrag = neues Array-Element, keine Logik-Änderung.
 */
import type { ArztAnfrageStatus } from "../../../types/klinische-artefakte";

interface SchrittAbleitung {
  /** Label des Workflow-Schritts (muss exakt übereinstimmen) */
  schrittLabel: string;
  /** Prüffunktion: gibt true zurück wenn der Schritt als erledigt gilt */
  istErledigt: (arztStatus: ArztAnfrageStatus | null) => boolean;
  /** Provenienz-Text für den automatischen Erledigt-Vermerk */
  provenienz: (arztAnfrage: { gesendetAm: string | null; antwortAm: string | null }) => string;
}

const ARZT_STATUS_ORDER: ArztAnfrageStatus[] = [
  "wartet_auf_einwilligung", "versandbereit", "gesendet", "antwort_erhalten", "extrahiert",
];
function arztStatusMindestens(current: ArztAnfrageStatus | null, min: ArztAnfrageStatus): boolean {
  if (!current) return false;
  return ARZT_STATUS_ORDER.indexOf(current) >= ARZT_STATUS_ORDER.indexOf(min);
}

const SCHRITT_ABLEITUNGEN: SchrittAbleitung[] = [
  {
    schrittLabel: "Arzt kontaktiert",
    istErledigt: (s) => arztStatusMindestens(s, "gesendet"),
    provenienz: (a) => `Automatisch · Anfrage gesendet am ${a.gesendetAm || "–"}`,
  },
  {
    schrittLabel: "Diagnose & Mediliste erhalten",
    istErledigt: (s) => arztStatusMindestens(s, "antwort_erhalten"),
    provenienz: (a) => `Automatisch · Antwort erhalten am ${a.antwortAm || "–"}`,
  },
];

export function WorkflowChecklist({ onboardingId, patientId, angehoerigerId, typ = "patient-prozess", titel }: Props) {
  // Shared ArztAnfrage domain object (Spiegel-Fenster)
  const arztAnfrage = useArztAnfrage();

  // Find the ONE persisted workflow object of the given type
  const workflow = MOCK_WORKFLOWS.find(w =>
    w.typ === typ &&
    ((onboardingId && w.onboardingId === onboardingId) ||
    (patientId && w.patientId === patientId) ||
    (angehoerigerId && w.angehoerigerId === angehoerigerId))
  );

  const [, forceUpdate] = useState(0);
  const [showCompleted, setShowCompleted] = useState(true);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [arztFlowExpanded, setArztFlowExpanded] = useState(false);

  /** Lookup: is this step auto-derived? Returns the binding or null. */
  const getAbleitung = (label: string): SchrittAbleitung | null =>
    SCHRITT_ABLEITUNGEN.find(a => a.schrittLabel === label) ?? null;

  /** Effective done-status: derived steps read from domain object, manual steps from their own status. */
  const isEffectiveDone = (task: WorkflowSchritt): boolean => {
    const ableitung = getAbleitung(task.label);
    if (ableitung) return ableitung.istErledigt(arztAnfrage?.anfrage.status ?? null);
    return task.status === "abgeschlossen";
  };

  if (!workflow) {
    return (
      <div style={{ padding: "var(--space-6)", textAlign: "center", color: "var(--text-tertiary)" }}>
        <div style={{ fontSize: "var(--text-body)", fontWeight: 500, color: "var(--text-primary)", marginBottom: 8 }}>Kein Workflow vorhanden</div>
        <div style={{ fontSize: "var(--text-small)" }}>Es wurde noch kein Patient Prozess erstellt.</div>
      </div>
    );
  }

  const schritte = workflow.schritte;
  // Partition uses effective (derived) status — not raw persisted status
  const openTasks = schritte.filter(s => !isEffectiveDone(s));
  const doneTasks = schritte.filter(s => isEffectiveDone(s));
  const doneCount = doneTasks.length;
  const total = schritte.length;

  const updateSchritt = (nr: number, patch: Partial<WorkflowSchritt>) => {
    const idx = schritte.findIndex(s => s.nr === nr);
    if (idx >= 0) Object.assign(schritte[idx], patch);
    forceUpdate(n => n + 1);
  };

  const handleToggle = (s: WorkflowSchritt) => {
    if (s.status === "offen") {
      updateSchritt(s.nr, { status: "abgeschlossen", completedAt: nowTimestamp(), overdue: false });
    } else {
      updateSchritt(s.nr, { status: "offen", completedAt: null, overdue: isOverdue(s.dueDate) });
    }
  };

  const handleDateChange = (s: WorkflowSchritt, iso: string) => {
    const [y, m, d] = iso.split("-");
    updateSchritt(s.nr, { dueDate: iso, dueDateDisplay: `${d}.${m}.${y}`, overdue: s.status === "offen" && isOverdue(iso) });
  };

  const handleAssignee = (s: WorkflowSchritt, assignee: string) => {
    updateSchritt(s.nr, { assignee });
    setOpenDropdown(null);
  };

  const isArztKontaktiertStep = (label: string) => label === "Arzt kontaktiert";

  const renderTask = (task: WorkflowSchritt, idx: number, arr: WorkflowSchritt[]) => {
    const ableitung = getAbleitung(task.label);
    const isDerived = ableitung !== null;
    const isDone = isEffectiveDone(task);
    const isDropOpen = openDropdown === `wf-${task.nr}`;
    const isArztStep = isArztKontaktiertStep(task.label);

    // Provenienz-Text für abgeleitete Schritte
    const hilfstextDerived = isDerived && isDone && arztAnfrage
      ? ableitung.provenienz(arztAnfrage.anfrage)
      : undefined;

    return (
      <ItemRow
        key={task.nr}
        marker={
          isDerived ? (
            // Abgeleitete Schritte: read-only Checkbox mit Tooltip
            <span
              title="Wird automatisch abgeschlossen"
              style={{ width: 20, height: 20, borderRadius: 999, background: isDone ? "var(--status-success)" : "transparent", border: isDone ? "none" : "1.5px solid var(--border-default)", display: "flex", alignItems: "center", justifyContent: "center", opacity: isDone ? 1 : 0.5, cursor: "default" }}
            >
              {isDone && <Check style={{ width: 12, height: 12, color: "var(--text-on-dark)" }} />}
            </span>
          ) : (
            <button onClick={() => handleToggle(task)} className="cursor-pointer" style={{ background: "none", border: "none", padding: 0 }} title={isDone ? "Als offen markieren" : "Als erledigt markieren"}>
              {isDone ? (
                <span style={{ width: 20, height: 20, borderRadius: 999, background: "var(--status-success)", display: "flex", alignItems: "center", justifyContent: "center" }}><Check style={{ width: 12, height: 12, color: "var(--text-on-dark)" }} /></span>
              ) : (
                <span style={{ width: 20, height: 20, borderRadius: 999, border: "1.5px solid var(--border-default)", display: "flex", alignItems: "center", justifyContent: "center" }} />
              )}
            </button>
          )
        }
        titel={`${task.nr}. ${task.label}`}
        hilfstext={hilfstextDerived || (isDone && task.completedAt ? `Erledigt: ${task.completedAt}` : undefined)}
        last={idx === arr.length - 1}
        onClick={isArztStep && !isDone ? () => setArztFlowExpanded(!arztFlowExpanded) : undefined}
      >
        <div className="flex items-center flex-wrap" style={{ gap: 8, marginTop: -2 }}>
          {task.overdue && !isDone && (
            <span className="inline-flex items-center" style={{ gap: 3, padding: "1px 8px", borderRadius: 999, fontSize: "var(--text-meta)", fontWeight: 500, background: "var(--status-danger-bg)", color: "var(--status-danger)" }}>
              <AlertTriangle style={{ width: 10, height: 10 }} /> Überfällig
            </span>
          )}
          <div className="hidden sm:flex items-center" style={{ gap: 4 }}>
            <Calendar style={{ width: 12, height: 12, color: task.overdue && !isDone ? "var(--status-danger)" : "var(--text-tertiary)" }} />
            <input type="date" value={task.dueDate} onChange={e => handleDateChange(task, e.target.value)} disabled={isDone} style={{ fontSize: "var(--text-meta)", color: task.overdue && !isDone ? "var(--status-danger)" : "var(--text-secondary)", background: "transparent", border: "none", outline: "none", fontFamily: "inherit", fontVariantNumeric: "tabular-nums", cursor: isDone ? "default" : "pointer", opacity: isDone ? 0.5 : 1 }} />
          </div>
          <div className="hidden md:block relative">
            <button onClick={() => setOpenDropdown(isDropOpen ? null : `wf-${task.nr}`)} className="inline-flex items-center cursor-pointer" style={{ gap: 4, padding: "2px 8px", borderRadius: 999, background: "transparent", border: "none", fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>
              {task.assignee ? (
                <><span style={{ width: 18, height: 18, borderRadius: 999, background: "var(--brand-primary-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 600, color: "var(--brand-primary)" }}>{getInitials(task.assignee)}</span><span className="truncate" style={{ maxWidth: 100 }}>{task.assignee}</span></>
              ) : (
                <><UserCircle style={{ width: 14, height: 14, color: "var(--text-tertiary)" }} /><span style={{ color: "var(--text-tertiary)" }}>Zuweisen</span></>
              )}
            </button>
            {isDropOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} />
                <div className="absolute right-0 top-full z-50" style={{ marginTop: 4, width: 200, background: "var(--bg-elevated)", borderRadius: 12, border: "0.5px solid var(--border-default)", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", padding: "4px 0", maxHeight: 220, overflowY: "auto" }}>
                  {task.assignee && <button onClick={() => handleAssignee(task, "")} className="w-full text-left cursor-pointer" style={{ padding: "8px 12px", fontSize: 12, color: "var(--text-tertiary)", background: "none", border: "none", fontStyle: "italic" }}>Zuweisung entfernen</button>}
                  {TEAM_MEMBERS.map(name => (
                    <button key={name} onClick={() => handleAssignee(task, name)} className="w-full flex items-center cursor-pointer" style={{ gap: 8, padding: "8px 12px", fontSize: 12, color: task.assignee === name ? "var(--brand-primary)" : "var(--text-primary)", fontWeight: task.assignee === name ? 500 : 400, background: task.assignee === name ? "var(--brand-primary-light)" : "transparent", border: "none" }} onMouseEnter={e => { if (task.assignee !== name) e.currentTarget.style.background = "var(--bg-secondary)"; }} onMouseLeave={e => { if (task.assignee !== name) e.currentTarget.style.background = "transparent"; }}>
                      <span style={{ width: 18, height: 18, borderRadius: 999, background: "var(--brand-primary-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 600, color: "var(--brand-primary)", flexShrink: 0 }}>{getInitials(name)}</span>
                      <span className="flex-1 truncate">{name}</span>
                      {task.assignee === name && <Check style={{ width: 12, height: 12, color: "var(--brand-primary)", flexShrink: 0 }} />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          {/* Arzt-step: expand toggle (shown even when done, for visibility into the flow) */}
          {isArztStep && (
            <button onClick={e => { e.stopPropagation(); setArztFlowExpanded(!arztFlowExpanded); }} className="cursor-pointer" style={{ background: "none", border: "none", padding: 2, color: "var(--text-tertiary)" }}>
              {arztFlowExpanded ? <ChevronUp style={{ width: 13, height: 13 }} /> : <ChevronDown style={{ width: 13, height: 13 }} />}
            </button>
          )}
        </div>

        {/* ── Arzt-Flow expanded body (only for "Arzt kontaktiert" step) ── */}
        {isArztStep && arztFlowExpanded && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: "0.5px solid var(--border-default)" }}>
            <ArztAnfrageFlowInline compact />
          </div>
        )}
      </ItemRow>
    );
  };

  return (
    <div>
      <TabHeader
        titel={titel || (typ === "patient-prozess" ? "Patient Prozess" : "Angehöriger Monatsschritte")}
        meta={<HeaderMeta modus="fortschritt" text={`${doneCount} von ${total} erledigt`} prozent={total > 0 ? (doneCount / total) * 100 : 0} />}
      />
      <div style={{ background: "var(--bg-elevated)", border: "0.5px solid var(--border-default)", borderRadius: 12, overflow: "hidden" }}>
        {openTasks.map((t, i) => renderTask(t, i, openTasks))}
        {openTasks.length === 0 && <div style={{ padding: 16, fontSize: "var(--text-small)", color: "var(--text-tertiary)", textAlign: "center" }}>Alle Schritte erledigt</div>}
      </div>
      {doneTasks.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <button onClick={() => setShowCompleted(!showCompleted)} className="inline-flex items-center cursor-pointer" style={{ gap: 4, padding: "10px 18px", borderRadius: 999, background: "transparent", border: "none", fontSize: 14, fontWeight: 500, color: "var(--text-secondary)" }}>
            {showCompleted ? <ChevronUp style={{ width: 14, height: 14 }} /> : <ChevronDown style={{ width: 14, height: 14 }} />}
            {showCompleted ? "Erledigte ausblenden" : "Erledigte anzeigen"} ({doneTasks.length})
          </button>
          {showCompleted && (
            <div style={{ background: "var(--bg-elevated)", border: "0.5px solid var(--border-default)", borderRadius: 12, overflow: "hidden", marginTop: 4 }}>
              {doneTasks.map((t, i) => renderTask(t, i, doneTasks))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
