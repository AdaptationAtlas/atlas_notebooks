#!/usr/bin/env python3
"""
Fetch and bundle the latest official CCSR/IRI ENSO Multi-Model Prediction Plume.

Source chain (all primary, keyless):
  1. IRI "Quick Look" page  https://iri.columbia.edu/our-expertise/climate/forecasts/enso/current/
     -> issue month/year, the embedded plume figure URL and the plume discussion text.
  2. The plume figure itself https://ensoforecast.iri.columbia.edu/figure4_plot/<year>/<month0>
     (matplotlib SVG). Every model trace, legend entry and axis tick is a vector element, so the
     per-model, per-season Nino 3.4 values are recovered exactly from the figure geometry:
       * text   = matplotlib's `<!-- label -->` comments (season ticks, value ticks, legend names)
       * y axis = linear fit through the numeric tick labels (R^2 checked)
       * x axis = nearest season tick (tolerance checked)
       * traces = <path> + <use href="#marker"> inside the axes; matched to legend handles by
                  marker id (models) or by stroke colour + width (averages, which have no marker)
     Nothing is typed by hand; the parse is rejected unless it is internally consistent.

The IWMI ENSO_api mirror that this script used to read (enso.iwmi.org) went 404 in Sep 2026, so the
bundle is now built directly from IRI. The output schema is a superset of the old one so the
notebook keeps working; new fields: current.seasonYears, current.observedSeasons, metadata.issueLabel,
metadata.figureUrl, metadata.parser.

Usage:  python3 scripts/fetch_iri_plume.py [--year 2026 --month 9] [--compare path.json] [--dry-run]
        --month is the 1-based *issue* month (the plume released in that month).
"""
import argparse
import datetime as dt
import html as htmlmod
import json
import os
import re
import sys
import urllib.request

QUICKLOOK_URL = "https://iri.columbia.edu/our-expertise/climate/forecasts/enso/current/"
FIGURE_HOST = "https://ensoforecast.iri.columbia.edu"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128 Safari/537.36 AdaptationAtlasDataBot/2.0"

MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August",
          "September", "October", "November", "December"]
SEASON_CODES = ["DJF", "JFM", "FMA", "MAM", "AMJ", "MJJ", "JJA", "JAS", "ASO", "SON", "OND", "NDJ"]
# index of the season whose FIRST month is m (1-based): season i = months (i, i+1, i+2) with DJF=12,1,2
SEASON_BY_FIRST_MONTH = {12: "DJF", 1: "JFM", 2: "FMA", 3: "MAM", 4: "AMJ", 5: "MJJ", 6: "JJA",
                         7: "JAS", 8: "ASO", 9: "SON", 10: "OND", 11: "NDJ"}
OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "KE-enso-explorer")


def _get(url, timeout=60):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read().decode("utf-8", "replace")


# --------------------------------------------------------------------------- quick-look page
def parse_quicklook(page):
    """-> dict(issueYear, issueMonth(1-based), figureUrl, discussion, updatedOn)"""
    title = re.search(r"<title>(.*?)</title>", page, re.S)
    title = htmlmod.unescape(title.group(1)) if title else ""
    m = re.search(r"(" + "|".join(MONTHS) + r")\s+(20\d\d)\s+Quick\s+Look", title)
    if not m:
        raise RuntimeError(f"Cannot read issue month from IRI page title: {title!r}")
    issue_month = MONTHS.index(m.group(1)) + 1
    issue_year = int(m.group(2))

    fig = re.search(r"https?://ensoforecast\.iri\.columbia\.edu/figure4_plot/(\d{4})/(\d{1,2})", page)
    if not fig:
        raise RuntimeError("Plume figure URL (figure4_plot) not found on IRI page")
    fig_year, fig_month0 = int(fig.group(1)), int(fig.group(2))
    # IRI's figure URL month is 0-based; it must agree with the page title.
    if (fig_year, fig_month0 + 1) != (issue_year, issue_month):
        raise RuntimeError(f"Figure URL {fig.group(0)} disagrees with page title {m.group(0)}")

    # Plume discussion: the paragraph(s) mentioning the "prediction plume".
    text = re.sub(r"<script.*?</script>|<style.*?</style>", " ", page, flags=re.S)
    paras = [htmlmod.unescape(re.sub(r"<[^>]+>", " ", p)) for p in re.findall(r"<p[^>]*>(.*?)</p>", text, re.S)]
    paras = [re.sub(r"\s+", " ", p).strip() for p in paras]
    disc = [p for p in paras if "plume" in p.lower() and len(p) > 120]
    discussion = "\n\n".join(disc[:3]) if disc else None

    upd = re.search(r"ENSO Predictions Plume \[([A-Za-z]+ \d{1,2}, \d{4})\]", page)
    updated_on = None
    if upd:
        try:
            updated_on = dt.datetime.strptime(upd.group(1), "%B %d, %Y").date().isoformat()
        except ValueError:
            pass
    return dict(issueYear=issue_year, issueMonth=issue_month, figureUrl=fig.group(0),
                figureMonthIndex=fig_month0, discussion=discussion, updatedOn=updated_on)


