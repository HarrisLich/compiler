import { describe, it, expect } from "vitest";
import { scanTokens } from "../../src/infra/compiler/lexer/scanTokens.lexer";
import { parse } from "../../src/infra/compiler/parser/parse.parser";
import type {
  Expression,
  Program,
  Statement,
} from "../../src/infra/compiler/parser/state.parser";

function assertExpression(expr: Expression): void {
  switch (expr.kind) {
    case "Literal": {
      expect(["number", "string", "boolean"]).toContain(typeof expr.value);
      expect(expr.token).toBeTruthy();
      return;
    }
    case "Variable": {
      expect(expr.name.type).toBeTruthy();
      return;
    }
    case "Grouping": {
      assertExpression(expr.expression);
      return;
    }
    case "Binary": {
      assertExpression(expr.left);
      assertExpression(expr.right);
      expect(expr.operator).toBeTruthy();
      return;
    }
    default: {
      throw new Error(
        `Unhandled Expression kind: ${(expr as unknown as { kind?: string }).kind}`
      );
    }
  }
}

function assertStatement(stmt: Statement): void {
  switch (stmt.kind) {
    case "PrintStatement": {
      assertExpression(stmt.expression);
      return;
    }
    case "AssignmentStatement": {
      expect(stmt.name.type).toBeTruthy();
      assertExpression(stmt.value);
      return;
    }
    case "VarDeclStatement": {
      expect(["int", "string", "boolean"]).toContain(stmt.typeName);
      expect(stmt.name.type).toBeTruthy();
      return;
    }
    case "IfStatement": {
      assertExpression(stmt.condition);
      assertStatement(stmt.body);
      return;
    }
    case "WhileStatement": {
      assertExpression(stmt.condition);
      assertStatement(stmt.body);
      return;
    }
    case "BlockStatement": {
      for (const s of stmt.body) assertStatement(s);
      return;
    }
    case "ExpressionStatement": {
      assertExpression(stmt.expression);
      return;
    }
    default: {
      throw new Error(
        `Unhandled Statement kind: ${(stmt as unknown as { kind?: string }).kind}`
      );
    }
  }
}

function assertProgram(program: Program): void {
  expect(program.kind).toBe("Program");
  assertStatement(program.body);
}

type Case = { name: string; source: string };

