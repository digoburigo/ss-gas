import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@acme/ui/breadcrumb";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@acme/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
	Activity,
	Calculator,
	FileText,
	Gauge,
} from "lucide-react";
import { useMemo } from "react";
import { api } from "~/clients/api-client";
import { ConfigDrawer } from "~/components/config-drawer";
import { Header } from "~/components/layout/header";
import { Main } from "~/components/layout/main";
import { ProfileDropdown } from "~/components/profile-dropdown";
import { Search } from "~/components/search";
import { ThemeSwitch } from "~/components/theme-switch";

/**
 * Format a number with thousand separators and unit
 */
function formatValue(value: number | undefined | null, unit = "m³"): string {
	if (value === undefined || value === null) {
		return "-";
	}
	return `${value.toLocaleString("pt-BR")} ${unit}`;
}

/**
 * Get current month in YYYY-MM format
 */
function getCurrentMonth(): string {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, "0");
	return `${year}-${month}`;
}

export function GasDashboard() {
	const currentMonth = useMemo(() => getCurrentMonth(), []);

	const { data, isLoading, error } = useQuery({
		queryKey: ["gas", "consolidated", currentMonth],
		queryFn: async () => {
			const response = await api.gas.consolidated.get({
				query: { month: currentMonth },
			});
			if (response.error) {
				const errorObj = response.error as { error?: string };
				throw new Error(errorObj.error ?? "Failed to fetch consolidated data");
			}
			return response.data;
		},
	});

	// Calculate monthly totals from daily summaries
	const monthlyTotals = useMemo(() => {
		if (!data?.dailySummaries || data.dailySummaries.length === 0) {
			return {
				qdc: data?.contract?.qdcContracted ?? null,
				qds: null,
				qdp: null,
				qdr: null,
			};
		}

		// Sum up all daily values for the month
		const totals = data.dailySummaries.reduce(
			(acc, day) => ({
				qds: acc.qds + day.qdsTotal,
				qdp: acc.qdp + day.qdpTotal,
				qdr: acc.qdr + day.qdrTotal,
			}),
			{ qds: 0, qdp: 0, qdr: 0 },
		);

		return {
			qdc: data.contract?.qdcContracted ?? null,
			qds: totals.qds > 0 ? totals.qds : null,
			qdp: totals.qdp > 0 ? totals.qdp : null,
			qdr: totals.qdr > 0 ? totals.qdr : null,
		};
	}, [data]);

	return (
		<>
			<Header fixed>
				<Breadcrumb>
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink asChild>
								<Link to="/">Home</Link>
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage>Gas</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>
				<div className="ms-auto flex items-center space-x-4">
					<Search />
					<ThemeSwitch />
					<ConfigDrawer />
					<ProfileDropdown />
				</div>
			</Header>

			<Main className="flex flex-1 flex-col gap-4 sm:gap-6">
				<div className="flex flex-wrap items-end justify-between gap-2">
					<div>
						<h2 className="text-2xl font-bold tracking-tight">
							Controle de Gás
						</h2>
						<p className="text-muted-foreground">
							Gerencie o consumo de gás das unidades.
						</p>
					</div>
				</div>

				{/* Summary Cards - QDC, QDS, QDP, QDR */}
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					{/* QDC Card - Contracted Daily Quantity */}
					<Card className="border-l-4 border-l-blue-500">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								QDC - Contratado
							</CardTitle>
							<FileText className="h-4 w-4 text-blue-500" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{isLoading
									? "Carregando..."
									: formatValue(monthlyTotals.qdc)}
							</div>
							<p className="text-muted-foreground text-xs">
								Quantidade Diária Contratada
							</p>
						</CardContent>
					</Card>

					{/* QDS Card - Calculated/Forecasted Consumption */}
					<Card className="border-l-4 border-l-amber-500">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								QDS - Previsto
							</CardTitle>
							<Calculator className="h-4 w-4 text-amber-500" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{isLoading
									? "Carregando..."
									: formatValue(monthlyTotals.qds)}
							</div>
							<p className="text-muted-foreground text-xs">
								Consumo Calculado/Previsto
							</p>
						</CardContent>
					</Card>

					{/* QDP Card - Programmed Quantity */}
					<Card className="border-l-4 border-l-purple-500">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								QDP - Programado
							</CardTitle>
							<Gauge className="h-4 w-4 text-purple-500" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{isLoading
									? "Carregando..."
									: formatValue(monthlyTotals.qdp)}
							</div>
							<p className="text-muted-foreground text-xs">
								Quantidade Diária Programada
							</p>
						</CardContent>
					</Card>

					{/* QDR Card - Real Consumption */}
					<Card className="border-l-4 border-l-green-500">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								QDR - Real
							</CardTitle>
							<Activity className="h-4 w-4 text-green-500" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{isLoading
									? "Carregando..."
									: formatValue(monthlyTotals.qdr)}
							</div>
							<p className="text-muted-foreground text-xs">
								Consumo Real dos Medidores
							</p>
						</CardContent>
					</Card>
				</div>

				{/* Error display */}
				{error ? (
					<Card className="border-destructive">
						<CardContent className="pt-6">
							<p className="text-destructive text-sm">
								Erro ao carregar dados: {error.message}
							</p>
						</CardContent>
					</Card>
				) : null}

				{/* Units Section */}
				<Card>
					<CardHeader>
						<CardTitle>Unidades</CardTitle>
						<CardDescription>
							Selecione uma unidade para gerenciar os lançamentos diários.
						</CardDescription>
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<p className="text-muted-foreground text-sm">
								Carregando unidades...
							</p>
						) : data?.units && data.units.length > 0 ? (
							<div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
								{data.units.map((unit) => (
									<Card key={unit.id} className="cursor-pointer hover:bg-accent">
										<CardContent className="p-4">
											<div className="font-medium">{unit.name}</div>
											<div className="text-muted-foreground text-sm">
												Código: {unit.code}
											</div>
										</CardContent>
									</Card>
								))}
							</div>
						) : (
							<p className="text-muted-foreground text-sm">
								Nenhuma unidade encontrada.
							</p>
						)}
					</CardContent>
				</Card>
			</Main>
		</>
	);
}
