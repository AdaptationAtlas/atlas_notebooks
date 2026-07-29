const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

function stackedBarsIcon() {
  const icon = document.createElementNS(SVG_NAMESPACE, "svg");
  icon.classList.add("atlas-hero__mark");
  icon.setAttribute("viewBox", "0 0 32 27");

  const bars = document.createElementNS(SVG_NAMESPACE, "path");
  bars.setAttribute("fill", "white");
  bars.setAttribute("stroke", "white");
  bars.setAttribute("stroke-width", ".5");
  bars.setAttribute(
    "d",
    `M 31.60,25.63
           C 31.60,25.84 31.52,26.03 31.38,26.18
             31.23,26.32 31.04,26.40 30.84,26.40
             30.84,26.40 1.16,26.40 1.16,26.40
             0.96,26.40 0.76,26.32 0.62,26.18
             0.48,26.03 0.40,25.84 0.40,25.63
             0.40,25.43 0.48,25.24 0.62,25.09
             0.76,24.95 0.96,24.87 1.16,24.87
             1.16,24.87 2.59,24.87 2.59,24.87
             2.59,24.87 2.59,14.63 2.59,14.63
             2.59,14.42 2.67,14.23 2.82,14.09
             2.96,13.94 3.15,13.86 3.36,13.86
             3.36,13.86 8.85,13.86 8.85,13.86
             9.06,13.86 9.25,13.94 9.39,14.09
             9.54,14.23 9.62,14.42 9.62,14.63
             9.62,14.63 9.62,24.87 9.62,24.87
             9.62,24.87 12.49,24.87 12.49,24.87
             12.49,24.87 12.49,6.92 12.49,6.92
             12.49,6.72 12.57,6.52 12.71,6.38
             12.85,6.24 13.05,6.16 13.25,6.16
             13.25,6.16 18.75,6.16 18.75,6.16
             18.95,6.16 19.14,6.24 19.29,6.38
             19.43,6.52 19.51,6.72 19.51,6.92
             19.51,6.92 19.51,24.87 19.51,24.87
             19.51,24.87 22.38,24.87 22.38,24.87
             22.38,24.87 22.38,0.77 22.38,0.77
             22.38,0.56 22.46,0.37 22.60,0.22
             22.75,0.08 22.94,0.00 23.14,0.00
             23.14,0.00 28.64,0.00 28.64,0.00
             28.84,0.00 29.04,0.08 29.18,0.22
             29.32,0.37 29.40,0.56 29.40,0.77
             29.40,0.77 29.40,24.87 29.40,24.87
             29.40,24.87 30.84,24.87 30.84,24.87
             31.04,24.87 31.23,24.95 31.38,25.09
             31.52,25.24 31.60,25.43 31.60,25.63 Z`,
  );
  icon.appendChild(bars);
  return icon;
}

/** Create the circular Atlas notebook hero; leave alt empty for decorative images. */
export function atlasHero({ title, image, group = "", alt = "" } = {}) {
  if (!title) throw new TypeError("atlasHero requires a title");
  if (!image) throw new TypeError("atlasHero requires an image");

  const hero = document.createElement("section");
  hero.id = "hero-image";
  hero.className = "atlas-hero";
  hero.setAttribute("aria-labelledby", "notebook-title");

  const background = document.createElement("img");
  background.className = "atlas-hero__image";
  background.src = image;
  background.alt = alt;

  const content = document.createElement("div");
  content.className = "atlas-hero__content";

  const icon = document.createElement("div");
  icon.className = "atlas-hero__icon";
  icon.setAttribute("aria-hidden", "true");
  icon.appendChild(stackedBarsIcon());
  content.appendChild(icon);

  if (group) {
    const groupLabel = document.createElement("span");
    groupLabel.className = "atlas-hero__group";
    groupLabel.textContent = String(group);
    content.appendChild(groupLabel);
  }

  const heading = document.createElement("h1");
  heading.id = "notebook-title";
  heading.className = "atlas-hero__title";
  heading.textContent = String(title);
  content.appendChild(heading);

  hero.append(background, content);
  return hero;
}

/** @deprecated Use `atlasHero({title, image, group, alt})`. */
export function heroImage(title, bgImage, group = "") {
  return atlasHero({ title, image: bgImage, group });
}
