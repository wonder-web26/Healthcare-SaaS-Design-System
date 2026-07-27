# Handoff: Service Desk

## Overview

A unified Service Desk view for a Spitex (home-care) cockpit. The screen consolidates two previously separate task streams — auto-generated workflow tasks (SRK registration, re-assessment, Ausweis B, Quellensteuer, Kinderzulagen, Lohnanpassung) and manually-opened service tickets (Schlüssel, Anfrage, Problem, Meldung) — into a single triage surface with a filterable list and a persistent detail pane.

The user starts in "Mir zugewiesen" (entries assigned to me), can broaden to team or all, and drills into an entry on the right to change status, add comments, and mark it done.

## About the Design Files

The HTML file in this bundle (`Service Desk.html`) is a **design reference** — a React-in-a-single-HTML-file prototype built to convey layout, interaction, and visual language. It is **not production code**.

The task is to **recreate this design in the target codebase's existing environment** (React + the app's existing component library, styling system, routing, and data layer). Use the HTML as the source of truth for layout, spacing, and interaction — but apply the codebase's own primitives (Button, Select, Avatar, etc.), typography tokens, colors, and icon set where they exist.

If the codebase has no established environment yet, React + Tailwind is a reasonable default.

## Fidelity

**High-fidelity.** Pixel-perfect mockup with final colors, typography, spacing, and interactions. Recreate the layout, density, and interaction model faithfully.

## Information Architecture

One page, three columns:

```
┌──────────┬───────────────────────────────────┬──────────────┐
│ Views    │ Page header + filter chips        │ Detail pane  │
│ rail     │ ─────────────────────────────────│              │
│          │ Grouped list                      │ (persistent, │
│ 220 px   │   (flex 1, min-width 0)           │  400 px)     │
│          │                                    │              │
└──────────┴───────────────────────────────────┴──────────────┘
```

The page lives inside an app shell with a 256 px left sidebar (global nav) and a 64 px topbar. Service Desk content renders at `calc(100vh - 64px)`, split horizontally between the three columns above.

## Screens / Views

### 1. Views rail (left, 220 px)

- Background: `#FAFBFC`, right border `1px solid #F0F1F4`
- Padding: `20px 14px`
- Section label "Ansichten", uppercase, 10.5 px, `#9CA3AF`, letter-spacing 0.08, weight 500, padding `0 8px 8px`
- Four view buttons, each a full-width row, `7px 10px` padding, `8 px` radius, 13 px font, gap 10 between icon/label:
  - **Mir zugewiesen** (icon: user) — default active view
  - **Mein Team** (icon: users)
  - **Alle** (icon: inbox)
  - **Erledigt** (icon: checkcircle)
- Active state: background `#EEF2FF`, text + icon `#4F46E5`, weight 500
- Inactive: text `#374151`, icon `#9CA3AF`, weight 400
- Right-aligned count per view, 11 px, `#9CA3AF`, weight 500. Counts reflect **open** entries for the first three; the Erledigt count is done entries.

### 2. Middle column (flex 1)

#### Page header (padding `20px 24px 14px`, bottom border `1px solid #F0F1F4`)

**Title row** (flex, space-between, gap 16):
- `h1` "Service Desk" — 22 px, weight 600, `#111827`, letter-spacing -0.015
- Subtitle underneath: 12.5 px, `#6B7280`, 3 px margin-top, format:
  `{openCount} offene Einträge · {overdueCount} überfällig · {dueThisWeekCount} diese Woche fällig`
  When `overdueCount > 0`, the overdue segment is `#991B1B`, weight 500.
- Right-side primary button: **+ Neues Ticket**
  - `8px 13px` padding, 10 px radius, `#4F46E5` bg, white text, 12.5 px, weight 500, inline-flex with 6 px gap, plus icon (13 px) on the left
  - Only creates **service tickets** — workflow tasks are auto-generated and cannot be created manually. The button opens a ticket-creation dialog (not mocked).

