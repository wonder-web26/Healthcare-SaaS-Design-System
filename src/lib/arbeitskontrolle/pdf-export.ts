/**
 * PDF-Export für Arbeitskontrollen.
 *
 * Ist die Kontrolle nicht abgeschlossen, trägt jede Seite eine deutlich
 * sichtbare Entwurfskennzeichnung, die keinen Inhalt verdeckt.
 */
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { BEURTEILUNGSBLOECKE } from "./kriterien";
import type { Arbeitskontrolle } from "./store";
import { getOrgEinstellungen } from "../stammdaten/org-einstellungen";
import { formatAnzeige, isoZuAnzeige } from "../datum";

// Vollständige Skalen-Beschriftung gemäss Vorlage V1.
const SKALA_LABELS: Record<number, string> = {
  1: "1 (ungenügend)",
  2: "2 (genügend)",
  3: "3 (genügend bis gut)",
  4: "4 (gut)",
  5: "5 (gut bis sehr gut)",
  6: "6 (sehr gut)",
};

export async function exportiereArbeitskontrollePDF(k: Arbeitskontrolle): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fs = 9;
  const lh = 13;
  const margin = 50;

  const istEntwurf = k.status !== "abgeschlossen";

  // Entwurfskennzeichnung: roter Rahmen (im Seitenrand) + Text im oberen
  // Rand, oberhalb des Inhalts (y=792). Verdeckt keinen Inhalt.
  const zeichneEntwurf = (p: import("pdf-lib").PDFPage) => {
    if (!istEntwurf) return;
    const label = "ENTWURF - NICHT ABGESCHLOSSEN";
    const size = 11;
    const w = fontBold.widthOfTextAtSize(label, size);
    p.drawRectangle({
      x: 16, y: 16, width: 595 - 32, height: 842 - 32,
      borderColor: rgb(0.75, 0.1, 0.1), borderWidth: 1.5, opacity: 0,
    });
    p.drawText(label, { x: (595 - w) / 2, y: 818, font: fontBold, size, color: rgb(0.75, 0.1, 0.1) });
  };

  let page = pdfDoc.addPage([595, 842]);
  zeichneEntwurf(page);
  let y = 792;

  const write = (text: string, bold = false, size = fs) => {
    const f = bold ? fontBold : font;
    for (const line of text.split("\n")) {
      if (y < 50) { page = pdfDoc.addPage([595, 842]); zeichneEntwurf(page); y = 792; }
      page.drawText(line, { x: margin, y, font: f, size, color: rgb(0.1, 0.1, 0.1) });
      y -= lh;
    }
  };

  const gap = (n = 8) => { y -= n; };

  // Titel
  write("ARBEITSKONTROLLE", true, 14);
  if (k.art === "ausserordentlich") { write("(Ausserordentlich)", false, 10); }
  gap(12);

  // Kopfbereich
  write(`Mitarbeiter:in: ${k.angehoerigerName}`, true);
  write(`Fallführende / Beurteilende: ${k.fallfuehrendeName}`);
  write(`Datum der Kontrolle: ${isoZuAnzeige(k.kontrollDatum)}`);
  if (k.patientName) write(`Besuchter Patient: ${k.patientName}`);
  // Geltendes Kontrollintervall (bei Abschluss festgehalten; im Entwurf die
  // aktuelle Vorgabe). Ausdrücklich als organisationsinterne Regel gekennzeichnet.
  const intervall = k.kontrollintervallMonate ?? getOrgEinstellungen().arbeitskontrolleTurnusMonate;
  write(`Kontrollintervall: alle ${intervall} Monate (organisationsinterne Vorgabe, nicht gesetzlich)`);
  gap();

  // Zielsatz
  write("Ziel: Die Qualität der Arbeitsweise samt Einhaltung der fachlichen Instruktionen");
  write("überprüfen, Verbesserungen finden und die Qualität erhöhen.");
  gap();

  // Bewertungsblöcke
  for (let bi = 0; bi < BEURTEILUNGSBLOECKE.length; bi++) {
    const blockDef = BEURTEILUNGSBLOECKE[bi];
    const blockData = k.bloecke[bi];
    write(`${bi + 1}. ${blockDef.frage}`, true);
    for (const krit of blockDef.kriterien) {
      const bew = blockData?.bewertungen.find(b => b.code === krit.code);
      const w = bew?.wert;
      // Dreiteilung: bewertet / bewusst nicht beurteilbar / gar nicht erfasst.
      const wertText =
        w === "nicht_beurteilbar" ? "Nicht beurteilbar" :
        typeof w === "number" ? (SKALA_LABELS[w] ?? String(w)) :
        "Nicht erfasst";
      write(`   ${krit.label}: ${wertText}`);
    }
    if (blockData?.anmerkung) {
      write(`   Anmerkung: ${blockData.anmerkung}`);
    }
    gap(4);
  }

  // Freitext
  if (k.verbesserungen) {
    gap();
    write("Verbesserungen und Vorschläge:", true);
    write(k.verbesserungen);
  }

  // Meldeblock
  gap();
  write("Meldungen:", true);
  write(`Geschäftsleitung: ${k.meldungGL.erfolgt ? `Ja, am ${isoZuAnzeige(k.meldungGL.datum)} um ${k.meldungGL.uhrzeit} Uhr` : "Nein"}`);
  write(`Leitung Pflege: ${k.meldungLP.erfolgt ? `Ja, am ${isoZuAnzeige(k.meldungLP.datum)} um ${k.meldungLP.uhrzeit} Uhr` : "Nein"}`);

  // Unterschriften — je Unterschrift der bestätigte Wortlaut darunter.
  gap(12);
  write("Unterschriften:", true);
  for (const u of k.unterschriften) {
    const rolleLabel = u.rolle === "fallfuehrende" ? "Fallführende (Beurteilung)" : "Mitarbeiter:in (Kenntnisnahme)";
    write(`${rolleLabel}: ${u.name}, ${formatAnzeige(new Date(u.datum))}`);
    write(`   ${u.bestaetigungstext}`, false, 8);
    gap(3);
  }

  const bytes = await pdfDoc.save();
  return new Blob([bytes], { type: "application/pdf" });
}
