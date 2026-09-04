/**
 * Allergien und Unverträglichkeiten — DIE eine Komponente für alle Einbauorte
 * (Lauf A: Patientenansicht Medikation; Lauf B: weitere Stellen, unverändert).
 *
 * Zwei Entscheidungen tragen das Design:
 * - Die ERHEBUNG ist ein Zustand der Liste, kein Eintrag darin. «Nicht erfragt»
 *   steht im Kopf, nie als Pseudo-Zeile.
 * - Die SUBSTANZ kommt aus dem Katalog; Freitext ist der sichtbar markierte
 *   Ausweg und trägt seine Konsequenz auf der Zeile («keine Prüfung auf
 *   Wechselwirkungen»).
 *
 * Der Begriff «Intoleranz» erscheint nirgends in der Oberfläche —
 * durchgängig «Unverträglichkeit».
 *
 * Widerlegte und irrtümlich erfasste Einträge werden NIE gelöscht oder
 * versteckt, nur hinter einen zugeklappten Bereich gelegt: eine widerlegte
 * Allergie erspart der nächsten Pflegefachperson dieselbe Abklärung.
 */
import { useMemo, useRef, useState } from "react";
import { Plus, Check, ChevronDown, ChevronRight, ShieldAlert } from "lucide-react";
import { AppButton } from "../ui/AppButton";
import { isoZuAnzeige } from "../../../lib/datum";
import {
  ALLERGIE_KATALOG, type AllergieKatalogEintrag, type AllergieKategorie, type AllergieArt,
} from "../../../lib/allergien/allergie-katalog-seed";
import {
  useAllergien, useAllergieErhebungen, allergieSichern, allergieErhebungSetzen,
  getAllergieErhebung, ANGEMELDETE_PFLEGEFACHPERSON, MOCK_DOKUMENT_QUELLEN,
  type Allergie, type AllergieErhebungZustand, type AllergieKritikalitaet,
  type AllergieVerifikation, type AllergieBehauptetVonTyp,
} from "../../../lib/allergien/store";
import { useBeziehungen } from "../../../lib/beziehungen/store";
import { kategorieFuerRolle, istAktiv as beziehungAktiv } from "../../../lib/beziehungen/beziehungen";
import { useAngehoerige } from "../../../lib/angehoerige/store";
import { useKontakte } from "../../../lib/kontakte/store";
import { kontaktName } from "../../../lib/kontakte/kontakte";
import { useDokumente } from "../../../lib/dokumente/store";
import { dokumenteVon } from "../../../lib/dokumente/dokumente";

/* ── Beschriftungen (Code gespeichert, Beschriftung nur hier) ─────────────── */

const KATEGORIE_LABEL: Record<AllergieKategorie, string> = {
  medication: "Arzneimittel", environment: "Umwelt", food: "Nahrungsmittel", biological: "Biologisch",
};
const TYP_LABEL: Record<AllergieArt, string> = { allergy: "Allergie", intolerance: "Unverträglichkeit" };
const KRIT_LABEL: Record<AllergieKritikalitaet, string> = {
  low: "Gering", high: "Hoch", "unable-to-assess": "Nicht beurteilbar",
};
/** Zeichen statt Farbe: die Kritikalität ist nie nur über Farbe unterscheidbar. */
const KRIT_ZEICHEN: Record<AllergieKritikalitaet, string> = { high: "▲", low: "●", "unable-to-assess": "○" };
const VERIF_LABEL: Record<AllergieVerifikation, string> = {
  unconfirmed: "Unbestätigt", confirmed: "Bestätigt", refuted: "Widerlegt", "entered-in-error": "Irrtümlich erfasst",
};
const ZUSTAND_LABEL: Record<AllergieErhebungZustand, string> = {
  nicht_begonnen: "Noch nicht erhoben", keine_bekannt: "Keine bekannt", nicht_erfragt: "Nicht erfragt",
  nicht_verfuegbar: "Nicht verfügbar", zurueckgehalten: "Zurückgehalten", abgeschlossen: "Erhebung abgeschlossen",
};
const WARN_ZUSTAENDE: AllergieErhebungZustand[] = ["nicht_erfragt", "nicht_verfuegbar", "zurueckgehalten"];

const HERKUNFT_LABEL: Record<AllergieBehauptetVonTyp, string> = {
  klientin: "Selbstauskunft der Klientin", angehoerige: "Angehörige",
  fachperson: "Gesundheitsfachperson", dokument: "Dokument",
};

/* ── Komponente ───────────────────────────────────────────────────────────── */

