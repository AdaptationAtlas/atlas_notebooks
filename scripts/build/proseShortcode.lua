-- {{< prose <id> >}} — explicit marker for CMS-managed prose blocks.
--
-- Pure syntax sugar: expands to the exact markers scripts/build/cmsContent.lua
-- already consumes, so all file reading / retitling / injection stays there.
--
--   {{< prose overview >}}            -> # overview {#overview}   (H1, retitled from the block's `title:`)
--   {{< prose women-dominate level=2 >}} -> H2 marker
--   {{< prose overview-closing heading=false >}} -> ::: {.nb-prose data-section="overview-closing"} :::
--   {{< prose weather-measurement-note details=true >}} -> ::: {.nb-prose .nb-details …} :::
--     (collapsed note: the block's `title:` becomes the <summary>, its body the panel)
--
-- The heading text emitted here is just the block id — cmsContent.lua replaces
-- it with both localized titles and bodies at build time.
-- Registered via `shortcodes:` in _quarto.yml; the shortcode pass runs before
-- project filters, so cmsContent.lua sees the expanded markers.

local KNOWN = { heading = true, level = true, details = true }

-- Options are developer-authored and copy-pasted between notebooks, so a typo
-- must fail the render rather than silently produce a default H1.
local function boolean(id, name, value)
	if value == "" or value == "true" or value == "false" then
		return value
	end
	error(("{{< prose %s >}}: %s must be true or false, got '%s'"):format(id, name, value))
end

function prose(args, kwargs)
	local id = pandoc.utils.stringify(args[1] or "")
	if id == "" then
		error("{{< prose >}}: missing block id argument")
	end
	for key in pairs(kwargs) do
		if not KNOWN[key] then
			error(("{{< prose %s >}}: unknown option '%s' (expected heading, level, details)"):format(id, key))
		end
	end

	local level = pandoc.utils.stringify(kwargs["level"] or "")
	local heading = boolean(id, "heading", pandoc.utils.stringify(kwargs["heading"] or ""))
	local details = boolean(id, "details", pandoc.utils.stringify(kwargs["details"] or ""))

	if details == "true" then
		-- The title is the <summary>, so there is no heading left to level.
		if level ~= "" or heading ~= "" then
			error(("{{< prose %s >}}: details=true renders no heading — drop level= / heading="):format(id))
		end
		return pandoc.Div({}, pandoc.Attr("", { "nb-prose", "nb-details" }, { ["data-section"] = id }))
	end

	if heading == "false" then
		return pandoc.Div({}, pandoc.Attr("", { "nb-prose" }, { ["data-section"] = id }))
	end

	return pandoc.Header(tonumber(level) or 1, pandoc.Inlines(id), pandoc.Attr(id))
end
