import { useState, useEffect, useRef } from "react";
import { InlineSelect } from "./InlineSelect";
import { Combobox } from "../form/Combobox";
import { FormFeld } from "./FormFeld";
import { AdressBlock } from "./AdressBlock";
import { useKontakte, kontaktSichern } from "../../../lib/kontakte/store";
import {
  kontaktName, type Kontakt,
  KONTAKT_ANREDE, KONTAKT_TITEL, type KontaktAnrede, type KontaktTitel,
} from "../../../lib/kontakte/kontakte";
import { kontakttypLabel, type KontakttypCode } from "../../../lib/stammdaten/kontakttypen";
import type { PersonBezug } from "../../../lib/beziehungen/beziehungen";
import { formatTelefon, pruefeTelefon } from "../../../lib/telefon";

/**
 * Eine Person wählen oder anlegen — EIN Suchfeld über Kontakte UND (in der
 * Kategorie Bezugsperson) Angehörige, damit dieselbe Person nicht zweimal
 * entsteht. Findet die Suche nichts, führt „Neu erfassen" in den Anlegeblock.
 *
 * Der Wert ist die Kennung, nie der Name: ändert sich der Name, ändert er sich
 * überall mit. Der Anlegeblock richtet sich nach `feldsatz` (Kategorie +
 * Personentyp). Pflicht ist überall nur der Name.
 *
 * Adresse über die geteilte Komponente `AdressBlock` (Suchfeld dort gekapselt);
 * das Land bleibt daneben, weil es nicht zum AdressBlock gehört. Telefon/Mobil
 * werden beim Verlassen des Felds ins Schweizer Format überführt (lib/telefon).
 */
export type KontaktFeldsatz = "fachpersonal" | "privat" | "organisation";

/** Beschriftung des Suchfelds und des Anlegeblocks — an EINER Stelle je Kontext.
    Keine Datenmodell-Bezeichner (z. B. „Zugehörigkeit") in der Oberfläche. */
const BESCHRIFTUNG: Record<KontaktFeldsatz, { label: string; platzhalter: string; neuTitel: string }> = {
  fachpersonal: { label: "Fachperson", platzhalter: "Name oder GLN suchen", neuTitel: "Neuen Kontakt erfassen" },
  privat: { label: "Person", platzhalter: "Name suchen", neuTitel: "Neuen Kontakt erfassen" },
  organisation: { label: "Organisation", platzhalter: "Name der Organisation suchen", neuTitel: "Neue Organisation erfassen" },
};

