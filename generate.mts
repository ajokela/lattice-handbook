#!/usr/bin/env npx tsx
/**
 * generate.mts — Parallel book generation for The Lattice Handbook
 *
 * Launches 11 parallel Claude Agent SDK sessions (one per Part),
 * each writing its chapters as LaTeX files. Agents read actual Lattice
 * source code to produce accurate, runnable code examples.
 *
 * Usage:
 *   npx tsx generate.mts            # Generate all parts
 *   npx tsx generate.mts --part=7   # Generate only Part VII
 */

import { query } from "@anthropic-ai/claude-agent-sdk";
import * as fs from "fs";
import * as path from "path";

// ─── Types ────────────────────────────────────────────────────────────────

interface Section {
  title: string;
}

interface Chapter {
  number: number;
  title: string;
  filename: string;
  description: string;
  pages: number;
  sections: Section[];
  sourceReferences: string[];
}

interface Part {
  number: number;
  title: string;
  description: string;
  pageTarget: number;
  chapters: Chapter[];
}

interface PartResult {
  partNumber: number;
  title: string;
  status: "fulfilled" | "rejected";
  error?: string;
  durationMs: number;
}

// ─── Book Structure ──────────────────────────────────────────────────────
// NOTE: Source references like "src/eval.c" are Lattice project files that
// agents will READ for accuracy — they do not involve code evaluation.

