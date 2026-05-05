import { TokenType } from "@shared/types/tokens.types";
import type { TypeName } from "./parser.state";

export function tokenTypeToTypeName(type: TokenType): TypeName {
  switch (type) {
    case TokenType.INT:
      return "int";
    case TokenType.STRING:
      return "string";
    case TokenType.BOOLEAN:
      return "boolean";
    default:
      throw new Error(`Unexpected type token: ${type}`);
  }
}

