import { describe, it, expect } from "vitest";
import { scanTokens } from "../../src/infra/compiler/lexer/lexer";

describe("scanTokens (operators and two-char tokens)", () => {
  it("tokenizes = and ==", () => {
    const tokens = scanTokens("= ==");
    expect(tokens[0]).toMatchObject({ type: "EQUAL", lexeme: "=" });
    expect(tokens[1]).toMatchObject({ type: "EQUAL_EQUAL", lexeme: "==" });
  });

  it("tokenizes != as BANG_EQUAL", () => {
    const tokens = scanTokens("!=");
    expect(tokens[0]).toMatchObject({ type: "BANG_EQUAL", lexeme: "!=" });
  });

  it("tokenizes expression with parens and plus", () => {
    const tokens = scanTokens("( 1 + 2 )");
    expect(tokens.map((t) => t.type)).toEqual([
      "LEFT_PAREN",
      "NUMBER",
      "PLUS",
      "NUMBER",
      "RIGHT_PAREN",
      "EOF",
    ]);
  });

  it("tokenizes print statement shape", () => {
    const tokens = scanTokens("print ( x )");
    expect(tokens.map((t) => t.type)).toEqual([
      "PRINT",
      "LEFT_PAREN",
      "IDENTIFIER",
      "RIGHT_PAREN",
      "EOF",
    ]);
  });
});
