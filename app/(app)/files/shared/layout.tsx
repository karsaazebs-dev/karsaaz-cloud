"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/files/shared", label: "With you", exact: true },
  { href: "/files/shared/others", label: "With others" },
  { href: "/files/shared/links", label: "By link" },
  { href: "/files/shared/pending", label: "Pending" },
  { href: "/files/shared/deleted", label: "Deleted" },
];

export default function SharedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">
      <nav className="flex gap-1 px-6 pt-4 border-b overflow-x-auto">
        {TABS.map((tab) => {
          const active = tab.exact ? pathname === tab.href : pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "px-3 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors",
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
      <div className="flex-1 overflow-auto p-6">{children}</div>
    </div>
  );
}
