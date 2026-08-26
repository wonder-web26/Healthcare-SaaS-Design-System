/**
 * Wertelisten der Wunddokumentation.
 *
 * Quellen: SAfW-Wundkompendium · DNQP-Expertenstandard „Pflege von Menschen
 * mit chronischen Wunden", zweite Aktualisierung 2017 · EPUAP/NPIAP/PPPIA
 * 2019. In der Schweiz gibt es keine gesetzliche Vorgabe, was zu erfassen
 * ist; massgebend sind das KVG mit dem WZW-Grundsatz und die
 * Nachvollziehbarkeit. Verbindlich ist damit die Fachpraxis.
 *
 * KEIN FARBMODELL. Der Standard rät ausdrücklich davon ab, Wundgrund nach
 * Farben zu beschreiben: eine angeweichte Nekrose ist gelb, Fibrin ebenso,
 * und Sehnen und Knochen sind es auch. Erfasst werden darum Gewebearten mit
 * ihrem Anteil, nicht „gelb".
 *
 * Gespeichert wird durchweg der Code, nie die Beschriftung.
 */

export interface Wundwert {
  code: string;
  label: string;
}

export const WUNDART: Wundwert[] = [
  { code: "dekubitus", label: "Dekubitus" },
  { code: "ulcus_cruris_venosum", label: "Ulcus cruris venosum" },
  { code: "ulcus_cruris_arteriell", label: "Ulcus cruris arteriosum" },
  { code: "diabetisches_fusssyndrom", label: "Diabetisches Fusssyndrom" },
  { code: "postoperative_wunde", label: "Postoperative Wunde" },
  { code: "traumatische_wunde", label: "Traumatische Wunde" },
  { code: "verbrennung", label: "Verbrennung" },
  { code: "andere", label: "Andere" },
];

/**
 * EPUAP/NPIAP-Kategorien.
 *
 * Die Reihenfolge ist die Rangfolge: eine einmal erreichte Kategorie wird
 * nicht zurückgesetzt. Die beiden letzten stehen ausserhalb der Rangfolge —
 * aus ihnen darf in jede andere gewechselt werden, sobald der Wundgrund
 * beurteilbar ist.
 */
export const DEKUBITUSKATEGORIE: Wundwert[] = [
  { code: "kategorie_1", label: "Kategorie 1 — nicht wegdrückbare Rötung" },
  { code: "kategorie_2", label: "Kategorie 2 — Teilverlust der Haut" },
  { code: "kategorie_3", label: "Kategorie 3 — vollständiger Hautverlust" },
  { code: "kategorie_4", label: "Kategorie 4 — vollständiger Gewebeverlust" },
  { code: "nicht_klassifizierbar", label: "Nicht klassifizierbar" },
  { code: "vermutete_tiefe_gewebeschaedigung", label: "Vermutete tiefe Gewebeschädigung" },
];

/** Ausserhalb der Rangfolge — aus ihnen ist jeder Wechsel erlaubt. */
export const KATEGORIE_OHNE_RANG = ["nicht_klassifizierbar", "vermutete_tiefe_gewebeschaedigung"];

export const GEWEBEART: Wundwert[] = [
  { code: "granulation", label: "Granulation" },
  { code: "fibrin", label: "Fibrin" },
  { code: "nekrose_feucht", label: "Nekrose, feucht" },
  { code: "nekrose_trocken", label: "Nekrose, trocken" },
  { code: "epithel", label: "Epithel" },
  { code: "knochen_sehne_sichtbar", label: "Knochen oder Sehne sichtbar" },
];

export const WUNDHEILUNGSPHASE: Wundwert[] = [
  { code: "exsudation", label: "Exsudation" },
  { code: "granulation", label: "Granulation" },
  { code: "epithelisierung", label: "Epithelisierung" },
];

export const EXSUDATMENGE: Wundwert[] = [
  { code: "kein", label: "Kein" },
  { code: "wenig", label: "Wenig" },
  { code: "mittel", label: "Mittel" },
  { code: "viel", label: "Viel" },
];

export const EXSUDATBESCHAFFENHEIT: Wundwert[] = [
  { code: "seroes", label: "Serös" },
  { code: "blutig", label: "Blutig" },
  { code: "trueb", label: "Trüb" },
  { code: "eitrig", label: "Eitrig" },
];

export const WUNDUMGEBUNG: Wundwert[] = [
  { code: "intakt", label: "Intakt" },
  { code: "mazeration", label: "Mazeration" },
  { code: "roetung", label: "Rötung" },
  { code: "oedem", label: "Ödem" },
  { code: "hyperkeratose", label: "Hyperkeratose" },
  { code: "trockene_haut", label: "Trockene Haut" },
];

export const INFEKTIONSZEICHEN: Wundwert[] = [
  { code: "roetung", label: "Rötung" },
  { code: "schwellung", label: "Schwellung" },
  { code: "ueberwaermung", label: "Überwärmung" },
  { code: "schmerz", label: "Schmerz" },
  { code: "funktionseinschraenkung", label: "Funktionseinschränkung" },
];

export const WUNDRAND: Wundwert[] = [
  { code: "reizlos", label: "Reizlos" },
  { code: "mazeriert", label: "Mazeriert" },
  { code: "unterminiert", label: "Unterminiert" },
  { code: "hyperkeratotisch", label: "Hyperkeratotisch" },
  { code: "nekrotisch", label: "Nekrotisch" },
];

/** Eine Beschriftung zu einem Code aus einer beliebigen dieser Listen. */
export function wundwertLabel(liste: Wundwert[], code: string): string {
  return liste.find(w => w.code === code)?.label ?? code;
}

export const wundOptionen = (liste: Wundwert[]) => liste.map(w => ({ value: w.code, label: w.label }));
