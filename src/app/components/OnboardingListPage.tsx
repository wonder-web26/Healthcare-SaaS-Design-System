import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Plus,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Ban,
  ChevronDown,
  FileText,
  ClipboardList,
  FileSignature,
  X,
  Info,
} from "lucide-react";

/* ══════════════════════════════════════════
   ONBOARDING CASE TYPE
   ══════════════════════════════════════════ */
type OnboardingStatus =
  | "in_erfassung"
  | "unvollstaendig"
  | "blockiert";

interface OnboardingCase {
  id: string;
  patientVorname: string;
  patientNachname: string;
  patientId: string;
  angehoeriger: string;
  vertragDatum: string;
  erfasstAm: string;
  status: OnboardingStatus;
  fehlendeDokumente: number;
  fehlendePflichtfelder: number;
  abrechnungsstopp: boolean;
  abrechnungsstoppGrund?: string;
  verantwortlich: string;
  verantwortlichInitialen: string;
  letzteAenderung: string;
  kanton: string;
}

/* ── Status config ────────────────────────── */
const statusCfg: Record<
  OnboardingStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  in_erfassung: {
    label: "In Erfassung",
    bg: "bg-info-light",
    text: "text-info-foreground",
    dot: "bg-info",
  },
  unvollstaendig: {
    label: "Unvollständig",
    bg: "bg-warning-light",
    text: "text-warning-foreground",
    dot: "bg-warning",
  },
  blockiert: {
    label: "Blockiert",
    bg: "bg-error-light",
    text: "text-error-foreground",
    dot: "bg-error",
  },
};

/* ── Row highlight ────────────────────────── */
function rowBg(c: OnboardingCase): string {
  if (c.abrechnungsstopp || c.status === "blockiert") return "bg-error/[0.03]";
  if (c.status === "unvollstaendig") return "bg-warning/[0.025]";
  if (c.status === "in_erfassung") return "bg-info/[0.02]";
  return "";
}

/* ── Row left-border accent ──────────────── */
function rowBorder(c: OnboardingCase): string {
  if (c.abrechnungsstopp || c.status === "blockiert") return "border-l-2 border-l-error/40";
  if (c.status === "unvollstaendig") return "border-l-2 border-l-warning/40";
  return "border-l-2 border-l-transparent";
}

/* ══════════════════════════════════════════
   MOCK DATA
   All cases have a signed contract (Vertrag unterzeichnet).
   Fully onboarded cases are NOT shown here —
   they have been activated as Patient records.
   ══════════════════════════════════════════ */
