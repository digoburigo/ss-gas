import { ConfigDrawer } from "~/components/config-drawer";
import { Header } from "~/components/layout/header";
import { Main } from "~/components/layout/main";
import { ProfileDropdown } from "~/components/profile-dropdown";
import { Search } from "~/components/search";
import { ThemeSwitch } from "~/components/theme-switch";
import { ActualConsumptionDialogs } from "./components/actual-consumption-dialogs";
import { ActualConsumptionPrimaryButtons } from "./components/actual-consumption-primary-buttons";
import { ActualConsumptionProvider } from "./components/actual-consumption-provider";
import { ActualConsumptionTable } from "./components/actual-consumption-table";

export function ActualConsumption() {
  return (
    <ActualConsumptionProvider>
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
              Consumo Real (QDR)
            </h2>
            <p className="text-muted-foreground">
              Registre o consumo real medido e compare com a programação para
              calcular desvios.
            </p>
          </div>
          <ActualConsumptionPrimaryButtons />
        </div>
        <ActualConsumptionTable />
      </Main>

      <ActualConsumptionDialogs />
    </ActualConsumptionProvider>
  );
}
