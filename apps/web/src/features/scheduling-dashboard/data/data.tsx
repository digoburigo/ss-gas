import { AlertTriangle, CheckCircle, CircleDashed } from "lucide-react";

export const schedulingStatuses = [
  {
    value: "scheduled",
    label: "Programado",
    icon: CheckCircle,
    color: "text-green-600",
    bgColor: "bg-green-100 dark:bg-green-900/30",
  },
  {
    value: "pending",
    label: "Pendente",
    icon: CircleDashed,
    color: "text-yellow-600",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
  },
  {
    value: "late",
    label: "Atrasado",
    icon: AlertTriangle,
    color: "text-red-600",
    bgColor: "bg-red-100 dark:bg-red-900/30",
  },
];
