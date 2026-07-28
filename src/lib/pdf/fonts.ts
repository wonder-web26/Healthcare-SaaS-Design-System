/**
 * Embeds the vendored IBM Plex fonts (SIL OFL 1.1) into a PDFDocument.
 *
 * pdf-lib needs a fontkit instance to embed custom fonts; the vendored,
 * self-contained UMD build is registered here. Fonts are subset on embed so a
 * document only carries the glyphs it actually uses.
 */
import type { PDFDocument, PDFFont } from "pdf-lib";
// @ts-expect-error — vendored UMD bundle, no type declarations
import fontkit from "./vendor/fontkit.js";
import { IBM_PLEX_SANS_REGULAR } from "./fonts/sans-regular";
import { IBM_PLEX_SANS_MEDIUM } from "./fonts/sans-medium";
import { IBM_PLEX_MONO_REGULAR } from "./fonts/mono-regular";
import { IBM_PLEX_MONO_MEDIUM } from "./fonts/mono-medium";

/** base64 → bytes, working in both browser and Node (global atob). */
function toBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export interface PlexFonts {
  sansRegular: PDFFont;
  sansMedium: PDFFont;
  monoRegular: PDFFont;
  monoMedium: PDFFont;
}

export async function embedPlexFonts(doc: PDFDocument): Promise<PlexFonts> {
  doc.registerFontkit(fontkit);
  const opts = { subset: true } as const;
  const [sansRegular, sansMedium, monoRegular, monoMedium] = await Promise.all([
    doc.embedFont(toBytes(IBM_PLEX_SANS_REGULAR), opts),
    doc.embedFont(toBytes(IBM_PLEX_SANS_MEDIUM), opts),
    doc.embedFont(toBytes(IBM_PLEX_MONO_REGULAR), opts),
    doc.embedFont(toBytes(IBM_PLEX_MONO_MEDIUM), opts),
  ]);
  return { sansRegular, sansMedium, monoRegular, monoMedium };
}
