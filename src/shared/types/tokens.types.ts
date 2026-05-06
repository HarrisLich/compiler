export enum TokenType {
  PRINT = "PRINT",
  WHILE = "WHILE",
  IF = "IF",
  INT = "INT",
  STRING = "STRING",
  BOOLEAN = "BOOLEAN",
  TRUE = "TRUE",
  FALSE = "FALSE",
  IDENTIFIER = "IDENTIFIER",
  NUMBER = "NUMBER",
  STRING_LITERAL = "STRING_LITERAL",
  EQUAL = "EQUAL",
  EQUAL_EQUAL = "EQUAL_EQUAL",
  BANG_EQUAL = "BANG_EQUAL",
  PLUS = "PLUS",
  LEFT_PAREN = "LEFT_PAREN",
  RIGHT_PAREN = "RIGHT_PAREN",
  LEFT_BRACE = "LEFT_BRACE",
  RIGHT_BRACE = "RIGHT_BRACE",
  EOF = "EOF",
  /** End-of-input sentinel appended by lexer (not part of grammar). */
  EOI = "EOI",

  /** Ignore-only token specs (lexer does not emit these) */
  WHITESPACE = "WHITESPACE",
  BLOCK_COMMENT = "BLOCK_COMMENT",
}

export interface Token {
  type: TokenType;
  lexeme: string;
  literal: number | string | null;
  line: number;
  column: number;
}

export interface TokenSpec {
  type: TokenType;
  pattern: RegExp;
  ignore?: boolean;
}

const regex = (pattern: string) => new RegExp(pattern);

/** ORDER MATTERS - FIRST MATCH WINS */
export const TOKEN_SPECS: TokenSpec[] = [
  { type: TokenType.EQUAL_EQUAL, pattern: regex("^==") },
  { type: TokenType.BANG_EQUAL, pattern: regex("^!=") },
  { type: TokenType.EQUAL, pattern: regex("^=") },
  { type: TokenType.PLUS, pattern: regex("^\\+") },
  { type: TokenType.LEFT_PAREN, pattern: regex("^\\(") },
  { type: TokenType.RIGHT_PAREN, pattern: regex("^\\)") },
  { type: TokenType.LEFT_BRACE, pattern: regex("^\\{") },
  { type: TokenType.RIGHT_BRACE, pattern: regex("^\\}") },
  { type: TokenType.EOF, pattern: regex("^\\$") },
  { type: TokenType.PRINT, pattern: regex("^print") },
  { type: TokenType.WHILE, pattern: regex("^while") },
  { type: TokenType.IF, pattern: regex("^if") },
  { type: TokenType.INT, pattern: regex("^int") },
  { type: TokenType.STRING, pattern: regex("^string") },
  { type: TokenType.BOOLEAN, pattern: regex("^boolean") },
  { type: TokenType.TRUE, pattern: regex("^true") },
  { type: TokenType.FALSE, pattern: regex("^false") },
  /** Id ::= char; char ::= a..z (exactly one lowercase letter per token) */
  { type: TokenType.IDENTIFIER, pattern: regex("^[a-z]") },
  /** digit ::= 0..9 (single digit per token; multi-digit ints use digit + digit ...) */
  { type: TokenType.NUMBER, pattern: regex("^[0-9]") },
  { type: TokenType.STRING_LITERAL, pattern: regex('^"([\\s\\S]*?)"') },
  { type: TokenType.WHITESPACE, pattern: regex("^\\s+"), ignore: true },
  {
    type: TokenType.BLOCK_COMMENT,
    pattern: regex("^/\\*[\\s\\S]*?\\*/"),
    ignore: true,
  },
];
