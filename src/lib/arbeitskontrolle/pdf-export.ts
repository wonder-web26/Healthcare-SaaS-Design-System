/**
 * PDF-Export für Arbeitskontrollen.
 *
 * Enthält nur, was für die Arbeitskontrolle eigen ist: Dokumentkennung,
 * Zuordnung der Bewertungszustände zu Zellzuständen, und die Inhalte für die
 * wiederverwendbaren Bausteine in lib/pdf (Kopf/Fuss, Statuszeile,
 * Metadatenraster, Zitat, Legende, Erfassungsübersicht, Tabellen,
 * Abschnitte, Frage-Antwort, Unterschriften). Alle Masse stammen aus lib/pdf.
 */
import { PdfBuilder, type AssessRow, type MetaField, type SignatureEntry } from "../pdf/builder";
import { BEURTEILUNGSBLOECKE } from "./kriterien";
import { BESTAETIGUNGSTEXTE, type Arbeitskontrolle, type Bewertung } from "./store";
import { getOrgEinstellungen } from "../stammdaten/org-einstellungen";
import { formatAnzeige, isoZuAnzeige, formatDatumZeit } from "../datum";

const ORG_NAME = "Spitex Kaufmann AG";

// Zielsatz und Skalenbedeutungen wörtlich aus docs/arbeitskontrolle-v1.md.
const ZIEL =
  "Ziel ist die Qualität der Arbeitsweise samt Einhaltung der fachlichen " +
  "Instruktionen zu überprüfen, Verbesserungen zu finden und die Qualität zu erhöhen.";

const SKALA: [string, string][] = [
  ["1", "ungenügend"], ["2", "genügend"], ["3", "genügend bis gut"],
  ["4", "gut"], ["5", "gut bis sehr gut"], ["6", "sehr gut"],
];

// Freitextfragen AK-F1 bis AK-F3, wörtlich aus der Vorlage.
const FREITEXT_FRAGEN = [
  "Welche Verbesserungen wären zielführend?",
  "Wurden Vorschläge von der Klient:in, der Mitarbeiter:in (Ang.Pflege) oder der Fallführenden gemacht?",
  "Gibt es Vorschläge für eine mögliche Fehlervermeidung?",
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

function zellwert(w: Bewertung): number | "nb" | null {
  if (w === "nicht_beurteilbar") return "nb";
  if (typeof w === "number") return w;
  return null;
}

export async function exportiereArbeitskontrollePDF(k: Arbeitskontrolle): Promise<Blob> {
  const istEntwurf = k.status !== "abgeschlossen";
  const intervall = k.kontrollintervallMonate ?? getOrgEinstellungen().arbeitskontrolleTurnusMonate;

  const b = await PdfBuilder.create({
    org: ORG_NAME,
    title: "Arbeitskontrolle",
    sub: "Qualitätskontrolle pflegende Angehörige",
    kennung: dokumentKennung(k),
    mitarbeiterin: k.angehoerigerName,
    erstellt: formatDatumZeit(new Date()),
    istEntwurf,
  });

  // Statuszeile
  const art = k.art === "ausserordentlich" ? "Ausserordentliche Kontrolle" : "Reguläre Kontrolle";
  b.statusRow(istEntwurf ? "Entwurf" : "Abgeschlossen", `${isoZuAnzeige(k.kontrollDatum)}  ·  ${art}`);

  // Metadatenraster
  const metaFelder: MetaField[] = [
    { label: "Mitarbeiter:in", value: k.angehoerigerName },
    { label: "Fallführende", value: k.fallfuehrendeName },
    { label: "Besuchter Patient", value: k.patientName ?? "—" },
    { label: "Datum der Kontrolle", value: isoZuAnzeige(k.kontrollDatum) },
  ];
  b.metaGrid(metaFelder, {
    label: "Kontrollintervall",
    value: `alle ${intervall} Monate`,
    qualifier: "organisationsinterne Vorgabe, keine gesetzliche",
  });

  // Zielsatz
  b.quote(ZIEL);

  // Legende samt Kürzelauflösung (genau einmal im Dokument)
  b.legend(SKALA, [["n.b.", "kann ich nicht beurteilen"], ["n.e.", "nicht erfasst"]]);

  // Erfassungsübersicht — reine Arithmetik
  const werte = k.bloecke.flatMap(bl => bl.bewertungen.map(x => x.wert));
  const total = werte.length;
  const bewertet = werte.filter(w => typeof w === "number").length;
  const nichtBeurteilbar = werte.filter(w => w === "nicht_beurteilbar").length;
  const nichtErfasst = werte.filter(w => w === null).length;
  b.summary([
    ["Kriterien", String(total)],
    ["Bewertet", String(bewertet)],
    ["Nicht beurteilbar", String(nichtBeurteilbar)],
    ["Nicht erfasst", String(nichtErfasst)],
  ]);

  // Beurteilungsblöcke
  BEURTEILUNGSBLOECKE.forEach((blockDef, bi) => {
    const blockData = k.bloecke[bi];
    const rows: AssessRow[] = blockDef.kriterien.map(krit => ({
      name: krit.label,
      value: zellwert(blockData?.bewertungen.find(x => x.code === krit.code)?.wert ?? null),
    }));
    const note = blockData?.anmerkung?.trim() || "keine";
    b.block(String(bi + 1).padStart(2, "0"), blockDef.frage, rows, note);
  });

  // Verbesserungen und Vorschläge — drei Fragen der Vorlage, Antworten getrennt.
  // Die Maske erfasst ein kombiniertes Freitextfeld; es steht unter AK-F1,
  // AK-F2/F3 bleiben ohne separaten Wert ("—").
  const antworten = [k.verbesserungen?.trim() || "—", "—", "—"];
  b.qaSection("Verbesserungen und Vorschläge",
    FREITEXT_FRAGEN.map((frage, i) => ({ question: frage, answer: antworten[i] })));

  // Meldungen — im Abschnittsraster
  const meldung = (m: { erfolgt: boolean; datum: string; uhrzeit: string }) =>
    m.erfolgt ? `${isoZuAnzeige(m.datum)}, ${m.uhrzeit} Uhr` : "Nein";
  b.section("Meldungen");
  b.sectionGrid2([
    { label: "Geschäftsleitung", value: meldung(k.meldungGL) },
    { label: "Leitung Pflege", value: meldung(k.meldungLP) },
  ]);

  // Unterschriften — je Unterschrift der bestätigte Wortlaut darunter.
  const rollen: { rolle: "fallfuehrende" | "mitarbeiterin"; role: string; kind: string }[] = [
    { rolle: "fallfuehrende", role: "Fallführende", kind: "Beurteilung" },
    { rolle: "mitarbeiterin", role: "Mitarbeiter:in", kind: "Kenntnisnahme" },
  ];
  const sigs: SignatureEntry[] = rollen.map(r => {
    const u = k.unterschriften.find(x => x.rolle === r.rolle);
    return {
      role: r.role,
      kind: r.kind,
      name: u ? u.name : "ausstehend",
      date: u ? formatAnzeige(new Date(u.datum)) : "—",
      wording: u?.bestaetigungstext ?? BESTAETIGUNGSTEXTE[r.rolle],
    };
  });
  b.signatures("Unterschriften", sigs);

  const bytes = await b.finish();
  return new Blob([bytes as BlobPart], { type: "application/pdf" });
}
