#!/usr/bin/env python3
"""
Convert Observable notebooks to Quarto documents.

Usage:
    python observable-to-quarto.py <url> [output_dir]
    python observable-to-quarto.py https://observablehq.com/d/9ca8f47f84c8d475
    python observable-to-quarto.py https://observablehq.com/d/9ca8f47f84c8d475 ./my-notebook
"""

import argparse
import gzip
import json
import sys
import urllib.request
from pathlib import Path


def extract_next_data(html: str) -> dict:
    """Extract the __NEXT_DATA__ JSON block from Observable HTML."""
    start = html.find('<script id="__NEXT_DATA__"')
    if start == -1:
        raise RuntimeError("No __NEXT_DATA__ block found")
    start = html.find(">", start) + 1
    end = html.find("</script>", start)
    return json.loads(html[start:end])


def fetch_notebook(url: str) -> dict:
    """Fetch and parse an Observable notebook."""
    print(f"Fetching notebook from {url}...")
    with urllib.request.urlopen(url) as r:
        html = r.read().decode("utf-8")

    data = extract_next_data(html)
    return data["props"]["pageProps"]["initialNotebook"]


def qmd_yaml_header(title: str, authors: list, license: str) -> str:
    """Generate YAML front matter for Quarto document."""
    lines = ["---", f'title: "{title}"', "author:"]
    for a in authors:
        lines.append(f"  - {a}")
    lines.append(f'license: "{license}"')
    lines.append("echo: true")
    lines.append("format: html")
    lines.append("---\n")
    return "\n".join(lines)


def ojs_block(node: dict) -> str:
    """Convert an Observable node to an OJS code block."""
    mode = node.get("mode")
    value = node.get("value", "").strip()

    if not value:
        return ""  # skip empty cells

    lines = ["```{ojs}"]

    if mode in ("md", "html"):
        lines.append(f"{mode}`{value}`")
    else:
        lines.append(value)

    lines.append("```")
    return "\n".join(lines)


def download_file(url: str, dest: Path):
    """Download a file with gzip support."""
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0",
            "Accept": "*/*",
            "Accept-Encoding": "gzip",
        },
    )
    with urllib.request.urlopen(req) as resp:
        data = resp.read()
        encoding = resp.headers.get("Content-Encoding")

    # Transparently ungzip if needed
    if encoding == "gzip":
        data = gzip.decompress(data)

    dest.write_bytes(data)


def download_files(nb: dict, output_dir: Path):
    """Download all attached files from the notebook."""
    files = nb.get("files")
    if not files:
        return

    output_dir.mkdir(parents=True, exist_ok=True)

    for f in files:
        name = f["name"]
        url = f["url"]
        if url.startswith("/"):
            url = "https://observablehq.com" + url
        dest = output_dir / name
        print(f"  Downloading {name}...")
        download_file(url, dest)


def convert_notebook(url: str, output_dir: str = "output"):
    """Convert an Observable notebook to a Quarto document."""
    try:
        # Fetch notebook
        nb = fetch_notebook(url)

        # Extract metadata
        title = nb["title"]
        authors = [a["name"] for a in nb["authors"]]
        license = nb.get("license", "")
        slug = nb["slug"]

        print(f"Converting: {title}")
        print(f"Authors: {', '.join(authors)}")

        # Create output directory
        out_path = Path(output_dir)
        out_path.mkdir(parents=True, exist_ok=True)

        # Generate YAML header
        yaml = qmd_yaml_header(title, authors, license)

        # Convert nodes to OJS blocks
        nodes = nb["nodes"]
        blocks = []
        for node in nodes:
            block = ojs_block(node)
            if block:
                blocks.append(block)

        content = "\n\n".join(blocks) + "\n"

        # Write Quarto document
        qmd_file = out_path / "notebook.qmd"
        print(f"Writing {qmd_file}...")
        with qmd_file.open("w", encoding="utf-8") as f:
            f.write(yaml)
            f.write("\n")
            f.write(content)

        # Download attached files
        if nb.get("files"):
            print("Downloading attached files...")
            download_files(nb, out_path)

        print(f"\n✓ Conversion complete! Output in: {out_path}")
        print(f"  Run: quarto render {qmd_file}")

    except Exception as e:
        print(f"✗ Error: {e}", file=sys.stderr)
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(
        description="Convert Observable notebooks to Quarto documents",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s https://observablehq.com/d/9ca8f47f84c8d475
  %(prog)s https://observablehq.com/d/9ca8f47f84c8d475 ./my-notebook
        """,
    )
    parser.add_argument("url", help="URL of the Observable notebook")
    parser.add_argument(
        "output_dir",
        nargs="?",
        default="output",
        help="Output directory (default: output)",
    )

    args = parser.parse_args()

    # Validate URL
    if not args.url.startswith("https://observablehq.com/"):
        print("Error: URL must be from observablehq.com", file=sys.stderr)
        sys.exit(1)

    convert_notebook(args.url, args.output_dir)


if __name__ == "__main__":
    main()
