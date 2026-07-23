/* Neon Hope playable characters and their signature Character Tool.
   Loaded as a plain script (no ES module) so the app also works via file://.

   Sources: neonhopedb.com (English card data) and the official German
   Print & Play demo (neonhopegame.com) for the four base characters.
   For the four base variants and four expansion characters, no official
   German Character-Tool names are published; their `de` values are
   translations (flagged via toolDeOfficial = false). Character subtitles
   are official German in all cases (neonhopegame.com/de/).

   group: "base" = base game · "alt" = alternate base characters ·
          "expansion" = "A Hopeful Cause".

   Each character has one double-sided Character Tool, modelled as `tools`
   with two sides (front first, back second). Each side has a stable
   internal `slug` (kebab-case of the English name) used to persist the
   player's chosen side; these are NOT guaranteed to match neonhopedb card
   URLs. `toolDeOfficial` applies to both sides. */
(function (global) {
  "use strict";

  global.ROSTER = [
    // ---- Base game ----
    {
      slug: "felina-drucker", group: "base",
      nameEn: "Felina Drucker", nameDe: "Felina Drucker",
      subtitleEn: "Tech Journalist", subtitleDe: "Tech-Journalistin",
      toolDeOfficial: true,
      tools: [
        { slug: "insider-sources", en: "Insider Sources", de: "Interne Quellen" },
        { slug: "cybernetic-retina", en: "Cybernetic Retina", de: "Cybernetische Retina" },
      ],
    },
    {
      slug: "asim-shakib", group: "base",
      nameEn: "Asim Shakib", nameDe: "Asim Shakib",
      subtitleEn: "Gig Economy Worker", subtitleDe: "Gig-Economy-Arbeiter",
      toolDeOfficial: true,
      tools: [
        { slug: "union-leadership", en: "Union Leadership", de: "Gewerkschaftsführer" },
        { slug: "neighborhood-solidarity", en: "Neighborhood Solidarity", de: "Nachbarschaftshilfe" },
      ],
    },
    {
      slug: "larx-krajewski", group: "base",
      nameEn: "Larx Krajewski", nameDe: "Larx Krajewski",
      subtitleEn: "Bouncer", subtitleDe: "Türsteher*in",
      toolDeOfficial: true,
      tools: [
        { slug: "revoked-company-id", en: "Revoked Company ID", de: "Abgelaufener Dienstausweis" },
        { slug: "confiscated-goods", en: "Confiscated Goods", de: "Beschlagnahmtes Zeug" },
      ],
    },
    {
      slug: "deniz-yilmaz", group: "base",
      nameEn: "Deniz Yilmaz", nameDe: "Deniz Yılmaz",
      subtitleEn: "AI Software Engineer", subtitleDe: "KI-Software-Entwickler",
      toolDeOfficial: true,
      tools: [
        { slug: "bionic-prosthesis", en: "Bionic Prosthesis", de: "Bionische Prothese" },
        { slug: "yilmaz-deep-0-9-beta", en: "Yilmaz.Deep 0.9 Beta", de: "Yilmaz.deep 0.9 beta" },
      ],
    },

    // ---- Alternate base characters ----
    {
      slug: "felina-drucker-vigilante-journalist", group: "alt",
      nameEn: "Felina Drucker", nameDe: "Felina Drucker",
      subtitleEn: "Vigilante Journalist", subtitleDe: "Untergetauchte Journalistin",
      toolDeOfficial: true,
      tools: [
        { slug: "lina-leaks", en: "Lina_Leaks", de: "Lina_Leaks" },
        { slug: "underground-contacts", en: "Underground Contacts", de: "Untergrund-Kontakte" },
      ],
    },
    {
      slug: "asim-shakib-middle-manager", group: "alt",
      nameEn: "Asim Shakib", nameDe: "Asim Shakib",
      subtitleEn: "Middle Manager", subtitleDe: "Abteilungsleiter",
      toolDeOfficial: true,
      tools: [
        { slug: "manage-upwards", en: "Manage Upwards", de: "Nach Oben Managen" },
        { slug: "employee-stock-options", en: "Employee Stock Options", de: "Mitarbeiter-Anteile" },
      ],
    },
    {
      slug: "larx-krajewski-chief-security-officer", group: "alt",
      nameEn: "Larx Krajewski", nameDe: "Larx Krajewski",
      subtitleEn: "Chief Security Officer", subtitleDe: "Sicherheitschef*in",
      toolDeOfficial: true,
      tools: [
        { slug: "inner-confidence", en: "Inner Confidence", de: "Starkes Selbstvertrauen" },
        { slug: "company-id", en: "Company ID", de: "Dienstausweis" },
      ],
    },
    {
      slug: "deniz-yilmaz-ai-ethics-professor", group: "alt",
      nameEn: "Deniz Yilmaz", nameDe: "Deniz Yilmaz",
      subtitleEn: "AI Ethics Professor", subtitleDe: "Professor für KI-Ethik",
      toolDeOfficial: false,
      tools: [
        { slug: "member-of-the-ai-alignment-panel", en: "Member of the AI Alignment Panel", de: "Mitglied des KI-Alignment-Gremiums" },
        { slug: "research-grant", en: "Research Grant", de: "Forschungsstipendium" },
      ],
    },

    // ---- Expansion: A Hopeful Cause ----
    {
      slug: "giulia-caparelli", group: "expansion",
      nameEn: "Giulia Caparelli", nameDe: "Giulia Caparelli",
      subtitleEn: "Digital Rights Lawyer", subtitleDe: "Anwältin für digitale Rechte",
      toolDeOfficial: false,
      tools: [
        { slug: "lawyer-client-privilege", en: "Lawyer-Client Privilege", de: "Anwaltliche Schweigepflicht" },
        { slug: "grassroots-support", en: "Grassroots Support", de: "Graswurzel-Unterstützung" },
      ],
    },
    {
      slug: "veeron5", group: "expansion",
      nameEn: "Veeron5", nameDe: "Veeron5",
      subtitleEn: "Content Creator", subtitleDe: "Content Creatorin",
      toolDeOfficial: false,
      tools: [
        { slug: "modified-wheelchair", en: "Modified Wheelchair", de: "Modifizierter Rollstuhl" },
        { slug: "ar-holofilter-avatar", en: "AR Holofilter Avatar", de: "AR-Holofilter-Avatar" },
      ],
    },
    {
      slug: "mattheo-m-baye", group: "expansion",
      nameEn: "Matthéo M'Baye", nameDe: "Matthéo M'Baye",
      subtitleEn: "Welfare Review Specialist", subtitleDe: "Fachbeamter für Sozialbetrug",
      toolDeOfficial: false,
      tools: [
        { slug: "civic-database-access", en: "Civic Database Access", de: "Zugang zur Bürgerdatenbank" },
        { slug: "concealed-audio-amplifier", en: "Concealed Audio Amplifier", de: "Versteckter Audioverstärker" },
      ],
    },
    {
      slug: "jan-peter-grunwald", group: "expansion",
      nameEn: "Jan-Peter Grunwald", nameDe: "Jan-Peter Grunwald",
      subtitleEn: "Corporate Dropout", subtitleDe: "Kapitalismus-Aussteiger",
      toolDeOfficial: false,
      tools: [
        { slug: "innovation-award", en: "Innovation Award", de: "Innovationspreis" },
        { slug: "anarcho-futurist-manifesto", en: "Anarcho-Futurist Manifesto", de: "Anarcho-futuristisches Manifest" },
      ],
    },
  ];

  /* Look up a roster entry by character slug (or null). */
  global.rosterBySlug = function (slug) {
    var list = global.ROSTER;
    for (var i = 0; i < list.length; i++) if (list[i].slug === slug) return list[i];
    return null;
  };
})(window);
