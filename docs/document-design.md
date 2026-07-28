# Document template — design specification

Applies to every PDF the product generates: Arbeitskontrolle, the planned
interRAI export, Schulungsnachweis. Reference output:
`Arbeitskontrolle_Referenzlayout.pdf`. Exact measurements:
`referenzlayout.py`.

**Language note.** This specification is in English. Everything the document
*prints* stays in German and is never translated — headings, labels, scale
meanings, `ANMERKUNGEN`, `ABGESCHLOSSEN`, `ENTWURF`, `n.b.`, `n.e.`,
`Seite n von m`. German literals in this document are the actual output
strings.

---

## Principles

1. **Every piece of information appears once per page.** The reference number
   lives in the header, administrative data in the footer. The same fact is
   never printed twice on one page.
2. **Monochrome.** Black, two greys, one hairline grey. These documents get
   photocopied and scanned; colour on a supervisory document reads as
   marketing.
3. **Everything aligns left to one axis.** Nothing centred. Column positions
   are identical across all pages.
4. **Hierarchy through typography, not boxes.** Hairlines instead of frames,
   whitespace instead of borders.
5. **Every page identifies itself.** If a sheet gets separated from the file,
   the footer says where it belongs.
6. **No logos.** Neither the organisation's nor the software vendor's.

---

## Page

| | |
|---|---|
| Size | A4 portrait |
| Margin left | 22 mm (allows hole-punching and filing) |
| Margin right | 15 mm |
| Margin top | 18 mm |
| Margin bottom | 16 mm |
| Text width | 173 mm |

---

## Type

IBM Plex Sans and IBM Plex Mono, regular and medium weight, SIL Open Font
License. Embedded as project files, not as a package dependency.

| Use | Face | Size |
|---|---|---|
| Organisation name in header | Plex Sans Medium, caps, tracking 1.6 | 7 pt |
| Document title | Plex Sans Medium | 17 pt |
| Subtitle | Plex Sans | 8.5 pt |
| Reference number in header | Plex Mono Medium | 11 pt |
| Section and block heading | Plex Sans Medium | 9.5 pt |
| Block number | Plex Mono Medium | 8.5 pt |
| Values in metadata grid | Plex Sans | 9 pt |
| Body text, table cells | Plex Sans | 8.5 pt |
| Field labels | Plex Sans | 7.5 pt |
| Column headers, abbreviations | Plex Sans / Mono | 7 pt |
| Footer | Plex Sans | 7 pt |

Reference numbers, block numbers and abbreviations are set in Mono. That is the
detail that marks the document as system output rather than a filled-in form.

---

## Colour

| Role | Value |
|---|---|
| Text | 10 % grey (not pure black) |
| Secondary text | 42 % grey |
| Labels, abbreviations | 60 % grey |
| Hairlines | 82 % grey |
| Empty checkbox border | 66 % grey |
| Summary panel fill | 96.5 % grey |

---

## Header

**Page 1**
Stacked at left: organisation name in tracked caps, document title, subtitle.
Right, aligned to the title baseline: the reference number in Mono.
Below, a heavy rule (0.9 pt) and 2.6 pt beneath it a hairline (0.35 pt). This
double rule is the only decorative element in the document.

**Continuation pages**
Document title at left, reference number at right, both small. A hairline
below. No organisation name, no subtitle, no page number.

---

## Status line

A thin-bordered label with tracked caps: `ABGESCHLOSSEN` or `ENTWURF`. Beside
it, in secondary grey, the date and the type of the record.

Draft state is carried by this label and a note in the footer — nothing else.
No page frame, no watermark, no colour.

---

## Metadata grid

Two columns, each half the text width. Within each column the label starts at
the column edge and the value 92 pt further right, so every value sits on one
of two fixed positions.

Hairlines between rows, and above the first and below the last. Labels 7.5 pt
in label grey, values 9 pt in text colour.

A value that carries a qualifier spans the full width: value in text colour,
qualifier immediately after it in label grey.

---

## Quoted paragraph

