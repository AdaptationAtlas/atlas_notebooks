-- ============================================================
-- CSV → JSON converter using Pandoc Lua API
-- ============================================================

-- ---------- Utilities ----------

local function strip_bom(s)
	if not s then
		return s
	end
	return s:gsub("^\239\187\191", ""):gsub("^\226\128\139", "") -- zero-width space
end

local function read_file(path)
	local f = assert(io.open(path, "r"), "Cannot open file: " .. path)
	local content = f:read("*all")
	f:close()
	return content
end

local function write_file(path, content)
	local f = assert(io.open(path, "w"), "Cannot write file: " .. path)
	f:write(content)
	f:close()
end

local function split_lines(str)
	local lines = {}
	str = str:gsub("\r\n", "\n"):gsub("\r", "\n")
	for line in str:gmatch("([^\n]*)\n?") do
		if line ~= "" then
			table.insert(lines, line)
		end
	end
	return lines
end

local function resolve_path(path)
	local root = quarto.project.directory
	-- remove trailing slash from root if present
	root = root:gsub("/$", "")

	-- If path starts with "/", treat it as project-root (default quarto behavior)
	if path:sub(1, 1) == "/" then
		return root .. path
	end

	-- Otherwise leave it alone (relative to working dir)
	return path
end

-- ---------- Robust CSV parsing ----------

-- Parses one CSV line with quoted-field support
local function parse_csv_line(line)
	local res = {}
	local field = ""
	local in_quotes = false
	local i = 1

	while i <= #line do
		local c = line:sub(i, i)

		if c == '"' then
			if in_quotes and line:sub(i + 1, i + 1) == '"' then
				field = field .. '"'
				i = i + 1
			else
				in_quotes = not in_quotes
			end
		elseif c == "," and not in_quotes then
			table.insert(res, field)
			field = ""
		else
			field = field .. c
		end

		i = i + 1
	end

	table.insert(res, field)
	return res
end

local function parse_csv(content)
	local lines = split_lines(content)
	assert(#lines > 0, "CSV file is empty")

	local headers = parse_csv_line(lines[1])
	for i, h in ipairs(headers) do
		headers[i] = strip_bom(h)
	end

	local rows = {}

	for i = 2, #lines do
		local fields = parse_csv_line(lines[i])
		local row = {}

		for j, h in ipairs(headers) do
			row[h] = fields[j]
		end

		table.insert(rows, row)
	end

	return rows
end

-- ---------- Conversion ----------

local function csv_to_json(csv_path)
	local content = read_file(csv_path)
	local lua_table = parse_csv(content)
	return pandoc.json.encode(lua_table)
end

-- ---------- Batch processing ----------

-- Mapping table format:
-- {
--   { input = "data/a.csv", output = "data/a.json" },
--   { input = "data/b.csv", output = "data/b.json" }
-- }

local function convert_many(mappings)
	local stringify = pandoc.utils.stringify
	assert(type(mappings) == "table", "Mappings must be a table")

	for _, m in ipairs(mappings) do
		local input = resolve_path(stringify(m.input))
		local output = resolve_path(stringify(m.output))
		assert(input and output, "Each mapping must have input and output")

		local json = csv_to_json(input)
		write_file(output, json)

		io.stderr:write(string.format("Converted %s → %s\n", stringify(m.input), stringify(m.output)))
	end
end

-- ---------- Entry points ----------
--TODO: Add in root dir finder at some point

-- Option A: Hardcoded mappings (edit here)
local MAPPINGS = {
	-- 	{ input = "data/docs/FAQ.csv", output = "data/docs/FAQ.json" },
	-- 	{ input = "data/docs/glossary.csv", output = "data/docs/glossary.json" },
}

-- Option B: Read mappings from Pandoc metadata
-- metadata:
-- csv-json:
--   - input: data/a.csv
--     output: data/a.json

function Pandoc(doc)
	-- NOTE: quarto runs the filters a few times, sometimes missing needed data
	if not (quarto and quarto.project and quarto.project.directory) then
		io.stderr:write("csv2json: project root not available yet, skipping pass\n")
		return doc
	end

	local meta = doc.meta
	local mappings = {}

	-- Add metadata mappings
	if meta["csv2json"] then
		for _, m in ipairs(meta["csv2json"]) do
			table.insert(mappings, m)
		end
	end

	-- Add hardcoded mappings
	if MAPPINGS then
		for _, m in ipairs(MAPPINGS) do
			table.insert(mappings, m)
		end
	end

	if #mappings > 0 then
		io.stderr:write("Converting " .. #mappings .. " files\n")
		convert_many(mappings)
	end

	return doc
end
