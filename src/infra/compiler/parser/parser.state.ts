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
  body: Statement[];
}

export type Statement = PrintStatement | ExpressionStatement;

export interface PrintStatement {
  kind: "PrintStatement";
  expression: Expression;
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