export function AllergienAbschnitt({ patientId }: { patientId: string }) {
  const alle = useAllergien().filter(a => a.patientId === patientId);
  const erhebung = useAllergieErhebungen().find(e => e.patientId === patientId)
    ?? getAllergieErhebung(patientId);

  const beziehungen = useBeziehungen().filter(b => b.patientId === patientId && beziehungAktiv(b));
  const angehoerige = useAngehoerige();
  const kontakte = useKontakte();
  const dokumente = useDokumente();

  const [dialog, setDialog] = useState<{ eintrag: Allergie | null } | null>(null);
  const [zustandsdialog, setZustandsdialog] = useState(false);
  const [aussortiertOffen, setAussortiertOffen] = useState(false);

  const aktive = alle.filter(a => a.verifikationsstatus !== "refuted" && a.verifikationsstatus !== "entered-in-error");
  const aussortierte = alle.filter(a => a.verifikationsstatus === "refuted" || a.verifikationsstatus === "entered-in-error");

  /** Herkunfts-Beschriftung einer Zeile: wer es behauptet, plus Datum. */
  const herkunftVon = (a: Allergie): string => {
    let quelle = HERKUNFT_LABEL[a.behauptetVonTyp];
    if (a.behauptetVonTyp === "angehoerige" && a.behauptetVonId) {
      const p = angehoerige.find(x => x.id === a.behauptetVonId);
      if (p) quelle = `${p.vorname} ${p.nachname} (Angehörige)`;
    }
    if (a.behauptetVonTyp === "fachperson" && a.behauptetVonId) {
      const k = kontakte.find(x => x.id === a.behauptetVonId);
      if (k) quelle = kontaktName(k);
    }
    if (a.behauptetVonTyp === "dokument" && a.behauptetVonDokumentId) {
      const d = dokumente.find(x => x.id === a.behauptetVonDokumentId);
      const m = MOCK_DOKUMENT_QUELLEN.find(x => x.id === a.behauptetVonDokumentId);
      quelle = d?.bezeichnung ?? m?.label ?? quelle;
    }
    const datum = a.identifiziertAm ?? a.erstelltAm;
    return `${quelle}, ${isoZuAnzeige(datum)}`;
  };

  const zustand = erhebung.allergieErhebung;
  const warn = WARN_ZUSTAENDE.includes(zustand);
  const stempel = erhebung.allergieErhebungAm
    ? `${isoZuAnzeige(erhebung.allergieErhebungAm)}${erhebung.allergieErhebungVonName ? `, ${erhebung.allergieErhebungVonName}` : ""}`
    : "";

  const kopfText = zustand === "keine_bekannt"
    ? `Keine bekannten Allergien${stempel ? ` · erhoben ${stempel}` : ""}`
    : `${ZUSTAND_LABEL[zustand]}${stempel ? ` · ${stempel}` : ""}`;

  return (
    <div className="bg-card rounded-2xl border border-border">
      {/* minHeight = Knopfhöhe + Innenabstand: die Überschrift springt nicht,
          wenn der Erfassen-Knopf (Zustand «nicht begonnen») fehlt. */}
      <div className="px-5 py-4 border-b border-border-light flex items-center gap-2" style={{ minHeight: "calc(var(--control-height) + 32px)" }}>
        <ShieldAlert className="w-4 h-4 text-primary" />
        <h5 className="text-foreground flex-1">Allergien und Unverträglichkeiten</h5>
        {zustand !== "nicht_begonnen" && (
          <AppButton variant="primaer" icon={Plus} onClick={() => setDialog({ eintrag: null })}>Eintrag erfassen</AppButton>
        )}
      </div>
      <div className="p-5">

        {/* Kopfzeile: der Erhebungszustand — eine Aussage über die Erhebung,
            nie eine Pseudo-Zeile in der Liste. */}
        {zustand !== "nicht_begonnen" && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
            padding: "8px 12px", borderRadius: 10, marginBottom: 14,
            background: warn ? "var(--status-warning-bg)" : "var(--bg-secondary)",
            border: "0.5px solid var(--border-default)",
          }}>
            <span style={{ flex: 1, minWidth: 160, fontSize: 13, fontWeight: 500,
              color: warn ? "var(--status-warning-text)" : "var(--text-secondary)" }}>
              {kopfText}
            </span>
            <button type="button" onClick={() => setZustandsdialog(true)} className="ui-fokusring"
              style={{ background: "none", border: "none", padding: 0, fontFamily: "inherit", fontSize: 12, fontWeight: 500, color: "var(--brand-accent)", cursor: "pointer" }}>
              ändern
            </button>
          </div>
        )}

        {/* Leerzustand «Noch nicht erhoben» — ein Arbeitsauftrag, kein Ergebnis. */}
        {zustand === "nicht_begonnen" && aktive.length === 0 && (
          <div style={{ border: "1px dashed var(--border-default)", borderRadius: 12, padding: "20px 20px 18px" }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>Noch nicht erhoben</div>
            <p style={{ margin: "6px 0 14px", fontSize: 13, color: "var(--text-secondary)", maxWidth: "62ch" }}>
              Fragen Sie die Klientin, ob Allergien oder Unverträglichkeiten bekannt sind.
              Auch ein Nein wird festgehalten — es ist eine klinische Aussage.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <AppButton variant="primaer" icon={Plus} onClick={() => setDialog({ eintrag: null })}>Eintrag erfassen</AppButton>
              <button type="button" className="ui-fokusring" style={leiseAktion}
                onClick={() => allergieErhebungSetzen(patientId, "keine_bekannt", ANGEMELDETE_PFLEGEFACHPERSON.name)}>
                Keine bekannt
              </button>
              <button type="button" className="ui-fokusring" style={leiseAktion} onClick={() => setZustandsdialog(true)}>
                Anders …
              </button>
            </div>
          </div>
        )}

        {/* Leerzustand «Keine bekannt» — ein geprüftes Ergebnis, ruhig dargestellt. */}
        {zustand === "keine_bekannt" && aktive.length === 0 && (
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "16px 4px 4px" }}>
            <Check style={{ width: 16, height: 16, color: "var(--status-success-text)", flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>Kein Eintrag vorhanden</div>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-secondary)", maxWidth: "62ch" }}>
                Die Klientin hat bestätigt, dass ihr keine Allergien oder Unverträglichkeiten bekannt sind.
              </p>
            </div>
          </div>
        )}

        {/* Leerzustände der Warn-Zustände — eine Lücke, kein Ergebnis. */}
        {warn && aktive.length === 0 && (
          <div style={{ padding: "16px 4px 4px" }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>Kein Eintrag vorhanden</div>
            {zustand === "nicht_verfuegbar" && (
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-secondary)", maxWidth: "62ch" }}>
                Die Angaben liessen sich nicht beschaffen. Der Allergiestatus gilt als unbekannt, nicht als leer.
              </p>
            )}
            {zustand === "zurueckgehalten" && (
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-secondary)", maxWidth: "62ch" }}>
                Die Klientin hat verlangt, dass ihre Allergieangaben nicht dokumentiert werden.
              </p>
            )}
          </div>
        )}

        {/* Hauptliste — starke Erstzeile, keine Tabelle. */}
        {aktive.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {aktive.map(a => (
              <Zeile key={a.id} a={a} herkunft={herkunftVon(a)} onBearbeiten={() => setDialog({ eintrag: a })} />
            ))}
          </div>
        )}

        {/* Widerlegte und irrtümlich erfasste: zugeklappt, nie gelöscht. */}
        {aussortierte.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <button type="button" className="ui-fokusring inline-flex items-center" aria-expanded={aussortiertOffen}
              onClick={() => setAussortiertOffen(o => !o)}
              style={{ gap: 6, background: "none", border: "none", padding: 0, fontFamily: "inherit", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", cursor: "pointer" }}>
              {aussortiertOffen
                ? <ChevronDown style={{ width: 14, height: 14 }} />
                : <ChevronRight style={{ width: 14, height: 14 }} />}
              Widerlegt und irrtümlich erfasst ({aussortierte.length})
            </button>
            {aussortiertOffen && (
              <div style={{ display: "flex", flexDirection: "column", marginTop: 4 }}>
                {aussortierte.map(a => (
                  <Zeile key={a.id} a={a} herkunft={herkunftVon(a)} durchgestrichen onBearbeiten={() => setDialog({ eintrag: a })} />
                ))}
              </div>
            )}
          </div>
        )}

        {dialog && (
          <ErfassungsDialog patientId={patientId} eintrag={dialog.eintrag}
            beziehungen={beziehungen} angehoerige={angehoerige} kontakte={kontakte}
            patientDokumente={dokumenteVon(dokumente, { art: "patient", kennung: patientId })}
            onClose={() => setDialog(null)} />
        )}
        {zustandsdialog && (
          <ZustandsDialog aktuell={zustand}
            onWahl={z => { allergieErhebungSetzen(patientId, z, ANGEMELDETE_PFLEGEFACHPERSON.name); setZustandsdialog(false); }}
            onClose={() => setZustandsdialog(false)} />
        )}
      </div>
    </div>
  );
}

