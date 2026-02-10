import type { Token } from "./tokens.types";
import type { LexerState } from "./lexer.state";
import { isAtEnd } from "./lexer.runtime";
import { scanToken } from "./lexer.scan";

export function scanTokens(source: string): Token[] {
  const state: LexerState = {
    source,
    start: 0,
    current: 0,
    line: 1,
    column: 1,
    startColumn: 1,
    tokens: [],
  };

  while (!isAtEnd(state)) {
    scanToken(state);
  }

  state.tokens.push({
    type: "EOF",
    lexeme: "",
    literal: null,
    line: state.line,
    column: state.column,
  });

  return state.tokens;
}
