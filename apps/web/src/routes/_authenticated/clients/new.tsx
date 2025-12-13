import { schema } from "@acme/zen-v3/zenstack/schema";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useClientQueries } from "@zenstackhq/tanstack-query/react";
import { toast } from "sonner";

import { authClient } from "~/clients/auth-client";
import { ClientForm } from "~/components/clients/client-form";
import { ConfigDrawer } from "~/components/config-drawer";
import { Header } from "~/components/layout/header";
import { Main } from "~/components/layout/main";
import { ProfileDropdown } from "~/components/profile-dropdown";
import { Search } from "~/components/search";
import { ThemeSwitch } from "~/components/theme-switch";

export const Route = createFileRoute("/_authenticated/clients/new")({
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = useNavigate();
	const { data: activeOrganization } = authClient.useActiveOrganization();
	const client = useClientQueries(schema);

	const { mutate: createClient, isPending } = client.client.useCreate({
		onSuccess: () => {
			toast.success("Cliente criado com sucesso");
			navigate({ to: "/clients" });
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const handleSubmit = async (data: {
		name: string;
		email: string;
		phone: string;
		status: "active" | "inactive";
	}) => {
		if (!activeOrganization?.id) {
			toast.error("Por favor, selecione uma organização");
			return;
		}

		createClient({
			data: {
				name: data.name,
				email: data.email,
				phone: data.phone,
				status: data.status,
			},
		});
	};

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
				<div>
					<h1 className="text-3xl font-bold tracking-tight">
						Criar Novo Cliente
					</h1>
					<p className="text-muted-foreground">
						Preencha os dados do cliente abaixo.
					</p>
				</div>

				<div className="bg-card rounded-lg border p-6">
					<ClientForm onSubmit={handleSubmit} isSubmitting={isPending} />
				</div>
			</Main>
		</>
	);
}
