const translations = {
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

function translation(key, lang) {
  return translations[key]?.[lang] ?? translations[key]?.en ?? key;
}

function contributionHeading(text) {
  const heading = document.createElement("h4");
  heading.className = "atlas-contributions__heading";
  heading.textContent = text;
  return heading;
}

function peopleList(people) {
  const list = document.createElement("div");
  list.className = "atlas-contributions__people";

  people.forEach(({ name = "", orgs = [] }, index) => {
    if (index) list.append(document.createTextNode(", "));

    const person = document.createElement("span");
    person.textContent = String(name);

    if (orgs.length) {
      const affiliations = document.createElement("sup");
      affiliations.textContent = [...orgs]
        .sort((a, b) => Number(a) - Number(b))
        .join(",");
      person.appendChild(affiliations);
    }

    list.appendChild(person);
  });

  return list;
}

function peopleSection(heading, people) {
  if (!people?.length) return null;

  const section = document.createElement("section");
  section.className = "atlas-contributions__section";
  section.append(contributionHeading(heading), peopleList(people));
  return section;
}

/**
 * Create the Atlas notebook contribution and affiliation block.
 *
 * @param {Object} data - Contributor and affiliation data.
 * @param {Node|string|null} [citation=null] - Optional citation node or text.
 * @param {string} [lang="en"] - Translation language.
 * @returns {HTMLElement}
 */
export function atlasContributionSection(
  data = {},
  citation = null,
  lang = "en",
) {
  const contribution = document.createElement("div");
  contribution.className = "atlas-contributions";

  const columns = document.createElement("div");
  columns.className = "atlas-contributions__columns";

  const primary = document.createElement("div");
  primary.className = "atlas-contributions__primary";
  const authors = peopleSection(
    translation("authors", lang),
    data.authors,
  );
  const developers = peopleSection(
    translation("developers", lang),
    data.developers,
  );
  if (authors) primary.appendChild(authors);
  if (developers) primary.appendChild(developers);

  const affiliationColumn = document.createElement("section");
  affiliationColumn.className = "atlas-contributions__affiliations";
  affiliationColumn.appendChild(
    contributionHeading(translation("affiliations", lang)),
  );

  Object.entries(data.organizations ?? {})
    .sort(([a], [b]) => Number(a) - Number(b))
    .forEach(([id, name]) => {
      const affiliation = document.createElement("div");
      affiliation.className = "atlas-contributions__affiliation";

      const affiliationId = document.createElement("sup");
      affiliationId.textContent = id;
      affiliation.append(affiliationId, document.createTextNode(` ${name}`));
      affiliationColumn.appendChild(affiliation);
    });

  columns.append(primary, affiliationColumn);
  contribution.appendChild(columns);

  if (citation != null && citation !== "") {
    const citationSection = document.createElement("section");
    citationSection.className = "atlas-contributions__citation";

    const citationText = document.createElement("div");
    citationText.className = "atlas-contributions__citation-text";
    if (citation instanceof Node) {
      citationText.appendChild(citation);
    } else {
      citationText.textContent = String(citation);
    }

    citationSection.append(
      contributionHeading(translation("citation", lang)),
      citationText,
    );
    contribution.appendChild(citationSection);
  }

  return contribution;
}

/**
 * Create the standard Atlas citation.
 *
 * @param {string} [nbTitle=""] - Notebook title.
 * @returns {HTMLElement}
 */
export function atlasCitation(nbTitle = "") {
  const citation = document.createElement("span");
  citation.append(document.createTextNode("CGIAR. (2025). "));

  if (nbTitle) {
    const title = document.createElement("em");
    title.textContent = String(nbTitle);
    citation.append(title, document.createTextNode(". "));
  }

  citation.append(
    document.createTextNode("Africa Agriculture Adaptation Atlas. "),
  );

  const link = document.createElement("a");
  link.href = "https://adaptationatlas.cgiar.org";
  link.textContent = "https://adaptationatlas.cgiar.org";
  citation.appendChild(link);

  return citation;
}
