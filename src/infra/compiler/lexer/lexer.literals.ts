import type { LexerState } from "./lexer.state";
import type { TokenType } from "./tokens.types";
import { addToken, advance, isAtEnd, peek } from "./lexer.runtime";
import { isAlphaNumeric, isDigit } from "@shared/helpers/char";

const KEYWORDS: Record<string, TokenType> = {
  print: "PRINT",
  while: "WHILE",
  if: "IF",
  int: "INT",
  string: "STRING",
  boolean: "BOOLEAN",
  true: "TRUE",
  false: "FALSE",
};

export function number(state: LexerState): void {
  while (isDigit(peek(state))) advance(state);
  const value = parseInt(state.source.slice(state.start, state.current), 10);
  addToken(state, "NUMBER", value);
}

export function string(state: LexerState): void {
  while (peek(state) !== '"' && !isAtEnd(state)) {
    advance(state);
  }
  if (isAtEnd(state)) {
    throw new Error(`Unterminated string at line ${state.line}.`);
  }
  advance(state);
  const value = state.source.slice(state.start + 1, state.current - 1);
  addToken(state, "STRING_LITERAL", value);
}

export function identifier(state: LexerState): void {
  while (isAlphaNumeric(peek(state))) advance(state);
  const text = state.source.slice(state.start, state.current);
  const type = KEYWORDS[text] ?? "IDENTIFIER";
  addToken(state, type);
}
