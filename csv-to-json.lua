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
	assert(type(mappings) == "table", "Mappings must be a table")

	for _, m in ipairs(mappings) do
		assert(m.input and m.output, "Each mapping must have input and output")

		local json = csv_to_json(m.input)
		write_file(m.output, json)

		io.stderr:write(string.format("Converted %s → %s\n", m.input, m.output))
	end
end

-- ---------- Entry points ----------
--TODO: Add in root dir finder at some point

-- Option A: Hardcoded mappings (edit here)
local MAPPINGS = {
	{ input = "data/docs/FAQ.csv", output = "data/docs/FAQ.json" },
	{ input = "data/docs/glossary.csv", output = "data/docs/glossary.json" },
}

-- Option B: Read mappings from Pandoc metadata
-- metadata:
-- csv-json:
--   - input: data/a.csv
--     output: data/a.json

local function mappings_from_meta(meta)
	return meta["csv-json"]
end

function Pandoc(doc)
	local mappings = nil

	if doc.meta["csv-json"] then
		mappings = mappings_from_meta(doc.meta)
	elseif #MAPPINGS > 0 then
		mappings = MAPPINGS
	end

	if mappings then
		convert_many(mappings)
	end

	return doc
end
