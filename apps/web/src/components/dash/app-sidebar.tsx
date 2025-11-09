"use client";

import * as React from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { BarChart3, LayoutDashboard, ListTodo, Sparkles } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@acme/ui/sidebar";

import { authClient } from "~/clients/auth-client";
import { OrganizationSwitcher } from "~/components/app/organization-switcher";
import { NavMain } from "~/components/dash/nav-main";
import { NavUser } from "~/components/dash/nav-user";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouterState();
  const { data: session } = authClient.useSession();
  const currentPath = router.location.pathname;

  const navMain = [
    {
      title: "Painel de informações",
      url: "/",
      icon: LayoutDashboard,
    },
    {
      title: "Tarefas",
      url: "/todos",
      icon: ListTodo,
    },
    {
      title: "Produtos",
      url: "/products",
      icon: BarChart3,
    },
  ];

  const user = session?.user
    ? {
        name: session.user.name ?? "User",
        email: session.user.email ?? "",
        avatar: session.user.image ?? "",
      }
    : {
        name: "User",
        email: "",
        avatar: "",
      };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="border-b p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link to="/">
                <Sparkles className="size-5" />
                <span className="text-base font-semibold">ERP</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {session?.user && <OrganizationSwitcher />}
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} currentPath={currentPath} />
      </SidebarContent>
      <SidebarFooter>{session?.user && <NavUser user={user} />}</SidebarFooter>
    </Sidebar>
  );
}
