"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/stores/ui.store";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  FolderOpen,
  FolderLock,
  Clock,
  Star,
  Share2,
  Trash2,
  Tag,
  Image,
  Activity,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
} from "lucide-react";
import { useSession } from "next-auth/react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

const mainNavItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/files", label: "Files", icon: FolderOpen },
  { href: "/files/personal", label: "Personal files", icon: FolderLock },
  { href: "/files/recent", label: "Recent", icon: Clock },
  { href: "/favorites", label: "Favorites", icon: Star },
  { href: "/files/shared", label: "Shared", icon: Share2 },
  { href: "/trash", label: "Deleted files", icon: Trash2 },
  { href: "/files/tags", label: "Tags", icon: Tag },
  { href: "/photos", label: "Photos", icon: Image },
  { href: "/activity", label: "Activity", icon: Activity },
];

const settingsNavItems: NavItem[] = [
  { href: "/settings/profile", label: "Settings", icon: Settings },
  { href: "/admin", label: "Administration", icon: Shield, adminOnly: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, setSidebarCollapsed } = useUIStore();
  const { data: session } = useSession();
  const isAdmin = (session as Record<string, unknown> | null)?.isAdmin as boolean | undefined;

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "flex flex-col h-full bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out",
          sidebarCollapsed ? "w-16" : "w-60"
        )}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-sidebar-border shrink-0">
          {!sidebarCollapsed && (
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-white/20 flex items-center justify-center text-white font-bold text-sm">
                K
              </div>
              <span className="font-semibold text-white text-sm truncate">
                Karsaaz Cloud
              </span>
            </Link>
          )}
          {sidebarCollapsed && (
            <Link href="/dashboard" className="mx-auto">
              <div className="w-8 h-8 rounded-md bg-white/20 flex items-center justify-center text-white font-bold text-sm">
                K
              </div>
            </Link>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {mainNavItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              isActive={
                item.href === "/files"
                  ? pathname === "/files" || pathname.startsWith("/files/[[")
                  : pathname === item.href || pathname.startsWith(item.href + "/")
              }
              collapsed={sidebarCollapsed}
            />
          ))}

          <Separator className="my-3 bg-sidebar-border" />

          {settingsNavItems.map((item) => {
            if (item.adminOnly && !isAdmin) return null;
            return (
              <NavLink
                key={item.href}
                item={item}
                isActive={pathname.startsWith(item.href)}
                collapsed={sidebarCollapsed}
              />
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="p-2 border-t border-sidebar-border">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center h-8 rounded-md text-sidebar-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>
      </aside>
    </TooltipProvider>
  );
}

function NavLink({
  item,
  isActive,
  collapsed,
}: {
  item: NavItem;
  isActive: boolean;
  collapsed: boolean;
}) {
  const Icon = item.icon;

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={item.href}
            className={cn(
              "flex items-center justify-center h-9 w-full rounded-md transition-colors",
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <Icon className="h-5 w-5" />
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 h-9 px-3 rounded-md text-sm transition-colors",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
          : "text-sidebar-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}
