/**
 * Migrated ATL-Aktivitäten Tab (Tab 4) for StepPatient.
 * Uses shared SectionAccordion (8.12) + ItemRow (8.13).
 */
import { useState, useMemo } from "react";
import { Wind, Footprints, Droplets, GlassWater, Trash2, Thermometer, ShieldCheck, MessageCircle, Heart, Pill, Plus, X, ArrowDown, ArrowUp } from "lucide-react";
import { SectionAccordion, IconMarker } from "../ui/SectionAccordion";
import { ItemRow } from "../ui/ItemRow";
import { TabHeader, HeaderMeta } from "../ui/TabHeader";
import type { PatientFormData, ATLEntry } from "../StepPatient";

const ATL_CATEGORIES: { group: string; icon: React.ElementType; items: string[] }[] = [
  { group: "Atmung", icon: Wind, items: ["Atemnot", "Husten", "Sauerstoffbedarf"] },
  { group: "Sich Bewegen", icon: Footprints, items: ["Selbständige Mobilität", "Lagern / Transferhilfe", "Kompressionsstrümpfe"] },
  { group: "Waschen und Kleiden", icon: Droplets, items: ["Körperpflege", "An-/Auskleiden"] },
  { group: "Essen und Trinken", icon: GlassWater, items: ["Ernährung", "Schluckstörungen"] },
  { group: "Ausscheiden", icon: Trash2, items: ["Inkontinenz", "Katheter / Stoma"] },
  { group: "Körpertemperatur", icon: Thermometer, items: ["Temperaturregulation"] },
  { group: "Sicherheit", icon: ShieldCheck, items: ["Orientierung", "Weglaufgefahr", "Sturzrisiko"] },
  { group: "Kommunizieren", icon: MessageCircle, items: ["Kommunikationsfähigkeit", "Sprache / Verständigung"] },
  { group: "Geschlechtsidentität", icon: Heart, items: ["Geschlechtsidentität / Bedürfnisse"] },
  { group: "Medikamente", icon: Pill, items: ["Medikamente richten", "Medikamente verabreichen", "Vitalwerte-Messungen"] },
];

const JA_NEIN = [{ value: "ja", label: "Ja" }, { value: "nein", label: "Nein" }];

function categoryStatus(atl: Record<string, ATLEntry>, items: string[]): "leer" | "teilweise" | "vollstaendig" {
  const answered = items.filter(i => atl[i]?.ja !== null).length;
  if (answered === 0) return "leer";
  if (answered === items.length) return "vollstaendig";
  return "teilweise";
}

interface Props {
  data: PatientFormData;
  onUpdateATL: (item: string, entry: Partial<ATLEntry>) => void;
}

