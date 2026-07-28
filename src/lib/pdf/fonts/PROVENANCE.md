# Vendored fonts — provenance

The generated documents embed IBM Plex. The font files are **project assets**,
not an npm dependency (no package is installed for them).

## Fonts

| Family / weight | Vendored module | Source (downloaded 27.07.2026) | SHA-256 of the original .ttf |
|---|---|---|---|
| IBM Plex Sans, Regular | `sans-regular.ts` | unpkg.com/@ibm/plex@5.1.3/IBM-Plex-Sans/fonts/complete/ttf/IBMPlexSans-Regular.ttf | `208607f209c1277f4e998624d163d4a5c8c562ddc48bdadbb4393e21c21772da` |
| IBM Plex Sans, Medium | `sans-medium.ts` | …/IBMPlexSans-Medium.ttf | `42c54a359ebc298eada2b3e06a4ef722631484a91eb8febc27dfd967c8157e65` |
| IBM Plex Mono, Regular | `mono-regular.ts` | unpkg.com/@ibm/plex@5.1.3/IBM-Plex-Mono/fonts/complete/ttf/IBMPlexMono-Regular.ttf | `0b1292004f8bc6ff82d4490820e01e42cf839248822c0b9835aa795a8235f79c` |
| IBM Plex Mono, Medium | `mono-medium.ts` | …/IBMPlexMono-Medium.ttf | `50f39f344a345d637f34531e47454a1c2ac5f432325a861f0f485e24d74568a6` |

Each `*.ts` module holds the base64 of the original `.ttf` above. Decode and
compare against the SHA-256 to verify no tampering.

## License

IBM Plex is licensed under the **SIL Open Font License, Version 1.1** — full
text in `OFL.txt` (Copyright © 2017 IBM Corp., Reserved Font Name "Plex").
The OFL explicitly permits embedding: the license grants the right to
"…use, study, copy, merge, **embed**, modify, redistribute…" the Font Software,
and states the fonts "…can be bundled, **embedded**, redistributed and/or sold…".
Embedding into generated PDF documents is therefore covered.

## Font engine

pdf-lib cannot embed a custom font without a fontkit instance. `@pdf-lib/fontkit`
is vendored as a self-contained UMD bundle at `../vendor/fontkit.js (ESM wrapper around the UMD)`
(SHA-256 `d8df561b9fba98e24f2e5130e40948809281bbbc55a20c412359f1a0a5eb35a6`,
downloaded from cdn.jsdelivr.net/npm/@pdf-lib/fontkit/dist/fontkit.umd.min.js).
It is a build artifact of `@pdf-lib/fontkit` (MIT). No npm package is installed;
the bundle is imported as a project file. The only reference to `iconv-lite`
inside it sits in a `console.error` string (legacy-encoding path, unreachable for
TrueType), so no external module is required at runtime.
