import { useClientQueries } from '@zenstackhq/tanstack-query/react'
import { toast } from 'sonner'
import { schema } from '@acme/zen-v3/zenstack/schema'
import { authClient } from '~/clients/auth-client'
import { ProductForm } from '~/components/products/product-form'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@acme/ui/sheet'
import type { Product } from '@acme/zen-v3/zenstack/models'

type ProductsMutateDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: Product
}

export function ProductsMutateDrawer({
  open,
  onOpenChange,
  currentRow,
}: ProductsMutateDrawerProps) {
  const isUpdate = !!currentRow
  const client = useClientQueries(schema)
  const { data: activeOrganization } = authClient.useActiveOrganization()

  const { mutate: createProduct, isPending: isCreating } =
    client.product.useCreate({
      onSuccess: () => {
        toast.success('Produto criado com sucesso')
        onOpenChange(false)
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })

  const { mutate: updateProduct, isPending: isUpdating } =
    client.product.useUpdate({
      onSuccess: () => {
        toast.success('Produto atualizado com sucesso')
        onOpenChange(false)
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })

  const handleSubmit = async (data: {
    code: string
    name: string
    category: string
    unit: string
    costPrice: string
    salePrice: string
    minimumStock: string
    storageLocation: string
    active: boolean
  }) => {
    if (!activeOrganization?.id) {
      toast.error('Por favor, selecione uma organização')
      return
    }

    if (isUpdate && currentRow) {
      updateProduct({
        data: {
          code: data.code,
          name: data.name,
          category: data.category || null,
          unit: data.unit || null,
          costPrice: data.costPrice ? parseFloat(data.costPrice) : null,
          salePrice: data.salePrice ? parseFloat(data.salePrice) : null,
          minimumStock: data.minimumStock
            ? parseInt(data.minimumStock, 10)
            : null,
          storageLocation: data.storageLocation || null,
          active: data.active,
        },
        where: { id: currentRow.id },
      })
    } else {
      createProduct({
        data: {
          code: data.code,
          name: data.name,
          category: data.category || null,
          unit: data.unit || null,
          costPrice: data.costPrice ? parseFloat(data.costPrice) : null,
          salePrice: data.salePrice ? parseFloat(data.salePrice) : null,
          minimumStock: data.minimumStock
            ? parseInt(data.minimumStock, 10)
            : null,
          storageLocation: data.storageLocation || null,
          active: data.active,
        },
      })
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex flex-col'>
        <SheetHeader className='text-start'>
          <SheetTitle>
            {isUpdate ? 'Editar' : 'Criar'} Produto
          </SheetTitle>
          <SheetDescription>
            {isUpdate
              ? 'Atualize as informações do produto.'
              : 'Adicione um novo produto preenchendo as informações abaixo.'}
            Clique em salvar quando terminar.
          </SheetDescription>
        </SheetHeader>
        <div className='flex-1 overflow-y-auto px-4 py-6'>
          <ProductForm
            defaultValues={
              currentRow
                ? {
                    code: currentRow.code,
                    name: currentRow.name,
                    category: currentRow.category ?? '',
                    unit: currentRow.unit ?? '',
                    costPrice: currentRow.costPrice?.toString() ?? '',
                    salePrice: currentRow.salePrice?.toString() ?? '',
                    minimumStock: currentRow.minimumStock?.toString() ?? '',
                    storageLocation: currentRow.storageLocation ?? '',
                    active: currentRow.active,
                  }
                : undefined
            }
            onSubmit={handleSubmit}
            isSubmitting={isCreating || isUpdating}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}

