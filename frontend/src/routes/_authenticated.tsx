import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { TopNav } from '@/components/layout/top-nav'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { fetchCurrentUser } from '@/lib/auth'
import { useAuthStore } from '@/stores/auth-store'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      })
    }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    const token = useAuthStore.getState().token
    if (!token) return
    fetchCurrentUser()
      .then((user) => {
        if (!cancelled) useAuthStore.getState().login(token, user)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <div
        className="h-1 shrink-0 bg-primary no-print"
        aria-hidden
      />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <AppSidebar className="no-print hidden min-h-0 lg:flex" />

        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="no-print w-64 p-0">
            <AppSidebar />
          </SheetContent>
        </Sheet>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <TopNav
            className="no-print"
            onMenuClick={() => setSidebarOpen(true)}
          />
          <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain p-4 lg:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
