import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/gas")({
	component: RouteComponent,
});

function RouteComponent() {
	return <Outlet />;
}
