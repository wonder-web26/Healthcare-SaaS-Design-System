import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Search,
  Filter,
  Users,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Star,
  MapPin,
  Globe,
  Briefcase,
  BarChart3,
  ChevronRight,
  X,
  Check,
  UserPlus,
} from "lucide-react";
import {
  patients as allPatients,
  statusConfig,
  schweregradConfig,
  type Patient,
} from "./patientData";

/* ── Pflegefachkraft pool for matching ──── */
interface Pflegefachkraft {
  id: string;
  name: string;
  initialen: string;
  sprachen: string[];
  skills: string[];
  regionen: string[];
  kapazitaet: number;
  maxKapazitaet: number;
  bewertung: number;
}

const pflegefachkraefte: Pflegefachkraft[] = [
  { id: "pf1", name: "Sandra Weber", initialen: "SW", sprachen: ["Deutsch", "Englisch"], skills: ["Pflege HKP", "Wundmanagement", "Palliative Care"], regionen: ["ZH", "AG"], kapazitaet: 35, maxKapazitaet: 40, bewertung: 4.8 },
  { id: "pf2", name: "Kathrin Meier", initialen: "KM", sprachen: ["Deutsch", "Französisch"], skills: ["Pflege HKP", "Hauswirtschaft", "Demenzpflege"], regionen: ["ZH", "SG"], kapazitaet: 32, maxKapazitaet: 40, bewertung: 4.6 },
  { id: "pf3", name: "Laura Brunner", initialen: "LB", sprachen: ["Deutsch", "Italienisch", "Englisch"], skills: ["Pflege A", "Onkologie", "Psychiatrie"], regionen: ["ZH", "BE"], kapazitaet: 28, maxKapazitaet: 40, bewertung: 4.9 },
  { id: "pf4", name: "Maria Keller", initialen: "MK", sprachen: ["Deutsch", "Portugiesisch", "Spanisch"], skills: ["Pflege HKP", "Beratung", "Therapie"], regionen: ["AG", "LU", "ZH"], kapazitaet: 30, maxKapazitaet: 40, bewertung: 4.5 },
  { id: "pf5", name: "Ayşe Yılmaz", initialen: "AY", sprachen: ["Türkisch", "Deutsch", "Englisch"], skills: ["Pflege HKP", "Hauswirtschaft", "Gerontologie"], regionen: ["ZH", "SG", "TG"], kapazitaet: 22, maxKapazitaet: 40, bewertung: 4.7 },
  { id: "pf6", name: "Sophie Dubois", initialen: "SD", sprachen: ["Französisch", "Deutsch"], skills: ["Pflege A", "Palliative Care", "Wundmanagement"], regionen: ["BE", "FR", "VD"], kapazitaet: 25, maxKapazitaet: 40, bewertung: 4.4 },
];

