import { useState } from 'react'
import { type Table } from '@tanstack/react-table'
import { Trash2, Download } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@acme/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@acme/ui/tooltip'
import { DataTableBulkActions as BulkActionsToolbar } from '~/components/data-table'
import type { Product } from '@acme/zen-v3/zenstack/models'
import { ProductsMultiDeleteDialog } from './products-multi-delete-dialog'

type DataTableBulkActionsProps<TData> = {
  table: Table<TData>
}

export function DataTableBulkActions<TData>({
  table,
}: DataTableBulkActionsProps<TData>) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const selectedRows = table.getFilteredSelectedRowModel().rows

  const handleBulkExport = () => {
    const selectedProducts = selectedRows.map((row) => row.original as Product)
    toast.promise(
      new Promise((resolve) => {
        // Simulate export
        setTimeout(() => {
          console.log('Exporting products:', selectedProducts)
          resolve(undefined)
        }, 500)
      }),
      {
        loading: 'Exportando produtos...',
        success: () => {
          table.resetRowSelection()
          return `Exportados ${selectedProducts.length} produto${selectedProducts.length > 1 ? 's' : ''} para CSV.`
        },
        error: 'Erro ao exportar',
      }
    )
    table.resetRowSelection()
  }

  return (
    <>
      <BulkActionsToolbar table={table} entityName='produto'>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='outline'
              size='icon'
              onClick={() => handleBulkExport()}
              className='size-8'
              aria-label='Exportar produtos'
              title='Exportar produtos'
            >
              <Download />
              <span className='sr-only'>Exportar produtos</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Exportar produtos</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='destructive'
              size='icon'
              onClick={() => setShowDeleteConfirm(true)}
              className='size-8'
              aria-label='Excluir produtos selecionados'
              title='Excluir produtos selecionados'
            >
              <Trash2 />
              <span className='sr-only'>Excluir produtos selecionados</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Excluir produtos selecionados</p>
          </TooltipContent>
        </Tooltip>
      </BulkActionsToolbar>

      <ProductsMultiDeleteDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        table={table}
      />
    </>
  )
}

