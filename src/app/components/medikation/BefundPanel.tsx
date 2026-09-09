/**
 * Befund-Panel — Slide-over mit einem Reiter je Prüfart.
 *
 * JEDER REITER NENNT ZUERST SEINE ABDECKUNG. «Kein Befund» ohne die Zahl der
 * geprüften Positionen ist keine Aussage; ein Reiter ohne Abdeckungszeile darf
 * es darum nicht geben.
 *
 * EIN REITER OHNE BEFUND BLEIBT NICHT LEER. Er schreibt hin, was geprüft wurde
 * und wogegen — eine leere Fläche liest sich wie ein Fehler oder wie eine
 * Entwarnung, und beides wäre falsch.
 *
 * Die Reiter tragen dieselben Zeichen wie Legendenleiste und Zeilenmarker,
 * aus derselben Komponente (Pruefzeichen).
 */
import { Drawer, DrawerContent } from "../ui/drawer";
import { useFensterBreite } from "../ui/DataTable";
import { Pruefzeichen } from "./Pruefzeichen";
import { PRUEFART_REIHENFOLGE, zeichenStatusVon } from "./Legendenleiste";
import { BefundKarte } from "./BefundKarte";
import {
  PRUEFART_LABEL, abdeckungText,
  type Pruefart, type Pruefergebnis, type Medikationsposition, type BefundBearbeitung,
} from "../../../lib/medikation/medikation";

export function BefundPanel({ ergebnis, aktiverReiter, positionen, bearbeitungen, darfEntscheiden, onReiter, onSchliessen, onQuittieren, onUebersteuern }: {
  ergebnis: Pruefergebnis;
  aktiverReiter: Pruefart;
  positionen: Medikationsposition[];
  bearbeitungen: Record<string, BefundBearbeitung>;
  darfEntscheiden: boolean;
  onReiter: (art: Pruefart) => void;
  onSchliessen: () => void;
  onQuittieren: (befundId: string) => void;
  onUebersteuern: (befundId: string, begruendung: string) => void;
}) {
  // Unter dem Desktop-Breakpoint kommt das Blatt von unten über die volle Breite.
  const istSchmal = useFensterBreite() < 1024;
  const art = ergebnis.arten.find(a => a.art === aktiverReiter);
  const befunde = ergebnis.befunde.filter(b => b.art === aktiverReiter);

  /* `modal={false}`: im modalen Zustand setzt vaul `pointer-events: none` auf
     den Body — dieselbe Falle wie beim Editor aus Lauf 1. */
  return (
    <Drawer open modal={false} onOpenChange={o => { if (!o) onSchliessen(); }} direction={istSchmal ? "bottom" : "right"}>
      <DrawerContent aria-label="Befunde der Medikationsprüfung"
        className={istSchmal ? "!max-h-[92vh]" : "sm:!max-w-[640px]"}>
        <div style={{ display: "flex", flexDirection: "column", minHeight: 0, height: "100%" }}>
          <div style={{ padding: "18px 22px 10px", fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>
            Medikationsprüfung
          </div>

          {/* Reiter — Zeichen, Name, Befundzahl */}
          <div role="tablist" aria-label="Prüfarten" style={{ display: "flex", gap: 6, padding: "0 22px 10px", flexWrap: "wrap" }}>
            {PRUEFART_REIHENFOLGE.map(a => {
              const erg = ergebnis.arten.find(x => x.art === a);
              const anzahl = ergebnis.befunde.filter(b => b.art === a).length;
              const gewaehlt = a === aktiverReiter;
              return (
                <button key={a} type="button" role="tab" aria-selected={gewaehlt} onClick={() => onReiter(a)}
                  className="ui-fokusring inline-flex items-center"
                  style={{
                    gap: 6, padding: "6px 10px", borderRadius: "var(--control-radius)", fontFamily: "inherit",
                    background: gewaehlt ? "var(--brand-primary-light)" : "transparent",
                    border: "var(--border-thin) solid " + (gewaehlt ? "var(--brand-primary)" : "var(--border-default)"),
                    color: gewaehlt ? "var(--brand-primary)" : "var(--text-primary)",
                    fontSize: "var(--text-meta)", cursor: "pointer",
                  }}>
                  <Pruefzeichen art={a} status={zeichenStatusVon(erg, ergebnis.anbieterAktiv)} groesse={16} />
                  {PRUEFART_LABEL[a]}
                  <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: "var(--weight-medium)" }}>
                    {erg?.zustand === "nicht_geprueft" ? "—" : anzahl}
                  </span>
                </button>
              );
            })}
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "8px 22px 20px", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            {/* Abdeckung zuoberst — nie ein Reiter ohne sie. */}
            {art && (
              <div style={{ padding: "10px 12px", borderRadius: "var(--radius-card)", background: "var(--bg-secondary)" }}>
                <div style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>
                  {abdeckungText(art)}
                  {art.zustand === "geprueft_mit_befund" && ` · ${befunde.length} ${befunde.length === 1 ? "Befund" : "Befunde"}`}
                </div>
                {art.grund && (
                  <div style={{ marginTop: 4, fontSize: "var(--text-meta)", color: "var(--text-secondary)", maxWidth: "70ch" }}>
                    {art.grund}
                    {art.wegText && <span style={{ display: "block", color: "var(--brand-accent)" }}>{art.wegText}</span>}
                  </div>
                )}
              </div>
            )}

            {befunde.length > 0 ? (
              befunde.map(b => (
                <BefundKarte key={b.id} befund={b}
                  bearbeitung={bearbeitungen[b.id] ?? { zustand: "offen", vonName: null, am: null, begruendung: null }}
                  positionen={positionen} darfEntscheiden={darfEntscheiden}
                  onQuittieren={() => onQuittieren(b.id)}
                  onUebersteuern={g => onUebersteuern(b.id, g)} />
              ))
            ) : (
              /* Kein Befund heisst nicht: nichts zu sagen. */
              <p style={{ margin: 0, fontSize: "var(--text-small)", color: "var(--text-secondary)", maxWidth: "70ch" }}>
                {art?.umfangText ?? ""}
              </p>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
