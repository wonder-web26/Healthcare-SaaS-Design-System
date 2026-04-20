import { useNavigate } from "react-router";
import { ArrowRight } from "lucide-react";
import { patients } from "./patientData";
import { DashboardHero } from "./DashboardHero";
import { OnboardingPipelineTile } from "./OnboardingPipelineTile";
import { ComplianceRisikoSection } from "./ComplianceRisikoSection";

/* ══════════════════════════════════════════
   MOCK DATA
   ══════════════════════════════════════════ */

interface FaelligeAufgabe {
  id: string;
  klient: string;
  klientId: string;
  aufgabe: string;
  faellig: string;
  verantwortlich: string;
  overdue: boolean;
}

const faelligeAufgaben: FaelligeAufgabe[] = [
  { id: "1", klient: "Monika Brunner", klientId: "PAT-2026-0001", aufgabe: "Re-Assessment durchführen", faellig: "Heute", verantwortlich: "S. Weber", overdue: true },
  { id: "2", klient: "Hans Keller", klientId: "PAT-2026-0003", aufgabe: "SRK-Kursanmeldung prüfen", faellig: "Heute", verantwortlich: "K. Meier", overdue: true },
  { id: "3", klient: "Ruth Fischer", klientId: "PAT-2026-0005", aufgabe: "Verordnung erneuern", faellig: "04.03.2026", verantwortlich: "S. Weber", overdue: false },
  { id: "4", klient: "Peter Müller", klientId: "PAT-2026-0002", aufgabe: "Bankdaten verifizieren", faellig: "05.03.2026", verantwortlich: "M. Keller", overdue: false },
  { id: "5", klient: "Anna Schmid", klientId: "PAT-2026-0006", aufgabe: "Krankenkassenkarte hochladen", faellig: "06.03.2026", verantwortlich: "K. Meier", overdue: false },
  { id: "6", klient: "Jakob Weber", klientId: "PAT-2026-0007", aufgabe: "Erstgespräch-Protokoll einreichen", faellig: "07.03.2026", verantwortlich: "L. Brunner", overdue: false },
  { id: "7", klient: "Ursula Huber", klientId: "PAT-2026-0008", aufgabe: "Pflegeplan aktualisieren", faellig: "08.03.2026", verantwortlich: "S. Weber", overdue: false },
  { id: "8", klient: "Karl Meier", klientId: "PAT-2026-0009", aufgabe: "Stempelkontrolle abschliessen", faellig: "10.03.2026", verantwortlich: "M. Keller", overdue: false },
];

/* ══════════════════════════════════════════
   MAIN DASHBOARD
   ══════════════════════════════════════════ */
export function DashboardPage() {
  const navigate = useNavigate();

  return (
    <>
      {/* ── Hero: Fokus + Team-Pulse ── */}
      <section className="px-4 md:px-8 pt-7">
        <DashboardHero />
      </section>

      {/* ── Onboarding Pipeline ── */}
      <section className="px-4 md:px-8 pt-4">
        <OnboardingPipelineTile />
      </section>

      {/* ── Compliance & Risiko ── */}
      <section id="compliance-section" className="px-4 md:px-8 pt-8">
        <ComplianceRisikoSection />
      </section>

      {/* ── Fällige Aufgaben ── */}
      <section className="px-4 md:px-8 pt-8 pb-10">
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border-light flex items-center justify-between">
            <div>
              <h2 className="text-[14px] text-foreground" style={{ fontWeight: 600 }}>Fällige Aufgaben</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {faelligeAufgaben.filter(a => a.overdue).length > 0 && (
                  <span className="text-error" style={{ fontWeight: 500 }}>
                    {faelligeAufgaben.filter(a => a.overdue).length} überfällig
                  </span>
                )}
                {faelligeAufgaben.filter(a => a.overdue).length > 0 && " · "}
                {faelligeAufgaben.length} Aufgaben anstehend
              </p>
            </div>
            <button
              onClick={() => navigate("/patienten")}
              className="inline-flex items-center gap-1.5 px-2.5 py-[5px] text-[11px] rounded-xl border border-border bg-card hover:bg-secondary/60 transition-colors cursor-pointer"
              style={{ fontWeight: 500 }}
            >
              Alle Aufgaben
              <ArrowRight className="w-3 h-3 text-muted-foreground" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/30">
                  <th className="px-3 sm:px-5 py-2.5 text-left"><span className="text-[11px] text-muted-foreground uppercase tracking-wider" style={{ fontWeight: 500 }}>Klient</span></th>
                  <th className="px-3 sm:px-5 py-2.5 text-left"><span className="text-[11px] text-muted-foreground uppercase tracking-wider" style={{ fontWeight: 500 }}>Aufgabe</span></th>
                  <th className="px-3 sm:px-5 py-2.5 text-left hidden sm:table-cell"><span className="text-[11px] text-muted-foreground uppercase tracking-wider" style={{ fontWeight: 500 }}>Fällig</span></th>
                  <th className="px-3 sm:px-5 py-2.5 text-left hidden md:table-cell"><span className="text-[11px] text-muted-foreground uppercase tracking-wider" style={{ fontWeight: 500 }}>Verantwortlich</span></th>
                </tr>
              </thead>
              <tbody>
                {faelligeAufgaben.map((task) => (
                  <tr
                    key={task.id}
                    className={`border-t border-border-light hover:bg-primary/[0.02] transition-colors cursor-pointer ${task.overdue ? "bg-error-light/30" : ""}`}
                    onClick={() => {
                      const p = patients.find(pt => pt.id === task.klientId);
                      if (p) navigate(`/patienten/${p.id}`);
                      else navigate("/patienten");
                    }}
                  >
                    <td className="px-3 sm:px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center shrink-0">
                          <span className="text-[9px] text-primary" style={{ fontWeight: 600 }}>
                            {task.klient.split(" ").map(n => n[0]).join("")}
                          </span>
                        </div>
                        <span className="text-[13px] text-foreground" style={{ fontWeight: 500 }}>{task.klient}</span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-5 py-3">
                      <span className="text-[13px] text-foreground">{task.aufgabe}</span>
                    </td>
                    <td className="px-3 sm:px-5 py-3 hidden sm:table-cell">
                      {task.overdue ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-[2px] rounded-full text-[11px] bg-error-light text-error-foreground" style={{ fontWeight: 500 }}>
                          <span className="w-[5px] h-[5px] rounded-full bg-error" />
                          {task.faellig}
                        </span>
                      ) : (
                        <span className="text-[13px] text-muted-foreground">{task.faellig}</span>
                      )}
                    </td>
                    <td className="px-3 sm:px-5 py-3 hidden md:table-cell">
                      <span className="text-[12px] text-muted-foreground">{task.verantwortlich}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
}
