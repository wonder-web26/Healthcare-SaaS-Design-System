/**
 * Reiter «Medikamente» — Erfassung der Medikation bei Eintritt.
 *
 * DREI ZUSTAENDE, EINE KOMPONENTE:
 *   A  nichts erfasst        → vier gleichwertige Einstiege
 *   B  Liste in Erfassung    → Liste plus Bestaetigungsleiste
 *   C  bestaetigt            → Liste schreibgeschuetzt, Kopfzeile mit Signatur
 *
 * «Noch nichts erfasst» und «die Klientin nimmt keine Medikamente ein» sind
 * NICHT dasselbe. Der zweite Fall ist eine gepruefte Aussage mit Zeitpunkt und
 * Person — dieselbe Haltung wie `Patient.noKnownAllergies` im Schema und wie
 * der Erhebungszustand bei den Allergien. Eine leere Liste behauptet nichts.
 *
 * Der Sign-off der Gesamtliste ist erst moeglich, wenn keine Position mehr
 * blockiert. Der Knopf bleibt sonst abgeschaltet und nennt daneben im Klartext,
 * wie viele Positionen fehlen — eine abgeschaltete Schaltflaeche ohne Grund
 * ist eine Sackgasse.
 */
import { useMemo, useState } from "react";
import { QrCode, Camera, Plus, Ban, CheckCircle2, Pill, AlertTriangle } from "lucide-react";
import { useCurrentRole, useCurrentUser } from "../../auth";
import { AppButton } from "../ui/AppButton";
import { StatusMarke } from "../ui/StatusMarke";
import { isoZuAnzeige } from "../../../lib/datum";
import { SegmentedControl } from "../form/SegmentedControl";
import { MedikationsListe, SPALTEN_ANZAHL } from "./MedikationsListe";
import { MedikationsEditor } from "./MedikationsEditor";
import { Tagesvorschau } from "./Tagesvorschau";
import { Wochenvorschau } from "./Wochenvorschau";
import { Pruefleiste } from "./Pruefleiste";
import { BefundKarte } from "./BefundKarte";
import { pruefungAusfuehren } from "../../../lib/medikation/pruefdienst";
import { useAllergien } from "../../../lib/allergien/store";
import { blockierendeAnzahl, type Medikationsposition } from "../../../lib/medikation/medikation";
import {
  useMedikationspositionen, useMedikationsErhebungen, getMedikationsErhebung,
  keineMedikamenteBestaetigen, listeBestaetigen, bestaetigungAufheben,
  useBefundBearbeitungen, getBefundBearbeitung, befundQuittieren, befundUebersteuern,
  ANGEMELDETE_PFLEGEFACHPERSON,
} from "../../../lib/medikation/store";

/** Darstellungswahl über denselben Daten — «Liste» ist der Standard. */
type Ansicht = "liste" | "tag" | "woche";

