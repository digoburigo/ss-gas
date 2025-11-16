import { ConfigDrawer } from "~/components/config-drawer";
import { Header } from "~/components/layout/header";
import { Main } from "~/components/layout/main";
import { ProfileDropdown } from "~/components/profile-dropdown";
import { Search } from "~/components/search";
import { ThemeSwitch } from "~/components/theme-switch";
import { ClientsDialogs } from "./components/clients-dialogs";
import { ClientsPrimaryButtons } from "./components/clients-primary-buttons";
import { ClientsProvider } from "./components/clients-provider";
import { ClientsTable } from "./components/clients-table";

export function Clients() {
  return (
    <ClientsProvider>
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
            <h2 className="text-2xl font-bold tracking-tight">Clientes</h2>
            <p className="text-muted-foreground">Gerencie seus clientes.</p>
          </div>
          <ClientsPrimaryButtons />
        </div>
        <ClientsTable />
      </Main>

      <ClientsDialogs />
    </ClientsProvider>
  );
}
