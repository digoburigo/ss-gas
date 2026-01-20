import { ConfigDrawer } from "~/components/config-drawer";
import { Header } from "~/components/layout/header";
import { Main } from "~/components/layout/main";
import { ProfileDropdown } from "~/components/profile-dropdown";
import { Search } from "~/components/search";
import { ThemeSwitch } from "~/components/theme-switch";
import { DailySchedulingDialogs } from "./components/daily-scheduling-dialogs";
import { DailySchedulingPrimaryButtons } from "./components/daily-scheduling-primary-buttons";
import { DailySchedulingProvider } from "./components/daily-scheduling-provider";
import { DailySchedulingTable } from "./components/daily-scheduling-table";

export function DailyScheduling() {
  return (
    <DailySchedulingProvider>
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
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Programação Diária de Consumo
            </h2>
            <p className="text-muted-foreground">
              Registre a programação diária de volume de gás para declarar à
              distribuidora.
            </p>
          </div>
          <DailySchedulingPrimaryButtons />
        </div>
        <DailySchedulingTable />
      </Main>

      <DailySchedulingDialogs />
    </DailySchedulingProvider>
  );
}
