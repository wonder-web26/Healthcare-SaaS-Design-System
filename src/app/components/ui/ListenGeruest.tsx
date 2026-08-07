/**
 * Gerüst der Listenbildschirme — Kopf, Suche, Chips, Aktivzeile.
 *
 * Lag zuvor fünfmal als Ortskopie vor. Die vier bestehenden Listen waren
 * bereits deckungsgleich (dieselben Abstände, dieselbe Chip-Form, dieselbe
 * Aktivzeile); dieses Bauteil übernimmt genau deren Markup, damit die
 * Zusammenführung nichts sichtbar verändert.
 *
 * Der Suchfeld-Radius ist 8px, nicht Pill: styleguide.md Zeile 1299 gibt für
 * Listenbildschirme ausdrücklich „Suchfeld (8px-Radius, kein Pill)" vor, und
 * drei der vier bestehenden Listen folgten dem bereits. Die Onboarding-Liste
 * war die Abweichung; sie ist damit angeglichen.
 *
 * Es kennt KEINE Fachlogik: keine Prädikate, keine Filterung, keine
 * Sortierung, keine Spalten. Es erhält fertige Angaben — Suchtext, Chips mit
 * Beschriftung und Zahl, Sichttext, Filtermarken — und gibt Ereignisse zurück.
 * Was gefiltert und wie sortiert wird, entscheidet jede Liste selbst.
 *
 * Die Tabelle und die Leerzustände bleiben ausserhalb: sie unterscheiden sich
 * je Liste (Onboarding kennt einen eigenen Leerzustand, der Service Desk eine
 * Detailspalte) und gehören nicht in ein gemeinsames Gerüst.
 */
import type { ReactNode } from "react";
import { Search, X, Check } from "lucide-react";

/** Ein Chip: Beschriftung, Zahl, Zustand — die Bedingung dahinter kennt die Liste. */
export interface ListenChip {
  id: string;
  label: string;
  anzahl: number;
  aktiv: boolean;
  onToggle: () => void;
}

/** Eine gesetzte Einschränkung in der Aktivzeile. */
export interface ListenFilterMarke {
  key: string;
  label: string;
  entfernen: () => void;
}

interface ListenGeruestProps {
  titel: string;
  /** Primäraktion rechts neben dem Titel; höchstens eine. */
  aktion?: ReactNode;
  suche: string;
  onSuche: (wert: string) => void;
  suchePlatzhalter: string;
  /** Segmentumschalter, falls die Liste einen kennt. */
  segment?: ReactNode;
  /** Auswahlfelder der Liste. */
  auswahlfelder?: ReactNode;
  chips: ListenChip[];
  /** Ruhiger Text der Aktivzeile, solange nichts eingeschränkt ist. */
  sichtText: string;
  filterMarken: ListenFilterMarke[];
  onFilterZuruecksetzen: () => void;
  /** Tabelle und Leerzustände. */
  children: ReactNode;
}

