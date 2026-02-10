import type { Token } from "./tokens.types";

export interface LexerState {
  source: string;
  start: number;
  current: number;
  line: number;
  column: number;
  startColumn: number;
  tokens: Token[];
}
