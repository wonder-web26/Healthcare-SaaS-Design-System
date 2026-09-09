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
import { useState } from "react";
import { QrCode, Camera, Plus, Ban, CheckCircle2, Pill } from "lucide-react";
import { AppButton } from "../ui/AppButton";
import { StatusMarke } from "../ui/StatusMarke";
import { isoZuAnzeige } from "../../../lib/datum";
import { MedikationsListe, SPALTEN_ANZAHL } from "./MedikationsListe";
import { MedikationsEditor } from "./MedikationsEditor";
import { blockierendeAnzahl, type Medikationsposition } from "../../../lib/medikation/medikation";
import {
  useMedikationspositionen, useMedikationsErhebungen, getMedikationsErhebung,
  keineMedikamenteBestaetigen, listeBestaetigen, bestaetigungAufheben,
  ANGEMELDETE_PFLEGEFACHPERSON,
} from "../../../lib/medikation/store";

export function MedikamenteAbschnitt({ patientId }: { patientId: string }) {
  const positionen = useMedikationspositionen().filter(p => p.patientId === patientId);
  const erhebungen = useMedikationsErhebungen();
  const erhebung = erhebungen.find(e => e.patientId === patientId) ?? getMedikationsErhebung(patientId);
  const [editor, setEditor] = useState<{ eintrag: Medikationsposition | null } | null>(null);

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

      {/* ── Zustand B und C: die Liste ── */}
      {positionen.length > 0 && (
        <>
          <MedikationsListe positionen={positionen} schreibgeschuetzt={bestaetigt}
            onZeile={p => setEditor({ eintrag: p })} />

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
