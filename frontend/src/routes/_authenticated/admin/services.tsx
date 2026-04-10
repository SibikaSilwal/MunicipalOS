import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { PageHeader } from '@/components/shared/page-header'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useAuth } from '@/hooks/use-auth'
import {
  serviceTypesQueryOptions,
  useCreateServiceType,
} from '@/hooks/queries/use-service-types'
import {
  formatSlaDays,
  formatSlaMinutes,
  parseSlaDaysToMinutes,
  SLA_DAY_OPTIONS,
} from '@/lib/sla'
import { Plus, Search, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export const Route = createFileRoute('/_authenticated/admin/services')({
  component: ServiceTypesPage,
})

interface DocRow {
  name: string
  required: boolean
}

/** Same visible character budget for every card; overflow moves to tooltip. */
const DESCRIPTION_PREVIEW_MAX_CHARS = 75

function ServiceTypeDescriptionBlurb({
  description,
}: {
  description: string | null
}) {
  const full = description?.trim() ?? ''
  if (!full) {
    return (
      <p className="h-full text-xs leading-relaxed text-muted-foreground">—</p>
    )
  }

  const isTruncated = full.length > DESCRIPTION_PREVIEW_MAX_CHARS
  const previewText = isTruncated
    ? `${full.slice(0, DESCRIPTION_PREVIEW_MAX_CHARS)}…`
    : full

  if (!isTruncated) {
    return (
      <p className="h-full text-xs leading-relaxed text-muted-foreground">
        {previewText}
      </p>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger
        closeOnClick={false}
        delay={200}
        render={(props) => (
          <span
            {...props}
            className="block h-full cursor-inherit text-left text-xs leading-relaxed text-muted-foreground"
          >
            {previewText}
          </span>
        )}
      />
      <TooltipContent
        side="top"
        className="max-w-md whitespace-pre-wrap break-words"
      >
        {full}
      </TooltipContent>
    </Tooltip>
  )
}

function ServiceTypesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: serviceTypes = [] } = useQuery(
    serviceTypesQueryOptions(user?.municipalityId),
  )
  const createServiceType = useCreateServiceType()

  const [searchQuery, setSearchQuery] = useState('')
  const filteredServiceTypes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return serviceTypes
    return serviceTypes.filter((s) => s.name.toLowerCase().includes(q))
  }, [serviceTypes, searchQuery])

  const [dialogOpen, setDialogOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [expectedCompletionDays, setExpectedCompletionDays] = useState('')
  const [docs, setDocs] = useState<DocRow[]>([{ name: '', required: true }])

  function addDocRow() {
    setDocs((prev) => [...prev, { name: '', required: true }])
  }

  function removeDocRow(index: number) {
    setDocs((prev) => prev.filter((_, i) => i !== index))
  }

  function updateDoc(index: number, field: keyof DocRow, value: string | boolean) {
    setDocs((prev) =>
      prev.map((d, i) => (i === index ? { ...d, [field]: value } : d)),
    )
  }

  function resetForm() {
    setName('')
    setDescription('')
    setExpectedCompletionDays('')
    setDocs([{ name: '', required: true }])
  }

  async function handleCreate() {
    if (!name.trim()) {
      toast.error(t('admin.services.nameRequired'))
      return
    }

    const parsedSla = parseSlaDaysToMinutes(expectedCompletionDays)
    if (parsedSla.error) {
      toast.error(parsedSla.error)
      return
    }

    try {
      await createServiceType.mutateAsync({
        name,
        description: description || undefined,
        municipalityId: user?.municipalityId ?? '',
        expectedCompletionMinutes: parsedSla.value,
        requiredDocuments: docs.filter((d) => d.name.trim()),
      })
      toast.success(t('admin.services.createdToast'))
      setDialogOpen(false)
      resetForm()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t('admin.services.createFailed'),
      )
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('admin.services.title')}
        description={t('admin.services.description')}
      >
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('admin.services.createServiceType')}
        </Button>
      </PageHeader>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('admin.services.searchPlaceholder')}
          className="pl-9"
          aria-label={t('admin.services.searchAriaLabel')}
        />
      </div>

      {filteredServiceTypes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {serviceTypes.length === 0
            ? t('admin.services.emptyNoServiceTypes')
            : t('admin.services.emptyNoMatches')}
        </p>
      ) : (
        <div className="flex flex-wrap gap-4">
          {filteredServiceTypes.map((st) => (
            <Card
              key={st.id}
              role="button"
              tabIndex={0}
              className="w-[320px] max-w-full shrink-0 cursor-pointer gap-2 transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() =>
                navigate({
                  to: '/admin/workflows',
                  search: { serviceTypeId: st.id },
                })
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  navigate({
                    to: '/admin/workflows',
                    search: { serviceTypeId: st.id },
                  })
                }
              }}
            >
              <CardHeader className="flex h-[3.5rem] shrink-0 items-start pb-0 pt-0">
                <CardTitle className="line-clamp-2 break-words text-base font-medium leading-snug">
                  {st.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 space-y-0 pt-0">
                <div className="h-[3.25rem] shrink-0 overflow-hidden">
                  <ServiceTypeDescriptionBlurb description={st.description} />
                </div>
                <div className="h-[4.5rem] shrink-0 overflow-hidden">
                  <p className="line-clamp-4 text-xs leading-relaxed">
                    <span className="font-medium text-foreground">
                      {t('admin.services.requiredDocumentsCount', {
                        count: st.requiredDocuments.length,
                      })}
                    </span>{' '}
                    <span className="text-[11px] text-muted-foreground">
                      {st.requiredDocuments.length === 0
                        ? '—'
                        : st.requiredDocuments.map((d) => d.name).join(', ')}
                    </span>
                  </p>
                </div>
                <div className="flex h-[2.75rem] shrink-0 flex-col justify-start overflow-hidden">
                  <h3 className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {t('admin.services.expectedSla')}
                  </h3>
                  <p className="truncate text-xs leading-relaxed">
                    {formatSlaMinutes(st.expectedCompletionMinutes)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('admin.services.dialogTitle')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('admin.services.nameLabel')}</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('admin.services.namePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('admin.services.descriptionLabel')}</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('admin.services.descriptionPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('admin.services.expectedCompletionDaysLabel')}</Label>
              <Select
                value={expectedCompletionDays}
                onValueChange={(value) => setExpectedCompletionDays(value ?? '')}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('admin.services.expectedCompletionPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {SLA_DAY_OPTIONS.map((days) => {
                    const value = days.toString()
                    return (
                      <SelectItem key={value} value={value}>
                        {formatSlaDays(days)}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {expectedCompletionDays.trim()
                  ? t('admin.services.slaPreview', {
                      preview: formatSlaDays(Number(expectedCompletionDays)),
                    })
                  : t('admin.services.slaNoConfigHint')}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t('applications.requiredDocumentsLabel')}</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addDocRow}
                >
                  <Plus className="mr-1 h-3 w-3" /> {t('admin.services.add')}
                </Button>
              </div>
              {docs.map((doc, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={doc.name}
                    onChange={(e) => updateDoc(i, 'name', e.target.value)}
                    placeholder={t('admin.services.docNamePlaceholder')}
                    className="flex-1"
                  />
                  <label className="flex items-center gap-1 text-sm whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={doc.required}
                      onChange={(e) =>
                        updateDoc(i, 'required', e.target.checked)
                      }
                      className="rounded border-input"
                    />
                    {t('admin.services.required')}
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeDocRow(i)}
                    disabled={docs.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createServiceType.isPending}
            >
              {createServiceType.isPending ? t('common.creating') : t('common.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
