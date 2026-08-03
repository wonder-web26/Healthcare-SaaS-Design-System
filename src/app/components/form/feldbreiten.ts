/**
 * Feld- und Formularbreiten — reine Layoutvorgaben, keine Komponenten.
 * EINZIGE Quelle der Breitenwerte; alle verwendenden Dateien importieren von hier.
 */

/* ── Feldbreitenklassen. schmal/mittel begrenzen die Maximalbreite, "voll" =
   Rasterzelle (keine Begrenzung). Die Klasse wird je Feld an der Aufrufstelle
   zugewiesen, nicht aus dem Feldnamen abgeleitet. Ein schmales Feld füllt seine
   Rasterzelle nicht aus; die Lücke rechts ist beabsichtigt. ── */
export const FELD_MAX = { schmal: "12rem", mittel: "22rem", voll: "none" } as const;

/* ── Maximalbreite des Formularbereichs. Gilt für Raster, Abschnittsüberschriften,
   Trennlinien und "voll"-Felder gemeinsam (dieselbe rechte Kante, keine Stufe),
   linksbündig. Die Reiterzeile ist NICHT betroffen. ── */
export const FORMULAR_MAX = 880;
