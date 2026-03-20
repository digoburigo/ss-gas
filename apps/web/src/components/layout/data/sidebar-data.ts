import {
  Activity,
  AlertTriangle,
  AudioWaveform,
  Ban,
  BarChart3,
  BellRing,
  Building2,
  CalendarRange,
  ClipboardList,
  Command,
  FileSignature,
  Flame,
  GalleryVerticalEnd,
  Gauge,
  History,
  Settings,
  Shield,
  ShieldAlert,
  Target,
} from "lucide-react";

import type { SidebarData } from "../types";

export const sidebarData: SidebarData = {
  user: {
    name: "satnaing",
    email: "satnaingdev@gmail.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Shadcn Admin",
      logo: Command,
      plan: "Vite + ShadcnUI",
    },
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
  ],
  navGroups: [
    {
      title: "Geral",
      items: [
        {
          title: "Painel",
          url: "/gas",
          icon: Flame,
        },
        {
          title: "Contratos",
          url: "/gas/contracts",
          icon: FileSignature,
        },
        {
          title: "Alertas",
          url: "/gas/contract-alerts",
          icon: BellRing,
        },
        {
          title: "Unidades Consumidoras",
          url: "/gas/consumer-units",
          icon: Gauge,
        },
        {
          title: "Programação Diária",
          url: "/gas/scheduling-dashboard",
          icon: ClipboardList,
        },
        {
          title: "Programação Mensal",
          url: "/gas/monthly-scheduling",
          icon: CalendarRange,
        },
        {
          title: "Consumo Real",
          url: "/gas/actual-consumption",
          icon: Activity,
        },
        {
          title: "Taxa de Acurácia",
          url: "/gas/scheduling-accuracy",
          icon: Target,
        },
        {
          title: "Alertas de Desvio",
          url: "/gas/deviation-alerts",
          icon: AlertTriangle,
        },
        {
          title: "Penalidades",
          url: "/gas/penalties",
          icon: Ban,
        },
        {
          title: "Relatórios",
          url: "/gas/reports",
          icon: BarChart3,
        },
        {
          title: "Administração",
          url: "/gas/admin",
          icon: Settings,
        },
        {
          title: "Parâmetros Admin",
          url: "/gas/admin-parameters",
          icon: ShieldAlert,
        },
        {
          title: "Histórico de Auditoria",
          url: "/gas/audit-log",
          icon: History,
        },
      ],
    },
    {
      title: "Administração",
      items: [
        {
          title: "Admin Global",
          icon: Shield,
          items: [
            {
              title: "Organizações",
              url: "/admin/organizations",
              icon: Building2,
            },
          ],
        },
      ],
    },
  ],
};
