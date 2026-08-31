/**
 * Versicherungen — geteilter Abschnitt für den Reiter Personalien (Onboarding)
 * UND Patient360. Eine Komponente, zwei Verwender. Zeigt die Versicherungs-
 * verhältnisse eines Patienten als Liste (aktive zuerst, abgelaufene gedämpft),
 * mit Hinzufügen/Bearbeiten-Dialog, Beenden statt Löschen und Hinweisstreifen
 * bei Lücken. Der Typ ist eine Eigenschaft, kein Behälter: eine Liste, keine
 * fünf Abschnitte.
 */
import { useState } from "react";
import { Plus, MoreVertical, Lock, Check, AlertTriangle, X, Search, Pencil, Ban, Trash2, StickyNote } from "lucide-react";
import { GEGENWART_ISO } from "../../../lib/gegenwart";
import { isoZuAnzeige } from "../../../lib/datum";
import { KRANKENKASSEN, getVersicherer } from "../../../lib/stammdaten/krankenkassen";
import { getMandate } from "../../../lib/mandate/store";
import {
  useVersicherungenFuerPatient, aktiveVersicherung, istAktiv,
  addVersicherung, updateVersicherung, beendeVersicherung, loescheVersicherung,
  TYP_LABEL, TYP_CHIP, TYP_NUMMER_LABEL, TYP_PFLICHTFELD, TYP_TRAEGERART, VERSICHERUNGS_TYPEN,
  UNFALLDECKUNG_LABEL, UNFALLDECKUNG_WERTE,
  ABRECHNUNGSART_LABEL, ABRECHNUNGSART_ZUSATZ, ABRECHNUNGSART_WERTE,
  type VersicherungsTyp, type Versicherungsverhaeltnis, type Unfalldeckung, type Abrechnungsart,
} from "../../../lib/versicherung/store";

/** Hinweissatz unter der Typ-Auswahl (gedämpft). */
const TYP_HINWEIS: Partial<Record<VersicherungsTyp, string>> = {
  uvg: "Setzt einen gemeldeten Unfall voraus.",
  ivg: "Setzt eine erteilte IV-Verfügung voraus.",
};

const linkStyle: React.CSSProperties = { background: "none", border: "none", fontFamily: "inherit", fontSize: 13, fontWeight: 500, color: "var(--brand-accent)", cursor: "pointer" };

type Entwurf = {
  id?: string;
  typ: VersicherungsTyp;
  versichererId: string;
  gueltigAb: string;
  gueltigBis: string;
  nummer: string;
  unfalldeckung: Unfalldeckung;
  datum: string;            // Unfalldatum (uvg) bzw. Verfügungsdatum (ivg)
  bemerkung: string;
  abrechnungsart: Abrechnungsart | null;
};

function leererEntwurf(typ: VersicherungsTyp = "kvg"): Entwurf {
  return { typ, versichererId: "", gueltigAb: GEGENWART_ISO, gueltigBis: "", nummer: "", unfalldeckung: "unbekannt", datum: "", bemerkung: "", abrechnungsart: null };
}

function nummerAus(v: Versicherungsverhaeltnis): string {
  return String(v[TYP_PFLICHTFELD[v.typ]] ?? "");
}

