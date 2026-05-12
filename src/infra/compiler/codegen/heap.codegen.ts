export interface HeapChunk {
  readonly text: string;
  readonly bytes: readonly number[];
}

export function buildHeapChunks(internOrder: string[]): HeapChunk[] {
  const seen = new Set<string>();
  const out: HeapChunk[] = [];
  for (const s of internOrder) {
    if (seen.has(s)) continue;
    seen.add(s);
    const bytes = [...Array.from(s, (ch) => ch.charCodeAt(0)), 0];
    out.push({ text: s, bytes });
  }
  return out;
}

export function heapTotalBytes(chunks: HeapChunk[]): number {
  let n = 0;
  for (const c of chunks) n += c.bytes.length;
  return n;
}
