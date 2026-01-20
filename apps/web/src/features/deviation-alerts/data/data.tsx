import {
  AlertTriangle,
  Bell,
  BellOff,
  CheckCircle,
  Clock,
  Mail,
  MailCheck,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

// Alert status options
export const alertStatuses = [
  {
    value: "active",
    label: "Ativo",
    icon: Bell,
    description: "Alerta ativo aguardando ação",
  },
  {
    value: "acknowledged",
    label: "Reconhecido",
    icon: CheckCircle,
    description: "Alerta foi reconhecido",
  },
  {
    value: "resolved",
    label: "Resolvido",
    icon: BellOff,
    description: "Alerta foi resolvido",
  },
] as const;

// Deviation types
export const deviationTypes = [
  {
    value: "over",
    label: "Consumo Acima",
    icon: TrendingUp,
    color: "red",
  },
  {
    value: "under",
    label: "Consumo Abaixo",
    icon: TrendingDown,
    color: "blue",
  },
] as const;

// Email status options
export const emailStatuses = [
  {
    value: "pending",
    label: "Pendente",
    icon: Clock,
    description: "E-mail ainda não enviado",
  },
  {
    value: "sent",
    label: "Enviado",
    icon: MailCheck,
    description: "E-mail enviado com sucesso",
  },
  {
    value: "failed",
    label: "Falhou",
    icon: AlertTriangle,
    description: "Falha no envio do e-mail",
  },
] as const;

// Severity levels based on deviation percentage
export const severityLevels = [
  {
    value: "critical",
    label: "Crítico",
    minDeviation: 30,
    color: "red",
  },
  {
    value: "high",
    label: "Alto",
    minDeviation: 20,
    color: "orange",
  },
  {
    value: "medium",
    label: "Médio",
    minDeviation: 10,
    color: "yellow",
  },
] as const;

// Get severity level based on deviation percentage
export function getSeverityLevel(deviationPercent: number) {
  const absDeviation = Math.abs(deviationPercent);
  for (const level of severityLevels) {
    if (absDeviation >= level.minDeviation) {
      return level;
    }
  }
  return severityLevels[severityLevels.length - 1];
}

// Get deviation type icon based on value
export function getDeviationTypeIcon(deviationPercent: number) {
  return deviationPercent > 0 ? TrendingUp : TrendingDown;
}

// Check if deviation exceeds threshold
export function isDeviationExceedsThreshold(
  deviationPercent: number,
  thresholdPercent: number,
): boolean {
  return Math.abs(deviationPercent) > thresholdPercent;
}

// Calculate deviation percentage
export function calculateDeviationPercent(
  scheduled: number,
  actual: number,
): number {
  if (scheduled <= 0) return 0;
  return ((actual - scheduled) / scheduled) * 100;
}

// Get severity color classes
export function getSeverityColorClasses(severity: string) {
  switch (severity) {
    case "critical":
      return {
        border: "border-l-red-500",
        bg: "bg-red-50 dark:bg-red-950/20",
        text: "text-red-600 dark:text-red-400",
        badge: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      };
    case "high":
      return {
        border: "border-l-orange-500",
        bg: "bg-orange-50 dark:bg-orange-950/20",
        text: "text-orange-600 dark:text-orange-400",
        badge:
          "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      };
    case "medium":
    default:
      return {
        border: "border-l-yellow-500",
        bg: "bg-yellow-50 dark:bg-yellow-950/20",
        text: "text-yellow-600 dark:text-yellow-400",
        badge:
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      };
  }
}