export function KontaktWahl({
  person, onChange, feldsatz, kontaktTyp, angehoerige, zeigtAngehoerige, abteilungLabel = "Abteilung",
}: {
  /** Aktuell gewählte Person (Kontakt oder Angehörige); null = keine. */
  person: PersonBezug | null;
  onChange: (p: PersonBezug | null) => void;
  feldsatz: KontaktFeldsatz;
  /** Typ, den ein neu angelegter Kontakt erhält. */
  kontaktTyp: KontakttypCode;
  /** Angehörige für Suche und Namensvetter-Hinweis. */
  angehoerige: { id: string; vorname: string; nachname: string }[];
  /** Angehörige als wählbare Treffer zeigen (Kategorie Bezugsperson). */
  zeigtAngehoerige: boolean;
  abteilungLabel?: string;
}) {
  const NEU = "__neu__";
  const kontakte = useKontakte();

  const wertVon = (p: PersonBezug | null) =>
    p?.art === "kontakt" ? `k:${p.kennung}` : p?.art === "angehoeriger" ? `a:${p.kennung}` : "";
  const [modus, setModus] = useState<string>(wertVon(person));

  const [anrede, setAnrede] = useState<string>("");
  const [titel, setTitel] = useState<string>("");
  const [name, setName] = useState("");
  const [vorname, setVorname] = useState("");
  const [zugehoerigkeit, setZugehoerigkeit] = useState("");
  const [fachgebiet, setFachgebiet] = useState("");
  const [gln, setGln] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [telefon, setTelefon] = useState("");
  const [mobil, setMobil] = useState("");
  const [email, setEmail] = useState("");
  const [strasse, setStrasse] = useState("");
  const [plz, setPlz] = useState("");
  const [ort, setOrt] = useState("");
  const [land, setLand] = useState("CH");
  const [fehler, setFehler] = useState("");
  const [vorher, setVorher] = useState<string>(wertVon(person));

  const suchtext = useRef("");
  const bereich = useRef<HTMLDivElement>(null);

  const felderLeeren = () => {
    setAnrede(""); setTitel(""); setName(""); setVorname(""); setZugehoerigkeit("");
    setFachgebiet(""); setGln(""); setOrganisation(""); setTelefon(""); setMobil(""); setEmail("");
    setStrasse(""); setPlz(""); setOrt(""); setLand("CH"); setFehler("");
  };

  const abbrechen = () => {
    setModus(vorher);
    onChange(vorher.startsWith("k:") ? { art: "kontakt", kennung: vorher.slice(2) }
      : vorher.startsWith("a:") ? { art: "angehoeriger", kennung: vorher.slice(2) } : null);
    felderLeeren();
    suchtext.current = "";
  };

  const waehlen = (v: string) => {
    if (v === NEU) {
      setVorher(modus === NEU ? vorher : modus);
      setName(suchtext.current.trim());
      setModus(v);
      onChange(null);
      return;
    }
    setModus(v);
    if (v.startsWith("k:")) onChange({ art: "kontakt", kennung: v.slice(2) });
    else if (v.startsWith("a:")) onChange({ art: "angehoeriger", kennung: v.slice(2) });
    else onChange(null);
    felderLeeren();
  };

  useEffect(() => {
    if (modus !== NEU) return;
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

  const anlegen = () => {
    if (!name.trim()) { setFehler(feldsatz === "organisation" ? "Bitte den Namen der Organisation erfassen." : "Bitte den Nachnamen erfassen."); return; }
    const istFach = feldsatz === "fachpersonal";
    const istOrg = feldsatz === "organisation";
    const k = kontaktSichern({
      id: "",
      name: name.trim(),
      vorname: vorname.trim(),
      typ: kontaktTyp,
      zugehoerigkeit: istOrg ? zugehoerigkeit.trim() : "",
      telefon: telefon.trim(),
      email: email.trim(),
      bemerkung: "",
      anrede: !istOrg && anrede ? (anrede as KontaktAnrede) : null,
      titel: istFach && titel ? (titel as KontaktTitel) : null,
      fachgebiet: istFach && fachgebiet.trim() ? fachgebiet.trim() : null,
      // GLN bei Fachpersonal UND Organisationen (auch Apotheken/Spitäler tragen eine).
      gln: (istFach || istOrg) && gln.trim() ? gln.trim() : null,
      organisation: istFach && organisation.trim() ? organisation.trim() : null,
      mobil: !istOrg && mobil.trim() ? mobil.trim() : null,
      strasse: strasse.trim() ? strasse.trim() : null,
      plz: plz.trim() ? plz.trim() : null,
      ort: ort.trim() ? ort.trim() : null,
      land: (strasse.trim() || plz.trim() || ort.trim()) ? land.trim() || "CH" : null,
    });
    setModus(`k:${k.id}`);
    onChange({ art: "kontakt", kennung: k.id });
    setVorher(`k:${k.id}`);
    felderLeeren();
  };

  const glnGetippt = gln.trim();
  const glnOk = /^\d{13}$/.test(glnGetippt);
  const fachgebietVorschlaege = [...new Set(kontakte.map(k => (k.fachgebiet ?? "").trim()).filter(Boolean))].sort();

  // Namensvetter beim Anlegen — Kontakte immer, Angehörige nur wo wählbar.
  const suchName = name.trim().toLowerCase();
  const kontaktTreffer = suchName ? kontakte.filter(k => k.name.trim().toLowerCase() === suchName) : [];
  const fremdTreffer = suchName && zeigtAngehoerige ? angehoerige.filter(a => a.nachname.trim().toLowerCase() === suchName) : [];

  const optionen = [
    ...kontakte.map(k => ({ value: `k:${k.id}`, label: `${kontaktName(k)} — Kontakt ${k.id} (${kontakttypLabel(k.typ)})`, suchtext: `${k.zugehoerigkeit} ${k.fachgebiet ?? ""} ${k.organisation ?? ""}` })),
    ...(zeigtAngehoerige ? angehoerige.map(a => ({ value: `a:${a.id}`, label: `${a.nachname}, ${a.vorname} — Angehörige ${a.id}`, suchtext: "" })) : []),
    { value: NEU, label: "Neu erfassen", immer: true as const },
  ];

  return (
    <div>
      <Combobox
        label={BESCHRIFTUNG[feldsatz].label}
        value={modus || null}
        onChange={v => waehlen(v ?? "")}
        placeholder={BESCHRIFTUNG[feldsatz].platzhalter}
        searchPlaceholder={BESCHRIFTUNG[feldsatz].platzhalter}
        keineTrefferText="Nichts gefunden — über Neu erfassen anlegen."
        onSuchtext={t => { suchtext.current = t; }}
        options={optionen} />

      {modus === NEU && (
        <div ref={bereich} tabIndex={-1}
          style={{ marginTop: 10, padding: "12px 14px", borderRadius: 10, background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)" }}>
          <div style={{ fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", marginBottom: 10 }}>{BESCHRIFTUNG[feldsatz].neuTitel}</div>

          <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 12 }}>
            {(feldsatz === "fachpersonal" || feldsatz === "privat") && (
              <>
                {/* Anrede/Titel als eigene, volle Zeile — damit Vorname und
                    Nachname darunter eine gemeinsame Zeile bilden. */}
                <div className="grid grid-cols-2" style={{ gap: 12, gridColumn: "1 / -1" }}>
                  <div>
                    <FeldLabel>Anrede</FeldLabel>
                    <InlineSelect value={anrede} onChange={setAnrede} platzhalter="—" options={KONTAKT_ANREDE.map(a => ({ value: a.code, label: a.label }))} />
                  </div>
                  {feldsatz === "fachpersonal" && (
                    <div>
                      <FeldLabel>Titel</FeldLabel>
                      <InlineSelect value={titel} onChange={setTitel} platzhalter="—" options={KONTAKT_TITEL.map(t => ({ value: t.code, label: t.label }))} />
                    </div>
                  )}
                </div>
                <FormFeld label="Vorname" wert={vorname} onAendern={setVorname} />
                <FormFeld label="Nachname" wert={name} platzhalter="Pflicht" onAendern={setName} />
              </>
            )}

            {feldsatz === "fachpersonal" && (
              <>
                <div>
                  <FeldLabel>Fachgebiet</FeldLabel>
                  <input list="kw-fachgebiete" value={fachgebiet} onChange={e => setFachgebiet(e.target.value)} placeholder="z. B. Kardiologie" aria-label="Fachgebiet" className="ui-fokusring" style={feldInput} />
                  <datalist id="kw-fachgebiete">{fachgebietVorschlaege.map(f => <option key={f} value={f} />)}</datalist>
                </div>
                <div>
                  <FeldLabel>GLN</FeldLabel>
                  <input value={gln} onChange={e => setGln(e.target.value)} placeholder="13-stellig" inputMode="numeric" aria-label="GLN" className="ui-fokusring" style={feldInput} />
                  {glnGetippt && (
                    <div style={{ fontSize: "var(--text-meta)", marginTop: 4, color: glnOk ? "var(--status-success-text)" : "var(--status-warning-text)" }}>
                      {glnOk ? "Format gültig (13 Stellen)." : `Noch keine 13 Stellen (${glnGetippt.replace(/\D/g, "").length}).`}
                    </div>
                  )}
                </div>
                <FormFeld label="Praxis oder Institution" wert={organisation} onAendern={setOrganisation} />
              </>
            )}

            {feldsatz === "organisation" && (
              <>
                <FormFeld label="Organisation" wert={name} platzhalter="Pflicht" onAendern={setName} />
                <FormFeld label={abteilungLabel} wert={zugehoerigkeit} onAendern={setZugehoerigkeit} />
                <FormFeld label="Ansprechperson" wert={vorname} onAendern={setVorname} />
                <div>
                  <FeldLabel>GLN</FeldLabel>
                  <input value={gln} onChange={e => setGln(e.target.value)} placeholder="13-stellig" inputMode="numeric" aria-label="GLN" className="ui-fokusring" style={feldInput} />
                  {glnGetippt && (
                    <div style={{ fontSize: "var(--text-meta)", marginTop: 4, color: glnOk ? "var(--status-success-text)" : "var(--status-warning-text)" }}>
                      {glnOk ? "Format gültig (13 Stellen)." : `Noch keine 13 Stellen (${glnGetippt.replace(/\D/g, "").length}).`}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Adresse — geteilte Komponente (Suchfeld gekapselt) + Land daneben. */}
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", marginBottom: 8 }}>Adresse</div>
            <AdressBlock idPrefix="kontakt"
              wert={{ strasse, plz, ort }}
              onChange={patch => {
                if (patch.strasse !== undefined) setStrasse(patch.strasse);
                if (patch.plz !== undefined) setPlz(patch.plz);
                if (patch.ort !== undefined) setOrt(patch.ort);
              }} />
            <div style={{ maxWidth: 160, marginTop: 12 }}><FormFeld label="Land" wert={land} onAendern={setLand} /></div>
          </div>

          {/* Erreichbarkeit */}
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: "var(--text-meta)", fontWeight: "var(--weight-medium)", marginBottom: 8 }}>Erreichbarkeit</div>
            <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 12 }}>
              <TelFeld label="Telefon" wert={telefon} onAendern={setTelefon} />
              {feldsatz !== "organisation" && <TelFeld label="Mobil" wert={mobil} onAendern={setMobil} />}
              <FormFeld label="E-Mail" wert={email} onAendern={setEmail} />
            </div>
          </div>

          {(kontaktTreffer.length > 0 || fremdTreffer.length > 0) && (
            <div style={{ marginTop: 10, padding: "8px 10px", borderRadius: 8, background: "var(--status-warning-bg)", border: "var(--border-thin) solid var(--border-default)" }}>
              <div style={{ fontSize: "var(--text-meta)", color: "var(--status-warning-text)", marginBottom: 6 }}>
                „{name.trim()}" ist bereits erfasst. Stattdessen wählen?
              </div>
              <div className="flex flex-wrap" style={{ gap: 8 }}>
                {fremdTreffer.map(p => (
                  <button key={p.id} type="button" onClick={() => waehlen(`a:${p.id}`)} className="ui-fokusring cursor-pointer" style={trefferKnopf}>
                    {p.nachname}, {p.vorname} (Angehörige {p.id})
                  </button>
                ))}
                {kontaktTreffer.map(k => (
                  <button key={k.id} type="button" onClick={() => waehlen(`k:${k.id}`)} className="ui-fokusring cursor-pointer" style={trefferKnopf}>
                    {kontaktName(k)} (Kontakt {k.id})
                  </button>
                ))}
              </div>
            </div>
          )}

          {fehler && <div role="alert" style={{ fontSize: "var(--text-meta)", color: "var(--status-warning-text)", marginTop: 8 }}>{fehler}</div>}
          <div className="flex items-center" style={{ gap: 12, marginTop: 10 }}>
            <button type="button" onClick={anlegen} className="ui-fokusring cursor-pointer"
              style={{ padding: "5px 14px", borderRadius: "var(--radius-pill)", fontFamily: "inherit", fontSize: "var(--text-small)",
                fontWeight: "var(--weight-medium)", background: "var(--brand-primary-light)", border: "var(--border-thin) solid var(--brand-primary)", color: "var(--brand-primary)" }}>
              Kontakt anlegen
            </button>
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

function FeldLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] text-muted-foreground uppercase tracking-wider" style={{ fontWeight: 500, marginBottom: 3 }}>{children}</div>;
}

/** Telefonfeld: formatiert beim Verlassen, Hinweis bei ungültigem Format, kein Block. */
function TelFeld({ label, wert, onAendern }: { label: string; wert: string; onAendern: (v: string) => void }) {
  const [roh, setRoh] = useState(wert);
  const [hinweis, setHinweis] = useState("");
  useEffect(() => { setRoh(wert); }, [wert]);
  const beimVerlassen = () => {
    const f = formatTelefon(roh);
    setRoh(f); onAendern(f);
    const p = pruefeTelefon(f);
    setHinweis(p.gueltig ? "" : (p.hinweis ?? ""));
  };
  return (
    <div>
      <FeldLabel>{label}</FeldLabel>
      <input value={roh} onChange={e => setRoh(e.target.value)} onBlur={beimVerlassen} placeholder="+41 44 000 00 00"
        aria-label={label} inputMode="tel" className="ui-fokusring" style={feldInput} />
      {hinweis && <div style={{ fontSize: "var(--text-meta)", marginTop: 4, color: "var(--status-warning-text)" }}>{hinweis}</div>}
    </div>
  );
}

const feldInput: React.CSSProperties = {
  width: "100%", padding: "6px 9px", borderRadius: 8, fontFamily: "inherit", fontSize: "var(--text-small)",
  color: "var(--text-primary)", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)",
};

const trefferKnopf: React.CSSProperties = {
  padding: "4px 10px", borderRadius: "var(--radius-pill)", fontFamily: "inherit", fontSize: "var(--text-meta)",
  fontWeight: "var(--weight-medium)", background: "var(--bg-elevated)", border: "var(--border-thin) solid var(--border-default)", color: "var(--text-primary)",
};
