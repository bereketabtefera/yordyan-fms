import { useRef, useState } from 'react'
import { db, DEFAULT_EXPENSE_CATEGORIES, DEFAULT_SETTINGS } from '../db/db'
import { useData } from '../db/DataContext'
import type { Settings as SettingsType, TaxMode } from '../db/types'
import { useI18n } from '../i18n/LanguageContext'
import { clearSample, seedSample } from '../lib/sample'
import { exportCSV, exportJSON, importJSON, wipeAll } from '../lib/backup'
import { Badge, Button, Card, Field, Input, PageHeader, Textarea } from '../components/ui'
import { num } from '../lib/format'

export function Settings() {
  const { t, lang, setLang } = useI18n()
  const { settings, includeSample, setIncludeSample } = useData()
  const [s, setS] = useState<SettingsType>(settings)
  const [newCat, setNewCat] = useState('')
  const [wipeText, setWipeText] = useState('')
  const [msg, setMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const [hydratedSig, setHydratedSig] = useState<string | null>(null)

  const sig = JSON.stringify(settings)
  if (hydratedSig !== sig) {
    setHydratedSig(sig)
    setS(settings)
  }

  const flash = (m: string) => {
    setMsg(m)
    setTimeout(() => setMsg(''), 2500)
  }

  async function saveSettings() {
    await db.settings.put({ ...s, id: 1 })
    flash(t('save2') + ' ✓')
  }

  function addCategory() {
    const c = newCat.trim()
    if (!c || s.expenseCategories.includes(c)) return
    setS({ ...s, expenseCategories: [...s.expenseCategories, c] })
    setNewCat('')
  }

  function removeCategory(c: string) {
    setS({ ...s, expenseCategories: s.expenseCategories.filter((x) => x !== c) })
  }

  async function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!window.confirm('Merge this backup into your current data?')) return
    try {
      await importJSON(file, 'merge')
      flash('Imported ✓')
    } catch {
      flash('Import failed')
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div>
      <PageHeader
        title={t('set_title')}
        actions={
          <>
            {msg && <Badge tone="green">{msg}</Badge>}
            <Button variant="primary" onClick={saveSettings}>
              {t('save')}
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title={t('set_language')}>
          <div className="flex gap-2">
            <Button variant={lang === 'en' ? 'primary' : 'secondary'} onClick={() => setLang('en')}>
              English
            </Button>
            <Button variant={lang === 'am' ? 'primary' : 'secondary'} onClick={() => setLang('am')}>
              አማርኛ
            </Button>
          </div>
          <div className="mt-3">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={includeSample} onChange={(e) => setIncludeSample(e.target.checked)} className="h-4 w-4 accent-brand-600" />
              {t('showSample')}
            </label>
          </div>
        </Card>

        <Card title={t('set_currency')}>
          <Field label={t('set_currency')}>
            <Input value={s.currency} readOnly className="bg-slate-50" />
          </Field>
          <p className="mt-2 text-xs text-slate-400">ETB — Ethiopian birr. Dates can be entered in Gregorian or Ethiopian calendar.</p>
        </Card>

        <Card title={t('set_opening')}>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label={t('cb_acc_cash')}>
              <Input type="number" value={s.openingCash} onChange={(e) => setS({ ...s, openingCash: num(e.target.value) })} />
            </Field>
            <Field label={t('cb_acc_bank')}>
              <Input type="number" value={s.openingBank} onChange={(e) => setS({ ...s, openingBank: num(e.target.value) })} />
            </Field>
            <Field label={t('cb_acc_mobile')}>
              <Input type="number" value={s.openingMobile} onChange={(e) => setS({ ...s, openingMobile: num(e.target.value) })} />
            </Field>
          </div>
        </Card>

        <Card title={t('set_categories')}>
          <div className="flex gap-2">
            <Input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder={t('set_addCategory')} />
            <Button onClick={addCategory}>{t('add')}</Button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {s.expenseCategories.map((c) => (
              <span key={c} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                {c}
                <button onClick={() => removeCategory(c)} className="text-slate-400 hover:text-red-600">
                  ×
                </button>
              </span>
            ))}
          </div>
          <Button size="sm" variant="ghost" className="mt-2" onClick={() => setS({ ...s, expenseCategories: DEFAULT_EXPENSE_CATEGORIES })}>
            {t('reset')}
          </Button>
        </Card>

        <Card title={t('set_taxRate')}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t('set_taxMode')}>
              <select
                value={s.taxMode}
                onChange={(e) => setS({ ...s, taxMode: e.target.value as TaxMode })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="profit">{t('set_taxMode_profit')}</option>
                <option value="turnover">{t('set_taxMode_turnover')}</option>
              </select>
            </Field>
            <Field label={t('set_taxRate')}>
              <Input type="number" value={s.taxRate} onChange={(e) => setS({ ...s, taxRate: num(e.target.value) })} />
            </Field>
          </div>
          <Field label={t('tax_notes')} className="mt-3">
            <Textarea value={s.taxThresholdNote} onChange={(e) => setS({ ...s, taxThresholdNote: e.target.value })} placeholder="e.g. category, threshold, source" />
          </Field>
        </Card>

        <Card title={t('set_backup')}>
          <div className="flex flex-wrap gap-2">
            <Button onClick={exportJSON}>{t('set_export')}</Button>
            <Button onClick={() => fileRef.current?.click()}>{t('set_import')}</Button>
            <Button onClick={() => exportCSV()}>{t('set_exportCsv')}</Button>
            <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={onImport} />
          </div>
          <p className="mt-2 text-xs text-slate-400">Backups keep a copy of everything. Import merges; export CSV downloads each table separately.</p>
        </Card>

        <Card title={t('sample')}>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => seedSample().then(() => flash('Sample added ✓'))}>+ {t('showSample')}</Button>
            <Button variant="ghost" onClick={() => clearSample().then(() => flash('Sample removed ✓'))}>
              {t('hideSample')}
            </Button>
          </div>
        </Card>

        <Card title={t('set_wipe')}>
          <Field label={t('set_wipeConfirm')}>
            <Input value={wipeText} onChange={(e) => setWipeText(e.target.value)} placeholder="ERASE" />
          </Field>
          <Button
            variant="danger"
            className="mt-2"
            disabled={wipeText !== 'ERASE'}
            onClick={async () => {
              await wipeAll(false)
              await db.settings.put(structuredClone(DEFAULT_SETTINGS))
              setWipeText('')
              flash('Erased')
            }}
          >
            {t('set_wipe')}
          </Button>
        </Card>
      </div>

      <Card title={t('set_about')} className="mt-4">
        <p className="text-sm text-slate-500">
          {t('appName')} · {t('subtitleAm')} — data is stored locally in this browser. Keep regular backups.
        </p>
      </Card>
    </div>
  )
}
