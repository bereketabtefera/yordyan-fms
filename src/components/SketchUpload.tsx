import { useRef, useState } from 'react'
import type { PatternPiece } from '../lib/patterns'
import type { PatternProposal, SketchAnalysis, TiletProposal } from '../lib/sketch'
import type { TKey } from '../i18n/strings'
import { useI18n } from '../i18n/LanguageContext'
import { Badge, Button } from './ui'
import { cn } from './cn'

interface Props {
  sketch: string | null
  analysis: SketchAnalysis | null
  analyzing: boolean
  seamAllowance: number
  sizeLabel: string
  pieces: PatternPiece[]
  onFile: (file: File) => void
  onClear: () => void
  onApplyTilet: (p: TiletProposal) => void
  onApplyPattern: (p: PatternProposal) => void
  onSavePattern: () => void
  savedMessage: string
}

function labelText(p: TiletProposal, t: (k: TKey) => string): string {
  if (p.origin === 'classic') return p.label
  return t(p.label as TKey)
}

const originTone = { sketch: 'green', harmony: 'blue', classic: 'gold' } as const

export function SketchUpload({
  sketch,
  analysis,
  analyzing,
  seamAllowance,
  sizeLabel,
  pieces,
  onFile,
  onClear,
  onApplyTilet,
  onApplyPattern,
  onSavePattern,
  savedMessage,
}: Props) {
  const { t } = useI18n()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  function pick(files: FileList | null) {
    const file = files?.[0]
    if (file && file.type.startsWith('image/')) onFile(file)
  }

  return (
    <div className="grid gap-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          pick(e.target.files)
          e.target.value = ''
        }}
      />

      {!sketch ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            pick(e.dataTransfer.files)
          }}
          className={cn(
            'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-10 text-center transition-colors',
            dragOver ? 'border-brand-500 bg-brand-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100',
          )}
        >
          <span className="text-2xl text-slate-400">✎</span>
          <span className="text-sm font-medium text-slate-600">{t('sketch_drop')}</span>
          <span className="text-xs text-slate-400">{t('sketch_title')}</span>
        </button>
      ) : (
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          <img src={sketch} alt="sketch" className="mx-auto max-h-64 w-full object-contain" />
          {analyzing && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-sm font-medium text-slate-600">
              {t('sketch_analyzing')}
            </div>
          )}
          <div className="absolute right-2 top-2 flex gap-1">
            <Button size="sm" variant="secondary" onClick={() => inputRef.current?.click()}>
              {t('sketch_choose')}
            </Button>
            <Button size="sm" variant="ghost" className="bg-white/80" onClick={onClear}>
              ✕
            </Button>
          </div>
        </div>
      )}

      {analysis && (
        <>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-medium text-slate-600">{t('sketch_detected')}:</span>
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5">
              <span className="h-3 w-3 rounded-full border border-slate-200" style={{ background: analysis.baseColor }} />
              {analysis.baseColor}
            </span>
            {analysis.colors.slice(0, 6).map((c, i) => (
              <span key={i} className="h-4 w-4 rounded border border-slate-200" style={{ background: c }} />
            ))}
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold text-slate-600">{t('sketch_proposals')}</p>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {analysis.tiletProposals.map((p, i) => (
                <div key={i} className="rounded-lg border border-slate-200 bg-white p-2">
                  <div className="flex items-center justify-between gap-1">
                    <span className="truncate text-[11px] font-medium text-slate-600">{labelText(p, t)}</span>
                    <Badge tone={originTone[p.origin]}>
                      {p.origin === 'sketch'
                        ? t('sketch_origin_sketch')
                        : p.origin === 'harmony'
                          ? t('sketch_origin_harmony')
                          : t('sketch_origin_classic')}
                    </Badge>
                  </div>
                  <div className="mt-2 flex gap-1">
                    <span className="h-6 flex-1 rounded border border-slate-200" style={{ background: p.base }} />
                    {p.colors.map((c, j) => (
                      <span key={j} className="h-6 flex-1 rounded border border-slate-200" style={{ background: c }} />
                    ))}
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">{t(('tib_' + p.style) as TKey)}</span>
                    <Button size="sm" variant="primary" onClick={() => onApplyTilet(p)}>
                      {t('sketch_apply')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold text-slate-600">{t('sketch_patternProposals')}</p>
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm text-slate-700">
                  <span className="font-semibold">{t(('garment_' + analysis.pattern.garment) as TKey)}</span>
                  <span className="text-slate-400">
                    {' · '}
                    {t(('sil_' + analysis.pattern.silhouette) as TKey)}
                    {' · '}
                    {t(('slv_' + analysis.pattern.sleeve) as TKey)}
                    {' · '}
                    {t('sketch_pieces', { n: pieces.length })}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => onApplyPattern(analysis.pattern)}>
                    {t('sketch_apply')}
                  </Button>
                  <Button size="sm" variant="gold" onClick={onSavePattern} disabled={!pieces.length}>
                    {t('sketch_savePattern')}
                  </Button>
                </div>
              </div>
              {savedMessage && <p className="mt-2 text-xs font-medium text-emerald-600">{savedMessage}</p>}
              {pieces.length > 0 && (
                <>
                  <p className="mt-2 text-[11px] text-slate-400">
                    {t('sketch_patternHint', { sa: seamAllowance, size: sizeLabel })}
                  </p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {pieces.map((p, i) => {
                      const w = p.outline.reduce((a, q) => Math.max(a, q.x), 0) + 2
                      const h = p.outline.reduce((a, q) => Math.max(a, q.y), 0) + 2
                      return (
                        <div key={i} className="rounded border border-slate-100 bg-slate-50 p-1.5 text-[11px]">
                          <div className="font-medium text-slate-700">{t(p.key)}</div>
                          <div className="text-slate-400">
                            {p.cut} pcs · {p.width}×{p.height} cm
                          </div>
                          <svg viewBox={`0 0 ${w} ${h}`} className="mt-1 h-24 w-full">
                            <polygon
                              points={p.outline.map((q) => `${q.x + 1},${q.y + 1}`).join(' ')}
                              fill="none"
                              stroke="#0f172a"
                              strokeWidth="0.3"
                            />
                            <polygon
                              points={p.stitch.map((q) => `${q.x + 1},${q.y + 1}`).join(' ')}
                              fill="none"
                              stroke="#64748b"
                              strokeWidth="0.2"
                              strokeDasharray="1 1"
                            />
                          </svg>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
