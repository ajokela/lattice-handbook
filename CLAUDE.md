# The Lattice Handbook — Writing Guide

## Book Identity

- **Title**: The Lattice Handbook
- **Subtitle**: A Comprehensive Guide to the Lattice Programming Language
- **Author**: Alex Jokela
- **Target Audience**: Intermediate programmers coming from Python, JavaScript, Rust, or Go
- **Length**: ~500 pages across 11 Parts, 38 Chapters, ~218 Sections
- **Version**: Covers Lattice v0.3.28

## Tone and Voice

**Conversational, precise, and playful.** Inspired by Why's (Poignant) Guide to Ruby and Eloquent Ruby. The reader should feel like they're learning from an enthusiastic friend who happens to know this language inside and out.

Guidelines:
- Use **"we"** with the reader: "Let's see what happens when we freeze this value."
- **Never say** "simple", "easy", "trivial", "obviously", or "just". These words make readers who are struggling feel bad. If something truly is straightforward, the code will speak for itself.
- Be **precise about technical details** — this is a handbook, not a blog post. Cite source files and implementation details when explaining internals.
- Use **chemistry and materials science metaphors** for the phase system. Values are materials that can be fluid (molten, flowing) or crystallized (solid, permanent). Freezing is literally crystallization. Thawing is melting. Arenas are regions of memory where crystals are stored.
- Keep **humor subtle** — a well-placed metaphor or an unexpected example is better than forced jokes.
- When introducing a concept, **show it in action before explaining theory**. Code first, explanation second.
- Use **short paragraphs**. Long walls of text lose readers. Break things up with code examples, notes, and tips.

## LaTeX Conventions

### Document Structure
- `\chapter{Title}` for chapters
- `\section{Title}` for major sections within a chapter
- `\subsection{Title}` for subsections
- `\subsubsection{Title}` sparingly, only when truly needed

### Labels and Cross-References
- Chapter labels: `\label{ch:slug}` (e.g., `\label{ch:hello-lattice}`)
- Section labels: `\label{sec:slug}` (e.g., `\label{sec:installing-lattice}`)
- Figure labels: `\label{fig:slug}`
- Table labels: `\label{tab:slug}`
- Use `\cref{}` for all cross-references (provides automatic "Chapter", "Section", etc.)

### Code Listings
- Use `lstlisting` environment with `language=Lattice` for all code blocks:
  ```latex
  \begin{lstlisting}[language=Lattice, caption={Description}]
  flux greeting = "Hello, Lattice!"
  print(greeting)
  \end{lstlisting}
  ```
- Use `\lstinline|code|` for inline code references
- Every code example **must be real, runnable Lattice code**. Do not write pseudocode.
- Read the relevant source files before writing examples to ensure accuracy.

### Lattice Language Reminders for Code Examples
- String interpolation uses `${expr}`, NOT `\(expr)` or `{expr}`
- Function parameters **require type annotations**: `fn foo(a: any, b: any)` not `fn foo(a, b)`
- Maps are created with `Map::new()` + index assignment, NOT `{}` literals
- Phase prefixes: `flux` (mutable), `fix` (immutable), `let` (inferred)
- Closures: `|x| x * 2` or `|self, args...| { body }`
- Struct methods use closure syntax: `method: |self| { ... }`
- `test` is a keyword — never use it as a variable name
- Buffers and structs are pass-by-value
- Triple-quoted strings: `"""..."""` with automatic dedenting

### Custom Environments
Use these `tcolorbox` environments throughout:

- **`notebox`**: Important information the reader should be aware of.
  ```latex
  \begin{notebox}{Title}
  Content here.
  \end{notebox}
  ```

- **`defnbox`**: Formal definitions of key terms or concepts.
  ```latex
  \begin{defnbox}{Phase}
  A \emph{phase} describes the mutability state of a value...
  \end{defnbox}
  ```

- **`tipbox`**: Practical tips, shortcuts, or best practices.
  ```latex
  \begin{tipbox}{Tip Title}
  Content here.
  \end{tipbox}
  ```

- **`warnbox`**: Warnings about common pitfalls or gotchas.
  ```latex
  \begin{warnbox}{Warning Title}
  Content here.
  \end{warnbox}
  ```

## Source Code Reference Mandate

Before writing each chapter, **you must read the listed source files**. Do not write about internals from memory — read the actual implementation. When explaining how something works under the hood:

1. Read the relevant `.c`, `.h`, or `.lat` file
2. Cite specific implementation details (function names, data structures, algorithms)
3. Reference file paths so readers can explore the source themselves: "You can see how the VM handles this in `src/stackvm.c`."

This ensures accuracy and gives readers confidence that the book reflects the real implementation.

## Chapter Structure

Each chapter should follow this pattern:

1. **Hook opening** (2-3 sentences): Draw the reader in. Pose a question, present a scenario, or set up a problem that this chapter will solve.

2. **Progressive examples**: Start with the basics and build complexity. Each example should build on the last. Don't dump the full API on the reader — reveal features as they become needed.

3. **Interspersed theory**: After showing how something works, explain why it works that way. Connect to the phase system, memory model, or language design philosophy where appropriate.

4. **Exercises** (3-5 per chapter): At the end of each chapter, include hands-on exercises that reinforce the key concepts. Range from straightforward to challenging. Do NOT include solutions — let readers figure it out.

5. **"What's Next" bridge** (1 paragraph): Connect this chapter to the next. Give the reader a reason to keep going.

## Per-Part Page Targets

Keep these in mind for pacing. These are targets, not hard limits.

| Part | Title | Pages |
|------|-------|-------|
| I | First Contact | 60 |
| II | The Working Programmer | 120 |
| III | The Phase System | 80 |
| IV | Structures and Abstractions | 70 |
| V | Concurrency | 50 |
| VI | The Standard Library | 60 |
| VII | Iterators and Functional Style | 25 |
| VIII | Modules, Packages, and Project Structure | 30 |
| IX | Tooling and Developer Experience | 40 |
| X | Under the Hood | 45 |
| XI | Real-World Lattice | 20 |
| Appendices | Reference | 15 |

## Indexing

Add `\index{}` entries for:
- Every new term when first defined
- Every built-in function when first used
- Every keyword when first explained
- Important concepts (phase system, arena, structured concurrency, etc.)

## General Writing Rules

- **One concept per section.** If a section is doing two things, split it.
- **Show output.** When a code example produces output, show what the reader should expect in a comment or after the listing.
- **Use realistic examples.** Instead of `foo`, `bar`, `baz`, use meaningful names: temperatures, user records, file paths, HTTP responses.
- **Acknowledge complexity.** When something is genuinely complex, say so. "This takes some getting used to" is better than pretending it's obvious.
- **Build a vocabulary.** Introduce Lattice-specific terms (phase, flux, fix, freeze, thaw, arena, crystal region) gradually and consistently.
