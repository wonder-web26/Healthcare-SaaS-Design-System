import React, { useState } from "react";
import { FileText, User, Activity, CreditCard, Settings } from "lucide-react";

export function DSTabs() {
  const [activeTab1, setActiveTab1] = useState("stammdaten");
  const [activeTab2, setActiveTab2] = useState("uebersicht");
  const [activeTab3, setActiveTab3] = useState("alle");

  const tabs1 = [
    { id: "stammdaten", label: "Stammdaten" },
    { id: "leistungen", label: "Leistungen" },
    { id: "dokumente", label: "Dokumente" },
    { id: "abrechnung", label: "Abrechnung" },
    { id: "verlauf", label: "Verlauf" },
  ];

  const tabs2 = [
    { id: "uebersicht", label: "Übersicht", icon: Activity },
    { id: "patienten", label: "Patienten", icon: User },
    { id: "berichte", label: "Berichte", icon: FileText },
    { id: "finanzen", label: "Finanzen", icon: CreditCard },
    { id: "einstellungen", label: "Einstellungen", icon: Settings },
  ];

  const tabs3 = [
    { id: "alle", label: "Alle", count: 142 },
    { id: "aktiv", label: "Aktiv", count: 98 },
    { id: "onboarding", label: "Onboarding", count: 12 },
    { id: "pausiert", label: "Pausiert", count: 8 },
    { id: "gekuendigt", label: "Gekündigt", count: 24 },
  ];

  return (
    <section>
      <h3 className="mb-1">Tabs</h3>
      <p className="text-muted-foreground text-[13px] mb-6">
        Tab-Navigation für Unterbereiche und Filterfunktionen.
      </p>

      <div className="space-y-4">
        {/* Underline tabs */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h5 className="mb-4">Underline-Tabs (Patientendetail)</h5>
          <div className="border-b border-border">
            <div className="flex gap-0 -mb-px overflow-x-auto">
              {tabs1.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab1(t.id)}
                  className={`px-4 py-2.5 text-[13px] border-b-2 transition-colors whitespace-nowrap ${
                    activeTab1 === t.id
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  }`}
                  style={{ fontWeight: activeTab1 === t.id ? 500 : 400 }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 text-[13px] text-muted-foreground py-6 text-center bg-muted/30 rounded-xl">
            Inhaltsbereich für „{tabs1.find((t) => t.id === activeTab1)?.label}"
          </div>
        </div>

        {/* Pill tabs with icons */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h5 className="mb-4">Pill-Tabs mit Symbolen (Dashboard)</h5>
          <div className="flex gap-1.5 p-1 bg-muted/60 rounded-xl w-fit overflow-x-auto">
            {tabs2.map((t) => {
              const Icon = t.icon;
              const isActive = activeTab2 === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab2(t.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-[7px] rounded-lg text-[12.5px] transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  style={{ fontWeight: isActive ? 500 : 400 }}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-primary" : ""}`} />
                  {t.label}
                </button>
              );
            })}
          </div>
          <div className="mt-4 text-[13px] text-muted-foreground py-6 text-center bg-muted/30 rounded-xl">
            Inhaltsbereich für „{tabs2.find((t) => t.id === activeTab2)?.label}"
          </div>
        </div>

        {/* Filter tabs with count */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h5 className="mb-4">Filter-Tabs mit Zähler (Patientenliste)</h5>
          <div className="flex gap-1.5 overflow-x-auto">
            {tabs3.map((t) => {
              const isActive = activeTab3 === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab3(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-[6px] rounded-xl text-[12.5px] border transition-all whitespace-nowrap ${
                    isActive
                      ? "border-primary/20 bg-primary-light text-primary"
                      : "border-border bg-card text-muted-foreground hover:bg-secondary/60"
                  }`}
                  style={{ fontWeight: isActive ? 500 : 400 }}
                >
                  {t.label}
                  <span
                    className={`text-[10px] px-[5px] py-[1px] rounded-md ${
                      isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    }`}
                    style={{ fontWeight: 600 }}
                  >
                    {t.count}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-4 text-[13px] text-muted-foreground py-6 text-center bg-muted/30 rounded-xl">
            Gefilterte Ansicht: {tabs3.find((t) => t.id === activeTab3)?.count} Patienten
          </div>
        </div>
      </div>
    </section>
  );
}
