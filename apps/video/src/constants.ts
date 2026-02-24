export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const TOTAL_FRAMES = 4500;

export const COLORS = {
  primary: "#1e3a5f",
  primaryLight: "#2a5a8f",
  accent: "#3b82f6",
  accentGlow: "#60a5fa",
  dark: "#0f172a",
  darkGradient: "#1e293b",
  white: "#ffffff",
  gray: "#94a3b8",
  lightGray: "#e2e8f0",
  success: "#22c55e",
  warning: "#f59e0b",
  overlay: "rgba(15, 23, 42, 0.85)",
};

export const SCENES = {
  intro: { start: 0, duration: 180 },
  sidebar: { start: 180, duration: 180 },
  dashboard: { start: 360, duration: 360 },
  contracts: { start: 720, duration: 360 },
  units: { start: 1080, duration: 270 },
  scheduling: { start: 1350, duration: 540 },
  consumption: { start: 1890, duration: 540 },
  reports: { start: 2430, duration: 360 },
  admin: { start: 2790, duration: 540 },
  outro: { start: 3330, duration: 180 },
} as const;

export const SCREENSHOTS = {
  sidebar: "screenshots/00-sidebar.png",
  dashboard: "screenshots/01-dashboard.png",
  contracts: "screenshots/02-contracts.png",
  contractAlerts: "screenshots/03-contract-alerts.png",
  consumerUnits: "screenshots/04-consumer-units.png",
  scheduling: "screenshots/05-scheduling.png",
  schedulingDashboard: "screenshots/06-scheduling-dashboard.png",
  actualConsumption: "screenshots/07-actual-consumption.png",
  schedulingAccuracy: "screenshots/08-scheduling-accuracy.png",
  deviationAlerts: "screenshots/09-deviation-alerts.png",
  dailyEntry: "screenshots/10-daily-entry.png",
  reports: "screenshots/11-reports.png",
  admin: "screenshots/12-admin.png",
  adminParameters: "screenshots/13-admin-parameters.png",
  auditLog: "screenshots/14-audit-log.png",
} as const;

export const TEXTS = {
  title: "Sistema de Gestao de Gas",
  tagline: "Controle total do seu fornecimento de gas natural",
  dashboard: "Indicadores em tempo real: QDC, QDS, QDP e QDR",
  contracts: "Gerencie contratos de gas com tolerancias e vigencia",
  contractAlerts: "Alertas automaticos para vencimento e limites contratuais",
  units: "Gerencie unidades de producao e seus equipamentos",
  scheduling: "Planeje e acompanhe a programacao diaria de gas",
  schedulingDashboard: "Visao consolidada da programacao com indicadores",
  accuracy: "Acompanhe a taxa de acuracia entre programado e realizado",
  consumption: "Monitore consumo real e receba alertas de desvio",
  deviationAlerts: "Alertas automaticos quando o consumo desvia do planejado",
  dailyEntry: "Lancamento e conferencia de dados diarios",
  reports: "Relatorios mensais com graficos e exportacao",
  admin: "Administracao completa com auditoria e rastreabilidade",
  adminParameters: "Configure parametros do sistema de gas",
  auditLog: "Historico completo de alteracoes e acoes no sistema",
  outro: "Controle. Precisao. Conformidade.",
};
