import type {
  BlockStatement,
  Expression,
  Program,
  Statement,
  TypeName,
} from "@infra/compiler/parser/state.parser";
import { TokenType } from "@shared/types/tokens.types";
import { lookupSymbol } from "@infra/compiler/semantic/symbolLookup.semantic";
import type { Scope } from "@infra/compiler/semantic/symbols.types.semantic";
import { OP } from "./opcodes.codegen";
import type { AbsLowPatch, ImmLowPatch } from "./staticTable.codegen";

/** Var slots use `staticBase + index`; 
 * scratch fixed at 0xFF. */
export type SlotIndex = number;

export interface CodegenContext {
  readonly sem: import("@infra/compiler/semantic/symbols.types.semantic").SemanticResult;
  readonly blockToScope: WeakMap<BlockStatement, Scope>;
  code: number[];
  absPatches: AbsLowPatch[];
  immPatches: ImmLowPatch[];
  internOrder: string[];
  slots: Array<{ kind: "const0" | "const1" | "var" }>;

  const0Idx: number;
  const1Idx: number;

  currentScope: Scope;
  frames: Map<string, SlotIndex>[];

  labels: Map<string, number>;
  pendingBranches: Array<{ opIdx: number; label: string }>;
  nextLabelId: number;

  allocSlot(kind: "const0" | "const1" | "var"): SlotIndex;
  mkLabel(prefix?: string): string;
  emitLabel(name: string): void;
  emitBytes(...b: number[]): void;
  emitLdaImm(n: number): void;
  emitLdaImmStringLiteral(literal: string): void;
  emitLdyImm(n: number): void;
  emitLdyImmStringLiteral(literal: string): void;
  emitLdaAbs(slot: SlotIndex): void;
  emitStaAbs(slot: SlotIndex): void;
  emitLdaScratch(): void;
  emitStaScratch(): void;
  /** LDA/STA scratch in sequence so a later 
   * `emitLdaScratch` is not folded with a prior STA. */
  emitScratchSelfNormalize(): void;
  emitClc(): void;
  emitAdcScratch(): void;
  emitLdxImm(n: number): void;
  emitLdxAbs(slot: SlotIndex): void;
  emitLdxScratch(): void;
  emitLdyAbs(slot: SlotIndex): void;
  emitLdyScratch(): void;
  /** Compares always use X against 
   * the single scratch byte at 0xFF. */
  emitCpxScratch(): void;
  emitBne(label: string): void;
  emitBrk(): void;
  emitSys(): void;
  resolveBranches(): void;
}

function pushScratchOp(ctx: CodegenContext, op: number, scratchState: { lastStaScratch: boolean }): void {
  scratchState.lastStaScratch = false;
  ctx.emitBytes(op, 0, 0);
  ctx.absPatches.push({ kind: "absScratch", codeIndex: ctx.code.length - 2 });
}

