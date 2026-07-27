/**
 * SEM Meldeformular Erwerbstätigkeit — PDF-Vorbefüllung.
 *
 * Füllt das offizielle PDF des Staatssekretariats für Migration (SEM)
 * mit den im Onboarding erfassten Daten. Das PDF wird NICHT nachgebaut,
 * sondern über seine AcroForm-Felder befüllt.
 *
 * Quelle: https://www.sem.admin.ch/dam/sem/de/data/arbeit/asylbereich/meldeformular-erwerbstaetigkeit-d.pdf
 *
 * ══════════════════════════════════════════
 * FELD-MAPPING (AcroForm-Feldnamen → Datenquellen)
 * ══════════════════════════════════════════
 *
 * SEKTION A – Arbeitnehmer/in
 *   Noms                  → name (Nachname)
 *   Prénoms               → vorname
 *   Geburtsdatum          → geburtsdatum
 *   Group3                → geschlecht (Radio: /Mann oder /Frau)
 *   Nationalité           → nationalitaet
 *   NrSymic               → zemisNummer
 *   Rue                   → strasse
 *   NPALocalité           → plz + ort
 *   Numéro de téléphone   → telefon
 *   Courriel1             → email
 *
 * SEKTION B – Arbeitgeber/in
 *   Organisme             → Spitex Kaufmann AG (Stammdaten)
 *   NomB                  → "Sandra Weber" (Kontaktperson)
 *   RueB                  → Firmenadresse
 *   NPALocaliteB          → Firma PLZ + Ort
 *   NuméroIDEB            → UID (leer wenn unbekannt)
 *   Tel2                  → Firma Telefon
 *   Courriel2             → Firma E-Mail
 *
 * SEKTION C – Angaben zur Erwerbstätigkeit
 *   ChkBxStartTaetigkeit  → Checkbox "Aufnahme" ankreuzen
 *   GroupStartTaetigkeit   → Radio "/Unselbstaedige" (unselbstständig)
 *   DtStartTaetigkeit     → eintrittsdatum
 *   ActiviteExercee       → funktion
 *   BrancheEconomique     → "Gesundheits- und Sozialwesen"
 *   Beschaeftigunsgrad    → Pensum (abgeleitet)
 *   Stunden               → Wochenstunden
 *   Bruttolohn            → stundenlohn
 *   Group4                → Lohnart Radio (/Stunde)
 *   cbxVille              → Kanton (Dropdown)
 *   Lieu                  → Arbeitsort
 */

import { PDFDocument } from "pdf-lib";

/* ══════════════════════════════════════════
   TYPEN
   ══════════════════════════════════════════ */

export interface SEMFormDaten {
  /* A – Arbeitnehmer/in */
  name: string;
  vorname: string;
  geburtsdatum: string;
  geschlecht: string;
  nationalitaet: string;
  zemisNummer: string;
  strasse: string;
  plz: string;
  ort: string;
  telefon: string;
  email: string;
  /* B – Arbeitgeber (aus Organisations-Stammdaten) */
  firmaName?: string;
  firmaStrasse?: string;
  firmaPlzOrt?: string;
  firmaUid?: string;
  firmaKontaktperson?: string;
  firmaTelefon?: string;
  firmaEmail?: string;
  /* C – Erwerbstätigkeit */
  eintrittsdatum: string;
  funktion: string;
  beschaeftigungsgrad: string;
  wochenstunden: string;
  bruttolohn: string;
  lohnart: string; // "stundenlohn" | "monatslohn"
  arbeitsortKanton: string;
  arbeitsortOrt: string;
}

/** Organisations-Stammdaten (statisch, Spitex Kaufmann AG) */
const FIRMA_DEFAULTS: Pick<SEMFormDaten, "firmaName" | "firmaStrasse" | "firmaPlzOrt" | "firmaUid" | "firmaKontaktperson" | "firmaTelefon" | "firmaEmail"> = {
  firmaName: "Spitex Kaufmann AG",
  firmaStrasse: "Musterstrasse 10",
  firmaPlzOrt: "8001 Zürich",
  firmaUid: "", // UID noch unbekannt
  firmaKontaktperson: "Sandra Weber",
  firmaTelefon: "+41 44 123 45 67",
  firmaEmail: "personal@spitex-kaufmann.ch",
};

/* ══════════════════════════════════════════
   FEHLENDE FELDER ERMITTELN
   ══════════════════════════════════════════ */

export interface FehlendesFeld {
  feld: string;
  label: string;
}

/** Prüft welche Felder nicht befüllt werden können */
export function ermittleFehlendeFelderSEM(daten: SEMFormDaten): FehlendesFeld[] {
  const fehlend: FehlendesFeld[] = [];
  const check = (wert: string | undefined, feld: string, label: string) => {
    if (!wert || wert.trim().length === 0) fehlend.push({ feld, label });
  };
  check(daten.zemisNummer, "zemisNummer", "ZEMIS-Nr.");
  check(daten.firmaUid ?? FIRMA_DEFAULTS.firmaUid, "firmaUid", "UID (Unternehmens-Identifikationsnummer)");
  check(daten.geburtsdatum, "geburtsdatum", "Geburtsdatum");
  check(daten.strasse, "strasse", "Strasse");
  check(daten.plz, "plz", "PLZ");
  check(daten.ort, "ort", "Ort");
  check(daten.eintrittsdatum, "eintrittsdatum", "Stellenantritt");
  check(daten.beschaeftigungsgrad, "beschaeftigungsgrad", "Beschäftigungsgrad");
  check(daten.wochenstunden, "wochenstunden", "Wochenstunden");
  check(daten.bruttolohn, "bruttolohn", "Bruttolohn");
  return fehlend;
}

