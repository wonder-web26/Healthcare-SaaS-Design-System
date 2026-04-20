import { useNavigate } from "react-router";
import { Plus, TrendingUp, ArrowRight } from "lucide-react";

/* ── Mock data ── */

const user = { firstName: "Maria", lastName: "Keller" };
const now = { weekday: "Dienstag", date: "3. März 2026", time: "08:14", hour: 8 };

type TaskStatus = "overdue" | "today" | "later";

interface FocusTask {
  id: string;
  title: string;
  context: string;
  clientName: string;
  clientInitials: string;
  clientId: string;
  pill: string;
  status: TaskStatus;
}

const focusTasks: FocusTask[] = [
  {
    id: "W-0145",
    title: "Re-Assessment bei Monika Brunner durchführen",
    context: "Seit 3 Tagen überfällig · letzte Pflegeeinstufung abgelaufen",
    clientName: "Monika Brunner",
    clientInitials: "MB",
    clientId: "PAT-2026-0001",
    pill: "Heute",
    status: "overdue",
  },
  {
    id: "W-0146",
    title: "KLV-Kontrolle für Hans Keller freigeben",
    context: "Steckt seit 5 Tagen in Schritt 4 · blockiert Aktivierung",
    clientName: "Hans Keller",
    clientInitials: "HK",
    clientId: "PAT-2026-0003",
    pill: "Heute",
    status: "today",
  },
  {
    id: "T-0090",
    title: "Verordnung für Ruth Fischer erneuern",
    context: "Läuft in 3 Tagen ab · Arzt bereits kontaktiert",
    clientName: "Ruth Fischer",
    clientInitials: "RF",
    clientId: "PAT-2026-0005",
    pill: "04.03.",
    status: "later",
  },
];

const remainingCount = 5;

const teamPulse = {
  activeClients: { value: 128, trend: 6 },
  onboarding: { value: 6, overdue: 1 },
  compliance: { value: 20, trend: 3 },
};

/* ── Helpers ── */

function getGreeting(hour: number): string {
  if (hour < 11) return "Guten Morgen";
  if (hour < 17) return "Guten Tag";
  return "Guten Abend";
}

const statusBorder: Record<TaskStatus, string> = {
  overdue: "border-l-error",
  today: "border-l-warning",
  later: "border-l-border",
};

const statusAvatarBg: Record<TaskStatus, string> = {
  overdue: "bg-error-light text-error-foreground",
  today: "bg-warning-light text-warning-foreground",
  later: "bg-muted text-muted-foreground",
};

const statusPillClass: Record<TaskStatus, string> = {
  overdue: "bg-error-light text-error-foreground",
  today: "bg-warning-light text-warning-foreground",
  later: "bg-muted text-muted-foreground",
};

/* ── Component ── */

