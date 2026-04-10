import { Bell, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/use-auth'
import { useQuery } from '@tanstack/react-query'
import { notificationsQueryOptions } from '@/hooks/queries/use-notifications'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'
import i18n from 'i18next'

interface TopNavProps {
  onMenuClick?: () => void
  className?: string
}

export function TopNav({ onMenuClick, className }: TopNavProps) {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const { data: notifications } = useQuery(notificationsQueryOptions())
  const unreadCount =
    notifications?.filter((n) => !n.isRead).length ?? 0

  const initials = user?.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <header
      className={cn(
        'flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6',
        className,
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex-1" />

      <div className="flex items-center gap-1 rounded-md border bg-background p-1">
        <Button
          variant={i18n.language === 'ne' ? 'ghost' : 'secondary'}
          size="sm"
          className="h-8 px-3"
          onClick={() => i18n.changeLanguage('en')}
        >
          {t('language.english')}
        </Button>
        <Button
          variant={i18n.language === 'ne' ? 'secondary' : 'ghost'}
          size="sm"
          className="h-8 px-3"
          onClick={() => i18n.changeLanguage('ne')}
        >
          {t('language.nepali')}
        </Button>
      </div>

      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -right-1 -top-1 h-5 min-w-5 px-1 text-[10px]">
            {unreadCount}
          </Badge>
        )}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger className="relative flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <div className="flex items-center gap-2 p-2">
            <div className="flex flex-col space-y-0.5">
              <p className="text-sm font-medium">{user?.fullName}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout}>{t('nav.signOut')}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
