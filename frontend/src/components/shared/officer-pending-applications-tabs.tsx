import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import type { ColDef, ICellRendererParams } from 'ag-grid-community'
import { DataTable } from '@/components/shared/data-table'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  municipalityApplicationsQueryOptions,
  myAssignedApplicationsQueryOptions,
  pendingApplicationsQueryOptions,
} from '@/hooks/queries/use-applications'
import type { ApplicationSummary } from '@/types/api'
import { formatDate, formatRelative } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from 'react-i18next'

type TabValue = 'active' | 'all' | 'mine'

export interface OfficerPendingApplicationsTabsProps {
  /** Queue (pending only) vs municipality-wide list (every status). */
  variant: 'dashboard' | 'catalog'
  title: string
}

export function OfficerPendingApplicationsTabs({
  variant,
  title,
}: OfficerPendingApplicationsTabsProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [tab, setTab] = useState<TabValue>('active')
  const columnDefs: ColDef<ApplicationSummary>[] = useMemo(() => {
    if (variant === 'dashboard') {
      return [
        {
          field: 'friendlyApplicationId',
          headerName: t('applications.applicationLabel'),
          flex: 0,
          minWidth: 140,
          maxWidth: 200,
          cellClass: 'font-mono text-xs',
        },
        {
          field: 'serviceTypeName',
          headerName: t('applications.serviceTypeLabel'),
        },
        {
          field: 'status',
          headerName: t('applications.statusLabel'),
          cellRenderer: (p: ICellRendererParams<ApplicationSummary>) =>
            p.data ? <StatusBadge status={p.data.status} /> : null,
        },
        {
          colId: 'submittedAt',
          field: 'submittedAt',
          headerName: t('applications.submittedLabel'),
          valueGetter: (p) =>
            p.data ? new Date(p.data.submittedAt).getTime() : 0,
          cellRenderer: (p: ICellRendererParams<ApplicationSummary>) =>
            p.data ? formatDate(p.data.submittedAt) : null,
        },
        {
          colId: 'daysPending',
          headerName: t('applications.pendingSince'),
          valueGetter: (p) =>
            p.data ? new Date(p.data.submittedAt).getTime() : 0,
          cellRenderer: (p: ICellRendererParams<ApplicationSummary>) =>
            p.data ? (
              <Badge variant="outline">
                {formatRelative(p.data.submittedAt)}
              </Badge>
            ) : null,
        },
      ]
    }

    return [
      {
        field: 'friendlyApplicationId',
        headerName: t('applications.applicationLabel'),
        flex: 0,
        minWidth: 140,
        maxWidth: 200,
        cellClass: 'font-mono text-xs',
      },
      { field: 'serviceTypeName', headerName: t('applications.serviceTypeLabel') },
      {
        field: 'status',
        headerName: t('applications.statusLabel'),
        cellRenderer: (p: ICellRendererParams<ApplicationSummary>) =>
          p.data ? <StatusBadge status={p.data.status} /> : null,
      },
      {
        field: 'currentStep',
        headerName: t('applications.currentStepLabel'),
        maxWidth: 120,
        cellRenderer: (p: ICellRendererParams<ApplicationSummary>) =>
          p.data ? (
            <Badge variant="outline">
              {t('applications.stepShort', { n: p.data.currentStep })}
            </Badge>
          ) : null,
      },
      {
        colId: 'submittedAt',
        field: 'submittedAt',
        headerName: t('applications.submittedLabel'),
        valueGetter: (p) =>
          p.data ? new Date(p.data.submittedAt).getTime() : 0,
        cellRenderer: (p: ICellRendererParams<ApplicationSummary>) =>
          p.data ? formatDate(p.data.submittedAt) : null,
      },
      {
        colId: 'age',
        headerName: t('applications.age'),
        maxWidth: 120,
        sortable: false,
        cellRenderer: (p: ICellRendererParams<ApplicationSummary>) =>
          p.data ? (
            <span className="text-xs text-muted-foreground">
              {formatRelative(p.data.submittedAt)}
            </span>
          ) : null,
      },
    ]
  }, [t, variant])

  const pendingQuery = useQuery({
    ...pendingApplicationsQueryOptions(),
    enabled: tab === 'active',
  })
  const municipalityAllQuery = useQuery({
    ...municipalityApplicationsQueryOptions(),
    enabled: variant === 'catalog' && tab === 'all',
  })
  const assignedQuery = useQuery({
    ...myAssignedApplicationsQueryOptions(),
    enabled: tab === 'mine',
  })

  const pending = pendingQuery.data ?? []
  const municipalityAll = municipalityAllQuery.data ?? []
  const assigned = assignedQuery.data ?? []

  const description = useMemo(() => {
    if (tab === 'active') {
      if (pendingQuery.isLoading) return t('applications.loadingApplications')
      return variant === 'dashboard'
        ? t('applications.awaitingReviewCount', { count: pending.length })
        : t('applications.activeAcrossMunicipalityCount', { count: pending.length })
    }

    if (tab === 'all') {
      if (municipalityAllQuery.isLoading) return t('applications.loadingApplications')
      return t('applications.inMunicipalityAllStatusesCount', {
        count: municipalityAll.length,
      })
    }

    if (assignedQuery.isLoading) return t('applications.loadingAssignments')
    return t('applications.assignedToYouCount', { count: assigned.length })
  }, [
    assigned.length,
    assignedQuery.isLoading,
    municipalityAll.length,
    municipalityAllQuery.isLoading,
    pending.length,
    pendingQuery.isLoading,
    t,
    tab,
    variant,
  ])

  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as TabValue)}
        className="w-full"
      >
        <TabsList>
          <TabsTrigger value="active">
            {variant === 'dashboard'
              ? t('applications.tabs.allPending')
              : t('applications.tabs.active')}
          </TabsTrigger>
          {variant === 'catalog' ? (
            <TabsTrigger value="all">{t('applications.tabs.all')}</TabsTrigger>
          ) : null}
          <TabsTrigger value="mine">{t('applications.tabs.assignedToMe')}</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-4">
        {tab === 'active' ? (
          pendingQuery.isLoading ? (
            <Skeleton className="h-[440px] w-full rounded-md" />
          ) : pendingQuery.isError ? (
            <p className="text-sm text-destructive">
              {pendingQuery.error instanceof Error
                ? pendingQuery.error.message
                : t('applications.loadFailed')}
            </p>
          ) : (
            <DataTable
              columnDefs={columnDefs}
              rowData={pending}
              searchColumn="serviceTypeName"
              searchPlaceholder={t('applications.filterByServiceTypePlaceholder')}
              onRowClick={(row) =>
                navigate({
                  to: '/officer/review/$id',
                  params: { id: row.id },
                })
              }
            />
          )
        ) : tab === 'all' ? (
          municipalityAllQuery.isLoading ? (
            <Skeleton className="h-[440px] w-full rounded-md" />
          ) : municipalityAllQuery.isError ? (
            <p className="text-sm text-destructive">
              {municipalityAllQuery.error instanceof Error
                ? municipalityAllQuery.error.message
                : t('applications.loadFailed')}
            </p>
          ) : (
            <DataTable
              columnDefs={columnDefs}
              rowData={municipalityAll}
              searchColumn="serviceTypeName"
              searchPlaceholder={t('applications.filterByServiceTypePlaceholder')}
              onRowClick={(row) =>
                navigate({
                  to: '/officer/review/$id',
                  params: { id: row.id },
                })
              }
            />
          )
        ) : assignedQuery.isLoading ? (
          <Skeleton className="h-[440px] w-full rounded-md" />
        ) : assignedQuery.isError ? (
          <p className="text-sm text-destructive">
            {assignedQuery.error instanceof Error
              ? assignedQuery.error.message
              : t('applications.assignmentsLoadFailed')}
          </p>
        ) : (
          <DataTable
            columnDefs={columnDefs}
            rowData={assigned}
            searchColumn="serviceTypeName"
            searchPlaceholder={t('applications.filterByServiceTypePlaceholder')}
            onRowClick={(row) =>
              navigate({
                to: '/officer/review/$id',
                params: { id: row.id },
              })
            }
          />
        )}
      </div>
    </div>
  )
}
