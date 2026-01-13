#!/usr/bin/env lua

-- =========================
-- Utility: trim whitespace
-- =========================
local function trim(s)
	return (s:gsub("^%s*(.-)%s*$", "%1"))
end

-- =========================
-- Type inference
-- =========================
local function infer_value(value)
	if value == nil then
		return nil
	end
	value = trim(value)

	if value == "" then
		return nil
	end

	local lower = value:lower()

	-- boolean
	if lower == "true" then
		return true
	end
	if lower == "false" then
		return false
	end

	-- integer
	if value:match("^-?%d+$") then
		return tonumber(value)
	end

	-- float
	if value:match("^-?%d*%.%d+$") then
		return tonumber(value)
	end

	return value
end

-- =========================
-- CSV parsing (handles quoted fields)
-- =========================
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

-- =========================
-- JSON encoding
-- =========================
local function json_escape(str)
	return str:gsub("\\", "\\\\"):gsub('"', '\\"'):gsub("\n", "\\n"):gsub("\r", "\\r"):gsub("\t", "\\t")
end

local function json_encode(value, indent, depth)
	indent = indent or 0
	depth = depth or 0
	local pad = string.rep(" ", indent * depth)
	local next_pad = string.rep(" ", indent * (depth + 1))

	if value == nil then
		return "null"
	elseif type(value) == "number" or type(value) == "boolean" then
		return tostring(value)
	elseif type(value) == "string" then
		return '"' .. json_escape(value) .. '"'
	elseif type(value) == "table" then
		local is_array = (#value > 0)
		local items = {}

		if is_array then
			for i = 1, #value do
				table.insert(items, (indent > 0 and next_pad or "") .. json_encode(value[i], indent, depth + 1))
			end
			if indent > 0 then
				return "[\n" .. table.concat(items, ",\n") .. "\n" .. pad .. "]"
			else
				return "[" .. table.concat(items, ",") .. "]"
			end
		else
			for k, v in pairs(value) do
				table.insert(
					items,
					(indent > 0 and next_pad or "")
						.. '"'
						.. json_escape(k)
						.. '":'
						.. (indent > 0 and " " or "")
						.. json_encode(v, indent, depth + 1)
				)
			end
			if indent > 0 then
				return "{\n" .. table.concat(items, ",\n") .. "\n" .. pad .. "}"
			else
				return "{" .. table.concat(items, ",") .. "}"
			end
		end
	else
		error("Unsupported type: " .. type(value))
	end
end

-- =========================
-- CLI handling
-- =========================
local input_path = arg[1]
local output_path = arg[2]
local indent = tonumber(arg[3]) or 2

if not input_path or not output_path then
	io.stderr:write("Usage: csv_to_json.lua <input.csv> <output.json> [indent]\n")
	os.exit(1)
end

-- =========================
-- Read CSV
-- =========================
local file = io.open(input_path, "r")
if not file then
	io.stderr:write("Error: cannot open input file\n")
	os.exit(1)
end

local header_line = file:read("*l")
if not header_line then
	io.stderr:write("Error: empty CSV file\n")
	os.exit(1)
end

local headers = parse_csv_line(header_line)
local rows = {}

for line in file:lines() do
	if line ~= "" then
		local fields = parse_csv_line(line)
		local row = {}

		for i, key in ipairs(headers) do
			row[key] = infer_value(fields[i])
		end

		table.insert(rows, row)
	end
end

file:close()

-- =========================
-- Write JSON
-- =========================
local out = io.open(output_path, "w")
if not out then
	io.stderr:write("Error: cannot open output file\n")
	os.exit(1)
end

out:write(json_encode(rows, indent))
out:close()
