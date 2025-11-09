import { CheckCircle2, XCircle } from 'lucide-react'

export const units = [
  {
    label: 'Unidade (un)',
    value: 'un',
  },
  {
    label: 'Quilograma (kg)',
    value: 'kg',
  },
  {
    label: 'Grama (g)',
    value: 'g',
  },
  {
    label: 'Litro (l)',
    value: 'l',
  },
  {
    label: 'Mililitro (ml)',
    value: 'ml',
  },
  {
    label: 'Metro (m)',
    value: 'm',
  },
  {
    label: 'Centímetro (cm)',
    value: 'cm',
  },
  {
    label: 'Metro quadrado (m²)',
    value: 'm²',
  },
  {
    label: 'Metro cúbico (m³)',
    value: 'm³',
  },
]

export const activeStatuses = [
  {
    label: 'Ativo',
    value: 'active' as const,
    icon: CheckCircle2,
  },
  {
    label: 'Inativo',
    value: 'inactive' as const,
    icon: XCircle,
  },
]

