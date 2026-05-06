import type { Token } from "@shared/types/tokens.types";
import { TokenType } from "@shared/types/tokens.types";
import type { ParserError, ParserState } from "./state.parser";

function tokenAt(state: ParserState, index: number): Token {
  const last = state.tokens[state.tokens.length - 1];
  if (!last) {
    throw new Error("ParserState.tokens must be non-empty (lexer provides at least EOF).");
  }
  const t = state.tokens[index];
  return t ?? last;
}

export function peek(state: ParserState): Token {
  return tokenAt(state, state.current);
}

export function peekNext(state: ParserState): Token {
  return tokenAt(state, state.current + 1);
}

export function advance(state: ParserState): Token {
  if (!isAtEnd(state)) {
    state.current += 1;
  }
  return tokenAt(state, state.current - 1);
}

export function previous(state: ParserState): Token {
  if (state.current <= 0) {
    const last = state.tokens[state.tokens.length - 1];
    if (!last) throw new Error("ParserState.tokens must be non-empty.");
    return last;
  }
  const t = state.tokens[state.current - 1];
  if (!t) {
    const last = state.tokens[state.tokens.length - 1];
    if (!last) throw new Error("ParserState.tokens must be non-empty.");
    return last;
  }
  return t;
}

export function match(state: ParserState, ...types: TokenType[]): boolean {
  const t = peek(state);
  if (types.includes(t.type)) {
    advance(state);
    return true;
  }
  return false;
}

export function consume(
  state: ParserState,
  type: TokenType | readonly TokenType[],
  message: string
): Token {
  const t = peek(state);
  const expected = Array.isArray(type) ? type : [type];
  if (expected.includes(t.type)) {
    return advance(state);
  }
  const err: ParserError = {
    message,
    line: t.line,
    column: t.column,
    expected: Array.isArray(type) ? [...type] : type,
    found: t,
  };
  state.errors.push(err);
  throw new Error(message);
}

export function isAtEnd(state: ParserState): boolean {
  return peek(state).type === TokenType.EOI;
}
