import { useState } from 'react'
import { db } from '../db/db'
import { useData } from '../db/DataContext'
import type { Design } from '../db/types'
import { useI18n } from '../i18n/LanguageContext'
import { Button, Card, EmptyState, Modal, PageHeader, SampleBadge, Table, TD, TH } from '../components/ui'
import { DesignPreview } from '../components/DesignPreview'
import { formatDate } from '../lib/format'

export function DesignLibrary() {
  const { t, lang } = useI18n()
  const { designs } = useData()
  const [sel, setSel] = useState<Design | null>(null)

  async function remove(id: number) {
    if (!window.confirm(t('confirmDelete'))) return
    await db.designs.delete(id)
  }

  function duplicate(d: Design) {
    const copy: Omit<Design, 'id'> = {
      ...d,
      code: d.code + '-COPY',
      name: d.name + ' (copy)',
      nameAm: d.nameAm + ' (copy)',
      createdAt: new Date().toISOString(),
    }
    void db.designs.add(copy as Design)
  }

  return (
    <div>
      <PageHeader title={t('des_library')} />
      <Card>
        {designs.length === 0 ? (
          <EmptyState>{t('des_noDesigns')}</EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <TH>Code</TH>
                <TH>{t('name')}</TH>
                <TH>{t('des_garmentType')}</TH>
                <TH>{t('des_fabric')}</TH>
                <TH>{t('date')}</TH>
                <TH></TH>
              </tr>
            </thead>
            <tbody>
              {designs.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50">
                  <TD className="whitespace-nowrap font-mono text-xs">
                    {d.code} {d.isSample && <SampleBadge />}
                  </TD>
                  <TD>
                    <div className="text-slate-800">{d.name}</div>
                    <div className="text-xs text-slate-400">{d.nameAm}</div>
                  </TD>
                  <TD>{d.garmentType}</TD>
                  <TD className="text-xs text-slate-400">{d.fabric}</TD>
                  <TD className="whitespace-nowrap">{formatDate(d.createdAt.slice(0, 10), lang)}</TD>
                  <TD right>
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setSel(d)}>
                        {t('preview')}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => duplicate(d)}>
                        {t('des_duplicate')}
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-600" onClick={() => remove(d.id!)}>
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

      <Modal open={!!sel} onClose={() => setSel(null)} wide title={sel?.code}>
        {sel && (
          <div className="grid gap-3">
            <DesignPreview design={sel} className="mx-auto h-[320px] w-full" />
            <div className="text-xs text-slate-500">
              {sel.name} · {sel.nameAm} ·               {sel.garmentType}
            </div>
            <div className="text-xs text-slate-500">{sel.specs}</div>
          </div>
        )}
      </Modal>
    </div>
  )
}
