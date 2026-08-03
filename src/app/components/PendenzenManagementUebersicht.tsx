import { useMemo } from "react";
import { ClipboardList, AlertTriangle, Calendar, CheckCircle2, List, Plus } from "lucide-react";
import { getUnifiedEntries, entryTitle, type UnifiedEntry } from "../../lib/mocks/service-desk-unified";
import { pendenzTypen, type PendenzTyp } from "../../types/pendenz";

const TODAY = "2026-03-03";

function daysFromToday(iso: string | null): number | null {
  if (!iso) return null;
  return Math.round((new Date(iso).getTime() - new Date(TODAY).getTime()) / 86400000);
}

function faelligLabel(iso: string | null): string {
  if (!iso) return "–";
  const d = daysFromToday(iso)!;
  if (d < -1) return `${Math.abs(d)} T. überfällig`;
  if (d === -1) return "Gestern";
  if (d === 0) return "Heute";
  if (d === 1) return "Morgen";
  const months = ["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"];
  const [, m, dd] = iso.split("-");
  return `${parseInt(dd)}. ${months[parseInt(m) - 1]}`;
}

/* ══════════════════════════════════════════
   AGGREGATES
   ══════════════════════════════════════════ */

interface Aggregates {
  offeneTotal: number;
  ueberfaellig: number;
  ueberfaelligTageMax: number;
  faellig7Tage: number;
  faellig7TageTopTyp: { typ: PendenzTyp; label: string; count: number } | null;
  erledigtLetzte7Tage: number;
  typenVerteilung: { typ: PendenzTyp; label: string; count: number }[];
  mitarbeiterAuslastung: { name: string; initialen: string; color: string; count: number; isEngpass: boolean }[];
  kritischeFaelle: UnifiedEntry[];
}

function calculateAggregates(entries: UnifiedEntry[]): Aggregates {
  const active = entries.filter(e => e.status !== "erledigt");
  const overdue = active.filter(e => e.faellig && daysFromToday(e.faellig)! < 0);
  const maxOverdueDays = overdue.reduce((max, e) => Math.max(max, Math.abs(daysFromToday(e.faellig)!)), 0);

  const next7 = active.filter(e => e.faellig && daysFromToday(e.faellig)! >= 0 && daysFromToday(e.faellig)! <= 7);

  // Top type in next 7 days
  const next7TypCounts: Record<string, number> = {};
  for (const e of next7) next7TypCounts[e.pendenzTyp] = (next7TypCounts[e.pendenzTyp] || 0) + 1;
  const topNext7 = Object.entries(next7TypCounts).sort((a, b) => b[1] - a[1])[0];

  // Erledigt in last 7 days (mock: count entries with status erledigt)
  const erledigt = entries.filter(e => e.status === "erledigt").length;

  // Type distribution
  const typCounts: Record<string, number> = {};
  for (const e of active) typCounts[e.pendenzTyp] = (typCounts[e.pendenzTyp] || 0) + 1;
  const typenVerteilung = Object.entries(typCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([typ, count]) => ({ typ: typ as PendenzTyp, label: pendenzTypen[typ as PendenzTyp]?.label || typ, count }));

  // Team workload
  const personCounts: Record<string, { name: string; initialen: string; color: string; count: number }> = {};
  for (const e of active) {
    const key = e.verantwortlich.initialen;
    if (!personCounts[key]) personCounts[key] = { name: e.verantwortlich.name, initialen: key, color: e.verantwortlich.color || "#8A8E92", count: 0 };
    personCounts[key].count++;
  }
  const personArr = Object.values(personCounts).sort((a, b) => b.count - a.count);
  const avgCount = personArr.length > 0 ? personArr.reduce((s, p) => s + p.count, 0) / personArr.length : 0;
  const mitarbeiter = personArr.map(p => ({ ...p, isEngpass: p.count > avgCount * 1.5 }));

  // Critical cases: overdue first, then high priority
  const critical = [...active]
    .sort((a, b) => {
      const aOver = a.faellig && daysFromToday(a.faellig)! < 0 ? -1000 + daysFromToday(a.faellig)! : 0;
      const bOver = b.faellig && daysFromToday(b.faellig)! < 0 ? -1000 + daysFromToday(b.faellig)! : 0;
      const aPrio = a.prioritaet === "hoch" ? -100 : a.prioritaet === "mittel" ? 0 : 100;
      const bPrio = b.prioritaet === "hoch" ? -100 : b.prioritaet === "mittel" ? 0 : 100;
      return (aOver + aPrio) - (bOver + bPrio);
    })
    .slice(0, 5);

  return {
    offeneTotal: active.length,
    ueberfaellig: overdue.length,
    ueberfaelligTageMax: maxOverdueDays,
    faellig7Tage: next7.length,
    faellig7TageTopTyp: topNext7 ? { typ: topNext7[0] as PendenzTyp, label: pendenzTypen[topNext7[0] as PendenzTyp]?.label || topNext7[0], count: topNext7[1] } : null,
    erledigtLetzte7Tage: erledigt,
    typenVerteilung,
    mitarbeiterAuslastung: mitarbeiter,
    kritischeFaelle: critical,
  };
}

