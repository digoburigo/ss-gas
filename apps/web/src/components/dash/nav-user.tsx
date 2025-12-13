"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@acme/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@acme/ui/dropdown-menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@acme/ui/sidebar";
import { useNavigate } from "@tanstack/react-router";
import {
	Bell,
	CreditCard,
	LogOut,
	Moon,
	MoreVertical,
	Sun,
	UserCircle,
} from "lucide-react";
import { useTheme } from "next-themes";

import { authClient } from "~/clients/auth-client";

export function NavUser({
	user,
}: {
	user: {
		name: string;
		email: string;
		avatar: string;
	};
}) {
	const { isMobile } = useSidebar();
	const navigate = useNavigate();
	const { resolvedTheme, setTheme } = useTheme();

	const handleSignOut = async () => {
		await authClient.signOut();
		navigate({ href: "/auth/login" });
	};

	const getUserInitials = () => {
		if (!user.name) return "U";
		const parts = user.name.split(" ");
		return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
	};

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							size="lg"
							className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
						>
							<Avatar className="h-8 w-8 rounded-lg">
								<AvatarImage
									referrerPolicy="no-referrer"
									src={user.avatar}
									alt={user.name}
								/>
								<AvatarFallback className="rounded-lg text-xs">
									{getUserInitials()}
								</AvatarFallback>
							</Avatar>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-medium">{user.name}</span>
								<span className="text-muted-foreground truncate text-xs">
									{user.email}
								</span>
							</div>
							<MoreVertical className="ml-auto size-4" />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
						side={isMobile ? "bottom" : "right"}
						align="end"
						sideOffset={4}
					>
						<DropdownMenuLabel className="p-0 font-normal">
							<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
								<Avatar className="h-8 w-8 rounded-lg">
									<AvatarImage
										referrerPolicy="no-referrer"
										src={user.avatar}
										alt={user.name}
									/>
									<AvatarFallback className="rounded-lg text-xs">
										{getUserInitials()}
									</AvatarFallback>
								</Avatar>
								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-medium">{user.name}</span>
									<span className="text-muted-foreground truncate text-xs">
										{user.email}
									</span>
								</div>
							</div>
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuGroup>
							<DropdownMenuItem>
								<UserCircle />
								Conta
							</DropdownMenuItem>
							<DropdownMenuItem>
								<CreditCard />
								Cobrança
							</DropdownMenuItem>
							<DropdownMenuItem>
								<Bell />
								Notificações
							</DropdownMenuItem>
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							className="cursor-pointer"
							onClick={(e) => {
								e.preventDefault();
								setTheme(resolvedTheme === "dark" ? "light" : "dark");
							}}
						>
							{resolvedTheme === "dark" ? <Moon /> : <Sun />}
							<span>Alternar tema</span>
							<span className="text-muted-foreground ml-auto text-xs">
								{resolvedTheme === "dark" ? "Escuro" : "Claro"}
							</span>
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onClick={handleSignOut}
							className="text-destructive focus:text-destructive cursor-pointer"
						>
							<LogOut />
							Sair
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
