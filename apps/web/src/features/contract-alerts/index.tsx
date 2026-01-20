import { ConfigDrawer } from "~/components/config-drawer";
import { Header } from "~/components/layout/header";
import { Main } from "~/components/layout/main";
import { ProfileDropdown } from "~/components/profile-dropdown";
import { Search } from "~/components/search";
import { ThemeSwitch } from "~/components/theme-switch";
import { ContractAlertsDialogs } from "./components/contract-alerts-dialogs";
import { ContractAlertsPrimaryButtons } from "./components/contract-alerts-primary-buttons";
import { ContractAlertsProvider } from "./components/contract-alerts-provider";
import { ContractAlertsTable } from "./components/contract-alerts-table";

export function ContractAlerts() {
  return (
    <ContractAlertsProvider>
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
              Alertas de Contratos
            </h2>
            <p className="text-muted-foreground">
              Configure alertas para datas importantes dos contratos de gás.
            </p>
          </div>
          <ContractAlertsPrimaryButtons />
        </div>
        <ContractAlertsTable />
      </Main>

      <ContractAlertsDialogs />
    </ContractAlertsProvider>
  );
}