**Filter chip row** (flex, gap 8, wrap):
- **Filter button** opens the filter popover (described below).
  - Pill shape, `6px 11px`, 999 radius, `1px solid #E5E7EB`, white bg (or `#F3F4F6` when popover open), 12 px `#374151` weight 500, sliders icon 12 px, 6 px gap.
  - When any filter is active, a 5 px indigo dot appears after the label.
- **Active filter chips**: one per active filter key (`quelle`, `typ`):
  - `5px 10px` padding, 999 radius, `#EEF2FF` bg, `#4F46E5` text, 11.5 px weight 500, 5 px gap, trailing × icon (11 px)
  - Format: `Quelle: Workflow`, `Typ: SRK-Anmeldung`
  - Click removes that filter
- **"Alle zurücksetzen"** text button (only when at least one filter active): 11.5 px `#6B7280` weight 500, `5px 6px` padding.

#### Filter popover

Absolute positioned below the Filter button, 6 px below, z-index 20.

- 280 px wide, white, `1px solid #E5E7EB`, 12 px radius, `0 8px 24px rgba(17,24,39,0.08)` shadow, `14px` padding
- Header: "Filter" 12 px weight 600 `#111827`, right-side ✕ close button (`#9CA3AF`, 14 px)
- **Quelle section**: small uppercase label (10.5 px `#9CA3AF`), then two equal-width buttons in a row (gap 6):
  - Options: **Workflow**, **Tickets**
  - Inactive: `1px solid #E5E7EB`, white bg, `#374151`
  - Active: `1px solid #4F46E5`, `#EEF2FF` bg, `#4F46E5` text, weight 500
- **Typ section**: same uppercase label, then wrap-flex of chips (gap 4):
  - Chip: `5px 10px`, 999 radius, 11.5 px, border + bg colors match the Quelle pattern above
  - All workflow types + ticket types are shown. Picking a type does **not** auto-filter quelle.
- Picking a new Quelle resets Typ to empty (prevents stale combinations).

#### Grouped list (flex 1, scroll-y)

Entries are grouped by due-date bucket. Buckets in this exact order:

| Key            | Label         | Header color |
|----------------|---------------|--------------|
| `ueberfaellig` | Überfällig    | `#DC2626`    |
| `heute`        | Heute         | `#D97706`    |
| `morgen`       | Morgen        | `#D97706`    |
| `diese_woche`  | Diese Woche   | `#111827`    |
| `spaeter`      | Später        | `#6B7280`    |
| `kein`         | Ohne Termin   | `#9CA3AF`    |

**Group header** (only rendered when the bucket has items):
- Padding `10px 24px`, background `#FAFBFC`, top + bottom border `1px solid #F0F1F4`
- Label: 11 px, weight 600, bucket color, uppercase, letter-spacing 0.08
- Count suffix: 11 px `#9CA3AF` weight 500

**Row** (grid `4px 1fr auto`, gap 12, padding `11px 24px 11px 20px`):
1. **Priority stripe** — 4 px wide, 36 px tall, 2 px radius. Color = priority color. Opacity 0.9, or 0.3 when `prioritaet === "niedrig"`.
2. **Main block** (min-width 0, so title can truncate):
   - Top line: type tag (see TypeTag below) + title
     - **Title** is always the affected person's name (`Fatima Al-Hassan`). If there is no person (rare — e.g. internal sync-failure tickets), use the ticket title (`MedLink Sync-Fehler · 12 Einträge unvollständig`).
     - Title style: 13 px, weight 500, `#111827` (or `#4F46E5` when row selected), truncate with ellipsis.
   - Subtitle: 11.5 px, `#6B7280`, ellipsis. This is the context line (e.g. `Bewilligung seit 25.01.2026 · Meldefrist 30 Tage`).
3. **Right column** (flex column, end-aligned, gap 4):
   - Date label — 11.5 px weight 500. Color depends on bucket:
     - `ueberfaellig` → `#DC2626`
     - `heute` / `morgen` → `#D97706`
     - everything else → `#6B7280`
   - Format:
     - Overdue: `{n} Tag überfällig` (n=1) or `{n} Tage überfällig`
     - Today: `heute`
     - Tomorrow: `morgen`
     - Otherwise: short German date, e.g. `3. Mär`
   - Responsible-person avatar (18 px) below the date label.

