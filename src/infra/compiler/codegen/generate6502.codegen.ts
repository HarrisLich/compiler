import type { Program } from "@infra/compiler/parser/state.parser";
import type { SemanticResult } from "@infra/compiler/semantic/symbols.types.semantic";
import type { TypecheckResult } from "@infra/compiler/semantic/typeChecker.semantic";
import { finalizeImage256 } from "./image.codegen";
import { createCodegenContext, walkProgram } from "./walk.codegen";

function hasErrors(semantic: SemanticResult, types: TypecheckResult): boolean {
  const all = [...semantic.errors, ...types.errors];
  return all.some((e) => e.severity === "error");
}

export function generate6502(
  ast: Program,
  semantic: SemanticResult,
  types: TypecheckResult
): { bytes: number[]; hex: string } {
  if (hasErrors(semantic, types)) {
    throw new Error("generate6502: semantic or type errors present; codegen skipped.");
  }

  const ctx = createCodegenContext(semantic, semantic.blockToScope);
  walkProgram(ctx, ast);
  ctx.resolveBranches();

  const bytes = finalizeImage256({
    code: ctx.code,
    slots: ctx.slots.length,
    internOrder: ctx.internOrder,
    absPatches: ctx.absPatches,
    immPatches: ctx.immPatches,
    const0SlotIndex: ctx.const0Idx,
    const1SlotIndex: ctx.const1Idx,
  });

  const hex = bytes.map((b) => b.toString(16).toUpperCase().padStart(2, "0")).join(" ");
  return { bytes, hex };
}
