/**
 * PDF-Export für Arbeitskontrollen.
 *
 * Enthält nur, was für die Arbeitskontrolle eigen ist. Seitenaufbau, Kopf- und
 * Fusszeile, Metadatenraster, Tabellenzeichnung, Statusetikett und
 * Seitenumbruchlogik stammen aus dem modulunabhängigen Baustein-Bereich
 * (lib/pdf). Der Entwurfszustand wird ausschliesslich über das Statusetikett
 * im Kopf und den Fusszeilen-Vermerk gekennzeichnet — kein Rahmen, kein
 * Wasserzeichen, keine Farbe.
 */
import { PdfBuilder, MetaEntry } from "../pdf/builder";
import { SIZE, INK, MARK, RULE } from "../pdf/theme";
import { BEURTEILUNGSBLOECKE } from "./kriterien";
import { BESTAETIGUNGSTEXTE, type Arbeitskontrolle, type Bewertung } from "./store";
import { getOrgEinstellungen } from "../stammdaten/org-einstellungen";
import { formatAnzeige, isoZuAnzeige, formatDatumZeit } from "../datum";

const ORG_NAME = "Spitex Kaufmann AG";

// Skala gemäss Vorlage V1 (Wortlaut unverändert).
const SKALA: { wert: number; bedeutung: string }[] = [
  { wert: 1, bedeutung: "ungenügend" },
  { wert: 2, bedeutung: "genügend" },
  { wert: 3, bedeutung: "genügend bis gut" },
  { wert: 4, bedeutung: "gut" },
  { wert: 5, bedeutung: "gut bis sehr gut" },
  { wert: 6, bedeutung: "sehr gut" },
];

/** Deterministischer Kennungs-Teil aus der Arbeitskontrolle-Id (FNV-1a). */
function kennungSuffix(id: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) { h ^= id.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(36).toUpperCase().padStart(4, "0").slice(-4);
}

/** AK-JJJJ-XXXX: Jahr aus dem Kontrolldatum, Rest deterministisch aus der Id. */
export function dokumentKennung(k: Arbeitskontrolle): string {
  const jahr = (k.kontrollDatum || "").slice(0, 4) || "0000";
  return `AK-${jahr}-${kennungSuffix(k.id)}`;
}

function bewertungText(w: Bewertung): string {
  if (w === "nicht_beurteilbar") return "Nicht beurteilbar";
  if (typeof w === "number") return String(w);
  return "Nicht erfasst";
}

