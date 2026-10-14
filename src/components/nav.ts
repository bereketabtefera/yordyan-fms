import type { TKey } from '../i18n/strings'

export interface NavItem {
  to: string
  key: TKey
}

export interface NavGroup {
  key: TKey
  items: NavItem[]
}

export type Workspace = 'fms' | 'design'

export const FMS_NAV_GROUPS: NavGroup[] = [
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

export const DESIGN_NAV_GROUPS: NavGroup[] = [
  {
    key: 'navGroup_design',
    items: [
      { to: '/design', key: 'nav_design_studio' },
      { to: '/design/patterns', key: 'nav_design_pattern' },
      { to: '/design/colors', key: 'nav_design_colors' },
      { to: '/design/library', key: 'nav_design_library' },
    ],
  },
]

export const NAV_BY_WORKSPACE: Record<Workspace, NavGroup[]> = {
  fms: FMS_NAV_GROUPS,
  design: DESIGN_NAV_GROUPS,
}

// Back-compat alias
export const NAV_GROUPS = FMS_NAV_GROUPS
