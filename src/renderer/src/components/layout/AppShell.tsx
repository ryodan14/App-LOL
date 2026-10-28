import { Suspense, useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { PageFallback } from '@renderer/components/ui/PageFallback'
import { MobileNav } from './MobileNav'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { t } from '@shared/i18n'

export function AppShell(): React.JSX.Element {
  const { pathname } = useLocation()
  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 })
  }, [pathname])

  return (
    <div className="flex h-full min-h-0">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:border focus:border-gold-400/40 focus:bg-base-900 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-gold-200 focus:outline-none"
      >
        {t('Saltar al contenido principal')}
      </a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main
          ref={mainRef}
          id="main-content"
          tabIndex={-1}
          aria-labelledby="page-title"
          className="min-h-0 flex-1 overflow-y-auto pb-[4.6rem] focus:outline-none md:pb-0"
        >
          <div className="mx-auto w-full max-w-[1480px] px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-7">
            <Suspense fallback={<PageFallback />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
        <MobileNav />
      </div>
    </div>
  )
}
