/**
 * DataTable — geteilte, responsive Listentabelle.
 *
 * Kennt KEINE Fachlogik: keine Kennzeichen-Regeln, keine Feldnamen, keine
 * Sortier-Vergleiche. Sie bekommt Spaltenbeschreibungen (Anteil, Mindestbreite,
 * Ausrichtung, Haltepunkt, Sortierbarkeit) und je Spalte eine render-Funktion.
 *
 * Layout-Grundsatz: fluid ist der Rahmen, nicht der Inhalt. Der Inhaltsbereich
 * ist auf TABELLE_LAYOUT.inhaltMaxPx begrenzt und zentriert; Spaltenbreiten sind
 * Anteile (fr) mit Mindestbreite in ch; feste Pixel nur wo physisch (Kennzeichen,
 * Klickflächen, Haarlinien). Alle Layout-Werte stehen an EINER Stelle unten.
 */
import * as React from "react";

/* ── Layoutwerte — die einzige Stelle (Verif #10) ── */
export const TABELLE_LAYOUT = {
  /** Inhaltsbereich fluid bis hierher, danach zentriert (darüber wächst nur Leerfläche). */
  inhaltMaxPx: 1400,
  /** Haltepunkte in px Fensterbreite. */
  haltepunktePx: {
    zweizeilig: 1400, // darunter: als Zweitzeile markierte Spalte rutscht unter ihre Leitspalte
    eng: 1100,        // darunter: als "eng" markierte Spalte entfällt
    karte: 900,       // darunter: Kartendarstellung statt Tabelle
  },
  /** Abstände in rem (folgen der Systemschriftgrösse). */
  zeilePadY: "0.5rem",
  zeilePadX: "0.75rem",
} as const;

export type SpalteAusrichtung = "left" | "right" | "center";

export interface SpalteDef<T> {
  id: string;
  label: string;
  align?: SpalteAusrichtung;
  sortierbar?: boolean;
  /** Feste Pixelbreite (physische Bedeutung, z. B. Kennzeichen). Schliesst anteil/minCh aus. */
  festBreitePx?: number;
  /** Anteil am Rahmen (fr-Gewicht). */
  anteil?: number;
  /** Mindestbreite in ch (sichert Lesbarkeit). */
  minCh?: number;
  /** id einer Leitspalte: unterhalb des Zweizeilig-Haltepunkts rendert diese Spalte
   *  als zweite Zeile UNTER der Leitspalte, ihre eigene Spalte entfällt. */
  zweitzeileUnter?: string;
  /** Unterhalb dieses Haltepunkts entfällt die Spalte ganz. */
  ausblendenUnter?: keyof typeof TABELLE_LAYOUT["haltepunktePx"];
  /** Von der Kartendarstellung ausnehmen (z. B. Spalten, die schon im Kartenkopf stehen). */
  ausKarte?: boolean;
  render: (row: T) => React.ReactNode;
}

export interface DataTableProps<T> {
  spalten: SpalteDef<T>[];
  zeilen: T[];
  zeilenKey: (row: T) => string;
  onZeileKlick?: (row: T) => void;
  /** Zeilentönung (Fachlogik lebt an der Aufrufstelle, die Komponente wendet sie nur an). */
  zeilenHintergrund?: (row: T) => string | undefined;
  /** Auswahl-/Aktivakzent: linker Farbstreifen plus kräftigerer Rahmen, getrennt
   *  von der Flächentönung (so teilen sich Auswahl und Dringlichkeit nicht denselben
   *  Kanal). Gibt die Akzentfarbe zurück oder undefined. */
  zeilenAkzent?: (row: T) => string | undefined;
  sort?: { key: string; dir: "asc" | "desc" };
  onSort?: (key: string) => void;
  fusszeile?: React.ReactNode;
  /** Kartenkopf (z. B. Name + Kennzeichen); die übrigen Spalten werden zu beschrifteten Wertepaaren. */
  karteTitel: (row: T) => React.ReactNode;
  leerText?: string;
  /** Optionale Zeilenauswahl: Kontrollkästchen in einer festen Spalte links. Fehlt die Prop,
   *  gibt es keine Auswahlspalte (Standard aus) — bestehende Listen bleiben unverändert. */
  auswahl?: {
    istGewaehlt: (row: T) => boolean;
    onToggle: (row: T) => void;
    /** aria-Label je Kontrollkästchen (z. B. Betreff der Zeile). */
    zeilenLabel?: (row: T) => string;
  };
  /** Haltepunkte an der Containerbreite statt der Fensterbreite messen (per ResizeObserver).
   *  Für eingebettete, schmalere Spalten (z. B. Listenspalte neben einem Detailbereich).
   *  Standard aus — bestehende Listen messen weiter die Fensterbreite. */
  containerHaltepunkte?: boolean;
  /** Instanz-Override der Kartenschwelle in px. Fehlt sie, gilt der geteilte
   *  Wert TABELLE_LAYOUT.haltepunktePx.karte — bestehende Listen bleiben unberührt. */
  karteAbPx?: number;
}

