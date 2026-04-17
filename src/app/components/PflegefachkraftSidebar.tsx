import React, { useMemo } from "react";
import {
  X,
  Globe,
  MapPin,
  Star,
  Users,
  ChevronDown,
  Check,
  Stethoscope,
  Shield,
  TrendingUp,
} from "lucide-react";
import type { Patient, Schweregrad } from "./patientData";

/* ── Caregiver Pool ──────────────────────── */
export interface Caregiver {
  id: string;
  name: string;
  initialen: string;
  sprachen: string[];
  regionen: string[]; // kantons
  qualifikationen: string[];
  schweregrade: Schweregrad[]; // which severity levels they can handle
  kapazitaet: { aktuell: number; max: number };
}

export const caregiverPool: Caregiver[] = [
  {
    id: "PFK-001",
    name: "Sandra Weber",
    initialen: "SW",
    sprachen: ["Deutsch", "Französisch"],
    regionen: ["ZH", "AG"],
    qualifikationen: ["HöFa I", "Wundmanagement", "Palliative Care"],
    schweregrade: ["leicht", "mittel", "schwer", "kritisch"],
    kapazitaet: { aktuell: 6, max: 10 },
  },
  {
    id: "PFK-002",
    name: "Kathrin Meier",
    initialen: "KM",
    sprachen: ["Deutsch", "Italienisch"],
    regionen: ["ZH", "SG"],
    qualifikationen: ["HöFa II", "Diabetesberatung"],
    schweregrade: ["leicht", "mittel", "schwer"],
    kapazitaet: { aktuell: 4, max: 8 },
  },
  {
    id: "PFK-003",
    name: "Laura Brunner",
    initialen: "LB",
    sprachen: ["Deutsch", "Französisch", "Italienisch"],
    regionen: ["ZH", "BE", "LU"],
    qualifikationen: ["HöFa I", "Gerontologie", "Palliative Care"],
    schweregrade: ["leicht", "mittel", "schwer", "kritisch"],
    kapazitaet: { aktuell: 7, max: 10 },
  },
  {
    id: "PFK-004",
    name: "Maria Keller",
    initialen: "MK",
    sprachen: ["Deutsch", "Portugiesisch", "Spanisch"],
    regionen: ["ZH", "LU", "AG"],
    qualifikationen: ["HöFa I", "Kinästhetik"],
    schweregrade: ["leicht", "mittel"],
    kapazitaet: { aktuell: 3, max: 8 },
  },
  {
    id: "PFK-005",
    name: "Thomas Huber",
    initialen: "TH",
    sprachen: ["Deutsch", "Türkisch"],
    regionen: ["ZH", "SG", "AG"],
    qualifikationen: ["HöFa I", "Psychiatriepflege"],
    schweregrade: ["leicht", "mittel", "schwer"],
    kapazitaet: { aktuell: 5, max: 9 },
  },
];

/* ── Match scoring ───────────────────────── */
interface MatchDetail {
  sprache: boolean;
  region: boolean;
  schweregrad: boolean;
  kapazitaet: number; // 0-100 (free capacity %)
}

function computeMatch(
  caregiver: Caregiver,
  patient: Patient
): { score: number; detail: MatchDetail } {
  const spracheMatch = caregiver.sprachen.includes(patient.sprache);
  const regionMatch = caregiver.regionen.includes(patient.kanton);
  const schweregradMatch = caregiver.schweregrade.includes(patient.schweregrad);
  const freeSlots = caregiver.kapazitaet.max - caregiver.kapazitaet.aktuell;
  const kapPct = Math.round(
    (freeSlots / caregiver.kapazitaet.max) * 100
  );

  let score = 0;
  if (spracheMatch) score += 30;
  if (regionMatch) score += 30;
  if (schweregradMatch) score += 25;
  score += Math.round((kapPct / 100) * 15);

  return {
    score: Math.min(100, score),
    detail: {
      sprache: spracheMatch,
      region: regionMatch,
      schweregrad: schweregradMatch,
      kapazitaet: kapPct,
    },
  };
}

/* ── Component ───────────────────────────── */
interface Props {
  open: boolean;
  patient: Patient | null;
  onClose: () => void;
  onAssign: (patientId: string, caregiver: Caregiver) => void;
}

