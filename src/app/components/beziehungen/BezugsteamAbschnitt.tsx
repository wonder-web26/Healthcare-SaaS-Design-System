/**
 * Bezugs- und Pflegeteam — geteilter Abschnitt für den Reiter Personalien
 * (Onboarding) UND Patient360. Eine Komponente, zwei Verwender; keine parallele
 * Zweitimplementierung.
 *
 * Stützt sich vollständig auf die vorhandene Struktur `Beziehung` (Rolle,
 * Verwandtschaftsart, Zeitraum, Vertretungsart, Merkmale) und `Kontakt` (die
 * dritte Person). Die Person wird EINMAL geführt: die Auswahl bietet alle drei
 * Bestände (Angehörige, Mitarbeitende, Kontakte). Notfallkontakt und
 * Auskunftsberechtigung sind Merkmale, keine Rollen.
 *
 * Die Rolle `pflegende_angehoerige` wird hier NICHT angeboten — sie entsteht aus
 * dem Angehörigen-Reiter und ist in der Liste nur einsehbar (Verwandtschaft und
 * Merkmale bleiben editierbar).
 */
import { useState } from "react";
import { Plus, Check, AlertTriangle, MoreVertical, ArrowRight } from "lucide-react";
import { InlineSelect } from "../ui/InlineSelect";
import { KontaktWahl } from "../ui/KontaktWahl";
import { DateField } from "../form/DateField";
import { AppButton } from "../ui/AppButton";
import { GEGENWART } from "../../../lib/gegenwart";
import { formatAnzeige } from "../../../lib/datum";
import { useBeziehungen, beziehungSichern, beziehungBeenden } from "../../../lib/beziehungen/store";
import { useAngehoerige } from "../../../lib/angehoerige/store";
import { useKontakte } from "../../../lib/kontakte/store";
import { kontaktName } from "../../../lib/kontakte/kontakte";
import {
  BEZIEHUNGSROLLE, BEZIEHUNGSART, VERTRETUNGSART,
  rolleSeite, rolleLabel, artLabel, vertretungsartLabel, zugehoerigkeitLabel, personName,
  istAktiv as beziehungAktiv,
  type Beziehung, type PersonBezug, type BeziehungsSeite,
} from "../../../lib/beziehungen/beziehungen";

const SEITEN: { seite: BeziehungsSeite; label: string }[] = [
  { seite: "privat", label: "Privat" },
  { seite: "intern", label: "Intern" },
  { seite: "extern", label: "Extern" },
];

/** Reihenfolge der Rollen für die Sortierung innerhalb einer Gruppe. */
const ROLLE_RANG: Record<string, number> = Object.fromEntries(BEZIEHUNGSROLLE.map((r, i) => [r.code, i]));

const linkStyle: React.CSSProperties = { background: "none", border: "none", fontFamily: "inherit", fontSize: 13, fontWeight: 500, color: "var(--brand-accent)", cursor: "pointer" };

