/**
 * PDF-Export für abgeschlossene Arbeitskontrollen.
 */
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { BEURTEILUNGSBLOECKE } from "./kriterien";
import type { Arbeitskontrolle } from "./store";

const SKALA_LABELS: Record<number, string> = { 1: "1 (ungenügend)", 2: "2", 3: "3", 4: "4", 5: "5", 6: "6 (sehr gut)" };

export async function exportiereArbeitskontrollePDF(k: Arbeitskontrolle): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fs = 9;
  const lh = 13;
  const margin = 50;

  let page = pdfDoc.addPage([595, 842]);
  let y = 792;

  const write = (text: string, bold = false, size = fs) => {
    const f = bold ? fontBold : font;
    for (const line of text.split("\n")) {
      if (y < 50) { page = pdfDoc.addPage([595, 842]); y = 792; }
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
  write(`Datum der Kontrolle: ${new Date(k.kontrollDatum).toLocaleDateString("de-CH")}`);
  if (k.patientName) write(`Besuchter Patient: ${k.patientName}`);
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
      const wert = bew?.wert === null ? "n.b." : bew?.wert ? SKALA_LABELS[bew.wert] || String(bew.wert) : "—";
      write(`   ${krit.label}: ${wert}`);
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
  write(`Geschäftsleitung: ${k.meldungGL.erfolgt ? `Ja, am ${k.meldungGL.datum} ${k.meldungGL.uhrzeit}` : "Nein"}`);
  write(`Leitung Pflege: ${k.meldungLP.erfolgt ? `Ja, am ${k.meldungLP.datum} ${k.meldungLP.uhrzeit}` : "Nein"}`);

  // Unterschriften
  gap(12);
  write("Unterschriften:", true);
  for (const u of k.unterschriften) {
    const rolleLabel = u.rolle === "fallfuehrende" ? "Fallführende (Beurteilung)" : "Mitarbeiter:in (Kenntnisnahme)";
    write(`${rolleLabel}: ${u.name}, ${new Date(u.datum).toLocaleDateString("de-CH")}`);
  }

  // Hash
  if (k.integritaetsHash) {
    gap();
    write(`Integritäts-Hash: ${k.integritaetsHash}`, false, 7);
  }

  const bytes = await pdfDoc.save();
  return new Blob([bytes], { type: "application/pdf" });
}
