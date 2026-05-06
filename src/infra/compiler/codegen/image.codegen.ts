import { buildHeapChunks } from "./heap.codegen";
import { SCRATCH_ADDR } from "./opcodes.codegen";
import type { AbsLowPatch, ImmLowPatch } from "./staticTable.codegen";

export interface FinalizeInput {
  readonly code: readonly number[];
  readonly slots: number;
  readonly internOrder: readonly string[];
  readonly absPatches: readonly AbsLowPatch[];
  readonly immPatches: readonly ImmLowPatch[];
  readonly const0SlotIndex: number;
  readonly const1SlotIndex: number;
}

/**
 * Lay out code [0..len), static slots just below heap, heap ending at 0xFE (0xFF reserved scratch); return 256 bytes.
 */
export function finalizeImage256(input: FinalizeInput): number[] {
  const ram = new Array<number>(256).fill(0);

  const chunks = buildHeapChunks([...input.internOrder]);
  const heapBytes = chunks.reduce((n, c) => n + c.bytes.length, 0);
  const heapStart = SCRATCH_ADDR - heapBytes;
  const staticBase = heapStart - input.slots;

  if (staticBase < 0) {
    throw new Error(`Codegen layout: static+heap exceed 256 bytes (slots=${input.slots}, heap=${heapBytes}).`);
  }

  const codeLen = input.code.length;
  if (codeLen > staticBase) {
    throw new Error(
      `Codegen layout: code (${codeLen} bytes) overlaps static region (starts at ${staticBase}).`
    );
  }

  for (let i = 0; i < codeLen; i++) ram[i] = input.code[i]! & 0xff;

  // Absolute addresses: LL 00 little-endian for each patched instruction.
  for (const p of input.absPatches) {
    const addr = p.kind === "absScratch" ? SCRATCH_ADDR : staticBase + p.slotIndex;
    if (addr < 0 || addr > 255) throw new Error(`Codegen: bad absolute address ${addr}`);
    ram[p.codeIndex] = addr & 0xff;
    ram[p.codeIndex + 1] = 0;
  }

  // Heap bytes + map literal -> low address of chunk (never occupies 0xFF)
  const literalLow = new Map<string, number>();
  let addr = SCRATCH_ADDR;
  for (const chunk of chunks) {
    addr -= chunk.bytes.length;
    literalLow.set(chunk.text, addr & 0xff);
    for (let j = 0; j < chunk.bytes.length; j++) {
      ram[addr + j] = chunk.bytes[j]! & 0xff;
    }
  }

  for (const p of input.immPatches) {
    const low = literalLow.get(p.literal);
    if (low === undefined) throw new Error(`Codegen: missing heap chunk for string literal`);
    ram[p.codeIndex] = low & 0xff;
  }

  ram[staticBase + input.const0SlotIndex] = 0;
  ram[staticBase + input.const1SlotIndex] = 1;

  return ram;
}
