import { describe, it, expect } from "vitest";
import { scanTokens } from "../../src/infra/compiler/lexer/lexer";
import { TokenType } from "../../src/shared/types/tokens.types";

describe("scanTokens (sample program 1 — success)", () => {
  it("tokenizes sample with comment and many token types, ending with $", () => {
    const source = `{/* almost every token */ ()
print=whileif"intstring"
intstringbooleanfalse
true
==!=+ a 0123456789}$`;
    const tokens = scanTokens(source);
    const last = tokens[tokens.length - 1]!;
    expect(last.type).toBe(TokenType.EOF);
    expect(tokens.length).toBeGreaterThan(1);
    const types = tokens.slice(0, -1).map((t) => t.type);
    expect(types).toContain(TokenType.LEFT_BRACE);
    expect(types).toContain(TokenType.LEFT_PAREN);
    expect(types).toContain(TokenType.RIGHT_PAREN);
    expect(types).toContain(TokenType.PRINT);
    expect(types).toContain(TokenType.EQUAL);
    expect(types).toContain(TokenType.IDENTIFIER);
    expect(types).toContain(TokenType.STRING_LITERAL);
    expect(types).toContain(TokenType.TRUE);
    expect(types).toContain(TokenType.EQUAL_EQUAL);
    expect(types).toContain(TokenType.BANG_EQUAL);
    expect(types).toContain(TokenType.PLUS);
    expect(types).toContain(TokenType.NUMBER);
    expect(types).toContain(TokenType.RIGHT_BRACE);
  });
});