export function TabAktivitaetenV2({ data, onUpdateATL }: Props) {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  const [showBemerkung, setShowBemerkung] = useState<Set<string>>(new Set());

  const toggle = (id: string) => setOpenItems(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const completedCategories = useMemo(() =>
    ATL_CATEGORIES.filter(c => categoryStatus(data.atlAssessment, c.items) === "vollstaendig").length
  , [data.atlAssessment]);

  const expandAll = () => setOpenItems(new Set(ATL_CATEGORIES.map(c => c.group)));
  const collapseAll = () => setOpenItems(new Set());

  const toggleBemerkung = (item: string) => {
    setShowBemerkung(prev => {
      const n = new Set(prev);
      if (n.has(item)) { n.delete(item); onUpdateATL(item, { bemerkungen: "" }); }
      else n.add(item);
      return n;
    });
  };

  return (
    <div style={{ padding: "var(--space-6) var(--space-6) var(--space-8)" }}>
      {/* TabHeader per styleguide 8.11 — Fortschritt-Modus */}
      <TabHeader
        titel="Aktivitäten des täglichen Lebens"
        meta={<HeaderMeta modus="fortschritt" text={`${completedCategories} von ${ATL_CATEGORIES.length} Kategorien erfasst`} prozent={ATL_CATEGORIES.length > 0 ? (completedCategories / ATL_CATEGORIES.length) * 100 : 0} />}
        aktion={
          <div className="flex items-center" style={{ gap: 4 }}>
            <button type="button" onClick={expandAll} className="inline-flex items-center cursor-pointer" style={{ gap: 4, padding: "10px 18px", borderRadius: 999, background: "transparent", border: "none", fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }} onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <ArrowDown style={{ width: 14, height: 14 }} /> Ausklappen
            </button>
            <button type="button" onClick={collapseAll} className="inline-flex items-center cursor-pointer" style={{ gap: 4, padding: "10px 18px", borderRadius: 999, background: "transparent", border: "none", fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }} onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <ArrowUp style={{ width: 14, height: 14 }} /> Einklappen
            </button>
          </div>
        }
      />

      {/* SectionAccordions per 8.12 */}
      {ATL_CATEGORIES.map(cat => {
        const status = categoryStatus(data.atlAssessment, cat.items);
        const answered = cat.items.filter(i => data.atlAssessment[i]?.ja !== null).length;
        return (
          <SectionAccordion
            key={cat.group}
            id={cat.group}
            titel={cat.group}
            marker={<IconMarker icon={cat.icon} status={status} />}
            count={status === "leer" ? `${cat.items.length} Items` : `${answered}/${cat.items.length} erfasst`}
            status={status}
            offen={openItems.has(cat.group)}
            onToggle={toggle}
          >
            {cat.items.map((item, idx) => {
              const entry = data.atlAssessment[item] || { ja: null, bemerkungen: "" };
              const hasBemerkung = showBemerkung.has(item) || (entry.bemerkungen?.length > 0);
              const isLast = idx === cat.items.length - 1;

              return (
                <ItemRow key={item} titel={item} last={isLast}>
                  {/* Boolean body: Ja/Nein segmented + optional Bemerkung */}
                  <div className="flex items-center justify-between" style={{ gap: 16 }}>
                    <div className="inline-flex" style={{ background: "var(--bg-secondary)", borderRadius: 999, padding: 2 }}>
                      {JA_NEIN.map(opt => {
                        const isActive = (opt.value === "ja" && entry.ja === true) || (opt.value === "nein" && entry.ja === false);
                        return (
                          <button key={opt.value} type="button"
                            onClick={() => onUpdateATL(item, { ja: opt.value === "ja" })}
                            style={{ padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: isActive ? 500 : 400, color: "var(--text-primary)", background: isActive ? "var(--bg-elevated)" : "transparent", border: "none", cursor: "pointer", transition: "background 0.15s" }}>
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {!hasBemerkung && (
                    <button type="button" onClick={() => toggleBemerkung(item)} className="inline-flex items-center cursor-pointer"
                      style={{ gap: 4, marginTop: 6, fontSize: "var(--text-meta)", color: "var(--text-tertiary)", background: "transparent", border: "none", padding: 0 }}
                      onMouseEnter={e => e.currentTarget.style.color = "var(--text-secondary)"} onMouseLeave={e => e.currentTarget.style.color = "var(--text-tertiary)"}>
                      <Plus style={{ width: 12, height: 12 }} /> Bemerkung hinzufügen
                    </button>
                  )}

                  {hasBemerkung && (
                    <div className="flex items-start" style={{ gap: 8, marginTop: 6 }}>
                      <textarea
                        value={entry.bemerkungen}
                        onChange={e => onUpdateATL(item, { bemerkungen: e.target.value })}
                        placeholder="Bemerkung…"
                        rows={2}
                        className="w-full outline-none"
                        style={{ flex: 1, padding: "8px 12px", borderRadius: 12, border: "0.5px solid var(--border-default)", background: "var(--bg-elevated)", fontSize: 14, color: "var(--text-primary)", resize: "vertical", minHeight: 48, lineHeight: 1.4, fontFamily: "inherit" }}
                        onFocus={e => e.currentTarget.style.borderColor = "var(--brand-primary)"}
                        onBlur={e => e.currentTarget.style.borderColor = "var(--border-default)"}
                      />
                      <button type="button" onClick={() => toggleBemerkung(item)} className="shrink-0 flex items-center justify-center cursor-pointer"
                        style={{ width: 28, height: 28, borderRadius: 999, background: "transparent", border: "none", marginTop: 4 }}
                        onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <X style={{ width: 14, height: 14, color: "var(--text-tertiary)" }} />
                      </button>
                    </div>
                  )}
                </ItemRow>
              );
            })}
          </SectionAccordion>
        );
      })}
    </div>
  );
}
