import type { ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { buttonClass, type ButtonSize, type ButtonVariant } from './Button'

interface ButtonLinkProps extends Omit<LinkProps, 'to' | 'className' | 'children'> {
  to: string
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: ReactNode
  className?: string
  children?: ReactNode
}

export function ButtonLink({
  to,
  variant = 'ghost',
  size = 'md',
  icon,
  className,
  children,
  ...props
}: ButtonLinkProps): React.JSX.Element {
  return (
    <Link to={to} className={buttonClass(variant, size, className)} {...props}>
      {icon}
      {children}
    </Link>
  )
}
