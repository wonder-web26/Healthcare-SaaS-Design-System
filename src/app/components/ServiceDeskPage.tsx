import { useMemo } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router";
import {
  Search,
  Plus,
  X,
  ArrowLeft,
  Zap,
  MessageSquare,
} from "lucide-react";
import {
  unifiedEntries,
  allWorkflowTypen,
  allTicketTypen,
  workflowTypLabel,
  ticketTypLabel,
  type Quelle,
  type UnifiedEntry,
  type WorkflowTyp,
  type TicketTyp,
} from "../../lib/mocks/service-desk-unified";

const TODAY = "2026-03-03";

type StatusKey = "offen" | "in_bearbeitung" | "erledigt";

const statusCfg: Record<StatusKey, { label: string; dot: string; bg: string; text: string }> = {
  offen: { label: "Offen", dot: "bg-error", bg: "bg-error-light", text: "text-error-foreground" },
  in_bearbeitung: { label: "In Bearbeitung", dot: "bg-warning", bg: "bg-warning-light", text: "text-warning-foreground" },
  erledigt: { label: "Erledigt", dot: "bg-success", bg: "bg-success-light", text: "text-success-foreground" },
};

function faelligkeitStatus(faellig: string | null): "overdue" | "today" | "later" | null {
  if (!faellig) return null;
  if (faellig < TODAY) return "overdue";
  if (faellig === TODAY) return "today";
  return "later";
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

const faelligDot: Record<string, string> = {
  overdue: "bg-error",
  today: "bg-warning",
  later: "bg-muted-foreground/30",
};

const faelligText: Record<string, string> = {
  overdue: "text-error-foreground",
  today: "text-warning-foreground",
  later: "text-muted-foreground",
};

/* ══════════════════════════════════════════ */

export function ServiceDeskPage() {
  const navigate = useNavigate();
  const { ticketId } = useParams<{ ticketId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const quelleParam = searchParams.get("quelle") as Quelle | null;
  const typParam = searchParams.get("typ");
  const statusParam = searchParams.get("status") as StatusKey | null;
  const ueberfaelligParam = searchParams.get("ueberfaellig") === "true";
  const qParam = searchParams.get("q") || "";

  // Infer quelle from typ if set
  const effectiveQuelle: Quelle | null = typParam
    ? allWorkflowTypen.includes(typParam as WorkflowTyp) ? "workflow" : "ticket"
    : quelleParam;

  const activeTab: "alle" | "workflow" | "ticket" =
    effectiveQuelle === "workflow" ? "workflow" : effectiveQuelle === "ticket" ? "ticket" : "alle";

  // If a specific ticket is selected via URL param, show detail
  const selectedEntry = ticketId ? unifiedEntries.find((e) => e.id === ticketId) : null;

  const filtered = useMemo(() => {
    let list = unifiedEntries;
    if (effectiveQuelle) list = list.filter((e) => e.quelle === effectiveQuelle);
    if (typParam) list = list.filter((e) => e.typ === typParam);
    if (statusParam) list = list.filter((e) => e.status === statusParam);
    if (ueberfaelligParam) list = list.filter((e) => e.faellig && e.faellig < TODAY);
    if (qParam.trim()) {
      const q = qParam.toLowerCase();
      list = list.filter(
        (e) =>
          e.titel.toLowerCase().includes(q) ||
          (e.betroffenePerson?.name.toLowerCase().includes(q) ?? false)
      );
    }
    return list;
  }, [effectiveQuelle, typParam, statusParam, ueberfaelligParam, qParam]);

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(searchParams);
    if (value === null) next.delete(key);
    else next.set(key, value);
    setSearchParams(next, { replace: true });
  }

  function clearFilters() {
    setSearchParams({}, { replace: true });
  }

  // Active filter chips
  const chips: { label: string; key: string }[] = [];
  if (typParam) {
    const label =
      workflowTypLabel[typParam as WorkflowTyp] ?? ticketTypLabel[typParam as TicketTyp] ?? typParam;
    chips.push({ label, key: "typ" });
  }
  if (statusParam) chips.push({ label: statusCfg[statusParam]?.label ?? statusParam, key: "status" });
  if (ueberfaelligParam) chips.push({ label: "Überfällig", key: "ueberfaellig" });

  // Subtitle
  const subtitleParts: string[] = [`${filtered.length} Einträge`];
  if (typParam) {
    subtitleParts.push(workflowTypLabel[typParam as WorkflowTyp] ?? ticketTypLabel[typParam as TicketTyp] ?? typParam);
  } else if (activeTab !== "alle") {
    subtitleParts.push(activeTab === "workflow" ? "Workflow-Aufgaben" : "Tickets");
  } else {
    subtitleParts.push("Alle");
  }

  // ── Detail view ──
  if (selectedEntry) {
    const st = statusCfg[selectedEntry.status];
    const fs = faelligkeitStatus(selectedEntry.faellig);
    return (
      <>
        <div className="px-4 md:px-8 pt-5">
          <button
            onClick={() => navigate("/servicedesk")}
            className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors -ml-1 cursor-pointer"
            style={{ fontWeight: 450 }}
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück zur Liste
          </button>
        </div>
        <div className="px-4 md:px-8 pt-4 pb-10">
          <div className="bg-card rounded-2xl border border-border p-5 md:p-6 max-w-3xl">
            <div className="flex items-center gap-2 mb-3">
              {selectedEntry.quelle === "workflow" ? (
                <Zap className="w-3.5 h-3.5 text-primary" />
              ) : (
                <MessageSquare className="w-3.5 h-3.5 text-info" />
              )}
              <span className="text-[11px] text-muted-foreground" style={{ fontWeight: 500 }}>
                {selectedEntry.quelle === "workflow" ? "Workflow-Aufgabe" : "Service-Ticket"} · {selectedEntry.id}
              </span>
              <span className={`ml-auto inline-flex items-center gap-1.5 px-2 py-[2px] rounded-full text-[11px] ${st.bg} ${st.text}`} style={{ fontWeight: 500 }}>
                <span className={`w-[5px] h-[5px] rounded-full ${st.dot}`} />
                {st.label}
              </span>
            </div>
            <h3 className="text-foreground mb-2">{selectedEntry.titel}</h3>
            <p className="text-[13px] text-muted-foreground leading-relaxed mb-4">{selectedEntry.kontext}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-[12px]">
              <div>
                <div className="text-muted-foreground/60 uppercase tracking-wider text-[10px] mb-0.5" style={{ fontWeight: 500 }}>Typ</div>
                <div className="text-foreground" style={{ fontWeight: 500 }}>{selectedEntry.typLabel}</div>
              </div>
              {selectedEntry.betroffenePerson && (
                <div>
                  <div className="text-muted-foreground/60 uppercase tracking-wider text-[10px] mb-0.5" style={{ fontWeight: 500 }}>Betroffene Person</div>
                  <div className="text-foreground" style={{ fontWeight: 500 }}>{selectedEntry.betroffenePerson.name}</div>
                </div>
              )}
              <div>
                <div className="text-muted-foreground/60 uppercase tracking-wider text-[10px] mb-0.5" style={{ fontWeight: 500 }}>Verantwortlich</div>
                <div className="text-foreground" style={{ fontWeight: 500 }}>{selectedEntry.verantwortlich.name}</div>
              </div>
              <div>
                <div className="text-muted-foreground/60 uppercase tracking-wider text-[10px] mb-0.5" style={{ fontWeight: 500 }}>Erstellt</div>
                <div className="text-muted-foreground">{formatDate(selectedEntry.erstellt)}</div>
              </div>
              {selectedEntry.faellig && (
                <div>
                  <div className="text-muted-foreground/60 uppercase tracking-wider text-[10px] mb-0.5" style={{ fontWeight: 500 }}>Fällig</div>
                  <div className={fs === "overdue" ? "text-error-foreground" : fs === "today" ? "text-warning-foreground" : "text-muted-foreground"} style={{ fontWeight: 500 }}>
                    {formatDate(selectedEntry.faellig)}
                    {fs === "overdue" && " · überfällig"}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── List view ──
  return (
    <>
      {/* Page header */}
      <div className="px-4 md:px-8 pt-7 pb-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-foreground">Service Desk</h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              {subtitleParts.join(" · ")}
            </p>
          </div>
          <button
            onClick={() => {/* placeholder */}}
            className="inline-flex items-center gap-1.5 px-3 py-[7px] text-[12px] rounded-xl bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm transition-colors cursor-pointer"
            style={{ fontWeight: 500 }}
          >
            <Plus className="w-3.5 h-3.5" />
            Neues Ticket
          </button>
        </div>
      </div>

      <div className="px-4 md:px-8 pt-5 pb-10">
        <div className="bg-card rounded-2xl border border-border overflow-hidden">

          {/* Tabs + search */}
          <div className="px-5 pt-4 pb-3 border-b border-border-light">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Tabs */}
              <div className="flex gap-1.5">
                {([["alle", "Alle"], ["workflow", "Workflow"], ["ticket", "Tickets"]] as const).map(([key, label]) => {
                  const isActive = activeTab === key;
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        const next = new URLSearchParams(searchParams);
                        next.delete("typ");
                        if (key === "alle") next.delete("quelle");
                        else next.set("quelle", key);
                        setSearchParams(next, { replace: true });
                      }}
                      className={`px-2.5 py-[5px] rounded-lg text-[12px] border transition-all cursor-pointer ${
                        isActive
                          ? "border-primary/20 bg-primary-light text-primary"
                          : "border-border bg-card text-muted-foreground hover:bg-secondary/60"
                      }`}
                      style={{ fontWeight: isActive ? 500 : 400 }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <div className="flex-1" />

              {/* Search */}
              <div className="flex items-center gap-2 bg-background rounded-xl px-3 py-[6px] border border-border-light min-w-[220px] max-w-[320px]">
                <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <input
                  value={qParam}
                  onChange={(e) => setParam("q", e.target.value || null)}
                  placeholder="Suche nach Titel, Person…"
                  className="bg-transparent outline-none text-[12px] flex-1 placeholder:text-muted-foreground/50"
                  style={{ fontWeight: 400 }}
                />
              </div>
            </div>

            {/* Filter chips */}
            {chips.length > 0 && (
              <div className="flex items-center gap-1.5 mt-2.5">
                {chips.map((chip) => (
                  <button
                    key={chip.key}
                    onClick={() => setParam(chip.key, null)}
                    className="inline-flex items-center gap-1 px-2 py-[3px] rounded-lg bg-primary-light text-primary text-[11px] transition-colors hover:bg-primary/15 cursor-pointer"
                    style={{ fontWeight: 500 }}
                  >
                    {chip.label}
                    <X className="w-3 h-3" />
                  </button>
                ))}
                <button
                  onClick={clearFilters}
                  className="text-[11px] text-muted-foreground hover:text-foreground transition-colors px-1 cursor-pointer"
                  style={{ fontWeight: 500 }}
                >
                  Alle zurücksetzen
                </button>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/30">
                  {["Eintrag", "Betroffene Person", "Typ", "Fällig", "Verantwortlich", "Status"].map((col) => (
                    <th key={col} className="px-4 py-2.5 text-left">
                      <span className="text-[11px] text-muted-foreground uppercase tracking-wider" style={{ fontWeight: 500 }}>{col}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-[13px] text-muted-foreground">
                      Keine Einträge mit diesem Filter gefunden.
                    </td>
                  </tr>
                ) : (
                  filtered.map((entry) => {
                    const st = statusCfg[entry.status];
                    const fs = faelligkeitStatus(entry.faellig);
                    return (
                      <tr
                        key={entry.id}
                        onClick={() => navigate(`/servicedesk/${entry.id}`)}
                        className="border-t border-border-light hover:bg-primary/[0.02] transition-colors cursor-pointer group"
                      >
                        {/* Entry */}
                        <td className="px-4 py-3 max-w-[360px]">
                          <div className="flex items-start gap-2">
                            {entry.quelle === "workflow" ? (
                              <Zap className="w-3.5 h-3.5 text-primary/50 shrink-0 mt-0.5" />
                            ) : (
                              <MessageSquare className="w-3.5 h-3.5 text-info/50 shrink-0 mt-0.5" />
                            )}
                            <div className="min-w-0">
                              <div className="text-[13px] text-foreground truncate group-hover:text-primary transition-colors" style={{ fontWeight: 500 }}>
                                {entry.titel}
                              </div>
                              <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                                {entry.kontext}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Betroffene Person */}
                        <td className="px-4 py-3">
                          {entry.betroffenePerson ? (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                                <span className="text-[8px] text-muted-foreground" style={{ fontWeight: 600 }}>
                                  {entry.betroffenePerson.initialen}
                                </span>
                              </div>
                              <span className="text-[12px] text-foreground">{entry.betroffenePerson.name}</span>
                            </div>
                          ) : (
                            <span className="text-[12px] text-muted-foreground/40">–</span>
                          )}
                        </td>

                        {/* Typ */}
                        <td className="px-4 py-3">
                          <span className={`text-[11px] px-2 py-[2px] rounded-md ${
                            entry.quelle === "workflow" ? "bg-primary-light text-primary" : "bg-info-light text-info-foreground"
                          }`} style={{ fontWeight: 500 }}>
                            {entry.typLabel}
                          </span>
                        </td>

                        {/* Fällig */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {entry.faellig ? (
                            <div className="flex items-center gap-1.5">
                              {fs && <span className={`w-[5px] h-[5px] rounded-full ${faelligDot[fs]}`} />}
                              <span className={`text-[12px] ${fs ? faelligText[fs] : "text-muted-foreground"}`}>
                                {formatDate(entry.faellig)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[12px] text-muted-foreground/40">–</span>
                          )}
                        </td>

                        {/* Verantwortlich */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                              <span className="text-[8px] text-muted-foreground" style={{ fontWeight: 600 }}>
                                {entry.verantwortlich.initialen}
                              </span>
                            </div>
                            <span className="text-[12px] text-muted-foreground">{entry.verantwortlich.name}</span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-[2px] rounded-full text-[11px] ${st.bg} ${st.text}`} style={{ fontWeight: 500 }}>
                            <span className={`w-[5px] h-[5px] rounded-full ${st.dot}`} />
                            {st.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
