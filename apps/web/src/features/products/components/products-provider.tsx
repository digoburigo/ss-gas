import React, { useState } from 'react'
import useDialogState from '~/hooks/use-dialog-state'
import type { Product } from '@acme/zen-v3/zenstack/models'

type ProductsDialogType = 'create' | 'update' | 'delete'

type ProductsContextType = {
  open: ProductsDialogType | null
  setOpen: (str: ProductsDialogType | null) => void
  currentRow: Product | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Product | null>>
}

const ProductsContext = React.createContext<ProductsContextType | null>(null)

export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<ProductsDialogType>(null)
  const [currentRow, setCurrentRow] = useState<Product | null>(null)

  return (
    <ProductsContext.Provider value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </ProductsContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useProducts = () => {
  const productsContext = React.useContext(ProductsContext)

  if (!productsContext) {
    throw new Error('useProducts has to be used within <ProductsProvider>')
  }

  return productsContext
}