export function createCodegenContext(
  sem: import("@infra/compiler/semantic/symbols.types.semantic").SemanticResult,
  blockToScope: WeakMap<BlockStatement, Scope>
): CodegenContext {
  const slots: CodegenContext["slots"] = [];
  const allocSlot = (kind: "const0" | "const1" | "var"): SlotIndex => {
    const idx = slots.length;
    slots.push({ kind });
    return idx;
  };

  const scratchState = { lastStaScratch: false };

  const ctx: CodegenContext = {
    sem,
    blockToScope,
    code: [],
    absPatches: [],
    immPatches: [],
    internOrder: [],
    slots,
    const0Idx: -1,
    const1Idx: -1,
    currentScope: sem.rootScope,
    frames: [new Map()],
    labels: new Map(),
    pendingBranches: [],
    nextLabelId: 0,

    allocSlot,

    mkLabel(prefix = "L") {
      const id = ctx.nextLabelId++;
      return `${prefix}${id}`;
    },

    emitLabel(name: string) {
      scratchState.lastStaScratch = false;
      ctx.labels.set(name, ctx.code.length);
    },

    emitBytes(...b: number[]) {
      scratchState.lastStaScratch = false;
      for (const x of b) ctx.code.push(x & 0xff);
    },

    emitLdaImm(n: number) {
      scratchState.lastStaScratch = false;
      ctx.emitBytes(OP.LDA_IMM, n & 0xff);
    },

    emitLdaImmStringLiteral(literal: string) {
      scratchState.lastStaScratch = false;
      if (!ctx.internOrder.includes(literal)) ctx.internOrder.push(literal);
      ctx.emitBytes(OP.LDA_IMM, 0);
      ctx.immPatches.push({ kind: "immLow", codeIndex: ctx.code.length - 1, literal });
    },

    emitLdyImm(n: number) {
      scratchState.lastStaScratch = false;
      ctx.emitBytes(OP.LDY_IMM, n & 0xff);
    },

    emitLdyImmStringLiteral(literal: string) {
      scratchState.lastStaScratch = false;
      if (!ctx.internOrder.includes(literal)) ctx.internOrder.push(literal);
      ctx.emitBytes(OP.LDY_IMM, 0);
      ctx.immPatches.push({ kind: "immLow", codeIndex: ctx.code.length - 1, literal });
    },

    emitLdaAbs(slot: SlotIndex) {
      scratchState.lastStaScratch = false;
      ctx.emitBytes(OP.LDA_ABS, 0, 0);
      ctx.absPatches.push({ kind: "absLow", codeIndex: ctx.code.length - 2, slotIndex: slot });
    },

    emitStaAbs(slot: SlotIndex) {
      scratchState.lastStaScratch = false;
      ctx.emitBytes(OP.STA_ABS, 0, 0);
      ctx.absPatches.push({ kind: "absLow", codeIndex: ctx.code.length - 2, slotIndex: slot });
    },

    emitLdaScratch() {
      if (scratchState.lastStaScratch) {
        ctx.code.length -= 3;
        ctx.absPatches.pop();
        scratchState.lastStaScratch = false;
        return;
      }
      pushScratchOp(ctx, OP.LDA_ABS, scratchState);
    },

    emitStaScratch() {
      scratchState.lastStaScratch = false;
      ctx.emitBytes(OP.STA_ABS, 0, 0);
      ctx.absPatches.push({ kind: "absScratch", codeIndex: ctx.code.length - 2 });
      scratchState.lastStaScratch = true;
    },

    emitScratchSelfNormalize() {
      scratchState.lastStaScratch = false;
      ctx.emitBytes(OP.LDA_ABS, 0, 0);
      ctx.absPatches.push({ kind: "absScratch", codeIndex: ctx.code.length - 2 });
      ctx.emitBytes(OP.STA_ABS, 0, 0);
      ctx.absPatches.push({ kind: "absScratch", codeIndex: ctx.code.length - 2 });
      scratchState.lastStaScratch = false;
    },

    emitClc() {
      scratchState.lastStaScratch = false;
      ctx.emitBytes(OP.CLC);
    },

    emitAdcScratch() {
      pushScratchOp(ctx, OP.ADC_ABS, scratchState);
    },

    emitLdxImm(n: number) {
      scratchState.lastStaScratch = false;
      ctx.emitBytes(OP.LDX_IMM, n & 0xff);
    },

    emitLdxAbs(slot: SlotIndex) {
      scratchState.lastStaScratch = false;
      ctx.emitBytes(OP.LDX_ABS, 0, 0);
      ctx.absPatches.push({ kind: "absLow", codeIndex: ctx.code.length - 2, slotIndex: slot });
    },

    emitLdxScratch() {
      pushScratchOp(ctx, OP.LDX_ABS, scratchState);
    },

    emitLdyAbs(slot: SlotIndex) {
      scratchState.lastStaScratch = false;
      ctx.emitBytes(OP.LDY_ABS, 0, 0);
      ctx.absPatches.push({ kind: "absLow", codeIndex: ctx.code.length - 2, slotIndex: slot });
    },

    emitLdyScratch() {
      pushScratchOp(ctx, OP.LDY_ABS, scratchState);
    },

    emitCpxScratch() {
      scratchState.lastStaScratch = false;
      ctx.emitBytes(OP.CPX_ABS, 0, 0);
      ctx.absPatches.push({ kind: "absScratch", codeIndex: ctx.code.length - 2 });
    },

    emitBne(label: string) {
      scratchState.lastStaScratch = false;
      const opIdx = ctx.code.length;
      ctx.emitBytes(OP.BNE_REL, 0);
      ctx.pendingBranches.push({ opIdx, label });
    },

    emitBrk() {
      scratchState.lastStaScratch = false;
      ctx.emitBytes(OP.BRK);
    },

    emitSys() {
      scratchState.lastStaScratch = false;
      ctx.emitBytes(OP.SYS);
    },

    resolveBranches() {
      for (const br of ctx.pendingBranches) {
        const target = ctx.labels.get(br.label);
        if (target === undefined) {
          throw new Error(`Codegen: unresolved branch label '${br.label}'`);
        }
        const nextPc = br.opIdx + 2;
        const offset = target - nextPc;
        ctx.code[br.opIdx + 1] = offset & 0xff;
      }
    },
  };

  ctx.const0Idx = allocSlot("const0");
  ctx.const1Idx = allocSlot("const1");

  return ctx;
}