const leiseAktion: React.CSSProperties = {
  background: "none", border: "none", padding: 0, fontFamily: "inherit",
  fontSize: 13, fontWeight: 500, color: "var(--brand-accent)", cursor: "pointer",
};

/* ── Listenzeile ──────────────────────────────────────────────────────────── */

function Zeile({ a, herkunft, durchgestrichen, onBearbeiten }: {
  a: Allergie; herkunft: string; durchgestrichen?: boolean; onBearbeiten: () => void;
}) {
  const meta = [KATEGORIE_LABEL[a.kategorie], TYP_LABEL[a.typ], KRIT_LABEL[a.kritikalitaet]];
  if (a.substanzCodiert && a.substanzCode) meta.push(`SNOMED ${a.substanzCode}`);
  const bestaetigt = a.verifikationsstatus === "confirmed";
  return (
    <div style={{ display: "flex", gap: 12, padding: "10px 0", borderTop: "0.5px solid var(--border-default)", alignItems: "flex-start", flexWrap: "wrap" }}>
      {/* Zeichen VOR Farbe: hoch ▲, gering ●, nicht beurteilbar ○ */}
      <span aria-label={`Kritikalität: ${KRIT_LABEL[a.kritikalitaet]}`} title={`Kritikalität: ${KRIT_LABEL[a.kritikalitaet]}`}
        style={{ width: 18, flexShrink: 0, textAlign: "center", fontSize: a.kritikalitaet === "high" ? 13 : 12, lineHeight: "20px",
          color: a.kritikalitaet === "high" ? "var(--status-warning-text)" : "var(--text-tertiary)" }}>
        {KRIT_ZEICHEN[a.kritikalitaet]}
      </span>
      <div style={{ flex: 1, minWidth: 180 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", overflowWrap: "anywhere",
          textDecoration: durchgestrichen ? "line-through" : "none" }}>
          {a.substanzText}
        </div>
        <div style={{ marginTop: 1, fontSize: 12, color: "var(--text-tertiary)" }}>{meta.join(" · ")}</div>
        {!a.substanzCodiert && (
          <div style={{ marginTop: 2, fontSize: 12, fontWeight: 500, color: "var(--status-warning-text)" }}>
            Nicht codiert — keine Prüfung auf Wechselwirkungen
          </div>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, marginLeft: "auto" }}>
        <span style={{ padding: "1px 8px", borderRadius: 999, fontSize: 11, fontWeight: 500, whiteSpace: "nowrap",
          background: bestaetigt ? "var(--status-success-bg)" : "var(--bg-secondary)",
          color: bestaetigt ? "var(--status-success-text)" : "var(--text-secondary)" }}>
          {VERIF_LABEL[a.verifikationsstatus]}
        </span>
        <span style={{ fontSize: 12, color: "var(--text-tertiary)", textAlign: "right" }}>{herkunft}</span>
        <button type="button" onClick={onBearbeiten} className="ui-fokusring"
          style={{ background: "none", border: "none", padding: 0, fontFamily: "inherit", fontSize: 12, color: "var(--text-secondary)", cursor: "pointer" }}>
          Bearbeiten
        </button>
      </div>
    </div>
  );
}

