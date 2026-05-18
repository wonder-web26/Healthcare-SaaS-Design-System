/**
 * Migrated ATL-Aktivitäten Tab (Tab 4) for StepPatient.
 */
import { useState, useMemo } from "react";
import { Wind, Footprints, Droplets, GlassWater, Trash2, Thermometer, ShieldCheck, MessageCircle, Heart, Pill, Plus, X, ArrowDown, ArrowUp } from "lucide-react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "./Accordion";
import { SegmentedControl } from "./SegmentedControl";
import { TextareaInput } from "./TextareaInput";
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
      {/* Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: "var(--space-4)" }}>
        <span style={{ fontSize: "var(--text-small)", color: "var(--text-secondary)" }}>
          {completedCategories} von {ATL_CATEGORIES.length} Kategorien ausgefüllt
        </span>
        <div className="flex items-center" style={{ gap: "var(--space-2)" }}>
          <button type="button" onClick={expandAll} className="inline-flex items-center cursor-pointer transition-colors"
            style={{ gap: "var(--space-1)", padding: "6px 14px", borderRadius: "var(--radius-pill)", background: "transparent", border: "none", fontSize: "var(--text-small)", color: "var(--text-secondary)", fontWeight: "var(--weight-medium)" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <ArrowDown style={{ width: 14, height: 14 }} /> Alle ausklappen
          </button>
          <button type="button" onClick={collapseAll} className="inline-flex items-center cursor-pointer transition-colors"
            style={{ gap: "var(--space-1)", padding: "6px 14px", borderRadius: "var(--radius-pill)", background: "transparent", border: "none", fontSize: "var(--text-small)", color: "var(--text-secondary)", fontWeight: "var(--weight-medium)" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <ArrowUp style={{ width: 14, height: 14 }} /> Alle einklappen
          </button>
        </div>
      </div>

      {/* Accordion */}
      <Accordion openItems={openItems} onToggle={toggle}>
        {ATL_CATEGORIES.map(cat => {
          const status = categoryStatus(data.atlAssessment, cat.items);
          return (
            <AccordionItem key={cat.group} value={cat.group}>
              <AccordionTrigger value={cat.group} icon={cat.icon} title={cat.group} subtitle={`${cat.items.length} ${cat.items.length === 1 ? "Item" : "Items"}`} status={status} />
              <AccordionContent value={cat.group}>
                <div>
                  {cat.items.map((item, idx) => {
                    const entry = data.atlAssessment[item] || { ja: null, bemerkungen: "" };
                    const hasBemerkung = showBemerkung.has(item) || (entry.bemerkungen?.length > 0);
                    const isLast = idx === cat.items.length - 1;

                    return (
                      <div key={item} style={{ padding: "14px 0", borderBottom: isLast ? "none" : "var(--border-thin) solid var(--border-default)" }}>
                        <div className="flex items-center justify-between" style={{ gap: "var(--space-4)" }}>
                          <span style={{ fontSize: "var(--text-body)", color: "var(--text-primary)", flex: 1 }}>{item}</span>
                          <div className="shrink-0">
                            <div className="inline-flex" style={{ background: "var(--bg-secondary)", borderRadius: "var(--radius-pill)", padding: 2 }}>
                              {JA_NEIN.map(opt => {
                                const isActive = (opt.value === "ja" && entry.ja === true) || (opt.value === "nein" && entry.ja === false);
                                return (
                                  <button key={opt.value} type="button"
                                    onClick={() => onUpdateATL(item, { ja: opt.value === "ja" })}
                                    style={{ padding: "4px 12px", borderRadius: "var(--radius-pill)", fontSize: 12, fontWeight: isActive ? "var(--weight-medium)" : "var(--weight-regular)", color: "var(--text-primary)", background: isActive ? "var(--bg-elevated)" : "transparent", border: "none", cursor: "pointer", transition: "background 0.15s" }}>
                                    {opt.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {!hasBemerkung && (
                          <button type="button" onClick={() => toggleBemerkung(item)} className="inline-flex items-center cursor-pointer"
                            style={{ gap: 4, marginTop: "var(--space-2)", fontSize: "var(--text-meta)", color: "var(--text-tertiary)", background: "transparent", border: "none", padding: 0 }}
                            onMouseEnter={e => e.currentTarget.style.color = "var(--text-secondary)"} onMouseLeave={e => e.currentTarget.style.color = "var(--text-tertiary)"}>
                            <Plus style={{ width: 12, height: 12 }} /> Bemerkung hinzufügen
                          </button>
                        )}

                        {hasBemerkung && (
                          <div className="flex items-start" style={{ gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
                            <div className="flex-1">
                              <textarea
                                value={entry.bemerkungen}
                                onChange={e => onUpdateATL(item, { bemerkungen: e.target.value })}
                                placeholder="Bemerkung…"
                                rows={2}
                                className="w-full outline-none transition-all"
                                style={{ padding: "8px 12px", borderRadius: "var(--radius-card)", border: "var(--border-thin) solid var(--border-default)", background: "var(--bg-elevated)", fontSize: "var(--text-small)", color: "var(--text-primary)", resize: "vertical", minHeight: 48, lineHeight: 1.4 }}
                                onFocus={e => e.currentTarget.style.borderColor = "var(--brand-primary)"}
                                onBlur={e => e.currentTarget.style.borderColor = "var(--border-default)"}
                              />
                            </div>
                            <button type="button" onClick={() => toggleBemerkung(item)} className="shrink-0 flex items-center justify-center cursor-pointer"
                              style={{ width: 28, height: 28, borderRadius: "var(--radius-pill)", background: "transparent", border: "none", marginTop: 4 }}
                              onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                              <X style={{ width: 14, height: 14, color: "var(--text-tertiary)" }} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
