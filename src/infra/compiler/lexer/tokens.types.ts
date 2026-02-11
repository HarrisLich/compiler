// TODO Lab 2 :: refactor to TokenSpecs which will include 3 properties: type, regex pattern, ignore ( for white spaces and block commens )

export type TokenType =
  | "PRINT"
  | "WHILE"
  | "IF"
  | "INT"
  | "STRING"
  | "BOOLEAN"
  | "TRUE"
  | "FALSE"
  | "IDENTIFIER"
  | "NUMBER"
  | "STRING_LITERAL"
  | "EQUAL"
  | "EQUAL_EQUAL"
  | "BANG_EQUAL"
  | "PLUS"
  | "LEFT_PAREN"
  | "RIGHT_PAREN"
  | "LEFT_BRACE"
  | "RIGHT_BRACE"
  | "EOF";

export interface Token {
  type: TokenType;
  lexeme: string;
  literal: number | string | null;
  line: number;
  column: number;
}
