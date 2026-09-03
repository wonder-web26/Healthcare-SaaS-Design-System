/**
 * Bezugs- und Pflegeteam — geteilter Abschnitt für den Reiter Personalien
 * (Onboarding) UND Patient360. Eine Komponente, zwei Verwender; keine parallele
 * Zweitimplementierung.
 *
 * Stützt sich vollständig auf die vorhandene Struktur `Beziehung` (Rolle,
 * Verwandtschaftsart, Zeitraum, Vertretungsart, Merkmale) und `Kontakt` (die
 * dritte Person). Die Person wird EINMAL geführt: die Auswahl bietet die zur
 * Kategorie passenden Bestände (Angehörige, Kontakte). Notfallkontakt und
 * Auskunftsberechtigung sind Merkmale, keine Rollen.
 *
 * Gruppierung und Dialog laufen über die KATEGORIE (kategorieFuerRolle), nicht
 * über `rolleSeite`. Der Dialog fragt zuerst die Kategorie, dann die Rolle —
 * die Rolle wird nie aus einem indirekten Signal abgeleitet.
 *
 * Die Kategorie „Benutzer" (Spitex-Mitarbeitende) ist im Dialog NICHT anlegbar,
 * solange kein Personalbestand vorliegt. Bestehende Benutzer-Beziehungen aus dem
 * Seed werden weiterhin angezeigt und lassen sich bearbeiten.
 *
 * Die Rolle `pflegende_angehoerige` wird hier NICHT angeboten — sie entsteht aus
 * dem Angehörigen-Reiter und ist in der Liste nur einsehbar (Verwandtschaft und
 * Merkmale bleiben editierbar).
 */
import { useState } from "react";
import { Plus, Check, AlertTriangle, MoreVertical, ArrowRight, Stethoscope, Users } from "lucide-react";
import { useFensterBreite } from "../ui/DataTable";
import { InlineSelect } from "../ui/InlineSelect";
import { KontaktWahl } from "../ui/KontaktWahl";
import { AppButton } from "../ui/AppButton";
import { GEGENWART } from "../../../lib/gegenwart";
import { formatAnzeige } from "../../../lib/datum";
import { useBeziehungen, beziehungSichern, beziehungEntfernen, sichereEindeutigenHausarzt } from "../../../lib/beziehungen/store";
import { useAngehoerige } from "../../../lib/angehoerige/store";
import { useKontakte, kontaktSichern } from "../../../lib/kontakte/store";
import { kontaktName } from "../../../lib/kontakte/kontakte";
import type { KontaktFeldsatz } from "../ui/KontaktWahl";
import type { KontakttypCode } from "../../../lib/stammdaten/kontakttypen";
import {
  BEZIEHUNGSROLLE, BEZIEHUNGSART, BEISTANDSCHAFT_ARTEN, KATEGORIEN, ROLLEN_JE_KATEGORIE,
  rolleSeite, rolleLabel, artLabel, zugehoerigkeitLabel, personName,
  kategorieFuerRolle, kategorieLabel, personentypFuerRolle, leereBeistandschaft, beistandschaftLabels, istBeistandschaftErfasst,
  istAktiv as beziehungAktiv,
  type Beziehung, type PersonBezug, type PersonKategorie, type BeziehungsrolleCode, type Beistandschaft,
} from "../../../lib/beziehungen/beziehungen";

