/**
 * Pflegeplan — Aufbau (Lauf 2): die Ansicht für die Erstplanung.
 *
 * Links die Auswahl zum aktuellen Fokus, rechts der Plan, wie er wächst —
 * Übernehmen läuft in Leserichtung (Quelle links, Ergebnis rechts;
 * A/B-Entscheid nach Lauf 6f). Kein Overlay, kein Seitenwechsel: die Frage
 * «passt diese Diagnose» ist nur beantwortbar, wenn man sieht, was schon im
 * Plan steht. Für den Laptop gebaut; mobil ist ausdrücklich kein Ziel — die
 * Planung findet nicht beim Klienten statt.
 */
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowRight, ClipboardList } from "lucide-react";
import { MOCK_ASSESSMENTS } from "../../../lib/mocks/klinische-artefakte-mock";
import { zieleZuDiagnose, interventionenZuZiel } from "../../../lib/pflegeplan/mock-adapter";
import {
  usePlan, veroeffentlichen, planAendern,
  pruefungDurchfuehren, pruefungAktuell, offeneBefunde, planSchnappschuss,
  nachPrioritaet,
  type PruefBefund,
} from "../../../lib/pflegeplan/plan-store";
import { type MandatKurz } from "../../../lib/pflegeplan/planung";
import { getPatient } from "../../../lib/patienten/store";
import { useMandate } from "../../../lib/mandate/store";
import { GESETZESGRUNDLAGE } from "../../../lib/stammdaten/mandat";
import { GEGENWART_ISO } from "../../../lib/gegenwart";
import { useCurrentUser } from "../../auth";
import { PlanBaum } from "./PlanBaum";
import { AuswahlBereich } from "./AuswahlBereich";
import { StrukturAnsicht } from "./StrukturAnsicht";
import { DokumentAnsicht } from "./DokumentAnsicht";
import { PruefungsPanel } from "./PruefungsPanel";
import { planWochenSummeMin, datumAnzeige, type Fokus } from "./gemeinsam";

/**
 * Der geführte Einstieg: rechnet sich aus dem Planzustand und sagt immer, was
 * als Nächstes dran ist. Er schlägt vor, er zwingt nicht.
 *
 * Übersprungen werden Diagnosen ohne hinterlegte Ziele (dort ist «kein Ziel»
 * der Normalfall, kein offener Schritt) und Ziele ohne verfügbare
 * Interventionen (selbst formulierte) — sonst zeigte der Balken dauerhaft
 * einen Schritt, der ins Leere führt.
 *
 * Übersprungen heisst aber nicht erledigt: eine Diagnose ohne Ziel bleibt im
 * Plan und wird in Lauf 6 ein Wirksamkeitsbefund. Sind alle bearbeitbaren
 * Schritte erledigt und bleiben übersprungene Elemente, sagt der Balken das
 * («ohne Anschluss») — «Alle Angaben vollständig» erscheint nur, wenn nichts
 * übersprungen wurde.
 */
type BalkenZustand =
  | { art: "schritt"; text: string; fokus: Fokus }
  | { art: "ohne-anschluss"; text: string; fokus: Fokus; baumZiel: string }
  | { art: "vollstaendig" };

