import type { Design } from '../db/types'
import { DESIGN_PRESETS, type DesignPreset } from '../lib/designPresets'
import { useI18n } from '../i18n/LanguageContext'
import { DesignPreview } from './DesignPreview'
import { Button } from './ui'

export function DesignPresets({
  onLoad,
  onSave,
}: {
  onLoad: (preset: DesignPreset) => void
  onSave: (preset: DesignPreset) => void
}) {
  const { t, lang } = useI18n()
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {DESIGN_PRESETS.map((p) => {
        const design = { ...p.design, id: 0, createdAt: '' } as Design
        return (
          <div key={p.id} className="flex flex-col rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
            <div className="rounded-lg bg-gradient-to-b from-white to-slate-100">
              <DesignPreview design={design} className="mx-auto h-40 w-full" />
            </div>
            <div className="mt-2 flex-1">
              <p className="truncate text-sm font-semibold text-slate-800">{lang === 'am' ? p.nameAm : p.name}</p>
              <p className="truncate text-xs text-slate-400">{lang === 'am' ? p.name : p.nameAm}</p>
              <div className="mt-1.5 flex gap-1">
                <span className="h-4 w-4 rounded border border-slate-200" style={{ background: p.design.baseColor }} />
                {p.design.tiletColors.map((c, i) => (
                  <span key={i} className="h-4 w-4 rounded border border-slate-200" style={{ background: c }} />
                ))}
              </div>
            </div>
            <div className="mt-2 flex gap-2">
              <Button size="sm" variant="primary" className="flex-1" onClick={() => onLoad(p)}>
                {t('preset_load')}
              </Button>
              <Button size="sm" variant="gold" onClick={() => onSave(p)}>
                {t('preset_save')}
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
