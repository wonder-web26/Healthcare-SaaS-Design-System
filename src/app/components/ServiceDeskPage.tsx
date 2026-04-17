import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Search,
  Plus,
  Headphones,
  Filter,
  ChevronLeft,
  ArrowLeft,
  X,
  Send,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Tag,
  MessageSquare,
  History,
  User,
  ExternalLink,
  Hash,
  Loader2,
  MoreHorizontal,
} from "lucide-react";

/* ── Types ───────────────────────────────── */
type TicketStatus = "offen" | "in_bearbeitung" | "wartend" | "erledigt";
type TicketPriority = "hoch" | "mittel" | "niedrig";

interface TicketComment {
  id: string;
  author: string;
  authorInitialen: string;
  text: string;
  timestamp: string;
}

interface TicketHistoryEntry {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  detail?: string;
}

interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  kategorie: string;
  zustaendigkeit: string;
  patientId: string;
  patientName: string;
  tags: string[];
  created: string;
  updated: string;
  comments: TicketComment[];
  history: TicketHistoryEntry[];
}

/* ── Mock data ───────────────────────────── */
const ticketData: Ticket[] = [
  {
    id: "SD-2026-0418",
    subject: "Kostengutsprache Erneuerung — Müller, Anna",
    description: "Die Kostengutsprache für Patientin Anna Müller läuft am 30.03.2026 ab. Bitte rechtzeitig Verlängerung bei der Krankenkasse beantragen.",
    status: "offen",
    priority: "hoch",
    kategorie: "Abrechnung",
    zustaendigkeit: "Sandra Weber",
    patientId: "P-2026-0041",
    patientName: "Müller, Anna",
    tags: ["#Versicherung", "#Kostengutsprache"],
    created: "25.02.2026, 09:12",
    updated: "25.02.2026, 09:12",
    comments: [
      { id: "c1", author: "System", authorInitialen: "SY", text: "Ticket automatisch erstellt — Kostengutsprache läuft in 33 Tagen ab.", timestamp: "25.02.2026, 09:12" },
    ],
    history: [
      { id: "h1", action: "Ticket erstellt", user: "System", timestamp: "25.02.2026, 09:12", detail: "Automatisch generiert durch Verordnungs-Monitoring" },
    ],
  },
  {
    id: "SD-2026-0415",
    subject: "Lohnanpassung Quellensteuer — Yılmaz, Ayşe",
    description: "Der Quellensteuertarif für Pflegefachkraft Ayşe Yılmaz muss aufgrund Zivilstandsänderung angepasst werden.",
    status: "in_bearbeitung",
    priority: "mittel",
    kategorie: "Lohn & HR",
    zustaendigkeit: "Maria Keller",
    patientId: "",
    patientName: "—",
    tags: ["#Lohn", "#Quellensteuer", "#Mutation"],
    created: "24.02.2026, 14:30",
    updated: "25.02.2026, 10:45",
    comments: [
      { id: "c2", author: "Maria Keller", authorInitialen: "MK", text: "Habe die neuen Unterlagen vom Steueramt erhalten. Werde den Tarif bis Freitag anpassen.", timestamp: "25.02.2026, 10:45" },
      { id: "c3", author: "Admin", authorInitialen: "AD", text: "Bitte auch die BVG-Meldung aktualisieren.", timestamp: "25.02.2026, 11:00" },
    ],
    history: [
      { id: "h2", action: "Ticket erstellt", user: "Admin", timestamp: "24.02.2026, 14:30" },
      { id: "h3", action: "Status geändert", user: "Maria Keller", timestamp: "25.02.2026, 10:45", detail: "offen → in_bearbeitung" },
      { id: "h4", action: "Kommentar hinzugefügt", user: "Maria Keller", timestamp: "25.02.2026, 10:45" },
    ],
  },
  {
    id: "SD-2026-0412",
    subject: "Versicherungsmeldung UVG — Schmid, Thomas",
    description: "Patient Thomas Schmid hat einen Sturz gemeldet. UVG-Meldung muss an die Suva übermittelt werden.",
    status: "offen",
    priority: "hoch",
    kategorie: "Versicherung",
    zustaendigkeit: "Kathrin Meier",
    patientId: "P-2026-0042",
    patientName: "Schmid, Thomas",
    tags: ["#Versicherung", "#UVG", "#Unfall"],
    created: "24.02.2026, 08:15",
    updated: "24.02.2026, 08:15",
    comments: [],
    history: [
      { id: "h5", action: "Ticket erstellt", user: "Kathrin Meier", timestamp: "24.02.2026, 08:15" },
    ],
  },
  {
    id: "SD-2026-0408",
    subject: "Medikamentenplan Update — Weber, Maria",
    description: "Nach dem letzten Arztbesuch muss der Medikamentenplan im System aktualisiert werden. Neue Verordnung liegt vor.",
    status: "wartend",
    priority: "mittel",
    kategorie: "Pflege",
    zustaendigkeit: "Laura Brunner",
    patientId: "P-2026-0043",
    patientName: "Weber, Maria",
    tags: ["#Medikamente", "#Verordnung"],
    created: "22.02.2026, 16:00",
    updated: "23.02.2026, 09:30",
    comments: [
      { id: "c4", author: "Laura Brunner", authorInitialen: "LB", text: "Warte auf die unterschriebene Verordnung vom Hausarzt Dr. Huber.", timestamp: "23.02.2026, 09:30" },
    ],
    history: [
      { id: "h6", action: "Ticket erstellt", user: "Laura Brunner", timestamp: "22.02.2026, 16:00" },
      { id: "h7", action: "Status geändert", user: "Laura Brunner", timestamp: "23.02.2026, 09:30", detail: "offen → wartend" },
    ],
  },
  {
    id: "SD-2026-0401",
    subject: "SRK Schulungsanmeldung — Weber, Sandra",
    description: "Sandra Weber muss für das SRK Aufbaumodul A1 angemeldet werden. Nächster Kurs startet am 15.03.2026.",
    status: "in_bearbeitung",
    priority: "niedrig",
    kategorie: "Schulung",
    zustaendigkeit: "Admin",
    patientId: "",
    patientName: "—",
    tags: ["#SRK", "#Schulung"],
    created: "20.02.2026, 11:00",
    updated: "22.02.2026, 14:00",
    comments: [
      { id: "c5", author: "Admin", authorInitialen: "AD", text: "Anmeldung wurde an SRK gesendet. Bestätigung ausstehend.", timestamp: "22.02.2026, 14:00" },
    ],
    history: [
      { id: "h8", action: "Ticket erstellt", user: "Admin", timestamp: "20.02.2026, 11:00" },
      { id: "h9", action: "Status geändert", user: "Admin", timestamp: "22.02.2026, 14:00", detail: "offen → in_bearbeitung" },
    ],
  },
  {
    id: "SD-2026-0395",
    subject: "Arbeitsvertrag Mutation — Meier, Kathrin",
    description: "Pensum-Änderung von 80% auf 100% per 01.04.2026. Vertragsnachtrag erstellen.",
    status: "erledigt",
    priority: "mittel",
    kategorie: "Lohn & HR",
    zustaendigkeit: "Admin",
    patientId: "",
    patientName: "—",
    tags: ["#Mutation", "#Vertrag", "#Lohn"],
    created: "18.02.2026, 09:00",
    updated: "24.02.2026, 16:30",
    comments: [
      { id: "c6", author: "Admin", authorInitialen: "AD", text: "Vertragsnachtrag erstellt und von beiden Parteien unterzeichnet.", timestamp: "24.02.2026, 16:30" },
    ],
    history: [
      { id: "h10", action: "Ticket erstellt", user: "Admin", timestamp: "18.02.2026, 09:00" },
      { id: "h11", action: "Status geändert", user: "Admin", timestamp: "24.02.2026, 16:30", detail: "in_bearbeitung → erledigt" },
    ],
  },
];

