/**
 * Allergie- und Intoleranzkatalog — Auszug.
 *
 * Quelle:     CH AllergyIntolerance Value Set (CHAllergyIntoleranceValueSet)
 *             Implementation Guide ch.fhir.ig.ch-term
 * Version:    3.4.0
 * Gezogen am: 2026-09-04
 *
 * Auszug von 29 Eintraegen fuer den Prototypen. Der vollstaendige Katalog umfasst
 * mehrere hundert Codes und wird nachgezogen, sobald die SNOMED-CT-Lizenzfrage
 * geklaert ist.
 *
 * ACHTUNG — keine Eintraege ergaenzen oder Codes veraendern. Jeder Code stammt
 * eineindeutig aus dem Value Set. Fehlt eine Substanz, wird sie im Dialog als
 * Freitext erfasst (substanzCodiert = false), niemals als erfundener Code.
 *
 * Negationscodes ("Keine bekannte Allergie gegen …") gehoeren NICHT in diesen
 * Katalog. Sie bilden spaeter den Erhebungszustand `keine_bekannt` beim Export ab.
 *
 * `substanz` ist der Anzeigename im Suchergebnis und in der Liste.
 * `de` / `fr` / `it` sind die Katalogbegriffe aus dem Value Set; ueber alle drei
 * wird gesucht, damit eine franzoesischsprachige Erfassung dieselben Treffer liefert.
 */

export type AllergieKategorie = 'medication' | 'environment' | 'food' | 'biological';
export type AllergieArt = 'allergy' | 'intolerance';

export interface AllergieKatalogEintrag {
  /** SNOMED-CT-Code */
  code: string;
  /** Anzeigename, z.B. "Ibuprofen" */
  substanz: string;
  /** Katalogbegriff Deutsch (Schweiz) */
  de: string;
  /** Katalogbegriff Franzoesisch (Schweiz) */
  fr: string;
  /** Katalogbegriff Italienisch (Schweiz) */
  it: string;
  kategorie: AllergieKategorie;
  art: AllergieArt;
}

export const ALLERGIE_KATALOG_QUELLE = {
  valueSet: 'CHAllergyIntoleranceValueSet',
  paket: 'ch.fhir.ig.ch-term',
  version: '3.4.0',
  gezogenAm: '2026-09-04',
} as const;