/* ── Matching algorithm ──────────────────── */
function getTopMatches(patient: Patient): (Pflegefachkraft & { score: number; reasons: string[] })[] {
  return pflegefachkraefte
    .map((pf) => {
      let score = 0;
      const reasons: string[] = [];

      // Language match (highest weight)
      if (pf.sprachen.includes(patient.sprache)) {
        score += 40;
        reasons.push(`Spricht ${patient.sprache}`);
      }

      // Region match
      if (pf.regionen.includes(patient.kanton)) {
        score += 30;
        reasons.push(`Region ${patient.kanton}`);
      }

      // Skills match
      if (pf.skills.includes(patient.leistungsart)) {
        score += 20;
        reasons.push(`Skill: ${patient.leistungsart}`);
      }

      // Capacity (lower usage = better)
      const capacityRatio = 1 - pf.kapazitaet / pf.maxKapazitaet;
      score += Math.round(capacityRatio * 10);
      if (capacityRatio > 0.25) reasons.push("Kapazität verfügbar");

      return { ...pf, score, reasons };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

/* ══════════════════════════════════════════ */
export function ZuteilungPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filterKanton, setFilterKanton] = useState("alle");
  const [filterSchweregrad, setFilterSchweregrad] = useState("alle");
  const [filterSprache, setFilterSprache] = useState("alle");
  const [filterPflegefachkraft, setFilterPflegefachkraft] = useState("alle");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [confirmToast, setConfirmToast] = useState<string | null>(null);

  // Build unique filter options
  const kantone = [...new Set(allPatients.map((p) => p.kanton))].sort();
  const sprachen = [...new Set(allPatients.map((p) => p.sprache))].sort();

  // Build Pflegefachkraft options with patient counts (including runtime assignments)
  const pflegefachkraftOptions = useMemo(() => {
    const countMap: Record<string, number> = {};
    allPatients.forEach((p) => {
      const assigned = assignments[p.id] || p.pflegefachkraft;
      if (assigned && assigned !== "—") {
        countMap[assigned] = (countMap[assigned] || 0) + 1;
      }
    });
    // Also count from the static pool to ensure all names appear
    pflegefachkraefte.forEach((pf) => {
      if (!(pf.name in countMap)) countMap[pf.name] = 0;
    });
    return Object.entries(countMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, count]) => ({ name, count }));
  }, [assignments]);

  // Filter patients
  const filtered = useMemo(() => {
    let list = allPatients;
    if (filterKanton !== "alle") list = list.filter((p) => p.kanton === filterKanton);
    if (filterSchweregrad !== "alle") list = list.filter((p) => p.schweregrad === filterSchweregrad);
    if (filterSprache !== "alle") list = list.filter((p) => p.sprache === filterSprache);
    if (filterPflegefachkraft !== "alle") {
      if (filterPflegefachkraft === "nicht_zugewiesen") {
        list = list.filter((p) => {
          const assigned = assignments[p.id] || p.pflegefachkraft;
          return !assigned || assigned === "—";
        });
      } else {
        list = list.filter((p) => {
          const assigned = assignments[p.id] || p.pflegefachkraft;
          return assigned === filterPflegefachkraft;
        });
      }
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          `${p.vorname} ${p.nachname}`.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          p.sprache.toLowerCase().includes(q)
      );
    }
    return list;
  }, [filterKanton, filterSchweregrad, filterSprache, filterPflegefachkraft, search, assignments]);

  const unassignedCount = allPatients.filter((p) => p.pflegefachkraft === "—").length;

  const isUnassigned = (p: Patient) =>
    p.pflegefachkraft === "—" && !assignments[p.id];

  const getAssignedName = (p: Patient) =>
    assignments[p.id] || (p.pflegefachkraft !== "—" ? p.pflegefachkraft : null);

  const handleConfirmMatch = (patient: Patient, pf: Pflegefachkraft) => {
    setAssignments((prev) => ({ ...prev, [patient.id]: pf.name }));
    setConfirmToast(`${pf.name} wurde ${patient.nachname}, ${patient.vorname} zugewiesen`);
    setTimeout(() => setConfirmToast(null), 3000);
  };

  const topMatches = selectedPatient ? getTopMatches(selectedPatient) : [];

  return (
    <>
      {/* ── Page Header ──────────────────── */}
      <div className="px-4 md:px-8 pt-7 pb-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-foreground">Management Zuteilung</h2>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              Patienten an Pflegefachkräfte zuweisen — KI-unterstütztes Matching
            </p>
          </div>
          <div className="flex items-center gap-2">
            {unassignedCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-[7px] text-[12px] rounded-xl bg-warning-light text-warning-foreground border border-warning/20" style={{ fontWeight: 500 }}>
                <AlertTriangle className="w-3.5 h-3.5" />
                {unassignedCount} nicht zugewiesen
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Main content ─────────────────── */}
      <div className="px-4 md:px-8 pt-5 pb-10">
        <div className="flex flex-col xl:flex-row gap-5">

          {/* ── Left: Patient table ──────── */}
          <div className="flex-1 min-w-0">
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              {/* Filters */}
              <div className="px-5 pt-4 pb-3 border-b border-border-light">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-foreground">Patientenliste</h4>
                  <span className="text-[12px] text-muted-foreground">
                    {filtered.length} Patienten
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Search */}
                  <div className="flex items-center gap-2 bg-background rounded-xl px-3 py-[6px] border border-border-light min-w-[180px] flex-1 max-w-[280px]">
                    <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Suchen…"
                      className="bg-transparent outline-none text-[12px] flex-1 placeholder:text-muted-foreground/50"
                      style={{ fontWeight: 400 }}
                    />
                  </div>
                  {/* Kanton filter */}
                  <select
                    value={filterKanton}
                    onChange={(e) => setFilterKanton(e.target.value)}
                    className="px-2.5 py-[6px] text-[12px] rounded-xl border border-border bg-card text-foreground outline-none appearance-none cursor-pointer"
                    style={{ fontWeight: 400 }}
                  >
                    <option value="alle">Alle Kantone</option>
                    {kantone.map((k) => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                  {/* Schweregrad filter */}
                  <select
                    value={filterSchweregrad}
                    onChange={(e) => setFilterSchweregrad(e.target.value)}
                    className="px-2.5 py-[6px] text-[12px] rounded-xl border border-border bg-card text-foreground outline-none appearance-none cursor-pointer"
                    style={{ fontWeight: 400 }}
                  >
                    <option value="alle">Alle Schweregrade</option>
                    <option value="leicht">Leicht</option>
                    <option value="mittel">Mittel</option>
                    <option value="schwer">Schwer</option>
                    <option value="kritisch">Kritisch</option>
                  </select>
                  {/* Sprache filter */}
                  <select
                    value={filterSprache}
                    onChange={(e) => setFilterSprache(e.target.value)}
                    className="px-2.5 py-[6px] text-[12px] rounded-xl border border-border bg-card text-foreground outline-none appearance-none cursor-pointer"
                    style={{ fontWeight: 400 }}
                  >
                    <option value="alle">Alle Sprachen</option>
                    {sprachen.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {/* Pflegefachkraft filter */}
                  <select
                    value={filterPflegefachkraft}
                    onChange={(e) => setFilterPflegefachkraft(e.target.value)}
                    className="px-2.5 py-[6px] text-[12px] rounded-xl border border-border bg-card text-foreground outline-none appearance-none cursor-pointer"
                    style={{ fontWeight: 400 }}
                  >
                    <option value="alle">Alle Pflegefachkräfte</option>
                    <option value="nicht_zugewiesen">Nicht zugewiesen</option>
                    {pflegefachkraftOptions.map((pf) => (
                      <option key={pf.name} value={pf.name}>{pf.name} ({pf.count})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/30">
                      {["Patient", "Status", "Kanton", "Schweregrad", "Sprache", "Zugewiesen"].map((col) => (
                        <th key={col} className="px-4 py-2.5 text-left">
                          <span className="text-[11px] text-muted-foreground uppercase tracking-wider" style={{ fontWeight: 500 }}>{col}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p) => {
                      const st = statusConfig[p.status];
                      const sg = schweregradConfig[p.schweregrad];
                      const unassigned = isUnassigned(p);
                      const assignedName = getAssignedName(p);
                      const isSelected = selectedPatient?.id === p.id;

                      return (
                        <tr
                          key={p.id}
                          onClick={() => setSelectedPatient(p)}
                          className={`border-t border-border-light transition-colors cursor-pointer group ${
                            unassigned
                              ? "bg-warning-light/30 hover:bg-warning-light/50"
                              : isSelected
                              ? "bg-primary/[0.04]"
                              : "hover:bg-primary/[0.02]"
                          } ${isSelected ? "ring-1 ring-inset ring-primary/20" : ""}`}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                unassigned
                                  ? "bg-warning-light border border-warning/20"
                                  : "bg-gradient-to-br from-primary/10 to-primary/5"
                              }`}>
                                <span className={`text-[11px] ${unassigned ? "text-warning" : "text-primary"}`} style={{ fontWeight: 600 }}>
                                  {p.vorname[0]}{p.nachname[0]}
                                </span>
                              </div>
                              <div>
                                <span className="text-[13px] text-foreground group-hover:text-primary transition-colors" style={{ fontWeight: 500 }}>
                                  {p.nachname}, {p.vorname}
                                </span>
                                <div className="text-[10.5px] text-muted-foreground font-mono">{p.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-[2px] rounded-full text-[11px] ${st.bg} ${st.text}`} style={{ fontWeight: 500 }}>
                              <span className={`w-[5px] h-[5px] rounded-full ${st.dot}`} />
                              {st.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2 py-[2px] rounded-md bg-muted text-[12px] text-foreground" style={{ fontWeight: 500 }}>
                              {p.kanton}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-[2px] rounded-md text-[11px] ${sg.bg} ${sg.text}`} style={{ fontWeight: 500 }}>
                              {sg.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 text-[12px] text-foreground" style={{ fontWeight: 400 }}>
                              <Globe className="w-3 h-3 text-muted-foreground" />
                              {p.sprache}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {assignedName ? (
                              <span className="inline-flex items-center gap-1.5 text-[12px] text-success" style={{ fontWeight: 500 }}>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {assignedName}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[12px] text-warning" style={{ fontWeight: 500 }}>
                                <AlertTriangle className="w-3 h-3" />
                                Nicht zugewiesen
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ── Right: Matching panel ────── */}
          <div className="w-full xl:w-[380px] shrink-0">
            <div className="bg-card rounded-2xl border border-border overflow-hidden sticky top-4">
              <div className="px-5 py-4 border-b border-border-light">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary-light flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div>
                    <h5 className="text-foreground">Matching Algorithmus</h5>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Top-3 Empfehlungen</p>
                  </div>
                </div>
              </div>

              {selectedPatient ? (
                <div className="p-4 space-y-3">
                  {/* Selected patient info */}
                  <div className="p-3 rounded-xl bg-primary-light/50 border border-primary/10">
                    <div className="text-[11px] text-primary uppercase tracking-wider mb-1" style={{ fontWeight: 500 }}>Ausgewählter Patient</div>
                    <div className="text-[14px] text-foreground" style={{ fontWeight: 600 }}>
                      {selectedPatient.nachname}, {selectedPatient.vorname}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground flex-wrap">
                      <span>{selectedPatient.kanton}</span>
                      <span>·</span>
                      <span>{selectedPatient.sprache}</span>
                      <span>·</span>
                      <span>{selectedPatient.leistungsart}</span>
                    </div>
                  </div>

                  {/* Top 3 matches */}
                  {topMatches.map((match, idx) => {
                    const isAssigned = assignments[selectedPatient.id] === match.name;
                    const capacityPct = (match.kapazitaet / match.maxKapazitaet) * 100;
                    const capacityColor =
                      capacityPct >= 90 ? "bg-error" : capacityPct >= 75 ? "bg-warning" : "bg-success";

                    return (
                      <div
                        key={match.id}
                        className={`p-3.5 rounded-xl border transition-all ${
                          isAssigned
                            ? "border-success/30 bg-success-light"
                            : idx === 0
                            ? "border-primary/20 bg-primary-light/30"
                            : "border-border hover:border-primary/20"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                              isAssigned ? "bg-success-medium" : idx === 0 ? "bg-primary text-primary-foreground" : "bg-muted"
                            }`}>
                              {isAssigned ? (
                                <CheckCircle2 className="w-[18px] h-[18px] text-success" />
                              ) : (
                                <span className={`text-[11px] ${idx === 0 ? "text-primary-foreground" : "text-muted-foreground"}`} style={{ fontWeight: 600 }}>
                                  {match.initialen}
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[13px] text-foreground" style={{ fontWeight: 500 }}>{match.name}</span>
                                {idx === 0 && !isAssigned && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary" style={{ fontWeight: 600 }}>
                                    TOP MATCH
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-muted-foreground">
                                Score: {match.score}%
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3 h-3 ${s <= Math.round(match.bewertung) ? "text-warning fill-warning" : "text-muted-foreground/20"}`}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Details */}
                        <div className="space-y-1.5 mb-3">
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <Globe className="w-3 h-3 shrink-0" />
                            <span>{match.sprachen.join(", ")}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <Briefcase className="w-3 h-3 shrink-0" />
                            <span>{match.skills.join(", ")}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span>{match.regionen.join(", ")}</span>
                          </div>
                        </div>

                        {/* Capacity bar */}
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${capacityColor}`} style={{ width: `${capacityPct}%` }} />
                          </div>
                          <span className="text-[11px] text-muted-foreground shrink-0" style={{ fontWeight: 500 }}>
                            {match.kapazitaet}/{match.maxKapazitaet}
                          </span>
                        </div>

                        {/* Match reasons */}
                        <div className="flex flex-wrap gap-1 mb-3">
                          {match.reasons.map((r, ri) => (
                            <span key={ri} className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground" style={{ fontWeight: 500 }}>
                              {r}
                            </span>
                          ))}
                        </div>

                        {/* Action */}
                        {isAssigned ? (
                          <div className="flex items-center gap-1.5 text-[12px] text-success" style={{ fontWeight: 500 }}>
                            <CheckCircle2 className="w-4 h-4" />
                            Zugewiesen
                          </div>
                        ) : (
                          <button
                            onClick={() => handleConfirmMatch(selectedPatient, match)}
                            className={`w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[12px] transition-all ${
                              idx === 0
                                ? "bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm"
                                : "border border-border bg-card text-foreground hover:bg-secondary/60"
                            }`}
                            style={{ fontWeight: 500 }}
                          >
                            {idx === 0 ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                Top Match bestätigen
                              </>
                            ) : (
                              <>
                                <UserPlus className="w-3.5 h-3.5" />
                                Zuweisen
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
                    <Users className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <p className="text-[13px] text-foreground" style={{ fontWeight: 500 }}>
                    Patient auswählen
                  </p>
                  <p className="text-[12px] text-muted-foreground mt-1 max-w-[240px] mx-auto">
                    Klicken Sie auf einen Patienten in der Tabelle, um Matching-Vorschläge zu sehen.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Toast notification ───────────── */}
      {confirmToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-foreground text-background shadow-2xl animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
          <span className="text-[13px]" style={{ fontWeight: 500 }}>{confirmToast}</span>
        </div>
      )}
    </>
  );
}