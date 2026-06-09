/**
 * NANDA/ENP Katalog — Prototyp-Auswahl für Pflegeplanung.
 * Curated subset für die häufigsten Spitex-Diagnosen.
 */

export interface NandaDiagnoseOption {
  nandaCode: string;
  titel: string;
  domäne: string;
  massnahmenVorschlaege: { titel: string; beschreibung: string; haeufigkeit: string }[];
  zieleVorschlaege: { titel: string; zeithorizont: string; messbar: string }[];
}

export const NANDA_KATALOG: NandaDiagnoseOption[] = [
  // Mobilität & Sturz
  {
    nandaCode: "00085", titel: "Beeinträchtigte körperliche Mobilität", domäne: "Aktivität/Ruhe",
    massnahmenVorschlaege: [
      { titel: "Mobilisationsförderung nach ENP", beschreibung: "Gehübungen mit Hilfsmitteln, Steigerung der Gehstrecke.", haeufigkeit: "2×/Tag" },
      { titel: "Sturzprophylaxe-Assessment", beschreibung: "Wohnungsbegehung, Haltegriffe, Beleuchtung, rutschfeste Matten.", haeufigkeit: "einmalig" },
      { titel: "Transfer-Training", beschreibung: "Sicheres Aufstehen, Hinsetzen, Umsetzen üben.", haeufigkeit: "täglich" },
    ],
    zieleVorschlaege: [
      { titel: "Gehstrecke steigern", zeithorizont: "6 Wochen", messbar: "Gehstrecke ≥ 200m ohne Pause" },
      { titel: "Sturzfreiheit", zeithorizont: "3 Monate", messbar: "Kein Sturz im Erfassungszeitraum" },
    ],
  },
  {
    nandaCode: "00155", titel: "Sturzgefahr", domäne: "Sicherheit/Schutz",
    massnahmenVorschlaege: [
      { titel: "Sturzprophylaxe-Beratung", beschreibung: "Sturzrisiken besprechen, Haltegriffe und Hilfsmittel empfehlen.", haeufigkeit: "bei Bedarf" },
      { titel: "Wohnraum-Anpassung", beschreibung: "Ergotherapeutische Abklärung, Schwellen entfernen, Beleuchtung.", haeufigkeit: "einmalig" },
      { titel: "Gleichgewichtstraining", beschreibung: "Balanceübungen im Stehen, Einbeinstand, Gewichtsverlagerung.", haeufigkeit: "3×/Woche" },
    ],
    zieleVorschlaege: [
      { titel: "Sturzfreiheit 3 Monate", zeithorizont: "3 Monate", messbar: "Kein Sturz bis Re-Assessment" },
      { titel: "Sicherer Gebrauch von Hilfsmitteln", zeithorizont: "2 Wochen", messbar: "Rollator korrekt eingesetzt bei jeder Mobilisation" },
    ],
  },

  // Schmerz
  {
    nandaCode: "00132", titel: "Akuter Schmerz", domäne: "Komfort",
    massnahmenVorschlaege: [
      { titel: "Schmerzmanagement nach ENP", beschreibung: "Schmerzerfassung VAS, Analgetika-Gabe nach Verordnung.", haeufigkeit: "täglich" },
      { titel: "Wärme-/Kälteapplikation", beschreibung: "Wärmekissen oder Coolpack auf betroffene Region, 20 Min.", haeufigkeit: "2×/Tag" },
      { titel: "Lagerung schmerzreduzierend", beschreibung: "Positionierung mit Kissen/Lagerungshilfen zur Entlastung.", haeufigkeit: "bei Bedarf" },
    ],
    zieleVorschlaege: [
      { titel: "Schmerzreduktion unter VAS 3", zeithorizont: "4 Wochen", messbar: "VAS ≤ 3 in Ruhe an 5/7 Tagen" },
      { titel: "Schmerzfreie Mobilisation", zeithorizont: "6 Wochen", messbar: "VAS ≤ 4 bei Alltagsaktivitäten" },
    ],
  },
  {
    nandaCode: "00133", titel: "Chronischer Schmerz", domäne: "Komfort",
    massnahmenVorschlaege: [
      { titel: "Schmerztagebuch führen", beschreibung: "Tägliche Dokumentation von Schmerzintensität, Lokalisation und Auslöser.", haeufigkeit: "täglich" },
      { titel: "Nicht-medikamentöse Schmerztherapie", beschreibung: "Entspannungstechniken, Ablenkung, Atemübungen.", haeufigkeit: "2×/Tag" },
    ],
    zieleVorschlaege: [
      { titel: "Schmerzbewältigung verbessern", zeithorizont: "8 Wochen", messbar: "Patient kennt 3 Bewältigungsstrategien und wendet sie an" },
    ],
  },

  // Selbstpflege
  {
    nandaCode: "00108", titel: "Selbstpflegedefizit Körperpflege", domäne: "Aktivität/Ruhe",
    massnahmenVorschlaege: [
      { titel: "Unterstützung Körperpflege", beschreibung: "Teilwäsche am Lavabo, Übernahme untere Körperhälfte, Eigenaktivität fördern.", haeufigkeit: "täglich" },
      { titel: "Anleitung Hilfsmittel-Einsatz", beschreibung: "Langer Schwamm, Duschhocker, Haltegriffe instruieren.", haeufigkeit: "bei Bedarf" },
    ],
    zieleVorschlaege: [
      { titel: "Selbstständige Oberkörperpflege", zeithorizont: "3 Monate", messbar: "Oberkörper-Wäsche ohne Hilfe an 7/7 Tagen" },
    ],
  },
  {
    nandaCode: "00109", titel: "Selbstpflegedefizit Kleiden", domäne: "Aktivität/Ruhe",
    massnahmenVorschlaege: [
      { titel: "Anleitung An-/Auskleiden", beschreibung: "Energiesparende Techniken, Sitzen beim Ankleiden, Anziehhilfe für Strümpfe.", haeufigkeit: "täglich" },
      { titel: "Kleidungsanpassung beraten", beschreibung: "Empfehlung für Kleidung mit Klettverschluss, weite Schnitte.", haeufigkeit: "einmalig" },
    ],
    zieleVorschlaege: [
      { titel: "Selbstständiges Ankleiden Oberkörper", zeithorizont: "6 Wochen", messbar: "Oberkörper an-/auskleiden ohne Hilfe" },
    ],
  },

  // Psyche & Stimmung
  {
    nandaCode: "00095", titel: "Schlafstörung", domäne: "Aktivität/Ruhe",
    massnahmenVorschlaege: [
      { titel: "Schlafhygiene-Beratung", beschreibung: "Schlafrituale, kein Bildschirm vor dem Schlafen, regelmässige Zeiten.", haeufigkeit: "wöchentlich" },
      { titel: "Entspannungsübungen abends", beschreibung: "Progressive Muskelrelaxation, Atemübungen vor dem Einschlafen.", haeufigkeit: "täglich" },
    ],
    zieleVorschlaege: [
      { titel: "Schlafqualität verbessern", zeithorizont: "6 Wochen", messbar: "Einschlafdauer < 30 Min. an 5/7 Nächten" },
    ],
  },
  {
    nandaCode: "00241", titel: "Beeinträchtigte Stimmungsregulation", domäne: "Coping/Stresstoleranz",
    massnahmenVorschlaege: [
      { titel: "Aktivierung und Tagesstruktur", beschreibung: "Soziale Kontakte fördern, Tagesrhythmus strukturieren.", haeufigkeit: "wöchentlich" },
      { titel: "Gesprächsangebot", beschreibung: "Regelmässiges Bezugspersonen-Gespräch, aktives Zuhören, Ressourcen stärken.", haeufigkeit: "wöchentlich" },
      { titel: "Ressourcenförderung", beschreibung: "Frühere Hobbys reaktivieren, kleine erreichbare Tagesziele setzen.", haeufigkeit: "bei Bedarf" },
    ],
    zieleVorschlaege: [
      { titel: "Soziale Teilhabe", zeithorizont: "2 Monate", messbar: "1×/Woche soziale Aktivität ausserhalb der Wohnung" },
      { titel: "Stimmung stabilisieren", zeithorizont: "3 Monate", messbar: "PHQ-2 Score ≤ 2 beim Re-Assessment" },
    ],
  },

  // Gesundheitsmanagement
  {
    nandaCode: "00078", titel: "Ineffektives Gesundheitsmanagement", domäne: "Gesundheitsförderung",
    massnahmenVorschlaege: [
      { titel: "Blutdruck-Monitoring und Schulung", beschreibung: "Tägliche BD-Messung, Dokumentation, Beratung Salz-Reduktion.", haeufigkeit: "täglich" },
      { titel: "Medikamenten-Management", beschreibung: "Wochendispenser richten, Einnahme-Kontrolle, Wechselwirkungen erklären.", haeufigkeit: "wöchentlich" },
      { titel: "Ernährungsberatung", beschreibung: "Beratung zu herzgesunder Ernährung, Trinkmenge, Kalium-Zufuhr.", haeufigkeit: "einmalig" },
    ],
    zieleVorschlaege: [
      { titel: "BD stabil unter 140/90", zeithorizont: "8 Wochen", messbar: "BD < 140/90 mmHg an 5/7 Messtagen" },
      { titel: "Selbstständige Medikamenteneinnahme", zeithorizont: "4 Wochen", messbar: "Keine vergessene Einnahme über 7 Tage" },
    ],
  },

  // Ernährung
  {
    nandaCode: "00002", titel: "Unausgewogene Ernährung: weniger als Körperbedarf", domäne: "Ernährung",
    massnahmenVorschlaege: [
      { titel: "Ernährungsprotokoll", beschreibung: "Tägliche Dokumentation der Nahrungsaufnahme und Trinkmenge.", haeufigkeit: "täglich" },
      { titel: "Mahlzeiten-Unterstützung", beschreibung: "Essensvorbereitung, mundgerechte Zubereitung, Essbegleitung.", haeufigkeit: "3×/Tag" },
    ],
    zieleVorschlaege: [
      { titel: "Gewichtsstabilisierung", zeithorizont: "4 Wochen", messbar: "Gewichtsverlust < 1% in 4 Wochen" },
    ],
  },

  // Haut
  {
    nandaCode: "00046", titel: "Beeinträchtigte Hautintegrität", domäne: "Sicherheit/Schutz",
    massnahmenVorschlaege: [
      { titel: "Wundversorgung nach Verordnung", beschreibung: "Regelmässiger Verbandswechsel, Wunddokumentation mit Fotodoku.", haeufigkeit: "nach Verordnung" },
      { titel: "Dekubitusprophylaxe", beschreibung: "Lagerungsprotokoll, Druckentlastung, Hautpflege.", haeufigkeit: "alle 2 Stunden" },
    ],
    zieleVorschlaege: [
      { titel: "Wundheilung", zeithorizont: "6 Wochen", messbar: "Wundfläche um 50% reduziert" },
    ],
  },

  // Kontinenz
  {
    nandaCode: "00020", titel: "Funktionelle Harninkontinenz", domäne: "Elimination",
    massnahmenVorschlaege: [
      { titel: "Toilettentraining", beschreibung: "Feste Toilettenzeiten, Begleitung, Erinnerung.", haeufigkeit: "alle 2 Stunden" },
      { titel: "Inkontinenz-Versorgung", beschreibung: "Passende Einlagen, Hautpflege, Intimhygiene.", haeufigkeit: "bei Bedarf" },
    ],
    zieleVorschlaege: [
      { titel: "Reduktion Inkontinenz-Episoden", zeithorizont: "4 Wochen", messbar: "Max. 1 Inkontinenz-Episode pro Tag" },
    ],
  },
];