export function MedikamenteAbschnitt({ patientId }: { patientId: string }) {
  const positionen = useMedikationspositionen().filter(p => p.patientId === patientId);
  const erhebungen = useMedikationsErhebungen();
  const erhebung = erhebungen.find(e => e.patientId === patientId) ?? getMedikationsErhebung(patientId);
  const [editor, setEditor] = useState<{ eintrag: Medikationsposition | null } | null>(null);
  /* Reine Darstellungswahl — sie liegt lokal und berührt keine Daten. */
  const [ansicht, setAnsicht] = useState<Ansicht>("liste");
  const [pruefungOffen, setPruefungOffen] = useState(false);
  const [hervorgehoben, setHervorgehoben] = useState<string | null>(null);

  /* Medikationsprüfung: Ergebnis des externen Dienstes (hier Mock), getrennt
     von unserer Reaktion darauf (Bearbeitungszustände im Store). Allergien
     entscheiden über die Prüfbarkeit — ein von Hand erfasster Eintrag lässt
     sich nicht maschinell prüfen. */
  const allergien = useAllergien().filter(a => a.patientId === patientId
    && a.verifikationsstatus !== "refuted" && a.verifikationsstatus !== "entered-in-error");
  const freitextAllergien = allergien.filter(a => !a.substanzCodiert).map(a => a.substanzText);
  const bearbeitungen = useBefundBearbeitungen();
  const rolle = useCurrentRole();
  const benutzer = useCurrentUser();
  /* Über einen Befund entscheidet, wer fachlich qualifiziert ist. Dieselbe
     Rollenquelle wie im übrigen Produkt (auth.tsx), kein eigenes System. */
  const darfEntscheiden = rolle === "diplomiert";

  const pruefung = useMemo(
    () => pruefungAusfuehren(positionen, {
      allergienMaschinellPruefbar: allergien.length > 0 && freitextAllergien.length === 0,
      freitextAllergien,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [positionen, allergien.length, freitextAllergien.join("|")],
  );

  /** Zeilenmarker: welche Position gehört zu welchem Befund. */
  const befundJePosition = useMemo(() => {
    const z: Record<string, string> = {};
    for (const b of pruefung.befunde) for (const id of b.positionIds) z[id] = b.id;
    return z;
  }, [pruefung]);

  const offeneBefunde = pruefung.befunde.filter(b => getBefundBearbeitung(b.id).zustand === "offen").length;

  const zeigeBefund = (befundId: string) => {
    setPruefungOffen(true);
    setHervorgehoben(befundId);
    requestAnimationFrame(() => {
      document.getElementById(`befund-${befundId}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
    });
  };

  const bestaetigt = !!erhebung.bestaetigtAm;
  const blockierend = blockierendeAnzahl(positionen);
  const zustandA = !bestaetigt && positionen.length === 0;

  const signatur = erhebung.bestaetigtAm
    ? `${erhebung.bestaetigtVonName ?? ""}${erhebung.bestaetigtVonQualifikation ? `, ${erhebung.bestaetigtVonQualifikation}` : ""} · ${isoZuAnzeige(erhebung.bestaetigtAm)}`
    : "";

  return (
    <div>
      {/* ── Zustand C: Kopfzeile mit der Signatur ── */}
      {bestaetigt && (
        <div style={{
          display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
          padding: "10px 14px", borderRadius: "var(--radius-card)", marginBottom: "var(--space-4)",
          background: "var(--status-success-bg)", border: "var(--border-thin) solid var(--border-default)",
        }}>
          <CheckCircle2 style={{ width: 16, height: 16, color: "var(--status-success-text)", flexShrink: 0 }} />
          <span style={{ flex: 1, minWidth: 200, fontSize: "var(--text-small)", color: "var(--text-primary)" }}>
            {erhebung.keineMedikamente
              ? "Bestätigt: Die Klientin nimmt keine Medikamente ein."
              : "Medikationsliste bestätigt."}
            <span style={{ display: "block", fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>{signatur}</span>
          </span>
          <AppButton variant="sekundaer" onClick={() => bestaetigungAufheben(patientId)}>Änderung erfassen</AppButton>
        </div>
      )}

      {/* ── Zustand A: vier gleichwertige Einstiege ── */}
      {zustandA && (
        <div>
          <p style={{ margin: "0 0 var(--space-4)", fontSize: "var(--text-small)", color: "var(--text-secondary)", maxWidth: "68ch" }}>
            Halten Sie fest, was die Klientin bei Eintritt einnimmt. Auch ein «nichts» wird
            festgehalten — es ist eine klinische Aussage.
          </p>
          <div style={{ display: "grid", gap: "var(--space-3)", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))" }}>
            <EinstiegKarte icon={QrCode} titel="eMediplan-QR scannen"
              text="Code auf dem Medikationsplan einlesen." marke="Bald verfügbar" />
            <EinstiegKarte icon={Camera} titel="Papierliste fotografieren"
              text="Mitgebrachte Liste abfotografieren." marke="In Vorbereitung" />
            <EinstiegKarte icon={Plus} titel="Manuell erfassen"
              text="Präparat für Präparat aus den Stammdaten."
              onClick={() => setEditor({ eintrag: null })} />
            <EinstiegKarte icon={Ban} titel="Klientin nimmt keine Medikamente ein"
              text="Wird als geprüfte Aussage festgehalten."
              onClick={() => keineMedikamenteBestaetigen(patientId, ANGEMELDETE_PFLEGEFACHPERSON.name, ANGEMELDETE_PFLEGEFACHPERSON.qualifikation)} />
          </div>
        </div>
      )}

      {/* ── Zustand C mit Negativ-Aussage: keine Liste, nur die Aussage ── */}
      {bestaetigt && erhebung.keineMedikamente && positionen.length === 0 && (
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "4px 2px" }}>
          <Pill style={{ width: 16, height: 16, color: "var(--text-tertiary)", flexShrink: 0, marginTop: 2 }} />
          <p style={{ margin: 0, fontSize: "var(--text-small)", color: "var(--text-secondary)", maxWidth: "68ch" }}>
            Keine Position erfasst. Die Klientin hat bestätigt, dass sie zurzeit keine
            Medikamente einnimmt.
          </p>
        </div>
      )}

      {/* ── Zustand B und C: Prüfleiste, Umschalter, gewählte Ansicht ── */}
      {positionen.length > 0 && (
        <>
          {/* Die Prüfung gilt der ganzen Liste und steht darum über allen
              Ansichten, nicht nur über der Tabelle. */}
          <Pruefleiste ergebnis={pruefung} offen={pruefungOffen}
            onUmschalten={() => setPruefungOffen(o => !o)}
            kinder={pruefung.befunde.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                {pruefung.befunde.map(b => (
                  <BefundKarte key={b.id} befund={b}
                    bearbeitung={bearbeitungen[b.id] ?? getBefundBearbeitung(b.id)}
                    positionen={positionen} darfEntscheiden={darfEntscheiden}
                    hervorgehoben={hervorgehoben === b.id}
                    onQuittieren={() => befundQuittieren(b.id, `${benutzer.vorname} ${benutzer.name}`)}
                    onUebersteuern={g => befundUebersteuern(b.id, `${benutzer.vorname} ${benutzer.name}`, g)} />
                ))}
              </div>
            )} />

          {/* Der Umschalter ändert nur die Darstellung, nie die Daten. */}
          <div style={{ marginBottom: "var(--space-3)" }}>
            <SegmentedControl label="Ansicht" value={ansicht}
              onChange={v => setAnsicht(v as Ansicht)}
              options={[
                { value: "liste", label: "Liste" },
                { value: "tag", label: "Tag" },
                { value: "woche", label: "Woche" },
              ]} />
          </div>
          {ansicht !== "liste" && (
            <p style={{ margin: "0 0 var(--space-4)", fontSize: "var(--text-meta)", color: "var(--text-tertiary)", maxWidth: "68ch" }}>
              Vorschau der erfassten Medikation. Die Verabreichung wird nach dem Onboarding dokumentiert.
            </p>
          )}

          {ansicht === "liste" && (
            <MedikationsListe positionen={positionen} schreibgeschuetzt={bestaetigt}
              onZeile={p => setEditor({ eintrag: p })}
              befundJePosition={befundJePosition} onBefund={zeigeBefund} />
          )}
          {ansicht === "tag" && <Tagesvorschau positionen={positionen} />}
          {ansicht === "woche" && <Wochenvorschau positionen={positionen} />}

          {!bestaetigt && (
            <div style={{
              display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
              marginTop: "var(--space-4)", paddingTop: "var(--space-4)",
              borderTop: "var(--border-thin) solid var(--border-default)",
            }}>
              <AppButton variant="sekundaer" icon={Plus} onClick={() => setEditor({ eintrag: null })}>
                Medikament erfassen
              </AppButton>
              <div style={{ flex: 1, minWidth: 200 }} />
              {blockierend > 0 && (
                <StatusMarke variante="warnung"
                  label={`${blockierend} ${blockierend === 1 ? "Position ist" : "Positionen sind"} noch nicht geprüft`} />
              )}
              {/* Ein offener Befund blockiert NICHT: der Prüfstatus einer
                  Position und ein Befund des Prüfdienstes sind verschiedene
                  Achsen. Er steht als eigener Hinweis daneben. */}
              {offeneBefunde > 0 && (
                <StatusMarke variante="info" icon={AlertTriangle}
                  label={`${offeneBefunde} ${offeneBefunde === 1 ? "offener Befund" : "offene Befunde"}`} />
              )}
              <AppButton variant="primaer" disabled={blockierend > 0}
                onClick={() => listeBestaetigen(patientId, ANGEMELDETE_PFLEGEFACHPERSON.name, ANGEMELDETE_PFLEGEFACHPERSON.qualifikation)}>
                Liste bestätigen
              </AppButton>
            </div>
          )}
        </>
      )}

      {editor && (
        <MedikationsEditor patientId={patientId} eintrag={editor.eintrag} onClose={() => setEditor(null)} />
      )}
    </div>
  );
}

/** Anzahl Spalten der Liste — fuer den Bericht, aus einer Quelle. */
export const MEDIKATION_SPALTEN = SPALTEN_ANZAHL;

function EinstiegKarte({ icon: Icon, titel, text, marke, onClick }: {
  icon: typeof QrCode; titel: string; text: string;
  /** Gesetzt = der Einstieg ist sichtbar, aber nicht ausloesbar. */
  marke?: string;
  onClick?: () => void;
}) {
  const gesperrt = !onClick;
  return (
    <button type="button" onClick={onClick} disabled={gesperrt} aria-disabled={gesperrt || undefined}
      className={gesperrt ? undefined : "ui-fokusring"}
      style={{
        display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 6, textAlign: "left",
        padding: "14px 16px", borderRadius: "var(--radius-card)", fontFamily: "inherit",
        background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)",
        cursor: gesperrt ? "default" : "pointer", opacity: gesperrt ? 0.6 : 1,
      }}>
      <Icon style={{ width: 18, height: 18, color: gesperrt ? "var(--text-tertiary)" : "var(--brand-primary)" }} />
      <span style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>{titel}</span>
      <span style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>{text}</span>
      {marke && <StatusMarke label={marke} variante="neutral" style={{ marginTop: 2 }} />}
    </button>
  );
}
