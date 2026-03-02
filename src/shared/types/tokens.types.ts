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

/** INCLUDES WHITESPACE AND BLOCK_COMMENT FOR IGNORE-ONLY SPECS */
export type TokenSpecType =
  | TokenType
  | "WHITESPACE"
  | "BLOCK_COMMENT";

export interface TokenSpec {
  type: TokenSpecType;
  pattern: RegExp;
  ignore?: boolean;
}

const regex = (pattern: string) => new RegExp(pattern);

/** ORDER MATTERS - FIRST MATCH WINS */
export const TOKEN_SPECS: TokenSpec[] = [
  { type: "EQUAL_EQUAL", pattern: regex("^==") },
  { type: "BANG_EQUAL", pattern: regex("^!=") },
  { type: "EQUAL", pattern: regex("^=") },
  { type: "PLUS", pattern: regex("^\\+") },
  { type: "LEFT_PAREN", pattern: regex("^\\(") },
  { type: "RIGHT_PAREN", pattern: regex("^\\)") },
  { type: "LEFT_BRACE", pattern: regex("^\\{") },
  { type: "RIGHT_BRACE", pattern: regex("^\\}") },
  { type: "EOF", pattern: regex("^\\$") },
  { type: "PRINT", pattern: regex("^print\\b") },
  { type: "WHILE", pattern: regex("^while\\b") },
  { type: "IF", pattern: regex("^if\\b") },
  { type: "INT", pattern: regex("^int\\b") },
  { type: "STRING", pattern: regex("^string\\b") },
  { type: "BOOLEAN", pattern: regex("^boolean\\b") },
  { type: "TRUE", pattern: regex("^true\\b") },
  { type: "FALSE", pattern: regex("^false\\b") },
  { type: "IDENTIFIER", pattern: regex("^[a-zA-Z_][a-zA-Z0-9_]*") },
  { type: "NUMBER", pattern: regex("^\\d+") },
  { type: "STRING_LITERAL", pattern: regex('^"([\\s\\S]*?)"') },
  { type: "WHITESPACE", pattern: regex("^\\s+"), ignore: true },
  { type: "BLOCK_COMMENT", pattern: regex("^/\\*[\\s\\S]*?\\*/"), ignore: true },
];
