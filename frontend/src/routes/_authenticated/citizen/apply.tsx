import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
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
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/shared/page-header'
import { FileUploader } from '@/components/shared/file-uploader'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/hooks/use-auth'
import { serviceTypesQueryOptions } from '@/hooks/queries/use-service-types'
import { useSubmitApplication } from '@/hooks/queries/use-applications'
import { useUploadDocument } from '@/hooks/queries/use-documents'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export const Route = createFileRoute('/_authenticated/citizen/apply')({
  component: ApplyPage,
})

function ApplyPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: serviceTypes = [] } = useQuery(
    serviceTypesQueryOptions(user?.municipalityId),
  )

  const submitApplication = useSubmitApplication()
  const uploadDocument = useUploadDocument()

  const [step, setStep] = useState(0)
  const [serviceTypeId, setServiceTypeId] = useState('')
  const [files, setFiles] = useState<Record<string, File | null>>({})
  const [submitting, setSubmitting] = useState(false)

  const selectedService = serviceTypes.find((s) => s.id === serviceTypeId)
  const requiredDocs = selectedService?.requiredDocuments ?? []

  function handleFileSelect(docName: string, file: File | null) {
    setFiles((prev) => ({ ...prev, [docName]: file }))
  }

  const allRequiredUploaded = requiredDocs
    .filter((d) => d.required)
    .every((d) => files[d.name])

  async function handleSubmit() {
    if (!serviceTypeId) return
    setSubmitting(true)

    try {
      const result = await submitApplication.mutateAsync({ serviceTypeId })

      const filesToUpload = Object.entries(files).filter(
        (entry): entry is [string, File] => entry[1] !== null,
      )

      for (const [documentName, file] of filesToUpload) {
        await uploadDocument.mutateAsync({
          applicationId: result.id,
          documentName,
          file,
        })
      }

      toast.success(
        t('applications.submittedToast', {
          ref: result.friendlyApplicationId,
        }),
      )
      navigate({
        to: '/citizen/applications/$id',
        params: { id: result.id },
      })
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t('applications.submitFailed'),
      )
    } finally {
      setSubmitting(false)
    }
  }

  const steps = [
    t('applications.steps.selectService'),
    t('applications.steps.uploadDocuments'),
    t('applications.steps.reviewAndSubmit'),
  ]

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title={t('applications.applyTitle')}
        description={t('applications.applySubtitle')}
      />

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {steps.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                i <= step
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span
              className={`hidden text-sm sm:inline ${
                i <= step ? 'font-medium' : 'text-muted-foreground'
              }`}
            >
              {label}
            </span>
            {i < steps.length - 1 && (
              <Separator className="w-8" />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Select Service */}
      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('applications.selectServiceTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t('applications.serviceTypeLabel')}</Label>
              <Select value={serviceTypeId} onValueChange={(val) => setServiceTypeId(val ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder={t('applications.serviceTypePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {serviceTypes.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedService?.description && (
              <p className="text-sm text-muted-foreground">
                {selectedService.description}
              </p>
            )}

            {requiredDocs.length > 0 && (
              <div className="space-y-2">
                <Label>{t('applications.requiredDocumentsLabel')}</Label>
                <ul className="list-inside list-disc text-sm text-muted-foreground">
                  {requiredDocs.map((d) => (
                    <li key={d.id}>
                      {d.name}
                      {d.required && (
                        <span className="text-destructive"> *</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                onClick={() => setStep(1)}
                disabled={!serviceTypeId}
              >
                {t('common.next')} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Upload Documents */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('applications.steps.uploadDocuments')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {requiredDocs.map((doc) => (
              <div key={doc.id} className="space-y-2">
                <Label>
                  {doc.name}
                  {doc.required && (
                    <span className="text-destructive"> *</span>
                  )}
                </Label>
                <FileUploader
                  label={t('applications.uploadDocumentCta', { doc: doc.name })}
                  file={files[doc.name] ?? null}
                  onFileSelect={(file) => handleFileSelect(doc.name, file)}
                />
              </div>
            ))}

            {requiredDocs.length === 0 && (
              <p className="text-sm text-muted-foreground">
                {t('applications.noDocumentsRequired')}
              </p>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(0)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> {t('common.back')}
              </Button>
              <Button
                onClick={() => setStep(2)}
                disabled={!allRequiredUploaded && requiredDocs.some((d) => d.required)}
              >
                {t('common.next')} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Review & Submit */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('applications.steps.reviewAndSubmit')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  {t('applications.summary.service')}
                </span>
                <span className="text-sm font-medium">
                  {selectedService?.name}
                </span>
              </div>
              <Separator />
              <div>
                <span className="text-sm text-muted-foreground">
                  {t('applications.summary.documents')}
                </span>
                <ul className="mt-1 space-y-1">
                  {Object.entries(files)
                    .filter((entry): entry is [string, File] => entry[1] !== null)
                    .map(([name, file]) => (
                      <li
                        key={name}
                        className="flex justify-between text-sm"
                      >
                        <span>{name}</span>
                        <span className="text-muted-foreground">
                          {file.name}
                        </span>
                      </li>
                    ))}
                  {Object.values(files).filter(Boolean).length === 0 && (
                    <li className="text-sm text-muted-foreground italic">
                      {t('applications.noDocumentsUploaded')}
                    </li>
                  )}
                </ul>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> {t('common.back')}
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? t('applications.submitting') : t('applications.submit')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
