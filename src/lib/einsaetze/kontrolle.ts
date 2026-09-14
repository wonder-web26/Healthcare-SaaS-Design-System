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
import type { Einsatz, ErbrachteLeistung, Monatstag } from "./einsaetze";
import { monatAufteilen, fehlendeTageMuster, einsatzDauer } from "./einsaetze";
import type { Mandat } from "../mandate/mandate";
import type { Verordnung } from "../mandate/verordnungen";
import { ausAnzeigedatum, hatBedarfsmeldung } from "../mandate/verordnungen";
import {
  einsatzAbrechnen, monatAbrechnen,
  type MinutenJeArt, type Monatsabrechnung,
} from "../abrechnung/leistungsarten";
import type { TarifKategorie } from "../stammdaten/pflegetarife";
import { quartalsMonate } from "../abschluss/abschluss";

/** Die Bestände, aus denen sich die Kennzahlen speisen. */
export interface KontrollQuellen {
  einsaetze: Einsatz[];
  leistungen: ErbrachteLeistung[];
  mandate: Mandat[];
  verordnungen: Verordnung[];
}

export interface MonatsKennzahlen {
  patientId: string;
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
  /**
   * Tage mit Abweichung, an denen keine Position einen Grund trägt.
   *
   * Eine Abweichung mit Grund ist dokumentiert und damit abschlussfähig; eine
   * ohne Grund ist eine offene Frage — beim Controlling liesse sich später
   * nicht mehr sagen, ob vergessen oder nicht nötig.
   */
  abweichungOhneGrund: number;
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

  /* Das Leistungsplanungsblatt ist abgerissen (Lauf 0b) — bis Lauf 6 gibt es
     keinen verordneten Massstab. Ohne Soll gibt es keine Abweichung: die
     erbrachten Zeiten bleiben sichtbar (Anzeige ohne Urteil), Soll steht auf
     null und die Abweichung wird nicht behauptet. */
  const tage = monatAufteilen(eigene, leistungenVon, jahr, monat, 0,
    () => false, () => 0)
    .map(t => ({ ...t, abweichung: 0 }));
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
  /* Ohne Blatt keine Positionsauflösung: die Tarifkategorie fällt bis Lauf 6
     pauschal auf Grundpflege (c) zurück, die verordnete Zeit auf null. */
  const abrechnung = monatAbrechnen(
    geleistet.map(e => einsatzAbrechnen(einsatzDauer(e), leistungenVon(e.id)
      .filter(l => l.erbracht)
      .map(() => ({ kategorie: "c" as TarifKategorie, verordnet: 0 })))),
    gemeldet);

  const alleEinsaetze = tage.flatMap(t => t.einsaetze);

  return {
    patientId, tage, muster, abrechnung, gemeldet, verordnung,
    einsaetzeGesamt: alleEinsaetze.length,
    offen: alleEinsaetze.filter(e => e.pruefzustand !== "geprueft").length,
    abweichungsTage: tage.filter(t => !t.fehlt && t.abweichung !== 0 && t.einsaetze.length > 0).length,
    abweichungOhneGrund: tage.filter(t =>
      !t.fehlt && t.abweichung !== 0 && t.einsaetze.length > 0
      && !t.einsaetze.some(e => leistungenVon(e.id).some(l => l.grund.trim() !== ""))).length,
    ohneEinsatz: muster.tage.length,
    mitBericht: tage.filter(t => t.hatBericht).length,
    mitEinsatz: tage.filter(t => t.einsaetze.length > 0).length,
  };
}

/**
 * Verrechenbare Minuten des Quartals, in dem der Monat liegt.
 *
 * Über 60 Pflichtleistungsstunden je Quartal kann der Versicherer eine
 * Leistungsprüfung veranlassen. Gerechnet wird über die verrechenbaren
 * Minuten, nicht die gestempelten: geprüft wird, was in Rechnung gestellt
 * wurde.
 */
export function quartalMinuten(
  patientId: string, jahr: number, monat: number, q: KontrollQuellen,
): number {
  return quartalsMonate(monat)
    .reduce((s, m) => s + monatsKennzahlen(patientId, jahr, m, q).abrechnung.abrechenbar, 0);
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
