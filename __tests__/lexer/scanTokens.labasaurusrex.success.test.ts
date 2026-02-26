import { describe, it, expect } from "vitest";
import { scanTokens } from "../../src/infra/compiler/lexer/lexer";

describe("scanTokens (sample program 1 — success)", () => {
  it("tokenizes sample with comment and many token types, ending with $", () => {
    const source = `{/* almost every token */ ()
print=whileif"intstring"
intstringbooleanfalse
true
==!=+ a 0123456789}$`;
    const tokens = scanTokens(source);
    const last = tokens[tokens.length - 1]!;
    expect(last.type).toBe("EOF");
    expect(tokens.length).toBeGreaterThan(1);
    const types = tokens.slice(0, -1).map((t) => t.type);
    expect(types).toContain("LEFT_BRACE");
    expect(types).toContain("LEFT_PAREN");
    expect(types).toContain("RIGHT_PAREN");
    expect(types).toContain("PRINT");
    expect(types).toContain("EQUAL");
    expect(types).toContain("IDENTIFIER");
    expect(types).toContain("STRING_LITERAL");
    expect(types).toContain("TRUE");
    expect(types).toContain("EQUAL_EQUAL");
    expect(types).toContain("BANG_EQUAL");
    expect(types).toContain("PLUS");
    expect(types).toContain("NUMBER");
    expect(types).toContain("RIGHT_BRACE");
  });
});
