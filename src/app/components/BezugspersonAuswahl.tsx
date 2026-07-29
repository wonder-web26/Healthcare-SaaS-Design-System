/**
 * BezugspersonAuswahl — assigns, changes or removes the case's Bezugsperson.
 *
 * The value is stored on the care relationship (lib/betreuung/store) as a user
 * id; the display name is derived from the Diplomierte roster. Every change is
 * logged with timestamp and acting user. Selection is single-choice and
 * searchable.
 *
 * The visible field is the shared BezugspersonFeld (empty / assigned states);
 * this component only adds the data wiring and the searchable picker.
 */
import { useState } from "react";
import { Check } from "lucide-react";
import { Popover, PopoverAnchor, PopoverContent } from "./ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from "./ui/command";
import { BezugspersonFeld } from "./BezugspersonFeld";
import { useCurrentUser } from "../auth";
import { getDiplomierte, getDiplomierterById, diplomierterAnzeigename } from "../../lib/betreuung/diplomierte";
import { getBezugspersonId, setBezugsperson } from "../../lib/betreuung/store";

export function BezugspersonAuswahl({ caseId }: { caseId: string }) {
  const currentUser = useCurrentUser();
  const [open, setOpen] = useState(false);
  // Initialise from the store so the value persists across navigation.
  const [userId, setUserId] = useState<string | null>(() => getBezugspersonId(caseId));

  const selected = getDiplomierterById(userId);
  const handelnder = { id: currentUser.id, name: `${currentUser.vorname} ${currentUser.name}` };

  const zuweisen = (id: string | null) => {
    setBezugsperson(caseId, id, handelnder);
    setUserId(id);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <BezugspersonFeld
          person={selected ? { initialen: selected.initialen, name: diplomierterAnzeigename(selected) } : null}
          onAktivieren={() => setOpen(o => !o)}
          onEntfernen={selected ? () => zuweisen(null) : undefined}
          offen={open}
        />
      </PopoverAnchor>
      <PopoverContent align="start" side="bottom" sideOffset={6} style={{ width: 280, padding: 0 }} onEscapeKeyDown={() => setOpen(false)}>
        <Command>
          <CommandInput placeholder="Diplomierte suchen…" />
          <CommandList>
            <CommandEmpty>Keine Diplomierte gefunden.</CommandEmpty>
            {getDiplomierte().map(d => (
              <CommandItem key={d.id} value={`${d.vorname} ${d.name} ${d.initialen}`} onSelect={() => zuweisen(d.id)}>
                <Check style={{ width: 13, height: 13, marginRight: 8, opacity: userId === d.id ? 1 : 0 }} />
                <span style={{ fontWeight: 600, marginRight: 6, fontVariantNumeric: "tabular-nums" }}>{d.initialen}</span>
                <span style={{ flex: 1 }}>{diplomierterAnzeigename(d)}</span>
                <span style={{ fontSize: "var(--text-meta)", color: "var(--text-tertiary)" }}>{d.funktion}</span>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
