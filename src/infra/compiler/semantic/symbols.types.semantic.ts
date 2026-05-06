import type { BlockStatement, TypeName } from "@infra/compiler/parser/state.parser";

/**
 * One declared identifier in a scope (Pass 1: name + declared type + location).
 */
export interface SymbolEntry {
  lexeme: string;
  typeName: TypeName;
  line: number;
  column: number;
}

/**
 * A lexical scope: hash map of name → symbol, plus optional parent for lookup chain.
 */
export interface Scope {
  symbols: Map<string, SymbolEntry>;
  parent: Scope | null;
}

export interface SemanticError {
  severity: "error" | "warning";
  message: string;
  line: number;
  column: number;
}

export interface SemanticResult {
  errors: SemanticError[];
  /** Outermost program block scope (for debugging / later passes). */
  rootScope: Scope;
  /** All scopes created during Pass 1 (root first). */
  allScopes: Scope[];
  /**
   * Each `BlockStatement` that introduced a child scope maps to that scope.
   * The program's outer `{ ... }` uses `rootScope` directly (not in this map).
   */
  blockToScope: WeakMap<BlockStatement, Scope>;
}
