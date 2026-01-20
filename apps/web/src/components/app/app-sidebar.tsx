import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@acme/ui/collapsible";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
} from "@acme/ui/sidebar";
import { Link, useRouterState } from "@tanstack/react-router";
import {
	ChevronRight,
	Flame,
	LayoutDashboardIcon,
	Package,
} from "lucide-react";

import { authClient } from "~/clients/auth-client";
import { OrganizationSwitcher } from "./organization-switcher";
import { UserMenu } from "./user-menu";

const menuItems = [
	{
		title: "Dashboard",
		url: "/",
		icon: LayoutDashboardIcon,
	},
	{
		title: "Produtos",
		url: "/products",
		icon: Package,
	},
];

const gasMenuItems = [
	{
		title: "Painel",
		url: "/gas",
	},
	{
		title: "Lançamento Diário",
		url: "/gas/entry",
	},
	{
		title: "Relatórios",
		url: "/gas/reports",
	},
	{
		title: "Administração",
		url: "/gas/admin",
	},
];

export function AppSidebar() {
	const router = useRouterState();
	const { data: session } = authClient.useSession();
	const currentPath = router.location.pathname;

	return (
		<Sidebar>
			<SidebarHeader className="border-b p-4">
				{session?.user && <OrganizationSwitcher />}
			</SidebarHeader>

			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Navigation</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{menuItems.map((item) => {
								const isActive =
									item.url === "/"
										? currentPath === "/"
										: currentPath.startsWith(item.url);

								return (
									<SidebarMenuItem key={item.url}>
										<SidebarMenuButton asChild isActive={isActive}>
											<Link
												to={item.url}
												className="flex items-center gap-2"
												activeOptions={
													item.url === "/" ? { exact: true } : undefined
												}
											>
												<item.icon className="size-4" />
												<span>{item.title}</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
								);
							})}

							{/* Gas Menu with Collapsible Sub-items */}
							<Collapsible
								asChild
								defaultOpen={currentPath.startsWith("/gas")}
								className="group/collapsible"
							>
								<SidebarMenuItem>
									<CollapsibleTrigger asChild>
										<SidebarMenuButton
											isActive={currentPath.startsWith("/gas")}
											tooltip="Gás"
										>
											<Flame className="size-4" />
											<span>Gás</span>
											<ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
										</SidebarMenuButton>
									</CollapsibleTrigger>
									<CollapsibleContent>
										<SidebarMenuSub>
											{gasMenuItems.map((item) => {
												const isSubActive = currentPath === item.url;
												return (
													<SidebarMenuSubItem key={item.url}>
														<SidebarMenuSubButton
															asChild
															isActive={isSubActive}
														>
															<Link to={item.url}>
																<span>{item.title}</span>
															</Link>
														</SidebarMenuSubButton>
													</SidebarMenuSubItem>
												);
											})}
										</SidebarMenuSub>
									</CollapsibleContent>
								</SidebarMenuItem>
							</Collapsible>
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter className="border-t p-2">
				{session?.user && <UserMenu user={session.user} />}
			</SidebarFooter>
		</Sidebar>
	);
}
