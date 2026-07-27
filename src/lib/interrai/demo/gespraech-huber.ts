/**
 * Demo conversation data — Fritz Huber Erstabklärung.
 *
 * A home visit by PFK Sandra Weber with Klient Fritz Huber (82) and
 * his wife/Angehörige Erika Huber (78). Fritz had a hip fracture
 * 4 months ago and is recovering at home.
 *
 * The dialogue uses colloquial Swiss-German-influenced standard German.
 * No instrument codes appear in the text — derivations happen in the
 * suggestion layer.
 */

import type { GespraechAbschnitt } from "../store";

export const GESPRAECH_HUBER: GespraechAbschnitt[] = [
  // ── Opening / Administrative context ──────────────────────────────────────
  {
    id: "SEG-001", sprecher: "pfk", sprecherName: "Sandra Weber",
    zeitmarke: "00:00:12",
    text: "Grüezi Herr Huber, Frau Huber. Ich bin Sandra Weber von der Spitex Kaufmann. Heute machen wir die Bedarfsabklärung, damit wir schauen können, welche Unterstützung Sie brauchen.",
  },
  {
    id: "SEG-002", sprecher: "klient", sprecherName: "Fritz Huber",
    zeitmarke: "00:00:35",
    text: "Ja, kommen Sie rein. Wir wohnen hier schon seit vierzig Jahren, das ist unsere Mietwohnung. Dritter Stock, aber wir haben zum Glück einen Lift.",
  },
  {
    id: "SEG-003", sprecher: "angehoerige", sprecherName: "Erika Huber",
    zeitmarke: "00:00:58",
    text: "Er war im Oktober im Spital, Hüftbruch. Seit Dezember ist er wieder daheim, aber es ist halt schwierig. Vorher war er nie im Spital, ausser einmal wegen der Galle, das war aber schon Jahre her.",
  },

  // ── Communication / Cognition ─────────────────────────────────────────────
  {
    id: "SEG-004", sprecher: "pfk", sprecherName: "Sandra Weber",
    zeitmarke: "00:01:30",
    text: "Herr Huber, können Sie mir sagen, welcher Tag heute ist und was wir heute hier besprechen?",
  },
  {
    id: "SEG-005", sprecher: "klient", sprecherName: "Fritz Huber",
    zeitmarke: "00:01:42",
    text: "Heute ist Dienstag. Sie kommen wegen der Spitex, das hat meine Frau organisiert. Manchmal muss ich halt nachfragen, was genau ansteht. Aber ich weiss schon, worum es geht.",
  },
  {
    id: "SEG-006", sprecher: "angehoerige", sprecherName: "Erika Huber",
    zeitmarke: "00:02:05",
    text: "Er vergisst halt schon mal, was wir gestern besprochen haben. Letzthin hat er mich dreimal das Gleiche gefragt, wann der Arzttermin ist. Aber im Grossen und Ganzen geht es schon noch.",
  },
  {
    id: "SEG-007", sprecher: "pfk", sprecherName: "Sandra Weber",
    zeitmarke: "00:02:30",
    text: "Herr Huber, können Sie sich erinnern, worüber wir gerade gesprochen haben?",
  },
  {
    id: "SEG-008", sprecher: "klient", sprecherName: "Fritz Huber",
    zeitmarke: "00:02:38",
    text: "Ja, wir haben über den Spitalaufenthalt geredet und dass Sie schauen kommen, was wir an Hilfe brauchen. Das weiss ich schon noch.",
  },
  {
    id: "SEG-009", sprecher: "pfk", sprecherName: "Sandra Weber",
    zeitmarke: "00:02:55",
    text: "Verstehen Sie mich gut? Brauchen Sie eine Brille oder ein Hörgerät?",
  },
  {
    id: "SEG-010", sprecher: "klient", sprecherName: "Fritz Huber",
    zeitmarke: "00:03:05",
    text: "Zum Lesen brauche ich die Brille, die liegt immer hier. Hören tue ich eigentlich gut, meine Frau sagt zwar, der Fernseher sei zu laut, aber ich höre Sie gut.",
  },

  // ── Mood / Psychosocial ───────────────────────────────────────────────────
  {
    id: "SEG-011", sprecher: "pfk", sprecherName: "Sandra Weber",
    zeitmarke: "00:03:40",
    text: "Wie geht es Ihnen so allgemein? Haben Sie manchmal das Gefühl, dass es Ihnen nicht gut geht, oder dass Sie sich niedergeschlagen fühlen?",
  },
  {
    id: "SEG-012", sprecher: "klient", sprecherName: "Fritz Huber",
    zeitmarke: "00:03:55",
    text: "Seit dem Sturz ist es schon nicht mehr wie vorher. Manchmal denke ich, wozu das alles noch. Ich war immer selbständig, und jetzt brauche ich für alles Hilfe. Das macht mich schon traurig.",
  },
  {
    id: "SEG-013", sprecher: "angehoerige", sprecherName: "Erika Huber",
    zeitmarke: "00:04:20",
    text: "Er schläft auch schlechter. Wacht nachts auf und grübelt. Am Morgen will er manchmal gar nicht aufstehen. Er war früher im Schützenverein, jeden Donnerstag, aber seit dem Spital geht er nicht mehr hin.",
  },
  {
    id: "SEG-014", sprecher: "klient", sprecherName: "Fritz Huber",
    zeitmarke: "00:04:50",
    text: "Ich mag einfach nicht mehr. Die Kameraden im Verein, die habe ich schon lange nicht mehr gesehen. Meine Tochter kommt am Sonntag, das ist schön. Aber die Woche ist lang.",
  },

  // ── IADL ──────────────────────────────────────────────────────────────────
  {
    id: "SEG-015", sprecher: "pfk", sprecherName: "Sandra Weber",
    zeitmarke: "00:05:25",
    text: "Wie sieht es aus mit dem Haushalt? Kochen, einkaufen, putzen — wer macht das?",
  },
  {
    id: "SEG-016", sprecher: "angehoerige", sprecherName: "Erika Huber",
    zeitmarke: "00:05:38",
    text: "Das mache alles ich. Kochen, einkaufen, putzen. Er kann sich einen Kaffee machen und ein Brot streichen, aber eine Mahlzeit kochen geht nicht. Einkaufen sowieso nicht, er kommt ja kaum die Treppe runter. Die Finanzen macht auch alles ich, seit dem Spital.",
  },
  {
    id: "SEG-017", sprecher: "klient", sprecherName: "Fritz Huber",
    zeitmarke: "00:06:10",
    text: "Telefonieren kann ich schon noch, wenn es sein muss. Und die Medikamente, die richtet mir meine Frau. Aber ich nehme sie selbst, wenn sie daran erinnert.",
  },

  // ── BADL ──────────────────────────────────────────────────────────────────
  {
    id: "SEG-018", sprecher: "pfk", sprecherName: "Sandra Weber",
    zeitmarke: "00:06:45",
    text: "Und die Körperpflege? Duschen, anziehen, zur Toilette gehen — wie läuft das?",
  },
  {
    id: "SEG-019", sprecher: "angehoerige", sprecherName: "Erika Huber",
    zeitmarke: "00:06:58",
    text: "Beim Duschen muss ich ihn stützen, alleine geht das nicht mehr. Er hat Angst, dass er ausrutscht. Oben anziehen, also Hemd und Pullover, das geht noch. Aber Hosen und Socken, da muss ich helfen. Die Schuhe sowieso.",
  },
  {
    id: "SEG-020", sprecher: "klient", sprecherName: "Fritz Huber",
    zeitmarke: "00:07:25",
    text: "Auf die Toilette gehe ich alleine, das schaffe ich schon. Manchmal dauert es halt etwas, bis ich dort bin. In der Wohnung laufe ich am Rollator, das geht einigermassen.",
  },
  {
    id: "SEG-021", sprecher: "pfk", sprecherName: "Sandra Weber",
    zeitmarke: "00:07:50",
    text: "Und wie ist es mit dem Essen? Können Sie selbständig essen und trinken?",
  },
  {
    id: "SEG-022", sprecher: "klient", sprecherName: "Fritz Huber",
    zeitmarke: "00:08:00",
    text: "Ja, essen und trinken kann ich selber. Den Teller halte ich gut, das geht. Meine Frau muss mir halt das Fleisch schneiden manchmal, wenn es zäh ist.",
  },
  {
    id: "SEG-023", sprecher: "pfk", sprecherName: "Sandra Weber",
    zeitmarke: "00:08:20",
    text: "Wie bewegen Sie sich ausserhalb der Wohnung? Gehen Sie spazieren?",
  },
  {
    id: "SEG-024", sprecher: "klient", sprecherName: "Fritz Huber",
    zeitmarke: "00:08:30",
    text: "Draussen gehe ich nur mit meiner Frau, und auch nur um den Block. Treppen sind schwierig, zum Glück hat es den Lift. Aber ich gehe schon jeden Tag ein bisschen, sonst wird es nur schlimmer.",
  },

  // ── Continence ────────────────────────────────────────────────────────────
  {
    id: "SEG-025", sprecher: "pfk", sprecherName: "Sandra Weber",
    zeitmarke: "00:09:05",
    text: "Wie ist es mit der Kontinenz? Haben Sie Schwierigkeiten, die Blase oder den Stuhlgang zu kontrollieren?",
  },
  {
    id: "SEG-026", sprecher: "klient", sprecherName: "Fritz Huber",
    zeitmarke: "00:09:18",
    text: "Ab und zu geht schon mal ein Tropfen daneben, besonders nachts oder wenn ich nicht schnell genug bin. Aber es ist nicht so, dass ich ständig nass bin. Stuhlgang ist kein Problem.",
  },

  // ── Health conditions / Diagnoses ─────────────────────────────────────────
  {
    id: "SEG-027", sprecher: "pfk", sprecherName: "Sandra Weber",
    zeitmarke: "00:09:50",
    text: "Welche Krankheiten haben Sie denn? Was hat der Arzt diagnostiziert?",
  },
  {
    id: "SEG-028", sprecher: "klient", sprecherName: "Fritz Huber",
    zeitmarke: "00:10:02",
    text: "Also das Blutdruck-Problem, das habe ich schon seit Jahren. Und Zucker, also Diabetes, seit etwa fünf Jahren. Die Arthrose in den Knien, die macht mir auch zu schaffen. Und jetzt halt die Hüfte, die ist seit dem Bruch noch nicht richtig verheilt.",
  },
  {
    id: "SEG-029", sprecher: "angehoerige", sprecherName: "Erika Huber",
    zeitmarke: "00:10:30",
    text: "Und das Herz, Fritz. Der Arzt hat gesagt, das Herz sei auch nicht mehr so stark. Herzinsuffizienz, hat er gesagt.",
  },

  // ── Falls / Pain / Health state ───────────────────────────────────────────
  {
    id: "SEG-030", sprecher: "pfk", sprecherName: "Sandra Weber",
    zeitmarke: "00:10:55",
    text: "Sind Sie in den letzten Monaten gestürzt, abgesehen vom Hüftbruch?",
  },
  {
    id: "SEG-031", sprecher: "klient", sprecherName: "Fritz Huber",
    zeitmarke: "00:11:05",
    text: "Seit ich daheim bin, bin ich einmal im Badezimmer ausgerutscht, aber da habe ich mich gerade noch halten können. Es war knapp. Ich passe jetzt besser auf.",
  },
  {
    id: "SEG-032", sprecher: "pfk", sprecherName: "Sandra Weber",
    zeitmarke: "00:11:25",
    text: "Haben Sie Schmerzen? Wo und wie stark?",
  },
  {
    id: "SEG-033", sprecher: "klient", sprecherName: "Fritz Huber",
    zeitmarke: "00:11:32",
    text: "Die Hüfte tut noch weh, vor allem beim Aufstehen und beim Gehen. Und die Knie, die sind schon länger ein Problem. Jeden Tag, eigentlich. Manchmal nehme ich ein Dafalgan, dann geht es besser.",
  },

  // ── Medications ───────────────────────────────────────────────────────────
  {
    id: "SEG-034", sprecher: "pfk", sprecherName: "Sandra Weber",
    zeitmarke: "00:12:05",
    text: "Welche Medikamente nehmen Sie?",
  },
  {
    id: "SEG-035", sprecher: "angehoerige", sprecherName: "Erika Huber",
    zeitmarke: "00:12:12",
    text: "Ich habe die Liste hier. Also: Metformin für den Zucker, Lisinopril für den Blutdruck, Aspirin Cardio, dann das Xarelto seit dem Spital, und Dafalgan bei Bedarf. Das sind fünf, und manchmal Ibuprofen für die Knie. Ich richte ihm alles in die Dosette.",
  },
  {
    id: "SEG-036", sprecher: "klient", sprecherName: "Fritz Huber",
    zeitmarke: "00:12:45",
    text: "Die Tabletten nehme ich schon selber. Meine Frau stellt sie mir hin, und dann nehme ich sie nach dem Frühstück. Manchmal vergesse ich es, dann erinnert sie mich.",
  },

  // ── Nutrition ─────────────────────────────────────────────────────────────
  {
    id: "SEG-037", sprecher: "pfk", sprecherName: "Sandra Weber",
    zeitmarke: "00:13:15",
    text: "Wie ist der Appetit? Essen Sie regelmässig?",
  },
  {
    id: "SEG-038", sprecher: "angehoerige", sprecherName: "Erika Huber",
    zeitmarke: "00:13:22",
    text: "Er isst schon, aber weniger als früher. Das Mittagessen, das ist die Hauptmahlzeit. Am Abend nur noch ein Brot und eine Suppe. Er hat ein bisschen abgenommen, vielleicht drei, vier Kilo seit dem Spital.",
  },
  {
    id: "SEG-039", sprecher: "klient", sprecherName: "Fritz Huber",
    zeitmarke: "00:13:48",
    text: "Trinken tue ich schon genug, Kaffee am Morgen und Wasser über den Tag. Schlucken kann ich gut, da habe ich kein Problem.",
  },

  // ── Social support / Environment ──────────────────────────────────────────
  {
    id: "SEG-040", sprecher: "pfk", sprecherName: "Sandra Weber",
    zeitmarke: "00:14:15",
    text: "Wer unterstützt Sie zu Hause? Haben Sie neben Ihrer Frau noch weitere Hilfe?",
  },
  {
    id: "SEG-041", sprecher: "angehoerige", sprecherName: "Erika Huber",
    zeitmarke: "00:14:25",
    text: "Unsere Tochter kommt jeden Sonntag und hilft dann auch im Haushalt. Sonst macht alles ich. Der Nachbar schaut ab und zu vorbei, aber Pflege macht natürlich nur ich. Es ist schon streng, ich bin ja auch nicht mehr die Jüngste.",
  },
  {
    id: "SEG-042", sprecher: "pfk", sprecherName: "Sandra Weber",
    zeitmarke: "00:14:55",
    text: "Haben Sie einen Notfallknopf oder etwas Ähnliches, falls etwas passiert?",
  },
  {
    id: "SEG-043", sprecher: "klient", sprecherName: "Fritz Huber",
    zeitmarke: "00:15:05",
    text: "Nein, so etwas haben wir nicht. Meine Frau ist ja immer da. Und das Telefon liegt immer neben mir.",
  },

  // ── Skin / Treatments ─────────────────────────────────────────────────────
  {
    id: "SEG-044", sprecher: "pfk", sprecherName: "Sandra Weber",
    zeitmarke: "00:15:35",
    text: "Haben Sie irgendwelche Wunden oder Hautprobleme?",
  },
  {
    id: "SEG-045", sprecher: "angehoerige", sprecherName: "Erika Huber",
    zeitmarke: "00:15:42",
    text: "Die Narbe von der Operation ist gut verheilt. Sonst hat er trockene Haut an den Beinen, aber keine offenen Stellen.",
  },

  // ── Closing ───────────────────────────────────────────────────────────────
  {
    id: "SEG-046", sprecher: "pfk", sprecherName: "Sandra Weber",
    zeitmarke: "00:16:10",
    text: "Wie schätzen Sie selbst Ihren Gesundheitszustand ein im Vergleich zu vor dem Spital?",
  },
  {
    id: "SEG-047", sprecher: "klient", sprecherName: "Fritz Huber",
    zeitmarke: "00:16:20",
    text: "Schlechter, klar. Vor dem Sturz bin ich noch selber einkaufen gegangen. Jetzt ist alles mühsamer. Aber ich hoffe, dass es wieder besser wird. Die Physiotherapie hilft schon.",
  },

  // ── Nutrition (K) ─────────────────────────────────────────────────────────
  {
    id: "SEG-048", sprecher: "angehoerige", sprecherName: "Erika Huber",
    zeitmarke: "00:16:55",
    text: "Er hat drei, vier Kilo abgenommen seit dem Spital, das ist nicht so viel, aber er isst halt weniger als früher. Das Mittagessen ist die Hauptmahlzeit.",
  },
  {
    id: "SEG-049", sprecher: "klient", sprecherName: "Fritz Huber",
    zeitmarke: "00:17:15",
    text: "Trinken tue ich genug, Kaffee am Morgen und Wasser über den Tag. Mindestens vier, fünf Gläser. Und eine Suppe am Abend.",
  },
  {
    id: "SEG-050a", sprecher: "pfk", sprecherName: "Sandra Weber",
    zeitmarke: "00:17:35",
    text: "Haben Sie Mühe beim Schlucken oder bei der Nahrungsaufnahme?",
  },
  {
    id: "SEG-050", sprecher: "angehoerige", sprecherName: "Erika Huber",
    zeitmarke: "00:17:42",
    text: "Nein, er kann alles essen. Schlucken ist kein Problem. Das Fleisch schneide ich ihm halt manchmal, aber kauen kann er gut.",
  },
  {
    id: "SEG-051", sprecher: "angehoerige", sprecherName: "Erika Huber",
    zeitmarke: "00:17:58",
    text: "Oben hat er eine Prothese, die ist aber gut eingepasst. Unten sind noch seine eigenen Zähne. Beim Zahnarzt waren wir letztes Jahr.",
  },

  // ── Medications (M) ───────────────────────────────────────────────────────
  {
    id: "SEG-052", sprecher: "angehoerige", sprecherName: "Erika Huber",
    zeitmarke: "00:18:20",
    text: "Die Medikamentenliste habe ich hier, alles aktuell. Der Hausarzt hat sie letzte Woche nochmal angepasst.",
  },
  {
    id: "SEG-053a", sprecher: "pfk", sprecherName: "Sandra Weber",
    zeitmarke: "00:18:35",
    text: "Gibt es Medikamentenallergien?",
  },
  {
    id: "SEG-053", sprecher: "angehoerige", sprecherName: "Erika Huber",
    zeitmarke: "00:18:40",
    text: "Allergien hat er keine, also auf Medikamente nicht. Das steht auch beim Hausarzt so drin.",
  },
  {
    id: "SEG-054", sprecher: "angehoerige", sprecherName: "Erika Huber",
    zeitmarke: "00:18:55",
    text: "Er nimmt sie meistens selber, ich stelle sie in die Dosette. Aber manchmal vergisst er es, dann erinnere ich ihn. Vielleicht einmal die Woche passiert das.",
  },

  // ── Treatments (N) ────────────────────────────────────────────────────────
  {
    id: "SEG-055a", sprecher: "pfk", sprecherName: "Sandra Weber",
    zeitmarke: "00:19:20",
    text: "Haben Sie irgendwelche besonderen Behandlungen, Infusionen, Bestrahlungen, etwas in der Art?",
  },
  {
    id: "SEG-055", sprecher: "klient", sprecherName: "Fritz Huber",
    zeitmarke: "00:19:30",
    text: "Nein, nein, so etwas nicht. Ich nehme einfach die Tabletten und gehe zur Physio.",
  },
  {
    id: "SEG-056a", sprecher: "pfk", sprecherName: "Sandra Weber",
    zeitmarke: "00:19:45",
    text: "Und die Narbe von der Hüftoperation — braucht die noch Pflege?",
  },
  {
    id: "SEG-056", sprecher: "angehoerige", sprecherName: "Erika Huber",
    zeitmarke: "00:19:52",
    text: "Nein, die ist gut verheilt. Der Hausarzt hat letzthin nochmal geschaut, alles in Ordnung. Keine offenen Stellen, nichts.",
  },
  {
    id: "SEG-057", sprecher: "pfk", sprecherName: "Sandra Weber",
    zeitmarke: "00:20:10",
    text: "Gut. Mit der Spitex werden wir regelmässig jemanden vorbeischicken, eine ausgebildete Pflegefachperson. Deswegen sind wir ja heute da.",
  },
  {
    id: "SEG-058", sprecher: "angehoerige", sprecherName: "Erika Huber",
    zeitmarke: "00:20:30",
    text: "Ja, er hat einmal die Woche Physio, immer am Mittwoch, eine halbe Stunde. Die kommt zu uns nach Hause. Das hilft ihm schon, die Übungen.",
  },

  // ── Medication count (M1) ─────────────────────────────────────────────────
  {
    id: "SEG-059", sprecher: "pfk", sprecherName: "Sandra Weber",
    zeitmarke: "00:20:55",
    text: "Frau Huber, wenn ich richtig gezählt habe: Metformin, Lisinopril, Aspirin Cardio, Xarelto und Dafalgan bei Bedarf. Das sind fünf Medikamente?",
  },
  {
    id: "SEG-060", sprecher: "angehoerige", sprecherName: "Erika Huber",
    zeitmarke: "00:21:10",
    text: "Genau, fünf. Und manchmal noch Ibuprofen für die Knie, aber das nimmt er nur, wenn es gar nicht mehr geht.",
  },
];