export function DashboardHero() {
  const navigate = useNavigate();
  const greeting = getGreeting(now.hour);
  const overdueCount = focusTasks.filter((t) => t.status === "overdue").length;

  const summary =
    overdueCount > 0
      ? `Dein Tag beginnt mit ${overdueCount} dringenden ${overdueCount === 1 ? "Punkt" : "Punkten"}`
      : `Heute nichts Überfälliges – ${focusTasks.length} Aufgaben offen`;

  return (
    <div>
      {/* ── Personal header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-foreground">
            {greeting}, {user.firstName}
          </h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            {now.weekday}, {now.date}, {now.time} Uhr · {summary}
          </p>
        </div>
        <button
          onClick={() => navigate("/onboarding/neu")}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-[7px] text-[12px] rounded-xl bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm transition-colors cursor-pointer shrink-0"
          style={{ fontWeight: 500 }}
        >
          <Plus className="w-3.5 h-3.5" />
          Neuer Klient
        </button>
        {/* Mobile FAB */}
        <button
          onClick={() => navigate("/onboarding/neu")}
          className="sm:hidden fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary-hover flex items-center justify-center cursor-pointer"
          aria-label="Neuer Klient"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* ── Two-column grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-5">
        {/* Left: Focus tasks (2/3) */}
        <div className="lg:col-span-2">
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2.5" style={{ fontWeight: 600 }}>
            Dein Fokus heute
          </div>
          <div className="space-y-2">
            {focusTasks.map((task) => (
              <button
                key={task.id}
                aria-label={`${task.title} – ${task.clientName}${task.status === "overdue" ? ", überfällig" : ""}`}
                className={`w-full flex items-center gap-3 bg-card rounded-xl border border-border border-l-[3px] ${statusBorder[task.status]} px-4 py-3 text-left transition-colors hover:bg-secondary/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring cursor-pointer`}
                onClick={() => navigate(`/servicedesk?id=${task.id}`)}
              >
                {/* Avatar */}
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${statusAvatarBg[task.status]}`}>
                  <span className="text-[11px]" style={{ fontWeight: 600 }}>{task.clientInitials}</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-foreground truncate" style={{ fontWeight: 600 }}>
                    {task.title}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                    {task.context}
                  </div>
                </div>

                {/* Pill */}
                <span className={`text-[11px] px-2 py-[2px] rounded-full shrink-0 ${statusPillClass[task.status]}`} style={{ fontWeight: 500 }}>
                  {task.pill}
                </span>
              </button>
            ))}
          </div>

          {/* Remaining tasks link */}
          <div className="flex items-center justify-between mt-2.5 px-1">
            <span className="text-[12px] text-muted-foreground">
              Plus {remainingCount} weitere Aufgaben in dieser Woche
            </span>
            <button
              onClick={() => navigate("/aufgaben")}
              className="inline-flex items-center gap-1 text-[12px] text-primary rounded-md px-1.5 py-0.5 -my-0.5 transition-colors hover:bg-primary-light focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring cursor-pointer"
              style={{ fontWeight: 500 }}
            >
              Alle anzeigen
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Right: Team Pulse (1/3) */}
        <div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2.5" style={{ fontWeight: 600 }}>
            Team-Pulse
          </div>
          <div className="bg-card rounded-xl border border-border divide-y divide-border-light">
            {/* Active clients */}
            <button
              aria-label={`${teamPulse.activeClients.value} aktive Klienten, plus ${teamPulse.activeClients.trend} gegenüber Vormonat`}
              className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors hover:bg-secondary/30 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring cursor-pointer rounded-t-xl"
              onClick={() => navigate("/klienten?status=aktiv")}
            >
              <div>
                <div className="text-[11px] text-muted-foreground" style={{ fontWeight: 500 }}>Aktive Klienten</div>
                <div className="text-[22px] text-foreground tracking-tight leading-none mt-1 tabular-nums" style={{ fontWeight: 700 }}>
                  {teamPulse.activeClients.value}
                </div>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-success" style={{ fontWeight: 600 }}>
                <TrendingUp className="w-3 h-3" />
                <span className="tabular-nums">+{teamPulse.activeClients.trend}</span>
              </div>
            </button>

            {/* Onboarding */}
            <div className="flex items-center justify-between px-4 py-3">
              <button
                aria-label={`${teamPulse.onboarding.value} Klienten im Onboarding`}
                className="text-left flex-1 transition-colors rounded-md -m-1 p-1 hover:bg-secondary/30 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring cursor-pointer"
                onClick={() => navigate("/onboarding")}
              >
                <div className="text-[11px] text-muted-foreground" style={{ fontWeight: 500 }}>Im Onboarding</div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-[22px] text-foreground tracking-tight leading-none tabular-nums" style={{ fontWeight: 700 }}>
                    {teamPulse.onboarding.value}
                  </span>
                </div>
              </button>
              {teamPulse.onboarding.overdue > 0 && (
                <button
                  aria-label={`${teamPulse.onboarding.overdue} überfällige Onboarding-Klienten anzeigen`}
                  className="text-[11px] text-error rounded-md px-1.5 py-0.5 transition-colors hover:bg-error-light focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring cursor-pointer"
                  style={{ fontWeight: 600 }}
                  onClick={() => navigate("/onboarding?status=ueberfaellig")}
                >
                  {teamPulse.onboarding.overdue} überfällig
                </button>
              )}
            </div>

            {/* Compliance */}
            <button
              aria-label={`${teamPulse.compliance.value} offene Compliance-Punkte, plus ${teamPulse.compliance.trend} gegenüber Vormonat`}
              className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors hover:bg-secondary/30 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring cursor-pointer rounded-b-xl"
              onClick={() => {
                document.getElementById("compliance-section")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <div>
                <div className="text-[11px] text-muted-foreground" style={{ fontWeight: 500 }}>Compliance offen</div>
                <div className="text-[22px] text-foreground tracking-tight leading-none mt-1 tabular-nums" style={{ fontWeight: 700 }}>
                  {teamPulse.compliance.value}
                </div>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-warning" style={{ fontWeight: 600 }}>
                <TrendingUp className="w-3 h-3" />
                <span className="tabular-nums">+{teamPulse.compliance.trend}</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
