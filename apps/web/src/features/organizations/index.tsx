import { ConfigDrawer } from "~/components/config-drawer";
import { Header } from "~/components/layout/header";
import { Main } from "~/components/layout/main";
import { ProfileDropdown } from "~/components/profile-dropdown";
import { Search } from "~/components/search";
import { ThemeSwitch } from "~/components/theme-switch";
import { OrganizationsDialogs } from "./components/organizations-dialogs";
import { OrganizationsPrimaryButtons } from "./components/organizations-primary-buttons";
import { OrganizationsProvider } from "./components/organizations-provider";
import { OrganizationsTable } from "./components/organizations-table";

export function Organizations() {
	return (
		<OrganizationsProvider>
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
						<h2 className="text-2xl font-bold tracking-tight">Organizações</h2>
						<p className="text-muted-foreground">
							Gerencie as organizações (empresas clientes) do sistema.
						</p>
					</div>
					<OrganizationsPrimaryButtons />
				</div>
				<OrganizationsTable />
			</Main>

			<OrganizationsDialogs />
		</OrganizationsProvider>
	);
}