/** Vortag der Gegenwart im Anzeigeformat — für das Beenden beim Hausarzt-Wechsel. */
function vortagGegenwart(): string {
  const d = new Date(GEGENWART);
  d.setDate(d.getDate() - 1);
  return formatAnzeige(d);
}

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
  const zugVon = (b: Beziehung) => {
    const p = b.person;
    if (p.art !== "kontakt") return "";
    const k = kontakte.find(x => x.id === p.kennung);
    // Fachgebiet zuerst (Fachpersonal), sonst Stelle/Behörde, sonst Organisation.
    return (k?.fachgebiet || k?.zugehoerigkeit || k?.organisation || "").trim();
  };

  const eigene = alle.filter(b => b.patientId === patientId);
  // Die Kategorie „Benutzer" (Spitex-Mitarbeitende) erscheint hier nicht mehr —
  // die Zuweisung läuft über ein eigenes Feld.
  const sichtbare = eigene.filter(b => kategorieFuerRolle(b.rolle) !== "benutzer");

  // Gruppierung über die Kategorie (kategorieFuerRolle), nicht über rolleSeite.
  const gruppen = KATEGORIEN.filter(k => k.code !== "benutzer").map(({ code, labelPlural }) => {
    const inGruppe = sichtbare.filter(b => kategorieFuerRolle(b.rolle) === code);
    const aktive = inGruppe.filter(beziehungAktiv).sort((a, b) =>
      (Number(b.notfallkontakt) - Number(a.notfallkontakt)) || (ROLLE_RANG[a.rolle] - ROLLE_RANG[b.rolle]));
    const beendete = inGruppe.filter(b => !beziehungAktiv(b));
    // Gruppenüberschrift im Plural.
    return { code, label: labelPlural, zeilen: [...aktive, ...beendete] };
  }).filter(g => g.zeilen.length > 0);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums" }}>{sichtbare.length} {sichtbare.length === 1 ? "Person" : "Personen"}</span>
        <button type="button" onClick={() => setDialog({ id: "" })} className="ui-fokusring inline-flex items-center" style={{ ...linkStyle, marginLeft: "auto", gap: 4 }}>
          <Plus style={{ width: 14, height: 14 }} /> Hinzufügen
        </button>
      </div>

      {gruppen.length === 0 && (
        <div style={{ fontSize: 13, color: "var(--text-tertiary)", padding: "8px 0 12px" }}>Noch keine Person erfasst.</div>
      )}

      {gruppen.map(({ code, label, zeilen }) => (
        <div key={code} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 8 }}>{label}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {zeilen.map(b => (
              <Zeile key={b.id} b={b} name={personName(b, nameVon, kontaktVon)} zugehoerigkeit={zugVon(b)}
                menuOffen={menuId === b.id} onMenu={() => setMenuId(menuId === b.id ? null : b.id)}
                angehoerigenReiterPfad={angehoerigenReiterPfad}
                onBearbeiten={() => { setMenuId(null); setDialog({ id: b.id }); }}
                onEntfernen={() => { beziehungEntfernen(b.id); setMenuId(null); }} />
            ))}
          </div>
        </div>
      ))}

      {dialog && (
        <PersonDialog patientId={patientId} eintragId={dialog.id}
          eigene={eigene} angehoerige={angehoerige} kontakte={kontakte}
          onClose={() => setDialog(null)} />
      )}
    </div>
  );
}

