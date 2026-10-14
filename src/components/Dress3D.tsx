import { useEffect, useRef } from 'react'
import type { Design, MotifId, TiletPlacement, TibebStyle } from '../db/types'
import { sleeveLengthOf } from '../lib/dressShape'

type Dress3DDesign = Pick<
  Design,
  | 'silhouette'
  | 'sleeve'
  | 'length'
  | 'tibebStyle'
  | 'tiletPlacement'
  | 'baseColor'
  | 'tiletColors'
  | 'motif'
  | 'motifRepeat'
  | 'mirrorMotif'
  | 'bandWidth'
  | 'stripeCount'
>

interface V3 {
  x: number
  y: number
  z: number
}

interface Face {
  pts: V3[]
  color: string
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '').trim()
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.padEnd(6, '0').slice(0, 6)
  const n = parseInt(full, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function shadeColor(hex: string, k: number): string {
  const [r, g, b] = hexToRgb(hex)
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v * k))).toString(16).padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`
}

const SEGS = 52
const ROWS = 56

function smooth(t: number): number {
  const x = Math.max(0, Math.min(1, t))
  return x * x * (3 - 2 * x)
}

function dressHeight(length: Dress3DDesign['length']): number {
  switch (length) {
    case 'short':
      return 42
    case 'knee':
      return 58
    case 'midi':
      return 74
    case 'ankle':
      return 90
    case 'floor':
      return 98
    default:
      return 85
  }
}

const HEM_FINAL: Record<Dress3DDesign['silhouette'], number> = {
  flare: 36,
  aline: 27,
  fitted: 17.5,
  straight: 19,
  puff: 24,
  mermaid: 34,
}

function bodyRadius(t: number, silhouette: Dress3DDesign['silhouette']): number {
  // t: 0 shoulder -> 1 hem
  const bust = 15.2
  const waist = 12.4
  const hip = 16.2
  if (t < 0.14) return 14.2 + (bust - 14.2) * smooth(t / 0.14)
  if (t < 0.34) return bust + (waist - bust) * smooth((t - 0.14) / 0.2)
  if (t < 0.5) return waist + (hip - waist) * smooth((t - 0.34) / 0.16)

  const final = HEM_FINAL[silhouette]
  if (silhouette === 'mermaid') {
    if (t < 0.68) return hip + (13.2 - hip) * smooth((t - 0.5) / 0.18)
    return 13.2 + (final - 13.2) * smooth((t - 0.68) / 0.32)
  }
  return hip + (final - hip) * smooth((t - 0.5) / 0.5)
}

function motifPick(motif: MotifId | undefined, seg: number, t: number, colors: string[]): string {
  const n = colors.length
  const row = Math.round(t * ROWS)
  let idx = seg
  switch (motif) {
    case 'zigzag':
    case 'chevron':
      idx = seg + row
      break
    case 'diamond':
      idx = Math.floor(seg / 2) * 2 % (n * 2) < n ? seg : seg + 1
      break
    case 'wave':
      idx = seg + Math.round(t * 6)
      break
    case 'dots':
      idx = row
      break
    case 'lattice':
      idx = seg * row
      break
    case 'leaf':
      idx = Math.floor(seg / 3)
      break
    case 'cross':
    case 'meskel':
      idx = Math.floor(seg / SEGS * n * 2)
      break
    case 'lalibela':
      idx = Math.floor(seg / SEGS * n * 3)
      break
    case 'teltele':
      idx = Math.floor(seg / SEGS * n * 4)
      break
    default:
      idx = seg
  }
  return colors[((idx % n) + n) % n]
}

function bandColorAt(
  t: number,
  angle: number,
  seg: number,
  place: TiletPlacement,
  style: TibebStyle,
  colors: string[],
  motif: MotifId | undefined,
): string | null {
  if (style === 'none' || colors.length === 0) return null
  const stripe = (k: number) => colors[((k % colors.length) + colors.length) % colors.length]
  const front = angle < 0.14 * Math.PI || angle > 2 * Math.PI - 0.14 * Math.PI
  const hem = t > 0.86
  const neck = t < 0.05
  const gemash = t > 0.52 && t < 0.93
  switch (place) {
    case 'hem':
      return hem ? motifPick(motif, seg, t, colors) : null
    case 'gemash':
      return gemash ? motifPick(motif, seg, t, colors) : null
    case 'neckline':
      return neck ? motifPick(motif, seg, t, colors) : null
    case 'sleeves':
      return null
    case 'zuria':
      if (hem) return motifPick(motif, seg, t, colors)
      return front && t > 0.06 ? stripe(seg % 2) : null
    case 'full':
      if (hem || neck) return motifPick(motif, seg, t, colors)
      return front && t > 0.06 ? stripe(seg % 2) : null
    default:
      return null
  }
}

function pushQuad(faces: Face[], a: V3, b: V3, c: V3, d: V3, color: string) {
  faces.push({ pts: [a, b, c, d], color })
}

function buildDressFaces(design: Dress3DDesign): Face[] {
  const faces: Face[] = []
  const base = design.baseColor || '#f7f5ef'
  const colors = design.tiletColors?.length ? design.tiletColors : ['#b91c1c', '#d4a017', '#15803d']
  const H = dressHeight(design.length)

  const ring = (t: number): V3[] => {
    const y = -t * H
    const r = bodyRadius(t, design.silhouette)
    const out: V3[] = []
    for (let i = 0; i <= SEGS; i++) {
      const a = (i / SEGS) * Math.PI * 2
      out.push({ x: r * Math.sin(a), y, z: r * Math.cos(a) })
    }
    return out
  }

  const rings: V3[][] = []
  for (let j = 0; j <= ROWS; j++) rings.push(ring(j / ROWS))

  for (let j = 0; j < ROWS; j++) {
    const t0 = j / ROWS
    const t1 = (j + 1) / ROWS
    for (let i = 0; i < SEGS; i++) {
      const angle = (i / SEGS) * Math.PI * 2
      const col =
        bandColorAt((t0 + t1) / 2, angle, i, design.tiletPlacement, design.tibebStyle, colors, design.motif) ?? base
      pushQuad(faces, rings[j][i], rings[j][i + 1], rings[j + 1][i + 1], rings[j + 1][i], col)
    }
  }

  // sleeves
  if (design.sleeve !== 'none') {
    const sl = sleeveLengthOf(design.sleeve) / 2.4
    const cuff = design.sleeve === 'bell' ? 8.5 : design.sleeve === 'puff' ? 6.5 : 4.2
    for (const side of [-1, 1]) {
      const origin: V3 = { x: side * 12.5, y: -2.5, z: 0 }
      const dir: V3 = { x: side * 0.62, y: -0.78, z: 0 }
      const len = design.sleeve === 'cap' ? sl * 1.4 : sl
      const ringsS: V3[][] = []
      const ringCount = 8
      for (let j = 0; j <= ringCount; j++) {
        const u = j / ringCount
        const cx = origin.x + dir.x * len * u
        const cy = origin.y + dir.y * len * u
        const cz = origin.z + dir.z * len * u
        const r = 5.6 + (cuff - 5.6) * u + (design.sleeve === 'puff' && u < 0.4 ? 1.4 * Math.sin(u * Math.PI) : 0)
        const row: V3[] = []
        for (let i = 0; i <= SEGS; i++) {
          const a = (i / SEGS) * Math.PI * 2
          // ring in plane perpendicular-ish: use z and a secondary axis in xy
          const ux = -dir.y
          const uy = dir.x
          const ul = Math.hypot(ux, uy) || 1
          const ox = (ux / ul) * Math.cos(a) * r
          const oy = (uy / ul) * Math.cos(a) * r
          const oz = Math.sin(a) * r
          row.push({ x: cx + ox, y: cy + oy, z: cz + oz })
        }
        ringsS.push(row)
      }
      for (let j = 0; j < ringCount; j++) {
        for (let i = 0; i < SEGS; i++) {
          const cuffBand =
            design.tibebStyle !== 'none' &&
            (design.tiletPlacement === 'sleeves' || design.tiletPlacement === 'full') &&
            j >= ringCount - 2
          const col = cuffBand ? colors[i % colors.length] : base
          pushQuad(faces, ringsS[j][i], ringsS[j][i + 1], ringsS[j + 1][i + 1], ringsS[j + 1][i], col)
        }
      }
    }
  }

  return faces
}

function buildMannequinFaces(H: number): Face[] {
  const faces: Face[] = []
  const skin = '#d8b28c'
  const hair = '#2d241c'
  const pole = '#b8c0cc'
  const baseDisc = '#94a3b8'

  const addTube = (p0: V3, p1: V3, r0: number, r1: number, col: string) => {
    const dx = p1.x - p0.x
    const dy = p1.y - p0.y
    const dz = p1.z - p0.z
    const len = Math.hypot(dx, dy, dz) || 1
    const ax = dx / len
    const ay = dy / len
    const az = dz / len
    let ux = -ay
    let uy = ax
    let uz = 0
    const ul = Math.hypot(ux, uy, uz) || 1
    ux /= ul
    uy /= ul
    uz /= ul
    const vx = ay * uz - az * uy
    const vy = az * ux - ax * uz
    const vz = ax * uy - ay * ux
    const steps = 10
    const rings: V3[][] = []
    for (let j = 0; j <= steps; j++) {
      const u = j / steps
      const cx = p0.x + dx * u
      const cy = p0.y + dy * u
      const cz = p0.z + dz * u
      const r = r0 + (r1 - r0) * u
      const row: V3[] = []
      for (let i = 0; i <= SEGS; i++) {
        const a = (i / SEGS) * Math.PI * 2
        const ca = Math.cos(a) * r
        const sa = Math.sin(a) * r
        row.push({ x: cx + ux * ca + vx * sa, y: cy + uy * ca + vy * sa, z: cz + uz * ca + vz * sa })
      }
      rings.push(row)
    }
    for (let j = 0; j < steps; j++) {
      for (let i = 0; i < SEGS; i++) {
        pushQuad(faces, rings[j][i], rings[j][i + 1], rings[j + 1][i + 1], rings[j + 1][i], col)
      }
    }
  }

  // head
  const headY = 10
  const headR = 7
  const headRows = 10
  for (let j = 0; j < headRows; j++) {
    const p0 = (j / headRows) * Math.PI
    const p1 = ((j + 1) / headRows) * Math.PI
    const y0 = headY + headR * Math.cos(p0)
    const y1 = headY + headR * Math.cos(p1)
    const r0 = headR * Math.sin(p0)
    const r1 = headR * Math.sin(p1)
    const col = Math.cos((p0 + p1) / 2) > 0.25 ? hair : skin
    for (let i = 0; i < SEGS; i++) {
      const a0 = (i / SEGS) * Math.PI * 2
      const a1 = ((i + 1) / SEGS) * Math.PI * 2
      pushQuad(
        faces,
        { x: r0 * Math.sin(a0), y: y0, z: r0 * Math.cos(a0) },
        { x: r0 * Math.sin(a1), y: y0, z: r0 * Math.cos(a1) },
        { x: r1 * Math.sin(a1), y: y1, z: r1 * Math.cos(a1) },
        { x: r1 * Math.sin(a0), y: y1, z: r1 * Math.cos(a0) },
        col,
      )
    }
  }

  // neck
  for (let j = 0; j < 3; j++) {
    const y0 = headY - headR - j * 2.5
    const y1 = y0 - 2.5
    for (let i = 0; i < SEGS; i++) {
      const a0 = (i / SEGS) * Math.PI * 2
      const a1 = ((i + 1) / SEGS) * Math.PI * 2
      pushQuad(
        faces,
        { x: 3.2 * Math.sin(a0), y: y0, z: 3.2 * Math.cos(a0) },
        { x: 3.2 * Math.sin(a1), y: y0, z: 3.2 * Math.cos(a1) },
        { x: 3.2 * Math.sin(a1), y: y1, z: 3.2 * Math.cos(a1) },
        { x: 3.2 * Math.sin(a0), y: y1, z: 3.2 * Math.cos(a0) },
        skin,
      )
    }
  }

  // arms
  addTube({ x: -11.5, y: -1, z: 0 }, { x: -19, y: -42, z: 1.5 }, 3.6, 2.1, skin)
  addTube({ x: 11.5, y: -1, z: 0 }, { x: 19, y: -42, z: 1.5 }, 3.6, 2.1, skin)

  // hair bun
  for (let j = 0; j < 6; j++) {
    const p0 = (j / 6) * Math.PI
    const p1 = ((j + 1) / 6) * Math.PI
    const r0 = 4.2 * Math.sin(p0)
    const r1 = 4.2 * Math.sin(p1)
    const y0 = headY + headR * 0.25 + 4.2 * Math.cos(p0)
    const y1 = headY + headR * 0.25 + 4.2 * Math.cos(p1)
    for (let i = 0; i < SEGS; i++) {
      const a0 = (i / SEGS) * Math.PI * 2
      const a1 = ((i + 1) / SEGS) * Math.PI * 2
      pushQuad(
        faces,
        { x: r0 * Math.sin(a0), y: y0, z: -headR * 0.7 + r0 * Math.cos(a0) },
        { x: r0 * Math.sin(a1), y: y0, z: -headR * 0.7 + r0 * Math.cos(a1) },
        { x: r1 * Math.sin(a1), y: y1, z: -headR * 0.7 + r1 * Math.cos(a1) },
        { x: r1 * Math.sin(a0), y: y1, z: -headR * 0.7 + r1 * Math.cos(a0) },
        hair,
      )
    }
  }

  // stand pole
  const poleTop = -H * 0.35
  const poleBottom = -H - 16
  for (let i = 0; i < 12; i++) {
    const a0 = (i / 12) * Math.PI * 2
    const a1 = ((i + 1) / 12) * Math.PI * 2
    pushQuad(
      faces,
      { x: 1.6 * Math.sin(a0), y: poleTop, z: 1.6 * Math.cos(a0) },
      { x: 1.6 * Math.sin(a1), y: poleTop, z: 1.6 * Math.cos(a1) },
      { x: 1.6 * Math.sin(a1), y: poleBottom, z: 1.6 * Math.cos(a1) },
      { x: 1.6 * Math.sin(a0), y: poleBottom, z: 1.6 * Math.cos(a0) },
      pole,
    )
  }

  // base disc
  const baseY = poleBottom
  const discR = 16
  for (let i = 0; i < 24; i++) {
    const a0 = (i / 24) * Math.PI * 2
    const a1 = ((i + 1) / 24) * Math.PI * 2
    pushQuad(
      faces,
      { x: 0, y: baseY - 3, z: 0 },
      { x: discR * Math.sin(a0), y: baseY - 3, z: discR * Math.cos(a0) },
      { x: discR * Math.sin(a1), y: baseY - 3, z: discR * Math.cos(a1) },
      { x: discR * Math.sin(a1), y: baseY, z: discR * Math.cos(a1) },
      baseDisc,
    )
    pushQuad(
      faces,
      { x: discR * Math.sin(a0), y: baseY, z: discR * Math.cos(a0) },
      { x: discR * Math.sin(a1), y: baseY, z: discR * Math.cos(a1) },
      { x: 0, y: baseY, z: 0 },
      { x: 0, y: baseY, z: 0 },
      baseDisc,
    )
  }

  return faces
}

function rotate(p: V3, yaw: number, pitch: number): V3 {
  const cosY = Math.cos(yaw)
  const sinY = Math.sin(yaw)
  const x1 = p.x * cosY + p.z * sinY
  const z1 = -p.x * sinY + p.z * cosY
  const cosP = Math.cos(pitch)
  const sinP = Math.sin(pitch)
  const y2 = p.y * cosP - z1 * sinP
  const z2 = p.y * sinP + z1 * cosP
  return { x: x1, y: y2, z: z2 }
}

const LIGHT: V3 = (() => {
  const l = { x: -0.35, y: 0.5, z: -0.79 }
  const len = Math.hypot(l.x, l.y, l.z)
  return { x: l.x / len, y: l.y / len, z: l.z / len }
})()

export function Dress3D({ design, className }: { design: Dress3DDesign; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const facesRef = useRef<Face[]>([])
  const yawRef = useRef(0.5)
  const pitchRef = useRef(-0.12)
  const dragRef = useRef<{ x: number; y: number } | null>(null)
  const autoRef = useRef(true)
  const zoomRef = useRef(1)

  useEffect(() => {
    facesRef.current = [...buildDressFaces(design), ...buildMannequinFaces(dressHeight(design.length))]
  }, [design])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let raf = 0
    let width = 0
    let height = 0

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      width = Math.max(1, rect.width)
      height = Math.max(1, rect.height)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const draw = () => {
      raf = requestAnimationFrame(draw)
      if (autoRef.current && !dragRef.current) yawRef.current += 0.008
      const faces = facesRef.current
      ctx.clearRect(0, 0, width, height)

      const bg = ctx.createLinearGradient(0, 0, 0, height)
      bg.addColorStop(0, '#eef2f8')
      bg.addColorStop(0.55, '#dfe6f0')
      bg.addColorStop(1, '#cdd6e3')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, width, height)
      const glow = ctx.createRadialGradient(width * 0.5, height * 0.32, 0, width * 0.5, height * 0.32, Math.max(width, height) * 0.7)
      glow.addColorStop(0, 'rgba(255,255,255,0.75)')
      glow.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = glow
      ctx.fillRect(0, 0, width, height)

      const cx = width / 2
      const cy = height / 2 + height * 0.04
      const camDist = 300
      const scale = Math.min(width, height) * 2.1 * zoomRef.current
      const yaw = yawRef.current
      const pitch = pitchRef.current

      const shadowY = cy + scale * 0.34
      ctx.save()
      ctx.beginPath()
      ctx.ellipse(cx, shadowY, scale * 0.34, scale * 0.08, 0, 0, Math.PI * 2)
      const sg = ctx.createRadialGradient(cx, shadowY, 0, cx, shadowY, scale * 0.34)
      sg.addColorStop(0, 'rgba(15,23,42,0.3)')
      sg.addColorStop(1, 'rgba(15,23,42,0)')
      ctx.fillStyle = sg
      ctx.fill()
      ctx.restore()

      interface Projected {
        pts: { x: number; y: number }[]
        depth: number
        color: string
      }
      const projected: Projected[] = []

      for (const face of faces) {
        const rotated = face.pts.map((p) => rotate(p, yaw, pitch))
        let depth = 0
        for (const p of rotated) depth += p.z + camDist
        depth /= rotated.length

        const ax = rotated[1].x - rotated[0].x
        const ay = rotated[1].y - rotated[0].y
        const az = rotated[1].z - rotated[0].z
        const bx = rotated[2].x - rotated[0].x
        const by = rotated[2].y - rotated[0].y
        const bz = rotated[2].z - rotated[0].z
        let nx = ay * bz - az * by
        let ny = az * bx - ax * bz
        let nz = ax * by - ay * bx
        const nl = Math.hypot(nx, ny, nz) || 1
        nx /= nl
        ny /= nl
        nz /= nl
        const lam = Math.abs(nx * LIGHT.x + ny * LIGHT.y + nz * LIGHT.z)
        const view = Math.abs(nz)
        const spec = Math.pow(Math.max(0, lam), 16)
        const rim = Math.pow(1 - view, 3) * 0.22
        const k = Math.min(1.7, 0.34 + 0.58 * lam + 0.45 * spec + rim)

        const pts = rotated.map((p) => {
          const f = scale / (p.z + camDist)
          return { x: cx + p.x * f, y: cy - p.y * f }
        })
        projected.push({ pts, depth, color: shadeColor(face.color, k) })
      }

      projected.sort((a, b) => a.depth - b.depth)
      for (const face of projected) {
        ctx.beginPath()
        ctx.moveTo(face.pts[0].x, face.pts[0].y)
        for (let i = 1; i < face.pts.length; i++) ctx.lineTo(face.pts[i].x, face.pts[i].y)
        ctx.closePath()
        ctx.fillStyle = face.color
        ctx.fill()
      }
    }
    raf = requestAnimationFrame(draw)

    const onDown = (e: PointerEvent) => {
      dragRef.current = { x: e.clientX, y: e.clientY }
      canvas.setPointerCapture(e.pointerId)
      canvas.style.cursor = 'grabbing'
    }
    const onMove = (e: PointerEvent) => {
      if (!dragRef.current) return
      const dx = e.clientX - dragRef.current.x
      const dy = e.clientY - dragRef.current.y
      dragRef.current = { x: e.clientX, y: e.clientY }
      yawRef.current += dx * 0.012
      pitchRef.current = Math.max(-0.5, Math.min(0.4, pitchRef.current + dy * 0.006))
    }
    const onUp = (e: PointerEvent) => {
      dragRef.current = null
      canvas.style.cursor = 'grab'
      if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId)
    }
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      zoomRef.current = Math.max(0.5, Math.min(2.6, zoomRef.current * (e.deltaY > 0 ? 0.92 : 1.08)))
    }
    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointercancel', onUp)
    canvas.addEventListener('wheel', onWheel, { passive: false })

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointercancel', onUp)
      canvas.removeEventListener('wheel', onWheel)
    }
  }, [])

  return <canvas ref={canvasRef} className={className} style={{ cursor: 'grab', touchAction: 'none' }} />
}
