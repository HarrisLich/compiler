import type { Token, TokenType } from "@shared/types/tokens.types";
import { Tree } from "@infra/structs/tree/Tree";
import type { ParserState } from "./state.parser";
import { advance, consume as runtimeConsume, peek } from "./runtime.parser";

export type CstBuilder = ReturnType<typeof Tree>;

export interface ParseContext {
  state: ParserState;
  cst: CstBuilder;
}

export function createParseContext(state: ParserState): ParseContext {
  return { state, cst: Tree() };
}

export function cstString(ctx: ParseContext): string {
  return ctx.cst.toString();
}

export function cstRoot(ctx: ParseContext) {
  return ctx.cst.root;
}

export function branch(ctx: ParseContext, name: string, fn: () => void): void {
  ctx.cst.addNode(name, "branch");
  fn();
  ctx.cst.endChildren();
}

export function leaf(ctx: ParseContext, name: string): void {
  ctx.cst.addNode(name, "leaf");
}

function tokenLabel(t: Token): string {
  const lex = t.lexeme === "" ? "∅" : t.lexeme;
  return `${t.type}(${lex})`;
}

export function consume(
  ctx: ParseContext,
  type: TokenType | readonly TokenType[],
  message: string
): Token {
  const tok = runtimeConsume(ctx.state, type, message);
  leaf(ctx, tokenLabel(tok));
  return tok;
}

export function match(ctx: ParseContext, ...types: TokenType[]): boolean {
  const t = peek(ctx.state);
  if (types.includes(t.type)) {
    const tok = advance(ctx.state);
    leaf(ctx, tokenLabel(tok));
    return true;
  }
  return false;
}

