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

/**
 * Profile links come from content files (the contributor registry or a
 * notebook's inline entries), so only absolute http(s) URLs are allowed through:
 * a `javascript:` href would execute on click, and resolving relative values
 * would turn a typo into a dead same-origin link. Anything else renders as a
 * plain name rather than a link.
 */
function safeProfileUrl(url) {
  if (!url) return null;
  try {
    const parsed = new URL(String(url)); // absolute only — no base
    return parsed.protocol === "http:" || parsed.protocol === "https:"
      ? parsed.href
      : null;
  } catch {
    return null;
  }
}

function peopleList(people) {
  const list = document.createElement("div");
  list.className = "atlas-contributions__people";

  people.forEach(({ name = "", url, orgs = [] }, index) => {
    if (index) list.append(document.createTextNode(", "));

    const person = document.createElement("span");

    // An optional profile link wraps the name only, so the affiliation marker
    // stays outside it. Opens in a new tab: navigating away from a notebook
    // discards all of its OJS state.
    let nameTarget = person;
    const href = safeProfileUrl(url);
    if (href) {
      const link = document.createElement("a");
      link.href = href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      person.appendChild(link);
      nameTarget = link;
    }
    nameTarget.textContent = String(name);

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
 * Resolve author/developer lists into the shape atlasContributionSection wants,
 * assigning affiliation numbers from the orgs that actually appear.
 *
 * Each entry is either an id into `registry` (data/shared/contributors.json) or
 * an inline `{name, org, url}` object for one-off contributors not worth
 * registering — the registry is for recurring and internal contributors.
 * `org` may be a string or an array of strings; affiliations are numbered in
 * first-appearance order. `url` is optional and links the name to a profile
 * (prefer a durable identifier such as ORCID or an institutional page).
 *
 * @param {{authors?: Array, developers?: Array}} groups
 * @param {Record<string, {name: string, org?: string|string[], url?: string}>} [registry={}]
 * @returns {{authors: Array, developers: Array, organizations: Record<number,string>}}
 */
export function resolveContributors(groups = {}, registry = {}) {
  const orgNumbers = new Map();
  const numberFor = (org) => {
    if (!orgNumbers.has(org)) orgNumbers.set(org, orgNumbers.size + 1);
    return orgNumbers.get(org);
  };
  const resolve = (list = []) =>
    list.map((entry) => {
      const person = typeof entry === "string" ? registry[entry] : entry;
      if (!person?.name) {
        throw new Error(`Unknown contributor: ${JSON.stringify(entry)}`);
      }
      return {
        name: person.name,
        url: person.url,
        orgs: [].concat(person.org ?? []).map(numberFor),
      };
    });

  const authors = resolve(groups.authors);
  const developers = resolve(groups.developers);
  const organizations = Object.fromEntries(
    Array.from(orgNumbers, ([org, number]) => [number, org]),
  );
  return { authors, developers, organizations };
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
