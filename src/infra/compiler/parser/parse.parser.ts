import type { Token } from "@shared/types/tokens.types";
import type { ParserState, Program } from "./state.parser";
import { parseProgram } from "./parseProgram.parser";
import { createParseContext, cstRoot, cstString } from "./cst.parser";
import type { TreeNode } from "@infra/structs/tree/Tree.types";
import { TokenType } from "@shared/types/tokens.types";

export function parse(tokens: Token[]): { ast: Program; cst: TreeNode | null; cstString: string } {
  const state: ParserState = {
    tokens,
    current: 0,
    errors: [],
  };

  const ctx = createParseContext(state);
  let program: Program;
  try {
    program = parseProgram(ctx);
  } catch (e) {
    const first = state.errors[0];
    if (first) {
      const expected = Array.isArray(first.expected) ? first.expected : [first.expected];
      const expectedStr = expected.join(" | ");
      const found = first.found.type === TokenType.EOI ? "end of input" : `${first.found.type} '${first.found.lexeme}'`;
      throw new Error(`${first.message} (expected ${expectedStr}, found ${found} at line ${first.line}, column ${first.column})`);
    }
    throw e;
  }

  if (state.errors.length > 0) {
    const first = state.errors[0];
    if (first) {
      throw new Error(
        `${first.message} (at line ${first.line}, column ${first.column})`
      );
    }
    throw new Error("Parse failed.");
  }

  return { ast: program, cst: cstRoot(ctx), cstString: cstString(ctx) };
}
