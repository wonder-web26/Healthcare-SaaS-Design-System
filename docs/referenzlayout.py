# Reference implementation of the document layout.
#
# NOT product code. This is the authoritative source for every measurement,
# spacing value, line weight and drawing operation used in
# Arbeitskontrolle_Referenzlayout.pdf.
#
# The product generates its PDFs with pdf-lib in TypeScript. This script exists
# so those measurements can be translated exactly rather than inferred from
# prose. Where this script and docs/dokument-gestaltung.md disagree, the script
# is correct for numbers, the markdown is correct for intent.
#
# Sample values are invented. They deliberately show all three assessment
# states: rated, not assessable, not recorded.
#
# Run: python3 referenzlayout.py   (requires reportlab and IBM Plex TTFs)

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

MM = 72 / 25.4
PW, PH = A4

ML, MR, MT, MB = 22 * MM, 15 * MM, 18 * MM, 16 * MM
X0 = ML
X1 = PW - MR
W = X1 - X0

INK = (0.10, 0.10, 0.10)
SEC = (0.42, 0.42, 0.42)
MUT = (0.60, 0.60, 0.60)
HAIR = (0.82, 0.82, 0.82)
BOXL = (0.66, 0.66, 0.66)

B = "fonts/IBM-Plex-Sans/"
M = "fonts/IBM-Plex-Mono/"
pdfmetrics.registerFont(TTFont("Plex", B + "IBMPlexSans-Regular.ttf"))
pdfmetrics.registerFont(TTFont("PlexM", B + "IBMPlexSans-Medium.ttf"))
pdfmetrics.registerFont(TTFont("Mono", M + "IBMPlexMono-Regular.ttf"))
pdfmetrics.registerFont(TTFont("MonoM", M + "IBMPlexMono-Medium.ttf"))

DOC = {
    "org": "Spitex Kaufmann AG",
    "title": "Arbeitskontrolle",
    "sub": "Qualitätskontrolle pflegende Angehörige",
    "kennung": "AK-2026-AAQI",
    "status": "Abgeschlossen",
    "art": "Reguläre Kontrolle",
    "mitarbeiterin": "Müller, Sarah",
    "fallfuehrende": "Weber, Sandra",
    "patient": "Müller, Anna",
    "datum": "28.07.2026",
    "intervall": "alle 3 Monate",
    "erstellt": "28.07.2026 08:00",
}

ZIEL = ("Ziel ist die Qualität der Arbeitsweise samt Einhaltung der fachlichen "
        "Instruktionen zu überprüfen, Verbesserungen zu finden und die Qualität zu erhöhen.")

SKALA = [("1", "ungenügend"), ("2", "genügend"), ("3", "genügend bis gut"),
         ("4", "gut"), ("5", "gut bis sehr gut"), ("6", "sehr gut")]

BLOCKS = [
    ("01", "Wurden die pflegerischen Massnahmen fachgerecht und vollständig ausgeführt?",
     [("fachgerecht", 5), ("vollständig (lt Pflegeplanung)", 4)],
     "Wundversorgung sauber und nach Anleitung ausgeführt."),
    ("02", "Wurden die Massnahmen und Wirkung der Massnahmen klar und verständlich in der "
           "Pflegedokumentation beschrieben?",
     [("Massnahmen vollständig angeführt", 5),
      ("Wirkung klar und verständlich beschrieben", 4),
      ("Die Klientin wurde an die Einnahme der Medikamente erinnert", "nb")],
     "Medikamentenabgabe erfolgt über den Spitex-Dienst, daher nicht beurteilbar."),
    ("03", "Wurden Auffälligkeiten (Klient:in) in den Bericht geschrieben und erfolgte eine "
           "sofortige Meldung dieser?",
     [("Auffälligkeiten dokumentiert", 6), ("Auffälligkeiten gemeldet", 5)],
     "keine"),
    ("04", "Wurden die Hygienevorschriften eingehalten?",
     [("Hände Desinfektion", 5), ("Flächen Desinfektion", 5), ("Schutzmassnahmen", 4),
      ("Kleidung", None), ("Entsorgung von Abfällen", 5)],
     "Kleidung nicht beobachtet, Einsatz bei Eintreffen bereits beendet."),
    ("05", "War der Umgang mit der Klient:in und dem sozialen Umfeld respektvoll?",
     [("Klient:in", 6), ("Soziales Umfeld", 6)],
     "keine"),
]

