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

    // Initialization analysis: a variable that is declared but not definitely assigned
    // is still "in scope" but reading it is almost always a bug.
    if (checkInit) {
      const init = lookupInit(lexeme);
      if (init === false) {
        // Uninitialized strings are particularly dangerous in the lab VM:
        // strings are pointers into memory and printing a null/garbage pointer can crash.
        if (sym.typeName === "string") {
          reportError(`Use of uninitialized identifier '${lexeme}' (${context}).`, token);
        } else {
          reportWarning(`Use of uninitialized identifier '${lexeme}' (${context}).`, token);
        }
      }
    }
  }

  let currentScope: Scope = rootScope;

  // Track definite assignment per lexical scope frame.
  // - `false`: declared but not assigned in this scope chain
  // - `true`: definitely assigned (in this scope chain)
  // Note: we only need to track declared identifiers; unknown names are handled by `lookupSymbol`.
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
    // If not found (e.g. root-scope decl), treat as current frame.
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
          // Declared but not initialized yet.
          initFrames[initFrames.length - 1]!.set(key, false);
        }
        return;
      }
      case "AssignmentStatement": {
        // Writing to a variable is allowed even if it hasn't been initialized yet.
        resolveVariable(stmt.name, "assignment target", false);
        walkExpression(stmt.value, "assignment value");
        // After successfully typechecking the RHS syntactically, mark initialized.
        // Even if the RHS had undeclared variables, this matches "definite assignment"
        // semantics used by simple compilers (the variable now has some value).
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

  // Program body is the outermost block; one scope for that block (no extra wrapper).
  walkBlock(ast.body, false);

  return { errors, rootScope, allScopes, blockToScope };
}