function Zeile({ b, name, zugehoerigkeit, menuOffen, onMenu, onBearbeiten, onEntfernen, angehoerigenReiterPfad }: {
  b: Beziehung; name: string; zugehoerigkeit: string; menuOffen: boolean;
  onMenu: () => void; onBearbeiten: () => void; onEntfernen: () => void; angehoerigenReiterPfad?: string;
}) {
  const aktiv = beziehungAktiv(b);
  const gepflegt = b.rolle === "pflegende_angehoerige"; // aus dem Angehörigen-Reiter
  // Lauf 1c (G/I): unter 1024px trägt der Kartenkopf nur Name + Menü; die
  // Chips fliessen in einer eigenen Zeile unter den Angaben. Desktop unverändert.
  const istSchmal = useFensterBreite() < 1024;
  const chips = (
    <>
      <Chip>{rolleLabel(b.rolle)}</Chip>
      {b.notfallkontakt && <Chip ton="warnung">Notfallkontakt</Chip>}
      {b.auskunftsberechtigt && <Chip ton="info">Auskunftsberechtigt</Chip>}
      {!aktiv && <Chip>beendet</Chip>}
    </>
  );
  const detail = [
    b.rolle === "beistand"
      ? (istBeistandschaftErfasst(b.beistandschaft) ? beistandschaftLabels(b.beistandschaft).join(", ") : "Umfang nicht erfasst")
      : rolleSeite(b.rolle) === "extern" ? zugehoerigkeit : (b.art ? artLabel(b.art) : ""),
    b.telefon,
    b.beginn ? `seit ${b.beginn}${b.ende ? ` bis ${b.ende}` : ""}` : b.ende ? `bis ${b.ende}` : "",
  ].filter(Boolean);

  return (
    <div style={{ border: "0.5px solid var(--border-default)", borderRadius: 12, padding: "10px 14px", background: "var(--bg-elevated)", opacity: aktiv ? 1 : 0.6 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)", minWidth: 0 }}>{name}</span>
        {!istSchmal && chips}
        <div style={{ marginLeft: "auto", position: "relative", flexShrink: 0 }}>
          <button type="button" aria-label="Aktionen" onClick={onMenu} className="ui-fokusring inline-flex items-center justify-center"
            style={{ width: 28, height: 28, borderRadius: 999, border: "none", background: "transparent", color: "var(--text-tertiary)", cursor: "pointer" }}>
            <MoreVertical style={{ width: 16, height: 16 }} />
          </button>
          {menuOffen && (
            <div role="menu" style={{ position: "absolute", right: 0, top: "100%", marginTop: 4, zIndex: 30, minWidth: 150, padding: 4, background: "var(--bg-elevated)", border: "0.5px solid var(--border-default)", borderRadius: 12, boxShadow: "var(--shadow-overlay)" }}>
              <button type="button" role="menuitem" onClick={onBearbeiten} className="ui-fokusring" style={menuItemStyle}>Bearbeiten</button>
              {/* Entfernen (löschen) nur bei nicht-gepflegten Beziehungen — die
                  pflegende Angehörige wird im Angehörigen-Reiter geführt. */}
              {!gepflegt && <button type="button" role="menuitem" onClick={onEntfernen} className="ui-fokusring" style={{ ...menuItemStyle, color: "var(--status-danger)" }}>Entfernen</button>}
            </div>
          )}
        </div>
      </div>
      {detail.length > 0 && (
        <div style={{ marginLeft: 2, marginTop: 6, fontSize: 12, color: "var(--text-tertiary)", display: "flex", flexWrap: "wrap", gap: "2px 16px" }}>
          {detail.map((d, i) => <span key={i}>{d}</span>)}
        </div>
      )}
      {/* I: Chips fliessen unter den Angaben in einer Zeile mit Umbruch */}
      {istSchmal && (
        <div className="m1-chips-fliessen" style={{ marginTop: 6 }}>
          {chips}
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

// ── Dialog: erst Kategorie, dann Rolle, dann rollenabhängige Angaben ──────────

const KATEGORIE_KARTEN: { code: PersonKategorie; titel: string; text: string; icon: typeof Stethoscope }[] = [
  { code: "fachpersonal", titel: "Medizinisches Fachpersonal", text: "Hausarzt, Spezialarzt, Therapie, Apotheke, Spital oder Klinik.", icon: Stethoscope },
  { code: "bezugsperson", titel: "Bezugsperson", text: "Angehörige, Beistand, Sozialdienst, weitere.", icon: Users },
];

function PersonDialog({ patientId, eintragId, eigene, angehoerige, kontakte, onClose }: {
  patientId: string; eintragId: string;
  eigene: Beziehung[];
  angehoerige: ReturnType<typeof useAngehoerige>;
  kontakte: ReturnType<typeof useKontakte>;
  onClose: () => void;
}) {
  const eintrag = eintragId ? eigene.find(b => b.id === eintragId) ?? null : null;
  const gepflegt = eintrag?.rolle === "pflegende_angehoerige";
  const editKategorie = eintrag ? kategorieFuerRolle(eintrag.rolle) : "";

  const [kategorie, setKategorie] = useState<PersonKategorie | "">(editKategorie);
  const [rolle, setRolle] = useState<string>(eintrag?.rolle ?? "");
  const [beistandTyp, setBeistandTyp] = useState<"privat" | "organisation">(
    eintrag?.rolle === "beistand" && eintrag.person.art === "kontakt" ? "organisation" : "privat");
  // Eine Personenauswahl (Kontakt ODER Angehörige) statt zweier Auswahlfelder.
  const [person, setPerson] = useState<PersonBezug | null>(eintrag ? eintrag.person : null);
  const [art, setArt] = useState<string>(eintrag?.art ?? "");
  const [beistandschaft, setBeistandschaft] = useState<Beistandschaft>(eintrag?.beistandschaft ?? leereBeistandschaft());
  const [notfall, setNotfall] = useState(eintrag?.notfallkontakt ?? false);
  const [auskunft, setAuskunft] = useState(eintrag?.auskunftsberechtigt ?? false);
  const [fehler, setFehler] = useState("");

  /* §9 Behebung: beim Bearbeiten einer Fachperson die GLN des bestehenden
     Kontakts ergänzen — der einzige Ort, an dem eine schon erfasste Fachperson
     ihre GLN nachträglich bekommt. */
  const eintragKontaktId = eintrag && eintrag.person.art === "kontakt" ? eintrag.person.kennung : "";
  const bearbeiteterKontakt = eintragKontaktId ? kontakte.find(k => k.id === eintragKontaktId) : undefined;
  const [glnEdit, setGlnEdit] = useState(bearbeiteterKontakt?.gln ?? "");
  const glnEditOk = /^\d{13}$/.test(glnEdit.trim());

  const rollenWaehlbar: BeziehungsrolleCode[] = kategorie ? ROLLEN_JE_KATEGORIE[kategorie] : [];

  // Personentyp je Rolle (Einzelquelle); nur beim Beistand entscheidet der Umschalter.
  const istBenutzerEintrag = !!eintrag && kategorieFuerRolle(eintrag.rolle) === "benutzer";
  const gesperrt = gepflegt || istBenutzerEintrag; // Person nicht wählbar (Seed/Mitarbeitende)
  const typ = rolle ? personentypFuerRolle(rolle as BeziehungsrolleCode) : "";
  const orgTyp = typ === "organisation" || (typ === "umschalter" && beistandTyp === "organisation");
  const zeigtAngehoerige = kategorie === "bezugsperson" && !orgTyp;

  // Feldsatz und Kontakttyp für den Anlege-Block.
  const feldsatz: KontaktFeldsatz = orgTyp ? "organisation" : kategorie === "fachpersonal" ? "fachpersonal" : "privat";
  const kontaktTyp: KontakttypCode = kategorie === "fachpersonal" ? "arztpraxis"
    : !orgTyp ? "privatperson"
    : rolle === "beistand" ? "behoerde" : "sozialdienst";

  // Ausgewählte Person: gesperrte Fälle aus dem Eintrag, sonst aus der Auswahl.
  const gewaehltePerson: PersonBezug | null = gesperrt ? (eintrag?.person ?? null) : person;

  // §3: besteht bereits ein offener Hausarzt? Der bisherige wird beim Speichern beendet.
  const bestehenderHausarzt = rolle === "hausarzt"
    ? eigene.find(b => b.id !== eintragId && beziehungAktiv(b) && b.rolle === "hausarzt")
    : undefined;

  // Telefon der gewählten Person (jetzt an der Person, nicht an der Beziehung).
  const personTelefon = gewaehltePerson?.art === "angehoeriger" ? (angehoerige.find(a => a.id === gewaehltePerson.kennung)?.telefon ?? "")
    : gewaehltePerson?.art === "kontakt" ? (kontakte.find(k => k.id === gewaehltePerson.kennung)?.telefon ?? "") : "";
  const personName_ = !gewaehltePerson ? "" : gewaehltePerson.art === "angehoeriger"
    ? (() => { const a = angehoerige.find(x => x.id === gewaehltePerson.kennung); return a ? `${a.vorname} ${a.nachname}` : ""; })()
    : gewaehltePerson.art === "kontakt"
      ? (() => { const k = kontakte.find(x => x.id === gewaehltePerson.kennung); return k ? kontaktName(k) : ""; })()
      : "";

  const kategorieWaehlen = (c: PersonKategorie) => {
    setKategorie(c); setRolle(""); setPerson(null); setArt(""); setBeistandschaft(leereBeistandschaft()); setFehler("");
  };
  const rolleWaehlen = (r: string) => { setRolle(r); setFehler(""); };

  const sichern = () => {
    if (!gepflegt) {
      if (!kategorie) { setFehler("Bitte eine Kategorie wählen."); return; }
      if (!rolle) { setFehler(kategorie === "fachpersonal" ? "Bitte eine Funktion wählen." : "Bitte eine Rolle wählen."); return; }
      if (!gewaehltePerson) { setFehler("Bitte eine Person suchen oder erfassen."); return; }
    }
    const zielPerson: PersonBezug = gepflegt ? eintrag!.person : gewaehltePerson!;
    const zielRolle = gepflegt ? eintrag!.rolle : (rolle as Beziehung["rolle"]);
    // Keine zweite offene Beziehung derselben Rolle für dieselbe Person.
    const doppelt = eigene.some(b => b.id !== eintragId && beziehungAktiv(b) && b.rolle === zielRolle
      && personSchluessel(b.person) === personSchluessel(zielPerson));
    if (doppelt) { setFehler("Diese Person hat diese Rolle bereits."); return; }

    // §9: GLN am bestehenden Kontakt nachtragen, wenn im Bearbeiten geändert.
    if (bearbeiteterKontakt && glnEdit.trim() !== (bearbeiteterKontakt.gln ?? "")) {
      kontaktSichern({ ...bearbeiteterKontakt, gln: glnEdit.trim() ? glnEdit.trim() : null });
    }

    const gespeichert = beziehungSichern({
      id: eintragId, patientId, person: zielPerson, rolle: zielRolle,
      // Verwandtschaft nur bei privaten Bezugspersonen (Angehörige/weitere/Beistand privat).
      art: zeigtAngehoerige ? (art as Beziehung["art"]) : "",
      // Beistandschaft nur bei der Rolle beistand; sonst leer.
      beistandschaft: zielRolle === "beistand" ? beistandschaft : leereBeistandschaft(),
      // Beginn und Telefon werden im Dialog nicht mehr erfasst; Seed-Werte bleiben.
      beginn: eintrag?.beginn ?? "", ende: eintrag?.ende ?? "",
      telefon: eintrag?.telefon ?? "",
      notfallkontakt: notfall, auskunftsberechtigt: auskunft,
      bemerkung: eintrag?.bemerkung ?? "",
    });
    // §3: höchstens ein offener Hausarzt — der bisherige wird auf den Vortag beendet.
    if (zielRolle === "hausarzt") sichereEindeutigenHausarzt(patientId, gespeichert.id, vortagGegenwart());
    onClose();
  };

  const funktionLabel = kategorie === "fachpersonal" ? "Funktion" : "Rolle";

  return (
    <div role="dialog" aria-modal="true" aria-label={eintrag ? "Beziehung bearbeiten" : "Eintrag hinzufügen"} onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(19,19,20,0.28)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 540, maxWidth: "100%", maxHeight: "88vh", overflowY: "auto", background: "var(--bg-elevated)", borderRadius: 12, border: "0.5px solid var(--border-default)", boxShadow: "var(--shadow-overlay)" }}>
        <div style={{ padding: "16px 20px 8px", fontSize: 16, fontWeight: 500, color: "var(--text-primary)" }}>{eintrag ? "Beziehung bearbeiten" : "Eintrag hinzufügen"}</div>
        <div style={{ padding: "8px 20px 16px", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Schritt 1: Kategorie — nur beim Neuanlegen. */}
          {!eintrag && !kategorie && (
            <Feld label="Kategorie">
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {KATEGORIE_KARTEN.map(k => {
                  const Icon = k.icon;
                  return (
                    <button key={k.code} type="button" onClick={() => kategorieWaehlen(k.code)} className="ui-fokusring"
                      style={{ display: "flex", alignItems: "flex-start", gap: 12, textAlign: "left", padding: "12px 14px", borderRadius: 12, cursor: "pointer",
                        background: "var(--bg-elevated)", border: "0.5px solid var(--border-default)", fontFamily: "inherit" }}>
                      <Icon style={{ width: 18, height: 18, color: "var(--brand-primary)", flexShrink: 0, marginTop: 1 }} />
                      <span>
                        <span style={{ display: "block", fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>{k.titel}</span>
                        <span style={{ display: "block", fontSize: 12, color: "var(--text-tertiary)", marginTop: 2 }}>{k.text}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </Feld>
          )}

          {/* Ab hier: Kategorie steht fest (gewählt oder aus dem Eintrag). */}
          {(kategorie || eintrag) && (
            <>
              {/* Kategorie-Kontext + ändern (nur beim Neuanlegen wechselbar) */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Kategorie:</span>
                <Chip>{kategorieLabel((kategorie || editKategorie) as PersonKategorie)}</Chip>
                {!eintrag && (
                  <button type="button" onClick={() => { setKategorie(""); setRolle(""); }} className="ui-fokusring" style={linkStyle}>ändern</button>
                )}
              </div>

              {/* Person (gepflegte/Benutzer-Beziehung: gesperrt) */}
              {gesperrt ? (
                <Feld label="Person">
                  <div style={{ fontSize: 14, color: "var(--text-primary)" }}>
                    {personName(eintrag!, k => { const a = angehoerige.find(x => x.id === k); return a ? `${a.vorname} ${a.nachname}` : k; }, k => { const t = kontakte.find(x => x.id === k); return t ? kontaktName(t) : k; })}
                    {gepflegt && <span style={{ fontSize: 12, color: "var(--status-info)", marginLeft: 8 }}>im Angehörigen-Reiter gepflegt</span>}
                    {istBenutzerEintrag && <span style={{ fontSize: 12, color: "var(--text-tertiary)", marginLeft: 8 }}>Spitex-Mitarbeitende</span>}
                  </div>
                </Feld>
              ) : null}

              {/* Rolle / Funktion — sichtbare Auswahl */}
              {!gepflegt && (
                <Feld label={funktionLabel}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {rollenWaehlbar.map(code => {
                      const sel = rolle === code;
                      return (
                        <button key={code} type="button" onClick={() => rolleWaehlen(code)} aria-pressed={sel} className="ui-fokusring"
                          style={{ padding: "6px 12px", borderRadius: 12, fontFamily: "inherit", fontSize: 13, cursor: "pointer",
                            background: sel ? "var(--brand-primary-light)" : "var(--bg-elevated)", color: sel ? "var(--brand-primary)" : "var(--text-primary)",
                            border: "0.5px solid " + (sel ? "var(--brand-primary)" : "var(--border-default)"), boxShadow: sel ? "inset 0 0 0 1px var(--brand-primary)" : "none" }}>
                          {rolleLabel(code)}
                        </button>
                      );
                    })}
                  </div>
                </Feld>
              )}

              {/* Beistand: Personentyp — die einzige Rolle, die beides sein kann. */}
              {!gepflegt && rolle === "beistand" && (
                <Feld label="Personentyp">
                  <div style={{ display: "flex", gap: 8 }}>
                    {(["privat", "organisation"] as const).map(t => {
                      const sel = beistandTyp === t;
                      return (
                        <button key={t} type="button" onClick={() => { setBeistandTyp(t); setPerson(null); }} aria-pressed={sel} className="ui-fokusring"
                          style={{ padding: "6px 12px", borderRadius: 12, fontFamily: "inherit", fontSize: 13, cursor: "pointer",
                            background: sel ? "var(--brand-primary-light)" : "var(--bg-elevated)", color: sel ? "var(--brand-primary)" : "var(--text-primary)",
                            border: "0.5px solid " + (sel ? "var(--brand-primary)" : "var(--border-default)") }}>
                          {t === "privat" ? "Privatperson" : "Organisation"}
                        </button>
                      );
                    })}
                  </div>
                </Feld>
              )}

              {/* Ein Suchfeld über Kontakte (und im privaten Modus Angehörige).
                  Das Feldlabel trägt die KontaktWahl selbst — keine zweite
                  Abschnittsüberschrift darüber. */}
              {!gesperrt && rolle && (
                <KontaktWahl person={person} onChange={setPerson}
                  feldsatz={feldsatz} kontaktTyp={kontaktTyp}
                  angehoerige={angehoerige.map(a => ({ id: a.id, vorname: a.vorname, nachname: a.nachname }))}
                  zeigtAngehoerige={zeigtAngehoerige}
                  abteilungLabel={zugehoerigkeitLabel(rolle)} />
              )}

              {/* §3 Hausarzt eindeutig: Hinweis, dass der bisherige beendet wird. */}
              {!gesperrt && bestehenderHausarzt && (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", borderRadius: 12, background: "var(--status-warning-bg)", border: "0.5px solid var(--border-default)" }}>
                  <AlertTriangle style={{ width: 15, height: 15, color: "var(--status-warning-text)", flexShrink: 0, marginTop: 1 }} />
                  <span style={{ flex: 1, fontSize: 13, color: "var(--text-secondary)" }}>
                    Es besteht bereits ein Hausarzt ({personName(bestehenderHausarzt, k => { const a = angehoerige.find(x => x.id === k); return a ? `${a.vorname} ${a.nachname}` : k; }, k => { const t = kontakte.find(x => x.id === k); return t ? kontaktName(t) : k; })}). Er wird beim Speichern beendet — es ist höchstens ein Hausarzt zugleich zulässig.
                  </span>
                </div>
              )}

              {/* Verwandtschaft nur bei privaten Bezugspersonen */}
              {zeigtAngehoerige && (
                <Feld label="Verwandtschaft">
                  <InlineSelect value={art} onChange={setArt} platzhalter="nicht erfasst" options={BEZIEHUNGSART.map(a => ({ value: a.code, label: a.label }))} />
                </Feld>
              )}
              {/* Beistandschaft — drei gleichzeitig setzbare Arten, nur beim Beistand */}
              {rolle === "beistand" && (
                <Feld label="Beistandschaft, falls vorhanden">
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {BEISTANDSCHAFT_ARTEN.map(a => (
                      <Umschalter key={a.code} an={beistandschaft[a.code]} text={a.label}
                        onToggle={() => setBeistandschaft({ ...beistandschaft, [a.code]: !beistandschaft[a.code] })} />
                    ))}
                  </div>
                  <div style={{ marginTop: 6, fontSize: 12, color: "var(--text-tertiary)" }}>Gesundheit entscheidet, wer einer Behandlung zustimmen darf.</div>
                </Feld>
              )}

              {/* §9 Behebung: GLN einer schon erfassten Fachperson nachtragen */}
              {eintrag && editKategorie === "fachpersonal" && bearbeiteterKontakt && (
                <Feld label="GLN">
                  <input type="text" value={glnEdit} onChange={e => setGlnEdit(e.target.value)} inputMode="numeric" className="ui-fokusring" style={inputStil} placeholder="13-stellig" />
                  {glnEdit.trim() && (
                    <div style={{ marginTop: 4, fontSize: 12, color: glnEditOk ? "var(--status-success-text)" : "var(--status-warning-text)" }}>
                      {glnEditOk ? "Format gültig (13 Stellen)." : `Noch keine 13 Stellen (${glnEdit.trim().replace(/\D/g, "").length}).`}
                    </div>
                  )}
                </Feld>
              )}

              {/* Merkmale */}
              <Feld label="Merkmale">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <Umschalter an={notfall} onToggle={() => setNotfall(!notfall)} text="Notfallkontakt" />
                  <Umschalter an={auskunft} onToggle={() => setAuskunft(!auskunft)} text="Auskunftsberechtigt" />
                </div>
              </Feld>

              {/* Kein zweites Telefonfeld: die Nummer lebt an der Person. Fehlt sie,
                  nur ein Hinweis mit Verweis auf die Person. */}
              {gewaehltePerson && !personTelefon && (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", borderRadius: 12, background: "var(--status-warning-bg)", border: "0.5px solid var(--border-default)" }}>
                  <AlertTriangle style={{ width: 15, height: 15, color: "var(--status-warning-text)", flexShrink: 0, marginTop: 1 }} />
                  <span style={{ flex: 1, fontSize: 13, color: "var(--text-secondary)" }}>
                    {personName_ || "Diese Person"} trägt keine Telefonnummer. Sie wird bei der Person erfasst
                    {gewaehltePerson.art === "angehoeriger" ? " (Angehörigen-Reiter)." : gewaehltePerson.art === "kontakt" ? " (Kontakt bearbeiten)." : "."}
                  </span>
                </div>
              )}
            </>
          )}

          {fehler && <div role="alert" style={{ fontSize: 12, color: "var(--status-warning-text)" }}>{fehler}</div>}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, padding: "12px 20px", borderTop: "0.5px solid var(--border-default)" }}>
          <button type="button" onClick={onClose} className="ui-fokusring" style={{ ...linkStyle, color: "var(--text-secondary)" }}>Abbrechen</button>
          {(kategorie || eintrag) && <AppButton variant="primaer" onClick={sichern}>Sichern</AppButton>}
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
