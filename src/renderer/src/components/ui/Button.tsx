import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@renderer/lib/cn'

type Variant = 'primary' | 'ghost' | 'quiet' | 'danger'
type Size = 'sm' | 'md' | 'lg' | 'icon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: ReactNode
}

const variantClass: Record<Variant, string> = {
  primary: 'btn-primary',
  ghost: 'btn-ghost',
  quiet: 'btn-quiet',
  danger: 'btn-danger'
}

const sizeClass: Record<Size, string> = {
  sm: 'h-8 px-3 text-[0.76rem] rounded-lg',
  md: 'h-10',
  lg: 'h-11 px-5 text-sm rounded-xl',
  icon: 'h-9 w-9 p-0 rounded-xl'
}

export function Button({
  variant = 'ghost',
  size = 'md',
  icon,
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps): React.JSX.Element {
  return (
    <button
      type={type}
      className={cn('btn', variantClass[variant], sizeClass[size], className)}
      {...props}
    >
      {icon}
      {children}
    </button>
  )
}