/* ══════════════════════════════════════════
   PDF BEFÜLLEN + DOWNLOAD
   ══════════════════════════════════════════ */

/** Befüllt das offizielle SEM-Formular und gibt es als Blob zurück */
export async function erstelleSEMFormular(daten: SEMFormDaten): Promise<Blob> {
  // PDF laden
  const pdfUrl = "/forms/sem-meldeformular-erwerbstaetigkeit.pdf";
  const existingPdfBytes = await fetch(pdfUrl).then(r => r.arrayBuffer());
  const pdfDoc = await PDFDocument.load(existingPdfBytes);

  const form = pdfDoc.getForm();

  // Hilfsfunktionen
  const setText = (fieldName: string, value: string | undefined) => {
    if (!value || value.trim().length === 0) return;
    try { form.getTextField(fieldName).setText(value.trim()); } catch { /* Feld existiert nicht */ }
  };

  const setCheckbox = (fieldName: string, checked: boolean) => {
    try {
      const cb = form.getCheckBox(fieldName);
      if (checked) cb.check(); else cb.uncheck();
    } catch { /* Feld existiert nicht */ }
  };

  const setRadio = (fieldName: string, value: string) => {
    try { form.getRadioGroup(fieldName).select(value); } catch { /* Feld existiert nicht */ }
  };

  const setDropdown = (fieldName: string, value: string) => {
    try { form.getDropdown(fieldName).select(value); } catch { /* Feld existiert nicht */ }
  };

  const firma = { ...FIRMA_DEFAULTS, ...Object.fromEntries(Object.entries(daten).filter(([k]) => k.startsWith("firma"))) };

  // ── Sektion A: Arbeitnehmer/in ──
  setText("Noms", daten.name);
  setText("Prénoms", daten.vorname);
  setText("Geburtsdatum", daten.geburtsdatum);
  setText("Nationalité", daten.nationalitaet);
  setText("NrSymic", daten.zemisNummer);
  setText("Rue", daten.strasse);
  setText("NPALocalité", [daten.plz, daten.ort].filter(Boolean).join(" "));
  setText("Numéro de téléphone", daten.telefon);
  setText("Courriel1", daten.email);

  // Geschlecht: Radio Group3 mit /Mann oder /Frau
  if (daten.geschlecht === "maennlich") setRadio("Group3", "Mann");
  else if (daten.geschlecht === "weiblich") setRadio("Group3", "Frau");

  // ── Sektion B: Arbeitgeber/in ──
  setText("Organisme", firma.firmaName);
  setText("NomB", firma.firmaKontaktperson);
  setText("RueB", firma.firmaStrasse);
  setText("NPALocaliteB", firma.firmaPlzOrt);
  setText("NuméroIDEB", firma.firmaUid);
  setText("Tel2", firma.firmaTelefon);
  setText("Courriel2", firma.firmaEmail);

  // ── Sektion C: Erwerbstätigkeit ──
  // "Aufnahme einer Erwerbstätigkeit" ankreuzen
  setCheckbox("ChkBxStartTaetigkeit", true);
  // "Unselbständige Tätigkeit" vorwählen
  setRadio("GroupStartTaetigkeit", "Unselbstaedige");

  setText("DtStartTaetigkeit", daten.eintrittsdatum);
  setText("ActiviteExercee", daten.funktion);
  setText("BrancheEconomique", "Gesundheits- und Sozialwesen");
  setText("Beschaeftigunsgrad", daten.beschaeftigungsgrad ? `${daten.beschaeftigungsgrad}%` : "");
  setText("Stunden", daten.wochenstunden);
  setText("Bruttolohn", daten.bruttolohn ? `CHF ${daten.bruttolohn}` : "");

  // Lohnart: Group4 Radio
  if (daten.lohnart === "stundenlohn") setRadio("Group4", "Stunde");
  else if (daten.lohnart === "monatslohn") setRadio("Group4", "Monat");

  // Kanton-Dropdown
  if (daten.arbeitsortKanton) {
    setDropdown("cbxVille", daten.arbeitsortKanton);
  }
  setText("Lieu", daten.arbeitsortOrt);

  // Formular bleibt editierbar (NICHT flatten)
  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: "application/pdf" });
}

/** Auslösen des Browser-Downloads */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ══════════════════════════════════════════
   KONVERTIERUNG: FormData → SEMFormDaten
   ══════════════════════════════════════════ */

/** Wandelt AngehoerigerFormData in SEMFormDaten um */
export function formDataToSEM(data: {
  name: string;
  vorname: string;
  geburtsdatum: string;
  geschlecht: string;
  nationalitaet: string;
  zemisNummer: string;
  strasse: string;
  plz: string;
  ort: string;
  telefon: string;
  email: string;
  eintrittsdatum: string;
  funktion: string;
  stundenlohn: string;
  lohnart: string;
}): SEMFormDaten {
  return {
    name: data.name,
    vorname: data.vorname,
    geburtsdatum: data.geburtsdatum,
    geschlecht: data.geschlecht,
    nationalitaet: data.nationalitaet,
    zemisNummer: data.zemisNummer,
    strasse: data.strasse,
    plz: data.plz,
    ort: data.ort,
    telefon: data.telefon,
    email: data.email,
    eintrittsdatum: data.eintrittsdatum,
    funktion: data.funktion || "Pflegende/r Angehörige/r",
    beschaeftigungsgrad: "", // Wird im UI ggf. berechnet
    wochenstunden: "",
    bruttolohn: data.stundenlohn,
    lohnart: data.lohnart || "stundenlohn",
    arbeitsortKanton: "Zürich",
    arbeitsortOrt: "Zürich",
  };
}
