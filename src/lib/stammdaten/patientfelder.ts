/**
 * Beschriftungen der Patientenfelder — Code hinein, Klartext heraus.
 *
 * Die Stammdaten speichern Codes (BB2 Geschlecht, BB4 Zivilstand, BB9
 * Wohnsituation und so fort). Damit die Ansicht sie nicht selbst auflösen
 * muss — und dabei eine zweite Zuordnung neben dem Katalog entstünde —,
 * liegt die Auflösung hier, dicht an den Katalogen.
 *
 * Ein unbekannter Code wird durchgereicht, nicht verschluckt: sähe man ihn
 * nicht, bliebe eine falsche Zuordnung unbemerkt.
 */
import type { PersonenFeldWert } from "./personenfeld";
import { GESCHLECHT } from "./geschlecht";
import { STAATSANGEHOERIGKEIT } from "./staatsangehoerigkeit";
import { ZIVILSTAND } from "./zivilstand";
import { AUFENTHALTSSTATUS } from "./aufenthaltsstatus";
import { KONFESSIONEN } from "./konfession";
import { sdaSpracheLabel } from "./sda-sprache";
import { sdaJaNeinLabel } from "./sda-ja-nein";
import { sdaWohnsituationLabel } from "./sda-wohnsituation";
import { sdaZusammenlebenLabel } from "./sda-zusammenleben";

/** Die Wertelisten der Personenfelder tragen `schluessel`, nicht `code`. */
function ausListe(liste: readonly PersonenFeldWert[], schluessel: string): string {
  if (!schluessel.trim()) return "";
  return liste.find(x => x.schluessel === schluessel)?.label ?? schluessel;
}

export const patientfeldLabel = {
  geschlecht: (c: string) => ausListe(GESCHLECHT, c),
  staatsangehoerigkeit: (c: string) => ausListe(STAATSANGEHOERIGKEIT, c),
  zivilstand: (c: string) => ausListe(ZIVILSTAND, c),
  aufenthaltsstatus: (c: string) => ausListe(AUFENTHALTSSTATUS, c),
  konfession: (c: string) => (c.trim() ? (KONFESSIONEN.find(x => x.value === c)?.label ?? c) : ""),
  sprache: (c: string) => (c.trim() ? sdaSpracheLabel(c) : ""),
  jaNein: (c: string) => (c.trim() ? sdaJaNeinLabel(c) : ""),
  wohnsituation: (c: string) => (c.trim() ? sdaWohnsituationLabel(c) : ""),
  zusammenleben: (c: string) => (c.trim() ? sdaZusammenlebenLabel(c) : ""),
};
