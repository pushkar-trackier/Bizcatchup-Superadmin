"use client";

import { LogOut, PanelLeft } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth/auth-context";
import { useSidebar } from "./sidebar-context";

export function AppTopbar() {
  const { toggle } = useSidebar();
  const { session, logout } = useAuth();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-navy px-4 text-navy-foreground">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggle}
        className="text-navy-foreground hover:bg-white/10 hover:text-navy-foreground"
      >
        <PanelLeft className="size-5" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-3 rounded-md px-2 py-1 hover:bg-white/10">
          <Avatar className="size-8">
            <AvatarFallback className="bg-white/15 text-navy-foreground">
              {(session?.name ?? "S A")
                .split(" ")
                .map((p) => p[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="hidden text-left text-sm leading-tight sm:block">
            <div className="font-medium">{session?.name ?? "Super Admin"}</div>
            <div className="text-navy-foreground/70">{session?.role ?? "Administrator"}</div>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem disabled className="text-muted-foreground">
            {session?.email ?? "admin@bizcatchup.com"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout} variant="destructive">
            <LogOut className="size-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
