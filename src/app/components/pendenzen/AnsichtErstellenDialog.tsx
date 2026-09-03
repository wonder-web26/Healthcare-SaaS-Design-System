import { useState, useMemo } from "react";
import { Check, Search, X } from "lucide-react";
import { erstelleAnsicht, nameVergeben, type AnsichtFilter, type FreigabeBezug, type Listenansicht } from "../../../lib/pendenzen/listenansichten";

export interface PersonWahl { name: string; initialen: string }

/**
 * „Ansicht erstellen" — Filter, Name und Freigabe in einem Dialog.
 *
 * Der Filter wird hier zusammengestellt, nicht aus der Liste übernommen. Damit
 * das nicht blind geschieht, läuft die Trefferzahl bei jeder Änderung mit: die
 * Administratorin sieht, was sie trifft, bevor sie speichert. Ist beim Öffnen
 * bereits ein Filter aktiv, ist er vorbelegt.
 */
export function AnsichtErstellenDialog({ offen, onClose, kategorien, personen, statusOptionen, zaehle, startFilter, onErstellt }: {
  offen: boolean;
  onClose: () => void;
  kategorien: { value: string; label: string }[];
  personen: PersonWahl[];
  statusOptionen: { value: AnsichtFilter["status"] extends (infer S)[] | undefined ? S : never; label: string }[];
  /** Trefferzahl zu einem Filter — die Liste rechnet, der Dialog zeigt nur. */
  zaehle: (f: AnsichtFilter) => number;
  /** Vorbelegung aus dem, was gerade auf dem Bildschirm steht. */
  startFilter: AnsichtFilter;
  onErstellt: (a: Listenansicht) => void;
}) {
  const [name, setName] = useState("");
  const [arten, setArten] = useState<Set<string>>(new Set(startFilter.pendenzTypen ?? []));
  const [status, setStatus] = useState<Set<string>>(new Set(startFilter.status ?? []));
  const [zustaendig, setZustaendig] = useState(startFilter.verantwortlich ?? "");
  const [faelligBis, setFaelligBis] = useState(startFilter.faelligBis ?? "");
  const [ganzeOrg, setGanzeOrg] = useState(false);
  const [gewaehlt, setGewaehlt] = useState<Set<string>>(new Set());
  const [suche, setSuche] = useState("");

  const filter = useMemo<AnsichtFilter>(() => {
    const f: AnsichtFilter = {};
    if (arten.size) f.pendenzTypen = [...arten];
    if (status.size) f.status = [...status] as AnsichtFilter["status"];
    if (zustaendig) f.verantwortlich = zustaendig;
    if (faelligBis) f.faelligBis = faelligBis;
    return f;
  }, [arten, status, zustaendig, faelligBis]);

  const trefferzahl = useMemo(() => zaehle(filter), [zaehle, filter]);

  if (!offen) return null;

  const nameLeer = !name.trim();
  const warnDoppelt = !nameLeer && nameVergeben(name);
  const ohneFilter = Object.keys(filter).length === 0;
  const trefferPersonen = personen.filter(p => p.name.toLowerCase().includes(suche.trim().toLowerCase()));

  const speichern = () => {
    if (nameLeer || ohneFilter) return;
    const freigabe: FreigabeBezug[] = ganzeOrg ? [] : [...gewaehlt].map(kennung => ({ art: "benutzer" as const, kennung }));
    onErstellt(erstelleAnsicht({ name, filter, freigabe }));
  };

  const umschalten = (set: Set<string>, setzen: (s: Set<string>) => void, wert: string) => {
    const n = new Set(set);
    if (n.has(wert)) n.delete(wert); else n.add(wert);
    setzen(n);
  };

  const kaestchen = (aktiv: boolean, beschriftung: string, onClick: () => void) => (
    <button key={beschriftung} type="button" onClick={onClick} className="ui-fokusring inline-flex items-center cursor-pointer transition-colors"
      style={{ gap: 6, padding: "5px 10px", borderRadius: "var(--radius-pill)", background: aktiv ? "var(--brand-primary-light)" : "var(--bg-elevated)", border: aktiv ? "var(--border-thin) solid var(--brand-primary)" : "var(--border-thin) solid var(--border-default)", fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", color: aktiv ? "var(--brand-primary)" : "var(--text-primary)", fontFamily: "inherit" }}>
      <span className="inline-flex items-center justify-center shrink-0" style={{ width: 14, height: 14, borderRadius: 4, border: aktiv ? "none" : "var(--border-thin) solid var(--border-default)", background: aktiv ? "var(--brand-primary)" : "transparent" }}>
        {aktiv && <Check style={{ width: 10, height: 10, color: "var(--text-on-dark)" }} />}
      </span>
      {beschriftung}
    </button>
  );

  const feldTitel = (t: string) => (
    <div style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", fontWeight: "var(--weight-medium)", marginBottom: 6 }}>{t}</div>
  );

  const optionKarte = (aktiv: boolean, titel: string, erklaerung: string, onClick: () => void) => (
    <button type="button" onClick={onClick} className="ui-fokusring w-full cursor-pointer transition-colors"
      style={{ textAlign: "left", padding: "10px 12px", borderRadius: "var(--radius-card)", background: aktiv ? "var(--brand-primary-light)" : "var(--bg-elevated)", border: aktiv ? "1.5px solid var(--brand-primary)" : "var(--border-thin) solid var(--border-default)", fontFamily: "inherit" }}>
      <div className="flex items-center" style={{ gap: 8 }}>
        <span className="inline-flex items-center justify-center shrink-0" style={{ width: 15, height: 15, borderRadius: "var(--radius-pill)", border: aktiv ? "none" : "var(--border-thin) solid var(--border-default)", background: aktiv ? "var(--brand-primary)" : "transparent" }}>
          {aktiv && <Check style={{ width: 10, height: 10, color: "var(--text-on-dark)" }} />}
        </span>
        <span style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>{titel}</span>
      </div>
      <div style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", marginTop: 3, marginLeft: 23 }}>{erklaerung}</div>
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--text-primary), transparent 70%)", padding: "var(--space-4)" }} onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Ansicht erstellen" onClick={e => e.stopPropagation()}
        className="flex flex-col" style={{ width: "min(600px, 100%)", maxHeight: "90vh", background: "var(--bg-elevated)", borderRadius: "var(--radius-card)", border: "var(--border-thin) solid var(--border-default)", boxShadow: "var(--shadow-overlay)" }}>

        <div className="shrink-0 flex items-center justify-between" style={{ padding: "var(--space-4) var(--space-5)", borderBottom: "var(--border-thin) solid var(--border-default)" }}>
          <span style={{ fontSize: "var(--text-h3)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>Ansicht erstellen</span>
          <button type="button" onClick={onClose} aria-label="Schliessen" className="ui-fokusring cursor-pointer" style={{ background: "transparent", border: "none", padding: 4 }}>
            <X style={{ width: 16, height: 16, color: "var(--text-secondary)" }} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto" style={{ padding: "var(--space-5)", display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
          {/* 1 — Filter, wählbar. Die Trefferzahl läuft mit. */}
          <div>
            {feldTitel("Filter")}
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              <div>
                <div style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", marginBottom: 4 }}>Kategorie</div>
                <div className="flex items-center flex-wrap" style={{ gap: 6 }}>
                  {kategorien.map(k => kaestchen(arten.has(k.value), k.label, () => umschalten(arten, setArten, k.value)))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", marginBottom: 4 }}>Status</div>
                <div className="flex items-center flex-wrap" style={{ gap: 6 }}>
                  {statusOptionen.map(s => kaestchen(status.has(s.value as string), s.label, () => umschalten(status, setStatus, s.value as string)))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: "var(--space-3)" }}>
                <div>
                  <div style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", marginBottom: 4 }}>Zuständig</div>
                  <select value={zustaendig} onChange={e => setZustaendig(e.target.value)} aria-label="Zuständig" className="w-full ui-fokusring"
                    style={{ height: "var(--field-height)", padding: "0 10px", borderRadius: "var(--radius-card)", border: "var(--border-thin) solid var(--border-default)", background: "var(--bg-elevated)", fontSize: "var(--text-small)", color: "var(--text-primary)" }}>
                    <option value="">Alle</option>
                    {personen.map(p => <option key={p.initialen} value={p.initialen}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", marginBottom: 4 }}>Fällig bis</div>
                  <input type="date" value={faelligBis} onChange={e => setFaelligBis(e.target.value)} aria-label="Fällig bis" className="w-full ui-fokusring"
                    style={{ height: "var(--field-height)", padding: "0 10px", borderRadius: "var(--radius-card)", border: "var(--border-thin) solid var(--border-default)", background: "var(--bg-elevated)", fontSize: "var(--text-small)", color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }} />
                </div>
              </div>
            </div>
            <div style={{ marginTop: "var(--space-3)", padding: "8px 12px", borderRadius: "var(--radius-card)", background: "var(--bg-secondary)", fontSize: "var(--text-small)", color: ohneFilter ? "var(--text-tertiary)" : "var(--text-primary)" }}>
              {ohneFilter
                ? "Noch kein Filter gewählt — eine Ansicht ohne Einschränkung ergibt keinen Sinn."
                : <>{trefferzahl} Pendenzen zum jetzigen Zeitpunkt.</>}
            </div>
          </div>

          {/* 2 — Name */}
          <div>
            <label htmlFor="ansicht-name" style={{ display: "block", fontSize: "var(--text-meta)", color: "var(--text-secondary)", fontWeight: "var(--weight-medium)", marginBottom: 4 }}>Name</label>
            <input id="ansicht-name" value={name} onChange={e => setName(e.target.value)} placeholder="z.B. Quellensteuer offen" className="w-full ui-fokusring"
              style={{ height: "var(--field-height)", padding: "0 12px", borderRadius: "var(--radius-card)", border: "var(--border-thin) solid var(--border-default)", background: "var(--bg-elevated)", fontSize: "var(--text-small)", color: "var(--text-primary)" }} />
            {warnDoppelt && (
              <div style={{ fontSize: "var(--text-micro)", color: "var(--status-warning-text)", marginTop: 4 }}>Eine Ansicht mit diesem Namen existiert bereits.</div>
            )}
          </div>

          {/* 3 — Sichtbarkeit: genau zwei Optionen */}
          <div>
            {feldTitel("Sichtbarkeit")}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {optionKarte(!ganzeOrg, "Ausgewählte Personen und Rollen", "Erscheint bei den freigegebenen Personen unter „Für mich freigegeben“.", () => setGanzeOrg(false))}
              {optionKarte(ganzeOrg, "Ganze Organisation", "Erscheint bei allen Personen mit Pendenzen-Zugriff.", () => setGanzeOrg(true))}
            </div>
          </div>

          {/* 4 — Freigeben an; bei ganzer Organisation ausgeblendet, nicht deaktiviert */}
          {!ganzeOrg && (
            <div>
              {feldTitel("Freigeben an")}
              <div className="flex items-center" style={{ gap: 8, padding: "7px 12px", borderRadius: "var(--radius-card)", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", marginBottom: 6 }}>
                <Search style={{ width: 14, height: 14, color: "var(--text-tertiary)", flexShrink: 0 }} />
                <input value={suche} onChange={e => setSuche(e.target.value)} placeholder="Person suchen" className="flex-1 bg-transparent outline-none" style={{ fontSize: "var(--text-small)", color: "var(--text-primary)", minWidth: 0 }} />
              </div>
              <div style={{ maxHeight: 160, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
                {trefferPersonen.map(p => {
                  const aktiv = gewaehlt.has(p.name);
                  return (
                    <button key={p.name} type="button" onClick={() => umschalten(gewaehlt, setGewaehlt, p.name)}
                      className="ui-fokusring w-full inline-flex items-center cursor-pointer transition-colors"
                      style={{ gap: 8, padding: "7px 8px", borderRadius: 6, background: "transparent", border: "none", fontSize: "var(--text-small)", color: "var(--text-primary)", fontFamily: "inherit", textAlign: "left" }}
                      onMouseEnter={e => e.currentTarget.style.background = "var(--bg-secondary)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <span className="inline-flex items-center justify-center shrink-0" style={{ width: 16, height: 16, borderRadius: 4, border: aktiv ? "none" : "var(--border-thin) solid var(--border-default)", background: aktiv ? "var(--brand-primary)" : "transparent" }}>
                        {aktiv && <Check style={{ width: 11, height: 11, color: "var(--text-on-dark)" }} />}
                      </span>
                      {p.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Fest, nicht wegklickbar: Freigabe ist Zugang, nicht Inhalt. */}
          <div style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", lineHeight: 1.5 }}>
            Die Freigabe steuert nur, wer die Ansicht öffnen kann. Was jemand darin sieht, richtet sich nach seiner Rolle.
          </div>
        </div>

        <div className="shrink-0 flex items-center justify-end" style={{ gap: 8, padding: "var(--space-4) var(--space-5)", borderTop: "var(--border-thin) solid var(--border-default)" }}>
          <button type="button" onClick={onClose} className="ui-fokusring cursor-pointer" style={{ background: "transparent", border: "none", padding: "8px 12px", fontSize: "var(--text-small)", color: "var(--text-secondary)", fontWeight: "var(--weight-medium)", fontFamily: "inherit" }}>Abbrechen</button>
          <button type="button" onClick={speichern} disabled={nameLeer || ohneFilter}
            className="ui-fokusring inline-flex items-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ padding: "8px 16px", borderRadius: "var(--radius-pill)", background: "var(--brand-primary)", color: "var(--text-on-dark)", fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", border: "none", fontFamily: "inherit" }}>
            Ansicht erstellen
          </button>
        </div>
      </div>
    </div>
  );
}