const cases: OnboardingCase[] = [
  {
    id: "OB-2026-001",
    patientVorname: "Thomas",
    patientNachname: "Schmid",
    patientId: "P-2026-0042",
    angehoeriger: "Lisa Schmid",
    vertragDatum: "18.02.2026",
    erfasstAm: "20.02.2026",
    status: "unvollstaendig",
    fehlendeDokumente: 4,
    fehlendePflichtfelder: 2,
    abrechnungsstopp: false,
    verantwortlich: "Kathrin Meier",
    verantwortlichInitialen: "KM",
    letzteAenderung: "26.02.2026",
    kanton: "ZH",
  },
  {
    id: "OB-2026-002",
    patientVorname: "Peter",
    patientNachname: "Hoffmann",
    patientId: "P-2026-0046",
    angehoeriger: "Ruth Hoffmann",
    vertragDatum: "20.02.2026",
    erfasstAm: "22.02.2026",
    status: "in_erfassung",
    fehlendeDokumente: 8,
    fehlendePflichtfelder: 6,
    abrechnungsstopp: false,
    verantwortlich: "Sandra Weber",
    verantwortlichInitialen: "SW",
    letzteAenderung: "25.02.2026",
    kanton: "SG",
  },
  {
    id: "OB-2026-003",
    patientVorname: "Sabine",
    patientNachname: "Becker",
    patientId: "P-2026-0045",
    angehoeriger: "Hans Becker",
    vertragDatum: "10.02.2026",
    erfasstAm: "15.02.2026",
    status: "blockiert",
    fehlendeDokumente: 2,
    fehlendePflichtfelder: 0,
    abrechnungsstopp: true,
    abrechnungsstoppGrund: "Fehlende Kostengutsprache",
    verantwortlich: "Sandra Weber",
    verantwortlichInitialen: "SW",
    letzteAenderung: "24.02.2026",
    kanton: "ZH",
  },
  {
    id: "OB-2026-004",
    patientVorname: "Heinrich",
    patientNachname: "Steiner",
    patientId: "P-2026-0048",
    angehoeriger: "Ursula Steiner",
    vertragDatum: "05.02.2026",
    erfasstAm: "10.02.2026",
    status: "blockiert",
    fehlendeDokumente: 1,
    fehlendePflichtfelder: 0,
    abrechnungsstopp: true,
    abrechnungsstoppGrund: "Kritische Gesundheitslage",
    verantwortlich: "Laura Brunner",
    verantwortlichInitialen: "LB",
    letzteAenderung: "23.02.2026",
    kanton: "BE",
  },
  {
    id: "OB-2026-008",
    patientVorname: "Lena",
    patientNachname: "Graf",
    patientId: "P-2026-0051",
    angehoeriger: "Martin Graf",
    vertragDatum: "24.02.2026",
    erfasstAm: "25.02.2026",
    status: "in_erfassung",
    fehlendeDokumente: 11,
    fehlendePflichtfelder: 9,
    abrechnungsstopp: false,
    verantwortlich: "Kathrin Meier",
    verantwortlichInitialen: "KM",
    letzteAenderung: "27.02.2026",
    kanton: "AG",
  },
  {
    id: "OB-2026-009",
    patientVorname: "Fritz",
    patientNachname: "Huber",
    patientId: "P-2026-0052",
    angehoeriger: "Erika Huber",
    vertragDatum: "15.02.2026",
    erfasstAm: "18.02.2026",
    status: "unvollstaendig",
    fehlendeDokumente: 3,
    fehlendePflichtfelder: 1,
    abrechnungsstopp: false,
    verantwortlich: "Maria Keller",
    verantwortlichInitialen: "MK",
    letzteAenderung: "26.02.2026",
    kanton: "LU",
  },
  {
    id: "OB-2026-010",
    patientVorname: "Rosa",
    patientNachname: "Ammann",
    patientId: "P-2026-0053",
    angehoeriger: "Daniel Ammann",
    vertragDatum: "26.02.2026",
    erfasstAm: "27.02.2026",
    status: "in_erfassung",
    fehlendeDokumente: 14,
    fehlendePflichtfelder: 12,
    abrechnungsstopp: false,
    verantwortlich: "Sandra Weber",
    verantwortlichInitialen: "SW",
    letzteAenderung: "27.02.2026",
    kanton: "ZH",
  },
  {
    id: "OB-2026-011",
    patientVorname: "Walter",
    patientNachname: "Frei",
    patientId: "P-2026-0054",
    angehoeriger: "Margrit Frei",
    vertragDatum: "12.02.2026",
    erfasstAm: "14.02.2026",
    status: "unvollstaendig",
    fehlendeDokumente: 1,
    fehlendePflichtfelder: 0,
    abrechnungsstopp: false,
    verantwortlich: "Laura Brunner",
    verantwortlichInitialen: "LB",
    letzteAenderung: "27.02.2026",
    kanton: "ZH",
  },
];

/* ── Unique values for filters ────────────── */
const allVerantwortliche = [...new Set(cases.map((c) => c.verantwortlich))];
const allKantone = [...new Set(cases.map((c) => c.kanton))].sort();

