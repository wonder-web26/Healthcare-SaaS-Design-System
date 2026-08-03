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

### Beschriftungen: kein Kürzen mit Auslassungspunkten (produktweit, verbindlich)

Beschriftungen werden **nie** mit Auslassungspunkten (`…`, `text-overflow: ellipsis`,
`truncate`, `line-clamp`) gekürzt. Reicht der Platz nicht, **bricht der Text auf
mehrere Zeilen um** (`overflow-wrap`/normaler Umbruch). Die Regel gilt für **alle
Module**, nicht nur dort, wo sie bisher ausdrücklich genannt wurde.

Konsequenz für die Umsetzung: Container werden an den **längsten tatsächlichen
Werten** bemessen (nicht an kurzen Mockup-Beispielen). Ist eine feste Breite nötig,
wird sie gross genug für Umbruch gewählt; ein zu schmaler Container kürzt nie.

**Gilt auch für Platzhaltertexte.** Ein Platzhalter (z. B. im Suchfeld) wird nie
mit Auslassungspunkten abgeschnitten. Das Eingabefeld wird am **tatsächlichen**
Platzhalter bemessen, nicht am kurzen Entwurfstext. Reicht der Platz auch bei der
Höchstbreite nicht, wird das gemeldet — nicht das Feld oder der Text gekürzt.

