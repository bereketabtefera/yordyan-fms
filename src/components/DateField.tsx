import { useState } from 'react'
import { useI18n } from '../i18n/LanguageContext'
import { ETHIOPIAN_MONTHS, fromEthiopian, toEthiopian } from '../lib/ethiopianDate'
import { formatDate } from '../lib/format'
import { cn } from './cn'

export function DateField({
  label,
  value,
  onChange,
  required,
  className,
}: {
  label?: string
  value: string
  onChange: (iso: string) => void
  required?: boolean
  className?: string
}) {
  const { t, lang } = useI18n()
  const [mode, setMode] = useState<'greg' | 'eth'>('greg')
  const eth = value ? toEthiopian(value) : null

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-600">
          {label}
          {required && <span className="text-red-500"> *</span>}
        </span>
        <div className="flex overflow-hidden rounded-md border border-slate-200 text-[10px]">
          <button
            type="button"
            onClick={() => setMode('greg')}
            className={cn('px-1.5 py-0.5', mode === 'greg' ? 'bg-brand-600 text-white' : 'bg-white text-slate-500')}
          >
            G.C.
          </button>
          <button
            type="button"
            onClick={() => setMode('eth')}
            className={cn('px-1.5 py-0.5', mode === 'eth' ? 'bg-brand-600 text-white' : 'bg-white text-slate-500')}
          >
            ዓ.ም
          </button>
        </div>
      </div>

      {mode === 'greg' ? (
        <input
          type="date"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-400"
        />
      ) : (
        <div className="flex gap-1.5">
          <input
            type="number"
            min={1}
            max={30}
            placeholder={t('date')}
            value={eth?.day ?? ''}
            onChange={(e) => {
              const day = Math.min(30, Math.max(1, Number(e.target.value)))
              const m = eth?.month ?? 1
              const y = eth?.year ?? new Date().getFullYear() - 7
              onChange(fromEthiopian({ year: y, month: m, day }))
            }}
            className="w-14 rounded-lg border border-slate-300 px-2 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
          <select
            value={eth?.month ?? 1}
            onChange={(e) => {
              const month = Number(e.target.value)
              const day = eth?.day ?? 1
              const y = eth?.year ?? new Date().getFullYear() - 7
              onChange(fromEthiopian({ year: y, month, day }))
            }}
            className="flex-1 rounded-lg border border-slate-300 px-2 py-2 text-sm focus:border-brand-500 focus:outline-none"
          >
            {ETHIOPIAN_MONTHS[lang].map((name, i) => (
              <option key={i} value={i + 1}>
                {name}
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="year"
            value={eth?.year ?? ''}
            onChange={(e) => {
              const year = Number(e.target.value)
              const month = eth?.month ?? 1
              const day = eth?.day ?? 1
              if (year) onChange(fromEthiopian({ year, month, day }))
            }}
            className="w-20 rounded-lg border border-slate-300 px-2 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
        </div>
      )}

      {value && (
        <span className="text-[11px] text-slate-400">
          {mode === 'greg' ? formatDate(value, 'en') : ''} {value && eth ? `· ${formatDate(value, lang)}` : ''}
        </span>
      )}
    </div>
  )
}
