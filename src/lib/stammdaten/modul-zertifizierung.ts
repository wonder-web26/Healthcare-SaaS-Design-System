/**
 * Modul-Zertifizierung — steuert, welche klinischen Module in die
 * Onboarding-Validierung einfliessen.
 *
 * Module, deren Zertifizierung aussteht, werden NICHT als Pflicht geprüft.
 * Nach erfolgter Zertifizierung: Wert auf true setzen → Modul fliesst
 * automatisch in die Validierung ein, ohne Codeänderung an anderer Stelle.
 */

export const MODUL_ZERTIFIZIERUNG = {
  /** InterRAI HC: Zertifizierung bei interRAI.org / Spitex Schweiz ausstehend */
  interraiCertified: false,
  /** Pflegeplanung (NANDA/ENP): fachliche Validierung ausstehend */
  pflegeplanungCertified: false,
  /** KLV-Verordnung: Zertifizierung ausstehend */
  klvCertified: false,
} as const;
