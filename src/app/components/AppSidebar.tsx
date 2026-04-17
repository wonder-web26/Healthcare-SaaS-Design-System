import React from "react";
import {
  LayoutDashboard,
  UserPlus,
  Users,
  GitBranch,
  Headphones,
  FileText,
  Sparkles,
  Settings,
  HelpCircle,
  ChevronDown,
  HeartHandshake,
} from "lucide-react";

const navSections = [
  {
    label: null,
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { id: "onboarding", label: "Onboarding", icon: UserPlus, badge: "3" },
      { id: "patienten", label: "Patienten", icon: Users },
      { id: "angehoerige", label: "Angehörige", icon: HeartHandshake },
      { id: "zuteilung", label: "Management Zuteilung", icon: GitBranch },
      { id: "servicedesk", label: "Service Desk", icon: Headphones, badge: "7" },
      { id: "vorlagen", label: "Vorlagen", icon: FileText },
    ],
  },
];

interface AppSidebarProps {
  activeItem: string;
  onItemChange: (id: string) => void;
  collapsed?: boolean;
}

export function AppSidebar({ activeItem, onItemChange }: AppSidebarProps) {
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[256px] bg-sidebar border-r border-sidebar-border flex flex-col z-40">
      {/* ── Logo ────────────────────────── */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-sidebar-border shrink-0">
        <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 1L16 5V13L9 17L2 13V5L9 1Z" stroke="white" strokeWidth="1.5" fill="none" />
            <circle cx="9" cy="9" r="3" fill="white" opacity="0.9" />
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="text-[13px] text-foreground tracking-tight" style={{ fontWeight: 600, lineHeight: '1.2' }}>
            Spitex-Cockpit
          </span>
          <span className="text-[10px] text-sidebar-muted tracking-wide uppercase" style={{ fontWeight: 500 }}>
            V1
          </span>
        </div>
      </div>

      {/* ── Organization Switcher ───────── */}
      <div className="px-3 pt-4 pb-2">
        <button className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-secondary/60 transition-colors text-left group">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-[11px] text-primary" style={{ fontWeight: 700 }}>SP</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12.5px] text-foreground truncate" style={{ fontWeight: 500 }}>
              Spitex Zürich Nord
            </div>
            <div className="text-[10.5px] text-muted-foreground truncate">
              Organisation
            </div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>

      {/* ── Navigation ──────────────────── */}
      <nav className="flex-1 overflow-y-auto px-3 py-1">
        {navSections.map((section, si) => (
          <div key={si} className={si > 0 ? "mt-6" : ""}>
            {section.label && (
              <div className="px-2.5 mb-1.5 text-[10.5px] tracking-wider uppercase text-sidebar-muted" style={{ fontWeight: 500 }}>
                {section.label}
              </div>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = activeItem === item.id;
                const Icon = item.icon;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => onItemChange(item.id)}
                      className={`
                        w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] transition-all duration-150
                        ${isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                          : "text-sidebar-foreground hover:bg-secondary/50"
                        }
                        ${item.isAI ? "relative" : ""}
                      `}
                      style={{ fontWeight: isActive ? 500 : 400 }}
                    >
                      <Icon
                        className={`w-[16px] h-[16px] shrink-0 ${
                          isActive ? "text-sidebar-accent-foreground" : "text-sidebar-muted"
                        } ${item.isAI ? "text-primary" : ""}`}
                      />
                      <span className="flex-1 text-left truncate">{item.label}</span>
                      {item.badge && (
                        <span
                          className="text-[10px] px-[6px] py-[1px] rounded-full bg-primary/10 text-primary"
                          style={{ fontWeight: 600 }}
                        >
                          {item.badge}
                        </span>
                      )}
                      {item.isAI && (
                        <span className="flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* ── Footer ──────────────────────── */}
      <div className="px-3 pb-3 space-y-0.5 border-t border-sidebar-border pt-3">
        <button className="w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] text-sidebar-foreground hover:bg-secondary/50 transition-colors" style={{ fontWeight: 400 }}>
          <Settings className="w-4 h-4 text-sidebar-muted" />
          <span>Einstellungen</span>
        </button>
        <button className="w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] text-sidebar-foreground hover:bg-secondary/50 transition-colors" style={{ fontWeight: 400 }}>
          <HelpCircle className="w-4 h-4 text-sidebar-muted" />
          <span>Hilfe & Support</span>
        </button>
      </div>
    </aside>
  );
}