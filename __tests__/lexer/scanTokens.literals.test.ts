import { describe, it, expect } from "vitest";
import { scanTokens } from "../../src/infra/compiler/lexer/scanTokens.lexer";
import { TokenType } from "../../src/shared/types/tokens.types";

describe("scanTokens (literals)", () => {
  it("tokenizes each digit as its own NUMBER token (digit is a single character)", () => {
    const tokens = scanTokens("0 42 999");
    expect(tokens[0]).toMatchObject({
      type: TokenType.NUMBER,
      lexeme: "0",
      literal: 0,
    });
    expect(tokens[1]).toMatchObject({
      type: TokenType.NUMBER,
      lexeme: "4",
      literal: 4,
    });
    expect(tokens[2]).toMatchObject({
      type: TokenType.NUMBER,
      lexeme: "2",
      literal: 2,
    });
    expect(tokens[3]).toMatchObject({
      type: TokenType.NUMBER,
      lexeme: "9",
      literal: 9,
    });
    expect(tokens[4]).toMatchObject({
      type: TokenType.NUMBER,
      lexeme: "9",
      literal: 9,
    });
    expect(tokens[5]).toMatchObject({
      type: TokenType.NUMBER,
      lexeme: "9",
      literal: 9,
    });
    expect(tokens[6].type).toBe(TokenType.EOI);
  });

  it("tokenizes string literals", () => {
    const tokens = scanTokens('"hello"');
    expect(tokens[0]).toMatchObject({
      type: TokenType.STRING_LITERAL,
      lexeme: '"hello"',
      literal: "hello",
    });
  });

  it("tokenizes empty string", () => {
    const tokens = scanTokens('""');
    expect(tokens[0]).toMatchObject({
      type: TokenType.STRING_LITERAL,
      literal: "",
    });
  });

  it("tokenizes string with spaces", () => {
    const tokens = scanTokens('"a b c"');
    expect(tokens[0]).toMatchObject({
      type: TokenType.STRING_LITERAL,
      literal: "a b c",
    });
  });

  it("rejects slash and star inside strings (CharList is only a-z and space)", () => {
    expect(() => scanTokens('"hello /* comment */ world"')).toThrow(/Invalid string contents/);
  });
});
