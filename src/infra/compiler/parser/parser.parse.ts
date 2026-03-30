import type { Expression, Program, Statement } from "./parser.state";
import type { ParserState } from "./parser.state";
import { consume, isAtEnd, match, peek, previous } from "./parser.runtime";
import { TokenType } from "@shared/types/tokens.types";

export function parseProgram(state: ParserState): Program {
  const body = parseStatementList(state);
  consume(state, TokenType.EOF, "Expected end of program.");
  return { kind: "Program", body };
}

function parseStatementList(state: ParserState): Statement[] {
  const body: Statement[] = [];
  while (!isAtEnd(state) && peek(state).type === TokenType.PRINT) {
    body.push(parseStatement(state));
  }
  return body;
}

function parseStatement(state: ParserState): Statement {
  if (match(state, TokenType.PRINT)) {
    consume(state, TokenType.LEFT_PAREN, "Expected '(' after 'print'.");
    const expression = parseExpression(state);
    consume(state, TokenType.RIGHT_PAREN, "Expected ')' after expression.");
    return { kind: "PrintStatement", expression };
  }
  consume(
    state,
    TokenType.PRINT,
    "Expected statement (e.g. print(...))."
  );
  throw new Error("Unreachable");
}

export function parseExpression(state: ParserState): Expression {
  let expr: Expression = parseTerm(state);
  while (match(state, TokenType.PLUS)) {
    const operator = previous(state);
    const right = parseTerm(state);
    expr = { kind: "Binary", left: expr, operator, right };
  }
  return expr;
}

function parseTerm(state: ParserState): Expression {
  return parseFactor(state);
}

function parseFactor(state: ParserState): Expression {
  if (match(state, TokenType.NUMBER) || match(state, TokenType.STRING_LITERAL)) {
    const token = previous(state);
    const value = token.literal ?? token.lexeme;
    return { kind: "Literal", value: value as number | string, token };
  }
  if (match(state, TokenType.TRUE)) {
    const token = previous(state);
    return { kind: "Literal", value: true, token };
  }
  if (match(state, TokenType.FALSE)) {
    const token = previous(state);
    return { kind: "Literal", value: false, token };
  }
  if (match(state, TokenType.IDENTIFIER)) {
    const name = previous(state);
    return { kind: "Variable", name };
  }
  if (match(state, TokenType.LEFT_PAREN)) {
    const expression = parseExpression(state);
    consume(state, TokenType.RIGHT_PAREN, "Expected ')'.");
    return { kind: "Grouping", expression };
  }
  consume(
    state,
    TokenType.NUMBER,
    "Expected expression (number, string, identifier, or parenthesized expression)."
  );
  const token = previous(state);
  const value = token.literal ?? token.lexeme;
  return { kind: "Literal", value: value as number | string, token };
}