/* ── Erfassungsdialog ─────────────────────────────────────────────────────── */

type SubstanzWahl =
  | { art: "katalog"; eintrag: AllergieKatalogEintrag }
  | { art: "freitext"; text: string };

function ErfassungsDialog({ patientId, eintrag, beziehungen, angehoerige, kontakte, patientDokumente, onClose }: {
  patientId: string;
  eintrag: Allergie | null;
  beziehungen: ReturnType<typeof useBeziehungen>;
  angehoerige: ReturnType<typeof useAngehoerige>;
  kontakte: ReturnType<typeof useKontakte>;
  patientDokumente: ReturnType<typeof useDokumente>;
  onClose: () => void;
}) {
  // Substanz: aus dem Eintrag (Bearbeiten) oder aus der Suche.
  const [wahl, setWahl] = useState<SubstanzWahl | null>(eintrag
    ? (eintrag.substanzCodiert
      ? (() => { const k = ALLERGIE_KATALOG.find(e => e.code === eintrag.substanzCode); return k ? { art: "katalog", eintrag: k } as const : { art: "freitext", text: eintrag.substanzText } as const; })()
      : { art: "freitext", text: eintrag.substanzText })
    : null);
  const [suche, setSuche] = useState("");
  const [listeOffen, setListeOffen] = useState(false);
  const [aktiv, setAktiv] = useState(0);
  const suchfeld = useRef<HTMLInputElement>(null);

  const [typ, setTyp] = useState<AllergieArt>(eintrag?.typ ?? "allergy");
  const [kategorie, setKategorie] = useState<AllergieKategorie>(eintrag?.kategorie ?? "environment");
  const [krit, setKrit] = useState<AllergieKritikalitaet>(eintrag?.kritikalitaet ?? "unable-to-assess");
  const [herkunftTyp, setHerkunftTyp] = useState<AllergieBehauptetVonTyp>(eintrag?.behauptetVonTyp ?? "klientin");
  const [herkunftId, setHerkunftId] = useState<string>(eintrag?.behauptetVonId ?? eintrag?.behauptetVonDokumentId ?? "");
  const [weitereOffen, setWeitereOffen] = useState(!!eintrag);
  const [verifikation, setVerifikation] = useState<AllergieVerifikation>(eintrag?.verifikationsstatus ?? "unconfirmed");
  const [letzteReaktion, setLetzteReaktion] = useState(eintrag?.letzteReaktionAm ?? "");
  const [erstmalsBekannt, setErstmalsBekannt] = useState(eintrag?.identifiziertAm ?? "");
  const [bemerkung, setBemerkung] = useState(eintrag?.bemerkung ?? "");

  /* Suche über substanz, de, fr, it und code — damit eine französischsprachige
     Erfassung dieselben Treffer liefert. */
  const anfrage = suche.trim().toLowerCase();
  const treffer = useMemo(() => anfrage.length < 2 ? [] : ALLERGIE_KATALOG.filter(e =>
    [e.substanz, e.de, e.fr, e.it, e.code].some(f => f.toLowerCase().includes(anfrage))), [anfrage]);
  const zeigeListe = listeOffen && anfrage.length >= 2;
  /** Zeilen der Trefferliste: Katalogtreffer + immer der Freitext-Ausweg. */
  const zeilenAnzahl = treffer.length + 1;

  const waehleKatalog = (e: AllergieKatalogEintrag) => {
    setWahl({ art: "katalog", eintrag: e });
    // Kategorie und Art kommen aus dem Katalogeintrag, sie werden nicht erfragt.
    setTyp(e.art);
    setKategorie(e.kategorie);
    setListeOffen(false);
    setSuche("");
  };
  const waehleFreitext = () => {
    setWahl({ art: "freitext", text: suche.trim() });
    setListeOffen(false);
    setSuche("");
  };

  const tastatur = (ev: React.KeyboardEvent) => {
    if (!zeigeListe) return;
    if (ev.key === "ArrowDown") { ev.preventDefault(); setAktiv(i => (i + 1) % zeilenAnzahl); }
    else if (ev.key === "ArrowUp") { ev.preventDefault(); setAktiv(i => (i - 1 + zeilenAnzahl) % zeilenAnzahl); }
    else if (ev.key === "Enter") { ev.preventDefault(); aktiv < treffer.length ? waehleKatalog(treffer[aktiv]) : waehleFreitext(); }
    else if (ev.key === "Escape") { ev.preventDefault(); setListeOffen(false); }
  };

  const sichern = () => {
    if (!wahl) return;
    const istKatalog = wahl.art === "katalog";
    allergieSichern({
      id: eintrag?.id ?? "", patientId,
      substanzCode: istKatalog ? wahl.eintrag.code : null,
      substanzText: istKatalog ? wahl.eintrag.substanz : wahl.text,
      substanzCodiert: istKatalog,
      kategorie: istKatalog ? wahl.eintrag.kategorie : kategorie,
      typ,
      kritikalitaet: krit,
      verifikationsstatus: verifikation,
      klinischerStatus: eintrag?.klinischerStatus ?? "active",
      letzteReaktionAm: letzteReaktion || null,
      identifiziertAm: erstmalsBekannt || null,
      erfasstDurchUserId: eintrag?.erfasstDurchUserId ?? ANGEMELDETE_PFLEGEFACHPERSON.userId,
      erfasstVonName: eintrag?.erfasstVonName ?? ANGEMELDETE_PFLEGEFACHPERSON.name,
      behauptetVonTyp: herkunftTyp,
      behauptetVonId: herkunftTyp === "angehoerige" || herkunftTyp === "fachperson" ? (herkunftId || null) : null,
      behauptetVonDokumentId: herkunftTyp === "dokument" ? (herkunftId || null) : null,
      bemerkung: bemerkung.trim() || null,
    });
    onClose();
  };

  /* Zweite Auswahl je Herkunft: Bezugsteam (Angehörige bzw. Fachpersonen) und
     Dokumente. Patientendokumente aus dem Dokumente-Store, sonst Mock-Liste. */
  const angehoerigenWahl = beziehungen
    .filter(b => kategorieFuerRolle(b.rolle) === "bezugsperson" && b.person.art === "angehoeriger")
    .map(b => { const p = angehoerige.find(x => x.id === (b.person.art === "angehoeriger" ? b.person.kennung : "")); return p ? { id: p.id, label: `${p.vorname} ${p.nachname}` } : null; })
    .filter((x): x is { id: string; label: string } => !!x);
  const fachpersonenWahl = beziehungen
    .filter(b => kategorieFuerRolle(b.rolle) === "fachpersonal" && b.person.art === "kontakt")
    .map(b => { const k = kontakte.find(x => x.id === (b.person.art === "kontakt" ? b.person.kennung : "")); return k ? { id: k.id, label: kontaktName(k) } : null; })
    .filter((x): x is { id: string; label: string } => !!x);
  const dokumentWahl = patientDokumente.length > 0
    ? patientDokumente.map(d => ({ id: d.id, label: `${d.bezeichnung} (${d.ausgestelltAm})` }))
    : MOCK_DOKUMENT_QUELLEN.map(d => ({ id: d.id, label: `${d.label} (${isoZuAnzeige(d.datumIso)})` }));
  const zweiteWahl = herkunftTyp === "angehoerige" ? angehoerigenWahl
    : herkunftTyp === "fachperson" ? fachpersonenWahl
    : herkunftTyp === "dokument" ? dokumentWahl : null;

  const istFreitext = wahl?.art === "freitext";

  return (
    <div role="dialog" aria-modal="true" aria-label={eintrag ? "Eintrag bearbeiten" : "Allergie oder Unverträglichkeit erfassen"} onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(19,19,20,0.28)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 560, maxWidth: "100%", maxHeight: "88vh", overflowY: "auto", background: "var(--bg-elevated)", borderRadius: 12, border: "0.5px solid var(--border-default)", boxShadow: "var(--shadow-overlay)" }}>
        <div style={{ padding: "16px 20px 8px", fontSize: 16, fontWeight: 500, color: "var(--text-primary)" }}>
          {eintrag ? "Eintrag bearbeiten" : "Allergie oder Unverträglichkeit erfassen"}
        </div>
        <div style={{ padding: "8px 20px 16px", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Substanz — Katalogsuche mit sichtbar markiertem Freitext-Ausweg */}
          <Feld label="Substanz" pflicht>
            {wahl ? (
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", overflowWrap: "anywhere" }}>
                  {wahl.art === "katalog" ? wahl.eintrag.substanz : wahl.text}
                </span>
                <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                  {wahl.art === "katalog" ? `${KATEGORIE_LABEL[wahl.eintrag.kategorie]} · SNOMED ${wahl.eintrag.code}` : "Freitext"}
                </span>
                <button type="button" className="ui-fokusring" style={{ ...leiseAktion, fontSize: 12 }}
                  onClick={() => { setWahl(null); setSuche(""); setListeOffen(false); setTimeout(() => suchfeld.current?.focus(), 0); }}>
                  ändern
                </button>
              </div>
            ) : (
              <div style={{ position: "relative", maxWidth: 420 }}>
                <input ref={suchfeld} type="text" value={suche} className="ui-fokusring" role="combobox"
                  aria-expanded={zeigeListe} aria-controls="allergie-treffer" aria-autocomplete="list"
                  aria-activedescendant={zeigeListe ? `allergie-treffer-${aktiv}` : undefined}
                  onChange={e => { setSuche(e.target.value); setListeOffen(true); setAktiv(0); }}
                  onKeyDown={tastatur}
                  placeholder="Substanz suchen (min. 2 Zeichen)"
                  style={{ width: "100%", padding: "9px 12px", fontSize: 14, borderRadius: 10, border: "0.5px solid var(--border-default)", background: "var(--bg-elevated)", color: "var(--text-primary)", fontFamily: "inherit", boxSizing: "border-box" }} />
                {zeigeListe && (
                  <div id="allergie-treffer" role="listbox" aria-label="Substanz-Treffer"
                    style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10, marginTop: 4, maxHeight: 280, overflowY: "auto",
                      background: "var(--bg-elevated)", border: "0.5px solid var(--border-default)", borderRadius: 10, boxShadow: "var(--shadow-overlay)" }}>
                    {treffer.map((e, i) => (
                      <div key={e.code} id={`allergie-treffer-${i}`} role="option" aria-selected={aktiv === i}
                        onMouseEnter={() => setAktiv(i)} onMouseDown={ev => { ev.preventDefault(); waehleKatalog(e); }}
                        style={{ padding: "8px 12px", cursor: "pointer", background: aktiv === i ? "var(--bg-secondary)" : "transparent" }}>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                          <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{markiere(e.substanz, anfrage)}</span>
                          <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{KATEGORIE_LABEL[e.kategorie]}</span>
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                          {markiere(begriffFuerTreffer(e, anfrage), anfrage)} · {markiere(e.code, anfrage)}
                        </div>
                      </div>
                    ))}
                    <div id={`allergie-treffer-${treffer.length}`} role="option" aria-selected={aktiv === treffer.length}
                      onMouseEnter={() => setAktiv(treffer.length)} onMouseDown={ev => { ev.preventDefault(); waehleFreitext(); }}
                      style={{ padding: "8px 12px", cursor: "pointer", borderTop: treffer.length ? "0.5px solid var(--border-default)" : "none",
                        background: aktiv === treffer.length ? "var(--bg-secondary)" : "transparent" }}>
                      <span style={{ fontSize: 13, color: "var(--status-warning-text)", fontWeight: 500 }}>
                        Nicht gefunden — «{suche.trim()}» als Freitext erfassen
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Feld>

          {/* Kategorie nur bei Freitext — die Katalogwahl bringt sie mit. */}
          {istFreitext && (
            <Feld label="Kategorie">
              <Segment<AllergieKategorie> optionen={(Object.keys(KATEGORIE_LABEL) as AllergieKategorie[]).map(k => ({ wert: k, label: KATEGORIE_LABEL[k] }))}
                wert={kategorie} onWahl={setKategorie} />
            </Feld>
          )}

          {istFreitext && (
            <div style={{ padding: "10px 12px", borderRadius: 10, background: "var(--status-warning-bg)", border: "0.5px solid var(--border-default)", fontSize: 13, color: "var(--text-secondary)" }}>
              <strong style={{ color: "var(--status-warning-text)" }}>Nicht codiert.</strong>{" "}
              Freitexteinträge werden nicht auf Wechselwirkungen geprüft und beim Datenaustausch nur als Text übermittelt.
            </div>
          )}

          <Feld label="Art">
            <Segment<AllergieArt> optionen={[{ wert: "allergy", label: "Allergie" }, { wert: "intolerance", label: "Unverträglichkeit" }]}
              wert={typ} onWahl={setTyp} />
          </Feld>

          <Feld label="Wie gefährlich ist eine erneute Exposition?">
            <Segment<AllergieKritikalitaet> optionen={[{ wert: "low", label: "Gering" }, { wert: "high", label: "Hoch" }, { wert: "unable-to-assess", label: "Nicht beurteilbar" }]}
              wert={krit} onWahl={setKrit} />
          </Feld>

          <Feld label="Woher stammt die Angabe?">
            <Segment<AllergieBehauptetVonTyp> optionen={[
              { wert: "klientin", label: "Selbstauskunft der Klientin" },
              { wert: "angehoerige", label: "Angehörige" },
              { wert: "fachperson", label: "Gesundheitsfachperson" },
              { wert: "dokument", label: "Dokument" },
            ]} wert={herkunftTyp} onWahl={t => { setHerkunftTyp(t); setHerkunftId(""); }} />
            {zweiteWahl && (
              <select value={herkunftId} onChange={e => setHerkunftId(e.target.value)} className="ui-fokusring"
                aria-label={herkunftTyp === "dokument" ? "Dokument wählen" : "Person wählen"}
                style={{ marginTop: 8, maxWidth: 320, width: "100%", padding: "8px 10px", fontSize: 13, borderRadius: 10, border: "0.5px solid var(--border-default)", background: "var(--bg-elevated)", color: "var(--text-primary)", fontFamily: "inherit" }}>
                <option value="">{herkunftTyp === "dokument" ? "Dokument wählen" : "Person wählen"}</option>
                {zweiteWahl.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            )}
          </Feld>

          {/* Weitere Angaben — eingeklappt; der Standard verlangt nur die Substanz. */}
          <div>
            <button type="button" className="ui-fokusring inline-flex items-center" aria-expanded={weitereOffen}
              onClick={() => setWeitereOffen(o => !o)}
              style={{ gap: 6, background: "none", border: "none", padding: 0, fontFamily: "inherit", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", cursor: "pointer" }}>
              {weitereOffen ? <ChevronDown style={{ width: 14, height: 14 }} /> : <ChevronRight style={{ width: 14, height: 14 }} />}
              Weitere Angaben
            </button>
            {weitereOffen && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 12 }}>
                <Feld label="Sicherheit">
                  <Segment<AllergieVerifikation> optionen={[
                    { wert: "unconfirmed", label: "Unbestätigt" },
                    { wert: "confirmed", label: "Bestätigt" },
                    { wert: "refuted", label: "Widerlegt" },
                  ]} wert={verifikation} onWahl={setVerifikation} />
                </Feld>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  <Feld label="Letzte Reaktion">
                    <input type="date" value={letzteReaktion} onChange={e => setLetzteReaktion(e.target.value)} className="ui-fokusring" style={datumsFeld} />
                  </Feld>
                  <Feld label="Erstmals bekannt">
                    <input type="date" value={erstmalsBekannt} onChange={e => setErstmalsBekannt(e.target.value)} className="ui-fokusring" style={datumsFeld} />
                  </Feld>
                </div>
                <Feld label="Bemerkung">
                  <textarea value={bemerkung} onChange={e => setBemerkung(e.target.value)} rows={2} className="ui-fokusring"
                    style={{ width: "100%", padding: "9px 12px", fontSize: 14, borderRadius: 10, border: "0.5px solid var(--border-default)", background: "var(--bg-elevated)", color: "var(--text-primary)", fontFamily: "inherit", boxSizing: "border-box", resize: "vertical" }} />
                </Feld>
              </div>
            )}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12, padding: "12px 20px", borderTop: "0.5px solid var(--border-default)" }}>
          <button type="button" onClick={onClose} className="ui-fokusring" style={{ ...leiseAktion, color: "var(--text-secondary)" }}>Abbrechen</button>
          <AppButton variant="primaer" onClick={sichern} disabled={!wahl}>Sichern</AppButton>
        </div>
      </div>
    </div>
  );
}