# --------------------------------------------------------------------------- SVG geometry
_NUM = r"[-+]?\d+(?:\.\d+)?"


def _texts(svg):
    """All matplotlib text groups -> [(label, x, y)] in SVG px (translate of the glyph group)."""
    out = []
    for m in re.finditer(r'<g id="text_\d+">\s*<!--([^<]*?)-->\s*<g[^>]*transform="translate\((%s) (%s)\)' % (_NUM, _NUM), svg, re.S):
        label = htmlmod.unescape(m.group(1)).strip().replace("−", "-")
        out.append((label, float(m.group(2)), float(m.group(3))))
    return out


def _path_points(d):
    pts = re.findall(r"[ML]\s*(%s)\s+(%s)" % (_NUM, _NUM), d)
    return [(float(x), float(y)) for x, y in pts]


def _line_groups(block):
    """Every <g id="line2d_N"> in a block -> dict(id, stroke, width, dash, marker, points, markerPts)."""
    out = []
    for m in re.finditer(r'<g id="(line2d_\d+)">(.*?)</g>\s*(?=<g id="|</g>|\Z)', block, re.S):
        gid, body = m.group(1), m.group(2)
        path = re.search(r'<path d="([^"]*)"[^>]*style="([^"]*)"', body, re.S)
        if not path:
            continue
        style = path.group(2)
        stroke = re.search(r"stroke: (#[0-9a-fA-F]{6})", style)
        width = re.search(r"stroke-width: (%s)" % _NUM, style)
        marker = re.search(r'<use xlink:href="#(m[0-9a-f]+)"', body)
        mpts = [(float(x), float(y)) for x, y in re.findall(r'<use xlink:href="#m[0-9a-f]+" x="(%s)" y="(%s)"' % (_NUM, _NUM), body)]
        out.append(dict(id=gid, stroke=(stroke.group(1).lower() if stroke else None),
                        width=float(width.group(1)) if width else 1.0,
                        dash="stroke-dasharray" in style, marker=marker.group(1) if marker else None,
                        points=_path_points(path.group(1)), markerPts=mpts))
    return out


