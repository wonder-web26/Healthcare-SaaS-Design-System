import { createBrowserRouter } from "react-router";
import { AppShell } from "./components/AppShell";
import { DashboardPage } from "./components/DashboardPage";
import { StrategicDashboard } from "./components/StrategicDashboard";
import { PatientenPage } from "./components/PatientenPage";
import { Patient360Page } from "./components/Patient360Page";
import { OnboardingListPage } from "./components/OnboardingListPage";
import { OnboardingPage } from "./components/OnboardingPage";
import { ZuteilungPage } from "./components/ZuteilungPage";
import { ServiceDeskPage } from "./components/ServiceDeskPage";
import { AngehoerigePage } from "./components/AngehoerigePage";
import { Angehoerige360Page } from "./components/Angehoerige360Page";
import { FormShowcase } from "./components/FormShowcase";
import { InterRAIListPage } from "./components/interrai/InterRAIListPage";
import { PflegeplanungArbeitsbereich } from "./components/PflegeplanungArbeitsbereich";
import { KLVArbeitsbereich } from "./components/KLVArbeitsbereich";
import { KlvListPage } from "./components/KlvListPage";
import { AbschlussListPage } from "./components/AbschlussListPage";
import { KontaktePage } from "./components/KontaktePage";
import { SchulungsnachweisPage } from "./components/schulung/SchulungsnachweisPage";
import { ArbeitskontrollePage } from "./components/arbeitskontrolle/ArbeitskontrollePage";
import { InterraiNeuPage } from "./components/interrai-neu/InterraiNeuPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: AppShell,
    children: [
      { index: true, Component: DashboardPage },
      { path: "dashboard", Component: StrategicDashboard },
      { path: "interrai", Component: InterRAIListPage },
      { path: "pflegeplanung/:planungId", Component: PflegeplanungArbeitsbereich },
      { path: "klv", Component: KlvListPage },
      { path: "abschluss", Component: AbschlussListPage },
      { path: "klv/:klvId", Component: KLVArbeitsbereich },
      { path: "schulungsnachweis/:nachweisId", Component: SchulungsnachweisPage },
      { path: "arbeitskontrolle/:kontrolleId", Component: ArbeitskontrollePage },
      { path: "patienten", Component: PatientenPage },
      /* Das Patientendossier hat je Ansicht eine eigene Adresse. Drei Formen:
         ohne Glied (Überblick), ein Glied (Ansicht ohne Gruppe) und zwei
         Glieder (Gruppe + Ansicht). Alles Weitere fällt auf den Überblick. */
      { path: "patienten/:patientId", Component: Patient360Page },
      { path: "patienten/:patientId/:gruppe", Component: Patient360Page },
      { path: "patienten/:patientId/:gruppe/:ansicht", Component: Patient360Page },
      { path: "angehoerige", Component: AngehoerigePage },
      { path: "kontakte", Component: KontaktePage },
      { path: "angehoerige/:angehoerigerIdOrNew", Component: Angehoerige360Page },
      { path: "onboarding", Component: OnboardingListPage },
      { path: "onboarding/neu", Component: OnboardingPage },
      { path: "onboarding/:caseId", Component: OnboardingPage },
      { path: "zuteilung", Component: ZuteilungPage },
      { path: "servicedesk", Component: ServiceDeskPage },
      { path: "showcase/forms", Component: FormShowcase },
      { path: "interrai-neu/:assessmentId", Component: InterraiNeuPage },
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