export function ListenGeruest({
  titel, aktion, suche, onSuche, suchePlatzhalter, segment, auswahlfelder,
  chips, sichtText, filterMarken, onFilterZuruecksetzen, children,
}: ListenGeruestProps) {
  return (
    <>
      {/* 1) Titel + Primäraktion auf einer Höhe */}
      {/* Mindesthöhe der Kopfzeile: die Primäraktion misst 41px. Ohne sie wäre
          die Zeile 5px flacher und alles darunter verschöbe sich — eine Liste
          ohne Hauptaktion soll gleich hoch beginnen wie die übrigen. */}
      <div className="flex items-center justify-between" style={{ minHeight: 41, marginBottom: "var(--space-3)" }}>
        <h1 style={{ fontSize: "var(--text-h1)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", letterSpacing: "var(--tracking-tight)" }}>{titel}</h1>
        {aktion}
      </div>

      {/* 2) Steuerleiste: Suche, Zugehörigkeit, Auswahlfelder */}
      {/* Mindesthöhe wie bei der Kopfzeile: der Segmentumschalter misst 38px,
          das Suchfeld allein 36px. Eine Liste ohne Umschalter soll gleich hoch
          beginnen wie die übrigen. */}
      <div className="flex items-center flex-wrap" style={{ gap: 8, minHeight: 38, marginBottom: "var(--space-2)" }}>
        <div className="flex items-center" style={{ flex: "1 1 220px", maxWidth: 300, gap: "var(--space-2)", padding: "7px 14px", borderRadius: 8, background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)" }}>
          <Search style={{ width: 14, height: 14, color: "var(--text-tertiary)", flexShrink: 0 }} />
          <input value={suche} onChange={e => onSuche(e.target.value)} placeholder={suchePlatzhalter} className="flex-1 bg-transparent outline-none" style={{ fontSize: "var(--text-small)", color: "var(--text-primary)", minWidth: 0 }} />
          {suche && <button onClick={() => onSuche("")} className="cursor-pointer shrink-0" style={{ background: "transparent", border: "none" }}><X style={{ width: 12, height: 12, color: "var(--text-secondary)" }} /></button>}
        </div>
        {segment}
        {auswahlfelder}
      </div>

      {/* 3) Chips — kombinierbar (UND), Zahl aus denselben Daten wie die Tabelle */}
      <div className="flex items-center flex-wrap" style={{ gap: 8, marginBottom: "var(--space-2)" }}>
        {chips.map(chip => (
          <button key={chip.id} type="button" onClick={chip.onToggle} className="ui-fokusring inline-flex items-center cursor-pointer transition-colors"
            style={{ gap: 7, padding: "6px 12px", borderRadius: "var(--radius-pill)", background: chip.aktiv ? "var(--brand-primary-light)" : "var(--bg-elevated)", border: chip.aktiv ? "var(--border-thin) solid var(--brand-primary)" : "var(--border-thin) solid var(--border-default)", fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: chip.aktiv ? "var(--brand-primary)" : "var(--text-primary)", fontFamily: "inherit", whiteSpace: "nowrap" }}>
            <span className="inline-flex items-center justify-center shrink-0" style={{ width: 15, height: 15, borderRadius: 4, border: chip.aktiv ? "none" : "var(--border-thin) solid var(--border-default)", background: chip.aktiv ? "var(--brand-primary)" : "transparent" }}>
              {chip.aktiv && <Check style={{ width: 10, height: 10, color: "var(--text-on-dark)" }} />}
            </span>
            {chip.label}
            <span style={{ fontVariantNumeric: "tabular-nums", color: chip.aktiv ? "var(--brand-primary)" : "var(--text-tertiary)" }}>{chip.anzahl}</span>
          </button>
        ))}
      </div>

      {/* 4) Aktivzeile — immer sichtbar */}
      <div className="flex items-center flex-wrap" style={{ gap: 6, minHeight: 24, marginBottom: "var(--space-2)" }}>
        {filterMarken.length === 0 ? (
          <span style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>{sichtText}</span>
        ) : (
          <>
            {filterMarken.map(t => (
              <button key={t.key} type="button" onClick={t.entfernen} className="ui-fokusring inline-flex items-center cursor-pointer"
                style={{ gap: 4, padding: "3px 10px", borderRadius: "var(--radius-pill)", background: "var(--brand-primary-light)", color: "var(--brand-primary)", fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", border: "none", fontFamily: "inherit" }}>
                {t.label} <X style={{ width: 10, height: 10 }} />
              </button>
            ))}
            <button type="button" onClick={onFilterZuruecksetzen} className="cursor-pointer" style={{ background: "transparent", border: "none", fontSize: "var(--text-meta)", color: "var(--text-secondary)", fontWeight: "var(--weight-medium)", padding: "3px 6px", fontFamily: "inherit" }}>Filter zurücksetzen</button>
          </>
        )}
      </div>

      {children}
    </>
  );
}