FREITEXT = [
    ("Welche Verbesserungen wären zielführend?",
     "Dokumentation der Wirkung könnte konkreter formuliert werden. Beispiele wurden besprochen."),
    ("Wurden Vorschläge von der Klient:in, der Mitarbeiter:in oder der Fallführenden gemacht?",
     "Klientin wünscht früheren Einsatzbeginn am Morgen. An die Einsatzplanung weitergeleitet."),
    ("Gibt es Vorschläge für eine mögliche Fehlervermeidung?",
     "Kurzcheckliste Hygiene im Dossier hinterlegen."),
]

MELDUNGEN = [("Geschäftsleitung", "28.07.2026, 07:59 Uhr"),
             ("Leitung Pflege", "28.07.2026, 07:59 Uhr")]

UNTER = [("Fallführende", "Beurteilung", "Weber, Sandra", "28.07.2026",
          "Ich bestätige die Durchführung und Richtigkeit dieser Arbeitskontrolle."),
         ("Mitarbeiter:in", "Kenntnisnahme", "Müller, Sarah", "28.07.2026",
          "Ich bestätige den Erhalt dieser Beurteilung. Die Unterschrift bestätigt die "
          "Kenntnisnahme, nicht die Zustimmung.")]

CRIT_W = 232.0
CELL_W = 30.0
CX0 = X0 + CRIT_W
GUT = X1 - (CX0 + 7 * CELL_W)


def wrap(txt, font, size, width):
    words, lines, cur = txt.split(), [], ""
    for wd in words:
        t = (cur + " " + wd).strip()
        if pdfmetrics.stringWidth(t, font, size) <= width:
            cur = t
        else:
            if cur:
                lines.append(cur)
            cur = wd
    if cur:
        lines.append(cur)
    return lines



def spaced(c, x, y, txt, font, size, tracking, rgb):
    c.setFont(font, size)
    c.setFillColorRGB(*rgb)
    for ch in txt:
        c.drawString(x, y, ch)
        x += pdfmetrics.stringWidth(ch, font, size) + tracking
    return x


