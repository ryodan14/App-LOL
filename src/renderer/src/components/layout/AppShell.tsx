import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { MobileNav } from './MobileNav'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AppShell(): React.JSX.Element {
  const { pathname } = useLocation()
  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 })
  }, [pathname])

  return (
    <div className="flex h-full min-h-0">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main ref={mainRef} className="min-h-0 flex-1 overflow-y-auto pb-[4.6rem] md:pb-0">
          <div className="mx-auto w-full max-w-[1480px] px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-7">
            <Outlet />
          </div>
        </main>
        <MobileNav />
      </div>
    </div>
  )
}
