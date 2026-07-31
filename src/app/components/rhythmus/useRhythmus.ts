import { useSyncExternalStore } from "react";
import { subscribeRhythmus, getRhythmusVersion } from "../../../lib/rhythmus/engine";

/**
 * Abonniert den Rhythmus-Store. Jede Store-Mutation (Instanz erzeugt, Ticket
 * erledigt, Fälligkeit verschoben) erhöht die Version und erzwingt in allen
 * abonnierenden Ansichten ein Re-Render — so erreicht eine Änderung im
 * Modul-Array die Oberfläche. Nutzt Reacts eingebautes useSyncExternalStore,
 * ohne neue Abhängigkeit.
 *
 * Der Rückgabewert (Version) muss nicht verwendet werden; das blosse Aufrufen
 * des Hooks genügt, um die Ansicht anzumelden.
 */
export function useRhythmus(): number {
  return useSyncExternalStore(subscribeRhythmus, getRhythmusVersion, getRhythmusVersion);
}
