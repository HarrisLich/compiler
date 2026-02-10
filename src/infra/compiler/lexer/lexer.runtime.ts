import type { LexerState } from "./lexer.state";
import type { TokenType } from "./tokens.types";

export function isAtEnd(state: LexerState): boolean {
  return state.current >= state.source.length;
}

export function advance(state: LexerState): string {
  if (isAtEnd(state)) return "\0";
  const c = state.source[state.current]!;
  state.current += 1;
  if (c === "\n") {
    state.line += 1;
    state.column = 1;
  } else {
    state.column += 1;
  }
  return c;
}

export function peek(state: LexerState): string {
  if (isAtEnd(state)) return "\0";
  return state.source[state.current]!;
}

export function peekNext(state: LexerState): string {
  if (state.current + 1 >= state.source.length) return "\0";
  return state.source[state.current + 1]!;
}

export function match(state: LexerState, expected: string): boolean {
  if (isAtEnd(state)) return false;
  if (state.source[state.current] !== expected) return false;
  advance(state);
  return true;
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

export function blockComment(state: LexerState): void {
  while (!isAtEnd(state)) {
    if (peek(state) === "*" && peekNext(state) === "/") {
      advance(state);
      advance(state);
      return;
    }
    advance(state);
  }
  throw new Error(`Unterminated block comment at line ${state.line}.`);
}
