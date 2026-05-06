import { describe, it, expect } from "vitest";
import { scanTokens } from "../../src/infra/compiler/lexer/scanTokens.lexer";
import { TokenType } from "../../src/shared/types/tokens.types";

describe("scanTokens (keywords and identifiers)", () => {
  it("recognizes all grammar keywords", () => {
    const source = "print while if int string boolean true false";
    const tokens = scanTokens(source);
    const types = tokens.slice(0, -1).map((t) => t.type);
    expect(types).toEqual([
      TokenType.PRINT,
      TokenType.WHILE,
      TokenType.IF,
      TokenType.INT,
      TokenType.STRING,
      TokenType.BOOLEAN,
      TokenType.TRUE,
      TokenType.FALSE,
    ]);
  });

  it("treats each lowercase letter as its own IDENTIFIER (Id ::= char)", () => {
    const tokens = scanTokens("x y z");
    expect(tokens[0]).toMatchObject({ type: TokenType.IDENTIFIER, lexeme: "x" });
    expect(tokens[1]).toMatchObject({ type: TokenType.IDENTIFIER, lexeme: "y" });
    expect(tokens[2]).toMatchObject({ type: TokenType.IDENTIFIER, lexeme: "z" });
    expect(tokens[3].type).toBe(TokenType.EOI);
  });

  it("tokenizes adjacent letters as separate single-char identifiers", () => {
    const tokens = scanTokens("ab");
    expect(tokens[0]).toMatchObject({ type: TokenType.IDENTIFIER, lexeme: "a" });
    expect(tokens[1]).toMatchObject({ type: TokenType.IDENTIFIER, lexeme: "b" });
    expect(tokens[2].type).toBe(TokenType.EOI);
  });

  it("throws on underscore (not in char ::= a..z)", () => {
    expect(() => scanTokens("_")).toThrow(/Unexpected character/);
  });

  it("mixes keywords and identifiers", () => {
    const tokens = scanTokens("if x print");
    expect(tokens[0].type).toBe(TokenType.IF);
    expect(tokens[1]).toMatchObject({ type: TokenType.IDENTIFIER, lexeme: "x" });
    expect(tokens[2].type).toBe(TokenType.PRINT);
  });
});
