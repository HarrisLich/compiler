import type { LexerState } from "./state.lexer";
import { TOKEN_SPECS, TokenType } from "@shared/types/tokens.types";
import { addToken, advanceBy, isAtEnd } from "./runtime.lexer";

/** CharList ::= char CharList | space CharList | ε — only a-z and space inside quotes */
const GRAMMAR_CHARLIST = /^[a-z ]*$/;

export function scanToken(state: LexerState): void {
  state.start = state.current;
  state.startColumn = state.column;

  if (isAtEnd(state)) return;

  const rest = state.source.slice(state.current);

  for (const spec of TOKEN_SPECS) {
    const match = spec.pattern.exec(rest);
    if (match && match.index === 0) {
      const matched = match[0]!;
      advanceBy(state, matched);

      if (spec.ignore) return;

      const type = spec.type;
      let literal: number | string | null = null;
      if (type === TokenType.NUMBER) {
        literal = parseInt(matched, 10);
      } else if (type === TokenType.STRING_LITERAL && match[1] !== undefined) {
        const content = match[1];
        if (!GRAMMAR_CHARLIST.test(content)) {
          throw new Error(
            `Invalid string contents at line ${state.line}, column ${state.startColumn}: only lowercase letters and spaces are allowed inside string literals.`
          );
        }
        literal = content;
      }
      addToken(state, type, literal);
      return;
    }
  }

  if (rest.startsWith('"')) {
    advanceBy(state, rest);
    throw new Error(`Unterminated string at line ${state.line}.`);
  }
  if (rest.startsWith("/*")) {
    let i = 2;
    while (i < rest.length) {
      if (rest[i] === "*" && rest[i + 1] === "/") {
        i += 2;
        advanceBy(state, rest.slice(0, i));
        return;
      }
      i++;
    }
    advanceBy(state, rest);
    throw new Error(`Unterminated block comment at line ${state.line}.`);
  }

  const ch = rest[0] ?? "";
  const code =
    ch.length === 0 ? "EOF" : `U+${ch.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0")}`;
  const printable =
    ch === "\n"
      ? "\\n"
      : ch === "\r"
        ? "\\r"
        : ch === "\t"
          ? "\\t"
          : ch === " "
            ? "<space>"
            : ch;

  // Build a tiny source excerpt for fast debugging.
  const src = state.source;
  const lineStart = Math.max(0, src.lastIndexOf("\n", state.current - 1) + 1);
  const nl = src.indexOf("\n", state.current);
  const lineEnd = nl === -1 ? src.length : nl;
  const lineText = src.slice(lineStart, lineEnd);
  const caretPos = Math.max(0, Math.min(lineText.length, state.column - 1));
  const caretLine = " ".repeat(caretPos) + "^";

  throw new Error(
    `Unexpected character '${printable}' (${code}) at line ${state.line}, column ${state.column}.\n` +
      `${lineText}\n` +
      `${caretLine}`
  );
}
