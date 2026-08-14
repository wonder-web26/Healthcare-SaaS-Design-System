// AUTOGENERIERT – nicht von Hand bearbeiten.
// Quellen (offizielle Listen von Spitex Schweiz, unverändert übernommen):
//   LIST_FarbenFuerCaps.xlsx                  → Nummer, Titel, Ergebnistexte, Ampelfarbe
//   2021-11-25 LIST iHC CAPs dt frz ital.xlsx → Algorithmus-Dateiname, Titel EN/DE
//
// Beide Quellen stimmen bei allen 24 deutschen Titeln überein (maschinell geprüft).
// Die Ampelfarbe ist in der Quelle als Wort hinterlegt (grün / orange / rot), nicht als Hexwert.
// Der konkrete Farbton kommt aus dem Styleguide, niemals aus diesem Modul.
//
// WICHTIG: Die Reihenfolge 1..27 mit den Lücken 6, 13 und 23 ist die kanonische
// interRAI-Nummerierung. Die Lücken sind in der Schweizer Fassung nicht belegt.
// Ergebniswerte niemals numerisch als Schweregrad interpretieren – beim CAP 18
// (Dekubitus) ist 1 der schwerste und 3 der leichteste Zustand. Für jede Aussage
// über Schweregrad oder Richtung einer Veränderung ist ausschliesslich `ampel`
// massgebend.

export type Ampel = 'gruen' | 'orange' | 'rot'

export type CapErgebnisDefinition = {
  readonly wert: number
  readonly text: string
  readonly ampel: Ampel
}

export type CapDefinition = {
  readonly nummer: number
  readonly titel: string
  readonly titelEn: string
  readonly algorithmus: string
  readonly ergebnisse: readonly CapErgebnisDefinition[]
}