// Note: these cases are intended to validate parse success + AST shape.
// They do not validate runtime semantics (e.g. whether loops execute).
const CASES: Case[] = [
  // SECTION 1
  { name: "1.1 empty block", source: "{}$" },
  { name: "1.2 single print digit", source: "{ print(1) }$" },
  { name: "1.3 single print string", source: '{ print("hello") }$' },
  { name: "1.4 single print bool", source: "{ print(true) }$" },
  { name: "1.5 single var decl", source: "{ int a }$" },

  // SECTION 2
  { name: "2.1 declare each type", source: "{ int a string b boolean c }$" },
  { name: "2.2 multiple int decls", source: "{ int a int b int c int d }$" },
  { name: "2.3 multiple string decls", source: "{ string a string b string c }$" },
  { name: "2.4 multiple boolean decls", source: "{ boolean a boolean b }$" },
  {
    name: "2.5 mixed decls",
    source: "{ int a boolean b string c int d string e boolean f }$",
  },

  // SECTION 3
  { name: "3.1 assign digit", source: "{ int a a = 5 }$" },
  { name: "3.2 assign string", source: '{ string a a = "hello" }$' },
  { name: "3.3 assign true", source: "{ boolean a a = true }$" },
  { name: "3.4 assign false", source: "{ boolean a a = false }$" },
  { name: "3.5 assign addition", source: "{ int a a = 1 + 2 }$" },
  { name: "3.6 assign chained addition", source: "{ int a a = 1 + 2 + 3 }$" },
  { name: "3.7 assign another id", source: "{ int a int b a = 5 b = a }$" },
  { name: "3.8 assign boolean expr ==", source: "{ boolean a a = (1 == 1) }$" },
  { name: "3.9 assign boolean expr !=", source: "{ boolean a a = (1 != 2) }$" },
  {
    name: "3.10 reassign multiple times",
    source: "{ int a a = 1 a = 2 a = 3 a = 9 }$",
  },

  // SECTION 4
  {
    name: "4.1 print each digit",
    source:
      "{ print(0) print(1) print(2) print(3) print(4) print(5) print(6) print(7) print(8) print(9) }$",
  },
  {
    name: "4.2 print strings",
    source: '{ print("hello") print("world") print("a") print("hello world") }$',
  },
  { name: "4.3 print boolvals", source: "{ print(true) print(false) }$" },
  { name: "4.4 print addition", source: "{ print(1 + 2) }$" },
  { name: "4.5 print chained addition", source: "{ print(1 + 2 + 3 + 4) }$" },
  { name: "4.6 print variable", source: "{ int a a = 7 print(a) }$" },
  {
    name: "4.7 print boolean exprs",
    source: "{ print((1 == 1)) print((1 != 2)) }$",
  },
  { name: "4.8 print string comparison", source: '{ print(("abc" == "abc")) }$' },
  {
    name: "4.9 print bool comparisons",
    source: "{ print((true == false)) print((false != true)) }$",
  },
  { name: "4.10 print empty string", source: '{ print("") }$' },
  { name: "4.11 print string spaces", source: '{ print("the quick brown fox") }$' },

  // SECTION 5
  { name: "5.1 single digit assign", source: "{ int a a = 0 }$" },
  { name: "5.2 digit + digit", source: "{ int a a = 3 + 4 print(a) }$" },
  { name: "5.3 chain addition", source: "{ int a a = 1 + 1 + 1 print(a) }$" },
  { name: "5.4 long chain", source: "{ int a a = 1 + 2 + 3 + 4 + 5 print(a) }$" },
  { name: "5.5 print chained expression", source: "{ print(9 + 1) }$" },
  { name: "5.6 digit added to id", source: "{ int a int b a = 5 b = 3 + a print(b) }$" },

  // SECTION 6
  { name: "6.1 empty string", source: '{ string a a = "" }$' },
  { name: "6.2 single char string", source: '{ string a a = "z" print(a) }$' },
  { name: "6.3 multi-char string", source: '{ string a a = "hello" print(a) }$' },
  { name: "6.4 string with spaces", source: '{ string a a = "hello world" print(a) }$' },
  {
    name: "6.5 all lowercase letters",
    source: '{ string a a = "abcdefghijklmnopqrstuvwxyz" print(a) }$',
  },
  {
    name: "6.6 compare string vars",
    source: '{ string a string b a = "hi" b = "hi" print((a == b)) }$',
  },

  // SECTION 7
  { name: "7.1 bool true", source: "{ boolean a a = true print(a) }$" },
  { name: "7.2 bool false", source: "{ boolean a a = false print(a) }$" },
  { name: "7.3 digit == digit", source: "{ boolean a a = (1 == 1) print(a) }$" },
  { name: "7.4 digit != digit", source: "{ boolean a a = (2 != 3) print(a) }$" },
  { name: "7.5 nested boolean expr", source: "{ boolean a a = ((1 == 1) == true) print(a) }$" },
  { name: "7.6 compare ids", source: "{ int a int b a = 3 b = 3 print((a == b)) }$" },
  { name: "7.7 compare id to digit", source: "{ int a a = 5 print((a == 5)) }$" },
  { name: "7.8 compare id to boolval", source: "{ boolean a a = true print((a == true)) }$" },
  { name: "7.9 deeply nested boolean expr", source: "{ boolean a a = ((1 == 1) == (2 != 3)) print(a) }$" },

  // SECTION 8
  { name: "8.1 if true", source: '{ if true { print("yes") } }$' },
  { name: "8.2 if false", source: '{ if false { print("no") } }$' },
  { name: "8.3 if (1==1)", source: '{ if (1 == 1) { print("one equals one") } }$' },
  { name: "8.4 if (1==2)", source: '{ if (1 == 2) { print("unreachable") } }$' },
  {
    name: "8.5 if variable condition",
    source: '{ boolean a a = true if (a == true) { print("a is true") } }$',
  },
  {
    name: "8.6 if != condition",
    source: '{ int a a = 5 if (a != 3) { print("a is not three") } }$',
  },
  { name: "8.7 if body has decl/assign/print", source: "{ if true { int x x = 9 print(x) } }$" },
  {
    name: "8.8 nested if",
    source: '{ if true { if (1 == 1) { print("nested true") } } }$',
  },
  {
    name: "8.9 sequential ifs",
    source:
      '{ int a a = 3 if (a == 3) { print("three") } if (a != 4) { print("not four") } }$',
  },
  {
    name: "8.10 if comparing vars",
    source: '{ int a int b a = 2 b = 2 if (a == b) { print("equal") } }$',
  },
  {
    name: "8.11 if with many statements",
    source:
      '{ int a a = 4 if (a == 4) { int b b = 7 print(a) print(b) print("done") } }$',
  },
  { name: "8.12 if with nested BooleanExpr condition", source: '{ if ((1 == 1) == true) { print("complex condition passed") } }$' },

  // SECTION 9
  { name: "9.1 while false", source: '{ while false { print("never") } }$' },
  { name: "9.2 while (1==2)", source: '{ while (1 == 2) { print("unreachable") } }$' },
  {
    name: "9.3 while variable condition",
    source: "{ int a a = 0 while (a == 0) { print(a) a = 1 } }$",
  },
  {
    name: "9.4 while counting up",
    source: '{ int a a = 0 while (a != 5) { print(a) a = 1 + a } }$',
  },
  {
    name: "9.5 while with decls inside",
    source: "{ int a a = 1 while (a == 1) { int b b = 9 print(b) a = 2 } }$",
  },
  {
    name: "9.6 while with nested if",
    source: '{ int a a = 0 while (a != 3) { if (a == 0) { print("zero") } a = 1 + a } }$',
  },
  {
    name: "9.7 nested while loops",
    source:
      '{ int a a = 0 while (a != 2) { int b b = 0 while (b != 2) { print("inner") b = 1 + b } a = 1 + a } }$',
  },
  {
    name: "9.8 while with string variable inside",
    source:
      '{ int a a = 0 while (a != 2) { string s s = "looping" print(s) a = 1 + a } }$',
  },
  {
    name: "9.9 while with boolean condition",
    source:
      '{ boolean d d = false while (d != true) { print("not done") d = true } }$',
  },
  {
    name: "9.10 while true single iteration via mutation",
    source: '{ boolean g g = true while (g == true) { print("once") g = false } }$',
  },

  // SECTION 10
  {
    name: "10.1 nested block inside outer",
    source: "{ int a a = 1 { int b b = 2 print(b) } print(a) }$",
  },
  {
    name: "10.2 multiple nested blocks same depth",
    source: "{ { int a a = 1 print(a) } { int a a = 2 print(a) } }$",
  },
  {
    name: "10.3 three levels nesting",
    source: "{ int a a = 1 { int b b = 2 { int c c = 3 print(c) } print(b) } print(a) }$",
  },
  {
    name: "10.4 shadowing inner scope",
    source: "{ int a a = 5 { int a a = 9 print(a) } print(a) }$",
  },
  {
    name: "10.5 deeply nested scopes",
    source: "{ int a a = 0 { { { { int b b = 7 print(b) } } } } print(a) }$",
  },
  {
    name: "10.6 if body scope boundary",
    source: "{ int a a = 3 if (a == 3) { int b b = 4 print(b) } print(a) }$",
  },
  {
    name: "10.7 while scope focused",
    source: "{ int i i = 0 while (i != 3) { int x x = 5 print(x) i = 1 + i } }$",
  },
  {
    name: "10.8 sibling scopes redeclare",
    source:
      '{ { string s s = "first" print(s) } { string s s = "second" print(s) } { string s s = "third" print(s) } }$',
  },
  {
    name: "10.9 inner scope accesses outer",
    source: "{ int a a = 7 { print(a) { print(a) } } }$",
  },
  {
    name: "10.10 outer decl inner assignment",
    source: "{ int a a = 1 { a = 2 print(a) } print(a) }$",
  },

  // SECTION 11
  {
    name: "11.1 declare assign print types",
    source:
      '{ int a string b boolean c a = 4 b = "hello" c = true print(a) print(b) print(c) }$',
  },
  {
    name: "11.2 if inside while",
    source:
      '{ int a a = 0 while (a != 5) { if (a == 3) { print("three") } a = 1 + a } }$',
  },
  {
    name: "11.3 while inside if",
    source:
      "{ boolean g g = true if (g == true) { int i i = 0 while (i != 3) { print(i) i = 1 + i } } }$",
  },
  {
    name: "11.4 arithmetic in print inside if",
    source: "{ int a a = 3 if (a == 3) { print(1 + 2 + 3) } }$",
  },
  {
    name: "11.5 boolean tracks state across while",
    source:
      '{ boolean f int n f = false n = 0 while (f != true) { if (n == 5) { f = true print("found at five") } n = 1 + n } print(n) }$',
  },
  {
    name: "11.6 nested whiles with if inside",
    source:
      '{ int i int j i = 0 while (i != 3) { j = 0 while (j != 3) { if (i == j) { print("diagonal") } j = 1 + j } i = 1 + i } }$',
  },
  {
    name: "11.7 string comparison in while condition",
    source:
      '{ string s s = "no" while (s != "yes") { print("waiting") s = "yes" } print("done") }$',
  },
  {
    name: "11.8 chained if logic",
    source:
      '{ int a a = 2 if (a == 1) { print("one") } if (a == 2) { print("two") } if (a == 3) { print("three") } }$',
  },
  {
    name: "11.9 complex expression as print argument",
    source: "{ int a int b a = 2 b = 3 print((a == b)) print((a != b)) }$",
  },
  {
    name: "11.10 while with if containing block",
    source:
      '{ int a a = 0 while (a != 4) { if (a != 2) { { print("not two") } } a = 1 + a } }$',
  },
  {
    name: "11.11 print every iteration value",
    source: "{ int n n = 0 while (n != 9) { print(n) n = 1 + n } print(n) }$",
  },
  {
    name: "11.12 accumulate with IntExpr chain",
    source: "{ int a a = 0 a = 1 + a a = 1 + a a = 1 + a print(a) }$",
  },
  {
    name: "11.13 nested scopes with while and if",
    source:
      "{ int a a = 0 { int b b = 0 while (b != 2) { if (a == 0) { { int c c = 5 print(c) } } b = 1 + b } } print(a) }$",
  },
  {
    name: "11.14 while comparing ids",
    source: "{ int a int b a = 0 b = 5 while (a != b) { print(a) a = 1 + a } }$",
  },
  { name: "11.15 print nested BooleanExpr result", source: "{ int a a = 3 print(((a == 3) == true)) }$" },

  // SECTION 12
  { name: "12.1 empty block (comments-only in original)", source: "{ }$" },
  { name: "12.2 single char strings", source: '{ print("a") print("b") print("z") }$' },
  { name: "12.3 digit 0 edge", source: "{ int a a = 0 print(a) }$" },
  { name: "12.4 digit 9 edge", source: "{ int a a = 9 print(a) }$" },
  {
    name: "12.5 many single-char ids",
    source:
      "{ int a int b int c int d int e a = 1 b = 2 c = 3 d = 4 e = 5 print(a) print(b) print(c) print(d) print(e) }$",
  },
  { name: "12.6 string == string", source: '{ print(("hello" == "hello")) }$' },
  { name: "12.7 string != string", source: '{ print(("hello" != "world")) }$' },
  {
    name: "12.8 assign bool expr, then if",
    source: '{ boolean r r = (3 == 3) if (r == true) { print("r is true") } }$',
  },
  {
    name: "12.9 long chained addition",
    source:
      "{ int a a = 1 + 1 + 1 + 1 + 1 + 1 + 1 + 1 + 1 print(a) }$",
  },
  { name: "12.10 print string with spaces", source: '{ print("a b c d e") }$' },
  {
    name: "12.11 while never runs",
    source:
      '{ int a a = 5 while (a == 0) { print("never") a = 1 + a } print("done") }$',
  },
  {
    name: "12.12 if condition using ids",
    source: '{ int a int b a = 4 b = 4 if (a == b) { print("match") } }$',
  },

  // SECTION 13 (comment handling is lexer-level; include real comments)
  { name: "13.1 comment before program", source: '/* this is a comment */ { print("after comment") }$' },
  {
    name: "13.2 comment inside block",
    source: '{ /* declare x */ int x x = 5 /* print x */ print(x) }$',
  },
  { name: "13.3 multiple comments", source: '{ /* one */ /* two */ /* three */ print("hi") }$' },
  {
    name: "13.4 comment with code on same conceptual line",
    source: "{ int a /* declare a */ a = 7 /* assign 7 */ print(a) /* print it */ }$",
  },
];

describe("parse (grammar suite)", () => {
  for (const c of CASES) {
    it(c.name, () => {
      const tokens = scanTokens(c.source);
      const program = parse(tokens).ast;
      assertProgram(program);
    });
  }
});

