import { describe, it, expect } from "vitest";
import { scanTokens } from "../../src/infra/compiler/lexer/lexer";
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

  it("treats unknown words as IDENTIFIER", () => {
    const tokens = scanTokens("foo bar x");
    expect(tokens[0]).toMatchObject({ type: TokenType.IDENTIFIER, lexeme: "foo" });
    expect(tokens[1]).toMatchObject({ type: TokenType.IDENTIFIER, lexeme: "bar" });
    expect(tokens[2]).toMatchObject({ type: TokenType.IDENTIFIER, lexeme: "x" });
    expect(tokens[3].type).toBe(TokenType.EOF);
  });

  it("allows letters, digits, and underscore in identifiers", () => {
    const tokens = scanTokens("a1 _ab");
    expect(tokens[0]).toMatchObject({ type: TokenType.IDENTIFIER, lexeme: "a1" });
    expect(tokens[1]).toMatchObject({ type: TokenType.IDENTIFIER, lexeme: "_ab" });
  });

  it("mixes keywords and identifiers", () => {
    const tokens = scanTokens("if x print");
    expect(tokens[0].type).toBe(TokenType.IF);
    expect(tokens[1]).toMatchObject({ type: TokenType.IDENTIFIER, lexeme: "x" });
    expect(tokens[2].type).toBe(TokenType.PRINT);
  });
});