const BOOK_STRUCTURE: Part[] = [
  {
    number: 1,
    title: "First Contact",
    description: "Introductory chapters covering installation, the REPL, basic values/types, and the first taste of the phase system.",
    pageTarget: 60,
    chapters: [
      {
        number: 1, title: "Hello, Lattice", filename: "ch01-hello-lattice",
        description: "What Lattice is and why it exists. Installation, first program, running files vs. REPL, and a taste of what makes the language different.",
        pages: 15,
        sections: [
          { title: "What Lattice is and why it exists" },
          { title: "Installing Lattice (macOS, Linux, Windows, WASM)" },
          { title: "Your first program: Hello, World!" },
          { title: "Running files vs. the REPL" },
          { title: "A taste of what makes Lattice different" },
        ],
        sourceReferences: ["README.md", "src/main.c", "examples/fibonacci.lat", "examples/phase_demo.lat"],
      },
      {
        number: 2, title: "The REPL Is Your Laboratory", filename: "ch02-repl",
        description: "Interactive exploration with the Lattice REPL — persistent state, tab completion, defining types interactively.",
        pages: 15,
        sections: [
          { title: "Launching the REPL, persistent state across lines" },
          { title: "Tab completion and discoverability" },
          { title: "Defining functions, structs, and enums interactively" },
          { title: "The => prefix: how the REPL talks back" },
          { title: "Tips and tricks for exploratory programming" },
        ],
        sourceReferences: ["src/main.c", "src/completion.c", "include/completion.h"],
      },
      {
        number: 3, title: "Values, Types, and the Shape of Things", filename: "ch03-values-types",
        description: "Core value types — integers, floats, booleans, strings, nil, unit. Type checking, string interpolation, number literals, operators, comments.",
        pages: 15,
        sections: [
          { title: "Integers, floats, booleans, strings, nil, unit" },
          { title: "Type checking with typeof()" },
          { title: "String interpolation, single-quote strings, triple-quote strings" },
          { title: "Number literals: hex, underscores, scientific notation" },
          { title: "Operators: arithmetic, comparison, logical, bitwise" },
          { title: "Comments: //, /* */, /// doc comments" },
        ],
        sourceReferences: ["include/value.h", "src/value.c", "src/lexer.c", "include/token.h"],
      },
      {
        number: 4, title: "Variables and the Idea of Phase", filename: "ch04-variables-phase",
        description: "Variable binding with let, flux, fix. First introduction to the phase philosophy — freeze/thaw, casual vs strict mode.",
        pages: 15,
        sections: [
          { title: "let, flux (~), and fix (*)" },
          { title: "Why mutability is a first-class concept" },
          { title: "Quick intro to freeze() and thaw()" },
          { title: "#mode casual vs. #mode strict" },
          { title: "First encounter with the phase philosophy" },
        ],
        sourceReferences: ["include/value.h", "src/phase_check.c", "include/phase.h", "src/stackcompiler.c"],
      },
    ],
  },
  {
    number: 2,
    title: "The Working Programmer",
    description: "Core language mechanics for everyday programming — control flow, functions, collections, strings, pattern matching, error handling.",
    pageTarget: 120,
    chapters: [
      {
        number: 5, title: "Control Flow", filename: "ch05-control-flow",
        description: "if/else as expressions, loops (while, loop, for), break/continue/return, ranges, nil-coalescing, pipe operator.",
        pages: 20,
        sections: [
          { title: "if/else as expressions (they return values!)" },
          { title: "while, loop, for x in collection" },
          { title: "break, continue, return" },
          { title: "Ranges: 1..10, 1..=10" },
          { title: "The nil-coalescing operator ??" },
          { title: "The pipe operator |>" },
        ],
        sourceReferences: ["src/stackcompiler.c", "include/stackopcode.h"],
      },
      {
        number: 6, title: "Functions and Closures", filename: "ch06-functions-closures",
        description: "Function definitions, type annotations, defaults, variadics, closures, upvalue capture, higher-order functions, contracts.",
        pages: 25,
        sections: [
          { title: "Defining functions with fn" },
          { title: "Type annotations on parameters and return types" },
          { title: "Default parameter values and variadic parameters" },
          { title: "Closures: |x| x * 2" },
          { title: "Closures capture their environment (upvalues)" },
          { title: "Higher-order functions: passing and returning functions" },
          { title: "require and ensure — contracts on your functions" },
        ],
        sourceReferences: ["src/stackcompiler.c", "src/stackvm.c", "include/value.h"],
      },
      {
        number: 7, title: "Arrays, Maps, Sets, and Friends", filename: "ch07-collections",
        description: "Collection types in depth — arrays with closure-based and non-closure methods, maps, sets, tuples, spread operator.",
        pages: 25,
        sections: [
          { title: "Arrays: creation, indexing, .push(), slicing" },
          { title: "Closure-based methods: map, filter, reduce, sort_by, group_by" },
          { title: "Non-closure methods: contains, reverse, join, unique, zip, flatten" },
          { title: "The spread operator ..." },
          { title: "Maps: Map::new(), .get(), .has(), .keys(), .merge()" },
          { title: "Sets: union, intersection, difference, is_subset" },
          { title: "Tuples: fixed-length heterogeneous sequences" },
          { title: "Choosing the right collection" },
        ],
        sourceReferences: ["src/builtin_methods.c", "include/builtin_methods.h", "include/value.h", "src/array_ops.c"],
      },
      {
        number: 8, title: "Strings in Depth", filename: "ch08-strings",
        description: "String interpolation, escaping, methods, case transformations, Unicode, regex.",
        pages: 15,
        sections: [
          { title: "Interpolation, escaping, raw strings" },
          { title: "Core string methods: split, trim, replace, contains" },
          { title: "Case transformations: snake_case, camelCase, kebab-case, title_case" },
          { title: "chars(), bytes(), len(), substring(), index_of()" },
          { title: "Working with Unicode via ord() and chr()" },
          { title: "Regex: regex_match, regex_find_all, regex_replace" },
        ],
        sourceReferences: ["src/string_ops.c", "include/string_ops.h", "src/builtin_methods.c", "src/regex_ops.c"],
      },
      {
        number: 9, title: "Pattern Matching", filename: "ch09-pattern-matching",
        description: "The match expression — literal, wildcard, binding, range, array, struct, and enum variant patterns. Guards and exhaustiveness checking.",
        pages: 20,
        sections: [
          { title: "The match expression" },
          { title: "Literal patterns, wildcard _, binding patterns" },
          { title: "Range patterns and array destructuring" },
          { title: "Struct and enum variant destructuring" },
          { title: "Guards: pattern if condition =>" },
          { title: "Exhaustiveness checking — the compiler has your back" },
          { title: "Match as the heart of Lattice's control flow" },
        ],
        sourceReferences: ["src/match_check.c", "include/match_check.h", "src/stackcompiler.c", "src/stackvm.c"],
      },
      {
        number: 10, title: "Error Handling", filename: "ch10-error-handling",
        description: "Error values, try/catch, the ? operator, panic, defer, contracts revisited.",
        pages: 15,
        sections: [
          { title: "Error values: error(), is_error()" },
          { title: "try/catch" },
          { title: "The try-propagate operator ?" },
          { title: "panic() — when all else fails" },
          { title: "defer — cleanup that always runs" },
          { title: "Contracts revisited: require/ensure" },
          { title: "Designing functions that fail gracefully" },
        ],
        sourceReferences: ["src/stackvm.c", "src/stackcompiler.c", "lib/fn.lat"],
      },
    ],
  },
  {
    number: 3,
    title: "The Phase System",
    description: "Deep dive into Lattice's defining feature — the phase system, memory arenas, alloys, reactive bonds, and strict mode.",
    pageTarget: 80,
    chapters: [
      {
        number: 11, title: "Phases Explained", filename: "ch11-phases-explained",
        description: "The full philosophy — flux/fix/let, freeze/thaw/clone in depth, when and why to freeze, phase errors.",
        pages: 25,
        sections: [
          { title: "The philosophy: mutability as a material property" },
          { title: "flux (fluid) — mutable, alive, in motion" },
          { title: "fix (crystal) — immutable, hardened, permanent" },
          { title: "let — phase inference" },
          { title: "freeze(), thaw(), clone() in depth" },
          { title: "When and why to freeze values" },
          { title: "Phase errors and what they tell you" },
        ],
        sourceReferences: ["include/value.h", "src/value.c", "src/phase_check.c", "include/phase.h", "examples/phase_demo.lat"],
      },
      {
        number: 12, title: "Memory and Arenas", filename: "ch12-memory-arenas",
        description: "How the phase system maps to memory — FluidHeap, CrystalRegion, BumpArena, string interning, GC modes.",
        pages: 20,
        sections: [
          { title: "The FluidHeap: mark-sweep GC for mutable values" },
          { title: "The CrystalRegion: arena-backed storage for immutable values" },
          { title: "The ephemeral BumpArena: short-lived temporaries" },
          { title: "How freeze moves a value from heap to arena" },
          { title: "String interning and why it matters" },
          { title: "GC flags: --gc, --gc-stress, --gc-incremental" },
        ],
        sourceReferences: ["include/memory.h", "src/memory.c", "src/gc.c", "include/gc.h", "src/intern.c", "include/intern.h"],
      },
      {
        number: 13, title: "Alloys and Reactive Bonds", filename: "ch13-alloys-bonds",
        description: "Per-field phase declarations (alloys), reactive bonds between values, pressure and seeds.",
        pages: 20,
        sections: [
          { title: "Alloy structs: per-field phase declarations" },
          { title: "Designing data with mixed mutability" },
          { title: "Reactive bonds: bond(), unbond(), react(), unreact()" },
          { title: "Bond strategies: mirror, inverse, gate" },
          { title: "Pressure: pressurize(), depressurize(), pressure_of()" },
          { title: "Seeds: seed(), unseed()" },
          { title: "Building reactive data flows" },
        ],
        sourceReferences: ["include/value.h", "src/value.c", "src/builtins.c", "src/phase_check.c"],
      },
      {
        number: 14, title: "Strict Mode and Static Phase Checking", filename: "ch14-strict-mode",
        description: "The strict mode static phase checker — annotations, constraints, phase-dependent overloading.",
        pages: 15,
        sections: [
          { title: "#mode strict — what changes" },
          { title: "The static phase checker" },
          { title: "Phase annotations: @fluid, @crystal" },
          { title: "Phase constraints: (~|*), (flux|fix)" },
          { title: "Phase-dependent function overloading" },
          { title: "Designing APIs that are phase-aware" },
        ],
        sourceReferences: ["src/phase_check.c", "include/phase_check.h", "include/phase.h", "src/stackcompiler.c"],
      },
    ],
  },
  {
    number: 4,
    title: "Structures and Abstractions",
    description: "The type abstraction system — structs, enums, traits, impl blocks, and generics.",
    pageTarget: 70,
    chapters: [
      {
        number: 15, title: "Structs", filename: "ch15-structs",
        description: "Defining structs, methods, callable fields, custom equality, reflection, pass-by-value semantics.",
        pages: 20,
        sections: [
          { title: "Defining and instantiating structs" },
          { title: "Field access and mutation" },
          { title: "Methods via closures: |self| { ... }" },
          { title: "Callable struct fields" },
          { title: "Custom equality with eq" },
          { title: "Struct reflection: struct_name(), struct_fields(), struct_to_map()" },
          { title: "Pass-by-value semantics and what that means" },
        ],
        sourceReferences: ["src/stackcompiler.c", "src/parser.c", "include/value.h"],
      },
      {
        number: 16, title: "Enums", filename: "ch16-enums",
        description: "Enums with and without payloads, variant construction, matching, state machines, Option/Result patterns.",
        pages: 20,
        sections: [
          { title: "Defining enums with and without payloads" },
          { title: "Constructing variants: Shape::Circle(3.14)" },
          { title: "Matching on enums (deeper dive)" },
          { title: "Using enums for state machines" },
          { title: "Option-like and Result-like patterns" },
          { title: "Enum exhaustiveness guarantees" },
        ],
        sourceReferences: ["src/stackcompiler.c", "src/parser.c", "src/match_check.c", "examples/state_machine.lat"],
      },
      {
        number: 17, title: "Traits and Impl Blocks", filename: "ch17-traits",
        description: "Declaring traits, implementing them for structs, multiple impl blocks, trait-driven polymorphism.",
        pages: 15,
        sections: [
          { title: "Declaring traits" },
          { title: "Implementing traits for structs" },
          { title: "Multiple impl blocks per struct" },
          { title: "Designing with interfaces" },
          { title: "Trait-driven polymorphism" },
        ],
        sourceReferences: ["src/stackcompiler.c", "src/parser.c"],
      },
      {
        number: 18, title: "Generics", filename: "ch18-generics",
        description: "Generic functions, structs, enums, and trait implementations. Type expressions and practical patterns.",
        pages: 15,
        sections: [
          { title: "Generic functions: fn identity<T>(x: T) -> T" },
          { title: "Generic structs: struct Pair<A, B>" },
          { title: "Generic enums and trait implementations" },
          { title: "Type expressions: Map<String, Int>, fn(Int) -> Bool" },
          { title: "Practical patterns with generics" },
        ],
        sourceReferences: ["src/parser.c", "src/stackcompiler.c"],
      },
    ],
  },
  {
    number: 5,
    title: "Concurrency",
    description: "Structured concurrency, channels, select, and concurrency patterns.",
    pageTarget: 50,
    chapters: [
      {
        number: 19, title: "Structured Concurrency with scope and spawn", filename: "ch19-structured-concurrency",
        description: "The scope/spawn model, joining semantics, data sharing, sublimate, practical examples.",
        pages: 20,
        sections: [
          { title: "The scope { spawn { ... } } model" },
          { title: "Why structured concurrency matters" },
          { title: "Joining semantics — no orphaned tasks" },
          { title: "Sharing data between spawned tasks" },
          { title: "The sublimate phase for thread-safe values" },
          { title: "Practical examples: parallel downloads, fan-out/fan-in" },
        ],
        sourceReferences: ["src/channel.c", "include/channel.h", "src/stackvm.c", "src/stackcompiler.c"],
      },
      {
        number: 20, title: "Channels and select", filename: "ch20-channels-select",
        description: "Channel creation, send/recv, producer-consumer, select with default/timeout, pipelines, async iterators.",
        pages: 20,
        sections: [
          { title: "Channel::new(), send(), recv(), close()" },
          { title: "Producer-consumer patterns" },
          { title: "select with multiple channels" },
          { title: "default and timeout arms" },
          { title: "Building pipelines with channels" },
          { title: "Async iterators: async_iter, async_map, async_filter" },
        ],
        sourceReferences: ["src/channel.c", "include/channel.h", "src/stackvm.c", "src/stackcompiler.c"],
      },
      {
        number: 21, title: "Concurrency Patterns and Pitfalls", filename: "ch21-concurrency-patterns",
        description: "Ref for shared state, channels vs Ref, deadlock avoidance, worker pools, testing concurrent code.",
        pages: 10,
        sections: [
          { title: "Ref for shared mutable state: Ref::new(), .get(), .set()" },
          { title: "When to use channels vs. Ref" },
          { title: "Deadlock avoidance" },
          { title: "Common patterns: worker pools, broadcast, request-reply" },
          { title: "Testing concurrent code" },
        ],
        sourceReferences: ["src/channel.c", "include/channel.h", "src/stackvm.c", "src/builtins.c"],
      },
    ],
  },
  {
    number: 6,
    title: "The Standard Library",
    description: "Tour of the standard library — filesystem, data formats, networking, time/crypto/os/math.",
    pageTarget: 60,
    chapters: [
      {
        number: 22, title: "Files, Paths, and the Filesystem", filename: "ch22-filesystem",
        description: "File I/O, the fs module, the path module, temp files, working with Buffers for binary data.",
        pages: 15,
        sections: [
          { title: "read_file, write_file, append_file" },
          { title: "The fs module: file_exists, list_dir, mkdir, glob, stat" },
          { title: "The path module: join, dirname, basename, extension" },
          { title: "Temporary files and directories" },
          { title: "Working with Buffers: reading and writing binary data" },
        ],
        sourceReferences: ["src/fs_ops.c", "include/fs_ops.h", "src/path_ops.c", "include/path_ops.h"],
      },
      {
        number: 23, title: "JSON, TOML, YAML, and CSV", filename: "ch23-data-formats",
        description: "Parsing and stringifying data formats, round-tripping, building configuration-driven programs.",
        pages: 15,
        sections: [
          { title: "json_parse / json_stringify" },
          { title: "toml_parse / toml_stringify" },
          { title: "yaml_parse / yaml_stringify" },
          { title: "csv_parse / csv_stringify" },
          { title: "Round-tripping data between formats" },
          { title: "Building configuration-driven programs" },
        ],
        sourceReferences: ["src/json.c", "include/json.h", "src/toml_ops.c", "src/yaml_ops.c"],
      },
      {
        number: 24, title: "Networking and HTTP", filename: "ch24-networking",
        description: "HTTP module, TCP/TLS networking, building a simple HTTP server, URL encoding.",
        pages: 15,
        sections: [
          { title: "The http module: http_get, http_post, http_request" },
          { title: "The net module: tcp_listen, tcp_connect, tcp_read, tcp_write" },
          { title: "TLS: tls_connect, tls_read, tls_write" },
          { title: "Building a simple HTTP server with the http_server lib" },
          { title: "URL encoding/decoding" },
        ],
        sourceReferences: ["src/http.c", "include/http.h", "src/net.c", "include/net.h", "src/tls.c", "include/tls.h", "lib/http_server.lat", "examples/http_server.lat"],
      },
      {
        number: 25, title: "Time, Crypto, OS, and Everything Else", filename: "ch25-time-crypto-os",
        description: "Time/datetime, crypto, uuid, os/process, math, regex modules.",
        pages: 15,
        sections: [
          { title: "The time module: timestamps, formatting, parsing, date arithmetic" },
          { title: "The crypto module: sha256, hmac_sha256, base64, random_bytes" },
          { title: "uuid()" },
          { title: "The os module: env(), args(), platform()" },
          { title: "The math module: trig, logarithms, random(), clamp(), lerp()" },
          { title: "The regex module" },
        ],
        sourceReferences: ["src/time_ops.c", "src/datetime_ops.c", "src/crypto_ops.c", "src/math_ops.c", "src/process_ops.c", "src/env_ops.c", "src/regex_ops.c"],
      },
    ],
  },
  {
    number: 7,
    title: "Iterators and Functional Style",
    description: "Lazy iterators and functional programming patterns.",
    pageTarget: 25,
    chapters: [
      {
        number: 26, title: "Lazy Iterators", filename: "ch26-lazy-iterators",
        description: "The iterator protocol, sources, transformers, consumers, building custom iterators.",
        pages: 15,
        sections: [
          { title: "The iterator protocol: iter(), iter_next()" },
          { title: "Sources: iter_from_array, iter_from_range, iter_repeat" },
          { title: "Transformers: iter_map, iter_filter, iter_take, iter_skip, iter_zip" },
          { title: "Consumers: iter_collect, iter_reduce, iter_any, iter_all" },
          { title: "Building your own iterators" },
          { title: "Why laziness matters: memory and performance" },
        ],
        sourceReferences: ["src/iterator.c", "include/iterator.h", "lib/fn.lat"],
      },
      {
        number: 27, title: "Functional Programming in Lattice", filename: "ch27-functional-programming",
        description: "pipe, compose, identity, the fn standard library, currying patterns.",
        pages: 10,
        sections: [
          { title: "pipe(), compose(), identity()" },
          { title: "The fn standard library module" },
          { title: "Currying and partial application patterns" },
          { title: "When functional style shines in Lattice" },
        ],
        sourceReferences: ["lib/fn.lat", "src/iterator.c", "src/builtins.c"],
      },
    ],
  },
  {
    number: 8,
    title: "Modules, Packages, and Project Structure",
    description: "Module system and package management.",
    pageTarget: 30,
    chapters: [
      {
        number: 28, title: "Modules and Imports", filename: "ch28-modules-imports",
        description: "import, from...import, export, module resolution, organizing multi-file projects.",
        pages: 15,
        sections: [
          { title: "import, import...as, from...import" },
          { title: "Built-in modules vs. file modules" },
          { title: "The export keyword" },
          { title: "Module resolution order" },
          { title: "Organizing a multi-file project" },
        ],
        sourceReferences: ["src/stackcompiler.c", "src/parser.c"],
      },
      {
        number: 29, title: "The Package Manager", filename: "ch29-package-manager",
        description: "clat init, lattice.toml, adding/removing deps, lockfile, semver, lat_modules/.",
        pages: 15,
        sections: [
          { title: "clat init — starting a new project" },
          { title: "lattice.toml — the manifest file" },
          { title: "clat add, clat remove, clat install" },
          { title: "lattice.lock and reproducible builds" },
          { title: "Semver and dependency resolution" },
        ],
        sourceReferences: ["src/package.c", "include/package.h"],
      },
    ],
  },
  {
    number: 9,
    title: "Tooling and Developer Experience",
    description: "Formatter, testing, debugging, and editor integration.",
    pageTarget: 40,
    chapters: [
      {
        number: 30, title: "The Formatter and Doc Generator", filename: "ch30-formatter-docgen",
        description: "clat fmt, --width, doc comments, clat doc, output formats.",
        pages: 10,
        sections: [
          { title: "clat fmt — formatting your code" },
          { title: "--width for configurable line width" },
          { title: "/// doc comments" },
          { title: "clat doc — generating documentation" },
          { title: "Output formats: Markdown, JSON, HTML" },
        ],
        sourceReferences: ["src/formatter.c", "include/formatter.h", "src/doc_gen.c", "include/doc_gen.h"],
      },
      {
        number: 31, title: "Testing", filename: "ch31-testing",
        description: "Inline test blocks, clat test, assert functions, the test standard library, testing strategies.",
        pages: 15,
        sections: [
          { title: 'test "name" { body } — inline tests' },
          { title: "clat test — running the test suite" },
          { title: "Assert functions: assert, assert_eq, assert_type, assert_error" },
          { title: "The test standard library module" },
          { title: "Testing strategies for Lattice programs" },
        ],
        sourceReferences: ["lib/test.lat", "src/stackcompiler.c"],
      },
      {
        number: 32, title: "Debugging", filename: "ch32-debugging",
        description: "CLI debugger, breakpoints, stepping, watch expressions, DAP/VS Code, value history and time travel.",
        pages: 15,
        sections: [
          { title: "--debug flag and the CLI debugger" },
          { title: "Breakpoints: line, function, conditional" },
          { title: "Step-into, step-over, step-out" },
          { title: "Watch expressions and breakpoint()" },
          { title: "DAP and VS Code integration" },
          { title: "Value history: track(), history(), rewind()" },
        ],
        sourceReferences: ["src/debugger.c", "include/debugger.h", "src/dap.c", "include/dap.h", "examples/debug_demo.lat"],
      },
    ],
  },
  {
    number: 10,
    title: "Under the Hood",
    description: "Internals — the three execution backends, bytecode serialization, native extensions, metaprogramming.",
    pageTarget: 45,
    chapters: [
      {
        number: 33, title: "The Three Backends", filename: "ch33-three-backends",
        description: "Tree-walk interpreter, stack-based bytecode VM, register-based VM — how they work, when to use each.",
        pages: 15,
        sections: [
          { title: "Tree-walk interpreter: how it works, when to use it" },
          { title: "Stack-based bytecode VM: compilation, opcodes, the value stack" },
          { title: "Register-based VM: instruction encoding, register windows, inline caches" },
          { title: "Choosing a backend: --tree-walk, --regvm, or the default" },
          { title: "Performance characteristics" },
        ],
        sourceReferences: ["src/stackvm.c", "include/stackvm.h", "src/regvm.c", "include/regvm.h", "include/stackopcode.h", "include/regopcode.h", "src/stackcompiler.c", "src/regcompiler.c"],
      },
      {
        number: 34, title: "Bytecode Serialization", filename: "ch34-bytecode-serialization",
        description: ".latc and .rlat file formats, pre-compiling, the self-hosted compiler, bootstrapping.",
        pages: 10,
        sections: [
          { title: ".latc (stack VM) and .rlat (register VM) file formats" },
          { title: "Pre-compiling for faster startup" },
          { title: "The self-hosted compiler: compiler/latc.lat" },
          { title: "Bootstrapping: a compiler written in the language it compiles" },
        ],
        sourceReferences: ["src/latc.c", "include/latc.h", "src/chunk.c", "include/chunk.h", "compiler/latc.lat"],
      },
      {
        number: 35, title: "Native Extensions", filename: "ch35-native-extensions",
        description: "The extension API, building .dylib/.so extensions, available extensions.",
        pages: 10,
        sections: [
          { title: "The extension API: lat_ext_init, lat_ext_register" },
          { title: "Value constructors and accessors" },
          { title: "Building a .dylib/.so extension" },
          { title: "Available extensions: ffi, image, pg, redis, sqlite, websocket" },
          { title: "Extension search paths" },
        ],
        sourceReferences: ["src/ext.c", "include/ext.h", "include/lattice_ext.h"],
      },
      {
        number: 36, title: "Metaprogramming and Reflection", filename: "ch36-metaprogramming",
        description: "Runtime code introspection, tokenize(), struct reflection, format(), and dynamic features.",
        pages: 10,
        sections: [
          { title: "Runtime code introspection and dynamic features" },
          { title: "tokenize() — inspecting tokens" },
          { title: "Struct reflection functions" },
          { title: "format() — printf-style string building" },
          { title: "The power and danger of runtime features" },
        ],
        sourceReferences: ["src/builtins.c", "include/builtins.h", "src/format_ops.c"],
      },
    ],
  },
  {
    number: 11,
    title: "Real-World Lattice",
    description: "Capstone projects — building a complete CLI tool and a web service from scratch.",
    pageTarget: 20,
    chapters: [
      {
        number: 37, title: "Building a CLI Tool", filename: "ch37-building-cli-tool",
        description: "A complete command-line application using cli, dotenv, and log libraries.",
        pages: 10,
        sections: [
          { title: "The cli library for argument parsing" },
          { title: "The dotenv library for configuration" },
          { title: "The log library for structured logging" },
          { title: "Putting it all together: a complete CLI application" },
        ],
        sourceReferences: ["lib/cli.lat", "lib/dotenv.lat", "lib/log.lat"],
      },
      {
        number: 38, title: "Building a Web Service", filename: "ch38-building-web-service",
        description: "A complete web application using http_server, template, orm, and JSON APIs.",
        pages: 10,
        sections: [
          { title: "The http_server library" },
          { title: "The template library for HTML templating" },
          { title: "The orm library for SQLite persistence" },
          { title: "JSON APIs with json_parse/json_stringify" },
          { title: "A complete web application from scratch" },
        ],
        sourceReferences: ["lib/http_server.lat", "lib/template.lat", "lib/orm.lat", "src/json.c", "examples/http_server.lat", "examples/orm_demo.lat"],
      },
    ],
  },
];

