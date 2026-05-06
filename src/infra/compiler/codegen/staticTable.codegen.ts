/**
 * Static RAM slots (variables + const cells) laid out just below the heap.
 * Expression temporaries use the fixed scratch byte `0xFF` (see `absScratch` patches).
 */
export interface StaticSlot {
  readonly slotIndex: number;
  readonly kind: "const0" | "const1" | "var";
}

/** Absolute addressing: static slot or global scratch at $00FF. */
export type AbsLowPatch =
  | {
      readonly kind: "absLow";
      /** Index into the code buffer of the low byte (high byte at index+1 is always 0x00). */
      readonly codeIndex: number;
      readonly slotIndex: number;
    }
  | {
      readonly kind: "absScratch";
      readonly codeIndex: number;
    };

export interface ImmLowPatch {
  readonly kind: "immLow";
  /** Index of immediate byte after LDA # */
  readonly codeIndex: number;
  readonly literal: string;
}
