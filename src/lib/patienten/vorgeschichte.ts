/**
 * Vorgeschichte — stationärer Verlauf und frühere Behandlungen.
 *
 * Der stationäre Verlauf stand bisher in der Anamnese. Er gehört nicht dahin:
 * die Anamnese ist eine Erhebung zum Zeitpunkt der Aufnahme, ein
 * Spitalaufenthalt ist ein Ereignis der Vorgeschichte. Beides in einer Karte
 * liess den Verlauf wie einen Teil der Befragung aussehen.
 *
 * Die Einträge sind unverändert aus der Anamnese übernommen — keine erfundene
 * Vorgeschichte. Nur Herr Steiner trägt welche; bei den übrigen Patienten war
 * dort nichts erfasst, und die Ansicht sagt das.
 */

export interface Spitalaufenthalt {
  id: string;
  einrichtung: string;
  grund: string;
  /** TT.MM.JJJJ */
  von: string;
  bis: string;
  tage: number;
}

export interface FruehererEingriff {
  id: string;
  eingriff: string;
  datum: string;
}

export const STATIONAERER_VERLAUF: Record<string, Spitalaufenthalt[]> = {
  "P-2026-0041": [
    { id: "s1", einrichtung: "Kantonsspital Winterthur", grund: "Sturz — Oberschenkelprellung", von: "12.01.2026", bis: "15.01.2026", tage: 3 },
    { id: "s2", einrichtung: "Universitätsspital Zürich", grund: "Diabetes-Einstellung", von: "28.11.2025", bis: "02.12.2025", tage: 4 },
  ],
};

export const FRUEHERE_EINGRIFFE: Record<string, FruehererEingriff[]> = {
  "P-2026-0041": [
    { id: "o1", eingriff: "Hüft-TEP links", datum: "14.03.2019" },
    { id: "o2", eingriff: "Appendektomie", datum: "08.06.1985" },
  ],
};
