/**
 * Text chunking for retrieval-augmented generation.
 * Splits on paragraph/sentence boundaries with overlap so context
 * is preserved across chunk edges.
 */

export interface TextChunk {
  index: number;
  content: string;
  pageNumber: number | null;
}

export interface PageText {
  pageNumber: number;
  text: string;
}

const DEFAULT_CHUNK_CHARS = 1200;
const DEFAULT_OVERLAP_CHARS = 200;

export function chunkPages(
  pages: PageText[],
  chunkChars = DEFAULT_CHUNK_CHARS,
  overlapChars = DEFAULT_OVERLAP_CHARS,
): TextChunk[] {
  const chunks: TextChunk[] = [];
  let index = 0;

  for (const page of pages) {
    const text = page.text.replace(/\s+/g, " ").trim();
    if (!text) continue;

    // Prefer splitting on sentence boundaries.
    const sentences = text.match(/[^.!?]+[.!?]+["']?\s*/g) ?? [text];
    let current = "";

    const flush = () => {
      const trimmed = current.trim();
      if (trimmed) {
        chunks.push({ index: index++, content: trimmed, pageNumber: page.pageNumber });
      }
      current = "";
    };

    for (const sentence of sentences) {
      if ((current + sentence).length > chunkChars && current.trim()) {
        flush();
        // Overlap: carry the tail of the previous chunk forward.
        const tail = chunks[chunks.length - 1]?.content ?? "";
        current = tail.slice(-overlapChars) + " ";
      }
      current += sentence + " ";
    }
    flush();
  }

  return chunks;
}

/** Chunk plain text without page info (TXT files). */
export function chunkPlainText(text: string): TextChunk[] {
  return chunkPages([{ pageNumber: 1, text }]);
}
