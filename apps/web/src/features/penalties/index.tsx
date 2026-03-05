import { ConfigDrawer } from "~/components/config-drawer";
import { Header } from "~/components/layout/header";
import { Main } from "~/components/layout/main";
import { ProfileDropdown } from "~/components/profile-dropdown";
import { Search } from "~/components/search";
import { ThemeSwitch } from "~/components/theme-switch";

export function Penalties() {
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
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Penalidades</h2>
            <p className="text-muted-foreground">
              Acompanhe os cálculos de penalidades diárias e mensais por desvios
              de programação.
            </p>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed p-8">
          <div className="text-center">
            <p className="text-muted-foreground text-sm">
              Os cálculos de penalidades serão exibidos aqui.
            </p>
          </div>
        </div>
      </Main>
    </>
  );
}
