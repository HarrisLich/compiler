import type { BlockStatement, Expression, Program, Statement } from "./state.parser";
import { isAtEnd, peek, previous } from "./runtime.parser";
import { TokenType } from "@shared/types/tokens.types";
import type { ParseContext } from "./cst.parser";
import { branch, consume, match } from "./cst.parser";
import { tokenTypeToTypeName } from "./helpers.parser";
import {
  makeAssignmentStatement,
  makeBinary,
  makeBlock,
  makeGrouping,
  makeIfStatement,
  makeLiteral,
  makePrintStatement,
  makeProgram,
  makeVarDeclStatement,
  makeVariable,
  makeWhileStatement,
} from "./ast.parser";

export function parseProgram(ctx: ParseContext): Program {
  return branchWithReturn(ctx, "Program", () => {
    const block = parseBlock(ctx);
    consume(ctx, TokenType.EOF, "Expected '$' at end of program.");
    consume(ctx, TokenType.EOI, "Expected end of input.");
    return makeProgram(block);
  });
}

function parseBlock(ctx: ParseContext): BlockStatement {
  return branchWithReturn(ctx, "Block", () => {
    consume(ctx, TokenType.LEFT_BRACE, "Expected '{' to start block.");
    const body = parseStatementList(ctx);
    consume(ctx, TokenType.RIGHT_BRACE, "Expected '}' to end block.");
    return makeBlock(body);
  });
}

function parseStatementList(ctx: ParseContext): Statement[] {
  return branchWithReturn(ctx, "StatementList", () => {
    const body: Statement[] = [];
    while (
      !isAtEnd(ctx.state) &&
      peek(ctx.state).type !== TokenType.RIGHT_BRACE
    ) {
      body.push(parseStatement(ctx));
    }
    return body;
  });
}

function parseStatement(ctx: ParseContext): Statement {
  return branchWithReturn(ctx, "Statement", () => {
    const t = peek(ctx.state);
    const STATEMENT_STARTERS = [
      TokenType.PRINT,
      TokenType.IDENTIFIER,
      TokenType.INT,
      TokenType.STRING,
      TokenType.BOOLEAN,
      TokenType.WHILE,
      TokenType.IF,
      TokenType.LEFT_BRACE,
    ] as const;

    if (match(ctx, TokenType.PRINT)) {
      // PrintStatement ::= print ( Expr )
      return branchWithReturn(ctx, "PrintStatement", () => {
        consume(ctx, TokenType.LEFT_PAREN, "Expected '(' after 'print'.");
        const expression = parseExpression(ctx);
        consume(ctx, TokenType.RIGHT_PAREN, "Expected ')' after expression.");
        return makePrintStatement(expression);
      });
    }

    if (t.type === TokenType.LEFT_BRACE) {
      return parseBlock(ctx);
    }

    if (match(ctx, TokenType.WHILE)) {
      return branchWithReturn(ctx, "WhileStatement", () => {
        const condition = parseBooleanExpr(ctx);
        const body = parseBlock(ctx);
        return makeWhileStatement(condition, body);
      });
    }

    if (match(ctx, TokenType.IF)) {
      return branchWithReturn(ctx, "IfStatement", () => {
        const condition = parseBooleanExpr(ctx);
        const body = parseBlock(ctx);
        return makeIfStatement(condition, body);
      });
    }

    if (
      match(ctx, TokenType.INT) ||
      match(ctx, TokenType.STRING) ||
      match(ctx, TokenType.BOOLEAN)
    ) {
      return branchWithReturn(ctx, "VarDecl", () => {
        const typeToken = previous(ctx.state);
        const typeName = tokenTypeToTypeName(typeToken.type);
        const name = consume(ctx, TokenType.IDENTIFIER, "Expected identifier after type.");
        return makeVarDeclStatement(typeName, name);
      });
    }

    if (match(ctx, TokenType.IDENTIFIER)) {
      return branchWithReturn(ctx, "AssignmentStatement", () => {
        const name = previous(ctx.state);
        consume(ctx, TokenType.EQUAL, "Expected '=' after identifier in assignment.");
        const value = parseExpression(ctx);
        return makeAssignmentStatement(name, value);
      });
    }

    // Fallback for better error reporting.
    if (t.type === TokenType.EQUAL) {
      consume(
        ctx,
        STATEMENT_STARTERS,
        "Unexpected '='. Declarations cannot include initialization; use 'string b' then 'b = \"...\"'. Expected statement."
      );
    }
    consume(ctx, STATEMENT_STARTERS, "Expected statement.");
    throw new Error("Unreachable");
  });
}