Bereits verletzt (Historie, zur Warnung): interRAI-Bereichsnavigation,
Schrittbezeichnung im Onboarding-Fortschritt, Zustandsspalte im Onboarding,
Suchfeld der Kopfleiste (feste 220px am kurzen Entwurfs-Platzhalter „Suchen").

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

Die Sektionen 8.1 bis 8.9 definieren die Primitive (einzelne Bausteine). Die Sektionen 8.10 bis 8.14 definieren zusammengesetzte Muster (Patterns), die aus Primitiven bestehen und einen wiederkehrenden Vorgang kapseln. Sektion 8.15 fasst die Pattern-Library zusammen und legt die verbindliche Verwendungsregel fest.

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

Verwendung: Nebensächliche Aktionen. Mehr anzeigen, Details. Auch "Verwerfen" im ReviewBlock (siehe 8.10).

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

Verwendung: Ausschliesslich für den Anna-Trigger-Button in der Topbar, den Aufnahme-Button (siehe 9) und an anderen Stellen, wo Anna direkt eingebunden ist. Der Gradient ist die einzige Stelle, wo das Cockpit einen Farbverlauf verwendet – sie signiert Anna visuell.

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

#### Select / Dropdown

Selects folgen exakt der Input-Gestaltung: gleicher Padding, gleiche Border (0.5px var(--border-default)), border-radius 12px, gleiche Schriftfamilie und dieselben vier States. Rechts ein Chevron-Icon (ti-chevron-down, 16px, var(--text-secondary)).

Niemals native HTML-Select-Dropdowns verwenden – sie brechen die Optik (falsche Schrift, falsche Border, eckige Form). Immer die projekteigene Select-Komponente.

Auf Mobile wird der Select als Bottom-Sheet dargestellt (siehe Sektion 14).

#### Spezial: Suchfeld

Suchfelder sind voll-pill (border-radius: 999px) und haben links ein Such-Icon.

```
padding: 11px 16px 11px 42px;
border-radius: 999px;
```

Mit einem Such-Icon absolut positioniert links bei left: 16px.

### 8.3 Pills

Alle Pills sind voll-pill (border-radius: 999px).

#### Status-Pills (mit Icon)

```
background: var(--status-{status}-bg);
color: var(--status-{status}-text);
padding: 4px 12px;
font-size: 12px;
font-weight: 500;
border-radius: 999px;
```

Inhalt: ein Tabler-Icon (14px) plus Label. Das Icon trägt die Bedeutung redundant zur Farbe, damit der Status nicht allein über Farbe lesbar sein muss:

- Aktiv / Bestätigt: Erfolg-Farbschema, Icon ti-check
- Vorschlag / Wartend: Warnung-Farbschema, Icon ti-clock
- Überfällig / Nicht abrechenbar: Gefahr-Farbschema, Icon ti-alert-triangle
- In Onboarding / Info: Info-Farbschema, Icon ti-circle
- Archiviert: Sekundär-Hintergrund + Sekundärtext

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

### 8.10 · ReviewBlock (Anna-Entwurf-Element)

Der ReviewBlock ist das einheitliche Muster für jedes Element, das von Anna (oder einer anderen Quelle) als Entwurf erzeugt wurde und von einer diplomierten Pflegefachperson bestätigt oder verworfen wird.

Er wird überall dort verwendet, wo der Vorgang "Anna schlägt vor → Mensch bestätigt" stattfindet: aktuell in den Onboarding-Tabs InterRAI, Pflegeplanung und KLV. Künftig auch in jedem weiteren Bereich, in dem Anna Inhalte vorbefüllt (z.B. Personalien, Aktivitäten nach Voice-Aufnahme).

#### Grundregel

Der ReviewBlock standardisiert Rahmen, Herkunft, Status und Aktionen. Der fachliche Inhalt (Körper) bleibt pro Verwendungsort frei. Eine KLV-Position, eine Pflegediagnose und ein InterRAI-Item sehen im Körper unterschiedlich aus, aber Rahmen und Bedienung sind überall identisch.

Niemals einen eigenen Entwurf-/Bestätigen-Mechanismus pro Tab erfinden. Wenn ein bestätigbarer Anna-Entwurf dargestellt werden soll, wird der ReviewBlock verwendet.

#### Anatomie

```
┌─[Status-Akzent-Leiste links, 4px]──────────────────────────────────┐
│  [Herkunft]  Titel des Elements              [Status-Pill]   [⌄]    │  Kopf
│  ─────────────────────────────────────────────────────────────────  │
│  Fachlicher Inhalt / editierbare Felder (frei pro Verwendungsort)    │  Körper
│  ─────────────────────────────────────────────────────────────────  │
│  [Bestätigen]   Verwerfen                                            │  Aktionen
└──────────────────────────────────────────────────────────────────────┘
```

Der Block ist eine Card gemäss 8.5: border-radius 12px, border 0.5px solid var(--border-default), background var(--bg-elevated). Padding 16–18px.

#### Status-Akzent-Leiste (links)

Vertikale Leiste, 4px breit, border-radius var(--radius-accent) (2px), volle Höhe des Kopfes. Sie kodiert ausschliesslich den Status (nicht die Herkunft):

- Vorschlag (unbestätigt): background var(--status-warning)
- Bestätigt: background var(--status-success)
- Signiert (später): background var(--brand-primary)

Dies ist die einzige Stelle, an der der Status farbig getragen wird. Beim Scrollen durch eine lange Liste erkennt die Pflegefachperson den Bearbeitungsstand am Rand, ohne zu lesen.

#### Herkunfts-Marker (links im Kopf)

Kodiert, wer den Entwurf erzeugt hat. Immer über Icon und Form, niemals über Farbe (Farbe ist dem Status vorbehalten):

- Anna: Icon ti-sparkles (16px, var(--brand-primary)) plus Mini-Label "Anna" (text-micro, Versalschrift, var(--text-secondary))
- Diplomierte: Avatar in 32px-Variante (gemäss 8.6) oder Icon ti-user
- Angehörige: Icon ti-heart-handshake plus Mini-Label "Angehörige"

#### Status-Pill (rechts im Kopf)

Status-Pill gemäss 8.3, mit Icon statt nacktem Bullet:

- Vorschlag: Warnung-Farbschema, Icon ti-clock
- Bestätigt: Erfolg-Farbschema, Icon ti-check

#### Aktionen

Genau ein Verb-Paar, überall im Cockpit identisch:

- Primär: "Bestätigen" — Primär-Button gemäss 8.1 (Malachit)
- Sekundär: "Verwerfen" — Tertiär-Button gemäss 8.1 (neutral)

"Verwerfen" ist niemals destruktiv-rot. Einen Vorschlag abzulehnen löscht nichts Bestehendes; es wird lediglich nicht übernommen. Destruktiv-Rot (var(--status-danger)) bleibt echten Löschungen vorbehalten. Eine echte Löschung einer bereits bestätigten Position bleibt davon unberührt und darf destruktiv dargestellt sein, aber klar getrennt von "Verwerfen".

Verbote: Niemals "Akzeptieren", "Validieren", "Annehmen" oder ein anderes Synonym verwenden. Ein Wort, ein mentales Modell. Niemals "Verwerfen" als roten Gefahr-Button gestalten.

#### Zustände

- Kompakt: nur der Kopf, einzeilig. Default für bestätigte Elemente und Anna-Entwürfe mit hoher interner Confidence.
- Offen: Kopf, Körper und Aktionen sichtbar. Default für unbestätigte Vorschläge und Anna-Entwürfe mit niedriger interner Confidence.

Der Default-Zustand wird von Annas interner Confidence gesteuert, aber Confidence wird niemals als sichtbares Signal dargestellt (siehe Sektion 13).

#### Verwendung in Tabellen-Layouts

Wenn ein Tab tabellarisch ist (z.B. KLV), bleibt die Tabelle erhalten; die ReviewBlock-Logik (Herkunft, Status, Verb-Paar, kein rotes Verwerfen) gilt trotzdem für den Bestätigen-Vorgang innerhalb der Zeile. Layout verschieden, Vorgang gleich.

---

### 8.11 · TabHeader und HeaderMeta

Der TabHeader ist die einheitliche Kopfzeile für jeden Inhalts-Tab im Workspace (Personalien, Aktivitäten, InterRAI, Pflegeplanung, KLV, Dokumente und künftige Tabs). Er sorgt dafür, dass die Nutzerin bei jedem Tab-Wechsel Titel, Stand und Hauptaktion an derselben Stelle findet.

#### Zwei Header-Ebenen (wichtig)

Der Workspace hat zwei getrennte Header-Ebenen, die nicht vermischt werden:

1. Workspace-Header (oberhalb der Tab-Leiste): zeigt nur den Kontext-Titel ("Patientendaten · [aktueller Tab]") und den Aufnahme-Button. Er bleibt beim Tab-Wechsel stabil und ändert nur den Tab-Namen. Hier stehen niemals tab-spezifische Stand- oder Aktions-Elemente.
2. Content-Header (unterhalb der Tab-Leiste): das ist der TabHeader. Er trägt Titel, Stand (HeaderMeta) und höchstens eine Primär-Aktion. Er sitzt bei allen Tabs an derselben Position, in derselben Höhe.

#### Grammatik (fest, überall gleich)

```
┌────────────────────────────────────────────────────────────────────┐
│  Tab-Titel                                       [HeaderMeta-Slot]   │
│  (text-h3, weight 500)                           [Primär-Aktion?]    │
└────────────────────────────────────────────────────────────────────┘
```

- Links: Tab-Titel (text-h3, weight 500). Optional ein Status-Pill direkt rechts neben dem Titel (z.B. "Entwurf"), wenn der ganze Tab einen Bearbeitungsstatus hat.
- Rechts: der HeaderMeta-Slot (siehe unten) und höchstens eine Primär-Aktion. Niemals mehr als eine Primär-Aktion pro Tab.
- Position, Typografie und Abstand sind über alle Tabs identisch. Nur der Inhalt der Slots variiert.

#### HeaderMeta-Slot: zwei Modi

Der Stand eines Tabs wird in genau einem von zwei Modi dargestellt, abhängig davon, ob der Tab erfassungs- oder inventar-orientiert ist. Beide nutzen dieselbe Typografie (text-small, var(--text-secondary)) und dieselbe Position.

**Modus A — Fortschritt** (für Tabs, die einen klaren Erledigungsstand haben)

Format: "X von Y erfasst" plus ein dezenter horizontaler Fortschrittsbalken.
- Balken: Höhe 4px, border-radius var(--radius-pill), Track in var(--bg-secondary), Füllung in var(--brand-primary).
- Die Füllung muss bei teilweisem Fortschritt klar sichtbar sein – ein Balken, der bei 30% nicht erkennbar ist, ist Dekoration, kein Signal.
- Verwendung: Aktivitäten (X von 10 Kategorien).
- Niemals eine Prozentzahl anzeigen, wenn die Gesamtmenge nie vollständig erreicht wird.

**Modus B — Zusammenfassung** (für Tabs, die ein Inventar oder Ergebnis zeigen, keinen Erledigungsstand)

Format: Kennzahlen nebeneinander, durch Mittelpunkt getrennt. Kein Balken, kein Prozent, kein "von Y".
- InterRAI: "X Items erfasst · Y zu bestätigen" (kein /247, kein %).
- Pflegeplanung: "4 Diagnosen · 8 Massnahmen · 4 Ziele".
- KLV: Gesamt-Summe, z.B. "8.0 h/Woche".

#### Regel zur Modus-Wahl

- Hat der Tab eine sinnvolle, erreichbare Gesamtmenge (man kann ihn "fertig" machen)? → Modus A.
- Ist der Tab ein Assessment, Inventar oder eine Berechnung (Vollständigkeit ist nicht das Ziel)? → Modus B.

Im Zweifel Modus B. Eine ehrliche Zusammenfassung ist besser als ein irreführender Fortschritt.

#### Primär-Aktion im Header

Höchstens eine, rechts aussen. Beispiele: "Verordnung & Versand" (KLV), "Auswerten" (InterRAI). Sammel-Aktionen wie "Alle bestätigen" gehören nicht in den TabHeader, sondern auf Sektionsebene (siehe SectionAccordion). Sekundäre Aktionen wie "Alle ausklappen / einklappen" werden als sekundäre/tertiäre Buttons behandelt, nicht als Primär-Aktion.

#### Aktions-Ebenen (verbindlich)

Es gibt genau zwei Aktions-Ebenen mit je eigener Grammatik. Sektions-Aktionen wandern NIE in den TabHeader.

**Ebene 1 — TabHeader** (eine pro Tab)

```
[Kennzahl?] · [max. 2 Sekundär-Aktionen, Outline-Pill] · [1 Primär-Aktion, Malachit]
```

- Kennzahl: max. eine, z.B. "8.0 h/Woche" oder "3 Vorschläge zu prüfen". Bei N=0 oder ohne Relevanz: still (kein Platzhalter).
- Sekundär-Aktionen: Outline-Pill (bg-elevated, Border, text-primary). Max. zwei. Beispiele: "WZW-Auswertung", "Verordnung & Versand".
- Primär-Aktion: genau eine, Malachit-Hintergrund. Beispiel: "Leistung hinzufügen", "Pflegediagnose hinzufügen".
- Auf schmaler Breite (< 768px): Buttons behalten ihre vollen Labels. Die Kennzahl darf in eine eigene Zeile rücken (flex-wrap). Kein Overflow-Menü, keine gekürzten Labels.

**Ebene 2 — Sektions-Header** (je Sektion innerhalb eines Tabs)

```
SEKTIONS-TITEL                    [Ghost-Aktion 1] [Ghost-Aktion 2]
```

- Ghost-Aktionen: Icon + Verb, text-secondary (hover: text-primary), kein Rahmen, kein Hintergrund. Gemeinsame Komponente `SectionAction` (`components/ui/SectionAction.tsx`).
- Rechtsbündig in der Sektions-Überschriftszeile.
- Flow-Status kann das Label einer Ghost-Aktion ersetzen (z.B. "Beim Arzt anfragen" → "Dr. R. Steiner · 9 Tage"), um eine lose zweite Statuszeile unter der Überschrift zu vermeiden.
- Beispiel Pflegeplanung, Sektion "Ärztliche Diagnosen": `[Beim Arzt anfragen] [Erfassen]`.

---

### 8.12 · SectionAccordion

Das SectionAccordion ist das einheitliche Muster für eine auf- und zuklappbare Sektion, die eine Liste gleichartiger Items enthält. Verwendet in Aktivitäten (Kategorien) und InterRAI (Sektionen). Künftig für jede gruppierte, erfassbare Liste.

Es gibt nur eine SectionAccordion-Komponente. Unterschiede zwischen Verwendungsorten (Icon vs. Buchstaben-Badge, mit/ohne Sammel-Aktion) werden über Slots abgebildet, niemals über parallele Komponenten.

#### Anatomie (Kopf, immer sichtbar)

```
┌────────────────────────────────────────────────────────────────────┐
│  [Marker]  Sektions-Titel  · Count   [Status?]  [Sammel-Aktion?] [⌄] │
└────────────────────────────────────────────────────────────────────┘
```

- Marker-Slot links: nimmt entweder ein rundes Icon (Aktivitäten) oder ein Buchstaben-Badge (InterRAI: A, B, C). Gleicher Platz, gleiche Grösse.
- Titel: text-body, weight 500.
- Count: direkt nach dem Titel, text-meta, var(--text-secondary). Format "3 Items" oder "0/15 erfasst".
- Status-Slot rechts (optional, siehe Regel unten).
- Sammel-Aktion-Slot rechts (optional, z.B. "Alle bestätigen"). Sammel-Aktionen leben hier auf Sektionsebene, niemals im TabHeader.
- Chevron ganz rechts.

#### Status-Regel (verbindlich)

Status wird nur angezeigt, wenn es etwas Positives zu zeigen gibt. Abwesenheit wird nicht markiert.

- Nicht begonnen (leer): kein Status-Pill. Nur der dezente Count. Die Sektion bleibt visuell still.
- Teilweise erfasst: der Count trägt den Fortschritt ("2/3"). Kein zusätzliches Pill nötig.
- Vollständig erfasst: ein positives Signal — ein dezenter Haken (ti-check) oder ein Pill "Erfasst" im Erfolg-Farbschema.

Niemals ein "Nicht ausgefüllt"- oder vergleichbares Negativ-Pill an leeren Sektionen.

Hinweis: In Assessment-Kontexten (InterRAI), in denen eine Sektion selten vollständig erfasst wird, greift das Vollständig-Signal kaum – das ist akzeptabel. In abschliessbaren Kontexten (Aktivitäten) greift es gut.

#### Verhalten

- Mehrere Sektionen können gleichzeitig offen sein.
- Aufgeklappt: der Kopf bleibt, darunter die Liste der ItemRows (8.13), getrennt durch dünne Linien.
- Das Accordion enthält selbst keine Navigation. Bei langen, vielsektionigen Listen wird es mit einem SidebarNav (8.14) kombiniert.

---

### 8.13 · ItemRow

Die ItemRow ist die kleinste erfassbare oder bestätigbare Einheit innerhalb eines SectionAccordion. Sie standardisiert den Rahmen; der Eingabe-Körper variiert je nach Datentyp.

#### Anatomie

```
┌────────────────────────────────────────────────────────────────────┐
│  [Item-Marker?]  Item-Titel / Frage              [Eingabe-Körper]    │
│                  Hilfstext / Beschreibung (optional)                  │
└────────────────────────────────────────────────────────────────────┘
```

- Item-Marker-Slot (optional): leer bei Aktivitäten, Sub-Code bei InterRAI (A1a, A1b, A2). Gleicher Platz.
- Titel/Frage: text-body. Optionaler Hilfstext darunter: text-small, var(--text-secondary).
- Eingabe-Körper-Slot: nimmt einen von mehreren Körper-Typen auf.
- Trennung zwischen ItemRows: 0.5px Linie, kein Padding dazwischen (gemäss 8.7).

#### Körper-Typen

Der Rahmen bleibt identisch; nur der Körper wechselt:

- Boolean: Ja/Nein als Segmented Control (gemäss 8.4), optional darunter "Bemerkung hinzufügen".
- Text: ein Eingabefeld (gemäss 8.2).
- Optionen: Auswahl-Optionen (Radio-Liste) für skalierte oder kategoriale Antworten.

Neue Körper-Typen werden als zusätzliche Variante ergänzt, niemals durch ein abweichendes Zeilen-Layout.

#### Stand der Body-Typen

- Boolean (Ja/Nein-Segmented + optionale Bemerkung): in der gemeinsamen ItemRow umgesetzt (Aktivitäten).
- Optionen (Radio-Liste): umgesetzt, aktuell noch in einer InterRAI-lokalen Variante (InterRAIItemRow). Zusammenführung in die gemeinsame ItemRow als dritter Body-Typ ist offen (TODO).
- Text (Eingabefeld): vorgesehen.

Ziel-Zustand: eine ItemRow-Komponente mit allen Body-Typen. Keine tab-spezifischen ItemRow-Varianten.

#### Herkunft und Status

Wenn eine ItemRow einen Anna-Entwurf trägt (z.B. nach Voice-Aufnahme vorbefüllt), werden Herkunft und Status gemäss Sektion 13 dargestellt. Eine leere, noch nicht erfasste ItemRow bleibt still (kein Status).

---

### 8.14 · SidebarNav

Der SidebarNav ist ein optionales Begleitmuster für lange, vielsektionige Erfassungen (z.B. InterRAI mit 17 Sektionen). Er steht links neben dem Inhalt und ermöglicht Sprung-Navigation. Kurze Listen (z.B. Aktivitäten mit 10 Kategorien) verwenden ihn nicht.

#### Anatomie

Eine vertikale Liste von Sektions-Einträgen:
- Marker (Buchstabe oder Punkt), Sektions-Name (gekürzt), Fortschritts-Count rechts ("0/15").
- Aktiver/aktueller Eintrag: hervorgehoben über bg-secondary, nicht über eine zusätzliche Farbe.
- Klick auf einen Eintrag springt zur entsprechenden Sektion (Scroll-to-Section). Beim Scrollen wird der aktuelle Eintrag automatisch hervorgehoben (Scroll-Spy).

#### Status im Nav

Der Fortschritt pro Sektion wird ausschliesslich über den Count ("0/15") getragen. Es werden keine farbigen Status- oder Confidence-Punkte verwendet (gemäss Sektion 13). Wenn ein Sektions-Status farbig signalisiert werden soll, folgt er dem Status-Schema (Ocker/Oliv), niemals einem eigenen Punkte-System.

---

### 8.15 · Pattern-Library – Überblick und Verwendungsregel

Die Sektionen 8.10 bis 8.14 definieren zusammengesetzte Muster (Patterns), die über den einzelnen Primitiven (Button, Input, Pill, Card) liegen. Sie kapseln wiederkehrende Vorgänge, nicht nur Optik.

#### Grundregel

Wenn ein neuer Bildschirm oder ein neues Modul einen Vorgang abbildet, der einem dieser Muster entspricht, wird das bestehende Muster verwendet – niemals ein neues, lokal gebautes Äquivalent. Eine lokale Neu-Implementierung eines bestehenden Musters gilt als Fehler, auch wenn sie visuell identisch aussieht, weil sie die gemeinsame Pflege bricht.

#### Die Muster und ihr Vorgang

| Muster | Vorgang | Sektion |
|---|---|---|
| ReviewBlock | Ein Anna-Entwurf wird bestätigt oder verworfen | 8.10 |
| TabHeader + HeaderMeta | Kopfzeile eines Tabs: Titel, Stand, eine Primär-Aktion | 8.11 |
| SectionAccordion | Auf-/zuklappbare Sektion mit Item-Liste | 8.12 |
| ItemRow | Kleinste erfass-/bestätigbare Einheit in einer Sektion | 8.13 |
| SidebarNav | Sprung-Navigation für lange, vielsektionige Listen | 8.14 |

#### Wahl des Musters

- Anna schlägt etwas vor, das ein Mensch annimmt → ReviewBlock.
- Eine Liste gleichartiger Einträge, gruppiert und aufklappbar → SectionAccordion + ItemRow.
- Diese Liste ist lang und vielsektionig (Daumenregel: mehr als ~12 Sektionen oder Navigation nötig) → zusätzlich SidebarNav.
- Jeder Inhalts-Tab → TabHeader.

#### Erweitern statt umgehen

Wenn ein Muster einen neuen Anwendungsfall noch nicht abdeckt, wird das gemeinsame Muster erweitert (z.B. ein neuer Slot, ein neuer Body-Typ), niemals eine parallele Variante gebaut. Beispiel: Die Sammel-Aktion "Alle bestätigen" wurde als Slot in SectionAccordion ergänzt, damit InterRAI dieselbe Komponente wie Aktivitäten nutzt.

#### Verifikation nach Migration

Nach jeder Migration eines Tabs oder einer Komponente auf ein gemeinsames Muster ist zu prüfen: Importieren alle Verwender dieselbe Komponente, und existiert keine verwaiste Parallel-Implementierung? Visuelle Gleichheit ist kein Beweis für geteilten Code (siehe auch CLAUDE.md, Migrations-Verifikation).

---

## 9 · Anna – AI-Assistent

Anna lebt in einer rechten Sidebar (~400px breit), die mit dem Anna-Trigger-Button in der Topbar geöffnet wird.

### Aufnahme-Button (Anna-Einstieg)

Der "Gespräch aufzeichnen"-Button ist der primäre Einstieg in Annas Multi-Output-Erfassung. Er trägt daher die Anna-Signatur, nicht die Gefahr-Farbe.

Zwei Zustände:

**Bereit (Default):** Anna-Akzent-Button gemäss 8.1 (Malachit-zu-Cerulean-Gradient), Mikrofon-Icon links, Text "Gespräch aufzeichnen". Signalisiert: Anna übernimmt.

**Aufnahme läuft:** Hintergrund neutral (var(--bg-elevated), 0.5px Border), links ein pulsierender Punkt in var(--status-danger), Text "Aufnahme läuft · stoppen". Rot trägt hier die korrekte Bedeutung (aktiv, stoppbar), nicht Gefahr. Das Pulsieren ist ein sanfter Opacity-Fade (~1.5s), niemals ein hektisches Blinken (siehe Sektion 11).

Während der Aufnahme erscheint zusätzlich eine globale Aufnahme-Leiste am oberen Rand mit Status, Kontext und Timer sowie einem "Aufnahme beenden"-Button.

Der Übergang von Rot ausschliesslich in den aktiven Aufnahme-Zustand stellt sicher, dass die Gefahr-Farbe ihre Bedeutung im übrigen System behält.

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
- Animationen mit Bounce, Spring oder Wackel-Effekten; hektisches Blinken
- Bunte Pills mit Sättigung über 30 Prozent
- Mehrere Primär-Buttons nebeneinander
- Buttons ohne Pill-Form
- Detail-Pane-Inhalte ohne klare Hierarchie
- Native HTML-Select-Dropdowns (immer die projekteigene Select-Komponente, siehe 8.2)
- Negativ-Status an leeren Elementen ("Nicht ausgefüllt"-Pills, siehe 8.12)
- Status allein über Farbe kodieren (immer Icon/Form redundant, siehe 8.3 und 13)
- Sichtbare Anna-Confidence-Signale (Dots, Prozente, Ampel, siehe 13)
- Lokale Neu-Implementierung eines bestehenden Musters (siehe 8.15)

---

## 12 · Bei Unklarheiten

Wenn dieser Style-Guide eine Frage nicht beantwortet:

1. Schaue, ob es eine analoge Komponente oder ein Muster gibt, deren Verhalten übertragbar ist
2. Folge der Designhaltung in Sektion 1: ruhig, präzise, vertraut, selbstbewusst
3. Im Zweifel weniger ist mehr: weniger Farben, weniger Animationen, weniger Details
4. Frage nach, bevor du eine grosse Designentscheidung allein triffst

---

## 13 · Provenienz und Status

Diese Sektion definiert, wie das Cockpit sichtbar macht, wer einen Inhalt erzeugt hat und wie verbindlich er ist. Sie ist die Grundlage für die Multi-Author-Nachvollziehbarkeit, die das Produkt fachlich und regulatorisch tragen muss.

### Zwei getrennte Achsen

Herkunft und Status sind zwei unabhängige Dimensionen und werden niemals in einem einzigen Element vermischt:

1. Herkunft (wer): Anna, Diplomierte, Angehörige. Ändert sich nicht durch Bestätigung.
2. Status (wie verbindlich): Vorschlag → Bestätigt → Signiert. Ändert sich durch die Handlung der Pflegefachperson.

Ein Element, das von Anna stammt und bestätigt wurde, trägt beide Informationen: Herkunft "Anna" bleibt, Status wechselt von Vorschlag auf Bestätigt.

### Kodierung

- Herkunft wird über Icon und Form kodiert (Sparkle für Anna, Avatar/User-Icon für Diplomierte, Heart-Handshake für Angehörige). Niemals über Farbe.
- Status wird über Farbe kodiert (Akzent-Leiste und Status-Pill: Ocker für Vorschlag, Oliv für Bestätigt, Malachit für Signiert), immer zusätzlich über ein Icon (siehe 8.3), damit Status nicht allein über Farbe lesbar sein muss.

Diese strikte Trennung verhindert, dass auf einem Element mehrere konkurrierende Farbsignale entstehen.

### Confidence wird nicht angezeigt

Annas interne Confidence (hoch/mittel/niedrig) wird niemals als sichtbares Signal dargestellt — keine Dots, keine Prozentzahlen, keine Ampel.

Begründung: Die diplomierte Pflegefachperson trägt die fachliche und rechtliche Verantwortung für jeden Inhalt. Ein sichtbares Confidence-Signal würde dazu verleiten, bei "hoher" Confidence weniger genau zu prüfen. Jeder Vorschlag wird gleich ernst geprüft, unabhängig davon, wie sicher das Modell intern ist.

Confidence darf das Default-Verhalten des ReviewBlocks steuern (niedrige Confidence öffnet den Block, hohe hält ihn kompakt), aber sie behauptet niemals sichtbar Verlässlichkeit.

---

## 14 · Mobile-Responsiveness

### Breakpoints

Vier Breakpoints, konsistent mit Tailwind CSS:

| Name    | Min-Breite | Typische Geräte               | Tailwind |
|---------|-----------|-------------------------------|----------|
| Mobile  | 0         | Smartphones (375–639px)       | default  |
| Tablet  | 640px     | Tablets, kleine Laptops       | sm:      |
| Desktop | 1024px    | Standard-Arbeitsplatz         | lg:      |
| Wide    | 1280px    | Grosse Monitore, Detail-Sidebars | xl:  |

### Verhaltensregeln pro Breakpoint

- **Sidebar**: Desktop: 56px Icon-Rail links. Mobile: ausgeblendet, Drawer über Hamburger-Icon.
- **Bottom Navigation**: Mobile: 64px hohe Tab-Bar am unteren Rand (5 Haupt-Bereiche). Desktop: ausgeblendet.
- **Tabellen**: Mobile: werden zu Card-Listen (jede Zeile = eine tappbare Card). Desktop: klassische Tabelle.
- **Mehrspaltige Layouts**: Mobile: einspaltig. Desktop: zwei-/dreispaltig.
- **Modale Dialoge**: Mobile: Bottom-Sheet (von unten, max 90vh, Swipe-down zum Schliessen). Desktop: zentriertes Modal.
- **Anna-Sidebar**: Mobile: Vollbild-Overlay. Desktop: 420px rechte Sidebar.
- **Detail-Sidebars** (Pendenzen etc.): Mobile: Vollbild-Overlay. Desktop ab xl: neben der Liste.
- **SidebarNav** (8.14): Mobile: oberhalb des Inhalts oder als kompakte Sektions-Auswahl statt linker Spalte.

### Touch-Targets

Alle interaktiven Elemente (Buttons, Links, Pills, Icon-Buttons) haben auf Touch-Geräten mindestens **44 × 44 Pixel** Tap-Fläche. Eng beieinanderliegende Aktionen brauchen mindestens 8px Abstand.

Umgesetzt via `@media (pointer: coarse)` in theme.css mit `min-height: 44px; min-width: 44px;` auf alle Buttons.

Hinweis zu Touch und Hover: Hover-States (Listen, Inputs, Buttons) funktionieren auf Touch-Geräten nicht zuverlässig. Auf Touch (`pointer: coarse`) wird jeder Hover-State durch einen entsprechenden Active/Pressed-State ergänzt, damit Rückmeldung erhalten bleibt.

### Formulare auf Mobile

- Eingabefelder: `font-size: 16px` minimum (verhindert iOS-Zoom bei Focus)
- Numerische Felder: `inputMode="numeric"` für Ziffern-Tastatur
- Date-Picker: Mobile-tauglich mit nativen Fallbacks
- Dropdown-Selects: ab Mobile als Bottom-Sheet (via BottomSheet-Komponente)
- Mehrspaltige Grid-Layouts: auf Mobile einspaltig

### Mobile-Navigation

- **Topbar**: bleibt sichtbar, kompakter. Suchfeld wird zu Such-Icon mit Vollbild-Suchdialog.
- **Bottom Tab-Bar**: 5 Items (Startseite, Pendenzen, Patienten, Angehörige, Onboarding). Aktives Item in Brand-Primary.
- **Anna-Floating-Button**: nur auf Desktop sichtbar. Auf Mobile wird Anna über die Tab-Bar oder den Konversations-Bereich erreicht.

### Tabellen-Strategie: Card-Ansicht (Option A)

Auf Mobile (<640px) werden alle Listen-Tabellen als **Card-Listen** dargestellt:
- Jede Tabellenzeile wird eine tappbare Card
- Card zeigt die 2-3 wichtigsten Felder (Name, Status, Fälligkeit)
- Tap navigiert zur Detailseite
- Reusable via `<MobileCardList>` Komponente

Auf Tablet und Desktop wird die klassische Tabelle angezeigt:
```
<div className="hidden sm:block"><Table ... /></div>
<div className="sm:hidden"><MobileCardList ... /></div>
```

### Performance auf Mobile

- `touch-action: manipulation` auf html (eliminiert 300ms Tap-Delay)
- `-webkit-overflow-scrolling: touch` für native Scroll-Gefühl
- `env(safe-area-inset-bottom)` für iPhone-Notch-Geräte

### Testen

- Browser DevTools: Chrome > Toggle Device Toolbar > iPhone 14 (375px) oder Pixel 7 (412px)
- Echtes Gerät: localhost über lokales Netzwerk (`vite --host`)
- Viewport-Mindestbreite für Tests: 375px (iPhone SE/Mini)

---

## 15 · Listentabellen

Geteilte, responsive Listentabelle: `components/ui/DataTable.tsx`. Sie kennt keine
Fachlogik – sie bekommt je Spalte eine Beschreibung (Kennung, Beschriftung, Anteil,
Mindestbreite, Ausrichtung, Ausblende-Haltepunkt, Sortierbarkeit) und eine render-Funktion.
Fachliche Regeln (Kennzeichen, Zeilentönung, Feldnamen) leben ausschliesslich an der
Aufrufstelle. Erste Verwendung: Onboarding-Liste.

### Grundsatz: fluid ist der Rahmen, nicht der Inhalt

- **Inhaltsbreite:** Der Inhaltsbereich wächst fluid bis **1400px** und wird darüber
  zentriert (darüber wächst nur Leerfläche, kein Inhalt). Die Grenze gilt für den
  **gesamten Seiteninhalt** — Titel, Steuerleiste, Tabelle und Fusszeile teilen dieselbe
  linke und rechte Kante (`TABELLE_LAYOUT.inhaltMaxPx`, zentriert per `margin: 0 auto`),
  nicht nur die Tabelle. Die Seiten-Polsterung skaliert separat
  (`--mobile-page-padding` → `--space-6` ab 640px).
- **Spaltenbreiten:** Anteile (Prozent bzw. `fr`-Gewicht) setzen die Proportion,
  Mindestbreiten in `ch` sichern die Lesbarkeit. Umgesetzt als CSS-Grid
  `minmax(<minCh>ch, <anteil>fr)`. Feste Pixel **nur** wo physisch bedeutsam
  (Kennzeichen-Spalte, Klickflächen, Haarlinien).
- **Einheiten:** Schrift und Abstände in `rem` (folgen der Systemschriftgrösse).
  Klickflächen und Haarlinien in festen `px`.

### Haltepunkte (Fensterbreite)

Verbindlich, an einer Stelle definiert: `TABELLE_LAYOUT.haltepunktePx` in `DataTable.tsx`.

| Bereich | Verhalten |
|---|---|
| ≥ 1400px | alle Spalten nebeneinander |
| 1100 – 1400px | als Zweitzeile markierte Spalte rutscht unter ihre Leitspalte |
| 900 – 1100px | zusätzlich entfallen die als „eng" markierten Spalten |
| < 900px | Kartendarstellung statt Tabelle, **kein** horizontales Scrollen |

Diese Tabellen-Haltepunkte sind bewusst grösser als die allgemeinen App-Breakpoints
(640/1024/1280): eine breite Datentabelle bricht früher, weil sie mehr Spaltenbreite
braucht als ein Formular oder eine Card-Fläche.

### Kartendarstellung (< 900px)

Kopf: die als `ausKarte` markierten Spalten (z. B. Name + Kennzeichen). Körper: die
übrigen Spalten als beschriftete Wertepaare in einem zweispaltigen Raster. Nie horizontal
scrollen.

### Einzige Stelle für Layoutwerte

Inhaltsbreite und Haltepunkte stehen ausschliesslich in `TABELLE_LAYOUT` (`DataTable.tsx`).
Nicht an der Aufrufstelle duplizieren.

---

Letzte Aktualisierung: Juni 2026
Version: 1.2