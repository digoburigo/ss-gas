import {
  AlertTriangle,
  Bell,
  Calculator,
  ClipboardList,
  FileText,
  Settings2,
} from "lucide-react";

// Parameter categories
export const parameterCategories = [
  {
    value: "alert_thresholds",
    label: "Limites de Alerta",
    description: "Configure limites de desvio e antecedência de notificações",
    icon: Bell,
  },
  {
    value: "penalty_formulas",
    label: "Fórmulas de Penalidade",
    description: "Configure fórmulas de cálculo de multas e penalidades",
    icon: Calculator,
  },
  {
    value: "business_rules",
    label: "Regras de Negócio",
    description: "Configure regras específicas por tipo de contrato",
    icon: ClipboardList,
  },
  {
    value: "contract_templates",
    label: "Templates de Contrato",
    description: "Gerencie templates com valores padrão para contratos",
    icon: FileText,
  },
  {
    value: "custom_fields",
    label: "Campos Personalizados",
    description: "Configure campos adicionais para contratos e unidades",
    icon: Settings2,
  },
] as const;

// Contract types for business rules
export const contractTypes = [
  { value: "industrial", label: "Industrial" },
  { value: "commercial", label: "Comercial" },
  { value: "residential", label: "Residencial" },
  { value: "cogeneration", label: "Cogeração" },
  { value: "thermal", label: "Termelétrica" },
] as const;

// Default alert threshold parameters
export const defaultAlertThresholds = [
  {
    key: "deviation_threshold_percent",
    name: "Limiar de Desvio (%)",
    description: "Percentual de desvio entre consumo programado e real que dispara alerta",
    valueType: "percentage",
    defaultValue: "10",
    minValue: 1,
    maxValue: 100,
  },
  {
    key: "contract_expiration_notice_days",
    name: "Aviso de Vencimento (dias)",
    description: "Dias de antecedência para alertar sobre vencimento de contrato",
    valueType: "number",
    defaultValue: "30",
    minValue: 1,
    maxValue: 365,
  },
  {
    key: "renewal_notice_days",
    name: "Aviso de Renovação (dias)",
    description: "Dias de antecedência para alertar sobre renovação de contrato",
    valueType: "number",
    defaultValue: "60",
    minValue: 1,
    maxValue: 365,
  },
  {
    key: "scheduling_deadline_hours",
    name: "Prazo de Programação (horas)",
    description: "Horas antes do deadline para alertar sobre programação pendente",
    valueType: "number",
    defaultValue: "2",
    minValue: 1,
    maxValue: 24,
  },
  {
    key: "take_or_pay_warning_percent",
    name: "Alerta Take-or-Pay (%)",
    description: "Percentual do take-or-pay para iniciar alertas de consumo baixo",
    valueType: "percentage",
    defaultValue: "85",
    minValue: 50,
    maxValue: 100,
  },
] as const;

// Default penalty formula parameters
export const defaultPenaltyFormulas = [
  {
    key: "take_or_pay_penalty_percent",
    name: "Multa Take-or-Pay (%)",
    description: "Percentual de multa sobre o valor não consumido do take-or-pay",
    valueType: "percentage",
    defaultValue: "100",
    minValue: 0,
    maxValue: 200,
  },
  {
    key: "over_consumption_penalty_percent",
    name: "Multa por Excesso (%)",
    description: "Percentual de multa sobre consumo acima da flexibilidade",
    valueType: "percentage",
    defaultValue: "150",
    minValue: 100,
    maxValue: 300,
  },
  {
    key: "late_payment_interest_monthly",
    name: "Juros de Mora Mensal (%)",
    description: "Percentual de juros mensais para pagamentos em atraso",
    valueType: "percentage",
    defaultValue: "1",
    minValue: 0,
    maxValue: 10,
  },
  {
    key: "late_payment_fine_percent",
    name: "Multa por Atraso (%)",
    description: "Percentual de multa fixa por pagamento em atraso",
    valueType: "percentage",
    defaultValue: "2",
    minValue: 0,
    maxValue: 20,
  },
  {
    key: "imbalance_penalty_formula",
    name: "Fórmula de Desequilíbrio",
    description: "Fórmula para cálculo de penalidade por desequilíbrio de consumo",
    valueType: "formula",
    defaultValue: "(deviation * base_price * 1.5)",
  },
] as const;

// Default business rules parameters
export const defaultBusinessRules = [
  {
    key: "scheduling_required",
    name: "Programação Obrigatória",
    description: "Se a programação diária é obrigatória para este tipo de contrato",
    valueType: "boolean",
    defaultValue: "true",
  },
  {
    key: "auto_approve_scheduling",
    name: "Aprovação Automática",
    description: "Se a programação é aprovada automaticamente (sem revisão)",
    valueType: "boolean",
    defaultValue: "false",
  },
  {
    key: "allow_retroactive_entry",
    name: "Permite Lançamento Retroativo",
    description: "Se permite lançar consumo em datas passadas",
    valueType: "boolean",
    defaultValue: "true",
  },
  {
    key: "max_retroactive_days",
    name: "Máx. Dias Retroativos",
    description: "Número máximo de dias no passado para lançamento retroativo",
    valueType: "number",
    defaultValue: "7",
    minValue: 0,
    maxValue: 30,
  },
  {
    key: "flexibility_calculation_method",
    name: "Método de Cálculo de Flexibilidade",
    description: "Como calcular a flexibilidade: diário, semanal ou mensal",
    valueType: "string",
    defaultValue: "daily",
  },
] as const;

// Custom field types
export const customFieldTypes = [
  { value: "text", label: "Texto" },
  { value: "number", label: "Número" },
  { value: "date", label: "Data" },
  { value: "select", label: "Seleção" },
  { value: "boolean", label: "Sim/Não" },
] as const;

// Entity types for custom fields
export const entityTypes = [
  { value: "contract", label: "Contrato" },
  { value: "unit", label: "Unidade Consumidora" },
] as const;

// Helper to format parameter value for display
export function formatParameterValue(
  value: string,
  valueType: string,
): string {
  switch (valueType) {
    case "percentage":
      return `${value}%`;
    case "number":
      return value;
    case "boolean":
      return value === "true" ? "Sim" : "Não";
    case "formula":
      return value;
    default:
      return value;
  }
}

// Helper to get category icon
export function getCategoryIcon(category: string) {
  const found = parameterCategories.find((c) => c.value === category);
  return found?.icon ?? AlertTriangle;
}

// Helper to get category label
export function getCategoryLabel(category: string): string {
  const found = parameterCategories.find((c) => c.value === category);
  return found?.label ?? category;
}
