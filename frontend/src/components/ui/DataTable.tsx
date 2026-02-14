import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type Row,
} from '@tanstack/react-table'
import { useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Button from './Button'
import { SkeletonTable } from './Skeleton'

export interface DataTablePagination {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[]
  data: TData[]
  loading?: boolean
  emptyText?: string
  pagination?: DataTablePagination
  sortable?: boolean
  skeletonRows?: number
  skeletonCols?: number
  renderSubRow?: (row: Row<TData>) => ReactNode
  getRowCanExpand?: (row: Row<TData>) => boolean
}

export default function DataTable<TData>({
  columns,
  data,
  loading = false,
  emptyText,
  pagination,
  sortable = false,
  skeletonRows = 5,
  skeletonCols,
  renderSubRow,
  getRowCanExpand,
}: DataTableProps<TData>) {
  const { t } = useTranslation()
  const [sorting, setSorting] = useState<SortingState>([])

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: sortable ? getSortedRowModel() : undefined,
    getExpandedRowModel: renderSubRow ? getExpandedRowModel() : undefined,
    getRowCanExpand: getRowCanExpand ?? (() => !!renderSubRow),
  })

  if (loading) {
    return <SkeletonTable rows={skeletonRows} cols={skeletonCols ?? columns.length} />
  }

  if (data.length === 0) {
    return (
      <p className="text-text-secondary text-center py-8">
        {emptyText ?? t('table.empty')}
      </p>
    )
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {table.getHeaderGroups().map((headerGroup) =>
                headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="text-left py-3 px-4 text-text-secondary font-medium"
                    onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                    style={header.column.getCanSort() ? { cursor: 'pointer', userSelect: 'none' } : undefined}
                  >
                    <span className="inline-flex items-center gap-1">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        header.column.getIsSorted() === 'asc'
                          ? <ArrowUp className="w-3 h-3" />
                          : header.column.getIsSorted() === 'desc'
                            ? <ArrowDown className="w-3 h-3" />
                            : <ArrowUpDown className="w-3 h-3 opacity-40" />
                      )}
                    </span>
                  </th>
                ))
              )}
            </tr>
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <>
                <tr
                  key={row.id}
                  className="border-b border-border/50 last:border-0 hover:bg-surface/50 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="py-3 px-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
                {row.getIsExpanded() && renderSubRow && (
                  <tr key={`${row.id}-expanded`}>
                    <td colSpan={columns.length} className="bg-surface/30 px-8 py-4">
                      {renderSubRow(row)}
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <p className="text-sm text-text-secondary">
            {t('common.pageInfo', { page: pagination.page, total: pagination.totalPages })}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(Math.max(1, pagination.page - 1))}
              disabled={pagination.page === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(Math.min(pagination.totalPages, pagination.page + 1))}
              disabled={pagination.page === pagination.totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
