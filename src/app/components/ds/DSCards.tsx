import React from "react";
import {
  Users,
  TrendingUp,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  MoreHorizontal,
  Calendar,
  FileText,
} from "lucide-react";

export function DSCards() {
  return (
    <section>
      <h3 className="mb-1">Karten (Cards)</h3>
      <p className="text-muted-foreground text-[13px] mb-6">
        Container für Dashboard-Widgets, Statistiken und Zusammenfassungen.
      </p>

      <div className="space-y-4">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            {
              label: "Aktive Patienten",
              value: "142",
              change: "+8",
              trend: "up",
              icon: Users,
              iconBg: "bg-primary-light",
              iconColor: "text-primary",
            },
            {
              label: "Abrechenbare Leistungen",
              value: "1.247",
              change: "+12%",
              trend: "up",
              icon: TrendingUp,
              iconBg: "bg-success-light",
              iconColor: "text-success",
            },
            {
              label: "Offene Tickets",
              value: "23",
              change: "-3",
              trend: "down",
              icon: Clock,
              iconBg: "bg-warning-light",
              iconColor: "text-warning",
            },
            {
              label: "Kritische Fälle",
              value: "4",
              change: "+1",
              trend: "up",
              icon: AlertTriangle,
              iconBg: "bg-error-light",
              iconColor: "text-error",
            },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="bg-card rounded-2xl border border-border p-5 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-9 h-9 rounded-xl ${stat.iconBg} flex items-center justify-center`}>
                    <Icon className={`w-[18px] h-[18px] ${stat.iconColor}`} />
                  </div>
                  <button className="p-1 rounded-lg hover:bg-secondary transition-colors -mr-1 -mt-1">
                    <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
                <div className="text-[24px] text-foreground tracking-tight" style={{ fontWeight: 600 }}>
                  {stat.value}
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-[12px] text-muted-foreground">{stat.label}</span>
                  <span
                    className={`inline-flex items-center gap-0.5 text-[11px] ${
                      stat.trend === "up" && stat.label !== "Kritische Fälle"
                        ? "text-success"
                        : stat.trend === "down" && stat.label === "Offene Tickets"
                        ? "text-success"
                        : "text-error"
                    }`}
                    style={{ fontWeight: 500 }}
                  >
                    {stat.trend === "up" ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3" />
                    )}
                    {stat.change}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {/* AI Suggestion Card */}
          <div className="bg-card rounded-2xl border border-border p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full" />
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-primary-light flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h5 className="text-foreground">KI-Vorschlag</h5>
                <span className="text-[10.5px] text-muted-foreground">Vor 5 Minuten</span>
              </div>
            </div>
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              Basierend auf der Auslastung wird empfohlen, 3 Patienten im Raum Oerlikon
              neu zuzuteilen.
            </p>
            <div className="flex gap-2 mt-4">
              <button className="px-3 py-1.5 bg-primary text-primary-foreground rounded-xl text-[12px] hover:bg-primary-hover transition-colors" style={{ fontWeight: 500 }}>
                Übernehmen
              </button>
              <button className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded-xl text-[12px] hover:bg-secondary-hover transition-colors" style={{ fontWeight: 500 }}>
                Details
              </button>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <h5 className="text-foreground mb-3">Schnellzugriff</h5>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: Users, label: "Patient anlegen" },
                { icon: Calendar, label: "Termin planen" },
                { icon: FileText, label: "Bericht erstellen" },
                { icon: TrendingUp, label: "Abrechnung" },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    className="flex items-center gap-2 p-3 rounded-xl bg-background border border-border-light hover:bg-secondary/60 hover:border-border transition-all text-left"
                  >
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-[12px] text-foreground" style={{ fontWeight: 450 }}>{action.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Activity Card */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-foreground">Letzte Aktivitäten</h5>
              <button className="text-[11px] text-primary" style={{ fontWeight: 500 }}>Alle anzeigen</button>
            </div>
            <div className="space-y-3">
              {[
                { time: "14:30", text: "Patient Müller, Anna — Leistung erfasst", color: "bg-success" },
                { time: "14:15", text: "Ticket #234 — Status geändert", color: "bg-warning" },
                { time: "13:50", text: "Zuteilung Oerlikon aktualisiert", color: "bg-primary" },
                { time: "13:20", text: "Patient Fischer — Kündigung eingegangen", color: "bg-error" },
              ].map((a, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex flex-col items-center mt-0.5">
                    <div className={`w-2 h-2 rounded-full ${a.color}`} />
                    {i < 3 && <div className="w-px h-6 bg-border-light mt-1" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-foreground truncate" style={{ fontWeight: 400 }}>{a.text}</p>
                    <span className="text-[10.5px] text-muted-foreground">{a.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
