import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactElement, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { Children, cloneElement, isValidElement, useEffect } from 'react'
import { cn } from './cn'

function textOf(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(textOf).join('')
  return ''
}

function extractHeadLabels(children: ReactNode): string[] {
  const labels: string[] = []
  Children.forEach(children, (section) => {
    if (!isValidElement(section) || section.type !== 'thead') return
    const sectionProps = section.props as { children?: ReactNode }
    Children.forEach(sectionProps.children, (tr) => {
      if (!isValidElement(tr)) return
      const trProps = tr.props as { children?: ReactNode }
      Children.forEach(trProps.children, (th) => {
        if (!isValidElement(th)) return
        const thProps = th.props as { children?: ReactNode }
        labels.push(textOf(thProps.children))
      })
    })
  })
  return labels
}

function injectCellLabels(children: ReactNode, labels: string[]): ReactNode {
  if (labels.length === 0) return children
  return Children.map(children, (section) => {
    if (!isValidElement(section) || section.type !== 'tbody') return section
    const sectionProps = section.props as { children?: ReactNode }
    const rows = Children.map(sectionProps.children, (tr) => {
      if (!isValidElement(tr)) return tr
      const trProps = tr.props as { children?: ReactNode }
      let i = 0
      const cells = Children.map(trProps.children, (td) => {
        if (!isValidElement(td)) return td
        const label = labels[i] ?? ''
        i += 1
        return cloneElement(td as ReactElement<{ label?: string }>, { label })
      })
      return cloneElement(tr as ReactElement<Record<string, unknown>>, {}, cells)
    })
    return cloneElement(section as ReactElement<Record<string, unknown>>, {}, rows)
  })
}

export function Card({
  title,
  subtitle,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
}) {
  return (
    <section className={cn('rounded-xl border border-slate-200 bg-white shadow-sm', className)}>
      {(title || actions) && (
        <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <div>
            {title && <h2 className="text-sm font-semibold text-slate-800">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn('p-4', bodyClassName)}>{children}</div>
    </section>
  )
}

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold'

export function Button({
  variant = 'secondary',
  size = 'md',
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: 'sm' | 'md' }) {
  const base =
    'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 disabled:cursor-not-allowed disabled:opacity-50'
  const sizes = { sm: 'px-2.5 py-1.5 text-xs', md: 'px-3.5 py-2 text-sm' }
  const variants: Record<BtnVariant, string> = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700',
    secondary: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
    ghost: 'text-slate-600 hover:bg-slate-100',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    gold: 'bg-gold-500 text-white hover:bg-gold-600',
  }
  return (
    <button className={cn(base, sizes[size], variants[variant], className)} {...rest}>
      {children}
    </button>
  )
}

export function Field({
  label,
  hint,
  required,
  children,
  className,
}: {
  label?: ReactNode
  hint?: ReactNode
  required?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <label className={cn('flex flex-col gap-1', className)}>
      {label && (
        <span className="text-xs font-medium text-slate-600">
          {label}
          {required && <span className="text-red-500"> *</span>}
          {hint && <span className="ml-1 font-normal text-slate-400">({hint})</span>}
        </span>
      )}
      {children}
    </label>
  )
}

const controlClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-400'

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(controlClass, props.className)} />
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(controlClass, 'pr-8', props.className)} />
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(controlClass, 'min-h-[72px]', props.className)} />
}

type Tone = 'slate' | 'green' | 'amber' | 'red' | 'blue' | 'gold'

export function Badge({ tone = 'slate', children }: { tone?: Tone; children: ReactNode }) {
  const tones: Record<Tone, string> = {
    slate: 'bg-slate-100 text-slate-600',
    green: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
    red: 'bg-red-100 text-red-700',
    blue: 'bg-sky-100 text-sky-700',
    gold: 'bg-gold-400/20 text-gold-600',
  }
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', tones[tone])}>
      {children}
    </span>
  )
}

export function Stat({
  label,
  value,
  sub,
  tone = 'slate',
}: {
  label: ReactNode
  value: ReactNode
  sub?: ReactNode
  tone?: Tone
}) {
  const bar: Record<Tone, string> = {
    slate: 'bg-slate-300',
    green: 'bg-brand-500',
    amber: 'bg-amber-400',
    red: 'bg-red-400',
    blue: 'bg-sky-400',
    gold: 'bg-gold-500',
  }
  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className={cn('absolute inset-y-0 left-0 w-1', bar[tone])} />
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-800">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </div>
  )
}

export function Table({
  children,
  className,
  stack = true,
}: {
  children: ReactNode
  className?: string
  stack?: boolean
}) {
  const content = stack ? injectCellLabels(children, extractHeadLabels(children)) : children
  return (
    <div className="overflow-x-auto">
      <table className={cn('rtable w-full border-collapse text-sm', className)}>{content}</table>
    </div>
  )
}

export function TH({ children, className, right }: { children?: ReactNode; className?: string; right?: boolean }) {
  return (
    <th
      className={cn(
        'whitespace-nowrap border-b border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-500',
        right && 'text-right',
        className,
      )}
    >
      {children}
    </th>
  )
}

export function TD({ children, className, right, colSpan, label }: { children?: ReactNode; className?: string; right?: boolean; colSpan?: number; label?: string }) {
  return (
    <td
      colSpan={colSpan}
      data-label={label || undefined}
      className={cn('border-b border-slate-100 px-3 py-2 align-middle text-slate-700', right && 'text-right', className)}
    >
      {children}
    </td>
  )
}

export function EmptyState({ children }: { children?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">
      {children ?? 'No records yet.'}
    </div>
  )
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  wide,
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-3 sm:p-8">
      <div className={cn('w-full rounded-xl bg-white shadow-xl', wide ? 'max-w-3xl' : 'max-w-lg')}>
        <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100" aria-label="Close">
            ✕
          </button>
        </header>
        <div className="max-h-[80vh] overflow-y-auto p-4 sm:max-h-[70vh]">{children}</div>
        {footer && <footer className="flex justify-end gap-2 border-t border-slate-100 px-4 py-3">{footer}</footer>}
      </div>
    </div>
  )
}

export function SampleBadge() {
  return <Badge tone="gold">SAMPLE</Badge>
}

export function PageHeader({ title, subtitle, actions }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-lg font-semibold text-slate-800">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
