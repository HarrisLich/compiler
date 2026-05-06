import { describe, it, expect } from "vitest";
import { scanTokens } from "../../src/infra/compiler/lexer/scanTokens.lexer";
import { parse } from "../../src/infra/compiler/parser/parse.parser";

describe("grammar conformance (reject invalid forms)", () => {
  it("lexer rejects string CharList with punctuation", () => {
    expect(() => scanTokens('"hello!"')).toThrow(/Invalid string contents/);
  });

  it("lexer rejects string CharList with digits", () => {
    expect(() => scanTokens('"a1"')).toThrow(/Invalid string contents/);
  });

  it("parser rejects bare equality inside print (must use ( Expr boolop Expr ))", () => {
    const tokens = scanTokens("{ print(1 == 1) }$");
    expect(() => parse(tokens)).toThrow();
  });

  it("parser rejects missing $ terminator", () => {
    const tokens = scanTokens("{ print(1) }");
    expect(() => parse(tokens)).toThrow(/\\$|end of program/i);
  });
});
