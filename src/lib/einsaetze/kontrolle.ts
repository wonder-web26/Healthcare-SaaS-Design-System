/**
 * Kennzahlen eines Patienten für einen Monat — eine Rechnung für zwei Orte.
 *
 * Die Pflegekontrolle im Dossier und die Liste über alle Patienten zeigen
 * dieselben Zahlen. Zwei Rechnungen liefen unweigerlich auseinander, und dann
 * stünde in der Liste eine andere Zahl als im Dossier, auf das sie verweist.
 *
 * Das Modul kennt keine Hooks: es bekommt die Bestände übergeben und gibt
 * Zahlen zurück. So kann die Liste es für zehn Patienten in einer Schleife
 * aufrufen, ohne die Regeln von React zu verletzen.
 */
import type { Einsatz, ErbrachteLeistung, EinsatzUrheber, Monatstag } from "./einsaetze";
import { monatAufteilen, fehlendeTageMuster, einsatzDauer } from "./einsaetze";
import type { KLVVerordnung } from "../../types/klinische-artefakte";
import type { Mandat } from "../mandate/mandate";
import type { Verordnung } from "../mandate/verordnungen";
import { ausAnzeigedatum, hatBedarfsmeldung } from "../mandate/verordnungen";
import { istTaeglich, tagessollMinuten } from "../klv/berechnung";
import {
  einsatzAbrechnen, monatAbrechnen,
  type MinutenJeArt, type Monatsabrechnung,
} from "../abrechnung/leistungsarten";
import type { TarifKategorie } from "../stammdaten/pflegetarife";

/** Die Bestände, aus denen sich die Kennzahlen speisen. */
export interface KontrollQuellen {
  einsaetze: Einsatz[];
  leistungen: ErbrachteLeistung[];
  klvs: KLVVerordnung[];
  mandate: Mandat[];
  verordnungen: Verordnung[];
}

export interface MonatsKennzahlen {
  patientId: string;
  /** Aktives Leistungsplanungsblatt, oder null. */
  blatt: KLVVerordnung | null;
  sollProTag: number;
  tage: Monatstag[];
  muster: { tage: Monatstag[]; wochentag: number | null };
  abrechnung: Monatsabrechnung;
  /** Bedarfsmeldung der Verordnung, die den Monat deckt; null wenn keine. */
  gemeldet: MinutenJeArt | null;
  verordnung: Verordnung | null;

  /* Abgeleitete Zahlen für die Liste — dieselben Grundlagen, nur gezählt. */
  einsaetzeGesamt: number;
  offen: number;
  abweichungsTage: number;
  ohneEinsatz: number;
  mitBericht: number;
  mitEinsatz: number;
  /** Wer im Monat erbracht hat, ohne Wiederholung, in Reihenfolge des Auftretens. */
  urheber: EinsatzUrheber[];
}

/**
 * Deckt eine Verordnung diesen Monat ab?
 *
 * Es genügt, dass sich Gültigkeit und Monat überschneiden — eine Verordnung,
 * die am 20. ausläuft, hat den Monat bis dahin gedeckt.
 */
function decktMonat(v: Verordnung, anfang: Date, ende: Date): boolean {
  const ab = ausAnzeigedatum(v.gueltigAb);
  const bis = ausAnzeigedatum(v.gueltigBis);
  return (!ab || ab <= ende) && (!bis || bis >= anfang);
}

