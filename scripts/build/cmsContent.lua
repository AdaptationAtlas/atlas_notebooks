-- ============================================================
-- cmsContent: embed CMS-managed content at render time
-- ============================================================
-- One filter, three content shapes — all edited with Sveltia at /admin/
-- (config in admin/config.yml), both failing the render when content a page
-- references is missing. scripts/build/checkTranslations.ts enforces the
-- same contracts in CI.
--
-- 1. Notebook prose — one file per block: data/<notebook>/text/<id>.<lang>.md,
--    front matter (exactly one `title:` field) + markdown
--    body, parsed with Pandoc's own reader. The block id is the filename;
--    authors never see or edit it.
--
--      front matter:  nb-config: data/economicReturns/notebook.json
--
--    Notebooks place blocks with the {{< prose <id> >}} shortcode
--    (scripts/build/proseShortcode.lua) — `level=N` sets the heading level,
--    `heading=false` drops the heading for free-floating blocks,
--    `details=true` renders the block collapsed. The
--    shortcode expands to the markers this filter consumes: a heading whose
--    {#id} matches a block file is retitled from the block's `title:` and
--    the block body is injected right after it, wrapped in
--    <div class="nb-prose" data-section="id">; an explicit
--    ::: {.nb-prose data-section="id"} div is filled in place.
--    (Shortcodes expand in Quarto's built-in pass, so _quarto.yml lists
--    `- quarto` before this filter.)
--
--    Both languages are rendered as static, lang-tagged HTML. CSS shows the
--    active language, so switching languages does not fetch or parse prose
--    in the browser. `details=true` renders a block collapsed inside a native
--    <details> note (title -> <summary>). Developers control heading level and placement
--    in the .qmd; authors control the displayed text.
--    A heading anchor that matches no block file is left alone —
--    scripts/build/checkTranslations.ts flags block files nothing
--    references, which catches typo'd anchors in CI.
--
-- 2. Docs data pages (FAQ / glossary) — structured JSON with side-by-side
--    languages per entry, built as Pandoc blocks (not an HTML string) so section
--    headings are real headers and every value is escaped by the writer. BOTH
--    languages are baked in as .nb-i18n nodes, the same mechanism notebook prose
--    uses; styles/main.css shows the active one via <html lang>, which
--    components/langSwitcher.js keeps in sync — no client-side rendering.
--    FAQ answers are markdown, read straight into blocks. Entry order = page order.
--    The marker div is REPLACED by its blocks, not filled: Quarto builds its TOC
--    from top-level headers only, so nested headings would be missing from it.
--
--      markers:  ::: {.docs-faq data-src="data/docs/faq.json"}
--                ::: {.docs-glossary data-src="data/docs/glossary.json"}
--
-- 3. Contributors — the manifest's `contributors` groups resolved against the
--    shared registry (data/shared/contributors.json), with affiliations numbered
--    in first-appearance order ONCE so the markers agree across both localized
--    copies. Only the four headings and the citation title differ by language.
--    The citation year comes from the entry's `date-modified`, which Quarto
--    resolves before this filter runs and renders nowhere itself.
--
--      marker:   ::: {.nb-contributors}

local textDir = nil
local locales = { "en", "fr" } -- keep in sync with admin/config.yml
local blocks = {} -- locale -> id -> { title, body } | false
local runtimeConfigRaw = nil
local notebookTitles = nil -- locale -> page title, for the citation
local notebookContributors = nil -- manifest contributors groups
local citationYear = nil -- from the entry's `date-modified`

-- ---------- shared helpers ----------

local function projectRoot()
	if quarto and quarto.project and quarto.project.directory then
		return quarto.project.directory
	end
	return "."
end

local function readFile(path)
	local f = io.open(path, "r")
	if not f then
		return nil
	end
	local content = f:read("*all")
	f:close()
	return content
end

local function esc(s)
	return (s or ""):gsub("&", "&amp;"):gsub("<", "&lt;"):gsub(">", "&gt;"):gsub('"', "&quot;")
end

local function slug(s)
	return (s or ""):lower():gsub("[^%w]+", "-"):gsub("^%-+", ""):gsub("%-+$", "")
end

local function metaStrings(values)
	local out = {}
	for _, value in ipairs(values or {}) do
		table.insert(out, pandoc.MetaString(value))
	end
	return pandoc.MetaList(out)
end

local function applyNotebookConfig(meta)
	local configPath = meta["nb-config"] and pandoc.utils.stringify(meta["nb-config"])
	if not configPath or configPath == "" then
		return meta
	end

	local path = projectRoot() .. "/" .. configPath
	local raw = readFile(path)
	if not raw then
		error("cmsContent: cannot read notebook config " .. path)
	end
	local ok, config = pcall(pandoc.json.decode, raw)
	if not ok or type(config) ~= "table" then
		error("cmsContent: notebook config is not valid JSON: " .. path)
	end
	if type(config.title) ~= "table" or type(config.title.en) ~= "string" or type(config.textDir) ~= "string" then
		error("cmsContent: notebook config is missing title or textDir: " .. path)
	end

	textDir = config.textDir
	runtimeConfigRaw = raw
	notebookTitles = config.title
	notebookContributors = config.contributors
	local modified = meta["date-modified"] and pandoc.utils.stringify(meta["date-modified"])
	citationYear = modified and modified:match("(%d%d%d%d)")
	meta.pagetitle = pandoc.MetaString(config.title.en)
	meta.description = pandoc.MetaString(config.description or "")
	meta.keywords = metaStrings(config.keywords)
	return meta
end

-- ---------- notebook prose ----------

local function localizeHeadingIds(body, locale)
	local wrapper = pandoc.walk_block(pandoc.Div(body), {
		Header = function(header)
			if header.identifier ~= "" then
				header.identifier = header.identifier .. "-" .. locale
			end
			return header
		end,
	})
	return wrapper.content
end

local function loadBlock(id, locale)
	blocks[locale] = blocks[locale] or {}
	if blocks[locale][id] ~= nil then
		return blocks[locale][id]
	end
	blocks[locale][id] = false
	if textDir then
		local path = projectRoot() .. "/" .. textDir .. "/" .. id .. "." .. locale .. ".md"
		local raw = readFile(path)
		if raw then
			local doc = pandoc.read(raw, "markdown")
			blocks[locale][id] = {
				title = doc.meta.title and pandoc.Inlines(doc.meta.title) or nil,
				body = localizeHeadingIds(doc.blocks, locale),
			}
		end
	end
	return blocks[locale][id]
end

local function loadLocalizedBlocks(id)
	local localized = {}
	local default = loadBlock(id, locales[1])
	if not default then
		return nil
	end
	localized[locales[1]] = default
	for i = 2, #locales do
		local locale = locales[i]
		localized[locale] = loadBlock(id, locale)
		if not localized[locale] then
			error(("cmsContent: prose block '%s' is missing its %s translation"):format(id, locale))
		end
	end
	return localized
end

local function appendProse(out, localized, id)
	for _, locale in ipairs(locales) do
		local block = localized[locale]
		if #block.body == 0 then
			error(("cmsContent: prose block '%s' has an empty %s body"):format(id, locale))
		end
		table.insert(
			out,
			pandoc.Div(block.body, pandoc.Attr("", { "nb-prose", "nb-i18n" }, { lang = locale }))
		)
	end
end

-- A collapsed note is a normal block rendered inside <details>: its `title:` is
-- the <summary>, its body the panel. Marked by {{< prose id details=true >}}.
local function appendCollapsed(out, localized, id)
	local summaries = {}
	for _, locale in ipairs(locales) do
		local title = localized[locale].title
		if not title then
			error(("cmsContent: collapsed prose block '%s' has no %s title"):format(id, locale))
		end
		table.insert(
			summaries,
			('<span class="nb-i18n" lang="%s">%s</span>'):format(locale, esc(pandoc.utils.stringify(title)))
		)
	end

	table.insert(
		out,
		pandoc.RawBlock("html", '<details class="nb-details"><summary>' .. table.concat(summaries) .. "</summary>")
	)
	for _, locale in ipairs(locales) do
		local body = localized[locale].body
		if #body == 0 then
			error(("cmsContent: collapsed prose block '%s' has an empty %s body"):format(id, locale))
		end
		table.insert(out, pandoc.RawBlock("html", ('<div class="nb-details__body nb-i18n" lang="%s">'):format(locale)))
		for _, child in ipairs(body) do
			table.insert(out, child)
		end
		table.insert(out, pandoc.RawBlock("html", "</div>"))
	end
	table.insert(out, pandoc.RawBlock("html", "</details>"))
end

local function injectProse(div)
	local id = div.attributes["data-section"]
	local localized = loadLocalizedBlocks(id)
	if not localized then
		error(("cmsContent: no prose block '%s' in %s"):format(tostring(id), tostring(textDir)))
	end
	local out = {}
	if div.classes:includes("nb-details") then
		appendCollapsed(out, localized, id)
	else
		appendProse(out, localized, id)
	end
	return out
end

local function expandHeader(el)
	if el.identifier == "" then
		return nil
	end
	local localized = loadLocalizedBlocks(el.identifier)
	if not localized then
		return nil
	end

	local titles = {}
	for _, locale in ipairs(locales) do
		local title = localized[locale].title
		if not title then
			error(("cmsContent: prose block '%s' has no %s title"):format(el.identifier, locale))
		end
		table.insert(titles, pandoc.Span(title, pandoc.Attr("", { "nb-i18n" }, { lang = locale })))
	end
	el.content = titles

	local out = { el }
	appendProse(out, localized, el.identifier)
	return out
end

-- ---------- contributors ----------

-- Structure and the four labels are ours; every value from the manifest or the
-- shared registry goes through esc(). Raw HTML rather than Pandoc blocks because
-- real Headers here would be swallowed by Quarto's section wrapping.
local CONTRIBUTOR_LABELS = {
	authors = { en = "Authors", fr = "Auteurs" },
	developers = { en = "Technical Development", fr = "Développement technique" },
	affiliations = { en = "Affiliations", fr = "Affiliations" },
	citation = { en = "Citation", fr = "Référence" },
}

local CITATION_PUBLISHER = "Africa Agriculture Adaptation Atlas"
local CITATION_URL = "https://adaptationatlas.cgiar.org"

-- Profile URLs come from CMS data: absolute http(s) only, anything else renders
-- as a plain name rather than becoming a link.
local function safeProfileUrl(url)
	if type(url) ~= "string" then
		return nil
	end
	return url:match("^https?://[^%s\"'<>]+$")
end

local function contributorRegistry()
	local path = projectRoot() .. "/data/shared/contributors.json"
	local raw = readFile(path)
	if not raw then
		error("cmsContent: cannot read " .. path)
	end
	local data = pandoc.json.decode(raw)
	local byId = {}
	for _, person in ipairs((type(data) == "table" and data.contributors) or {}) do
		byId[person.id] = person
	end
	return byId
end

-- Affiliations are numbered in first-appearance order and resolved ONCE, so the
-- markers agree between the two localized copies.
local function resolveContributors(groups)
	local registry = contributorRegistry()
	local orgNumber, orgOrder = {}, {}
	local function numberFor(org)
		if not orgNumber[org] then
			table.insert(orgOrder, org)
			orgNumber[org] = #orgOrder
		end
		return orgNumber[org]
	end

	local function resolve(list)
		local out = {}
		for _, entry in ipairs(list or {}) do
			local person = nil
			if entry.type == "common" then
				person = registry[entry.id]
			elseif entry.type == "custom" then
				person = entry
			end
			if not person or type(person.name) ~= "string" then
				error(("cmsContent: unknown contributor '%s'"):format(tostring(entry.id or entry.name)))
			end
			local orgs = {}
			for _, org in ipairs(person.org or {}) do
				table.insert(orgs, numberFor(org))
			end
			table.sort(orgs)
			table.insert(out, { name = person.name, url = person.url, orgs = orgs })
		end
		return out
	end

	return {
		authors = resolve(groups and groups.authors),
		developers = resolve(groups and groups.developers),
		organizations = orgOrder,
	}
end

local function peopleHtml(people)
	local parts = {}
	for _, person in ipairs(people) do
		local label = esc(person.name)
		local href = safeProfileUrl(person.url)
		if href then
			label = ('<a href="%s" target="_blank" rel="noopener noreferrer">%s</a>'):format(esc(href), label)
		end
		if #person.orgs > 0 then
			label = label .. "<sup>" .. table.concat(person.orgs, ",") .. "</sup>"
		end
		table.insert(parts, "<span>" .. label .. "</span>")
	end
	return table.concat(parts, ", ")
end

local function peopleSectionHtml(label, people)
	if #people == 0 then
		return ""
	end
	return ('<section class="atlas-contributions__section"><h4 class="atlas-contributions__heading">%s</h4><div class="atlas-contributions__people">%s</div></section>')
		:format(esc(label), peopleHtml(people))
end

local function contributionsHtml(locale, data)
	local function label(key)
		return CONTRIBUTOR_LABELS[key][locale] or CONTRIBUTOR_LABELS[key].en
	end

	local affiliations = {}
	for number, org in ipairs(data.organizations) do
		table.insert(
			affiliations,
			('<div class="atlas-contributions__affiliation"><sup>%d</sup> %s</div>'):format(number, esc(org))
		)
	end

	local title = notebookTitles[locale] or notebookTitles.en
	local citation = ('<span>CGIAR. (%s). <em>%s</em>. %s. <a href="%s">%s</a></span>'):format(
		citationYear,
		esc(title),
		CITATION_PUBLISHER,
		CITATION_URL,
		CITATION_URL
	)

	return table.concat({
		('<div class="atlas-contributions nb-i18n" lang="%s">'):format(locale),
		'<div class="atlas-contributions__columns">',
		'<div class="atlas-contributions__primary">',
		peopleSectionHtml(label("authors"), data.authors),
		peopleSectionHtml(label("developers"), data.developers),
		"</div>",
		'<section class="atlas-contributions__affiliations">',
		('<h4 class="atlas-contributions__heading">%s</h4>'):format(esc(label("affiliations"))),
		table.concat(affiliations),
		"</section>",
		"</div>",
		'<section class="atlas-contributions__citation">',
		('<h4 class="atlas-contributions__heading">%s</h4>'):format(esc(label("citation"))),
		'<div class="atlas-contributions__citation-text">',
		citation,
		"</div></section></div>",
	})
end

local function fillContributors()
	if not notebookContributors or not notebookTitles then
		error("cmsContent: {.nb-contributors} needs a notebook with an nb-config manifest")
	end
	if not citationYear then
		error("cmsContent: the citation needs a year — add `date-modified: last-modified` to the notebook front matter")
	end

	local data = resolveContributors(notebookContributors)
	local out = {}
	for _, locale in ipairs(locales) do
		table.insert(out, pandoc.RawBlock("html", contributionsHtml(locale, data)))
	end
	return out
end

-- ---------- docs data pages ----------

local function readEntries(src)
	local path = projectRoot() .. "/" .. src
	local raw = readFile(path)
	if not raw then
		error("cmsContent: cannot read " .. path)
	end
	local data = pandoc.json.decode(raw)
	if type(data) ~= "table" or type(data.entries) ~= "table" then
		error("cmsContent: " .. path .. " must be an object with an `entries` array")
	end
	return data.entries
end

-- Bilingual plain-text inlines; the .nb-i18n rules in main.css show the active one.
local function pairSpans(en, fr)
	return pandoc.Inlines({
		pandoc.Span(pandoc.Str(en or ""), pandoc.Attr("", { "nb-i18n" }, { lang = "en" })),
		pandoc.Span(pandoc.Str(fr or ""), pandoc.Attr("", { "nb-i18n" }, { lang = "fr" })),
	})
end

-- Both renderers return Pandoc blocks, not an HTML string: section headings are real
-- headers (so the TOC sees them) and every value is escaped by the writer, not by hand.
local function renderFaq(entries)
	local out = {}
	local lastSection = nil
	for _, e in ipairs(entries) do
		if e.section_en ~= lastSection then
			lastSection = e.section_en
			table.insert(
				out,
				pandoc.Header(2, pairSpans(e.section_en, e.section_fr), pandoc.Attr("faq-" .. slug(e.section_en)))
			)
		end
		table.insert(out, pandoc.RawBlock("html", "<details><summary>"))
		table.insert(out, pandoc.Plain(pairSpans(e.question_en, e.question_fr)))
		table.insert(out, pandoc.RawBlock("html", "</summary>"))
		for _, locale in ipairs(locales) do
			local answer = locale == "en" and e.answer_en or e.answer_fr
			table.insert(out, pandoc.RawBlock("html", ('<div class="nb-i18n" lang="%s">'):format(locale)))
			for _, block in ipairs(pandoc.read(answer or "", "markdown").blocks) do
				table.insert(out, block)
			end
			table.insert(out, pandoc.RawBlock("html", "</div>"))
		end
		table.insert(out, pandoc.RawBlock("html", "</details>"))
	end
	return out
end

local function renderGlossary(entries)
	local out = {}
	local lastSection = nil
	for _, e in ipairs(entries) do
		if e.section ~= lastSection then
			lastSection = e.section
			table.insert(
				out,
				pandoc.Header(
					2,
					pandoc.Str(e.section or ""),
					pandoc.Attr("section-" .. slug(e.section), { "glossary-section" })
				)
			)
		end
		local search = table.concat({
			e.term or "",
			e.acronym or "",
			e.definition_en or "",
			e.definition_fr or "",
			e.tooltip_en or "",
			e.tooltip_fr or "",
		}, " "):lower()
		local title = e.term or ""
		if e.acronym and e.acronym ~= "" then
			title = title .. " (" .. e.acronym .. ")"
		end

		local entry = { pandoc.Header(3, pandoc.Str(title)) }
		if (e.tooltip_en or "") ~= "" or (e.tooltip_fr or "") ~= "" then
			table.insert(entry, pandoc.Para(pandoc.Emph(pairSpans(e.tooltip_en, e.tooltip_fr))))
		end
		table.insert(entry, pandoc.Para(pairSpans(e.definition_en, e.definition_fr)))
		table.insert(out, pandoc.Div(entry, pandoc.Attr("", { "glossary-entry" }, { ["data-search"] = search })))
	end
	return out
end

-- Return the blocks, not the div: Quarto builds its TOC from top-level headers only,
-- so anything left nested inside the marker div would be missing from the TOC.
local function fillDocs(div, render)
	return render(readEntries(div.attributes["data-src"] or ""))
end

-- ---------- dispatch ----------

local function getMeta(meta)
	textDir = nil
	runtimeConfigRaw = nil
	notebookTitles = nil
	notebookContributors = nil
	citationYear = nil
	blocks = {}
	meta = applyNotebookConfig(meta)
	return meta
end

local function fillDiv(div)
	if div.classes:includes("nb-prose") then
		return injectProse(div)
	elseif div.classes:includes("nb-contributors") then
		return fillContributors()
	elseif div.classes:includes("docs-faq") then
		return fillDocs(div, renderFaq)
	elseif div.classes:includes("docs-glossary") then
		return fillDocs(div, renderGlossary)
	end
	return nil
end

local function injectNotebookConfig(doc)
	if not runtimeConfigRaw then
		return doc
	end
	local safe = runtimeConfigRaw:gsub("</", "<\\/")
	local script = ('<script id="atlas-notebook-config" type="application/json">%s</script>'):format(safe)
	table.insert(doc.blocks, 1, pandoc.RawBlock("html", script))
	return doc
end

return {
	{ Meta = getMeta },
	{ Div = fillDiv, Header = expandHeader },
	{ Pandoc = injectNotebookConfig },
}
