# Adaptation Atlas Notebooks

This repository contains the code for the current Africa Agriculture Adaptation Atlas notebooks, along with templates, documentation, and other resources to build new notebooks. The Adaptation Atlas notebooks are written in Quarto using Observable JS.

## About the Adaptation Atlas Project

The Africa Agriculture Adaptation Atlas is a aimed at strengthening adaptation programming across Africa using data driven decision-making. We aim to create scientifically robust data rich insights to inform decision-making and facilitate the development of effective adaptation programs, policies, and investments. These notebooks are the core of the Africa Agriculture Adaptation Atlas project and are designed to be user-friendly, scalable, and open. We adopt a story-based aproach to the notebooks with the aim of giving users direct and specific insights for their needs as quickly and easily as possible. This project is lead by the [Alliance of Bioversity International and CIAT](https://alliancebioversityciat.org/) and is build in colaboration with a consortium of CGIAR centers, the Better Planet Laboratory at University of Colorado, Boulder and many other institutions, programs, and individuals. 

## Local Project Setup
To build and run the Adaptation Atlas locally:
- Install Quarto following the [directions and links for your specific operating system](https://quarto.org/docs/get-started/)
  - There are useful extensions for VS Code, Neovim, and Rstudio which greatly enhance the experience of editing and writing code for quarto. However, this is not required if you just want to run the noteboks.
- Create a new fork and or clone this repository to the device with quarto installed.
- Navigate to the root directory of the project and run the following quarto command to preview: 

```sh
quarto preview --no-browser --no-watch-inputs 
```
To build the project for final output or to host yourself, run: 
```sh
quarto render
```

## Contributing

We welcome contributions from the community. To contribute or to create a new notebook:

1. Clone or Fork the repository
2. Create a new branch for your notebook idea
3. Make your changes
4. Submit a pull request

## Development Setup

### Install Quarto
To install Quarto, follow the instructions on the [Quarto website](https://quarto.org/docs/get-started/).

Quarto comes with built-in support for Observable JavaScript and this should be 
enough get you up and running to render the Quarto notebooks.

### Render a Quarto notebook
The command below will preview the notebook at http://localhost:8080
```bash
cd /path/to/gender.qmd
quarto preview gender.qmd --port 8080
quarto render gender.qmd --to html
```

> [!NOTE]
> Some TypeScript files may show `Cannot find name 'Deno'` error messages. 
> The "errors" occur because Quarto manages these dependencies within its own 
> internal Deno environment—which uses an older version of Deno (not the 
> recent V2 release). VS Code can’t access that environment, so it (the TS 
> linter) assumes there are errors, even though they are not. They are not 
> actual errors and can be safely ignored. A `ts-nocheck` flag at the top of 
> the .ts scripts has been added to suppress them.