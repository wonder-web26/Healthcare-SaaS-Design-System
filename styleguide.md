# Spitex Cockpit · Style Guide

Dieser Style-Guide ist die verbindliche Referenz für alle UI- und UX-Entscheidungen im Spitex Cockpit. Wenn du als Claude Code an einer Komponente arbeitest, lies zuerst diese Datei und richte dich nach den hier dokumentierten Regeln. Bei Unklarheiten halte dich an die "Warum"-Begründungen und entscheide analog.

Wenn diese Datei und die CLAUDE.md sich widersprechen, hat diese Datei für UI-Themen Vorrang, die CLAUDE.md für architektonische und fachliche Themen.

---

## 1 · Designhaltung

Spitex Cockpit ist ein präzises, warmes Werkzeug für erfahrene Pflegeprofis. Es wirkt zeitgenössisch und selbstbewusst, ohne tech-lastig zu sein. Es respektiert die Erfahrung seiner Nutzerinnen, indem es ruhig, lesbar und ohne Spielerei arbeitet.

Die Zielgruppe sind diplomierte Pflegefachpersonen, hauptsächlich Frauen zwischen 25 und 65 Jahren, oft mit wenig täglicher Software-Routine. Das UI muss daher gleichzeitig vertraut wirken (wie moderne Smartphone-Apps) und Klarheit bieten (wie ein gut sortierter Schreibtisch).

### Was wir bewusst vermeiden

- SaaS-Lila als Akzentfarbe (das aktuelle Anthropic-, Linear-, Stripe-Klischee)
- Tech-Bro-Ästhetik (schwarze Hintergründe, Monospace, Terminal-Look)
- Healthcare-App-Süsslichkeit (Pastellfarben, Illustrationen, Material-Bunt)
- Klinische Sterilität (Krankenhaus-Weiss mit blauen Akzenten)
- Drop-Shadows, dramatische Elevation-Effekte, Bouncing-Animationen
- Aufdringliche Mikro-Animationen, die ablenken statt zu führen

### Was wir bewusst tun

- Eine eigene Farbsprache mit hohem Wiedererkennungswert (Malachit)
- Moderne, vertraute Komponenten-Muster (Pill-Buttons, runde Inputs)
- Ruhige, präzise Typografie ohne editorial-grosse Hierarchien
- Klare funktionale Hierarchien (eine Primär-Aktion pro Sektion)
- Hohe Kontraste für Lesbarkeit, niedrige Sättigung für Ruhe

---

## 2 · Farben

Alle Farben werden als CSS-Variablen definiert. Verwende niemals Hex-Codes direkt im Code, immer Variablen.

### Hintergründe

```
--bg-primary: #EFF1F2;       /* Hauptfläche der App */
--bg-elevated: #FFFFFF;      /* Cards, Eingabefelder, Modals */
--bg-secondary: #E5E8EA;     /* Hover-Zustände, Segmented-Control-Track */
--bg-tertiary: #DCE0E2;      /* Sehr selten – stärkerer Hover */
--border-default: #D5D8DA;   /* Standard-Trennlinien und Borders */
--border-strong: #131314;    /* Hover-Borders auf Inputs, dunkle Filter-Chips */
```

### Text

```
--text-primary: #131314;     /* Dark Sky – Haupttext */
--text-secondary: #5A5D5F;   /* Sekundärtext, Labels, Meta-Infos */
--text-tertiary: #8A8E92;    /* Tertiär, Placeholder, deaktiviert */
--text-on-dark: #FFFFFF;     /* Text auf dunklen Hintergründen */
```

### Marke

```
--brand-primary: #1F5C4D;       /* Malachit – Markenfarbe, Primär-Buttons */
--brand-primary-dark: #163F35;  /* Hover-Zustand auf Malachit */
--brand-primary-light: #E0EDEA; /* Hintergrund für Marken-Pills */
--brand-accent: #47AED1;        /* Calm Cerulean – Akzent, Links */
--brand-accent-light: #DCEEF5;  /* Hintergrund für Cerulean-Pills */
```

### Statusfarben

