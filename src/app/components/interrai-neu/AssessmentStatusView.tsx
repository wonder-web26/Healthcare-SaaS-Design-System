/**
 * Fallverlauf — geteilter Reiter Bedarfsabklärung (Onboarding UND Patient360).
 *
 * Zeigt den Verlauf des Falls als Kette: Registrierung → Abklärung → Entlassung.
 * Jede Zeile hat genau einen von vier Zuständen; höchstens eine ist der nächste
 * Schritt. Was möglich ist, stammt aus kannFormularEroeffnen — hier nur sichtbar
 * gemacht (Modell: lib/interrai/fallverlauf.ts). Kein Auswahlmenü.
 *
 * Kein eigener Scroll-Bereich — passt in den umgebenden Reiter.
 */

import { useState } from "react";
import { useNavigate } from "react-router";
import { Lock, ArrowRight, Play, CircleDashed, AlertTriangle, ChevronRight, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import {
  type Person,
  type FormularTyp,
  offenenFallSicherstellen,
  createFormular,
  formatDateTime,
  getTypLabel,
} from "../../../lib/interrai/store";
import {
  fallverlaufFuerKlient,
  ZUSATZ_REGISTRIERUNG,
  type FallverlaufModell,
  type FallverlaufZeile,
  type FormularZeile,
  type FallverlaufKontext,
} from "../../../lib/interrai/fallverlauf";

interface AssessmentStatusViewProps {
  person: Person;
  /** Encoded return path for the assessment screen */
  returnTo: string;
  /** Verwendungszusammenhang — steuert, ob die Entlassungszeile erscheint. */
  kontext: FallverlaufKontext;
}

const datum = (iso: string) => formatDateTime(iso).split(" ")[0];

export function AssessmentStatusView({ person, returnTo, kontext }: AssessmentStatusViewProps) {
  const navigate = useNavigate();
  const [, force] = useState(0);
  const rerender = () => force((n) => n + 1);
  const [ausgeklappt, setAusgeklappt] = useState<Record<string, boolean>>({});

  const oeffnen = (formularId: string) =>
    navigate(`/interrai-neu/${formularId}?returnTo=${encodeURIComponent(returnTo)}`);

  const eroeffnen = (fallId: string, typ: FormularTyp) => {
    try {
      oeffnen(createFormular(fallId, typ).id);
    } catch (e) {
      // §8: Bei sichtbarer Zulässigkeit darf das nicht vorkommen — Grund zeigen.
      toast(e instanceof Error ? e.message : "Formular kann nicht eröffnet werden");
      rerender();
    }
  };

  // Kein Fall vorhanden: die Registrierung ist der einzige nächste Schritt; sie
  // legt den Fall an. Kein Auswahlmenü.
  const ersteRegistrierung = () => {
    const fall = offenenFallSicherstellen(person.id);
    try {
      oeffnen(createFormular(fall.id, "registration").id);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Registrierung kann nicht eröffnet werden");
      rerender();
    }
  };

  const modelle = fallverlaufFuerKlient(person.id, kontext);

  if (modelle.length === 0) {
    return (
      <div style={{ padding: "16px 0" }}>
        <FallKopf kopf={{ fallnummer: null, status: "registering", openedAt: null, closedAt: null, erstelltAm: "", routeLabel: null }} />
        <div style={{ marginTop: 12 }}>
          <ZeileView
            zeile={{ art: "formular", typ: "registration", titel: getTypLabel("registration"), zustand: "naechster_schritt", formularId: null, zusatz: ZUSATZ_REGISTRIERUNG }}
            onEroeffnen={ersteRegistrierung}
            onOeffnen={oeffnen}
          />
        </div>
      </div>
    );
  }

  const [primaer, ...geschlossene] = modelle;

  return (
    <div style={{ padding: "16px 0", display: "flex", flexDirection: "column", gap: 16 }}>
      <FallBlock modell={primaer} onEroeffnen={eroeffnen} onOeffnen={oeffnen} />

      {geschlossene.map((m) => {
        const offen = !!ausgeklappt[m.fallId];
        return (
          <div key={m.fallId} style={{ border: "0.5px solid var(--border-default)", borderRadius: 12, overflow: "hidden" }}>
            <button
              type="button"
              onClick={() => setAusgeklappt((p) => ({ ...p, [m.fallId]: !p[m.fallId] }))}
              aria-expanded={offen}
              className="ui-fokusring cursor-pointer"
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "var(--bg-elevated)", border: "none", fontFamily: "inherit", textAlign: "left" }}
            >
              {offen ? <ChevronDown style={{ width: 16, height: 16, color: "var(--text-tertiary)" }} /> : <ChevronRight style={{ width: 16, height: 16, color: "var(--text-tertiary)" }} />}
              <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>{m.kopf.fallnummer ?? "—"}</span>
              <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                {m.kopf.erstelltAm ? datum(m.kopf.erstelltAm) : "—"}{m.kopf.closedAt ? `–${datum(m.kopf.closedAt)}` : ""} · {m.formularAnzahl} {m.formularAnzahl === 1 ? "Formular" : "Formulare"}
              </span>
            </button>
            {offen && (
              <div style={{ padding: "4px 14px 14px", borderTop: "0.5px solid var(--border-default)" }}>
                <FallBlock modell={m} onEroeffnen={eroeffnen} onOeffnen={oeffnen} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Fallkopf + Zeilenkette eines Falls. */
function FallBlock({ modell, onEroeffnen, onOeffnen }: {
  modell: FallverlaufModell; onEroeffnen: (fallId: string, typ: FormularTyp) => void; onOeffnen: (formularId: string) => void;
}) {
  return (
    <div>
      <FallKopf kopf={modell.kopf} />
      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
        {modell.zeilen.map((z, i) => (
          <ZeileView key={i} zeile={z} onEroeffnen={z.art === "formular" && z.typ ? () => onEroeffnen(modell.fallId, z.typ!) : undefined} onOeffnen={onOeffnen} />
        ))}
      </div>
    </div>
  );
}

function FallKopf({ kopf }: { kopf: FallverlaufModell["kopf"] }) {
  const kopftext = kopf.fallnummer
    ? kopf.fallnummer + (kopf.status === "registering" ? " · In Registrierung" : "")
    : "In Registrierung · noch keine Fallnummer vergeben";
  const zeitangabe =
    kopf.status === "open" && kopf.openedAt ? `Offen seit ${datum(kopf.openedAt)}`
    : kopf.status === "discharged" && kopf.closedAt ? `Abgeschlossen am ${datum(kopf.closedAt)}`
    : null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", paddingBottom: 12, borderBottom: "0.5px solid var(--border-default)" }}>
      <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>{kopftext}</span>
      {zeitangabe && <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{zeitangabe}</span>}
      {kopf.routeLabel && (
        <span style={{ marginLeft: "auto", padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 500, color: "var(--status-info)", background: "var(--brand-accent-light)" }}>{kopf.routeLabel}</span>
      )}
    </div>
  );
}

/** Eine Zeile des Fallverlaufs nach ihrem Zustand. */
function ZeileView({ zeile, onEroeffnen, onOeffnen }: {
  zeile: FallverlaufZeile; onEroeffnen?: () => void; onOeffnen: (formularId: string) => void;
}) {
  if (zeile.art === "hinweis") {
    return (
      <div style={{ display: "flex", gap: 10, padding: "12px 14px", borderRadius: 12, background: "var(--status-info-bg)", border: "0.5px solid var(--border-default)" }}>
        <AlertTriangle style={{ width: 16, height: 16, color: "var(--status-info)", flexShrink: 0, marginTop: 1 }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{zeile.titel}</div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>{zeile.text}</div>
        </div>
      </div>
    );
  }

  const z = zeile as FormularZeile;
  const naechster = z.zustand === "naechster_schritt";
  const gedaempft = z.zustand === "gesperrt" || z.zustand === "nicht_moeglich";

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12,
      background: "var(--bg-elevated)",
      border: "0.5px solid " + (naechster ? "var(--brand-primary)" : "var(--border-default)"),
      boxShadow: naechster ? "inset 0 0 0 1px var(--brand-primary)" : "none",
    }}>
      <span style={{ width: 18, flexShrink: 0, display: "inline-flex", justifyContent: "center" }}>
        {z.zustand === "gesperrt" && <Lock style={{ width: 15, height: 15, color: "var(--text-tertiary)" }} />}
        {z.zustand === "in_bearbeitung" && <span style={{ width: 9, height: 9, borderRadius: "50%", background: "var(--status-warning)" }} />}
        {naechster && <ArrowRight style={{ width: 16, height: 16, color: "var(--brand-primary)" }} />}
        {z.zustand === "nicht_moeglich" && <CircleDashed style={{ width: 15, height: 15, color: "var(--text-tertiary)" }} />}
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: gedaempft ? "var(--text-secondary)" : "var(--text-primary)" }}>{z.titel}</div>
        <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 2 }}>
          {z.zustand === "gesperrt" && `Gesperrt${z.gesperrtAm ? ` am ${datum(z.gesperrtAm)}` : ""}${z.gesperrtVon ? ` · ${z.gesperrtVon}` : ""}`}
          {z.zustand === "in_bearbeitung" && `${z.erfasst} von ${z.gesamt} erfasst${z.zuletzt ? ` · Zuletzt ${datum(z.zuletzt)}` : ""}`}
          {naechster && <span style={{ color: "var(--brand-primary)", fontWeight: 500 }}>Nächster Schritt</span>}
          {naechster && z.zusatz && ` · ${z.zusatz}`}
          {z.zustand === "nicht_moeglich" && z.bedingung}
        </div>
      </div>

      <div style={{ flexShrink: 0 }}>
        {z.zustand === "gesperrt" && z.formularId && (
          <button type="button" onClick={() => onOeffnen(z.formularId!)} className="ui-fokusring cursor-pointer"
            style={{ background: "none", border: "none", fontFamily: "inherit", fontSize: 13, fontWeight: 500, color: "var(--brand-accent)" }}>Ansehen</button>
        )}
        {z.zustand === "in_bearbeitung" && z.formularId && (
          <button type="button" onClick={() => onOeffnen(z.formularId!)} className="ui-fokusring cursor-pointer"
            style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 14px", borderRadius: 999, background: "var(--brand-primary)", color: "var(--text-on-dark)", border: "none", fontFamily: "inherit", fontSize: 13, fontWeight: 500 }}>
            <Play style={{ width: 13, height: 13 }} /> Fortsetzen
          </button>
        )}
        {naechster && onEroeffnen && (
          <button type="button" onClick={onEroeffnen} className="ui-fokusring cursor-pointer"
            style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 14px", borderRadius: 999, background: "var(--brand-primary)", color: "var(--text-on-dark)", border: "none", fontFamily: "inherit", fontSize: 13, fontWeight: 500 }}>
            Eröffnen
          </button>
        )}
      </div>
    </div>
  );
}
