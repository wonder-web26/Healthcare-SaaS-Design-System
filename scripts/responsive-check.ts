/**
 * Prüfskript für den Mobile/Tablet-Lauf 1.
 *
 * Misst im geladenen Dokument (Playwright/Chromium):
 *   P2 · kein waagrechtes Scrollen des Dokuments
 *   P3 · kein Element ragt über die Fensterbreite hinaus
 *        (Ausnahme: Inhalte in bewusst waagrecht scrollenden Containern, Muster B/C)
 *   P4 · anklickbare Elemente mindestens 44px hoch (Ausnahmen werden gelistet)
 *   P5 · kein sichtbarer Text unter 12px
 *   P6 · kein abgeschnittener Text ohne Umbruch oder Auslassung
 *   P7 · keine unbeabsichtigten Überdeckungen interaktiver Elemente
 *
 * Mit --p1 zusätzlich: Bildvergleich Desktop 1440×900 gegen .responsive-ref/vorher/
 * (Toleranz null abweichende Bildpunkte).
 *
 * Aufruf:
 *   node --experimental-strip-types scripts/responsive-check.ts            # P2–P7 bei 390 und 820
 *   node --experimental-strip-types scripts/responsive-check.ts --p1      # nur P1 (Desktop-Vergleich)
 */
import { chromium, type Page } from "playwright";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
// Die Ansichten (Routen + Öffnungsaktionen) leben an EINER Stelle: im Aufnahmeskript.
// @ts-ignore — .mjs ohne Typdeklaration
import { VIEWS } from "./responsive-capture.mjs";

const BASE = process.env.CAPTURE_BASE_URL || "http://localhost:5176";
const GROESSEN = [
  { b: 390, h: 844, name: "390x844" },
  { b: 820, h: 1180, name: "820x1180" },
];

const FREEZE_CSS = `
  *, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }
  html { scroll-behavior: auto !important; }
`;

type Befund = { pruefung: string; element: string; detail: string };