```
--status-danger: #A8321F;        /* Tiefes Rot für Überfällig / Gefahr */
--status-danger-bg: #FCEBEB;     /* Hintergrund für Gefahr-Pills */
--status-warning: #C49A2C;       /* Warmes Ocker für Blockiert / Warnung */
--status-warning-bg: #FAEEDA;    /* Hintergrund für Warnung-Pills */
--status-warning-text: #854F0B;  /* Dunkles Ocker für Text auf hellem Bg */
--status-success: #7A8C5C;       /* Gedämpftes Olivgrün */
--status-success-bg: #EAF0E0;    /* Hintergrund für Erfolg-Pills */
--status-success-text: #4A5C2C;  /* Dunkles Olivgrün für Text */
--status-info: #1A6685;          /* Tiefes Cerulean für Info */
--status-info-bg: #DCEEF5;       /* Hintergrund für Info-Pills */
```

### Verwendungs-Regeln

- Malachit ist die Marken-Signatur. Sparsam einsetzen: Logo, Primär-Buttons, aktive Tab-Underlines, Focus-States bei Inputs
- Calm Cerulean ist der kommunikative Akzent: Links, Info-Pills, Sekundär-Marken-Akzente
- Status-Rot nur für überfällig, Fehler, destruktive Aktionen. Nicht mit Malachit kombinieren in derselben Sicht, wenn vermeidbar
- Status-Ocker für Blockiert, Wartend, Warnung – immer wenn Aufmerksamkeit nötig ist, aber nicht kritisch
- Status-Olivgrün für Erfolg, abgeschlossen, positive Trends. Niemals mit Malachit verwechseln – Malachit ist Marke, Olivgrün ist Erfolg
- Status-Info-Blau für reine Information ohne Wertung, z.B. "In Onboarding"

---

## 3 · Typografie

### Schriftfamilie

Söhne von Klim Type Foundry. Eine moderne Sans-Serif mit schweizerischen Wurzeln. Lizenzpflichtig (ab ca. 120 CHF pro Web-Lizenz von klim.co.nz).

Bis die Lizenz erworben ist, nutze als Fallback Inter über Google Fonts. Inter ist optisch ähnlich genug für die Entwicklung.

