/**
 * Listenansichten der Pendenzenliste — benannte, gespeicherte Filterlinsen.
 *
 * Fachliche Grundentscheidung: **eine Listenansicht ist eine Linse, keine
 * Berechtigung.** Sie kann die Menge der sichtbaren Pendenzen nur verkleinern,
 * nie erweitern. Wer welche Pendenz überhaupt sehen darf, entscheidet die Rolle
 * über den Pendenztyp — das ist serverseitig und hier ausdrücklich kein Thema.
 *
 * Angelegt und freigegeben werden Ansichten ausschliesslich von der
 * Administration. In der Oberfläche gibt es keinen Speicherweg: Ad-hoc-Filtern
 * bleibt erlaubt, führt aber zu keiner neuen Ansicht.
 *
 * Die beiden Systemansichten sind der frühere Segmentumschalter („Mir
 * zugewiesen" / „Alle") — verallgemeinert, nicht ergänzt.
 */
import { CURRENT_USER, type UnifiedEntry } from "../mocks/service-desk-unified";
import { pendenzTypen } from "../../types/pendenz";

export type AnsichtArt = "system" | "freigegeben";

export type AnsichtFilter = {
  pendenzTypen?: string[];      // Schlüssel aus pendenzTypen
  status?: UnifiedEntry["status"][];
  /** Initialen der zuständigen Person (wie `UnifiedEntry.verantwortlich.initialen`). */
  verantwortlich?: string;
  prioritaet?: UnifiedEntry["prioritaet"];
  faelligBis?: string;          // ISO-Datum
  personBezugArt?: string;
};

export type Listenansicht = {
  id: string;                   // stabil, Form "LA-0001"
  name: string;
  art: AnsichtArt;
  filter: AnsichtFilter;
  sortierung: { feld: keyof UnifiedEntry; richtung: "auf" | "ab" };
  freigabe?: string[];          // nur Anzeige, keine Wirkung in diesem Lauf
};

/**
 * Der Bestand an Ansichten. Zwei Systemansichten, drei freigegebene.
 * Die freigegebenen Filter setzen sich aus vorhandenen `pendenzTypen`-Schlüsseln
 * zusammen; es wird kein neuer Pendenztyp angelegt.
 */
export const LISTENANSICHTEN: Listenansicht[] = [
  {
    id: "LA-0001",
    name: "Mir zugewiesen",
    art: "system",
    filter: { verantwortlich: CURRENT_USER },
    sortierung: { feld: "faellig", richtung: "auf" },
  },
  {
    id: "LA-0002",
    name: "Alle Pendenzen",
    art: "system",
    filter: {},
    sortierung: { feld: "faellig", richtung: "auf" },
  },
  {
    id: "LA-0007",
    name: "Buchhaltung — offen",
    art: "freigegeben",
    // „Buchhaltung" ist kein Pendenztyp, sondern die Summe der drei
    // lohnwirksamen Typen des Bestands.
    filter: { pendenzTypen: ["quellensteuer", "kinderzulagen", "lohn-anpassung"], status: ["offen"] },
    sortierung: { feld: "faellig", richtung: "auf" },
    freigabe: ["M. Keller", "S. Weber", "T. Businger"],
  },
  {
    id: "LA-0008",
    name: "Quellensteuer Q3",
    art: "freigegeben",
    filter: { pendenzTypen: ["quellensteuer"], faelligBis: "2026-09-30" },
    sortierung: { feld: "faellig", richtung: "auf" },
    freigabe: ["M. Keller", "S. Weber"],
  },
  {
    id: "LA-0009",
    name: "Lohnlauf — Vorlauf 4. des Monats",
    art: "freigegeben",
    filter: { pendenzTypen: ["lohn-anpassung", "personaldaten"], faelligBis: "2026-09-04" },
    sortierung: { feld: "faellig", richtung: "auf" },
    freigabe: ["M. Keller", "S. Weber", "T. Businger", "R. Amsler"],
  },
];

/** Die Ansicht, die ohne Angabe gilt. */
export const STANDARD_ANSICHT = "LA-0001";
/** Die Ansicht ohne jede Einschränkung — Ziel der Ausweichschaltfläche. */
export const ALLE_ANSICHT = "LA-0002";

/**
 * Ansicht zu einer Kennung. `undefined`, wenn die Kennung unbekannt oder die
 * Ansicht nicht freigegeben ist — beides führt zum selben Sperrzustand, und
 * beides darf keinen Namen preisgeben.
 */
export function findeAnsicht(id: string | null): Listenansicht | undefined {
  if (!id) return undefined;
  return LISTENANSICHTEN.find(a => a.id === id);
}

/**
 * Der Ansichtsfilter — die erste Stufe der Kette. Er läuft VOR den Ad-hoc-Filtern
 * und ist der einzige Ort, an dem eine Ansicht die Menge einschränkt.
 */
export function ansichtFiltern(list: UnifiedEntry[], f: AnsichtFilter): UnifiedEntry[] {
  return list.filter(e => {
    if (f.pendenzTypen && f.pendenzTypen.length > 0 && !f.pendenzTypen.includes(e.pendenzTyp)) return false;
    if (f.status && f.status.length > 0 && !f.status.includes(e.status)) return false;
    if (f.verantwortlich && e.verantwortlich?.initialen !== f.verantwortlich) return false;
    if (f.prioritaet && e.prioritaet !== f.prioritaet) return false;
    // Ohne Termin fällt der Eintrag aus einer Frist-Ansicht heraus.
    if (f.faelligBis && (!e.faellig || e.faellig > f.faelligBis)) return false;
    if (f.personBezugArt && e.personBezug?.art !== f.personBezugArt) return false;
    return true;
  });
}

/**
 * Filterzusammenfassung in Worten — trägt die Metazeile unter dem Namen und
 * benennt im Leerzustand die Ursache. Leer, wenn die Ansicht nichts einschränkt.
 */
export function filterZusammenfassung(f: AnsichtFilter): string {
  const teile: string[] = [];
  if (f.pendenzTypen?.length) teile.push(f.pendenzTypen.map(t => pendenzTypen[t as keyof typeof pendenzTypen]?.label ?? t).join(", "));
  if (f.status?.length) teile.push(f.status.map(s => STATUS_WORT[s]).join(", "));
  if (f.verantwortlich) teile.push(f.verantwortlich === CURRENT_USER ? "mir zugewiesen" : `zuständig ${f.verantwortlich}`);
  if (f.prioritaet) teile.push(`Priorität ${f.prioritaet}`);
  if (f.faelligBis) teile.push(`fällig bis ${isoZuAnzeigeKurz(f.faelligBis)}`);
  if (f.personBezugArt) teile.push(`Personenbezug ${f.personBezugArt}`);
  return teile.join(" · ");
}

const STATUS_WORT: Record<UnifiedEntry["status"], string> = {
  offen: "offen",
  in_bearbeitung: "in Bearbeitung",
  erledigt: "abgeschlossen",
};

/** TT.MM.JJJJ — dasselbe vollständige Format wie in der Liste. */
function isoZuAnzeigeKurz(iso: string): string {
  const [j, m, t] = iso.split("-");
  return `${t}.${m}.${j}`;
}
