/**
 * Shared design tokens for generated documents (module-independent).
 *
 * Values are the authoritative measurements from docs/referenzlayout.py,
 * translated to pdf-lib. A quiet, monochrome visual language: the documents are
 * copied and scanned, so there is no colour accent — black plus greys only.
 */
import { rgb } from "pdf-lib";

/** Points per millimetre (72 / 25.4). */
export const MM = 72 / 25.4;

/** A4 portrait, in points (210 × 297 mm). */
export const PW = 210 * MM;
export const PH = 297 * MM;

/** Margins in points. The wider left margin allows hole-punching and filing. */
export const ML = 22 * MM;
export const MR = 15 * MM;
export const MT = 18 * MM;
export const MB = 16 * MM;

/** Text frame. */
export const X0 = ML;
export const X1 = PW - MR;
export const W = X1 - X0;

/** Greyscale palette (r = g = b). No chromatic colour anywhere. */
export const INK = rgb(0.10, 0.10, 0.10);   // text (not pure black)
export const SEC = rgb(0.42, 0.42, 0.42);   // secondary text
export const MUT = rgb(0.60, 0.60, 0.60);   // labels, abbreviations
export const HAIR = rgb(0.82, 0.82, 0.82);  // hairlines
export const BOXL = rgb(0.66, 0.66, 0.66);  // empty checkbox border
export const SUMMARY_FILL = rgb(0.965, 0.965, 0.965); // completeness panel fill
export const WHITE = rgb(1, 1, 1);          // knocked-out cross
