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
import { useSyncExternalStore } from "react";
import { CURRENT_USER, type UnifiedEntry } from "../mocks/service-desk-unified";
import { pendenzTypen } from "../../types/pendenz";
import { gegenwart } from "../gegenwart";

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

/**
 * Empfänger einer Freigabe — typisiert wie `personBezug`/`quellBezug`, damit die
 * spätere Erweiterung auf Rollen keine Migration wird. Die Oberfläche bietet
 * heute ausschliesslich `benutzer` an.
 */
export type FreigabeBezug = { art: "benutzer" | "rolle"; kennung: string };

export type Listenansicht = {
  id: string;                   // stabil, Form "LA-0001"
  name: string;
  art: AnsichtArt;
  filter: AnsichtFilter;
  sortierung: { feld: keyof UnifiedEntry; richtung: "auf" | "ab" };
  /** Wer die Ansicht öffnen darf. Leer/fehlend bei „Ganze Organisation".
   *  Steuert nur den Zugang zur Linse, nie den Inhalt — der hängt an der Rolle. */
  freigabe?: FreigabeBezug[];
};

/* ── Datumshilfen: Seed-Fristen werden relativ zur Gegenwart gerechnet.
   Absolute Werte liefen leer, sobald das Datum überschritten war, und der
   Prototyp zeigte dann Leerzustände statt Inhalt. Das Feld bleibt ein
   ISO-Datum — nur seine Erzeugung ist relativ. ── */
function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Letzter Tag des laufenden Quartals. */
function quartalsEnde(): string {
  const d = gegenwart();
  const letzterMonat = Math.floor(d.getMonth() / 3) * 3 + 2;
  return iso(new Date(d.getFullYear(), letzterMonat + 1, 0));
}

/** Der 4. des nächsten Monats — Vorlauf des Lohnlaufs. */
function naechsterVierter(): string {
  const d = gegenwart();
  return iso(new Date(d.getFullYear(), d.getMonth() + 1, 4));
}

/**
 * Der Bestand an Ansichten. Zwei Systemansichten, drei freigegebene.
 * Die freigegebenen Filter setzen sich aus vorhandenen `pendenzTypen`-Schlüsseln
 * zusammen; es wird kein neuer Pendenztyp angelegt.
 */
const SEED: Listenansicht[] = [
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
    freigabe: [
      { art: "benutzer", kennung: "Maria Keller" },
      { art: "benutzer", kennung: "Sandra Weber" },
      { art: "benutzer", kennung: "Peter Kaufmann" },
    ],
  },
  {
    id: "LA-0008",
    name: "Quellensteuer laufendes Quartal",
    art: "freigegeben",
    filter: { pendenzTypen: ["quellensteuer"], faelligBis: quartalsEnde() },
    sortierung: { feld: "faellig", richtung: "auf" },
    freigabe: [
      { art: "benutzer", kennung: "Maria Keller" },
      { art: "benutzer", kennung: "Sandra Weber" },
    ],
  },
  {
    id: "LA-0009",
    name: "Lohnlauf — Vorlauf 4. des Monats",
    art: "freigegeben",
    filter: { pendenzTypen: ["lohn-anpassung", "personaldaten"], faelligBis: naechsterVierter() },
    sortierung: { feld: "faellig", richtung: "auf" },
    freigabe: [
      { art: "benutzer", kennung: "Maria Keller" },
      { art: "benutzer", kennung: "Sandra Weber" },
      { art: "benutzer", kennung: "Peter Kaufmann" },
    ],
  },
];

/* ══════════════════════════════════════════
   BESTAND — der Schreibpfad des Moduls
   ══════════════════════════════════════════
   Neue Ansichten entstehen zur Laufzeit und werden NICHT in den Seed
   geschrieben. Der Bestand lebt in der Sitzung; ein Neuladen stellt den Seed
   wieder her (keine Persistenz in diesem Lauf). */

let bestand: Listenansicht[] = [...SEED];
const hoerer = new Set<() => void>();

function melde() {
  bestand = [...bestand];
  hoerer.forEach(h => h());
}

/** Alle Ansichten — der aktuelle Bestand, nicht der Seed. */
export function getListenansichten(): Listenansicht[] {
  return bestand;
}

/** Reaktiver Zugriff für die Oberfläche. */
export function useListenansichten(): Listenansicht[] {
  return useSyncExternalStore(
    h => { hoerer.add(h); return () => hoerer.delete(h); },
    getListenansichten,
    getListenansichten,
  );
}

/** Nächste freie Kennung im Bestandsmuster `LA-00NN`. */
function naechsteKennung(): string {
  let hoechste = 0;
  for (const a of bestand) {
    const m = a.id.match(/^LA-(\d{4})$/);
    if (m) hoechste = Math.max(hoechste, parseInt(m[1], 10));
  }
  return `LA-${String(hoechste + 1).padStart(4, "0")}`;
}

/**
 * Legt eine freigegebene Ansicht an — der einzige Schreibpfad. Die Kennung
 * vergibt das Modul, nicht die Aufruferin.
 */
export function erstelleAnsicht(eingabe: {
  name: string;
  filter: AnsichtFilter;
  /** Leer = ganze Organisation. */
  freigabe: FreigabeBezug[];
}): Listenansicht {
  const neu: Listenansicht = {
    id: naechsteKennung(),
    name: eingabe.name.trim(),
    art: "freigegeben",
    filter: eingabe.filter,
    sortierung: { feld: "faellig", richtung: "auf" },
    freigabe: eingabe.freigabe.length > 0 ? eingabe.freigabe : undefined,
  };
  bestand.push(neu);
  melde();
  return neu;
}

/** Ob der Name schon vergeben ist — Warnung, kein Hindernis. */
export function nameVergeben(name: string): boolean {
  const n = name.trim().toLowerCase();
  return !!n && bestand.some(a => a.name.trim().toLowerCase() === n);
}

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
  return bestand.find(a => a.id === id);
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
