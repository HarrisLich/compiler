import { describe, it, expect } from "vitest";
import { scanTokens } from "../../src/infra/compiler/lexer/scanTokens.lexer";
import { TokenType } from "../../src/shared/types/tokens.types";

describe("scanTokens (operators and two-char tokens)", () => {
  it("tokenizes = and ==", () => {
    const tokens = scanTokens("= ==");
    expect(tokens[0]).toMatchObject({ type: TokenType.EQUAL, lexeme: "=" });
    expect(tokens[1]).toMatchObject({ type: TokenType.EQUAL_EQUAL, lexeme: "==" });
  });

  it("tokenizes != as BANG_EQUAL", () => {
    const tokens = scanTokens("!=");
    expect(tokens[0]).toMatchObject({ type: TokenType.BANG_EQUAL, lexeme: "!=" });
  });

  it("tokenizes expression with parens and plus", () => {
    const tokens = scanTokens("( 1 + 2 )");
    expect(tokens.map((t) => t.type)).toEqual([
      TokenType.LEFT_PAREN,
      TokenType.NUMBER,
      TokenType.PLUS,
      TokenType.NUMBER,
      TokenType.RIGHT_PAREN,
      TokenType.EOI,
    ]);
  });

  it("tokenizes print statement shape", () => {
    const tokens = scanTokens("print ( x )");
    expect(tokens.map((t) => t.type)).toEqual([
      TokenType.PRINT,
      TokenType.LEFT_PAREN,
      TokenType.IDENTIFIER,
      TokenType.RIGHT_PAREN,
      TokenType.EOI,
    ]);
  });
});
