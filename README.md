# Compiler

Lexer, parser, semantic analysis, type checking, and 6502 codegen for the grammar specified from https://www.labouseur.com/courses/compilers/ (or grammar.pdf). The final surface product in this repo is a quick Express app with a browser UI and a JSON compile API.

## Run it (npm or Yarn)

All scripts are defined in this folder’s `package.json`. From the **`compiler/`** directory:

```bash
cd compiler
npm install   # or: yarn
npm run dev   # or: yarn dev
```

That starts the dev server (via `tsx`) on **port 3000** by default, or whatever you set in `PORT`.

From the **repository root** (without a workspace root `package.json`), you can still invoke the same scripts with npm’s `--prefix` flag:

```bash
npm install --prefix compiler
npm run dev --prefix compiler
```

Equivalent with Yarn:

```bash
yarn --cwd compiler install
yarn --cwd compiler dev
```

If you later publish this package or wire it into a monorepo under a scoped name (for example `@compiler/compiler`), the commands stay the same; only the `name` field in `package.json` changes.

## Entry point guide

| Role                               | File                      | How it runs                                                                                         |
| ---------------------------------- | ------------------------- | --------------------------------------------------------------------------------------------------- |
| **Process entry (default)**        | `src/index.ts`            | `npm run dev` / `yarn dev` (development) or `npm run build && npm start` (compiled `dist/index.js`) |
| **Compile a source file (stdout)** | `src/cli/compile-file.ts` | `npm run compile:file -- <path>` / `yarn compile:file <path>` (see below)                           |
| **Pipeline demo (logs)**           | `src/core/bootstrap.ts`   | Import `bootstrap` from another script or a REPL; not started by `index.ts` today                   |

### What `src/index.ts` does

1. Loads `dotenv` for environment variables (for example `PORT`).
2. Serves a minimal HTML UI at **`GET /`** with a “Compile” button.
3. Exposes **`POST /api/compile`** with JSON body `{ "source": "<program text>" }`. It runs scan → parse → semantic analysis → typecheck → `generate6502` when there are no errors, and returns `compilerOutput` plus `codegenHex`.

### Library-style entry (pipeline pieces)

The compiler stages live under `src/infra/compiler/` and are imported with path aliases (see `tsconfig.json`):

- `@infra/compiler/lexer/scanTokens.lexer` — tokenize
- `@infra/compiler/parser/parse.parser` — parse to AST
- `@infra/compiler/semantic/scopeAnalyzer.semantic` — scopes and symbols
- `@infra/compiler/semantic/typeChecker.semantic` — types
- `@infra/compiler/codegen/index.codegen` — 6502 image generation

`src/index.ts` wires these together for the HTTP API.

### Compile a program from a text file

Runs the same pipeline as the API (lexer through codegen) and prints the token/CST/AST/semantic/type sections plus **hex codegen** to the console. Exits with status **1** if the file cannot be read, the pipeline throws, or there are semantic or type **errors** (codegen is skipped in that case).

From **`compiler/`**:

```bash
yarn compile:file ./path/to/program.txt
```

With **npm**, pass the file path after `--` so it is not eaten by npm itself:

```bash
npm run compile:file -- ./path/to/program.txt
```

From the **repository root**:

```bash
yarn --cwd compiler compile:file ./compiler/some-program.txt
npm run compile:file --prefix compiler -- ./compiler/some-program.txt
```

## Other useful commands

| Command                | Purpose                                                                                      |
| ---------------------- | -------------------------------------------------------------------------------------------- |
| `npm run build`        | Clean `dist/` and compile TypeScript                                                         |
| `npm run start`        | Run the built `dist/index.js`                                                                |
| `npm run test`         | Vitest                                                                                       |
| `npm run test:ci`      | Vitest with coverage (CI)                                                                    |
| `npm run typecheck`    | `tsc --noEmit`                                                                               |
| `npm run lint`         | ESLint                                                                                       |
| `npm run compile:file` | Read a source file and print compiler report + hex to stdout (`tsx src/cli/compile-file.ts`) |

Harris Lichstein