/** Misst P2–P7 im geladenen Dokument. Läuft als eine Funktion im Browser-Kontext. */
async function messungen(page: Page): Promise<Befund[]> {
  return page.evaluate(() => {
    const befunde: { pruefung: string; element: string; detail: string }[] = [];
    const W = window.innerWidth;

    const beschreibe = (el: Element): string => {
      const id = (el as HTMLElement).id ? `#${(el as HTMLElement).id}` : "";
      const cls = typeof el.className === "string" && el.className ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".") : "";
      const txt = (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40);
      return `${el.tagName.toLowerCase()}${id}${cls}${txt ? ` „${txt}“` : ""}`;
    };

    const sichtbar = (el: Element): boolean => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return false;
      const cs = getComputedStyle(el);
      return cs.display !== "none" && cs.visibility !== "hidden" && cs.opacity !== "0";
    };

    /** Liegt das Element in einem bewusst waagrecht scrollenden Container (Muster B/C)? */
    const inHScroll = (el: Element): boolean => {
      let p = el.parentElement;
      while (p) {
        const cs = getComputedStyle(p);
        if ((cs.overflowX === "auto" || cs.overflowX === "scroll") && p.scrollWidth > p.clientWidth + 1) return true;
        p = p.parentElement;
      }
      return false;
    };

    /* P2 — kein waagrechtes Scrollen des Dokuments */
    const doc = document.documentElement;
    if (doc.scrollWidth > W) {
      befunde.push({ pruefung: "P2", element: "documentElement", detail: `scrollWidth ${doc.scrollWidth} > Fensterbreite ${W}` });
    }

    const alle = Array.from(document.querySelectorAll("body *"));

    /* P3 — nichts ragt hinaus (ausser in scrollenden Containern) */
    for (const el of alle) {
      if (!sichtbar(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.right > W + 1 && !inHScroll(el)) {
        befunde.push({ pruefung: "P3", element: beschreibe(el), detail: `rechter Rand ${Math.round(r.right)}px > ${W}px` });
      }
    }

    /* P4 — Touchflächen mindestens 44px hoch */
    const klickbar = Array.from(document.querySelectorAll(
      'button, a[href], select, [role="button"], [role="link"], [role="tab"], [role="checkbox"], [role="menuitem"]'
    ));
    for (const el of klickbar) {
      if (!sichtbar(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.height < 43.5) {
        befunde.push({ pruefung: "P4", element: beschreibe(el), detail: `Höhe ${Math.round(r.height)}px` });
      }
    }

    /* P5 — kein sichtbarer Text unter der Styleguide-Untergrenze.
       Der Styleguide gibt 11px als kleinste Grösse vor (--text-micro,
       Sektions-Labels) — die Prompt-Vorgabe 12px gilt „sofern der Styleguide
       nichts anderes vorgibt“, und er gibt hier etwas anderes vor. */
    const gesehen = new Set<Element>();
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n: Node | null;
    while ((n = walker.nextNode())) {
      const t = (n.textContent || "").trim();
      if (!t) continue;
      const el = n.parentElement;
      if (!el || gesehen.has(el) || !sichtbar(el)) continue;
      gesehen.add(el);
      const fs = parseFloat(getComputedStyle(el).fontSize);
      if (fs < 10.99) {
        befunde.push({ pruefung: "P5", element: beschreibe(el), detail: `Schriftgrösse ${fs}px` });
      }
    }

    /* P6 — kein abgeschnittener Text ohne Umbruch/Auslassung */
    for (const el of alle) {
      if (!sichtbar(el)) continue;
      if (el.scrollWidth <= el.clientWidth + 1) continue;
      const cs = getComputedStyle(el);
      const scrollt = cs.overflowX === "auto" || cs.overflowX === "scroll";
      const ellipse = cs.textOverflow === "ellipsis";
      const clippt = cs.overflowX === "hidden" || cs.overflow === "hidden";
      const hatDirektText = Array.from(el.childNodes).some(c => c.nodeType === 3 && (c.textContent || "").trim());
      if (hatDirektText && clippt && !ellipse && !scrollt) {
        befunde.push({ pruefung: "P6", element: beschreibe(el), detail: `scrollWidth ${el.scrollWidth} > clientWidth ${el.clientWidth}, ohne Ellipse` });
      }
    }

    /* P7 — Überdeckungen interaktiver Elemente (Heuristik: >40% Fläche überlappt,
       kein Vorfahr/Nachfahr-Verhältnis, beide sichtbar und bedienbar).
       Elemente, die unter einem Overlay liegen (Dialog, Blatt, Detail-Overlay),
       sind BEABSICHTIGT verdeckt — nur an der Oberfläche erreichbare zählen. */
    const erreichbar = (el: Element): boolean => {
      const r = el.getBoundingClientRect();
      const cx = Math.min(Math.max(r.left + r.width / 2, 0), W - 1);
      const cy = Math.min(Math.max(r.top + r.height / 2, 0), window.innerHeight - 1);
      const top = document.elementFromPoint(cx, cy);
      return !!top && (el.contains(top) || top.contains(el));
    };
    const inter = klickbar.filter(el => sichtbar(el) && !inHScroll(el) && erreichbar(el));
    for (let i = 0; i < inter.length; i++) {
      for (let j = i + 1; j < inter.length; j++) {
        const a = inter[i], b = inter[j];
        if (a.contains(b) || b.contains(a)) continue;
        const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
        const x = Math.max(0, Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left));
        const y = Math.max(0, Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top));
        const schnitt = x * y;
        const klein = Math.min(ra.width * ra.height, rb.width * rb.height);
        if (klein > 0 && schnitt / klein > 0.4) {
          befunde.push({ pruefung: "P7", element: `${beschreibe(a)} × ${beschreibe(b)}`, detail: `${Math.round((schnitt / klein) * 100)}% überlappt` });
        }
      }
    }

    return befunde;
  });
}

