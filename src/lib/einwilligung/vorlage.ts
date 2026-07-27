/**
 * Einwilligungserklärung — Vorlagentext und Datenstruktur.
 *
 * HINWEIS: Dieser Wortlaut ist ein fachlicher Entwurf und wurde NICHT
 * rechtlich geprüft. Er muss als solcher gekennzeichnet bleiben — sowohl
 * in der Anwendung als auch in jedem erzeugten PDF.
 *
 * Der Text ist leicht austauschbar: alle dynamischen Teile kommen aus
 * Funktionsparametern, der statische Wortlaut steht an EINER Stelle.
 */

export const RECHTLICHER_HINWEIS = "Dieser Wortlaut ist ein fachlicher Entwurf und wurde nicht rechtlich geprüft. Vor produktivem Einsatz ist eine juristische Überprüfung erforderlich.";

export interface EinwilligungDaten {
  patientName: string;
  patientGeburtsdatum: string;
  organisationName: string;
  organisationAdresse: string;
  organisationAnsprechperson: string;
}

/** Organisations-Stammdaten (zentral, analog zu SEM-Formular) */
export const ORG_STAMMDATEN = {
  name: "Spitex Kaufmann AG",
  adresse: "Musterstrasse 10, 8001 Zürich",
  ansprechperson: "Sandra Weber",
};

export type UnterzeichnerTyp = "patient" | "vertretung";
export type VertretungsGrundlage = "vorsorgeauftrag" | "beistandschaft" | "vollmacht" | "andere";

export interface UnterzeichnerInfo {
  typ: UnterzeichnerTyp;
  name: string;
  /** Bei Vertretung: auf welcher Grundlage */
  vertretungsGrundlage?: VertretungsGrundlage;
  vertretungsGrundlageAndere?: string;
  /** Ist die unterzeichnende Person zugleich der angestellte Angehörige? */
  istAngestellterAngehoeriger: boolean;
}

/**
 * Erzeugt den vollständigen Text der Einwilligungserklärung.
 * Dynamische Teile kommen aus den Parametern, nicht aus dem Template.
 */
export function erzeugeEinwilligungstext(daten: EinwilligungDaten): string {
  return `EINWILLIGUNGSERKLÄRUNG
Entbindung vom Berufsgeheimnis

Patient/in: ${daten.patientName}
Geburtsdatum: ${daten.patientGeburtsdatum}

Pflegeorganisation: ${daten.organisationName}
${daten.organisationAdresse}
Ansprechperson: ${daten.organisationAnsprechperson}

Ich ermächtige die behandelnden Ärztinnen und Ärzte, Spitäler und weiteren Leistungserbringer, der oben genannten Pflegeorganisation Auskunft über meinen Gesundheitszustand zu erteilen und die nachfolgend genannten Informationen weiterzugeben.

Zweck der Datenübermittlung:
- Pflegebedarfsabklärung
- Pflegeplanung
- Koordination der Behandlung

Umfang der zu übermittelnden Daten:
- Ärztliche Diagnosen
- Aktuelle Medikation
- Ärztliche Berichte und Verlaufsberichte
- Verordnungen für Pflegeleistungen (KLV)

Die Pflegeorganisation verpflichtet sich, die erhaltenen Daten ausschliesslich für die oben genannten Zwecke zu verwenden und die Vorgaben des Datenschutzgesetzes (DSG) einzuhalten.

Diese Einwilligung kann jederzeit mit Wirkung für die Zukunft schriftlich widerrufen werden. Der Widerruf ist zu richten an: ${daten.organisationName}, ${daten.organisationAdresse}.

Ein Widerruf berührt die Rechtmässigkeit der bis dahin auf Grundlage der Einwilligung erfolgten Datenübermittlung nicht.`;
}
