import { describe, it, expect } from "vitest";
import { scanTokens } from "../../src/infra/compiler/lexer/lexer";

describe("scanTokens (errors)", () => {
  it("throws on unexpected character", () => {
    expect(() => scanTokens("@")).toThrow(/Unexpected character/);
    expect(() => scanTokens(";")).toThrow(/Unexpected character/);
    expect(() => scanTokens("#")).toThrow(/Unexpected character/);
  });

  it("throws on standalone !", () => {
    expect(() => scanTokens("!")).toThrow(/Unexpected character/);
  });

  it("throws on standalone /", () => {
    expect(() => scanTokens("/")).toThrow(/Unexpected character/);
  });

  it("throws on unterminated string", () => {
    expect(() => scanTokens('"hello')).toThrow(/Unterminated string/);
    expect(() => scanTokens('"')).toThrow(/Unterminated string/);
  });

  it("throws on unterminated block comment", () => {
    expect(() => scanTokens("/*")).toThrow(/Unterminated block comment/);
    expect(() => scanTokens("/* no end")).toThrow(/Unterminated block comment/);
  });

  it("error message includes line number", () => {
    expect(() => scanTokens('"\n\n@')).toThrow(/line 3/);
  });
});
