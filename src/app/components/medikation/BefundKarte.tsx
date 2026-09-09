/**
 * Befundkarte — ein Ergebnis des Prüfdienstes, unverändert wiedergegeben.
 *
 * DER BEFUNDTEXT WIRD NICHT ANGETASTET: nicht gekürzt, nicht umformuliert,
 * nicht zusammengefasst, nicht von einer Maschine nacherzählt. Lange Texte
 * werden OPTISCH auf drei Zeilen begrenzt und auf Verlangen ganz geöffnet —
 * der gespeicherte Wortlaut bleibt derselbe. Der Unterschied ist wesentlich:
 * eine inhaltliche Kürzung wäre unsere Aussage über seine.
 *
 * DER SCHWEREGRAD BLEIBT IM FORMAT DES ANBIETERS — Wert, Skalenmaximum und
 * seine Bezeichnung. Keine Umrechnung, keine eigene Ampel: die Skala gehört
 * dem zertifizierten Produkt, nicht uns.
 *
 * DIE FARBIGE MARKE ZEIGT DIE BEARBEITUNG, nicht den Schweregrad — das ist
 * unsere Achse (offen / zur Kenntnis genommen / übersteuert).
 */
import { useState } from "react";
import { AlertTriangle, CheckCircle2, ShieldOff, Lock, ImageOff, ExternalLink } from "lucide-react";
import { AppButton } from "../ui/AppButton";
import { StatusMarke } from "../ui/StatusMarke";
import { TextareaInput } from "../form/TextareaInput";
import { isoZuAnzeige } from "../../../lib/datum";
import { Pruefzeichen } from "./Pruefzeichen";
import { arzneimittelNachId } from "../../../lib/medikation/arzneimittel";
import {
  PRUEFART_ETIKETT, BEFUNDZUSTAND_LABEL, wirkstoffeMitMenge,
  type Befund, type BefundBearbeitung, type BefundZustand, type Medikationsposition,
} from "../../../lib/medikation/medikation";
import { MOCK_KENNZEICHNUNG } from "../../../lib/medikation/pruefdienst";

const ZUSTAND_MARKE: Record<BefundZustand, { variante: "warnung" | "erfolg" | "info"; icon: typeof AlertTriangle }> = {
  offen: { variante: "warnung", icon: AlertTriangle },
  zur_kenntnis_genommen: { variante: "info", icon: CheckCircle2 },
  uebersteuert: { variante: "info", icon: ShieldOff },
};

