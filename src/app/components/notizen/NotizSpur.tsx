/**
 * NotizSpur — dauerhaft sichtbare Notizspur einer Person, mit kleinem Eingabefeld.
 *
 * Zeigt ausschliesslich die Notizen der übergebenen Referenz (Art + Kennung). Der
 * Personenname kommt als Prop (aus der Quelle aufgelöst), wird nie in einer Notiz
 * gespeichert. Alle fachlichen Ableitungen liegen in lib/notizen; hier nur Darstellung
 * und Interaktion. Datums-/Zeitausgaben ausschliesslich über die Datums-Hilfsschicht.
 */
import { useState, useRef, useEffect, useLayoutEffect, useMemo, type ReactNode } from "react";
import { Pin, PinOff, Pencil, Trash2, Search, X } from "lucide-react";
import { formatAnzeige, formatDatumZeit, formatMonatJahr, formatTagMonat } from "../../../lib/datum";
import {
  type Notiz, type NotizReferenz, NOTIZ_ZAEHLER_AB, NOTIZ_MAX_ANGEHEFTET,
  sichtbareNotizen,
} from "../../../lib/notizen/notizen";
import {
  useAlleNotizen, notizErstellen, notizBearbeiten, notizAnheften,
  notizAnheftungLoesen, notizLoeschen, notizWiederherstellen,
} from "../../../lib/notizen/store";

/** Aktuelle Benutzerin (Prototyp) — Autorenname aus den Mock-Benutzern. */
const AKTUELLER_AUTOR = "M. Keller";
const UNDO_MS = 10_000;

/** Trefferhervorhebung: nicht allein durch Farbe — fett + Unterlegung. */
function hervorheben(text: string, q: string): ReactNode {
  const query = q.trim();
  if (!query) return text;
  const teile: ReactNode[] = [];
  const low = text.toLowerCase();
  const lowQ = query.toLowerCase();
  let i = 0, k = 0;
  while (i < text.length) {
    const treffer = low.indexOf(lowQ, i);
    if (treffer === -1) { teile.push(text.slice(i)); break; }
    if (treffer > i) teile.push(text.slice(i, treffer));
    teile.push(
      <mark key={k++} style={{ background: "var(--status-warning-bg)", color: "inherit", fontWeight: 600, textDecoration: "underline", borderRadius: 2, padding: "0 1px" }}>
        {text.slice(treffer, treffer + query.length)}
      </mark>,
    );
    i = treffer + query.length;
  }
  return <>{teile}</>;
}

function nachMonat(notizen: Notiz[]): { label: string; items: Notiz[] }[] {
  const out: { label: string; items: Notiz[] }[] = [];
  for (const n of notizen) {
    const label = formatMonatJahr(new Date(n.erstelltAm));
    const g = out[out.length - 1];
    if (g && g.label === label) g.items.push(n);
    else out.push({ label, items: [n] });
  }
  return out;
}