export async function exportiereArbeitskontrollePDF(k: Arbeitskontrolle): Promise<Blob> {
  const kennung = dokumentKennung(k);
  const istEntwurf = k.status !== "abgeschlossen";
  const intervall = k.kontrollintervallMonate ?? getOrgEinstellungen().arbeitskontrolleTurnusMonate;

  const b = await PdfBuilder.create({
    org: ORG_NAME,
    title: "Arbeitskontrolle",
    subtitle: "Qualitätskontrolle pflegende Angehörige",
    kennung,
    statusLabel: istEntwurf ? "Entwurf" : "Abgeschlossen",
    istEntwurf,
    footerName: k.angehoerigerName,
    erstelltText: `erstellt ${formatDatumZeit(new Date())}`,
  });

  // ── Statuszeile ────────────────────────────────────────────────────────────
  const artText = k.art === "ausserordentlich" ? "Ausserordentlich" : "Regulär";
  b.statusChip(istEntwurf ? "Entwurf" : "Abgeschlossen", `${isoZuAnzeige(k.kontrollDatum)}  ·  ${artText}`);

  // ── Metadatenraster ────────────────────────────────────────────────────────
  const meta: MetaEntry[] = [
    { label: "Mitarbeiter:in", value: k.angehoerigerName },
    { label: "Fallführende", value: k.fallfuehrendeName },
    { label: "Besuchter Patient", value: k.patientName ?? "—" },
    { label: "Datum der Kontrolle", value: isoZuAnzeige(k.kontrollDatum) },
    { label: "Kontrollintervall", value: `alle ${intervall} Monate`, suffix: "organisationsinterne Vorgabe, keine gesetzliche" },
  ];
  b.metaGrid(meta);
  b.gap(4);

  // ── Zielsatz (Wortlaut der Vorlage) ─────────────────────────────────────────
  b.quote("Ziel ist die Qualität der Arbeitsweise samt Einhaltung der fachlichen Instruktionen zu überprüfen, Verbesserungen zu finden und die Qualität zu erhöhen.");
  b.gap(4);

  // ── Skalenlegende ───────────────────────────────────────────────────────────
  zeichneSkalenlegende(b);
  b.gap(8);

  // ── Beurteilungsblöcke ──────────────────────────────────────────────────────
  const leftColW = 0.46 * b.width;
  const valueCols = 7; // 1..6 + n.b.
  const valueColW = (b.width - leftColW) / valueCols;
  const rowH = MARK.minRow;
  const headerH = 14;
  const colCenter = (idx: number) => b.left + leftColW + valueColW * (idx + 0.5);

  const drawTableHeader = (yTop: number) => {
    const base = yTop - SIZE.label - 2;
    for (let n = 1; n <= 6; n++) {
      const s = String(n);
      const w = b.f.sansRegular.widthOfTextAtSize(s, SIZE.label);
      b.page.drawText(s, { x: colCenter(n - 1) - w / 2, y: base, font: b.f.sansRegular, size: SIZE.label, color: INK.grayText });
    }
    const nb = "n.b.";
    const nbW = b.f.sansRegular.widthOfTextAtSize(nb, SIZE.label);
    b.page.drawText(nb, { x: colCenter(6) - nbW / 2, y: base, font: b.f.sansRegular, size: SIZE.label, color: INK.grayText });
  };

  BEURTEILUNGSBLOECKE.forEach((blockDef, bi) => {
    const blockData = k.bloecke[bi];
    const anmerkung = blockData?.anmerkung?.trim() || "keine";

    // Keep-together: Überschrift + Tabellenkopf + alle Zeilen + Anmerkung.
    const tag = String(bi + 1).padStart(2, "0");
    const tagW = b.f.monoRegular.widthOfTextAtSize(tag, SIZE.blockQuestion);
    const qLines = b.wrap(blockDef.frage, b.f.sansMedium, SIZE.blockQuestion, b.width - tagW - 8);
    const headingH = qLines.length * SIZE.blockQuestion * 1.3 + 4;
    const anmLines = b.wrap(anmerkung, b.f.sansRegular, SIZE.body, b.width);
    const anmerkungH = SIZE.label + 3 + anmLines.length * SIZE.body * 1.35 + 8;
    const blockH = headingH + headerH + blockDef.kriterien.length * rowH + anmerkungH + 6;
    b.ensure(blockH);

    b.sectionHeading(tag, blockDef.frage);

    b.table({
      headerHeight: headerH,
      drawHeader: drawTableHeader,
      rowHeight: rowH,
      rows: blockDef.kriterien,
      drawRow: (krit, yTop, h) => {
        const wert = blockData?.bewertungen.find(x => x.code === krit.code)?.wert ?? null;
        const midY = yTop - h / 2;
        // Kriteriumsbezeichnung
        b.page.drawText(krit.label, { x: b.left + 2, y: midY - SIZE.body * 0.35, font: b.f.sansRegular, size: SIZE.body, color: INK.black, maxWidth: leftColW - 8 });
        // Wertespalten 1..6
        for (let n = 1; n <= 6; n++) {
          if (wert === n) b.filledSquare(colCenter(n - 1), midY);
          else b.square(colCenter(n - 1), midY);
        }
        // n.b.-Spalte: gestrichelt im nicht gewählten Zustand (liegt nicht auf der Skala)
        if (wert === "nicht_beurteilbar") b.filledSquare(colCenter(6), midY);
        else b.square(colCenter(6), midY, true);
        // Zeile ohne jede Markierung -> "n. e." am rechten Rand
        if (wert === null) {
          const ne = "n. e.";
          const w = b.f.sansRegular.widthOfTextAtSize(ne, SIZE.label);
          b.page.drawText(ne, { x: b.right - w, y: midY - SIZE.label * 0.35, font: b.f.sansRegular, size: SIZE.label, color: INK.grayText });
        }
      },
    });

    // Anmerkungsfeld — immer vorhanden.
    b.gap(4);
    b.line("ANMERKUNGEN", { font: b.f.sansRegular, size: SIZE.label, color: INK.grayText });
    b.paragraph(anmerkung, { font: b.f.sansRegular, size: SIZE.body, color: INK.black });

    // Auflösung der Kürzel am Fuss des ersten Blocks (Seite mit der ersten Tabelle).
    if (bi === 0) {
      b.gap(2);
      b.line("n. b. = kann ich nicht beurteilen   ·   n. e. = nicht erfasst", { font: b.f.sansRegular, size: SIZE.footer, color: INK.grayText });
    }
    b.gap(10);
  });

  // ── Freitext ────────────────────────────────────────────────────────────────
  if (k.verbesserungen?.trim()) {
    b.ensure(SIZE.blockQuestion * 1.3 + SIZE.body * 2.8);
    b.line("Verbesserungen und Vorschläge", { font: b.f.sansMedium, size: SIZE.blockQuestion, color: INK.black });
    b.gap(4);
    b.paragraph(k.verbesserungen.trim(), { font: b.f.sansRegular, size: SIZE.body, color: INK.black });
    b.gap(10);
  }

  // ── Meldungen ────────────────────────────────────────────────────────────────
  const meldung = (m: { erfolgt: boolean; datum: string; uhrzeit: string }) =>
    m.erfolgt ? `Ja, am ${isoZuAnzeige(m.datum)} um ${m.uhrzeit} Uhr` : "Nein";
  b.ensure(SIZE.blockQuestion * 1.3 + 24);
  b.line("Meldungen", { font: b.f.sansMedium, size: SIZE.blockQuestion, color: INK.black });
  b.gap(4);
  b.metaGrid([
    { label: "Geschäftsleitung", value: meldung(k.meldungGL) },
    { label: "Leitung Pflege", value: meldung(k.meldungLP) },
  ]);
  b.gap(10);

  // ── Unterschriften (nie aufgeteilt) ──────────────────────────────────────────
  const rollen: { rolle: "fallfuehrende" | "mitarbeiterin"; label: string }[] = [
    { rolle: "fallfuehrende", label: "Fallführende (Beurteilung)" },
    { rolle: "mitarbeiterin", label: "Mitarbeiter:in (Kenntnisnahme)" },
  ];
  // Höhe des gesamten Blocks schätzen und zusammenhalten.
  let sigBlockH = SIZE.blockQuestion * 1.3 + 6;
  for (const r of rollen) {
    const u = k.unterschriften.find(x => x.rolle === r.rolle);
    const wortlaut = u?.bestaetigungstext ?? BESTAETIGUNGSTEXTE[r.rolle];
    sigBlockH += SIZE.body * 1.35 + b.wrap(wortlaut, b.f.sansRegular, SIZE.label, b.width).length * SIZE.label * 1.35 + 12;
  }
  b.ensure(sigBlockH);
  b.line("Unterschriften", { font: b.f.sansMedium, size: SIZE.blockQuestion, color: INK.black });
  b.gap(6);
  for (const r of rollen) {
    const u = k.unterschriften.find(x => x.rolle === r.rolle);
    const wortlaut = u?.bestaetigungstext ?? BESTAETIGUNGSTEXTE[r.rolle];
    const zeile = u
      ? `${r.label}   ·   ${u.name}   ·   ${formatAnzeige(new Date(u.datum))}`
      : `${r.label}   ·   ausstehend`;
    b.line(zeile, { font: b.f.sansRegular, size: SIZE.body, color: INK.black });
    b.paragraph(wortlaut, { font: b.f.sansRegular, size: SIZE.label, color: INK.grayText });
    b.gap(4);
    b.hline(b.left, b.right, b.y, RULE.thin, INK.grayLine);
    b.gap(8);
  }

  const bytes = await b.finish();
  return new Blob([bytes as BlobPart], { type: "application/pdf" });
}