**Row states:**
- Hover (not selected): background `rgba(79, 70, 229, 0.03)`
- Selected: background `#EEF2FF`, title color `#4F46E5`
- Bottom border: `1px solid #F7F8FA`

**Empty state** (no entries after filters): 56 px padding, center, 13 px `#9CA3AF`: "Keine Einträge mit diesen Filtern."

### 3. Detail pane (right, 400 px)

Background `#FAFBFC`, scroll-y. When nothing selected, show a centered empty state with `inbox` icon (32 px, `#D1D5DB`) and "Wähle einen Eintrag, um Details zu sehen." (40 px padding, 13 px `#9CA3AF`).

When an entry is selected, render (gap 18 between blocks, padding `20px 22px 28px`):

1. **Header block**
   - Top row: type tag + entry ID (mono 10.5 px `#9CA3AF`) + spacer + overflow-menu button (`more` icon 16 px, `#9CA3AF`)
   - `h2`: entry title (same rule as list: person name, or ticket title fallback) — 18 px, weight 600, `#111827`, letter-spacing -0.01, line-height 1.3
   - Context line under the title: 13 px `#6B7280`, line-height 1.5, 6 px top margin

2. **Urgency alert** (only when bucket is `ueberfaellig` or `heute`):
   - Row with alert-triangle icon + text, `9px 12px` padding, 10 px radius
   - Overdue: bg `#FEF2F2`, icon + text `#DC2626` / `#991B1B`, text weight 500, format `{n} Tage überfällig`
   - Heute: bg `#FFFBEB`, icon + text `#D97706` / `#92400E`, text `heute fällig`

3. **Meta card** (white, `1px solid #F0F1F4`, 10 px radius, 14 px padding):
   - **2-column grid**, row-gap 14, column-gap 16
   - Each cell: uppercase 10 px label (`#9CA3AF`, weight 500, letter-spacing 0.08, margin-bottom 4) above the value
   - Cells in order: Typ (type tag), Status (status pill), Betroffene Person (avatar + name) — only if person exists, Verantwortlich (avatar + name), Priorität (dot + label in priority color), Fällig (date pill), Erstellt (formatted date, 12 px `#6B7280`)

4. **Verlauf** (activity feed):
   - Section label (uppercase 11 px `#9CA3AF`, margin-bottom 10)
   - Events stacked gap 10. Each event: 6 px colored dot (margin-top 6) + text column:
     - Line 1: 12 px `#374151`, `<b>{actor}</b> · {text}`
     - Line 2: 11 px `#9CA3AF`, date
   - Seed events: entry created (gray dot), plus a dot for "in bearbeitung" transitions (amber `#D97706`), plus any comments added during the session (indigo `#4F46E5`).

5. **Aktionen card** (white, `1px solid #F0F1F4`, 10 px radius, 14 px padding, flex column gap 12):
   - Section label "Aktionen" (uppercase 11 px `#9CA3AF`)
   - **Status ändern**: small label (11 px `#6B7280` weight 500) + native `<select>` — full width, `7px 10px`, 8 px radius, `1px solid #E5E7EB`, 12.5 px. Options: Offen / In Bearbeitung / Erledigt.
   - **Kommentar hinzufügen**: small label + textarea (full width, `8px 10px`, 60 px min-height, 8 px radius). Save button right-aligned below (`5px 11px`, 8 px radius, 12 px, `#F3F4F6` bg, `#374151` text; disabled style `#9CA3AF` text).
   - **Dokumente** (only for workflow entries or ticket types `SCHLUESSEL` / `MELDUNG`): dashed-border upload button, `9px 10px`, 8 px radius, `1px dashed #D1D5DB`, `#FAFBFC` bg, upload icon + "Datei hochladen".

6. **Primary CTA row** (flex, justify-end):
   - **Als erledigt markieren** button, `9px 14px`, 10 px radius, `#4F46E5` bg, white text, 12.5 px weight 500, check icon 13 px, 6 px gap
   - When status is already erledigt: bg `#ECFDF5`, text `#065F46`, `1px solid #A7F3D0`, label "Erledigt"
   - Clicking sets status to erledigt locally.

