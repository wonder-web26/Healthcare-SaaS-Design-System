/**
 * PDF-Export für den Initialschulungs-Nachweis.
 *
 * Baut über den geteilten PdfBuilder: Kopf, Metadaten, Bestätigungssatz, die
 * dem Patienten zugeordneten Leistungspositionen samt Ausführungsschritten und
 * eine einzelne Unterschrift (gezeichnetes Signaturbild) am Schluss.
 */
import { PdfBuilder, type MetaField } from "../pdf/builder";
import { formatDatumZeit, formatAnzeige, isoZuDate } from "../datum";
import type { Schulungsnachweis } from "./nachweis-store";

const ORG_NAME = "Spitex Kaufmann AG";

const BESTAETIGUNG =
  "Die pflegende Angehörige bestätigt mit ihrer Unterschrift, dass sie in der Durchführung der " +
  "aufgeführten Pflegeleistungen ausführlich angeleitet wurde und die Anleitungen verstanden hat.";

export interface SchulungPdfPosition {
  nr: string;
  bezeichnung: string;
  klvKategorie: string | null;
  schritte: string[];
}
export interface SchulungPdfGruppe {
  bereich: string;
  positionen: SchulungPdfPosition[];
}

export async function exportiereSchulungsnachweisPDF(
  nachweis: Schulungsnachweis,
  gruppen: SchulungPdfGruppe[],
  signaturDataUrl: string | null,
): Promise<Blob> {
  const abgeschlossen = nachweis.status === "abgeschlossen";
  const abschlussDatum = nachweis.abgeschlossenAm ? isoZuDate(nachweis.abgeschlossenAm.slice(0, 10)) : null;

  const b = await PdfBuilder.create({
    org: ORG_NAME,
    title: "Initialschulung",
    sub: "Nachweis der Anleitung pflegende Angehörige",
    kennung: "",
    mitarbeiterin: nachweis.angehoerigerName,
    erstellt: formatDatumZeit(new Date()),
    istEntwurf: !abgeschlossen,
  });

  b.statusRow(
    abgeschlossen ? "Abgeschlossen" : "Entwurf",
    abgeschlossen ? "" : "noch nicht unterschrieben",
  );

  const meta: MetaField[] = [
    { label: "Patient:in", value: nachweis.patientName },
    { label: "Pflegende Angehörige", value: nachweis.angehoerigerName },
    { label: "Fallführende / Ausbildende", value: nachweis.ausbildendeName },
    { label: "Abgeschlossen am", value: abschlussDatum ? formatAnzeige(abschlussDatum) : "—" },
  ];
  b.metaGrid(meta);

  // Nur die dem Angehörigen zugewiesenen Leistungspositionen (bereits gefiltert),
  // je Bereich, mit ihren Ausführungsschritten.
  for (const g of gruppen) {
    b.qaSection(
      g.bereich,
      g.positionen.map(p => ({
        question: `${p.nr} · ${p.bezeichnung}`,
        answer: p.schritte.length
          ? p.schritte.map((s, i) => `${i + 1}. ${s}`).join("   ")
          : "Keine Ausführungsschritte hinterlegt.",
      })),
    );
  }

  // Unterschrift — gezeichnetes Signaturbild, sonst textuelle Zeile. Der
  // Bestätigungssatz steht nur hier (bei der Unterschrift), nicht doppelt oben.
  const datumText = abschlussDatum ? formatAnzeige(abschlussDatum) : "—";
  if (signaturDataUrl) {
    await b.signatureImage(
      "Unterschrift der pflegenden Angehörigen",
      signaturDataUrl,
      nachweis.angehoerigerName,
      "Pflegende Angehörige",
      datumText,
      BESTAETIGUNG,
    );
  } else {
    b.signatures("Unterschrift der pflegenden Angehörigen", [{
      role: "Pflegende Angehörige",
      kind: "Kenntnisnahme",
      name: nachweis.angehoerigerName,
      date: datumText,
      wording: BESTAETIGUNG,
    }]);
  }

  const bytes = await b.finish();
  return new Blob([bytes as BlobPart], { type: "application/pdf" });
}

/** Löst den Download der PDF im Browser aus. */
export function ladeSchulungsnachweisHerunter(blob: Blob, nachweisId: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Initialschulung_${nachweisId}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
