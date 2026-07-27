/**
 * Organisationseinstellungen — konfigurierbare Parameter pro Organisation.
 *
 * In der Produktion: Datenbank-gestützt mit Admin-UI.
 * Im Prototyp: In-Memory, zur Laufzeit veränderbar.
 */

export interface OrgEinstellungen {
  /** Turnus der Arbeitskontrolle in Monaten. Vorgabewert: 3. */
  arbeitskontrolleTurnusMonate: number;
}

const einstellungen: OrgEinstellungen = {
  arbeitskontrolleTurnusMonate: 3,
};

export function getOrgEinstellungen(): OrgEinstellungen {
  return { ...einstellungen };
}

export function setOrgEinstellung<K extends keyof OrgEinstellungen>(key: K, value: OrgEinstellungen[K]): void {
  einstellungen[key] = value;
}
