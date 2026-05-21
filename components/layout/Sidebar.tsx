"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/stores/ui.store";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import {
  FolderOpen,
  Share2,
  Tag,
  FolderInput,
  Trash2,
  Activity,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  ChevronDown,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useState, useMemo } from "react";
import { useFiles } from "@/lib/hooks/useFiles";
import { buildFilePath } from "@/lib/utils/files";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

const settingsNavItems: NavItem[] = [
  { href: "/settings/profile", label: "Settings", icon: Settings },
  { href: "/admin", label: "Administration", icon: Shield, adminOnly: true },
];

const collapsedNavItems = [
  { href: "/files", label: "Files", icon: FolderOpen },
  { href: "/files/shared", label: "Shares", icon: Share2 },
  { href: "/files/tags", label: "Tags", icon: Tag },
  { href: "/settings/external-storage", label: "External Storage", icon: FolderInput },
  { href: "/trash", label: "Deleted files", icon: Trash2 },
  { href: "/activity", label: "Activity", icon: Activity },
];

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { sidebarCollapsed, setSidebarCollapsed } = useUIStore();
  const { data: session } = useSession();
  
  const username = (session as Record<string, unknown> | null)?.username as string | undefined;
  const isAdmin = (session as Record<string, unknown> | null)?.isAdmin as boolean | undefined;

  // Initialize expanded state based on current route
  const [expandedSections, setExpandedSections] = useState({
    files: true,
    shares: true,
    folders: true,
    activity: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Dynamic root folders for All Folders
  const rootDavPath = username ? buildFilePath(username, "/") : "";
  const { data: files } = useFiles(rootDavPath);
  const folders = useMemo(() => {
    if (!files) return [];
    return files.filter((f) => f.type === "directory");
  }, [files]);

  const isSubItemActive = (href: string) => {
    if (href === "/files") {
      return pathname === "/files" && (!searchParams.get("path") || searchParams.get("path") === "/");
    }
    if (href.startsWith("/files?path=")) {
      const targetPath = decodeURIComponent(href.split("path=")[1]);
      return pathname === "/files" && searchParams.get("path") === targetPath;
    }
    if (href.includes("?filter=")) {
      const targetFilter = href.split("filter=")[1];
      const currentFilter = searchParams.get("filter") || "all";
      return pathname === "/activity" && currentFilter === targetFilter;
    }
    return pathname === href;
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "flex flex-col h-full bg-white border-r border-slate-200/60 text-slate-800 transition-all duration-300 ease-in-out shrink-0",
          sidebarCollapsed ? "w-16" : "w-60"
        )}
      >
        {/* Logo / Header Card */}
        <div className="p-3 border-b border-slate-100 shrink-0">
          {!sidebarCollapsed ? (
            <Link
              href="/dashboard"
              className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-[#4E78FF] to-[#9844FF] text-white shadow-md hover:opacity-95 transition-all group relative overflow-hidden"
            >
              {/* Subtle glassmorphism light effect */}
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                  <Settings className="h-4.5 w-4.5 text-white" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold text-xs leading-tight text-white truncate">
                    Files & Collaboration
                  </span>
                  <span className="text-[10px] text-white/70 leading-tight truncate">
                    Store, share & collaborate
                  </span>
                </div>
              </div>
              <div className="w-2 h-2 rounded-full bg-white ml-2 shrink-0 shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
            </Link>
          ) : (
            <Link
              href="/dashboard"
              className="flex items-center justify-center w-10 h-10 mx-auto rounded-xl bg-gradient-to-r from-[#4E78FF] to-[#9844FF] text-white shadow-md hover:opacity-95 transition-all group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Settings className="h-5 w-5 text-white" />
            </Link>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-3">
          {!sidebarCollapsed ? (
            <>
              {/* Files Section */}
              <div className="space-y-1">
                <button
                  onClick={() => toggleSection("files")}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 rounded-md transition-colors text-left"
                >
                  <span>Files</span>
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 text-slate-400 transition-transform duration-200",
                      expandedSections.files ? "transform rotate-0" : "transform -rotate-90"
                    )}
                  />
                </button>
                {expandedSections.files && (
                  <div className="space-y-0.5">
                    <SubLink href="/files" label="All Files" active={isSubItemActive("/files")} />
                    <SubLink href="/files/personal" label="Personal Files" active={isSubItemActive("/files/personal")} />
                    <SubLink href="/files/recent" label="Recent Files" active={isSubItemActive("/files/recent")} />
                  </div>
                )}
              </div>

              {/* Shares Section */}
              <div className="space-y-1">
                <button
                  onClick={() => toggleSection("shares")}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 rounded-md transition-colors text-left"
                >
                  <span>Shares</span>
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 text-slate-400 transition-transform duration-200",
                      expandedSections.shares ? "transform rotate-0" : "transform -rotate-90"
                    )}
                  />
                </button>
                {expandedSections.shares && (
                  <div className="space-y-0.5">
                    <SubLink href="/files/shared" label="Shared With You" active={isSubItemActive("/files/shared")} />
                    <SubLink href="/files/shared/others" label="Shared with others" active={isSubItemActive("/files/shared/others")} />
                    <SubLink href="/files/shared/links" label="Shared by link" active={isSubItemActive("/files/shared/links")} />
                    <SubLink href="/files/shared/requests" label="File requests" active={isSubItemActive("/files/shared/requests")} />
                    <SubLink href="/files/shared/deleted" label="Deleted shares" active={isSubItemActive("/files/shared/deleted")} />
                    <SubLink href="/files/shared/pending" label="Pending shares" active={isSubItemActive("/files/shared/pending")} />
                  </div>
                )}
              </div>

              {/* Standalone Tags Link */}
              <div>
                <Link
                  href="/files/tags"
                  className={cn(
                    "flex items-center px-3 py-1.5 text-sm font-semibold rounded-md transition-colors",
                    pathname === "/files/tags"
                      ? "text-indigo-600 bg-indigo-50/50"
                      : "text-slate-800 hover:bg-slate-50"
                  )}
                >
                  Tags
                </Link>
              </div>

              {/* Standalone External Storage Link */}
              <div>
                <Link
                  href="/settings/external-storage"
                  className={cn(
                    "flex items-center px-3 py-1.5 text-sm font-semibold rounded-md transition-colors",
                    pathname === "/settings/external-storage"
                      ? "text-indigo-600 bg-indigo-50/50"
                      : "text-slate-800 hover:bg-slate-50"
                  )}
                >
                  External Storage
                </Link>
              </div>

              {/* All Folders Section */}
              <div className="space-y-1">
                <button
                  onClick={() => toggleSection("folders")}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 rounded-md transition-colors text-left"
                >
                  <span>All Folders</span>
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 text-slate-400 transition-transform duration-200",
                      expandedSections.folders ? "transform rotate-0" : "transform -rotate-90"
                    )}
                  />
                </button>
                {expandedSections.folders && (
                  <div className="space-y-0.5 max-h-48 overflow-y-auto">
                    {folders.length === 0 ? (
                      <span className="block pl-6 py-1 text-[13px] text-slate-400 italic">No folders found</span>
                    ) : (
                      folders.map((folder) => {
                        const targetHref = `/files?path=${encodeURIComponent("/" + folder.name)}`;
                        return (
                          <SubLink
                            key={folder.id}
                            href={targetHref}
                            label={folder.name}
                            active={isSubItemActive(targetHref)}
                          />
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Standalone Deleted Files Link */}
              <div>
                <Link
                  href="/trash"
                  className={cn(
                    "flex items-center px-3 py-1.5 text-sm font-semibold rounded-md transition-colors",
                    pathname === "/trash"
                      ? "text-indigo-600 bg-indigo-50/50"
                      : "text-slate-800 hover:bg-slate-50"
                  )}
                >
                  Deleted Files
                </Link>
              </div>

              {/* Activity Logs Section */}
              <div className="space-y-1">
                <button
                  onClick={() => toggleSection("activity")}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 rounded-md transition-colors text-left"
                >
                  <span>Activity Logs</span>
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 text-slate-400 transition-transform duration-200",
                      expandedSections.activity ? "transform rotate-0" : "transform -rotate-90"
                    )}
                  />
                </button>
                {expandedSections.activity && (
                  <div className="space-y-0.5">
                    <SubLink href="/activity?filter=by-you" label="By You" active={isSubItemActive("/activity?filter=by-you")} />
                    <SubLink href="/activity?filter=by-others" label="By Others" active={isSubItemActive("/activity?filter=by-others")} />
                    <SubLink href="/activity?filter=all" label="All Activities" active={isSubItemActive("/activity?filter=all")} />
                    <SubLink href="/activity?filter=shares" label="File Shares" active={isSubItemActive("/activity?filter=shares")} />
                    <SubLink href="/activity?filter=teams" label="Teams" active={isSubItemActive("/activity?filter=teams")} />
                  </div>
                )}
              </div>
            </>
          ) : (
            collapsedNavItems.map((item) => (
              <CollapsedLink
                key={item.href}
                item={item}
                isActive={pathname.startsWith(item.href)}
              />
            ))
          )}

          <Separator className="my-3 bg-slate-100" />

          {/* Settings / Administration */}
          {settingsNavItems.map((item) => {
            if (item.adminOnly && !isAdmin) return null;
            if (sidebarCollapsed) {
              return (
                <CollapsedLink
                  key={item.href}
                  item={item}
                  isActive={pathname.startsWith(item.href)}
                />
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-1.5 text-sm font-semibold rounded-md transition-colors",
                  pathname.startsWith(item.href)
                    ? "text-indigo-600 bg-indigo-50/50"
                    : "text-slate-800 hover:bg-slate-50"
                )}
              >
                <item.icon className="h-4.5 w-4.5 text-slate-500 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="p-2 border-t border-slate-100">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center h-8 rounded-md text-slate-400 hover:bg-slate-50 hover:text-slate-800 transition-colors"
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

function SubLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-1.5 pl-6 pr-3 py-1 text-[13.5px] transition-colors leading-normal",
        active ? "text-indigo-600 font-semibold" : "text-slate-600 hover:text-slate-900"
      )}
    >
      <span className="text-slate-400 shrink-0 select-none">-</span>
      <span className={cn(active && "underline decoration-2 underline-offset-4 decoration-indigo-600")}>
        {label}
      </span>
    </Link>
  );
}

function CollapsedLink({
  item,
  isActive,
}: {
  item: { href: string; label: string; icon: React.ElementType };
  isActive: boolean;
}) {
  const Icon = item.icon;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={item.href}
          className={cn(
            "flex items-center justify-center h-9 w-full rounded-md transition-colors",
            isActive
              ? "bg-slate-100 text-indigo-600 font-semibold"
              : "text-slate-400 hover:bg-slate-50 hover:text-slate-800"
          )}
        >
          <Icon className="h-5 w-5" />
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  );
}
