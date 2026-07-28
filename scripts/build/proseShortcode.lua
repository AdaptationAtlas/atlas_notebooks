-- {{< prose <id> >}} — explicit marker for CMS-managed prose blocks.
--
-- Pure syntax sugar: expands to the exact markers scripts/build/cmsContent.lua
-- already consumes, so all file reading / retitling / injection stays there.
--
--   {{< prose overview >}}            -> # overview {#overview}   (H1, retitled from the block's `title:`)
--   {{< prose women-dominate level=2 >}} -> H2 marker
--   {{< prose overview-closing heading=false >}} -> ::: {.nb-prose data-section="overview-closing"} :::
--
-- The heading text emitted here is just the block id — cmsContent.lua replaces
-- it with the block's `title:`, and Lang.applyTranslations retitles at runtime.
-- Registered via `shortcodes:` in _quarto.yml; the shortcode pass runs before
-- project filters, so cmsContent.lua sees the expanded markers.

function prose(args, kwargs)
	local id = pandoc.utils.stringify(args[1] or "")
	if id == "" then
		error("{{< prose >}}: missing block id argument")
	end
	if pandoc.utils.stringify(kwargs["heading"] or "") == "false" then
		return pandoc.Div({}, pandoc.Attr("", { "nb-prose" }, { ["data-section"] = id }))
	end
	local level = tonumber(pandoc.utils.stringify(kwargs["level"] or "")) or 1
	return pandoc.Header(level, pandoc.Inlines(id), pandoc.Attr(id))
end
