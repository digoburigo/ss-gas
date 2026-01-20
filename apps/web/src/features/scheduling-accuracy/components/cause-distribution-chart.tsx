import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";

import { deviationCauses } from "../data/data";

type CauseDistributionData = {
  cause: string;
  count: number;
};

type CauseDistributionChartProps = {
  data: CauseDistributionData[];
  isLoading?: boolean;
};

const COLORS = [
  "hsl(221, 83%, 53%)", // blue
  "hsl(271, 81%, 56%)", // purple
  "hsl(38, 92%, 50%)", // amber
  "hsl(142, 71%, 45%)", // green
  "hsl(0, 84%, 60%)", // red
  "hsl(199, 89%, 48%)", // cyan
  "hsl(47, 92%, 50%)", // yellow
  "hsl(262, 83%, 58%)", // violet
];

export function CauseDistributionChart({
  data,
  isLoading = false,
}: CauseDistributionChartProps) {
  const chartData = useMemo(() => {
    return data.map((item) => {
      const causeInfo = deviationCauses.find((c) => c.value === item.cause);
      return {
        name: causeInfo?.label || item.cause,
        value: item.count,
        cause: item.cause,
      };
    });
  }, [data]);

  const total = useMemo(
    () => chartData.reduce((sum, item) => sum + item.value, 0),
    [chartData],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribuição de Causas</CardTitle>
        <CardDescription>
          Análise das principais causas de desvio registradas
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-[300px] items-center justify-center">
            <p className="text-muted-foreground text-sm">
              Carregando gráfico...
            </p>
          </div>
        ) : chartData.length > 0 ? (
          <div className="flex items-center gap-8">
            <div className="h-[300px] w-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${entry.cause}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => {
                      const numValue = typeof value === "number" ? value : 0;
                      return [
                        `${numValue} (${((numValue / total) * 100).toFixed(1)}%)`,
                        String(name),
                      ];
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1">
              <div className="grid gap-2">
                {chartData.map((item, index) => {
                  const causeInfo = deviationCauses.find(
                    (c) => c.value === item.cause,
                  );
                  const Icon = causeInfo?.icon;
                  const percent = ((item.value / total) * 100).toFixed(1);

                  return (
                    <div
                      key={item.cause}
                      className="flex items-center justify-between rounded-md p-2 hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                        {Icon && (
                          <Icon className="text-muted-foreground h-4 w-4" />
                        )}
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                      <div className="text-muted-foreground text-sm">
                        {item.value} ({percent}%)
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-[300px] items-center justify-center">
            <p className="text-muted-foreground text-sm">
              Nenhuma causa registrada para o período selecionado.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
