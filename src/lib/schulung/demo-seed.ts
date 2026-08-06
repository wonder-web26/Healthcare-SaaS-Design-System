/**
 * Demo-Seed: Erstellt einen Schulungsnachweis für die bestehende Anna-Müller-Konstellation.
 * Wird beim Import automatisch ausgeführt.
 */
import { erstelleNachweis } from "./nachweis-store";

// Steiner, Alt-Fall: konvertiertes Onboarding, 11 KLV-Positionen
export const DEMO_NACHWEIS = erstelleNachweis(
  "A-2026-0101",                    // angehoerigerId (Vera Steiner)
  "Steiner, Vera",                  // angehoerigerName
  "srk",                            // qualifikation
  "P-2026-0041",                    // patientId (Steiner, Hans-Rudolf)
  "Steiner, Hans-Rudolf",           // patientName
  "Sandra Weber",                   // ausbildendeName
  ["10901", "10904", "10907", "10909", "10602", "10802", "10808", "10110", "10104", "10114", "10505"],
);
