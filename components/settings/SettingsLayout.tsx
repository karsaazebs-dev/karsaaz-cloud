"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { User, Shield, Bell, HardDrive, Palette, CalendarClock, Smartphone, Share2, FolderInput, Workflow, Lock } from "lucide-react";

const NAV = [
  { href: "/settings/profile", label: "Personal info", icon: User },
  { href: "/settings/security", label: "Security", icon: Shield },
  { href: "/settings/notifications", label: "Notifications", icon: Bell },
  { href: "/settings/external-storage", label: "External storage", icon: FolderInput },
  { href: "/settings/sync-clients", label: "Mobile & desktop", icon: Smartphone },
  { href: "/settings/sharing", label: "Sharing", icon: Share2 },
  { href: "/settings/appearance", label: "Appearance and accessibility", icon: Palette },
  { href: "/settings/availability", label: "Availability", icon: CalendarClock },
  { href: "/settings/flow", label: "Flow", icon: Workflow },
  { href: "/settings/privacy", label: "Privacy", icon: Lock },
  { href: "/settings/storage", label: "Storage", icon: HardDrive },
];

export function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-full">
      {/* Sidebar nav */}
      <aside className="w-52 shrink-0 border-r p-4 space-y-1">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 pb-2">
          Settings
        </h2>
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
              pathname === href
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </aside>

      {/* Page content */}
      <main className="flex-1 p-6 max-w-2xl">{children}</main>
    </div>
  );
}