/** Fensterbreite, reaktiv. SSR-sicher: startet gross, damit initial alle Spalten erscheinen. */
function useFensterBreite(): number {
  const [breite, setBreite] = React.useState<number>(
    typeof window !== "undefined" ? window.innerWidth : 1920,
  );
  React.useEffect(() => {
    const onResize = () => setBreite(window.innerWidth);
    window.addEventListener("resize", onResize);
    onResize();
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return breite;
}

/** Containerbreite eines Elements, reaktiv per ResizeObserver. Inaktiv, solange `aktiv` false ist
 *  (dann bleibt der Startwert stehen und die Fensterbreite entscheidet an der Aufrufstelle). */
function useContainerBreite(ref: React.RefObject<HTMLElement>, aktiv: boolean): number {
  const [breite, setBreite] = React.useState<number>(1920);
  React.useEffect(() => {
    if (!aktiv || typeof ResizeObserver === "undefined") return;
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      for (const e of entries) setBreite(e.contentRect.width);
    });
    ro.observe(el);
    setBreite(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, [aktiv, ref]);
  return breite;
}

/** Selbstständiges Kontrollkästchen (icon-frei, damit die DataTable keine Icon-Abhängigkeit bekommt).
 *  Stoppt den Klick, damit ein Zeilenklick (Detail öffnen) nicht mitfeuert. */
function Kontrollkaestchen({ gewaehlt, onToggle, label }: { gewaehlt: boolean; onToggle: () => void; label?: string }) {
  return (
    <button
      type="button" role="checkbox" aria-checked={gewaehlt} aria-label={label}
      onClick={e => { e.stopPropagation(); onToggle(); }}
      className="ui-fokusring"
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: 18, height: 18, borderRadius: 4, padding: 0, cursor: "pointer", flexShrink: 0,
        border: gewaehlt ? "1.5px solid var(--brand-primary)" : "1.5px solid var(--border-default)",
        background: gewaehlt ? "var(--brand-primary)" : "var(--bg-elevated)",
      }}
    >
      {gewaehlt && (
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M2.5 6.2 L5 8.5 L9.5 3.5" stroke="var(--text-on-dark)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

export function DataTable<T>({
  spalten, zeilen, zeilenKey, onZeileKlick, zeilenHintergrund, zeilenAkzent,
  sort, onSort, fusszeile, karteTitel, leerText = "Keine Ergebnisse.",
  auswahl, containerHaltepunkte = false, karteAbPx,
}: DataTableProps<T>) {
  const rahmenRef = React.useRef<HTMLDivElement>(null);
  const fensterBreite = useFensterBreite();
  const containerBreite = useContainerBreite(rahmenRef, containerHaltepunkte);
  const breite = containerHaltepunkte ? containerBreite : fensterBreite;
  const bp = TABELLE_LAYOUT.haltepunktePx;
  const istKarte = breite < (karteAbPx ?? bp.karte);
  const zweizeilig = breite < bp.zweizeilig;

  // Sichtbare Spalten: "eng"-Spalten entfallen unter ihrem Haltepunkt; Zweitzeile-Spalten
  // verlassen die Spaltenliste (sie rutschen in ihre Leitspalte).
  const entfaellt = (s: SpalteDef<T>) =>
    (s.ausblendenUnter && breite < bp[s.ausblendenUnter]) ||
    (s.zweitzeileUnter && zweizeilig);
  const sichtbare = spalten.filter(s => !entfaellt(s));

  // Zweitzeile-Zuordnung: Leitspalten-id → dort einzuklinkende Spalten (nur wenn zweizeilig).
  const zweitzeilen = new Map<string, SpalteDef<T>[]>();
  if (zweizeilig) {
    for (const s of spalten) {
      if (s.zweitzeileUnter && (!s.ausblendenUnter || breite >= bp[s.ausblendenUnter])) {
        const arr = zweitzeilen.get(s.zweitzeileUnter) ?? [];
        arr.push(s); zweitzeilen.set(s.zweitzeileUnter, arr);
      }
    }
  }

  const rahmen: React.CSSProperties = { maxWidth: TABELLE_LAYOUT.inhaltMaxPx, margin: "0 auto", width: "100%" };
  const karte: React.CSSProperties = {
    background: "var(--bg-elevated)", borderRadius: "var(--radius-card)",
    border: "var(--border-thin) solid var(--border-default)", overflow: "hidden",
  };

  /* ── Kartendarstellung (unter dem Karte-Haltepunkt): kein horizontales Scrollen ── */
  if (istKarte) {
    const koerper = spalten.filter(s => !s.ausKarte && !s.festBreitePx);
    return (
      <div ref={rahmenRef} style={rahmen}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {zeilen.length === 0 && (
            <div style={{ ...karte, padding: "2rem 1rem", textAlign: "center", color: "var(--text-tertiary)", fontSize: "0.875rem" }}>{leerText}</div>
          )}
          {zeilen.map(row => {
            const akzent = zeilenAkzent?.(row);
            return (
            <div key={zeilenKey(row)}
              onClick={onZeileKlick ? () => onZeileKlick(row) : undefined}
              style={{ ...karte, padding: "0.875rem 1rem", cursor: onZeileKlick ? "pointer" : "default", background: zeilenHintergrund?.(row) || "var(--bg-elevated)", ...(akzent ? { border: `var(--border-thin) solid ${akzent}`, boxShadow: `inset 3px 0 0 ${akzent}` } : null) }}>
              <div className="flex items-center justify-between" style={{ gap: "0.5rem", marginBottom: "0.625rem" }}>
                {auswahl ? (
                  <div className="flex items-center" style={{ gap: "0.5rem", flex: 1, minWidth: 0 }}>
                    <Kontrollkaestchen gewaehlt={auswahl.istGewaehlt(row)} onToggle={() => auswahl.onToggle(row)} label={auswahl.zeilenLabel?.(row)} />
                    <div style={{ flex: 1, minWidth: 0 }}>{karteTitel(row)}</div>
                  </div>
                ) : karteTitel(row)}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "0.5rem 1rem" }}>
                {koerper.map(s => (
                  <div key={s.id} style={{ minWidth: 0 }}>
                    <div style={{ fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-tertiary)", fontWeight: 600 }}>{s.label}</div>
                    <div style={{ fontSize: "0.8125rem", color: "var(--text-primary)", overflowWrap: "anywhere" }}>{s.render(row)}</div>
                  </div>
                ))}
              </div>
            </div>
            );
          })}
        </div>
        {fusszeile && <div style={{ marginTop: "0.5rem", textAlign: "right", fontSize: "0.8125rem", color: "var(--text-secondary)" }}>{fusszeile}</div>}
      </div>
    );
  }

  /* ── Tabellendarstellung: CSS-Grid, minmax(ch, fr) = Mindestbreite + Anteil ── */
  const auswahlSpur = auswahl ? ["40px"] : [];
  const gridCols = [
    ...auswahlSpur,
    ...sichtbare.map(s =>
      s.festBreitePx != null ? `${s.festBreitePx}px` : `minmax(${s.minCh ?? 8}ch, ${s.anteil ?? 1}fr)`,
    ),
  ].join(" ");
  const zellPad = `${TABELLE_LAYOUT.zeilePadY} ${TABELLE_LAYOUT.zeilePadX}`;

  return (
    <div ref={rahmenRef} style={rahmen}>
      <div style={karte}>
        <div role="table" aria-rowcount={zeilen.length}>
          {/* Kopfzeile */}
          <div role="row" style={{ display: "grid", gridTemplateColumns: gridCols, alignItems: "center", background: "var(--bg-secondary)" }}>
            {auswahl && <div role="columnheader" aria-label="Auswahl" style={{ padding: zellPad }} />}
            {sichtbare.map(s => {
              const aktiv = s.sortierbar && sort?.key === s.id;
              const klick = s.sortierbar && onSort ? () => onSort(s.id) : undefined;
              return (
                <div key={s.id} role="columnheader"
                  aria-sort={aktiv ? (sort!.dir === "asc" ? "ascending" : "descending") : undefined}
                  onClick={klick}
                  style={{ padding: zellPad, textAlign: s.align ?? "left", cursor: klick ? "pointer" : "default", userSelect: "none", minWidth: 0 }}>
                  <span style={{ fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600, color: aktiv ? "var(--text-primary)" : "var(--text-secondary)", whiteSpace: "nowrap" }}>
                    {s.label}
                    {aktiv && <span aria-hidden="true" style={{ marginLeft: "0.25rem" }}>{sort!.dir === "asc" ? "↑" : "↓"}</span>}
                  </span>
                </div>
              );
            })}
          </div>
          {/* Datenzeilen */}
          {zeilen.length === 0 ? (
            <div role="row" style={{ padding: "3rem 1rem", textAlign: "center", color: "var(--text-tertiary)", fontSize: "0.875rem", borderTop: "var(--border-thin) solid var(--border-default)" }}>{leerText}</div>
          ) : zeilen.map(row => {
            const akzent = zeilenAkzent?.(row);
            return (
            <div key={zeilenKey(row)} role="row"
              onClick={onZeileKlick ? () => onZeileKlick(row) : undefined}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-secondary)")}
              onMouseLeave={e => (e.currentTarget.style.background = zeilenHintergrund?.(row) || "transparent")}
              style={{ display: "grid", gridTemplateColumns: gridCols, alignItems: "center", borderTop: "var(--border-thin) solid var(--border-default)", cursor: onZeileKlick ? "pointer" : "default", background: zeilenHintergrund?.(row) || "transparent", boxShadow: akzent ? `inset 3px 0 0 ${akzent}, inset 0 0 0 1px ${akzent}` : undefined }}>
              {auswahl && (
                <div role="cell" style={{ padding: zellPad, display: "flex", alignItems: "center", justifyContent: "center", minWidth: 0 }}>
                  <Kontrollkaestchen gewaehlt={auswahl.istGewaehlt(row)} onToggle={() => auswahl.onToggle(row)} label={auswahl.zeilenLabel?.(row)} />
                </div>
              )}
              {sichtbare.map(s => {
                const tucked = zweitzeilen.get(s.id);
                return (
                  <div key={s.id} role="cell" style={{ padding: zellPad, textAlign: s.align ?? "left", minWidth: 0, overflowWrap: "anywhere" }}>
                    {s.render(row)}
                    {tucked?.map(tc => (
                      <div key={tc.id} style={{ marginTop: "0.125rem", fontSize: "0.75rem", color: "var(--text-secondary)", overflowWrap: "anywhere" }}>
                        {tc.render(row)}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
            );
          })}
        </div>
        {fusszeile && (
          <div className="flex items-center justify-between" style={{ padding: "0.5rem 1rem", borderTop: "var(--border-thin) solid var(--border-default)", fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
            {fusszeile}
          </div>
        )}
      </div>
    </div>
  );
}
