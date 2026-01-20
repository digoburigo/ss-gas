import { CheckCircle, CircleDashed, Clock, Send } from "lucide-react";

export const submissionStatuses = [
  {
    value: "pending",
    label: "Pendente",
    icon: CircleDashed,
  },
  {
    value: "submitted",
    label: "Enviado",
    icon: Send,
  },
  {
    value: "approved",
    label: "Aprovado",
    icon: CheckCircle,
  },
  {
    value: "rejected",
    label: "Rejeitado",
    icon: Clock,
  },
];

export const volumeUnitOptions = [
  { value: "m3", label: "m³" },
  { value: "MMBtu", label: "MMBtu" },
];
