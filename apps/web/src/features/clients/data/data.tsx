import { CheckCircle2, XCircle } from "lucide-react";

export const statusOptions = [
  {
    label: "Ativo",
    value: "active" as const,
    icon: CheckCircle2,
  },
  {
    label: "Inativo",
    value: "inactive" as const,
    icon: XCircle,
  },
];
