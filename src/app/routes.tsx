import { createBrowserRouter } from "react-router";
import { AppShell } from "./components/AppShell";
import { DashboardPage } from "./components/DashboardPage";
import { PatientenPage } from "./components/PatientenPage";
import { Patient360Page } from "./components/Patient360Page";
import { OnboardingListPage } from "./components/OnboardingListPage";
import { OnboardingPage } from "./components/OnboardingPage";
import { ZuteilungPage } from "./components/ZuteilungPage";
import { ServiceDeskPage } from "./components/ServiceDeskPage";
import { AngehoerigePage } from "./components/AngehoerigePage";
import { Angehoerige360Page } from "./components/Angehoerige360Page";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: AppShell,
    children: [
      { index: true, Component: DashboardPage },
      { path: "patienten", Component: PatientenPage },
      { path: "patienten/:patientId", Component: Patient360Page },
      { path: "angehoerige", Component: AngehoerigePage },
      { path: "angehoerige/:angehoerigerIdOrNew", Component: Angehoerige360Page },
      { path: "onboarding", Component: OnboardingListPage },
      { path: "onboarding/neu", Component: OnboardingPage },
      { path: "onboarding/:caseId", Component: OnboardingPage },
      { path: "zuteilung", Component: ZuteilungPage },
      { path: "servicedesk", Component: ServiceDeskPage },
      { path: "vorlagen", Component: PlaceholderPage },
      { path: "*", Component: PlaceholderPage },
    ],
  },
]);

/* ── Generic placeholder for non-implemented pages ── */
function PlaceholderPage() {
  return (
    <div className="px-8 py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground">
          <rect x="3" y="3" width="18" height="18" rx="4" />
          <path d="M9 12h6M12 9v6" />
        </svg>
      </div>
      <h3 className="text-foreground">In Entwicklung</h3>
      <p className="text-[13px] text-muted-foreground mt-1 max-w-sm mx-auto">
        Dieser Bereich wird in einer zukünftigen Version implementiert.
        Bitte nutzen Sie das Dashboard als Ausgangspunkt.
      </p>
    </div>
  );
}