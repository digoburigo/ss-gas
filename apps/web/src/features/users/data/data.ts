import { Eye, Shield, UserCheck, UserCog, Users } from "lucide-react";

import type { UserStatus } from "./schema";

export const callTypes = new Map<UserStatus, string>([
  ["active", "bg-teal-100/30 text-teal-900 dark:text-teal-200 border-teal-200"],
  ["inactive", "bg-neutral-300/40 border-neutral-300"],
  ["invited", "bg-sky-200/40 text-sky-900 dark:text-sky-100 border-sky-300"],
  [
    "suspended",
    "bg-destructive/10 dark:bg-destructive/50 text-destructive dark:text-primary border-destructive/10",
  ],
]);

// SS-GAS User Profiles - matches GasUserProfile enum in schema
export const profiles = [
  {
    label: "Administrador",
    value: "admin",
    icon: Shield,
    description: "Acesso completo à gestão de gás da organização",
  },
  {
    label: "Gestor",
    value: "manager",
    icon: UserCheck,
    description: "Gerencia contratos, unidades e visualiza relatórios",
  },
  {
    label: "Operador",
    value: "operator",
    icon: UserCog,
    description: "Registra dados diários das unidades atribuídas",
  },
  {
    label: "Visualizador",
    value: "viewer",
    icon: Eye,
    description: "Acesso somente leitura a relatórios e dashboards",
  },
] as const;

// Legacy roles for backward compatibility
export const roles = [
  {
    label: "Proprietário",
    value: "owner",
    icon: Shield,
  },
  {
    label: "Admin",
    value: "admin",
    icon: UserCheck,
  },
  {
    label: "Membro",
    value: "member",
    icon: Users,
  },
] as const;
