import { useState, useEffect, useRef } from "react";
import { InlineSelect } from "./InlineSelect";
import { Combobox } from "../form/Combobox";
import { FormFeld } from "./FormFeld";
import { katalogSuche, katalogEintrag, KATALOG_UMFANG } from "../../../lib/medikation/arzneimittelkatalog";
import { DARREICHUNGSFORM, medikationsOptionen, medikationswertLabel } from "../../../lib/stammdaten/medikationswerte";

/** Was die Wahl meldet — entweder ein Katalogeintrag oder vier Angaben von Hand. */
export interface ArzneimittelWahlWert {
  /** Kennung des Katalogeintrags; "" heisst freitextlich. */
  arzneimittelId: string;
  produktename: string;
  wirkstoff: string;
  darreichungsform: string;
  wirkstoffmenge: string;
}

/**
 * Ein Arzneimittel aus dem Katalog wählen oder ohne Katalog erfassen.
 *
 * Nach dem Vorbild von `ui/KontaktWahl.tsx` — dieselbe Combobox mit Suche,
 * derselbe immer sichtbare letzte Eintrag, dieselbe Übernahme des Suchtexts,
 * dieselben drei Auswege. Kein zweiter Baustein daneben: was sich hier
 * unterscheidet, sind die Felder, nicht das Verhalten.
 *
 * DER STANDARD VERLANGT DEN FREITEXTWEG. Ausländische Präparate,
 * Magistralrezepturen und alles, was der Katalog nicht kennt, muss erfassbar
 * bleiben — sonst steht es gar nicht im Plan, und der Plan ist unvollständig,
 * ohne dass es jemand sieht.
 *
 * Der Wert ist die Kennung des Katalogeintrags, nie sein Name: wird der
 * Eintrag berichtigt, gilt die Berichtigung überall.
 */
