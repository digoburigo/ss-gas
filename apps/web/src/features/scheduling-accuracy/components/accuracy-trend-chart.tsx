import { useMemo } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { ChartConfig } from "@acme/ui/chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@acme/ui/chart";

type AccuracyDataPoint = {
  date: string;
  displayDate: string;
  accuracy: number;
  scheduled: number;
  actual: number;
  deviation: number;
  deviationPercent: number;
  withinTolerance: boolean;
};

type AccuracyTrendChartProps = {
  data: AccuracyDataPoint[];
  tolerancePercent?: number;
  isLoading?: boolean;
  period: "daily" | "weekly" | "monthly";
};

const chartConfig = {
  accuracy: {
    label: "Taxa de Acurácia (%)",
    color: "hsl(142, 71%, 45%)",
  },
  scheduled: {
    label: "Programado (m³)",
    color: "hsl(271, 81%, 56%)",
  },
  actual: {
    label: "Realizado (m³)",
    color: "hsl(38, 92%, 50%)",
  },
} satisfies ChartConfig;

export function AccuracyTrendChart({
  data,
  tolerancePercent = 10,
  isLoading = false,
  period,
}: AccuracyTrendChartProps) {
  const periodLabel = useMemo(() => {
    switch (period) {
      case "daily":
        return "Diário";
      case "weekly":
        return "Semanal";
      case "monthly":
        return "Mensal";
      default:
        return "Período";
    }
  }, [period]);

  // Calculate target accuracy based on tolerance
  const targetAccuracy = 100 - tolerancePercent;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tendência de Acurácia - {periodLabel}</CardTitle>
        <CardDescription>
          Evolução da taxa de acurácia ao longo do período selecionado
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-[350px] items-center justify-center">
            <p className="text-muted-foreground text-sm">
              Carregando gráfico...
            </p>
          </div>
        ) : data.length > 0 ? (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[350px] w-full"
          >
            <ComposedChart
              data={data}
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="displayDate"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                yAxisId="left"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 12 }}
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) =>
                  `${(value / 1000).toLocaleString("pt-BR")}k`
                }
              />
              {/* Target accuracy line */}
              <ReferenceLine
                yAxisId="left"
                y={targetAccuracy}
                stroke="hsl(142, 71%, 45%)"
                strokeDasharray="4 4"
                strokeOpacity={0.5}
              />
              <ChartTooltip
                cursor={{ strokeDasharray: "3 3" }}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      if (typeof value === "string") {
                        return value;
                      }
                      return String(value);
                    }}
                    indicator="line"
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              {/* Scheduled vs Actual bars */}
              <Bar
                yAxisId="right"
                dataKey="scheduled"
                fill="var(--color-scheduled)"
                opacity={0.6}
                radius={[4, 4, 0, 0]}
              />
              <Bar
                yAxisId="right"
                dataKey="actual"
                fill="var(--color-actual)"
                opacity={0.8}
                radius={[4, 4, 0, 0]}
              />
              {/* Accuracy line */}
              <Line
                yAxisId="left"
                dataKey="accuracy"
                type="monotone"
                stroke="var(--color-accuracy)"
                strokeWidth={3}
                dot={{ r: 4, fill: "var(--color-accuracy)" }}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          </ChartContainer>
        ) : (
          <div className="flex h-[350px] items-center justify-center">
            <p className="text-muted-foreground text-sm">
              Nenhum dado disponível para o período selecionado.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
