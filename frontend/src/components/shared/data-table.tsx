import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AgGridReact } from 'ag-grid-react'
import type {
  ColDef,
  DomLayoutType,
  DoesExternalFilterPass,
  GridApi,
  GridReadyEvent,
  RowClickedEvent,
} from 'ag-grid-community'
import { themeQuartz } from 'ag-grid-community'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const gridTheme = themeQuartz.withParams({
  fontFamily: ['inherit'],
})

export interface DataTableProps<TData> {
  columnDefs: ColDef<TData>[]
  rowData: TData[]
  searchPlaceholder?: string
  searchColumn?: Extract<keyof TData, string>
  onRowClick?: (row: TData) => void
  className?: string
  /** Pixel height or CSS length for the grid body (ignored when autoHeight is true) */
  gridHeight?: number | string
  /** Grow with row count instead of a tall empty viewport (good with pagination). */
  autoHeight?: boolean
}

export function DataTable<TData>({
  columnDefs,
  rowData,
  searchPlaceholder = 'Search...',
  searchColumn,
  onRowClick,
  className,
  gridHeight = 440,
  autoHeight = false,
}: DataTableProps<TData>) {
  const gridApiRef = useRef<GridApi<TData> | null>(null)
  const [search, setSearch] = useState('')
  const [displayedCount, setDisplayedCount] = useState(0)

  const isExternalFilterPresent = useCallback(
    () => Boolean(searchColumn && search.trim().length > 0),
    [searchColumn, search],
  )

  const doesExternalFilterPass = useCallback<DoesExternalFilterPass<TData>>(
    (node) => {
      if (!searchColumn || !search.trim() || !node.data) return true
      const raw = node.data[searchColumn]
      return String(raw ?? '')
        .toLowerCase()
        .includes(search.trim().toLowerCase())
    },
    [searchColumn, search],
  )

  useEffect(() => {
    gridApiRef.current?.onFilterChanged()
  }, [search, searchColumn])

  const onGridReady = useCallback((e: GridReadyEvent<TData>) => {
    gridApiRef.current = e.api
    setDisplayedCount(e.api.getDisplayedRowCount())
  }, [])

  const onModelUpdated = useCallback(() => {
    const api = gridApiRef.current
    if (api) setDisplayedCount(api.getDisplayedRowCount())
  }, [])

  const defaultColDef = useMemo<ColDef<TData>>(
    () => ({
      sortable: true,
      filter: false,
      resizable: true,
      flex: 1,
      minWidth: 100,
    }),
    [],
  )

  const heightStyle =
    typeof gridHeight === 'number' ? `${gridHeight}px` : gridHeight

  const domLayout: DomLayoutType = autoHeight ? 'autoHeight' : 'normal'

  return (
    <div className={cn('space-y-4', className)}>
      {searchColumn ? (
        <Input
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      ) : null}

      <div
        className={cn(
          'w-full overflow-hidden rounded-md border border-border',
          autoHeight && 'min-h-[120px]',
        )}
        style={autoHeight ? undefined : { height: heightStyle }}
      >
        <AgGridReact<TData>
          theme={gridTheme}
          domLayout={domLayout}
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          pagination
          paginationPageSize={10}
          paginationPageSizeSelector={[10, 25, 50]}
          suppressCellFocus
          animateRows
          rowClass={onRowClick ? 'cursor-pointer' : undefined}
          onRowClicked={
            onRowClick
              ? (e: RowClickedEvent<TData>) => {
                  const t = e.event?.target as HTMLElement | undefined
                  if (
                    t?.closest(
                      'button, a, input, select, textarea, [role="combobox"]',
                    )
                  ) {
                    return
                  }
                  if (e.data) onRowClick(e.data)
                }
              : undefined
          }
          isExternalFilterPresent={isExternalFilterPresent}
          doesExternalFilterPass={doesExternalFilterPass}
          onGridReady={onGridReady}
          onModelUpdated={onModelUpdated}
        />
      </div>

      <p className="text-sm text-muted-foreground">
        {displayedCount} row(s) shown
      </p>
    </div>
  )
}