/* ══════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════ */
export function OnboardingListPage() {
  const navigate = useNavigate();

  /* Filters */
  const [statusFilter, setStatusFilter] = useState<OnboardingStatus | "">("");
  const [verantwortlichFilter, setVerantwortlichFilter] = useState("");
  const [kantonFilter, setKantonFilter] = useState("");
  const [nurBlockiert, setNurBlockiert] = useState(false);
  const [search, setSearch] = useState("");

  /* Filtered data */
  const filtered = useMemo(() => {
    let result = cases;
    if (statusFilter) result = result.filter((c) => c.status === statusFilter);
    if (verantwortlichFilter)
      result = result.filter((c) => c.verantwortlich === verantwortlichFilter);
    if (kantonFilter) result = result.filter((c) => c.kanton === kantonFilter);
    if (nurBlockiert)
      result = result.filter((c) => c.abrechnungsstopp || c.status === "blockiert");
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.patientNachname.toLowerCase().includes(q) ||
          c.patientVorname.toLowerCase().includes(q) ||
          c.angehoeriger.toLowerCase().includes(q) ||
          c.patientId.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q)
      );
    }
    return result;
  }, [statusFilter, verantwortlichFilter, kantonFilter, nurBlockiert, search]);

  /* KPIs */
  const kpiOffen = cases.length;
  const kpiInErfassung = cases.filter((c) => c.status === "in_erfassung").length;
  const kpiUnvollstaendig = cases.filter((c) => c.status === "unvollstaendig").length;
  const kpiBlockiert = cases.filter(
    (c) => c.status === "blockiert" || c.abrechnungsstopp
  ).length;
  const kpiFastFertig = cases.filter(
    (c) => c.fehlendeDokumente <= 1 && c.fehlendePflichtfelder === 0 && !c.abrechnungsstopp
  ).length;

  const hasActiveFilters =
    statusFilter || verantwortlichFilter || kantonFilter || nurBlockiert || search;

  const clearFilters = () => {
    setStatusFilter("");
    setVerantwortlichFilter("");
    setKantonFilter("");
    setNurBlockiert(false);
    setSearch("");
  };

  return (
    <div className="px-4 md:px-8 py-6">
      {/* ── Header ─────────────────────────── */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h2 className="text-foreground">Onboarding</h2>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Offene Mandatseröffnungen mit unterzeichnetem Vertrag
          </p>
        </div>
        <button
          onClick={() => navigate("/onboarding/neu")}
          className="inline-flex items-center gap-1.5 px-4 py-[8px] text-[13px] rounded-xl bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm transition-colors"
          style={{ fontWeight: 500 }}
        >
          <Plus className="w-4 h-4" />
          Neues Mandat
        </button>
      </div>

      {/* ── Context info ───────────────────── */}
      <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-info-light/50 border border-info/10 mb-5">
        <Info className="w-4 h-4 text-info mt-0.5 shrink-0" />
        <p className="text-[12px] text-info-foreground leading-relaxed">
          Hier erscheinen ausschliesslich Mandate mit unterzeichnetem Vertrag, deren Onboarding noch nicht abgeschlossen ist.
          Nach Abschluss aller Pflichtfelder und Dokumente wird das Mandat als Patient aktiviert und erscheint unter <strong>Patienten</strong>.
        </p>
      </div>

      {/* ── KPI Bar ────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <KpiCard
          icon={ClipboardList}
          iconBg="bg-primary-light"
          iconColor="text-primary"
          label="Offene Onboardings"
          value={kpiOffen}
        />
        <KpiCard
          icon={Clock}
          iconBg="bg-warning-light"
          iconColor="text-warning"
          label="Unvollständig"
          value={kpiInErfassung + kpiUnvollstaendig}
        />
        <KpiCard
          icon={Ban}
          iconBg="bg-error-light"
          iconColor="text-error"
          label="Blockiert"
          value={kpiBlockiert}
        />
        <KpiCard
          icon={FileSignature}
          iconBg="bg-success-light"
          iconColor="text-success"
          label="Fast abgeschlossen"
          value={kpiFastFertig}
        />
      </div>

      {/* ── Filter Bar ─────────────────────── */}
      <div className="bg-card rounded-2xl border border-border p-3.5 mb-4">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span style={{ fontWeight: 500 }}>Filter</span>
          </div>

          {/* Status */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as OnboardingStatus | "")}
              className="appearance-none pl-3 pr-7 py-[5px] text-[12px] rounded-lg border border-border bg-background text-foreground outline-none cursor-pointer focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
              style={{ fontWeight: 400 }}
            >
              <option value="">Status</option>
              <option value="in_erfassung">In Erfassung</option>
              <option value="unvollstaendig">Unvollständig</option>
              <option value="blockiert">Blockiert</option>
            </select>
            <ChevronDown className="w-3 h-3 text-muted-foreground absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Verantwortlich */}
          <div className="relative">
            <select
              value={verantwortlichFilter}
              onChange={(e) => setVerantwortlichFilter(e.target.value)}
              className="appearance-none pl-3 pr-7 py-[5px] text-[12px] rounded-lg border border-border bg-background text-foreground outline-none cursor-pointer focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
              style={{ fontWeight: 400 }}
            >
              <option value="">Verantwortlich</option>
              {allVerantwortliche.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-muted-foreground absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Kanton */}
          <div className="relative">
            <select
              value={kantonFilter}
              onChange={(e) => setKantonFilter(e.target.value)}
              className="appearance-none pl-3 pr-7 py-[5px] text-[12px] rounded-lg border border-border bg-background text-foreground outline-none cursor-pointer focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
              style={{ fontWeight: 400 }}
            >
              <option value="">Kanton</option>
              {allKantone.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-muted-foreground absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Nur blockiert */}
          <label className="inline-flex items-center gap-1.5 cursor-pointer select-none shrink-0">
            <input
              type="checkbox"
              checked={nurBlockiert}
              onChange={(e) => setNurBlockiert(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-border text-primary accent-primary cursor-pointer"
            />
            <span className="text-[12px] text-foreground" style={{ fontWeight: 400 }}>
              Nur blockierte anzeigen
            </span>
          </label>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              style={{ fontWeight: 500 }}
            >
              <X className="w-3 h-3" />
              Zurücksetzen
            </button>
          )}

          {/* Search */}
          <div className="relative shrink-0">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Suche…"
              className="pl-8 pr-3 py-[5px] text-[12px] rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all w-[200px]"
              style={{ fontWeight: 400 }}
            />
          </div>
        </div>
      </div>

      {/* ── Table ──────────────────────────── */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/20">
                {[
                  "Patient",
                  "Angehöriger",
                  "Vertrag am",
                  "Status",
                  "Fehl. Dokumente",
                  "Fehl. Pflichtfelder",
                  "Blocker",
                  "Verantwortlich",
                  "Letzte Änderung",
                ].map((col) => (
                  <th key={col} className="px-4 py-2.5 text-left whitespace-nowrap">
                    <span
                      className="text-[10.5px] text-muted-foreground uppercase tracking-wider"
                      style={{ fontWeight: 500 }}
                    >
                      {col}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-14 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <p className="text-[13px] text-foreground" style={{ fontWeight: 500 }}>
                        Keine Ergebnisse
                      </p>
                      <p className="text-[12px] text-muted-foreground">
                        Passen Sie die Filter an oder erstellen Sie ein neues Mandat.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const st = statusCfg[c.status];
                  return (
                    <tr
                      key={c.id}
                      onClick={() => navigate(`/onboarding/${c.id}`)}
                      className={`border-t border-border-light hover:bg-primary/[0.025] transition-colors cursor-pointer group ${rowBg(c)} ${rowBorder(c)}`}
                    >
                      {/* Patient */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/12 to-primary/5 flex items-center justify-center shrink-0">
                            <span
                              className="text-[10px] text-primary"
                              style={{ fontWeight: 600 }}
                            >
                              {c.patientVorname[0]}
                              {c.patientNachname[0]}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <div
                              className="text-[13px] text-foreground group-hover:text-primary transition-colors truncate"
                              style={{ fontWeight: 500 }}
                            >
                              {c.patientNachname}, {c.patientVorname}
                            </div>
                            
                          </div>
                        </div>
                      </td>

                      {/* Angehöriger */}
                      <td className="px-4 py-3 text-[12px] text-foreground">
                        {c.angehoeriger}
                      </td>

                      {/* Vertrag am */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <FileSignature className="w-3 h-3 text-success shrink-0" />
                          <span className="text-[12px] text-foreground" style={{ fontWeight: 450 }}>
                            {c.vertragDatum}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-[2px] rounded-full text-[11px] ${st.bg} ${st.text}`}
                          style={{ fontWeight: 500 }}
                        >
                          <span
                            className={`w-[5px] h-[5px] rounded-full ${st.dot}`}
                          />
                          {st.label}
                        </span>
                      </td>

                      {/* Fehlende Dokumente */}
                      <td className="px-4 py-3 text-center">
                        {c.fehlendeDokumente > 0 ? (
                          <span
                            className={`inline-flex items-center justify-center min-w-[24px] px-1.5 py-[1px] rounded-md text-[11px] tabular-nums ${
                              c.fehlendeDokumente >= 5
                                ? "bg-error-light text-error-foreground"
                                : "bg-warning-light text-warning-foreground"
                            }`}
                            style={{ fontWeight: 600 }}
                          >
                            {c.fehlendeDokumente}
                          </span>
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-success mx-auto" />
                        )}
                      </td>

                      {/* Fehlende Pflichtfelder */}
                      <td className="px-4 py-3 text-center">
                        {c.fehlendePflichtfelder > 0 ? (
                          <span
                            className={`inline-flex items-center justify-center min-w-[24px] px-1.5 py-[1px] rounded-md text-[11px] tabular-nums ${
                              c.fehlendePflichtfelder >= 5
                                ? "bg-error-light text-error-foreground"
                                : "bg-warning-light text-warning-foreground"
                            }`}
                            style={{ fontWeight: 600 }}
                          >
                            {c.fehlendePflichtfelder}
                          </span>
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-success mx-auto" />
                        )}
                      </td>

                      {/* Blocker */}
                      <td className="px-4 py-3 text-center">
                        {c.abrechnungsstopp ? (
                          <span
                            className="inline-flex items-center gap-1 text-[11px] text-error"
                            title={c.abrechnungsstoppGrund || "Abrechnungsstopp"}
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="text-[11px] text-muted-foreground/40">—</span>
                        )}
                      </td>

                      {/* Verantwortlich */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center shrink-0">
                            <span
                              className="text-[9px] text-primary"
                              style={{ fontWeight: 600 }}
                            >
                              {c.verantwortlichInitialen}
                            </span>
                          </div>
                          <span className="text-[12px] text-foreground whitespace-nowrap">
                            {c.verantwortlich}
                          </span>
                        </div>
                      </td>

                      {/* Letzte Änderung */}
                      <td className="px-4 py-3 text-[12px] text-muted-foreground whitespace-nowrap">
                        {c.letzteAenderung}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer */}
        {filtered.length > 0 && (
          <div className="px-4 py-2.5 border-t border-border-light bg-muted/10 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">
              {filtered.length} von {cases.length} offene{cases.length === 1 ? "s" : ""} Mandate
            </span>
            <span className="text-[11px] text-muted-foreground">
              Stand: 27.02.2026
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── KPI Card ─────────────────────────────── */
function KpiCard({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  value,
}: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  label: string;
  value: number;
}) {
  return (
    <div className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}
      >
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div>
        <div
          className="text-[20px] text-foreground tabular-nums"
          style={{ fontWeight: 700 }}
        >
          {value}
        </div>
        <div
          className="text-[11px] text-muted-foreground"
          style={{ fontWeight: 500 }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}