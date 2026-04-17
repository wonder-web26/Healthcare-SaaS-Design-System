import React from "react";
import { useNavigate } from "react-router";
import {
  Users,
  ArrowRight,
  CalendarDays,
  Plus,
  ClipboardCheck,
  GraduationCap,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  UserPlus,
} from "lucide-react";
import { patients } from "./patientData";

/* ══════════════════════════════════════════
   MOCK DATA
   ══════════════════════════════════════════ */

const klientenBreakdown = [
  { label: "Leicht", count: 52, dot: "bg-success" },
  { label: "Mittel", count: 48, dot: "bg-warning" },
  { label: "Schwer", count: 28, dot: "bg-error" },
];

const onboardingCount = 6;
const onboardingBreakdown = [
  { label: "Dokumentation ausstehend", count: 3 },
  { label: "Vertrag in Prüfung", count: 2 },
  { label: "Erstgespräch geplant", count: 1 },
];

const complianceData = {
  srkAnmeldungen: 3,
  reAssessments: 4,
};

interface FaelligeAufgabe {
  id: string;
  klient: string;
  klientId: string;
  aufgabe: string;
  faellig: string;
  verantwortlich: string;
  overdue: boolean;
}

const faelligeAufgaben: FaelligeAufgabe[] = [
  { id: "1", klient: "Monika Brunner", klientId: "PAT-2026-0001", aufgabe: "Re-Assessment durchführen", faellig: "Heute", verantwortlich: "S. Weber", overdue: true },
  { id: "2", klient: "Hans Keller", klientId: "PAT-2026-0003", aufgabe: "SRK-Kursanmeldung prüfen", faellig: "Heute", verantwortlich: "K. Meier", overdue: true },
  { id: "3", klient: "Ruth Fischer", klientId: "PAT-2026-0005", aufgabe: "Verordnung erneuern", faellig: "04.03.2026", verantwortlich: "S. Weber", overdue: false },
  { id: "4", klient: "Peter Müller", klientId: "PAT-2026-0002", aufgabe: "Bankdaten verifizieren", faellig: "05.03.2026", verantwortlich: "M. Keller", overdue: false },
  { id: "5", klient: "Anna Schmid", klientId: "PAT-2026-0006", aufgabe: "Krankenkassenkarte hochladen", faellig: "06.03.2026", verantwortlich: "K. Meier", overdue: false },
  { id: "6", klient: "Jakob Weber", klientId: "PAT-2026-0007", aufgabe: "Erstgespräch-Protokoll einreichen", faellig: "07.03.2026", verantwortlich: "L. Brunner", overdue: false },
  { id: "7", klient: "Ursula Huber", klientId: "PAT-2026-0008", aufgabe: "Pflegeplan aktualisieren", faellig: "08.03.2026", verantwortlich: "S. Weber", overdue: false },
  { id: "8", klient: "Karl Meier", klientId: "PAT-2026-0009", aufgabe: "Stempelkontrolle abschliessen", faellig: "10.03.2026", verantwortlich: "M. Keller", overdue: false },
];

/* ══════════════════════════════════════════
   MAIN DASHBOARD
   ══════════════════════════════════════════ */
