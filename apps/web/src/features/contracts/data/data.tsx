import { CheckCircle, XCircle } from "lucide-react";

export const statusOptions = [
  {
    label: "Ativo",
    value: "active",
    icon: CheckCircle,
  },
  {
    label: "Inativo",
    value: "inactive",
    icon: XCircle,
  },
];

export const volumeUnitOptions = [
  { label: "m³", value: "m3" },
  { label: "MMBtu", value: "MMBtu" },
];

export const currencyOptions = [
  { label: "Real (BRL)", value: "BRL" },
  { label: "Dólar (USD)", value: "USD" },
];

export const adjustmentFrequencyOptions = [
  { label: "Mensal", value: "monthly" },
  { label: "Trimestral", value: "quarterly" },
  { label: "Semestral", value: "semiannually" },
  { label: "Anual", value: "annually" },
];

export const adjustmentIndexOptions = [
  { label: "IGPM", value: "IGPM" },
  { label: "IPCA", value: "IPCA" },
  { label: "Henry Hub", value: "Henry Hub" },
  { label: "Outro", value: "other" },
];
