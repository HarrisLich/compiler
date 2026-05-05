import { describe, it, expect } from "vitest";
import { scanTokens } from "../../src/infra/compiler/lexer/lexer";
import { parse } from "../../src/infra/compiler/parser/parser";

describe("parse", () => {
  it("parses print(1)$ as Program with one PrintStatement and Literal", () => {
    const tokens = scanTokens("{ print(1) }$");
    const program = parse(tokens).ast;
    expect(program.kind).toBe("Program");
    expect(program.body.kind).toBe("BlockStatement");
    expect(program.body.body).toHaveLength(1);
    const stmt = program.body.body[0];
    expect(stmt).not.toBeUndefined();
    expect(stmt!.kind).toBe("PrintStatement");
    if (stmt!.kind === "PrintStatement") {
      expect(stmt.expression.kind).toBe("Literal");
      if (stmt.expression.kind === "Literal") {
        expect(stmt.expression.value).toBe(1);
      }
    }
  });

  it("parses print(1+2)$ as Program with PrintStatement containing Binary", () => {
    const tokens = scanTokens("{ print(1+2) }$");
    const program = parse(tokens).ast;
    expect(program.kind).toBe("Program");
    expect(program.body.kind).toBe("BlockStatement");
    expect(program.body.body).toHaveLength(1);
    const stmt = program.body.body[0];
    expect(stmt).not.toBeUndefined();
    expect(stmt!.kind).toBe("PrintStatement");
    if (stmt!.kind === "PrintStatement") {
      expect(stmt.expression.kind).toBe("Binary");
      if (stmt.expression.kind === "Binary") {
        expect(stmt.expression.operator.lexeme).toBe("+");
        expect(stmt.expression.left.kind).toBe("Literal");
        expect(stmt.expression.right.kind).toBe("Literal");
      }
    }
  });

  it('parses print("x")$ as Program with string Literal', () => {
    const tokens = scanTokens('{ print("x") }$');
    const program = parse(tokens).ast;
    expect(program.kind).toBe("Program");
    expect(program.body.kind).toBe("BlockStatement");
    expect(program.body.body).toHaveLength(1);
    const stmt = program.body.body[0];
    expect(stmt).not.toBeUndefined();
    expect(stmt!.kind).toBe("PrintStatement");
    if (stmt!.kind === "PrintStatement") {
      expect(stmt.expression.kind).toBe("Literal");
      if (stmt.expression.kind === "Literal") {
        expect(stmt.expression.value).toBe("x");
      }
    }
  });

  it("throws on missing ')' after expression", () => {
    const tokens = scanTokens('{ print("hello"$');
    expect(() => parse(tokens)).toThrow(/Expected '\)'/);
  });

  it("throws when extra tokens appear before end of program", () => {
    const tokens = scanTokens("{ print(1) } + $");
    expect(() => parse(tokens)).toThrow(/Expected end of program/);
  });
});
