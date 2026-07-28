/**
 * Reusable document builder for generated PDFs (module-independent).
 *
 * Provides the shared visual scaffold — page setup, first-page and short
 * continuation headers, a per-page footer with "Seite n von m", a status chip,
 * a four-column metadata grid, section headings, a quoted paragraph, hairline
 * tables that repeat their column header across page breaks, and the cell
 * glyphs. A concrete document (e.g. the Arbeitskontrolle) supplies only its own
 * content; layout, pagination and chrome live here.
 *
 * Coordinate note: pdf-lib's origin is bottom-left. `this.y` is the top edge of
 * the next piece of body content; drawing advances it downward.
 */
import { PDFDocument, PDFPage, PDFFont, rgb, Color } from "pdf-lib";
import { embedPlexFonts, PlexFonts } from "./fonts";
import { PAGE, CONTENT, MARGIN, SIZE, INK, RULE, MARK, TRACK_ORG } from "./theme";

/** Reserved bands so body content never collides with header/footer. */
const HEADER_FULL_H = 80;
const HEADER_SHORT_H = 26;
const FOOTER_H = 24;

export interface DocMeta {
  org: string;
  title: string;
  subtitle: string;
  kennung: string;
  statusLabel: string;
  istEntwurf: boolean;
  /** Footer left: mitarbeiter name and creation timestamp. */
  footerName: string;
  erstelltText: string;
}

export interface MetaEntry {
  label: string;
  value: string;
  /** Secondary suffix printed in grey after the value (e.g. the interval note). */
  suffix?: string;
}

export class PdfBuilder {
  readonly doc: PDFDocument;
  readonly f: PlexFonts;
  readonly meta: DocMeta;
  private pages: PDFPage[] = [];
  page!: PDFPage;
  y = 0;
  private idx = -1;

  private constructor(doc: PDFDocument, fonts: PlexFonts, meta: DocMeta) {
    this.doc = doc;
    this.f = fonts;
    this.meta = meta;
  }

  static async create(meta: DocMeta): Promise<PdfBuilder> {
    const doc = await PDFDocument.create();
    const fonts = await embedPlexFonts(doc);
    const b = new PdfBuilder(doc, fonts, meta);
    b.addPage();
    return b;
  }

  // ── geometry ───────────────────────────────────────────────────────────────
  private bodyTop(pageIndex: number): number {
    return CONTENT.top - (pageIndex === 0 ? HEADER_FULL_H : HEADER_SHORT_H);
  }
  private get bodyBottom(): number {
    return CONTENT.bottom + FOOTER_H;
  }
  get left() { return CONTENT.left; }
  get right() { return CONTENT.right; }
  get width() { return CONTENT.width; }

  // ── page management ──────────────────────────────────────────────────────
  addPage(): void {
    this.page = this.doc.addPage([PAGE.width, PAGE.height]);
    this.pages.push(this.page);
    this.idx += 1;
    this.y = this.bodyTop(this.idx);
  }

  /** Break to a new page if `h` points of body no longer fit. */
  ensure(h: number): void {
    if (this.y - h < this.bodyBottom) this.addPage();
  }

  gap(h: number): void { this.y -= h; }

  // ── text primitives ──────────────────────────────────────────────────────
  private w(font: PDFFont, size: number, s: string): number {
    return font.widthOfTextAtSize(s, size);
  }

  /** One line at (x, current baseline = y - size). Returns text width. */
  line(s: string, opts: { x?: number; font?: PDFFont; size?: number; color?: Color; align?: "left" | "right"; advance?: boolean } = {}): number {
    const font = opts.font ?? this.f.sansRegular;
    const size = opts.size ?? SIZE.body;
    const color = opts.color ?? INK.black;
    const width = this.w(font, size, s);
    let x = opts.x ?? this.left;
    if (opts.align === "right") x = (opts.x ?? this.right) - width;
    this.page.drawText(s, { x, y: this.y - size, font, size, color });
    if (opts.advance !== false) this.y -= size * 1.35;
    return width;
  }

  /** Letter-spaced (tracked) line, drawn glyph by glyph. */
  private tracked(page: PDFPage, s: string, x: number, baseline: number, font: PDFFont, size: number, color: Color, track: number): number {
    let cx = x;
    for (const ch of s) {
      page.drawText(ch, { x: cx, y: baseline, font, size, color });
      cx += this.w(font, size, ch) + track;
    }
    return cx - x - track;
  }

