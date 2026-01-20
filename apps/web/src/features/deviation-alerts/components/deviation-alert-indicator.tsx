import { AlertTriangle, Bell, CheckCircle } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";

import { getSeverityColorClasses, getSeverityLevel } from "../data/data";

type DeviationAlertIndicatorProps = {
  activeAlertsCount: number;
  latestAlert?: {
    unitName: string;
    deviationPercent: number;
    date: string;
  };
  isLoading?: boolean;
};

export function DeviationAlertIndicator({
  activeAlertsCount,
  latestAlert,
  isLoading = false,
}: DeviationAlertIndicatorProps) {
  const hasAlerts = activeAlertsCount > 0;

  if (isLoading) {
    return (
      <Card className="border-l-4 border-l-gray-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Alertas de Desvio
          </CardTitle>
          <Bell className="h-4 w-4 text-gray-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-400">...</div>
          <CardDescription>Carregando...</CardDescription>
        </CardContent>
      </Card>
    );
  }

  if (!hasAlerts) {
    return (
      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Alertas de Desvio
          </CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            0
          </div>
          <CardDescription>Nenhum alerta ativo</CardDescription>
        </CardContent>
      </Card>
    );
  }

  const severity = latestAlert
    ? getSeverityLevel(latestAlert.deviationPercent)
    : getSeverityLevel(15);
  const colorClasses = getSeverityColorClasses(severity?.value ?? "medium");

  return (
    <Card className={`border-l-4 ${colorClasses.border}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          Alertas de Desvio
          <Badge variant="destructive" className="animate-pulse">
            {activeAlertsCount}
          </Badge>
        </CardTitle>
        <AlertTriangle className={`h-4 w-4 ${colorClasses.text}`} />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className={`text-2xl font-bold ${colorClasses.text}`}>
          {activeAlertsCount} {activeAlertsCount === 1 ? "alerta" : "alertas"}
        </div>
        {latestAlert && (
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs">Mais recente:</p>
            <p className="text-sm font-medium">
              {latestAlert.unitName}:{" "}
              <span className={colorClasses.text}>
                {latestAlert.deviationPercent > 0 ? "+" : ""}
                {latestAlert.deviationPercent.toFixed(1)}%
              </span>
            </p>
            <p className="text-muted-foreground text-xs">
              {new Date(latestAlert.date).toLocaleDateString("pt-BR", {
                timeZone: "UTC",
              })}
            </p>
          </div>
        )}
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link to="/gas/deviation-alerts">Ver Alertas</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
