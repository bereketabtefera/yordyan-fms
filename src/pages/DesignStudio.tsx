import { useMemo, useState } from 'react'
import { db } from '../db/db'
import { useData } from '../db/DataContext'
import type {
  Design,
  GarmentType,
  MotifId,
  Neckline,
  PatternSet,
  Silhouette,
  SleeveStyle,
  TiletPlacement,
  TibebStyle,
  DressLength,
} from '../db/types'
import { useI18n } from '../i18n/LanguageContext'
import {
  GARMENT_TYPES,
  NECKLINES,
  SLEEVES,
  LENGTHS,
  TIBEB_STYLES,
  TILET_PLACEMENTS,
  SILHOUETTES,
  codeOf,
  contrastRatio,
  emptyDesign,
} from '../lib/design'
import type { SketchAnalysis, SketchImage, PatternProposal, TiletProposal } from '../lib/sketch'
import { analyzeSketchDataUrl, loadImageFile } from '../lib/sketch'
import { draftPieces, resolveMeasurements, standardSizes } from '../lib/patterns'
import { applyPreset, type DesignPreset } from '../lib/designPresets'
import { DesignPreview } from '../components/DesignPreview'
import { MannequinPreview } from '../components/MannequinPreview'
import { Dress3D } from '../components/Dress3D'
import { SketchUpload } from '../components/SketchUpload'
import { MotifPicker } from '../components/MotifPicker'
import { TilkConverter } from '../components/TilkConverter'
import { DesignPresets } from '../components/DesignPresets'
import { Button, Card, Field, Input, PageHeader, Select, Textarea } from '../components/ui'
import { cn } from '../components/cn'

type Draft = Omit<Design, 'id'> & { id?: number }
type PreviewMode = '2d' | 'mannequin' | '3d'

const PREVIEW_SIZE = 'M'
const SEAM_ALLOWANCE = 1.5

