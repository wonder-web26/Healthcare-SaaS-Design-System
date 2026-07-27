/**
 * Demo AI suggestions for Fritz Huber (NEU-ASS-001).
 *
 * Each suggestion references a conversation segment and proposes a valid
 * answer code for a valid input field. The suggestions are clinically
 * plausible and internally consistent:
 *
 * Profile: 82-year-old male, 4 months post hip fracture, lives with wife,
 * type 2 diabetes, hypertension, heart failure, arthritis. Needs help with
 * BADL (bathing, dressing lower body), IADL mostly dependent. Mild cognitive
 * decline (short-term memory). Depressive symptoms. Mild urinary incontinence.
 * Daily pain. Moderate fall risk.
 *
 * All field codes and option codes are verified against the seed.
 */

import type { Vorschlag } from "../store";

const TS = "2026-02-28T11:00:00";

export const VORSCHLAEGE_HUBER: Vorschlag[] = [
  // ── C: Kognition ────────────────────────────────────────────────────────────
  // C1: Cognitive skills for daily decision-making → 1 (modified independence)
  // SEG-005: "Manchmal muss ich halt nachfragen, was genau ansteht"
  { feldCode: "C1", vorpigeschlagenerWert: "1", gespraechAbschnittId: "SEG-005", erfasstAm: TS },

  // C2a: Short-term memory → 1 (memory problem present)
  // SEG-006: "dreimal das Gleiche gefragt"
  { feldCode: "C2a", vorpigeschlagenerWert: "1", gespraechAbschnittId: "SEG-006", erfasstAm: TS },

  // C2b: Procedural memory → 0 (memory OK)
  // SEG-008: remembers what was discussed
  { feldCode: "C2b", vorpigeschlagenerWert: "0", gespraechAbschnittId: "SEG-008", erfasstAm: TS },

  // C2c: Situational memory → 0 (memory OK)
  // SEG-008: can recall conversation context
  { feldCode: "C2c", vorpigeschlagenerWert: "0", gespraechAbschnittId: "SEG-008", erfasstAm: TS },

  // ── D: Kommunikation und Sehen ──────────────────────────────────────────────
  // D1: Hearing → 0 (adequate)
  // SEG-010: "ich höre Sie gut"
  { feldCode: "D1", vorpigeschlagenerWert: "0", gespraechAbschnittId: "SEG-010", erfasstAm: TS },

  // D2: Making self understood → 0 (understood)
  // SEG-005: clear speech throughout conversation
  { feldCode: "D2", vorpigeschlagenerWert: "0", gespraechAbschnittId: "SEG-005", erfasstAm: TS },

  // D3: Vision → 1 (impaired, corrected with glasses)
  // SEG-010: "Zum Lesen brauche ich die Brille"
  { feldCode: "D3", vorpigeschlagenerWert: "1", gespraechAbschnittId: "SEG-010", erfasstAm: TS },

  // ── E: Stimmung und Verhalten ───────────────────────────────────────────────
  // E1a: Negative statements → 2 (present 1-2 of last 3 days)
  // SEG-012: "wozu das alles noch"
  { feldCode: "E1a", vorpigeschlagenerWert: "2", gespraechAbschnittId: "SEG-012", erfasstAm: TS },

  // E1b: Persistent anger → 0 (not present)
  // SEG-012: sad but not angry
  { feldCode: "E1b", vorpigeschlagenerWert: "0", gespraechAbschnittId: "SEG-012", erfasstAm: TS },

  // E1c: Unrealistic fears → 0 (not present)
  // SEG-014: no fear expressions
  { feldCode: "E1c", vorpigeschlagenerWert: "0", gespraechAbschnittId: "SEG-014", erfasstAm: TS },

  // E1d: Repetitive health complaints → 1 (present, not in last 3 days)
  // SEG-033: talks about pain but not repetitively
  { feldCode: "E1d", vorpigeschlagenerWert: "1", gespraechAbschnittId: "SEG-033", erfasstAm: TS },

  // E1e: Repetitive anxious complaints → 0 (not present)
  { feldCode: "E1e", vorpigeschlagenerWert: "0", gespraechAbschnittId: "SEG-014", erfasstAm: TS },

  // E1f: Sad facial expression → 2 (1-2 of last 3 days)
  // SEG-012: "Das macht mich schon traurig"
  { feldCode: "E1f", vorpigeschlagenerWert: "2", gespraechAbschnittId: "SEG-012", erfasstAm: TS },

  // E1g: Crying → 0 (not present)
  { feldCode: "E1g", vorpigeschlagenerWert: "0", gespraechAbschnittId: "SEG-014", erfasstAm: TS },

  // E2a: Loss of interest → 2 (1-2 of last 3 days)
  // SEG-013: no longer goes to Schützenverein
  { feldCode: "E2a", vorpigeschlagenerWert: "2", gespraechAbschnittId: "SEG-013", erfasstAm: TS },

  // E2b: Withdrawal from activities → 2 (1-2 of last 3 days)
  // SEG-014: "die Kameraden habe ich schon lange nicht mehr gesehen"
  { feldCode: "E2b", vorpigeschlagenerWert: "2", gespraechAbschnittId: "SEG-014", erfasstAm: TS },

  // E2c: Reduced social interaction → 2 (1-2 of last 3 days)
  // SEG-014: isolation, only daughter on Sundays
  { feldCode: "E2c", vorpigeschlagenerWert: "2", gespraechAbschnittId: "SEG-014", erfasstAm: TS },

  // ── F: Psychosoziales Wohlbefinden ──────────────────────────────────────────
  // F2: Sense of initiative → 0 (present — considers own situation hopeless)
  // SEG-014: "Ich mag einfach nicht mehr"
  { feldCode: "F2", vorpigeschlagenerWert: "0", gespraechAbschnittId: "SEG-014", erfasstAm: TS },

  // ── G: IADL (G1 with columns A=Effektiv, B=Vermutet) ─────────────────────
  // G1aa: Mahlzeitenzubereitung (effektiv) → 4 (verstärkte Hilfe)
  // SEG-016: "eine Mahlzeit kochen geht nicht"
  { feldCode: "G1aa", vorpigeschlagenerWert: "4", gespraechAbschnittId: "SEG-016", erfasstAm: TS },

  // G1ab: Mahlzeitenzubereitung (vermutet) → 3 (begrenzte Hilfe)
  { feldCode: "G1ab", vorpigeschlagenerWert: "3", gespraechAbschnittId: "SEG-016", erfasstAm: TS },

  // G1ba: Hausarbeiten (effektiv) → 6 (vollständige Hilfe)
  // SEG-016: wife does all housework
  { feldCode: "G1ba", vorpigeschlagenerWert: "6", gespraechAbschnittId: "SEG-016", erfasstAm: TS },

  // G1ca: Geld verwalten (effektiv) → 6 (vollständige Hilfe)
  // SEG-016: "Die Finanzen macht auch alles ich, seit dem Spital"
  { feldCode: "G1ca", vorpigeschlagenerWert: "6", gespraechAbschnittId: "SEG-016", erfasstAm: TS },

  // G1da: Medikamente (effektiv) → 2 (Aufsicht)
  // SEG-017: takes them himself but wife reminds + prepares dosette
  { feldCode: "G1da", vorpigeschlagenerWert: "2", gespraechAbschnittId: "SEG-017", erfasstAm: TS },

  // G1ea: Telefonieren (effektiv) → 0 (unabhängig)
  // SEG-017: "Telefonieren kann ich schon noch"
  { feldCode: "G1ea", vorpigeschlagenerWert: "0", gespraechAbschnittId: "SEG-017", erfasstAm: TS },

  // G1fa: Treppen (effektiv) → 3 (begrenzte Hilfe)
  // SEG-024: "Treppen sind schwierig"
  { feldCode: "G1fa", vorpigeschlagenerWert: "3", gespraechAbschnittId: "SEG-024", erfasstAm: TS },

  // G1ga: Einkaufen (effektiv) → 6 (vollständige Hilfe)
  // SEG-016: "Einkaufen sowieso nicht"
  { feldCode: "G1ga", vorpigeschlagenerWert: "6", gespraechAbschnittId: "SEG-016", erfasstAm: TS },

  // G1ha: Verkehrsmittel (effektiv) → 6 (vollständige Hilfe)
  // SEG-024: only walks around the block with wife
  { feldCode: "G1ha", vorpigeschlagenerWert: "6", gespraechAbschnittId: "SEG-024", erfasstAm: TS },

  // ── G: BADL (G2) ──────────────────────────────────────────────────────────
  // G2a: Bad/Dusche → 4 (verstärkte Unterstützung)
  // SEG-019: "Beim Duschen muss ich ihn stützen, alleine geht das nicht mehr"
  { feldCode: "G2a", vorpigeschlagenerWert: "4", gespraechAbschnittId: "SEG-019", erfasstAm: TS },

  // G2b: Körperpflege → 1 (unabhängig, nur Vorbereitung)
  // SEG-019: can manage upper body
  { feldCode: "G2b", vorpigeschlagenerWert: "1", gespraechAbschnittId: "SEG-019", erfasstAm: TS },

  // G2c: Ankleiden Oberkörper → 0 (unabhängig)
  // SEG-019: "Oben anziehen ... das geht noch"
  { feldCode: "G2c", vorpigeschlagenerWert: "0", gespraechAbschnittId: "SEG-019", erfasstAm: TS },

  // G2d: Ankleiden Unterkörper → 3 (begrenzte Unterstützung)
  // SEG-019: "Hosen und Socken, da muss ich helfen"
  { feldCode: "G2d", vorpigeschlagenerWert: "3", gespraechAbschnittId: "SEG-019", erfasstAm: TS },

  // G2e: Fortbewegung in der Wohnung → 2 (Aufsicht — uses Rollator)
  // SEG-020: "In der Wohnung laufe ich am Rollator"
  { feldCode: "G2e", vorpigeschlagenerWert: "2", gespraechAbschnittId: "SEG-020", erfasstAm: TS },

  // G2g: Essen → 0 (unabhängig)
  // SEG-022: "essen und trinken kann ich selber"
  { feldCode: "G2g", vorpigeschlagenerWert: "0", gespraechAbschnittId: "SEG-022", erfasstAm: TS },

  // G2h: Toilettenbenutzung → 1 (unabhängig, nur Vorbereitung)
  // SEG-020: "Auf die Toilette gehe ich alleine"
  { feldCode: "G2h", vorpigeschlagenerWert: "1", gespraechAbschnittId: "SEG-020", erfasstAm: TS },

  // ── H: Kontinenz ──────────────────────────────────────────────────────────
  // H1: Bladder continence → 2 (gelegentlich inkontinent)
  // SEG-026: "Ab und zu geht schon mal ein Tropfen daneben"
  { feldCode: "H1", vorpigeschlagenerWert: "2", gespraechAbschnittId: "SEG-026", erfasstAm: TS },

  // H2: Bowel continence → 0 (kontinent)
  // SEG-026: "Stuhlgang ist kein Problem"
  { feldCode: "H2", vorpigeschlagenerWert: "0", gespraechAbschnittId: "SEG-026", erfasstAm: TS },

  // ── I: Krankheitsdiagnosen ────────────────────────────────────────────────
  // Seed labels: I2a=Hüftfraktur, I2c=Alzheimer, I2e=Hemiplegie,
  //   I2k=KHK, I2m=Herzinsuffizienz, I2p=Depression, I2u=Diabetes.
  // Values: 0=nicht vorhanden, 1=Hauptdiagnose, 2=aktive Behandlung,
  //   3=unter Beobachtung. Only ONE field may carry value 1.

  // I1: Disease diagnoses present → 1 (yes)
  // SEG-028: multiple diagnoses
  { feldCode: "I1", vorpigeschlagenerWert: "1", gespraechAbschnittId: "SEG-028", erfasstAm: TS },

  // I2a: Hüftfraktur → 1 (HAUPTDIAGNOSE — reason for Spitex referral)
  // SEG-003: "Hüftbruch. Seit Dezember ist er wieder daheim"
  { feldCode: "I2a", vorpigeschlagenerWert: "1", gespraechAbschnittId: "SEG-003", erfasstAm: TS },

  // I2k: KHK → 2 (aktive Behandlung — takes Lisinopril, Aspirin Cardio)
  // SEG-028: "das Blutdruck-Problem, das habe ich schon seit Jahren"
  { feldCode: "I2k", vorpigeschlagenerWert: "2", gespraechAbschnittId: "SEG-028", erfasstAm: TS },

  // I2m: Herzinsuffizienz → 2 (aktive Behandlung)
  // SEG-029: "Herzinsuffizienz, hat er gesagt"
  { feldCode: "I2m", vorpigeschlagenerWert: "2", gespraechAbschnittId: "SEG-029", erfasstAm: TS },

  // I2p: Depression → 3 (unter Beobachtung — symptoms present, no formal treatment)
  // SEG-012: "Manchmal denke ich, wozu das alles noch"
  { feldCode: "I2p", vorpigeschlagenerWert: "3", gespraechAbschnittId: "SEG-012", erfasstAm: TS },

  // I2u: Diabetes mellitus → 2 (aktive Behandlung — takes Metformin)
  // SEG-028: "Zucker, also Diabetes, seit etwa fünf Jahren"
  { feldCode: "I2u", vorpigeschlagenerWert: "2", gespraechAbschnittId: "SEG-028", erfasstAm: TS },

  // ── J: Gesundheitszustand ─────────────────────────────────────────────────
  // J1a: Falls in last 30 days → 1 (yes, 1 fall)
  // SEG-031: "einmal im Badezimmer ausgerutscht"
  { feldCode: "J1a", vorpigeschlagenerWert: "1", gespraechAbschnittId: "SEG-031", erfasstAm: TS },

  // J1b: Falls in last 31-180 days → 1 (yes — the hip fracture)
  // SEG-003: hip fracture in October
  { feldCode: "J1b", vorpigeschlagenerWert: "1", gespraechAbschnittId: "SEG-003", erfasstAm: TS },

  // J3a: Pain frequency → 3 (daily)
  // SEG-033: "Jeden Tag, eigentlich"
  { feldCode: "J3a", vorpigeschlagenerWert: "3", gespraechAbschnittId: "SEG-033", erfasstAm: TS },

  // J3b: Pain intensity → 2 (moderate)
  // SEG-033: "tut noch weh... Dafalgan, dann geht es besser"
  { feldCode: "J3b", vorpigeschlagenerWert: "2", gespraechAbschnittId: "SEG-033", erfasstAm: TS },

  // ── L: Hautzustand ────────────────────────────────────────────────────────
  // L1: Ulcer → 0 (none)
  // SEG-045: "keine offenen Stellen"
  { feldCode: "L1", vorpigeschlagenerWert: "0", gespraechAbschnittId: "SEG-045", erfasstAm: TS },

  // ── O: Verantwortlichkeit ─────────────────────────────────────────────────
  // O1: Client agrees to treatment → 1 (yes)
  // SEG-047: "Die Physiotherapie hilft schon" — receptive to help
  { feldCode: "O1", vorpigeschlagenerWert: "1", gespraechAbschnittId: "SEG-047", erfasstAm: TS },

  // ── P: Soziale Unterstützung ──────────────────────────────────────────────
  // P1: Informal helper lives with client → 1 (yes)
  // SEG-041: wife is primary caregiver, lives with him
  { feldCode: "P1", vorpigeschlagenerWert: "1", gespraechAbschnittId: "SEG-041", erfasstAm: TS },

  // ── Q: Umfeld ─────────────────────────────────────────────────────────────
  // Q1a: Home environment — adequate heating → 0 (no concern)
  // SEG-002: long-term apartment, no issues mentioned
  { feldCode: "Q1a", vorpigeschlagenerWert: "0", gespraechAbschnittId: "SEG-002", erfasstAm: TS },

  // Q3a: Emergency system present → 0 (no)
  // SEG-043: "so etwas haben wir nicht"
  { feldCode: "Q3a", vorpigeschlagenerWert: "0", gespraechAbschnittId: "SEG-043", erfasstAm: TS },

  // ── K: Mund- und Ernährungsstatus ──────────────────────────────────────────
  // K2a: Gewichtsverlust ≥5% → 0 (nein — 3-4 kg, below threshold)
  // SEG-048: "drei, vier Kilo seit dem Spital, das ist nicht so viel"
  { feldCode: "K2a", vorpigeschlagenerWert: "0", gespraechAbschnittId: "SEG-048", erfasstAm: TS },

  // K2c: Flüssigkeitsaufnahme < 1000ml/Tag → 0 (nein)
  // SEG-049: "Kaffee am Morgen und Wasser über den Tag"
  { feldCode: "K2c", vorpigeschlagenerWert: "0", gespraechAbschnittId: "SEG-049", erfasstAm: TS },

  // K3: Ernährungsform → 0 (normal)
  // SEG-050: "Er kann alles essen, Schlucken ist kein Problem"
  { feldCode: "K3", vorpigeschlagenerWert: "0", gespraechAbschnittId: "SEG-050", erfasstAm: TS },

  // K4a: Zahnprothese → 1 (ja)
  // SEG-051: "Oben hat er eine Prothese, die ist aber gut"
  { feldCode: "K4a", vorpigeschlagenerWert: "1", gespraechAbschnittId: "SEG-051", erfasstAm: TS },

  // K4d: Schwierigkeiten beim Kauen → 0 (nein)
  // SEG-051: prothesis fits well, no chewing issues
  { feldCode: "K4d", vorpigeschlagenerWert: "0", gespraechAbschnittId: "SEG-051", erfasstAm: TS },

  // ── M: Medikamente ────────────────────────────────────────────────────────
  // M1: Totale Anzahl Medikamente → 5 (number field)
  // SEG-059: "Metformin, Lisinopril, Aspirin Cardio, Xarelto und Dafalgan"
  { feldCode: "M1", vorpigeschlagenerWert: "5", gespraechAbschnittId: "SEG-059", erfasstAm: TS },

  // M2: Medikamentenliste → 1 (aktuelle Liste mit Dosierung vorhanden)
  // SEG-052: "Die Liste habe ich hier, alles aktuell"
  { feldCode: "M2", vorpigeschlagenerWert: "1", gespraechAbschnittId: "SEG-052", erfasstAm: TS },

  // M3: Medikamentenallergien → 0 (keine bekannt)
  // SEG-053: "Allergien hat er keine, also auf Medikamente nicht"
  { feldCode: "M3", vorpigeschlagenerWert: "0", gespraechAbschnittId: "SEG-053", erfasstAm: TS },

  // M4: Zuverlässigkeit der Einnahme → 1 (≥80% gewährleistet)
  // SEG-054: "Er nimmt sie meistens... manchmal vergisst er es"
  { feldCode: "M4", vorpigeschlagenerWert: "1", gespraechAbschnittId: "SEG-054", erfasstAm: TS },

  // ── N: Behandlungen und Prozeduren ────────────────────────────────────────
  // N1a: Chemotherapie → 0 (weder geplant noch durchgeführt)
  // SEG-055: no chemotherapy context
  { feldCode: "N1a", vorpigeschlagenerWert: "0", gespraechAbschnittId: "SEG-055", erfasstAm: TS },

  // N1k: Wundbehandlung → 0 (nicht durchgeführt)
  // SEG-056: "Die Narbe ist gut verheilt, keine offenen Stellen"
  { feldCode: "N1k", vorpigeschlagenerWert: "0", gespraechAbschnittId: "SEG-056", erfasstAm: TS },

  // N2b: Pflegefachperson → 1 (Ja — Spitex is being arranged)
  // SEG-057: "Deswegen sind wir ja heute da"
  { feldCode: "N2b", vorpigeschlagenerWert: "1", gespraechAbschnittId: "SEG-057", erfasstAm: TS },

  // N2e: Physiotherapie → 1 (Ja)
  // SEG-058: "Ja, er hat einmal die Woche Physio"
  { feldCode: "N2e", vorpigeschlagenerWert: "1", gespraechAbschnittId: "SEG-058", erfasstAm: TS },

  // N2eA: Physio — Anzahl Tage in letzten 7 Tagen (number field, value as string)
  // SEG-058: once a week
  { feldCode: "N2eA", vorpigeschlagenerWert: "1", gespraechAbschnittId: "SEG-058", erfasstAm: TS },

  // N2eB: Physio — Gesamtminuten in letzten 7 Tagen (number field)
  // SEG-058: typical session ~30 min
  { feldCode: "N2eB", vorpigeschlagenerWert: "30", gespraechAbschnittId: "SEG-058", erfasstAm: TS },

  // N4: Körperliche Fixierung → 0 (nein)
  // SEG-055: no restraints in home care context
  { feldCode: "N4", vorpigeschlagenerWert: "0", gespraechAbschnittId: "SEG-055", erfasstAm: TS },

  // ── R: Potenzial ──────────────────────────────────────────────────────────
  // R2: Signifikante Veränderung der Selbständigkeit → 2 (verschlechtert)
  // SEG-047: "Schlechter, klar. Vor dem Sturz bin ich noch selber einkaufen gegangen."
  { feldCode: "R2", vorpigeschlagenerWert: "2", gespraechAbschnittId: "SEG-047", erfasstAm: TS },
];