function naechsterSchritt(plan: ReturnType<typeof usePlan>): BalkenZustand {
  if (plan.diagnosen.length === 0) {
    return { art: "schritt", text: "Schritt 1 von 3: Pflegediagnose übernehmen", fokus: { schritt: 1 } };
  }
  /* Phase 2: in PRIORITÄTSREIHENFOLGE abarbeiten — die wichtigen zuerst. */
  const sortiert = nachPrioritaet(plan.diagnosen);
  for (const d of sortiert) {
    const hatPlanZiele = plan.ziele.some(z => z.diagnoseCode === d.code);
    if (!hatPlanZiele && zieleZuDiagnose(d.code).length > 0) {
      return { art: "schritt", text: `Schritt 2 von 3: Ziel wählen für ${d.titel}`, fokus: { schritt: 2, diagnoseCode: d.code } };
    }
  }
  for (const d of sortiert) {
    for (const z of plan.ziele.filter(x => x.diagnoseCode === d.code)) {
      const hatMassnahme = plan.massnahmen.some(m => m.zielBezuege.some(b => b.diagnoseCode === z.diagnoseCode && b.zielId === z.zielId));
      if (!hatMassnahme && z.diagnoseCode !== null && interventionenZuZiel(z.diagnoseCode, z.zielId).length > 0) {
        return {
          art: "schritt",
          text: `Schritt 3 von 3: Massnahme wählen für ${z.titel}`,
          fokus: { schritt: 3, diagnoseCode: z.diagnoseCode, zielId: z.zielId, zielTitel: z.titel },
        };
      }
    }
  }

  /* Alles Bearbeitbare ist erledigt — was übersprungen wurde, in Baumreihenfolge. */
  const offene: { fokus: Fokus; baumZiel: string }[] = [];
  for (const d of sortiert) {
    const planZiele = plan.ziele.filter(z => z.diagnoseCode === d.code);
    if (planZiele.length === 0) {
      offene.push({ fokus: { schritt: 2, diagnoseCode: d.code }, baumZiel: `[data-baum-diagnose="${d.code}"]` });
      continue;
    }
    for (const z of planZiele) {
      if (z.diagnoseCode === null) continue;
      const hatMassnahme = plan.massnahmen.some(m => m.zielBezuege.some(b => b.diagnoseCode === z.diagnoseCode && b.zielId === z.zielId));
      if (!hatMassnahme) {
        offene.push({
          fokus: { schritt: 3, diagnoseCode: z.diagnoseCode, zielId: z.zielId, zielTitel: z.titel },
          baumZiel: `[data-baum-ziel="${z.diagnoseCode}|${z.zielId}"]`,
        });
      }
    }
  }
  /* Ungebundene Ziele (Struktur: letzte Verbindung gelöst) sind ebenfalls
     Elemente ohne Anschluss — sie werden in Lauf 6 ein Wirksamkeitsbefund. */
  for (const z of plan.ziele.filter(x => x.diagnoseCode === null)) {
    offene.push({ fokus: { schritt: 1 }, baumZiel: `[data-baum-ziel-frei="${z.zielId}"]` });
  }
  if (offene.length > 0) {
    return {
      art: "ohne-anschluss",
      text: `Nichts weiter zu wählen — ${offene.length} ${offene.length === 1 ? "Element" : "Elemente"} ohne Anschluss`,
      fokus: offene[0].fokus,
      baumZiel: offene[0].baumZiel,
    };
  }
  return { art: "vollstaendig" };
}

type Ansicht = "aufbau" | "struktur" | "dokument";

/**
 * Einstiegspunkte (Lauf 6c): eigenständig unter /pflegeplan/:patientId ODER
 * eingebettet (Onboarding-Tab, Patient360) mit patientId als Prop. Eingebettet
 * entfällt die eigene Titelzeile — der Gastgeber nennt den Klienten bereits.
 * `blattRuecksprung` gibt dem Blatt den Rückweg in den Einbettungs-Kontext.
 */
