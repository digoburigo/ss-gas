import { ConfigDrawer } from "~/components/config-drawer";
import { Header } from "~/components/layout/header";
import { Main } from "~/components/layout/main";
import { ProfileDropdown } from "~/components/profile-dropdown";
import { Search } from "~/components/search";
import { ThemeSwitch } from "~/components/theme-switch";
import { SchedulingDashboardDatePicker } from "./components/scheduling-dashboard-date-picker";
import { SchedulingDashboardProvider } from "./components/scheduling-dashboard-provider";
import { SchedulingDashboardTable } from "./components/scheduling-dashboard-table";

export function SchedulingDashboard() {
  return (
    <SchedulingDashboardProvider>
      <Header fixed>
        <Search />
        <div className="ms-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Painel de Programação Diária
            </h2>
            <p className="text-muted-foreground">
              Visualize o status de programação de todas as unidades.
            </p>
          </div>
          <SchedulingDashboardDatePicker />
        </div>
        <SchedulingDashboardTable />
      </Main>
    </SchedulingDashboardProvider>
  );
}
