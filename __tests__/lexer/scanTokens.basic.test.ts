import { describe, it, expect } from "vitest";
import { scanTokens } from "../../src/infra/compiler/lexer/lexer";
import { TokenType } from "../../src/shared/types/tokens.types";

describe("scanTokens (basic)", () => {
  it("returns only EOF for empty source", () => {
    const tokens = scanTokens("");
    expect(tokens).toHaveLength(1);
    expect(tokens[0]).toMatchObject({ type: TokenType.EOF, lexeme: "" });
  });

  it("returns single punctuation tokens and EOF", () => {
    const tokens = scanTokens("( ) { } +");
    expect(tokens.map((t) => t.type)).toEqual([
      TokenType.LEFT_PAREN,
      TokenType.RIGHT_PAREN,
      TokenType.LEFT_BRACE,
      TokenType.RIGHT_BRACE,
      TokenType.PLUS,
      TokenType.EOF,
    ]);
  });

  it("records line and column on tokens", () => {
    const tokens = scanTokens("+");
    expect(tokens[0]).toMatchObject({
      type: TokenType.PLUS,
      line: 1,
      column: 1,
    });
    expect(tokens[1].type).toBe(TokenType.EOF);
  });

  it("ignores whitespace and produces correct tokens", () => {
    const tokens = scanTokens("  (   )  ");
    expect(tokens.map((t) => t.type)).toEqual([
      TokenType.LEFT_PAREN,
      TokenType.RIGHT_PAREN,
      TokenType.EOF,
    ]);
  });
});
