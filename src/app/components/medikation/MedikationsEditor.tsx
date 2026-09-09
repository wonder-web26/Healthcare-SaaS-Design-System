/**
 * Editor einer Medikationsposition — Slide-over auf ui/drawer.tsx.
 *
 * FELDREIHENFOLGE IST VERBINDLICH und folgt der Erfassungslogik, nicht der
 * Datenstruktur: erst das Praeparat, dann was daraus folgt. Die
 * Applikationsart wird NIE vor der Praeparatewahl gefragt — sie ist eine
 * Eigenschaft des Produkts, keine Eingabe der Nutzerin, und kommt darum
 * vorbefuellt und schreibgeschuetzt aus den Stammdaten. Wer sie dennoch
 * aendern muss, uebersteuert ausdruecklich; das wird protokolliert.
 *
 * DIE ZWEI SCHREIBWEGE IM FUSS SIND VERSCHIEDEN GEMEINT:
 *   «Speichern + weiteres erfassen» nimmt die Angabe auf, ohne sie zu pruefen
 *   («zu_pruefen»), und stellt den Editor auf einen leeren Neuzustand.
 *   «Prüfen & bestätigen» ist die fachliche Pruefung selbst («bestaetigt»).
 * Ist der Verordner ausdruecklich unbekannt, bleibt die Position auf beiden
 * Wegen «unbestaetigt» — eine Angabe ohne gesicherte Herkunft ist nicht
 * geprueft, auch wenn jemand auf Bestaetigen drueckt.
 */
import { useMemo, useState } from "react";
import { Pencil } from "lucide-react";
import { Drawer, DrawerContent } from "../ui/drawer";
import { Checkbox } from "../ui/checkbox";
import { AppButton } from "../ui/AppButton";
import { FormField } from "../form/FormField";
import { TextInput } from "../form/TextInput";
import { TextareaInput } from "../form/TextareaInput";
import { NumberInput } from "../form/NumberInput";
import { SegmentedControl } from "../form/SegmentedControl";
import { Combobox } from "../form/Combobox";
import { DateField } from "../form/DateField";
import { FELD_MAX } from "../form/feldbreiten";
import { useFensterBreite } from "../ui/DataTable";
import { isoZuAnzeige } from "../../../lib/datum";
import { GEGENWART_ISO as GEGENWART } from "../../../lib/gegenwart";
import { useKontakte } from "../../../lib/kontakte/store";
import { kontaktName } from "../../../lib/kontakte/kontakte";
import { arzneimittelSuchen, arzneimittelNachId, arzneimittelBezeichnung } from "../../../lib/medikation/arzneimittel";
import {
  leerePosologie, POSOLOGIE_LABEL, POSOLOGIE_TYPEN_V1, QUELLE_LABEL,
  type Medikationsposition, type Posologie, type PosologieTyp, type Pruefstatus,
} from "../../../lib/medikation/medikation";
import { positionSichern, ANGEMELDETE_PFLEGEFACHPERSON } from "../../../lib/medikation/store";

export function MedikationsEditor({ patientId, eintrag, onClose }: {
  patientId: string;
  /** null = Neuzustand. */
  eintrag: Medikationsposition | null;
  onClose: () => void;
}) {
  // Unter dem Desktop-Breakpoint kommt das Blatt von unten und nimmt die
  // volle Breite — ein 384px-Streifen rechts waere auf 375px unbedienbar.
  const istSchmal = useFensterBreite() < 1024;

  /** Ein Zaehler, der beim Batch-Speichern den ganzen Formularzustand neu setzt. */
  const [runde, setRunde] = useState(0);

  /* `modal={false}` ist notwendig, nicht kosmetisch: im modalen Zustand setzt
     vaul `pointer-events: none` auf den Body, und die Aufklappliste des
     Combobox lebt in einem eigenen Portal ausserhalb des Blattes — sie waere
     sichtbar, aber nicht anklickbar, und damit liesse sich kein Praeparat
     waehlen. Das Blatt behaelt seine Verdunkelung; geschlossen wird ueber
     Escape oder «Abbrechen». */
  return (
    <Drawer open modal={false} onOpenChange={o => { if (!o) onClose(); }} direction={istSchmal ? "bottom" : "right"}>
      <DrawerContent
        aria-label={eintrag ? "Medikament bearbeiten" : "Medikament erfassen"}
        className={istSchmal ? "!max-h-[92vh]" : "sm:!max-w-[620px]"}>
        <EditorFormular
          key={`${eintrag?.id ?? "neu"}-${runde}`}
          patientId={patientId} eintrag={eintrag}
          onNaechster={() => setRunde(r => r + 1)}
          onFertig={onClose} />
      </DrawerContent>
    </Drawer>
  );
}