/** Turn Z from `CPX scratch` into 0/1 in 
 * scratch without comparing X to anything 
 * but scratch. */
function emitEqResultInScratch(ctx: CodegenContext): void {
  const onFalse = ctx.mkLabel("beq_f");
  const done = ctx.mkLabel("beq_d");
  ctx.emitBne(onFalse);
  ctx.emitLdaImm(1);
  ctx.emitStaScratch();
  ctx.emitLdxImm(0);
  ctx.emitCpxScratch();
  ctx.emitBne(done);
  ctx.emitLabel(onFalse);
  ctx.emitLdaImm(0);
  ctx.emitStaScratch();
  ctx.emitLabel(done);
}

function emitNeqResultInScratch(ctx: CodegenContext): void {
  const onNeq = ctx.mkLabel("bne_t");
  const done = ctx.mkLabel("bne_d");
  ctx.emitBne(onNeq);
  ctx.emitLdaImm(0);
  ctx.emitStaScratch();
  ctx.emitLdxImm(1);
  ctx.emitCpxScratch();
  ctx.emitBne(done);
  ctx.emitLabel(onNeq);
  ctx.emitLdaImm(1);
  ctx.emitStaScratch();
  ctx.emitLabel(done);
}

function canIntExprLoadDirectToX(expr: Expression): boolean {
  return (
    expr.kind === "Variable" ||
    (expr.kind === "Literal" && typeof expr.value === "number")
  );
}

function emitIntExprToX(ctx: CodegenContext, expr: Expression, depth: number): void {
  if (expr.kind === "Variable") {
    ctx.emitLdxAbs(resolveVar(ctx, expr.name.lexeme));
    return;
  }
  if (expr.kind === "Literal" && typeof expr.value === "number") {
    ctx.emitLdxImm(Number(expr.value) & 0xff);
    return;
  }
  emitExpr(ctx, expr, depth);
  ctx.emitStaScratch();
  ctx.emitLdxScratch();
}

function tryEmitIntLiteralCompareToScratch(
  ctx: CodegenContext,
  expr: Extract<Expression, { kind: "Binary" }>,
  depth: number
): boolean {
  const op = expr.operator.type;
  if (op !== TokenType.EQUAL_EQUAL && op !== TokenType.BANG_EQUAL) return false;

  let lit: number | undefined;
  let other: Expression | undefined;
  if (expr.right.kind === "Literal" && typeof expr.right.value === "number") {
    lit = expr.right.value;
    other = expr.left;
  } else if (expr.left.kind === "Literal" && typeof expr.left.value === "number") {
    lit = expr.left.value;
    other = expr.right;
  }
  if (lit === undefined || other === undefined) return false;

  ctx.emitLdaImm(lit & 0xff);
  ctx.emitStaScratch();
  emitIntExprToX(ctx, other, depth);
  ctx.emitCpxScratch();

  if (op === TokenType.EQUAL_EQUAL) emitEqResultInScratch(ctx);
  else emitNeqResultInScratch(ctx);
  return true;
}

