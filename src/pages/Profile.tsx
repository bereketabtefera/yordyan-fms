import { useState } from 'react'
import { db } from '../db/db'
import { useData } from '../db/DataContext'
import type { BusinessProfile, BusinessType, LegalForm } from '../db/types'
import { useI18n } from '../i18n/LanguageContext'
import { DateField } from '../components/DateField'
import { Button, Card, Field, Input, PageHeader, Select, Textarea } from '../components/ui'
import { num, todayISO } from '../lib/format'

type Tri = 'yes' | 'no' | 'unknown'

function boolToTri(v: boolean | null): Tri {
  return v === true ? 'yes' : v === false ? 'no' : 'unknown'
}
function triToBool(v: Tri): boolean | null {
  return v === 'yes' ? true : v === 'no' ? false : null
}

function empty(): BusinessProfile {
  return {
    id: 1,
    name: 'Yordyan Fashion',
    startDate: '',
    legalForm: '',
    taxCategory: '',
    vatRegistered: null,
    monthlySalesEstimate: null,
    monthlyOrdersEstimate: null,
    businessType: '',
    mixesPersonalMoney: null,
    hasDebts: null,
    debtsDetail: '',
    shopkeeperName: 'Rehima',
    shopkeeperPay: null,
    updatedAt: '',
  }
}

export function Profile() {
  const { t } = useI18n()
  const { profile } = useData()
  const [form, setForm] = useState<BusinessProfile>(empty())
  const [saved, setSaved] = useState(false)
  const [hydratedKey, setHydratedKey] = useState<string | null>(null)

  const profileKey = profile ? profile.updatedAt || 'saved' : null
  if (profile && profileKey !== hydratedKey) {
    setHydratedKey(profileKey)
    setForm(profile)
  }

  async function save() {
    await db.profile.put({ ...form, id: 1, updatedAt: new Date().toISOString() })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <PageHeader
        title={t('prof_title')}
        subtitle={t('prof_intro')}
        actions={
          <Button variant="primary" onClick={save}>
            {saved ? `${t('save')} ✓` : t('prof_saveProfile')}
          </Button>
        }
      />

      <Card title={t('prof_title')}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t('name')}>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <DateField label={t('prof_start')} value={form.startDate} onChange={(v) => setForm({ ...form, startDate: v })} />
          <Field label={t('prof_legal')}>
            <Select value={form.legalForm} onChange={(e) => setForm({ ...form, legalForm: e.target.value as LegalForm | '' })}>
              <option value="">{t('unknown')}</option>
              <option value="sole">{t('prof_legal_sole')}</option>
              <option value="partnership">{t('prof_legal_partner')}</option>
              <option value="other">{t('prof_legal_other')}</option>
            </Select>
          </Field>
          <Field label={t('prof_taxCat')} hint={t('optional')}>
            <Input value={form.taxCategory} onChange={(e) => setForm({ ...form, taxCategory: e.target.value })} />
          </Field>
          <Field label={t('prof_vat')}>
            <Select value={boolToTri(form.vatRegistered)} onChange={(e) => setForm({ ...form, vatRegistered: triToBool(e.target.value as Tri) })}>
              <option value="unknown">{t('unknown')}</option>
              <option value="yes">{t('yes')}</option>
              <option value="no">{t('no')}</option>
            </Select>
          </Field>
          <Field label={t('prof_businessType')}>
            <Select value={form.businessType} onChange={(e) => setForm({ ...form, businessType: e.target.value as BusinessType | '' })}>
              <option value="">{t('unknown')}</option>
              <option value="custom">{t('ord_type_custom')}</option>
              <option value="ready">{t('ord_type_ready')}</option>
              <option value="both">both</option>
            </Select>
          </Field>
          <Field label={t('prof_monthlySales')} hint={t('est_label')}>
            <Input type="number" value={form.monthlySalesEstimate ?? ''} onChange={(e) => setForm({ ...form, monthlySalesEstimate: e.target.value === '' ? null : num(e.target.value) })} />
          </Field>
          <Field label={t('prof_monthlyOrders')} hint={t('est_label')}>
            <Input type="number" value={form.monthlyOrdersEstimate ?? ''} onChange={(e) => setForm({ ...form, monthlyOrdersEstimate: e.target.value === '' ? null : num(e.target.value) })} />
          </Field>
          <Field label={t('prof_mix')}>
            <Select value={boolToTri(form.mixesPersonalMoney)} onChange={(e) => setForm({ ...form, mixesPersonalMoney: triToBool(e.target.value as Tri) })}>
              <option value="unknown">{t('unknown')}</option>
              <option value="yes">{t('yes')}</option>
              <option value="no">{t('no')}</option>
            </Select>
          </Field>
          <Field label={t('prof_debts')}>
            <Select value={boolToTri(form.hasDebts)} onChange={(e) => setForm({ ...form, hasDebts: triToBool(e.target.value as Tri) })}>
              <option value="unknown">{t('unknown')}</option>
              <option value="yes">{t('yes')}</option>
              <option value="no">{t('no')}</option>
            </Select>
          </Field>
          <Field label={t('prof_shopkeeper')}>
            <Input value={form.shopkeeperName} onChange={(e) => setForm({ ...form, shopkeeperName: e.target.value })} />
          </Field>
          <Field label={t('prof_shopkeeperPay')}>
            <Input type="number" value={form.shopkeeperPay ?? ''} onChange={(e) => setForm({ ...form, shopkeeperPay: e.target.value === '' ? null : num(e.target.value) })} />
          </Field>
          <Field label={t('prof_debtsDetail')} className="sm:col-span-2">
            <Textarea value={form.debtsDetail} onChange={(e) => setForm({ ...form, debtsDetail: e.target.value })} />
          </Field>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          {form.updatedAt ? `Last saved: ${new Date(form.updatedAt).toLocaleString()}` : `Today: ${todayISO()}`}
        </p>
      </Card>
    </div>
  )
}
