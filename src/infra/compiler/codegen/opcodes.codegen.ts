/** Opcode bytes for the lab VM; 
 * abs ops patch low byte (high 0x00). 
 * Scratch at 0xFF (not used by heap). */
export const SCRATCH_ADDR = 0xff;

export const OP = {
  LDA_IMM: 0xa9,
  LDA_ABS: 0xad,
  STA_ABS: 0x8d,
  ADC_ABS: 0x6d,
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
