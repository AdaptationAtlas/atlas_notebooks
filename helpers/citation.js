/**
 * Generates a formatted HTML contribution block for an Atlas notebook,
 * including Authors, Technical Development, Affiliations, and an optional Citation.
 *
 * Layout:
 * - Left column (60%): Authors and Technical Development
 * - Right column (40%): Affiliations
 * - Optional citation displayed below the columns
 *
 * Expected data structure:
 *
 * {
 *   authors: [
 *     { name: string, orgs: number[] }
 *   ],
 *   developers: [
 *     { name: string, orgs: number[] }
 *   ],
 *   organizations: {
 *     [orgId: number]: string
 *   }
 * }
 *
 * Where:
 * - `name` is the full display name of the contributor.
 * - `orgs` is an array of numeric organization IDs.
 * - `organizations` maps numeric IDs to organization names.
 * };
 *
 * @param {Object} data - Structured contributor and affiliation data.
 * @param {string|null} [citation=null] - Optional formatted citation HTML string.
 * @param {string} [lang="en"] - Language code for translation. (default: "en")
 * @returns {string} HTML string representing the formatted contribution section.
 */
export function atlasContributionSection(data, citation = null, lang = "en") {
  const _translations = {
    authors: {
      en: "Authors",
      fr: "Auteurs",
    },
    affiliations: {
      en: "Affiliations",
      fr: "Affiliations",
    },
    developers: {
      en: "Technical Development",
      fr: "Développement technique",
    },
    citation: {
      en: "Citation",
      fr: "Référence",
    },
  };

  const t = (key) =>
    _translations[key]?.[lang] ?? _translations[key]?.en ?? key;

  const formatPeople = (people) =>
    people
      .map(
        ({ name, orgs }) =>
          `${name}<sup>${orgs.sort((a, b) => a - b).join(",")}</sup>`,
      )
      .join(", ");

  const section = (heading, people) =>
    people?.length
      ? `<div style="margin-bottom: 1rem;">
           <h4 style="font-size: 0.90rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #6b7280; margin-bottom: 0.4rem;">${heading}</h4>
           <div style="font-size: 0.95rem; line-height: 1.6;">${formatPeople(people)}</div>
         </div>`
      : "";

  const affiliations = Object.entries(data.organizations)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(
      ([id, name]) =>
        `<div style="font-size: 0.85rem; line-height: 1.8; color: #4b5563;"><sup>${id}</sup> ${name}</div>`,
    )
    .join("");

  const citationHTML = citation
    ? `<div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e5e7eb;">
         <h4 style="font-size: 0.90rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #6b7280; margin-bottom: 0.4rem;">${t(
           "citation",
         )}</h4>
         <div style="font-size: 0.85rem; line-height: 1.6;">${citation}</div>
       </div>`
    : "";

  return `
    <div style="display: flex; gap: 2rem; align-items: flex-start;">
      <div style="flex: 6;">
        ${section(t("authors"), data.authors)}
        ${section(t("developers"), data.developers)}
      </div>
      <div style="flex: 4; border-left: 1px solid #e5e7eb; padding-left: 2rem;">
        <h4 style="font-size: 0.90rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #6b7280; margin-bottom: 0.4rem;">${t(
          "affiliations",
        )}</h4>
        ${affiliations}
      </div>
    </div>
    ${citationHTML}
  `;
}

export function atlasCitation(nbTitle = "") {
  const title = nbTitle && `<em>${nbTitle}</em>`;
  const parts = [title, "Africa Agriculture Adaptation Atlas."]
    .filter(Boolean)
    .join(" ");
  const url = `<a href="https://adaptationatlas.cgiar.org">https://adaptationatlas.cgiar.org</a>`;
  return `CGIAR. (2025). ${parts} ${url}`;
}
