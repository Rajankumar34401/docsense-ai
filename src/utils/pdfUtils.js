import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

export const parsePDF = async (buffer, documentName) => {
  const data = new Uint8Array(buffer);
  const loadingTask = pdfjsLib.getDocument({ data, useWorkerFetch: false, isEvalSupported: false });
  const doc = await loadingTask.promise;
  
  const chunks = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map(item => item.str).join(" ").replace(/\s+/g, " ");

    // Split into sentences for exact line matching
    let currentSection = "General";

const sentences = text.split(/(?<=[.?!])\s+/);

sentences.forEach(s => {
  const clean = s.trim();

  // crude heading detector (UPPERCASE lines or long title-like strings)
  if (/^[A-Z0-9\s-]{6,}$/.test(clean) && clean.length < 120) {
    currentSection = clean;
  }

  if (clean.length > 20) {
    chunks.push({
      documentName,
      page: i.toString(),
      section: currentSection,
      chunkText: clean
    });
  }
});

  }
  return chunks;
};