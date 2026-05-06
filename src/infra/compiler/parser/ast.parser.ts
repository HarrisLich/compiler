import type { Token } from "@shared/types/tokens.types";
import type {
  AssignmentStatement,
  Binary,
  BlockStatement,
  Expression,
  Grouping,
  IfStatement,
  Literal,
  PrintStatement,
  Program,
  Statement,
  TypeName,
  VarDeclStatement,
  Variable,
  WhileStatement,
} from "./state.parser";

export function makeProgram(body: BlockStatement): Program {
  return { kind: "Program", body };
}

export function makeBlock(body: Statement[]): BlockStatement {
  return { kind: "BlockStatement", body };
}

export function makePrintStatement(expression: Expression): PrintStatement {
  return { kind: "PrintStatement", expression };
}

export function makeAssignmentStatement(name: Token, value: Expression): AssignmentStatement {
  return { kind: "AssignmentStatement", name, value };
}

export function makeVarDeclStatement(typeName: TypeName, name: Token): VarDeclStatement {
  return { kind: "VarDeclStatement", typeName, name };
}

export function makeIfStatement(condition: Expression, body: BlockStatement): IfStatement {
  return { kind: "IfStatement", condition, body };
}

export function makeWhileStatement(condition: Expression, body: BlockStatement): WhileStatement {
  return { kind: "WhileStatement", condition, body };
}

export function makeExpressionStatement(expression: Expression) {
  return { kind: "ExpressionStatement" as const, expression };
}

export function makeLiteral(token: Token, value: number | string | boolean): Literal {
  return { kind: "Literal", token, value };
}

export function makeVariable(name: Token): Variable {
  return { kind: "Variable", name };
}

export function makeGrouping(expression: Expression): Grouping {
  return { kind: "Grouping", expression };
}

export function makeBinary(left: Expression, operator: Token, right: Expression): Binary {
  return { kind: "Binary", left, operator, right };
}
