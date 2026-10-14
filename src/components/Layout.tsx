import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useI18n } from '../i18n/LanguageContext'
import { useData } from '../db/DataContext'
import { NAV_GROUPS } from './nav'
import { cn } from './cn'

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useI18n()
  return (
    <nav className="flex h-full flex-col gap-4 overflow-y-auto p-3">
      {NAV_GROUPS.map((group) => (
        <div key={group.key}>
          <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            {t(group.key)}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      'block rounded-lg px-3 py-2 text-sm transition-colors',
                      isActive
                        ? 'bg-brand-50 font-semibold text-brand-800'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800',
                    )
                  }
                >
                  {t(item.key)}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}

export function Layout() {
  const { t, lang, setLang } = useI18n()
  const { includeSample, setIncludeSample } = useData()
  const [drawer, setDrawer] = useState(false)

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="no-print hidden w-64 shrink-0 border-r border-slate-200 bg-white md:block">
        <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
            YF
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-slate-800">{t('appName')}</p>
            <p className="text-[11px] text-slate-500">{t('subtitle')}</p>
          </div>
        </div>
        <SidebarContent />
      </aside>

      {drawer && (
        <div className="no-print fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 left-0 w-64 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
              <span className="text-sm font-semibold text-slate-800">{t('appName')}</span>
              <button onClick={() => setDrawer(false)} className="p-1 text-slate-400">
                ✕
              </button>
            </div>
            <SidebarContent onNavigate={() => setDrawer(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-3 py-2.5 backdrop-blur sm:px-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDrawer(true)}
              className="rounded-lg border border-slate-300 px-2.5 py-2 text-slate-600 md:hidden"
              aria-label="Menu"
            >
              ☰
            </button>
            <span className="hidden text-sm font-medium text-slate-500 sm:block">{t('appName')}</span>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-500" title={t('sampleLabel')}>
              <input
                type="checkbox"
                checked={includeSample}
                onChange={(e) => setIncludeSample(e.target.checked)}
                className="h-4 w-4 accent-brand-600"
              />
              <span className="hidden sm:inline">{t('sampleLabel')}</span>
            </label>
            <div className="flex overflow-hidden rounded-lg border border-slate-200 text-xs">
              <button
                onClick={() => setLang('en')}
                className={cn('px-2.5 py-1.5', lang === 'en' ? 'bg-brand-600 text-white' : 'bg-white text-slate-600')}
              >
                EN
              </button>
              <button
                onClick={() => setLang('am')}
                className={cn('px-2.5 py-1.5', lang === 'am' ? 'bg-brand-600 text-white' : 'bg-white text-slate-600')}
              >
                አማ
              </button>
            </div>
          </div>
        </header>

        {includeSample && (
          <div className="no-print border-b border-gold-400/40 bg-gold-400/15 px-4 py-2 text-xs text-gold-600">
            {t('sampleBanner')}
          </div>
        )}

        <main className="flex-1 p-3 sm:p-6">
          <Outlet />
        </main>

        <footer className="no-print border-t border-slate-200 px-4 py-3 text-center text-[11px] text-slate-400">
          {t('appName')} · {t('subtitleAm')}
        </footer>
      </div>
    </div>
  )
}
