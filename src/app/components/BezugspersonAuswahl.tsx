/**
 * BezugspersonAuswahl — assigns, changes or removes the case's Bezugsperson from
 * the onboarding header context row.
 *
 * The value is stored on the care relationship (lib/betreuung/store) as a user
 * id; the display name is derived from the Diplomierte roster. Every change is
 * logged with timestamp and acting user. Selection is single-choice and
 * searchable.
 */
import { useState } from "react";
import { UserPlus, X, Check, ChevronDown } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "./ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from "./ui/command";
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
    <span className="inline-flex items-center" style={{ gap: 5 }}>
      {selected && <span style={{ color: "var(--text-tertiary)" }}>Bezugsperson:</span>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center cursor-pointer"
            style={{ gap: 4, fontSize: "var(--text-meta)", fontFamily: "inherit", background: "none", border: "none", padding: 0, color: selected ? "var(--text-secondary)" : "var(--text-tertiary)" }}
          >
            {selected ? (
              <>
                <span style={{ fontWeight: 600 }}>{selected.initialen}</span>
                <span>{diplomierterAnzeigename(selected)}</span>
                <ChevronDown style={{ width: 11, height: 11, opacity: 0.7 }} />
              </>
            ) : (
              <>
                <UserPlus style={{ width: 11, height: 11 }} />
                <span>Bezugsperson zuweisen</span>
              </>
            )}
          </button>
        </PopoverTrigger>
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
      {selected && (
        <button
          type="button"
          onClick={() => zuweisen(null)}
          title="Bezugsperson entfernen"
          aria-label="Bezugsperson entfernen"
          className="inline-flex items-center cursor-pointer"
          style={{ background: "none", border: "none", padding: 0, color: "var(--text-tertiary)" }}
        >
          <X style={{ width: 11, height: 11 }} />
        </button>
      )}
    </span>
  );
}
