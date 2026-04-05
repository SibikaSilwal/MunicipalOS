import { Link, useLocation } from '@tanstack/react-router'
import {
  LayoutDashboard,
  FilePlus,
  ClipboardList,
  FileStack,
  Settings,
  GitBranch,
  LogOut,
  BarChart3,
} from 'lucide-react'
import appLogo from '@/assets/nagarsanchalanapplogo.svg'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import type { RoleName } from '@/types/api'

interface NavItem {
  label: string
  to: string
  icon: React.ElementType
  roles: RoleName[]
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    to: '/citizen/dashboard',
    icon: LayoutDashboard,
    roles: ['Citizen'],
  },
  {
    label: 'Apply for Service',
    to: '/citizen/apply',
    icon: FilePlus,
    roles: ['Citizen'],
  },
  {
    label: 'Pending Queue',
    to: '/officer/dashboard',
    icon: ClipboardList,
    roles: ['WardOfficer', 'MunicipalOfficer'],
  },
  {
    label: 'All Applications',
    to: '/officer/applications',
    icon: FileStack,
    roles: ['WardOfficer', 'MunicipalOfficer', 'Admin'],
  },
  {
    label: 'Service Types',
    to: '/admin/services',
    icon: Settings,
    roles: ['Admin'],
  },
  {
    label: 'Workflows',
    to: '/admin/workflows',
    icon: GitBranch,
    roles: ['Admin'],
  },
  {
    label: 'Performance',
    to: '/admin/metrics',
    icon: BarChart3,
    roles: ['Admin'],
  },
]

interface AppSidebarProps {
  className?: string
}

function sidebarBrandTitle(municipalityShortName?: string | null) {
  const short = municipalityShortName?.trim()
  const suffix = 'Nagar Digital Sewa Pranali'
  return short ? `${short} ${suffix}` : suffix
}

export function AppSidebar({ className }: AppSidebarProps) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const role = user?.role ?? 'Citizen'

  const filteredItems = navItems.filter((item) =>
    item.roles.includes(role),
  )

  return (
    <aside
      className={cn(
        'flex h-full w-64 flex-col border-r bg-sidebar',
        className,
      )}
    >
      <div className="flex min-h-14 items-center gap-2 border-b border-sidebar-border px-3 py-2 text-sidebar-foreground">
        <img
          src={appLogo}
          alt=""
          className="h-9 w-9 shrink-0 object-contain"
        />
        <span className="text-sm font-bold leading-tight">
          {sidebarBrandTitle(user?.municipalityShortName)}
        </span>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {filteredItems.map((item) => {
          const isActive = location.pathname.startsWith(item.to)
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <Separator className="bg-sidebar-border" />

      <div className="p-3 text-sidebar-foreground">
        <div className="mb-2 px-3">
          <p className="text-sm font-medium truncate">{user?.fullName}</p>
          <p className="text-xs text-sidebar-foreground/70 truncate">
            {user?.email}
          </p>
          <p className="text-xs text-sidebar-foreground/70 capitalize">
            {role}
          </p>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  )
}
