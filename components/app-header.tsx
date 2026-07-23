"use client";

import { usePathname } from "next/navigation";
import { ChevronDown, LogOut } from "lucide-react";
import { NAV_ITEMS } from "@/components/app-nav";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

function useSectionTitle() {
  const pathname = usePathname();
  const match = [...NAV_ITEMS].sort((a, b) => b.href.length - a.href.length).find((item) =>
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href),
  );
  return match?.label ?? "HR Portal";
}

export function AppHeader({
  displayName,
  roleLabel,
  onLogout,
}: {
  displayName: string;
  roleLabel: string;
  onLogout: () => Promise<void>;
}) {
  const title = useSectionTitle();

  return (
    <header className="flex h-16 flex-none items-center justify-between border-b bg-card px-8">
      <h1 className="text-xl font-semibold">{title}</h1>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-full px-2 py-1.5 text-sm font-medium outline-none hover:bg-muted">
          {displayName}
          <ChevronDown className="size-4 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuLabel>{roleLabel}</DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onLogout()}>
            <LogOut className="size-4" />
            Uitloggen
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