function inferExprType(expr: Expression, scope: Scope): TypeName | "error" {
  switch (expr.kind) {
    case "Literal": {
      const v = expr.value;
      if (typeof v === "number") return "int";
      if (typeof v === "string") return "string";
      return "boolean";
    }
    case "Variable": {
      const sym = lookupSymbol(scope, expr.name.lexeme);
      return sym?.typeName ?? "error";
    }
    case "Grouping":
      return inferExprType(expr.expression, scope);
    case "Binary": {
      const op = expr.operator.type;
      if (op === TokenType.PLUS) return "int";
      if (op === TokenType.EQUAL_EQUAL || op === TokenType.BANG_EQUAL) return "boolean";
      return "error";
    }
    default: {
      const _e: never = expr;
      return _e;
    }
  }
}

function emitBoolCompareToScratch(ctx: CodegenContext, expr: Extract<Expression, { kind: "Binary" }>, neq: boolean): void {
  if (canIntExprLoadDirectToX(expr.left)) {
    emitExpr(ctx, expr.right, 0);
    ctx.emitStaScratch();
    emitIntExprToX(ctx, expr.left, 0);
    ctx.emitCpxScratch();
  } else {
    emitExpr(ctx, expr.left, 0);
    ctx.emitStaScratch();
    ctx.emitLdxScratch();
    emitExpr(ctx, expr.right, 0);
    ctx.emitStaScratch();
    ctx.emitCpxScratch();
  }
  if (neq) emitNeqResultInScratch(ctx);
  else emitEqResultInScratch(ctx);
}

function emitIntCompareSetZ(ctx: CodegenContext, expr: Extract<Expression, { kind: "Binary" }>): void {
  if (canIntExprLoadDirectToX(expr.left)) {
    emitExpr(ctx, expr.right, 0);
    ctx.emitStaScratch();
    emitIntExprToX(ctx, expr.left, 0);
    ctx.emitCpxScratch();
    return;
  }
  emitExpr(ctx, expr.left, 0);
  ctx.emitStaScratch();
  ctx.emitLdxScratch();
  emitExpr(ctx, expr.right, 0);
  ctx.emitStaScratch();
  ctx.emitCpxScratch();
}

function emitBooleanToScratch(ctx: CodegenContext, expr: Expression, depth: number): void {
  switch (expr.kind) {
    case "Literal":
      if (typeof expr.value === "boolean") {
        ctx.emitLdaImm(expr.value ? 1 : 0);
        ctx.emitStaScratch();
        return;
      }
      break;
    case "Variable": {
      const sym = lookupSymbol(ctx.currentScope, expr.name.lexeme);
      if (sym?.typeName === "boolean") {
        ctx.emitLdaAbs(resolveVar(ctx, expr.name.lexeme));
        ctx.emitStaScratch();
        return;
      }
      emitExpr(ctx, expr, depth);
      ctx.emitStaScratch();
      return;
    }
    case "Grouping":
      emitBooleanToScratch(ctx, expr.expression, depth);
      return;
    case "Binary":
      if (tryEmitIntLiteralCompareToScratch(ctx, expr, depth)) {
        return;
      }
      emitBoolCompareToScratch(ctx, expr, expr.operator.type === TokenType.BANG_EQUAL);
      return;
    default:
      break;
  }
  emitExpr(ctx, expr, depth);
  ctx.emitStaScratch();
}