## Interactions & Behavior

- **Row click** → sets `selected` to that entry's ID; the detail pane updates in place. No new page, no dialog.
- **Auto-select**: whenever the filter result set changes, if the currently selected entry is no longer visible, auto-select the first entry in the filtered list. If the result is empty, clear selection.
- **View switch** → changes the list filter; selected entry is re-resolved via the auto-select rule above.
- **Filter chips** → additive; `quelle` and `typ` can both be set. Changing `quelle` clears `typ`.
- **"Erledigt" view** is the only view that shows entries where `status === "erledigt"`; all other views hide them.
- **Default view on first load**: "Mir zugewiesen".
- **Status change in detail pane**: local state for the prototype; in production, this should POST to the backend and optimistically update the list row.
- **Comment add**: appends to the Verlauf feed. Empty comments are ignored.

## URL State

All filter state is reflected in the query string. Params:

- `view` — `mir` | `team` | `alle` | `erledigt`. Omitted when value is the default (`mir`).
- `quelle` — `workflow` | `ticket`. Omitted when empty.
- `typ` — type enum id (e.g. `SRK_ANMELDUNG`). Omitted when empty.
- `id` — selected entry ID. Omitted when none.

Navigating with the back/forward buttons should restore both filters and selection. In the prototype this is done with `history.replaceState`; in the real app, use the router's canonical mechanism (Next.js `router.replace`, React Router `setSearchParams`, etc.).

## State Management

Minimum state for the page:

```ts
type ViewKey = "mir" | "team" | "alle" | "erledigt";

interface ServiceDeskState {
  view: ViewKey;         // default "mir"
  quelle: "" | "workflow" | "ticket";
  typ: "" | TypeEnumId;
  selectedId: string | null;
}
```

Plus in detail-pane local state: current status, draft comment, list of comments added in session.

Counts (sidebar + header) derive from the full entry list:

- Per-view count: open entries matching that view's visibility rule.
- Header counts: from the currently filtered list (not the global list).

## Data model (mirrors the prototype)

```ts
interface Entry {
  id: string;                     // e.g. "W-0142" or "T-0088"
  quelle: "workflow" | "ticket";
  typ: TypeEnumId;                // one of the enums below
  typLabel: string;               // human label shown in the tag
  person: { name: string; initialen: string } | null;
  titel?: string;                 // used as fallback title when person is null (tickets only)
  kontext: string;                // subtitle line in list + detail header
  erstellt: string;               // ISO date
  faellig: string | null;         // ISO date
  status: "offen" | "in_bearbeitung" | "erledigt";
  verantwortlich: Person;
  prioritaet: "hoch" | "mittel" | "niedrig";
}

type Person = { name: string; initialen: string; color?: string };

type WorkflowType =
  | "SRK_ANMELDUNG" | "RE_ASSESSMENT" | "AUSWEIS_B_ANMELDUNG"
  | "QUELLENSTEUER_ANMELDUNG" | "KINDERZULAGEN_ANTRAG" | "LOHNANPASSUNG_NACH_SRK";

type TicketType = "SCHLUESSEL" | "ANFRAGE" | "PROBLEM" | "MELDUNG";
```

## Global nav counter

The nav entry **Service Desk** shows a badge with the count of **"Mir zugewiesene offene Einträge"** — the exact same number as the "Mir zugewiesen" view's count. Apply this principle to other nav badges: if a counter does not have unambiguous semantics, remove it.

## Design Tokens

### Colors