class Doc:
    def __init__(self, path, total=None):
        self.c = canvas.Canvas(path, pagesize=A4)
        self.c.setTitle("Arbeitskontrolle " + DOC["kennung"])
        self.total = total
        self.page = 0
        self.y = 0
        self.new_page(first=True)

    def new_page(self, first=False):
        if not first:
            self.footer()
            self.c.showPage()
        self.page += 1
        self.y = PH - MT
        if first:
            self.masthead()
        else:
            self.runhead()

    def masthead(self):
        c = self.c
        spaced(c, X0, self.y - 7, DOC["org"].upper(), "PlexM", 7, 1.6, SEC)
        c.setFillColorRGB(*INK)
        c.setFont("PlexM", 17)
        c.drawString(X0, self.y - 28, DOC["title"])
        c.setFillColorRGB(*SEC)
        c.setFont("Plex", 8.5)
        c.drawString(X0, self.y - 40, DOC["sub"])
        c.setFillColorRGB(*INK)
        c.setFont("MonoM", 11)
        c.drawRightString(X1, self.y - 28, DOC["kennung"])
        self.y -= 52
        c.setStrokeColorRGB(*INK)
        c.setLineWidth(0.9)
        c.line(X0, self.y, X1, self.y)
        c.setStrokeColorRGB(*HAIR)
        c.setLineWidth(0.35)
        c.line(X0, self.y - 2.6, X1, self.y - 2.6)
        self.y -= 18

    def runhead(self):
        c = self.c
        c.setFillColorRGB(*SEC)
        c.setFont("PlexM", 8)
        c.drawString(X0, self.y - 8, DOC["title"])
        c.setFont("Mono", 8)
        c.drawRightString(X1, self.y - 8, DOC["kennung"])
        self.y -= 14
        c.setStrokeColorRGB(*HAIR)
        c.setLineWidth(0.35)
        c.line(X0, self.y, X1, self.y)
        self.y -= 20

    def footer(self):
        if self.total is None:
            return
        c = self.c
        yb = MB + 12
        c.setStrokeColorRGB(*HAIR)
        c.setLineWidth(0.35)
        c.line(X0, yb, X1, yb)
        c.setFillColorRGB(*MUT)
        c.setFont("Plex", 7)
        c.drawString(X0, yb - 9, DOC["mitarbeiterin"] + "  ·  erstellt " + DOC["erstellt"])
        c.drawRightString(X1, yb - 9, "Seite %d von %d" % (self.page, self.total))

    def space(self, h):
        if self.y - h < MB + 26:
            self.new_page()

    def status_row(self):
        c = self.c
        tw = pdfmetrics.stringWidth(DOC["status"].upper(), "PlexM", 7) + 2 * 1.0 * 6
        bw = tw + 12
        c.setStrokeColorRGB(*INK)
        c.setLineWidth(0.5)
        c.rect(X0, self.y - 13, bw, 15, stroke=1, fill=0)
        spaced(c, X0 + 6, self.y - 8.5, DOC["status"].upper(), "PlexM", 7, 1.0, INK)
        c.setFillColorRGB(*SEC)
        c.setFont("Plex", 8.5)
        c.drawString(X0 + bw + 10, self.y - 8.5, DOC["datum"] + "  ·  " + DOC["art"])
        self.y -= 26

    def meta(self):
        c = self.c
        rows = [(("Mitarbeiter:in", DOC["mitarbeiterin"]), ("Fallführende", DOC["fallfuehrende"])),
                (("Besuchter Patient", DOC["patient"]), ("Datum der Kontrolle", DOC["datum"]))]
        cw = W / 2.0
        lw = 92.0
        for left, right in rows:
            c.setStrokeColorRGB(*HAIR)
            c.setLineWidth(0.35)
            c.line(X0, self.y, X1, self.y)
            self.y -= 13
            for i, (lab, val) in enumerate((left, right)):
                bx = X0 + i * cw
                c.setFillColorRGB(*MUT)
                c.setFont("Plex", 7.5)
                c.drawString(bx, self.y, lab)
                c.setFillColorRGB(*INK)
                c.setFont("Plex", 9)
                c.drawString(bx + lw, self.y, val)
            self.y -= 7
        c.setStrokeColorRGB(*HAIR)
        c.line(X0, self.y, X1, self.y)
        self.y -= 13
        c.setFillColorRGB(*MUT)
        c.setFont("Plex", 7.5)
        c.drawString(X0, self.y, "Kontrollintervall")
        c.setFillColorRGB(*INK)
        c.setFont("Plex", 9)
        c.drawString(X0 + lw, self.y, DOC["intervall"])
        vw = pdfmetrics.stringWidth(DOC["intervall"], "Plex", 9)
        c.setFillColorRGB(*MUT)
        c.setFont("Plex", 7.5)
        c.drawString(X0 + lw + vw + 8, self.y, "organisationsinterne Vorgabe, keine gesetzliche")
        self.y -= 7
        c.setStrokeColorRGB(*HAIR)
        c.line(X0, self.y, X1, self.y)
        self.y -= 20

    def ziel(self):
        c = self.c
        lines = wrap(ZIEL, "Plex", 8.5, W - 14)
        h = len(lines) * 11
        c.setStrokeColorRGB(*BOXL)
        c.setLineWidth(1.2)
        c.line(X0 + 0.6, self.y + 2, X0 + 0.6, self.y - h + 6)
        c.setFillColorRGB(*SEC)
        c.setFont("Plex", 8.5)
        for i, ln in enumerate(lines):
            c.drawString(X0 + 12, self.y - i * 11, ln)
        self.y -= h + 12

    def legend(self):
        c = self.c
        x, y = X0, self.y
        c.setFont("Plex", 7.5)
        for code, mean in SKALA:
            c.setFillColorRGB(*INK)
            c.setFont("MonoM", 7.5)
            c.drawString(x, y, code)
            x += 9
            c.setFillColorRGB(*SEC)
            c.setFont("Plex", 7.5)
            c.drawString(x, y, mean)
            x += pdfmetrics.stringWidth(mean, "Plex", 7.5) + 16
        y -= 11
        c.setFillColorRGB(*INK)
        c.setFont("MonoM", 7.5)
        c.drawString(X0, y, "n.b.")
        c.setFillColorRGB(*SEC)
        c.setFont("Plex", 7.5)
        c.drawString(X0 + 20, y, "kann ich nicht beurteilen")
        x2 = X0 + 20 + pdfmetrics.stringWidth("kann ich nicht beurteilen", "Plex", 7.5) + 16
        c.setFillColorRGB(*INK)
        c.setFont("MonoM", 7.5)
        c.drawString(x2, y, "n.e.")
        c.setFillColorRGB(*SEC)
        c.setFont("Plex", 7.5)
        c.drawString(x2 + 20, y, "nicht erfasst")
        self.y = y - 18

    def summary(self):
        vals = [v for _, _, crits, _ in BLOCKS for _, v in crits]
        n = len(vals)
        rated = len([v for v in vals if isinstance(v, int)])
        nb = len([v for v in vals if v == "nb"])
        ne = len([v for v in vals if v is None])
        c = self.c
        c.setFillColorRGB(0.965, 0.965, 0.965)
        c.rect(X0, self.y - 26, W, 30, stroke=0, fill=1)
        items = [("Kriterien", str(n)), ("Bewertet", str(rated)),
                 ("Nicht beurteilbar", str(nb)), ("Nicht erfasst", str(ne))]
        cw = W / 4.0
        for i, (lab, val) in enumerate(items):
            bx = X0 + i * cw + 12
            c.setFillColorRGB(*MUT)
            c.setFont("Plex", 7)
            c.drawString(bx, self.y - 8, lab.upper())
            c.setFillColorRGB(*INK)
            c.setFont("MonoM", 13)
            c.drawString(bx, self.y - 22, val)
            if i:
                c.setStrokeColorRGB(*HAIR)
                c.setLineWidth(0.35)
                c.line(X0 + i * cw, self.y - 22, X0 + i * cw, self.y + 0)
        self.y -= 42

    def cell(self, cx, cy, state):
        c = self.c
        s = 8.6
        x, y = cx - s / 2, cy - s / 2
        if state == "on":
            c.setFillColorRGB(*INK)
            c.setStrokeColorRGB(*INK)
            c.setLineWidth(0.9)
            c.rect(x, y, s, s, stroke=1, fill=1)
            c.setFillColorRGB(1, 1, 1)
            c.setFont("PlexM", 7)
            c.drawCentredString(cx, cy - 2.4, "×")
        elif state == "dash":
            c.setStrokeColorRGB(*BOXL)
            c.setLineWidth(0.4)
            c.setDash(1.2, 1.2)
            c.rect(x, y, s, s, stroke=1, fill=0)
            c.setDash()
        else:
            c.setStrokeColorRGB(*BOXL)
            c.setLineWidth(0.4)
            c.rect(x, y, s, s, stroke=1, fill=0)

    def block_height(self, q, crits, note):
        h = len(wrap(q, "PlexM", 9.5, W - 26)) * 12 + 8
        h += 12
        for name, _ in crits:
            h += max(16, len(wrap(name, "Plex", 8.5, CRIT_W - 10)) * 11 + 5)
        h += 8 + len(wrap(note, "Plex", 8.5, W - 4)) * 11 + 12
        return h

    def block(self, num, q, crits, note):
        self.space(self.block_height(q, crits, note))
        c = self.c
        c.setFillColorRGB(*MUT)
        c.setFont("MonoM", 8.5)
        c.drawString(X0, self.y, num)
        qls = wrap(q, "PlexM", 9.5, W - 26)
        c.setFillColorRGB(*INK)
        c.setFont("PlexM", 9.5)
        for i, ln in enumerate(qls):
            c.drawString(X0 + 22, self.y - i * 12, ln)
        self.y -= len(qls) * 12 + 8
        c.setFillColorRGB(*MUT)
        c.setFont("Plex", 7)
        for i in range(6):
            c.drawCentredString(CX0 + i * CELL_W + CELL_W / 2, self.y, str(i + 1))
        c.drawCentredString(CX0 + 6 * CELL_W + CELL_W / 2, self.y, "n.b.")
        self.y -= 5
        for name, val in crits:
            nls = wrap(name, "Plex", 8.5, CRIT_W - 10)
            rh = max(16, len(nls) * 11 + 5)
            c.setStrokeColorRGB(*HAIR)
            c.setLineWidth(0.35)
            c.line(X0, self.y, X1, self.y)
            cy = self.y - rh / 2
            c.setFillColorRGB(*INK)
            c.setFont("Plex", 8.5)
            ty = self.y - 11 if len(nls) == 1 else self.y - 10
            for i, ln in enumerate(nls):
                c.drawString(X0, ty - i * 11, ln)
            for i in range(6):
                st = "on" if val == i + 1 else "off"
                self.cell(CX0 + i * CELL_W + CELL_W / 2, cy, st)
            self.cell(CX0 + 6 * CELL_W + CELL_W / 2, cy, "on" if val == "nb" else "dash")
            if val is None:
                c.setFillColorRGB(*MUT)
                c.setFont("Mono", 7)
                c.drawRightString(X1, cy - 2.5, "n.e.")
            self.y -= rh
        c.setStrokeColorRGB(*HAIR)
        c.line(X0, self.y, X1, self.y)
        self.y -= 12
        spaced(c, X0, self.y, "ANMERKUNGEN", "Plex", 7, 0.8, MUT)
        nls = wrap(note, "Plex", 8.5, W - 4)
        c.setFillColorRGB(*INK if note != "keine" else MUT)
        c.setFont("Plex", 8.5)
        for i, ln in enumerate(nls):
            c.drawString(X0, self.y - 11 - i * 11, ln)
        self.y -= 11 + len(nls) * 11 + 18

    def section(self, title):
        self.space(40)
        c = self.c
        c.setStrokeColorRGB(*INK)
        c.setLineWidth(0.7)
        c.line(X0, self.y + 12, X1, self.y + 12)
        c.setFillColorRGB(*INK)
        c.setFont("PlexM", 9.5)
        c.drawString(X0, self.y, title)
        self.y -= 16

    def freitext(self):
        self.section("Verbesserungen und Vorschläge")
        c = self.c
        for q, a in FREITEXT:
            als = wrap(a, "Plex", 8.5, W - 4)
            self.space(14 + len(als) * 11 + 12)
            c.setFillColorRGB(*MUT)
            c.setFont("Plex", 7.5)
            for i, ln in enumerate(wrap(q, "Plex", 7.5, W)):
                c.drawString(X0, self.y - i * 10, ln)
            self.y -= len(wrap(q, "Plex", 7.5, W)) * 10 + 3
            c.setFillColorRGB(*INK)
            c.setFont("Plex", 8.5)
            for i, ln in enumerate(als):
                c.drawString(X0, self.y - i * 11, ln)
            self.y -= len(als) * 11 + 12

    def meldungen(self):
        self.section("Meldungen")
        c = self.c
        cw = W / 2.0
        c.setStrokeColorRGB(*HAIR)
        c.setLineWidth(0.35)
        c.line(X0, self.y + 4, X1, self.y + 4)
        for i, (who, when) in enumerate(MELDUNGEN):
            bx = X0 + i * cw
            c.setFillColorRGB(*MUT)
            c.setFont("Plex", 7.5)
            c.drawString(bx, self.y - 9, who)
            c.setFillColorRGB(*INK)
            c.setFont("Plex", 9)
            c.drawString(bx + 92, self.y - 9, when)
        self.y -= 17
        c.setStrokeColorRGB(*HAIR)
        c.line(X0, self.y, X1, self.y)
        self.y -= 22

    def unterschriften(self):
        self.space(120)
        self.section("Unterschriften")
        c = self.c
        for role, kind, name, dat, txt in UNTER:
            tls = wrap(txt, "Plex", 7.5, W - 4)
            c.setStrokeColorRGB(*HAIR)
            c.setLineWidth(0.35)
            c.line(X0, self.y + 4, X1, self.y + 4)
            c.setFillColorRGB(*INK)
            c.setFont("PlexM", 9)
            c.drawString(X0, self.y - 9, role)
            wr = pdfmetrics.stringWidth(role, "PlexM", 9)
            c.setFillColorRGB(*MUT)
            c.setFont("Plex", 8)
            c.drawString(X0 + wr + 7, self.y - 9, kind)
            c.setFillColorRGB(*INK)
            c.setFont("Plex", 9)
            c.drawString(X0 + 232, self.y - 9, name)
            c.drawRightString(X1, self.y - 9, dat)
            self.y -= 21
            c.setFillColorRGB(*SEC)
            c.setFont("Plex", 7.5)
            for i, ln in enumerate(tls):
                c.drawString(X0, self.y - i * 10, ln)
            self.y -= len(tls) * 10 + 14
        c.setStrokeColorRGB(*HAIR)
        c.setLineWidth(0.35)
        c.line(X0, self.y + 6, X1, self.y + 6)


def build(path, total=None):
    d = Doc(path, total)
    d.status_row()
    d.meta()
    d.ziel()
    d.legend()
    d.summary()
    for num, q, crits, note in BLOCKS:
        d.block(num, q, crits, note)
    d.freitext()
    d.meldungen()
    d.unterschriften()
    n = d.page
    d.footer()
    d.c.showPage()
    d.c.save()
    return n


total = build("/tmp/pass1.pdf")
build("/mnt/user-data/outputs/Arbeitskontrolle_Referenzlayout.pdf", total)
print("Seiten gesamt:", total)
