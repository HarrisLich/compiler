import { describe, it, expect } from "vitest";
import { scanTokens } from "../../src/infra/compiler/lexer/lexer";

describe("scanTokens (sample program 2 — capitals in string fail)", () => {
  it("throws when string literal contains capital characters", () => {
    const source = `{print("No Caps Mister Bond")}$`;
    expect(() => scanTokens(source)).toThrow(/Capital.*string/);
  });
});
