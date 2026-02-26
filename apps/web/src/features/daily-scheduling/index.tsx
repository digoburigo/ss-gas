import { Link } from "@tanstack/react-router";
import { Eye } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";

import { ConfigDrawer } from "~/components/config-drawer";
import { Header } from "~/components/layout/header";
import { Main } from "~/components/layout/main";
import { ProfileDropdown } from "~/components/profile-dropdown";
import { Search } from "~/components/search";
import { ThemeSwitch } from "~/components/theme-switch";
import { DailySchedulingTable } from "./components/daily-scheduling-table";

export function DailyScheduling() {
  return (
    <>
      <Header fixed>
        <Search />
        <div className="ms-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold tracking-tight">
                  Programação Diária de Consumo
                </h2>
                <Badge variant="secondary" className="gap-1">
                  <Eye className="h-3 w-3" />
                  Somente leitura
                </Badge>
              </div>
              <p className="text-muted-foreground">
                Resumo das programações diárias. Para criar ou editar, acesse o{" "}
                <Link
                  to="/gas/scheduling-dashboard"
                  className="text-primary underline underline-offset-4 hover:opacity-80"
                >
                  Painel de Programação
                </Link>
                .
              </p>
            </div>
          </div>
          <Button variant="outline" asChild>
            <Link to="/gas/scheduling-dashboard">Ir para o Painel</Link>
          </Button>
        </div>
        <DailySchedulingTable />
      </Main>
    </>
  );
}
