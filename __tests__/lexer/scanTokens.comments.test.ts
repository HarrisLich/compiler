import { describe, it, expect } from "vitest";
import { scanTokens } from "../../src/infra/compiler/lexer/lexer";

describe("scanTokens (block comments)", () => {
  it("ignores block comment and returns following token", () => {
    const tokens = scanTokens("/* comment */ +");
    expect(tokens.map((t) => t.type)).toEqual(["PLUS", "EOF"]);
  });

  it("ignores block comment between tokens", () => {
    const tokens = scanTokens("( /* x */ )");
    expect(tokens.map((t) => t.type)).toEqual([
      "LEFT_PAREN",
      "RIGHT_PAREN",
      "EOF",
    ]);
  });

  it("allows multi-line block comment", () => {
    const tokens = scanTokens("/* line1\nline2 */ 1");
    expect(tokens[0]).toMatchObject({ type: "NUMBER", literal: 1 });
    expect(tokens[1].type).toBe("EOF");
  });

  it("returns only EOF when source is only a comment", () => {
    const tokens = scanTokens("/* just a comment */");
    expect(tokens).toHaveLength(1);
    expect(tokens[0].type).toBe("EOF");
  });
});
