import type { TKey } from '../i18n/strings'

export interface NavItem {
  to: string
  key: TKey
}

export interface NavGroup {
  key: TKey
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    key: 'navGroup_core',
    items: [
      { to: '/', key: 'nav_dashboard' },
      { to: '/monthly', key: 'nav_monthly' },
      { to: '/routine', key: 'nav_routine' },
    ],
  },
  {
    key: 'navGroup_sales',
    items: [
      { to: '/orders', key: 'nav_orders' },
      { to: '/payments', key: 'nav_payments' },
      { to: '/production', key: 'nav_production' },
    ],
  },
  {
    key: 'navGroup_money',
    items: [
      { to: '/cashbook', key: 'nav_cashbook' },
      { to: '/expenses', key: 'nav_expenses' },
      { to: '/suppliers', key: 'nav_suppliers' },
      { to: '/inventory', key: 'nav_inventory' },
    ],
  },
  {
    key: 'navGroup_plan',
    items: [
      { to: '/pricing', key: 'nav_pricing' },
      { to: '/tax', key: 'nav_tax' },
    ],
  },
  {
    key: 'navGroup_setup',
    items: [
      { to: '/profile', key: 'nav_profile' },
      { to: '/settings', key: 'nav_settings' },
    ],
  },
]
