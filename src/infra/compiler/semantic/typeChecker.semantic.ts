import type {
  BlockStatement,
  Expression,
  Program,
  Statement,
  TypeName,
} from "@infra/compiler/parser/state.parser";
import type { Token } from "@shared/types/tokens.types";
import { TokenType } from "@shared/types/tokens.types";
import type { Scope, SemanticError } from "./symbols.types.semantic";

export interface TypecheckResult {
  errors: SemanticError[];
}

type ExprType = TypeName | "error";

export function typecheckProgram(
  ast: Program,
  rootScope: Scope,
  blockToScope: WeakMap<BlockStatement, Scope>
): TypecheckResult {
  const errors: SemanticError[] = [];
  void rootScope;
  void blockToScope;

  // Types accumulate in source order so 
  // a name is not visible before its declaration.
  const envFrames: Array<Map<string, TypeName>> = [new Map()];

  function reportError(message: string, token: Token): void {
    errors.push({ severity: "error", message, line: token.line, column: token.column });
  }

  function lookupEnv(name: string): TypeName | undefined {
    for (let i = envFrames.length - 1; i >= 0; i--) {
      const hit = envFrames[i]!.get(name);
      if (hit !== undefined) return hit;
    }
    return undefined;
  }

  function literalType(expr: Expression & { kind: "Literal" }): ExprType {
    const v = expr.value;
    if (typeof v === "number") return "int";
    if (typeof v === "string") return "string";
    if (typeof v === "boolean") return "boolean";
    reportError(`Invalid literal type.`, expr.token);
    return "error";
  }

  function typeExpr(expr: Expression): ExprType {
    switch (expr.kind) {
      case "Literal":
        return literalType(expr);
      case "Variable": {
        const t = lookupEnv(expr.name.lexeme);
        if (!t) {
          reportError(`Undeclared identifier '${expr.name.lexeme}' (type check).`, expr.name);
          return "error";
        }
        return t;
      }
      case "Grouping":
        return typeExpr(expr.expression);
      case "Binary": {
        const op = expr.operator.type;
        if (op === TokenType.PLUS) {
          const lt = typeExpr(expr.left);
          const rt = typeExpr(expr.right);
          if (lt !== "int" || rt !== "int") {
            reportError(
              `Operator '+' requires int on both sides (got ${lt} and ${rt}).`,
              expr.operator
            );
            return "error";
          }
          return "int";
        }
        if (op === TokenType.EQUAL_EQUAL || op === TokenType.BANG_EQUAL) {
          const lt = typeExpr(expr.left);
          const rt = typeExpr(expr.right);
          if (lt === "error" || rt === "error") return "error";
          if (lt !== rt) {
            reportError(
              `Operator '${expr.operator.lexeme}' requires both operands to have the same type (got ${lt} and ${rt}).`,
              expr.operator
            );
            return "error";
          }
          return "boolean";
        }
        reportError(`Unsupported binary operator '${expr.operator.lexeme}' in type check.`, expr.operator);
        return "error";
      }
      default: {
        const _exhaustive: never = expr;
        return _exhaustive;
      }
    }
  }

  function walkBlock(block: BlockStatement, newScope: boolean): void {
    if (newScope) {
      envFrames.push(new Map());
    }
    for (const stmt of block.body) walkStatement(stmt);
    if (newScope) envFrames.pop();
  }

  function walkStatement(stmt: Statement): void {
    switch (stmt.kind) {
      case "VarDeclStatement": {
        envFrames[envFrames.length - 1]!.set(stmt.name.lexeme, stmt.typeName);
        return;
      }
      case "AssignmentStatement": {
        const lhs = lookupEnv(stmt.name.lexeme);
        if (!lhs) {
          reportError(`Undeclared identifier '${stmt.name.lexeme}' (assignment).`, stmt.name);
          return;
        }
        const rhs = typeExpr(stmt.value);
        if (rhs !== "error" && lhs !== rhs) {
          reportError(
            `Assignment type mismatch: '${stmt.name.lexeme}' is ${lhs} but right-hand side is ${rhs}.`,
            stmt.name
          );
        }
        return;
      }
      case "PrintStatement": {
        typeExpr(stmt.expression);
        return;
      }
      case "ExpressionStatement": {
        typeExpr(stmt.expression);
        return;
      }
      case "BlockStatement":
        walkBlock(stmt, true);
        return;
      case "IfStatement": {
        const cond = typeExpr(stmt.condition);
        if (cond !== "boolean" && cond !== "error") {
          reportError(`If condition must be boolean (got ${cond}).`, firstTokenInExpr(stmt.condition));
        }
        walkBlock(stmt.body, true);
        return;
      }
      case "WhileStatement": {
        const cond = typeExpr(stmt.condition);
        if (cond !== "boolean" && cond !== "error") {
          const t = firstTokenInExpr(stmt.condition);
          reportError(`While condition must be boolean (got ${cond}).`, t);
        }
        walkBlock(stmt.body, true);
        return;
      }
      default: {
        const _exhaustive: never = stmt;
        return _exhaustive;
      }
    }
  }

  walkBlock(ast.body, false);
  return { errors };
}

function firstTokenInExpr(expr: Expression): Token {
  switch (expr.kind) {
    case "Literal":
      return expr.token;
    case "Variable":
      return expr.name;
    case "Grouping":
      return firstTokenInExpr(expr.expression);
    case "Binary":
      return firstTokenInExpr(expr.left);
    default: {
      const _e: never = expr;
      return _e;
    }
  }
}
