"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href: string;
}

function buildBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: BreadcrumbItem[] = [];
  let accumulated = "";

  const labelMap: Record<string, string> = {
    dashboard: "Dashboard",
    files: "Files",
    recent: "Recent",
    favorites: "Favorites",
    shared: "Shared",
    deleted: "Deleted files",
    tags: "Tags",
    photos: "Photos",
    albums: "Albums",
    activity: "Activity",
    settings: "Settings",
    profile: "Profile",
    security: "Security",
    notifications: "Notifications",
    privacy: "Privacy",
    storage: "Storage",
    admin: "Administration",
    users: "Users",
    groups: "Groups",
    apps: "Apps",
    "server-info": "Server info",
    logging: "Logging",
  };

  for (const segment of segments) {
    accumulated += `/${segment}`;
    crumbs.push({
      label: labelMap[segment] ?? decodeURIComponent(segment),
      href: accumulated,
    });
  }

  return crumbs;
}

interface BreadcrumbsProps {
  className?: string;
  /** Override automatic path detection */
  items?: BreadcrumbItem[];
}

export function Breadcrumbs({ className, items }: BreadcrumbsProps) {
  const pathname = usePathname();
  const crumbs = items ?? buildBreadcrumbs(pathname);

  if (crumbs.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center text-sm", className)}>
      <ol className="flex items-center gap-1">
        <li>
          <Link
            href="/dashboard"
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Home"
          >
            <Home className="h-4 w-4" />
          </Link>
        </li>
        {crumbs.map((crumb, i) => (
          <li key={crumb.href} className="flex items-center gap-1">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            {i === crumbs.length - 1 ? (
              <span className="font-medium text-foreground" aria-current="page">
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
