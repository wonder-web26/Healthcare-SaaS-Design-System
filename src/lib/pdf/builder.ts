/**
 * Reusable document builder for generated PDFs (module-independent).
 *
 * A faithful translation of docs/referenzlayout.py to pdf-lib: the shared visual
 * scaffold every product document uses — first-page masthead and short
 * continuation header, a per-page footer with "Seite n von m" (page number in
 * the footer only, reference number in the header only), the status chip, the
 * metadata grid, the quoted paragraph, the scale legend with its abbreviation
 * line, the completeness summary, section headings, the assessment table with
 * its cell states, question-and-answer sections, and the signature block.
 * Concrete documents supply only their own content.
 *
 * Coordinate convention matches reportlab and pdf-lib: origin bottom-left,
 * `this.y` is the baseline of the current line; drawing decrements it.
 */
import { PDFDocument, PDFPage, PDFFont, Color } from "pdf-lib";
import { embedPlexFonts, PlexFonts } from "./fonts";
import { PW, PH, X0, X1, W, MB, MT, INK, SEC, MUT, HAIR, BOXL, SUMMARY_FILL, WHITE } from "./theme";

/** Assessment table geometry (referenzlayout.py). */
const CRIT_W = 232;
const CELL_W = 30;
const CX0 = X0 + CRIT_W;

export interface DocMeta {
  org: string;
  title: string;
  sub: string;
  kennung: string;
  mitarbeiterin: string;
  erstellt: string;
  istEntwurf: boolean;
}

export interface MetaField { label: string; value: string; }
export interface IntervalField { label: string; value: string; qualifier: string; }
export interface AssessRow { name: string; value: number | "nb" | null; }
export interface QAPair { question: string; answer: string; }
export interface SignatureEntry { role: string; kind: string; name: string; date: string; wording: string; }

export class PdfBuilder {
  readonly doc: PDFDocument;
  private readonly f: PlexFonts;
  private readonly meta: DocMeta;
  private pages: PDFPage[] = [];
  private page!: PDFPage;
  private y = 0;

  // Font aliases mirroring the reference (Plex / PlexM / Mono / MonoM).
  private get plex() { return this.f.sansRegular; }
  private get plexM() { return this.f.sansMedium; }
  private get mono() { return this.f.monoRegular; }
  private get monoM() { return this.f.monoMedium; }

  private constructor(doc: PDFDocument, fonts: PlexFonts, meta: DocMeta) {
    this.doc = doc; this.f = fonts; this.meta = meta;
  }

  static async create(meta: DocMeta): Promise<PdfBuilder> {
    const doc = await PDFDocument.create();
    const fonts = await embedPlexFonts(doc);
    const b = new PdfBuilder(doc, fonts, meta);
    b.addPage(true);
    return b;
  }

  // ── primitives ──────────────────────────────────────────────────────────
  private width(font: PDFFont, size: number, s: string): number { return font.widthOfTextAtSize(s, size); }

  private text(x: number, y: number, s: string, font: PDFFont, size: number, color: Color): void {
    this.page.drawText(s, { x, y, font, size, color });
  }
  private rightText(xr: number, y: number, s: string, font: PDFFont, size: number, color: Color): void {
    this.page.drawText(s, { x: xr - this.width(font, size, s), y, font, size, color });
  }
  private centred(cx: number, y: number, s: string, font: PDFFont, size: number, color: Color): void {
    this.page.drawText(s, { x: cx - this.width(font, size, s) / 2, y, font, size, color });
  }
  private spaced(x: number, y: number, s: string, font: PDFFont, size: number, tracking: number, color: Color): number {
    let cx = x;
    for (const ch of s) { this.page.drawText(ch, { x: cx, y, font, size, color }); cx += this.width(font, size, ch) + tracking; }
    return cx;
  }
  private hline(x1: number, y: number, x2: number, weight: number, color: Color): void {
    this.page.drawLine({ start: { x: x1, y }, end: { x: x2, y }, thickness: weight, color });
  }
  private vline(x: number, y1: number, y2: number, weight: number, color: Color): void {
    this.page.drawLine({ start: { x, y: y1 }, end: { x, y: y2 }, thickness: weight, color });
  }

