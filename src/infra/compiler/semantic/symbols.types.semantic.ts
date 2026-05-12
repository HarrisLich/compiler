import type { BlockStatement, TypeName } from "@infra/compiler/parser/state.parser";

export interface SymbolEntry {
  lexeme: string;
  typeName: TypeName;
  line: number;
  column: number;
}

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
  rootScope: Scope;
  allScopes: Scope[];
  /** Inner blocks with their own scope; 
   * the outer program `{...}` uses `rootScope` only. */
  blockToScope: WeakMap<BlockStatement, Scope>;
}
