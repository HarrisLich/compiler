import { describe, it, expect } from "vitest";
import { scanTokens } from "../../src/infra/compiler/lexer/scanTokens.lexer";
import { parse } from "../../src/infra/compiler/parser/parse.parser";
import { analyzeProgram } from "../../src/infra/compiler/semantic/scopeAnalyzer.semantic";

function analyzeSource(source: string) {
  const tokens = scanTokens(source);
  const { ast } = parse(tokens);
  return analyzeProgram(ast);
}

describe("analyzeProgram (scope / symbol table)", () => {
  it("accepts nested block using outer declaration", () => {
    const { errors } = analyzeSource("{ int a { print(a) } }$");
    expect(errors.filter((e) => e.severity === "error")).toHaveLength(0);
  });

  it("reports duplicate declaration in the same block", () => {
    const { errors } = analyzeSource("{ int a int a }$");
    expect(errors.length).toBeGreaterThanOrEqual(1);
    expect(errors[0]?.message).toMatch(/Duplicate declaration/);
  });

  it("reports undeclared identifier on assignment", () => {
    const { errors } = analyzeSource("{ a = 1 }$");
    expect(errors.some((e) => e.message.includes("Undeclared"))).toBe(true);
  });

  it("reports use before declaration in statement order", () => {
    const { errors } = analyzeSource("{ print(a) int a }$");
    expect(errors.some((e) => e.message.includes("Undeclared"))).toBe(true);
  });

  it("allows shadowing in inner block", () => {
    const { errors } = analyzeSource("{ int a { int a a = 1 } print(a) }$");
    expect(errors.filter((e) => e.severity === "error")).toHaveLength(0);
  });

  it("while condition does not see body declarations", () => {
    const { errors } = analyzeSource("{ while (b == true) { int b } }$");
    expect(errors.some((e) => e.message.includes("Undeclared") && e.message.includes("b"))).toBe(
      true
    );
  });

  it("if condition does not see body declarations", () => {
    const { errors } = analyzeSource("{ if (b == true) { int b } }$");
    expect(errors.some((e) => e.message.includes("Undeclared") && e.message.includes("b"))).toBe(
      true
    );
  });

  it("stores symbols in root scope map", () => {
    const { rootScope, errors } = analyzeSource("{ int a int b }$");
    expect(errors.filter((e) => e.severity === "error")).toHaveLength(0);
    expect(rootScope.symbols.get("a")).toMatchObject({ lexeme: "a", typeName: "int" });
    expect(rootScope.symbols.get("b")).toMatchObject({ lexeme: "b", typeName: "int" });
  });
});
