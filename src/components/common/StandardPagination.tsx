import { Button } from '@/components/ui/button'
import { ChevronLeftIcon } from '@/components/ui/chevron-left'
import { ChevronRightIcon } from '@/components/ui/chevron-right'
import { Download } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface StandardPaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onExport?: () => void
  exportLabel?: string
  className?: string
}

export function StandardPagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onExport,
  exportLabel,
  className = '',
}: StandardPaginationProps) {
  const { t } = useTranslation()

  // Calculate range
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  // Generate page numbers
  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, '...', totalPages - 1, totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, 2, '...', totalPages - 2, totalPages - 1, totalPages)
      } else {
        pages.push(
          1,
          '...',
          currentPage - 1,
          currentPage,
          currentPage + 1,
          '...',
          totalPages,
        )
      }
    }
    return pages
  }

  // Ensure valid current page for display logic
  const validCurrentPage = Math.max(1, Math.min(currentPage, totalPages)) || 1

  return (
    <div
      className={`flex items-center justify-between px-4 py-3 border-t bg-muted/30 ${className}`}
    >
      <div className="text-sm text-muted-foreground">
        {t(
          'common.pagination.showing',
          'Showing {{start}} to {{end}} of {{total}} results',
          {
            start: startItem,
            end: endItem,
            total: totalItems,
            defaultValue: `Showing ${startItem} to ${endItem} of ${totalItems} results`,
          },
        )}
      </div>
      <div className="flex items-center gap-1">
        {onExport && (
          <Button
            variant="default"
            size="sm"
            className="h-8 gap-2 mr-2 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={onExport}
          >
            <Download className="h-4 w-4" />
            {exportLabel || t('common.export', 'Export')}
          </Button>
        )}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          asChild
        >
          <ChevronLeftIcon
            size={16}
            animate={currentPage > 1 ? undefined : false}
          />
        </Button>
        {getPageNumbers().map((page, index) => (
          <Button
            key={index}
            variant={page === validCurrentPage ? 'default' : 'outline'}
            size="icon"
            className={`h-8 w-8 ${
              page === validCurrentPage
                ? 'bg-primary text-primary-foreground border-primary'
                : ''
            }`}
            disabled={page === '...'}
            onClick={() => typeof page === 'number' && onPageChange(page)}
          >
            {page}
          </Button>
        ))}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          asChild
        >
          <ChevronRightIcon
            size={16}
            animate={currentPage < totalPages ? undefined : false}
          />
        </Button>
      </div>
    </div>
  )
}
