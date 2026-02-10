import type { LexerState } from "./lexer.state";
import {
  addToken,
  advance,
  blockComment,
  match,
  peek,
} from "./lexer.runtime";
import { number, string, identifier } from "./lexer.literals";
import { isAlpha, isDigit } from "@shared/helpers/char";

export function scanToken(state: LexerState): void {
  state.start = state.current;
  state.startColumn = state.column;
  const c = advance(state);

  switch (c) {
    case "(":
      addToken(state, "LEFT_PAREN");
      break;
    case ")":
      addToken(state, "RIGHT_PAREN");
      break;
    case "{":
      addToken(state, "LEFT_BRACE");
      break;
    case "}":
      addToken(state, "RIGHT_BRACE");
      break;
    case "+":
      addToken(state, "PLUS");
      break;
    case "=":
      addToken(state, match(state, "=") ? "EQUAL_EQUAL" : "EQUAL");
      break;
    case "!":
      if (match(state, "=")) {
        addToken(state, "BANG_EQUAL");
      } else {
        throw new Error(`Unexpected character at line ${state.line}.`);
      }
      break;
    case '"':
      string(state);
      break;
    case "/":
      if (peek(state) === "*") {
        blockComment(state);
      } else {
        throw new Error(`Unexpected character at line ${state.line}.`);
      }
      break;
    case " ":
    case "\r":
    case "\t":
      break;
    case "\n":
      break;
    default:
      if (isDigit(c)) {
        number(state);
      } else if (isAlpha(c)) {
        identifier(state);
      } else {
        throw new Error(`Unexpected character at line ${state.line}.`);
      }
  }
}
