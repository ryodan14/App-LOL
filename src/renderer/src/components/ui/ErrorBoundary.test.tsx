// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { DEFAULT_LOCALE, setLocale } from '@shared/i18n'
import { ErrorBoundary } from './ErrorBoundary'

function Bomb({ explode }: { explode: boolean }): React.JSX.Element {
  if (explode) throw new Error('boom')
  return <p>contenido recuperado</p>
}

describe('ErrorBoundary', () => {
  beforeEach(() => setLocale(DEFAULT_LOCALE))
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('shows a fallback instead of crashing the page', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    render(
      <ErrorBoundary resetKey="/live">
        <Bomb explode />
      </ErrorBoundary>
    )

    expect(screen.getByRole('alert').textContent).toContain('Algo salió mal')
    expect(screen.getByRole('alert').textContent).toContain('boom')
  })

  it('recovers when the route changes', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const { rerender } = render(
      <ErrorBoundary resetKey="/live">
        <Bomb explode />
      </ErrorBoundary>
    )

    rerender(
      <ErrorBoundary resetKey="/settings">
        <Bomb explode={false} />
      </ErrorBoundary>
    )

    expect(screen.getByText('contenido recuperado')).toBeTruthy()
  })
})