  /** Greedy word wrap. */
  wrap(s: string, font: PDFFont, size: number, maxWidth: number): string[] {
    const words = s.split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let cur = "";
    for (const word of words) {
      const trial = cur ? cur + " " + word : word;
      if (this.w(font, size, trial) <= maxWidth || !cur) cur = trial;
      else { lines.push(cur); cur = word; }
    }
    if (cur) lines.push(cur);
    return lines.length ? lines : [""];
  }

  /** Wrapped paragraph starting at x; advances y. Returns height consumed. */
  paragraph(s: string, opts: { x?: number; maxWidth?: number; font?: PDFFont; size?: number; color?: Color; lineGap?: number } = {}): number {
    const font = opts.font ?? this.f.sansRegular;
    const size = opts.size ?? SIZE.body;
    const x = opts.x ?? this.left;
    const maxWidth = opts.maxWidth ?? (this.right - x);
    const lh = size * (opts.lineGap ?? 1.4);
    const lines = this.wrap(s, font, size, maxWidth);
    for (const ln of lines) {
      this.page.drawText(ln, { x, y: this.y - size, font, size, color: opts.color ?? INK.black });
      this.y -= lh;
    }
    return lines.length * lh;
  }

  // ── rules & glyphs ────────────────────────────────────────────────────────
  hline(x1: number, x2: number, atY: number, weight = RULE.thin, color: Color = INK.grayLine): void {
    this.page.drawLine({ start: { x: x1, y: atY }, end: { x: x2, y: atY }, thickness: weight, color });
  }

  /** Empty cell square with a hairline border, centred in a column slot. */
  square(cx: number, cy: number, dashed = false): void {
    const s = MARK.square;
    this.page.drawRectangle({
      x: cx - s / 2, y: cy - s / 2, width: s, height: s,
      borderColor: INK.grayLine, borderWidth: dashed ? 0.5 : RULE.thin,
      opacity: 0, borderDashArray: dashed ? [1.2, 1.2] : undefined,
    });
  }

  /** Chosen cell: filled square, heavier border, a cross in reverse (white). */
  filledSquare(cx: number, cy: number): void {
    const s = MARK.square;
    this.page.drawRectangle({
      x: cx - s / 2, y: cy - s / 2, width: s, height: s,
      color: INK.fill, borderColor: INK.black, borderWidth: 0.9,
    });
    // Cross knocked out in white, so the mark reads through a photocopy or scan.
    const r = s / 2 - 1.1;
    this.page.drawLine({ start: { x: cx - r, y: cy - r }, end: { x: cx + r, y: cy + r }, thickness: 0.9, color: rgb(1, 1, 1) });
    this.page.drawLine({ start: { x: cx - r, y: cy + r }, end: { x: cx + r, y: cy - r }, thickness: 0.9, color: rgb(1, 1, 1) });
  }

  // ── header / footer (drawn in finalize, once the page count is known) ──────
  private drawHeader(page: PDFPage, pageIndex: number): void {
    const m = this.meta;
    if (pageIndex === 0) {
      let hy = CONTENT.top;
      const orgBase = hy - SIZE.org;
      this.tracked(page, m.org.toUpperCase(), CONTENT.left, orgBase, this.f.sansRegular, SIZE.org, INK.grayText, TRACK_ORG);
      const titleBase = orgBase - 6 - SIZE.title;
      page.drawText(m.title, { x: CONTENT.left, y: titleBase, font: this.f.sansMedium, size: SIZE.title, color: INK.black });
      const subBase = titleBase - 4 - SIZE.subtitle;
      page.drawText(m.subtitle, { x: CONTENT.left, y: subBase, font: this.f.sansRegular, size: SIZE.subtitle, color: INK.grayText });
      // right column: kennung (mono) then page
      const kW = this.w(this.f.monoRegular, SIZE.body, m.kennung);
      page.drawText(m.kennung, { x: CONTENT.right - kW, y: orgBase, font: this.f.monoRegular, size: SIZE.body, color: INK.black });
      const pg = `Seite ${pageIndex + 1} von ${this.pages.length}`;
      const pW = this.w(this.f.sansRegular, SIZE.label, pg);
      page.drawText(pg, { x: CONTENT.right - pW, y: orgBase - 12, font: this.f.sansRegular, size: SIZE.label, color: INK.grayText });
      const lineY = subBase - 8;
      this.hline(CONTENT.left, CONTENT.right, lineY, RULE.thick, INK.black);
      this.hline(CONTENT.left, CONTENT.right, lineY - 3, RULE.thin, INK.grayLine);
    } else {
      const base = CONTENT.top - SIZE.body;
      page.drawText(m.title, { x: CONTENT.left, y: base, font: this.f.sansMedium, size: SIZE.body, color: INK.black });
      const tW = this.w(this.f.sansMedium, SIZE.body, m.title);
      page.drawText(m.kennung, { x: CONTENT.left + tW + 10, y: base, font: this.f.monoRegular, size: SIZE.label, color: INK.grayText });
      const pg = `Seite ${pageIndex + 1} von ${this.pages.length}`;
      const pW = this.w(this.f.sansRegular, SIZE.label, pg);
      page.drawText(pg, { x: CONTENT.right - pW, y: base, font: this.f.sansRegular, size: SIZE.label, color: INK.grayText });
      this.hline(CONTENT.left, CONTENT.right, base - 6, RULE.thin, INK.grayLine);
    }
  }

