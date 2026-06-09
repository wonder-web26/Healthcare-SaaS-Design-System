import React, { useState } from "react";
import {
  Sparkles,
  ClipboardList,
  UserPlus,
  Users,
  GitBranch,
  Headphones,
  Settings,
  HelpCircle,
  HeartHandshake,
  LayoutDashboard,
} from "lucide-react";
import { unifiedEntries, CURRENT_USER } from "../../lib/mocks/service-desk-unified";

const myOpenCount = unifiedEntries.filter(e => e.verantwortlich.initialen === CURRENT_USER && e.status !== "erledigt").length;

const navItems = [
  { id: "dashboard", label: "Startseite", icon: Sparkles },
  { id: "kennzahlen", label: "Dashboard", icon: LayoutDashboard },
  { id: "interrai", label: "InterRAI", icon: ClipboardList },
  { id: "onboarding", label: "Onboarding", icon: UserPlus, badge: 3 },
  { id: "patienten", label: "Patienten", icon: Users },
  { id: "angehoerige", label: "Angehörige", icon: HeartHandshake },
  { id: "zuteilung", label: "Zuteilung", icon: GitBranch },
  { id: "servicedesk", label: "Pendenzen", icon: Headphones, badge: myOpenCount },
];

interface AppSidebarProps {
  activeItem: string;
  onItemChange: (id: string) => void;
  collapsed?: boolean;
}

export function AppSidebar({ activeItem, onItemChange }: AppSidebarProps) {
  const [tooltip, setTooltip] = useState<string | null>(null);

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 w-[56px] flex flex-col items-center z-40"
      style={{
        background: "var(--bg-secondary)",
        borderRight: "var(--border-thin) solid var(--border-default)",
        padding: "var(--space-4) 0",
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center justify-center shrink-0"
        style={{
          width: 32, height: 32,
          borderRadius: "var(--radius-card)",
          background: "var(--brand-primary)",
          marginBottom: "var(--space-6)",
        }}
      >
        <span style={{ color: "var(--text-on-dark)", fontSize: 14, fontWeight: "var(--weight-medium)" }}>S</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 w-full flex flex-col items-center gap-[var(--space-1)]">
        {navItems.map((item) => {
          const isActive = activeItem === item.id;
          const Icon = item.icon;
          return (
            <div key={item.id} className="relative">
              <button
                onClick={() => onItemChange(item.id)}
                onMouseEnter={() => setTooltip(item.id)}
                onMouseLeave={() => setTooltip(null)}
                className="relative flex items-center justify-center cursor-pointer transition-colors"
                style={{
                  width: 40, height: 40,
                  borderRadius: "var(--radius-card)",
                  background: isActive
                    ? item.id === "dashboard"
                      ? "linear-gradient(135deg, var(--brand-primary), var(--brand-accent))"
                      : "var(--text-primary)"
                    : "transparent",
                }}
                aria-label={item.label}
              >
                <Icon
                  style={{
                    width: 18, height: 18,
                    color: isActive ? "var(--bg-primary)" : "var(--text-secondary)",
                  }}
                />
                {item.badge != null && item.badge > 0 && (
                  <span
                    className="absolute flex items-center justify-center"
                    style={{
                      top: 2, right: 2,
                      width: 16, height: 16,
                      borderRadius: "var(--radius-pill)",
                      background: "var(--status-danger)",
                      color: "var(--text-on-dark)",
                      fontSize: 10,
                      fontWeight: "var(--weight-medium)",
                    }}
                  >
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </button>

              {/* Tooltip */}
              {tooltip === item.id && (
                <div
                  className="absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2 z-50 whitespace-nowrap pointer-events-none"
                  style={{
                    background: "var(--bg-elevated)",
                    border: "var(--border-thin) solid var(--border-default)",
                    borderRadius: "var(--radius-card)",
                    padding: "var(--space-2)",
                    fontSize: "var(--text-meta)",
                    color: "var(--text-primary)",
                    boxShadow: "var(--shadow-overlay)",
                  }}
                >
                  {item.label}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="flex flex-col items-center gap-[var(--space-1)]" style={{ marginTop: "var(--space-4)" }}>
        <button
          onMouseEnter={() => setTooltip("settings")}
          onMouseLeave={() => setTooltip(null)}
          className="relative flex items-center justify-center cursor-pointer transition-colors"
          style={{ width: 40, height: 40, borderRadius: "var(--radius-card)", background: "transparent" }}
          aria-label="Einstellungen"
        >
          <Settings style={{ width: 18, height: 18, color: "var(--text-secondary)" }} />
          {tooltip === "settings" && (
            <div className="absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2 z-50 whitespace-nowrap pointer-events-none" style={{ background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)", padding: "var(--space-2)", fontSize: "var(--text-meta)", color: "var(--text-primary)", boxShadow: "var(--shadow-overlay)" }}>
              Einstellungen
            </div>
          )}
        </button>
        <button
          onMouseEnter={() => setTooltip("help")}
          onMouseLeave={() => setTooltip(null)}
          className="relative flex items-center justify-center cursor-pointer transition-colors"
          style={{ width: 40, height: 40, borderRadius: "var(--radius-card)", background: "transparent" }}
          aria-label="Hilfe"
        >
          <HelpCircle style={{ width: 18, height: 18, color: "var(--text-secondary)" }} />
          {tooltip === "help" && (
            <div className="absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2 z-50 whitespace-nowrap pointer-events-none" style={{ background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)", padding: "var(--space-2)", fontSize: "var(--text-meta)", color: "var(--text-primary)", boxShadow: "var(--shadow-overlay)" }}>
              Hilfe & Support
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}
