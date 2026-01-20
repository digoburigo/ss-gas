import {
  Building2,
  Calendar,
  ClipboardList,
  Edit,
  FileSignature,
  Flame,
  Gauge,
  Plus,
  Settings,
  Trash2,
  User,
} from "lucide-react";

// Entity types for audit logs
export const entityTypes = [
  {
    value: "contract",
    label: "Contrato",
    icon: FileSignature,
    description: "Alterações em contratos de gás",
  },
  {
    value: "unit",
    label: "Unidade",
    icon: Gauge,
    description: "Alterações em unidades consumidoras",
  },
  {
    value: "plan",
    label: "Programação",
    icon: Calendar,
    description: "Alterações em programações diárias",
  },
  {
    value: "consumption",
    label: "Consumo",
    icon: ClipboardList,
    description: "Alterações em registros de consumo",
  },
  {
    value: "parameter",
    label: "Parâmetro",
    icon: Settings,
    description: "Alterações em parâmetros do sistema",
  },
  {
    value: "template",
    label: "Template",
    icon: FileSignature,
    description: "Alterações em templates de contrato",
  },
  {
    value: "custom_field",
    label: "Campo Personalizado",
    icon: Settings,
    description: "Alterações em campos customizados",
  },
  {
    value: "alert",
    label: "Alerta",
    icon: Flame,
    description: "Alterações em configurações de alerta",
  },
  {
    value: "user",
    label: "Usuário",
    icon: User,
    description: "Alterações em usuários e permissões",
  },
  {
    value: "organization",
    label: "Organização",
    icon: Building2,
    description: "Alterações em dados da organização",
  },
] as const;

// Action types for audit logs
export const actionTypes = [
  {
    value: "create",
    label: "Criação",
    icon: Plus,
    color: "green",
    description: "Novo registro criado",
  },
  {
    value: "update",
    label: "Atualização",
    icon: Edit,
    color: "blue",
    description: "Registro atualizado",
  },
  {
    value: "delete",
    label: "Exclusão",
    icon: Trash2,
    color: "red",
    description: "Registro excluído",
  },
] as const;

// Get entity type info
export function getEntityTypeInfo(entityType: string) {
  return entityTypes.find((t) => t.value === entityType) ?? entityTypes[0];
}

// Get action type info
export function getActionTypeInfo(action: string) {
  return actionTypes.find((a) => a.value === action) ?? actionTypes[0];
}

// Get action color classes
export function getActionColorClasses(action: string) {
  switch (action) {
    case "create":
      return {
        border: "border-l-green-500",
        bg: "bg-green-50 dark:bg-green-950/20",
        text: "text-green-600 dark:text-green-400",
        badge: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      };
    case "update":
      return {
        border: "border-l-blue-500",
        bg: "bg-blue-50 dark:bg-blue-950/20",
        text: "text-blue-600 dark:text-blue-400",
        badge: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      };
    case "delete":
      return {
        border: "border-l-red-500",
        bg: "bg-red-50 dark:bg-red-950/20",
        text: "text-red-600 dark:text-red-400",
        badge: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      };
    default:
      return {
        border: "border-l-gray-500",
        bg: "bg-gray-50 dark:bg-gray-950/20",
        text: "text-gray-600 dark:text-gray-400",
        badge: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
      };
  }
}

// Format field name for display
export function formatFieldName(field: string | null): string {
  if (!field) return "-";

  // Convert camelCase/snake_case to readable format
  return field
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .trim()
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}

// Format value for display
export function formatValue(value: string | null): string {
  if (value === null || value === undefined || value === "") return "-";

  // Try to parse JSON
  try {
    const parsed = JSON.parse(value);
    if (typeof parsed === "object") {
      return JSON.stringify(parsed, null, 2);
    }
    return String(parsed);
  } catch {
    return value;
  }
}

// Check if value is JSON object
export function isJsonValue(value: string | null): boolean {
  if (!value) return false;
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === "object" && parsed !== null;
  } catch {
    return false;
  }
}

// Export format options
export const exportFormats = [
  { value: "csv", label: "CSV" },
  { value: "json", label: "JSON" },
] as const;

// Convert audit logs to CSV
export function convertToCSV(
  logs: Array<{
    id: string;
    entityType: string;
    entityId: string;
    entityName: string | null;
    action: string;
    field: string | null;
    oldValue: string | null;
    newValue: string | null;
    userName: string | null;
    userEmail: string | null;
    createdAt: string;
  }>,
): string {
  const headers = [
    "Data/Hora",
    "Usuário",
    "E-mail",
    "Tipo de Entidade",
    "Nome da Entidade",
    "Ação",
    "Campo",
    "Valor Anterior",
    "Novo Valor",
  ];

  const rows = logs.map((log) => [
    new Date(log.createdAt).toLocaleString("pt-BR"),
    log.userName ?? "-",
    log.userEmail ?? "-",
    getEntityTypeInfo(log.entityType)?.label ?? log.entityType,
    log.entityName ?? "-",
    getActionTypeInfo(log.action)?.label ?? log.action,
    formatFieldName(log.field),
    formatValue(log.oldValue),
    formatValue(log.newValue),
  ]);

  const csvContent = [headers, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");

  return csvContent;
}

// Convert audit logs to JSON for export
export function convertToJSON(
  logs: Array<{
    id: string;
    entityType: string;
    entityId: string;
    entityName: string | null;
    action: string;
    field: string | null;
    oldValue: string | null;
    newValue: string | null;
    userName: string | null;
    userEmail: string | null;
    createdAt: string;
  }>,
): string {
  return JSON.stringify(logs, null, 2);
}