export function parseExpression(ctx: ParseContext): Expression {
  // Expr ::= IntExpr | StringExpr | BooleanExpr | Id — equality (==/!=) only inside
  // BooleanExpr ::= ( Expr boolop Expr ) | boolval, i.e. via parenthesized form in parseFactor.
  return branchWithReturn(ctx, "Expr", () => parseExprNoBoolOp(ctx));
}

/** Expr without top-level ==/!= (those appear only in ( Expr boolop Expr ) via parseParenContentAfterOpen). */
function parseExprNoBoolOp(ctx: ParseContext): Expression {
  return parseIntExpr(ctx);
}

/**
 * After `(` has been consumed: either ( Expr boolop Expr ) or plain ( Expr ) for grouping.
 * @param requireEquality - if true (BooleanExpr), must have boolop; otherwise parse error.
 */
function parseParenContentAfterOpen(
  ctx: ParseContext,
  requireEquality: boolean
): Expression {
  const left = parseExprNoBoolOp(ctx);
  if (match(ctx, TokenType.EQUAL_EQUAL) || match(ctx, TokenType.BANG_EQUAL)) {
    const operator = previous(ctx.state);
    const right = parseExprNoBoolOp(ctx);
    consume(ctx, TokenType.RIGHT_PAREN, "Expected ')'.");
    return makeGrouping(makeBinary(left, operator, right));
  }
  if (requireEquality) {
    throw new Error("Expected '==' or '!=' in boolean expression.");
  }
  throw new Error("Unexpected '(' — grouping is not part of the grammar (only BooleanExpr uses parentheses).");
}

function parseBooleanExpr(ctx: ParseContext): Expression {
  // BooleanExpr ::= ( Expr boolop Expr ) | boolval
  // boolop ::= == | !=
  // boolval ::= true | false
  return branchWithReturn(ctx, "BooleanExpr", () => {
    if (match(ctx, TokenType.TRUE)) {
      const token = previous(ctx.state);
      return makeLiteral(token, true);
    }
    if (match(ctx, TokenType.FALSE)) {
      const token = previous(ctx.state);
      return makeLiteral(token, false);
    }
    consume(ctx, TokenType.LEFT_PAREN, "Expected '(' to start boolean expression.");
    return parseParenContentAfterOpen(ctx, true);
  });
}

function parseIntExpr(ctx: ParseContext): Expression {
  // IntExpr ::= digit intop Expr | digit
  // digit is tokenized as NUMBER with a single digit lexeme.
  return branchWithReturn(ctx, "IntExpr", () => {
    // IntExpr must start with a digit.
    if (match(ctx, TokenType.NUMBER)) {
      const digitTok = previous(ctx.state);
      const value = digitTok.literal ?? digitTok.lexeme;
      const left: Expression = makeLiteral(digitTok, value as number);

      // Right-recursive shape: digit + Expr
      if (match(ctx, TokenType.PLUS)) {
        const operator = previous(ctx.state);
        const right = parseExpression(ctx);
        return makeBinary(left, operator, right);
      }

      return left;
    }

    // Non-integer expressions:
    // - StringExpr
    // - BooleanExpr
    // - Id
    // - boolval (as BooleanExpr alternative)
    return parseNonIntExpr(ctx);
  });
}

function parseNonIntExpr(ctx: ParseContext): Expression {
  // StringExpr ::= " CharList "
  if (match(ctx, TokenType.STRING_LITERAL)) {
    const token = previous(ctx.state);
    const value = token.literal ?? token.lexeme;
    return makeLiteral(token, value as string);
  }

  // BooleanExpr ::= ( Expr boolop Expr ) | boolval
  if (peek(ctx.state).type === TokenType.TRUE || peek(ctx.state).type === TokenType.FALSE) {
    return parseBooleanExpr(ctx);
  }
  if (peek(ctx.state).type === TokenType.LEFT_PAREN) {
    return parseBooleanExpr(ctx);
  }

  // Id ::= char
  if (match(ctx, TokenType.IDENTIFIER)) {
    const name = previous(ctx.state);
    return makeVariable(name);
  }

  // Fallback error
  consume(
    ctx,
    TokenType.NUMBER,
    "Expected expression (digit, string literal, boolean expression, or identifier)."
  );
  const token = previous(ctx.state);
  const value = token.literal ?? token.lexeme;
  return makeLiteral(token, value as number);
}

function branchWithReturn<T>(ctx: ParseContext, name: string, fn: () => T): T {
  let result!: T;
  branch(ctx, name, () => {
    result = fn();
  });
  return result;
}
