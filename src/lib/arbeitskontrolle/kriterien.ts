/**
 * Beurteilungskriterien für die Arbeitskontrolle — konfigurierbare Struktur.
 *
 * Organisationsspezifische Anpassungen: neuer Eintrag = neues Array-Element,
 * kein Code-Änderung nötig.
 */

export interface Kriterium {
  code: string;
  label: string;
}

export interface BeurteilungsBlock {
  id: string;
  frage: string;
  kriterien: Kriterium[];
}

export const BEURTEILUNGSBLOECKE: BeurteilungsBlock[] = [
  {
    id: "pflegerische_massnahmen",
    frage: "Wurden die pflegerischen Massnahmen fachgerecht und vollständig ausgeführt?",
    kriterien: [
      { code: "fachgerecht", label: "fachgerecht" },
      { code: "vollstaendig", label: "vollständig (lt Pflegeplanung)" },
    ],
  },
  {
    id: "dokumentation",
    frage: "Wurden die Massnahmen und Wirkung der Massnahmen klar und verständlich in der Pflegedokumentation beschrieben?",
    kriterien: [
      { code: "massnahmen_angefuehrt", label: "Massnahmen vollständig angeführt" },
      { code: "wirkung_beschrieben", label: "Wirkung klar und verständlich beschrieben" },
      { code: "medikamenten_erinnerung", label: "Die Klientin wurde an die Einnahme der Medikamente erinnert" },
    ],
  },
  {
    id: "auffaelligkeiten",
    frage: "Wurden Auffälligkeiten (Klient:in) in den Bericht geschrieben und erfolgte eine sofortige Meldung dieser?",
    kriterien: [
      { code: "auffaelligkeiten_dokumentiert", label: "Auffälligkeiten dokumentiert" },
      { code: "auffaelligkeiten_gemeldet", label: "Auffälligkeiten gemeldet" },
    ],
  },
  {
    id: "hygiene",
    frage: "Wurden die Hygienevorschriften eingehalten?",
    kriterien: [
      { code: "haendedesinfektion", label: "Hände Desinfektion" },
      { code: "flaechendesinfektion", label: "Flächen Desinfektion" },
      { code: "schutzmassnahmen", label: "Schutzmassnahmen" },
      { code: "kleidung", label: "Kleidung" },
      { code: "entsorgung", label: "Entsorgung von Abfällen" },
    ],
  },
  {
    id: "umgang",
    frage: "War der Umgang mit der Klient:in und dem sozialen Umfeld respektvoll?",
    kriterien: [
      { code: "klientin", label: "Klient:in" },
      { code: "soziales_umfeld", label: "Soziales Umfeld" },
    ],
  },
];