export function BezugsteamAbschnitt({ patientId, angehoerigenReiterPfad }: {
  patientId: string;
  /** Verweis zum Angehörigen-Reiter für die gepflegte Beziehung (optional). */
  angehoerigenReiterPfad?: string;
}) {
  const alle = useBeziehungen();
  const angehoerige = useAngehoerige();
  const kontakte = useKontakte();
  const [dialog, setDialog] = useState<{ id: string } | null>(null); // {id:""}=neu
  const [menuId, setMenuId] = useState<string | null>(null);

  const nameVon = (k: string) => { const a = angehoerige.find(x => x.id === k); return a ? `${a.vorname} ${a.nachname}` : k; };
  const kontaktVon = (k: string) => { const t = kontakte.find(x => x.id === k); return t ? kontaktName(t) : k; };
  const zugVon = (b: Beziehung) => { const p = b.person; return p.art === "kontakt" ? kontakte.find(x => x.id === p.kennung)?.zugehoerigkeit ?? "" : ""; };

  const eigene = alle.filter(b => b.patientId === patientId);

  const gruppen = SEITEN.map(({ seite, label }) => {
    const inGruppe = eigene.filter(b => rolleSeite(b.rolle) === seite);
    const aktive = inGruppe.filter(beziehungAktiv).sort((a, b) =>
      (Number(b.notfallkontakt) - Number(a.notfallkontakt)) || (ROLLE_RANG[a.rolle] - ROLLE_RANG[b.rolle]));
    const beendete = inGruppe.filter(b => !beziehungAktiv(b));
    return { seite, label, zeilen: [...aktive, ...beendete] };
  }).filter(g => g.zeilen.length > 0);

  // §8 Hinweise
  const aktiveEigene = eigene.filter(beziehungAktiv);
  const hinweise: { text: string; aktionLabel: string; rolle: string }[] = [];
  if (!aktiveEigene.some(b => b.rolle === "hausarzt")) hinweise.push({ text: `Kein ${rolleLabel("hausarzt")} erfasst. Für ärztliche Anfragen und Verordnungen wird er benötigt.`, aktionLabel: `${rolleLabel("hausarzt")} hinzufügen`, rolle: "hausarzt" });
  if (!aktiveEigene.some(b => b.notfallkontakt)) hinweise.push({ text: "Kein Notfallkontakt gesetzt.", aktionLabel: "Person hinzufügen", rolle: "" });
  if (!aktiveEigene.some(b => b.rolle === "sozialdienst")) hinweise.push({ text: `Kein ${rolleLabel("sozialdienst")} erfasst. Falls einer involviert ist, gehört er hier hinein.`, aktionLabel: `${rolleLabel("sozialdienst")} hinzufügen`, rolle: "sozialdienst" });

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums" }}>{eigene.length} {eigene.length === 1 ? "Person" : "Personen"}</span>
        <button type="button" onClick={() => setDialog({ id: "" })} className="ui-fokusring inline-flex items-center" style={{ ...linkStyle, marginLeft: "auto", gap: 4 }}>
          <Plus style={{ width: 14, height: 14 }} /> Person hinzufügen
        </button>
      </div>

      {gruppen.length === 0 && (
        <div style={{ fontSize: 13, color: "var(--text-tertiary)", padding: "8px 0 12px" }}>Noch keine Person erfasst.</div>
      )}

      {gruppen.map(({ seite, label, zeilen }) => (
        <div key={seite} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 8 }}>{label}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {zeilen.map(b => (
              <Zeile key={b.id} b={b} name={personName(b, nameVon, kontaktVon)} zugehoerigkeit={zugVon(b)}
                menuOffen={menuId === b.id} onMenu={() => setMenuId(menuId === b.id ? null : b.id)}
                angehoerigenReiterPfad={angehoerigenReiterPfad}
                onBearbeiten={() => { setMenuId(null); setDialog({ id: b.id }); }}
                onBeenden={() => { beziehungBeenden(b.id, formatAnzeige(GEGENWART)); setMenuId(null); }} />
            ))}
          </div>
        </div>
      ))}

      {hinweise.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
          {hinweise.map((h, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", borderRadius: 12, background: "var(--status-warning-bg)", border: "0.5px solid var(--border-default)" }}>
              <AlertTriangle style={{ width: 15, height: 15, color: "var(--status-warning-text)", flexShrink: 0, marginTop: 1 }} />
              <span style={{ flex: 1, fontSize: 13, color: "var(--text-secondary)" }}>{h.text}</span>
              <button type="button" onClick={() => setDialog({ id: "" })} className="ui-fokusring" style={{ ...linkStyle, flexShrink: 0, color: "var(--status-warning-text)" }}>{h.aktionLabel}</button>
            </div>
          ))}
        </div>
      )}

      {dialog && (
        <PersonDialog patientId={patientId} eintragId={dialog.id}
          eigene={eigene} angehoerige={angehoerige} kontakte={kontakte}
          onClose={() => setDialog(null)} />
      )}
    </div>
  );
}