export function PflegefachkraftSidebar({
  open,
  patient,
  onClose,
  onAssign,
}: Props) {
  const ranked = useMemo(() => {
    if (!patient) return [];
    return caregiverPool
      .map((c) => ({ caregiver: c, ...computeMatch(c, patient) }))
      .sort((a, b) => b.score - a.score);
  }, [patient]);

  if (!open || !patient) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="fixed top-0 right-0 h-full w-[420px] max-w-[90vw] bg-card border-l border-border shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-border-light">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-foreground text-[15px]" style={{ fontWeight: 600 }}>
              Pflegefachkraft zuweisen
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <div className="bg-primary/[0.04] rounded-xl px-3.5 py-2.5 border border-primary/10">
            <div
              className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1"
              style={{ fontWeight: 500 }}
            >
              Zuteilung für
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center shrink-0">
                <span
                  className="text-[11px] text-primary"
                  style={{ fontWeight: 600 }}
                >
                  {patient.vorname[0]}
                  {patient.nachname[0]}
                </span>
              </div>
              <div>
                <div
                  className="text-[13px] text-foreground"
                  style={{ fontWeight: 500 }}
                >
                  {patient.nachname}, {patient.vorname}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                  <span className="flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    {patient.sprache}
                  </span>
                  <span className="text-border-light">·</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {patient.kanton}
                  </span>
                  <span className="text-border-light">·</span>
                  <span>{patient.schweregrad}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Caregiver list */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          <div
            className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1"
            style={{ fontWeight: 500 }}
          >
            Empfohlene Pflegefachkräfte ({ranked.length})
          </div>

          {ranked.map(({ caregiver, score, detail }) => {
            const isCurrentlyAssigned =
              patient.pflegefachkraft === caregiver.name;
            const freeSlots =
              caregiver.kapazitaet.max - caregiver.kapazitaet.aktuell;
            const isLowCapacity = freeSlots <= 1;

            return (
              <div
                key={caregiver.id}
                className={`rounded-xl border p-4 transition-all ${
                  isCurrentlyAssigned
                    ? "border-primary/30 bg-primary/[0.04]"
                    : "border-border hover:border-primary/20 hover:shadow-sm bg-card"
                }`}
              >
                {/* Top row: avatar + name + score */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center shrink-0">
                      <span
                        className="text-[11px] text-primary"
                        style={{ fontWeight: 600 }}
                      >
                        {caregiver.initialen}
                      </span>
                    </div>
                    <div>
                      <div
                        className="text-[13px] text-foreground"
                        style={{ fontWeight: 500 }}
                      >
                        {caregiver.name}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {isCurrentlyAssigned && (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] text-primary bg-primary/10 px-1.5 py-[1px] rounded-md"
                            style={{ fontWeight: 500 }}
                          >
                            <Check className="w-2.5 h-2.5" />
                            Aktuell zugewiesen
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Matching Score */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`text-[16px] ${
                        score >= 80
                          ? "text-success"
                          : score >= 50
                          ? "text-warning"
                          : "text-muted-foreground"
                      }`}
                      style={{ fontWeight: 700, lineHeight: "1" }}
                    >
                      {score}%
                    </div>
                    <span
                      className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5"
                      style={{ fontWeight: 500 }}
                    >
                      Match
                    </span>
                  </div>
                </div>

                {/* Match criteria chips */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-[2px] rounded-md text-[10.5px] ${
                      detail.sprache
                        ? "bg-success-light text-success-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                    style={{ fontWeight: 500 }}
                  >
                    <Globe className="w-3 h-3" />
                    {detail.sprache ? "Sprache" : "Sprache"}
                    {detail.sprache ? (
                      <Check className="w-2.5 h-2.5" />
                    ) : (
                      <X className="w-2.5 h-2.5 opacity-50" />
                    )}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-[2px] rounded-md text-[10.5px] ${
                      detail.region
                        ? "bg-success-light text-success-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                    style={{ fontWeight: 500 }}
                  >
                    <MapPin className="w-3 h-3" />
                    Region
                    {detail.region ? (
                      <Check className="w-2.5 h-2.5" />
                    ) : (
                      <X className="w-2.5 h-2.5 opacity-50" />
                    )}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-[2px] rounded-md text-[10.5px] ${
                      detail.schweregrad
                        ? "bg-success-light text-success-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                    style={{ fontWeight: 500 }}
                  >
                    <Shield className="w-3 h-3" />
                    Schweregrad
                    {detail.schweregrad ? (
                      <Check className="w-2.5 h-2.5" />
                    ) : (
                      <X className="w-2.5 h-2.5 opacity-50" />
                    )}
                  </span>
                </div>

                {/* Skills */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {caregiver.qualifikationen.map((q) => (
                    <span
                      key={q}
                      className="text-[10px] px-1.5 py-[1px] rounded bg-secondary text-muted-foreground"
                      style={{ fontWeight: 400 }}
                    >
                      {q}
                    </span>
                  ))}
                </div>

                {/* Bottom: capacity + region + action */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Capacity */}
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3 h-3 text-muted-foreground" />
                      <div className="flex items-center gap-1">
                        <div className="w-14 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isLowCapacity ? "bg-error" : "bg-primary"
                            }`}
                            style={{
                              width: `${
                                (caregiver.kapazitaet.aktuell /
                                  caregiver.kapazitaet.max) *
                                100
                              }%`,
                            }}
                          />
                        </div>
                        <span
                          className={`text-[10px] ${
                            isLowCapacity
                              ? "text-error"
                              : "text-muted-foreground"
                          }`}
                          style={{ fontWeight: 500 }}
                        >
                          {caregiver.kapazitaet.aktuell}/
                          {caregiver.kapazitaet.max}
                        </span>
                      </div>
                    </div>

                    {/* Region */}
                    <span className="text-[10px] text-muted-foreground">
                      {caregiver.regionen.join(", ")}
                    </span>
                  </div>

                  {/* Assign button */}
                  {isCurrentlyAssigned ? (
                    <span
                      className="text-[11px] text-primary px-3 py-[4px]"
                      style={{ fontWeight: 500 }}
                    >
                      Zugewiesen
                    </span>
                  ) : (
                    <button
                      onClick={() => onAssign(patient.id, caregiver)}
                      className="inline-flex items-center gap-1 px-3 py-[5px] text-[11px] rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm transition-all active:scale-[0.97]"
                      style={{ fontWeight: 500 }}
                    >
                      Zuweisen
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