| Role                      | Hex       |
|---------------------------|-----------|
| Page background           | `#F7F8FA` |
| Card / surface            | `#FFFFFF` |
| Sidebar / inner-rail bg   | `#FAFBFC` |
| Foreground (primary text) | `#111827` |
| Body text                 | `#374151` |
| Muted text                | `#6B7280` |
| Placeholder / disabled    | `#9CA3AF` |
| Border                    | `#E5E7EB` |
| Border light              | `#F0F1F4` |
| Border lighter / row sep  | `#F7F8FA` |
| Primary                   | `#4F46E5` |
| Primary hover             | `#4338CA` |
| Primary surface           | `#EEF2FF` |
| Success                   | `#059669` |
| Success surface           | `#ECFDF5` |
| Success text              | `#065F46` |
| Success border            | `#A7F3D0` |
| Warning                   | `#D97706` |
| Warning surface           | `#FFFBEB` |
| Warning text              | `#92400E` |
| Error                     | `#DC2626` |
| Error surface             | `#FEF2F2` |
| Error text                | `#991B1B` |
| Info                      | `#2563EB` |
| Info surface              | `#EFF6FF` |
| Info text                 | `#1E40AF` |

### Type tag colors by quelle

- `workflow` → text `#4F46E5`, bg `#EEF2FF`
- `ticket`   → text `#1E40AF`, bg `#EFF6FF`

### Priority colors

- `hoch`    → `#DC2626`
- `mittel`  → `#D97706`
- `niedrig` → `#9CA3AF`

### Typography

- Family: **Inter**, weights 400, 450, 500, 600, 700. Fallback `system-ui, sans-serif`.
- Mono family for IDs: **JetBrains Mono**, weights 400, 500.
- Body default: 14 px.
- Page title: 22 px, weight 600, letter-spacing -0.015.
- Section titles in detail pane: 18 px, weight 600, letter-spacing -0.01, line-height 1.3.
- List row title: 13 px, weight 500.
- List row subtitle: 11.5 px, weight 400.
- Meta labels: 10 px, weight 500, uppercase, letter-spacing 0.08.
- Section labels: 11 px, weight 500, uppercase, letter-spacing 0.08.
- Chip / pill text: 11.5–12 px, weight 500.
- Button text: 12–12.5 px, weight 500.

### Spacing

- List row padding: `11px 24px 11px 20px`
- Group header padding: `10px 24px`
- Page header padding: `20px 24px 14px`
- Detail pane padding: `20px 22px 28px`
- Detail pane block gap: 18 px

### Radii

- Cards / panels: 10 px
- Popover: 12 px
- Buttons / selects / textarea: 8 px (10 px for primary CTAs)
- Pills / chips: 999 px
- Avatars: 999 px

### Shadows

- Popover: `0 8px 24px rgba(17, 24, 39, 0.08)`

### Icons

All icons are inline SVGs drawn in a single `Icon` component — stroke 1.6, round caps, round joins, 16 px default. The set needed for this screen: `dashboard`, `userplus`, `users`, `heart`, `branch`, `headphones`, `file`, `settings`, `help`, `search`, `plus`, `bell`, `clock`, `alert`, `inbox`, `user`, `check`, `checkcircle`, `x`, `more`, `filter` / `sliders`, `upload`. Replace with the codebase's icon library (Lucide, Radix, Heroicons, etc.) — the names map directly.

### Date helpers

- `formatDate(iso)` → `DD.MM.YYYY`
- `formatShort(iso)` → `{D}. {Monat}` with 3-letter German month abbreviations (Jan, Feb, Mär, Apr, Mai, Jun, Jul, Aug, Sep, Okt, Nov, Dez)
- `daysFromToday(iso)` → signed integer
- `faelligBucket(iso)` → `ueberfaellig` | `heute` | `morgen` | `diese_woche` | `spaeter` | `kein`

"Today" in the prototype is hardcoded to `2026-03-03`; in production use the current date.

## Accessibility notes

- All interactive rows and chips use real `<button>` elements with visible focus rings (`outline: 2px solid #4F46E5`, offset 2).
- The list should be reachable via keyboard; arrow up/down to move selection and Enter to open are reasonable enhancements.
- Status pills and priority dots carry meaning beyond color — the label text or a `title` attribute is always present.

## Files

- `Service Desk.html` — the full design reference (React in a single HTML file with inline Babel transforms). Open in a browser to interact.

## Out of scope

- Bulk actions (multi-select)
- Sort options
- Search-inside-service-desk logic
- Audit-log display beyond the Verlauf feed
- Any change to the underlying `WorkflowTask` / `ServiceTicket` data model or type enums
