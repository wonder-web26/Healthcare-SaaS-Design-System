import React, { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { AppSidebar, navItems } from "./AppSidebar";
import { Drawer, DrawerContent } from "./ui/drawer";
import { useFensterBreite } from "./ui/DataTable";
import { AppTopbar } from "./AppTopbar";
import { Toaster } from "sonner";
import { GlobalRecordingBar } from "../recording/GlobalRecordingBar";
import { RecordingProvider } from "../recording/RecordingContext";

/* DEMO: AnnaOeffnenBruecke, der annaOpen-Zustand, das Kürzel ⌘J und der
   isDashboard-Schalter sind mit Anna entfernt. isDashboard diente allein dazu,
   Anna auf der Startseite zu unterdrücken — ohne Anna und ohne Startseite hat
   er keine Aufgabe mehr. */

export function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Lauf 2a: unter 768px öffnet der Menüknopf die beschriftete Schublade,
  // zwischen 768 und 1023px die bisherige Symbolleiste.
  const istUnterTablet = useFensterBreite() < 768;

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
    /* DEMO: «/» zeigt die Onboarding-Übersicht, nicht mehr die Startseite —
       der Rückfall hebt deshalb Onboarding hervor und nicht einen Eintrag,
       den die Navigation nicht mehr führt. */
    return "onboarding";
  };

  const handleNavChange = (id: string) => {
    const routeMap: Record<string, string> = {
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

      {/* DEMO: Anna ist für die Demoumgebung vollständig entfernt — der
          schwebende Knopf, die Seitenleiste, die Brücke zum Topbar-Menü unter
          1024px und das Kürzel ⌘J. Die Komponenten unter app/anna/ stehen
          unberührt; wiederhergestellt wird, indem dieser Block, der annaOpen-
          Zustand, die beiden Effekte und der Eintrag in der Topbar zurückkommen. */}

      <Toaster position="bottom-right" richColors />
    </div>
    </RecordingProvider>
  );
}
