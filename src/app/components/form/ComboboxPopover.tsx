/**
 * Searchable select drawn in a portal — same base as the date picker's popover
 * (shadcn Popover) plus shadcn Command for the list. Because the list lives in
 * a portal it is never clipped by a parent with overflow:hidden; it flips above
 * when there is no room below, Esc closes it and returns focus to the field,
 * and arrow keys / Enter navigate (cmdk). No hand-rolled list.
 */
import { useRef, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "../ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from "../ui/command";

export interface ComboOption {
  value: string;
  label: string;
}

export function ComboboxPopover({
  value,
  onChange,
  options,
  placeholder = "Wählen",
  disabled,
}: {
  value: string | null;
  onChange: (v: string) => void;
  options: ComboOption[];
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selected = options.find((o) => o.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          aria-expanded={open}
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
            width: "100%", boxSizing: "border-box",
            padding: "11px 14px", borderRadius: "var(--radius-card)",
            border: `${open ? "1.5px" : "var(--border-thin)"} solid ${open ? "var(--brand-primary)" : "var(--border-default)"}`,
            background: disabled ? "var(--bg-secondary)" : "var(--bg-elevated)",
            fontSize: "var(--text-body)", color: selected ? "var(--text-primary)" : "var(--text-tertiary)",
            fontFamily: "inherit", cursor: disabled ? "not-allowed" : "pointer", textAlign: "left",
          }}
        >
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronsUpDown style={{ width: 14, height: 14, color: "var(--text-tertiary)", flexShrink: 0 }} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={4}
        style={{ width: "var(--radix-popover-trigger-width)", padding: 0 }}
        onEscapeKeyDown={() => setOpen(false)}
        onCloseAutoFocus={(e) => { e.preventDefault(); triggerRef.current?.focus(); }}
      >
        <Command>
          <CommandInput placeholder="Suchen…" />
          <CommandList>
            <CommandEmpty>Kein Treffer.</CommandEmpty>
            {options.map((o) => (
              <CommandItem
                key={o.value}
                value={o.label}
                onSelect={() => {
                  onChange(o.value);
                  setOpen(false);
                  requestAnimationFrame(() => triggerRef.current?.focus());
                }}
              >
                <Check style={{ width: 14, height: 14, marginRight: 6, opacity: value === o.value ? 1 : 0 }} />
                {o.label}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
