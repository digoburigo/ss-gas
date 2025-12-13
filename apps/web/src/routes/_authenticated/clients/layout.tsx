import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/clients")({
	component: RouteComponent,
});

function RouteComponent() {
	return <Outlet />;
}