/* ── Config maps ─────────────────────────── */
const statusCfg: Record<TicketStatus, { label: string; bg: string; text: string; dot: string }> = {
  offen: { label: "Offen", bg: "bg-error-light", text: "text-error-foreground", dot: "bg-error" },
  in_bearbeitung: { label: "In Bearbeitung", bg: "bg-warning-light", text: "text-warning-foreground", dot: "bg-warning" },
  wartend: { label: "Wartend", bg: "bg-info-light", text: "text-info-foreground", dot: "bg-info" },
  erledigt: { label: "Erledigt", bg: "bg-success-light", text: "text-success-foreground", dot: "bg-success" },
};

const priorityCfg: Record<TicketPriority, { label: string; bg: string; text: string }> = {
  hoch: { label: "Hoch", bg: "bg-error-light", text: "text-error-foreground" },
  mittel: { label: "Mittel", bg: "bg-warning-light", text: "text-warning-foreground" },
  niedrig: { label: "Niedrig", bg: "bg-muted", text: "text-muted-foreground" },
};

/* ══════════════════════════════════════════ */
export function ServiceDeskPage() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState(ticketData);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("alle");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [newComment, setNewComment] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  // Filtered tickets
  const filtered = useMemo(() => {
    let list = tickets;
    if (filterStatus !== "alle") list = list.filter((t) => t.status === filterStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.subject.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q) ||
          t.kategorie.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q)) ||
          t.patientName.toLowerCase().includes(q)
      );
    }
    return list;
  }, [tickets, search, filterStatus]);

  const counts = {
    alle: tickets.length,
    offen: tickets.filter((t) => t.status === "offen").length,
    in_bearbeitung: tickets.filter((t) => t.status === "in_bearbeitung").length,
    wartend: tickets.filter((t) => t.status === "wartend").length,
    erledigt: tickets.filter((t) => t.status === "erledigt").length,
  };

  const handleAddComment = () => {
    if (!selectedTicket || !newComment.trim()) return;
    const comment: TicketComment = {
      id: `c-${Date.now()}`,
      author: "Admin (Sie)",
      authorInitialen: "AD",
      text: newComment.trim(),
      timestamp: "26.02.2026, " + new Date().toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" }),
    };
    const historyEntry: TicketHistoryEntry = {
      id: `h-${Date.now()}`,
      action: "Kommentar hinzugefügt",
      user: "Admin",
      timestamp: comment.timestamp,
    };
    setTickets((prev) =>
      prev.map((t) =>
        t.id === selectedTicket.id
          ? { ...t, comments: [...t.comments, comment], history: [...t.history, historyEntry], updated: comment.timestamp }
          : t
      )
    );
    setSelectedTicket((prev) =>
      prev ? { ...prev, comments: [...prev.comments, comment], history: [...prev.history, historyEntry] } : prev
    );
    setNewComment("");
  };

  // If viewing a ticket detail
  if (selectedTicket) {
    const tst = statusCfg[selectedTicket.status];
    const tpr = priorityCfg[selectedTicket.priority];

    return (
      <>
        <div className="px-4 md:px-8 pt-5 pb-0">
          <button
            onClick={() => setSelectedTicket(null)}
            className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors -ml-1"
            style={{ fontWeight: 450 }}
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück zur Inbox
          </button>
        </div>

        <div className="px-4 md:px-8 pt-4 pb-10">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            {/* ── Main content ────────────── */}
            <div className="xl:col-span-2 space-y-4">
              {/* Ticket header */}
              <div className="bg-card rounded-2xl border border-border p-5 md:p-6">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="text-[12px] text-primary font-mono" style={{ fontWeight: 500 }}>{selectedTicket.id}</span>
                    <h3 className="text-foreground mt-1">{selectedTicket.subject}</h3>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-[3px] rounded-full text-[11px] ${tst.bg} ${tst.text}`} style={{ fontWeight: 500 }}>
                      <span className={`w-[5px] h-[5px] rounded-full ${tst.dot}`} />
                      {tst.label}
                    </span>
                    <span className={`text-[11px] px-2 py-[2px] rounded-md ${tpr.bg} ${tpr.text}`} style={{ fontWeight: 500 }}>
                      {tpr.label}
                    </span>
                  </div>
                </div>

                <p className="text-[13px] text-muted-foreground leading-relaxed mb-4">
                  {selectedTicket.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {selectedTicket.tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 px-2 py-[3px] rounded-lg bg-primary-light text-primary text-[11px]" style={{ fontWeight: 500 }}>
                      <Hash className="w-3 h-3" />
                      {tag.replace("#", "")}
                    </span>
                  ))}
                </div>
              </div>

              {/* Comments */}
              <div className="bg-card rounded-2xl border border-border overflow-hidden">
                <div className="px-5 py-3 border-b border-border-light flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <h5 className="text-foreground">Kommentare</h5>
                  <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground" style={{ fontWeight: 500 }}>
                    {selectedTicket.comments.length}
                  </span>
                </div>

                <div className="p-4 space-y-3">
                  {selectedTicket.comments.length === 0 ? (
                    <p className="text-[12px] text-muted-foreground text-center py-4">Noch keine Kommentare</p>
                  ) : (
                    selectedTicket.comments.map((c) => (
                      <div key={c.id} className="flex gap-3">
                        <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                          <span className="text-[9px] text-muted-foreground" style={{ fontWeight: 600 }}>{c.authorInitialen}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[12px] text-foreground" style={{ fontWeight: 500 }}>{c.author}</span>
                            <span className="text-[10px] text-muted-foreground">{c.timestamp}</span>
                          </div>
                          <p className="text-[13px] text-muted-foreground leading-relaxed">{c.text}</p>
                        </div>
                      </div>
                    ))
                  )}

                  {/* New comment input */}
                  <div className="flex gap-3 pt-3 border-t border-border-light">
                    <div className="w-8 h-8 rounded-xl bg-primary-light flex items-center justify-center shrink-0">
                      <span className="text-[9px] text-primary" style={{ fontWeight: 600 }}>AD</span>
                    </div>
                    <div className="flex-1">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Kommentar hinzufügen…"
                        rows={2}
                        className="w-full bg-input-background border border-border rounded-xl px-3.5 py-2.5 text-[13px] outline-none focus:ring-[3px] focus:ring-primary/10 focus:border-primary/60 transition-all resize-none placeholder:text-muted-foreground/50"
                        style={{ fontWeight: 400 }}
                      />
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={handleAddComment}
                          disabled={!newComment.trim()}
                          className={`inline-flex items-center gap-1.5 px-3 py-[7px] rounded-xl text-[12px] transition-all ${
                            !newComment.trim()
                              ? "bg-primary/40 text-primary-foreground/60 cursor-not-allowed"
                              : "bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm"
                          }`}
                          style={{ fontWeight: 500 }}
                        >
                          <Send className="w-3.5 h-3.5" />
                          Senden
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Sidebar ────────────────── */}
            <div className="space-y-4">
              {/* Ticket meta */}
              <div className="bg-card rounded-2xl border border-border p-5">
                <h5 className="text-foreground mb-3">Details</h5>
                <div className="space-y-3">
                  {[
                    { label: "Kategorie", value: selectedTicket.kategorie },
                    { label: "Zuständigkeit", value: selectedTicket.zustaendigkeit },
                    { label: "Erstellt", value: selectedTicket.created },
                    { label: "Aktualisiert", value: selectedTicket.updated },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-0.5" style={{ fontWeight: 500 }}>{item.label}</div>
                      <div className="text-[13px] text-foreground" style={{ fontWeight: 400 }}>{item.value}</div>
                    </div>
                  ))}
                </div>

                {/* Patient link */}
                {selectedTicket.patientId && (
                  <div className="mt-4 pt-3 border-t border-border-light">
                    <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1.5" style={{ fontWeight: 500 }}>Verknüpfter Patient</div>
                    <button
                      onClick={() => navigate(`/patienten/${selectedTicket.patientId}`)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-border hover:bg-primary/[0.03] transition-colors text-left"
                    >
                      <div>
                        <div className="text-[13px] text-primary" style={{ fontWeight: 500 }}>{selectedTicket.patientName}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{selectedTicket.patientId}</div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </div>
                )}
              </div>

              {/* History */}
              <div className="bg-card rounded-2xl border border-border overflow-hidden">
                <div className="px-5 py-3 border-b border-border-light flex items-center gap-2">
                  <History className="w-4 h-4 text-primary" />
                  <h5 className="text-foreground">Verlauf</h5>
                </div>
                <div className="p-4">
                  <div className="space-y-0">
                    {selectedTicket.history.map((h, idx) => (
                      <div key={h.id} className="flex gap-3 pb-3 relative">
                        {/* Timeline line */}
                        {idx < selectedTicket.history.length - 1 && (
                          <div className="absolute left-[11px] top-6 bottom-0 w-[2px] bg-border-light" />
                        )}
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0 relative z-10">
                          <div className="w-2 h-2 rounded-full bg-muted-foreground/40" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] text-foreground" style={{ fontWeight: 500 }}>{h.action}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {h.user} · {h.timestamp}
                          </div>
                          {h.detail && (
                            <div className="text-[11px] text-muted-foreground/70 mt-0.5 italic">{h.detail}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── Inbox view ────────────────────────
  return (
    <>
      {/* Page Header */}
      <div className="px-4 md:px-8 pt-7 pb-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-foreground">Service Desk</h2>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              Tickets verwalten, erstellen und bearbeiten
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1.5 px-3 py-[7px] text-[12px] rounded-xl bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm transition-colors"
            style={{ fontWeight: 500 }}
          >
            <Plus className="w-3.5 h-3.5" />
            Ticket erstellen
          </button>
        </div>
      </div>

      <div className="px-4 md:px-8 pt-5 pb-10">
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          {/* Filters */}
          <div className="px-5 pt-4 pb-3 border-b border-border-light">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Status tabs */}
              <div className="flex gap-1.5 overflow-x-auto">
                {(["alle", "offen", "in_bearbeitung", "wartend", "erledigt"] as const).map((s) => {
                  const isActive = filterStatus === s;
                  const label = s === "alle" ? "Alle" : s === "in_bearbeitung" ? "In Bearbeitung" : s === "wartend" ? "Wartend" : s === "offen" ? "Offen" : "Erledigt";
                  return (
                    <button
                      key={s}
                      onClick={() => setFilterStatus(s)}
                      className={`flex items-center gap-1.5 px-2.5 py-[5px] rounded-lg text-[12px] border transition-all whitespace-nowrap ${
                        isActive
                          ? "border-primary/20 bg-primary-light text-primary"
                          : "border-border bg-card text-muted-foreground hover:bg-secondary/60"
                      }`}
                      style={{ fontWeight: isActive ? 500 : 400 }}
                    >
                      {label}
                      <span className={`text-[10px] px-[5px] py-[1px] rounded-md ${
                        isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                      }`} style={{ fontWeight: 600 }}>
                        {counts[s]}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex-1" />

              {/* Full text search */}
              <div className="flex items-center gap-2 bg-background rounded-xl px-3 py-[6px] border border-border-light min-w-[220px] max-w-[320px]">
                <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Suche nach ID, Betreff, Tags…"
                  className="bg-transparent outline-none text-[12px] flex-1 placeholder:text-muted-foreground/50"
                  style={{ fontWeight: 400 }}
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/30">
                  {["Ticket-ID", "Betreff", "Kategorie", "Priorität", "Zuständigkeit", "Status", "Erstellt"].map((col) => (
                    <th key={col} className="px-4 py-2.5 text-left">
                      <span className="text-[11px] text-muted-foreground uppercase tracking-wider" style={{ fontWeight: 500 }}>{col}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-[13px] text-muted-foreground">
                      Keine Tickets für diesen Filter gefunden.
                    </td>
                  </tr>
                ) : (
                  filtered.map((ticket) => {
                    const tst = statusCfg[ticket.status];
                    const tpr = priorityCfg[ticket.priority];
                    return (
                      <tr
                        key={ticket.id}
                        onClick={() => setSelectedTicket(ticket)}
                        className="border-t border-border-light hover:bg-primary/[0.02] transition-colors cursor-pointer group"
                      >
                        <td className="px-4 py-3">
                          <span className="text-[12px] text-primary font-mono group-hover:underline" style={{ fontWeight: 500 }}>
                            {ticket.id}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <span className="text-[13px] text-foreground" style={{ fontWeight: 500 }}>{ticket.subject}</span>
                            <div className="flex gap-1 mt-1">
                              {ticket.tags.map((tag) => (
                                null
                              ))}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[11px] px-2 py-[2px] rounded-md bg-muted text-foreground" style={{ fontWeight: 500 }}>
                            {ticket.kategorie}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[11px] px-2 py-[2px] rounded-md ${tpr.bg} ${tpr.text}`} style={{ fontWeight: 500 }}>
                            {tpr.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[12px] text-muted-foreground">{ticket.zustaendigkeit}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-[2px] rounded-full text-[11px] ${tst.bg} ${tst.text}`} style={{ fontWeight: 500 }}>
                            <span className={`w-[5px] h-[5px] rounded-full ${tst.dot}`} />
                            {tst.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[12px] text-muted-foreground whitespace-nowrap">{ticket.created}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Create Ticket Modal ──────────── */}
      {showCreate && (
        <CreateTicketModal
          onClose={() => setShowCreate(false)}
          onCreate={(ticket) => {
            setTickets((prev) => [ticket, ...prev]);
            setShowCreate(false);
          }}
        />
      )}
    </>
  );
}

/* ── Create Ticket Modal ─────────────────── */
function CreateTicketModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (t: Ticket) => void;
}) {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [kategorie, setKategorie] = useState("Pflege");
  const [priority, setPriority] = useState<TicketPriority>("mittel");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const addTag = () => {
    if (tagInput.trim()) {
      const tag = tagInput.trim().startsWith("#") ? tagInput.trim() : `#${tagInput.trim()}`;
      if (!tags.includes(tag)) setTags([...tags, tag]);
      setTagInput("");
    }
  };

  const handleCreate = () => {
    if (!subject.trim()) return;
    const now = "26.02.2026, " + new Date().toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" });
    const ticket: Ticket = {
      id: `SD-2026-${String(419 + Math.floor(Math.random() * 80)).padStart(4, "0")}`,
      subject: subject.trim(),
      description: description.trim(),
      status: "offen",
      priority,
      kategorie,
      zustaendigkeit: "Admin (Sie)",
      patientId: "",
      patientName: "—",
      tags,
      created: now,
      updated: now,
      comments: [],
      history: [{ id: `h-${Date.now()}`, action: "Ticket erstellt", user: "Admin", timestamp: now }],
    };
    onCreate(ticket);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-card rounded-2xl shadow-2xl border border-border w-full max-w-[560px] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-light shrink-0">
          <h4 className="text-foreground">Neues Ticket erstellen</h4>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-secondary transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 overflow-y-auto">
          <div className="space-y-1.5">
            <label className="text-[13px] text-foreground" style={{ fontWeight: 500 }}>
              Betreff <span className="text-error">*</span>
            </label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Kurze Beschreibung des Problems"
              className="w-full bg-input-background border border-border rounded-xl px-3.5 py-2.5 text-[13px] outline-none focus:ring-[3px] focus:ring-primary/10 focus:border-primary/60 transition-all placeholder:text-muted-foreground/50"
              style={{ fontWeight: 400 }}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] text-foreground" style={{ fontWeight: 500 }}>Beschreibung</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detaillierte Beschreibung…"
              rows={3}
              className="w-full bg-input-background border border-border rounded-xl px-3.5 py-2.5 text-[13px] outline-none focus:ring-[3px] focus:ring-primary/10 focus:border-primary/60 transition-all resize-none placeholder:text-muted-foreground/50"
              style={{ fontWeight: 400 }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[13px] text-foreground" style={{ fontWeight: 500 }}>Kategorie</label>
              <select
                value={kategorie}
                onChange={(e) => setKategorie(e.target.value)}
                className="w-full bg-input-background border border-border rounded-xl px-3.5 py-2.5 text-[13px] outline-none focus:ring-[3px] focus:ring-primary/10 focus:border-primary/60 transition-all appearance-none"
                style={{ fontWeight: 400 }}
              >
                {["Pflege", "Abrechnung", "Versicherung", "Lohn & HR", "Schulung", "IT", "Administration"].map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[13px] text-foreground" style={{ fontWeight: 500 }}>Priorität</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TicketPriority)}
                className="w-full bg-input-background border border-border rounded-xl px-3.5 py-2.5 text-[13px] outline-none focus:ring-[3px] focus:ring-primary/10 focus:border-primary/60 transition-all appearance-none"
                style={{ fontWeight: 400 }}
              >
                <option value="hoch">Hoch</option>
                <option value="mittel">Mittel</option>
                <option value="niedrig">Niedrig</option>
              </select>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <label className="text-[13px] text-foreground" style={{ fontWeight: 500 }}>Tags</label>
            <div className="flex items-center gap-2">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                placeholder="#Lohn, #Versicherung…"
                className="flex-1 bg-input-background border border-border rounded-xl px-3.5 py-2 text-[13px] outline-none focus:ring-[3px] focus:ring-primary/10 focus:border-primary/60 transition-all placeholder:text-muted-foreground/50"
                style={{ fontWeight: 400 }}
              />
              <button
                onClick={addTag}
                className="px-3 py-2 rounded-xl border border-border bg-card hover:bg-secondary/60 transition-colors text-[12px]"
                style={{ fontWeight: 500 }}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 px-2 py-[3px] rounded-lg bg-primary-light text-primary text-[11px]" style={{ fontWeight: 500 }}>
                    {tag}
                    <button onClick={() => setTags(tags.filter((t) => t !== tag))} className="hover:text-error transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border-light bg-muted/20 rounded-b-2xl shrink-0">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-[13px] text-foreground hover:bg-secondary transition-colors" style={{ fontWeight: 500 }}>
            Abbrechen
          </button>
          <button
            onClick={handleCreate}
            disabled={!subject.trim()}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] text-primary-foreground shadow-sm transition-all ${
              !subject.trim() ? "bg-primary/40 cursor-not-allowed" : "bg-primary hover:bg-primary-hover"
            }`}
            style={{ fontWeight: 500 }}
          >
            <Plus className="w-4 h-4" />
            Ticket erstellen
          </button>
        </div>
      </div>
    </div>
  );
}
