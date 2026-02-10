import { describe, it, expect } from "vitest";
import { scanTokens } from "../../src/infra/compiler/lexer/lexer";

describe("scanTokens (basic)", () => {
  it("returns only EOF for empty source", () => {
    const tokens = scanTokens("");
    expect(tokens).toHaveLength(1);
    expect(tokens[0]).toMatchObject({ type: "EOF", lexeme: "" });
  });

  it("returns single punctuation tokens and EOF", () => {
    const tokens = scanTokens("( ) { } +");
    expect(tokens.map((t) => t.type)).toEqual([
      "LEFT_PAREN",
      "RIGHT_PAREN",
      "LEFT_BRACE",
      "RIGHT_BRACE",
      "PLUS",
      "EOF",
    ]);
  });

  it("records line and column on tokens", () => {
    const tokens = scanTokens("+");
    expect(tokens[0]).toMatchObject({
      type: "PLUS",
      line: 1,
      column: 1,
    });
    expect(tokens[1].type).toBe("EOF");
  });

  it("ignores whitespace and produces correct tokens", () => {
    const tokens = scanTokens("  (   )  ");
    expect(tokens.map((t) => t.type)).toEqual([
      "LEFT_PAREN",
      "RIGHT_PAREN",
      "EOF",
    ]);
  });
});