export function emitExpr(ctx: CodegenContext, expr: Expression, depth: number): void {
  switch (expr.kind) {
    case "Literal": {
      const v = expr.value;
      if (typeof v === "number") {
        const n = typeof v === "number" ? v : Number(v);
        ctx.emitLdaImm(Number.isFinite(n) ? n : 0);
        return;
      }
      if (typeof v === "string") {
        ctx.emitLdaImmStringLiteral(v);
        return;
      }
      ctx.emitLdaImm(v ? 1 : 0);
      return;
    }
    case "Variable": {
      const slot = resolveVar(ctx, expr.name.lexeme);
      ctx.emitLdaAbs(slot);
      return;
    }
    case "Grouping":
      emitExpr(ctx, expr.expression, depth);
      return;
    case "Binary": {
      const op = expr.operator.type;
      if (op === TokenType.PLUS) {
        const L = expr.left;
        const R = expr.right;
        const leftNumLit = L.kind === "Literal" && typeof L.value === "number";
        const rightNumLit = R.kind === "Literal" && typeof R.value === "number";
        // One scratch byte: evaluate the non-literal side first, 
        // then ADC the literal, so nested `+` does not clobber scratch.
        if (leftNumLit && !rightNumLit) {
          emitExpr(ctx, R, depth + 1);
          ctx.emitStaScratch();
          ctx.emitLdaImm(Number(L.value) & 0xff);
          ctx.emitAdcScratch();
          return;
        }
        if (rightNumLit && !leftNumLit) {
          emitExpr(ctx, L, depth + 1);
          ctx.emitStaScratch();
          ctx.emitLdaImm(Number(R.value) & 0xff);
          ctx.emitAdcScratch();
          return;
        }

        emitExpr(ctx, R, depth + 1);
        ctx.emitStaScratch();
        emitExpr(ctx, L, depth + 1);
        ctx.emitAdcScratch();
        return;
      }
      if (op === TokenType.EQUAL_EQUAL || op === TokenType.BANG_EQUAL) {
        if (tryEmitIntLiteralCompareToScratch(ctx, expr, depth)) {
          ctx.emitLdaScratch();
          return;
        }
        emitBoolCompareToScratch(ctx, expr, op === TokenType.BANG_EQUAL);
        ctx.emitLdaScratch();
        return;
      }
      throw new Error(`Codegen: unsupported binary operator '${expr.operator.lexeme}'`);
    }
    default: {
      const _e: never = expr;
      throw _e;
    }
  }
}

export function emitBooleanExpr(ctx: CodegenContext, expr: Expression, depth: number): void {
  emitBooleanToScratch(ctx, expr, depth);
  ctx.emitLdaScratch();
}

function resolveVar(ctx: CodegenContext, lexeme: string): SlotIndex {
  for (let i = ctx.frames.length - 1; i >= 0; i--) {
    const hit = ctx.frames[i]!.get(lexeme);
    if (hit !== undefined) return hit;
  }
  throw new Error(`Codegen internal: unresolved variable '${lexeme}'`);
}

export function walkProgram(ctx: CodegenContext, ast: Program): void {
  walkBlock(ctx, ast.body, false);

  ctx.emitBrk();
}

export function walkBlock(ctx: CodegenContext, block: BlockStatement, newScope: boolean): void {
  const outer = ctx.currentScope;
  let entered = false;
  if (newScope) {
    const mapped = ctx.blockToScope.get(block);
    if (!mapped) {
      throw new Error("Codegen internal: block missing child scope");
    }
    ctx.currentScope = mapped;
    ctx.frames.push(new Map());
    entered = true;
  }

  for (const stmt of block.body) {
    walkStatement(ctx, stmt);
  }

  if (entered) {
    ctx.frames.pop();
    ctx.currentScope = outer;
  }
}

