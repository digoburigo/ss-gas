export const eventTypeOptions = [
  {
    value: "contract_expiration",
    label: "Vencimento do Contrato",
    description: "Data de encerramento do contrato",
  },
  {
    value: "renewal_deadline",
    label: "Prazo de Renovação",
    description: "Data limite para renovação do contrato",
  },
  {
    value: "daily_scheduling",
    label: "Programação Diária",
    description: "Prazo diário para programação de consumo",
  },
  {
    value: "monthly_declaration",
    label: "Declaração Mensal",
    description: "Prazo mensal para declaração de consumo",
  },
  {
    value: "adjustment_date",
    label: "Reajuste de Preço",
    description: "Data de reajuste prevista no contrato",
  },
  {
    value: "take_or_pay_expiration",
    label: "Vencimento Take-or-Pay",
    description: "Expiração do crédito de take-or-pay",
  },
  {
    value: "make_up_gas_expiration",
    label: "Vencimento Make-Up Gas",
    description: "Expiração do crédito de make-up gas",
  },
  {
    value: "custom",
    label: "Personalizado",
    description: "Evento personalizado definido pelo usuário",
  },
];

export const recurrenceOptions = [
  {
    value: "once",
    label: "Uma vez",
    description: "Alerta único, não recorrente",
  },
  {
    value: "daily",
    label: "Diário",
    description: "Repete todos os dias",
  },
  {
    value: "weekly",
    label: "Semanal",
    description: "Repete toda semana",
  },
  {
    value: "monthly",
    label: "Mensal",
    description: "Repete todo mês",
  },
  {
    value: "yearly",
    label: "Anual",
    description: "Repete todo ano",
  },
];

export const statusOptions = [
  { value: "active", label: "Ativo" },
  { value: "inactive", label: "Inativo" },
];

export const defaultAdvanceNoticeDays = [30, 15, 7, 1];
