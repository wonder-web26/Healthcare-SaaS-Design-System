import React from "react";
import {
  LayoutDashboard,
  UserPlus,
  Users,
  GitBranch,
  Headphones,
  FileText,
  Settings,
  HelpCircle,
  HeartHandshake,
} from "lucide-react";
import { unifiedEntries, CURRENT_USER } from "../../lib/mocks/service-desk-unified";

const myOpenCount = unifiedEntries.filter(e => e.verantwortlich.initialen === CURRENT_USER && e.status !== "erledigt").length;

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "onboarding", label: "Onboarding", icon: UserPlus, badge: 3 },
  { id: "patienten", label: "Patienten", icon: Users },
  { id: "angehoerige", label: "Angehörige", icon: HeartHandshake },
  { id: "zuteilung", label: "Zuteilung", icon: GitBranch },
  { id: "servicedesk", label: "Service Desk", icon: Headphones, badge: myOpenCount },
  { id: "vorlagen", label: "Vorlagen", icon: FileText },
];

interface AppSidebarProps {
  activeItem: string;
  onItemChange: (id: string) => void;
  collapsed?: boolean;
}

export function AppSidebar({ activeItem, onItemChange }: AppSidebarProps) {
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[76px] bg-sidebar border-r border-sidebar-border flex flex-col items-center z-40">
      {/* Logo */}
      <div className="h-16 flex items-center justify-center shrink-0 w-full border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 1L16 5V13L9 17L2 13V5L9 1Z" stroke="white" strokeWidth="1.5" fill="none" />
            <circle cx="9" cy="9" r="3" fill="white" opacity="0.9" />
          </svg>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto w-full py-3 px-1.5">
        <ul className="flex flex-col items-center gap-0.5">
          {navItems.map((item) => {
            const isActive = activeItem === item.id;
            const Icon = item.icon;
            return (
              <li key={item.id} className="w-full">
                <button
                  onClick={() => onItemChange(item.id)}
                  className={`w-full flex flex-col items-center gap-[3px] py-2 rounded-lg transition-all cursor-pointer ${
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-secondary/50"
                  }`}
                >
                  <div className="relative">
                    <Icon className={`w-5 h-5 ${isActive ? "text-sidebar-accent-foreground" : "text-sidebar-muted"}`} />
                    {item.badge != null && item.badge > 0 && (
                      <span className="absolute -top-1 -right-1.5 w-[14px] h-[14px] rounded-full bg-error text-white text-[8px] flex items-center justify-center" style={{ fontWeight: 700 }}>
                        {item.badge > 9 ? "9+" : item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] leading-tight text-center truncate w-full px-0.5" style={{ fontWeight: isActive ? 500 : 400 }}>
                    {item.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="w-full px-1.5 pb-3 pt-2 border-t border-sidebar-border flex flex-col items-center gap-0.5">
        <button className="w-full flex flex-col items-center gap-[3px] py-2 rounded-lg text-sidebar-foreground hover:bg-secondary/50 transition-colors cursor-pointer">
          <Settings className="w-5 h-5 text-sidebar-muted" />
          <span className="text-[10px] leading-tight" style={{ fontWeight: 400 }}>Settings</span>
        </button>
        <button className="w-full flex flex-col items-center gap-[3px] py-2 rounded-lg text-sidebar-foreground hover:bg-secondary/50 transition-colors cursor-pointer">
          <HelpCircle className="w-5 h-5 text-sidebar-muted" />
          <span className="text-[10px] leading-tight" style={{ fontWeight: 400 }}>Hilfe</span>
        </button>
      </div>
    </aside>
  );
}
