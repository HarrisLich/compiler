import type { Token, TokenType } from "@shared/types/tokens.types";

export interface ParserState {
  tokens: Token[];
  current: number;
  errors: ParserError[];
}

export interface ParserError {
  message: string;
  line: number;
  column: number;
  expected: TokenType | TokenType[];
  found: Token;
}

// --- AST: Program & Statements ---

export interface Program {
  kind: "Program";
  body: BlockStatement;
}

export type Statement =
  | PrintStatement
  | AssignmentStatement
  | VarDeclStatement
  | WhileStatement
  | IfStatement
  | BlockStatement
  | ExpressionStatement;

export interface PrintStatement {
  kind: "PrintStatement";
  expression: Expression;
}

export interface AssignmentStatement {
  kind: "AssignmentStatement";
  name: Token;
  value: Expression;
}

export type TypeName = "int" | "string" | "boolean";

export interface VarDeclStatement {
  kind: "VarDeclStatement";
  typeName: TypeName;
  name: Token;
}

export interface WhileStatement {
  kind: "WhileStatement";
  condition: Expression;
  body: BlockStatement;
}

export interface IfStatement {
  kind: "IfStatement";
  condition: Expression;
  body: BlockStatement;
}

export interface BlockStatement {
  kind: "BlockStatement";
  body: Statement[];
}

export interface ExpressionStatement {
  kind: "ExpressionStatement";
  expression: Expression;
}

// --- AST: Expressions ---

export type Expression = Literal | Binary | Grouping | Variable;

export interface Literal {
  kind: "Literal";
  value: number | string | boolean;
  token: Token;
}

export interface Binary {
  kind: "Binary";
  left: Expression;
  operator: Token;
  right: Expression;
}

export interface Grouping {
  kind: "Grouping";
  expression: Expression;
}

export interface Variable {
  kind: "Variable";
  name: Token;
}
