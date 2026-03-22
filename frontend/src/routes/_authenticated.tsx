import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'
import { useState } from 'react'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { TopNav } from '@/components/layout/top-nav'
import { Sheet, SheetContent } from '@/components/ui/sheet'

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

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar className="hidden lg:flex" />

      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <AppSidebar />
        </SheetContent>
      </Sheet>

      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNav onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
