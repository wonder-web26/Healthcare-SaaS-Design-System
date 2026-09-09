/**
 * Vitalzeichen-Erfassung — ein Slide-over je Besuch.
 *
 * ALLE PARAMETER UNTEREINANDER, leer lassen was nicht gemessen wurde. Die
 * qualifizierenden Angaben und die Beurteilung erscheinen erst, wenn im Feld
 * ein Wert steht — ein leerer Parameter bleibt eine Zeile hoch, sonst
 * erschluege der Dialog die Erfasserin mit vierzig Feldern für drei Werte.
 *
 * «NICHT ERHEBBAR» IST EIN EIGENER ZUSTAND mit Grund — eine dokumentierte
 * Nichterhebung, kein fehlender Wert. Leer gelassen heisst: nicht gemessen,
 * keine Aussage.
 *
 * DIE BEURTEILUNG SETZT NIE DAS SYSTEM. Kein Vorschlag, keine Vorbelegung,
 * keine farbige Andeutung — der Bezugsrahmen (Zielwert oder letzter Wert)
 * wird als Text ANGEZEIGT, nicht ausgewertet. Das ist die Grenze zur
 * Entscheidungsunterstützung. Beurteilen dürfen nur fachqualifizierte Rollen;
 * für andere bleibt die Beurteilung offen und erzeugt eine Pendenz bei der
 * Bezugsfachperson.
 *
 * DIE PLAUSIBILITÄTSWARNUNG IST TECHNISCH, NICHT KLINISCH: «ausserhalb des
 * erfassbaren Bereichs – bitte prüfen». Sie warnt vor Tippfehlern, nie vor
 * Gefahr, und sie blockiert nie — bestätigen und speichern ist immer möglich.
 */
import { useMemo, useState } from "react";
import { AlertTriangle, Info } from "lucide-react";
import { Drawer, DrawerContent } from "../ui/drawer";
import { useFensterBreite } from "../ui/DataTable";
import { AppButton } from "../ui/AppButton";
import { FormField } from "../form/FormField";
import { TextInput } from "../form/TextInput";
import { TextareaInput } from "../form/TextareaInput";
import { SegmentedControl } from "../form/SegmentedControl";
import { DateField } from "../form/DateField";
import { Checkbox } from "../ui/checkbox";
import { toast } from "sonner";
import { useCurrentRole, useCurrentUser } from "../../auth";
import { ROLE_DESCRIPTIONS } from "../../../types/user";
import { GEGENWART_ISO } from "../../../lib/gegenwart";
import { isoZuAnzeige } from "../../../lib/datum";
import { erstelleManuellePendenz } from "../../../lib/mocks/service-desk-unified";
import { pendenzTypen } from "../../../types/pendenz";
import {
  VITAL_PARAMETER, GRUPPE_LABEL, BEURTEILUNG_LABEL, ERHEBUNGSART_LABEL,
  eintraegeVon, gueltigePunkte, pruefePlausibilitaet, relativText,
  type Beurteilung, type Erhebungsart, type ParameterCode, type VitalParameterDef, type VitalWert,
} from "../../../lib/vitalzeichen/vitalzeichen";
import { useVitalMessungen, messungErfassen, getZielwert } from "../../../lib/vitalzeichen/store";

const JETZT_ISO = `${GEGENWART_ISO}T09:00`;

interface FeldZustand {
  wert: string;
  zweit: string;
  qualifier: Record<string, string>;
  nichtErhebbar: boolean;
  grund: string;
  beurteilung: Beurteilung | null;
  begruendung: string;
}

const leeresFeld = (): FeldZustand =>
  ({ wert: "", zweit: "", qualifier: {}, nichtErhebbar: false, grund: "", beurteilung: null, begruendung: "" });

