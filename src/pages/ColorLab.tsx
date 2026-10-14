import { useState } from 'react'
import { db } from '../db/db'
import { useData } from '../db/DataContext'
import type { ColorPalette } from '../db/types'
import { useI18n } from '../i18n/LanguageContext'
import { Button, Card, EmptyState, Field, Input, Modal, PageHeader, Table, TD, TH, Textarea } from '../components/ui'
import { PALETTE_PRESETS, contrastRatio } from '../lib/design'

type Draft = Partial<ColorPalette> & { id?: number }

export function ColorLab() {
  const { t } = useI18n()
  const { colorPalettes } = useData()
  const [draft, setDraft] = useState<Draft | null>(null)

  async function save() {
    if (!draft || !draft.name) return
    const payload: ColorPalette = {
      id: draft.id,
      name: draft.name.trim(),
      primary: draft.primary || '#f7f5ef',
      secondary: draft.secondary || '#b91c1c',
      accents: Array.isArray(draft.accents) ? draft.accents : [],
      note: draft.note ?? '',
      isSample: draft.isSample ?? false,
    }
    if (draft.id) await db.colorPalettes.put(payload)
    else await db.colorPalettes.add(payload)
    setDraft(null)
  }

  async function remove(id: number) {
    if (!window.confirm(t('confirmDelete'))) return
    await db.colorPalettes.delete(id)
  }

  return (
    <div>
      <PageHeader
        title={t('col_title')}
        subtitle={t('col_subtitle')}
        actions={<Button variant="primary" onClick={() => setDraft({ primary: '#f7f5ef', secondary: '#b91c1c', accents: ['#d4a017', '#15803d'] })}>{t('col_newPalette')}</Button>}
      />
      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <Card title={t('col_presets')}>
          <div className="grid gap-2 sm:grid-cols-2">
            {PALETTE_PRESETS.map((p) => (
              <button
                key={p.name}
                onClick={() => setDraft({ name: p.name, primary: p.primary, secondary: p.secondary, accents: [...p.accents] })}
                className="rounded-lg border border-slate-200 bg-white p-2 text-left hover:bg-slate-50"
              >
                <div className="text-xs font-medium text-slate-700">{p.name}</div>
                <div className="mt-2 flex gap-1">
                  {[p.primary, p.secondary, ...p.accents].map((c, i) => (
                    <span key={i} className="h-5 w-5 rounded border border-slate-200" style={{ background: c }} />
                  ))}
                </div>
              </button>
            ))}
          </div>
        </Card>
        <Card title={t('col_title')}>
          {colorPalettes.length === 0 ? (
            <EmptyState>{t('noData')}</EmptyState>
          ) : (
            <Table stack={false}>
              <thead>
                <tr>
                  <TH>{t('col_paletteName')}</TH>
                  <TH>Colors</TH>
                  <TH></TH>
                </tr>
              </thead>
              <tbody>
                {colorPalettes.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <TD className="text-slate-700">{c.name}</TD>
                    <TD>
                      <div className="flex gap-1">
                        {[c.primary, c.secondary, ...(c.accents || [])].map((cl, i) => (
                          <span key={i} className="h-4 w-4 rounded border border-slate-200" style={{ background: cl }} />
                        ))}
                      </div>
                    </TD>
                    <TD right>
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setDraft(c)}>
                          {t('edit')}
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-600" onClick={() => remove(c.id!)}>
                          {t('delete')}
                        </Button>
                      </div>
                    </TD>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      </div>

      <Modal open={!!draft} onClose={() => setDraft(null)} title={draft?.id ? t('edit') : t('col_newPalette')} footer={
        <>
          <Button variant="ghost" onClick={() => setDraft(null)}>{t('cancel')}</Button>
          <Button variant="primary" onClick={save} disabled={!draft?.name}>{t('save')}</Button>
        </>
      }>
        {draft && (
          <div className="grid gap-3">
            <Field label={t('col_paletteName')} required>
              <Input value={draft.name || ''} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </Field>
            <div className="grid grid-cols-3 gap-2">
              <Field label={t('col_primary')}>
                <Input type="color" value={draft.primary || '#f7f5ef'} onChange={(e) => setDraft({ ...draft, primary: e.target.value })} />
              </Field>
              <Field label={t('col_secondary')}>
                <Input type="color" value={draft.secondary || '#b91c1c'} onChange={(e) => setDraft({ ...draft, secondary: e.target.value })} />
              </Field>
              <Field label={t('col_accents')}>
                <Input value={(draft.accents || []).join(', ')} onChange={(e) => setDraft({ ...draft, accents: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} />
              </Field>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
              <span>{t('col_contrast')}: {contrastRatio(draft.secondary || '#b91c1c', draft.primary || '#f7f5ef').toFixed(2)}:1</span>
            </div>
            <Field label={t('note')}>
              <Textarea value={draft.note || ''} onChange={(e) => setDraft({ ...draft, note: e.target.value })} />
            </Field>
          </div>
        )}
      </Modal>
    </div>
  )
}