export function DashboardPage() {
  const navigate = useNavigate();

  return (
    <>
      {/* ── Page Header ── */}
      <div className="px-4 md:px-8 pt-7 pb-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-foreground">Operations-Cockpit</h2>
              <span className="text-[11px] px-2 py-[3px] rounded-lg bg-primary-light text-primary" style={{ fontWeight: 500 }}>
                Live
              </span>
            </div>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              Dienstag, 3. März 2026 · Operative Steuerungsübersicht
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-1.5 px-3 py-[7px] text-[12px] rounded-xl border border-border bg-card hover:bg-secondary/60 transition-colors cursor-pointer" style={{ fontWeight: 500 }}>
              <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
              März 2026
            </button>
            <button
              onClick={() => navigate("/onboarding")}
              className="inline-flex items-center gap-1.5 px-3 py-[7px] text-[12px] rounded-xl bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm transition-colors cursor-pointer"
              style={{ fontWeight: 500 }}
            >
              <Plus className="w-3.5 h-3.5" />
              Neuer Klient
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          ROW 1 – KPI TILES
          ══════════════════════════════════════ */}
      <div className="px-4 md:px-8 pt-5">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">

          {/* ── SECTION 1: Aktive Klienten ── */}
          <div
            className="bg-card rounded-2xl border border-border p-5 hover:shadow-sm transition-all cursor-pointer group md:col-span-2"
            onClick={() => navigate("/patienten")}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <button className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100 cursor-pointer" style={{ fontWeight: 500 }}>
                Details
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
            <div className="text-[40px] text-foreground tracking-tight leading-none" style={{ fontWeight: 700 }}>
              128
            </div>
            <div className="text-[13px] text-muted-foreground mt-1" style={{ fontWeight: 500 }}>
              Aktive Klienten
            </div>
            <div className="mt-4 flex items-center gap-5">
              {klientenBreakdown.map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${item.dot}`} />
                  <span className="text-[12px] text-muted-foreground">
                    {item.label}
                  </span>
                  <span className="text-[13px] text-foreground tabular-nums" style={{ fontWeight: 600 }}>
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── SECTION 2: Onboarding ── */}
          <div
            className="bg-card rounded-2xl border border-border p-5 hover:shadow-sm transition-all cursor-pointer group md:col-span-2 xl:col-span-2"
            onClick={() => navigate("/onboarding")}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-info-light flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-info" />
              </div>
              <button className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100 cursor-pointer" style={{ fontWeight: 500 }}>
                Onboarding öffnen
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
            <div className="text-[40px] text-foreground tracking-tight leading-none" style={{ fontWeight: 700 }}>
              {onboardingCount}
            </div>
            <div className="text-[13px] text-muted-foreground mt-1" style={{ fontWeight: 500 }}>
              Klienten im Onboarding
            </div>
            <div className="mt-4 space-y-1.5">
              {onboardingBreakdown.map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-[12px] text-muted-foreground">{item.label}</span>
                  <span className="text-[12px] text-foreground tabular-nums" style={{ fontWeight: 600 }}>{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          ROW 2 – COMPLIANCE & RISIKO
          ══════════════════════════════════════ */}
      <div className="px-4 md:px-8 pt-4">
        <div className="flex items-center gap-2 mb-3">
          <h4 className="text-foreground">Compliance & Risiko</h4>
          <span className="text-[11px] text-muted-foreground">Handlungsbedarf</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

          {/* SRK Anmeldungen */}
          <ComplianceTile
            icon={GraduationCap}
            label="Ungeplante SRK-Anmeldungen"
            value={complianceData.srkAnmeldungen}
            description={complianceData.srkAnmeldungen > 0 ? `${complianceData.srkAnmeldungen} Angehörige ohne gültige Kursanmeldung` : "Alle Anmeldungen aktuell"}
            onClick={() => navigate("/angehoerige")}
          />

          {/* Re-Assessments */}
          <ComplianceTile
            icon={ClipboardCheck}
            label="Re-Assessments fällig"
            value={complianceData.reAssessments}
            description={complianceData.reAssessments > 0 ? `Innerhalb der nächsten 30 Tage` : "Keine Re-Assessments fällig"}
            onClick={() => navigate("/patienten")}
          />
        </div>
      </div>

      {/* ══════════════════════════════════════
          ROW 3 – FÄLLIGE AUFGABEN
          ══════════════════════════════════════ */}
      <div className="px-4 md:px-8 pt-6 pb-10">
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border-light flex items-center justify-between">
            <div>
              <h5 className="text-foreground">Fällige Aufgaben</h5>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {faelligeAufgaben.filter(a => a.overdue).length > 0 && (
                  <span className="text-error" style={{ fontWeight: 500 }}>
                    {faelligeAufgaben.filter(a => a.overdue).length} überfällig
                  </span>
                )}
                {faelligeAufgaben.filter(a => a.overdue).length > 0 && " · "}
                {faelligeAufgaben.length} Aufgaben anstehend
              </p>
            </div>
            <button
              onClick={() => navigate("/patienten")}
              className="inline-flex items-center gap-1.5 px-2.5 py-[5px] text-[11px] rounded-xl border border-border bg-card hover:bg-secondary/60 transition-colors cursor-pointer"
              style={{ fontWeight: 500 }}
            >
              Alle Aufgaben
              <ArrowRight className="w-3 h-3 text-muted-foreground" />
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/30">
                  {["Klient", "Aufgabe", "Fällig", "Verantwortlich"].map((col) => (
                    <th key={col} className="px-5 py-2.5 text-left">
                      <span className="text-[11px] text-muted-foreground uppercase tracking-wider" style={{ fontWeight: 500 }}>{col}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {faelligeAufgaben.map((task) => (
                  <tr
                    key={task.id}
                    className={`border-t border-border-light hover:bg-primary/[0.02] transition-colors cursor-pointer ${task.overdue ? "bg-error-light/30" : ""}`}
                    onClick={() => {
                      const p = patients.find(pt => pt.id === task.klientId);
                      if (p) navigate(`/patienten/${p.id}`);
                      else navigate("/patienten");
                    }}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center shrink-0">
                          <span className="text-[9px] text-primary" style={{ fontWeight: 600 }}>
                            {task.klient.split(" ").map(n => n[0]).join("")}
                          </span>
                        </div>
                        <span className="text-[13px] text-foreground" style={{ fontWeight: 500 }}>{task.klient}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-[13px] text-foreground">{task.aufgabe}</span>
                    </td>
                    <td className="px-5 py-3">
                      {task.overdue ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-[2px] rounded-full text-[11px] bg-error-light text-error-foreground" style={{ fontWeight: 500 }}>
                          <span className="w-[5px] h-[5px] rounded-full bg-error" />
                          {task.faellig}
                        </span>
                      ) : (
                        <span className="text-[13px] text-muted-foreground">{task.faellig}</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-[12px] text-muted-foreground">{task.verantwortlich}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════
   COMPLIANCE TILE COMPONENT
   ══════════════════════════════════════════ */
function ComplianceTile({
  icon: Icon,
  label,
  value,
  description,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  description: string;
  onClick: () => void;
}) {
  const hasIssue = value > 0;
  const statusBg = hasIssue ? "bg-warning-light" : "bg-success-light";
  const statusIconBg = hasIssue ? "bg-warning/10 border-warning/15" : "bg-success/10 border-success/15";
  const statusIconColor = hasIssue ? "text-warning" : "text-success";
  const valueDot = hasIssue ? "bg-warning" : "bg-success";
  const valueColor = hasIssue ? "text-warning-foreground" : "text-success-foreground";

  return (
    <button
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl border p-5 text-left transition-all group cursor-pointer hover:shadow-sm ${
        hasIssue ? "border-warning/20 bg-gradient-to-br from-warning-light to-warning-medium/20" : "border-success/20 bg-gradient-to-br from-success-light to-success-medium/20"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${statusIconBg} border flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${statusIconColor}`} />
        </div>
        {hasIssue ? (
          <span className="inline-flex items-center gap-1.5 px-2 py-[2px] rounded-full text-[10px] bg-warning/10 text-warning-foreground" style={{ fontWeight: 600 }}>
            <AlertTriangle className="w-3 h-3" />
            HANDLUNG
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2 py-[2px] rounded-full text-[10px] bg-success/10 text-success-foreground" style={{ fontWeight: 600 }}>
            <CheckCircle2 className="w-3 h-3" />
            OK
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span className={`w-2 h-2 rounded-full ${valueDot} mt-1`} />
        <div>
          <div className={`text-[28px] tracking-tight leading-none ${valueColor}`} style={{ fontWeight: 700 }}>
            {value}
          </div>
          <div className={`text-[13px] mt-1 ${valueColor}`} style={{ fontWeight: 600 }}>
            {label}
          </div>
        </div>
      </div>
      <p className={`text-[11px] mt-2 ${hasIssue ? "text-warning-foreground/70" : "text-success-foreground/70"}`}>
        {description}
      </p>
      <div className="mt-3 inline-flex items-center gap-1 text-[11px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ fontWeight: 500 }}>
        <span className={hasIssue ? "text-warning-foreground" : "text-success-foreground"}>Details anzeigen</span>
        <ArrowRight className={`w-3 h-3 ${hasIssue ? "text-warning-foreground" : "text-success-foreground"}`} />
      </div>
    </button>
  );
}
