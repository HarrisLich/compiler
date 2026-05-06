/** Global scratch for temps / compare RHS (must match image layout: byte 0xFF not used by heap). */
export const SCRATCH_ADDR = 0xff;

/** 6502 lab opcode bytes used by this codegen (absolute addressing uses LL HH little-endian; HH=00). */
export const OP = {
  LDA_IMM: 0xa9,
  LDA_ABS: 0xad,
  STA_ABS: 0x8d,
  ADC_ABS: 0x6d,
  /** Clear carry — required before `ADC` for correct unsigned add in this subset. */
  CLC: 0x18,
  LDX_IMM: 0xa2,
  LDX_ABS: 0xae,
  LDY_IMM: 0xa0,
  LDY_ABS: 0xac,
  CPX_ABS: 0xec,
  BNE_REL: 0xd0,
  INC_ABS: 0xee,
  NOP: 0xea,
  BRK: 0x00,
  SYS: 0xff,
} as const;