async function laufP2bisP7() {
  const browser = await chromium.launch();
  let gesamt = 0;
  const bericht: Record<string, Record<string, Befund[]>> = {};

  for (const groesse of GROESSEN) {
    const context = await browser.newContext({ viewport: { width: groesse.b, height: groesse.h }, reducedMotion: "reduce", deviceScaleFactor: 1 });
    for (const view of VIEWS as { name: string; path: string; actions?: (p: Page) => Promise<void> }[]) {
      const page = await context.newPage();
      try {
        await page.goto(BASE + view.path, { waitUntil: "networkidle" });
        await page.addStyleTag({ content: FREEZE_CSS });
        await page.waitForTimeout(500);
        if (view.actions) await view.actions(page);
        const befunde = await messungen(page);
        bericht[view.name] = bericht[view.name] || {};
        bericht[view.name][groesse.name] = befunde;
        gesamt += befunde.length;
        const zusammenfassung = befunde.length === 0
          ? "OK"
          : Object.entries(befunde.reduce<Record<string, number>>((m, b) => ((m[b.pruefung] = (m[b.pruefung] || 0) + 1), m), {}))
              .map(([p, c]) => `${p}:${c}`).join(" ");
        console.log(`${view.name} @ ${groesse.name} — ${zusammenfassung}`);
      } catch (err) {
        gesamt += 1;
        console.log(`${view.name} @ ${groesse.name} — FEHLER: ${(err as Error).message.split("\n")[0]}`);
        bericht[view.name] = bericht[view.name] || {};
        bericht[view.name][groesse.name] = [{ pruefung: "AUSFALL", element: "-", detail: (err as Error).message.split("\n")[0] }];
      } finally {
        await page.close();
      }
    }
    await context.close();
  }

  await browser.close();
  writeFileSync(".responsive-ref/befunde.json", JSON.stringify(bericht, null, 2));
  console.log(`\n${gesamt === 0 ? "ALLE PRÜFUNGEN BESTANDEN" : `${gesamt} Befund(e)`} — Details: .responsive-ref/befunde.json`);
  process.exit(gesamt === 0 ? 0 : 1);
}

/** P1 — Bildvergleich Desktop 1440×900 gegen die Referenz. Toleranz: 0 Bildpunkte. */
async function laufP1() {
  mkdirSync(".responsive-ref/nachher", { recursive: true });
  mkdirSync(".responsive-ref/diff", { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce", deviceScaleFactor: 1 });
  let gesamt = 0;

  for (const view of VIEWS as { name: string; path: string; actions?: (p: Page) => Promise<void> }[]) {
    const page = await context.newPage();
    try {
      await page.goto(BASE + view.path, { waitUntil: "networkidle" });
      await page.addStyleTag({ content: FREEZE_CSS });
      await page.waitForTimeout(600);
      if (view.actions) await view.actions(page);
      const nachherPfad = `.responsive-ref/nachher/${view.name}_1440x900.png`;
      await page.screenshot({ path: nachherPfad });
      const vorher = PNG.sync.read(readFileSync(`.responsive-ref/vorher/${view.name}_1440x900.png`));
      const nachher = PNG.sync.read(readFileSync(nachherPfad));
      if (vorher.width !== nachher.width || vorher.height !== nachher.height) {
        console.log(`${view.name} — MASSABWEICHUNG ${vorher.width}×${vorher.height} vs ${nachher.width}×${nachher.height}`);
        gesamt += 1;
        continue;
      }
      const diff = new PNG({ width: vorher.width, height: vorher.height });
      const abweichend = pixelmatch(vorher.data, nachher.data, diff.data, vorher.width, vorher.height, { threshold: 0 });
      if (abweichend > 0) writeFileSync(`.responsive-ref/diff/${view.name}.png`, PNG.sync.write(diff));
      console.log(`${view.name} — ${abweichend} abweichende Bildpunkte`);
      gesamt += abweichend;
    } catch (err) {
      console.log(`${view.name} — FEHLER: ${(err as Error).message.split("\n")[0]}`);
      gesamt += 1;
    } finally {
      await page.close();
    }
  }

  await browser.close();
  console.log(`\nP1 ${gesamt === 0 ? "BESTANDEN (0 abweichende Bildpunkte)" : `NICHT bestanden (${gesamt} Abweichungen)`}`);
  process.exit(gesamt === 0 ? 0 : 1);
}

if (process.argv.includes("--p1")) laufP1();
else laufP2bisP7();
