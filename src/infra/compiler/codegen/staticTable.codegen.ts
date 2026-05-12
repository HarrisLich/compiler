/**
 * Patches for absolute operands: 
 * static slot address or scratch at 0x00FF; 
 * absolute addressing uses LL HH little-endian; HH=00.
 */
export type AbsLowPatch =
  | {
      readonly kind: "absLow";
      readonly codeIndex: number;
      readonly slotIndex: number;
    }
  | {
      readonly kind: "absScratch";
      readonly codeIndex: number;
    };

export interface ImmLowPatch {
  readonly kind: "immLow";
  readonly codeIndex: number;
  readonly literal: string;
}
