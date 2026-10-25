import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@renderer/lib/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean
  padded?: boolean
}

export function Card({
  interactive = false,
  padded = true,
  className,
  children,
  ...props
}: CardProps): React.JSX.Element {
  return (
    <div
      className={cn('card', padded && 'p-5', interactive && 'card-hover', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  className
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
  className?: string
}): React.JSX.Element {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-3', className)}>
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 className="font-display mt-1 text-xl font-semibold tracking-tight text-ink-100 sm:text-[1.35rem]">
          {title}
        </h2>
        {description && <p className="mt-1 max-w-2xl text-[0.82rem] text-ink-400">{description}</p>}
      </div>
      {action}
    </div>
  )
}
