# Adaptation Atlas Notebooks

This repository contains the code for the Africa Agriculture Adaptation Atlas notebooks, along with templates, documentation, and other resources to build new notebooks. The Adaptation Atlas notebooks are written in Quarto using Observable JS. The current generation of notebooks can be accessed from the [Adaptation Atlas Website](https://adaptationatlas.cgiar.org/)

## About the Adaptation Atlas Project

The Africa Agriculture Adaptation Atlas is a aimed at strengthening adaptation programming across Africa using data driven decision-making. We aim to create scientifically robust data rich insights to inform decision-making and facilitate the development of effective adaptation programs, policies, and investments. These notebooks are the core of the Africa Agriculture Adaptation Atlas project and are designed to be user-friendly, scalable, and open. We adopt a story-based aproach to the notebooks with the aim of giving users direct and specific insights for their needs as quickly and easily as possible. This project is lead by the [Alliance of Bioversity International and CIAT](https://alliancebioversityciat.org/) and is build in colaboration with a consortium of CGIAR centers, the Better Planet Laboratory at University of Colorado, Boulder and many other institutions, programs, and individuals. 

---

## Repository Structure

| Branch     | Description                                                                 | Link                                                        |
| ---------- | --------------------------------------------------------------------------- | ----------------------------------------------------------- | 
| `main`     | Production branch used to build the live version of the Atlas               | [Main](https://main.adaptation-atlas-nb.pages.dev/)         |
| `develop`  | Development and staging branch for active work and previews                 | [Develop](https://develop.adaptation-atlas-nb.pages.dev/)   |
| `template` | Minimal starting point for contributors—no notebook content or dependencies | [Template](https://template.adaptation-atlas-nb.pages.dev/) |
| `example`  | Archived notebooks from an earlier version of the project                   | [Example](https://example.adaptation-atlas-nb.pages.dev/)   |

---

## Local Setup

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

## Contributing

We welcome contributions from collaborators and external users. To propose a new notebook or improvement:

1. Fork or clone the repository
2. Create a new branch for your changes
3. Commit your work
4. Submit a pull request to the appropriate branch (typically `develop` or `template`)

**NOTE:** New notebooks should be rendered as a static site - any R, Python, or Julia code will not be able to run after render. Currently, using Shiny as a backend is also not avaliable. If interested, the both [R](https://docs.r-wasm.org/webr/latest/) and [Python](https://pyodide.org/en/stable/) have been compiled to web-assembly and could technically be possible to use - however this is currently untested for the Atlas.

The `template` branch provides a clean starting point for new notebooks without including unrelated code or data.

You can fork just the `template` branch on github, or clone it directly using with:

```sh
git clone --single-branch --branch template https://github.com/AdaptationAtlas/atlas_notebooks.git
```

---

### Other notes

You may encounter `Cannot find name 'Deno'` warnings in some `.ts` files when using editors like VS Code. These occur because Quarto manages Deno/TS dependencies and using an internal version of Deno that your editor cannot access. This is also why package lock files are not needed or included. These warnings are harmless and should not affect the build process. We've added `// @ts-nocheck` flags to suppress them where appropriate.

---

### Additional Resources

* [Quarto Observable Documentation](https://quarto.org/docs/interactive/ojs/)
* [Observable JS Documentation](https://observablehq.com/documentation/cells/observable-javascript)
* [Observable JS vs Javascript](https://observablehq.com/@observablehq/observable-javascript)
* [Quarto Main Guide](https://quarto.org/docs/guide/)
* [Adaptation Atlas ObservableHQ](https://observablehq.com/@adaptationatlas)

---
