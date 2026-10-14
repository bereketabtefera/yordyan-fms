import type { PatternPiece } from './patterns'

export interface PatternMeta {
  title: string
  subtitle: string
  pieceName: (piece: PatternPiece) => string
  seamAllowance: number
  footer: string
}

function pieceSvg(piece: PatternPiece, scale: number, name: string): string {
  const pad = 3
  const w = piece.width + pad * 2
  const h = piece.height + pad * 2
  const shift = (pts: { x: number; y: number }[]) => pts.map((p) => `${(p.x + pad).toFixed(2)},${(p.y + pad).toFixed(2)}`).join(' ')
  const grain = piece.grain
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${(w * scale).toFixed(2)}cm" height="${(h * scale).toFixed(2)}cm" viewBox="0 0 ${w} ${h}">
  <rect x="0" y="0" width="${w}" height="${h}" fill="none" stroke="#cbd5e1" stroke-width="0.2" stroke-dasharray="2 2"/>
  <polygon points="${shift(piece.outline)}" fill="none" stroke="#0f172a" stroke-width="0.4"/>
  <polygon points="${shift(piece.stitch)}" fill="none" stroke="#64748b" stroke-width="0.25" stroke-dasharray="1.5 1.5"/>
  <line x1="${(grain.x + pad).toFixed(2)}" y1="${(grain.y1 + pad).toFixed(2)}" x2="${(grain.x + pad).toFixed(2)}" y2="${(grain.y2 + pad).toFixed(2)}" stroke="#0f172a" stroke-width="0.3" stroke-dasharray="3 1"/>
  <text x="${(grain.x + pad + 1.5).toFixed(2)}" y="${(pad + 4).toFixed(2)}" font-family="sans-serif" font-size="3" fill="#0f172a">GRAIN</text>
  <text x="${(piece.label.x + pad).toFixed(2)}" y="${(piece.label.y + pad).toFixed(2)}" font-family="sans-serif" font-size="3.6" font-weight="600" fill="#0f172a" text-anchor="middle">${name}</text>
</svg>`
}

export function piecesToHtml(pieces: PatternPiece[], meta: PatternMeta, scale = 1): string {
  const pages = pieces
    .map((p, i) => {
      const copies = Array.from({ length: p.cut }).map(() => `<div class="piece">${pieceSvg(p, scale, meta.pieceName(p))}</div>`).join('')
      return `<section class="page">
  <header>
    <h1>${meta.title}</h1>
    <p>${meta.subtitle} · ${meta.pieceName(p)} · cut ${p.cut} · ${p.width}×${p.height} cm · SA ${meta.seamAllowance} cm</p>
  </header>
  ${copies}
  <footer>${meta.footer} — 100% scale. Print at "Actual size" (do not shrink to fit). Page ${i + 1} of ${pieces.length}.</footer>
</section>`
    })
    .join('\n')

  return `<!doctype html>
<html><head><meta charset="utf-8"/><title>${meta.title}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Inter', system-ui, sans-serif; margin: 0; color: #0f172a; }
  .page { padding: 10mm; page-break-after: always; }
  .page:last-child { page-break-after: auto; }
  header h1 { font-size: 14px; margin: 0 0 2px; }
  header p { font-size: 11px; color: #475569; margin: 0 0 8px; }
  .piece { margin: 6px 0; }
  footer { font-size: 10px; color: #64748b; margin-top: 8px; }
  @media print { @page { margin: 0; } }
</style></head>
<body>${pages}</body></html>`
}

export function piecesToSingleSvg(pieces: PatternPiece[], meta: PatternMeta, scale = 1): string {
  let x = 0
  const gap = 6
  const bodies = pieces
    .map((p) => {
      const pad = 3
      const w = p.width + pad * 2
      const h = p.height + pad * 2
      void h
      const shift = (pts: { x: number; y: number }[]) => pts.map((q) => `${(q.x + pad + x).toFixed(2)},${(q.y + pad).toFixed(2)}`).join(' ')
      const svg = `<g><polygon points="${shift(p.outline)}" fill="none" stroke="#0f172a" stroke-width="0.4"/><polygon points="${shift(p.stitch)}" fill="none" stroke="#64748b" stroke-width="0.25" stroke-dasharray="1.5 1.5"/><text x="${(x + w / 2).toFixed(2)}" y="4" font-family="sans-serif" font-size="3.2" fill="#0f172a" text-anchor="middle">${meta.pieceName(p)} (cut ${p.cut})</text></g>`
      const bw = w
      x += bw + gap
      return svg
    })
    .join('')
  const totalW = x
  const totalH = Math.max(...pieces.map((p) => p.height + 6))
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${(totalW * scale).toFixed(2)}cm" height="${(totalH * scale).toFixed(2)}cm" viewBox="0 0 ${totalW} ${totalH}">${bodies}</svg>`
}

export function openPrint(html: string) {
  const w = window.open('', '_blank', 'noopener,noreferrer')
  if (!w) return
  w.document.open()
  w.document.write(html)
  w.document.close()
  w.focus()
  setTimeout(() => w.print(), 400)
}

export function downloadSvg(filename: string, svgMarkup: string) {
  const blob = new Blob([svgMarkup], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
