**The Lattice Handbook** is a comprehensive guide to the Lattice programming language, written for intermediate programmers coming from Python, JavaScript, Rust, or Go.

Lattice is a systems-aware language built around a novel *phase system* inspired by materials science. Values exist in phases — fluid (mutable), fixed (immutable), or inferred — and transition between states through operations like freezing, thawing, and cloning. This model gives programmers fine-grained control over mutability and memory while keeping the syntax approachable and expressive.

The book is organized into eleven parts that take the reader from first contact through real-world application development. Early chapters cover installation, the REPL, values, types, variables, control flow, functions, collections, strings, pattern matching, and error handling. The middle sections dive deep into the phase system itself — explaining phases, memory arenas, alloys and bonds, and strict mode — before moving into structs, enums, traits, and generics.

A dedicated part on concurrency covers Lattice's structured concurrency model, channels, select expressions, and common concurrency patterns. The standard library chapters walk through filesystem operations, data formats, networking, and utilities for time, cryptography, and OS interaction.

Later parts explore lazy iterators and functional programming, the module and package system, and developer tooling including the formatter, doc generator, test framework, and debugger. Under-the-hood chapters reveal how Lattice's three execution backends (tree-walk interpreter, stack-based bytecode VM, and register VM) work, along with bytecode serialization, native extensions, and metaprogramming.

The book closes with two hands-on projects — building a CLI tool and a web service — that tie everything together. Appendices provide a grammar reference, opcode reference, phase cheatsheet, and built-in function reference.

Covering Lattice v0.3.28, this is the definitive resource for learning and mastering the language.
