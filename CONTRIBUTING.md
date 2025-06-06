# Adaptation Atlas Contribution Guidelines

Thanks for considering contributing! Community engagement is one of the core values of the Atlas, it is a driving
principle behind many of the decisions we have made. We believe in the power of open data and community collaboration to drive meaningful action.

This project is built with a few core principles in mind:
 - Accessibility: No complex server setup required. The entire site is static and can be run in any modern web browser.
  - The Atlas uses free and open source tools that are familiar to scientists and researchers.
 - Interactivity: We use Observable JavaScript (OJS) to create rich, interactive charts, maps, and text that respond to user input.
 - Reproducibility: Built with Quarto, our notebooks are fully reproducible and easy to modify.
 - Performance: We leverage cloud-optimized data formats (COG, GeoParquet) to efficiently handle large datasets directly in the browser.

 Please reach out with any suggestions or questions.

You can contribute in several ways:
- Reporting or fixing bugs or typos
- Translating content to new languages
- Developing new notebooks
- Implementing new data
- Improving current code and performance
- Providing feedback and new questions

We hope to have the Atlas be easy for anyone to contribute to, to modify, and to develop new data stories. Please get in touch with us to discuss ideas, provide suggestions, or ask questions.

## Repository Structure

| Branch     | Description                                                                 | Link                                                        |
| ---------- | --------------------------------------------------------------------------- | ----------------------------------------------------------- | 
| `main`     | Production branch used to build the live version of the Atlas               | [Main](https://main.adaptation-atlas-nb.pages.dev/)         |
| `develop`  | Development and staging branch for active work and previews                 | [Develop](https://develop.adaptation-atlas-nb.pages.dev/)   |
| `template` | Minimal starting point for contributors—no notebook content or dependencies | [Template](https://template.adaptation-atlas-nb.pages.dev/) |
| `example`  | Archived notebooks from an earlier version of the project                   | [Example](https://example.adaptation-atlas-nb.pages.dev/)   |

---

# Contributing

## Local Project Setup
The project has very few dependencies. Really all you need to download is Quarto which will include all other
dependencies for the project to run. 

Project dependencies:
 - [Quarto](https://quarto.org/docs/get-started/)
 - An IDE/Text Editor (VScode, RStudio, Neovim, Positron, etc.)
 - A web-browser for previewing

To build and preview the project locally:

1. **Install Quarto**
   Follow the instructions for your operating system at [quarto.org/docs/get-started](https://quarto.org/docs/get-started).
   (Extensions for VSCode, RStudio, or Neovim are optional but helpful.)

2. **Clone the repository**

   ```bash
   git clone https://github.com/AdaptationAtlas/atlas_notebooks.git

   # or to clone just the example

   git clone --single-branch --branch example https://github.com/AdaptationAtlas/atlas_notebooks.git

   cd atlas_notebooks
   ```

3. **Preview locally**

   ```bash
   quarto preview --no-browser --no-watch-inputs
   ```

   > By default, Quarto assigns a random port and provides the preview link in the terminal. You can specify a port if preferred:
   >
   > ```bash
   > quarto preview --port 8080
   > ```

Go to the localhost URL corresponding to the port being used. This should also be displayed by Quarto and will look something like http://localhost:8000.

4. **Build the site for export or deployment**

In general, preview will be used most often to build the notebooks. However, it can be useful to render the full site to deploy to a test server, host on github pages, or similar. It can also be useful to occasionaly test the rendered output due to some occasional edge-cases where path differences are handled differently between preview and render.

Render the project from the project root. This will result in a `_site` directory which contains the rendered html, js, and other dependencies which can be deployed as a static site. 

   ```bash
   quarto render
   ```

These rendered files can be opened in a browser, but, OJS cells in html documents do not work when used with the file:// protocol. This is due to some features of the Observable runtime which require http:// or https://. See [this GitHub issue](https://github.com/quarto-dev/quarto-cli/discussions/5680) for more discussion.

Some workarounds: 
- use `quarto preview`, and explore the site from there, only rendering when pushing to github pages or similar.
- Serve the html pages locally using the `testServer.ts` helper such as: `quarto run helpers/testServer.ts`
- Serve the html pages locally using python with `python3 -m http.server -d _site 4000`

---


## To propose a new notebook or improvement:

1. **Fork the repository** on GitHub.

2. **Create a new branch based on `template`** You can do this locally by first checking out the `template` branch, then
creating your feature branch:
```sh 
git checkout 
template git pull origin template        # make sure your local template is up to date git
checkout -b my-feature-branch
```

3. **Build on your branch** using clear and frequent commits.

4. **Push your branch** to your fork: 
```sh
git push origin my-feature-branch
```

5. **Submit a pull request** from your fork’s branch to the appropriate branch on the Atlas notebook repository (typically
`develop`).

**Note on site limitations:** New notebooks should be static webpages - any R, Python, or Julia code will not be able to run after
render. TypeScript is also unable to be used directly within Quarto notebooks, but it can be used to execute pre-and-post render
scripts. Currently, using Shiny as a back-end is also not available. If interested, both
[R](https://docs.r-wasm.org/webr/latest/) and [Python](https://pyodide.org/en/stable/) have been compiled to
web-assembly and could technically be possible to use - however this is currently untested for the Atlas and may result
in decreased performance.

The `template` branch provides a clean starting point for new notebooks without including unrelated code or data. This
allows you to work on the project without needing to render all notebooks and pages.

You can clone just the `template` branch with this: 
```sh
git clone --single-branch --branch template
https://github.com/AdaptationAtlas/atlas_notebooks.git
```

## Commit Guidelines:
We strongly encourage the use of [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/). This is a
community project with many people needing to maintain, modify, and build from the code for years to come - good commits promote
this. [The LTER Team](https://lternet.edu/stories/databits-conventional-commits/) outlines some good points that are directed
towards scientists and researchers. Commits should aim to highlight why something was changed, not just what was changed.

## Documentation Guidelines:
- Use [JSDoc](https://jsdoc.app/) for reusable functions, classes, or modules shared across notebooks.
- Use concise inline comments to explain:
  - The purpose of a block or group of code (e.g. "// Import dependencies", "\<!--# code for notebook section 1 -->")
  - Non-obvious logic, assumptions, or data quirks
  - Trade-offs, gotchas, or temporary workarounds
  - Why something was done the way it was
- Avoid comments which re-state obvious code - focus on why, not what.
- Use comments to structure your code into clear sections (e.g. data prep, transformation, plotting, sections).

## Style Guidelines:

### Global Guidelines
**Line Length**: Lines should be a maximum of 120 characters.
**Indents**: Spaces not tabs, and 2 spaces is generally preferred over 4. 
**Organization:** 
- Keep code in logical groups and use modular approaches where applicable.
- Notebook code is generally collected and documented in a bottom appendix section of the notebook.
  - The 'code-appendix' will not be visible to users
- Code above the 'code-appendix' should generally be kept for elements visible to the user, and structured in the
order it appears on the page. This will include the code for headings, plots, dynamic text, etc. but not the helpers
used to create those.

### OJS/JS Guidelines
**AirBnB Styling:** Although not always applicable due to differences with OJS, we encourage following the
[AirBnB Style guide for JavaScript](https://github.com/airbnb/javascript) where possible such as for names, comments,
whitespace, blocks, comparison & equality, anonymous arrow functions, commas, etc.
**Blocks:** To avoid polluting the global environment, use blocks to control the namespace of variables. Any variable
defined outside of a block `{}` will not have a `const` or `let` declaration, and will be global.
**OJS Nuances:** Take care to avoid some of the gotchas where OJS differs from JavaScript. In many ways it is simpler as all
variables will automatically update when a user selection causes another variable to change. Read more 
[here](https://observablehq.com/@observablehq/learning-observable-javascript-and-observable)

### Quarto Guidelines
**Headings**: Dynamic Headings should use inline code alongside quarto/markdown headings
 > **Good**
 > ```md
 >  # `{ojs} dynamicHeading`
 > ```
 > **Bad**
 > ```md
 > `{ojs} md`# dynamicHeading``
 > ```


**Code Blocks**: Quarto allows markdown style code blocks as well as in-line code
 - Inline code should be used for simple selectors and dynamic headings, such as for translations.
 - Quarto code blocks can hold multiple OJS "cells". This should be done to group multiple similar pieces of OJS code.
 This could include placing multiple imports in a block, defining variables specific to a plot, etc. The code in the
 quarto code blocks should be the smallest logical group to keep things clean and manageable. 
 > **For example:**
 > **Good**
 > ```{ojs}
 > // All external libraries
 > d3 = require("d3@7")
 > topojson = require("topojson")
 > import { aq, op } from '@uwdata/arquero'
 > ```
 > 
 > **Bad**
 > ```{ojs}
 > d3 = require("d3@7")
 > topojson = require("topojson")
 > import { aq, op } from '@uwdata/arquero'
 > 
 > map = d3.json("https://some-url.topojson")
 > topoSimple = {
 >   let simplified = topojson.presimplify(map);
 >   let weight = topojson.quantile(simplified, 0.5);
 >   map_simplified = topojson.simplify(simplified, weight);
 >   return map_simplified;
 > }
 > geojsonSimple = topojson.feature(map, map.objects.myMap)
 > ```
 > This second example block could easily be split into two logical ones - imports and map processing.
 > **Bad**
 > ```{ojs}
 > d3 = require("d3@7");
 > ```
 > ```{ojs}
 > topojson = require("topojson");
 > ```
 > ```{ojs}
 > import { aq, op } from "@uwdata/arquero";
 > ```
 > This third example could be consolidated into a single OJS block rather than 3

# Other Suggestions
- Consider using a formatter such as prettier or biome to automatically handle some styling of the JavaScript code. 
However, be careful as it can occasionally break the OJS code due to differences in the languages.
- Although not officially supported, the
[typescript-language-server](https://github.com/typescript-language-server/typescript-language-server) can be used
to assist with completions, editor hints, refactoring, etc.
- AI Code assistants can be useful, especially for documentation tasks. However, they should not replace good
development practices and all code and docs generated by them should be thoroughly checked and understood.
- It is suggested to test and prototype https://observablehq.com/platform/notebooksOJS code in an [Observable Notebook](https://observablehq.com/platform/notebooks) first. This allows for easier/quicker detection of errors, live updates, etc. without needing to re-render the preview. OJS code can be easily copied between ObservableHQ and quarto.


## Other notes

You may encounter `Cannot find name 'Deno'` warnings in some `.ts` files when using editors like VS Code. These occur because Quarto manages Deno/TS dependencies and using an internal version of Deno that your editor cannot access. This is also why package lock files are not needed or included. These warnings are harmless and should not affect the build process. We've added `// @ts-nocheck` flags to suppress them where appropriate.

---

## Additional Resources

* [Quarto Observable Documentation](https://quarto.org/docs/interactive/ojs/)
* [Observable JS Documentation](https://observablehq.com/documentation/cells/observable-javascript)
* [Observable JS vs vanilla Javascript](https://observablehq.com/@observablehq/observable-javascript)
* [Quarto Main Guide](https://quarto.org/docs/guide/)
* [Adaptation Atlas ObservableHQ](https://observablehq.com/@adaptationatlas)

---
