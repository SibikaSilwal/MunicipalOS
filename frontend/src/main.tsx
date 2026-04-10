import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'
import { routeTree } from './routeTree.gen'
import { useAuthStore } from './stores/auth-store'
import { TooltipProvider } from './components/ui/tooltip'
import './i18n'
import './index.css'
import appFavicon from './assets/nagarsanchalanapplogo.svg'

ModuleRegistry.registerModules([AllCommunityModule])

{
  const link = document.createElement('link')
  link.rel = 'icon'
  link.type = 'image/svg+xml'
  link.href = appFavicon
  document.head.appendChild(link)
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

const router = createRouter({
  routeTree,
  context: {
    queryClient,
    auth: {
      isAuthenticated: false,
      user: null,
    },
  },
  defaultPreload: 'intent',
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

function App() {
  const { isAuthenticated, user } = useAuthStore()

  return (
    <div className="h-full min-h-0">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delay={250}>
          <RouterProvider
            router={router}
            context={{ queryClient, auth: { isAuthenticated, user } }}
          />
        </TooltipProvider>
      </QueryClientProvider>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