def parse_plume_svg(svg):
    """-> dict(seasons, obsLabels, legend, traces, calibration)"""
    texts = _texts(svg)

    def tick_positions(kind):
        """matplotlib emits <g id="xtick_N"> / <g id="ytick_N"> each holding the tick line (a 2-point
        path) and the label text group. Pair the tick LINE coordinate with the decoded label."""
        out = []
        for m in re.finditer(r'<g id="%s_\d+">(.*?)</g>\s*</g>\s*</g>' % kind, svg, re.S):
            body = m.group(1)
            line = re.search(r'<path d="M (%s) (%s)\s*L (%s) (%s)' % (_NUM, _NUM, _NUM, _NUM), body)
            lab = re.search(r'<!--([^<]*?)-->', body, re.S)
            if not line or not lab:
                continue
            label = htmlmod.unescape(lab.group(1)).strip().replace("\u2212", "-")
            coord = float(line.group(1)) if kind == "xtick" else float(line.group(2))
            out.append((label, coord))
        return out

    # --- y axis: value = a*y + b fitted through the numeric tick lines (exact for a linear axis)
    yt = [(float(l), y) for l, y in tick_positions("ytick") if re.fullmatch(r"-?\d+(\.\d+)?", l)]
    if len(yt) < 4:
        raise RuntimeError(f"Too few y-axis ticks decoded: {yt}")
    n = len(yt)
    sy = sum(y for _, y in yt); sv = sum(v for v, _ in yt)
    syy = sum(y * y for _, y in yt); syv = sum(y * v for v, y in yt)
    a = (n * syv - sy * sv) / (n * syy - sy * sy)
    b = (sv - a * sy) / n
    resid = max(abs(a * y + b - v) for v, y in yt)
    if resid > 0.01:
        raise RuntimeError(f"y-axis calibration not linear (max resid {resid:.3f} degC)")
    y_to_val = lambda y: a * y + b

    # --- x axis: season / observation tick lines
    centres = [(l, x) for l, x in tick_positions("xtick") if (l in SEASON_CODES or l.endswith("-OBS"))]
    if len(centres) < 6:
        raise RuntimeError(f"Too few x-axis season ticks decoded: {centres}")
    cx = [c for _, c in centres]
    spacing = (cx[-1] - cx[0]) / (len(cx) - 1)
    forecast_labels = [l for l, _ in centres if l in SEASON_CODES]
    obs_labels = [l for l, _ in centres if l.endswith("-OBS")]

    def x_to_label(x):
        best = min(centres, key=lambda c: abs(c[1] - x))
        if abs(best[1] - x) > 0.25 * spacing:
            return None
        return best[0]

    # --- legend: handles (line2d) followed by their text label, in order
    leg_start = svg.find('<g id="legend_1">')
    if leg_start < 0:
        raise RuntimeError("legend_1 not found in SVG")
    legend_block = svg[leg_start:]
    axes_block = svg[:leg_start]
    handles = _line_groups(legend_block)
    leg_texts = [(l, x, y) for l, x, y in texts if x > 800]
    legend = []
    section = None
    for h in handles:
        hy = sum(p[1] for p in h["points"]) / len(h["points"])
        lab = min(leg_texts, key=lambda t: abs(t[2] - hy))
        if abs(lab[2] - hy) > 6:
            continue
        name = lab[0].strip()
        if name.endswith("MODELS:"):
            section = "Dynamical" if name.startswith("DYN") else "Statistical"
            continue
        if not name:
            continue
        legend.append(dict(name=name, section=section, stroke=h["stroke"], width=h["width"],
                           dash=h["dash"], marker=h["marker"]))

    # --- traces inside the axes (exclude grid/spine lines: those have 2 points and grey/black strokes)
    traces = []
    for g in _line_groups(axes_block):
        if len(g["points"]) < 2 or g["stroke"] is None:
            continue
        if (g["dash"] or g["stroke"] == "#cccccc") and g["marker"] is None:
            continue  # grid line
        vals = {}
        for (x, y) in g["points"]:
            lab = x_to_label(x)
            if lab is None:
                continue
            vals[lab] = round(y_to_val(y), 4)
        if vals:
            g["values"] = vals
            traces.append(g)

    return dict(forecastSeasons=forecast_labels, obsLabels=obs_labels, legend=legend, traces=traces,
                calibration=dict(y_slope=a, y_intercept=b, y_resid=resid, x_spacing=spacing, n_yticks=n))


