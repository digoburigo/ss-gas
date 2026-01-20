import { ConfigDrawer } from "~/components/config-drawer";
import { Header } from "~/components/layout/header";
import { Main } from "~/components/layout/main";
import { ProfileDropdown } from "~/components/profile-dropdown";
import { Search } from "~/components/search";
import { ThemeSwitch } from "~/components/theme-switch";
import { ConsumerUnitsDialogs } from "./components/consumer-units-dialogs";
import { ConsumerUnitsPrimaryButtons } from "./components/consumer-units-primary-buttons";
import { ConsumerUnitsProvider } from "./components/consumer-units-provider";
import { ConsumerUnitsTable } from "./components/consumer-units-table";

export function ConsumerUnits() {
	return (
		<ConsumerUnitsProvider>
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
							Unidades Consumidoras
						</h2>
						<p className="text-muted-foreground">
							Gerencie os pontos de medição de gás da sua organização.
						</p>
					</div>
					<ConsumerUnitsPrimaryButtons />
				</div>
				<ConsumerUnitsTable />
			</Main>

			<ConsumerUnitsDialogs />
		</ConsumerUnitsProvider>
	);
}
