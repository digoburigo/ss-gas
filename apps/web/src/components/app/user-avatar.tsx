import { ExitIcon, MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { useNavigate } from "@tanstack/react-router";
import { useTheme } from "next-themes";

import type { Session } from "@acme/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@acme/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@acme/ui/dropdown-menu";

import { authClient } from "~/clients/auth-client";

export function UserAvatar({
  user,
}: Readonly<{
  user: Session["user"];
}>) {
  const { resolvedTheme, setTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="h-8.5 w-8.5 cursor-pointer">
          <AvatarImage referrerPolicy="no-referrer" src={user.image ?? ""} />
          <AvatarFallback className="text-sm">
            {(user.name?.split(" ")[0]?.[0] || "") +
              (user.name?.split(" ")[1]?.[0] || "")}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <div className="flex max-w-full flex-col p-2 break-words whitespace-break-spaces">
          <span className="line-clamp-2 text-sm font-bold">{user.name}</span>
          <span className="mt-1 line-clamp-2 text-xs italic">{user.email}</span>
        </div>

        <hr className="mb-2" />
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={(e) => {
            e.preventDefault();
            setTheme(resolvedTheme === "dark" ? "light" : "dark");
          }}
        >
          {resolvedTheme === "dark" ? <MoonIcon /> : <SunIcon />}
          <span className="ml-[5px] capitalize">Theme</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={async () => {
            await authClient.signOut();
            navigate({ href: "/auth/login" });
          }}
          className="cursor-pointer"
        >
          <ExitIcon className="mr-[5px] ml-[0.5px] w-5" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