  private drawFooter(page: PDFPage, pageIndex: number): void {
    const m = this.meta;
    const lineY = CONTENT.bottom + FOOTER_H - 6;
    this.hline(CONTENT.left, CONTENT.right, lineY, RULE.thin, INK.grayLine);
    const base = CONTENT.bottom + 4;
    const leftBits = [m.kennung, m.footerName, m.erstelltText].filter(Boolean).join("  ·  ");
    const leftText = m.istEntwurf ? `Entwurf, nicht abgeschlossen  ·  ${leftBits}` : leftBits;
    page.drawText(leftText, { x: CONTENT.left, y: base, font: this.f.sansRegular, size: SIZE.footer, color: INK.grayText });
    const pg = `Seite ${pageIndex + 1} von ${this.pages.length}`;
    const pW = this.w(this.f.sansRegular, SIZE.footer, pg);
    page.drawText(pg, { x: CONTENT.right - pW, y: base, font: this.f.sansRegular, size: SIZE.footer, color: INK.grayText });
  }

  // ── reusable composite blocks ─────────────────────────────────────────────
  /** Bordered status chip plus secondary date/kind text to its right. */
  statusChip(label: string, secondary: string): void {
    const size = SIZE.label;
    const padX = 5, padY = 2.5, h = size + padY * 2;
    const tw = this.w(this.f.sansMedium, size, label);
    const boxY = this.y - h;
    this.page.drawRectangle({ x: this.left, y: boxY, width: tw + padX * 2, height: h, borderColor: INK.black, borderWidth: RULE.thin, opacity: 0 });
    this.page.drawText(label, { x: this.left + padX, y: boxY + padY + 0.5, font: this.f.sansMedium, size, color: INK.black });
    this.page.drawText(secondary, { x: this.left + tw + padX * 2 + 8, y: boxY + padY + 0.5, font: this.f.sansRegular, size, color: INK.grayText });
    this.y -= h + 6;
  }

  /** Four-column metadata grid: label, value, label, value; hairlines between rows.
   *  A grey suffix (e.g. the interval note) is placed inline after the value when
   *  it fits, otherwise wrapped onto its own line(s) under the value. */
  metaGrid(entries: MetaEntry[]): void {
    const colLabelW = 78;
    const colGap = 14;
    const halfW = (this.width - colGap) / 2;
    const valW = halfW - colLabelW;
    const baseRow = 15;
    const rows = Math.ceil(entries.length / 2);
    for (let r = 0; r < rows; r++) {
      const rowTop = this.y;
      // Row height reserves room for the tallest wrapped suffix in the row.
      let extra = 0;
      for (let c = 0; c < 2; c++) {
        const e = entries[r * 2 + c];
        if (!e?.suffix) continue;
        const value = e.value || "—";
        const inline = this.w(this.f.sansRegular, SIZE.body, value) + 6 + this.w(this.f.sansRegular, SIZE.label, e.suffix) <= valW;
        if (!inline) extra = Math.max(extra, this.wrap(e.suffix, this.f.sansRegular, SIZE.label, valW).length * (SIZE.label + 1) + 2);
      }
      const rowH = baseRow + extra;
      for (let c = 0; c < 2; c++) {
        const e = entries[r * 2 + c];
        if (!e) continue;
        const x0 = this.left + c * (halfW + colGap);
        const labelBase = rowTop - SIZE.label - 2;
        this.page.drawText(e.label, { x: x0, y: labelBase, font: this.f.sansRegular, size: SIZE.label, color: INK.grayText });
        const valX = x0 + colLabelW;
        const value = e.value || "—";
        this.page.drawText(value, { x: valX, y: labelBase, font: this.f.sansRegular, size: SIZE.body, color: INK.black });
        if (e.suffix) {
          const vW = this.w(this.f.sansRegular, SIZE.body, value);
          if (vW + 6 + this.w(this.f.sansRegular, SIZE.label, e.suffix) <= valW) {
            this.page.drawText(e.suffix, { x: valX + vW + 6, y: labelBase, font: this.f.sansRegular, size: SIZE.label, color: INK.grayText });
          } else {
            let sy = labelBase - SIZE.label - 2;
            for (const sl of this.wrap(e.suffix, this.f.sansRegular, SIZE.label, valW)) {
              this.page.drawText(sl, { x: valX, y: sy, font: this.f.sansRegular, size: SIZE.label, color: INK.grayText });
              sy -= SIZE.label + 1;
            }
          }
        }
      }
      this.hline(this.left, this.right, rowTop - rowH, RULE.thin, INK.grayLine);
      this.y -= rowH;
    }
    this.y -= 4;
  }