export function monatsKennzahlen(
  patientId: string, jahr: number, monat: number, q: KontrollQuellen,
): MonatsKennzahlen {
  const eigene = q.einsaetze.filter(e => e.patientId === patientId);
  const leistungenVon = (id: string) => q.leistungen.filter(l => l.einsatzId === id);

  const blatt = [...q.klvs]
    .filter(k => k.patientId === patientId && k.status !== "ersetzt")
    .sort((a, b) => b.version - a.version)[0] ?? null;
  const positionen = blatt?.leistungspositionen ?? [];

  /* Das Tagessoll sind die täglich verordneten Positionen — nicht die
     Wochensumme durch sieben. Eine Position mit 3×/Woche steht an keinem
     bestimmten Tag im Plan; sie in ein Tagesmittel zu rechnen, machte aus
     einer Unbekannten eine Zahl. */
  const sollProTag = tagessollMinuten(positionen);
  const taeglicheIds = new Set(positionen.filter(istTaeglich).map(p => p.id));
  const istTaeglichePosition = (id: string) => taeglicheIds.has(id);
  const verordneteZeit = (id: string) => {
    const p = positionen.find(x => x.id === id);
    return p ? p.anzahl * p.zeitMin : 0;
  };

  const tage = monatAufteilen(eigene, leistungenVon, jahr, monat, sollProTag,
    istTaeglichePosition, verordneteZeit);
  const muster = fehlendeTageMuster(tage);

  /* Verglichen wird gegen die Bedarfsmeldung der Verordnung, die den Monat
     deckt — nicht gegen das Tagessoll. Die Kasse prüft Monate je
     Leistungsart; Tage plant nur das Blatt. */
  const anfang = new Date(jahr, monat, 1);
  const ende = new Date(jahr, monat + 1, 0);
  const mandatIds = q.mandate.filter(m => m.patientId === patientId).map(m => m.id);
  const verordnung = q.verordnungen.find(v =>
    mandatIds.includes(v.mandatId) && decktMonat(v, anfang, ende)) ?? null;
  const gemeldet: MinutenJeArt | null = verordnung && hatBedarfsmeldung(verordnung)
    ? {
        a: Number(verordnung.gemeldeteMinuten.a || 0),
        b: Number(verordnung.gemeldeteMinuten.b || 0),
        c: Number(verordnung.gemeldeteMinuten.c || 0),
      }
    : null;

  const geleistet = tage.flatMap(t => t.einsaetze).filter(e => e.zustand === "erbracht");
  const abrechnung = monatAbrechnen(
    geleistet.map(e => einsatzAbrechnen(einsatzDauer(e), leistungenVon(e.id)
      .filter(l => l.erbracht)
      .map(l => {
        const pos = positionen.find(p => p.id === l.positionId);
        return { kategorie: (pos?.kategorie ?? "c") as TarifKategorie, verordnet: pos ? pos.anzahl * pos.zeitMin : 0 };
      }))),
    gemeldet);

  const alleEinsaetze = tage.flatMap(t => t.einsaetze);
  const urheber: EinsatzUrheber[] = [];
  for (const e of alleEinsaetze) {
    const kennung = e.erbrachtDurch.art === "mitarbeitende" ? e.erbrachtDurch.name : e.erbrachtDurch.kennung;
    if (!urheber.some(u => (u.art === "mitarbeitende" ? u.name : u.kennung) === kennung)) urheber.push(e.erbrachtDurch);
  }

  return {
    patientId, blatt, sollProTag, tage, muster, abrechnung, gemeldet, verordnung,
    einsaetzeGesamt: alleEinsaetze.length,
    offen: alleEinsaetze.filter(e => e.pruefzustand !== "geprueft").length,
    abweichungsTage: tage.filter(t => !t.fehlt && t.abweichung !== 0 && t.einsaetze.length > 0).length,
    ohneEinsatz: muster.tage.length,
    mitBericht: tage.filter(t => t.hatBericht).length,
    mitEinsatz: tage.filter(t => t.einsaetze.length > 0).length,
    urheber,
  };
}

/**
 * Schwelle, ab der die Berichtsdichte als zu dünn gilt.
 *
 * DIES IST EINE SETZUNG. Weder Administrativvertrag noch KLV nennen eine
 * Quote für Pflegeberichte; die Hälfte ist gewählt, weil sie einen Monat
 * teilt, in dem an den meisten Tagen etwas dokumentiert wurde, von einem, in
 * dem das die Ausnahme war. Wenn die Spitex eine eigene Vorgabe hat, gehört
 * sie in die Organisationseinstellungen und nicht hierher.
 */
export const BERICHTSDICHTE_SCHWELLE = 0.5;

export function berichteFehlen(k: MonatsKennzahlen): boolean {
  return k.mitEinsatz > 0 && k.mitBericht / k.mitEinsatz < BERICHTSDICHTE_SCHWELLE;
}
