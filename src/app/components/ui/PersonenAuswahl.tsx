/**
 * PersonenAuswahl — reusable, searchable single-select list of people.
 *
 * Meant to be shared across modules (Bezugsperson, Verantwortliche in the
 * onboarding list, task assignees, Arbeitskontrolle owners, …). This run only
 * wires it to the Bezugsperson; the others are intentionally left untouched but
 * the component is built to fit them.
 *
 * Layout (per spec): ~300px wide, search field on top, one constant-height row
 * per person with a 28px initials circle, the name as "Nachname, Vorname", and
 * the role beneath in a smaller secondary colour. Selection is shown by surface,
 * border, font weight and a check — never by colour alone — and only in system
 * colours (the cmdk keyboard-active highlight is overridden to a system token so
 * no foreign accent colour appears). Keyboard: arrows move, Enter selects; Esc
 * is handled by the surrounding Popover (closes and returns focus).
 */
import { Check } from "lucide-react";
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from "./command";

export interface PersonOption {
  id: string;
  initialen: string;
  nachname: string;
  vorname: string;
  /** Role / function, shown small beneath the name. */
  rolle: string;
}

export interface PersonenAuswahlProps {
  personen: PersonOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  suchePlaceholder?: string;
  /** Width in px, default 300. */
  breite?: number;
  leerText?: string;
}

export function PersonenAuswahl({
  personen,
  selectedId,
  onSelect,
  suchePlaceholder = "Person suchen",
  breite = 300,
  leerText = "Keine Person gefunden.",
}: PersonenAuswahlProps) {
  return (
    <Command style={{ width: breite }}>
      <CommandInput placeholder={suchePlaceholder} />
      <CommandList>
        <CommandEmpty>{leerText}</CommandEmpty>
        {personen.map(p => {
          const gewaehlt = selectedId === p.id;
          return (
            <CommandItem
              key={p.id}
              value={`${p.nachname} ${p.vorname} ${p.initialen} ${p.rolle}`}
              onSelect={() => onSelect(p.id)}
              // Override the cmdk accent (foreign colour) with a system token for
              // the keyboard-active row; the chosen row is marked additionally below.
              className="!items-center data-[selected=true]:!bg-[var(--bg-secondary)] data-[selected=true]:!text-[var(--text-primary)]"
              style={{
                minHeight: 46,
                padding: "6px 8px",
                gap: 10,
                borderRadius: "var(--radius-input)",
                background: gewaehlt ? "var(--bg-tertiary)" : "transparent",
                border: gewaehlt ? "var(--border-thin) solid var(--border-default)" : "var(--border-thin) solid transparent",
              }}
            >
              {/* Kürzelkreis 28px — gleiche Darstellung wie im Kopf */}
              <span
                className="shrink-0 flex items-center justify-center"
                style={{ width: 28, height: 28, borderRadius: "var(--radius-pill)", background: "var(--bg-secondary)" }}
              >
                <span style={{ fontSize: 10, fontWeight: "var(--weight-semibold)", color: "var(--text-secondary)" }}>{p.initialen}</span>
              </span>
              {/* Name über Rolle, beide einzeilig → konstante Zeilenhöhe */}
              <span className="min-w-0" style={{ flex: 1, display: "flex", flexDirection: "column", lineHeight: 1.25 }}>
                <span className="truncate" style={{ fontSize: "var(--text-small)", fontWeight: gewaehlt ? "var(--weight-semibold)" : "var(--weight-medium)", color: "var(--text-primary)" }}>
                  {p.nachname}, {p.vorname}
                </span>
                <span className="truncate" style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>
                  {p.rolle}
                </span>
              </span>
              <Check style={{ width: 15, height: 15, flexShrink: 0, opacity: gewaehlt ? 1 : 0, color: "var(--text-secondary)" }} />
            </CommandItem>
          );
        })}
      </CommandList>
    </Command>
  );
}
