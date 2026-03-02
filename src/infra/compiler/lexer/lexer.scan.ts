import type { LexerState } from "./lexer.state";
import type { TokenType } from "@shared/types/tokens.types";
import { TOKEN_SPECS } from "@shared/types/tokens.types";
import { addToken, advanceBy, isAtEnd } from "./lexer.runtime";

const CAPITAL_IN_STRING = /[A-Z]/;

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

      const type = spec.type as TokenType;
      let literal: number | string | null = null;
      if (type === "NUMBER") {
        literal = parseInt(matched, 10);
      } else if (type === "STRING_LITERAL" && match[1] !== undefined) {
        const content = match[1];
        if (CAPITAL_IN_STRING.test(content)) {
          throw new Error(
            `Capital characters not allowed in string at line ${state.line}.`
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

  throw new Error(`Unexpected character at line ${state.line}.`);
}
