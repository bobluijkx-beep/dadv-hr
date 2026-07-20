"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/auth/session";

type NavItem = {
  href: string;
  label: string;
  roles: UserRole[];
};

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", roles: ["admin", "hr", "manager", "employee"] },
  { href: "/medewerkers", label: "Medewerkers", roles: ["admin", "hr", "manager"] },
  { href: "/mijn-gegevens", label: "Mijn gegevens", roles: ["admin", "hr", "manager", "employee"] },
];

export function AppNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-secondary text-secondary-foreground"
                : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
