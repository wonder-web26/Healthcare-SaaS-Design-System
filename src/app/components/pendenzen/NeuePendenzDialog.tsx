/**
 * NeuePendenzDialog — legt eine Pendenz manuell an (Lauf «Pendenzen erstellen»).
 *
 * Pflicht: Titel, Kategorie (bestehende Werteliste), Fällig am.
 * Optional: Beschreibung, Person (Suche über Klientinnen und Angehörige),
 * Zuständig (Mitarbeitendenbestand), Priorität.
 *
 * Der Status ist beim Anlegen IMMER "offen" — es gibt bewusst keine Auswahl.
 * Die Herkunft ist "manuell erstellt" (erstellende Person + Zeitpunkt); sie
 * erscheint im Verlauf der Pendenz.
 *
 * Personensuche bewusst OHNE Mitarbeitende: PersonArt kennt nur Patient und
 * Angehörige (personen-aufloesung.ts — Personaladministration liegt ausserhalb
 * des Produktumfangs).
 *
 * Muster E (Lauf 1): unter 1024px ein Blatt von unten, Aktionen fixiert,
 * der Erfassungsblock scrollt.
 */
import { useMemo, useState } from "react";
import { X, Search } from "lucide-react";
import { pendenzTypen, type PendenzTyp } from "../../../types/pendenz";
import { erstelleManuellePendenz, type Prioritaet, type Person, type UnifiedEntry } from "../../../lib/mocks/service-desk-unified";
import { personName, type PersonenBezug } from "../../../lib/mocks/personen-aufloesung";
import { getPatienten } from "../../../lib/patienten/store";
import { getAngehoerige } from "../../../lib/angehoerige/store";
import { getDiplomierte } from "../../../lib/betreuung/diplomierte";
import { DateField } from "../form/DateField";

// Ohne Farbwert: Person.color ist optional, die Avatar-Darstellung fällt auf
// das Token var(--text-tertiary) zurück (keine hartcodierten Farben).
const ERSTELLERIN: Person = { name: "Maria Keller", initialen: "MK" };
const HEUTE_ISO = "2026-03-03";

const PRIO_OPTIONEN: { value: Prioritaet; label: string }[] = [
  { value: "hoch", label: "Hoch" },
  { value: "mittel", label: "Mittel" },
  { value: "niedrig", label: "Niedrig" },
];

interface NeuePendenzDialogProps {
  offen: boolean;
  onClose: () => void;
  /** Wird nach dem Anlegen mit dem neuen Eintrag gerufen (Liste aktualisieren, Akzent setzen). */
  onErstellt: (eintrag: UnifiedEntry) => void;
  /** Vorbelegung aus dem Zusammenhang (z. B. Angehörigen- oder Klientendossier); änderbar. */
  vorbelegtePerson?: PersonenBezug | null;
}

