import React, { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { AppSidebar } from "./AppSidebar";
import { AppTopbar } from "./AppTopbar";
import { Toaster } from "sonner";

export function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const getActiveNav = () => {
    if (location.pathname.startsWith("/patienten")) return "patienten";
    if (location.pathname.startsWith("/angehoerige")) return "angehoerige";
    if (location.pathname.startsWith("/onboarding")) return "onboarding";
    if (location.pathname.startsWith("/zuteilung")) return "zuteilung";
    if (location.pathname.startsWith("/servicedesk")) return "servicedesk";
    return "dashboard";
  };

  const handleNavChange = (id: string) => {
    const routeMap: Record<string, string> = {
      dashboard: "/",
      onboarding: "/onboarding",
      patienten: "/patienten",
      angehoerige: "/angehoerige",
      zuteilung: "/zuteilung",
      servicedesk: "/servicedesk",
    };
    navigate(routeMap[id] || "/");
    setSidebarOpen(false);
  };

  return (
    <div className="h-screen flex overflow-hidden bg-background font-sans">
      {/* Desktop sidebar — always visible ≥1024 */}
      <div className="hidden lg:block">
        <AppSidebar activeItem={getActiveNav()} onItemChange={handleNavChange} />
      </div>

      {/* Mobile/Tablet drawer overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-[2px]" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10 h-full w-[76px]">
            <AppSidebar activeItem={getActiveNav()} onItemChange={handleNavChange} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col lg:ml-[76px] min-h-0 min-w-0">
        <AppTopbar onMenuToggle={() => setSidebarOpen(o => !o)} />
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>
      <Toaster position="bottom-right" richColors />
    </div>
  );
}
