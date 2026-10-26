import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@renderer/lib/cn'

export type ButtonVariant = 'primary' | 'ghost' | 'quiet' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'
type Variant = ButtonVariant
type Size = ButtonSize

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

export function buttonClass(variant: Variant, size: Size, className?: string): string {
  return cn('btn', variantClass[variant], sizeClass[size], className)
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
      className={buttonClass(variant, size, className)}
      {...props}
    >
      {icon}
      {children}
    </button>
  )
}
