-- ============================================================
-- cmsContent: embed CMS-managed content at render time
-- ============================================================
-- One filter, two content shapes — both edited with Sveltia at /admin/
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
--    languages per entry. BOTH languages are baked in as lang-tagged nodes;
--    styles/main.css shows the active one via <html lang>, which
--    components/langSwitcher.js keeps in sync — no client-side rendering.
--    FAQ answers are markdown (rendered through Pandoc); all other values
--    are plain text and escaped. Entry order = page order.
--
--      markers:  ::: {.docs-faq data-src="data/docs/faq.json"}
--                ::: {.docs-glossary data-src="data/docs/glossary.json"}

local textDir = nil
local locales = { "en", "fr" } -- keep in sync with admin/config.yml
local blocks = {} -- locale -> id -> { title, body } | false
local runtimeConfigRaw = nil

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

local function mdToHtml(md)
	return pandoc.write(pandoc.read(md or "", "markdown"), "html")
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

-- <span lang="en">…</span><span lang="fr">…</span>, plain text
local function pairSpan(en, fr)
	return ('<span lang="en">%s</span><span lang="fr">%s</span>'):format(esc(en), esc(fr))
end

local function renderFaq(entries)
	local out = {}
	local lastSection = nil
	for _, e in ipairs(entries) do
		if e.section_en ~= lastSection then
			lastSection = e.section_en
			table.insert(
				out,
				('<h2 id="faq-%s">%s</h2>'):format(
					slug(e.section_en),
					pairSpan(e.section_en, e.section_fr)
				)
			)
		end
		table.insert(out, "<details><summary>" .. pairSpan(e.question_en, e.question_fr) .. "</summary>")
		table.insert(
			out,
			('<div lang="en">%s</div><div lang="fr">%s</div></details>'):format(
				mdToHtml(e.answer_en),
				mdToHtml(e.answer_fr)
			)
		)
	end
	return table.concat(out, "\n")
end

local function renderGlossary(entries)
	local out = {}
	local lastSection = nil
	for _, e in ipairs(entries) do
		if e.section ~= lastSection then
			lastSection = e.section
			table.insert(out, ('<h2 id="section-%s">%s</h2>'):format(slug(e.section), esc(e.section)))
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
		table.insert(out, ('<div class="glossary-entry" data-search="%s">'):format(esc(search)))
		table.insert(out, ("<h3>%s</h3>"):format(esc(title)))
		if (e.tooltip_en or "") ~= "" or (e.tooltip_fr or "") ~= "" then
			table.insert(out, "<p><em>" .. pairSpan(e.tooltip_en, e.tooltip_fr) .. "</em></p>")
		end
		table.insert(out, "<p>" .. pairSpan(e.definition_en, e.definition_fr) .. "</p></div>")
	end
	return table.concat(out, "\n")
end

local function fillDocs(div, render)
	local entries = readEntries(div.attributes["data-src"] or "")
	div.classes:insert("docs-i18n")
	div.content = { pandoc.RawBlock("html", render(entries)) }
	return div
end

-- ---------- dispatch ----------

local function getMeta(meta)
	textDir = nil
	runtimeConfigRaw = nil
	blocks = {}
	meta = applyNotebookConfig(meta)
	return meta
end

local function fillDiv(div)
	if div.classes:includes("nb-prose") then
		return injectProse(div)
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
