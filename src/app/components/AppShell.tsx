import React, { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { AppSidebar } from "./AppSidebar";
import { AppTopbar } from "./AppTopbar";
import { AnnaSidebar } from "../anna/AnnaSidebar";
import { Sparkles } from "lucide-react";
import { Toaster } from "sonner";

export function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [annaOpen, setAnnaOpen] = useState(false);

  const isDashboard = location.pathname === "/" || location.pathname === "/dashboard";

  // Keyboard shortcut: Cmd/Ctrl + J (only on non-dashboard pages)
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "j") {
        e.preventDefault();
        if (!isDashboard) setAnnaOpen(o => !o);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isDashboard]);

  // Close Anna sidebar when navigating to dashboard
  useEffect(() => {
    if (isDashboard) setAnnaOpen(false);
  }, [isDashboard]);

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
    <div
      className="h-screen flex overflow-hidden"
      style={{ background: "var(--bg-primary)", fontFamily: "var(--font-family)", color: "var(--text-primary)", fontSize: "var(--text-body)", fontWeight: "var(--weight-regular)" }}
    >
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <AppSidebar activeItem={getActiveNav()} onItemChange={handleNavChange} />
      </div>

      {/* Mobile/Tablet drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0" style={{ background: "rgba(19,19,20,0.2)", backdropFilter: "blur(2px)" }} onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10 h-full w-[56px]">
            <AppSidebar activeItem={getActiveNav()} onItemChange={handleNavChange} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col lg:ml-[56px] min-h-0 min-w-0">
        <AppTopbar onMenuToggle={() => setSidebarOpen(o => !o)} />
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>

      {/* Anna floating button — only on non-dashboard pages, when sidebar is closed */}
      {!isDashboard && !annaOpen && (
        <button
          onClick={() => setAnnaOpen(true)}
          title="Anna öffnen (⌘J)"
          className="fixed z-40 flex items-center justify-center cursor-pointer transition-all"
          style={{
            bottom: 88,
            right: 24,
            width: 48, height: 48,
            borderRadius: "var(--radius-pill)",
            background: "linear-gradient(135deg, var(--brand-primary), var(--brand-accent))",
            color: "var(--text-on-dark)",
            boxShadow: "var(--shadow-overlay)",
          }}
          onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
          onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
        >
          <Sparkles style={{ width: 20, height: 20 }} />
        </button>
      )}

      {/* Anna sidebar — only on non-dashboard pages */}
      {!isDashboard && <AnnaSidebar open={annaOpen} onClose={() => setAnnaOpen(false)} />}

      <Toaster position="bottom-right" richColors />
    </div>
  );
}