// ─── Appendix structure (Part 12 = Appendices) ──────────────────────────

const APPENDICES: Chapter[] = [
  {
    number: 39, title: "Language Grammar Reference", filename: "appA-grammar-reference",
    description: "Complete EBNF-style grammar reference for the Lattice language.",
    pages: 5,
    sections: [{ title: "Complete grammar in EBNF notation" }],
    sourceReferences: ["src/parser.c", "include/parser.h", "src/lexer.c", "include/token.h"],
  },
  {
    number: 40, title: "Opcode Reference (Stack VM and Register VM)", filename: "appB-opcode-reference",
    description: "Complete listing of all bytecode opcodes for both VM backends.",
    pages: 4,
    sections: [{ title: "Stack VM opcodes" }, { title: "Register VM opcodes" }],
    sourceReferences: ["include/stackopcode.h", "src/stackopcode.c", "include/regopcode.h", "src/regopcode.c"],
  },
  {
    number: 41, title: "Phase Quick Reference and Cheat Sheet", filename: "appC-phase-cheatsheet",
    description: "One-page cheat sheet for the phase system: keywords, transitions, rules.",
    pages: 3,
    sections: [{ title: "Phase keywords and transitions at a glance" }],
    sourceReferences: ["include/value.h", "include/phase.h", "src/phase_check.c"],
  },
  {
    number: 42, title: "Built-in Functions Quick Reference", filename: "appD-builtin-reference",
    description: "Alphabetical listing of all built-in functions with signatures and brief descriptions.",
    pages: 3,
    sections: [{ title: "All built-in functions, alphabetically" }],
    sourceReferences: ["src/builtins.c", "include/builtins.h", "src/builtin_methods.c", "include/builtin_methods.h"],
  },
];

