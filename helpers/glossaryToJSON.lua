-- Pure Lua CSV to JSON converter
-- Converts a CSV like yours into a JSON object keyed by Term (no spaces)

-- Quarto CSV → JSON converter (hardcoded paths)
--
-- NOTE: Quarto lua api module does not work with quarto RUN

--TODO: This should take a path metadata arg

-- Read file
local function read_file(filename)
	local f = io.open(filename, "r")
	if not f then
		error("Cannot open file: " .. filename)
	end
	local data = f:read("*a")
	f:close()
	return data
end

-- Write file
local function write_file(filename, content)
	local f = io.open(filename, "w")
	if not f then
		error("Cannot write file: " .. filename)
	end
	f:write(content)
	f:close()
end

-- Parse a CSV line safely (handles quotes and commas)
local function parse_csv_line(line)
	local res = {}
	local field, i, len = "", 1, #line
	local in_quotes = false
	while i <= len do
		local c = line:sub(i, i)
		if c == '"' then
			local nxt = line:sub(i + 1, i + 1)
			if nxt == '"' then
				field = field .. '"' -- escaped quote
				i = i + 2
			else
				in_quotes = not in_quotes
				i = i + 1
			end
		elseif c == "," and not in_quotes then
			table.insert(res, field)
			field = ""
			i = i + 1
		else
			field = field .. c
			i = i + 1
		end
	end
	table.insert(res, field)
	return res
end

local function trim(s)
	return (s or ""):match("^%s*(.-)%s*$")
end

local function strip_bom(s)
	return s:gsub("^\239\187\191", "")
end

local function clean_key(s)
	s = s or ""
	s = s:gsub("%s+", "_")
	s = s:gsub("[^%w_]", "")
	return s
end

-- Parse entire CSV
local function csv_to_table(csv)
	local lines = {}
	for raw in csv:gmatch("[^\r\n]+") do
		local line = strip_bom(raw)
		if line:match("%S") then
			table.insert(lines, line)
		end
	end
	if #lines == 0 then
		return {}
	end

	-- headers
	local raw_headers = parse_csv_line(lines[1])
	local headers, keep_idx = {}, {}
	for j, h in ipairs(raw_headers) do
		local name = trim(h)
		if name ~= "" then
			table.insert(headers, name)
			table.insert(keep_idx, j)
		end
	end

	local data = {}
	for i = 2, #lines do
		local cols = parse_csv_line(lines[i])
		local term_raw = cols[1] or ""
		local term_key = clean_key(term_raw)
		if term_key ~= "" then
			local entry = {}
			for k = 1, #headers do
				local source_j = keep_idx[k]
				local key = headers[k]
				local val = cols[source_j]
				entry[key or ("_col" .. k)] = trim(val or "")
			end
			data[term_key] = entry
		end
	end

	return data
end

-- Hardcoded paths
local input_path = "./../data/shared/glossary.csv"
local output_path = "./../data/shared/glossary.json"

-- Main
local ok, result = pcall(function()
	local csv_data = read_file(input_path)
	-- print("Csv data: " .. csv_data)
	local lua_table = csv_to_table(csv_data)
	local json = quarto.json.encode(lua_table)
	write_file(output_path, json)
end)

if not ok then
	io.stderr:write("Error: " .. tostring(result) .. "\n")
else
	print("Glossary JSON written to " .. output_path)
end
