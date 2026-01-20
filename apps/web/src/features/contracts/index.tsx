import { ConfigDrawer } from "~/components/config-drawer";
import { Header } from "~/components/layout/header";
import { Main } from "~/components/layout/main";
import { ProfileDropdown } from "~/components/profile-dropdown";
import { Search } from "~/components/search";
import { ThemeSwitch } from "~/components/theme-switch";
import { ContractsDialogs } from "./components/contracts-dialogs";
import { ContractsPrimaryButtons } from "./components/contracts-primary-buttons";
import { ContractsProvider } from "./components/contracts-provider";
import { ContractsTable } from "./components/contracts-table";

export function Contracts() {
  return (
    <ContractsProvider>
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
              Contratos de Gás
            </h2>
            <p className="text-muted-foreground">
              Gerencie os contratos de fornecimento de gás natural da sua
              organização.
            </p>
          </div>
          <ContractsPrimaryButtons />
        </div>
        <ContractsTable />
      </Main>

      <ContractsDialogs />
    </ContractsProvider>
  );
}