  wrap(s: string, font: PDFFont, size: number, maxWidth: number): string[] {
    const words = s.split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let cur = "";
    for (const wd of words) {
      const t = (cur ? cur + " " + wd : wd);
      if (this.width(font, size, t) <= maxWidth) cur = t;
      else { if (cur) lines.push(cur); cur = wd; }
    }
    if (cur) lines.push(cur);
    return lines;
  }

  // ── page management ─────────────────────────────────────────────────────
  private addPage(first: boolean): void {
    this.page = this.doc.addPage([PW, PH]);
    this.pages.push(this.page);
    this.y = PH - MT;
    if (first) this.masthead(); else this.runhead();
  }
  private newPage(): void { this.addPage(false); }
  /** Break to a new page if `h` no longer fits above the footer band. */
  space(h: number): void { if (this.y - h < MB + 26) this.newPage(); }

  private masthead(): void {
    const m = this.meta;
    this.spaced(X0, this.y - 7, m.org.toUpperCase(), this.plexM, 7, 1.6, SEC);
    this.text(X0, this.y - 28, m.title, this.plexM, 17, INK);
    this.text(X0, this.y - 40, m.sub, this.plex, 8.5, SEC);
    this.rightText(X1, this.y - 28, m.kennung, this.monoM, 11, INK);
    this.y -= 52;
    this.hline(X0, this.y, X1, 0.9, INK);
    this.hline(X0, this.y - 2.6, X1, 0.35, HAIR);
    this.y -= 18;
  }

  private runhead(): void {
    const m = this.meta;
    this.text(X0, this.y - 8, m.title, this.plexM, 8, SEC);
    this.rightText(X1, this.y - 8, m.kennung, this.mono, 8, SEC);
    this.y -= 14;
    this.hline(X0, this.y, X1, 0.35, HAIR);
    this.y -= 20;
  }

  // ── reusable blocks ─────────────────────────────────────────────────────
  statusRow(status: string, secondary: string): void {
    const bw = this.width(this.plexM, 7, status.toUpperCase()) + 24;
    this.page.drawRectangle({ x: X0, y: this.y - 13, width: bw, height: 15, borderColor: INK, borderWidth: 0.5, opacity: 0 });
    this.spaced(X0 + 6, this.y - 8.5, status.toUpperCase(), this.plexM, 7, 1.0, INK);
    this.text(X0 + bw + 10, this.y - 8.5, secondary, this.plex, 8.5, SEC);
    this.y -= 26;
  }

  metaGrid(fields: MetaField[], interval: IntervalField): void {
    const cw = W / 2, lw = 92;
    for (let r = 0; r < 2; r++) {
      this.hline(X0, this.y, X1, 0.35, HAIR);
      this.y -= 13;
      for (let i = 0; i < 2; i++) {
        const e = fields[r * 2 + i];
        if (!e) continue;
        const bx = X0 + i * cw;
        this.text(bx, this.y, e.label, this.plex, 7.5, MUT);
        this.text(bx + lw, this.y, e.value, this.plex, 9, INK);
      }
      this.y -= 7;
    }
    this.hline(X0, this.y, X1, 0.35, HAIR);
    this.y -= 13;
    this.text(X0, this.y, interval.label, this.plex, 7.5, MUT);
    this.text(X0 + lw, this.y, interval.value, this.plex, 9, INK);
    const vw = this.width(this.plex, 9, interval.value);
    this.text(X0 + lw + vw + 8, this.y, interval.qualifier, this.plex, 7.5, MUT);
    this.y -= 7;
    this.hline(X0, this.y, X1, 0.35, HAIR);
    this.y -= 20;
  }

  quote(text: string): void {
    const lines = this.wrap(text, this.plex, 8.5, W - 14);
    const h = lines.length * 11;
    this.vline(X0 + 0.6, this.y + 2, this.y - h + 6, 1.2, BOXL);
    lines.forEach((ln, i) => this.text(X0 + 12, this.y - i * 11, ln, this.plex, 8.5, SEC));
    this.y -= h + 12;
  }

