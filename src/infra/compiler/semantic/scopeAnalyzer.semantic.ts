import type {
  BlockStatement,
  Expression,
  Program,
  Statement,
} from "@infra/compiler/parser/state.parser";
import type { Token } from "@shared/types/tokens.types";
import type { Scope, SemanticError, SemanticResult } from "./symbols.types.semantic";
import { lookupSymbol } from "./symbolLookup.semantic";

export function analyzeProgram(ast: Program): SemanticResult {
  const errors: SemanticError[] = [];
  const allScopes: Scope[] = [];
  const blockToScope = new WeakMap<BlockStatement, Scope>();

  function createScope(parent: Scope | null): Scope {
    const scope: Scope = { symbols: new Map(), parent };
    allScopes.push(scope);
    return scope;
  }

  const rootScope = createScope(null);

  function reportError(message: string, token: Token): void {
    errors.push({ severity: "error", message, line: token.line, column: token.column });
  }

  function reportWarning(message: string, token: Token): void {
    errors.push({ severity: "warning", message, line: token.line, column: token.column });
  }

  function resolveVariable(token: Token, context: string, checkInit: boolean): void {
    const lexeme = token.lexeme;
    const sym = lookupSymbol(currentScope, lexeme);
    if (!sym) {
      reportError(`Undeclared identifier '${lexeme}' (${context}).`, token);
      return;
    }

    if (checkInit) {
      const init = lookupInit(lexeme);
      if (init === false) {
        if (sym.typeName === "string") {
          reportError(`Use of uninitialized identifier '${lexeme}' (${context}).`, token);
        } else {
          reportWarning(`Use of uninitialized identifier '${lexeme}' (${context}).`, token);
        }
      }
    }
  }

  let currentScope: Scope = rootScope;

  // Per-frame definite assignment: false = declared, 
  // true = assigned (lookup walks inner to outer frames).
  const initFrames: Array<Map<string, boolean>> = [new Map()];

  function lookupInit(name: string): boolean | undefined {
    for (let i = initFrames.length - 1; i >= 0; i--) {
      const hit = initFrames[i]!.get(name);
      if (hit !== undefined) return hit;
    }
    return undefined;
  }

  function setInit(name: string, value: boolean): void {
    for (let i = initFrames.length - 1; i >= 0; i--) {
      const frame = initFrames[i]!;
      if (frame.has(name)) {
        frame.set(name, value);
        return;
      }
    }
    // No declaring frame yet 
    // (only outer scope): record on the innermost frame.
    initFrames[initFrames.length - 1]!.set(name, value);
  }

  function walkExpression(expr: Expression, context: string): void {
    switch (expr.kind) {
      case "Literal":
        return;
      case "Variable":
        resolveVariable(expr.name, context, true);
        return;
      case "Grouping":
        walkExpression(expr.expression, context);
        return;
      case "Binary":
        walkExpression(expr.left, context);
        walkExpression(expr.right, context);
        return;
      default: {
        const _exhaustive: never = expr;
        return _exhaustive;
      }
    }
  }

  function walkBlock(block: BlockStatement, newScope: boolean): void {
    const outer = currentScope;
    if (newScope) {
      currentScope = createScope(outer);
      blockToScope.set(block, currentScope);
      initFrames.push(new Map());
    }
    for (const stmt of block.body) {
      walkStatement(stmt);
    }
    if (newScope) {
      currentScope = outer;
      initFrames.pop();
    }
  }

  function walkStatement(stmt: Statement): void {
    switch (stmt.kind) {
      case "VarDeclStatement": {
        const key = stmt.name.lexeme;
        if (currentScope.symbols.has(key)) {
          reportError(
            `Duplicate declaration of '${key}' in the same scope.`,
            stmt.name
          );
        } else {
          currentScope.symbols.set(key, {
            lexeme: key,
            typeName: stmt.typeName,
            line: stmt.name.line,
            column: stmt.name.column,
          });
          initFrames[initFrames.length - 1]!.set(key, false);
        }
        return;
      }
      case "AssignmentStatement": {
        resolveVariable(stmt.name, "assignment target", false);
        walkExpression(stmt.value, "assignment value");
        setInit(stmt.name.lexeme, true);
        return;
      }
      case "PrintStatement":
        walkExpression(stmt.expression, "print argument");
        return;
      case "ExpressionStatement":
        walkExpression(stmt.expression, "expression statement");
        return;
      case "BlockStatement":
        walkBlock(stmt, true);
        return;
      case "IfStatement": {
        walkExpression(stmt.condition, "if condition");
        walkBlock(stmt.body, true);
        return;
      }
      case "WhileStatement": {
        walkExpression(stmt.condition, "while condition");
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

  return { errors, rootScope, allScopes, blockToScope };
}
