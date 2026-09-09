/**
 * Medikationsprüfung — MOCK-ANBIETER FUER DEN PROTOTYP.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * DIESE BEFUNDE SIND BEISPIELDATEN UND TAUGEN NICHT FUER EINE
 * BEHANDLUNGSENTSCHEIDUNG.
 *
 * Sie stammen aus einer von Hand hinterlegten Regeltabelle auf den
 * Praeparatepaaren des Seeds — nicht aus einer Arzneimitteldatenbank, nicht
 * aus einer Wirkstofflogik, nicht aus einer Interaktionsdatenbank. Es wird
 * nichts abgeleitet und nichts berechnet.
 * ══════════════════════════════════════════════════════════════════════════
 *
 * TAUSCHGRENZE — wie beim Arzneimittelkatalog (arzneimittel.ts). Die reale
 * Pruefung ist ein externes, CE-zertifiziertes Medizinprodukt. Genau diese
 * Datei wird dann ersetzt, und nur sie: die Regeltabelle wird NICHT
 * exportiert, der Zugriff laeuft ausschliesslich ueber `pruefungAusfuehren`.
 * Wer die Tabelle direkt laese, muesste beim Anschluss mitgeaendert werden.
 *
 * WIR RECHNEN NICHTS UM. Der Schweregrad kommt im Format des Anbieters
 * (Wert, Skalenmaximum, seine Bezeichnung). Eine eigene Ampel gibt es nicht,
 * und der Befundtext wird unveraendert durchgereicht.
 */
import { GEGENWART_ISO } from "../gegenwart";
import type { Befund, Pruefart, PruefartErgebnis, Pruefergebnis } from "./medikation";
import type { Medikationsposition } from "./medikation";

/**
 * DIE EINE KONSTANTE fuer die Mock-Kennzeichnung. Solange sie `true` ist,
 * traegt jedes Ergebnis sichtbar den Hinweis, dass es Beispieldaten sind —
 * an der Pruefleiste und an jedem Befund. Auf `false` verschwindet die
 * Kennzeichnung vollstaendig, ohne dass sonst etwas angefasst werden muss.
 */
export const MOCK_KENNZEICHNUNG = true;

/**
 * Ist ein Pruefdienst konfiguriert? Im Prototyp eine Konstante — real haengt
 * es an der Einrichtung des externen Dienstes. Auf `false` zeigt die
 * Pruefleiste den Zustand «Nicht aktiv»: kein Ergebnis, kein Haekchen, kein
 * stiller Eindruck, es sei geprueft worden.
 */
export const PRUEFDIENST_KONFIGURIERT = true;

const ANBIETER_NAME = "Prüfdienst (Beispieldaten)";
const REGELSTAND = "Mock-Regelstand 2026-09";

/** Ein Eintrag der Regeltabelle: ein Praeparatepaar und der Wortlaut dazu. */
interface MockRegel {
  art: Pruefart;
  /** Katalogkennungen (`productCode`) der betroffenen Praeparate. */
  paar: [string, string];
  schweregrad: { wert: number; maximum: number; bezeichnung: string };
  text: string;
  quelle: string;
}

/* NICHT EXPORTIERT — siehe Tauschgrenze im Kopfkommentar. */
const MOCK_REGELN: MockRegel[] = [
  {
    art: "wechselwirkungen",
    paar: ["AM-0003", "AM-0004"], // BELOC ZOK + TORASEMID
    schweregrad: { wert: 2, maximum: 4, bezeichnung: "mässig" },
    text: "Die gleichzeitige Gabe kann den blutdrucksenkenden Effekt verstärken. "
      + "Zu Beginn und nach Dosisänderungen Blutdruck und Puls engmaschiger kontrollieren. "
      + "Auf Zeichen einer Hypotonie achten, besonders beim Aufstehen.",
    quelle: "Beispieldatensatz des Prototyps",
  },
  {
    art: "doppelmedikation",
    paar: ["AM-0006", "AM-0008"], // FENTANYL + NOVALGIN
    schweregrad: { wert: 1, maximum: 4, bezeichnung: "gering" },
    text: "Zwei Analgetika unterschiedlicher Wirkklassen in derselben Liste. "
      + "Das kann so gewollt sein (Basis plus Reserve). Bitte bestätigen, dass die "
      + "Kombination beabsichtigt ist, und die Tageshöchstmenge der Reserve prüfen.",
    quelle: "Beispieldatensatz des Prototyps",
  },
];