```
--font-family: 'Söhne', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### Grössen-Skala

```
--text-h1: 28px;       /* Seitentitel */
--text-h2: 20px;       /* Sektions-Titel */
--text-h3: 16px;       /* Card-Titel, Sub-Sektionen */
--text-body: 14px;     /* Standard-Fliesstext, Listen, Tabellen */
--text-small: 13px;    /* Sekundärtext, Subtitel */
--text-meta: 12px;     /* Meta-Infos, Labels, Pills */
--text-micro: 11px;    /* Sektions-Labels in Versalschrift */
```

### Gewichte

Nur zwei Gewichte verwenden:

```
--weight-regular: 400;
--weight-medium: 500;
```

Niemals 600 oder 700 verwenden – wirkt zu schwer im Cockpit-Kontext.

### Letter-Spacing

```
--tracking-tight: -0.4px;   /* Grosse Überschriften (H1) */
--tracking-normal: 0;       /* Standard */
--tracking-wide: 0.4px;     /* Sektions-Labels in Versalschrift */
--tracking-wider: 0.6px;    /* Mikro-Labels */
```

### Verwendungs-Regeln

- Seitentitel (Patienten, Onboarding): H1, Weight 500, tight tracking
- Sektions-Labels in Versalschrift (HEUTE, ONBOARDING-PIPELINE): text-micro, Weight 400, wider tracking, text-secondary
- Card-Titel: H3, Weight 500
- Fliesstext: body, Weight 400
- Listen-Item-Titel: body, Weight 500
- Listen-Item-Subtitel: small, Weight 400, text-secondary
- Meta-Infos (Datum, Verantwortlich-Kürzel): meta, Weight 400, text-secondary

---

## 4 · Rundungen

Drei Werte – einfach zu merken:

```
--radius-pill: 999px;     /* Alle interaktiven Pills: Buttons, Chips, Status-Pills, Tags, Segmented Control */
--radius-card: 12px;      /* Alle flächigen Container: Cards, Inputs, Sektions-Boxen, Modals, Dropdown-Panels */
--radius-avatar: 50%;     /* Avatare */
--radius-accent: 2px;     /* Linker Akzent-Strich an Cards (vertikal) */
```

### Verwendungs-Regeln

- Alles Interaktive (klickbar, drückbar) bekommt Pill-Form, ausser es ist ein Container für andere Elemente
- Alles Flächige (Container, Eingabe, Anzeige) bekommt 12px
- Niemals Mischwerte wie 4px, 6px, 8px verwenden – das wirkt willkürlich

---

## 5 · Linien und Borders

```
--border-thin: 0.5px;        /* Standard für alle Trennlinien */
--border-thick: 1.5px;       /* Nur für Focus-States auf Inputs */
--border-accent: 2px;        /* Nur für aktive Tab-Underlines */
```

### Verwendungs-Regeln

- Alle Cards, Inputs, Buttons (Outline-Variante), Dropdowns nutzen 0.5px
- Niemals 1px verwenden – wirkt zu schwer
- Niemals 2px verwenden ausser für Tab-Underlines

---

## 6 · Schatten

Keine Schatten verwenden. Hierarchie wird durch Hintergrund-Wechsel und Linien erzeugt, nicht durch Drop-Shadows.

Einzige Ausnahme: Dropdown-Menus und Modal-Overlays bekommen einen sehr subtilen Schatten, damit sie sich vom Hintergrund abheben:

```
--shadow-overlay: 0 4px 16px rgba(19, 19, 20, 0.08);
```

Niemals dramatische Schatten, niemals farbige Schatten, niemals Glow-Effekte.

---

## 7 · Spacing

Verwende nur diese Werte – keine Zwischenwerte:

```
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
```

### Verwendungs-Regeln

- Card-Padding intern: 18–22px (entspricht space-5)
- Sektion-Padding: 32–40px (entspricht space-8 bis space-10)
- Zwischen Listen-Einträgen: 0 (Trennlinie genügt)
- Zwischen Cards: 16px (space-4)
- Inputs untereinander: 20px (space-5)
- Buttons nebeneinander: 12px (space-3)

---

## 8 · Komponenten

### 8.1 Buttons

Alle Buttons sind Pill-förmig (border-radius: 999px).

#### Primär

```
background: var(--brand-primary);
color: var(--text-on-dark);
border: none;
padding: 10px 22px;
font-size: 14px;
font-weight: 500;
border-radius: 999px;
```

Hover: background wechselt auf var(--brand-primary-dark)

Verwendung: Eine Primär-Aktion pro Sektion. Speichern, Erstellen, Senden, Aktivieren. Niemals mehrere Primär-Buttons nebeneinander.

#### Sekundär (Outline)

```
background: var(--bg-elevated);
color: var(--text-primary);
border: 0.5px solid var(--text-primary);
padding: 9.5px 22px;
font-size: 14px;
font-weight: 500;
border-radius: 999px;
```

Hover: background wechselt auf var(--bg-secondary)

Verwendung: Alternative Wege. Abbrechen, Zurück, Schliessen.

#### Tertiär (Text-only)

```
background: transparent;
color: var(--text-primary);
border: none;
padding: 10px 18px;
font-size: 14px;
font-weight: 500;
border-radius: 999px;
```

Hover: background wechselt auf var(--bg-secondary)

Verwendung: Nebensächliche Aktionen. Mehr anzeigen, Details.

#### Icon-only

```
background: var(--bg-elevated);
border: 0.5px solid var(--border-default);
border-radius: 999px;
width: 36px;
height: 36px;
display: flex;
align-items: center;
justify-content: center;
```

Verwendung: Three-Dot-Menüs, einzelne Aktions-Icons in Tabellen.

#### Gefahr (Destruktiv)

```
background: var(--status-danger);
color: var(--text-on-dark);
border: none;
padding: 10px 22px;
font-size: 14px;
font-weight: 500;
border-radius: 999px;
```

Verwendung: Nur für endgültige destruktive Aktionen. Löschen, Permanent entfernen. Niemals für "abbrechen" oder "verwerfen" verwenden.

#### Anna-Akzent (Spezial)

```
background: linear-gradient(135deg, var(--brand-primary), var(--brand-accent));
color: var(--text-on-dark);
border: none;
padding: 10px 22px 10px 18px;
font-size: 14px;
font-weight: 500;
border-radius: 999px;
```

Verwendung: Ausschliesslich für den Anna-Trigger-Button in der Topbar und an anderen Stellen, wo Anna direkt eingebunden ist. Der Gradient ist die einzige Stelle, wo das Cockpit einen Farbverlauf verwendet – sie signiert Anna visuell.

#### Disabled

```
background: transparent;
color: var(--text-tertiary);
cursor: not-allowed;
```

### 8.2 Eingabefelder

Alle Inputs haben border-radius: 12px. Höhe etwa 40px (mit 11px Padding).

```
width: 100%;
padding: 11px 16px;
border: 0.5px solid var(--border-default);
border-radius: 12px;
font-size: 14px;
color: var(--text-primary);
background: var(--bg-elevated);
```

#### Vier States

Default: wie oben.

Hover:
```
border: 0.5px solid var(--border-strong);
```

Focus:
```
border: 1.5px solid var(--brand-primary);
```
Label in Malachit eingefärbt mit font-weight: 500.

Fehler:
```
border: 1.5px solid var(--status-danger);
```
Label und Hilfstext in var(--status-danger).

Erfolg:
```
border: 1.5px solid var(--status-success);
```
Label und Hilfstext in var(--status-success-text).

#### Spezial: Suchfeld

Suchfelder sind voll-pill (border-radius: 999px) und haben links ein Such-Icon.

```
padding: 11px 16px 11px 42px;
border-radius: 999px;
```

Mit einem Such-Icon absolut positioniert links bei left: 16px.

### 8.3 Pills

Alle Pills sind voll-pill (border-radius: 999px).

#### Status-Pills (mit Bullet-Punkt)

```
background: var(--status-{status}-bg);
color: var(--status-{status}-text);
padding: 4px 12px;
font-size: 12px;
font-weight: 500;
border-radius: 999px;
```

Inhalt: ● {Label} (mit Bullet-Punkt davor).

Beispiele:
- Aktiv: Erfolg-Farbschema
- Pausiert: Warnung-Farbschema
- Nicht abrechenbar: Gefahr-Farbschema
- Archiviert: Sekundär-Hintergrund + Sekundärtext
- In Onboarding: Info-Farbschema

#### Kategorie-Tags (ohne Punkt)

```
background: var(--bg-secondary);
color: var(--text-primary);
padding: 3px 12px;
font-size: 12px;
border-radius: 999px;
```

Verwendung: Schweregrad, Qualifikation, Typ-Labels. Neutral, ohne Wertung.

#### Filter-Chips (entfernbar)

```
background: var(--text-primary);
color: var(--text-on-dark);
padding: 6px 10px 6px 14px;
font-size: 12px;
display: inline-flex;
align-items: center;
gap: 8px;
border-radius: 999px;
```

Mit X-Icon rechts (13px Tabler-Icon).

Verwendung: Aktive Filter über einer Liste. Dunkler Hintergrund signalisiert "ich tue gerade etwas".

#### Akzent-Pills

Primär:
```
background: var(--brand-primary);
color: var(--text-on-dark);
padding: 4px 12px;
font-size: 12px;
font-weight: 500;
border-radius: 999px;
```

Sekundär:
```
background: var(--brand-primary-light);
color: var(--brand-primary);
padding: 4px 12px;
font-size: 12px;
font-weight: 500;
border-radius: 999px;
```

Info:
```
background: var(--brand-accent-light);
color: var(--status-info);
padding: 4px 12px;
font-size: 12px;
font-weight: 500;
border-radius: 999px;
```

### 8.4 Tabs

#### Detail-Tabs (unterstrichen)

Container hat border-bottom: 0.5px solid var(--border-default).

Aktiver Tab:
```
padding: 10px 16px;
font-size: 14px;
color: var(--text-primary);
font-weight: 500;
border-bottom: 2px solid var(--brand-primary);
margin-bottom: -1px;
```

Inaktiver Tab:
```
padding: 10px 16px;
font-size: 14px;
color: var(--text-secondary);
font-weight: 400;
```

Verwendung: Verschiedene Sichten auf dasselbe Objekt. Patient-Detail hat Überblick / Anamnese / Dokumente / Tickets / Historie.

#### Segmented Control

Container:
```
background: var(--bg-secondary);
border-radius: 999px;
padding: 3px;
display: inline-flex;
```

Aktiver Segment:
```
background: var(--bg-elevated);
color: var(--text-primary);
border-radius: 999px;
padding: 6px 16px;
font-size: 13px;
font-weight: 500;
```

Inaktiver Segment:
```
background: transparent;
color: var(--text-primary);
border-radius: 999px;
padding: 6px 16px;
font-size: 13px;
font-weight: 400;
```

Verwendung: View-Switches innerhalb einer Liste. Alle / Mir zugewiesen / Mein Team / Erledigt. Im Apple HIG-Stil.

### 8.5 Cards

Alle Cards haben border-radius: 12px und border: 0.5px solid var(--border-default).

#### Metrik-Card

```
background: var(--bg-elevated);
border: 0.5px solid var(--border-default);
border-radius: 12px;
padding: 18px 20px;
```

Inhalt: kleines Label oben (text-meta, text-secondary), grosse Zahl unten (28px, weight 500), kleiner Trend-Text daneben.

#### Aktions-Card (mit linkem Akzent-Strich)

```
background: var(--bg-elevated);
border: 0.5px solid var(--border-default);
border-radius: 12px;
padding: 16px 18px;
display: flex;
align-items: center;
gap: 14px;
```

Linker Strich:
```
width: 4px;
height: 36px;
background: var(--status-{level});
border-radius: 2px;
```

Verwendung: Listen-Items mit visuellem Status-Indikator.

#### Personen-Card (mit Avatar)

```
background: var(--bg-elevated);
border: 0.5px solid var(--border-default);
border-radius: 12px;
padding: 18px 20px;
display: flex;
gap: 14px;
align-items: center;
```

Mit Avatar (40px, rund) links, Name und Subtitel mittig, Chevron rechts (16px Tabler-Icon, text-tertiary).

#### Anna-Empfehlungs-Card

```
background: var(--bg-elevated);
border: 0.5px solid var(--brand-primary);
border-radius: 12px;
padding: 18px 20px;
```

Mit Sparkle-Icon (Tabler ti-sparkles, 16px, Malachit), kleinem Label "ANNA EMPFIEHLT" in Malachit-Versalschrift, Text in Primärtext darunter.

Verwendung: Überall, wo Anna proaktiv etwas vorschlägt. Sofort erkennbar als AI-Akzent.

### 8.6 Avatare

```
width: 40px;
height: 40px;
border-radius: 50%;
display: flex;
align-items: center;
justify-content: center;
font-size: 13px;
font-weight: 500;
```

Hintergrundfarben nach Rolle:
- Pflegefachfrau primär: background var(--brand-primary-light), color var(--brand-primary)
- Pflegefachfrau sekundär: background var(--brand-accent-light), color var(--status-info)
- Koordination: background var(--status-warning-bg), color var(--status-warning-text)
- HR/Admin: background var(--bg-secondary), color var(--text-primary)

Inhalt: Initialen (max. 2 Buchstaben).

Grössen-Varianten:
- Klein: 32px, font-size 12px (in Listen)
- Standard: 40px, font-size 13px (Cards, Detail-Header)
- Gross: 64px, font-size 18px (in Profil-Headers)

### 8.7 Listen-Einträge

Trennlinien zwischen Einträgen (border-bottom: 0.5px solid var(--border-default)), kein Padding zwischen.

Padding pro Eintrag: 14–18px 20–22px.

Bei Klickbarkeit: Hover-Hintergrund var(--bg-secondary). Chevron rechts (16px Tabler).

### 8.8 Icons

Tabler Icons (Outline-Variante). Niemals gefüllte Icons verwenden.

Standard-Grössen:
- 14px: in Pills und sehr kompakten Kontexten
- 16px: in Buttons, neben Texten
- 18px: in der Sidebar-Navigation
- 20px: in Anna-Bereichen, Hervorhebungen

Farbe folgt dem Text-Kontext (vererbt über color: currentColor oder explizit gesetzt).

### 8.9 Linke Sidebar-Navigation

```
width: 56px;
background: var(--bg-secondary);
border-right: 0.5px solid var(--border-default);
padding: 16px 0;
```

Nav-Items: 40x40px quadratisch, Icon-only.

Aktiver Nav-Item:
```
background: var(--text-primary);
color: var(--bg-primary);
```

Inaktiver Nav-Item:
```
background: transparent;
color: var(--text-secondary);
```

Logo oben: 32x32px, var(--brand-primary) Hintergrund, weisser Buchstabe.

---

## 9 · Anna – AI-Assistent

Anna lebt in einer rechten Sidebar (~400px breit), die mit dem Anna-Trigger-Button in der Topbar geöffnet wird.

### Visuelle Signatur

- Anna-Trigger-Button: Pill mit Malachit-zu-Cerulean-Gradient
- Anna-Empfehlungs-Cards: weisser Hintergrund mit Malachit-Border und Sparkle-Icon
- Anna-Sidebar-Header: Sparkle-Icon plus Name "Anna" in Malachit-Farbe

Anna ist die einzige Komponente im Cockpit, die einen Gradient verwendet. Damit wird sie sofort erkennbar als AI-Element, ohne dass weitere visuelle Tricks nötig sind.

---

## 10 · Migration vom bestehenden System

Das Cockpit nutzt aktuell ein anderes Farbsystem (Lila-basiert). Beim Umbau einzelner Komponenten:

1. Niemals "Lila lassen, aber etwas Malachit dazumischen". Eine Komponente wird vollständig in das neue System überführt oder gar nicht
2. Vorher die abhängigen Komponenten identifizieren. Wenn die Patienten-Liste neu gemacht wird, müssen auch die Filter-Chips, Status-Pills, Detail-Pane konsistent neu gemacht werden
3. CSS-Variablen zuerst. Das globale Stylesheet wird als erstes auf das neue System umgestellt. Komponenten greifen dann auf die neuen Variablen zu

### Reihenfolge der Migration

Empfohlene Reihenfolge:
1. CSS-Variablen-Datei mit allen neuen Werten erstellen
2. Globale Komponenten (Buttons, Inputs, Pills) auf neue Werte umstellen
3. Linke Sidebar-Navigation auf neue Werte umstellen
4. Topbar auf neue Werte umstellen (inkl. Anna-Trigger-Button)
5. Dashboard im neuen Stil umsetzen
6. Listen-Ansichten (Patienten, Angehörige, Onboarding, Pendenzen)
7. Detail-Ansichten
8. Anna-Sidebar
9. Spezialdialoge (Spezialbewilligung, Onboarding-Schritte)

---

## 11 · Verbotene Muster

Diese Dinge sollen nicht im Cockpit auftauchen:

- Lila als Akzentfarbe (auch nicht für "AI-Elemente")
- Drop-Shadows auf Cards oder Buttons
- Gefüllte Icons (Filled-Variante von Tabler oder Material)
- Mehr als zwei Schriftgewichte (Regular und Medium)
- Schriftgewichte 600 oder 700
- Rundungswerte zwischen 0 und 12px ausser bei Avataren
- Animationen mit Bounce, Spring oder Wackel-Effekten
- Bunte Pills mit Sättigung über 30 Prozent
- Mehrere Primär-Buttons nebeneinander
- Buttons ohne Pill-Form
- Detail-Pane-Inhalte ohne klare Hierarchie

---

## 12 · Bei Unklarheiten

Wenn dieser Style-Guide eine Frage nicht beantwortet:

1. Schaue, ob es eine analoge Komponente gibt, deren Verhalten übertragbar ist
2. Folge der Designhaltung in Sektion 1: ruhig, präzise, vertraut, selbstbewusst
3. Im Zweifel weniger ist mehr: weniger Farben, weniger Animationen, weniger Details
4. Frage nach, bevor du eine grosse Designentscheidung allein triffst

---

Letzte Aktualisierung: Mai 2026
Version: 1.0