Purpose statement or comparable reference text: secondary grey, indented 12 pt,
with a vertical rule at the left edge spanning the height of the paragraph.

---

## Legend

Scale values flow in one line: value in Mono Medium, meaning in secondary grey,
16 pt between entries. A second line carries the abbreviations `n.b.` and
`n.e.`

Appears **once** in the document, immediately before the first block. Never
under an individual block and never pinned to the page foot.

---

## Completeness summary

A tinted panel across the full text width, four fields separated by rules:
number of criteria, of which rated, not assessable, not recorded. Label in
7 pt caps above, figure in 13 pt Mono Medium below.

Purpose: a reviewer sees completeness before reading the first table.

**Arithmetic only, never interpretation.** No mean, no grade, no rating. Such
figures are clinical statements and require clinical sign-off.

---

## Assessment table

Heading: two-digit block number in Mono, question 22 pt to its right.

| Column | Width |
|---|---|
| Criterion | 232 pt |
| Values 1 to 6 | 30 pt each |
| Not assessable | 30 pt |
| Note column at right | remainder |

Column headers 7 pt in label grey. A hairline above every row and below the
last. No vertical rules. Minimum row height 16 pt; multi-line criterion names
grow the row.

**Cell states**

| State | Rendering |
|---|---|
| Not selected | 8.6 pt square, 0.4 pt border |
| Selected | filled square, 0.9 pt border, knocked-out cross |
| "Not assessable" column, not selected | dashed border |
| Row with no mark at all | `n.e.` in Mono at the far right of the row |

The selected cell carries three signals — fill, heavier border, glyph. A mark
distinguished by colour alone does not survive photocopying or scanning.

The dashed border marks that this column does not sit on the scale.

---

## Comment field

Below every table. Label `ANMERKUNGEN` in tracked 7 pt caps, text beneath. If
nothing was entered, print `keine` in label grey. The field is never omitted —
an empty comment and an unasked question must remain distinguishable.

---

## Sections

A heavy rule (0.7 pt) across the text width, section name below it in 9.5 pt
Medium.

**Question-and-answer sections:** question as a label in 7.5 pt label grey,
answer beneath in 8.5 pt text colour. Question and answer are never merged into
one paragraph.

**Signature block:** one row per signature — role in Medium, nature of the
confirmation after it in grey, name at a fixed position, date right-aligned.
The confirmed wording sits beneath in 7.5 pt secondary grey. A hairline above
each signature and below the last.

The confirmed wording is stored and printed, not merely displayed on screen.
The distinction between assessment and acknowledgement carries legal weight.

---

## Footer

A hairline across the text width, below it 7 pt in label grey: name of the
person concerned and creation timestamp at left, `Seite n von m` at right. In
draft state, the note `Entwurf, nicht abgeschlossen` is added at left.

The reference number does **not** appear in the footer — it sits in the header
of every page.

---

## Pagination

- A block is measured as a whole: heading, column header, all rows, comment
  field. If it does not fit, it starts on the next page.
- A heading never stands alone at the foot of a page.
- A comment field is never separated from its table.
- The signature block is never split.
- If a table does cross a page break, its column header repeats.
- The total page count is resolved in a second pass, once the number of pages
  is known.

---

## Fidelity to the customer's form

Questions, criteria and scale meanings are taken **verbatim** from the
customer's template, including capitalisation and any inconsistent spellings
the original contains.

Any change to that wording is a deviation and belongs in `abweichungen.md`
before it is implemented, with an owner and a status.

---

## Deliberately absent

| | Reason |
|---|---|
| Checksum or hash | Not verifiable without a persistence layer; an assurance that cannot be checked is worse than none |
| Sequential numbering | Implies a gapless series that does not exist without a database. The reference is an identifier, not a number |
| Signature image | Carries no independent evidential weight; the process record does |
| Means, grades, ratings | Clinical statements, require clinical sign-off |
| Logos | A vendor logo on a supervisory document reads wrong; an organisation logo needs an image file per tenant |
