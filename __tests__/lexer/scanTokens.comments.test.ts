import { describe, it, expect } from "vitest";
import { scanTokens } from "../../src/infra/compiler/lexer/scanTokens.lexer";
import { TokenType } from "../../src/shared/types/tokens.types";

describe("scanTokens (block comments)", () => {
  it("ignores block comment and returns following token", () => {
    const tokens = scanTokens("/* comment */ +");
    expect(tokens.map((t) => t.type)).toEqual([TokenType.PLUS, TokenType.EOI]);
  });

  it("ignores block comment between tokens", () => {
    const tokens = scanTokens("( /* x */ )");
    expect(tokens.map((t) => t.type)).toEqual([
      TokenType.LEFT_PAREN,
      TokenType.RIGHT_PAREN,
      TokenType.EOI,
    ]);
  });

  it("allows multi-line block comment", () => {
    const tokens = scanTokens("/* line1\nline2 */ 1");
    expect(tokens[0]).toMatchObject({ type: TokenType.NUMBER, literal: 1 });
    expect(tokens[1].type).toBe(TokenType.EOI);
  });

  it("returns only EOF when source is only a comment", () => {
    const tokens = scanTokens("/* just a comment */");
    expect(tokens).toHaveLength(1);
    expect(tokens[0].type).toBe(TokenType.EOI);
  });
});
