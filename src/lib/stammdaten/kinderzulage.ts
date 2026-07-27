/**
 * SP-09: Kinderzulage vs. Ausbildungszulage — Ableitungslogik.
 *
 * System WÄHLT NICHT frei, sondern LEITET den Zulagentyp pro Kind ab
 * (Alter + Ausbildungsstatus) und schlägt ihn zur Bestätigung vor.
 *
 * Drei Zustände: KINDERZULAGE / AUSBILDUNGSZULAGE / KEINE_ZULAGE.
 * "16" ist keine harte Grenze — Ausbildungszulage ab ~15 bei
 * nachobligatorischer Ausbildung möglich.
 *
 * Beträge werden NICHT hartkodiert — kantonale Stammdatentabelle (Folge-Ticket).
 */

export type ZulagenTyp = "kinderzulage" | "ausbildungszulage" | "keine_zulage";

export interface ZulagenVorschlag {
  typ: ZulagenTyp;
  label: string;
  begruendung: string;
}

/**
 * Berechnet das Alter in Jahren (auf den Monat genau).
 * Gibt auch zurück, ob das Kind im aktuellen Monat Geburtstag hat.
 */
function berechneAlter(geburtsdatum: string, stichtag: Date = new Date()): { jahre: number; monate: number } | null {
  // Format: TT.MM.JJJJ
  const parts = geburtsdatum.split(".");
  if (parts.length !== 3) return null;
  const tag = parseInt(parts[0]);
  const monat = parseInt(parts[1]) - 1;
  const jahr = parseInt(parts[2]);
  if (isNaN(tag) || isNaN(monat) || isNaN(jahr)) return null;

  const geb = new Date(jahr, monat, tag);
  let jahre = stichtag.getFullYear() - geb.getFullYear();
  let monate = stichtag.getMonth() - geb.getMonth();
  if (stichtag.getDate() < geb.getDate()) monate--;
  if (monate < 0) { jahre--; monate += 12; }
  return { jahre, monate };
}

/**
 * Leitet den Zulagentyp pro Kind ab.
 *
 * @param geburtsdatum - Format TT.MM.JJJJ
 * @param inAusbildung - "ja" / "nein" / "" (nachobligatorische Ausbildung)
 * @param stichtag - Default: heute
 */
export function leiteZulagenTypAb(
  geburtsdatum: string,
  inAusbildung: string,
  stichtag: Date = new Date(),
): ZulagenVorschlag {
  const alter = berechneAlter(geburtsdatum, stichtag);

  if (!alter) {
    return { typ: "keine_zulage", label: "Keine Zulage", begruendung: "Geburtsdatum nicht gültig oder fehlt." };
  }

  // Kind > 25: keine Zulage
  if (alter.jahre > 25) {
    return { typ: "keine_zulage", label: "Keine Zulage", begruendung: `Kind ist ${alter.jahre} Jahre alt — Anspruch erlischt mit 25.` };
  }

  // Kind < 16 (bis Ende Monat 16. Geburtstag): Kinderzulage
  if (alter.jahre < 16) {
    return { typ: "kinderzulage", label: "Kinderzulage", begruendung: `Kind ist ${alter.jahre} Jahre alt — Kinderzulage bis 16.` };
  }

  // Kind 16-25 in nachobligatorischer Ausbildung: Ausbildungszulage
  // WICHTIG: Auch ab ~15 möglich bei frühem Ausbildungsbeginn
  if (inAusbildung === "ja") {
    return { typ: "ausbildungszulage", label: "Ausbildungszulage", begruendung: `Kind ist ${alter.jahre} Jahre alt und in nachobligatorischer Ausbildung.` };
  }

  // Kind 16-25, NICHT in Ausbildung: keine Zulage (explizit)
  return { typ: "keine_zulage", label: "Keine Zulage", begruendung: `Kind ist ${alter.jahre} Jahre alt, nicht in Ausbildung — kein Zulagen-Anspruch.` };
}

/** Labels für die drei Zustände */
export const ZULAGEN_LABELS: Record<ZulagenTyp, string> = {
  kinderzulage: "Kinderzulage",
  ausbildungszulage: "Ausbildungszulage",
  keine_zulage: "Keine Zulage",
};

/** Optionen für den Doppelbezugs-Check */
export const DOPPELBEZUG_OPTIONS = [
  { value: "nein", label: "Nein" },
  { value: "ja", label: "Ja" },
  { value: "unbekannt", label: "Unbekannt" },
];

/** Prüft ob Doppelbezug die Auszahlung blockiert */
export function istDoppelbezugBlockiert(doppelbezug: string): boolean {
  return doppelbezug === "ja" || doppelbezug === "unbekannt";
}
