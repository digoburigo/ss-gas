import {
  AlertTriangle,
  Bell,
  CheckCircle,
  MailCheck,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";

type DeviationAlertsSummaryProps = {
  totalAlerts: number;
  activeAlerts: number;
  overConsumptionCount: number;
  underConsumptionCount: number;
  emailsSentCount: number;
  thresholdPercent: number;
  isLoading?: boolean;
};

export function DeviationAlertsSummaryCards({
  totalAlerts,
  activeAlerts,
  overConsumptionCount,
  underConsumptionCount,
  emailsSentCount,
  thresholdPercent,
  isLoading = false,
}: DeviationAlertsSummaryProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {/* Total Alerts Card */}
      <Card className="border-l-4 border-l-purple-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Alertas</CardTitle>
          <Bell className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {isLoading ? "..." : totalAlerts}
          </div>
          <CardDescription>Período selecionado</CardDescription>
        </CardContent>
      </Card>

      {/* Active Alerts Card */}
      <Card className="border-l-4 border-l-red-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Alertas Ativos</CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {isLoading ? "..." : activeAlerts}
          </div>
          <CardDescription>Desvio {">"} ±{thresholdPercent}%</CardDescription>
        </CardContent>
      </Card>

      {/* Over Consumption Card */}
      <Card className="border-l-4 border-l-orange-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Consumo Acima</CardTitle>
          <TrendingUp className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {isLoading ? "..." : overConsumptionCount}
          </div>
          <CardDescription>Acima do programado</CardDescription>
        </CardContent>
      </Card>

      {/* Under Consumption Card */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Consumo Abaixo</CardTitle>
          <TrendingDown className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {isLoading ? "..." : underConsumptionCount}
          </div>
          <CardDescription>Abaixo do programado</CardDescription>
        </CardContent>
      </Card>

      {/* Emails Sent Card */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">E-mails Enviados</CardTitle>
          <MailCheck className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {isLoading ? "..." : emailsSentCount}
          </div>
          <CardDescription>Alertas notificados</CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}
