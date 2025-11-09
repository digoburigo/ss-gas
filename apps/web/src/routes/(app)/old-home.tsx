import { createFileRoute } from "@tanstack/react-router";

import { ActivityHistory } from "~/components/dash/activity-history";
import { ChartAreaInteractive } from "~/components/dash/chart-area-interactive";
import { SectionCards } from "~/components/dash/section-cards";

export const Route = createFileRoute("/(app)/old-home")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Painel de informações
        </h1>
        <p className="text-muted-foreground">
          Bem-vindo ao seu painel. Aqui está uma visão geral da sua atividade.
        </p>
      </div>

      <SectionCards />

      <div className="grid gap-4 md:grid-cols-2">
        <ChartAreaInteractive />
        <ActivityHistory />
      </div>
    </div>
  );
}