  legend(scale: [string, string][], abbreviations: [string, string][]): void {
    const y = this.y;
    let x = X0;
    for (const [code, mean] of scale) {
      this.text(x, y, code, this.monoM, 7.5, INK);
      x += 9;
      this.text(x, y, mean, this.plex, 7.5, SEC);
      x += this.width(this.plex, 7.5, mean) + 16;
    }
    const y2 = y - 11;
    let ax = X0;
    for (const [code, mean] of abbreviations) {
      this.text(ax, y2, code, this.monoM, 7.5, INK);
      this.text(ax + 20, y2, mean, this.plex, 7.5, SEC);
      ax += 20 + this.width(this.plex, 7.5, mean) + 16;
    }
    this.y = y2 - 18;
  }

  /** Completeness summary — arithmetic only, never interpretation. */
  summary(items: [string, string][]): void {
    this.page.drawRectangle({ x: X0, y: this.y - 26, width: W, height: 30, color: SUMMARY_FILL });
    const cw = W / 4;
    items.forEach(([lab, val], i) => {
      const bx = X0 + i * cw + 12;
      this.text(bx, this.y - 8, lab.toUpperCase(), this.plex, 7, MUT);
      this.text(bx, this.y - 22, val, this.monoM, 13, INK);
      if (i) this.vline(X0 + i * cw, this.y - 22, this.y, 0.35, HAIR);
    });
    this.y -= 42;
  }

  private cell(cx: number, cy: number, state: "on" | "off" | "dash"): void {
    const s = 8.6, x = cx - s / 2, yy = cy - s / 2;
    if (state === "on") {
      this.page.drawRectangle({ x, y: yy, width: s, height: s, color: INK, borderColor: INK, borderWidth: 0.9 });
      this.centred(cx, cy - 2.4, "×", this.plexM, 7, WHITE);
    } else if (state === "dash") {
      this.page.drawRectangle({ x, y: yy, width: s, height: s, borderColor: BOXL, borderWidth: 0.4, opacity: 0, borderDashArray: [1.2, 1.2] });
    } else {
      this.page.drawRectangle({ x, y: yy, width: s, height: s, borderColor: BOXL, borderWidth: 0.4, opacity: 0 });
    }
  }

  private blockHeight(q: string, rows: AssessRow[], note: string): number {
    let h = this.wrap(q, this.plexM, 9.5, W - 26).length * 12 + 8;
    h += 12;
    for (const r of rows) h += Math.max(16, this.wrap(r.name, this.plex, 8.5, CRIT_W - 10).length * 11 + 5);
    h += 8 + this.wrap(note, this.plex, 8.5, W - 4).length * 11 + 12;
    return h;
  }

  /** Assessment table: heading, column header (1–6, n.b.), rows with cell states, comment field. */
  block(num: string, question: string, rows: AssessRow[], note: string): void {
    this.space(this.blockHeight(question, rows, note));
    this.text(X0, this.y, num, this.monoM, 8.5, MUT);
    const qls = this.wrap(question, this.plexM, 9.5, W - 26);
    qls.forEach((ln, i) => this.text(X0 + 22, this.y - i * 12, ln, this.plexM, 9.5, INK));
    this.y -= qls.length * 12 + 8;
    for (let i = 0; i < 6; i++) this.centred(CX0 + i * CELL_W + CELL_W / 2, this.y, String(i + 1), this.plex, 7, MUT);
    this.centred(CX0 + 6 * CELL_W + CELL_W / 2, this.y, "n.b.", this.plex, 7, MUT);
    this.y -= 5;
    for (const row of rows) {
      const nls = this.wrap(row.name, this.plex, 8.5, CRIT_W - 10);
      const rh = Math.max(16, nls.length * 11 + 5);
      this.hline(X0, this.y, X1, 0.35, HAIR);
      const cy = this.y - rh / 2;
      const ty = nls.length === 1 ? this.y - 11 : this.y - 10;
      nls.forEach((ln, i) => this.text(X0, ty - i * 11, ln, this.plex, 8.5, INK));
      for (let i = 0; i < 6; i++) this.cell(CX0 + i * CELL_W + CELL_W / 2, cy, row.value === i + 1 ? "on" : "off");
      this.cell(CX0 + 6 * CELL_W + CELL_W / 2, cy, row.value === "nb" ? "on" : "dash");
      if (row.value === null) this.rightText(X1, cy - 2.5, "n.e.", this.mono, 7, MUT);
      this.y -= rh;
    }
    this.hline(X0, this.y, X1, 0.35, HAIR);
    this.y -= 12;
    this.spaced(X0, this.y, "ANMERKUNGEN", this.plex, 7, 0.8, MUT);
    const nls = this.wrap(note, this.plex, 8.5, W - 4);
    const noteColor = note !== "keine" ? INK : MUT;
    nls.forEach((ln, i) => this.text(X0, this.y - 11 - i * 11, ln, this.plex, 8.5, noteColor));
    this.y -= 11 + nls.length * 11 + 18;
  }