/**
 * Prüfung ausführen — die Tauschgrenze. Rein: keine Netzwerkaufrufe, kein
 * Zustand, keine Seiteneffekte.
 *
 * `allergienMaschinellPruefbar` sagt, ob die Allergien der Klientin codiert
 * vorliegen. Ein von Hand erfasster Allergieeintrag ist nicht maschinell
 * pruefbar — das Schema haelt das an `Allergy.substanceCode` ausdruecklich
 * fest. Dann bleibt die Prueftart `nicht_geprueft` MIT Grund, statt stumm
 * «kein Befund» zu melden.
 */
export function pruefungAusfuehren(
  positionen: Medikationsposition[],
  optionen: { allergienMaschinellPruefbar: boolean; freitextAllergien: string[] },
): Pruefergebnis {
  if (!PRUEFDIENST_KONFIGURIERT) {
    return { anbieterAktiv: false, anbieterName: ANBIETER_NAME, geprueftAm: "", arten: [], befunde: [] };
  }

  const gesamt = positionen.length;
  const codiert = positionen.filter(p => !!p.productCode);
  const codes = new Set(codiert.map(p => p.productCode));

  const befunde: Befund[] = MOCK_REGELN
    .filter(r => r.paar.every(c => codes.has(c)))
    .map((r, i) => ({
      id: `BEF-${i + 1}`,
      art: r.art,
      positionIds: r.paar
        .map(c => codiert.find(p => p.productCode === c)?.id)
        .filter((x): x is string => !!x),
      schweregrad: { ...r.schweregrad, skala: "Anbieterskala 1–4" },
      text: r.text,
      quelle: r.quelle,
      regelstand: REGELSTAND,
      geprueftAm: GEGENWART_ISO,
    }));

  const mitBefund = (art: Pruefart) => befunde.some(b => b.art === art);
  const geprueft = (art: Pruefart): PruefartErgebnis => ({
    art,
    zustand: mitBefund(art) ? "geprueft_mit_befund" : "geprueft_ohne_befund",
    geprueftePositionen: codiert.length,
    gesamtPositionen: gesamt,
    grund: null,
    wegText: null,
  });

  const arten: PruefartErgebnis[] = [
    geprueft("wechselwirkungen"),
    geprueft("doppelmedikation"),
    optionen.allergienMaschinellPruefbar
      ? geprueft("allergien")
      : {
          art: "allergien",
          zustand: "nicht_geprueft",
          geprueftePositionen: 0,
          gesamtPositionen: gesamt,
          grund: optionen.freitextAllergien.length > 0
            ? `Nicht codierte Allergieeinträge lassen sich nicht maschinell prüfen: ${optionen.freitextAllergien.join(", ")}.`
            : "Es liegen keine codierten Allergieangaben vor.",
          wegText: "Im Reiter «Allergien» als codierten Eintrag erfassen.",
        },
    {
      /* Kontraindikationen brauchen klinischen Kontext, den das Onboarding
         heute nicht führt. Der fehlende Wert wird benannt, nicht erfunden. */
      art: "kontraindikationen",
      zustand: "nicht_geprueft",
      geprueftePositionen: 0,
      gesamtPositionen: gesamt,
      grund: "Es sind keine Laborwerte erfasst; ohne Nierenfunktion ist die Prüfung nicht möglich.",
      wegText: null,
    },
  ];

  return {
    anbieterAktiv: true,
    anbieterName: ANBIETER_NAME,
    geprueftAm: GEGENWART_ISO,
    arten,
    befunde,
  };
}
