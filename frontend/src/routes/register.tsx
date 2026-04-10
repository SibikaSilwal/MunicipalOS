import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import appLogo from '@/assets/nagarsanchalanapplogo.svg'
import { registerUser } from '@/lib/auth'
import { municipalitiesQueryOptions } from '@/hooks/queries/use-municipalities'
import { useTranslation } from 'react-i18next'

export const Route = createFileRoute('/register')({
  component: RegisterPage,
})

function RegisterPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: municipalities = [] } = useQuery(municipalitiesQueryOptions())

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [municipalityId, setMunicipalityId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError(t('auth.passwordsDoNotMatch'))
      return
    }
    if (password.length < 8) {
      setError(t('auth.passwordMinLength'))
      return
    }
    if (!municipalityId) {
      setError(t('auth.selectMunicipalityError'))
      return
    }

    setLoading(true)
    try {
      await registerUser({
        email,
        password,
        fullName,
        municipalityId,
        roleId: 'Citizen',
      })
      toast.success(t('auth.accountCreatedToast'))
      navigate({ to: '/citizen/dashboard' })
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.registrationFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex justify-center">
            <img
              src={appLogo}
              alt=""
              className="h-16 w-auto max-w-full object-contain"
            />
          </div>
          <CardTitle className="text-2xl">{t('auth.createAccountTitle')}</CardTitle>
          <CardDescription>
            {t('auth.registerSubtitle')}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="fullName">{t('auth.fullNameLabel')}</Label>
              <Input
                id="fullName"
                placeholder={t('auth.fullNamePlaceholder')}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.emailLabel')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('auth.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.passwordLabel')}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t('auth.passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('auth.confirmPasswordLabel')}</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder={t('auth.confirmPasswordPlaceholder')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="municipality">{t('auth.municipalityLabel')}</Label>
              <Select
                value={municipalityId || undefined}
                onValueChange={(val) => setMunicipalityId(val ?? '')}
                itemToStringLabel={(id) =>
                  municipalities.find((m) => m.id === id)?.name ?? String(id)
                }
              >
                <SelectTrigger id="municipality">
                  <SelectValue placeholder={t('auth.municipalityPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {municipalities.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('auth.creatingAccount') : t('auth.createAccount')}
            </Button>
            <p className="text-sm text-muted-foreground">
              {t('auth.haveAccountPrompt')}{' '}
              <Link to="/login" className="text-primary hover:underline">
                {t('auth.signIn')}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