  /** Section heading: two-digit mono tag in grey, then the question. */
  sectionHeading(tag: string, question: string): number {
    const tagW = this.w(this.f.monoRegular, SIZE.blockQuestion, tag);
    const base = this.y - SIZE.blockQuestion;
    this.page.drawText(tag, { x: this.left, y: base, font: this.f.monoRegular, size: SIZE.blockQuestion, color: INK.grayText });
    const qx = this.left + tagW + 8;
    const lines = this.wrap(question, this.f.sansMedium, SIZE.blockQuestion, this.right - qx);
    let by = base;
    for (const ln of lines) { this.page.drawText(ln, { x: qx, y: by, font: this.f.sansMedium, size: SIZE.blockQuestion, color: INK.black }); by -= SIZE.blockQuestion * 1.3; }
    const h = Math.max(SIZE.blockQuestion * 1.3, lines.length * SIZE.blockQuestion * 1.3);
    this.y -= h + 4;
    return h;
  }

  /** Quoted paragraph: indented grey text with a vertical rule at the left. */
  quote(text: string): void {
    const indent = 10;
    const x = this.left + indent + 6;
    const topY = this.y;
    const lines = this.wrap(text, this.f.sansRegular, SIZE.body, this.right - x);
    for (const ln of lines) { this.page.drawText(ln, { x, y: this.y - SIZE.body, font: this.f.sansRegular, size: SIZE.body, color: INK.grayText }); this.y -= SIZE.body * 1.4; }
    this.page.drawLine({ start: { x: this.left + indent, y: topY - 1 }, end: { x: this.left + indent, y: this.y + SIZE.body * 0.4 }, thickness: 1, color: INK.grayLine });
    this.y -= 4;
  }

  /** Points of body space left on the current page. */
  remaining(): number { return this.y - this.bodyBottom; }

  /**
   * Hairline table. Rows break across pages when needed; the column header is
   * redrawn on each continuation page. No vertical rules. The caller draws cell
   * content; the engine draws the inter-row hairlines and manages breaks.
   */
  table<T>(o: {
    headerHeight: number;
    drawHeader: (yTop: number) => void;
    rowHeight: number;
    rows: T[];
    drawRow: (row: T, yTop: number, h: number) => void;
  }): void {
    const head = () => {
      o.drawHeader(this.y);
      this.hline(this.left, this.right, this.y - o.headerHeight, RULE.thin, INK.grayLine);
      this.y -= o.headerHeight;
    };
    head();
    for (const row of o.rows) {
      if (this.y - o.rowHeight < this.bodyBottom) { this.addPage(); head(); }
      o.drawRow(row, this.y, o.rowHeight);
      this.hline(this.left, this.right, this.y - o.rowHeight, RULE.thin, INK.grayLine);
      this.y -= o.rowHeight;
    }
  }

  // ── finalize ──────────────────────────────────────────────────────────────
  async finish(): Promise<Uint8Array> {
    this.pages.forEach((p, i) => { this.drawHeader(p, i); this.drawFooter(p, i); });
    return this.doc.save();
  }
}
