/**
 * Merkmalkonfiguration des Bezugspersonen-Dialogs — EINE Wahrheitsquelle.
 *
 * Vier Gruppen; pro Rolle erscheinen nur zutreffende Merkmale (ausgeblendet,
 * nicht ausgegraut). Die Komponente leitet ihr Rendering ausschliesslich aus
 * dieser Struktur ab — kein `if (rolle === …)` im Markup.
 *
 * ACHTUNG, VORLAEUFIGE SETZUNG: Wertebereich und Rollenzuordnung der Gruppe
 * «Vertretung und Entscheidung» sind provisorisch und stehen unter
 * juristischem Vorbehalt (ZGB Art. 360 ff. / 370 ff.); nicht als geprueft
 * darstellen.
 *
 * Rollen ausserhalb der Matrix (Fachpersonal, Bezugsperson Spitex, …) behalten
 * das heutige Verhalten: nur Notfallkontakt und Auskunftsberechtigt.
 */
import type { Beziehung, BeziehungsrolleCode } from "./beziehungen";

export type Personentyp = "privat" | "organisation";

/** Boolesche Merkmale direkt an der Beziehung. `vertretungGesetz` und
 *  `angestelltePflegendeAngehoerige` sind abgeleitete Lesefelder ohne Speicherfeld. */
export type MerkmalCode =
  | "hauptansprechperson" | "notfallkontakt" | "auskunftsberechtigt" | "schluesselbesitz"
  | "inPatientenverfuegungBezeichnet" | "imVorsorgeauftragBeauftragt"
  | "beistandschaftAdministrativ" | "beistandschaftGesundheit"
  | "vertretungGesetz"
  | "rechnungsempfaenger" | "unterschriftsberechtigt"
  | "gemeinsamerHaushalt" | "unbezahlteBetreuung"
  | "angestelltePflegendeAngehoerige";

export interface MerkmalDef {
  code: MerkmalCode;
  label: string;
  /** Rollen, bei denen das Merkmal erscheint. */
  rollen: BeziehungsrolleCode[];
  /** true → nur bei Personentyp Privatperson. */
  nurPrivat?: boolean;
  /** Nur bei Beziehung Ehe (vorhandener Code `ehepartner`; ein Code für
   *  Lebenspartnerschaft existiert nicht — Bedingung greift bewusst nur hier). */
  nurBeziehung?: string[];
  /** Deaktiviert, solange dieses Merkmal nicht gesetzt ist (title nennt den Grund). */
  setztVoraus?: MerkmalCode;
  /** Abgeleitet, nicht gespeichert: gilt kraft Gesetzes (Art. 374 ZGB), sobald
   *  die Voraussetzungen erfuellt sind — Lesefeld, kein klickbarer Chip. */
  abgeleitet?: boolean;
}

export interface MerkmalGruppe {
  titel: string;
  untertitel: string;
  merkmale: MerkmalDef[];
}

const ANG: BeziehungsrolleCode[] = ["angehoerige", "pflegende_angehoerige"];
const A_B = [...ANG, "beistand"] as BeziehungsrolleCode[];
const A_B_W = [...A_B, "weitere"] as BeziehungsrolleCode[];
const ALLE4 = [...A_B_W, "sozialdienst"] as BeziehungsrolleCode[];

export const MERKMAL_GRUPPEN: MerkmalGruppe[] = [
  {
    titel: "Kontakt und Erreichbarkeit",
    untertitel: "wer erreicht wird und wer hineinkommt",
    merkmale: [
      { code: "hauptansprechperson", label: "Hauptansprechperson", rollen: ALLE4 },
      { code: "notfallkontakt", label: "Notfallkontakt", rollen: A_B_W, nurPrivat: true },
      { code: "auskunftsberechtigt", label: "Auskunftsberechtigt", rollen: ALLE4 },
      { code: "schluesselbesitz", label: "Schlüsselbesitz", rollen: A_B_W, nurPrivat: true },
    ],
  },
  {
    titel: "Vertretung und Entscheidung",
    untertitel: "wer für die Klientin entscheiden darf",
    merkmale: [
      { code: "inPatientenverfuegungBezeichnet", label: "In Patientenverfügung bezeichnet", rollen: A_B_W, nurPrivat: true },
      { code: "imVorsorgeauftragBeauftragt", label: "Im Vorsorgeauftrag beauftragt", rollen: A_B_W, nurPrivat: true },
      { code: "beistandschaftAdministrativ", label: "Beistandschaft administrativ", rollen: A_B },
      { code: "beistandschaftGesundheit", label: "Beistandschaft Gesundheit", rollen: A_B },
      { code: "vertretungGesetz", label: "Vertretung von Gesetzes wegen", rollen: ANG, nurPrivat: true, nurBeziehung: ["ehepartner"], setztVoraus: "gemeinsamerHaushalt", abgeleitet: true },
    ],
  },
  {
    titel: "Administration",
    untertitel: "wer unterschreibt und wer zahlt",
    merkmale: [
      { code: "rechnungsempfaenger", label: "Rechnungsempfänger", rollen: ALLE4 },
      { code: "unterschriftsberechtigt", label: "Unterschriftsberechtigt für Verträge", rollen: A_B },
    ],
  },
  {
    titel: "Betreuungssituation",
    untertitel: "wer tatsächlich mitbetreut",
    merkmale: [
      { code: "gemeinsamerHaushalt", label: "Lebt im gemeinsamen Haushalt", rollen: [...ANG, "weitere"] as BeziehungsrolleCode[], nurPrivat: true },
      { code: "unbezahlteBetreuung", label: "Erbringt unbezahlte Betreuung", rollen: [...ANG, "weitere"] as BeziehungsrolleCode[], nurPrivat: true },
      // Abgeleitet aus der Rolle — die Anstellung wird im Angehörigen-Reiter geführt.
      { code: "angestelltePflegendeAngehoerige", label: "Angestellte pflegende Angehörige", rollen: ["pflegende_angehoerige"], abgeleitet: true },
    ],
  },
];

/** Sichtbare Merkmale einer Gruppe für Rolle/Personentyp/Beziehungsart. */
export function sichtbareMerkmale(g: MerkmalGruppe, rolle: BeziehungsrolleCode, typ: Personentyp, art: string): MerkmalDef[] {
  return g.merkmale.filter(m =>
    m.rollen.includes(rolle) &&
    (!m.nurPrivat || typ === "privat") &&
    (!m.nurBeziehung || m.nurBeziehung.includes(art)));
}

/** Merkmalwert aus der Beziehung lesen (Beistandschaft liegt im Objekt;
 *  abgeleitete Merkmale werden aus Beziehungsart bzw. Rolle berechnet). */
export function merkmalWert(b: Pick<Beziehung, "beistandschaft"> & Record<string, unknown>, code: MerkmalCode): boolean {
  if (code === "beistandschaftAdministrativ") return !!b.beistandschaft?.administrativ;
  if (code === "beistandschaftGesundheit") return !!b.beistandschaft?.gesundheit;
  if (code === "vertretungGesetz") return b["art"] === "ehepartner" && !!b["gemeinsamerHaushalt"];
  if (code === "angestelltePflegendeAngehoerige") return b["rolle"] === "pflegende_angehoerige";
  return !!b[code];
}