  section(title: string): void {
    this.space(40);
    this.hline(X0, this.y + 12, X1, 0.7, INK);
    this.text(X0, this.y, title, this.plexM, 9.5, INK);
    this.y -= 16;
  }

  /** Question-and-answer section: each question a label, its answer beneath. */
  qaSection(title: string, pairs: QAPair[]): void {
    this.section(title);
    for (const { question, answer } of pairs) {
      const als = this.wrap(answer, this.plex, 8.5, W - 4);
      const qls = this.wrap(question, this.plex, 7.5, W);
      this.space(14 + als.length * 11 + 12);
      qls.forEach((ln, i) => this.text(X0, this.y - i * 10, ln, this.plex, 7.5, MUT));
      this.y -= qls.length * 10 + 3;
      als.forEach((ln, i) => this.text(X0, this.y - i * 11, ln, this.plex, 8.5, INK));
      this.y -= als.length * 11 + 12;
    }
  }

  /** Two-column labelled row inside a section (e.g. Meldungen). */
  sectionGrid2(pairs: MetaField[]): void {
    const cw = W / 2;
    this.hline(X0, this.y + 4, X1, 0.35, HAIR);
    pairs.forEach((p, i) => {
      const bx = X0 + i * cw;
      this.text(bx, this.y - 9, p.label, this.plex, 7.5, MUT);
      this.text(bx + 92, this.y - 9, p.value, this.plex, 9, INK);
    });
    this.y -= 17;
    this.hline(X0, this.y, X1, 0.35, HAIR);
    this.y -= 22;
  }

  signatures(title: string, entries: SignatureEntry[]): void {
    this.space(120);
    this.section(title);
    for (const s of entries) {
      const tls = this.wrap(s.wording, this.plex, 7.5, W - 4);
      this.hline(X0, this.y + 4, X1, 0.35, HAIR);
      this.text(X0, this.y - 9, s.role, this.plexM, 9, INK);
      const wr = this.width(this.plexM, 9, s.role);
      this.text(X0 + wr + 7, this.y - 9, s.kind, this.plex, 8, MUT);
      this.text(X0 + 232, this.y - 9, s.name, this.plex, 9, INK);
      this.rightText(X1, this.y - 9, s.date, this.plex, 9, INK);
      this.y -= 21;
      tls.forEach((ln, i) => this.text(X0, this.y - i * 10, ln, this.plex, 7.5, SEC));
      this.y -= tls.length * 10 + 14;
    }
    this.hline(X0, this.y + 6, X1, 0.35, HAIR);
  }

  // ── finalize: footer with the now-known total page count ──────────────────
  private drawFooter(page: PDFPage, pageIndex: number, total: number): void {
    const m = this.meta;
    const yb = MB + 12;
    page.drawLine({ start: { x: X0, y: yb }, end: { x: X1, y: yb }, thickness: 0.35, color: HAIR });
    const left = (m.istEntwurf ? "Entwurf, nicht abgeschlossen  ·  " : "") + `${m.mitarbeiterin}  ·  erstellt ${m.erstellt}`;
    page.drawText(left, { x: X0, y: yb - 9, font: this.plex, size: 7, color: MUT });
    const pg = `Seite ${pageIndex + 1} von ${total}`;
    page.drawText(pg, { x: X1 - this.width(this.plex, 7, pg), y: yb - 9, font: this.plex, size: 7, color: MUT });
  }

  async finish(): Promise<Uint8Array> {
    const total = this.pages.length;
    this.pages.forEach((p, i) => this.drawFooter(p, i, total));
    return this.doc.save();
  }
}