export const CAP_KATALOG: readonly CapDefinition[] = [
  {
    nummer: 1,
    titel: 'Förderung körperlicher Aktivitäten',
    titelEn: 'Physical Activities Promotion',
    algorithmus: 'SUITE9_CAP_PHYS_ACTIV_G2_V2.1_P_2012-06-06',
    ergebnisse: [
      { wert: 0, text: 'Nicht ausgelöst', ampel: 'gruen' },
      { wert: 1, text: 'Ausgelöst um eine Verbesserung zu unterstützen', ampel: 'rot' },
    ],
  },
  {
    nummer: 2,
    titel: 'Instrumentelle Aktivitäten des täglichen Lebens (IADL)',
    titelEn: 'Instrumental Activities of Daily Living',
    algorithmus: 'SUITE9_CAP_IADL_G2_V2.1_P_2014-06-25',
    ergebnisse: [
      { wert: 0, text: 'Nicht ausgelöst', ampel: 'gruen' },
      { wert: 1, text: 'Ausgelöst mit Verbesserungspotenzial', ampel: 'rot' },
    ],
  },
  {
    nummer: 3,
    titel: 'Aktivitäten des täglichen Lebens (BADL)',
    titelEn: 'Activities of Daily Living',
    algorithmus: 'SUITE9_CAP_ADL_G2_V2.2_P_2017-01-06.TXT',
    ergebnisse: [
      { wert: 0, text: 'Nicht ausgelöst', ampel: 'gruen' },
      { wert: 1, text: 'Ausgelöst, um eine Verschlechterung zu verhindern', ampel: 'orange' },
      { wert: 2, text: 'Ausgelöst, um Verbesserungen zu unterstützen', ampel: 'rot' },
    ],
  },
  {
    nummer: 4,
    titel: 'Optimierung der Wohnumgebung',
    titelEn: 'Home Environment Optimization',
    algorithmus: 'SUITE9_CAP_ENVIRONMENTAL_G2_V2.1_P_2012-06-06',
    ergebnisse: [
      { wert: 0, text: 'Nicht ausgelöst', ampel: 'gruen' },
      { wert: 1, text: 'Ausgelöst', ampel: 'rot' },
    ],
  },
  {
    nummer: 5,
    titel: 'Risiko der Institutionalisierung',
    titelEn: 'Institutional Risk',
    algorithmus: 'SUITE9_CAP_INST_RISK_G2_V2.2_P_2017-01-06.TXT',
    ergebnisse: [
      { wert: 0, text: 'Nicht ausgelöst', ampel: 'gruen' },
      { wert: 1, text: 'Ausgelöst', ampel: 'rot' },
    ],
  },
  {
    nummer: 7,
    titel: 'Verlust kognitiver Fähigkeiten',
    titelEn: 'Cognitive Loss',
    algorithmus: 'SUITE9_CAP_COGNITIVE_G2_V2.2_P_2015-03-18',
    ergebnisse: [
      { wert: 0, text: 'Nicht ausgelöst', ampel: 'gruen' },
      { wert: 1, text: 'Ausgelöst zur Überwachung des Risikos einer kognitiven Verschlechterung', ampel: 'orange' },
      { wert: 2, text: 'Ausgelöst, um eine Verschlechterung zu verhindern', ampel: 'rot' },
    ],
  },
  {
    nummer: 8,
    titel: 'Delir',
    titelEn: 'Delirium',
    algorithmus: 'SUITE9_CAP_DELIRIUM_G2_V2.1_P_2012-06-06',
    ergebnisse: [
      { wert: 0, text: 'Nicht ausgelöst', ampel: 'gruen' },
      { wert: 1, text: 'Ausgelöst', ampel: 'rot' },
    ],
  },
  {
    nummer: 9,
    titel: 'Kommunikation',
    titelEn: 'Communication',
    algorithmus: 'SUITE9_CAP_COMMUNICATION_G2_V2.1_P_2013-10-18',
    ergebnisse: [
      { wert: 0, text: 'Nicht ausgelöst', ampel: 'gruen' },
      { wert: 1, text: 'Ausgelöst, um Verbesserungen zu unterstützen', ampel: 'orange' },
      { wert: 2, text: 'Ausgelöst, um eine Verschlechterung zu verhindern', ampel: 'rot' },
    ],
  },
  {
    nummer: 10,
    titel: 'Stimmungslage',
    titelEn: 'Mood',
    algorithmus: 'SUITE9_CAP_MOOD_G2_V2.1_P_2015-03-06.txt',
    ergebnisse: [
      { wert: 0, text: 'Nicht ausgelöst', ampel: 'gruen' },
      { wert: 1, text: 'Ausgelöst - Mittleres Risiko', ampel: 'orange' },
      { wert: 2, text: 'Ausgelöst - Hohes Risiko', ampel: 'rot' },
    ],
  },
  {
    nummer: 11,
    titel: 'Verhalten',
    titelEn: 'Behavior',
    algorithmus: 'SUITE9_CAP_BEHAVIOR_G2_V2.2_P_2015-03-18',
    ergebnisse: [
      { wert: 0, text: 'Nicht ausgelöst', ampel: 'gruen' },
      { wert: 1, text: 'Ausgelöst, um zu verhindern, dass die Verhaltensweise täglich auftreten', ampel: 'orange' },
      { wert: 2, text: 'Ausgelöst, um das tägliche Auftreten von Verhaltensweisen zu reduzieren', ampel: 'rot' },
    ],
  },
  {
    nummer: 12,
    titel: 'Missbräuchliche Beziehung',
    titelEn: 'Abusive Relationship',
    algorithmus: 'SUITE9_CAP_ABUSEREL_G2_V2.1_P_2012-06-06',
    ergebnisse: [
      { wert: 0, text: 'Nicht ausgelöst', ampel: 'gruen' },
      { wert: 1, text: 'Ausgelöst - Mittleres Risiko', ampel: 'orange' },
      { wert: 2, text: 'Ausgelöst - Hohes Risiko', ampel: 'rot' },
    ],
  },
  {
    nummer: 14,
    titel: 'Informelle Unterstützung',
    titelEn: 'Informal Support',
    algorithmus: 'SUITE9_CAP_SUPPORT_G2_V2.1_P_2012-06-06',
    ergebnisse: [
      { wert: 0, text: 'Nicht ausgelöst', ampel: 'gruen' },
      { wert: 1, text: 'Ausgelöst', ampel: 'rot' },
    ],
  },
  {
    nummer: 15,
    titel: 'Soziale Beziehungen',
    titelEn: 'Social Relationship',
    algorithmus: 'SUITE9_CAP_SOCIAL_G2_V2.1_P_2012-06-06',
    ergebnisse: [
      { wert: 0, text: 'Nicht ausgelöst', ampel: 'gruen' },
      { wert: 1, text: 'Ausgelöst', ampel: 'rot' },
    ],
  },
  {
    nummer: 16,
    titel: 'Stürze',
    titelEn: 'Falls',
    algorithmus: 'SUITE9_CAP_FALLS_G2_V2.2_P_2017-01-06.TXT',
    ergebnisse: [
      { wert: 0, text: 'Nicht ausgelöst', ampel: 'gruen' },
      { wert: 1, text: 'Ausgelöst - Mittleres Risiko', ampel: 'orange' },
      { wert: 2, text: 'Ausgelöst - Hohes Risiko', ampel: 'rot' },
    ],
  },
  {
    nummer: 17,
    titel: 'Schmerzen',
    titelEn: 'Pain',
    algorithmus: 'SUITE9_CAP_PAIN_G2_V2.1_P_2012-06-06',
    ergebnisse: [
      { wert: 0, text: 'Nicht ausgelöst', ampel: 'gruen' },
      { wert: 1, text: 'Ausgelöst - Mittleres Risiko', ampel: 'orange' },
      { wert: 2, text: 'Ausgelöst - Hohes Risiko', ampel: 'rot' },
    ],
  },
  {
    nummer: 18,
    titel: 'Dekubitus',
    titelEn: 'Pressure Ulcer',
    algorithmus: 'SUITE9_CAPS_ULCER_G2_V2.3_P_2015-03-18',
    ergebnisse: [
      { wert: 0, text: 'Nicht ausgelöst', ampel: 'gruen' },
      { wert: 1, text: 'Ausgelöst, hat einen Dekubitus des Stadiums 2 und höher', ampel: 'rot' },
      { wert: 2, text: 'Ausgelöst, hat einen Dekubitus des Stadiums 1', ampel: 'rot' },
      { wert: 3, text: 'Ausgelöst, hat keinen Dekubitus, weist aber Risikofaktoren auf', ampel: 'orange' },
    ],
  },
  {
    nummer: 19,
    titel: 'Herz-Kreislauf- und Atemwegserkrankungen',
    titelEn: 'Cardiorespiratory Conditions',
    algorithmus: 'SUITE9_CAP_CARDIO_G2_V2.1_P_2012-06-06',
    ergebnisse: [
      { wert: 0, text: 'Nicht ausgelöst', ampel: 'gruen' },
      { wert: 1, text: 'Ausgelöst', ampel: 'rot' },
    ],
  },
  {
    nummer: 20,
    titel: 'Mangelernährung',
    titelEn: 'Undernutrition',
    algorithmus: 'SUITE9_CAP_NUTRITION_G2_V2.1_P_2012-06-06',
    ergebnisse: [
      { wert: 0, text: 'Nicht ausgelöst', ampel: 'gruen' },
      { wert: 1, text: 'Ausgelöst - Mittleres Risiko', ampel: 'orange' },
      { wert: 2, text: 'Ausgelöst - Hohes Risiko', ampel: 'rot' },
    ],
  },
  {
    nummer: 21,
    titel: 'Dehydratation',
    titelEn: 'Dehydration',
    algorithmus: 'SUITE9_CAP_DEHYDRATION_G2_V2.1_P_2012-06-06',
    ergebnisse: [
      { wert: 0, text: 'Nicht ausgelöst', ampel: 'gruen' },
      { wert: 1, text: 'Ausgelöst - Niedriges Risiko', ampel: 'orange' },
      { wert: 2, text: 'Ausgleöst - Hohes Risiko', ampel: 'rot' },
    ],
  },
  {
    nummer: 22,
    titel: 'Ernährungssonde',
    titelEn: 'Feeding Tube',
    algorithmus: 'SUITE9_CAP_FEEDTB_G2_V2.1_P_2012-06-06',
    ergebnisse: [
      { wert: 0, text: 'Nicht ausgelöst', ampel: 'gruen' },
      { wert: 1, text: 'Ausgelöst - Geringes Risiko', ampel: 'orange' },
      { wert: 2, text: 'Ausgelöst - Hohes Risiko', ampel: 'rot' },
    ],
  },
  {
    nummer: 24,
    titel: 'Adäquate Medikation',
    titelEn: 'Appropriate Medications',
    algorithmus: 'SUITE9_CAP_MEDICATION_G2_V2.2_P_2019-03-13.TXT',
    ergebnisse: [
      { wert: 0, text: 'Nicht ausgelöst', ampel: 'gruen' },
      { wert: 1, text: 'Ausgelöst - hohe Priorität', ampel: 'rot' },
    ],
  },
  {
    nummer: 25,
    titel: 'Tabak- und Alkoholkonsum',
    titelEn: 'Tobacco and Alcohol Use',
    algorithmus: 'SUITE9_CAP_SMOKING_G2_V2.1_P_2012-06-06',
    ergebnisse: [
      { wert: 0, text: 'Nicht ausgelöst', ampel: 'gruen' },
      { wert: 1, text: 'Ausgelöst', ampel: 'rot' },
    ],
  },
  {
    nummer: 26,
    titel: 'Urininkontinenz',
    titelEn: 'Urinary Incontinence',
    algorithmus: 'SUITE9_CAP_URINARY_INCONTINENCE_G2_V2.1_P_2014-06-25',
    ergebnisse: [
      { wert: 0, text: 'Nicht ausgelöst - Verminderte Entscheidungsfindung', ampel: 'gruen' },
      { wert: 1, text: 'Nicht ausgelöst - Kontinent', ampel: 'gruen' },
      { wert: 2, text: 'Ausgelöst, um eine Verschlechterung zu verhindern', ampel: 'orange' },
      { wert: 3, text: 'Ausgelöst, um die Verbesserung der Blasenfunktion zu unterstützen', ampel: 'rot' },
    ],
  },
  {
    nummer: 27,
    titel: 'Darmprobleme',
    titelEn: 'Bowel Conditions',
    algorithmus: 'SUITE9_CAP_BOWEL_G2_V2.1_P_2013-10-18',
    ergebnisse: [
      { wert: 0, text: 'Nicht ausgelöst', ampel: 'gruen' },
      { wert: 1, text: 'Ausgelöst, um eine Verschlechterung zu verhindern', ampel: 'orange' },
      { wert: 2, text: 'Ausgelöst, um Verbesserungen zu unterstützen', ampel: 'rot' },
    ],
  },
] as const

const NACH_NUMMER = new Map<number, CapDefinition>(CAP_KATALOG.map((c) => [c.nummer, c]))

export function capDefinition(nummer: number): CapDefinition | undefined {
  return NACH_NUMMER.get(nummer)
}

/** Ergebnistext und Ampelfarbe zu einem berechneten CAP-Wert. */
export function capErgebnis(nummer: number, wert: number): CapErgebnisDefinition | undefined {
  return NACH_NUMMER.get(nummer)?.ergebnisse.find((e) => e.wert === wert)
}

const AMPEL_RANG: Record<Ampel, number> = { gruen: 0, orange: 1, rot: 2 }

/**
 * Vergleicht zwei Ampelstufen.
 * Rückgabe > 0 bedeutet Verschlechterung, < 0 Verbesserung, 0 unverändert.
 * Diese Funktion ist die einzige zulässige Grundlage für Richtungsaussagen.
 */
export function ampelVergleich(aktuell: Ampel, vorher: Ampel): number {
  return AMPEL_RANG[aktuell] - AMPEL_RANG[vorher]
}
