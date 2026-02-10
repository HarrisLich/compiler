import { describe, it, expect } from "vitest";
import { scanTokens } from "../../src/infra/compiler/lexer/lexer";

describe("scanTokens (literals)", () => {
  it("tokenizes integer numbers", () => {
    const tokens = scanTokens("0 42 999");
    expect(tokens[0]).toMatchObject({
      type: "NUMBER",
      lexeme: "0",
      literal: 0,
    });
    expect(tokens[1]).toMatchObject({
      type: "NUMBER",
      lexeme: "42",
      literal: 42,
    });
    expect(tokens[2]).toMatchObject({
      type: "NUMBER",
      lexeme: "999",
      literal: 999,
    });
  });

  it("tokenizes string literals", () => {
    const tokens = scanTokens('"hello"');
    expect(tokens[0]).toMatchObject({
      type: "STRING_LITERAL",
      lexeme: '"hello"',
      literal: "hello",
    });
  });

  it("tokenizes empty string", () => {
    const tokens = scanTokens('""');
    expect(tokens[0]).toMatchObject({
      type: "STRING_LITERAL",
      literal: "",
    });
  });

  it("tokenizes string with spaces", () => {
    const tokens = scanTokens('"a b c"');
    expect(tokens[0]).toMatchObject({
      type: "STRING_LITERAL",
      literal: "a b c",
    });
  });
});
