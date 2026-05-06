import { describe, it, expect } from "vitest";
import { scanTokens } from "../../src/infra/compiler/lexer/scanTokens.lexer";
import { parse } from "../../src/infra/compiler/parser/parse.parser";
import { analyzeProgram } from "../../src/infra/compiler/semantic/scopeAnalyzer.semantic";
import { typecheckProgram } from "../../src/infra/compiler/semantic/typeChecker.semantic";

function typecheckSource(source: string) {
  const tokens = scanTokens(source);
  const { ast } = parse(tokens);
  const { rootScope, blockToScope } = analyzeProgram(ast);
  return typecheckProgram(ast, rootScope, blockToScope);
}

describe("typecheckProgram (Pass 2)", () => {
  it("accepts int addition assignment", () => {
    const pass2 = typecheckSource("{ int a a = 1 + 2 }$");
    expect(pass2.errors).toHaveLength(0);
  });

  it("rejects int + boolean for +", () => {
    const pass2 = typecheckSource("{ int a a = 1 + true }$");
    expect(pass2.errors.some((e) => e.message.includes("'+'"))).toBe(true);
  });

  it("rejects equality with mismatched operand types", () => {
    const pass2 = typecheckSource("{ boolean b b = (1 == true) }$");
    expect(pass2.errors.some((e) => e.message.includes("same type"))).toBe(true);
  });

  it("accepts equality with same operand types", () => {
    const pass2 = typecheckSource("{ boolean b b = (1 == 1) }$");
    expect(pass2.errors).toHaveLength(0);
  });

  it("rejects assigning boolean expression to int", () => {
    const pass2 = typecheckSource("{ int a a = (1 == 1) }$");
    expect(pass2.errors.some((e) => e.message.includes("Assignment type mismatch"))).toBe(true);
  });

  it("accepts while with boolean condition", () => {
    const pass2 = typecheckSource("{ while (1 == 1) { print(1) } }$");
    expect(pass2.errors).toHaveLength(0);
  });

  it("accepts if with boolean condition", () => {
    const pass2 = typecheckSource("{ if (1 == 1) { print(1) } }$");
    expect(pass2.errors).toHaveLength(0);
  });

  it("accepts string literal assignment", () => {
    const pass2 = typecheckSource('{ string s s = "hi" }$');
    expect(pass2.errors).toHaveLength(0);
  });
});
