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
import { Fragment, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Button from './Button'
import { SkeletonTable } from './Skeleton'

/** Build a compact page number array like [1, '...', 4, 5, 6, '...', 10] */
function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | '...')[] = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  if (start > 2) pages.push('...')
  for (let i = start; i <= end; i++) pages.push(i)
  if (end < total - 1) pages.push('...')
  pages.push(total)
  return pages
}

export interface DataTablePagination {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  totalRecords?: number
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
  onRowClick?: (row: Row<TData>) => void
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
  onRowClick,
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
              <Fragment key={row.id}>
                <tr
                  className={`border-b border-border/50 last:border-0 hover:bg-surface-hover/50 transition-colors${onRowClick ? ' cursor-pointer' : ''}`}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="py-3 px-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
                {row.getIsExpanded() && renderSubRow && (
                  <tr>
                    <td colSpan={columns.length} className="bg-surface/30 px-8 py-4">
                      {renderSubRow(row)}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <p className="text-sm text-text-secondary">
            {pagination.totalRecords != null
              ? t('common.pageInfoWithTotal', { page: pagination.page, total: pagination.totalPages, records: pagination.totalRecords })
              : t('common.pageInfo', { page: pagination.page, total: pagination.totalPages })}
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(Math.max(1, pagination.page - 1))}
              disabled={pagination.page === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            {getPageNumbers(pagination.page, pagination.totalPages).map((p, i) =>
              p === '...' ? (
                <span key={`ellipsis-${i}`} className="px-2 py-1.5 text-sm text-text-muted">...</span>
              ) : (
                <Button
                  key={p}
                  variant={p === pagination.page ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => pagination.onPageChange(p as number)}
                >
                  {p}
                </Button>
              ),
            )}
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