export const ALLERGIE_KATALOG: readonly AllergieKatalogEintrag[] = [
  // --- Arzneimittel ---
  { code: '293619005', substanz: 'Ibuprofen', de: 'Allergie gegen Ibuprofen', fr: "allergie à l'ibuprofène", it: "allergia all’ibuprofene", kategorie: 'medication', art: 'allergy' },
  { code: '293584003', substanz: 'Paracetamol', de: 'Allergie gegen Paracetamol', fr: 'allergie au paracétamol', it: 'allergia al paracetamolo', kategorie: 'medication', art: 'allergy' },
  { code: '293613006', substanz: 'Diclofenac', de: 'Allergie gegen Diclofenac', fr: 'allergie au diclofénac', it: 'allergia al diclofenac', kategorie: 'medication', art: 'allergy' },
  { code: '293625009', substanz: 'Naproxen', de: 'Allergie gegen Naproxen', fr: 'allergie au naproxène', it: 'allergia al naproxene', kategorie: 'medication', art: 'allergy' },
  { code: '293601001', substanz: 'Morphin', de: 'Allergie gegen Morphin', fr: 'allergie à la morphine', it: 'allergia alla morfina', kategorie: 'medication', art: 'allergy' },
  { code: '293597001', substanz: 'Kodein', de: 'Allergie gegen Kodein', fr: 'allergie à la codéine', it: 'allergia alla codeina', kategorie: 'medication', art: 'allergy' },
  { code: '293655002', substanz: 'Omeprazol', de: 'Allergie gegen Omeprazol', fr: "allergie à l'oméprazole", it: "allergia all’omeprazolo", kategorie: 'medication', art: 'allergy' },
  { code: '11861000122107', substanz: 'Pantoprazol', de: 'Allergie gegen Pantoprazol', fr: 'allergie au pantoprazole', it: 'allergia al pantoprazolo', kategorie: 'medication', art: 'allergy' },
  { code: '13181000122107', substanz: 'Levofloxacin', de: 'Allergie gegen Levofloxacin', fr: 'allergie à la lévofloxacine', it: 'allergia alla levofloxacina', kategorie: 'medication', art: 'allergy' },
  { code: '13221000122100', substanz: 'Atorvastatin', de: 'Allergie gegen Atorvastatin', fr: "allergie à l'atorvastatine", it: "allergia all'atorvastatina", kategorie: 'medication', art: 'allergy' },
  { code: '293965006', substanz: 'Atenolol', de: 'Allergie gegen Atenolol', fr: "allergie à l'aténolol", it: "allergia all’atenololo", kategorie: 'medication', art: 'allergy' },
  { code: '294002003', substanz: 'Amlodipin', de: 'Allergie gegen Amlodipin', fr: "allergie à l'amlodipine", it: "allergia all’amlodipina", kategorie: 'medication', art: 'allergy' },
  { code: '293867002', substanz: 'Carbamazepin', de: 'Allergie gegen Carbamazepin', fr: 'allergie à la carbamazépine', it: 'allergia alla carbamazepina', kategorie: 'medication', art: 'allergy' },
  { code: '293902006', substanz: 'Diazepam', de: 'Allergie gegen Diazepam', fr: 'allergie au diazépam', it: 'allergia al diazepam', kategorie: 'medication', art: 'allergy' },
  { code: '293903001', substanz: 'Lorazepam', de: 'Allergie gegen Lorazepam', fr: 'allergie au lorazépam', it: 'allergia al lorazepam', kategorie: 'medication', art: 'allergy' },
  { code: '293722000', substanz: 'Lidocain', de: 'Allergie gegen Lidocain', fr: 'allergie à la lidocaïne', it: 'allergia alla lidocaina', kategorie: 'medication', art: 'allergy' },
  { code: '293771005', substanz: 'Methotrexat', de: 'Allergie gegen Methotrexat', fr: 'allergie au méthotrexate', it: 'allergia al metotrexato', kategorie: 'medication', art: 'allergy' },
  { code: '293850009', substanz: 'Fluoxetin', de: 'Allergie gegen Fluoxetin', fr: 'allergie à la fluoxétine', it: 'allergia alla fluoxetina', kategorie: 'medication', art: 'allergy' },
  { code: '293924006', substanz: 'Haloperidol', de: 'Allergie gegen Haloperidol', fr: "allergie à l'halopéridol", it: "allergia all’aloperidolo", kategorie: 'medication', art: 'allergy' },
  { code: '293993005', substanz: 'Nikotin', de: 'Allergie gegen Nikotin', fr: 'allergie à la nicotine', it: 'allergia alla nicotina', kategorie: 'medication', art: 'allergy' },

  // --- Umwelt ---
  { code: '232350006', substanz: 'Hausstaubmilbenprotein', de: 'Allergie gegen Hausstaubmilbenprotein', fr: 'allergie aux acariens', it: 'allergia alle proteine degli acari della polvere', kategorie: 'environment', art: 'allergy' },
  { code: '232349006', substanz: 'Hausstaub', de: 'Allergie gegen Hausstaubmilben', fr: 'allergie à la poussière de maison', it: 'allergia alla polvere', kategorie: 'environment', art: 'allergy' },
  { code: '151201000119107', substanz: 'Insektengift', de: 'Allergie gegen Insektengift', fr: "allergie au venin d'insectes", it: 'allergia al veleno di insetti', kategorie: 'environment', art: 'allergy' },

  // --- Nahrungsmittel ---
  { code: '213020009', substanz: 'Eiprotein', de: 'Allergie gegen Eiprotein', fr: "allergie aux protéines de l'œuf", it: "allergia alle proteine dell'uovo", kategorie: 'food', art: 'allergy' },
  { code: '21191000122102', substanz: 'Senfgewürz', de: 'Allergie gegen Senfgewürz', fr: 'allergie à la moutarde', it: 'allergia alla senape', kategorie: 'food', art: 'allergy' },
  { code: '23181000122104', substanz: 'Mangofrucht', de: 'Allergie gegen Mangofrucht', fr: 'allergie à la mangue', it: 'allergia al mango', kategorie: 'food', art: 'allergy' },
  { code: '13511000122108', substanz: 'Ananas', de: 'Allergie gegen Ananas', fr: "allergie à l'ananas", it: "allergia all'ananas", kategorie: 'food', art: 'allergy' },
  { code: '20052008', substanz: 'Fruktose', de: 'Fructose-1,6-Bisphosphat-Aldolase-B-Mangel', fr: 'intolérance héréditaire au fructose', it: 'deficit di fruttosio-1,6-bisfosfato aldolasi B', kategorie: 'food', art: 'intolerance' },
  { code: '190749000', substanz: 'Glukose und Galaktose', de: 'Glukose-Galaktose-Malabsorption', fr: 'malabsorption du glucose-galactose', it: 'malassorbimento di glucosio-galattosio', kategorie: 'food', art: 'intolerance' },
];