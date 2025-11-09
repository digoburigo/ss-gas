import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboardIcon, ListTodoIcon, Package } from "lucide-react";

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
} from "@acme/ui/sidebar";

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
    title: "Todos",
    url: "/todos",
    icon: ListTodoIcon,
  },
  {
    title: "Produtos",
    url: "/products",
    icon: Package,
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