export function VersicherungenAbschnitt({ patientId }: { patientId: string }) {
  const liste = useVersicherungenFuerPatient(patientId);
  const [dialog, setDialog] = useState<Entwurf | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);

  const aktive = liste.filter(v => istAktiv(v));
  const abgelaufen = liste.filter(v => !istAktiv(v));
  const mandate = getMandate(patientId);
  const mandatFuer = (v: Versicherungsverhaeltnis) =>
    v.typ === "kvg" ? mandate.find(m => m.versichererId === v.versichererId) : undefined;

  function oeffneBearbeiten(v: Versicherungsverhaeltnis) {
    setMenuId(null);
    setDialog({
      id: v.id, typ: v.typ, versichererId: v.versichererId,
      gueltigAb: v.gueltigAb, gueltigBis: v.gueltigBis ?? "",
      nummer: nummerAus(v), unfalldeckung: v.unfalldeckung,
      datum: (v.typ === "uvg" ? v.unfalldatum : v.typ === "ivg" ? v.verfuegungsdatum : "") ?? "",
      bemerkung: v.bemerkung ?? "",
      abrechnungsart: v.abrechnungsart,
    });
  }

  return (
    <div>
      {/* Kopf */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums" }}>
          {aktive.length} aktiv · {abgelaufen.length} abgelaufen
        </span>
        <button type="button" onClick={() => setDialog(leererEntwurf("kvg"))} className="ui-fokusring inline-flex items-center"
          style={{ ...linkStyle, marginLeft: "auto", gap: 4 }}>
          <Plus style={{ width: 14, height: 14 }} /> Versicherung hinzufügen
        </button>
      </div>

      {liste.length === 0 && (
        <div style={{ fontSize: 13, color: "var(--text-tertiary)", padding: "8px 0 12px" }}>Noch keine Versicherung erfasst.</div>
      )}

      {/* Liste */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {liste.map((v) => {
          const aktiv = istAktiv(v);
          const versicherer = getVersicherer(v.versichererId);
          const mandat = mandatFuer(v);
          const zahlen: [string, string][] = [
            [TYP_NUMMER_LABEL[v.typ], nummerAus(v) || "—"],
            ...(v.typ === "uvg" ? [["Unfalldatum", v.unfalldatum ? isoZuAnzeige(v.unfalldatum) : "—"] as [string, string]] : []),
            ...(v.typ === "ivg" ? [["Verfügungsdatum", v.verfuegungsdatum ? isoZuAnzeige(v.verfuegungsdatum) : "—"] as [string, string]] : []),
            ...(v.typ === "kvg" && v.unfalldeckung !== "unbekannt" ? [["Unfalldeckung", UNFALLDECKUNG_LABEL[v.unfalldeckung]] as [string, string]] : []),
            ["GLN Versicherung", versicherer?.glnVersicherung ?? "—"],
            ["GLN Empfänger", versicherer?.glnEmpfaenger ?? "—"],
            ...(versicherer?.bagNr ? [["BAG-Nr.", versicherer.bagNr] as [string, string]] : []),
          ];
          return (
            <div key={v.id} style={{ border: "0.5px solid var(--border-default)", borderRadius: 12, padding: "12px 14px", opacity: aktiv ? 1 : 0.6, background: "var(--bg-elevated)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ flexShrink: 0, width: 44, textAlign: "center", padding: "3px 0", borderRadius: 999, fontSize: 12, fontWeight: 500, background: "var(--bg-secondary)", color: "var(--text-primary)" }}>{TYP_CHIP[v.typ]}</span>
                <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>{versicherer?.label ?? v.versichererId}</span>
                {v.abrechnungsart && (
                  <span style={{ flexShrink: 0, padding: "2px 10px", borderRadius: 999, fontSize: 12, fontWeight: 500, background: "var(--bg-secondary)", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{ABRECHNUNGSART_LABEL[v.abrechnungsart]}</span>
                )}
                {!aktiv && (
                  <span className="inline-flex items-center" style={{ gap: 4, padding: "2px 10px", borderRadius: 999, fontSize: 12, color: "var(--text-secondary)", background: "var(--bg-secondary)" }}>
                    <Lock style={{ width: 11, height: 11 }} /> abgelaufen
                  </span>
                )}
                <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--text-tertiary)", fontVariantNumeric: "tabular-nums" }}>
                  {v.gueltigBis ? `bis ${isoZuAnzeige(v.gueltigBis)}` : `seit ${isoZuAnzeige(v.gueltigAb)}`}
                </span>
                {/* Kontextmenü */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <button type="button" aria-label="Aktionen" onClick={() => setMenuId(menuId === v.id ? null : v.id)} className="ui-fokusring inline-flex items-center justify-center"
                    style={{ width: 28, height: 28, borderRadius: 999, border: "none", background: "transparent", color: "var(--text-tertiary)", cursor: "pointer" }}>
                    <MoreVertical style={{ width: 16, height: 16 }} />
                  </button>
                  {menuId === v.id && (
                    <div role="menu" style={{ position: "absolute", right: 0, top: "100%", marginTop: 4, zIndex: 30, minWidth: 160, padding: 4, background: "var(--bg-elevated)", border: "0.5px solid var(--border-default)", borderRadius: 12, boxShadow: "var(--shadow-overlay)" }}>
                      <MenuItem icon={Pencil} label="Bearbeiten" onClick={() => oeffneBearbeiten(v)} />
                      {aktiv && <MenuItem icon={Ban} label="Beenden" onClick={() => { beendeVersicherung(v.id, GEGENWART_ISO); setMenuId(null); }} />}
                      {!mandat && <MenuItem icon={Trash2} label="Löschen" onClick={() => { loescheVersicherung(v.id); setMenuId(null); }} />}
                    </div>
                  )}
                </div>
              </div>
              {/* typabhängige Nummern + GLN/BAG */}
              <div style={{ marginLeft: 54, marginTop: 8, display: "flex", flexWrap: "wrap", gap: "4px 20px" }}>
                {zahlen.map(([label, wert]) => (
                  <span key={label} style={{ fontSize: 12 }}>
                    <span style={{ color: "var(--text-tertiary)" }}>{label} </span>
                    <span style={{ color: wert === "—" ? "var(--text-tertiary)" : "var(--text-secondary)", fontVariantNumeric: "tabular-nums" }}>{wert}</span>
                  </span>
                ))}
              </div>
              {/* Bemerkung — eigene, eingerückte Zeile mit Notizsymbol, nur wenn gesetzt, einzeilig gekürzt. */}
              {v.bemerkung && (
                <div style={{ marginLeft: 54, marginTop: 6, display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-secondary)", minWidth: 0 }}>
                  <StickyNote style={{ width: 12, height: 12, color: "var(--text-tertiary)", flexShrink: 0 }} />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.bemerkung}</span>
                </div>
              )}
              {/* §5 Mandatsbezug */}
              {mandat && (
                <div style={{ marginLeft: 54, marginTop: 6, fontSize: 12, color: "var(--status-info)" }}>
                  Mandat {mandat.id} · seit {mandat.beginn}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {dialog && (
        <VersicherungDialog
          patientId={patientId}
          entwurf={dialog}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
}

function MenuItem({ icon: Icon, label, onClick }: { icon: typeof Pencil; label: string; onClick: () => void }) {
  return (
    <button type="button" role="menuitem" onClick={onClick} className="ui-fokusring inline-flex items-center"
      style={{ width: "100%", gap: 8, padding: "7px 10px", borderRadius: 8, border: "none", background: "transparent", fontFamily: "inherit", fontSize: 13, color: "var(--text-primary)", cursor: "pointer", textAlign: "left" }}>
      <Icon style={{ width: 14, height: 14, color: "var(--text-tertiary)" }} /> {label}
    </button>
  );
}

// ── Dialog: erst Typ, dann Versicherer, dann typabhängige Felder ──────────────

function VersicherungDialog({ patientId, entwurf, onClose }: { patientId: string; entwurf: Entwurf; onClose: () => void }) {
  const [e, setE] = useState<Entwurf>(entwurf);
  const [suche, setSuche] = useState("");
  const bearbeiten = !!entwurf.id;
  const set = (patch: Partial<Entwurf>) => setE(prev => ({ ...prev, ...patch }));

  const traeger = KRANKENKASSEN.filter(k => k.art === TYP_TRAEGERART[e.typ]);
  const treffer = suche.trim()
    ? traeger.filter(k => k.label.toLowerCase().includes(suche.trim().toLowerCase())).slice(0, 8)
    : [];
  const gewaehlt = getVersicherer(e.versichererId);

  // Kassenwechsel-Hinweis (nur beim Anlegen, wenn schon eine aktive desselben Typs existiert)
  const bisherAktiv = !bearbeiten ? aktiveVersicherung(patientId, e.typ) : undefined;

  // Kartennummer-Format (nur KVG): 20 Stellen. Kein Blockieren.
  const istKvg = e.typ === "kvg";
  const karteOk = /^\d{20}$/.test(e.nummer);
  // UVG braucht ein Unfalldatum, IVG ein Verfügungsdatum (Pflicht dort).
  const datumPflicht = e.typ === "uvg" || e.typ === "ivg";
  const pflichtErfuellt = e.versichererId !== "" && e.gueltigAb !== "" && e.nummer.trim() !== "" && (!datumPflicht || e.datum !== "");

  const speichern = () => {
    if (!pflichtErfuellt) return;
    const feld = TYP_PFLICHTFELD[e.typ];
    const basis = {
      patientId, typ: e.typ, versichererId: e.versichererId,
      gueltigAb: e.gueltigAb, gueltigBis: e.gueltigBis || null,
      kartennummer: null as string | null, policennummer: null as string | null,
      schadennummer: null as string | null, verfuegungsnummer: null as string | null,
      unfalldeckung: istKvg ? e.unfalldeckung : "unbekannt" as const,
      unfalldatum: e.typ === "uvg" ? (e.datum || null) : null,
      verfuegungsdatum: e.typ === "ivg" ? (e.datum || null) : null,
      bemerkung: e.bemerkung.trim() || null,
      abrechnungsart: e.abrechnungsart,
    };
    (basis as Record<string, unknown>)[feld] = e.nummer.trim();
    if (bearbeiten && entwurf.id) {
      const { patientId: _p, ...patch } = basis;
      updateVersicherung(entwurf.id, patch);
    } else {
      addVersicherung(basis);
    }
    onClose();
  };

  return (
    <div role="dialog" aria-modal="true" aria-label={bearbeiten ? "Versicherung bearbeiten" : "Versicherung hinzufügen"} onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(19,19,20,0.28)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={(ev) => ev.stopPropagation()}
        style={{ width: 520, maxWidth: "100%", maxHeight: "88vh", overflowY: "auto", background: "var(--bg-elevated)", borderRadius: 12, border: "0.5px solid var(--border-default)", boxShadow: "var(--shadow-overlay)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px 8px" }}>
          <span style={{ fontSize: 16, fontWeight: 500, color: "var(--text-primary)" }}>{bearbeiten ? "Versicherung bearbeiten" : "Versicherung hinzufügen"}</span>
          <button type="button" aria-label="Schliessen" onClick={onClose} className="ui-fokusring inline-flex items-center justify-center" style={{ width: 28, height: 28, borderRadius: 999, border: "none", background: "transparent", color: "var(--text-tertiary)", cursor: "pointer" }}><X style={{ width: 16, height: 16 }} /></button>
        </div>

        <div style={{ padding: "8px 20px 16px", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* 1. Typ */}
          <Feld label="Typ">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {VERSICHERUNGS_TYPEN.map((t) => {
                const sel = e.typ === t;
                return (
                  <button key={t} type="button" onClick={() => set({ typ: t, versichererId: bearbeiten ? e.versichererId : "" })} disabled={bearbeiten}
                    aria-pressed={sel} className="ui-fokusring"
                    style={{ padding: "6px 12px", borderRadius: 12, fontFamily: "inherit", fontSize: 13, cursor: bearbeiten ? "default" : "pointer",
                      background: sel ? "var(--brand-primary-light)" : "var(--bg-elevated)", color: sel ? "var(--brand-primary)" : "var(--text-primary)",
                      border: "0.5px solid " + (sel ? "var(--brand-primary)" : "var(--border-default)"), boxShadow: sel ? "inset 0 0 0 1px var(--brand-primary)" : "none", opacity: bearbeiten && !sel ? 0.5 : 1 }}>
                    {TYP_LABEL[t]}
                  </button>
                );
              })}
            </div>
            {TYP_HINWEIS[e.typ] && (
              <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 6 }}>{TYP_HINWEIS[e.typ]}</div>
            )}
          </Feld>

          {/* 2. Versicherer */}
          <Feld label="Versicherer">
            {gewaehlt ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14, color: "var(--text-primary)" }}>{gewaehlt.label}</span>
                <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>GLN {gewaehlt.glnVersicherung ?? "—"}{gewaehlt.bagNr ? ` · BAG ${gewaehlt.bagNr}` : ""}</span>
                <button type="button" onClick={() => { set({ versichererId: "" }); setSuche(""); }} className="ui-fokusring" style={{ ...linkStyle, marginLeft: "auto", fontSize: 12 }}>ändern</button>
              </div>
            ) : (
              <div style={{ position: "relative" }}>
                <Search style={{ position: "absolute", left: 12, top: 11, width: 15, height: 15, color: "var(--text-tertiary)" }} />
                <input type="text" value={suche} onChange={(ev) => setSuche(ev.target.value)} placeholder="Versicherer suchen"
                  className="ui-fokusring" style={{ ...inputStil, paddingLeft: 36, borderRadius: 999 }} />
                {treffer.length > 0 && (
                  <div style={{ marginTop: 6, border: "0.5px solid var(--border-default)", borderRadius: 12, overflow: "hidden" }}>
                    {treffer.map((k) => (
                      <button key={k.value} type="button" onClick={() => { set({ versichererId: k.value }); setSuche(""); }} className="ui-fokusring"
                        style={{ display: "flex", width: "100%", justifyContent: "space-between", gap: 8, padding: "8px 12px", border: "none", borderBottom: "0.5px solid var(--border-default)", background: "var(--bg-elevated)", fontFamily: "inherit", fontSize: 13, color: "var(--text-primary)", cursor: "pointer", textAlign: "left" }}>
                        <span>{k.label}</span>
                        <span style={{ color: "var(--text-tertiary)" }}>GLN {k.glnVersicherung ?? "—"}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Feld>

          {/* 3. Gültigkeit */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <Feld label="Gültig ab *">
              <input type="date" value={e.gueltigAb} onChange={(ev) => set({ gueltigAb: ev.target.value })} className="ui-fokusring" style={{ ...inputStil, maxWidth: 180 }} />
            </Feld>
            <Feld label="Gültig bis">
              <input type="date" value={e.gueltigBis} onChange={(ev) => set({ gueltigBis: ev.target.value })} className="ui-fokusring" style={{ ...inputStil, maxWidth: 180 }} />
              <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 4 }}>Leer lassen, wenn laufend</div>
            </Feld>
          </div>

          {/* 4. typabhängige Pflicht-Nummer */}
          <Feld label={`${TYP_NUMMER_LABEL[e.typ]} *`}>
            <input type="text" value={e.nummer} onChange={(ev) => set({ nummer: ev.target.value })} className="ui-fokusring" style={inputStil}
              placeholder={istKvg ? "20-stellige Nummer" : ""} inputMode={istKvg ? "numeric" : undefined} />
            {istKvg && e.nummer.trim() !== "" && (
              karteOk
                ? <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--status-success-text)", marginTop: 4 }}><Check style={{ width: 12, height: 12 }} /> 20-stelliges Format</div>
                : <div style={{ fontSize: 12, color: "var(--status-warning-text)", marginTop: 4 }}>Format: 20 Stellen erwartet</div>
            )}
          </Feld>

          {/* UVG: Unfalldatum · IVG: Verfügungsdatum (Pflicht) */}
          {datumPflicht && (
            <Feld label={`${e.typ === "uvg" ? "Unfalldatum" : "Verfügungsdatum"} *`}>
              <input type="date" value={e.datum} onChange={(ev) => set({ datum: ev.target.value })} className="ui-fokusring" style={{ ...inputStil, maxWidth: 180 }} />
            </Feld>
          )}

          {/* KVG: Unfalldeckung — sichtbare Auswahl mit drei Werten, Vorgabe „unbekannt". */}
          {istKvg && (
            <Feld label="Unfalldeckung in der Grundversicherung">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {UNFALLDECKUNG_WERTE.map((w) => {
                  const sel = e.unfalldeckung === w;
                  return (
                    <button key={w} type="button" onClick={() => set({ unfalldeckung: w })} aria-pressed={sel} className="ui-fokusring"
                      style={{ padding: "6px 12px", borderRadius: 12, fontFamily: "inherit", fontSize: 13, cursor: "pointer",
                        background: sel ? "var(--brand-primary-light)" : "var(--bg-elevated)", color: sel ? "var(--brand-primary)" : "var(--text-primary)",
                        border: "0.5px solid " + (sel ? "var(--brand-primary)" : "var(--border-default)"), boxShadow: sel ? "inset 0 0 0 1px var(--brand-primary)" : "none" }}>
                      {UNFALLDECKUNG_LABEL[w]}
                    </button>
                  );
                })}
              </div>
            </Feld>
          )}

          {/* Abrechnungsart — Vorgabe für neue Mandate, kein Standardwert. Alle Typen. */}
          <Feld label="Abrechnungsart">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {ABRECHNUNGSART_WERTE.map((w) => {
                const sel = e.abrechnungsart === w;
                return (
                  <button key={w} type="button" onClick={() => set({ abrechnungsart: sel ? null : w })} aria-pressed={sel} className="ui-fokusring"
                    style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2, padding: "8px 14px", borderRadius: 12, fontFamily: "inherit", cursor: "pointer",
                      background: sel ? "var(--brand-primary-light)" : "var(--bg-elevated)", color: sel ? "var(--brand-primary)" : "var(--text-primary)",
                      border: "0.5px solid " + (sel ? "var(--brand-primary)" : "var(--border-default)"), boxShadow: sel ? "inset 0 0 0 1px var(--brand-primary)" : "none" }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{ABRECHNUNGSART_LABEL[w]}</span>
                    <span style={{ fontSize: 12, color: sel ? "var(--brand-primary)" : "var(--text-tertiary)" }}>{ABRECHNUNGSART_ZUSATZ[w]}</span>
                  </button>
                );
              })}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 6 }}>Vorgabe für neue Mandate. Ein einzelnes Mandat kann davon abweichen.</div>
          </Feld>

          {/* Bemerkung — letztes Feld, alle Typen, optional. */}
          <Feld label="Bemerkung">
            <textarea value={e.bemerkung} onChange={(ev) => set({ bemerkung: ev.target.value })} rows={2}
              placeholder="Kostengutsprache, Ansprechperson, Besonderheiten"
              className="ui-fokusring" style={{ ...inputStil, resize: "vertical", minHeight: 60 }} />
          </Feld>

          {bisherAktiv && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 12px", borderRadius: 12, background: "var(--status-warning-bg)" }}>
              <AlertTriangle style={{ width: 15, height: 15, color: "var(--status-warning-text)", flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                Kassenwechsel: {getVersicherer(bisherAktiv.versichererId)?.label ?? bisherAktiv.versichererId} wird beim Speichern auf den Vortag von {e.gueltigAb ? isoZuAnzeige(e.gueltigAb) : "…"} befristet.
              </span>
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, padding: "12px 20px", borderTop: "0.5px solid var(--border-default)" }}>
          <button type="button" onClick={onClose} className="ui-fokusring" style={{ ...linkStyle, color: "var(--text-secondary)" }}>Abbrechen</button>
          <button type="button" onClick={speichern} disabled={!pflichtErfuellt} className="ui-fokusring"
            style={{ padding: "8px 18px", borderRadius: 999, border: "none", fontFamily: "inherit", fontSize: 14, fontWeight: 500, background: "var(--brand-primary)", color: "var(--text-on-dark)", cursor: pflichtErfuellt ? "pointer" : "not-allowed", opacity: pflichtErfuellt ? 1 : 0.5 }}>
            Speichern
          </button>
        </div>
      </div>
    </div>
  );
}

const inputStil: React.CSSProperties = {
  width: "100%", padding: "9px 12px", fontSize: 14, borderRadius: 12,
  border: "0.5px solid var(--border-default)", background: "var(--bg-elevated)", color: "var(--text-primary)",
  fontFamily: "inherit", boxSizing: "border-box",
};

function Feld({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block" }}>
      <span style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>{label}</span>
      {children}
    </label>
  );
}
