import React from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { AppSidebar } from "./AppSidebar";
import { AppTopbar } from "./AppTopbar";
import { Toaster } from "sonner";

export function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();

  const getActiveNav = () => {
    if (location.pathname.startsWith("/patienten")) return "patienten";
    if (location.pathname.startsWith("/angehoerige")) return "angehoerige";
    if (location.pathname.startsWith("/onboarding")) return "onboarding";
    if (location.pathname.startsWith("/zuteilung")) return "zuteilung";
    if (location.pathname.startsWith("/servicedesk")) return "servicedesk";
    if (location.pathname.startsWith("/vorlagen")) return "vorlagen";
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
      vorlagen: "/vorlagen",
    };
    navigate(routeMap[id] || "/");
  };

  return (
    <div className="h-screen flex overflow-hidden bg-background font-sans">
      <AppSidebar activeItem={getActiveNav()} onItemChange={handleNavChange} />
      <div className="flex-1 flex flex-col ml-[76px] min-h-0">
        <AppTopbar />
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>
      <Toaster position="bottom-right" richColors />
    </div>
  );
}