import { useId } from 'react'
import { dressOutline, neckPath, sleevePaths, tibebBands } from '../lib/dressShape'
import { bandMarkup } from '../lib/motifs'
import { TilkOverlay, type PreviewDesign } from './DesignPreview'

export function MannequinPreview({ design, className }: { design: PreviewDesign; className?: string }) {
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
  const showLegs = topOnly || design.length === 'short' || design.length === 'knee'
  const pattern = {
    motif: design.motif,
    repeat: design.motifRepeat,
    mirror: design.mirrorMotif,
    stripeCount: design.stripeCount,
  }
  const markup = bands.map((b) => bandMarkup(b, band, pattern)).join('')

  return (
    <svg viewBox="0 -52 200 430" className={className} role="img" aria-label="mannequin preview">
      <defs>
        <radialGradient id={`studio-${uid}`} cx="0.5" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.65" stopColor="#eef1f6" />
          <stop offset="1" stopColor="#d7dde7" />
        </radialGradient>
        <linearGradient id={`shade-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000000" stopOpacity="0.24" />
          <stop offset="0.28" stopColor="#000000" stopOpacity="0" />
          <stop offset="0.48" stopColor="#ffffff" stopOpacity="0.32" />
          <stop offset="0.62" stopColor="#ffffff" stopOpacity="0.05" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id={`skin-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#c99a6d" />
          <stop offset="0.35" stopColor="#ecc59d" />
          <stop offset="0.55" stopColor="#f6dcbe" />
          <stop offset="1" stopColor="#c08e60" />
        </linearGradient>
        <linearGradient id={`hair-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#1c1512" />
          <stop offset="0.5" stopColor="#4a3a2e" />
          <stop offset="1" stopColor="#1c1512" />
        </linearGradient>
        <radialGradient id={`floor-${uid}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#0f172a" stopOpacity="0.34" />
          <stop offset="1" stopColor="#0f172a" stopOpacity="0" />
        </radialGradient>
        <filter id={`soft-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#0f172a" floodOpacity="0.28" />
        </filter>
      </defs>

      <rect x="0" y="-52" width="200" height="430" fill={`url(#studio-${uid})`} />
      <ellipse cx="100" cy="336" rx="66" ry="20" fill={`url(#floor-${uid})`} />

      {/* stand */}
      <g>
        <rect x="97.2" y="168" width="5.6" height="168" fill="#aab3c0" />
        <rect x="97.2" y="168" width="2" height="168" fill="#e6ebf2" />
        <ellipse cx="100" cy="336" rx="40" ry="10" fill="#b9c1cd" />
        <ellipse cx="100" cy="334" rx="40" ry="10" fill={`url(#studio-${uid})`} />
        <ellipse cx="100" cy="333.5" rx="40" ry="9" fill="#e8edf4" />
      </g>

      {/* legs */}
      {showLegs && (
        <g>
          <path d="M 86 168 C 84 228, 83 284, 85 322 L 96 322 C 97 284, 98 228, 98 168 Z" fill={`url(#skin-${uid})`} />
          <path d="M 102 168 C 102 228, 103 284, 104 322 L 115 322 C 117 284, 116 228, 114 168 Z" fill={`url(#skin-${uid})`} />
          <ellipse cx="90" cy="325" rx="9" ry="4.5" fill="#b98a5e" />
          <ellipse cx="110" cy="325" rx="9" ry="4.5" fill="#b98a5e" />
        </g>
      )}

      {/* arms behind */}
      <path d="M 76 42 C 63 57, 57 92, 59 132 C 60 147, 69 149, 71 134 C 73 101, 78 72, 89 55 Z" fill={`url(#skin-${uid})`} />
      <path d="M 124 42 C 137 57, 143 92, 141 132 C 140 147, 131 149, 129 134 C 127 101, 122 72, 111 55 Z" fill={`url(#skin-${uid})`} />
      <ellipse cx="64" cy="140" rx="5.5" ry="9" fill="#c99a6d" />
      <ellipse cx="136" cy="140" rx="5.5" ry="9" fill="#c99a6d" />

      {/* torso / head */}
      <ellipse cx="100" cy="150" rx="26" ry="36" fill={`url(#skin-${uid})`} />
      <rect x="76" y="148" width="48" height="28" rx="9" fill={`url(#skin-${uid})`} />
      <rect x="93" y="8" width="14" height="34" rx="6" fill="#c99a6d" />
      <ellipse cx="100" cy="41" rx="27" ry="8" fill={`url(#skin-${uid})`} />
      <circle cx="100" cy="0" r="13.5" fill={`url(#skin-${uid})`} />
      <path d="M 86.5 -3 C 86.5 -18, 113.5 -18, 113.5 -3 C 113.5 -10, 108 -14, 100 -14 C 92 -14, 86.5 -10, 86.5 -3 Z" fill={`url(#hair-${uid})`} />
      <path d="M 86.5 -3 C 84 -10, 84 -16, 90 -20 C 95 -24, 105 -24, 110 -20 C 116 -16, 116 -10, 113.5 -3 C 112 -9, 106 -12, 100 -12 C 94 -12, 88 -9, 86.5 -3 Z" fill={`url(#hair-${uid})`} />
      <ellipse cx="100" cy="1" rx="13.5" ry="12" fill="#000000" opacity="0.04" />

      {/* dress */}
      {sleeves && (
        <>
          <path d={sleeves.left} fill={base} stroke="#94a3b8" strokeWidth="0.8" filter={`url(#soft-${uid})`} />
          <path d={sleeves.right} fill={base} stroke="#94a3b8" strokeWidth="0.8" filter={`url(#soft-${uid})`} />
        </>
      )}
      <path d={dressPath} fill={base} stroke="#5b6472" strokeWidth="1.1" filter={`url(#soft-${uid})`} />

      <g clipPath={`url(#mclip-${uid})`}>
        <path d={dressPath} fill={`url(#shade-${uid})`} />
        {/* drape folds */}
        <g stroke="#000000" strokeOpacity="0.1" fill="none" strokeWidth="0.7">
          <path d="M 78 140 C 74 190, 72 240, 70 300" />
          <path d="M 122 140 C 126 190, 128 240, 130 300" />
          <path d="M 88 130 C 84 190, 86 250, 84 305" />
          <path d="M 112 130 C 116 190, 114 250, 116 305" />
        </g>
        <g stroke="#ffffff" strokeOpacity="0.22" fill="none" strokeWidth="1">
          <path d="M 100 130 L 100 300" />
          <path d="M 92 135 C 90 190, 90 245, 92 300" />
        </g>
        {spec.hasTibeb && <g dangerouslySetInnerHTML={{ __html: markup }} />}
        {bands.map((b, i) => (
          <TilkOverlay key={i} band={b} design={design} color={band[0]} />
        ))}
      </g>

      <path d={neckPath(design.neckline)} fill="#c99a6d" stroke="#b08a66" strokeWidth="0.8" />
      <path d="M 78 40 C 88 33, 112 33, 122 40" fill="none" stroke="#00000033" strokeWidth="1.6" />
      <defs>
        <clipPath id={`mclip-${uid}`}>
          <path d={dressPath} />
          {sleeves && <path d={sleeves.left} />}
          {sleeves && <path d={sleeves.right} />}
        </clipPath>
      </defs>
    </svg>
  )
}