export function DesignStudio() {
  const { t } = useI18n()
  const { designs, colorPalettes } = useData()
  const [draft, setDraft] = useState<Draft>(emptyDesign(codeOf(designs)))
  const [sketch, setSketch] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<SketchAnalysis | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [mode, setMode] = useState<PreviewMode>('2d')
  const [savedMessage, setSavedMessage] = useState('')

  function update<K extends keyof Draft>(k: K, v: Draft[K]) {
    setDraft((d) => ({ ...d, [k]: v }))
  }

  const pieces = useMemo(() => {
    const sizes = standardSizes(draft.garmentType)
    const meas = resolveMeasurements(sizes, PREVIEW_SIZE, {})
    return draftPieces(draft.garmentType, meas, SEAM_ALLOWANCE, draft.silhouette, draft.sleeve)
  }, [draft.garmentType, draft.silhouette, draft.sleeve])

  async function handleFile(file: File) {
    setSavedMessage('')
    setAnalyzing(true)
    try {
      const image: SketchImage = await loadImageFile(file)
      setSketch(image.dataUrl)
      const result = await analyzeSketchDataUrl(image.dataUrl)
      setAnalysis(result)
      setDraft((d) => ({ ...d, sketch: image.dataUrl, sketchColors: result.colors }))
      update('baseColor', result.baseColor)
      setMode('mannequin')
    } catch {
      setSketch(null)
    } finally {
      setAnalyzing(false)
    }
  }

  function clearSketch() {
    setSketch(null)
    setAnalysis(null)
    setSavedMessage('')
    setDraft((d) => ({ ...d, sketch: undefined, sketchColors: undefined }))
  }

  function applyTilet(p: TiletProposal) {
    setDraft((d) => ({ ...d, baseColor: p.base, tiletColors: [...p.colors], tibebStyle: p.style }))
    setSavedMessage(t('sketch_applied'))
    setMode('mannequin')
  }

  function applyPattern(p: PatternProposal) {
    setDraft((d) => ({
      ...d,
      garmentType: p.garment,
      silhouette: p.silhouette,
      sleeve: p.sleeve as SleeveStyle,
    }))
    setSavedMessage(t('sketch_applied'))
  }

  function loadPreset(p: DesignPreset) {
    setDraft({ ...emptyDesign(codeOf(designs)), ...p.design })
    setSavedMessage('')
    setMode('mannequin')
  }

  async function savePreset(p: DesignPreset) {
    await db.designs.add(applyPreset(p, codeOf(designs)))
    setSavedMessage(t('preset_saved'))
  }

  function applyTilk(svg: string, viewBox: string) {
    setDraft((d) => ({ ...d, tilkSvg: svg, tilkViewBox: viewBox }))
    setSavedMessage('')
  }

  function randomizePalette() {
    const hue = Math.floor(Math.random() * 360)
    const hsl = (h: number, s: number, l: number) => {
      const a = (s * Math.min(l, 1 - l)) / 100
      const f = (n: number) => {
        const k = (n + h / 30) % 12
        const c = l / 100 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
        return Math.round(255 * c)
          .toString(16)
          .padStart(2, '0')
      }
      return `#${f(0)}${f(8)}${f(4)}`
    }
    update('baseColor', hsl(hue, 30, 94))
    update('tiletColors', [hsl(hue, 62, 38), hsl((hue + 120) % 360, 58, 40), hsl((hue + 210) % 360, 50, 32)])
  }

  function payloadFrom(d: Draft): Design {
    return {
      ...d,
      name: d.name.trim(),
      nameAm: d.nameAm.trim(),
      code: d.code.trim() || codeOf(designs),
      tiletColors: Array.isArray(d.tiletColors) ? d.tiletColors : [],
      isSample: d.isSample ?? false,
      createdAt: d.createdAt || new Date().toISOString(),
    }
  }

  async function save() {
    if (!draft.name.trim()) return
    const payload = payloadFrom({ ...draft, sketch: sketch ?? draft.sketch })
    if (draft.id) await db.designs.put(payload)
    else await db.designs.add(payload)
    setDraft(emptyDesign(codeOf(designs)))
    setSketch(null)
    setAnalysis(null)
    setSavedMessage('')
  }

  async function savePattern() {
    if (!draft.name.trim()) {
      setSavedMessage(t('sketch_needName'))
      return
    }
    const payload = payloadFrom({ ...draft, sketch: sketch ?? draft.sketch })
    let designId = draft.id
    if (designId) {
      await db.designs.put(payload)
    } else {
      designId = (await db.designs.add(payload)) as number
      setDraft((d) => ({ ...d, id: designId }))
    }
    const sizes = standardSizes(draft.garmentType)
    const measurements = resolveMeasurements(sizes, PREVIEW_SIZE, {})
    const set: PatternSet = {
      designId,
      name: `${payload.name} — ${PREVIEW_SIZE} (${draft.garmentType})`,
      garmentType: draft.garmentType,
      sizeMode: 'standard',
      sizeLabel: PREVIEW_SIZE,
      measurements,
      seamAllowance: SEAM_ALLOWANCE,
      createdAt: new Date().toISOString(),
      isSample: false,
    }
    await db.patternSets.add(set)
    setSavedMessage(t('sketch_patternSaved'))
  }

  const preview: Design = {
    ...draft,
    id: draft.id ?? 1,
    code: draft.code,
    name: draft.name,
    nameAm: draft.nameAm,
    createdAt: draft.createdAt,
    isSample: draft.isSample ?? false,
    orderId: draft.orderId,
    specs: draft.specs,
    fabric: draft.fabric,
  }

  const bandColor = draft.tiletColors[0]
  const contrast = bandColor ? contrastRatio(draft.baseColor, bandColor) : 1

  const modes: { value: PreviewMode; label: string }[] = [
    { value: '2d', label: t('preview_2d') },
    { value: 'mannequin', label: t('preview_mannequin') },
    { value: '3d', label: t('preview_3d') },
  ]

  return (
    <div>
      <PageHeader title={t('des_title')} subtitle={t('des_subtitle')} />

      <Card
        title={t('sketch_title')}
        subtitle={t('sketch_subtitle')}
        className="mb-4"
        actions={
          <div className="flex overflow-hidden rounded-lg border border-slate-200 text-xs">
            {(['tilet', 'tibeb', 'tilf'] as TibebStyle[]).map((s) => (
              <button
                key={s}
                onClick={() => update('tibebStyle', s)}
                className={cn(
                  'px-2.5 py-1.5',
                  draft.tibebStyle === s ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50',
                )}
              >
                {t(('tib_' + s) as 'tib_tilet')}
              </button>
            ))}
          </div>
        }
      >
        <SketchUpload
          sketch={sketch}
          analysis={analysis}
          analyzing={analyzing}
          seamAllowance={SEAM_ALLOWANCE}
          sizeLabel={PREVIEW_SIZE}
          pieces={pieces}
          onFile={handleFile}
          onClear={clearSketch}
          onApplyTilet={applyTilet}
          onApplyPattern={applyPattern}
          onSavePattern={savePattern}
          savedMessage={savedMessage}
        />
      </Card>

      <Card title={t('tilk_title')} subtitle={t('tilk_subtitle')} className="mb-4">
        <TilkConverter
          svg={draft.tilkSvg}
          viewBox={draft.tilkViewBox}
          color={bandColor ?? '#b91c1c'}
          onApply={applyTilk}
          onClear={() =>
            setDraft((d) => ({ ...d, tilkSvg: undefined, tilkViewBox: undefined }))
          }
        />
      </Card>

      <Card title={t('gallery_title')} subtitle={t('gallery_subtitle')} className="mb-4">
        <DesignPresets onLoad={loadPreset} onSave={savePreset} />
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title={t('des_title')}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t('des_code')}>
              <Input value={draft.code} onChange={(e) => update('code', e.target.value)} />
            </Field>
            <Field label={t('des_name')}>
              <Input value={draft.name} onChange={(e) => update('name', e.target.value)} />
            </Field>
            <Field label={t('des_nameAm')}>
              <Input value={draft.nameAm} onChange={(e) => update('nameAm', e.target.value)} />
            </Field>
            <Field label={t('des_fabric')}>
              <Input value={draft.fabric} onChange={(e) => update('fabric', e.target.value)} />
            </Field>
            <Field label={t('des_garmentType')}>
              <Select
                value={draft.garmentType}
                onChange={(e) => update('garmentType', e.target.value as GarmentType)}
              >
                {GARMENT_TYPES.map((g) => (
                  <option key={g.value} value={g.value}>
                    {t(g.key)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t('des_silhouette')}>
              <Select
                value={draft.silhouette}
                onChange={(e) => update('silhouette', e.target.value as Silhouette)}
              >
                {SILHOUETTES.map((g) => (
                  <option key={g.value} value={g.value}>
                    {t(g.key)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t('des_neckline')}>
              <Select
                value={draft.neckline}
                onChange={(e) => update('neckline', e.target.value as Neckline)}
              >
                {NECKLINES.map((g) => (
                  <option key={g.value} value={g.value}>
                    {t(g.key)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t('des_sleeve')}>
              <Select
                value={draft.sleeve}
                onChange={(e) => update('sleeve', e.target.value as SleeveStyle)}
              >
                {SLEEVES.map((g) => (
                  <option key={g.value} value={g.value}>
                    {t(g.key)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t('des_length')}>
              <Select
                value={draft.length}
                onChange={(e) => update('length', e.target.value as DressLength)}
              >
                {LENGTHS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {t(g.key)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t('des_tibebStyle')}>
              <Select
                value={draft.tibebStyle}
                onChange={(e) => update('tibebStyle', e.target.value as TibebStyle)}
              >
                {TIBEB_STYLES.map((g) => (
                  <option key={g.value} value={g.value}>
                    {t(g.key)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t('des_tiletPlacement')}>
              <Select
                value={draft.tiletPlacement}
                onChange={(e) => update('tiletPlacement', e.target.value as TiletPlacement)}
              >
                {TILET_PLACEMENTS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {t(g.key)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t('des_palette')}>
              <Select value="" onChange={(e) => {
                const pid = Number(e.target.value)
                if (!pid) return
                const p = colorPalettes.find((c) => c.id === pid)
                if (p) {
                  update('baseColor', p.primary)
                  update('tiletColors', [p.secondary, ...(p.accents ?? [])])
                }
              }}>
                <option value="">—</option>
                {colorPalettes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t('des_baseColor')}>
              <Input type="color" value={draft.baseColor} onChange={(e) => update('baseColor', e.target.value)} />
            </Field>
            <Field label={t('des_tiletColors')} className="sm:col-span-2">
              <Input
                value={Array.isArray(draft.tiletColors) ? draft.tiletColors.join(', ') : ''}
                onChange={(e) => update('tiletColors', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
                placeholder="#b91c1c, #d4a017, #15803d"
              />
            </Field>
            {draft.tibebStyle !== 'none' && (
              <Field label={t('motif_label')} className="sm:col-span-2">
                <MotifPicker
                  style={draft.tibebStyle}
                  value={draft.motif}
                  colors={draft.tiletColors}
                  onChange={(id: MotifId) => update('motif', id)}
                />
              </Field>
            )}
            <div className="sm:col-span-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">{t('tools_title')}</span>
                <span
                  className={cn(
                    'text-[11px] font-medium',
                    contrast >= 4.5 ? 'text-emerald-600' : 'text-amber-600',
                  )}
                >
                  {contrast >= 4.5 ? t('tools_contrastOk') : t('tools_contrastLow')} · {contrast.toFixed(1)}:1
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={t('band_width')}>
                  <Input
                    type="number"
                    min={4}
                    max={60}
                    value={draft.bandWidth ?? 14}
                    onChange={(e) => update('bandWidth', Number(e.target.value))}
                  />
                </Field>
                <Field label={t('stripe_count')}>
                  <Input
                    type="number"
                    min={2}
                    max={12}
                    value={draft.stripeCount ?? 5}
                    onChange={(e) => update('stripeCount', Number(e.target.value))}
                  />
                </Field>
                <Field label={t('motif_repeat')}>
                  <Input
                    type="number"
                    min={1}
                    max={40}
                    value={draft.motifRepeat ?? 8}
                    onChange={(e) => update('motifRepeat', Number(e.target.value))}
                  />
                </Field>
                <div className="flex flex-col justify-end gap-2">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
                    <input
                      type="checkbox"
                      checked={draft.mirrorMotif ?? false}
                      onChange={(e) => update('mirrorMotif', e.target.checked)}
                    />
                    {t('motif_mirror')}
                  </label>
                  <Button size="sm" variant="secondary" onClick={randomizePalette}>
                    {t('tools_randomize')}
                  </Button>
                </div>
              </div>
            </div>
            <Field label={t('des_specs')} className="sm:col-span-2">
              <Textarea value={draft.specs} onChange={(e) => update('specs', e.target.value)} />
            </Field>
            <div className="sm:col-span-2 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setDraft(emptyDesign(codeOf(designs)))}>
                {t('reset')}
              </Button>
              <Button variant="primary" onClick={save} disabled={!draft.name.trim()}>
                {t('save')}
              </Button>
            </div>
          </div>
        </Card>

        <Card
          title={t('preview')}
          actions={
            <div className="flex overflow-hidden rounded-lg border border-slate-200 text-xs">
              {modes.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMode(m.value)}
                  className={cn(
                    'px-2.5 py-1.5',
                    mode === m.value ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50',
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          }
        >
          {mode === '2d' && <DesignPreview design={preview} className="mx-auto h-[420px] w-full" />}
          {mode === 'mannequin' && <MannequinPreview design={preview} className="mx-auto h-[460px] w-full" />}
          {mode === '3d' && (
            <div>
              <Dress3D design={preview} className="h-[460px] w-full rounded-lg" />
              <p className="mt-2 text-center text-xs text-slate-400">{t('preview_drag')}</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
