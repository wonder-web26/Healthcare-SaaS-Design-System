/**
 * Herkunft je SDA-Item — an EINER Stelle, keine Erweiterung des Katalogs
 * (stammt nicht aus der Quelle, sondern aus der Fachbedeutung der Felder).
 *
 * Drei Herkünfte:
 *   klient   — gehört zum Patienten; wird durchgelesen, ist korrigierbar,
 *              beim Sperren materialisiert. Schreibt zurück in den Patienten.
 *   fall     — Fallnummer; durchgelesen, nicht editierbar, beim Sperren
 *              materialisiert.
 *   formular — nur im Formular erfasst.
 *
 * `SDA_PATIENT_FELD` bildet jedes `klient`-Item auf sein Patientenfeld ab. Drei
 * Items tragen `null`: iA10 (Adresse als zusammengesetzter String), CHA7a
 * (Krankenkasse als Label) und iB4 (Sprache als Label) taugen mit dem heutigen
 * Patientenfeld nicht zum Durchlesen/Rückschreiben. Sie werden formularseitig
 * geführt (im Formular erfasst, beim Sperren materialisiert) und sind als
 * benannte Abweichung dokumentiert (docs/datenmodell-mapping.md).
 */
import { SDA_KATALOG } from "./sda-katalog";

export type ItemHerkunft = "klient" | "fall" | "formular";

const KLIENT_ICODES = [
  "iA1c", "iA1a", "iA2", "iA3", "iA4", "iA5a", "iA10", "CHB3", "iB4", "iB11", "CHA7a", "CHA7b", "CHA7c",
  // Patientenfelder, die die Pipeline befüllt und Patient360 anzeigt — daher
  // klient (durchgelesen), nicht formular. Kein Pipeline-Umbau, keine Doppelerfassung.
  "iA11b", "iA12a", "iA12b",
  // iB2 (AA2 Datum der Eröffnung des Dossiers) wird bewusst NICHT durchgelesen:
  // es ist eine SDA-eigene Angabe, die im Registrierungsformular gesetzt wird
  // (formular), nicht aus den Stammdaten gemappt.
] as const;
const FALL_ICODES = ["iA5d"] as const;

export const SDA_HERKUNFT: Readonly<Record<string, ItemHerkunft>> = Object.fromEntries(
  SDA_KATALOG.map((item) => {
    const h: ItemHerkunft = (FALL_ICODES as readonly string[]).includes(item.iCode)
      ? "fall"
      : (KLIENT_ICODES as readonly string[]).includes(item.iCode)
        ? "klient"
        : "formular";
    return [item.iCode, h];
  }),
);

/**
 * `klient`-Item → Patientenfeld. `null` = kein taugliches Feld (Abweichung,
 * formularseitig geführt). Feldnamen als String, um den Katalog vom
 * Patientenmodell zu entkoppeln.
 */
export const SDA_PATIENT_FELD: Readonly<Record<string, string | null>> = {
  iA1c: "nachname",
  iA1a: "vorname",
  iA2: "geschlecht",
  iA3: "geburtsdatum",
  iA4: "zivilstand",
  iA5a: "ahvNummer",
  CHB3: "staatsangehoerigkeit",
  iB11: "uebersetzerNotwendig",
  // Wohn-/Anmeldefelder, die am Patienten leben (Pipeline + Patient360):
  iA11b: "wohnsituation",
  iA12a: "formZusammenleben",
  iA12b: "neuZusammenlebend",
  // Abweichung — formularseitig, nicht durchgelesen:
  iA10: null, // Wohnort PLZ/Ort ≠ adresse (String inkl. Strasse)
  iB4: null, // Sprache (Auswahl-Code) ≠ sprache (Label)
  // CHA7a/b/c werden aus den Versicherungsverhältnissen gelesen (siehe unten),
  // nicht aus einem Patientenfeld.
};

/**
 * CHA7a/b/c lesen den Namen des aktiven Versicherers des jeweiligen Typs aus den
 * Versicherungsverhältnissen (Zahlerseite), nicht aus einem Patientenfeld. Damit
 * löst sich die Doppelerfassung der Grundversicherung auf.
 */
export const SDA_VERSICHERUNG_TYP: Readonly<Record<string, "kvg" | "vvg" | "uvg">> = {
  CHA7a: "kvg",
  CHA7b: "vvg",
  CHA7c: "uvg",
};

export function sdaHerkunft(iCode: string): ItemHerkunft {
  return SDA_HERKUNFT[iCode] ?? "formular";
}

/** Trägt dieses Item seinen Wert aus dem Patienten (durchgelesen, rückschreibbar)? */
export function istPatientDurchgelesen(iCode: string): boolean {
  return SDA_HERKUNFT[iCode] === "klient" && SDA_PATIENT_FELD[iCode] != null;
}

/** Liest dieses Item den Namen des aktiven Versicherers (CHA7a/b/c)? */
export function istVersicherungDurchgelesen(iCode: string): boolean {
  return iCode in SDA_VERSICHERUNG_TYP;
}

// ── Vollständigkeit beim Start erzwingen ─────────────────────────────────────
// Jeder der 31 i-Codes trägt genau eine Herkunft; jeder klient/fall-Code ist ein
// gültiger Katalog-Code.
{
  const alle = new Set(SDA_KATALOG.map((i) => i.iCode));
  if (Object.keys(SDA_HERKUNFT).length !== alle.size) {
    throw new Error("SDA_HERKUNFT: nicht jeder i-Code trägt genau eine Herkunft");
  }
  for (const c of [...KLIENT_ICODES, ...FALL_ICODES]) {
    if (!alle.has(c)) throw new Error(`SDA_HERKUNFT: unbekannter i-Code "${c}"`);
  }
}