/* ── Einzelne Notiz ─────────────────────────────────────────────────────────── */
function NotizKarte({ notiz, imGruppe, gedaempft, suche, onLoeschen }: {
  notiz: Notiz;
  imGruppe: boolean;
  gedaempft: boolean;
  suche: string;
  onLoeschen: (id: string) => void;
}) {
  const [offen, setOffen] = useState(false);        // "mehr"
  const [ueberlauf, setUeberlauf] = useState(false);
  const [bearbeitet, setBearbeitet] = useState(false);
  const [entwurf, setEntwurf] = useState(notiz.text);
  const textRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = textRef.current;
    if (el) setUeberlauf(el.scrollHeight - el.clientHeight > 1);
  }, [notiz.text, suche]);

  const datum = imGruppe ? formatTagMonat(new Date(notiz.erstelltAm)) : formatAnzeige(new Date(notiz.erstelltAm));
  const koerperFarbe = gedaempft ? "var(--text-secondary)" : "var(--text-primary)";

  const speichereBearbeitung = () => {
    const t = entwurf.trim();
    if (t) notizBearbeiten(notiz.id, t);
    setBearbeitet(false);
  };

  return (
    <div style={{
      padding: "8px 10px", borderRadius: 8,
      background: notiz.angeheftet ? "var(--status-warning-bg)" : "transparent",
      border: notiz.angeheftet ? "var(--border-thin) solid var(--status-warning)" : "var(--border-thin) solid transparent",
    }}>
      {/* Kopfzeile: Autor · Datum */}
      <div className="flex items-center" style={{ gap: 4, flexWrap: "wrap", marginBottom: 3 }}>
        <span style={{ fontSize: "var(--text-micro)", fontWeight: "var(--weight-medium)", color: "var(--text-secondary)" }}>{notiz.autor}</span>
        <span style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>· {datum}</span>
        {notiz.angeheftet && (
          <span className="inline-flex items-center" style={{ gap: 3, marginLeft: "auto", fontSize: "var(--text-micro)", fontWeight: "var(--weight-medium)", color: "var(--status-warning-text)" }}>
            <Pin style={{ width: 10, height: 10 }} /> In Liste sichtbar
          </span>
        )}
      </div>

      {bearbeitet ? (
        <div>
          <textarea value={entwurf} onChange={e => setEntwurf(e.target.value)} rows={4}
            className="w-full outline-none" style={{ fontSize: "var(--text-small)", color: "var(--text-primary)", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: 6, padding: "6px 8px", resize: "vertical", fontFamily: "inherit" }} />
          <div className="flex items-center" style={{ gap: 6, marginTop: 4 }}>
            <button type="button" onClick={speichereBearbeitung} className="ui-fokusring cursor-pointer" style={{ fontSize: "var(--text-micro)", fontWeight: "var(--weight-medium)", color: "var(--brand-primary)", background: "none", border: "none", padding: 0, fontFamily: "inherit" }}>Sichern</button>
            <button type="button" onClick={() => { setBearbeitet(false); setEntwurf(notiz.text); }} className="ui-fokusring cursor-pointer" style={{ fontSize: "var(--text-micro)", color: "var(--text-secondary)", background: "none", border: "none", padding: 0, fontFamily: "inherit" }}>Abbrechen</button>
          </div>
        </div>
      ) : (
        <>
          <div ref={textRef} style={{
            fontSize: "var(--text-small)", color: koerperFarbe, lineHeight: 1.45, overflowWrap: "anywhere",
            display: offen ? "block" : "-webkit-box", WebkitLineClamp: offen ? "unset" : 3,
            WebkitBoxOrient: "vertical", overflow: offen ? "visible" : "hidden",
          }}>
            {hervorheben(notiz.text, suche)}
          </div>
          {(ueberlauf || offen) && (
            <button type="button" onClick={() => setOffen(o => !o)} className="ui-fokusring cursor-pointer" style={{ marginTop: 2, fontSize: "var(--text-micro)", fontWeight: "var(--weight-medium)", color: "var(--text-secondary)", background: "none", border: "none", padding: 0, fontFamily: "inherit" }}>
              {offen ? "weniger" : "mehr"}
            </button>
          )}
          {notiz.geaendertAm && (
            <div style={{ marginTop: 3, fontSize: "var(--text-micro)", color: "var(--text-tertiary)", fontStyle: "italic" }}>
              Bearbeitet am {formatDatumZeit(new Date(notiz.geaendertAm))}
            </div>
          )}
          {/* Handlungen */}
          <div className="flex items-center" style={{ gap: 10, marginTop: 5 }}>
            <button type="button" onClick={() => { setEntwurf(notiz.text); setBearbeitet(true); }} className="ui-fokusring inline-flex items-center cursor-pointer" style={{ gap: 3, fontSize: "var(--text-micro)", color: "var(--text-secondary)", background: "none", border: "none", padding: 0, fontFamily: "inherit" }}>
              <Pencil style={{ width: 11, height: 11 }} /> Bearbeiten
            </button>
            {notiz.angeheftet ? (
              <button type="button" onClick={() => notizAnheftungLoesen(notiz.id)} className="ui-fokusring inline-flex items-center cursor-pointer" style={{ gap: 3, fontSize: "var(--text-micro)", color: "var(--text-secondary)", background: "none", border: "none", padding: 0, fontFamily: "inherit" }}>
                <PinOff style={{ width: 11, height: 11 }} /> Anheftung lösen
              </button>
            ) : (
              <button type="button" onClick={() => notizAnheften(notiz.id)} className="ui-fokusring inline-flex items-center cursor-pointer" style={{ gap: 3, fontSize: "var(--text-micro)", color: "var(--text-secondary)", background: "none", border: "none", padding: 0, fontFamily: "inherit" }}>
                <Pin style={{ width: 11, height: 11 }} /> Anheften
              </button>
            )}
            <button type="button" onClick={() => onLoeschen(notiz.id)} className="ui-fokusring inline-flex items-center cursor-pointer" style={{ gap: 3, fontSize: "var(--text-micro)", color: "var(--text-secondary)", background: "none", border: "none", padding: 0, fontFamily: "inherit" }}>
              <Trash2 style={{ width: 11, height: 11 }} /> Löschen
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ── Notizspur ──────────────────────────────────────────────────────────────── */
export function NotizSpur({ referenz, personName }: { referenz: NotizReferenz; personName: string }) {
  const alle = useAlleNotizen();
  const sicht = useMemo(() => sichtbareNotizen(alle, referenz), [alle, referenz]);

  const [text, setText] = useState("");
  const [inListe, setInListe] = useState(false);
  const [eingeklappt, setEingeklappt] = useState(true);
  const [suche, setSuche] = useState("");
  const [geloescht, setGeloescht] = useState<string | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Aufklappzustand wird nicht gespeichert: bei Personenwechsel wieder eingeklappt.
  useEffect(() => { setEingeklappt(true); setSuche(""); }, [referenz.art, referenz.kennung]);
  useEffect(() => () => { if (undoTimer.current) clearTimeout(undoTimer.current); }, []);

  const anzahl = sicht.length;
  const maxLen = inListe ? NOTIZ_MAX_ANGEHEFTET : undefined;

  const sichern = () => {
    const t = text.trim();
    if (!t) return;
    notizErstellen(referenz, inListe ? t.slice(0, NOTIZ_MAX_ANGEHEFTET) : t, AKTUELLER_AUTOR, inListe);
    setText(""); setInListe(false);
  };

  const loeschen = (id: string) => {
    if (undoTimer.current) { clearTimeout(undoTimer.current); }
    notizLoeschen(id);
    setGeloescht(id);
    undoTimer.current = setTimeout(() => setGeloescht(null), UNDO_MS);
  };
  const rueckgaengig = () => {
    if (undoTimer.current) { clearTimeout(undoTimer.current); undoTimer.current = null; }
    if (geloescht) notizWiederherstellen(geloescht);
    setGeloescht(null);
  };

  const label = { fontSize: "var(--text-micro)", color: "var(--text-secondary)", letterSpacing: "var(--tracking-wide)", textTransform: "uppercase" as const, fontWeight: "var(--weight-medium)" };

  return (
    <div>
      <div style={label}>Notizen</div>

      {/* ── Eingabe ── */}
      <div style={{ marginTop: "var(--space-2)" }}>
        <textarea value={text} onChange={e => setText(e.target.value)} maxLength={maxLen}
          placeholder={`Notiz zu ${personName}…`} rows={3}
          className="w-full outline-none" style={{ fontSize: "var(--text-small)", color: "var(--text-primary)", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: 8, padding: "7px 9px", resize: "vertical", fontFamily: "inherit" }} />
        <div className="flex items-center" style={{ gap: 6, marginTop: 5, flexWrap: "wrap" }}>
          <label className="inline-flex items-center cursor-pointer" style={{ gap: 5, fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>
            <input type="checkbox" checked={inListe} onChange={e => setInListe(e.target.checked)} style={{ width: 13, height: 13, accentColor: "var(--brand-primary)", cursor: "pointer" }} />
            In Liste anzeigen
          </label>
          {inListe && text.length >= NOTIZ_ZAEHLER_AB && (
            <span style={{ fontSize: "var(--text-micro)", color: text.length >= NOTIZ_MAX_ANGEHEFTET ? "var(--status-warning-text)" : "var(--text-tertiary)", fontVariantNumeric: "tabular-nums" }}>{text.length}/{NOTIZ_MAX_ANGEHEFTET}</span>
          )}
          <button type="button" onClick={sichern} disabled={!text.trim()} className="ui-fokusring cursor-pointer" style={{ marginLeft: "auto", padding: "4px 12px", borderRadius: "var(--radius-pill)", background: text.trim() ? "var(--brand-primary)" : "var(--bg-secondary)", color: text.trim() ? "var(--text-on-dark)" : "var(--text-tertiary)", fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", border: "none", fontFamily: "inherit", cursor: text.trim() ? "pointer" : "default" }}>Sichern</button>
        </div>
        <p style={{ marginTop: 6, fontSize: "var(--text-micro)", color: "var(--text-tertiary)", lineHeight: 1.4 }}>
          Für Absprachen, Anrufe und Übergaben. Zu Erledigendes gehört in die Pendenzen, pflegerische Beobachtungen in den Pflegebericht.
        </p>
      </div>

      {/* ── Rücknahme-Leiste ── */}
      {geloescht && (
        <div className="flex items-center justify-between" style={{ marginTop: 8, padding: "6px 9px", borderRadius: 8, background: "var(--bg-secondary)", fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>
          <span>Notiz gelöscht</span>
          <button type="button" onClick={rueckgaengig} className="ui-fokusring cursor-pointer" style={{ fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", color: "var(--brand-primary)", background: "none", border: "none", padding: 0, fontFamily: "inherit" }}>Rückgängig</button>
        </div>
      )}

      {/* ── Suche (ab 3 Notizen) ── */}
      {anzahl >= 3 && (
        <div className="flex items-center" style={{ marginTop: 10, gap: 6, padding: "5px 9px", borderRadius: "var(--radius-pill)", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)" }}>
          <Search style={{ width: 12, height: 12, color: "var(--text-tertiary)", flexShrink: 0 }} />
          <input value={suche} onChange={e => setSuche(e.target.value)} placeholder="Notizen durchsuchen…" className="flex-1 bg-transparent outline-none" style={{ fontSize: "var(--text-meta)", color: "var(--text-primary)", minWidth: 0 }} />
          {suche && <button type="button" onClick={() => setSuche("")} className="cursor-pointer shrink-0" style={{ background: "none", border: "none" }}><X style={{ width: 11, height: 11, color: "var(--text-secondary)" }} /></button>}
        </div>
      )}

      {/* ── Spur ── */}
      <NotizListe
        sicht={sicht}
        suche={suche}
        eingeklappt={eingeklappt}
        setEingeklappt={setEingeklappt}
        onLoeschen={loeschen}
        setSuche={setSuche}
      />
    </div>
  );
}

/* ── Listenkörper: Verdichtung, Suche, Monatsgruppen ────────────────────────── */
function NotizListe({ sicht, suche, eingeklappt, setEingeklappt, onLoeschen, setSuche }: {
  sicht: Notiz[];
  suche: string;
  eingeklappt: boolean;
  setEingeklappt: (b: boolean) => void;
  onLoeschen: (id: string) => void;
  setSuche: (s: string) => void;
}) {
  const q = suche.trim();
  const anzahl = sicht.length;

  // ── Suchmodus: über alle Notizen der Person, unabhängig vom Aufklappzustand ──
  if (q) {
    const treffer = sicht.filter(n => n.text.toLowerCase().includes(q.toLowerCase()));
    return (
      <div style={{ marginTop: 8 }}>
        {treffer.length === 0 ? (
          <div style={{ padding: "10px 2px" }}>
            <div style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", marginBottom: 6 }}>Keine Notiz enthält &bdquo;{q}&ldquo;.</div>
            <button type="button" onClick={() => setSuche("")} className="ui-fokusring cursor-pointer" style={{ fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", color: "var(--brand-primary)", background: "none", border: "none", padding: 0, fontFamily: "inherit" }}>Filter aufheben</button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between" style={{ padding: "2px 2px 6px" }}>
              <span style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>{treffer.length} {treffer.length === 1 ? "Treffer" : "Treffer"}</span>
              <button type="button" onClick={() => setSuche("")} className="ui-fokusring cursor-pointer" style={{ fontSize: "var(--text-micro)", fontWeight: "var(--weight-medium)", color: "var(--brand-primary)", background: "none", border: "none", padding: 0, fontFamily: "inherit" }}>Filter aufheben</button>
            </div>
            <div className="flex flex-col" style={{ gap: 2 }}>
              {treffer.map(n => <NotizKarte key={n.id} notiz={n} imGruppe={false} gedaempft={false} suche={q} onLoeschen={onLoeschen} />)}
            </div>
          </>
        )}
      </div>
    );
  }

  if (anzahl === 0) return null;

  const angeheftet = sicht.find(n => n.angeheftet) ?? null;
  const rest = sicht.filter(n => !n.angeheftet); // chronologisch absteigend

  // ── 1–2 Notizen: alle sichtbar, keine Schaltfläche ──
  if (anzahl <= 2) {
    return (
      <div className="flex flex-col" style={{ gap: 2, marginTop: 8 }}>
        {sicht.map(n => <NotizKarte key={n.id} notiz={n} imGruppe={false} gedaempft={false} suche="" onLoeschen={onLoeschen} />)}
      </div>
    );
  }

  // ── ab 3: eingeklappt = angeheftet + neueste; aufgeklappt = alle, Monatsgruppen ──
  if (eingeklappt) {
    const gezeigt = angeheftet ? [angeheftet, ...rest.slice(0, 1)] : rest.slice(0, 1);
    const verborgen = anzahl - gezeigt.length;
    return (
      <div style={{ marginTop: 8 }}>
        <div className="flex flex-col" style={{ gap: 2 }}>
          {gezeigt.map(n => <NotizKarte key={n.id} notiz={n} imGruppe={false} gedaempft={false} suche="" onLoeschen={onLoeschen} />)}
        </div>
        {verborgen > 0 && (
          <button type="button" onClick={() => setEingeklappt(false)} className="ui-fokusring cursor-pointer" style={{ marginTop: 6, fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", color: "var(--text-secondary)", background: "none", border: "none", padding: "2px 0", fontFamily: "inherit" }}>
            {verborgen} ältere anzeigen
          </button>
        )}
      </div>
    );
  }

  // aufgeklappt
  const gruppen = nachMonat(rest);
  let idx = 0; // 0 = neueste (normal), danach gedämpft
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ maxHeight: 250, overflowY: "auto" }}>
        {angeheftet && (
          <div className="flex flex-col" style={{ gap: 2, marginBottom: 4 }}>
            <NotizKarte notiz={angeheftet} imGruppe={false} gedaempft={false} suche="" onLoeschen={onLoeschen} />
          </div>
        )}
        {gruppen.map(g => (
          <div key={g.label} style={{ marginBottom: 4 }}>
            <div style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", fontWeight: "var(--weight-medium)", textTransform: "capitalize", padding: "4px 2px 2px" }}>{g.label}</div>
            <div className="flex flex-col" style={{ gap: 2 }}>
              {g.items.map(n => {
                const gedaempft = idx > 0; idx += 1;
                return <NotizKarte key={n.id} notiz={n} imGruppe gedaempft={gedaempft} suche="" onLoeschen={onLoeschen} />;
              })}
            </div>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => setEingeklappt(true)} className="ui-fokusring cursor-pointer" style={{ marginTop: 6, fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", color: "var(--text-secondary)", background: "none", border: "none", padding: "2px 0", fontFamily: "inherit" }}>
        Einklappen
      </button>
    </div>
  );
}