/** Skalenlegende als fliessende Zeile: Wert schwarz, Bedeutung grau, deutlicher Abstand. */
function zeichneSkalenlegende(b: PdfBuilder): void {
  const entries = [
    ...SKALA.map(s => ({ wert: String(s.wert), bedeutung: s.bedeutung })),
    { wert: "n.b.", bedeutung: "kann ich nicht beurteilen" },
  ];
  const size = SIZE.body;
  const gap = 16;
  let x = b.left;
  const startY = b.y;
  let y = startY;
  const drawAt = (s: string, xx: number, yy: number, medium: boolean, gray: boolean) =>
    b.page.drawText(s, { x: xx, y: yy - size, font: medium ? b.f.sansMedium : b.f.sansRegular, size, color: gray ? INK.grayText : INK.black });
  for (const e of entries) {
    const wW = b.f.sansMedium.widthOfTextAtSize(e.wert, size);
    const mW = b.f.sansRegular.widthOfTextAtSize(" " + e.bedeutung, size);
    if (x + wW + mW > b.right) { x = b.left; y -= size * 1.5; }
    drawAt(e.wert, x, y, true, false);
    drawAt(" " + e.bedeutung, x + wW, y, false, true);
    x += wW + mW + gap;
  }
  b.y = y - size * 1.5;
}
