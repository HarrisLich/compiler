import type { Token } from "@shared/types/tokens.types";
import { TokenType } from "@shared/types/tokens.types";
import type { LexerState } from "./state.lexer";
import { isAtEnd } from "./runtime.lexer";
import { scanToken } from "./scan.lexer";

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

  // Lexer-only sentinel after grammar EOF (`$`) 
  // so the parser can require true end-of-input.
  state.tokens.push({
    type: TokenType.EOI,
    lexeme: "",
    literal: null,
    line: state.line,
    column: state.column,
  });

  return state.tokens;
}
