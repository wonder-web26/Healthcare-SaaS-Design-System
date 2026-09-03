/**
 * Nimmt Bildschirmabzüge der Lauf-1-Ansichten auf (Mobile/Tablet-Lauf 1).
 *
 * Aufruf:  node scripts/responsive-capture.mjs <outDir> <BREITExHOEHE> [nurAnsicht]
 * Beispiel: node scripts/responsive-capture.mjs .responsive-ref/vorher 1440x900
 *
 * Animationen und Übergänge werden deaktiviert, damit Abzüge deterministisch
 * vergleichbar sind (P1: Null-Toleranz-Bildvergleich).
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const BASE = process.env.CAPTURE_BASE_URL || "http://localhost:5176";

const FREEZE_CSS = `
  *, *::before, *::after {
    animation: none !important;
    transition: none !important;
    caret-color: transparent !important;
  }
  html { scroll-behavior: auto !important; }
`;

/** Die sieben Ansichten des Laufs. `actions` läuft nach dem Laden. */
export const VIEWS = [
  { name: "onboarding-liste", path: "/onboarding" },
  {
    name: "onboarding-angehoeriger-personalien",
    path: "/onboarding/OB-2026-101",
  },
  {
    name: "onboarding-patient-personalien",
    path: "/onboarding/OB-2026-101?step=patient&tab=personalien",
  },
  {
    name: "onboarding-bedarfsabklaerung",
    path: "/onboarding/OB-2026-101?step=patient&tab=interrai",
  },
  { name: "pendenzenliste", path: "/servicedesk" },
  {
    name: "onboarding-dialog",
    path: "/onboarding/OB-2026-101",
    actions: async (page) => {
      // Dokumente-Reiter → "Scannen" öffnet den DokumentScanUpload-Dialog
      await page.locator("button", { hasText: "Dokumente" }).first().click();
      await page.waitForTimeout(400);
      await page.locator("button", { hasText: "Scannen" }).first().click();
      await page.waitForTimeout(500);
    },
  },
  {
    name: "pendenzen-dialog",
    path: "/servicedesk",
    actions: async (page) => {
      // Erste Pendenz in der Liste öffnen → DetailPanel (Desktop) / Overlay (Mobile)
      await page.getByText("Quellensteuer-Anmeldung").first().click();
      await page.waitForTimeout(500);
    },
  },
  {
    // Lauf 1b: Vertragsunterzeichnung (P15 — keine abgeschnittenen Beschriftungen).
    // keinP1: erst nach Lauf 1 aufgenommen, es gibt kein Vorher-Referenzbild.
    name: "onboarding-vertrag",
    path: "/onboarding/OB-2026-102",
    keinP1: true,
    actions: async (page) => {
      await page
        .locator('[role="tablist"][aria-label="Phasen"] button', { hasText: "Vertragsunterzeichnung" })
        .click();
      await page.waitForTimeout(500);
    },
  },
];

async function main() {
  const [outDirArg, sizeArg, only] = process.argv.slice(2);
  if (!outDirArg || !sizeArg) {
    console.error("Aufruf: node scripts/responsive-capture.mjs <outDir> <BxH> [nurAnsicht]");
    process.exit(1);
  }
  const [width, height] = sizeArg.split("x").map(Number);
  const outDir = resolve(outDirArg);
  mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width, height },
    reducedMotion: "reduce",
    deviceScaleFactor: 1,
  });

  for (const view of VIEWS) {
    if (only && view.name !== only) continue;
    const page = await context.newPage();
    try {
      await page.goto(BASE + view.path, { waitUntil: "networkidle" });
      await page.addStyleTag({ content: FREEZE_CSS });
      await page.waitForTimeout(600);
      if (view.actions) await view.actions(page);
      const file = `${outDir}/${view.name}_${width}x${height}.png`;
      await page.screenshot({ path: file });
      console.log(`OK  ${view.name} → ${file}`);
    } catch (err) {
      console.error(`FEHLER  ${view.name}: ${err.message.split("\n")[0]}`);
    } finally {
      await page.close();
    }
  }

  await browser.close();
}

// Nur bei direktem Aufruf laufen — das Prüfskript importiert VIEWS von hier.
if (process.argv[1]?.endsWith("responsive-capture.mjs")) main();