export function ArzneimittelWahl({ wert, onWahl }: {
  wert: ArzneimittelWahlWert;
  onWahl: (w: ArzneimittelWahlWert) => void;
}) {
  const OHNE = "__ohne__";
  /* Der Katalog wird ausschliesslich über die zwei Lesefunktionen
     angesprochen; die Tabelle selbst ist nicht exportiert. */
  const eintraege = katalogSuche("");
  const [modus, setModus] = useState<string>(wert.arzneimittelId || (wert.produktename || wert.wirkstoff ? OHNE : ""));
  const [produktename, setProduktename] = useState(wert.produktename);
  const [wirkstoff, setWirkstoff] = useState(wert.wirkstoff);
  const [form, setForm] = useState(wert.darreichungsform);
  const [menge, setMenge] = useState(wert.wirkstoffmenge);
  /* Was gewählt war, bevor der Freitextteil aufging. */
  const [vorher, setVorher] = useState<string>(wert.arzneimittelId);
  /* Als Ref, nicht als Zustand: die Auswahl meldet den Suchtext im selben
     Klick, in dem sie die Wahl meldet. Über den Zustand gelesen käme im
     selben Durchlauf noch der vorherige Wert an. */
  const suchtext = useRef("");
  const bereich = useRef<HTMLDivElement>(null);

  const leer: ArzneimittelWahlWert = {
    arzneimittelId: "", produktename: "", wirkstoff: "", darreichungsform: "", wirkstoffmenge: "",
  };

  const felderLeeren = () => {
    setProduktename(""); setWirkstoff(""); setForm(""); setMenge("");
  };

  const abbrechen = () => {
    setModus(vorher);
    onWahl(vorher ? { ...leer, arzneimittelId: vorher } : leer);
    felderLeeren();
    suchtext.current = "";
  };

  const waehlen = (v: string) => {
    if (v === OHNE) {
      setVorher(modus === OHNE ? vorher : modus);
      /* Der Suchtext wird zum Anfangswert des Produktenamens — wer „Torem"
         getippt hat und nichts fand, tippt es nicht ein zweites Mal. */
      setProduktename(suchtext.current.trim());
      setModus(v);
      onWahl({ ...leer, produktename: suchtext.current.trim() });
      return;
    }
    setModus(v);
    felderLeeren();
    onWahl(v ? { ...leer, arzneimittelId: v } : leer);
  };

  /* Escape wirkt wie Abbrechen; der Listener hängt am Bereich, nicht am
     Dokument. */
  useEffect(() => {
    if (modus !== OHNE) return;
    const el = bereich.current;
    if (!el) return;
    const taste = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      abbrechen();
    };
    el.addEventListener("keydown", taste);
    return () => el.removeEventListener("keydown", taste);
  });

  const melden = (feld: Partial<ArzneimittelWahlWert>) => {
    const naechst = {
      arzneimittelId: "", produktename, wirkstoff, darreichungsform: form, wirkstoffmenge: menge,
      ...feld,
    };
    onWahl(naechst);
  };

  const gewaehlt = modus && modus !== OHNE ? katalogEintrag(modus) : undefined;

  return (
    <div>
      <Combobox
        label="Arzneimittel"
        value={modus || null}
        onChange={v => waehlen(v ?? "")}
        placeholder="Bitte wählen"
        searchPlaceholder="Produktename oder Wirkstoff suchen…"
        keineTrefferText={`Kein Arzneimittel gefunden. Der Katalog ist vorläufig — er hat erst ${KATALOG_UMFANG} Einträge und stammt nicht aus der Spezialitätenliste.`}
        onSuchtext={t => { suchtext.current = t; }}
        options={[
          ...eintraege.map(a => ({
            value: a.id,
            label: a.produktename,
            suchtext: a.wirkstoff,
          })),
          { value: OHNE, label: "Ohne Katalog erfassen", immer: true },
        ]} />

      {gewaehlt && (
        <div className="flex flex-wrap" style={{ gap: 14, marginTop: 8, fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>
          <span>{gewaehlt.wirkstoff}</span>
          <span>{medikationswertLabel(DARREICHUNGSFORM, gewaehlt.darreichungsform)}</span>
          <span>{gewaehlt.wirkstoffmenge}</span>
          {!gewaehlt.verfuegbar && (
            <span style={{ color: "var(--status-warning-text)" }}>Nicht mehr im Handel</span>
          )}
        </div>
      )}

      {modus === OHNE && (
        <div ref={bereich} tabIndex={-1}
          style={{ marginTop: 10, padding: "12px 14px", borderRadius: 10, background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)" }}>
          <div style={{ fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", marginBottom: 4 }}>Ohne Katalog</div>
          <p style={{ fontSize: "var(--text-micro)", color: "var(--text-tertiary)", margin: "0 0 10px", maxWidth: "70ch", lineHeight: 1.6 }}>
            Für ausländische Präparate, Magistralrezepturen und alles, was der vorläufige Katalog
            noch nicht kennt. Produktename oder Wirkstoff genügt — beide dürfen nicht leer bleiben.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 12 }}>
            <FormFeld label="Produktename" wert={produktename} platzhalter="wie auf der Packung"
              onAendern={v => { setProduktename(v); melden({ produktename: v }); }} />
            <FormFeld label="Wirkstoff" wert={wirkstoff}
              onAendern={v => { setWirkstoff(v); melden({ wirkstoff: v }); }} />
            <div>
              <div className="text-[11px] text-muted-foreground uppercase tracking-wider" style={{ fontWeight: 500, marginBottom: 3 }}>Darreichungsform</div>
              <InlineSelect value={form} platzhalter="nicht erfasst"
                onChange={v => { setForm(v); melden({ darreichungsform: v }); }}
                options={medikationsOptionen(DARREICHUNGSFORM)} />
            </div>
            <FormFeld label="Wirkstoffmenge pro Einheit" wert={menge} platzhalter="z. B. 25 mg"
              onAendern={v => { setMenge(v); melden({ wirkstoffmenge: v }); }} />
          </div>
          <div className="flex items-center" style={{ gap: 12, marginTop: 10 }}>
            <button type="button" onClick={abbrechen} className="ui-fokusring cursor-pointer"
              style={{ background: "none", border: "none", padding: 0, fontFamily: "inherit", fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>
              Abbrechen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
