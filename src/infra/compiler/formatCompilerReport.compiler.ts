import type { Token } from "@shared/types/tokens.types";

export function formatCompilerReport(input: {
  tokens: Token[];
  cstString: string;
  ast: unknown;
  semanticErrors: { severity: string; message: string; line: number; column: number }[];
  typeErrors: { severity: string; message: string; line: number; column: number }[];
}): string {
  const lines: string[] = [];

  lines.push("== TOKENS ==");
  for (const t of input.tokens) lines.push(`${t.line}:${t.column} ${t.type} ${t.lexeme}`);

  lines.push("");
  lines.push("== CST ==");
  lines.push(input.cstString);

  lines.push("");
  lines.push("== AST ==");
  lines.push(JSON.stringify(input.ast, null, 2));

  lines.push("");
  lines.push("== SEMANTIC ==");
  if (input.semanticErrors.length === 0) lines.push("(none)");
  else {
    for (const e of input.semanticErrors) {
      lines.push(`${e.severity.toUpperCase()} ${e.line}:${e.column} ${e.message}`);
    }
  }

  lines.push("");
  lines.push("== TYPECHECK ==");
  if (input.typeErrors.length === 0) lines.push("(none)");
  else {
    for (const e of input.typeErrors) {
      lines.push(`${e.severity.toUpperCase()} ${e.line}:${e.column} ${e.message}`);
    }
  }

  return lines.join("\n");
}
