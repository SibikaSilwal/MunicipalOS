import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/shared/page-header'
import { useAuth } from '@/hooks/use-auth'
import { serviceTypesQueryOptions } from '@/hooks/queries/use-service-types'
import {
  workflowQueryOptions,
  useCreateWorkflow,
  useDeleteWorkflow,
  useUpdateWorkflow,
} from '@/hooks/queries/use-workflows'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import type { RoleName } from '@/types/api'
import { Plus, Trash2, ArrowUp, ArrowDown, GitBranch } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import {
  formatSlaDays,
  formatSlaMinutes,
  parseSlaDaysToMinutes,
  SLA_DAY_OPTIONS,
} from '@/lib/sla'
import { useTranslation } from 'react-i18next'

export interface WorkflowsSearch {
  serviceTypeId?: string
}

function parseWorkflowsSearch(
  search: Record<string, unknown>,
): WorkflowsSearch {
  const id =
    typeof search.serviceTypeId === 'string' && search.serviceTypeId.trim()
      ? search.serviceTypeId.trim()
      : undefined
  return { serviceTypeId: id }
}

export const Route = createFileRoute('/_authenticated/admin/workflows')({
  validateSearch: (search: Record<string, unknown>): WorkflowsSearch =>
    parseWorkflowsSearch(search),
  component: WorkflowsPage,
})

interface StepDraft {
  roleRequired: RoleName
  stepName: string
  stepDescription: string
  expectedCompletionDays: string
}

const serviceTypeSelectPlaceholderKey = 'admin.workflows.chooseServiceTypePlaceholder'

function emptyStepDraft(): StepDraft {
  return {
    roleRequired: 'WardOfficer',
    stepName: '',
    stepDescription: '',
    expectedCompletionDays: '',
  }
}

function WorkflowsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const search = Route.useSearch()
  const selectedServiceTypeId = search.serviceTypeId ?? ''
  const { user } = useAuth()
  const { data: serviceTypes = [] } = useQuery(
    serviceTypesQueryOptions(user?.municipalityId),
  )
  const createWorkflow = useCreateWorkflow()
  const updateWorkflow = useUpdateWorkflow()
  const deleteWorkflow = useDeleteWorkflow()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const { data: existingWorkflow } = useQuery(
    workflowQueryOptions(selectedServiceTypeId),
  )

  const [steps, setSteps] = useState<StepDraft[]>([emptyStepDraft()])

  useEffect(() => {
    if (!selectedServiceTypeId) return
    setSteps([emptyStepDraft()])
  }, [selectedServiceTypeId])

  const workflowSelectKey =
    `${selectedServiceTypeId || 'none'}-` +
    (existingWorkflow === undefined
      ? 'pending'
      : existingWorkflow
        ? existingWorkflow.id
        : 'nowf')

  function addStep() {
    setSteps((prev) => [...prev, emptyStepDraft()])
  }

  function removeStep(index: number) {
    setSteps((prev) => prev.filter((_, i) => i !== index))
  }

  function moveStep(index: number, direction: -1 | 1) {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= steps.length) return
    const updated = [...steps]
    const temp = updated[index]
    updated[index] = updated[newIndex]!
    updated[newIndex] = temp!
    setSteps(updated)
  }

  function updateStepRole(index: number, role: RoleName) {
    setSteps((prev) =>
      prev.map((s, i) => (i === index ? { ...s, roleRequired: role } : s)),
    )
  }

  function updateStepField(
    index: number,
    field: 'stepName' | 'stepDescription' | 'expectedCompletionDays',
    value: string,
  ) {
    setSteps((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    )
  }

  async function handleSave() {
    if (!selectedServiceTypeId) {
      toast.error(t('admin.workflows.pleaseSelectServiceType'))
      return
    }
    if (steps.length === 0) {
      toast.error(t('admin.workflows.addAtLeastOneStep'))
      return
    }

    const parsedStepSla = steps.map((step, index) => {
      const parsed = parseSlaDaysToMinutes(step.expectedCompletionDays)
      if (parsed.error) {
        toast.error(
          t('admin.workflows.stepSlaErrorPrefix', {
            n: index + 1,
            error: parsed.error,
          }),
        )
        return null
      }
      return parsed.value
    })
    if (parsedStepSla.some((value) => value === null)) {
      return
    }

    const payload = {
      serviceTypeId: selectedServiceTypeId,
      steps: steps.map((s, i) => ({
        stepOrder: i + 1,
        roleRequired: s.roleRequired,
        stepName: s.stepName,
        stepDescription: s.stepDescription || undefined,
        expectedCompletionMinutes: parsedStepSla[i] ?? undefined,
      })),
    }

    try {
      if (existingWorkflow) {
        await updateWorkflow.mutateAsync(payload)
        toast.success(t('admin.workflows.updatedToast'))
      } else {
        await createWorkflow.mutateAsync(payload)
        toast.success(t('admin.workflows.createdToast'))
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('admin.workflows.saveFailed'))
    }
  }

  async function handleConfirmDelete() {
    if (!selectedServiceTypeId) return
    try {
      await deleteWorkflow.mutateAsync(selectedServiceTypeId)
      toast.success(t('admin.workflows.deletedToast'))
      setDeleteDialogOpen(false)
      setSteps([emptyStepDraft()])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('admin.workflows.deleteFailed'))
    }
  }

  const savePending = createWorkflow.isPending || updateWorkflow.isPending

  return (
    <div className="space-y-6">
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={t('admin.workflows.deleteTitle')}
        description={t('admin.workflows.deleteDescription')}
        confirmLabel={t('admin.workflows.deleteConfirm')}
        variant="destructive"
        loading={deleteWorkflow.isPending}
        onConfirm={handleConfirmDelete}
      />

      <PageHeader
        title={t('admin.workflows.builderTitle')}
        description={t('admin.workflows.builderDescription')}
      />

      <Card>
        <CardHeader>
          <CardTitle>{t('admin.workflows.selectServiceType')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            key={workflowSelectKey}
            value={selectedServiceTypeId || undefined}
            onValueChange={(val) =>
              navigate({
                to: '/admin/workflows',
                search: {
                  serviceTypeId: val?.trim() ? val : undefined,
                },
              })
            }
          >
            <SelectTrigger className="max-w-md">
              <SelectValue placeholder={t(serviceTypeSelectPlaceholderKey)}>
                {(value) =>
                  value
                    ? (serviceTypes.find((s) => s.id === value)?.name ?? String(value))
                    : t(serviceTypeSelectPlaceholderKey)
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {serviceTypes.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {existingWorkflow && (
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center justify-between gap-2">
              {t('admin.workflows.currentWorkflow')}
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={deleteWorkflow.isPending}
              >
                {t('admin.workflows.deleteWorkflow')}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 flex-wrap">
              {existingWorkflow.steps
                .sort((a, b) => a.stepOrder - b.stepOrder)
                .map((step, i) => (
                  <div key={step.id} className="flex items-center gap-2">
                    <div className="rounded-lg border bg-muted px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                          {step.stepOrder}
                        </div>
                        <span className="text-sm font-medium">{step.stepName || step.roleRequired}</span>
                      </div>
                      {step.stepDescription && (
                        <p className="mt-1 ml-8 text-xs text-muted-foreground">{step.stepDescription}</p>
                      )}
                      <p className="mt-0.5 ml-8 text-xs text-muted-foreground">
                        {t('admin.workflows.roleLabel', { role: step.roleRequired })}
                      </p>
                      <p className="mt-0.5 ml-8 text-xs text-muted-foreground">
                        {t('admin.workflows.slaLabel', {
                          sla: formatSlaMinutes(step.expectedCompletionMinutes),
                        })}
                      </p>
                    </div>
                    {i < existingWorkflow.steps.length - 1 && (
                      <GitBranch className="h-4 w-4 text-muted-foreground rotate-90" />
                    )}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {existingWorkflow
              ? t('admin.workflows.replaceWorkflow')
              : t('admin.workflows.defineWorkflow')}
            <Button size="sm" onClick={addStep}>
              <Plus className="mr-1 h-3 w-3" /> {t('admin.workflows.addStep')}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {steps.map((step, i) => (
            <div key={i}>
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm text-primary-foreground mt-1">
                  {i + 1}
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs">{t('admin.workflows.stepName')}</Label>
                      <Input
                        value={step.stepName}
                        onChange={(e) => updateStepField(i, 'stepName', e.target.value)}
                        placeholder={t('admin.workflows.stepNamePlaceholder')}
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs">{t('admin.workflows.roleRequired')}</Label>
                      <Select
                        value={step.roleRequired}
                        onValueChange={(val) => updateStepRole(i, (val ?? 'WardOfficer') as RoleName)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="WardOfficer">
                            {t('admin.workflows.roles.wardOfficer')}
                          </SelectItem>
                          <SelectItem value="MunicipalOfficer">
                            {t('admin.workflows.roles.municipalOfficer')}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-1 mt-5">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => moveStep(i, -1)}
                        disabled={i === 0}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => moveStep(i, 1)}
                        disabled={i === steps.length - 1}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeStep(i)}
                        disabled={steps.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">
                      {t('admin.workflows.stepDescriptionOptional')}
                    </Label>
                    <Textarea
                      value={step.stepDescription}
                      onChange={(e) => updateStepField(i, 'stepDescription', e.target.value)}
                      placeholder={t('admin.workflows.stepDescriptionPlaceholder')}
                      rows={2}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">
                      {t('admin.workflows.expectedCompletionDays')}
                    </Label>
                    <Select
                      value={step.expectedCompletionDays}
                      onValueChange={(value) =>
                        updateStepField(i, 'expectedCompletionDays', value ?? '')
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('admin.workflows.selectDays')} />
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
                      {step.expectedCompletionDays.trim()
                        ? t('admin.services.slaPreview', {
                            preview: formatSlaDays(Number(step.expectedCompletionDays)),
                          })
                        : t('admin.workflows.optionalStepSlaOverride')}
                    </p>
                  </div>
                </div>
              </div>
              {i < steps.length - 1 && <Separator className="my-4 ml-11" />}
            </div>
          ))}

          <div className="pt-4">
            <Button
              onClick={handleSave}
              disabled={!selectedServiceTypeId || savePending}
              className="w-full"
            >
              {savePending
                ? t('admin.workflows.saving')
                : existingWorkflow
                  ? t('admin.workflows.updateWorkflow')
                  : t('admin.workflows.createWorkflow')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
