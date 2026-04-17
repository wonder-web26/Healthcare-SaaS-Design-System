import React, { useState } from "react";
import {
  Search,
  Filter,
  Download,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from "lucide-react";

type Status = "aktiv" | "onboarding" | "gekuendigt" | "pausiert";

interface Patient {
  id: string;
  name: string;
  ahv: string;
  ort: string;
  status: Status;
  leistung: string;
  betreuer: string;
}

const statusCfg: Record<Status, { label: string; bg: string; text: string; dot: string }> = {
  aktiv: { label: "Aktiv", bg: "bg-success-light", text: "text-success-foreground", dot: "bg-success" },
  onboarding: { label: "Onboarding", bg: "bg-warning-light", text: "text-warning-foreground", dot: "bg-warning" },
  gekuendigt: { label: "Gekündigt", bg: "bg-error-light", text: "text-error-foreground", dot: "bg-error" },
  pausiert: { label: "Pausiert", bg: "bg-neutral-light", text: "text-neutral-foreground", dot: "bg-neutral" },
};

const rows: Patient[] = [
  { id: "P-0041", name: "Müller, Anna", ahv: "756.1234.5678.90", ort: "Zürich", status: "aktiv", leistung: "Pflege HKP", betreuer: "S. Weber" },
  { id: "P-0042", name: "Schmid, Thomas", ahv: "756.9876.5432.10", ort: "Oerlikon", status: "onboarding", leistung: "Hauswirtschaft", betreuer: "K. Meier" },
  { id: "P-0043", name: "Weber, Maria", ahv: "756.1111.2222.33", ort: "Seebach", status: "aktiv", leistung: "Pflege A", betreuer: "L. Brunner" },
  { id: "P-0044", name: "Fischer, Klaus", ahv: "756.4444.5555.66", ort: "Affoltern", status: "gekuendigt", leistung: "Beratung", betreuer: "M. Keller" },
  { id: "P-0045", name: "Becker, Sabine", ahv: "756.7777.8888.99", ort: "Schwamendingen", status: "aktiv", leistung: "Pflege HKP", betreuer: "S. Weber" },
  { id: "P-0046", name: "Hoffmann, Peter", ahv: "756.3333.4444.55", ort: "Höngg", status: "pausiert", leistung: "Therapie", betreuer: "K. Meier" },
];

export function DSTable() {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleAll = () => {
    setSelected(selected.size === rows.length ? new Set() : new Set(rows.map((r) => r.id)));
  };

  const toggle = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  return (
    <section>
      <h3 className="mb-1">Tabelle</h3>
      <p className="text-muted-foreground text-[13px] mb-6">
        SaaS-Datentabelle mit Sortierung, Filterung und Statusanzeigen.
      </p>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-border flex-wrap">
          <div className="flex items-center gap-2 bg-background rounded-xl px-3 py-[7px] flex-1 max-w-[320px] border border-border-light">
            <Search className="w-3.5 h-3.5 text-muted-foreground" />
            <input
              placeholder="Patienten suchen…"
              className="bg-transparent outline-none text-[12px] flex-1 placeholder:text-muted-foreground/50"
              style={{ fontWeight: 400 }}
            />
          </div>
          <button className="inline-flex items-center gap-1.5 px-3 py-[7px] text-[12px] rounded-xl border border-border bg-card hover:bg-secondary/50 transition-colors" style={{ fontWeight: 500 }}>
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            Filter
          </button>
          <div className="flex-1" />
          {selected.size > 0 && (
            <span className="text-[11px] text-primary" style={{ fontWeight: 500 }}>{selected.size} ausgewählt</span>
          )}
          <button className="inline-flex items-center gap-1.5 px-3 py-[7px] text-[12px] rounded-xl border border-border bg-card hover:bg-secondary/50 transition-colors" style={{ fontWeight: 500 }}>
            <Download className="w-3.5 h-3.5 text-muted-foreground" />
            Export
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/40">
                <th className="w-10 px-4 py-2.5 text-left">
                  <input type="checkbox" checked={selected.size === rows.length} onChange={toggleAll} className="rounded border-border accent-primary" />
                </th>
                {["ID", "Patient", "AHV-Nr.", "Ort", "Status", "Leistung", "Betreuer/in"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left">
                    <button className="inline-flex items-center gap-1 text-[11px] text-muted-foreground uppercase tracking-wider" style={{ fontWeight: 500 }}>
                      {h}
                      <ArrowUpDown className="w-3 h-3 opacity-40" />
                    </button>
                  </th>
                ))}
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const s = statusCfg[r.status];
                const isSel = selected.has(r.id);
                return (
                  <tr
                    key={r.id}
                    className={`border-t border-border-light transition-colors ${isSel ? "bg-primary/[0.03]" : "hover:bg-muted/30"}`}
                  >
                    <td className="px-4 py-2.5">
                      <input type="checkbox" checked={isSel} onChange={() => toggle(r.id)} className="rounded border-border accent-primary" />
                    </td>
                    <td className="px-4 py-2.5 text-[12px] text-muted-foreground font-mono">{r.id}</td>
                    <td className="px-4 py-2.5 text-[13px]" style={{ fontWeight: 500 }}>{r.name}</td>
                    <td className="px-4 py-2.5 text-[12px] text-muted-foreground font-mono">{r.ahv}</td>
                    <td className="px-4 py-2.5 text-[13px] text-muted-foreground">{r.ort}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-[2px] rounded-full text-[11px] ${s.bg} ${s.text}`} style={{ fontWeight: 500 }}>
                        <span className={`w-[5px] h-[5px] rounded-full ${s.dot}`} />
                        {s.label}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-[13px] text-muted-foreground">{r.leistung}</td>
                    <td className="px-4 py-2.5 text-[13px] text-muted-foreground">{r.betreuer}</td>
                    <td className="px-4 py-2.5">
                      <button className="p-1 rounded-lg hover:bg-secondary transition-colors">
                        <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border-light text-[12px] text-muted-foreground">
          <span>1–6 von 142 Patienten</span>
          <div className="flex items-center gap-1">
            <button className="p-1.5 rounded-lg border border-border hover:bg-secondary transition-colors" disabled>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                className={`min-w-[28px] h-[28px] rounded-lg text-[12px] transition-colors ${
                  n === 1 ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
                }`}
                style={{ fontWeight: n === 1 ? 500 : 400 }}
              >
                {n}
              </button>
            ))}
            <span className="px-1">…</span>
            <button className="min-w-[28px] h-[28px] rounded-lg text-[12px] hover:bg-secondary transition-colors" style={{ fontWeight: 400 }}>24</button>
            <button className="p-1.5 rounded-lg border border-border hover:bg-secondary transition-colors">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
