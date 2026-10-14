import { useId } from 'react'
import type { Design } from '../db/types'
import { dressOutline, neckPath, sleevePaths, tibebBands, type BandRect } from '../lib/dressShape'
import { bandMarkup } from '../lib/motifs'

export type PreviewDesign = Pick<
  Design,
  | 'garmentType'
  | 'silhouette'
  | 'neckline'
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
  | 'tilkSvg'
  | 'tilkViewBox'
>

export function TilkOverlay({
  band,
  design,
  color,
}: {
  band: BandRect
  design: PreviewDesign
  color: string
}) {
  if (!design.tilkSvg || !design.tilkViewBox) return null
  const [vbW, vbH] = design.tilkViewBox.split(' ').slice(2).map(Number)
  if (!vbW || !vbH) return null
  const rotate = band.vertical
  return (
    <svg
      x={band.x}
      y={band.y}
      width={band.w}
      height={band.h}
      viewBox={`0 0 ${vbW} ${vbH}`}
      preserveAspectRatio="none"
      style={rotate ? { transformBox: 'fill-box', transformOrigin: 'top left', transform: 'rotate(90deg) translateY(-100%)' } : undefined}
    >
      <path
        d={design.tilkSvg}
        fill="none"
        stroke={color}
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function DesignPreview({ design, className }: { design: PreviewDesign; className?: string }) {
  const uid = useId().replace(/[:]/g, '')
  const topOnly = design.garmentType === 'vest' || design.garmentType === 'tshirt'
  const base = design.baseColor || '#f7f5ef'
  const band = design.tiletColors.length ? design.tiletColors : ['#b91c1c', '#d4a017', '#15803d']
  const spec = {
    silhouette: design.silhouette,
    neckline: design.neckline,
    sleeve: design.sleeve,
    length: design.length,
    tiletPlacement: design.tiletPlacement,
    hasTibeb: design.tibebStyle !== 'none',
  }
  const dressPath = dressOutline(spec, topOnly)
  const sleeves = sleevePaths(spec)
  const bands = tibebBands(spec, topOnly, design.bandWidth ?? 14)
  const pattern = {
    motif: design.motif,
    repeat: design.motifRepeat,
    mirror: design.mirrorMotif,
    stripeCount: design.stripeCount,
  }
  const markup = bands.map((b) => bandMarkup(b, band, pattern)).join('')

  return (
    <svg viewBox="0 0 200 320" className={className} role="img" aria-label="design preview">
      <defs>
        <clipPath id={`clip-${uid}`}>
          <path d={dressPath} />
          {sleeves && <path d={sleeves.left} />}
          {sleeves && <path d={sleeves.right} />}
        </clipPath>
      </defs>

      {sleeves && (
        <>
          <path d={sleeves.left} fill={base} stroke="#94a3b8" strokeWidth="1" />
          <path d={sleeves.right} fill={base} stroke="#94a3b8" strokeWidth="1" />
        </>
      )}

      <path d={dressPath} fillRule="evenodd" fill={base} stroke="#64748b" strokeWidth="1.2" />
      <path d={neckPath(design.neckline)} fill="#ffffff" stroke="#64748b" strokeWidth="1" />

      {spec.hasTibeb && (
        <g clipPath={`url(#clip-${uid})`}>
          <g dangerouslySetInnerHTML={{ __html: markup }} />
          {bands.map((b, i) => (
            <TilkOverlay key={i} band={b} design={design} color={band[0]} />
          ))}
        </g>
      )}

      {topOnly && design.garmentType === 'vest' && (
        <>
          <line x1="100" y1="44" x2="100" y2="170" stroke="#64748b" strokeWidth="1" strokeDasharray="3 3" />
          {[0, 1, 2].map((i) => (
            <circle key={i} cx="100" cy={70 + i * 34} r="2" fill="#94a3b8" />
          ))}
        </>
      )}
    </svg>
  )
}