// ─── Prompt Builder ──────────────────────────────────────────────────────

function buildPrompt(part: Part, allParts: Part[]): string {
  const chapterInstructions = part.chapters.map((ch) => {
    const sectionList = ch.sections.map((s, i) => `    ${i + 1}. ${s.title}`).join("\n");
    const sourceList = ch.sourceReferences.map((s) => `    - ${s}`).join("\n");
    return `
### Chapter ${ch.number}: ${ch.title}
**Filename**: \`book/chapters/${ch.filename}.tex\`
**Target**: ~${ch.pages} pages
**Description**: ${ch.description}

**Sections**:
${sectionList}

**Source files to read before writing this chapter**:
${sourceList}
`;
  }).join("\n");

  const tocOtherParts = allParts
    .filter((p) => p.number !== part.number)
    .map((p) => {
      const chList = p.chapters.map((ch) => `    Ch ${ch.number}: ${ch.title}`).join("\n");
      return `  Part ${toRoman(p.number)}: ${p.title}\n${chList}`;
    })
    .join("\n\n");

  return `You are writing Part ${toRoman(part.number)}: "${part.title}" of The Lattice Handbook, a comprehensive book about the Lattice programming language.

## Your Mission

Write ${part.chapters.length} chapter(s) as LaTeX files. Each chapter should be a complete, well-written, book-quality chapter suitable for a published technical book. Target approximately ${part.pageTarget} total pages for this Part.

## Before You Begin

1. Read the style guide at \`book/CLAUDE.md\` for tone, LaTeX conventions, and code example rules.
2. Read the LaTeX preamble at \`book/preamble.tex\` to understand available environments (notebox, defnbox, tipbox, warnbox) and the Lattice listings language definition.

## Your Assigned Chapters
${chapterInstructions}

## Writing Process

For EACH chapter, follow this sequence:
1. **Read the source files** listed for that chapter. Use Glob and Grep to explore further if needed.
2. **Write the LaTeX file** to \`book/chapters/<filename>.tex\`. Each file should contain a \\chapter{} at the top followed by \\section{}, \\subsection{} etc.
3. **Include real, runnable Lattice code examples** in every section. Use \\begin{lstlisting}[language=Lattice] for code blocks.
4. **Use the tcolorbox environments** (notebox, defnbox, tipbox, warnbox) to call out important points.
5. **Add \\label{} and \\index{}** entries for cross-referencing and the index.
6. **End each chapter** with exercises and a "What's Next" bridge paragraph.

Write chapters sequentially (one at a time) so earlier chapters can inform later ones.

## Important LaTeX Reminders

- Do NOT use \\begin{document} or \\end{document} — these files are \\include'd by book.tex
- Start each file with \\chapter{Title}\\label{ch:slug}
- Use \\cref{} for cross-references to other chapters/sections
- Use \\lstinline|code| for inline code
- String interpolation in Lattice uses \$\\{expr\\} — escape the dollar sign and braces in LaTeX as needed

## Full Book Table of Contents (for cross-reference awareness)

Your Part is ${toRoman(part.number)}: "${part.title}". Here are the other Parts and their chapters so you know what is covered elsewhere:

${tocOtherParts}

${APPENDICES.length > 0 ? `  Appendices:\n${APPENDICES.map((a) => `    ${a.filename}: ${a.title}`).join("\n")}` : ""}

## Quality Standards

- Every code example must be syntactically valid Lattice
- Use realistic variable names and scenarios (not foo/bar/baz)
- Show expected output in comments when relevant
- Explain the "why" not just the "what"
- Progressive complexity: start each chapter accessible, end it advanced
- Target the specified page count (plus or minus 20 percent is fine)

Now begin. Read book/CLAUDE.md first, then start with Chapter ${part.chapters[0].number}.`;
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function toRoman(n: number): string {
  const romanNumerals: [number, string][] = [
    [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
  ];
  let result = "";
  let remaining = n;
  for (const [value, numeral] of romanNumerals) {
    while (remaining >= value) {
      result += numeral;
      remaining -= value;
    }
  }
  return result;
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

// ─── Agent Runner ────────────────────────────────────────────────────────

async function runPartAgent(part: Part): Promise<PartResult> {
  const startTime = Date.now();
  const logFile = path.resolve("logs", `part-${String(part.number).padStart(2, "0")}.log`);
  const logStream = fs.createWriteStream(logFile, { flags: "w" });

  const log = (msg: string) => {
    const line = `[${new Date().toISOString()}] ${msg}\n`;
    logStream.write(line);
    process.stdout.write(`  Part ${toRoman(part.number)}: ${msg}\n`);
  };

  log(`Starting — ${part.chapters.length} chapters, ~${part.pageTarget} pages`);

  const maxTurns = 30 + part.chapters.length * 8;
  const prompt = buildPrompt(part, BOOK_STRUCTURE);

  try {
    for await (const message of query({
      prompt,
      options: {
        cwd: "/Users/alexjokela/projects/lattice",
        allowedTools: ["Read", "Glob", "Grep", "Write", "Bash"],
        permissionMode: "bypassPermissions",
        maxTurns,
        model: "claude-opus-4-6",
      },
    })) {
      if ("result" in message) {
        log("Agent completed");
      } else if ("subtype" in message && message.subtype === "init") {
        log("Agent session initialized");
      }
    }

    const durationMs = Date.now() - startTime;
    log(`Finished in ${formatDuration(durationMs)}`);

    for (const ch of part.chapters) {
      const chapterPath = path.resolve("chapters", `${ch.filename}.tex`);
      if (fs.existsSync(chapterPath)) {
        const stats = fs.statSync(chapterPath);
        log(`  OK ${ch.filename}.tex (${Math.round(stats.size / 1024)}KB)`);
      } else {
        log(`  MISSING ${ch.filename}.tex`);
      }
    }

    logStream.end();
    return { partNumber: part.number, title: part.title, status: "fulfilled", durationMs };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMsg = error instanceof Error ? error.message : String(error);
    log(`FAILED after ${formatDuration(durationMs)}: ${errorMsg}`);
    logStream.end();
    return { partNumber: part.number, title: part.title, status: "rejected", error: errorMsg, durationMs };
  }
}

// ─── Appendix Runner ─────────────────────────────────────────────────────

async function runAppendixAgent(): Promise<PartResult> {
  const startTime = Date.now();
  const logFile = path.resolve("logs", "part-appendices.log");
  const logStream = fs.createWriteStream(logFile, { flags: "w" });

  const log = (msg: string) => {
    const line = `[${new Date().toISOString()}] ${msg}\n`;
    logStream.write(line);
    process.stdout.write(`  Appendices: ${msg}\n`);
  };

  log(`Starting — ${APPENDICES.length} appendices`);

  const appendixInstructions = APPENDICES.map((app) => {
    const sourceList = app.sourceReferences.map((s) => `    - ${s}`).join("\n");
    return `
### ${app.title}
**Filename**: \`book/chapters/${app.filename}.tex\`
**Target**: ~${app.pages} pages
**Description**: ${app.description}

**Source files to read**:
${sourceList}
`;
  }).join("\n");

  const prompt = `You are writing the Appendices for The Lattice Handbook.

## Your Mission

Write ${APPENDICES.length} appendix files as LaTeX. These are reference material — dense, well-organized, and complete.

## Before You Begin

1. Read the style guide at \`book/CLAUDE.md\`.
2. Read the preamble at \`book/preamble.tex\`.

## Appendices to Write
${appendixInstructions}

## Writing Process

For each appendix:
1. Read the listed source files thoroughly.
2. Write the LaTeX file to \`book/chapters/<filename>.tex\`.
3. Use \\chapter{} at the top. Use tables (booktabs), listings, and compact formatting.
4. These are REFERENCE appendices — prioritize completeness and scannability.

## Important

- Do NOT use \\begin{document} or \\end{document}
- Start each file with \\chapter{Title}\\label{ch:slug}
- Use \\booktabs tables for opcode listings
- Be thorough — list ALL opcodes, ALL built-in functions, the complete grammar

Now begin. Read book/CLAUDE.md first, then start with Appendix A.`;

  const maxTurns = 30 + APPENDICES.length * 8;

  try {
    for await (const message of query({
      prompt,
      options: {
        cwd: "/Users/alexjokela/projects/lattice",
        allowedTools: ["Read", "Glob", "Grep", "Write", "Bash"],
        permissionMode: "bypassPermissions",
        maxTurns,
        model: "claude-opus-4-6",
      },
    })) {
      if ("result" in message) {
        log("Agent completed");
      } else if ("subtype" in message && message.subtype === "init") {
        log("Agent session initialized");
      }
    }

    const durationMs = Date.now() - startTime;
    log(`Finished in ${formatDuration(durationMs)}`);

    for (const app of APPENDICES) {
      const appPath = path.resolve("chapters", `${app.filename}.tex`);
      if (fs.existsSync(appPath)) {
        const stats = fs.statSync(appPath);
        log(`  OK ${app.filename}.tex (${Math.round(stats.size / 1024)}KB)`);
      } else {
        log(`  MISSING ${app.filename}.tex`);
      }
    }

    logStream.end();
    return { partNumber: 12, title: "Appendices", status: "fulfilled", durationMs };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMsg = error instanceof Error ? error.message : String(error);
    log(`FAILED after ${formatDuration(durationMs)}: ${errorMsg}`);
    logStream.end();
    return { partNumber: 12, title: "Appendices", status: "rejected", error: errorMsg, durationMs };
  }
}

// ─── Main ────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const partFlag = args.find((a) => a.startsWith("--part="));
  const partNumber = partFlag ? parseInt(partFlag.split("=")[1], 10) : null;

  console.log("================================================================");
  console.log("          The Lattice Handbook — Book Generator");
  console.log("================================================================");
  console.log();

  // Ensure output directories exist
  for (const dir of ["chapters", "logs", "figures"]) {
    fs.mkdirSync(path.resolve(dir), { recursive: true });
  }

  const startTime = Date.now();

  if (partNumber !== null) {
    if (partNumber === 12) {
      console.log(`Running appendices only...\n`);
      const result = await runAppendixAgent();
      printResults([result], startTime);
      return;
    }

    const part = BOOK_STRUCTURE.find((p) => p.number === partNumber);
    if (!part) {
      console.error(`Error: Part ${partNumber} not found. Valid: 1-11, or 12 for appendices.`);
      process.exit(1);
    }

    console.log(`Running Part ${toRoman(part.number)}: ${part.title} only...\n`);
    const result = await runPartAgent(part);
    printResults([result], startTime);
  } else {
    const totalPages = BOOK_STRUCTURE.reduce((sum, p) => sum + p.pageTarget, 0) + 15;
    const totalChapters = BOOK_STRUCTURE.reduce((sum, p) => sum + p.chapters.length, 0) + APPENDICES.length;

    console.log(`Launching ${BOOK_STRUCTURE.length + 1} parallel agents...`);
    console.log(`  ${totalChapters} chapters, ~${totalPages} target pages\n`);

    const promises = [
      ...BOOK_STRUCTURE.map((part) => runPartAgent(part)),
      runAppendixAgent(),
    ];

    const settled = await Promise.allSettled(promises);

    const results: PartResult[] = settled.map((result, i) => {
      if (result.status === "fulfilled") {
        return result.value;
      } else {
        const partInfo = i < BOOK_STRUCTURE.length
          ? BOOK_STRUCTURE[i]
          : { number: 12, title: "Appendices" };
        return {
          partNumber: partInfo.number,
          title: partInfo.title,
          status: "rejected" as const,
          error: result.reason?.message ?? String(result.reason),
          durationMs: 0,
        };
      }
    });

    printResults(results, startTime);
  }
}

function printResults(results: PartResult[], startTime: number) {
  const totalDuration = Date.now() - startTime;

  console.log();
  console.log("================================================================");
  console.log("                          Results");
  console.log("================================================================");

  for (const r of results) {
    const icon = r.status === "fulfilled" ? "OK" : "FAIL";
    const partLabel = r.partNumber <= 11 ? `Part ${toRoman(r.partNumber).padEnd(4)}` : "App. ";
    const duration = formatDuration(r.durationMs);
    const errorInfo = r.error ? ` — ${r.error.slice(0, 50)}` : "";
    console.log(`  [${icon}] ${partLabel} ${r.title.padEnd(35)} ${duration.padStart(8)}${errorInfo}`);
  }

  console.log("----------------------------------------------------------------");

  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;
  console.log(`  Total: ${succeeded} succeeded, ${failed} failed`);
  console.log(`  Wall time: ${formatDuration(totalDuration)}`);
  console.log("================================================================");

  const chaptersDir = path.resolve("chapters");
  if (fs.existsSync(chaptersDir)) {
    const texFiles = fs.readdirSync(chaptersDir).filter((f) => f.endsWith(".tex"));
    console.log(`\nGenerated files: ${texFiles.length} .tex files in book/chapters/`);
  }

  if (failed > 0) {
    console.log(`\nFailed parts can be re-run individually with --part=N`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
