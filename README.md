# The Lattice Handbook

**A Comprehensive Guide to the Lattice Programming Language**

By Alex Jokela

ISBN: 979-8-9951255-1-8

---

## About

The Lattice Handbook is a ~900-page technical book covering the Lattice programming language from first principles through advanced internals. It is organized into 11 Parts, 38 Chapters, and 4 Appendices, targeting intermediate programmers coming from Python, JavaScript, Rust, or Go.

The book covers Lattice v0.3.28.

## Structure

```
├── book.tex              # Main document — includes all parts and chapters
├── preamble.tex          # LaTeX preamble (geometry, fonts, colors, environments)
├── frontmatter.tex       # Cover page, copyright, table of contents
├── cover.tex             # TikZ-generated cover art
├── chapters/             # 38 chapters + 4 appendices as individual .tex files
│   ├── ch01-hello-lattice.tex
│   ├── ch02-repl.tex
│   ├── ...
│   ├── ch38-building-web-service.tex
│   ├── appA-grammar-reference.tex
│   ├── appB-opcode-reference.tex
│   ├── appC-phase-cheatsheet.tex
│   └── appD-builtin-reference.tex
├── generate.mts          # Chapter generation script (Claude Agent SDK)
├── package.json          # Node.js dependencies for generation
├── tsconfig.json         # TypeScript config
├── logs/                 # Generation logs (one per part)
├── figures/              # Diagrams and figures
├── cover.png             # Cover art (300 DPI PNG)
├── cover.jpg             # Cover art (JPEG)
├── bio.md                # Author biography
└── description.md        # Book description (~300 words)
```

## Table of Contents

| Part | Title | Chapters |
|------|-------|----------|
| I | First Contact | 1–4 |
| II | The Working Programmer | 5–10 |
| III | The Phase System | 11–14 |
| IV | Structures and Abstractions | 15–18 |
| V | Concurrency | 19–21 |
| VI | The Standard Library | 22–25 |
| VII | Iterators and Functional Style | 26–27 |
| VIII | Modules, Packages, and Project Structure | 28–29 |
| IX | Tooling and Developer Experience | 30–32 |
| X | Under the Hood | 33–36 |
| XI | Real-World Lattice | 37–38 |
| Appendices | Reference | A–D |

## Building the PDF

### Prerequisites

- A TeX Live installation (2024 or later) with `pdflatex`
- The following LaTeX packages (all included in TeX Live full): `geometry`, `ebgaramond`, `sourcesanspro`, `inconsolata`, `microtype`, `xcolor`, `listings`, `tcolorbox`, `booktabs`, `longtable`, `graphicx`, `tikz`, `fancyhdr`, `titlesec`, `hyperref`, `cleveref`, `makeidx`, `enumitem`, `parskip`, `etoolbox`

### Compile

A full build requires three passes (for cross-references, table of contents, and index):

```bash
pdflatex -interaction=nonstopmode book.tex
pdflatex book.tex
makeindex book.idx
pdflatex book.tex
```

Or use the npm script:

```bash
npm run compile
```

The output is `book.pdf`.

## Chapter Generation

Chapters are generated using `generate.mts`, a TypeScript script that uses the [Claude Agent SDK](https://github.com/anthropics/claude-agent-sdk) to write book content. It launches parallel agents — one per Part — that read the actual Lattice source code and produce LaTeX files with accurate, runnable code examples.

### Prerequisites

- Node.js 18+
- An Anthropic API key (set `ANTHROPIC_API_KEY` in your environment)
- The Lattice source repo at `~/projects/lattice` (agents read source files for accuracy)

### Install dependencies

```bash
npm install
```

### Generate all chapters

This launches 12 parallel agents (Parts I–XI + Appendices). Each agent writes its assigned chapters sequentially, reading Lattice source files before writing each chapter. Expect the full run to take 30–60 minutes depending on API throughput.

```bash
npx tsx generate.mts
```

### Generate a single part

Regenerate only one part without affecting others:

```bash
npx tsx generate.mts --part=1     # Part I: First Contact
npx tsx generate.mts --part=7     # Part VII: Iterators and Functional Style
npx tsx generate.mts --part=12    # Appendices
```

### Logs

Each agent writes a timestamped log to `logs/`:

```
logs/part-01.log
logs/part-02.log
...
logs/part-11.log
logs/part-appendices.log
```

These logs include agent progress, chapter completion status, and file sizes.

### How it works

1. `generate.mts` defines the complete book structure: 11 Parts, 42 chapters (38 + 4 appendices), with per-chapter section outlines, page targets, and source file references.
2. For each Part, it builds a detailed prompt including the writing guide, chapter specifications, cross-reference awareness of the full TOC, and a list of Lattice source files to read.
3. It calls the Claude Agent SDK's `query()` function with file system access (`Read`, `Glob`, `Grep`, `Write`, `Bash`) so agents can explore the Lattice codebase.
4. Each agent reads the specified source files (`.c`, `.h`, `.lat`), then writes LaTeX chapter files to `chapters/`.
5. All 12 agents run in parallel via `Promise.allSettled()`. Failed parts can be retried individually with `--part=N`.

### Customization

To add a chapter, modify the `BOOK_STRUCTURE` array in `generate.mts` and add a corresponding `\include{}` line in `book.tex`. Each chapter entry specifies:

- `number` — Chapter number
- `title` — Chapter title
- `filename` — Output filename (without `.tex`)
- `description` — What the chapter covers (passed to the agent)
- `pages` — Target page count
- `sections` — Section titles (outline for the agent)
- `sourceReferences` — Lattice source files the agent should read before writing

## Cover Art

The cover is generated entirely in TikZ (`cover.tex`). It renders a 3D isometric crystal lattice grid on a dark purple gradient background, with three depth layers of increasing brightness toward the core. Pre-rendered versions are available as `cover.png` (300 DPI) and `cover.jpg`.

## License

This repository uses a dual-license structure:

- **Book content** (LaTeX source, figures, cover art, bio, description) is licensed under the [Creative Commons Attribution 4.0 International License (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/). See [LICENSE-CONTENT](LICENSE-CONTENT).
- **Framework code** (`generate.mts`, `package.json`, `tsconfig.json`) is licensed under the [BSD 3-Clause License](LICENSE).

Copyright 2026 Alex Jokela.