/* ══════════════════════════════════════════
   PROPS
   ══════════════════════════════════════════ */

interface Props {
  onSwitchToList: () => void;
  onSelectPendenz: (id: string) => void;
}

/* ══════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════ */

export function PendenzenManagementUebersicht({ onSwitchToList, onSelectPendenz }: Props) {
  const entries = useMemo(() => getUnifiedEntries(), []);
  const agg = useMemo(() => calculateAggregates(entries), [entries]);


  const maxTypCount = agg.typenVerteilung[0]?.count || 1;

  return (
    <div className="h-full overflow-y-auto" style={{ padding: "var(--space-4) var(--space-6) var(--space-6)" }}>
      {/* Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: "var(--space-4)" }}>
        <h1 style={{ fontSize: "var(--text-h1)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", letterSpacing: "var(--tracking-tight)" }}>
          Pendenzenliste
        </h1>
        <div className="flex items-center" style={{ gap: "var(--space-2)" }}>
          <button
            onClick={onSwitchToList}
            className="inline-flex items-center cursor-pointer transition-colors"
            style={{
              gap: 6, padding: "7px 16px", borderRadius: "var(--radius-pill)",
              background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)",
              fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"}
            onMouseLeave={e => e.currentTarget.style.background = "var(--bg-elevated)"}
          >
            <List style={{ width: 14, height: 14 }} /> Zur Liste
          </button>
          <button
            className="inline-flex items-center cursor-pointer transition-colors"
            style={{
              gap: "var(--space-2)", padding: "10px 22px", borderRadius: "var(--radius-pill)",
              background: "var(--brand-primary)", color: "var(--text-on-dark)",
              fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", border: "none",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--brand-primary-dark)"}
            onMouseLeave={e => e.currentTarget.style.background = "var(--brand-primary)"}
          >
            <Plus style={{ width: 16, height: 16 }} /> Neues Ticket
          </button>
        </div>
      </div>


      {/* KPI Cards */}
      <div className="grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        <KPICard icon={ClipboardList} label="Offene Pendenzen" value={agg.offeneTotal} subInfo={`${agg.mitarbeiterAuslastung.length} Mitarbeitende beteiligt`} />
        <KPICard icon={AlertTriangle} label="Überfällig" value={agg.ueberfaellig} subInfo={agg.ueberfaellig > 0 ? `max. ${agg.ueberfaelligTageMax} Tage überfällig` : "Alles im Zeitplan"} valueColor={agg.ueberfaellig > 0 ? "var(--status-danger)" : undefined} iconBg={agg.ueberfaellig > 0 ? "var(--status-danger-bg)" : undefined} iconColor={agg.ueberfaellig > 0 ? "var(--status-danger)" : undefined} />
        <KPICard icon={Calendar} label="Diese Woche fällig" value={agg.faellig7Tage} subInfo={agg.faellig7TageTopTyp ? `${agg.faellig7TageTopTyp.count} ${agg.faellig7TageTopTyp.label}` : "–"} />
        <KPICard icon={CheckCircle2} label="Erledigt (7 Tage)" value={agg.erledigtLetzte7Tage} subInfo="letzte 7 Tage" iconBg="var(--status-success-bg)" iconColor="var(--status-success)" />
      </div>

      {/* Two-column: Type distribution + Team workload */}
      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>
        {/* Type distribution */}
        <div style={{ background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)", padding: "20px 24px" }}>
          <div style={{ fontSize: "var(--text-h3)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>Pendenz-Typen</div>
          <div style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", marginTop: 2, marginBottom: 16 }}>Verteilung der offenen Pendenzen</div>
          <div className="flex flex-col" style={{ gap: 10 }}>
            {agg.typenVerteilung.map(t => (
              <div key={t.typ} className="flex items-center" style={{ gap: 12 }}>
                <span className="shrink-0" style={{ width: 100, fontSize: "var(--text-small)", color: "var(--text-primary)", textAlign: "right" }}>{t.label}</span>
                <div className="flex-1" style={{ height: 8, background: "var(--bg-secondary)", borderRadius: "var(--radius-pill)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(t.count / maxTypCount) * 100}%`, background: "var(--brand-primary)", borderRadius: "var(--radius-pill)", opacity: 0.7 }} />
                </div>
                <span className="shrink-0" style={{ width: 24, fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", textAlign: "right" }}>{t.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Team workload */}
        <div style={{ background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)", padding: "20px 24px" }}>
          <div style={{ fontSize: "var(--text-h3)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>Auslastung Team</div>
          <div style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", marginTop: 2, marginBottom: 16 }}>Offene Pendenzen pro Person</div>
          <div className="flex flex-col" style={{ gap: 8 }}>
            {agg.mitarbeiterAuslastung.map(m => (
              <div key={m.initialen} className="flex items-center" style={{ gap: 10 }}>
                <div className="shrink-0 flex items-center justify-center" style={{ width: 22, height: 22, borderRadius: "var(--radius-pill)", background: m.color }}>
                  <span style={{ color: "var(--text-on-dark)", fontSize: 9, fontWeight: "var(--weight-medium)" }}>{m.initialen}</span>
                </div>
                <span className="flex-1" style={{ fontSize: "var(--text-body)", color: "var(--text-primary)" }}>{m.name}</span>
                {m.isEngpass && (
                  <span style={{ padding: "1px 8px", borderRadius: "var(--radius-pill)", fontSize: "var(--text-micro)", fontWeight: "var(--weight-medium)", background: "var(--status-warning-bg)", color: "var(--status-warning-text)" }}>
                    Engpass
                  </span>
                )}
                <span style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", minWidth: 20, textAlign: "right" }}>{m.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Critical cases */}
      <div style={{ background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)", padding: "20px 24px" }}>
        <div style={{ fontSize: "var(--text-h3)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>Kritische Fälle</div>
        <div style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)", marginTop: 2, marginBottom: 16 }}>Top {agg.kritischeFaelle.length} Pendenzen mit höchster Eskalations-Priorität</div>
        <div className="flex flex-col" style={{ gap: 6 }}>
          {agg.kritischeFaelle.map(entry => {
            const isOverdue = entry.faellig && daysFromToday(entry.faellig)! < 0;
            const typDef = pendenzTypen[entry.pendenzTyp];
            return (
              <button
                key={entry.id}
                onClick={() => onSelectPendenz(entry.id)}
                className="w-full flex text-left cursor-pointer transition-colors"
                style={{
                  position: "relative", padding: "10px 14px", borderRadius: "var(--radius-card)",
                  background: isOverdue ? "rgba(168,50,31,0.04)" : "var(--bg-primary)",
                  border: "var(--border-thin) solid var(--border-default)", overflow: "hidden",
                }}
                onMouseEnter={e => e.currentTarget.style.background = isOverdue ? "rgba(168,50,31,0.07)" : "var(--bg-secondary)"}
                onMouseLeave={e => e.currentTarget.style.background = isOverdue ? "rgba(168,50,31,0.04)" : "var(--bg-primary)"}
              >
                {isOverdue && <div className="absolute" style={{ left: 0, top: 0, bottom: 0, width: 3, background: "var(--status-danger)" }} />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center" style={{ gap: "var(--space-2)", marginBottom: 2 }}>
                    {typDef && (
                      <span className="inline-flex items-center shrink-0" style={{ padding: "2px 8px", borderRadius: "var(--radius-pill)", fontSize: 11, fontWeight: "var(--weight-medium)", background: typDef.pillBg, color: typDef.pillColor }}>
                        {typDef.label}
                      </span>
                    )}
                    <span className="truncate" style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>{entryTitle(entry)}</span>
                    <span className="shrink-0 ml-auto" style={{ fontSize: "var(--text-small)", fontWeight: isOverdue ? "var(--weight-medium)" : "var(--weight-regular)", color: isOverdue ? "var(--status-danger)" : "var(--text-secondary)" }}>
                      {entry.faellig ? faelligLabel(entry.faellig) : ""}
                    </span>
                  </div>
                  <div className="flex items-center" style={{ gap: "var(--space-2)" }}>
                    <span className="truncate flex-1" style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>{entry.kontext}</span>
                    <div className="shrink-0 flex items-center justify-center" style={{ width: 18, height: 18, borderRadius: "var(--radius-pill)", background: entry.verantwortlich.color || "var(--text-tertiary)" }}>
                      <span style={{ color: "var(--text-on-dark)", fontSize: 8, fontWeight: "var(--weight-medium)" }}>{entry.verantwortlich.initialen}</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   KPI CARD
   ══════════════════════════════════════════ */

function KPICard({ icon: Icon, label, value, subInfo, valueColor, iconBg, iconColor }: {
  icon: typeof ClipboardList;
  label: string;
  value: number;
  subInfo: string;
  valueColor?: string;
  iconBg?: string;
  iconColor?: string;
}) {
  return (
    <div style={{
      background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)",
      borderRadius: "var(--radius-card)", padding: "18px 20px",
    }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
        <span style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase" as const, fontWeight: "var(--weight-medium)" }}>
          {label}
        </span>
        <div className="flex items-center justify-center" style={{ width: 32, height: 32, borderRadius: "var(--radius-pill)", background: iconBg || "var(--bg-secondary)" }}>
          <Icon style={{ width: 18, height: 18, color: iconColor || "var(--text-secondary)" }} />
        </div>
      </div>
      <div style={{ fontSize: "var(--text-h1)", fontWeight: "var(--weight-medium)", color: valueColor || "var(--text-primary)", marginBottom: 4 }}>
        {value}
      </div>
      <div style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>{subInfo}</div>
    </div>
  );
}