def match_legend_to_traces(parsed):
    """Return (models, averages, observed) with per-season values.

    Legend entries are matched to axes traces by marker id. Two models can share a marker id AND a
    colour (matplotlib hashes marker geometry+style, and the plume's symbol/colour cycle wraps), so
    within one marker id the entries are paired in order: legend order == ax.plot() order == SVG draw
    order (line2d ids are sequential). Averages have no marker and are matched by colour + width."""
    traces = parsed["traces"]
    seasons = parsed["forecastSeasons"]
    models, averages, observed = [], {}, {}
    lid = lambda t: int(t["id"].split("_")[1])
    by_marker = {}
    for t in sorted(traces, key=lid):
        if t["marker"]:
            by_marker.setdefault(t["marker"], []).append(t)
    taken = {}  # marker id -> how many consumed
    used = set()
    for e in parsed["legend"]:
        t = None
        if e["marker"]:
            cands = by_marker.get(e["marker"], [])
            k = taken.get(e["marker"], 0)
            if k < len(cands):
                t = cands[k]
                taken[e["marker"]] = k + 1
        if t is None:
            cands = [x for x in sorted(traces, key=lid) if x["stroke"] == e["stroke"] and abs(x["width"] - e["width"]) < 0.3
                     and x["dash"] == e["dash"] and x["id"] not in used and x["marker"] is None]
            if cands:
                t = cands[0]
        if t is None:
            continue
        used.add(t["id"])
        data = [t["values"].get(s) for s in seasons]
        name = e["name"].strip()
        up = name.upper()
        if up.endswith("AVG") or up.endswith("AVERAGE"):
            key = "dynamical" if up.startswith("DYN") else "statistical" if up.startswith("STAT") else "total"
            averages[key] = data
        elif up.startswith("OBS"):
            observed = dict(t["values"])
        else:
            models.append(dict(model=name, type=e["section"] or "Unknown", data=data,
                               color=e["stroke"], symbol=e["marker"]))
    # observations: the thick black line through the -OBS ticks (no legend entry)
    if not observed:
        for t in traces:
            obs_vals = {k: v for k, v in t["values"].items() if k.endswith("-OBS")}
            if obs_vals and t["stroke"] == "#000000" and t["width"] >= 2 and t["marker"] is None:
                observed = obs_vals
                break
    return models, averages, observed


def season_years(seasons, issue_year, issue_month):
    """Forecast seasons start with the season whose first month is (issue_month - 1).
    Label year = calendar year of the season's 2nd month (NOAA convention, matches enso_drivers_build)."""
    first_month = (issue_month - 2) % 12 + 1  # issue Sep (9) -> Aug (8) -> ASO
    expected_first = SEASON_BY_FIRST_MONTH[first_month]
    if seasons and seasons[0] != expected_first:
        raise RuntimeError(f"First forecast season {seasons[0]} but issue month {issue_month} implies {expected_first}")
    years = []
    y, m = issue_year, first_month
    for s in seasons:
        m2 = m % 12 + 1  # second month of this season
        y2 = y + (1 if m2 < m else 0)
        years.append(y2)
        m = m % 12 + 1
        if m == 1:
            y += 1
    return years


def validate(models, averages, seasons, parsed, observed=None):
    errs = []
    if len(models) < 10:
        errs.append(f"only {len(models)} models decoded (need >= 10)")
    if len(seasons) < 8:
        errs.append(f"only {len(seasons)} forecast seasons decoded")
    for m in models:
        nn = [v for v in m["data"] if v is not None]
        if len(nn) < 4:
            errs.append(f"{m['model']}: only {len(nn)} seasonal values")
        if any(v < -4.5 or v > 6.0 for v in nn):
            errs.append(f"{m['model']}: implausible value(s) {nn}")
        if m["type"] not in ("Dynamical", "Statistical"):
            errs.append(f"{m['model']}: unclassified type {m['type']}")
    if "dynamical" not in averages or "statistical" not in averages:
        errs.append(f"average traces missing: {sorted(averages)}")
    else:
        # the decoded per-type average must agree with the mean of the decoded members (figure is self-consistent)
        for typ, key in (("Dynamical", "dynamical"), ("Statistical", "statistical")):
            for i, s in enumerate(seasons):
                vals = [m["data"][i] for m in models if m["type"] == typ and m["data"][i] is not None]
                if len(vals) >= 3 and averages[key][i] is not None:
                    dev = abs(sum(vals) / len(vals) - averages[key][i])
                    if dev > 0.25:
                        errs.append(f"{typ} average at {s} deviates {dev:.2f} degC from member mean")
    names = [m["model"] for m in models]
    if len(set(names)) != len(names):
        errs.append("duplicate model names")
    # every legend model must have found a trace, and every marker trace must belong to a legend entry
    import collections
    leg_models = [e for e in parsed["legend"] if e["marker"]]
    if len(models) != len(leg_models):
        errs.append(f"{len(leg_models)} legend models but {len(models)} traces matched")
    tc = collections.Counter(t["marker"] for t in parsed["traces"] if t["marker"])
    lc = collections.Counter(e["marker"] for e in leg_models)
    if tc != lc:
        errs.append(f"marker groups differ between legend and axes: {dict((k, (lc.get(k), tc.get(k))) for k in set(tc) | set(lc) if lc.get(k) != tc.get(k))}")
    if not observed:
        errs.append("observed Nino 3.4 anchor line not found")
    return errs


