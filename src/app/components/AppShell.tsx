import React, { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { AppSidebar, navItems } from "./AppSidebar";
import { Drawer, DrawerContent } from "./ui/drawer";
import { useFensterBreite } from "./ui/DataTable";
import { AppTopbar } from "./AppTopbar";
import { AnnaSidebar } from "../anna/AnnaSidebar";
import { Sparkles } from "lucide-react";
import { Toaster } from "sonner";
import { GlobalRecordingBar } from "../recording/GlobalRecordingBar";
import { RecordingProvider } from "../recording/RecordingContext";

/** Lauf 1b: Brücke für den Topbar-Menüeintrag "Anna öffnen" (unter 1024px).
 *  Die Topbar kennt den Anna-Zustand nicht; sie sendet ein Ereignis, das hier
 *  in setAnnaOpen übersetzt wird. */
function AnnaOeffnenBruecke({ onOeffnen }: { onOeffnen: () => void }) {
  useEffect(() => {
    const handler = () => onOeffnen();
    window.addEventListener("anna:oeffnen", handler);
    return () => window.removeEventListener("anna:oeffnen", handler);
  }, [onOeffnen]);
  return null;
}

export function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [annaOpen, setAnnaOpen] = useState(false);
  // Lauf 2a: unter 768px öffnet der Menüknopf die beschriftete Schublade,
  // zwischen 768 und 1023px die bisherige Symbolleiste.
  const istUnterTablet = useFensterBreite() < 768;

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
    if (location.pathname.startsWith("/dashboard")) return "kennzahlen";
    if (location.pathname.startsWith("/interrai")) return "interrai";
    if (location.pathname.startsWith("/patienten")) return "patienten";
    if (location.pathname.startsWith("/angehoerige")) return "angehoerige";
    if (location.pathname.startsWith("/kontakte")) return "kontakte";
    if (location.pathname.startsWith("/onboarding")) return "onboarding";
    if (location.pathname.startsWith("/klv")) return "klv";
    if (location.pathname.startsWith("/abschluss")) return "abschluss";
    if (location.pathname.startsWith("/zuteilung")) return "zuteilung";
    if (location.pathname.startsWith("/servicedesk")) return "servicedesk";
    return "dashboard";
  };

  const handleNavChange = (id: string) => {
    const routeMap: Record<string, string> = {
      dashboard: "/",
      kennzahlen: "/dashboard",
      interrai: "/interrai",
      onboarding: "/onboarding",
      patienten: "/patienten",
      angehoerige: "/angehoerige",
      kontakte: "/kontakte",
      klv: "/klv",
      abschluss: "/abschluss",
      zuteilung: "/zuteilung",
      servicedesk: "/servicedesk",
    };
    navigate(routeMap[id] || "/");
    setSidebarOpen(false);
  };

  return (
    <RecordingProvider>
    <div
      className="h-screen flex overflow-hidden"
      style={{ background: "var(--bg-primary)", fontFamily: "var(--font-family)", color: "var(--text-primary)", fontSize: "var(--text-body)", fontWeight: "var(--weight-regular)" }}
    >
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <AppSidebar activeItem={getActiveNav()} onItemChange={handleNavChange} />
      </div>

      {/* Hauptnavigation unter 1024px (Lauf 2a, Änderung 4):
          unter 768px eine Schublade von links mit der vollständigen,
          beschrifteten Objektnavigation (Bibliothek: vaul-Drawer — schliesst
          durch Auswahl, Tippen daneben und Wischen nach links);
          zwischen 768 und 1023px bleibt die heutige Symbolleiste. */}
      {istUnterTablet ? (
        <Drawer direction="left" open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <DrawerContent
            aria-label="Hauptnavigation"
            style={{ width: 280, background: "var(--bg-elevated)", borderRadius: 0 }}
          >
            <div className="flex flex-col h-full" style={{ padding: "var(--space-4) var(--space-2)" }}>
              <div className="flex items-center" style={{ gap: 10, padding: "0 var(--space-3) var(--space-3)" }}>
                <div className="flex items-center justify-center shrink-0" style={{ width: 28, height: 28, borderRadius: "var(--radius-card)", background: "var(--brand-primary)" }}>
                  <span style={{ color: "var(--text-on-dark)", fontSize: 12, fontWeight: "var(--weight-medium)" }}>S</span>
                </div>
                <span style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>Spitex Cockpit</span>
              </div>
              <nav className="flex-1 overflow-y-auto" aria-label="Objektnavigation">
                {navItems.map(item => {
                  const aktiv = getActiveNav() === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNavChange(item.id)}
                      aria-current={aktiv ? "page" : undefined}
                      className="ui-fokusring w-full flex items-center cursor-pointer"
                      style={{
                        gap: 12, padding: "10px var(--space-3)", borderRadius: "var(--radius-card)",
                        background: aktiv ? "var(--bg-secondary)" : "transparent",
                        border: "none", fontFamily: "inherit", textAlign: "left",
                        fontSize: "var(--text-small)",
                        fontWeight: aktiv ? "var(--weight-medium)" : "var(--weight-regular)",
                        color: "var(--text-primary)",
                        /* aktives Ziel auch ohne Farbe erkennbar: Balken + Schnitt */
                        boxShadow: aktiv ? "inset 3px 0 0 var(--brand-primary)" : undefined,
                      }}
                    >
                      <item.icon style={{ width: 18, height: 18, color: aktiv ? "var(--brand-primary)" : "var(--text-secondary)", flexShrink: 0 }} />
                      <span style={{ flex: 1 }}>{item.label}</span>
                      {item.badge != null && item.badge > 0 && (
                        <span style={{ minWidth: 18, height: 18, padding: "0 5px", borderRadius: "var(--radius-pill)", background: "var(--status-danger)", color: "var(--text-on-dark)", fontSize: 11, fontWeight: "var(--weight-medium)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0" style={{ background: "rgba(19,19,20,0.2)", backdropFilter: "blur(2px)" }} onClick={() => setSidebarOpen(false)} />
            <div className="relative z-10 h-full w-[56px]">
              <AppSidebar activeItem={getActiveNav()} onItemChange={handleNavChange} />
            </div>
          </div>
        )
      )}

      <div className="flex-1 flex flex-col lg:ml-[56px] min-h-0 min-w-0">
        <AppTopbar onMenuToggle={() => setSidebarOpen(o => !o)} />
        <GlobalRecordingBar />
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>

      {/* Anna floating button — only on non-dashboard pages, when sidebar is closed.
          Lauf 1b: unter 1024px verlässt er die schwebende Position (er überdeckte
          Aktionen) und lebt als Eintrag im Topbar-Menü; auf Desktop unverändert. */}
      {!isDashboard && !annaOpen && (
        <button
          onClick={() => setAnnaOpen(true)}
          title="Anna öffnen (⌘J)"
          className="fixed z-40 hidden lg:flex items-center justify-center cursor-pointer transition-all"
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
      <AnnaOeffnenBruecke onOeffnen={() => setAnnaOpen(true)} />

      <Toaster position="bottom-right" richColors />
    </div>
    </RecordingProvider>
  );
}
