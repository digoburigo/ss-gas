import { Calculator, Gauge, HandMetal } from "lucide-react";

// Consumption sources - how the measurement was obtained
export const consumptionSources = [
  {
    value: "meter",
    label: "Medidor",
    icon: Gauge,
    description: "Leitura direta do medidor",
  },
  {
    value: "manual",
    label: "Manual",
    icon: HandMetal,
    description: "Entrada manual de volume",
  },
  {
    value: "calculated",
    label: "Calculado",
    icon: Calculator,
    description: "Calculado a partir de outros dados",
  },
];

export const volumeUnitOptions = [
  { value: "m3", label: "m³" },
  { value: "MMBtu", label: "MMBtu" },
];
