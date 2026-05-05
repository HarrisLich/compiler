import type { Token } from "@shared/types/tokens.types";
import type { ParserState, Program } from "./parser.state";
import { parseProgram } from "./parser.parse";
import { createParseContext, cstRoot, cstString } from "./parser.cst";
import type { TreeNode } from "@infra/structs/tree/Tree.types";

/**
 * Parser Entry Point
 * @param tokens - The list of tokens to parse
 * @returns The parsed program
 */

export function parse(tokens: Token[]): { ast: Program; cst: TreeNode | null; cstString: string } {
  const state: ParserState = {
    tokens,
    current: 0,
    errors: [],
  };

  const ctx = createParseContext(state);
  const program = parseProgram(ctx);

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
