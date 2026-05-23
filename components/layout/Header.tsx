"use client";

import { signOut, useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings, LogOut, User, Menu, Search, Smile, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useUIStore } from "@/lib/stores/ui.store";
import Link from "next/link";
import { useState } from "react";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { SearchModal, useSearchModal } from "@/components/layout/SearchModal";
import { UserStatusDialog } from "@/components/layout/UserStatusDialog";
import { useUserStatus, STATUS_META } from "@/lib/hooks/useUserStatus";
import { cn } from "@/lib/utils";

export function Header() {
  const { data: session } = useSession();
  const { toggleSidebar, sidebarOpen, sidebarCollapsed, setSidebarCollapsed } = useUIStore();
  const { open: searchOpen, setOpen: setSearchOpen, onClose: closeSearch } = useSearchModal();
  const [statusOpen, setStatusOpen] = useState(false);
  const { data: userStatus } = useUserStatus();

  const username = (session as Record<string, unknown> | null)?.username as string | undefined;
  const displayName = session?.user?.name ?? username ?? "User";
  const email = session?.user?.email ?? "";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const avatarUrl = username
    ? `/api/proxy/index.php/avatar/${encodeURIComponent(username)}/32`
    : undefined;

  const isAdmin = (session as Record<string, unknown> | null)?.isAdmin as boolean | undefined;
  const roleText = isAdmin ? "super admin" : "user";

  const statusDot = userStatus
    ? STATUS_META[userStatus.status]?.dotClass
    : undefined;

  return (
    <>
      <SearchModal open={searchOpen} onClose={closeSearch} />
      <UserStatusDialog open={statusOpen} onOpenChange={setStatusOpen} />
      <header className="relative flex items-center justify-between h-16 px-4 border-b border-slate-100 bg-white shrink-0 gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Desktop collapse toggle */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden md:flex items-center justify-center w-6 h-10 bg-[#A855F7] text-white rounded-l-lg hover:bg-[#9333EA] transition-all -ml-4 shadow-sm"
            aria-label="Collapse sidebar"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>

          {/* Mobile menu toggle */}
          <button
            onClick={toggleSidebar}
            className="flex md:hidden items-center justify-center w-8 h-8 bg-[#A855F7] text-white rounded-lg hover:bg-[#9333EA] transition-all mr-2 shadow-sm"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-4.5 w-4.5" />
          </button>

          {/* Search trigger */}
          <div className="flex-1 max-w-[320px] min-w-[100px]">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                <Search className="h-4 w-4 text-[#A855F7]" />
              </span>
              <input
                type="text"
                onClick={() => setSearchOpen(true)}
                readOnly
                placeholder="Search"
                className="w-full pl-9 pr-4 h-10 rounded-full border border-slate-200/60 bg-[#F8FAFC] text-sm text-slate-500 placeholder-slate-400 focus:outline-none cursor-pointer hover:bg-slate-100/50 transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 ml-auto">
          {/* Notifications */}
          <NotificationBell />

          {/* Base Currency Pill */}
          <button className="hidden sm:flex h-10 px-4 rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm items-center justify-center">
            Base currency
          </button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-3 rounded-xl p-1 hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A855F7]"
                aria-label="User menu"
              >
                <div className="relative shrink-0">
                  <Avatar className="h-10 w-10 rounded-[10px]">
                    <AvatarImage src={avatarUrl} alt={displayName} className="rounded-[10px]" />
                    <AvatarFallback className="bg-gradient-to-tr from-[#4E78FF] to-[#9844FF] text-white text-sm font-bold rounded-[10px]">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  {statusDot && (
                    <span
                      className={cn(
                        "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-white",
                        statusDot
                      )}
                      aria-hidden
                    />
                  )}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-sm font-bold text-slate-800 leading-tight">
                    {displayName}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5">
                    {roleText}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400 ml-0.5 shrink-0" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{displayName}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer"
                onSelect={(e) => {
                  e.preventDefault();
                  setStatusOpen(true);
                }}
              >
                <Smile className="mr-2 h-4 w-4" />
                {userStatus?.message ? (
                  <span className="truncate">
                    {userStatus.icon} {userStatus.message}
                  </span>
                ) : (
                  "Set status"
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings/profile" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings/security" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive cursor-pointer"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </>
  );
}
