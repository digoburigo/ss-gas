import { Activity, AlertTriangle, CheckCircle, TrendingUp } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";

import { getAccuracyStatus } from "../data/data";

type AccuracySummaryProps = {
  averageAccuracy: number;
  totalRecords: number;
  withinToleranceCount: number;
  outsideToleranceCount: number;
  contractTolerance?: number;
  isLoading?: boolean;
};

export function AccuracySummaryCards({
  averageAccuracy,
  totalRecords,
  withinToleranceCount,
  outsideToleranceCount,
  contractTolerance = 10,
  isLoading = false,
}: AccuracySummaryProps) {
  const accuracyStatus = getAccuracyStatus(averageAccuracy);
  const withinPercent =
    totalRecords > 0 ? (withinToleranceCount / totalRecords) * 100 : 0;

  const getAccuracyColorClasses = (status: string) => {
    switch (status) {
      case "excellent":
        return {
          border: "border-l-green-500",
          text: "text-green-600 dark:text-green-400",
          icon: "text-green-500",
        };
      case "good":
        return {
          border: "border-l-blue-500",
          text: "text-blue-600 dark:text-blue-400",
          icon: "text-blue-500",
        };
      case "acceptable":
        return {
          border: "border-l-yellow-500",
          text: "text-yellow-600 dark:text-yellow-400",
          icon: "text-yellow-500",
        };
      default:
        return {
          border: "border-l-red-500",
          text: "text-red-600 dark:text-red-400",
          icon: "text-red-500",
        };
    }
  };

  const colorClasses = getAccuracyColorClasses(accuracyStatus?.value ?? "poor");

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Average Accuracy Card */}
      <Card className={`border-l-4 ${colorClasses.border}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Taxa de Acurácia Média
          </CardTitle>
          <TrendingUp className={`h-4 w-4 ${colorClasses.icon}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${colorClasses.text}`}>
            {isLoading ? "..." : `${averageAccuracy.toFixed(1)}%`}
          </div>
          <p className="text-muted-foreground text-xs">
            {accuracyStatus?.label ?? "Sem dados"}
          </p>
        </CardContent>
      </Card>

      {/* Total Records Card */}
      <Card className="border-l-4 border-l-purple-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total de Registros
          </CardTitle>
          <Activity className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {isLoading ? "..." : totalRecords}
          </div>
          <p className="text-muted-foreground text-xs">
            Período selecionado
          </p>
        </CardContent>
      </Card>

      {/* Within Tolerance Card */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Dentro da Tolerância
          </CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {isLoading ? "..." : withinToleranceCount}
          </div>
          <p className="text-muted-foreground text-xs">
            {withinPercent.toFixed(1)}% - Tolerância ±{contractTolerance}%
          </p>
        </CardContent>
      </Card>

      {/* Outside Tolerance Card */}
      <Card className="border-l-4 border-l-amber-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Fora da Tolerância
          </CardTitle>
          <AlertTriangle className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {isLoading ? "..." : outsideToleranceCount}
          </div>
          <CardDescription>
            Requer análise de causa
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}
