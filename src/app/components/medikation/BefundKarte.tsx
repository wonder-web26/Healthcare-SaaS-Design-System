/**
 * Befundkarte — ein Ergebnis des Prüfdienstes, unverändert wiedergegeben.
 *
 * DER BEFUNDTEXT WIRD NICHT ANGETASTET: nicht gekürzt, nicht umformuliert,
 * nicht zusammengefasst, nicht von einer Maschine nacherzählt. Was der
 * Anbieter schreibt, liest die Fachperson.
 *
 * DER SCHWEREGRAD BLEIBT IM FORMAT DES ANBIETERS — Wert, Skalenmaximum und
 * seine Bezeichnung. Keine Umrechnung, keine eigene Ampel: eine 2 von 4 wird
 * hier nicht zu «gelb», weil die Skala dem Anbieter gehört, nicht uns.
 *
 * DIE FARBIGE MARKE ZEIGT DIE BEARBEITUNG, nicht den Schweregrad — das ist
 * unsere Achse (offen / zur Kenntnis genommen / übersteuert) und darf darum
 * auch unsere Marke tragen.
 */
import { useState } from "react";
import { AlertTriangle, CheckCircle2, ShieldOff, Lock } from "lucide-react";
import { AppButton } from "../ui/AppButton";
import { StatusMarke } from "../ui/StatusMarke";
import { TextareaInput } from "../form/TextareaInput";
import { isoZuAnzeige } from "../../../lib/datum";
import {
  PRUEFART_LABEL, BEFUNDZUSTAND_LABEL,
  type Befund, type BefundBearbeitung, type BefundZustand, type Medikationsposition,
} from "../../../lib/medikation/medikation";
import { MOCK_KENNZEICHNUNG } from "../../../lib/medikation/pruefdienst";

const ZUSTAND_MARKE: Record<BefundZustand, { variante: "warnung" | "erfolg" | "info"; icon: typeof AlertTriangle }> = {
  offen: { variante: "warnung", icon: AlertTriangle },
  zur_kenntnis_genommen: { variante: "info", icon: CheckCircle2 },
  uebersteuert: { variante: "info", icon: ShieldOff },
};

