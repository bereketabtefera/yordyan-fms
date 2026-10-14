import { useState } from 'react'
import { db } from '../db/db'
import { useData } from '../db/DataContext'
import type { PatternSet, Measurements, GarmentType, SizeMode } from '../db/types'
import { useI18n } from '../i18n/LanguageContext'
import { Button, Card, Field, Input, PageHeader, Select } from '../components/ui'
import { draftPieces, standardSizes, resolveMeasurements } from '../lib/patterns'
import { piecesToHtml, openPrint, piecesToSingleSvg, downloadSvg } from '../lib/svgExport'

export function PatternMaker() {
  const { t } = useI18n()
  const { designs } = useData()
  const [designId, setDesignId] = useState<number | null>(null)
  const [garment, setGarment] = useState<GarmentType>('kemis')
  const [sizeMode, setSizeMode] = useState<SizeMode>('standard')
  const [sizeLabel, setSizeLabel] = useState('M')
  const [custom, setCustom] = useState<Measurements>({ bust: 88, waist: 70, hip: 94, shoulder: 12, backLength: 40, frontLength: 42, chestWidth: 16, backWidth: 17, neck: 36, armholeDepth: 21, sleeveLength: 58, bicep: 28, skirtLength: 100 })
  const [seam, setSeam] = useState(1.5)
  const [pieces, setPieces] = useState<any[]>([])
  const sizes = standardSizes(garment)
  const design = designs.find((d) => d.id === designId)

  const meas = resolveMeasurements(sizes, sizeLabel, custom)

  function generate() {
    const ps = draftPieces(garment, meas, seam, design?.silhouette, design?.sleeve)
    setPieces(ps as any)
  }

  async function savePattern() {
    if (!design) return
    const payload: PatternSet = {
      designId: design.id ?? null,
      name: `${design.name} — ${sizeMode === 'standard' ? sizeLabel : 'custom'} (${garment})`,
      garmentType: garment,
      sizeMode,
      sizeLabel: sizeMode === 'standard' ? sizeLabel : 'custom',
      measurements: meas,
      seamAllowance: seam,
      createdAt: new Date().toISOString(),
      isSample: false,
    }
    await db.patternSets.add(payload)
    alert('Pattern saved')
  }

  function printSheet() {
    if (!pieces.length) return
    const name = (p: any) => t(p.key)
    const html = piecesToHtml(pieces, {
      title: t('pat_title'),
      subtitle: design?.code ?? garment,
      pieceName: name,
      seamAllowance: seam,
      footer: t('pat_scaleNote'),
    })
    openPrint(html)
  }

  function exportSvg() {
    if (!pieces.length) return
    const svg = piecesToSingleSvg(pieces, {
      title: t('pat_title'),
      subtitle: design?.code ?? garment,
      pieceName: (p: any) => t(p.key),
      seamAllowance: seam,
      footer: t('pat_scaleNote'),
    })
    downloadSvg(`yordyan-pattern-${Date.now()}.svg`, svg)
  }

  return (
    <div>
      <PageHeader title={t('pat_title')} subtitle={t('pat_subtitle')} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title={t('pat_title')}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t('des_chooseDesign')}>
              <Select value={designId ?? ''} onChange={(e) => setDesignId(e.target.value ? Number(e.target.value) : null)}>
                <option value="">—</option>
                {designs.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.code} · {d.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t('pat_garment')}>
              <Select value={garment} onChange={(e) => setGarment(e.target.value as GarmentType)}>
                <option value="kemis">{t('garment_kemis')}</option>
                <option value="vest">{t('garment_vest')}</option>
                <option value="tshirt">{t('garment_tshirt')}</option>
                <option value="other">{t('garment_other')}</option>
              </Select>
            </Field>
            <Field label={t('pat_sizeMode')}>
              <Select value={sizeMode} onChange={(e) => setSizeMode(e.target.value as SizeMode)}>
                <option value="standard">{t('pat_standard')}</option>
                <option value="custom">{t('pat_custom')}</option>
              </Select>
            </Field>
            {sizeMode === 'standard' && (
              <Field label={t('pat_size')}>
                <Select value={sizeLabel} onChange={(e) => setSizeLabel(e.target.value)}>
                  {sizes.map((s) => (
                    <option key={s.label} value={s.label}>
                      {s.label}
                    </option>
                  ))}
                </Select>
              </Field>
            )}
            <Field label={t('pat_seamAllowance')}>
              <Input type="number" step="0.5" value={seam} onChange={(e) => setSeam(Number(e.target.value) || 0)} />
            </Field>
          </div>
          <div className="mt-3">
            <div className="text-xs font-semibold text-slate-600 mb-2">{t('pat_measurements')}</div>
            <div className="grid gap-2 sm:grid-cols-3">
              {[
                { key: 'bust', v: custom.bust, label: t('meas_bust') },
                { key: 'waist', v: custom.waist, label: t('meas_waist') },
                { key: 'hip', v: custom.hip, label: t('meas_hip') },
                { key: 'shoulder', v: custom.shoulder, label: t('meas_shoulder') },
                { key: 'backLength', v: custom.backLength, label: t('meas_backLength') },
                { key: 'frontLength', v: custom.frontLength, label: t('meas_frontLength') },
                { key: 'chestWidth', v: custom.chestWidth, label: t('meas_chestWidth') },
                { key: 'backWidth', v: custom.backWidth, label: t('meas_backWidth') },
                { key: 'neck', v: custom.neck, label: t('meas_neck') },
                { key: 'armholeDepth', v: custom.armholeDepth, label: t('meas_armholeDepth') },
                { key: 'sleeveLength', v: custom.sleeveLength, label: t('meas_sleeveLength') },
                { key: 'bicep', v: custom.bicep, label: t('meas_bicep') },
                { key: 'skirtLength', v: custom.skirtLength, label: t('meas_skirtLength') },
              ].map((f) => (
                <Field key={f.key} label={f.label}>
                  <Input
                    type="number"
                    value={custom[f.key as keyof Measurements] ?? ''}
                    onChange={(e) => setCustom((c) => ({ ...c, [f.key]: Number(e.target.value) || 0 }))}
                    disabled={sizeMode === 'standard'}
                  />
                </Field>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="primary" onClick={generate}>
                {t('pat_generate')}
              </Button>
              <Button onClick={printSheet} disabled={!pieces.length}>
                {t('pat_print')}
              </Button>
              <Button onClick={exportSvg} disabled={!pieces.length}>
                {t('pat_exportSvg')}
              </Button>
              <Button onClick={savePattern} disabled={!design || !pieces.length}>
                {t('pat_savePattern')}
              </Button>
            </div>
            <div className="mt-2 text-xs text-slate-400">{t('pat_scaleNote')}</div>
          </div>
        </Card>
        <Card title={t('pat_pieces')}>
          {pieces.length === 0 ? (
            <div className="text-sm text-slate-400">{t('noData')}</div>
          ) : (
            <div className="grid gap-3">
              {pieces.map((p, i) => (
                <div key={i} className="rounded-lg border border-slate-200 p-2 text-sm">
                  <div className="font-medium text-slate-700">{t(p.key)}</div>
                  <div className="text-xs text-slate-400">
                    {p.cut} pcs · {p.width}×{p.height} cm · SA {seam} cm
                  </div>
                  <svg viewBox={`0 0 ${p.outline.reduce((a: number, q: { x: number }) => Math.max(a, q.x), 0) + 2} ${p.outline.reduce((a: number, q: { y: number }) => Math.max(a, q.y), 0) + 2}`} className="mt-2 h-36 w-full">
                    <polygon points={p.outline.map((q:any)=>`${q.x+1},${q.y+1}`).join(' ')} fill="none" stroke="#0f172a" strokeWidth="0.3" />
                    <polygon points={p.stitch.map((q:any)=>`${q.x+1},${q.y+1}`).join(' ')} fill="none" stroke="#64748b" strokeWidth="0.2" strokeDasharray="1 1" />
                  </svg>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
