"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Users, UsersRound, Package, ScrollText, LayoutDashboard, Share2, Palette, ShieldCheck, HardDriveDownload, Workflow, Server, CalendarDays, Network, ShieldQuestion, Sparkles, LifeBuoy, Boxes, Activity, Bell, ClipboardList, Cpu } from "lucide-react";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/support", label: "Support", icon: LifeBuoy },
  { href: "/admin/server", label: "Basic settings", icon: Server },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/groups", label: "Groups", icon: UsersRound },
  { href: "/admin/delegation", label: "Administration privileges", icon: ShieldQuestion },
  { href: "/admin/sharing", label: "Sharing", icon: Share2 },
  { href: "/admin/security", label: "Security", icon: ShieldCheck },
  { href: "/admin/groupware", label: "Groupware", icon: CalendarDays },
  { href: "/admin/theming", label: "Theming", icon: Palette },
  { href: "/admin/ai", label: "Artificial intelligence", icon: Sparkles },
  { href: "/admin/appapi", label: "AppAPI", icon: Boxes },
  { href: "/admin/external-storage", label: "External storage", icon: HardDriveDownload },
  { href: "/admin/ldap", label: "LDAP / AD", icon: Network },
  { href: "/admin/activity", label: "Activity", icon: Activity },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/workflow", label: "Flow", icon: Workflow },
  { href: "/admin/usage-survey", label: "Usage survey", icon: ClipboardList },
  { href: "/admin/apps", label: "Apps", icon: Package },
  { href: "/admin/logs", label: "Logging", icon: ScrollText },
  { href: "/admin/system", label: "System", icon: Cpu },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-full">
      <aside className="w-52 shrink-0 border-r p-4 space-y-1">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 pb-2">
          Administration
        </h2>
        {NAV.map(({ href, label, icon: Icon, exact }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
              (exact ? pathname === href : pathname.startsWith(href))
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
