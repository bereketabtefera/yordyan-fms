import type { MotifId, TibebStyle } from '../db/types'
import { motifDef, motifsForStyle } from '../lib/motifs'
import { useI18n } from '../i18n/LanguageContext'
import { cn } from './cn'

function Preview({ id, colors }: { id: MotifId; colors: string[] }) {
  const w = 56
  const h = 30
  const palette = colors.length ? colors : ['#b91c1c', '#d4a017', '#15803d']
  if (id === 'stripe') {
    const n = 5
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="h-7 w-full">
        {Array.from({ length: n }, (_, i) => (
          <rect key={i} x="0" y={(i * h) / n} width={w} height={h / n} fill={palette[i % palette.length]} />
        ))}
      </svg>
    )
  }
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-7 w-full">
      <g dangerouslySetInnerHTML={{ __html: motifDef(id).render(w, h, palette) }} />
    </svg>
  )
}

export function MotifPicker({
  style,
  value,
  colors,
  onChange,
}: {
  style: TibebStyle
  value: MotifId | undefined
  colors: string[]
  onChange: (id: MotifId) => void
}) {
  const { lang } = useI18n()
  const list = motifsForStyle(style)
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {list.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => onChange(m.id)}
          className={cn(
            'overflow-hidden rounded-lg border p-1.5 text-left transition-colors',
            value === m.id ? 'border-brand-500 ring-1 ring-brand-400' : 'border-slate-200 hover:bg-slate-50',
          )}
        >
          <Preview id={m.id} colors={colors} />
          <span className="mt-1 block truncate text-[10px] font-medium text-slate-600">
            {lang === 'am' ? m.am : m.en}
          </span>
        </button>
      ))}
    </div>
  )
}