/** Katalogbegriff, der den Treffer erklärt: die erste Sprache, die trifft. */
function begriffFuerTreffer(e: AllergieKatalogEintrag, anfrage: string): string {
  for (const feld of [e.de, e.fr, e.it]) {
    if (feld.toLowerCase().includes(anfrage)) return feld;
  }
  return e.de;
}

/** Erste Fundstelle der Anfrage hervorheben. */
function markiere(text: string, anfrage: string): React.ReactNode {
  if (!anfrage) return text;
  const pos = text.toLowerCase().indexOf(anfrage);
  if (pos < 0) return text;
  return (
    <>
      {text.slice(0, pos)}
      <mark style={{ background: "var(--brand-accent-light)", color: "inherit", borderRadius: 2 }}>{text.slice(pos, pos + anfrage.length)}</mark>
      {text.slice(pos + anfrage.length)}
    </>
  );
}

const datumsFeld: React.CSSProperties = {
  padding: "8px 10px", fontSize: 13, borderRadius: 10, border: "0.5px solid var(--border-default)",
  background: "var(--bg-elevated)", color: "var(--text-primary)", fontFamily: "inherit",
};

/* ── Zustandswechsel ──────────────────────────────────────────────────────── */

const ZUSTAND_REIHENFOLGE: AllergieErhebungZustand[] = [
  "nicht_begonnen", "keine_bekannt", "nicht_erfragt", "nicht_verfuegbar", "zurueckgehalten", "abgeschlossen",
];

