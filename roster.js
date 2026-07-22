/* Neon Hope playable characters and their signature Character Tool.
   Loaded as a plain script (no ES module) so the app also works via file://.

   Sources: neonhopedb.com (English card data) and the official German
   Print & Play demo (neonhopegame.com) for the four base characters.
   For the four base variants and four expansion characters, no official
   German Character-Tool names are published; their `toolDe` values are
   translations (flagged via toolDeOfficial = false). Character subtitles
   are official German in all cases (neonhopegame.com/de/).

   group: "base" = base game · "alt" = alternate base characters ·
          "expansion" = "A Hopeful Cause". Character tools are double-sided
          and written as "Front / Back". */
(function (global) {
  "use strict";

  global.ROSTER = [
    // ---- Base game ----
    {
      slug: "felina-drucker", group: "base",
      nameEn: "Felina Drucker", nameDe: "Felina Drucker",
      subtitleEn: "Tech Journalist", subtitleDe: "Tech-Journalistin",
      toolEn: "Insider Sources / Cybernetic Retina",
      toolDe: "Interne Quellen / Cybernetische Retina", toolDeOfficial: true,
    },
    {
      slug: "asim-shakib", group: "base",
      nameEn: "Asim Shakib", nameDe: "Asim Shakib",
      subtitleEn: "Gig Economy Worker", subtitleDe: "Gig-Economy-Arbeiter",
      toolEn: "Union Leadership / Neighborhood Solidarity",
      toolDe: "Gewerkschaftsführer / Nachbarschaftshilfe", toolDeOfficial: true,
    },
    {
      slug: "larx-krajewski", group: "base",
      nameEn: "Larx Krajewski", nameDe: "Larx Krajewski",
      subtitleEn: "Bouncer", subtitleDe: "Türsteher*in",
      toolEn: "Revoked Company ID / Confiscated Goods",
      toolDe: "Abgelaufener Dienstausweis / Beschlagnahmtes Zeug", toolDeOfficial: true,
    },
    {
      slug: "deniz-yilmaz", group: "base",
      nameEn: "Deniz Yilmaz", nameDe: "Deniz Yılmaz",
      subtitleEn: "AI Software Engineer", subtitleDe: "KI-Software-Entwickler",
      toolEn: "Bionic Prosthesis / Yilmaz.Deep 0.9 Beta",
      toolDe: "Bionische Prothese / Yilmaz.deep 0.9 beta", toolDeOfficial: true,
    },

    // ---- Alternate base characters ----
    {
      slug: "felina-drucker-vigilante-journalist", group: "alt",
      nameEn: "Felina Drucker", nameDe: "Felina Drucker",
      subtitleEn: "Vigilante Journalist", subtitleDe: "untergetauchte Journalistin",
      toolEn: "Lina_Leaks / Underground Contacts",
      toolDe: "Lina_Leaks / Untergrund-Kontakte", toolDeOfficial: false,
    },
    {
      slug: "asim-shakib-middle-manager", group: "alt",
      nameEn: "Asim Shakib", nameDe: "Asim Shakib",
      subtitleEn: "Middle Manager", subtitleDe: "Abteilungsleiter",
      toolEn: "Manage Upwards / Employee Stock Options",
      toolDe: "Nach oben führen / Mitarbeiteraktienoptionen", toolDeOfficial: false,
    },
    {
      slug: "larx-krajewski-chief-security-officer", group: "alt",
      nameEn: "Larx Krajewski", nameDe: "Larx Krajewski",
      subtitleEn: "Chief Security Officer", subtitleDe: "Sicherheitschef*in",
      toolEn: "Inner Confidence / Company ID",
      toolDe: "Innere Selbstsicherheit / Firmenausweis", toolDeOfficial: false,
    },
    {
      slug: "deniz-yilmaz-ai-ethics-professor", group: "alt",
      nameEn: "Deniz Yilmaz", nameDe: "Deniz Yılmaz",
      subtitleEn: "AI Ethics Professor", subtitleDe: "Professor für KI-Ethik",
      toolEn: "Member of the AI Alignment Panel / Research Grant",
      toolDe: "Mitglied des KI-Alignment-Gremiums / Forschungsstipendium", toolDeOfficial: false,
    },

    // ---- Expansion: A Hopeful Cause ----
    {
      slug: "giulia-caparelli", group: "expansion",
      nameEn: "Giulia Caparelli", nameDe: "Giulia Caparelli",
      subtitleEn: "Digital Rights Lawyer", subtitleDe: "Anwältin für digitale Rechte",
      toolEn: "Lawyer-Client Privilege / Grassroots Support",
      toolDe: "Anwaltliche Schweigepflicht / Graswurzel-Unterstützung", toolDeOfficial: false,
    },
    {
      slug: "veeron5", group: "expansion",
      nameEn: "Veeron5", nameDe: "Veeron5",
      subtitleEn: "Content Creator", subtitleDe: "Content Creatorin",
      toolEn: "Modified Wheelchair / AR Holofilter Avatar",
      toolDe: "Modifizierter Rollstuhl / AR-Holofilter-Avatar", toolDeOfficial: false,
    },
    {
      slug: "mattheo-m-baye", group: "expansion",
      nameEn: "Matthéo M'Baye", nameDe: "Matthéo M'Baye",
      subtitleEn: "Welfare Review Specialist", subtitleDe: "Fachbeamter für Sozialbetrug",
      toolEn: "Civic Database Access / Concealed Audio Amplifier",
      toolDe: "Zugang zur Bürgerdatenbank / Versteckter Audioverstärker", toolDeOfficial: false,
    },
    {
      slug: "jan-peter-grunwald", group: "expansion",
      nameEn: "Jan-Peter Grunwald", nameDe: "Jan-Peter Grunwald",
      subtitleEn: "Corporate Dropout", subtitleDe: "Kapitalismus-Aussteiger",
      toolEn: "Innovation Award / Anarcho-Futurist Manifesto",
      toolDe: "Innovationspreis / Anarcho-futuristisches Manifest", toolDeOfficial: false,
    },
  ];

  /* Look up a roster entry by slug (or null). */
  global.rosterBySlug = function (slug) {
    var list = global.ROSTER;
    for (var i = 0; i < list.length; i++) if (list[i].slug === slug) return list[i];
    return null;
  };
})(window);
