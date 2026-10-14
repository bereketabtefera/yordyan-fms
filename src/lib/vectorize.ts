export interface TilkResult {
  path: string
  viewBox: string
  strokes: number
  width: number
  height: number
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not load image'))
    img.src = dataUrl
  })
}

function toInk(gray: Float32Array, w: number, h: number): Uint8Array {
  let mean = 0
  for (let i = 0; i < gray.length; i++) mean += gray[i]
  mean /= gray.length
  let variance = 0
  for (let i = 0; i < gray.length; i++) variance += (gray[i] - mean) ** 2
  const std = Math.sqrt(variance / gray.length)
  const threshold = Math.min(mean + std * 0.15, mean + 22) - std * 0.9
  const cutoff = Math.max(40, threshold)
  const ink = new Uint8Array(w * h)
  for (let i = 0; i < gray.length; i++) ink[i] = gray[i] < cutoff ? 1 : 0
  return ink
}

function thin(ink: Uint8Array, w: number, h: number): void {
  const get = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : ink[y * w + x])
  let changed = true
  let guard = 0
  while (changed && guard < 60) {
    changed = false
    guard += 1
    for (let step = 0; step < 2; step++) {
      const del: number[] = []
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          if (ink[y * w + x] !== 1) continue
          const p2 = get(x, y - 1)
          const p3 = get(x + 1, y - 1)
          const p4 = get(x + 1, y)
          const p5 = get(x + 1, y + 1)
          const p6 = get(x, y + 1)
          const p7 = get(x - 1, y + 1)
          const p8 = get(x - 1, y)
          const p9 = get(x - 1, y - 1)
          const b = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9
          if (b < 2 || b > 6) continue
          const seq = [p2, p3, p4, p5, p6, p7, p8, p9, p2]
          let a = 0
          for (let i = 0; i < 8; i++) if (seq[i] === 0 && seq[i + 1] === 1) a++
          if (a !== 1) continue
          if (step === 0) {
            if (p2 * p4 * p6 !== 0 || p4 * p6 * p8 !== 0) continue
          } else if (p2 * p4 * p8 !== 0 || p2 * p6 * p8 !== 0) {
            continue
          }
          del.push(y * w + x)
        }
      }
      for (const d of del) ink[d] = 0
      if (del.length) changed = true
    }
  }
}

const NEIGHBORS = [
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [-1, -1],
  [0, -1],
  [1, -1],
]

function tracePaths(skel: Uint8Array, w: number, h: number): number[][][] {
  const visited = new Uint8Array(w * h)
  const degree = (x: number, y: number): number => {
    let d = 0
    for (const [dx, dy] of NEIGHBORS) {
      const nx = x + dx
      const ny = y + dy
      if (nx >= 0 && ny >= 0 && nx < w && ny < h && skel[ny * w + nx]) d++
    }
    return d
  }

  const startPoints: number[][] = []
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!skel[y * w + x]) continue
      const deg = degree(x, y)
      if (deg !== 2) startPoints.push([x, y])
    }
  }

  const paths: number[][][] = []
  const walk = (sx: number, sy: number) => {
    const path: number[][] = []
    let x = sx
    let y = sy
    while (x >= 0 && y >= 0 && x < w && y < h && skel[y * w + x] && !visited[y * w + x]) {
      visited[y * w + x] = 1
      path.push([x, y])
      let moved = false
      for (const [dx, dy] of NEIGHBORS) {
        const nx = x + dx
        const ny = y + dy
        if (nx >= 0 && ny >= 0 && nx < w && ny < h && skel[ny * w + nx] && !visited[ny * w + nx]) {
          x = nx
          y = ny
          moved = true
          break
        }
      }
      if (!moved) break
    }
    if (path.length > 3) paths.push(path)
  }

  for (const [x, y] of startPoints) {
    if (!visited[y * w + x]) walk(x, y)
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (skel[y * w + x] && !visited[y * w + x]) walk(x, y)
    }
  }
  return paths
}

function rdp(points: number[][], eps: number): number[][] {
  if (points.length < 3) return points
  const [first] = points
  const last = points[points.length - 1]
  let index = -1
  let maxDist = 0
  const dx = last[0] - first[0]
  const dy = last[1] - first[1]
  const len = Math.hypot(dx, dy) || 1
  for (let i = 1; i < points.length - 1; i++) {
    const dist = Math.abs(dy * points[i][0] - dx * points[i][1] + last[0] * first[1] - last[1] * first[0]) / len
    if (dist > maxDist) {
      maxDist = dist
      index = i
    }
  }
  if (maxDist > eps) {
    const left = rdp(points.slice(0, index + 1), eps)
    const right = rdp(points.slice(index), eps)
    return [...left.slice(0, -1), ...right]
  }
  return [first, last]
}

export async function vectorizeDataUrl(dataUrl: string, maxSide = 300): Promise<TilkResult> {
  const img = await loadImage(dataUrl)
  const scale = Math.min(1, maxSide / Math.max(img.width, img.height))
  const w = Math.max(8, Math.round(img.width * scale))
  const h = Math.max(8, Math.round(img.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return { path: '', viewBox: `0 0 ${w} ${h}`, strokes: 0, width: w, height: h }
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, w, h)
  ctx.drawImage(img, 0, 0, w, h)
  const { data } = ctx.getImageData(0, 0, w, h)
  const gray = new Float32Array(w * h)
  for (let i = 0; i < gray.length; i++) {
    const r = data[i * 4]
    const g = data[i * 4 + 1]
    const b = data[i * 4 + 2]
    gray[i] = 0.299 * r + 0.587 * g + 0.114 * b
  }
  const ink = toInk(gray, w, h)
  thin(ink, w, h)
  const paths = tracePaths(ink, w, h)
  const parts: string[] = []
  let strokes = 0
  for (const raw of paths) {
    const simplified = rdp(raw, 1.1)
    if (simplified.length < 2) continue
    strokes += 1
    parts.push(`M ${simplified.map((p) => `${p[0]} ${p[1]}`).join(' L ')}`)
  }
  return { path: parts.join(' '), viewBox: `0 0 ${w} ${h}`, strokes, width: w, height: h }
}
