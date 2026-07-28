/**
 * Shared design tokens for generated documents (module-independent).
 *
 * A single, quiet visual language for every produced PDF — page geometry,
 * margins, a small type scale, and a monochrome palette. No colour accent: the
 * documents are copied and scanned, and colour on a supervisory document reads
 * as advertising.
 */
import { rgb } from "pdf-lib";

/** Points per millimetre (72 / 25.4). */
export const MM = 72 / 25.4;

/** A4 portrait, in points. */
export const PAGE = { width: 210 * MM, height: 297 * MM };

/** Margins in points. The wider left margin allows hole-punching and filing. */
export const MARGIN = {
  left: 22 * MM,
  right: 15 * MM,
  top: 18 * MM,
  bottom: 16 * MM,
};

export const CONTENT = {
  left: MARGIN.left,
  right: PAGE.width - MARGIN.right,
  get width() { return this.right - this.left; },
  top: PAGE.height - MARGIN.top,
  bottom: MARGIN.bottom,
};

/** Type scale (pt). */
export const SIZE = {
  title: 16,
  subtitle: 8.5,
  org: 7.5,
  blockQuestion: 10,
  body: 8.5,
  label: 7.5,
  footer: 7,
};

/** Monochrome palette: black plus two greys (labels, lines). */
export const INK = {
  black: rgb(0, 0, 0),
  /** Secondary text: labels, captions, subtitle. */
  grayText: rgb(0.36, 0.36, 0.36),
  /** Hairlines and rules. */
  grayLine: rgb(0.68, 0.68, 0.68),
  /** Fill for a chosen cell. */
  fill: rgb(0, 0, 0),
};

/** Line weights (pt). */
export const RULE = {
  thin: 0.4,
  thick: 1.1,
};

/** Marker geometry. */
export const MARK = {
  square: 3.5 * MM,
  minRow: 7 * MM,
};

/** Letter-spacing for the small, tracked organisation name (pt of extra advance). */
export const TRACK_ORG = 1.1;
