/* Neon Hope playable characters and their signature Character Tool.
   Loaded as a plain script (no ES module) so the app also works via file://.

   English card data from neonhopedb.com; German names from the official
   German release (neonhopegame.com). Character subtitles are official
   German (neonhopegame.com/de/).

   group: "base" = base game · "alt" = alternate base characters ·
          "expansion" = "A Hopeful Cause".

   Each character has one double-sided Character Tool, modelled as `tools`
   with two sides (front first, back second). Each side has a stable
   internal `slug` (kebab-case of the English name) used to persist the
   player's chosen side; these are NOT guaranteed to match neonhopedb card
   URLs. */
(function (global) {
  "use strict";

  global.ROSTER = [
    // ---- Base game ----
    {
      slug: "felina-drucker", group: "base",
      nameEn: "Felina Drucker", nameDe: "Felina Drucker",
      subtitleEn: "Tech Journalist", subtitleDe: "Tech-Journalistin",
      tools: [
        { slug: "insider-sources", en: "Insider Sources", de: "Interne Quellen" },
        { slug: "cybernetic-retina", en: "Cybernetic Retina", de: "Cybernetische Retina" },
      ],
    },
    {
      slug: "asim-shakib", group: "base",
      nameEn: "Asim Shakib", nameDe: "Asim Shakib",
      subtitleEn: "Gig Economy Worker", subtitleDe: "Gig-Economy-Arbeiter",
      tools: [
        { slug: "union-leadership", en: "Union Leadership", de: "Gewerkschaftsführer" },
        { slug: "neighborhood-solidarity", en: "Neighborhood Solidarity", de: "Nachbarschaftshilfe" },
      ],
    },
    {
      slug: "larx-krajewski", group: "base",
      nameEn: "Larx Krajewski", nameDe: "Larx Krajewski",
      subtitleEn: "Bouncer", subtitleDe: "Türsteher*in",
      tools: [
        { slug: "revoked-company-id", en: "Revoked Company ID", de: "Abgelaufener Dienstausweis" },
        { slug: "confiscated-goods", en: "Confiscated Goods", de: "Beschlagnahmtes Zeug" },
      ],
    },
    {
      slug: "deniz-yilmaz", group: "base",
      nameEn: "Deniz Yilmaz", nameDe: "Deniz Yılmaz",
      subtitleEn: "AI Software Engineer", subtitleDe: "KI-Software-Entwickler",
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
      tools: [
        { slug: "lina-leaks", en: "Lina_Leaks", de: "Lina_Leaks" },
        { slug: "underground-contacts", en: "Underground Contacts", de: "Untergrund-Kontakte" },
      ],
    },
    {
      slug: "asim-shakib-middle-manager", group: "alt",
      nameEn: "Asim Shakib", nameDe: "Asim Shakib",
      subtitleEn: "Middle Manager", subtitleDe: "Abteilungsleiter",
      tools: [
        { slug: "manage-upwards", en: "Manage Upwards", de: "Nach Oben Managen" },
        { slug: "employee-stock-options", en: "Employee Stock Options", de: "Mitarbeiter-Anteile" },
      ],
    },
    {
      slug: "larx-krajewski-chief-security-officer", group: "alt",
      nameEn: "Larx Krajewski", nameDe: "Larx Krajewski",
      subtitleEn: "Chief Security Officer", subtitleDe: "Sicherheitschef*in",
      tools: [
        { slug: "inner-confidence", en: "Inner Confidence", de: "Starkes Selbstvertrauen" },
        { slug: "company-id", en: "Company ID", de: "Dienstausweis" },
      ],
    },
    {
      slug: "deniz-yilmaz-ai-ethics-professor", group: "alt",
      nameEn: "Deniz Yilmaz", nameDe: "Deniz Yilmaz",
      subtitleEn: "AI Ethics Professor", subtitleDe: "Professor für KI-Ethik",
      tools: [
        { slug: "member-of-the-ai-alignment-panel", en: "Member of the AI Alignment Panel", de: "Mitglied des AI-Alignment-Gremiums" },
        { slug: "research-grant", en: "Research Grant", de: "Forschungs-Stipendium" },
      ],
    },

    // ---- Expansion: A Hopeful Cause ----
    {
      slug: "giulia-caparelli", group: "expansion",
      nameEn: "Giulia Caparelli", nameDe: "Giulia Caparelli",
      subtitleEn: "Digital Rights Lawyer", subtitleDe: "Anwältin für digitale Rechte",
      tools: [
        { slug: "lawyer-client-privilege", en: "Lawyer-Client Privilege", de: "Anwalt-Mandanten-Beziehung" },
        { slug: "grassroots-support", en: "Grassroots Support", de: "Unterstützung von der Zivilgesellschaft" },
      ],
    },
    {
      slug: "veeron5", group: "expansion",
      nameEn: "Veeron5", nameDe: "Veeron5",
      subtitleEn: "Content Creator", subtitleDe: "Content Creatorin",
      tools: [
        { slug: "modified-wheelchair", en: "Modified Wheelchair", de: "Umgebauter Rollstuhl" },
        { slug: "ar-holofilter-avatar", en: "AR Holofilter Avatar", de: "AR-Holofilter-Avatar" },
      ],
    },
    {
      slug: "mattheo-m-baye", group: "expansion",
      nameEn: "Matthéo M'Baye", nameDe: "Matthéo M'Baye",
      subtitleEn: "Welfare Review Specialist", subtitleDe: "Fachbeamter für Sozialbetrug",
      tools: [
        { slug: "civic-database-access", en: "Civic Database Access", de: "Zugriff auf Zivildatenbanken" },
        { slug: "concealed-audio-amplifier", en: "Concealed Audio Amplifier", de: "Versteckter Verstärker" },
      ],
    },
    {
      slug: "jan-peter-grunwald", group: "expansion",
      nameEn: "Jan-Peter Grunwald", nameDe: "Jan-Peter Grunwald",
      subtitleEn: "Corporate Dropout", subtitleDe: "Kapitalismus-Aussteiger",
      tools: [
        { slug: "innovation-award", en: "Innovation Award", de: "Innovationspreis" },
        { slug: "anarcho-futurist-manifesto", en: "Anarcho-Futurist Manifesto", de: "Anarcho-Futuristisches Manifest" },
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