export function PflegeplanAufbau({ patientId: patientIdProp, eingebettet = false, blattRuecksprung }: {
  patientId?: string;
  eingebettet?: boolean;
  blattRuecksprung?: string;
} = {}) {
  const params = useParams();
  const patientId = patientIdProp ?? params.patientId;
  const navigate = useNavigate();
  const plan = usePlan();
  const benutzer = useCurrentUser();
  const [fokus, setFokus] = useState<Fokus>({ schritt: 1 });
  /* Ein veröffentlichter Plan öffnet im Dokument; Aufbau und Struktur
     bleiben erreichbar, aber der Einstieg ist das Dokument. */
  const [ansicht, setAnsicht] = useState<Ansicht>(() => plan.status === "veroeffentlicht" ? "dokument" : "aufbau");

  const [pruefungOffen, setPruefungOffen] = useState(false);
  const [pruefungsHinweis, setPruefungsHinweis] = useState<string | null>(null);


  const patient = patientId ? getPatient(patientId) : undefined;
  const autorin = `${benutzer.vorname.charAt(0)}. ${benutzer.name}`;
  const darfFreigeben = benutzer.role === "diplomiert";

  /* Das jüngste abgeschlossene Assessment mit getriggerten CAPs — die Quelle
     der Vorschläge. Ohne Assessment gibt es keine, und das ist kein Fehler. */
  const assessment = useMemo(() => MOCK_ASSESSMENTS
    .filter(a => a.patientId === patientId && a.status === "abgeschlossen" && a.getriggerteCaps.some(c => c.getriggert))
    .sort((a, b) => (b.abschlussDatum ?? "").localeCompare(a.abschlussDatum ?? ""))[0] ?? null, [patientId]);

  const caps = useMemo(
    () => assessment?.getriggerteCaps.filter(c => c.getriggert).map(c => c.id) ?? [],
    [assessment]);

  /* Mandate nur GELESEN — das Mandats-Modul bleibt bis Lauf 6 unberührt.
     Der Mock-Klient trägt heute genau eines; die Mehrfach-Logik ist über
     planung.test.ts belegt. */
  const alleMandate = useMandate();
  const mandate: MandatKurz[] = useMemo(() => alleMandate
    .filter(x => x.patientId === patientId && !x.ende)
    .map(x => ({ id: x.id, label: GESETZESGRUNDLAGE.find(g => g.code === x.gesetzesgrundlage)?.label ?? x.gesetzesgrundlage })),
    [alleMandate, patientId]);

  /* EINE Summenrechnung für Aufbau und Struktur (gemeinsam.tsx). */
  const summeMin = planWochenSummeMin(plan.massnahmen);
  const dritte = plan.massnahmen.filter(m => m.planung.erbringer !== "S").length;

  const schritt = naechsterSchritt(plan);

  /* Der Prüfstand — dauerhaft im Kopf sichtbar, auch bei geschlossenem
     Panel: sonst wüsste niemand, dass die Prüfung veraltet ist. Erkannt
     über die Inhalts-Signatur, nicht über einen Zeitstempel. */
  const aktuell = pruefungAktuell(plan);
  const offene = offeneBefunde(plan).length;

  /** Prüfung ausführen — NUR auf Knopfdruck, nie im Hintergrund. */
  const pruefen = (hinweis: string | null) => {
    pruefungDurchfuehren(GEGENWART_ISO);
    setPruefungsHinweis(hinweis);
    setPruefungOffen(true);
  };

  const veroeffentlichenKlick = () => {
    if (!pruefungAktuell(plan) || offeneBefunde(plan).length > 0) {
      /* Der Umweg: Veröffentlichen führt zuerst in die Prüfung — mit dem
         Hinweis, warum. Der Klick ist der Knopfdruck, der sie ausführt. */
      const warUngeprueft = plan.pruefung === null;
      const warVeraltet = plan.pruefung !== null && !pruefungAktuell(plan);
      pruefungDurchfuehren(GEGENWART_ISO);
      const offen = offeneBefunde(planSchnappschuss()).length;
      const teile: string[] = [];
      if (warUngeprueft) teile.push("Noch nicht geprüft — jetzt geprüft.");
      if (warVeraltet) teile.push("Seit der letzten Prüfung geändert — neu geprüft.");
      teile.push(offen > 0
        ? `${offen} ${offen === 1 ? "Befund" : "Befunde"} offen. Übergangene Begründungen stehen auf dem Leistungsplanungsblatt.`
        : "Keine offenen Befunde.");
      setPruefungsHinweis(teile.join(" "));
      setPruefungOffen(true);
      return;
    }
    const grund = veroeffentlichen(autorin, benutzer.role, GEGENWART_ISO);
    if (!grund) setAnsicht("dokument");
  };

  /* Ein Befund verweist auf sein Element: Ansicht wechseln, Fokus setzen,
     hinscrollen — dieselbe Mechanik wie beim «Ohne Anschluss»-Balken. */
  const zumBefundElement = (b: PruefBefund) => {
    setPruefungOffen(false);
    setPruefungsHinweis(null);
    setAnsicht("aufbau");
    let selektor = "";
    if (b.element.art === "diagnose") {
      setFokus({ schritt: 2, diagnoseCode: b.element.code });
      selektor = `[data-baum-diagnose="${b.element.code}"]`;
    } else if (b.element.art === "ziel") {
      const eintrag = (b.element.diagnoseCode
        ? plan.ziele.find(z => z.zielId === b.element.code && z.diagnoseCode === b.element.diagnoseCode)
        : plan.ziele.find(z => z.zielId === b.element.code && z.diagnoseCode !== null))
        ?? plan.ziele.find(z => z.zielId === b.element.code);
      if (eintrag?.diagnoseCode) {
        setFokus({ schritt: 3, diagnoseCode: eintrag.diagnoseCode, zielId: eintrag.zielId, zielTitel: eintrag.titel });
        selektor = `[data-baum-ziel="${eintrag.diagnoseCode}|${eintrag.zielId}"]`;
      } else {
        selektor = `[data-baum-ziel-frei="${b.element.code}"]`;
      }
    } else {
      setFokus({ schritt: "editor", interventionId: b.element.code });
      selektor = `[data-massnahme="${b.element.code}"]`;
    }
    window.setTimeout(() => {
      document.querySelector(selektor)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
  };

  /* Der Plan-Bereich: Balken, Wochensumme, Baum. */
  const planBereichInhalt = (
    <>
      {/* Der nächste-Schritt-Balken: immer genau eine richtige nächste
          Handlung — anklickbar, aber nie zwingend. */}
      <button type="button" data-naechster-schritt
          onClick={() => {
            if (schritt.art === "vollstaendig") return;
            setFokus(schritt.fokus);
            if (schritt.art === "ohne-anschluss") {
              document.querySelector(schritt.baumZiel)?.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          }}
          disabled={schritt.art === "vollstaendig"}
          className="ui-fokusring w-full text-left flex items-center"
          style={{
            gap: 8, padding: "9px 14px", marginBottom: 12, borderRadius: "var(--radius-card)",
            cursor: schritt.art !== "vollstaendig" ? "pointer" : "default",
            background: schritt.art === "schritt" ? "var(--brand-primary-light)"
              : schritt.art === "ohne-anschluss" ? "var(--status-warning-bg)" : "var(--status-success-bg)",
            border: "var(--border-thin) solid transparent",
            color: schritt.art === "schritt" ? "var(--brand-primary)"
              : schritt.art === "ohne-anschluss" ? "var(--status-warning-text)" : "var(--status-success-text)",
            fontSize: "var(--text-small)", fontWeight: 500, fontFamily: "inherit",
          }}>
          {schritt.art === "vollstaendig"
            ? "Alle Angaben vollständig"
            : <>{schritt.text} <ArrowRight style={{ width: 13, height: 13, flexShrink: 0, marginLeft: "auto" }} /></>}
      </button>

      {/* Wochensummen-Kopfzeile: Mandate und geplante Zeit (nur S). */}
      <div data-wochensumme className="flex items-center flex-wrap" style={{ gap: 12, padding: "7px 14px", marginBottom: 12, background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)" }}>
        <span style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>
          {mandate.length === 1 ? "Mandat" : "Mandate"}: {mandate.map(x => x.label).join(" · ") || "—"}
        </span>
        <span style={{ marginLeft: "auto", fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
          Geplant: {(summeMin / 60).toFixed(2)} h/Woche
        </span>
        {dritte > 0 && (
          <span style={{ fontSize: "var(--text-meta)", color: "var(--status-warning-text)" }}>
            {dritte} {dritte === 1 ? "Leistung" : "Leistungen"} durch Dritte oder abgelehnt
          </span>
        )}
      </div>

      <PlanBaum plan={plan} mandate={mandate} onFokus={setFokus}
        kontextDiagnose={fokus.schritt === 2 || fokus.schritt === 3 ? fokus.diagnoseCode : null} />
    </>
  );

  return (
    <div className="h-full flex flex-col" style={{ background: "var(--bg-primary)" }}>
      {/* Kopfzeile mit Ansichtsumschalter — eingebettet ohne Titelblock,
          der Gastgeber (Onboarding, Patient360) nennt den Klienten schon. */}
      <div style={{ padding: eingebettet ? "6px var(--space-4) 0" : "16px var(--space-6) 0", borderBottom: "var(--border-thin) solid var(--border-default)", background: "var(--bg-elevated)" }}>
        {!eingebettet && (
          <>
            <div style={{ fontSize: "var(--text-h3)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>
              Pflegeplan
            </div>
            <div style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", marginTop: 2 }}>
              {patient ? `${patient.nachname}, ${patient.vorname}` : patientId}
            </div>
          </>
        )}
        <div className="flex items-center flex-wrap" style={{ gap: 14, marginTop: eingebettet ? 4 : 10 }}>
          {(["aufbau", "struktur", "dokument"] as Ansicht[]).map(a => (
            <button key={a} type="button" onClick={() => setAnsicht(a)}
              className="ui-fokusring cursor-pointer"
              style={{
                background: "none", border: "none", padding: "0 0 8px", fontFamily: "inherit",
                fontSize: "var(--text-small)", fontWeight: 500,
                color: ansicht === a ? "var(--brand-primary)" : "var(--text-secondary)",
                borderBottom: ansicht === a ? "2px solid var(--brand-primary)" : "2px solid transparent",
              }}>
              {a === "aufbau" ? "Aufbau" : a === "struktur" ? "Struktur" : "Dokument"}
            </button>
          ))}
          {/* Rechts: Prüfstand, Prüfung, Veröffentlichen — in allen drei
              Ansichten, aber NUR wenn dieser Klient überhaupt planfähig ist:
              ohne Assessment gehört der (eine) Plan-Zustand nicht zu ihm,
              und ein Veröffentlichen-Knopf wäre ein Schreibweg auf einen
              fremden Plan (Lauf 6c, Einbettung). */}
          {assessment && (
          <div className="flex items-center flex-wrap" style={{ gap: 10, marginLeft: "auto", marginBottom: 6 }}>
            <span data-pruefstand style={{
              fontSize: "var(--text-micro)",
              color: plan.pruefung === null ? "var(--text-tertiary)"
                : !aktuell ? "var(--status-warning-text)"
                  : offene === 0 ? "var(--status-success-text)" : "var(--text-secondary)",
            }}>
              {plan.pruefung === null
                ? "Noch nicht geprüft"
                : !aktuell
                  ? "Prüfung nicht mehr aktuell — Plan wurde seither geändert"
                  : `Geprüft am ${datumAnzeige(plan.pruefung.datum)} · ${offene} offene ${offene === 1 ? "Befund" : "Befunde"}`}
            </span>
            <button type="button" data-wzw-pruefen onClick={() => pruefen(null)}
              className="ui-fokusring cursor-pointer"
              style={{ padding: "6px 14px", borderRadius: "var(--radius-pill)", background: "var(--bg-elevated)", color: "var(--text-primary)", border: "var(--border-thin) solid var(--border-default)", fontSize: "var(--text-small)", fontWeight: 500 }}>
              WZW-Prüfung durchführen
            </button>
            {plan.status !== "veroeffentlicht" && (
              <>
                {/* Deaktiviert MIT Begründung, nicht unsichtbar — unsichtbare
                    Knöpfe erzeugen Rückfragen. Das Daten-Gate sitzt zusätzlich
                    in veroeffentlichungsVorbedingung (plan-store). */}
                {!darfFreigeben && (
                  <span data-freigabe-grund style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", maxWidth: 220 }}>
                    Nur die Pflegefachperson HF darf freigeben.
                  </span>
                )}
                <button type="button" data-veroeffentlichen disabled={!darfFreigeben}
                  onClick={veroeffentlichenKlick}
                  title={darfFreigeben ? undefined : "Nur die Pflegefachperson HF darf den Plan freigeben."}
                  className={darfFreigeben ? "ui-fokusring cursor-pointer" : ""}
                  style={{
                    padding: "6px 16px", borderRadius: "var(--radius-pill)",
                    background: darfFreigeben ? "var(--brand-primary)" : "var(--bg-secondary)",
                    color: darfFreigeben ? "var(--text-on-dark)" : "var(--text-tertiary)",
                    border: darfFreigeben ? "none" : "var(--border-thin) solid var(--border-default)",
                    fontSize: "var(--text-small)", fontWeight: 500,
                    cursor: darfFreigeben ? "pointer" : "not-allowed",
                  }}>
                  Veröffentlichen
                </button>
              </>
            )}
          </div>
          )}
        </div>
      </div>

      {pruefungOffen && plan.pruefung && (
        <PruefungsPanel hinweis={pruefungsHinweis} autorin={autorin} datumIso={GEGENWART_ISO}
          onNavigiere={zumBefundElement}
          onErneutPruefen={() => pruefungDurchfuehren(GEGENWART_ISO)}
          onSchliessen={() => { setPruefungOffen(false); setPruefungsHinweis(null); }} />
      )}

      {!assessment ? (
        /* Kein Assessment: keine Vorschläge — kein Fehler. */
        <div style={{ padding: "var(--space-8) var(--space-6)", maxWidth: 560 }}>
          <div style={{ background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", borderRadius: "var(--radius-card)", padding: "var(--space-6)", textAlign: "center" }}>
            <ClipboardList style={{ width: 22, height: 22, color: "var(--text-tertiary)", margin: "0 auto 8px" }} />
            <div style={{ fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)", marginBottom: 12 }}>
              Kein abgeschlossenes Assessment
            </div>
            <button type="button" onClick={() => navigate("/interrai")} className="ui-fokusring cursor-pointer inline-flex items-center"
              style={{ gap: 6, padding: "8px 18px", borderRadius: "var(--radius-pill)", background: "var(--brand-primary)", color: "var(--text-on-dark)", border: "none", fontSize: "var(--text-small)", fontWeight: 500 }}>
              Zur Bedarfsabklärung <ArrowRight style={{ width: 13, height: 13 }} />
            </button>
          </div>
        </div>
      ) : ansicht === "dokument" ? (
        <DokumentAnsicht mandate={mandate}
          onPlanAendern={() => { planAendern(); setAnsicht("struktur"); }}
          onBlatt={() => navigate(`/pflegeplan/${patientId}/blatt${blattRuecksprung ? `?returnTo=${encodeURIComponent(blattRuecksprung)}` : ""}`)} />
      ) : ansicht === "struktur" ? (
        <StrukturAnsicht plan={plan} mandate={mandate}
          onEditor={interventionId => { setAnsicht("aufbau"); setFokus({ schritt: "editor", interventionId }); }} />
      ) : (
        <div className="flex-1 flex min-h-0">
          {/* Links: die Auswahl zum aktuellen Fokus — Übernehmen in
              Leserichtung: Quelle links, das Ergebnis wächst rechts. */}
          <div style={{ width: 480, flexShrink: 0, borderRight: "var(--border-thin) solid var(--border-default)", padding: "14px var(--space-4)", overflowY: "auto", background: "var(--bg-primary)" }}>
            <AuswahlBereich fokus={fokus} onFokus={setFokus} caps={caps} mandate={mandate}
              assessmentDatum={assessment.abschlussDatum ?? assessment.startDatum} />
          </div>

          {/* Rechts: der Plan */}
          <div className="flex-1 min-w-0" data-plan-bereich style={{ padding: "14px var(--space-6)", overflowY: "auto" }}>
            {planBereichInhalt}
          </div>
        </div>
      )}
    </div>
  );
}
