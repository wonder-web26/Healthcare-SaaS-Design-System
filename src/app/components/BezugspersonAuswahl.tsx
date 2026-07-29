/**
 * BezugspersonAuswahl — assigns, changes or removes the case's Bezugsperson.
 *
 * The value is stored on the care relationship (lib/betreuung/store) as a user
 * id; the display name is derived from the Diplomierte roster. Every change is
 * logged with timestamp and acting user. Selection is single-choice and
 * searchable.
 *
 * The visible field is the shared BezugspersonFeld; the picker is the shared
 * PersonenAuswahl. This component only adds the data wiring and returns focus to
 * the surface when the popover closes.
 */
import { useRef, useState } from "react";
import { Popover, PopoverAnchor, PopoverContent } from "./ui/popover";
import { PersonenAuswahl, type PersonOption } from "./ui/PersonenAuswahl";
import { BezugspersonFeld } from "./BezugspersonFeld";
import { useCurrentUser } from "../auth";
import { getDiplomierte, getDiplomierterById, diplomierterAnzeigename } from "../../lib/betreuung/diplomierte";
import { getBezugspersonId, setBezugsperson } from "../../lib/betreuung/store";

const personen: PersonOption[] = getDiplomierte().map(d => ({
  id: d.id, initialen: d.initialen, nachname: d.name, vorname: d.vorname, rolle: d.funktion,
}));

export function BezugspersonAuswahl({ caseId }: { caseId: string }) {
  const currentUser = useCurrentUser();
  const [open, setOpen] = useState(false);
  const surfaceRef = useRef<HTMLButtonElement>(null);
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
        <span className="inline-flex">
          <BezugspersonFeld
            surfaceRef={surfaceRef}
            person={selected ? { initialen: selected.initialen, name: diplomierterAnzeigename(selected) } : null}
            onAktivieren={() => setOpen(o => !o)}
            onEntfernen={selected ? () => zuweisen(null) : undefined}
            offen={open}
          />
        </span>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={6}
        style={{ width: 300, padding: 6 }}
        onEscapeKeyDown={() => setOpen(false)}
        onCloseAutoFocus={e => { e.preventDefault(); surfaceRef.current?.focus(); }}
      >
        <PersonenAuswahl
          personen={personen}
          selectedId={userId}
          onSelect={zuweisen}
          suchePlaceholder="Person suchen"
          leerText="Keine Person gefunden."
        />
      </PopoverContent>
    </Popover>
  );
}
