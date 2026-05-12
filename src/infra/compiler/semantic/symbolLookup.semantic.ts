import type { Scope, SymbolEntry } from "./symbols.types.semantic";

export function lookupSymbol(scope: Scope, lexeme: string): SymbolEntry | undefined {
  let s: Scope | null = scope;
  while (s !== null) {
    const hit = s.symbols.get(lexeme);
    if (hit) return hit;
    s = s.parent;
  }
  return undefined;
}
