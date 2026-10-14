import { useRef, useState } from 'react'
import { useI18n } from '../i18n/LanguageContext'
import { loadImageFile } from '../lib/sketch'
import { vectorizeDataUrl, type TilkResult } from '../lib/vectorize'
import { Button } from './ui'
import { cn } from './cn'

interface Props {
  svg?: string
  viewBox?: string
  color: string
  onApply: (svg: string, viewBox: string) => void
  onClear: () => void
}

export function TilkConverter({ svg, viewBox, color, onApply, onClear }: Props) {
  const { t } = useI18n()
  const inputRef = useRef<HTMLInputElement>(null)
  const [source, setSource] = useState<string | null>(null)
  const [result, setResult] = useState<TilkResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  async function handleFile(file: File) {
    setBusy(true)
    try {
      const image = await loadImageFile(file)
      setSource(image.dataUrl)
      const vector = await vectorizeDataUrl(image.dataUrl)
      setResult(vector)
    } finally {
      setBusy(false)
    }
  }

  function pick(files: FileList | null) {
    const file = files?.[0]
    if (file && file.type.startsWith('image/')) handleFile(file)
  }

  function reset() {
    setSource(null)
    setResult(null)
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

      {!source ? (
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
            'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors',
            dragOver ? 'border-brand-500 bg-brand-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100',
          )}
        >
          <span className="text-2xl text-slate-400">⛶</span>
          <span className="text-sm font-medium text-slate-600">{t('tilk_drop')}</span>
          <span className="text-xs text-slate-400">{t('tilk_hint')}</span>
        </button>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
            <p className="border-b border-slate-100 px-2 py-1 text-[11px] font-medium text-slate-500">{t('tilk_original')}</p>
            <img src={source} alt="tilk" className="mx-auto max-h-40 w-full object-contain p-1" />
          </div>
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <p className="border-b border-slate-100 px-2 py-1 text-[11px] font-medium text-slate-500">
              {t('tilk_vector')} · {result?.strokes ?? 0}
            </p>
            <svg viewBox={result?.viewBox ?? '0 0 100 100'} className="mx-auto h-40 w-full bg-white">
              {result?.path && (
                <path
                  d={result.path}
                  fill="none"
                  stroke={color}
                  strokeWidth={1.3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </svg>
          </div>
        </div>
      )}

      {source && (
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => inputRef.current?.click()} disabled={busy}>
            {t('sketch_choose')}
          </Button>
          <Button
            size="sm"
            variant="primary"
            disabled={busy || !result?.path}
            onClick={() => result && onApply(result.path, result.viewBox)}
          >
            {t('tilk_apply')}
          </Button>
          <Button size="sm" variant="ghost" onClick={reset}>
            {t('reset')}
          </Button>
          {busy && <span className="text-xs text-slate-400">{t('tilk_working')}</span>}
        </div>
      )}

      {svg && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
          <div className="flex items-center gap-2">
            <svg viewBox={viewBox ?? '0 0 100 100'} className="h-8 w-16 bg-white">
              <path d={svg} fill="none" stroke={color} strokeWidth={1.3} vectorEffect="non-scaling-stroke" />
            </svg>
            <span className="text-xs font-medium text-emerald-700">{t('tilk_active')}</span>
          </div>
          <Button size="sm" variant="ghost" onClick={onClear}>
            {t('tilk_remove')}
          </Button>
        </div>
      )}
    </div>
  )
}