export function VitalzeichenErfassung({ patientId, onClose }: { patientId: string; onClose: () => void }) {
  const istSchmal = useFensterBreite() < 1024;
  return (
    /* modal={false}: im modalen Zustand setzt vaul pointer-events:none auf den
       Body und die Aufklapplisten in Portalen wären unbedienbar — dieselbe
       Falle wie im Medikations-Editor. */
    <Drawer open modal={false} onOpenChange={o => { if (!o) onClose(); }} direction={istSchmal ? "bottom" : "right"}>
      <DrawerContent aria-label="Vitalzeichen erfassen" className={istSchmal ? "!max-h-[92vh]" : "sm:!max-w-[640px]"}>
        <Formular patientId={patientId} onClose={onClose} />
      </DrawerContent>
    </Drawer>
  );
}

function Formular({ patientId, onClose }: { patientId: string; onClose: () => void }) {
  const messungen = useVitalMessungen().filter(x => x.patientId === patientId);
  const rolle = useCurrentRole();
  const benutzer = useCurrentUser();
  /* Dieselbe Rollenquelle wie im übrigen Produkt — kein eigenes System. */
  const darfBeurteilen = rolle === "diplomiert";

  const [datum, setDatum] = useState(GEGENWART_ISO);
  const [zeit, setZeit] = useState("09:00");
  const [felder, setFelder] = useState<Record<ParameterCode, FeldZustand>>(() =>
    Object.fromEntries(VITAL_PARAMETER.map(p => [p.code, leeresFeld()])) as Record<ParameterCode, FeldZustand>);
  const [erhebungsart, setErhebungsart] = useState<Erhebungsart>("selbst_gemessen");
  const [geraet, setGeraet] = useState("");
  const [geraetNichtDokumentiert, setGeraetNichtDokumentiert] = useState(false);
  const [notiz, setNotiz] = useState("");
  const [fehler, setFehler] = useState<string[]>([]);
  const [warnungen, setWarnungen] = useState<string[]>([]);

  const nachtrag = datum !== GEGENWART_ISO;

  const setFeld = (code: ParameterCode, patch: Partial<FeldZustand>) =>
    setFelder(f => ({ ...f, [code]: { ...f[code], ...patch } }));

  /** Letzter Wert je Parameter — strukturiert für den kompakten Dreizeiler. */
  const letzterHinweis = useMemo(() => {
    const map: Partial<Record<ParameterCode, { wert: string; meta: string }>> = {};
    for (const def of VITAL_PARAMETER) {
      const letzte = gueltigePunkte(eintraegeVon(messungen, def.code)).slice(-1)[0];
      if (!letzte) continue;
      const wertText = def.code === "blood_pressure" && letzte.zweitwert !== null
        ? `${letzte.wert}/${letzte.zweitwert} ${def.einheit}` : `${letzte.wert} ${def.einheit}`;
      const trennend = def.qualifier.find(q => q.trennendImVerlauf);
      const kontext = trennend ? trennend.werte.find(x => x.code === letzte.qualifier[trennend.feld])?.label : undefined;
      map[def.code] = {
        wert: wertText,
        meta: `${relativText(letzte.messZeitpunkt, JETZT_ISO)}${kontext ? ` · ${kontext}` : ""}`,
      };
    }
    return map;
  }, [messungen]);

  /** Bezugsrahmen der Beurteilung — angezeigt, nie ausgewertet. */
  const bezugsrahmen = (def: VitalParameterDef): string => {
    const ziel = getZielwert(patientId, def.code);
    if (ziel) return `Bezugsrahmen: ärztlicher Zielwert ${ziel.text} (${ziel.quelle}, hinterlegt ${isoZuAnzeige(ziel.hinterlegtAm)})`;
    const letzte = gueltigePunkte(eintraegeVon(messungen, def.code)).slice(-1)[0];
    if (letzte) {
      const wertText = def.code === "blood_pressure" && letzte.zweitwert !== null
        ? `${letzte.wert}/${letzte.zweitwert} ${def.einheit}` : `${letzte.wert} ${def.einheit}`;
      return `Bezugsrahmen: letzter Wert ${wertText} vom ${isoZuAnzeige(letzte.messZeitpunkt.slice(0, 10))}`;
    }
    return "Kein ärztlicher Zielwert und kein früherer Wert hinterlegt.";
  };

  const speichern = () => {
    const neueFehler: string[] = [];
    const werte: VitalWert[] = [];
    const plausi: string[] = [];

    for (const def of VITAL_PARAMETER) {
      const f = felder[def.code];
      if (f.nichtErhebbar) {
        if (!f.grund.trim()) neueFehler.push(`${def.label}: «Nicht erhebbar» braucht einen Grund.`);
        werte.push({
          parameterCode: def.code, wert: null, zweitwert: null, qualifier: {},
          nichtErhebbar: true, nichtErhebbarGrund: f.grund.trim(),
          beurteilung: null, beurteilungBegruendung: "", beurteiltVonName: null, beurteiltVonRolle: null,
        });
        continue;
      }
      if (!f.wert.trim()) continue;
      const wert = Number(f.wert.replace(",", "."));
      const zweit = f.zweit.trim() ? Number(f.zweit.replace(",", ".")) : null;
      if (!Number.isFinite(wert) || (def.zweitwert && f.zweit.trim() && !Number.isFinite(zweit!))) {
        neueFehler.push(`${def.label}: Bitte eine Zahl eingeben.`);
        continue;
      }
      if (def.zweitwert && zweit === null) {
        neueFehler.push(`${def.label}: Bitte auch den ${def.zweitwert.label}en Wert eingeben.`);
        continue;
      }
      const pflichtQualifier = def.qualifier.find(q => q.pflicht);
      if (pflichtQualifier && !f.qualifier[pflichtQualifier.feld]) {
        neueFehler.push(`${def.label}: ${pflichtQualifier.label} ist Pflicht — er verändert die Bedeutung des Werts.`);
      }
      if (f.beurteilung && f.beurteilung !== "normal" && !f.begruendung.trim()) {
        neueFehler.push(`${def.label}: Eine auffällige Beurteilung braucht eine Begründung.`);
      }
      const warnung = pruefePlausibilitaet(def, wert, zweit);
      if (warnung) plausi.push(warnung);
      werte.push({
        parameterCode: def.code, wert, zweitwert: zweit, qualifier: { ...f.qualifier },
        nichtErhebbar: false, nichtErhebbarGrund: "",
        beurteilung: darfBeurteilen ? f.beurteilung : null,
        beurteilungBegruendung: darfBeurteilen ? f.begruendung.trim() : "",
        beurteiltVonName: darfBeurteilen && f.beurteilung ? `${benutzer.vorname} ${benutzer.name}` : null,
        beurteiltVonRolle: darfBeurteilen && f.beurteilung ? benutzer.funktion : null,
      });
    }

    if (werte.length === 0) neueFehler.push("Bitte mindestens einen Wert erfassen oder eine Nichterhebung dokumentieren.");
    setFehler(neueFehler);
    if (neueFehler.length > 0) return;

    /* Warnung mit Bestätigung, nie Blockade: erster Klick zeigt sie, der
       zweite speichert trotzdem. */
    if (plausi.length > 0 && warnungen.length === 0) { setWarnungen(plausi); return; }

    const messung = messungErfassen({
      patientId,
      messZeitpunkt: `${datum}T${zeit || "09:00"}`,
      gemessenDurchUserId: benutzer.id,
      gemessenDurchName: `${benutzer.vorname} ${benutzer.name}`,
      gemessenDurchRolle: benutzer.funktion,
      erhebungsart,
      messgeraet: geraetNichtDokumentiert ? null : (geraet.trim() || null),
      notiz: notiz.trim(),
      korrekturVon: null,
      werte,
    }, JETZT_ISO);

    /* Angekündigte Folgen: Pendenz je auffälligem Wert; ohne Fachqualifikation
       eine Pendenz für die offene Beurteilung bei der Bezugsfachperson. */
    const person = { name: `${benutzer.vorname} ${benutzer.name}`, initialen: benutzer.initialen };
    for (const v of werte) {
      if (v.beurteilung && v.beurteilung !== "normal") {
        const def = VITAL_PARAMETER.find(p => p.code === v.parameterCode)!;
        erstelleManuellePendenz({
          betreff: `Arzt informieren: ${def.label} ${BEURTEILUNG_LABEL[v.beurteilung]}`,
          pendenzTyp: "meldung", pendenzTypLabel: pendenzTypen["meldung"].label,
          faellig: GEGENWART_ISO,
          beschreibung: `Messung ${messung.id} vom ${isoZuAnzeige(messung.messZeitpunkt.slice(0, 10))}: ${def.label} ${v.wert}${v.zweitwert !== null ? `/${v.zweitwert}` : ""} ${def.einheit}. Begründung: ${v.beurteilungBegruendung}`,
          personBezug: { art: "patient", kennung: patientId },
          verantwortlich: null, prioritaet: "hoch",
          erstelltVon: person, erstelltAm: GEGENWART_ISO,
        });
      }
    }
    if (!darfBeurteilen && werte.some(v => !v.nichtErhebbar)) {
      erstelleManuellePendenz({
        betreff: "Vitalzeichen beurteilen",
        pendenzTyp: "meldung", pendenzTypLabel: pendenzTypen["meldung"].label,
        faellig: GEGENWART_ISO,
        beschreibung: `Messung ${messung.id} vom ${isoZuAnzeige(messung.messZeitpunkt.slice(0, 10))} wurde ohne Fachbeurteilung erfasst; die Beurteilung ist offen.`,
        personBezug: { art: "patient", kennung: patientId },
        verantwortlich: null, prioritaet: "mittel",
        erstelltVon: person, erstelltAm: GEGENWART_ISO,
      });
    }

    toast("Messung gespeichert");
    onClose();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: 0, height: "100%" }}>
      <div style={{ padding: "18px 22px 10px", fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>
        Vitalzeichen erfassen
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "8px 22px 20px", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>

        {/* 1 — Messzeitpunkt; der Erfassungszeitpunkt läuft getrennt mit. */}
        <section aria-label="Messzeitpunkt">
        <h4 style={abschnittsKopf}>Messzeitpunkt</h4>
        <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap", alignItems: "flex-end" }}>
          <DateField label="Gemessen am" required wertFormat="iso" bereich="past"
            value={datum || null} onChange={v => setDatum((v as string) ?? "")} steuerelementMaxBreite="11rem" />
          <FormField label="Uhrzeit">
            <input type="time" value={zeit} onChange={e => setZeit(e.target.value)} className="ui-fokusring"
              style={{ padding: "8px 10px", fontSize: "var(--text-small)", borderRadius: "var(--control-radius)", border: "var(--border-thin) solid var(--border-default)", background: "var(--bg-elevated)", color: "var(--text-primary)", fontFamily: "inherit" }} />
          </FormField>
        </div>
        {nachtrag && (
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginTop: 8, padding: "10px 12px", borderRadius: "var(--radius-card)", background: "var(--status-warning-bg)" }}>
            <Info style={{ width: 14, height: 14, color: "var(--status-warning-text)", flexShrink: 0, marginTop: 2 }} />
            <span style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", maxWidth: "62ch" }}>
              Nachtrag: Der Messzeitpunkt liegt vor dem heutigen Erfassungszeitpunkt.
              Beide werden getrennt gespeichert, die Abweichung wird vermerkt.
            </span>
          </div>
        )}
        </section>

        {/* 2 + 3 — Messwerte, nach Gruppen */}
        {(["vitalzeichen", "ohne_status"] as const).map(gruppe => (
          <section key={gruppe} aria-label={GRUPPE_LABEL[gruppe]}>
            <h4 style={abschnittsKopf}>{GRUPPE_LABEL[gruppe]}</h4>
            {gruppe === "ohne_status" && (
              <p style={{ margin: "0 0 6px", fontSize: "var(--text-meta)", color: "var(--text-tertiary)", maxWidth: "62ch" }}>
                Diese Werte gehören nicht zum Vitalzeichen-Set, sind aber fachlich zentral.
                Beim Blutzucker ist der Messkontext Pflicht — er verändert die Bedeutung des Werts.
              </p>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              {VITAL_PARAMETER.filter(p => p.gruppe === gruppe).map(def => (
                <ParameterFeld key={def.code} def={def} feld={felder[def.code]}
                  hinweis={letzterHinweis[def.code]}
                  darfBeurteilen={darfBeurteilen}
                  bezugsrahmenText={bezugsrahmen(def)}
                  onAendern={patch => setFeld(def.code, patch)} />
              ))}
            </div>
          </section>
        ))}

        {/* 4 — Herkunft */}
        <section aria-label="Herkunft" style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          <h4 style={abschnittsKopf}>Herkunft</h4>
          <FormField label="Gemessen durch">
            <div style={{ fontSize: "var(--text-small)", color: "var(--text-primary)" }}>
              {benutzer.vorname} {benutzer.name}
              <span style={{ color: "var(--text-tertiary)" }}> · {benutzer.funktion}</span>
            </div>
          </FormField>
          <SegmentedControl label="Erhebungsart" value={erhebungsart}
            onChange={v => setErhebungsart(v as Erhebungsart)}
            options={(Object.keys(ERHEBUNGSART_LABEL) as Erhebungsart[]).map(k => ({ value: k, label: ERHEBUNGSART_LABEL[k] }))} />
          <div>
            <TextInput label="Messgerät" value={geraetNichtDokumentiert ? "" : geraet} onChange={setGeraet}
              disabled={geraetNichtDokumentiert} placeholder="z.B. Oberarm-Messgerät, Omron" />
            <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, cursor: "pointer" }}>
              <Checkbox checked={geraetNichtDokumentiert} onCheckedChange={c => setGeraetNichtDokumentiert(c === true)} />
              <span style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>Messgerät nicht dokumentiert</span>
            </label>
          </div>
        </section>

        {/* 5 — Notiz */}
        <section aria-label="Notiz">
          <h4 style={abschnittsKopf}>Notiz</h4>
          <TextareaInput label="Freitext zur gesamten Messung" value={notiz} onChange={setNotiz}
            placeholder="z.B. Klientin wirkt heute müde." />
        </section>

        {fehler.length > 0 && (
          <div role="alert" style={{ padding: "10px 12px", borderRadius: "var(--radius-card)", background: "var(--status-warning-bg)" }}>
            {fehler.map((f, i) => (
              <div key={i} style={{ fontSize: "var(--text-meta)", color: "var(--status-warning-text)", padding: "1px 0" }}>· {f}</div>
            ))}
          </div>
        )}
        {warnungen.length > 0 && (
          <div style={{ padding: "10px 12px", borderRadius: "var(--radius-card)", background: "var(--status-warning-bg)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <AlertTriangle style={{ width: 14, height: 14, color: "var(--status-warning-text)" }} />
              <span style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--status-warning-text)" }}>
                Wert ausserhalb des erfassbaren Bereichs – bitte prüfen
              </span>
            </div>
            {warnungen.map((f, i) => (
              <div key={i} style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", padding: "1px 0" }}>· {f}</div>
            ))}
            <div style={{ marginTop: 4, fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>
              Nochmals «Speichern» wählen, um die Werte trotzdem zu speichern.
            </div>
          </div>
        )}
      </div>

      <div style={{ borderTop: "var(--border-thin) solid var(--border-default)", padding: "12px 22px", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12 }}>
        <button type="button" onClick={onClose} className="ui-fokusring"
          style={{ background: "none", border: "none", padding: 0, fontFamily: "inherit", fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-secondary)", cursor: "pointer" }}>
          Abbrechen
        </button>
        <AppButton variant="primaer" onClick={speichern}>Speichern</AppButton>
      </div>
    </div>
  );
}

/** Abschnittsköpfe: Versalien, klein, gedämpft — Trenner, keine Titel. */
const abschnittsKopf: React.CSSProperties = {
  margin: "0 0 6px", fontSize: "var(--text-micro)", fontWeight: "var(--weight-medium)",
  letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-tertiary)",
};

/**
 * Eine Parameterkarte. Der ZUSTAND ist an der Karte ablesbar, nicht nur am
 * Inhalt: leer = neutraler Rahmen auf Grundfläche, befüllt = Brand-Rahmen mit
 * leichter Brand-Tönung (das etablierte Auswahl-Muster des Projekts), nicht
 * erhebbar = neutral gefüllte Fläche mit stillgelegter Eingabe.
 *
 * Die Einheit sitzt IM Feld, die Bezeichnung links mit fester Breite, der
 * letzte Wert als kompakter Dreizeiler rechts — so fluchten die Eingabefelder
 * über alle Karten und die Mengen lassen sich senkrecht vergleichen.
 */
function ParameterFeld({ def, feld, hinweis, darfBeurteilen, bezugsrahmenText, onAendern }: {
  def: VitalParameterDef;
  feld: FeldZustand;
  hinweis: { wert: string; meta: string } | undefined;
  darfBeurteilen: boolean;
  bezugsrahmenText: string;
  onAendern: (patch: Partial<FeldZustand>) => void;
}) {
  const hatWert = feld.wert.trim() !== "";
  const offen = hatWert && !feld.nichtErhebbar;

  /* Kartenzustand → Rahmen und Fläche (Tokens des Auswahl-Musters). */
  const rahmen = feld.nichtErhebbar
    ? "var(--border-default)"
    : hatWert ? "var(--brand-primary)" : "var(--border-default)";
  const flaeche = feld.nichtErhebbar
    ? "var(--bg-secondary)"
    : hatWert ? "var(--brand-primary-light)" : "var(--bg-elevated)";

  /* Live-Plausibilität an der Eingabe — technisch, nie blockierend. */
  const wertZahl = Number(feld.wert.replace(",", "."));
  const zweitZahl = feld.zweit.trim() ? Number(feld.zweit.replace(",", ".")) : null;
  const plausiWarnung = offen && Number.isFinite(wertZahl)
    ? pruefePlausibilitaet(def, wertZahl, Number.isFinite(zweitZahl as number) ? zweitZahl : null)
    : null;

  return (
    <div style={{
      padding: "10px 14px", borderRadius: "var(--radius-card)",
      border: "var(--border-thin) solid " + rahmen, background: flaeche,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        {/* Bezeichnung links, feste Breite — alle Felder fluchten. */}
        <span style={{ flex: "0 0 150px", minWidth: 0 }}>
          <span style={{ display: "block", fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: feld.nichtErhebbar ? "var(--text-tertiary)" : "var(--text-primary)" }}>
            {def.label}
          </span>
          {def.zweitwert && (
            <span style={{ display: "block", fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>
              systolisch / diastolisch
            </span>
          )}
        </span>

        {/* Feld mit Einheit INNEN; Blutdruck als Paar mit Schrägstrich. */}
        <span aria-disabled={feld.nichtErhebbar || undefined} style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          padding: "0 10px", height: "var(--control-height)",
          borderRadius: "var(--control-radius)",
          border: "var(--border-thin) solid var(--border-default)",
          background: "var(--bg-elevated)",
          opacity: feld.nichtErhebbar ? 0.55 : 1,
        }}>
          <input inputMode="decimal" value={feld.wert} onChange={e => onAendern({ wert: e.target.value })}
            aria-label={def.label} placeholder="–" disabled={feld.nichtErhebbar}
            className="ui-fokusring font-mono"
            style={{ width: def.zweitwert ? 46 : 64, border: "none", outline: "none", background: "transparent",
              fontSize: "var(--text-small)", color: "var(--text-primary)", fontVariantNumeric: "tabular-nums", textAlign: "right" }} />
          {def.zweitwert && (
            <>
              <span style={{ color: "var(--text-tertiary)" }}>/</span>
              <input inputMode="decimal" value={feld.zweit} onChange={e => onAendern({ zweit: e.target.value })}
                aria-label={`${def.label} ${def.zweitwert.label}`} placeholder="–" disabled={feld.nichtErhebbar}
                className="ui-fokusring font-mono"
                style={{ width: 46, border: "none", outline: "none", background: "transparent",
                  fontSize: "var(--text-small)", color: "var(--text-primary)", fontVariantNumeric: "tabular-nums", textAlign: "right" }} />
            </>
          )}
          <span aria-hidden="true" style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", whiteSpace: "nowrap" }}>
            {def.einheit}
          </span>
        </span>

        {/* Letzter Wert: kompakter Dreizeiler, rechtsbündig. */}
        <span style={{ marginLeft: "auto", textAlign: "right", opacity: feld.nichtErhebbar ? 0.55 : 1 }}>
          {hinweis ? (
            <>
              <span style={{ display: "block", fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>zuletzt</span>
              <span className="font-mono" style={{ display: "block", fontSize: "var(--text-small)", color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums" }}>
                {hinweis.wert}
              </span>
              <span style={{ display: "block", fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>{hinweis.meta}</span>
            </>
          ) : (
            <span style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)" }}>noch nie erfasst</span>
          )}
        </span>
      </div>

      {plausiWarnung && (
        <div style={{ marginTop: 6, fontSize: "var(--text-micro)", color: "var(--status-warning-text)" }}>
          Wert ausserhalb des erfassbaren Bereichs – bitte prüfen ({def.minPlausibel}–{def.maxPlausibel}{def.zweitwert ? ` bzw. ${def.zweitwert.minPlausibel}–${def.zweitwert.maxPlausibel}` : ""} {def.einheit}).
        </div>
      )}

      {/* «Nicht erhebbar»: bei allen Parametern an derselben Stelle — unter dem
          Eingabebereich, als leiser Textknopf. */}
      <div style={{ marginTop: 6 }}>
        {feld.nichtErhebbar ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>
              Nicht erhebbar — der Grund wird dokumentiert.
            </span>
            <TextInput label="Grund der Nichterhebung" required value={feld.grund} onChange={v => onAendern({ grund: v })}
              placeholder="z.B. Pulsoxymeter defekt, Ersatzgerät bestellt." steuerelementMaxBreite="26rem" />
            <button type="button" className="ui-fokusring" style={leiserKnopf}
              onClick={() => onAendern({ nichtErhebbar: false, grund: "" })}>
              Zurücksetzen — Wert doch erfassen
            </button>
          </div>
        ) : (
          <button type="button" className="ui-fokusring" style={leiserKnopf}
            onClick={() => onAendern({ nichtErhebbar: true, wert: "", zweit: "", beurteilung: null, begruendung: "" })}>
            Nicht erhebbar …
          </button>
        )}
      </div>

      {/* Kontext und Beurteilung: in derselben Karte, unter einer Haarlinie. */}
      {offen && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: "var(--border-thin) solid var(--border-default)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          {def.qualifier.map(q => (
            <SegmentedControl key={q.feld} label={q.pflicht ? `${q.label} *` : q.label}
              value={feld.qualifier[q.feld] ?? ""}
              onChange={v => onAendern({ qualifier: { ...feld.qualifier, [q.feld]: v } })}
              options={q.werte.map(x => ({ value: x.code, label: x.label }))} />
          ))}

          <div>
            <BeurteilungsWahl wert={feld.beurteilung} gesperrt={!darfBeurteilen}
              onWahl={b => onAendern({ beurteilung: b })} />
            {/* Der Bezugsrahmen wird angezeigt — nie berechnet, nie ausgewertet. */}
            <div style={{ marginTop: 4, fontSize: "var(--text-micro)", color: "var(--text-tertiary)", maxWidth: "62ch" }}>
              {bezugsrahmenText}
            </div>
            {!darfBeurteilen && (
              <div style={{ marginTop: 4, fontSize: "var(--text-micro)", color: "var(--text-secondary)", maxWidth: "62ch" }}>
                Beurteilen kann nur eine Pflegefachperson. Die Beurteilung bleibt offen;
                beim Speichern entsteht eine Pendenz bei der Bezugsfachperson.
              </div>
            )}
            {darfBeurteilen && feld.beurteilung && feld.beurteilung !== "normal" && (
              <div style={{ marginTop: 8 }}>
                <TextInput label="Begründung" required value={feld.begruendung} onChange={v => onAendern({ begruendung: v })}
                  placeholder="z.B. Zweite Messung nach 10 Minuten Ruhe unverändert."
                  hint={`Beim Speichern entsteht die Pendenz «Arzt informieren: ${def.label} ${BEURTEILUNG_LABEL[feld.beurteilung]}», verknüpft mit dieser Messung.`} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const leiserKnopf: React.CSSProperties = {
  alignSelf: "flex-start", background: "none", border: "none", padding: 0, fontFamily: "inherit",
  fontSize: "var(--text-micro)", fontWeight: "var(--weight-medium)",
  color: "var(--text-tertiary)", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 2,
};

/**
 * Beurteilung — drei Schaltflächen. VOR der Auswahl trägt keine Farbe; NACH
 * der Auswahl erscheinen die beiden Abweichungswerte in der Warnfarbe mit
 * Warnsymbol und stärkerer Schrift, «im erwarteten Bereich» bleibt farblos
 * gefüllt. Das System belegt nie vor.
 */
function BeurteilungsWahl({ wert, gesperrt, onWahl }: {
  wert: Beurteilung | null;
  gesperrt: boolean;
  onWahl: (b: Beurteilung | null) => void;
}) {
  const optionen: { code: Beurteilung; abweichung: boolean }[] = [
    { code: "abnormally_low", abweichung: true },
    { code: "normal", abweichung: false },
    { code: "abnormally_high", abweichung: true },
  ];
  return (
    <div>
      <div style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", fontWeight: "var(--weight-regular)", marginBottom: 4 }}>Beurteilung</div>
      <div role="radiogroup" aria-label="Beurteilung" style={{ display: "flex", gap: 6, flexWrap: "wrap", opacity: gesperrt ? 0.55 : 1 }}>
        {optionen.map(o => {
          const gewaehlt = wert === o.code;
          const warn = gewaehlt && o.abweichung;
          return (
            <button key={o.code} type="button" role="radio" aria-checked={gewaehlt} disabled={gesperrt}
              className={gesperrt ? "inline-flex items-center" : "ui-fokusring inline-flex items-center"}
              onClick={() => onWahl(gewaehlt ? null : o.code)}
              style={{
                gap: 5, padding: "5px 12px", borderRadius: "var(--radius-pill)", fontFamily: "inherit",
                fontSize: "var(--text-meta)",
                fontWeight: warn ? "var(--weight-medium)" : "var(--weight-regular)",
                background: warn ? "var(--status-warning-bg)" : gewaehlt ? "var(--bg-secondary)" : "transparent",
                border: "var(--border-thin) solid " + (warn ? "var(--status-warning-text)" : gewaehlt ? "var(--text-secondary)" : "var(--border-default)"),
                color: warn ? "var(--status-warning-text)" : "var(--text-primary)",
                cursor: gesperrt ? "not-allowed" : "pointer",
              }}>
              {warn && <AlertTriangle style={{ width: 12, height: 12 }} />}
              {BEURTEILUNG_LABEL[o.code]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

