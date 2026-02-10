## Lexer overview

This directory implements a small, grammar‑driven lexer for the compiler. It turns a source string (program) into a flat list of tokens that the parser can consume.

- **Entry point**: `scanTokens(source: string): Token[]` in `lexer.ts`
- **Token model**: `Token` / `TokenType` in `tokens.types.ts`
- **State model**: `LexerState` in `lexer.state.ts`
- **Runtime helpers**: stateful scanning primitives in `lexer.runtime.ts`
- **Literals & identifiers**: `number`, `string`, `identifier` (+ keyword table) in `lexer.literals.ts`
- **Single‑token scanner**: `scanToken` in `lexer.scan.ts`
- **Char helpers**: `isDigit`, `isAlpha`, `isAlphaNumeric` in `src/shared/helpers/char.ts`

The lexer is intentionally split into small files so each concern (state, runtime, literals, entry point) stays focused and testable.

## Token set

Defined in `tokens.types.ts`:

- **Keywords**: `PRINT`, `WHILE`, `IF`, `INT`, `STRING`, `BOOLEAN`, `TRUE`, `FALSE`
- **Identifiers**: `IDENTIFIER`
- **Literals**:
  - `NUMBER` – integer only (no decimals), `literal` is a `number`
  - `STRING_LITERAL` – double‑quoted strings, `literal` is a `string` without quotes
- **Operators / punctuation**:
  - `EQUAL` (`=`)
  - `EQUAL_EQUAL` (`==`)
  - `BANG_EQUAL` (`!=`)
  - `PLUS` (`+`)
  - `LEFT_PAREN`, `RIGHT_PAREN` (`(`, `)`)
  - `LEFT_BRACE`, `RIGHT_BRACE` (`{`, `}`)
- **End of input**: `EOF`

Each `Token` also carries:

- `lexeme`: the exact substring from the source
- `line` / `column`: 1‑based source location of the first character
- `literal`: `number | string | null` as described above

## File responsibilities

- `lexer.ts`
  - Public API: `scanTokens(source: string): Token[]`
  - Creates an initial `LexerState`, repeatedly calls `scanToken`, pushes an `EOF` token, and returns `state.tokens`.

- `lexer.state.ts`
  - Defines `LexerState`, which tracks:
    - `source`: full source string
    - `start` / `current`: character indices for the current lexeme
    - `line` / `column`: current position in the source
    - `startColumn`: column where the current lexeme began
    - `tokens`: accumulated `Token[]`

- `lexer.runtime.ts`
  - Stateful scanning primitives:
    - `isAtEnd(state)`: checks if `current` has reached the end of `source`
    - `advance(state)`: consumes and returns the next character, updating line/column
    - `peek(state)`: looks at the current character without consuming
    - `peekNext(state)`: looks one character ahead
    - `match(state, expected)`: conditionally consumes `expected`
    - `addToken(state, type, literal?)`: slices `lexeme` and pushes a `Token` with the stored `startColumn`
    - `blockComment(state)`: skips `/* ... */` comments (can span multiple lines, errors if unterminated)

- `lexer.literals.ts`
  - Keyword table `KEYWORDS: Record<string, TokenType>` mapping strings like `"print"` to `PRINT`.
  - `number(state)`:
    - Uses `isDigit` / `advance` to consume one or more digits.
    - Produces a `NUMBER` token with integer `literal`.
  - `string(state)`:
    - Assumes the opening `"` has been consumed.
    - Advances until the closing `"`, erroring if end of input is reached first.
    - Produces a `STRING_LITERAL` token with `literal` equal to the inner characters (no quotes).
  - `identifier(state)`:
    - Consumes letters/digits/underscore via `isAlphaNumeric`.
    - Looks up the lexeme in `KEYWORDS`, producing either the keyword token or `IDENTIFIER`.

- `lexer.scan.ts`
  - `scanToken(state)`:
    - Sets `state.start` / `state.startColumn`.
    - Reads one character via `advance` and dispatches:
      - Single‑char tokens: `(`, `)`, `{`, `}`, `+`
      - Two‑char/one‑char operator: `=`, `==`, `!`, `!=`
      - String start: `"` → calls `string(state)`
      - Comment or error: `/` + `*` → `blockComment(state)`, otherwise error
      - Whitespace: space, `\r`, `\t`, `\n` → ignored (line/column already tracked by `advance`)
      - Default:
        - Digit → `number(state)`
        - Alpha/underscore → `identifier(state)`
        - Anything else → throws `Unexpected character at line ...`

## Lexing rules summary

- **Whitespace**: spaces, tabs, carriage returns, and newlines are ignored as tokens, but newlines increment `line` and reset `column` inside `advance`.
- **Comments**: `/* ... */` are skipped entirely; nested comments are not supported; missing closing `*/` throws an error.
- **Numbers**: one or more digits, always tokenized as integer `NUMBER`.
- **Strings**: double‑quoted segments; no escape sequences are currently handled.
- **Identifiers & keywords**:
  - Start with a letter or `_`, followed by letters/digits/underscores.
  - If lexeme matches a grammar keyword, a keyword token is produced; otherwise `IDENTIFIER`.

## Usage

- From within the project:

```ts
import { scanTokens } from "@infra/compiler/lexer/lexer";

const source = "print (1 + 2)";
const tokens = scanTokens(source);
// tokens: Token[] ending with an EOF token
```

- The lexer is exercised by tests in `__tests__/lexer/*.test.ts` using Vitest.