const feldStil: React.CSSProperties = { width: "100%", fontFamily: "inherit", padding: "8px 12px", borderRadius: "var(--radius-input)", border: "var(--border-thin) solid var(--border-default)", background: "var(--bg-elevated)", color: "var(--text-primary)", fontSize: "var(--text-small)" };
const labelStil: React.CSSProperties = { display: "block", fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", color: "var(--text-secondary)", marginBottom: 4 };
const fehlerStil: React.CSSProperties = { fontSize: "var(--text-meta)", color: "var(--status-danger)", marginTop: 4 };

export function NeuePendenzDialog({ offen, onClose, onErstellt, vorbelegtePerson = null }: NeuePendenzDialogProps) {
  const [titel, setTitel] = useState("");
  const [kategorie, setKategorie] = useState<PendenzTyp | "">("");
  const [faellig, setFaellig] = useState<string | null>(null);
  const [beschreibung, setBeschreibung] = useState("");
  const [person, setPerson] = useState<PersonenBezug | null>(vorbelegtePerson);
  const [personSuche, setPersonSuche] = useState("");
  const [zustaendigId, setZustaendigId] = useState("");
  const [prioritaet, setPrioritaet] = useState<Prioritaet>("mittel");
  const [fehler, setFehler] = useState<Record<string, string>>({});

  // Suche über Klientinnen und Angehörige (PersonArt kennt keine Mitarbeitenden).
  const personTreffer = useMemo(() => {
    const s = personSuche.trim().toLowerCase();
    if (!s) return [];
    const patienten = getPatienten().map(p => ({ bezug: { art: "patient", kennung: p.id } as PersonenBezug, name: `${p.vorname} ${p.nachname}`, rolle: "Patient/in" }));
    const angehoerige = getAngehoerige().map(a => ({ bezug: { art: "angehoeriger", kennung: a.id } as PersonenBezug, name: `${a.vorname} ${a.nachname}`, rolle: "Angehörige/r" }));
    return [...patienten, ...angehoerige].filter(p => p.name.toLowerCase().includes(s)).slice(0, 8);
  }, [personSuche]);

  if (!offen) return null;

  const zuruecksetzen = () => {
    setTitel(""); setKategorie(""); setFaellig(null); setBeschreibung("");
    setPerson(vorbelegtePerson); setPersonSuche(""); setZustaendigId(""); setPrioritaet("mittel"); setFehler({});
  };

  const anlegen = () => {
    const f: Record<string, string> = {};
    if (!titel.trim()) f.titel = "Bitte einen Titel angeben.";
    if (!kategorie) f.kategorie = "Bitte eine Kategorie wählen.";
    if (!faellig) f.faellig = "Bitte ein Fälligkeitsdatum wählen.";
    setFehler(f);
    if (Object.keys(f).length > 0) return;
    const dipl = getDiplomierte().find(d => d.id === zustaendigId);
    const eintrag = erstelleManuellePendenz({
      betreff: titel.trim(),
      pendenzTyp: kategorie as PendenzTyp,
      pendenzTypLabel: pendenzTypen[kategorie as PendenzTyp]?.label ?? kategorie,
      faellig: faellig!,
      beschreibung: beschreibung.trim() || undefined,
      personBezug: person,
      verantwortlich: dipl ? { name: `${dipl.vorname} ${dipl.name}`, initialen: dipl.initialen } : null,
      prioritaet,
      erstelltVon: ERSTELLERIN,
      erstelltAm: HEUTE_ISO,
    });
    zuruecksetzen();
    onErstellt(eintrag);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center m1-dialog-wrap" style={{ background: "color-mix(in srgb, var(--text-primary) 40%, transparent)", padding: 16 }} onClick={onClose} role="dialog" aria-modal="true" aria-label="Neue Pendenz anlegen">
      <div className="m1-blatt flex flex-col" onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, maxHeight: "88vh", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-overlay)", overflow: "hidden" }}>
        <div className="m1-blatt-griff" aria-hidden="true" />
        {/* Kopf */}
        <div className="shrink-0 flex items-center justify-between" style={{ padding: "16px 20px", borderBottom: "var(--border-thin) solid var(--border-default)" }}>
          <span style={{ fontSize: "var(--text-h3)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>Neue Pendenz</span>
          <button type="button" aria-label="Schliessen" onClick={onClose} className="ui-fokusring flex items-center justify-center cursor-pointer" style={{ width: 32, height: 32, borderRadius: "var(--radius-pill)", background: "transparent", border: "none" }}>
            <X style={{ width: 16, height: 16, color: "var(--text-secondary)" }} />
          </button>
        </div>

        {/* Erfassungsblock — scrollt, die Aktionen bleiben unten */}
        <div className="m1-blatt-inhalt" style={{ padding: "16px 20px", overflowY: "auto" }}>
          <div style={{ marginBottom: "var(--space-3)" }}>
            <label htmlFor="np-titel" style={labelStil}>Titel *</label>
            <input id="np-titel" value={titel} onChange={e => setTitel(e.target.value)} placeholder="Was ist zu tun?" className="ui-fokusring" style={feldStil} />
            {fehler.titel && <div style={fehlerStil}>{fehler.titel}</div>}
          </div>

          <div style={{ marginBottom: "var(--space-3)" }}>
            <label htmlFor="np-kategorie" style={labelStil}>Kategorie *</label>
            <select id="np-kategorie" value={kategorie} onChange={e => setKategorie(e.target.value as PendenzTyp)} className="ui-fokusring" style={feldStil}>
              <option value="">Kategorie wählen…</option>
              {(Object.keys(pendenzTypen) as PendenzTyp[]).map(t => (
                <option key={t} value={t}>{pendenzTypen[t].label}</option>
              ))}
            </select>
            {fehler.kategorie && <div style={fehlerStil}>{fehler.kategorie}</div>}
          </div>

          <div style={{ marginBottom: "var(--space-3)" }}>
            <label style={labelStil}>Fällig am *</label>
            <DateField wertFormat="iso" bereich="any" value={faellig} onChange={v => setFaellig((v as string) || null)} />
            {fehler.faellig && <div style={fehlerStil}>{fehler.faellig}</div>}
          </div>

          <div style={{ marginBottom: "var(--space-3)" }}>
            <label htmlFor="np-beschreibung" style={labelStil}>Beschreibung</label>
            <textarea id="np-beschreibung" value={beschreibung} onChange={e => setBeschreibung(e.target.value)} rows={3} style={{ ...feldStil, resize: "vertical" }} className="ui-fokusring" />
          </div>

          <div style={{ marginBottom: "var(--space-3)" }}>
            <label htmlFor="np-person" style={labelStil}>Person</label>
            {person ? (
              <div className="flex items-center justify-between" style={{ ...feldStil, background: "var(--bg-secondary)" }}>
                <span style={{ fontSize: "var(--text-small)", color: "var(--text-primary)" }}>{personName(person)}</span>
                <button type="button" onClick={() => setPerson(null)} className="ui-fokusring cursor-pointer" aria-label="Person entfernen" style={{ background: "transparent", border: "none", color: "var(--text-secondary)", padding: 0 }}>
                  <X style={{ width: 14, height: 14 }} />
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center" style={{ ...feldStil, gap: 8 }}>
                  <Search style={{ width: 14, height: 14, color: "var(--text-tertiary)", flexShrink: 0 }} />
                  <input id="np-person" value={personSuche} onChange={e => setPersonSuche(e.target.value)} placeholder="Klientin oder Angehörige/n suchen…" className="flex-1 bg-transparent outline-none" style={{ fontSize: "var(--text-small)", color: "var(--text-primary)", minWidth: 0, border: "none" }} />
                </div>
                {personTreffer.length > 0 && (
                  <div style={{ marginTop: 4, border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-input)", overflow: "hidden" }}>
                    {personTreffer.map(t => (
                      <button key={`${t.bezug.art}-${t.bezug.kennung}`} type="button" onClick={() => { setPerson(t.bezug); setPersonSuche(""); }}
                        className="ui-fokusring w-full flex items-center justify-between cursor-pointer" style={{ padding: "8px 12px", background: "var(--bg-elevated)", border: "none", fontFamily: "inherit", textAlign: "left" }}>
                        <span style={{ fontSize: "var(--text-small)", color: "var(--text-primary)" }}>{t.name}</span>
                        <span style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>{t.rolle}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2" style={{ columnGap: "var(--space-4)", rowGap: "var(--space-3)", marginBottom: "var(--space-2)" }}>
            <div>
              <label htmlFor="np-zustaendig" style={labelStil}>Zuständig</label>
              <select id="np-zustaendig" value={zustaendigId} onChange={e => setZustaendigId(e.target.value)} className="ui-fokusring" style={feldStil}>
                <option value="">Nicht zugewiesen</option>
                {getDiplomierte().map(d => (
                  <option key={d.id} value={d.id}>{d.vorname} {d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="np-prioritaet" style={labelStil}>Priorität</label>
              <select id="np-prioritaet" value={prioritaet} onChange={e => setPrioritaet(e.target.value as Prioritaet)} className="ui-fokusring" style={feldStil}>
                {PRIO_OPTIONEN.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Aktionen — fest am unteren Rand des Blatts */}
        <div className="shrink-0 flex items-center justify-end" style={{ gap: "var(--space-2)", padding: "12px 20px", borderTop: "var(--border-thin) solid var(--border-default)" }}>
          <button type="button" onClick={onClose} className="ui-fokusring cursor-pointer"
            style={{ padding: "8px 16px", borderRadius: "var(--radius-pill)", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", fontFamily: "inherit" }}>
            Abbrechen
          </button>
          <button type="button" onClick={anlegen} className="ui-fokusring cursor-pointer"
            style={{ padding: "8px 16px", borderRadius: "var(--radius-pill)", background: "var(--brand-primary)", color: "var(--text-on-dark)", fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", border: "none", fontFamily: "inherit" }}>
            Pendenz anlegen
          </button>
        </div>
      </div>
    </div>
  );
}
