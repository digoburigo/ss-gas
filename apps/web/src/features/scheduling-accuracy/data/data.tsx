import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Cloud,
  Factory,
  TrendingDown,
  TrendingUp,
  Wrench,
  Zap,
} from "lucide-react";

// Period options for filtering deviation history
export const periodOptions = [
  { value: "daily", label: "Diário" },
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensal" },
];

// Deviation causes - recordable reasons for deviation
export const deviationCauses = [
  {
    value: "weather",
    label: "Clima",
    icon: Cloud,
    description: "Variações climáticas afetaram o consumo",
  },
  {
    value: "production",
    label: "Produção",
    icon: Factory,
    description: "Alterações no volume de produção",
  },
  {
    value: "maintenance",
    label: "Manutenção",
    icon: Wrench,
    description: "Parada programada ou emergencial",
  },
  {
    value: "demand_spike",
    label: "Pico de Demanda",
    icon: TrendingUp,
    description: "Aumento inesperado na demanda",
  },
  {
    value: "demand_drop",
    label: "Queda de Demanda",
    icon: TrendingDown,
    description: "Redução inesperada na demanda",
  },
  {
    value: "equipment_issue",
    label: "Problema de Equipamento",
    icon: Zap,
    description: "Falha ou problema em equipamentos",
  },
  {
    value: "scheduling_error",
    label: "Erro de Programação",
    icon: Calendar,
    description: "Erro na previsão de consumo",
  },
  {
    value: "other",
    label: "Outro",
    icon: AlertTriangle,
    description: "Outra causa não listada",
  },
];

// Accuracy status thresholds
export const accuracyStatuses = [
  {
    value: "excellent",
    label: "Excelente (≥95%)",
    threshold: 95,
    color: "green",
    icon: CheckCircle,
  },
  {
    value: "good",
    label: "Bom (≥90%)",
    threshold: 90,
    color: "blue",
    icon: CheckCircle,
  },
  {
    value: "acceptable",
    label: "Aceitável (≥80%)",
    threshold: 80,
    color: "yellow",
    icon: AlertTriangle,
  },
  {
    value: "poor",
    label: "Ruim (<80%)",
    threshold: 0,
    color: "red",
    icon: AlertTriangle,
  },
];

// Helper to get accuracy status based on value
export function getAccuracyStatus(accuracy: number) {
  for (const status of accuracyStatuses) {
    if (accuracy >= status.threshold) {
      return status;
    }
  }
  return accuracyStatuses[accuracyStatuses.length - 1];
}

// Helper to calculate accuracy rate
// Formula: (1 - |Scheduled - Actual| / Scheduled) x 100%
export function calculateAccuracyRate(
  scheduled: number,
  actual: number,
): number {
  if (scheduled <= 0) return 0;
  const deviation = Math.abs(scheduled - actual);
  const accuracy = (1 - deviation / scheduled) * 100;
  return Math.max(0, accuracy); // Ensure non-negative
}

// Helper to calculate deviation percentage
export function calculateDeviationPercent(
  scheduled: number,
  actual: number,
): number {
  if (scheduled <= 0) return 0;
  return ((actual - scheduled) / scheduled) * 100;
}