def build_bundle(ql, parsed, models, averages, observed, fetched_at):
    seasons = parsed["forecastSeasons"]
    years = season_years(seasons, ql["issueYear"], ql["issueMonth"])
    obs_seasons = []
    for lab in parsed["obsLabels"]:
        v = observed.get(lab)
        obs_seasons.append(dict(label=lab, period=lab.replace("-OBS", ""), value=v))
    label = f"{MONTHS[ql['issueMonth'] - 1]} {ql['issueYear']}"
    release_day = ql.get("updatedOn")
    return {
        "metadata": {
            "source": "CCSR/IRI Model Predictions of ENSO (IRI / Columbia Climate School, with NOAA CPC)",
            "api_origin": ql["figureUrl"],
            "pageUrl": QUICKLOOK_URL,
            "figureUrl": ql["figureUrl"],
            "sourceKind": "figure-svg",
            "parser": "scripts/fetch_iri_plume.py (vector geometry of the official plume figure; no typed values)",
            "issueYear": ql["issueYear"],
            "issueMonth": ql["issueMonth"],
            "issueMonthIsOneBased": True,
            "issueLabel": label,
            "releaseDate": release_day,
            "releaseMonth": ql["issueMonth"],
            "releaseYear": ql["issueYear"],
            "discussion": ql["discussion"],
            "fetchedAt": fetched_at,
            "calibration": parsed["calibration"],
        },
        "current": {
            "issueYear": ql["issueYear"],
            "issueMonth": ql["issueMonth"],
            "issueLabel": label,
            "seasons": seasons,
            "seasonYears": years,
            "observedSeasons": obs_seasons,
            "averages": {
                "dynamical": averages.get("dynamical"),
                "statistical": averages.get("statistical"),
                "total": averages.get("total"),
            },
            "models": models,
            "discussion": ql["discussion"],
            "source": ql["figureUrl"],
            "sourceKind": "figure-svg",
            "fetchedAt": fetched_at,
        },
        "models": [dict(name=m["model"], type=m["type"], typeCode=m["type"][0], color=m["color"], symbol=m["symbol"], active=True)
                   for m in models],
    }


VOLATILE_KEYS = {"fetchedAt", "calibration"}


def _strip_volatile(o):
    if isinstance(o, dict):
        return {k: _strip_volatile(v) for k, v in o.items() if k not in VOLATILE_KEYS}
    if isinstance(o, list):
        return [_strip_volatile(v) for v in o]
    return o


def _same_payload(a, b):
    return _strip_volatile(a) == _strip_volatile(b)