function ZustandsDialog({ aktuell, onWahl, onClose }: {
  aktuell: AllergieErhebungZustand;
  onWahl: (z: AllergieErhebungZustand) => void;
  onClose: () => void;
}) {
  const [gewaehlt, setGewaehlt] = useState<AllergieErhebungZustand>(aktuell);
  return (
    <div role="dialog" aria-modal="true" aria-label="Erhebungszustand ändern" onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(19,19,20,0.28)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 400, maxWidth: "100%", background: "var(--bg-elevated)", borderRadius: 12, border: "0.5px solid var(--border-default)", boxShadow: "var(--shadow-overlay)" }}>
        <div style={{ padding: "16px 20px 8px", fontSize: 16, fontWeight: 500, color: "var(--text-primary)" }}>Erhebungszustand ändern</div>
        <div style={{ padding: "8px 20px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
          {ZUSTAND_REIHENFOLGE.map(z => {
            const sel = gewaehlt === z;
            return (
              <button key={z} type="button" onClick={() => setGewaehlt(z)} aria-pressed={sel} className="ui-fokusring"
                style={{ textAlign: "left", padding: "8px 12px", borderRadius: 10, fontFamily: "inherit", fontSize: 13, cursor: "pointer",
                  background: sel ? "var(--brand-primary-light)" : "var(--bg-elevated)", color: sel ? "var(--brand-primary)" : "var(--text-primary)",
                  border: "0.5px solid " + (sel ? "var(--brand-primary)" : "var(--border-default)") }}>
                {ZUSTAND_LABEL[z]}
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, padding: "12px 20px", borderTop: "0.5px solid var(--border-default)" }}>
          <button type="button" onClick={onClose} className="ui-fokusring" style={{ ...leiseAktion, color: "var(--text-secondary)" }}>Abbrechen</button>
          <AppButton variant="primaer" onClick={() => onWahl(gewaehlt)}>Übernehmen</AppButton>
        </div>
      </div>
    </div>
  );
}

/* ── Kleinteile ───────────────────────────────────────────────────────────── */

function Feld({ label, pflicht, children }: { label: string; pflicht?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>
        {label}{pflicht && <span aria-hidden="true" style={{ color: "var(--status-warning-text)" }}> *</span>}
      </div>
      {children}
    </div>
  );
}

function Segment<T extends string>({ optionen, wert, onWahl }: {
  optionen: { wert: T; label: string }[]; wert: T; onWahl: (w: T) => void;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {optionen.map(o => {
        const sel = wert === o.wert;
        return (
          <button key={o.wert} type="button" onClick={() => onWahl(o.wert)} aria-pressed={sel} className="ui-fokusring"
            style={{ padding: "6px 12px", borderRadius: 12, fontFamily: "inherit", fontSize: 13, cursor: "pointer",
              background: sel ? "var(--brand-primary-light)" : "var(--bg-elevated)", color: sel ? "var(--brand-primary)" : "var(--text-primary)",
              border: "0.5px solid " + (sel ? "var(--brand-primary)" : "var(--border-default)") }}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
