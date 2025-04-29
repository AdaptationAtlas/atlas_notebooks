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

## Activate a Python virtual environment

```bash
python3 -m venv venv
source venv/bin/activate
pip install jupyter matplotlib plotly
```

### Install Quarto

To install Quarto, follow the instructions on the [Quarto website](https://quarto.org/docs/get-started/).

### Install Node.js and related packages

1. Install node version manager:
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
```
2. Create an environment that uses node v20.17.0:
```bash
nvm use 20.17.0
```
3. Give this environment an alias: 
```bash
nvm alias atlas_notebooks 20.17.0
```
4. Switch to this environment: 
```bash
nvm use atlas_notebooks
```
5. Confirm that you have successfully created the `atlas_notebooks` environment: 
```bash
nvm ls
```
6. Confirm that the node version in the atlas_notebooks environment is v20.17.0: 
```bash
node -v
```
7. Install required packages from `package.json`:
```bash
npm install
```
8. Render the Quarto notebook:
```bash
cd /path/to/your/notebook
quarto preview gender.qmd --port 8080
quarto render gender.qmd --to html
```