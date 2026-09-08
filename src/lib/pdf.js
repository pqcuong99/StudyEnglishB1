import * as pdfjsLib from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

// Extract text from a PDF File, rebuilding lines from the glyph
// positions (pdf.js returns unordered text runs, not lines).
export async function extractPdfText(file) {
  const buf = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise
  const lines = []

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p)
    const content = await page.getTextContent()

    const items = content.items
      .filter((it) => it.str && it.str.trim() !== '')
      .map((it) => ({
        str: it.str,
        x: it.transform[4],
        y: it.transform[5],
        w: it.width || 0,
      }))
      .sort((a, b) => (Math.abs(b.y - a.y) > 4 ? b.y - a.y : a.x - b.x))

    let current = null
    let currentY = null
    let currentEndX = 0
    for (const it of items) {
      if (currentY === null || Math.abs(it.y - currentY) > 4) {
        if (current) lines.push(current)
        current = it.str
        currentY = it.y
      } else {
        // only insert a space when there is a real horizontal gap
        const gap = it.x - currentEndX
        const needSpace = !current.endsWith(' ') && !it.str.startsWith(' ') && gap > 1
        current += (needSpace ? ' ' : '') + it.str
      }
      currentEndX = it.x + it.w
    }
    if (current) lines.push(current)
  }

  return lines.join('\n')
}
