import type { LexerState } from "./lexer.state";
import type { TokenType } from "@shared/types/tokens.types";

export function isAtEnd(state: LexerState): boolean {
  return state.current >= state.source.length;
}

export function advanceBy(state: LexerState, str: string): void {
  for (let i = 0; i < str.length; i++) {
    const c = str[i]!;
    if (c === "\n") {
      state.line += 1;
      state.column = 1;
    } else {
      state.column += 1;
    }
  }
  state.current += str.length;
}

export function addToken(
  state: LexerState,
  type: TokenType,
  literal: number | string | null = null
): void {
  const lexeme = state.source.slice(state.start, state.current);
  state.tokens.push({
    type,
    lexeme,
    literal,
    line: state.line,
    column: state.startColumn,
  });
}
