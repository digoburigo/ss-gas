import { Plus } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Button } from '@acme/ui/button'

export function ProductsPrimaryButtons() {
  return (
    <div className='flex gap-2'>
      <Button asChild className='space-x-1'>
        <Link to='/products/new'>
          <span>Criar</span> <Plus size={18} />
        </Link>
      </Button>
    </div>
  )
}