function Zeile({ b, name, zugehoerigkeit, menuOffen, onMenu, onBearbeiten, onBeenden, angehoerigenReiterPfad }: {
  b: Beziehung; name: string; zugehoerigkeit: string; menuOffen: boolean;
  onMenu: () => void; onBearbeiten: () => void; onBeenden: () => void; angehoerigenReiterPfad?: string;
}) {
  const aktiv = beziehungAktiv(b);
  const gepflegt = b.rolle === "pflegende_angehoerige"; // aus dem Angehörigen-Reiter
  const detail = [
    b.rolle === "beistand" ? vertretungsartLabel(b.vertretungsart) : rolleSeite(b.rolle) === "extern" ? zugehoerigkeit : (b.art ? artLabel(b.art) : ""),
    b.telefon,
    b.beginn ? `seit ${b.beginn}${b.ende ? ` bis ${b.ende}` : ""}` : b.ende ? `bis ${b.ende}` : "",
  ].filter(Boolean);

  return (
    <div style={{ border: "0.5px solid var(--border-default)", borderRadius: 12, padding: "10px 14px", background: "var(--bg-elevated)", opacity: aktiv ? 1 : 0.6 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>{name}</span>
        <Chip>{rolleLabel(b.rolle)}</Chip>
        {b.notfallkontakt && <Chip ton="warnung">Notfallkontakt</Chip>}
        {b.auskunftsberechtigt && <Chip ton="info">Auskunftsberechtigt</Chip>}
        {!aktiv && <Chip>beendet</Chip>}
        <div style={{ marginLeft: "auto", position: "relative", flexShrink: 0 }}>
          <button type="button" aria-label="Aktionen" onClick={onMenu} className="ui-fokusring inline-flex items-center justify-center"
            style={{ width: 28, height: 28, borderRadius: 999, border: "none", background: "transparent", color: "var(--text-tertiary)", cursor: "pointer" }}>
            <MoreVertical style={{ width: 16, height: 16 }} />
          </button>
          {menuOffen && (
            <div role="menu" style={{ position: "absolute", right: 0, top: "100%", marginTop: 4, zIndex: 30, minWidth: 150, padding: 4, background: "var(--bg-elevated)", border: "0.5px solid var(--border-default)", borderRadius: 12, boxShadow: "var(--shadow-overlay)" }}>
              <button type="button" role="menuitem" onClick={onBearbeiten} className="ui-fokusring" style={menuItemStyle}>Bearbeiten</button>
              {/* Beenden nur bei bestehenden, nicht-gepflegten, aktiven Beziehungen. */}
              {aktiv && !gepflegt && <button type="button" role="menuitem" onClick={onBeenden} className="ui-fokusring" style={menuItemStyle}>Beenden</button>}
            </div>
          )}
        </div>
      </div>
      {detail.length > 0 && (
        <div style={{ marginLeft: 2, marginTop: 6, fontSize: 12, color: "var(--text-tertiary)", display: "flex", flexWrap: "wrap", gap: "2px 16px" }}>
          {detail.map((d, i) => <span key={i}>{d}</span>)}
        </div>
      )}
      {gepflegt && (
        <div style={{ marginTop: 6, fontSize: 12, color: "var(--status-info)", display: "flex", alignItems: "center", gap: 4 }}>
          Im Angehörigen-Reiter gepflegt
          {angehoerigenReiterPfad && <a href={angehoerigenReiterPfad} className="ui-fokusring inline-flex items-center" style={{ color: "var(--brand-accent)", gap: 2 }}>öffnen <ArrowRight style={{ width: 12, height: 12 }} /></a>}
        </div>
      )}
    </div>
  );
}

const menuItemStyle: React.CSSProperties = { display: "block", width: "100%", padding: "7px 10px", borderRadius: 8, border: "none", background: "transparent", fontFamily: "inherit", fontSize: 13, color: "var(--text-primary)", cursor: "pointer", textAlign: "left" };

function Chip({ children, ton }: { children: React.ReactNode; ton?: "warnung" | "info" }) {
  const stil = ton === "warnung" ? { background: "var(--status-warning-bg)", color: "var(--status-warning-text)" }
    : ton === "info" ? { background: "var(--brand-accent-light)", color: "var(--status-info)" }
    : { background: "var(--bg-secondary)", color: "var(--text-secondary)" };
  return <span style={{ padding: "2px 10px", borderRadius: 999, fontSize: 12, fontWeight: 500, whiteSpace: "nowrap", ...stil }}>{children}</span>;
}

// ── Dialog: Person, Rolle, dann rollenabhängige Angaben ──────────────────────

const KONTAKT_WAHL = "__kontakt__";
// pflegende_angehoerige wird nicht angeboten (§5).
const ROLLEN_WAEHLBAR = BEZIEHUNGSROLLE.filter(r => r.code !== "pflegende_angehoerige");

function PersonDialog({ patientId, eintragId, eigene, angehoerige, kontakte, onClose }: {
  patientId: string; eintragId: string;
  eigene: Beziehung[];
  angehoerige: ReturnType<typeof useAngehoerige>;
  kontakte: ReturnType<typeof useKontakte>;
  onClose: () => void;
}) {
  const eintrag = eintragId ? eigene.find(b => b.id === eintragId) ?? null : null;
  const gepflegt = eintrag?.rolle === "pflegende_angehoerige";

  const [wahl, setWahl] = useState(
    eintrag ? (eintrag.person.art === "angehoeriger" ? `a:${eintrag.person.kennung}`
      : eintrag.person.art === "mitarbeitende" ? `m:${eintrag.person.name}` : KONTAKT_WAHL) : "");
  const [kontaktWahl, setKontaktWahl] = useState(eintrag?.person.art === "kontakt" ? eintrag.person.kennung : "");
  const [rolle, setRolle] = useState<string>(eintrag?.rolle ?? "");
  const [rollenOffen, setRollenOffen] = useState(false);
  const [art, setArt] = useState<string>(eintrag?.art ?? "");
  const [vertretungsart, setVertretungsart] = useState<string>(eintrag?.vertretungsart ?? "");
  const [beginn, setBeginn] = useState(eintrag?.beginn ?? "");
  const [telefon, setTelefon] = useState(eintrag?.telefon ?? "");
  const [notfall, setNotfall] = useState(eintrag?.notfallkontakt ?? false);
  const [auskunft, setAuskunft] = useState(eintrag?.auskunftsberechtigt ?? false);
  const [fehler, setFehler] = useState("");

  const seite = rolle ? rolleSeite(rolle) : null;
  // Personenauswahl über die drei Bestände (§6). Herkunft + Kennung sichtbar.
  const personen = angehoerige.map(a => ({ value: `a:${a.id}`, label: `${a.vorname} ${a.nachname} — Angehörige ${a.id}` }));
  const mitarbeitende = [...new Set(eigene.filter(b => b.person.art === "mitarbeitende").map(b => (b.person as { name: string }).name))]
    .sort().map(n => ({ value: `m:${n}`, label: `${n} — Mitarbeitende` }));

  // Ausgewählte Person hat schon ein Telefon? Dann kein Telefonfeld (§7).
  const gewaehltePerson: PersonBezug | null = wahl === KONTAKT_WAHL ? (kontaktWahl ? { art: "kontakt", kennung: kontaktWahl } : null)
    : wahl.startsWith("a:") ? { art: "angehoeriger", kennung: wahl.slice(2) }
    : wahl.startsWith("m:") ? { art: "mitarbeitende", name: wahl.slice(2) } : null;
  const personTelefon = gewaehltePerson?.art === "angehoeriger" ? (angehoerige.find(a => a.id === gewaehltePerson.kennung)?.telefon ?? "")
    : gewaehltePerson?.art === "kontakt" ? (kontakte.find(k => k.id === gewaehltePerson.kennung)?.telefon ?? "") : "";

  // §6 Warnung: gleichnamiger Angehöriger, wenn ein Kontakt gewählt/angelegt wird.
  const kontaktName_ = gewaehltePerson?.art === "kontakt" ? (kontakte.find(k => k.id === gewaehltePerson.kennung)?.name ?? "") : "";
  const gleichnamigerAngehoeriger = kontaktName_ ? angehoerige.find(a => a.nachname.toLowerCase() === kontaktName_.trim().toLowerCase()) : undefined;

  const rollenSichtbar = rollenOffen ? ROLLEN_WAEHLBAR : ROLLEN_WAEHLBAR.slice(0, 5);

  const sichern = () => {
    if (!gepflegt) {
      if (!wahl) { setFehler("Bitte eine Person wählen."); return; }
      if (wahl === KONTAKT_WAHL && !kontaktWahl) { setFehler("Bitte einen Kontakt wählen oder anlegen."); return; }
      if (!rolle) { setFehler("Bitte eine Rolle wählen."); return; }
    }
    const person: PersonBezug = gepflegt ? eintrag!.person : gewaehltePerson!;
    const zielRolle = gepflegt ? eintrag!.rolle : (rolle as Beziehung["rolle"]);
    // Keine zweite offene Beziehung derselben Rolle für dieselbe Person.
    const doppelt = eigene.some(b => b.id !== eintragId && beziehungAktiv(b) && b.rolle === zielRolle
      && personSchluessel(b.person) === personSchluessel(person));
    if (doppelt) { setFehler("Diese Person hat diese Rolle bereits."); return; }

    beziehungSichern({
      id: eintragId, patientId, person, rolle: zielRolle,
      art: rolleSeite(zielRolle) === "privat" ? (art as Beziehung["art"]) : "",
      vertretungsart: zielRolle === "beistand" ? (vertretungsart as Beziehung["vertretungsart"]) : "",
      beginn: beginn.trim(), ende: eintrag?.ende ?? "",
      telefon: personTelefon ? (eintrag?.telefon ?? "") : telefon.trim(),
      notfallkontakt: notfall, auskunftsberechtigt: auskunft,
      bemerkung: eintrag?.bemerkung ?? "",
    });
    onClose();
  };

  return (
    <div role="dialog" aria-modal="true" aria-label={eintrag ? "Beziehung bearbeiten" : "Person hinzufügen"} onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(19,19,20,0.28)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 540, maxWidth: "100%", maxHeight: "88vh", overflowY: "auto", background: "var(--bg-elevated)", borderRadius: 12, border: "0.5px solid var(--border-default)", boxShadow: "var(--shadow-overlay)" }}>
        <div style={{ padding: "16px 20px 8px", fontSize: 16, fontWeight: 500, color: "var(--text-primary)" }}>{eintrag ? "Beziehung bearbeiten" : "Person hinzufügen"}</div>
        <div style={{ padding: "8px 20px 16px", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* 1. Person */}
          <Feld label="Person">
            {gepflegt ? (
              <div style={{ fontSize: 14, color: "var(--text-primary)" }}>{personName(eintrag!, k => { const a = angehoerige.find(x => x.id === k); return a ? `${a.vorname} ${a.nachname}` : k; })} <span style={{ fontSize: 12, color: "var(--status-info)", marginLeft: 8 }}>im Angehörigen-Reiter gepflegt</span></div>
            ) : (
              <>
                <InlineSelect value={wahl} onChange={setWahl} platzhalter="Person suchen …"
                  options={[...personen, ...mitarbeitende, { value: KONTAKT_WAHL, label: "Kontakt (dritte Person) — suchen oder anlegen" }]} />
                {wahl === KONTAKT_WAHL && (
                  <div style={{ marginTop: 8 }}>
                    <KontaktWahl wert={kontaktWahl} onWahl={setKontaktWahl} label="Kontakt" zugehoerigkeitLabel={rolle ? zugehoerigkeitLabel(rolle) : "Zugehörigkeit"} />
                    {gleichnamigerAngehoeriger && (
                      <div style={{ marginTop: 6, fontSize: 12, color: "var(--status-warning-text)" }}>
                        „{gleichnamigerAngehoeriger.vorname} {gleichnamigerAngehoeriger.nachname}" ist bereits als Angehörige erfasst ({gleichnamigerAngehoeriger.id}). Für sie sollte kein Kontakt angelegt werden.
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </Feld>

          {/* 2. Rolle — sichtbare Auswahl, ohne pflegende_angehoerige */}
          {!gepflegt && (
            <Feld label="Rolle">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {rollenSichtbar.map(r => {
                  const sel = rolle === r.code;
                  return (
                    <button key={r.code} type="button" onClick={() => setRolle(r.code)} aria-pressed={sel} className="ui-fokusring"
                      style={{ padding: "6px 12px", borderRadius: 12, fontFamily: "inherit", fontSize: 13, cursor: "pointer",
                        background: sel ? "var(--brand-primary-light)" : "var(--bg-elevated)", color: sel ? "var(--brand-primary)" : "var(--text-primary)",
                        border: "0.5px solid " + (sel ? "var(--brand-primary)" : "var(--border-default)"), boxShadow: sel ? "inset 0 0 0 1px var(--brand-primary)" : "none" }}>
                      {r.label}
                    </button>
                  );
                })}
                {!rollenOffen && ROLLEN_WAEHLBAR.length > 5 && (
                  <button type="button" onClick={() => setRollenOffen(true)} className="ui-fokusring" style={linkStyle}>weitere Rollen …</button>
                )}
              </div>
            </Feld>
          )}

          {/* 3. rollenabhängig */}
          {seite === "privat" && (
            <Feld label="Verwandtschaft">
              <InlineSelect value={art} onChange={setArt} platzhalter="nicht erfasst" options={BEZIEHUNGSART.map(a => ({ value: a.code, label: a.label }))} />
            </Feld>
          )}
          {rolle === "beistand" && (
            <Feld label="Art der Vertretung">
              <InlineSelect value={vertretungsart} onChange={setVertretungsart} platzhalter="Art nicht bekannt" options={VERTRETUNGSART.map(v => ({ value: v.code, label: v.label }))} />
            </Feld>
          )}
          {!gepflegt && (
            <Feld label="Beginn (optional)">
              <div style={{ maxWidth: 200 }}><DateField label="" value={beginn} wertFormat="display" bereich="past" onChange={v => setBeginn(typeof v === "string" ? v : "")} /></div>
            </Feld>
          )}

          {/* Merkmale */}
          <Feld label="Merkmale">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <Umschalter an={notfall} onToggle={() => setNotfall(!notfall)} text="Notfallkontakt" />
              <Umschalter an={auskunft} onToggle={() => setAuskunft(!auskunft)} text="Auskunftsberechtigt" />
            </div>
          </Feld>

          {/* Telefon nur, wenn die Person keines trägt */}
          {!gepflegt && !personTelefon && (
            <Feld label="Telefon (optional)">
              <input type="text" value={telefon} onChange={e => setTelefon(e.target.value)} className="ui-fokusring" style={inputStil} placeholder="+41 44 000 00 00" />
            </Feld>
          )}

          {fehler && <div role="alert" style={{ fontSize: 12, color: "var(--status-warning-text)" }}>{fehler}</div>}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, padding: "12px 20px", borderTop: "0.5px solid var(--border-default)" }}>
          <button type="button" onClick={onClose} className="ui-fokusring" style={{ ...linkStyle, color: "var(--text-secondary)" }}>Abbrechen</button>
          <AppButton variant="primaer" onClick={sichern}>Sichern</AppButton>
        </div>
      </div>
    </div>
  );
}

function personSchluessel(p: PersonBezug): string {
  return p.art === "mitarbeitende" ? `m:${p.name}` : `${p.art}:${p.kennung}`;
}

function Umschalter({ an, onToggle, text }: { an: boolean; onToggle: () => void; text: string }) {
  return (
    <button type="button" onClick={onToggle} aria-pressed={an} className="ui-fokusring inline-flex items-center"
      style={{ gap: 6, padding: "5px 12px", borderRadius: 999, fontFamily: "inherit", fontSize: 13, cursor: "pointer",
        background: an ? "var(--brand-primary-light)" : "var(--bg-elevated)", color: an ? "var(--brand-primary)" : "var(--text-secondary)",
        border: "0.5px solid " + (an ? "var(--brand-primary)" : "var(--border-default)") }}>
      {an && <Check style={{ width: 12, height: 12 }} />}{text}
    </button>
  );
}

const inputStil: React.CSSProperties = { width: "100%", maxWidth: 260, padding: "9px 12px", fontSize: 14, borderRadius: 12, border: "0.5px solid var(--border-default)", background: "var(--bg-elevated)", color: "var(--text-primary)", fontFamily: "inherit", boxSizing: "border-box" };

function Feld({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}
