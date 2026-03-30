import type { Token } from "@shared/types/tokens.types";
import type { ParserState, Program } from "./parser.state";
import { parseProgram } from "./parser.parse";

/**
 * Parser Entry Point
 * @param tokens - The list of tokens to parse
 * @returns The parsed program
 */

export function parse(tokens: Token[]): Program {
  const state: ParserState = {
    tokens,
    current: 0,
    errors: [],
  };

  const program = parseProgram(state);

  if (state.errors.length > 0) {
    const first = state.errors[0];
    if (first) {
      throw new Error(
        `${first.message} (at line ${first.line}, column ${first.column})`
      );
    }
    throw new Error("Parse failed.");
  }

  return program;
}
