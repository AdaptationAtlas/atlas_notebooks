#!/usr/bin/env python3
"""node --check every OJS cell of a Quarto qmd (per the branch's QA memory).

Usage: python3 ojs_node_check.py <notebook.qmd> [out.mjs]
Transforms OJS -> plain JS (viewof defs/refs, block cells -> async IIFEs,
bare expression cells -> awaited statements) using a character scanner that
respects template literals, ${} substitutions, strings and line comments,
then runs `node --check` on the result. Parse-only: undefined identifiers
are fine; syntax errors (TDZ typos, brace mismatches, duplicate consts in
one cell) are caught. Complements `quarto render` (the authoritative OJS
parser) with a fast local gate.
"""
import re, subprocess, sys, tempfile

def scan_split(b):
    defre = re.compile(r"^(?:viewof\s+)?[A-Za-z_$][\w$]*\s*=(?!=)")
    lines = b.split("\n")
    stack, depth, line_states = [], 0, []
    for ln in lines:
        line_states.append((depth, len(stack)))
        i = 0
        while i < len(ln):
            ch = ln[i]; mode = stack[-1][0] if stack else 'js'
            if mode in ('js', 'sub'):
                if ch == '`': stack.append(('tpl',))
                elif ch == "'":
                    i += 1
                    while i < len(ln) and ln[i] != "'":
                        if ln[i] == '\\': i += 1
                        i += 1
                elif ch == '"':
                    i += 1
                    while i < len(ln) and ln[i] != '"':
                        if ln[i] == '\\': i += 1
                        i += 1
                elif ch == '/' and i + 1 < len(ln) and ln[i+1] == '/': break
                elif ch in '({[': depth += 1
                elif ch in ')}]':
                    if mode == 'sub' and ch == '}' and depth == stack[-1][1]: stack.pop()
                    else: depth -= 1
            elif mode == 'tpl':
                if ch == '`': stack.pop()
                elif ch == '$' and i + 1 < len(ln) and ln[i+1] == '{':
                    stack.append(('sub', depth)); i += 1
            i += 1
    cells, cur = [], []
    for ln, (d, sd) in zip(lines, line_states):
        if d == 0 and sd == 0 and defre.match(ln) and cur and any(
                x.strip() and not x.strip().startswith("//") for x in cur):
            cells.append("\n".join(cur)); cur = []
        cur.append(ln)
    if cur: cells.append("\n".join(cur))
    return cells

def extract_ojs_blocks(qmd):
    """Stateful CommonMark-style fence walk (matches Quarto's extraction):
    a ```{ojs} line opens an OJS cell ONLY when no block is open; any other
    ```-info line opens a non-executable block; a bare ``` closes whichever
    block is open (an info-string fence can never CLOSE a block). This
    catches orphaned fences that regex pairing silently mis-pairs."""
    blocks, cur, mode = [], [], None  # mode: None | 'ojs' | 'other'
    orphans = []
    for lineno, ln in enumerate(qmd.split("\n"), 1):
        stripped = ln.strip()
        if mode is None:
            if stripped == "```{ojs}":
                mode, cur = "ojs", []
            elif stripped.startswith("```") and stripped != "```":
                mode = "other"
            elif stripped == "```":
                orphans.append(lineno)
                mode = "other"  # treat as opening a stray block, like Pandoc would
        else:
            if stripped == "```":
                if mode == "ojs":
                    blocks.append("\n".join(cur) + "\n")
                mode, cur = None, []
            else:
                if mode == "ojs":
                    if stripped.startswith("```"):
                        # fence-looking line INSIDE an ojs cell: almost always a
                        # structural break upstream
                        print(f"FENCE WARNING: '{stripped[:20]}' inside an open ojs cell at line {lineno}")
                    cur.append(ln)
    if mode is not None:
        print(f"FENCE ERROR: unclosed block at EOF (mode={mode})")
        sys.exit(1)
    if orphans:
        print(f"FENCE ERROR: orphaned bare ``` opener(s) at line(s) {orphans} — "
              "likely a missing ```{ojs} opener above; Quarto will swallow the next cell")
        sys.exit(1)
    return blocks

def main():
    qmd = open(sys.argv[1]).read()
    blocks = extract_ojs_blocks(qmd)
    cellre = re.compile(r"^(viewof\s+)?([A-Za-z_$][\w$]*)\s*=(?!=)\s*(.*)$", re.S)
    out, n = [], 0
    for b in blocks:
        if "import {" in b or "import{" in b: continue
        # regex literals containing quotes desync the string-skipper; the only
        # such pattern in this codebase is /'/g — neutralise it for the check
        b = b.replace("/'/g", "/Q/g")
        for cell in scan_split(b):
            body = cell.strip()
            if not body: continue
            lines = body.split("\n"); lead = []
            while lines and (not lines[0].strip() or lines[0].strip().startswith("//")):
                lead.append(lines.pop(0))
            core = "\n".join(lines).strip()
            m = cellre.match(core) if core else None
            n += 1
            pre = ("\n".join(lead) + "\n") if lead else ""
            if m:
                name, rest = m.group(2), m.group(3)
                if rest.lstrip().startswith("{") and not rest.lstrip().startswith("({"):
                    out.append(f"{pre}const {name}_{n} = await (async () => {rest}\n)();")
                else:
                    out.append(f"{pre}const {name}_{n} = {rest};")
            else:
                out.append(f"await (async () => {{\n{body}\n}})();")
    src = "\n\n".join(out)
    src = re.sub(r"\bviewof\s+([A-Za-z_$][\w$]*)", r"viewof_\1", src)
    path = sys.argv[2] if len(sys.argv) > 2 else tempfile.mktemp(suffix=".mjs")
    open(path, "w").write(src)
    r = subprocess.run(["node", "--check", path], capture_output=True, text=True)
    print(f"{n} cells -> {path}")
    if r.returncode == 0: print("NODE CHECK: PASS")
    else:
        print(r.stderr); print("NODE CHECK: FAIL"); sys.exit(1)

if __name__ == "__main__":
    main()