export function BefundKarte({ befund, bearbeitung, positionen, darfEntscheiden, hervorgehoben, onQuittieren, onUebersteuern }: {
  befund: Befund;
  bearbeitung: BefundBearbeitung;
  /** Alle Positionen — für die Namen der betroffenen Präparate. */
  positionen: Medikationsposition[];
  /** Nur Rollen mit Fachqualifikation entscheiden über einen Befund. */
  darfEntscheiden: boolean;
  hervorgehoben: boolean;
  onQuittieren: () => void;
  onUebersteuern: (begruendung: string) => void;
}) {
  const [dialogOffen, setDialogOffen] = useState(false);
  const betroffen = befund.positionIds
    .map(id => positionen.find(p => p.id === id))
    .filter((p): p is Medikationsposition => !!p);
  const marke = ZUSTAND_MARKE[bearbeitung.zustand];

  return (
    <div id={`befund-${befund.id}`} style={{
      padding: "14px 16px", borderRadius: "var(--radius-card)",
      background: "var(--bg-elevated)",
      border: hervorgehoben
        ? "var(--border-thin) solid var(--brand-primary)"
        : "var(--border-thin) solid var(--border-default)",
      boxShadow: hervorgehoben ? "0 0 0 3px var(--brand-primary-light)" : "none",
    }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
        <span style={{ fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>
          {PRUEFART_LABEL[befund.art]}
        </span>
        <span style={{ flex: 1, minWidth: 160, fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>
          {betroffen.map(p => p.productName).join(" + ")}
        </span>
        <StatusMarke label={BEFUNDZUSTAND_LABEL[bearbeitung.zustand]} variante={marke.variante} icon={marke.icon} />
        {MOCK_KENNZEICHNUNG && <StatusMarke label="Beispieldaten" variante="neutral" />}
      </div>

      {/* Schweregrad im Format des Anbieters — Zahl, Maximum, seine Bezeichnung. */}
      <div style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", marginBottom: 8 }}>
        Schweregrad {befund.schweregrad.wert} von {befund.schweregrad.maximum} ({befund.schweregrad.bezeichnung})
        <span style={{ color: "var(--text-tertiary)" }}> · {befund.schweregrad.skala}</span>
      </div>

      {/* Wortlaut des Anbieters, unverändert. */}
      <p style={{ margin: "0 0 10px", fontSize: "var(--text-small)", color: "var(--text-primary)", maxWidth: "76ch" }}>
        {befund.text}
      </p>

      <div style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", marginBottom: 10 }}>
        Quelle: {befund.quelle} · {befund.regelstand} · geprüft {isoZuAnzeige(befund.geprueftAm)}
      </div>

      <div style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", marginBottom: 10, maxWidth: "76ch" }}>
        Der Hinweis ersetzt keine fachliche Beurteilung. Die Entscheidung liegt bei der
        Gesundheitsfachperson.
      </div>

      {bearbeitung.zustand !== "offen" && (
        <div style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", marginBottom: 10 }}>
          {BEFUNDZUSTAND_LABEL[bearbeitung.zustand]} von {bearbeitung.vonName}
          {bearbeitung.am ? `, ${isoZuAnzeige(bearbeitung.am)}` : ""}
          {bearbeitung.begruendung && (
            <span style={{ display: "block", color: "var(--text-primary)" }}>Begründung: {bearbeitung.begruendung}</span>
          )}
        </div>
      )}

      {darfEntscheiden ? (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <AppButton variant="sekundaer" disabled={bearbeitung.zustand === "zur_kenntnis_genommen"}
            onClick={onQuittieren}>
            Zur Kenntnis genommen
          </AppButton>
          <AppButton variant="tertiaer" onClick={() => setDialogOffen(true)}>Übersteuern …</AppButton>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 12px", borderRadius: "var(--radius-card)", background: "var(--bg-secondary)" }}>
          <Lock style={{ width: 14, height: 14, color: "var(--text-tertiary)", flexShrink: 0, marginTop: 2 }} />
          <span style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)", maxWidth: "70ch" }}>
            Über einen Befund entscheidet eine Pflegefachperson. Bitte die zuständige
            Bezugsfachperson beiziehen — sie steht im Reiter «Personalien» unter Bezugs- und
            Pflegeteam.
          </span>
        </div>
      )}

      {dialogOffen && (
        <UebersteuerungsDialog
          befundText={befund.text}
          onAbbrechen={() => setDialogOffen(false)}
          onBestaetigen={b => { onUebersteuern(b); setDialogOffen(false); }} />
      )}
    </div>
  );
}

/** Übersteuern verlangt eine Begründung — ohne sie bleibt der Knopf gesperrt. */
function UebersteuerungsDialog({ befundText, onAbbrechen, onBestaetigen }: {
  befundText: string;
  onAbbrechen: () => void;
  onBestaetigen: (begruendung: string) => void;
}) {
  const [begruendung, setBegruendung] = useState("");
  return (
    <div role="dialog" aria-modal="true" aria-label="Befund übersteuern" onClick={onAbbrechen}
      style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(19,19,20,0.28)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 520, maxWidth: "100%", background: "var(--bg-elevated)", borderRadius: "var(--radius-card)", border: "var(--border-thin) solid var(--border-default)", boxShadow: "var(--shadow-overlay)" }}>
        <div style={{ padding: "16px 20px 8px", fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>
          Befund übersteuern
        </div>
        <div style={{ padding: "8px 20px 16px", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          <p style={{ margin: 0, fontSize: "var(--text-meta)", color: "var(--text-secondary)", maxWidth: "68ch" }}>
            Der Befund bleibt bestehen und sichtbar. Festgehalten wird, dass Sie ihn bewusst
            anders beurteilen — mit Ihrem Namen, dem Zeitpunkt und dieser Begründung.
          </p>
          <div style={{ padding: "10px 12px", borderRadius: "var(--radius-card)", background: "var(--bg-secondary)", fontSize: "var(--text-meta)", color: "var(--text-secondary)", maxWidth: "68ch" }}>
            {befundText}
          </div>
          <TextareaInput label="Begründung" required value={begruendung} onChange={setBegruendung}
            placeholder="z.B. Kombination ärztlich bestätigt, Blutdruck wird zweimal wöchentlich kontrolliert."
            hint="Pflichtangabe — ohne Begründung lässt sich der Befund nicht übersteuern." />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, padding: "12px 20px", borderTop: "var(--border-thin) solid var(--border-default)" }}>
          <button type="button" onClick={onAbbrechen} className="ui-fokusring"
            style={{ background: "none", border: "none", padding: 0, fontFamily: "inherit", fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-secondary)", cursor: "pointer" }}>
            Abbrechen
          </button>
          <AppButton variant="primaer" disabled={!begruendung.trim()}
            onClick={() => onBestaetigen(begruendung)}>
            Übersteuern
          </AppButton>
        </div>
      </div>
    </div>
  );
}