function walkStatement(ctx: CodegenContext, stmt: Statement): void {
  switch (stmt.kind) {
    case "VarDeclStatement": {
      const frame = ctx.frames[ctx.frames.length - 1]!;
      const name = stmt.name.lexeme;
      if (frame.has(name)) {
        return;
      }
      const slot = ctx.allocSlot("var");
      frame.set(name, slot);
      return;
    }
    case "AssignmentStatement": {
      const dest = resolveVar(ctx, stmt.name.lexeme);
      emitExpr(ctx, stmt.value, 0);
      ctx.emitStaAbs(dest);
      return;
    }
    case "PrintStatement": {
      const t = inferExprType(stmt.expression, ctx.currentScope);
      if (t === "string" && stmt.expression.kind === "Literal" && typeof stmt.expression.value === "string") {
        ctx.emitLdyImmStringLiteral(stmt.expression.value);
        ctx.emitLdxImm(2);
        ctx.emitSys();
        return;
      }
      if (t === "string" && stmt.expression.kind === "Variable") {
        ctx.emitLdyAbs(resolveVar(ctx, stmt.expression.name.lexeme));
        ctx.emitLdxImm(2);
        ctx.emitSys();
        return;
      }
      if (t === "int" && stmt.expression.kind === "Literal" && typeof stmt.expression.value === "number") {
        ctx.emitLdyImm(Number(stmt.expression.value) & 0xff);
        ctx.emitLdxImm(1);
        ctx.emitSys();
        return;
      }
      if (t === "int" && stmt.expression.kind === "Variable") {
        ctx.emitLdyAbs(resolveVar(ctx, stmt.expression.name.lexeme));
        ctx.emitLdxImm(1);
        ctx.emitSys();
        return;
      }
      emitExpr(ctx, stmt.expression, 0);
      ctx.emitStaScratch();
      ctx.emitLdyScratch();
      if (t === "string") {
        ctx.emitLdxImm(2);
      } else {
        ctx.emitLdxImm(1);
      }
      ctx.emitSys();
      return;
    }
    case "ExpressionStatement":
      emitExpr(ctx, stmt.expression, 0);
      return;
    case "BlockStatement":
      walkBlock(ctx, stmt, true);
      return;
    case "IfStatement": {
      const skip = ctx.mkLabel("if_skip");
      const c0 = stmt.condition.kind === "Grouping" ? stmt.condition.expression : stmt.condition;
      if (c0.kind === "Binary" && c0.operator.type === TokenType.EQUAL_EQUAL) {
        emitIntCompareSetZ(ctx, c0);
        ctx.emitBne(skip);
      } else {
        emitBooleanToScratch(ctx, stmt.condition, 0);
        ctx.emitLdxImm(1);
        ctx.emitCpxScratch();
        ctx.emitBne(skip);
      }
      walkBlock(ctx, stmt.body, true);
      ctx.emitLabel(skip);
      return;
    }
    case "WhileStatement": {
      const loop = ctx.mkLabel("while_head");
      const exit = ctx.mkLabel("while_exit");
      const body = ctx.mkLabel("while_body");
      ctx.emitLabel(loop);
      const c0 = stmt.condition.kind === "Grouping" ? stmt.condition.expression : stmt.condition;
      if (c0.kind === "Binary" && c0.operator.type === TokenType.BANG_EQUAL) {
        // `!=`: BNE enters body when unequal; 
        // CPX const0 + BNE skips to exit when equal.
        emitIntCompareSetZ(ctx, c0);
        ctx.emitBne(body);
        ctx.emitLdxImm(1);
        ctx.emitBytes(OP.CPX_ABS, 0, 0);
        ctx.absPatches.push({ kind: "absLow", codeIndex: ctx.code.length - 2, slotIndex: ctx.const0Idx });
        ctx.emitBne(exit);

        ctx.emitLabel(body);
      } else {
        emitBooleanToScratch(ctx, stmt.condition, 0);
        ctx.emitLdxImm(1);
        ctx.emitCpxScratch();
        ctx.emitBne(exit);
      }

      walkBlock(ctx, stmt.body, true);
      ctx.emitLdxImm(1);
      ctx.emitBytes(OP.CPX_ABS, 0, 0);
      ctx.absPatches.push({ kind: "absLow", codeIndex: ctx.code.length - 2, slotIndex: ctx.const0Idx });
      ctx.emitBne(loop);
      ctx.emitLabel(exit);
      return;
    }
    default: {
      const _ex: never = stmt;
      return _ex;
    }
  }
}