function EditorFormular({ patientId, eintrag, onNaechster, onFertig }: {
  patientId: string;
  eintrag: Medikationsposition | null;
  onNaechster: () => void;
  onFertig: () => void;
}) {
  const kontakte = useKontakte();

  /* 1 — Praeparat */
  const [arzneimittelId, setArzneimittelId] = useState<string | null>(eintrag?.productCode ?? null);
  const gewaehlt = arzneimittelId ? arzneimittelNachId(arzneimittelId) : undefined;

  /* 2 — Staerke/Form und Applikationsart: vorbefuellt, schreibgeschuetzt */
  const [uebersteuert, setUebersteuert] = useState(eintrag?.uebersteuert ?? false);
  const [uebersteuerungVermerk, setUebersteuerungVermerk] = useState(eintrag?.uebersteuerungVermerk ?? "");
  const [staerke, setStaerke] = useState(eintrag?.staerke ?? "");
  const [darreichungsform, setDarreichungsform] = useState(eintrag?.darreichungsform ?? "");
  const [route, setRoute] = useState(eintrag?.route ?? "");
  const [baseUnit, setBaseUnit] = useState(eintrag?.baseUnit ?? "");

  /* 3 — Dosierungsschema */
  const [posologie, setPosologie] = useState<Posologie>(eintrag?.posologie ?? leerePosologie("#-#-#-#"));

  /* 4 — Zeitraum */
  const [startDate, setStartDate] = useState(eintrag?.startDate ?? "");
  const [endDate, setEndDate] = useState(eintrag?.endDate ?? "");

  /* 5 — Grund und Anweisungen */
  const [behandlungsgrund, setBehandlungsgrund] = useState(eintrag?.behandlungsgrund ?? "");
  const [instructions, setInstructions] = useState(eintrag?.instructions ?? "");

  /* 6/7 — Selbstmedikation und Verordner */
  const [selbstmedikation, setSelbstmedikation] = useState(eintrag?.selbstmedikation ?? false);
  const [verordnerId, setVerordnerId] = useState<string | null>(eintrag?.approvedByContactId ?? null);
  const [verordnerUnbekannt, setVerordnerUnbekannt] = useState(eintrag?.verordnerUnbekannt ?? false);
  const [herkunftsvermerk, setHerkunftsvermerk] = useState(eintrag?.herkunftsvermerk ?? "");

  /* Praeparatewahl fuellt die Produkteigenschaften — sie werden nicht gefragt. */
  const praeparatWaehlen = (id: string | null) => {
    setArzneimittelId(id);
    const a = id ? arzneimittelNachId(id) : undefined;
    if (a) {
      setStaerke(a.staerke); setDarreichungsform(a.darreichungsform);
      setRoute(a.route); setBaseUnit(a.baseUnit);
      setUebersteuert(false); setUebersteuerungVermerk("");
    }
  };

  const optionen = useMemo(() => arzneimittelSuchen("").map(a => ({
    value: a.id,
    label: arzneimittelBezeichnung(a),
    suchtext: a.wirkstoff,
  })), []);

  const kontaktOptionen = useMemo(() => kontakte.map(k => ({
    value: k.id, label: kontaktName(k),
    suchtext: [k.fachgebiet, k.organisation, k.zugehoerigkeit].filter(Boolean).join(" "),
  })), [kontakte]);

  const bereit = !!gewaehlt && !!startDate;

  /** Der Pruefstatus folgt aus dem Weg und aus der Herkunft, nie aus einer Auswahl. */
  const statusFuer = (geprueft: boolean): Pruefstatus =>
    verordnerUnbekannt && !selbstmedikation ? "unbestaetigt" : geprueft ? "bestaetigt" : "zu_pruefen";

  const sichern = (geprueft: boolean) => {
    if (!bereit || !gewaehlt) return;
    const pruefstatus = statusFuer(geprueft);
    positionSichern({
      id: eintrag?.id ?? "", patientId,
      productCode: gewaehlt.id, productName: gewaehlt.name,
      staerke, darreichungsform, route, baseUnit,
      posologie,
      startDate, endDate: endDate || null,
      instructions,
      reserveIndication: posologie.typ === "reserve" ? posologie.bedingung : "",
      status: eintrag?.status ?? "active",
      approvedByContactId: selbstmedikation || verordnerUnbekannt ? null : verordnerId,
      verordnerUnbekannt: selbstmedikation ? false : verordnerUnbekannt,
      pruefstatus,
      quelle: eintrag?.quelle ?? "manuell",
      quelleAm: eintrag?.quelleAm ?? GEGENWART,
      herkunftsvermerk,
      selbstmedikation, behandlungsgrund,
      uebersteuert, uebersteuerungVermerk,
      erfasstDurchUserId: eintrag?.erfasstDurchUserId ?? ANGEMELDETE_PFLEGEFACHPERSON.userId,
      erfasstVonName: eintrag?.erfasstVonName ?? ANGEMELDETE_PFLEGEFACHPERSON.name,
      bestaetigtDurchUserId: pruefstatus === "bestaetigt" ? ANGEMELDETE_PFLEGEFACHPERSON.userId : null,
      bestaetigtVonName: pruefstatus === "bestaetigt" ? ANGEMELDETE_PFLEGEFACHPERSON.name : null,
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: 0, height: "100%" }}>
      <div style={{ padding: "18px 22px 10px", fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "var(--text-primary)" }}>
        {eintrag ? "Medikament bearbeiten" : "Medikament erfassen"}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "8px 22px 20px", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>

        {/* 1 — Praeparat */}
        {eintrag ? (
          <FormField label="Präparat">
            <div style={{ fontSize: "var(--text-small)", color: "var(--text-primary)", fontWeight: "var(--weight-medium)" }}>
              {gewaehlt ? arzneimittelBezeichnung(gewaehlt) : eintrag.productName}
            </div>
          </FormField>
        ) : (
          <Combobox label="Präparat" required value={arzneimittelId} onChange={praeparatWaehlen}
            options={optionen} placeholder="Präparat suchen"
            searchPlaceholder="Handelsname oder Wirkstoff"
            keineTrefferText="Kein Präparat gefunden."
            hint="Stammdaten des Prototyps — später über die Documedis-Produktsuche." />
        )}

        {/* 2 — Produkteigenschaften: vorbefuellt, schreibgeschuetzt, uebersteuerbar */}
        {gewaehlt && (
          <div style={{ padding: "12px 14px", borderRadius: "var(--radius-card)", background: "var(--bg-secondary)", border: "var(--border-thin) solid var(--border-default)" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", marginBottom: uebersteuert ? 10 : 0 }}>
              <span style={{ fontSize: "var(--text-meta)", color: "var(--text-secondary)" }}>Aus den Stammdaten:</span>
              <span style={{ flex: 1, minWidth: 180, fontSize: "var(--text-small)", color: "var(--text-primary)" }}>
                {[darreichungsform, staerke].filter(Boolean).join(" ")} · {route} · Einheit {baseUnit}
              </span>
              {!uebersteuert && (
                <button type="button" onClick={() => setUebersteuert(true)} className="ui-fokusring inline-flex items-center"
                  style={{ gap: 4, background: "none", border: "none", padding: 0, fontFamily: "inherit", fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", color: "var(--brand-accent)", cursor: "pointer" }}>
                  <Pencil style={{ width: 12, height: 12 }} /> Übersteuern
                </button>
              )}
            </div>
            {uebersteuert && (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                <div style={{ display: "grid", gap: "var(--space-3)", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
                  <TextInput label="Darreichungsform" value={darreichungsform} onChange={setDarreichungsform} />
                  <TextInput label="Stärke" value={staerke} onChange={setStaerke} />
                  <TextInput label="Applikationsart" value={route} onChange={setRoute} />
                </div>
                <TextInput label="Grund des Übersteuerns" required value={uebersteuerungVermerk} onChange={setUebersteuerungVermerk}
                  placeholder="z.B. Halbe Dosis auf ärztliche Anweisung"
                  hint="Wird an der Position protokolliert." />
              </div>
            )}
          </div>
        )}

        {/* 3 — Dosierungsschema */}
        <SegmentedControl label="Dosierungsschema" value={posologie.typ}
          onChange={v => setPosologie(leerePosologie(v as PosologieTyp))}
          options={POSOLOGIE_TYPEN_V1.map(t => ({ value: t, label: POSOLOGIE_LABEL[t] }))} />

        {posologie.typ === "#-#-#-#" && (
          <div style={{ display: "grid", gap: "var(--space-3)", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))" }}>
            <NumberInput label="Morgen" value={posologie.morgen} onChange={v => setPosologie({ ...posologie, morgen: v })} suffix={baseUnit} />
            <NumberInput label="Mittag" value={posologie.mittag} onChange={v => setPosologie({ ...posologie, mittag: v })} suffix={baseUnit} />
            <NumberInput label="Abend" value={posologie.abend} onChange={v => setPosologie({ ...posologie, abend: v })} suffix={baseUnit} />
            <NumberInput label="Nacht" value={posologie.nacht} onChange={v => setPosologie({ ...posologie, nacht: v })} suffix={baseUnit} />
          </div>
        )}
        {posologie.typ === "free" && (
          <TextareaInput label="Dosierung als Text" value={posologie.text} onChange={v => setPosologie({ ...posologie, text: v })}
            placeholder="z.B. Pflasterwechsel alle 72 h, jeweils Mo und Do morgens"
            hint="Freitext bleibt als solcher gespeichert und lässt sich später präzisieren." />
        )}
        {posologie.typ === "reserve" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            <TextInput label="Bedingung" value={posologie.bedingung} onChange={v => setPosologie({ ...posologie, bedingung: v })}
              placeholder="z.B. Bei Schmerzen ab NRS 5" hint="Wann die Gabe erfolgen darf." />
            <div style={{ display: "grid", gap: "var(--space-3)", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
              <TextInput label="Tageshöchstmenge" value={posologie.tageshoechstmenge} onChange={v => setPosologie({ ...posologie, tageshoechstmenge: v })} placeholder={`z.B. 4 ${baseUnit || "Tabl"}`} />
              <NumberInput label="Mindestabstand" value={posologie.mindestabstandStunden} onChange={v => setPosologie({ ...posologie, mindestabstandStunden: v })} suffix="h" />
            </div>
          </div>
        )}

        {/* 4 — Zeitraum */}
        <div style={{ display: "grid", gap: "var(--space-3)", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" }}>
          <DateField label="von" required wertFormat="iso" value={startDate || null}
            onChange={v => setStartDate((v as string) ?? "")} steuerelementMaxBreite={FELD_MAX.mittel} />
          <DateField label="bis und mit" wertFormat="iso" value={endDate || null}
            onChange={v => setEndDate((v as string) ?? "")} steuerelementMaxBreite={FELD_MAX.mittel}
            hint="Leer heisst: bis auf Weiteres." />
        </div>

        {/* 5 — Einheit, Grund, Anweisungen */}
        <TextInput label="Einheit" value={baseUnit} onChange={setBaseUnit}
          steuerelementMaxBreite={FELD_MAX.schmal} hint="Einheit einer Gabe (Tabl, Btl, Tr, Hub …)." />
        <TextInput label="Grund der Anwendung" value={behandlungsgrund} onChange={setBehandlungsgrund}
          placeholder="z.B. Arterielle Hypertonie" />
        <TextareaInput label="Anweisungen" value={instructions} onChange={setInstructions}
          placeholder="z.B. Morgens nach dem Frühstück." />

        {/* 6 — Selbstmedikation */}
        <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
          <Checkbox checked={selbstmedikation} onCheckedChange={c => setSelbstmedikation(c === true)} style={{ marginTop: 2 }} />
          <span>
            <span style={{ display: "block", fontSize: "var(--text-small)", color: "var(--text-primary)" }}>Selbstmedikation</span>
            <span style={{ display: "block", fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>
              Von der Klientin selbst beschafft. Ein Verordner wird dann nicht erfasst.
            </span>
          </span>
        </label>

        {/* 7 — Verordner; entfaellt bei Selbstmedikation (korrektes Fehlen) */}
        {!selbstmedikation && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            <Combobox label="Verordner" value={verordnerUnbekannt ? null : verordnerId}
              onChange={setVerordnerId} options={kontaktOptionen} disabled={verordnerUnbekannt}
              placeholder="Ärztin oder Institution wählen"
              searchPlaceholder="Name oder Fachgebiet"
              hint="Wer die Medikation angeordnet hat — nicht, wer sie hier erfasst." />
            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
              <Checkbox checked={verordnerUnbekannt} onCheckedChange={c => setVerordnerUnbekannt(c === true)} style={{ marginTop: 2 }} />
              <span>
                <span style={{ display: "block", fontSize: "var(--text-small)", color: "var(--text-primary)" }}>Verordner zurzeit unbekannt</span>
                <span style={{ display: "block", fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>
                  Die Position bleibt unbestätigt und blockiert die Bestätigung der Liste.
                </span>
              </span>
            </label>
          </div>
        )}

        <TextInput label="Herkunftsvermerk" value={herkunftsvermerk} onChange={setHerkunftsvermerk}
          placeholder="z.B. Angabe des Ehemanns, Präparat nicht gesichtet" />

        {/* 8 — Provenienz, schreibgeschuetzt */}
        <div style={{ padding: "12px 14px", borderRadius: "var(--radius-card)", background: "var(--bg-secondary)", border: "var(--border-thin) solid var(--border-default)" }}>
          <div style={{ fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", color: "var(--text-secondary)", marginBottom: 6 }}>Herkunft</div>
          <ProvenienzZeile beschriftung="Quelle" wert={`${QUELLE_LABEL[eintrag?.quelle ?? "manuell"]}, ${isoZuAnzeige(eintrag?.quelleAm ?? GEGENWART)}`} />
          <ProvenienzZeile beschriftung="Erfasst durch" wert={eintrag?.erfasstVonName ?? ANGEMELDETE_PFLEGEFACHPERSON.name} />
          <ProvenienzZeile beschriftung="Zuletzt geändert" wert={eintrag ? isoZuAnzeige(eintrag.geaendertAm) : "—"} />
          <ProvenienzZeile beschriftung="Bestätigt durch" wert={eintrag?.bestaetigtVonName ?? "—"} />
          {uebersteuert && <ProvenienzZeile beschriftung="Übersteuert" wert={uebersteuerungVermerk || "ohne Vermerk"} />}
        </div>
      </div>

      {/* Fuss */}
      <div style={{ borderTop: "var(--border-thin) solid var(--border-default)", padding: "12px 22px", display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>
          {verordnerUnbekannt && !selbstmedikation
            ? "Ohne Verordner bleibt die Position unbestätigt."
            : "«Prüfen & bestätigen» ist die fachliche Prüfung; die Position gilt danach als bestätigt."}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <button type="button" onClick={onFertig} className="ui-fokusring"
            style={{ background: "none", border: "none", padding: 0, fontFamily: "inherit", fontSize: "var(--text-small)", fontWeight: "var(--weight-medium)", color: "var(--text-secondary)", cursor: "pointer" }}>
            Abbrechen
          </button>
          <AppButton variant="sekundaer" disabled={!bereit} onClick={() => { sichern(false); onNaechster(); }}>
            Speichern + weiteres erfassen
          </AppButton>
          <AppButton variant="primaer" disabled={!bereit} onClick={() => { sichern(true); onFertig(); }}>
            Prüfen &amp; bestätigen
          </AppButton>
        </div>
      </div>
    </div>
  );
}

function ProvenienzZeile({ beschriftung, wert }: { beschriftung: string; wert: string }) {
  return (
    <div style={{ display: "flex", gap: 10, fontSize: "var(--text-meta)", padding: "2px 0" }}>
      <span style={{ width: 130, flexShrink: 0, color: "var(--text-tertiary)" }}>{beschriftung}</span>
      <span style={{ color: "var(--text-secondary)" }}>{wert}</span>
    </div>
  );
}
