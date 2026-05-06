import { describe, expect, it } from "vitest";
import { scanTokens } from "../../src/infra/compiler/lexer/scanTokens.lexer";
import { parse } from "../../src/infra/compiler/parser/parse.parser";
import { generate6502 } from "../../src/infra/compiler/codegen/index.codegen";
import { analyzeProgram } from "../../src/infra/compiler/semantic/scopeAnalyzer.semantic";
import { typecheckProgram } from "../../src/infra/compiler/semantic/typeChecker.semantic";

function codegenOk(source: string) {
  const tokens = scanTokens(source);
  const { ast } = parse(tokens);
  const sem = analyzeProgram(ast);
  const types = typecheckProgram(ast, sem.rootScope, sem.blockToScope);
  return generate6502(ast, sem, types);
}

describe("generate6502", () => {
  it("produces exactly 256 bytes and space-separated uppercase hex", () => {
    const { bytes, hex } = codegenOk("{ print(1) }$");
    expect(bytes).toHaveLength(256);
    const parts = hex.split(" ");
    expect(parts).toHaveLength(256);
    expect(parts.every((p) => /^[0-9A-F]{2}$/.test(p))).toBe(true);
  });

  it("refuses codegen when type errors exist", () => {
    const tokens = scanTokens("{ int a a = true }$");
    const { ast } = parse(tokens);
    const sem = analyzeProgram(ast);
    const types = typecheckProgram(ast, sem.rootScope, sem.blockToScope);
    expect(() => generate6502(ast, sem, types)).toThrow(/codegen skipped/);
  });

  it("emit print(1): LDY immediate 01 appears in code prefix", () => {
    const { bytes } = codegenOk("{ print(1) }$");
    const joined = bytes.slice(0, 80).map((b) => b.toString(16).padStart(2, "0")).join("");
    expect(joined).toContain("a001");
  });

  it("emit Sys FF after LDX for int print", () => {
    const { bytes } = codegenOk("{ print(2) }$");
    const idx = bytes.findIndex((b, i) => bytes[i] === 0xa2 && bytes[i + 1] === 0x01 && bytes[i + 2] === 0xff);
    expect(idx).toBeGreaterThanOrEqual(0);
  });

  it("interns duplicate string literals once (single NUL-terminated chunk on heap)", () => {
    const a = codegenOk('{ string s s = "ok" print(s) print(s) }$');
    const b = codegenOk('{ string s s = "ok" print(s) print(s) }$');
    expect(a.hex).toBe(b.hex);
    const okUtf8 = [0x6f, 0x6b, 0x00];
    let count = 0;
    for (let i = 0; i <= 256 - okUtf8.length; i++) {
      if (okUtf8.every((v, j) => a.bytes[i + j] === v)) count++;
    }
    expect(count).toBe(1);
  });

  it("sample block with int vars and prints fills 256-byte image", () => {
    const { bytes } = codegenOk("{ int a int b a = 1 b = 2 print(a) print(b) }$");
    expect(bytes).toHaveLength(256);
    expect(bytes.some((b) => b === 0x00)).toBe(true);
  });
});