def compare(bundle, other_path):
    """Compare against a previous bundle (same issue expected). Prints max deviation per model."""
    with open(other_path) as f:
        other = json.load(f)
    oc = other.get("current", {})
    oseasons = oc.get("seasons", [])
    omods = {m.get("model") or m.get("name"): m for m in oc.get("models", [])}
    seasons = bundle["current"]["seasons"]
    worst = 0.0
    n = 0
    for m in bundle["current"]["models"]:
        o = omods.get(m["model"])
        if not o:
            print(f"   {m['model']:<14} not in reference")
            continue
        devs = []
        for i, s in enumerate(seasons):
            if s in oseasons and m["data"][i] is not None and o["data"][oseasons.index(s)] is not None:
                devs.append(abs(m["data"][i] - o["data"][oseasons.index(s)]))
        if devs:
            n += 1
            worst = max(worst, max(devs))
            print(f"   {m['model']:<14} n={len(devs)} max|d|={max(devs):.3f}")
    print(f"   -> {n} models compared, worst deviation {worst:.3f} degC")
    return worst


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--year", type=int)
    ap.add_argument("--month", type=int, help="1-based issue month (overrides the IRI page)")
    ap.add_argument("--compare", help="previous bundle JSON to diff against (same issue)")
    ap.add_argument("--dry-run", action="store_true", help="parse + validate, do not write")
    ap.add_argument("--out", default=os.path.join(OUT_DIR, "iri_forecast_plume.json"))
    args = ap.parse_args()

    fetched_at = dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat()
    print(f"Fetching IRI Quick Look page {QUICKLOOK_URL} ...")
    page = _get(QUICKLOOK_URL)
    ql = parse_quicklook(page)
    if args.year and args.month:
        ql.update(issueYear=args.year, issueMonth=args.month,
                  figureUrl=f"{FIGURE_HOST}/figure4_plot/{args.year}/{args.month - 1}", figureMonthIndex=args.month - 1)
        if (args.year, args.month) != (parse_quicklook(page)["issueYear"], parse_quicklook(page)["issueMonth"]):
            ql["discussion"] = None  # discussion on the page belongs to the current issue only
    print(f"  issue: {MONTHS[ql['issueMonth'] - 1]} {ql['issueYear']}  figure: {ql['figureUrl']}  plume updated: {ql['updatedOn']}")

    print("Fetching plume figure (SVG) ...")
    svg = _get(ql["figureUrl"])
    if "<svg" not in svg[:2000]:
        raise RuntimeError("figure4_plot did not return an SVG")
    parsed = parse_plume_svg(svg)
    models, averages, observed = match_legend_to_traces(parsed)
    if os.environ.get("PLUME_DEBUG"):
        for t in parsed["traces"]:
            if any(k.endswith("-OBS") for k in t["values"]):
                print(f"  [debug] trace {t['id']} stroke={t['stroke']} w={t['width']} marker={t['marker']} vals={t['values']}")
        print(f"  [debug] legend: {[(e['name'], e['stroke'], e['width'], e['marker']) for e in parsed['legend']]}")
    errs = validate(models, averages, parsed["forecastSeasons"], parsed, observed)
    print(f"  seasons: {parsed['forecastSeasons']}  obs ticks: {parsed['obsLabels']}")
    print(f"  models decoded: {len(models)} ({sum(m['type'] == 'Dynamical' for m in models)} dyn / {sum(m['type'] == 'Statistical' for m in models)} stat); "
          f"averages: {sorted(averages)}; observed: {observed}")
    print(f"  calibration: y resid {parsed['calibration']['y_resid']:.4f} degC over {parsed['calibration']['n_yticks']} ticks")
    if errs:
        for e in errs:
            print(f"  ✗ {e}", file=sys.stderr)
        sys.exit(2)

    bundle = build_bundle(ql, parsed, models, averages, observed, fetched_at)
    bundle["current"]["observed"] = [dict(month=o["period"], data=o["value"]) for o in bundle["current"]["observedSeasons"]]

    if args.compare:
        print(f"Comparing with {args.compare} ...")
        compare(bundle, args.compare)

    if args.dry_run:
        print(json.dumps({k: v for k, v in bundle["current"].items() if k != "models"}, indent=1)[:1500])
        print("(dry run — nothing written)")
        return
    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    if os.path.exists(args.out) and _same_payload(json.load(open(args.out)), bundle):
        print(f"Unchanged: {args.out} already holds the {bundle['metadata']['issueLabel']} issue (not rewritten, no churn)")
        return
    with open(args.out, "w") as f:
        json.dump(bundle, f, indent=2)
    snap = os.path.join(OUT_DIR, "_sources", f"IRI_plume.snapshot.svg")
    os.makedirs(os.path.dirname(snap), exist_ok=True)
    with open(snap, "w") as f:
        f.write(svg)
    print(f"Saved {args.out} ({os.path.getsize(args.out) / 1024:.1f} KB); figure snapshot -> {snap}")
    print(f"Latest issue: {bundle['metadata']['issueLabel']} with {len(models)} models over {bundle['current']['seasons']}")


if __name__ == "__main__":
    main()
