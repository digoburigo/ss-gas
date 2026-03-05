import { CalendarRange } from "lucide-react";

import { ConfigDrawer } from "~/components/config-drawer";
import { Header } from "~/components/layout/header";
import { Main } from "~/components/layout/main";
import { ProfileDropdown } from "~/components/profile-dropdown";
import { Search } from "~/components/search";
import { ThemeSwitch } from "~/components/theme-switch";

export function MonthlyScheduling() {
  return (
    <>
      <Header fixed>
        <Search />
        <div className="ml-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ProfileDropdown />
          <ConfigDrawer />
        </div>
      </Header>
      <Main>
        <div className="mb-2 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <CalendarRange className="h-6 w-6" />
              Programacao Mensal
            </h2>
            <p className="text-muted-foreground">
              Gerencie as programacoes mensais de gas.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center rounded-lg border border-dashed p-12">
          <p className="text-muted-foreground">
            Conteudo da programacao mensal sera implementado em breve.
          </p>
        </div>
      </Main>
    </>
  );
}