export function BefundKarte({ befund, bearbeitung, positionen, darfEntscheiden, onQuittieren, onUebersteuern }: {
  befund: Befund;
  bearbeitung: BefundBearbeitung;
  positionen: Medikationsposition[];
  /** Nur Rollen mit Fachqualifikation entscheiden über einen Befund. */
  darfEntscheiden: boolean;
  onQuittieren: () => void;
  onUebersteuern: (begruendung: string) => void;
}) {
  const [dialogOffen, setDialogOffen] = useState(false);
  const [textOffen, setTextOffen] = useState(false);
  const betroffen = befund.positionIds
    .map(id => positionen.find(p => p.id === id))
    .filter((p): p is Medikationsposition => !!p);
  const marke = ZUSTAND_MARKE[bearbeitung.zustand];

  return (
    <div id={`befund-${befund.id}`} style={{
      padding: "14px 16px", borderRadius: "var(--radius-card)",
      background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)",
    }}>
      {/* 1 — betroffene Präparate als Paar oder Gruppe */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
        <Pruefzeichen art={befund.art} status="mit_befund" groesse={20} />
        <span style={{ flex: 1, minWidth: 180, fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>
          {betroffen.map(p => p.productName).join(" + ")}
        </span>
        <StatusMarke label={BEFUNDZUSTAND_LABEL[bearbeitung.zustand]} variante={marke.variante} icon={marke.icon} />
      </div>

      {/* 2 — Kategorie-Etikett und Schweregrad im Anbieterformat */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        <StatusMarke label={PRUEFART_ETIKETT[befund.art]} variante="neutral" />
        <span style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>
          Schweregrad {befund.schweregrad.wert} von {befund.schweregrad.maximum} ({befund.schweregrad.bezeichnung})
          <span style={{ color: "var(--text-tertiary)" }}> · {befund.schweregrad.skala}</span>
        </span>
        {MOCK_KENNZEICHNUNG && <StatusMarke label="Beispieldaten" variante="neutral" />}
      </div>

      {/* 3 — Wortlaut des Anbieters; optisch begrenzt, inhaltlich vollständig */}
      <p style={{
        margin: "0 0 4px", fontSize: "var(--text-small)", color: "var(--text-primary)", maxWidth: "76ch",
        ...(textOffen ? {} : { display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }),
      }}>
        {befund.text}
      </p>
      <button type="button" onClick={() => setTextOffen(o => !o)} aria-expanded={textOffen} className="ui-fokusring"
        style={{ marginBottom: 10, background: "none", border: "none", padding: 0, fontFamily: "inherit", fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", color: "var(--brand-accent)", cursor: "pointer" }}>
        {textOffen ? "Weniger anzeigen" : "Mehr anzeigen"}
      </button>

      {/* 4 — je beteiligtes Präparat: Name, Wirkstoffe mit Menge, Platzhalter */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
        {betroffen.map(p => <PraeparatZeile key={p.id} p={p} />)}
      </div>

      {/* 5 — Quelle, Regelstand, Verantwortung */}
      <div style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", marginBottom: 8 }}>
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

      {/* 6 — Aktionen oder Rollensperre */}
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
        <UebersteuerungsDialog befundText={befund.text}
          onAbbrechen={() => setDialogOffen(false)}
          onBestaetigen={b => { onUebersteuern(b); setDialogOffen(false); }} />
      )}
    </div>
  );
}

/**
 * Eine Zeile je beteiligtes Präparat. Bild und Kompendium-Verweis sind
 * PLATZHALTER: beides hängt an der späteren Index-Lizenz und wird hier
 * bewusst nicht vorgetäuscht — ein toter Link wäre schlimmer als ein
 * sichtbarer Platzhalter.
 */
function PraeparatZeile({ p }: { p: Medikationsposition }) {
  const katalog = p.productCode ? arzneimittelNachId(p.productCode) : undefined;
  const stoffe = katalog
    ? wirkstoffeMitMenge(katalog.wirkstoff, katalog.staerke)
    : wirkstoffeMitMenge("", p.staerke);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: "var(--radius-card)", background: "var(--bg-secondary)" }}>
      <span aria-hidden="true" style={{
        width: 34, height: 34, flexShrink: 0, borderRadius: "var(--control-radius)",
        border: "var(--border-thin) dashed var(--border-default)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <ImageOff style={{ width: 14, height: 14, color: "var(--text-tertiary)" }} />
      </span>
      <span style={{ flex: 1, minWidth: 140 }}>
        <span style={{ display: "block", fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>
          {p.productName} {p.darreichungsform}
        </span>
        <span style={{ display: "block", fontSize: "var(--text-micro)", color: "var(--text-secondary)" }}>
          {stoffe.length > 0 ? stoffe.join(" · ") : "Wirkstoff nicht erfasst"}
        </span>
      </span>
      <span title="Verweis auf das Arzneimittelkompendium — folgt mit der Index-Lizenz."
        style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "var(--text-micro)", color: "var(--text-tertiary)", whiteSpace: "nowrap" }}>
        <ExternalLink style={{ width: 12, height: 12 }} /> Kompendium folgt
      </span>
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
      style={{ position: "fixed", inset: 0, zIndex: 70, background: "rgba(19,19,20,0.28)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 520, maxWidth: "100%", background: "var(--bg-elevated)", borderRadius: "var(--radius-card)", border: "var(--border-thin) solid var(--border-default)", boxShadow: "var(--shadow-overlay)" }}>
        <div style={{ padding: "16px 20px 8px", fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>
          Befund übersteuern
        </div>
        <div style={{ padding: "8px 20px 16px", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          <p style={{ margin: 0, fontSize: "var(--text-meta)", color: "var(--text-secondary)", maxWidth: "68ch" }}>
            Der Befund bleibt bestehen und sichtbar. Festgehalten wird, dass Sie ihn bewusst
            anders beurteilen — mit Ihrem Namen, dem Zeitpunkt und dieser Begründung.
          </p>
          <div style={{ padding: "10px 12px", borderRadius: "var(--radius-card)", background: "var(--bg-secondary)", fontSize: "var(--text-meta)", color: "var(--text-secondary)", maxWidth: "68ch", maxHeight: 120, overflowY: "auto" }}>
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
          <AppButton variant="primaer" disabled={!begruendung.trim()} onClick={() => onBestaetigen(begruendung)}>
            Übersteuern
          </AppButton>
        </div>
      </div>
    </div>
  );
}
