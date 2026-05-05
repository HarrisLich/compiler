import type { BlockStatement, Expression, Program, Statement } from "./parser.state";
import { isAtEnd, peek, previous } from "./parser.runtime";
import { TokenType } from "@shared/types/tokens.types";
import type { ParseContext } from "./parser.cst";
import { branch, consume, match } from "./parser.cst";
import { tokenTypeToTypeName } from "./parser.helpers";
import {
  isEqualityOperatorType,
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
} from "./parser.ast";

export function parseProgram(ctx: ParseContext): Program {
  return branchWithReturn(ctx, "Program", () => {
    const block = parseBlock(ctx);
    consume(ctx, TokenType.EOF, "Expected end of program.");
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
    consume(ctx, TokenType.PRINT, "Expected statement.");
    throw new Error("Unreachable");
  });
}

export function parseExpression(ctx: ParseContext): Expression {
  return branchWithReturn(ctx, "Expr", () => parseEquality(ctx));
}

function parseBooleanExpr(ctx: ParseContext): Expression {
  // Grammar:
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
    const expr = parseExpression(ctx);
    consume(ctx, TokenType.RIGHT_PAREN, "Expected ')' after boolean expression.");

    // Unify representation with general expression parsing:
    // treat parentheses as a Grouping node, even for boolean expressions.
    if (
      expr.kind === "Binary" &&
      isEqualityOperatorType(expr.operator.type)
    ) {
      return makeGrouping(expr);
    }

    throw new Error("Expected '==' or '!=' in boolean expression.");
  });
}

function parseEquality(ctx: ParseContext): Expression {
  let expr = parseAddition(ctx);
  while (match(ctx, TokenType.EQUAL_EQUAL) || match(ctx, TokenType.BANG_EQUAL)) {
    const operator = previous(ctx.state);
    const right = parseAddition(ctx);
    expr = makeBinary(expr, operator, right);
  }
  return expr;
}

function parseAddition(ctx: ParseContext): Expression {
  let expr = parseFactor(ctx);
  while (match(ctx, TokenType.PLUS)) {
    const operator = previous(ctx.state);
    const right = parseFactor(ctx);
    expr = makeBinary(expr, operator, right);
  }
  return expr;
}

function parseFactor(ctx: ParseContext): Expression {
  return branchWithReturn(ctx, "Factor", () => {
    if (match(ctx, TokenType.NUMBER) || match(ctx, TokenType.STRING_LITERAL)) {
      const token = previous(ctx.state);
      const value = token.literal ?? token.lexeme;
      return makeLiteral(token, value as number | string);
    }
    if (match(ctx, TokenType.TRUE)) {
      const token = previous(ctx.state);
      return makeLiteral(token, true);
    }
    if (match(ctx, TokenType.FALSE)) {
      const token = previous(ctx.state);
      return makeLiteral(token, false);
    }
    if (match(ctx, TokenType.IDENTIFIER)) {
      const name = previous(ctx.state);
      return makeVariable(name);
    }
    if (match(ctx, TokenType.LEFT_PAREN)) {
      const expression = parseExpression(ctx);
      consume(ctx, TokenType.RIGHT_PAREN, "Expected ')'.");
      return makeGrouping(expression);
    }
    consume(
      ctx,
      TokenType.NUMBER,
      "Expected expression (number, string, identifier, or parenthesized expression)."
    );
    const token = previous(ctx.state);
    const value = token.literal ?? token.lexeme;
    return makeLiteral(token, value as number | string);
  });
}

function branchWithReturn<T>(ctx: ParseContext, name: string, fn: () => T): T {
  let result!: T;
  branch(ctx, name, () => {
    result = fn();
  });
  return result;
}
